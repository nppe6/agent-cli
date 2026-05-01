---
status: active
created: 2026-05-01
type: architecture
---

# Shelf Lightweight Runtime Foundation Plan

## Problem Frame

AgentOS Shelf should borrow the durable core of the Trellis architecture without becoming a one-to-one clone of the upstream CLI. The current project already has the right foundation: `.shelf` as a shared source, thin root rules, Codex/Claude projections, migrated `agentos-*` workflow skills, shared agents, manifest tracking, and sync/doctor checks.

The next step is to make that foundation safer and more useful while keeping the CLI lightweight. We should add runtime file protection, readable CLI output, Codex context loading, useful spec scaffolding, and a first-run bootstrap task. We should not add the full upstream platform registry, hook matrix, update/migration engine, or framework-specific customization in this slice.

---

## Scope Boundaries

In scope:

- Add `.shelf/.gitignore` so runtime state is protected even when `.shelf` is tracked.
- Fix mojibake in current CLI user-facing Chinese output.
- Add a Codex-specific implement/check agent prelude so Codex agents load task context explicitly.
- Replace placeholder `.shelf/spec` with generic backend/frontend/guides templates.
- Add a bootstrap guidelines task that guides first-time projects to fill real specs.
- Update tests and documentation for the new lightweight direction.

Out of scope:

- One-to-one Trellis CLI port.
- 14-platform registry and configurator system.
- Full hook/settings generation.
- Full update/migration engine.
- Vue/framework-specific spec customization.
- Team collaboration rule definition.

---

## Key Decisions

- **Keep the CLI small.** The project should absorb Trellis principles and selected runtime mechanics, not its whole operational surface.
- **Prefer static templates before dynamic orchestration.** Spec templates and bootstrap task files can be installed by the existing copy/sync model before adding complex init-time task generation.
- **Treat Codex as pull-based.** Since Codex agents do not get guaranteed hook-injected context, generated Codex implement/check agents must explicitly load `.shelf/tasks` and JSONL context.
- **Do not make Claude heavier yet.** Claude keeps the shared markdown agents for now; hook/settings generation can come later.
- **Protect local runtime data inside `.shelf`.** `.shelf` may be tracked, but `.developer`, `.runtime`, and volatile current-task state should not be committed.

---

## Implementation Units

- U1. **Runtime Ignore and CLI Text Repair**

**Goal:** Protect local Shelf runtime files and make CLI output readable.

**Files:**
- Create: `templates/core/.shelf/.gitignore`
- Modify: `lib/actions/agent-init.js`
- Modify: `lib/actions/agent-skills-import.js`
- Test: `tests/agent-init.test.js`
- Test: `tests/agent-skills-import.test.js`

**Approach:**
- Add a Shelf-internal `.gitignore` for local runtime files while leaving specs, tasks, workflow, skills, agents, and durable templates trackable.
- Replace corrupted Chinese strings and broken tree characters with stable UTF-8 strings.
- Keep CLI wording concise.

**Test scenarios:**
- Init copies `.shelf/.gitignore`.
- Key init output includes readable Chinese text.
- Skills import output no longer contains mojibake.

**Verification:**
- `npm test` passes.

---

- U2. **Codex Agent Context Prelude**

**Goal:** Make generated Codex implement/check agents self-load active task context.

**Files:**
- Modify: `lib/utils/agent-os.js`
- Modify: `tests/agent-init.test.js`
- Modify: `tests/agent-lifecycle.test.js`

**Approach:**
- Extend projection template handling to allow generated content transforms in addition to raw file copies.
- For Codex only, inject a prelude into `implement.md` and `check.md`.
- The prelude should instruct the agent to run `python3 ./.shelf/scripts/task.py current --source`, read `prd.md` / `info.md`, read the correct JSONL file, and load referenced spec/research files.
- Leave Claude projections as raw `.shelf/agents` copies for now.

**Test scenarios:**
- Codex `implement.md` contains the Shelf context prelude and `implement.jsonl`.
- Codex `check.md` contains the Shelf context prelude and `check.jsonl`.
- Claude projected agents do not receive the Codex-specific prelude.
- Sync diff classification uses transformed content, not raw source content.

