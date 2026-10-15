"""Path-scoping logic behind .githooks/pre-push stage selection."""
from __future__ import annotations

import importlib.util
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "hook_scope", Path(__file__).resolve().parents[1] / "scripts" / "hook_scope.py"
)
hook_scope = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(hook_scope)
classify = hook_scope.classify


def test_ts_only_runs_only_typescript():
    assert classify(["ts/src/a.ts", "ts/tests/b.ts"]) == (False, True)


def test_python_only_runs_only_python():
    assert classify(["studio/x.py", "tests/test_x.py", "uv.lock"]) == (True, False)


def test_docs_only_runs_nothing():
    assert classify(["docs/a.md", "README.md"]) == (False, False)


def test_mixed_runs_both():
    assert classify(["ts/a.ts", "studio/x.py"]) == (True, True)


def test_unknown_paths_fail_safe_to_both():
    assert classify(["games/x/main.lua"]) == (True, True)
    assert classify([".githooks/pre-push"]) == (True, True)
    assert classify(["scripts/check.ps1"]) == (True, True)


def test_nested_md_is_not_docs():
    assert classify(["games/x/NOTES.md"]) == (True, True)


def test_empty_fails_safe():
    assert classify([]) == (True, True)


def test_windows_separators():
    assert classify(["ts\src\a.ts"]) == (False, True)
