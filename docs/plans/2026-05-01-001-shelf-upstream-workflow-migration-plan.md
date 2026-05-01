---
status: active
created: 2026-05-01
type: architecture
title: Shelf Upstream Workflow Migration
---

# Shelf Upstream Workflow Migration Plan

## Problem Frame

Shelf currently has the right directory idea, but its generated skills are still lightweight placeholders. The reference project keeps root `AGENTS.md` thin, puts real workflow behavior in local workflow files, skills, scripts, and agents, and lets Claude use `AGENTS.md` rather than duplicating all rules. Shelf should adopt that operating model while keeping AgentOS naming and the `.shelf` root.

---

## Requirements Traceability

- R1. Replace placeholder core skills with the reference project's workflow skills, renamed from `trellis-*` to `agentos-*`.
- R2. Carry over the reference project's local task agents from `.trellis/agents` into `.shelf/agents`, rewritten for Shelf paths and AgentOS names.
- R3. Generate a thin `AGENTS.md` managed block, not a large all-in-one rules file.
- R4. Make Claude projection lean on `AGENTS.md` for shared project rules instead of duplicating the full Shelf rule body.
- R5. Add enough `.shelf` workflow/runtime scaffolding for the migrated skills to be coherent: `workflow.md`, `config.yaml`, and scripts.
- R6. Preserve current CLI behavior: selected tools still get entry files, skills, metadata, hashes, doctor, sync, and import behavior.
- R7. Keep framework customization and team collaboration rule authoring out of scope.

---

## Scope Boundaries

### In Scope

- Copy the reference workflow skills under `templates/core/.shelf/skills`, renaming `trellis-*` directories and skill frontmatter to `agentos-*`.
- Copy `.trellis/agents/{research,implement,check}.md` into `templates/core/.shelf/agents`, rewriting paths and names.
- Add `.shelf/workflow.md`, `.shelf/config.yaml`, and `.shelf/scripts`.
- Update `templates/core/.shelf/rules/AGENTS.shared.md` to be a thin managed block.
- Update `templates/core/.shelf/templates/CLAUDE.md` to reference `AGENTS.md`.
- Update projection code to copy `.shelf/agents` into each selected tool's `agents` directory when available.
- Update README and tests.

### Out of Scope

- Copying non-workflow auxiliary skills like `contribute`, `python-design`, and `first-principles-thinking` into core.
- Implementing full task lifecycle CLI commands in `agentos-cli`.
- Adding platforms beyond Codex and Claude Code.
- Defining team-specific coding rules.

---

## Key Technical Decisions

- **Core workflow skills only.** The `trellis-*` skills are the portable workflow system; non-prefixed auxiliary skills are reference-project extras and should not become default AgentOS core.
- **Rewrite names and paths mechanically but review semantically.** `trellis` becomes `agentos` for command/skill names, and `.trellis` becomes `.shelf` for local paths. References to the upstream project identity become AgentOS Shelf.
- **Agents project alongside skills.** Skills alone reference implement/check/research agents, so `.shelf/agents` must be part of the shared source and projected to `.codex/agents` / `.claude/agents`.
- **Thin root rules.** `AGENTS.md` should contain a managed block pointing at `.shelf` and command routing. Detailed behavior belongs in `.shelf/workflow.md`, skills, agents, and specs.

---

## Implementation Units

- U1. **Migrate workflow source assets**

**Goal:** Bring the reference workflow core into `.shelf`.

**Requirements:** R1, R2, R5

**Dependencies:** None

**Files:**
- Modify/Create: `templates/core/.shelf/skills/**`
- Create: `templates/core/.shelf/agents/check.md`
- Create: `templates/core/.shelf/agents/implement.md`
- Create: `templates/core/.shelf/agents/research.md`
- Create: `templates/core/.shelf/workflow.md`
- Create: `templates/core/.shelf/config.yaml`
- Create: `templates/core/.shelf/scripts/**`
- Test: `tests/agent-init.test.js`

**Approach:**
- Replace placeholder `agentos-planning`, `agentos-documentation`, etc. with migrated workflow skills.
- Rename reference workflow skills:
  - `trellis-before-dev` -> `agentos-before-dev`
  - `trellis-brainstorm` -> `agentos-brainstorm`
  - `trellis-break-loop` -> `agentos-break-loop`
  - `trellis-check` -> `agentos-check`
  - `trellis-continue` -> `agentos-continue`
  - `trellis-finish-work` -> `agentos-finish-work`
  - `trellis-meta` -> `agentos-meta`
  - `trellis-update-spec` -> `agentos-update-spec`
