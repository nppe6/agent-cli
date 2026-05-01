# Cross-Layer Thinking Guide

Use this guide when a change crosses boundaries such as UI to API, API to service, service to database, CLI to templates, or generated files to runtime scripts.

## Checklist

- Trace the read path and write path separately.
- Identify the source of truth for each piece of data.
- Confirm type/schema compatibility at each boundary.
- Check how errors move between layers.
- Verify tests exercise at least one real cross-layer path when behavior depends on integration.

## Questions

- What layer owns validation?
- What happens if the downstream layer fails?
- Are there alternate entry points that need the same behavior?
- Does this change require docs, generated templates, or migration notes?
