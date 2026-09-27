"""Regenerate the resolve_source baseline fixture for
studio_mcp/import_fixer/tests/test_source_resolver_unchanged.py.

Writes repo-relative paths so the baseline is portable across checkouts
and worktrees. Re-run this after any deliberate change to the registry,
the examples/ tree, or intake/ state, then commit the updated fixture.

    uv run python scripts/regen_resolve_source_baseline.py
"""

import json
import re
from pathlib import Path

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
    registry_text = (REPO_ROOT / "ts" / "src" / "games" / "registry.ts").read_text(encoding="utf-8")
    imports = re.findall(
        r"import\s+\{?\s*([A-Za-z0-9_]+)\s*\}?\s+from\s+['\"]([^'\"]+)['\"]",
        registry_text,
    )
    config_dir = REPO_ROOT / "ts" / "src" / "games"
    slugs: list[str] = []
    for _, module_path in imports:
        base = config_dir / module_path.lstrip("./")
        config_path = base.parent / (base.name + ".ts")
        if not config_path.exists():
            config_path = base.parent / (base.name + ".tsx")
            if not config_path.exists():
                continue
        text = config_path.read_text(encoding="utf-8")
        m = re.search(r"gameId:\s*['\"]([^'\"]+)['\"]", text)
        if m:
            slugs.append(m.group(1))
    return slugs


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
