"""scripts/hook_scope.py -- decide which check.ps1 stages a push needs.

Used by .githooks/pre-push. Reads changed paths (one per line) on stdin and
prints one line of flags: ``python=<0|1> typescript=<0|1>``.

Rules, per path (forward slashes, repo-relative):
  * docs/** and top-level *.md      -> no stage
  * ts/**                           -> TypeScript stage only
  * *.py, pyproject.toml, uv.lock   -> Python stage only
  * anything else (Lua, yaml, hooks, check.ps1, ...) -> both stages (fail safe)
No paths at all -> both stages (fail safe; the hook handles "nothing changed").
"""
from __future__ import annotations

import sys
from typing import Iterable, NamedTuple


class Scope(NamedTuple):
    python: bool
    typescript: bool


_PY_FILES = {"pyproject.toml", "uv.lock", "conftest.py"}


def classify_path(path: str) -> Scope:
    p = path.strip().replace("\\", "/")
    if p.startswith("docs/") or (p.endswith(".md") and "/" not in p):
        return Scope(False, False)
    if p.startswith("ts/"):
        return Scope(False, True)
    if p.endswith(".py") or p in _PY_FILES:
        return Scope(True, False)
    return Scope(True, True)


def classify(paths: Iterable[str]) -> Scope:
    py = ts = False
    seen = False
    for path in paths:
        if not path.strip():
            continue
        seen = True
        s = classify_path(path)
        py, ts = py or s.python, ts or s.typescript
    if not seen:
        return Scope(True, True)
    return Scope(py, ts)


def main() -> int:
    s = classify(sys.stdin.read().splitlines())
    print(f"python={int(s.python)} typescript={int(s.typescript)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
