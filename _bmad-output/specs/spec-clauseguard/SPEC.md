---
id: SPEC-clauseguard
companions: [glossary.md, visual-design.md]
sources: [../../../prd.md, ../../brainstorming/brainstorm-5hr-everyday-life-hackathon-tool-2026-10-28/brainstorm-intent.md]
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# ClauseGuard

## Why

Nobody reads Terms & Conditions before agreeing to them — they're long, dense, and written to be skimmed past, while the clauses that actually matter (data selling, auto-renewal traps, liability waivers) get buried. A time-poor consumer about to click "Agree" has one real question — *is there anything in here that should change my mind?* — and no good way to answer it in the time they're willing to spend. This spec defines a 5-hour hackathon build that answers that question directly: paste T&Cs text, get a ranked risk map and a proceed/caution/reconsider verdict from a single LLM call, with no setup and no account.

## Capabilities

- **CAP-1**
  - **intent:** User can paste raw T&Cs/ToS text into a single text box and submit it for analysis.
  - **success:** Submitting non-empty pasted text triggers exactly one Analysis Call with the full pasted text; submitting empty text is blocked client-side before any call is made.

- **CAP-2**
  - **intent:** System runs one Analysis Call (a single LLM API call) that extracts every notable clause from the submitted text and, per clause, classifies its Severity Tier, explains its real-world consequence in plain English, and suggests a mitigating action where one exists.
  - **success:** Exactly one LLM API call per submission returns a structured array of clauses, each with `clause_text` (verbatim substring of the input), `severity` (`critical` | `caution` | `standard`), `consequence` (plain-English), and `suggested_action` (string or null).

- **CAP-3**
  - **intent:** System computes a single Overall Verdict (Proceed / Proceed with Caution / Reconsider) from the full set of returned clauses.
  - **success:** 2+ Critical clauses → Reconsider. Exactly 1 Critical, or 0 Critical with 2+ Caution → Proceed with Caution. 0 Critical and 0-1 Caution → Proceed. Verdict is computed client-side from the Analysis Call's clause array, not returned by the LLM itself.

- **CAP-4**
  - **intent:** User sees the Overall Verdict prominently above a list of all flagged clauses, grouped into Critical / Caution / Standard sections (Critical first), each rendered as a card with its quoted text, plain-English consequence, severity badge, and suggested action if present.
  - **success:** Verdict is visually distinct from per-clause severity badges (see `visual-design.md`). Clause order on the page is always Critical, then Caution, then Standard. A clause with no suggested action renders without an empty/placeholder action field.

## Constraints

- No backend: the static page calls the LLM API directly from client-side JavaScript. The API key is hardcoded/embedded in client code — acceptable only because this is a throwaway, non-public demo deployment, never a pattern to carry forward. This supersedes the previously scaffolded `api/scan.js` Vercel serverless proxy; the build removes or bypasses it.
- No authentication, no database, no persistence of submitted text or results across sessions or page reloads.
- Input is paste-text only — no URL fetch, no file upload.
- Blocking check on submission is "non-empty text only" — no minimum length/character threshold.
- Exactly one LLM call per submission; no multi-call pipeline, no separate NLP step.
- Pasted text is trusted as T&Cs content — no detection of whether it's genuinely T&Cs; garbage-in is not validated beyond the non-empty check.
- Architecture must not block a later v2 that adds URL-based T&Cs retrieval or automatic execution of suggested opt-out actions — don't build either now.

## Non-goals

- Not legal advice — output is informational, not a substitute for legal review.
- No live checkout/point-of-purchase interception or browser extension in v1 — user pastes text ahead of time.
- No user accounts, saved history, or multi-document comparison.
- No truncation or warning behavior for very long pasted documents — left to whatever the LLM provider's context limit naturally allows.
- Production-grade API key security is explicitly out of scope — see Constraints.

## Success signal

Live demo: a real (not mocked) T&Cs document, pasted during a 5-minute demo slot, produces a correctly structured, visually legible result (verdict + severity-grouped clause cards) using a real LLM call. A viewer can state the proceed/caution/reconsider decision and name the one or two driving reasons without having read the source document themselves. Do not optimize for flagging more clauses to look thorough — over-flagging routine Standard terms as Caution undermines the product's core value.

## Assumptions

- No minimum paste-length threshold; only true emptiness is blocked (resolves PRD open question 1 — user chose speed over filtering partial pastes).
- Caution-only verdict threshold is 2+ Caution clauses with 0 Critical (resolves PRD open question 2, confirming the PRD's inferred rule).
- Analysis Call JSON response shape is an array of `{clause_text, severity, consequence, suggested_action}` objects, with no separate verdict field from the LLM (resolves PRD open question 3).
- Visual design reuses the dark theme and severity color palette from the (now-removed) `clauseguard-pitch.html` brainstorming artifact rather than being designed fresh — see `visual-design.md` (resolves PRD open question 4).
- The committed `api/scan.js` Vercel function scaffold is superseded by the no-backend, direct-client-call architecture confirmed for this spec and will need removal or bypass during build.

## Open Questions

- Which LLM provider/model and exact prompt text will perform the Analysis Call — not yet designed, needed before implementation.
- Where exactly the hardcoded demo API key is stored in client code, and which provider's key format that implies.
