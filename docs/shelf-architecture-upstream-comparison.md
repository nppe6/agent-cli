# Shelf Architecture Upstream Comparison

Date: 2026-05-01

This document compares the current AgentOS Shelf implementation in this repository with the local upstream reference at `.tmp/Trellis-main`.

Scope: architecture, templates, projection behavior, runtime workflow support, update safety, and future extension opportunities. Team collaboration rule definition and Vue/framework customization remain out of scope.

## Executive Summary

The current project has successfully moved from a small Agent OS scaffold toward a Shelf-style workflow source model:

- `.shelf/` is now the shared source of truth.
- Workflow skills were migrated from the upstream workflow set and renamed to `agentos-*`.
- Shared agents now exist under `.shelf/agents` and project into `.codex/agents` / `.claude/agents`.
- `AGENTS.md` is intentionally thin, while `CLAUDE.md` references `AGENTS.md` instead of duplicating all rules.
- `init`, `sync`, `doctor`, and `skills import` support the current Codex/Claude projection model.

This project should remain a lightweight AgentOS Shelf CLI rather than becoming a full Trellis clone. The upstream reference is valuable because its core foundation matches the intended direction: file-backed context, task-driven work, lightweight rule projection, reusable skills, and project memory. Future work should selectively absorb the parts that strengthen those foundations without inheriting every platform integration, migration layer, or hook system.

The next priority is therefore not "close every upstream gap." It is to strengthen the local foundation: runtime file protection, readable CLI output, pull-based Codex context loading, useful spec templates, and a bootstrap task that turns generic templates into project reality.

## Current Project Architecture

### CLI Entrypoint

Files:

- `bin/cli.js`
- `lib/commands/agent.js`

Current commands:

- `agent init`: writes `.shelf` plus selected tool projections.
- `agent doctor`: checks required Shelf files and selected tool directories.
- `agent sync`: regenerates projections from `.shelf`.
- `agent skills import`: imports external skill directories into Shelf or tool-specific destinations.

Assessment:

- Good fit for a small, npm-distributed CLI.
- Command surface is intentionally smaller than upstream.
- The CLI currently has no native task commands, update command, migration command, platform hook installation command, or developer onboarding command.
- This is an intentional product direction for now: the CLI should stay approachable while the Shelf foundation stabilizes.

## Directional Choice: Same Foundation, Different Trajectory

AgentOS Shelf should copy the upstream project's durable ideas, not its full weight:

- **Keep:** `.shelf` as source of truth, thin root rules, task folders, specs, skills, agents, workspace memory, safe projection sync.
- **Add carefully:** runtime safety files, context-loading preludes for platforms without hooks, generic spec scaffolding, first-run bootstrap guidance.
- **Defer:** 14-platform configurators, full hook matrix, update/migration engine, framework-specific packs, and team collaboration policy authoring.

This means an upstream feature being absent is not automatically a defect. It is a candidate only if it improves the lightweight AgentOS/Shelf workflow.

### Shelf Source Template

Files/directories:

- `templates/core/.shelf/workflow.md`
- `templates/core/.shelf/config.yaml`
- `templates/core/.shelf/scripts/`
- `templates/core/.shelf/skills/`
- `templates/core/.shelf/agents/`
- `templates/core/.shelf/spec/README.md`
- `templates/core/.shelf/tasks/README.md`
- `templates/core/.shelf/workspace/README.md`
- `templates/core/.shelf/rules/AGENTS.shared.md`
- `templates/core/.shelf/templates/CLAUDE.md`

Assessment:

- The migrated workflow, scripts, core skills, and agents have direct upstream counterparts.
- The spec/tasks/workspace directories are currently placeholders, not full upstream bootstrap templates.
- `.shelf/config.yaml` contains upstream-style runtime settings, but the CLI does not yet use most of them.
- `.shelf/workflow.md` includes runtime breadcrumb contracts that assume hooks or platform preludes exist; this is only partially true in the current CLI.

