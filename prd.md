---
title: ClauseGuard
status: draft
created: 2026-10-29
updated: 2026-10-29
---

# PRD: ClauseGuard
*Working title — confirm.*

## 0. Document Purpose

This PRD defines the v1 build of ClauseGuard for a 5-hour hackathon build, intended for the builder(s) and anyone judging or picking up the work afterward. It builds on two existing inputs rather than duplicating them: `brainstorm-intent 1.md` (problem framing, core flow, severity taxonomy, scope boundaries) and a persona research doc for Maya, "The Time-Poor Digital Consumer" (JTBD, pain points, FTC-evidence-backed validation). Terms are Glossary-anchored (§3); requirements are grouped by feature with globally numbered FRs (§4); inferences are tagged inline as `[ASSUMPTION]` and indexed in §9.

## 1. Vision

Nobody reads Terms & Conditions. They're long, dense, and written to be skimmed past — and buried inside are clauses that genuinely matter: data selling, auto-renewal traps, liability waivers. People agree to them blind, and the cost shows up later as privacy exposure, spam, or financial harm they never consciously accepted.

ClauseGuard turns that unreadable wall of legal text into a ranked, scannable risk map. A user pastes raw T&Cs text in; one LLM call extracts the clauses that actually matter, classifies each by severity, explains the real-world consequence in plain English, and suggests mitigating action where possible. The output leads with an overall recommendation — proceed, proceed with caution, or reconsider — so the user doesn't have to read the whole document to get the gist of the decision in front of them.

The product doesn't aim to replace legal review or guarantee completeness. It aims to answer the one question a time-poor consumer actually has at the point of clicking "Agree": *is there anything in here that should change my mind?*

## 2. Target User

### 2.1 Jobs To Be Done

Drawn from the Maya persona research (`persona.docx`):
- Make purchases and sign-ups quickly, without the contract becoming a separate research task.
- Avoid an unpleasant financial or privacy surprise later (auto-renewal, hard-to-cancel subscriptions, broader data use than expected, unexpected costs or obligations).
- Understand the few terms that materially affect her — not every clause.
- Calibrate whether something that sounds alarming is actually unusual, or just standard boilerplate.
- Feel confident enough to click "Agree" without spending 20 minutes interpreting legal language.
- Maintain control and inspect the evidence herself, rather than blindly trusting an unexplained summary.

### 2.2 Key User Journeys

- **UJ-1. Maya decides whether to trust a subscription service before handing over her card.**
  - **Persona + context:** Maya, 36, a time-poor UK professional who is digitally confident but has zero appetite for reading legal text. She's about to start a paid free trial for a service she's not familiar with — exactly the kind of higher-perceived-risk moment (payment details, auto-renewal, unfamiliar provider) that makes her want a second opinion before agreeing.
  - **Entry state:** No account, no login. She's on the ClauseGuard web page with the service's T&Cs already copied to her clipboard from another tab.
  - **Path:** She pastes the T&Cs text into the box and submits. The one LLM call runs. The page returns clauses grouped Critical → Caution → Standard, each with the quoted clause, a plain-English consequence, and (where applicable) a suggested action.
  - **Climax:** At the top of the results, she sees the overall verdict — e.g. "Proceed with Caution" — driven by one flagged auto-renewal clause. She reads that one card: what it means, and the suggested action ("set a calendar reminder before renewal" or "opt out via [mechanism] if offered").
  - **Resolution:** She signs up anyway, but now knows exactly which date to cancel by — the surprise is defused before it happens, not after. Realizes the persona's stated success condition: *she makes a more informed proceed / proceed-with-caution / reconsider decision without deciphering the whole agreement herself.*
  - **Edge case:** If she pastes an empty or trivially short block of text, the page blocks submission with a message asking her to paste the full T&Cs text, rather than sending a near-empty request to the LLM.

## 3. Glossary

- **Clause** — A single extracted passage from the pasted T&Cs text that ClauseGuard has identified as notable enough to flag. Always shown verbatim (quoted) alongside its analysis.
- **Severity Tier** — One of three classifications applied to a flagged Clause: **Critical**, **Caution**, or **Standard** (§ taxonomy below). Determines both display order and contribution to the Overall Verdict.
- **Overall Verdict** — The single go/no-go-style recommendation shown at the top of the results, derived from the count and mix of Severity Tiers across all flagged Clauses. One of: **Proceed**, **Proceed with Caution**, **Reconsider**.
- **Suggested Action** — An optional, concrete mitigation step attached to a Clause (e.g. "use a burner email address," "set a cancellation reminder for [date logic]").
- **Analysis Call** — The single LLM API call that performs extraction, Severity Tier classification, plain-English consequence explanation, and Suggested Action generation together, for one pasted document.

