"""Test that source_resolver.py's resolve_source() is unchanged for all
real registry slugs after adding the tracking-agnostic finder.

The baseline lives in tests/fixtures/resolve_source_baseline.json with
repo-relative paths so it is portable across checkouts and worktrees.
Regenerate it with scripts/regen_resolve_source_baseline.py after any
deliberate change to the registry, the examples/ tree, or intake/ state.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from studio_mcp.zip_verify.source_resolver import resolve_source, find_examples_dir_untracked

REPO_ROOT = Path(__file__).resolve().parents[3]
BASELINE_PATH = Path(__file__).resolve().parent / "fixtures" / "resolve_source_baseline.json"


def _get_registry_slugs() -> list[str]:
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


def test_source_resolver_unchanged_for_all_registry_slugs():
    """resolve_source() output must be identical to the captured baseline
    for every real registry slug."""
    assert BASELINE_PATH.exists(), (
        "Baseline file tests/fixtures/resolve_source_baseline.json not found; "
        "regenerate with scripts/regen_resolve_source_baseline.py"
    )
    baseline = json.loads(BASELINE_PATH.read_text(encoding="utf-8"))

    slugs = _get_registry_slugs()
    assert sorted(slugs) == sorted(baseline.keys()), (
        "Registry slugs differ from baseline keys — regenerate the fixture: "
        f"registry-only={sorted(set(slugs) - set(baseline))}, "
        f"baseline-only={sorted(set(baseline) - set(slugs))}"
    )

    def rel(p):
        return Path(p).relative_to(REPO_ROOT).as_posix() if p else None

    for slug in slugs:
        r = resolve_source(slug)
        actual = {
            "source_type": r["source_type"].value,
            "intake_dir": rel(r["intake_dir"]),
            "examples_dir": rel(r["examples_dir"]),
            "resolved_examples_name": r["resolved_examples_name"],
        }
        expected = baseline[slug]
        assert actual == expected, f"Mismatch for slug {slug}: {actual} vs {expected}"


def test_find_examples_dir_untracked_returns_list():
    """The new function returns a list, not a single Path or None."""
    result = find_examples_dir_untracked("planetforge")
    assert isinstance(result, list)
    # planetforge should have at least one candidate on disk.
    assert len(result) >= 1