- Rewrite `.trellis/` path references to `.shelf/`.

**Test scenarios:**
- Happy path: fresh init creates `.codex/skills/agentos-brainstorm/SKILL.md`.
- Happy path: fresh init creates `.shelf/workflow.md`.
- Edge case: old placeholder skill directories like `agentos-planning` are not projected.

**Verification:**
- Generated skill frontmatter uses `agentos-*`, not `trellis-*`.

---

- U2. **Project agents to tools**

**Goal:** Keep local agents in shared Shelf source and project them to selected tools.

**Requirements:** R2, R6

**Dependencies:** U1

**Files:**
- Modify: `lib/utils/agent-os.js`
- Modify: `lib/utils/tool-layouts.js`
- Modify: `templates/tools/codex/tool.json`
- Modify: `templates/tools/claude/tool.json`
- Test: `tests/agent-init.test.js`
- Test: `tests/agent-lifecycle.test.js`

**Approach:**
- Teach tool layouts about `agentsDirectory`.
- Extend `collectProjectionTemplates` to copy files from `.shelf/agents` into each selected tool's agents directory.
- Preserve existing skills projection behavior and hash tracking.

**Test scenarios:**
- Happy path: Codex install creates `.codex/agents/implement.md`.
- Happy path: Claude install creates `.claude/agents/check.md`.
- Sync: deleting `.codex/agents/research.md` is reported as `create` on dry-run.

**Verification:**
- Manifest includes projected agent files.

---

- U3. **Thin root rules and Claude reference**

**Goal:** Match the reference model where generated root instructions are compact and shared behavior lives under `.shelf`.

**Requirements:** R3, R4

**Dependencies:** U1

**Files:**
- Modify: `templates/core/.shelf/rules/AGENTS.shared.md`
- Modify: `templates/core/.shelf/templates/CLAUDE.md`
- Test: `tests/agent-init.test.js`

**Approach:**
- Replace verbose root rules with a managed Shelf block that lists `.shelf/workflow.md`, `.shelf/spec`, `.shelf/workspace`, `.shelf/tasks`, `.shelf/skills`, and `.shelf/agents`.
- Make `CLAUDE.md` say to follow `AGENTS.md` for shared project rules, plus a short Claude-specific behavioral caution section.

**Test scenarios:**
- Happy path: generated `AGENTS.md` contains `<!-- SHELF:START -->`.
- Happy path: generated `CLAUDE.md` references `AGENTS.md`.
- Edge case: generated `AGENTS.md` no longer lists every skill manually.

**Verification:**
- Root projection stays compact while skills/agents carry detailed guidance.

---

- U4. **Docs and validation**

**Goal:** Make README and tests describe the migrated workflow accurately.

**Requirements:** R6, R7

**Dependencies:** U1, U2, U3

**Files:**
- Modify: `README.md`
- Modify: `tests/agent-init.test.js`
- Modify: `tests/agent-lifecycle.test.js`
- Modify: `tests/agent-skills-import.test.js`

**Approach:**
- Update README to say Shelf includes workflow skills, agents, scripts, and thin projections.
- Replace tests for placeholder skill names with migrated workflow names.
- Run the full Node test suite.

**Test scenarios:**
- Integration: `npm test` passes.
- Residual scan: no `.trellis` path or `trellis-*` generated template content remains except inside `.tmp` reference.

**Verification:**
- `npm test` green.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Upstream scripts assume `.trellis`; path rewrite may miss references. | Run residual scans on `templates`, `lib`, `tests`, and `README`; inspect likely script strings. |
| Copying all upstream skills would bloat core with project-specific guidance. | Only migrate `trellis-*` workflow skills. |
| Agent projection may overwrite user-created agent files. | Reuse existing hash/skip logic so sync skips user-modified projections. |
| Claude/Codex agent format expectations may differ. | Project plain markdown agents initially; existing tool metadata already reserves agent directories. |

---

## Sources & References

- Local reference repo: `.tmp/Trellis-main`
- Reference files: `.tmp/Trellis-main/AGENTS.md`, `.tmp/Trellis-main/CLAUDE.md`, `.tmp/Trellis-main/.agents/skills/`, `.tmp/Trellis-main/.trellis/agents/`, `.tmp/Trellis-main/.trellis/workflow.md`
- Local implementation: `lib/utils/agent-os.js`, `templates/core/.shelf`, `tests/agent-init.test.js`, `tests/agent-lifecycle.test.js`