## 4. Features

### 4.1 T&Cs Input

**Description:** A single text box where the user pastes raw T&Cs/ToS text and submits it for analysis. This is the only input mechanism in v1 — no URL fetch, no file upload. Realizes UJ-1.

**Functional Requirements:**

#### FR-1: Paste T&Cs text

User can paste raw T&Cs/ToS text into a text box and submit it for analysis.

**Consequences (testable):**
- Text box accepts arbitrary pasted plain text.
- Submission triggers one Analysis Call (FR-3) with the full pasted text.

**Out of Scope:**
- URL fetching or scraping (explicitly deferred per brainstorm doc).
- File upload (PDF/DOCX).

#### FR-2: Block empty or trivial submissions

System rejects submission client-side when the pasted text is empty or below a minimum length threshold, before any Analysis Call is made.

**Consequences (testable):**
- Empty paste shows a blocking message and does not call the LLM.
- Text below `[ASSUMPTION: a minimum character threshold, e.g. 200 characters]` shows the same blocking message.

**Out of Scope:**
- Detecting whether pasted text is *actually* T&Cs content (vs. any other long text) — not validated in v1.
- Handling of extremely long documents (truncation/warning) — not explicitly engineered for v1; left to whatever the LLM provider's context limit naturally allows.

### 4.2 Clause Analysis

**Description:** The core of the product. One Analysis Call takes the full pasted text and returns every notable Clause, each tagged with a Severity Tier, a plain-English consequence explanation, and a Suggested Action where one exists. No separate NLP pipeline or multi-call chain — a single LLM call does extraction, classification, explanation, and action suggestion together, per the 5-hour scope constraint. Realizes UJ-1.

**Severity Tier taxonomy** (from brainstorm doc, illustrative not exhaustive — `[ASSUMPTION: the LLM prompt may surface clause types not listed here; it classifies by the tier definition, not a fixed enum of examples]`):
- **Critical** — e.g. data selling, auto-renewal traps, liability waivers, unreasonable costs.
- **Caution** — e.g. broad data collection, vague cancellation terms.
- **Standard** — normal/expected terms, included for completeness/context.

**Functional Requirements:**

#### FR-3: Run Analysis Call on submitted text

System sends the full pasted text to the LLM in a single Analysis Call and receives back a structured list of Clauses, each with quoted text, Severity Tier, plain-English consequence, and Suggested Action (nullable).

**Consequences (testable):**
- Exactly one LLM API call is made per submission.
- Response is parsed into a structured shape (`[ASSUMPTION: JSON with fields clause_text, severity, consequence, suggested_action]`) before rendering.
- Each returned Clause's `clause_text` is a verbatim substring of the submitted input.

**Feature-specific NFRs:**
- API key for the Analysis Call is a hardcoded/embedded demo key for the hackathon build. `[ASSUMPTION: acceptable because this is a throwaway demo deployment, not a public release — see §5 Non-Goals]`.

#### FR-4: Compute Overall Verdict

System derives a single Overall Verdict from the full set of returned Clauses using weighted/count-based logic.

**Consequences (testable):**
- 2 or more Critical-tier Clauses → Overall Verdict is **Reconsider**.
- Exactly 1 Critical-tier Clause, or 2+ Caution-tier Clauses with 0 Critical → Overall Verdict is **Proceed with Caution**. `[ASSUMPTION: the Caution-only threshold (2+) was not explicitly specified by the user — only the Critical-count example was confirmed. Flag for confirmation.]`
- 0 Critical and 0-1 Caution-tier Clauses → Overall Verdict is **Proceed**.
- Overall Verdict is displayed prominently above the grouped Clause list.

### 4.3 Results Display

**Description:** Renders the Overall Verdict plus every flagged Clause, grouped and sorted by Severity Tier (Critical first, then Caution, then Standard). Each Clause is shown as a card. Realizes UJ-1.

**Functional Requirements:**

#### FR-5: Display Overall Verdict

User sees the Overall Verdict (Proceed / Proceed with Caution / Reconsider) at the top of the results, before any individual Clause detail.

**Consequences (testable):**
- Verdict is visually distinct (e.g. color-coded) from individual Clause severity badges.

#### FR-6: Display Clauses grouped and sorted by severity

