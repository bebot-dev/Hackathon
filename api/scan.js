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
    const clauses = await runAnalysisCall(text);
    res.status(200).json({ clauses });
  } catch (err) {
    console.error("Analysis Call failed:", err);
    res.status(502).json({ error: "Analysis failed. Please try again." });
  }
}

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
      max_tokens: 4096,
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

  return parseClauses(rawText);
}

function parseClauses(rawText) {
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Could not find a JSON array in the model response");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed)) {
    throw new Error("Model response JSON was not an array");
  }

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
