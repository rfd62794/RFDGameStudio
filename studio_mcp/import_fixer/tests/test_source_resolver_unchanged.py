"""Test that source_resolver.py's resolve_source() is unchanged for all
30 real registry slugs after adding the tracking-agnostic finder."""

from __future__ import annotations

import json
import re
from pathlib import Path

from studio_mcp.zip_verify.source_resolver import resolve_source, find_examples_dir_untracked

REPO_ROOT = Path(__file__).resolve().parents[3]


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


def test_source_resolver_unchanged_for_all_30_slugs():
    """resolve_source() output must be identical to the captured baseline
    for all 30 real registry slugs."""
    baseline_path = REPO_ROOT / "_resolve_source_before.json"
    assert baseline_path.exists(), "Baseline file _resolve_source_before.json not found"
    baseline = json.loads(baseline_path.read_text(encoding="utf-8"))

    slugs = _get_registry_slugs()
    assert len(slugs) == 30, f"Expected 30 slugs, got {len(slugs)}"

    for slug in slugs:
        r = resolve_source(slug)
        actual = {
            "source_type": r["source_type"].value,
            "intake_dir": str(r["intake_dir"]) if r["intake_dir"] else None,
            "examples_dir": str(r["examples_dir"]) if r["examples_dir"] else None,
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