User sees all flagged Clauses grouped into Critical / Caution / Standard sections, Critical section first, each Clause rendered as a card with: quoted clause text, plain-English consequence, Severity Tier badge, and Suggested Action if present.

**Consequences (testable):**
- Clause order within the page is always Critical clauses, then Caution clauses, then Standard clauses.
- A Clause with no Suggested Action renders the card without an empty/placeholder action field.

**Notes:**
- Visual design (badge style, color coding, layout) is not specified beyond "visually clean, simple" per brainstorm doc — left to implementation. `[NOTE FOR PM]`

## 5. Non-Goals (Explicit)

- Not a legal advice product — output is informational, not a substitute for legal review.
- Not a live checkout integration in v1 — the user pastes text ahead of time; no browser extension, no point-of-purchase interception.
- No backend, no authentication, no database, no persistence of submitted text or results across sessions.
- Not architected for production API key security in v1 — the hardcoded demo key is a hackathon-only decision and must not be treated as a pattern for any future real deployment.
- Not validating whether pasted text is genuinely T&Cs content — garbage-in is not detected or blocked beyond the empty/trivial-length check (FR-2).

## 6. MVP Scope

### 6.1 In Scope
- Paste-text input with client-side empty/trivial-length validation (FR-1, FR-2).
- Single Analysis Call for extraction + severity classification + explanation + action suggestion (FR-3).
- Weighted/count-based Overall Verdict computation (FR-4).
- Severity-grouped, sorted results display with per-clause cards (FR-5, FR-6).
- Single static HTML/JS page, no backend.

### 6.2 Out of Scope for MVP
- URL-based T&Cs retrieval — deferred to v2 per brainstorm doc. `[NOTE FOR PM: explicitly load-bearing for the Maya persona — her research doc calls manual paste-and-copy the single biggest adoption friction point for this exact user type. Revisit first for any post-hackathon iteration.]`
- Automatic execution of suggested opt-out actions on the user's behalf — deferred to v2 per brainstorm doc; v1 should avoid architectural choices that would block this later.
- Handling of non-T&Cs or malformed input beyond empty/trivial-length blocking.
- Truncation or warning behavior for very long documents.
- Any form of user accounts, saved history, or multi-document comparison.

## 7. Success Metrics

Given hackathon stakes, success is scoped to the demo and the underlying value proposition landing, not sustained usage.

**Primary**
- **SM-1**: Maya-framed outcome — a user who pastes a real T&Cs document can state a proceed / proceed-with-caution / reconsider decision, and name the one or two reasons why, without reading the full source document themselves. Validates FR-3, FR-4, FR-5, FR-6.
- **SM-2**: Live demo reliability — pasting a real T&Cs document during the demo produces a correctly structured, visually legible result (verdict + grouped clauses) within the 5-minute demo slot, with a real (not mocked) LLM call. Validates FR-3. Directly maps to the "How Baked Is It" and "Impact" judging criteria (`judge.png`): real API integration, not faked functionality; clear and compelling value proposition.

**Counter-metrics (do not optimize)**
- **SM-C1**: Number of Clauses flagged — do not optimize for flagging more clauses to look thorough. Over-flagging (e.g. tagging routine Standard terms as Caution) directly undermines Maya's stated need: "don't make me read faster, tell me where to look." Counterbalances SM-1.

## 8. Open Questions

1. Exact minimum character threshold for the empty/trivial-input block (FR-2) — needs a concrete number.
2. Exact Caution-tier count threshold for "Proceed with Caution" when no Critical clause is present (FR-4) — only the Critical-count rule was explicitly confirmed.
3. Exact JSON schema for the Analysis Call response (field names/types) — not yet designed, needed before implementation.
4. Visual design specifics (badges, color coding, layout) — intentionally left open per brainstorm doc.

## 9. Assumptions Index

- §4.1 FR-2 — Minimum character threshold for blocking trivial input is illustrative (e.g. 200 characters), not confirmed.
- §4.2 Severity Tier taxonomy — LLM classifies by tier definition; the example clause types listed are illustrative, not an exhaustive enum.
- §4.2 FR-3 — Structured response shape (JSON with clause_text/severity/consequence/suggested_action fields) is an inferred design, not yet specified.
- §4.2 FR-3 NFR — Hardcoded demo API key is acceptable specifically because this is a non-public hackathon build; flagged as a hard boundary in §5 Non-Goals.
- §4.2 FR-4 — The Caution-only threshold (2+ Caution clauses with 0 Critical → Proceed with Caution) extends the user-confirmed Critical-count rule by inference; only the Critical-count example was explicitly confirmed with the user.
