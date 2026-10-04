"""Regenerate the resolve_source baseline fixture for
studio_mcp/import_fixer/tests/test_source_resolver_unchanged.py.

Writes repo-relative paths so the baseline is portable across checkouts
and worktrees. Re-run this after any deliberate change to the registry,
the examples/ tree, or intake/ state, then commit the updated fixture.

    uv run python scripts/regen_resolve_source_baseline.py
"""

import json
from pathlib import Path

from studio_mcp.demos.registry_files import registry_games
from studio_mcp.zip_verify.source_resolver import resolve_source

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT = (
    REPO_ROOT
    / "studio_mcp"
    / "import_fixer"
    / "tests"
    / "fixtures"
    / "resolve_source_baseline.json"
)


def get_registry_slugs() -> list[str]:
    return [r["id"] for r in registry_games(REPO_ROOT / "ts" / "src" / "games")]


def rel(p) -> str | None:
    return Path(p).relative_to(REPO_ROOT).as_posix() if p else None


def main() -> None:
    baseline: dict[str, dict] = {}
    for slug in get_registry_slugs():
        r = resolve_source(slug)
        baseline[slug] = {
            "source_type": r["source_type"].value,
            "intake_dir": rel(r["intake_dir"]),
            "examples_dir": rel(r["examples_dir"]),
            "resolved_examples_name": r["resolved_examples_name"],
        }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(baseline, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"wrote {OUT} ({len(baseline)} slugs)")


if __name__ == "__main__":
    main()
