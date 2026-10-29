/**
 * Vercel Serverless Function: POST /api/scan
 *
 * Runs the single Analysis Call (SPEC.md CAP-2): sends the full pasted T&Cs
 * text to an Anthropic-compatible Messages API and returns a structured list
 * of flagged clauses. Proxied server-side so the API key never reaches the
 * client (see .memlog.md: public-repo key exposure risk).
 */
const ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-latest";
const ANTHROPIC_AUTH_TOKEN = process.env.ANTHROPIC_AUTH_TOKEN;

const SYSTEM_PROMPT = `You are ClauseGuard, a Terms & Conditions risk scanner. Given raw T&Cs/ToS text, extract every clause notable enough to flag — do not flag routine, expected boilerplate just to pad the list.

For each flagged clause, classify its severity:
- "critical": data selling, auto-renewal traps, liability waivers, unreasonable costs, forced arbitration, and similarly severe terms.
- "caution": broad data collection, vague cancellation terms, and similarly moderate terms.
- "standard": normal/expected terms worth surfacing for completeness, not alarming on their own.

Respond with ONLY a JSON array (no prose, no markdown fences). Each element:
{
  "clause_text": "<verbatim substring of the input text>",
  "severity": "critical" | "caution" | "standard",
  "consequence": "<plain-English explanation of the real-world consequence, no legal jargon>",
  "suggested_action": "<concrete mitigation step, or null if none applies>"
}

clause_text must be an exact verbatim substring of the input. Do not invent clauses that are not in the text.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { text } = req.body ?? {};
  if (!text || typeof text !== "string" || !text.trim()) {
    res.status(400).json({ error: "Missing 'text' in request body" });
    return;
  }

  if (!ANTHROPIC_AUTH_TOKEN) {
    res.status(500).json({ error: "Server is not configured with an API key" });
    return;
  }

  try {
    const { clauses, truncated } = await runAnalysisCall(text);
    res.status(200).json({ clauses, truncated });
  } catch (err) {
    console.error("Analysis Call failed:", err);
    res.status(502).json({ error: "Analysis failed. Please try again." });
  }
}

// Clause count scales with how many notable clauses the document contains,
// not just its length — a long but repetitive document needs little more
// output than a short, dense one. 16000 comfortably covers real-world T&Cs
// (tested against a 38-clause dense document that truncated at 4096).
const MAX_OUTPUT_TOKENS = 16000;

async function runAnalysisCall(text) {
  const response = await fetch(`${ANTHROPIC_BASE_URL}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_AUTH_TOKEN,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Upstream error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const rawText = (data.content ?? [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  const hitTokenLimit = data.stop_reason === "max_tokens";
  const clauses = parseClauses(rawText);

  return { clauses, truncated: hitTokenLimit };
}

function parseClauses(rawText) {
  const startIdx = rawText.indexOf("[");
  if (startIdx === -1) {
    throw new Error("Could not find a JSON array in the model response");
  }
  const fromArrayStart = rawText.slice(startIdx);

  // Fast path: a complete, well-formed array.
  const closeIdx = fromArrayStart.lastIndexOf("]");
  if (closeIdx !== -1) {
    try {
      const parsed = JSON.parse(fromArrayStart.slice(0, closeIdx + 1));
      if (Array.isArray(parsed)) return normalizeClauses(parsed);
    } catch {
      // Fall through — treat as truncated and try to salvage below.
    }
  }

  // Slow path: the response was cut off mid-array (hit the token limit, or
  // an odd closing bracket showed up inside a quoted value above). Salvage
  // every clause object that completed before the cutoff rather than
  // discarding the whole result.
  const salvaged = salvageClauseObjects(fromArrayStart);
  if (salvaged.length > 0) return normalizeClauses(salvaged);

  throw new Error("Could not parse any clauses from the model response");
}

/** Scans for complete top-level `{...}` objects, string-aware so braces inside quoted values don't throw off bracket depth. Drops any trailing object left incomplete by truncation. */
function salvageClauseObjects(text) {
  const objects = [];
  let depth = 0;
  let objStart = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      if (depth === 0) objStart = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && objStart !== -1) {
        try {
          objects.push(JSON.parse(text.slice(objStart, i + 1)));
        } catch {
          // Malformed fragment — skip it, keep the rest.
        }
        objStart = -1;
      }
    }
  }

  return objects;
}

function normalizeClauses(parsed) {
  const validSeverities = new Set(["critical", "caution", "standard"]);
  return parsed
    .filter((c) => c && typeof c.clause_text === "string" && validSeverities.has(c.severity))
    .map((c) => ({
      clause_text: c.clause_text,
      severity: c.severity,
      consequence: typeof c.consequence === "string" ? c.consequence : "",
      suggested_action: typeof c.suggested_action === "string" ? c.suggested_action : null,
    }));
}
