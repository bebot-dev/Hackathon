# Visual Design

Reused from the removed `clauseguard-pitch.html` brainstorming artifact (git history, commit `4108429`) rather than designed fresh, to save build time.

## Palette (dark theme)

```
--bg:            #090c12
--bg-2:          #0d1119
--surface:       #121825
--surface-2:     #182032
--border:        #263049
--text:          #eef1f7
--text-dim:      #97a2b8
--text-dimmer:   #5f6b82
--brand:         #8b7cf6
--brand-2:       #34d6e0

--critical:        #ff5468
--critical-bg:     rgba(255,84,104,.12)
--critical-border: rgba(255,84,104,.35)

--caution:         #f5a623
--caution-bg:      rgba(245,166,35,.12)
--caution-border:  rgba(245,166,35,.35)

--standard:        #36d399
--standard-bg:     rgba(54,211,153,.12)
--standard-border: rgba(54,211,153,.35)
```

## Application

- Dark background (`--bg`), light text (`--text`) throughout.
- Each Severity Tier gets its own color (critical/caution/standard above) applied consistently to: clause card border, severity badge, and clause-group section heading.
- The Overall Verdict banner at the top of the results must be visually distinct from individual clause severity badges (SPEC.md CAP-4) — larger, bannerstyle, using `--brand`/`--brand-2` rather than a tier color, so it doesn't get confused with a "Critical" clause badge.
- Font stack: system UI (`-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`).
