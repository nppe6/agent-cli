#!/usr/bin/env python3
"""Codex SessionStart hook for AgentOS Shelf projects."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


def run_context_script(project_dir: Path) -> str:
    script = project_dir / ".shelf" / "scripts" / "get_context.py"
    if not script.is_file():
        return "No Shelf context script found."

    try:
        result = subprocess.run(
            [sys.executable, str(script)],
            capture_output=True,
            cwd=str(project_dir),
            encoding="utf-8",
            errors="replace",
            text=True,
            timeout=5,
        )
    except (OSError, subprocess.TimeoutExpired):
        return "No Shelf context available."

    return result.stdout.strip() if result.returncode == 0 and result.stdout.strip() else "No Shelf context available."


def main() -> int:
    try:
        hook_input = json.loads(sys.stdin.read() or "{}")
    except json.JSONDecodeError:
        hook_input = {}

    project_dir = Path(hook_input.get("cwd") or ".").resolve()
    shelf_dir = project_dir / ".shelf"
    if not shelf_dir.is_dir():
        return 0

    context = "\n".join(
        [
            "<session-context>",
            "You are working in an AgentOS Shelf-managed project.",
            "Use AGENTS.md and .shelf/workflow.md as the project workflow entry points.",
            "</session-context>",
            "",
            "<current-state>",
            run_context_script(project_dir),
            "</current-state>",
            "",
            "<ready>",
            "When implementing or checking code, load the active task and curated JSONL context before editing.",
            "</ready>",
        ]
    )

    output = {
        "suppressOutput": True,
        "systemMessage": f"Shelf context injected ({len(context)} chars)",
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": context,
        },
    }
    print(json.dumps(output, ensure_ascii=False), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
