"""zip_reader.py — extract an AI Studio zip to a scratch temp directory."""

from __future__ import annotations

import zipfile
from pathlib import Path
from tempfile import mkdtemp


def extract_zip(zip_path: Path | str) -> tuple[Path, list[str]]:
    """Extract zip_path to a fresh scratch directory and return (scratch_dir, file_list)."""
    zip_path = Path(zip_path).resolve()
    if not zip_path.exists():
        raise FileNotFoundError(zip_path)

    scratch_dir = Path(mkdtemp(prefix="zip_verify_"))
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(scratch_dir)
        file_list = zf.namelist()

    return scratch_dir, file_list


def core_logic_files(root: Path) -> list[Path]:
    """Return source files that are likely core logic (heuristic filter)."""
    files: list[Path] = []
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix not in {".py", ".ts", ".tsx", ".js", ".jsx"}:
            continue
        # Exclude config-like files and assets
        if path.name in {"vite.config.ts", "vite.config.js", "tsconfig.json", "package.json"}:
            continue
        if "node_modules" in path.parts or "assets" in path.parts:
            continue
        files.append(path)
    return files
