# Bootstrap Task: Fill Project Development Guidelines

The developer initialized this project as an AgentOS Shelf workspace. The `.shelf/spec/` directory now contains generic backend, frontend, and cross-layer templates.

Your job is to turn those templates into real project memory.

## Goals

- Inspect existing convention sources such as `README.md`, `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.cursor/rules/`, `.github/copilot-instructions.md`, `CONTRIBUTING.md`, and package docs.
- Inspect representative code paths to discover actual patterns.
- Fill `.shelf/spec/` with current reality, not aspirational rules.
- Include real file path examples in each relevant spec file.
- Leave framework-specific customization for a later task unless the convention is already obvious in this repo.

## Suggested Flow

1. Read `.shelf/spec/README.md` and the spec indexes.
2. Search the repository for existing convention docs.
3. Sample real backend, frontend, CLI, test, and config files as applicable.
4. Update the matching `.shelf/spec/**` files.
5. Run a final review: every changed spec should cite at least one real example or explicitly say the project has no clear pattern yet.

## Completion Criteria

- `.shelf/spec/backend/` contains real rules or explicit "not applicable" notes.
- `.shelf/spec/frontend/` contains real rules or explicit "not applicable" notes.
- `.shelf/spec/guides/` reflects cross-layer and reuse practices that fit this project.
- Generic TODO placeholders are removed or converted into concrete follow-up notes.

## Important

Do not invent rules just to fill space. AgentOS Shelf is valuable because future agents load these specs as working context. If the specs describe ideals that the codebase does not follow, future work will drift.
