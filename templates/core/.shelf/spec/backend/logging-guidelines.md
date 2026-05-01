# Backend Logging Guidelines

Document what backend code should log and what it must avoid logging.

## What To Capture

- Logger APIs and structured logging conventions.
- Required fields for request, job, or service logs.
- Log levels and when to use them.
- Privacy, secret, and token redaction rules.

## Project Rules

- TODO: Replace with conventions found in this repository.

## Examples

- TODO: Add real logging examples from the codebase.

## Avoid

- Debug logging left in production paths.
- Full payload logs that may contain private data.
