# Brainstorm Intent: ClauseGuard (T&Cs Severity Checker)

## Problem
Nobody reads Terms & Conditions / Terms of Service because they're long, dense, and written to be skimmed past. Buried inside are clauses that genuinely matter — data selling, forced arbitration, auto-renewal traps, liability waivers — and people agree to them blind. Worth building because the fix doesn't require new data or infrastructure, just making an LLM do the reading and ranking a human won't.

As a consequence, consumers get tied into terms they are not aware of, impacting their privacy, exposing them to spam, and causing financial harm.

## Chosen Idea
**ClauseGuard** (working name): paste raw T&Cs/ToS text in, get back the clauses that actually matter, flagged by severity, in plain English.

The tool is intended to be used to advise a user before committing to a purchase or sign-up. In v1 this means pasting the T&Cs text manually ahead of time, not a live checkout integration (see Scope Boundaries). It gives an overall go/no-go recommendation plus options to mitigate any negative impact of the terms — e.g. sign up with a burner email address, take these steps to opt out of auto-renewal.

## Core User Flow
1. User pastes raw T&Cs text into a text box.
2. One LLM API call extracts notable clauses, classifies each by severity and explains the real life consequence to the user and suggests follow up actions if possible.
3. UI renders the flagged clauses grouped and sorted by severity (Critical first), explains the real world consequences in a way that can be understood by the average person with no legal training. 

## Severity Taxonomy
- **Critical** — e.g. data selling, auto-renewal traps, liability waivers, unreasonable costs.
- **Caution** — e.g. broad data collection, vague cancellation terms.
- **Standard** — normal/expected terms, included for completeness/context.

## Output Structure
- **Overall recommendation**: an at-a-glance go/no-go verdict for the purchase/sign-up, derived from the worst severity present
- **Per flagged clause**:
  - Quoted clause text (verbatim from the pasted document)
  - Plain-English explanation of the real-world consequence
  - Severity badge (Critical / Caution / Standard)
  - Suggested action steps where possible (e.g. opt out, use a burner email)
- All clauses grouped and sorted by severity tier, Critical first

## Scope Boundaries (5-hour beginner build)
- Input: paste-text only for v1. URL-fetch is a stretch goal, explicitly deferred (avoids CORS/scraping complexity).
- No backend, no auth, no database.
- Single static HTML/JS page.
- One LLM API call handles extraction, severity classification, plain-English/consequence explanation, and suggested actions together — no custom NLP logic, no separate calls per step.
- Architect v1 so v2 can add automatic T&Cs retrieval and, where possible, taking the suggested opt-out actions on the user's behalf — don't build these now, but avoid choices that would block them later.

## Why This Idea
Turns an unreadable wall of legal text into a ranked, scannable risk map with a clear go/no-go call in seconds — the severity-categorized output plus concrete mitigation steps is what elevates it from "summarizer" to a genuine pre-purchase advisor. The live demo moment — paste real T&Cs, watch it light up with flagged clauses and actionable advice in real time — is immediate, visual, and needs no setup or explanation to land with an audience.

## Open Decisions for the Builder
- Exact clause examples per severity tier (listed above) are illustrative from the brainstorm, not exhaustive — may want refinement/expansion.
- LLM prompt design and output schema (e.g. JSON shape for clause/severity/explanation/action) still to be designed.
- Visual design of the severity-grouped UI (badges, layout, color coding) not yet specified beyond "visually clean, simple."
- Overall go/no-go verdict logic (e.g. "any Critical clause = recommend against") not yet defined.