**Verification:**
- `npm test` passes.

---

- U3. **Generic Spec Templates**

**Goal:** Make `.shelf/spec` immediately useful without framework-specific customization.

**Files:**
- Create: `templates/core/.shelf/spec/backend/index.md`
- Create: `templates/core/.shelf/spec/backend/directory-structure.md`
- Create: `templates/core/.shelf/spec/backend/database-guidelines.md`
- Create: `templates/core/.shelf/spec/backend/error-handling.md`
- Create: `templates/core/.shelf/spec/backend/logging-guidelines.md`
- Create: `templates/core/.shelf/spec/backend/quality-guidelines.md`
- Create: `templates/core/.shelf/spec/frontend/index.md`
- Create: `templates/core/.shelf/spec/frontend/directory-structure.md`
- Create: `templates/core/.shelf/spec/frontend/type-safety.md`
- Create: `templates/core/.shelf/spec/frontend/hook-guidelines.md`
- Create: `templates/core/.shelf/spec/frontend/component-guidelines.md`
- Create: `templates/core/.shelf/spec/frontend/quality-guidelines.md`
- Create: `templates/core/.shelf/spec/frontend/state-management.md`
- Create: `templates/core/.shelf/spec/guides/index.md`
- Create: `templates/core/.shelf/spec/guides/cross-layer-thinking-guide.md`
- Create: `templates/core/.shelf/spec/guides/code-reuse-thinking-guide.md`
- Modify: `templates/core/.shelf/spec/README.md`
- Test: `tests/agent-init.test.js`

**Approach:**
- Use upstream generic spec scaffolding as the reference, renamed to Shelf where needed.
- Keep content generic and technology-agnostic.
- Avoid Vue-specific or framework-specific custom rules.

**Test scenarios:**
- Init creates representative backend, frontend, and guides spec files.
- Generated spec files use `.shelf`, not `.trellis`.

**Verification:**
- `npm test` passes.

---

- U4. **Bootstrap Guidelines Task**

**Goal:** First-time projects get a concrete task to fill real project conventions into `.shelf/spec`.

**Files:**
- Create: `templates/core/.shelf/tasks/00-bootstrap-guidelines/task.json`
- Create: `templates/core/.shelf/tasks/00-bootstrap-guidelines/prd.md`
- Create: `templates/core/.shelf/tasks/00-bootstrap-guidelines/implement.jsonl`
- Create: `templates/core/.shelf/tasks/00-bootstrap-guidelines/check.jsonl`
- Modify: `templates/core/.shelf/tasks/README.md`
- Test: `tests/agent-init.test.js`

**Approach:**
- Use a static bootstrap task template for this slice rather than dynamic per-developer task generation.
- The PRD should instruct AI to scan existing convention docs and code patterns, then populate `.shelf/spec`.
- Keep task JSON simple and compatible with the existing Python task scripts where practical.

**Test scenarios:**
- Init creates the bootstrap task files.
- Bootstrap PRD references `.shelf/spec`, not upstream naming.
- JSONL seed files exist for implement/check context.

**Verification:**
- `npm test` passes.

---

- U5. **Document the Lightweight Direction**

**Goal:** Update architecture comparison so future work does not drift into blind upstream cloning.

**Files:**
- Modify: `docs/shelf-architecture-upstream-comparison.md`
- Test: none

**Approach:**
- Add a section explaining the chosen product direction: same foundation, different trajectory.
- Make the next-step priorities match this plan.

**Test scenarios:**
- Test expectation: none -- documentation-only update.

**Verification:**
- Document clearly separates selected next steps from deferred heavy upstream systems.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Static bootstrap task may be less personalized than upstream dynamic generation | Accept for this slice; dynamic onboarding can be added later |
| Codex prelude may be too verbose | Keep it targeted to implement/check only |
| Spec templates may feel generic | The bootstrap task exists specifically to convert generic skeletons into project reality |
| UTF-8 repair may require updating tests that previously tolerated mojibake | Update tests to assert readable output |

---

## Verification

- Run `npm test`.
- Scan generated templates for `.trellis` / `trellis` residue outside documented upstream comparison references.
- Confirm `agent init` generated file count includes new templates and bootstrap task files.