### Projection Model

Files:

- `templates/tools/codex/tool.json`
- `templates/tools/claude/tool.json`
- `lib/utils/tool-layouts.js`
- `lib/utils/agent-os.js`

Current behavior:

- Codex receives:
  - `AGENTS.md`
  - `.codex/skills/*`
  - `.codex/agents/*`
- Claude receives:
  - `CLAUDE.md`
  - `.claude/skills/*`
  - `.claude/agents/*`

Assessment:

- The shared-source-to-tool-projection architecture is clean and easy to reason about.
- The projection is file-copy based; there is no upstream-style placeholder resolver per platform.
- Tool definitions are JSON-driven, but only Codex and Claude are supported.
- `optionalDirs` is metadata only; it does not currently drive hook/settings generation.

### Manifest and Hash Tracking

Files:

- `lib/utils/template-hash.js`
- `lib/actions/agent-sync.js`
- `lib/utils/agent-os.js`

Current behavior:

- `.shelf/manifest.json` stores selected tools, generated files, CLI version, and stack metadata.
- `.shelf/template-hashes.json` stores template hashes.
- `sync` classifies projection files as create, update, unchanged, user-modified, or conflict.
- User-modified projection files are skipped during sync.

Assessment:

- This is enough for safe projection regeneration.
- It is simpler than upstream and does not yet cover full template updates, version comparison, protected user data, migration manifests, backup creation, safe deletes, or `update.skip`.

### Rules Model

Files:

- `templates/core/.shelf/rules/AGENTS.shared.md`
- `templates/core/.shelf/templates/CLAUDE.md`

Current behavior:

- `AGENTS.md` gets a small managed Shelf block.
- `CLAUDE.md` tells Claude to follow `AGENTS.md` and adds Claude-specific behavioral guidance.

Assessment:

- This matches the desired direction: rules stay thin and avoid dumping all workflow content into the root files.
- It is conceptually aligned with upstream's managed-block approach.
- The current sync implementation overwrites the whole generated `AGENTS.md` if it is still template-owned, rather than replacing only the managed block inside a larger user-authored file.

## Upstream Architecture Reference

The upstream reference is broader than the checked-in `.trellis/agents` and `.agents/skills` directories. Important architecture lives in:

- `.tmp/Trellis-main/.trellis/`
- `.tmp/Trellis-main/.agents/skills/`
- `.tmp/Trellis-main/packages/cli/src/types/ai-tools.ts`
- `.tmp/Trellis-main/packages/cli/src/configurators/`
- `.tmp/Trellis-main/packages/cli/src/templates/common/`
- `.tmp/Trellis-main/packages/cli/src/templates/shared-hooks/`
- `.tmp/Trellis-main/packages/cli/src/templates/trellis/`
- `.tmp/Trellis-main/packages/cli/src/commands/init.ts`
- `.tmp/Trellis-main/packages/cli/src/commands/update.ts`
- `.tmp/Trellis-main/packages/cli/src/utils/template-hash.ts`
- `.tmp/Trellis-main/packages/cli/src/migrations/`

Key upstream ideas:

- Central `AI_TOOLS` registry for platform capabilities.
- Platform configurators instead of one generic copy loop.
- Common workflow templates rendered differently per platform.
- Shared hooks for session start, per-turn workflow state, and sub-agent context injection.
- Rich spec scaffolding for backend/frontend/guides and monorepo packages.
- Bootstrap and joiner onboarding tasks.
- Python version detection and platform-specific Python command rendering.
- Version file, update command, migration manifests, safe file deletion, protected paths, and backups.
- Managed block replacement for root files and runtime-critical workflow blocks.

## Capability Matrix

