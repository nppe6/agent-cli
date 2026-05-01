# Backend Database Guidelines

Document persistence rules for this project.

## What To Capture

- ORM or query builder conventions.
- Migration naming and rollback expectations.
- Transaction boundaries.
- ID, timestamp, enum, and status field conventions.
- Data backfill and production safety rules.

## Project Rules

- TODO: Replace with conventions found in this repository.

## Examples

- TODO: Add real migrations, models, or query files.

## Quality Check

- Queries avoid avoidable N+1 behavior.
- Writes are idempotent when retries are possible.
- Migration and schema changes are tested or manually verified.
