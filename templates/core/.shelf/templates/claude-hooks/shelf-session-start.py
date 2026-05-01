#!/usr/bin/env python3
"""Lightweight Claude Code session-start helper for AgentOS Shelf.

This hook is intentionally conservative: it prints a short reminder instead of
mutating task state. Project teams can extend it later once their workflow is
stable.
"""

from __future__ import annotations

from pathlib import Path


def main() -> int:
    repo_root = Path.cwd()
    shelf_dir = repo_root / ".shelf"

    if not shelf_dir.is_dir():
        return 0

    print("AgentOS Shelf: read AGENTS.md and .shelf/workflow.md before changing code.")
    print("AgentOS Shelf: use .shelf/tasks for PRD, implement.jsonl, and check.jsonl context.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
