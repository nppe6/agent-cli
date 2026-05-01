# Code Reuse Thinking Guide

Use this guide before adding new helpers, constants, abstractions, templates, or scripts.

## Checklist

- Search for existing code that already solves the same problem.
- Prefer local project patterns over generic abstractions.
- Extract shared code only when duplication is meaningful and stable.
- Avoid adding configurability for hypothetical future needs.
- Keep generated template behavior and sync/hash behavior aligned.

## Questions

- Is this duplicate code, or just similar code with different reasons to exist?
- Would a new abstraction make the caller easier to understand?
- Is the new helper easy to test in isolation?
- Will future agents know where to find and reuse it?