| Capability | Current Project | Upstream Reference | Status |
|---|---|---|---|
| Shared workflow source directory | `.shelf/` | `.trellis/` | Covered |
| Core workflow skills | `agentos-before-dev`, `agentos-brainstorm`, `agentos-break-loop`, `agentos-check`, `agentos-continue`, `agentos-finish-work`, `agentos-meta`, `agentos-update-spec` | `trellis-*` skills | Covered |
| Shared implement/check/research agents | `.shelf/agents` projects to Codex/Claude | Platform-specific agents | Partially covered |
| Thin root AGENTS rules | `AGENTS.shared.md` | managed `AGENTS.md` block | Covered, but update behavior is weaker |
| Claude references AGENTS | `CLAUDE.md` shim | upstream also treats AGENTS as shared rules source | Covered |
| Task directory model | scripts and workflow expect `.shelf/tasks` | full `.trellis/tasks` lifecycle | Partially covered |
| Project memory | scripts and workspace directory exist | journal/index system with init/onboarding | Partially covered |
| Spec injection | specs exist as placeholders; scripts can read them | hooks/preludes inject curated specs | Partially covered |
| Automatic session context injection | pull-based Codex prelude planned first; hooks deferred | shared hooks/plugins/settings | Selective |
| Platform capability registry | two JSON tool layouts | 14-platform `AI_TOOLS` registry | Missing |
| Rich spec bootstrap | generic templates planned first | backend/frontend/guides templates and monorepo detection | Selective |
| Bootstrap task | static first-run task planned first | `00-bootstrap-guidelines` | Selective |
| Joiner onboarding | not created | `00-join-<developer>` | Missing |
| Native update/migration | `sync` only | full `update` with migrations | Missing |
| Internal `.shelf` ignore rules | planned as lightweight runtime protection | `.trellis/.gitignore` | Selective |
| Python requirement check | none | Python >= 3.9 check | Missing |
| Managed block replacement | whole-file projection classification | block-level AGENTS/workflow handling | Partial |
| Multi-platform reuse | Codex + Claude only | 14 platforms | Partial by design |

## Core Advantages Coverage

### Automatic Spec Injection

Current state:

- `.shelf/spec/` exists.
- `agentos-before-dev`, `agentos-check`, and workflow docs instruct agents to read relevant specs.
- `implement.jsonl` and `check.jsonl` are part of the task model.

Gap:

- No generated hooks/settings currently inject spec or task context automatically.
- Codex/Claude agents are markdown copies from `.shelf/agents`; they do not include upstream's pull-based prelude for Codex-style context loading.

Recommended next step:

- Add platform-aware agent rendering so Codex implement/check agents include a required context-load prelude.
- Add Claude hooks/settings generation later, if the platform supports stable hook wiring in the target environment.

### Task-Driven Workflow

Current state:

- `.shelf/tasks/` exists.
- `task.py` and common task utilities are present.
- Workflow skills reference PRD, `info.md`, `implement.jsonl`, `check.jsonl`, research files, and task status.

Gap:

- `agent init` does not create rich task scaffolds, bootstrap task, joiner task, or developer identity.
- There is no Node wrapper for common task operations.

Recommended next step:

- Add a small `agent task` command group that delegates to `.shelf/scripts/task.py`.
- Add optional bootstrap task creation during init after Python availability is checked.

### Parallel Agent Execution

Current state:

- `.shelf/agents` has research/implement/check definitions.
- Tool projections write agents to `.codex/agents` and `.claude/agents`.
- `AGENTS.md` tells agents to spawn subagents when useful.

Gap:

- No worktree orchestration or platform-specific agent capability model exists in this CLI.
- Current agents are copied verbatim and are not adapted per platform.

Recommended next step:

- Keep first implementation simple: add per-platform agent transformations first.
- Defer full worktree orchestration until task lifecycle commands are stable.

### Project Memory

Current state:

- `.shelf/workspace/` exists.
- `add_session.py` and journal utilities are present.

Gap:

- No automatic session-start or finish-work hook writes journal entries.
- No developer initialization path is wired into `agent init`.

Recommended next step:

