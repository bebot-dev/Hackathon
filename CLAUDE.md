# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This is a fresh hackathon repository (not yet a git repo) containing only a BMAD Method v6 installation — no application source code, README, or docs exist yet. There is nothing to build, lint, or test at this point. When the user starts adding an actual project (app code, docs, etc.), update this file to describe it.

## BMAD Method framework

This repo is scaffolded with [BMAD Method](https://docs.bmad-method.org/) (v6.12.4), a structured workflow framework for going from idea to shipped code via planning agents and slash-command-style skills. Two modules are installed: `core` and `bmm` (BMad Method — software development).

- `_bmad/` — installer-managed configuration. Treat `_bmad/_config/`, `_bmad/core/`, `_bmad/bmm/` as **read-only**; they are regenerated on every installer run.
  - `_bmad/custom/config.toml` (team, committed) and `_bmad/custom/config.user.toml` (personal, gitignored) are the places to durably override config — never edit the installer-managed files directly.
- `_bmad-output/` — where BMAD skills write planning and implementation artifacts (currently empty).
- `.claude/skills/bmad-*` — the Claude Code skills that drive each BMAD workflow step (invoked as `/bmad-*`).

### Configured values (`_bmad/bmm/config.yaml`, `_bmad/core/config.yaml`)

- `project_name`: hackathon
- `user_name`: Ben
- `output_folder`: `{project-root}/_bmad-output`
- `planning_artifacts`: `{project-root}/_bmad-output/planning-artifacts`
- `implementation_artifacts`: `{project-root}/_bmad-output/implementation-artifacts`
- `project_knowledge`: `{project-root}/docs`
- `user_skill_level`: intermediate

### BMAD agent personas (`_bmad/config.toml`)

Five persona-driven agents are defined for the `software-development` team, each mapped to a BMAD skill:

| Skill | Name | Role |
|---|---|---|
| `bmad-agent-analyst` | Mary | Business Analyst |
| `bmad-agent-pm` | John | Product Manager |
| `bmad-agent-ux-designer` | Sally | UX Designer |
| `bmad-agent-architect` | Winston | System Architect |
| `bmad-agent-dev` | Amelia | Senior Software Engineer |

### Typical BMAD flow

The skills encode a rough phase order (see `_bmad/_config/bmad-help.csv` for the full list with descriptions, `preceded-by`/`followed-by` relationships, and output locations):

1. **Planning** (`2-planning` phase): `bmad-product-brief` → `bmad-prd` → `bmad-ux` → `bmad-architecture` → `bmad-create-epics-and-stories`, writing to `planning_artifacts`.
2. **Build** (`bmad-build`, `bmad-build-auto`, `bmad-sprint-planning`): implementation work, writing to `implementation_artifacts`.
3. **Anytime utilities**: `bmad-spec` (condense any input into a SPEC.md), `bmad-correct-course` (mid-sprint change assessment), `bmad-project-context` (set up/refresh this repo's AI-agent instructions — i.e., this file and any `AGENTS.md`), `bmad-retrospective`, `bmad-review`, `bmad-code-review`.

When the user invokes a `/bmad-*` skill, follow that skill's own instructions rather than improvising — this file only orients you to where things live.
