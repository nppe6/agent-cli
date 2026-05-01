---
status: completed
created: 2026-05-01
type: architecture
---

# Shelf Runtime CLI Bridge Plan

## Problem Frame

The Shelf template now includes workflow scripts, workspace memory, task directories, spec templates, and a bootstrap task. The next missing lightweight layer is not a full hook/update system; it is a small CLI bridge that lets users operate the included runtime without manually remembering Python script paths.

This keeps AgentOS Shelf intentionally lighter than the upstream Trellis CLI while making the current foundations usable:

- developer identity can be initialized from `agentos-cli`;
- task lifecycle commands can be delegated through `agentos-cli`;
- doctor can report whether the local Python runtime needed by `.shelf/scripts` is available.

---

## Scope Boundaries

In scope:

- Add a small utility for finding a usable Python command.
- Add a small utility for running `.shelf/scripts/*.py` from the target project.
- Add `agent developer init <name> [target]`.
- Add `agent task <args...>` passthrough for `.shelf/scripts/task.py`.
- Add doctor warnings for missing Python and missing core runtime scripts.
- Add tests for command registration and action behavior.

Out of scope:

- Reimplementing `task.py` in Node.
- Hook/settings generation.
- Full dynamic bootstrap/onboarding task generation.
- Versioned update/migration behavior.
- Multi-platform registry expansion.

---

## Implementation Units

- U1. **Runtime Script Utility**

**Goal:** Provide a small, testable bridge for Python script execution.

**Files:**
- Create: `lib/utils/python-runtime.js`
- Create: `lib/actions/agent-developer.js`
- Create: `lib/actions/agent-task.js`
- Test: `tests/agent-runtime.test.js`

**Approach:**
- Detect Python as `python` on Windows and `python3` elsewhere, with fallback to the alternate command.
- Run scripts with `child_process.spawnSync`, inheriting stdio for interactive/pass-through behavior by default.
- Return exit status in tests without forcing process exit.
- Validate `.shelf` and script paths before running.

**Test scenarios:**
- Developer init builds the expected script invocation.
- Task passthrough forwards arbitrary task arguments.
- Missing `.shelf` gives a clear error.

**Verification:**
- `npm test` passes.

---

- U2. **CLI Command Registration**

**Goal:** Expose runtime bridge commands from `agentos-cli agent`.

**Files:**
- Modify: `lib/commands/agent.js`
- Test: `tests/agent-runtime.test.js`

**Approach:**
- Register `agent developer init <name> [target]`.
- Register `agent task [args...]` with `allowUnknownOption()` so task.py flags can pass through.
- Keep help text concise.

**Test scenarios:**
- Commands are registered and call the correct action.
- Unknown task flags pass through rather than being swallowed by commander.

**Verification:**
- `npm test` passes.

---

- U3. **Doctor Runtime Warnings**

**Goal:** Make `agent doctor` tell users whether the lightweight runtime can actually run.

**Files:**
- Modify: `lib/actions/agent-doctor.js`
- Test: `tests/agent-lifecycle.test.js`

**Approach:**
- Check for `.shelf/scripts/task.py`, `.shelf/scripts/init_developer.py`, `.shelf/scripts/get_context.py`, and `.shelf/scripts/add_session.py`.
- Warn when Python cannot be found, but do not fail doctor solely for Python absence because projection-only usage can still be valid.

**Test scenarios:**
- Clean initialized project remains ok.
- Missing runtime script is reported as an issue.

**Verification:**
- `npm test` passes.

---

- U4. **Documentation Update**

**Goal:** Make README and architecture docs reflect the new lightweight runtime bridge.

**Files:**
- Modify: `README.md`
- Modify: `docs/shelf-architecture-upstream-comparison.md`

**Approach:**
- Document that users can still run Python scripts directly, but `agent developer init` and `agent task` are the preferred light wrappers.
- Reclassify task command wrappers and developer initialization as covered/active.

**Test scenarios:**
- Test expectation: none -- documentation-only update.

**Verification:**
- Docs preserve the "not a full Trellis clone" direction.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Node wrapper could hide Python script behavior | Use passthrough instead of reimplementing logic |
| Commander could intercept task.py flags | Use `allowUnknownOption()` and variadic args |
| Python may not exist on user machine | Doctor warns; commands fail clearly with install guidance |

---

## Verification

- Run `npm test`.
- Run residual scan for accidental upstream naming in generated templates.
