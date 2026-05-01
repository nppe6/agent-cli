# Backend Specs

Backend agents should start here before changing server-side code.

## Pre-Development Checklist

- Read `directory-structure.md` for where code should live.
- Read `database-guidelines.md` before touching persistence, migrations, queries, or schemas.
- Read `error-handling.md` before changing API errors, retries, validation, or fallbacks.
- Read `logging-guidelines.md` before adding or changing logs.
- Read `quality-guidelines.md` before final verification.

## Quality Check

- Code follows the existing backend directory and naming patterns.
- Database changes are explicit, reversible where practical, and covered by tests.
- Errors are surfaced consistently to callers.
- Logs are useful without exposing secrets or noisy internals.
- Tests cover the meaningful happy path and failure path.
