"""archive/ holds retired projects for reference and recovery. Studio code must
never import from it, and the studio's test/build configuration must never
pick it up."""

import ast
import json
import tomllib
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
ARCHIVE = REPO_ROOT / "archive"
# Top-level package names that exist only inside archive/rpgCore/src.
ARCHIVED_PACKAGES = {"dgt_engine", "game_engine", "foundation", "apps", "launcher"}
STUDIO_CODE_DIRS = ["studio", "studio_mcp", "engine", "renderers", "scripts", "tests", "packages"]


def test_archive_exists():
    assert (ARCHIVE / "rpgCore" / "ARCHIVE.md").is_file()


def test_pytest_and_workspace_config_exclude_archive():
    pyproject = tomllib.loads((REPO_ROOT / "pyproject.toml").read_text(encoding="utf-8"))
    testpaths = pyproject["tool"]["pytest"]["ini_options"]["testpaths"]
    members = pyproject.get("tool", {}).get("uv", {}).get("workspace", {}).get("members", [])
    assert not any(p.startswith("archive") for p in testpaths)
    assert not any(m.startswith("archive") for m in members)


def test_typescript_config_excludes_archive():
    tsconfig = json.loads((REPO_ROOT / "ts" / "tsconfig.json").read_text(encoding="utf-8"))
    assert not any("archive" in entry for entry in tsconfig.get("include", []))


def test_studio_code_never_imports_archived_packages():
    offenders = []
    for folder in STUDIO_CODE_DIRS:
        for path in (REPO_ROOT / folder).rglob("*.py"):
            if "archive" in path.parts or "__pycache__" in path.parts:
                continue
            try:
                tree = ast.parse(path.read_text(encoding="utf-8"))
            except (SyntaxError, UnicodeDecodeError):
                continue
            for node in ast.walk(tree):
                names = []
                if isinstance(node, ast.Import):
                    names = [alias.name for alias in node.names]
                elif isinstance(node, ast.ImportFrom) and node.level == 0 and node.module:
                    names = [node.module]
                offenders += [
                    f"{path.relative_to(REPO_ROOT)}: {name}" for name in names
                    if name.split(".")[0] in ARCHIVED_PACKAGES or name.startswith("archive")
                ]
    assert not offenders, offenders
