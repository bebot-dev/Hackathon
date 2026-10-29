# Glossary

- **Clause** — A single extracted passage from the pasted T&Cs text, notable enough to flag. Always shown verbatim (quoted) alongside its analysis.
- **Severity Tier** — One of three classifications applied to a flagged Clause: **Critical** (e.g. data selling, auto-renewal traps, liability waivers, unreasonable costs), **Caution** (e.g. broad data collection, vague cancellation terms), or **Standard** (normal/expected terms, included for context). Examples are illustrative, not an exhaustive enum — the LLM classifies by tier definition.
- **Overall Verdict** — The single recommendation shown at the top of the results: **Proceed**, **Proceed with Caution**, or **Reconsider**. Derived from clause severity counts (see SPEC.md CAP-3).
- **Suggested Action** — An optional, concrete mitigation step attached to a Clause (e.g. "use a burner email address," "set a cancellation reminder").
- **Analysis Call** — The single LLM API call performing extraction, Severity Tier classification, consequence explanation, and Suggested Action generation together, for one pasted document.
