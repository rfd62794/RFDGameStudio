"""tracking_fix_generator.py — mechanical fix for Pattern 3.

Constructs a .gitignore exception diff and runs `git add --dry-run` to
confirm the real file list. No OpenRouter call — the fix is assembled
entirely from facts already produced by existing certified tools.

Never calls `git add`, `git commit`, or writes to any tracked file.
Output is a proposal for human/Claude review.
"""

from __future__ import annotations

import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .pattern_detector import DetectionResult, MatchStatus
from .pattern_catalog import PatternName

# Directories that should never be swept into a git add.
_FORBIDDEN_DIRS = {"node_modules", "dist", ".cache", "__pycache__"}


@dataclass
class TrackingFix:
    pattern: PatternName
    file: str
    gitignore_diff: str
    dry_run_files: list[str]
    error: str | None = None
    ambiguous: bool = False
    extra: dict[str, Any] = field(default_factory=dict)


def generate_tracking_fix(
    result: DetectionResult,
    repo_root: Path | str = ".",
) -> TrackingFix:
    """Generate a .gitignore exception + dry-run file list for Pattern 3.

    If the dry-run reveals node_modules/dist would be swept in, downgrades
    to ambiguous rather than proposing an unclean add.
    """
    if result.status != MatchStatus.CLEAN_MATCH:
        return TrackingFix(
            pattern=result.pattern,
            file=result.file,
            gitignore_diff="",
            dry_run_files=[],
            error=f"Cannot generate fix for status {result.status.value}",
        )

    root = Path(repo_root).resolve()
    target_dir = Path(result.file)
    if not target_dir.is_absolute():
        target_dir = root / target_dir

    try:
        rel = target_dir.relative_to(root).as_posix()
    except ValueError:
        return TrackingFix(
            pattern=result.pattern,
            file=result.file,
            gitignore_diff="",
            dry_run_files=[],
            error=f"Directory {target_dir} is not under repo root {root}",
        )

    # Construct the .gitignore exception line.
    gitignore_line = f"!{rel}/"
    gitignore_diff = f"# Add exception for untracked game source\n{gitignore_line}\n"

    # Run git add --dry-run to see what would be added.
    dry_run = subprocess.run(
        ["git", "add", "--dry-run", rel],
        cwd=root,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )

    # Parse dry-run output: lines like "add 'examples/planetforge/src/...'"
    dry_run_files: list[str] = []
    for line in (dry_run.stdout + dry_run.stderr).splitlines():
        line = line.strip()
        if line.startswith("add '") and line.endswith("'"):
            dry_run_files.append(line[5:-1])
        elif line.startswith("add "):
            # Some git versions use a different format
            dry_run_files.append(line[4:].strip().strip("'"))

    # Check for forbidden directories in the file list.
    has_forbidden = any(
        any(fd in f for fd in _FORBIDDEN_DIRS) for f in dry_run_files
    )

    if has_forbidden:
        forbidden_files = [
            f for f in dry_run_files
            if any(fd in f for fd in _FORBIDDEN_DIRS)
        ]
        return TrackingFix(
            pattern=result.pattern,
            file=result.file,
            gitignore_diff=gitignore_diff,
            dry_run_files=dry_run_files,
            ambiguous=True,
            error=(
                f"Dry-run would sweep in forbidden directories "
                f"({', '.join(_FORBIDDEN_DIRS)}): {forbidden_files[:5]}... "
                f"— not proposing an unclean add"
            ),
        )

    return TrackingFix(
        pattern=result.pattern,
        file=result.file,
        gitignore_diff=gitignore_diff,
        dry_run_files=dry_run_files,
    )
