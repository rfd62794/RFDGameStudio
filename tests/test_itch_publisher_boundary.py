"""packages/itch_publisher must stay ready to spin back out into its own repo:
it may not import studio code or hard-code paths into this repository.
"""

import ast
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
PACKAGE_ROOT = REPO_ROOT / "packages" / "itch_publisher"
STUDIO_TOP_LEVEL_MODULES = {"studio", "studio_mcp", "engine", "renderers", "scripts"}


def _package_files(suffixes):
    return sorted(
        p for p in PACKAGE_ROOT.rglob("*")
        if p.is_file() and p.suffix in suffixes and "__pycache__" not in p.parts
    )


def _imported_modules(tree):
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            yield from (alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.level == 0 and node.module:
            yield node.module


def test_package_sources_present():
    assert (PACKAGE_ROOT / "src" / "itch_publisher" / "itchio.py").is_file()


@pytest.mark.parametrize(
    "path", _package_files({".py"}), ids=lambda p: p.relative_to(PACKAGE_ROOT).as_posix()
)
def test_package_does_not_import_studio(path):
    tree = ast.parse(path.read_text(encoding="utf-8"))
    studio_imports = [
        name for name in _imported_modules(tree)
        if name.split(".")[0] in STUDIO_TOP_LEVEL_MODULES
    ]
    assert not studio_imports, f"{path.name} imports studio code: {studio_imports}"


@pytest.mark.parametrize(
    "path", _package_files({".py", ".toml", ".yaml", ".yml"}),
    ids=lambda p: p.relative_to(PACKAGE_ROOT).as_posix(),
)
def test_package_has_no_studio_paths(path):
    text = path.read_text(encoding="utf-8").lower()
    assert "rfdgamestudio" not in text, f"{path.name} refers to RFDGameStudio"
