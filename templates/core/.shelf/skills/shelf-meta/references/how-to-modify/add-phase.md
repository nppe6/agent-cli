# How To: Add Workflow Phase

Add a new phase to the AgentOS Shelf task workflow.

**Current platforms**: Codex and Claude Code.

---

## Files to Modify

| File | Action | Required |
|------|--------|----------|
| `.shelf/workflow.md` | Modify | Yes |
| `.shelf/scripts/common/task_store.py` | Modify if task defaults change | Sometimes |
| `.claude/commands/shelf/continue.md` | Modify if resume behavior changes | Sometimes |
| `.codex/prompts/shelf-continue.md` | Modify if resume behavior changes | Sometimes |
| Platform agent file | Create/modify if the phase uses an agent | Sometimes |
| `shelf-local/SKILL.md` or project-local notes | Document | Recommended |

---

## Step 1: Update Workflow

Edit `.shelf/workflow.md`:

1. Add the new phase or step to the phase list.
2. Define when it runs.
3. Update the matching `[workflow-state:STATUS]` block so the AI knows how to resume.
4. Update skill or agent routing tables if the phase changes who does the work.

---

## Step 2: Update Task Defaults If Needed

If new tasks need a new JSONL file or default metadata, update `.shelf/scripts/common/task_store.py`.

Keep task state simple. Prefer using existing task statuses (`planning`, `in_progress`, archived/completed) unless the new phase truly needs a new state.

---

## Step 3: Update Entry Points

If `/shelf:continue` or the Codex `shelf-continue` prompt needs new routing, update:

- `.claude/commands/shelf/continue.md`
- `.codex/prompts/shelf-continue.md`

Do not update nonexistent `dispatch.md` or hook files. Current default Shelf flow uses workflow text plus pull-based agent definitions.

---

## Step 4: Add Agent Optional

If the phase uses a new agent, create equivalent agent files for enabled platforms:

- `.claude/agents/<agent>.md`
- `.codex/agents/<agent>.md`

The agent must explicitly read active task context and the relevant JSONL file.

---

## Step 5: Document Locally

```markdown
## Workflow Changes

### Added review phase
- **Position**: After implement, before check
- **Agent/skill**: review
- **Purpose**: Review implementation quality
- **Reason**: Catch issues before check phase
```

---

## Checklist

- [ ] `.shelf/workflow.md` updated.
- [ ] Workflow-state block updated.
- [ ] Continue command/prompt updated if needed.
- [ ] Agent or skill added if needed.
- [ ] Task defaults updated if needed.
- [ ] Local customization documented.