- Add developer initialization support and `.shelf/.gitignore`.
- Later add hook-based session capture for Claude and platform-specific equivalents.

### Multi-Platform Reuse

Current state:

- The structure is portable in principle.
- Codex and Claude are supported.

Gap:

- No upstream-style `AI_TOOLS` registry, template context, or configurator layer.
- Many references inside workflow mention platforms that this CLI cannot install yet.

Recommended next step:

- Introduce a lightweight registry for current tools first.
- Add one new platform only after Codex/Claude runtime behavior is correct.

## Next-Step Priorities

### 1. Runtime Protection and Encoding Repair

Several CLI strings currently render as mojibake in `agent-init.js`, `agent-skills-import.js`, and copied workflow text. This damages the user experience and makes future tests harder to trust. The project also needs `.shelf/.gitignore` so local runtime state is not accidentally committed.

Recommendation:

- Add `templates/core/.shelf/.gitignore`.
- Normalize source files to UTF-8.
- Add at least one assertion that key Chinese CLI output is readable.

### 2. Codex Agents Need Pull-Based Context Prelude

Upstream treats Codex as a pull-based platform: implement/check agents must explicitly load current task, PRD, and JSONL context. The current projection copies generic markdown agents and relies on human/agent memory.

Recommendation:

- Render Codex `implement` and `check` agents with a Shelf-specific prelude.
- Keep research agent unchanged.

### 3. Generic Spec Templates

The current `spec/README.md` is too thin to deliver the "spec injected, not remembered" advantage.

Recommendation:

- Migrate upstream generic backend/frontend/guides spec templates, renamed to Shelf/AgentOS.
- Keep framework-specific Vue content deferred as requested.

### 4. Bootstrap Guidelines Task

The first run should give the user and AI a concrete task: fill `.shelf/spec` with this project's real conventions.

Recommendation:

- Add a lightweight static `00-bootstrap-guidelines` task under `.shelf/tasks`.
- Defer upstream's dynamic developer-specific onboarding until the basic flow proves useful.

### 5. Update Safety Is Still Basic

`sync` protects user-modified projection files, but there is no version-aware `update`, migration manifest, backup, protected path list, or block-level root file replacement.

Recommendation:

- First improve managed-block replacement for `AGENTS.md`.
- Then design a Shelf update command around existing manifest/hash code.

## Good Upstream Ideas To Extend Into This Project

Recommended order after the current foundation:

1. Add `.shelf/.gitignore` and fix UTF-8 output.
2. Add Codex platform-aware agent rendering instead of raw copies.
3. Add rich generic spec templates for backend/frontend/guides, excluding deferred framework-specific Vue customization.
4. Add static bootstrap guideline task creation through templates.
5. Add developer initialization flow that calls `.shelf/scripts/init_developer.py`.
6. Add lightweight platform registry for Codex and Claude, then expand cautiously.
7. Add managed-block replacement for `AGENTS.md` and workflow-state blocks.
8. Add `agent update` with protected paths, backups, and migration manifest support.
9. Add hook/settings generation for Claude where appropriate.
10. Add optional shared `.agents/skills` output for tools that support the open Agent Skills layer.
11. Add monorepo package detection and per-package spec scaffolding.
12. Add task command wrappers over `.shelf/scripts/task.py`.

## Implementation Guidance

Do not try to port the whole upstream CLI at once. The current repository is CommonJS, small, and easy to maintain; upstream is a larger TypeScript CLI with many platform configurators and migration machinery. A direct wholesale port would add complexity before the current two-platform foundation is fully verified.

Best next slice:

- Fix generated runtime safety and readability first: `.shelf/.gitignore`, UTF-8 strings, and Codex agent prelude.
- Then improve actual workflow value: rich spec templates and bootstrap task.
- Then expand platform registry and update/migration support.

This sequence preserves the current project's simplicity while steadily importing the upstream design where it creates real user-facing leverage.
