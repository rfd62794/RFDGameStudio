"""Tests for zip_reader.py."""

from pathlib import Path
from zipfile import ZipFile

import pytest

from studio_mcp.zip_verify.zip_reader import core_logic_files, extract_zip


def test_zip_reader_extracts_to_scratch_dir(tmp_path: Path):
    zip_path = tmp_path / "sample.zip"
    with ZipFile(zip_path, "w") as zf:
        zf.writestr("src/App.tsx", "export default function App() { return null; }")
        zf.writestr("README.md", "hello")
        zf.writestr("assets/logo.png", "fake")

    scratch, files = extract_zip(zip_path)
    assert scratch.exists()
    assert "src/App.tsx" in files
    assert "README.md" in files
    assert (scratch / "src" / "App.tsx").read_text(encoding="utf-8")
    # Original zip untouched
    assert zip_path.exists()


def test_core_logic_files_filters_assets_and_config(tmp_path: Path):
    src = tmp_path / "src"
    src.mkdir()
    (src / "App.tsx").write_text("function App() {}")
    (src / "logo.png").write_bytes(b"x")
    (tmp_path / "vite.config.ts").write_text("")

    files = core_logic_files(tmp_path)
    rels = {str(p.relative_to(tmp_path)).replace("\\", "/") for p in files}
    assert "src/App.tsx" in rels
    assert "src/logo.png" not in rels
    assert "vite.config.ts" not in rels
