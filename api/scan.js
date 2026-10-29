/**
 * Vercel Serverless Function: POST /api/scan
 *
 * Takes raw T&Cs text and is meant to run the single LLM call described in
 * brainstorm-intent.md (extraction + severity classification + plain-English
 * explanation + suggested actions). The actual LLM call is not wired up yet —
 * this is a placeholder so the frontend can be built and demoed end-to-end
 * before the prompt/schema is finalized (see Open Decisions in the intent doc).
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { text } = req.body ?? {};
  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "Missing 'text' in request body" });
    return;
  }

  // TODO: replace with a real call to an LLM API using `text` as input.
  res.status(200).json(placeholderResult());
}

function placeholderResult() {
  return {
    verdict: "Placeholder result — LLM integration not yet implemented.",
    clauses: [
      {
        severity: "critical",
        quote: "We may sell or share your personal data with third parties.",
        explanation:
          "Your personal information could be sold to advertisers or data brokers.",
        action: "Consider using a burner email address when signing up.",
      },
      {
        severity: "caution",
        quote: "This subscription renews automatically unless cancelled.",
        explanation:
          "You'll keep being charged unless you remember to cancel in time.",
        action: "Set a calendar reminder before the renewal date.",
      },
      {
        severity: "standard",
        quote: "These terms are governed by the laws of England and Wales.",
        explanation: "A standard legal/jurisdiction clause, no action needed.",
        action: null,
      },
    ],
  };
}
