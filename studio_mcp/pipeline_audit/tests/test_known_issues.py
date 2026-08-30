"""Tests for known_issues.py."""

from pathlib import Path

import pytest

from studio_mcp.pipeline_audit.known_issues import (
    check_ensure_node_modules,
    check_cross_pipeline_version_tracking,
)


def test_check_ensure_node_modules_reports_fixed_when_npm_install_present(tmp_path: Path):
    tools = tmp_path / "tools.py"
    tools.write_text(
        "def _ensure_node_modules(examples_dir):\n"
        '    """Return node_modules path."""\n'
        "    if not package_json.exists():\n"
        "        return None\n"
        "    subprocess.run(['npm', 'install'])\n"
        "    return node_modules\n",
        encoding="utf-8",
    )
    result = check_ensure_node_modules(tools)
    assert result["status"] == "fixed"
    assert result["runs_npm_install"] is True
    assert result["returns_none_on_no_match"] is True


def test_check_ensure_node_modules_reports_not_fixed_when_no_npm_install(tmp_path: Path):
    tools = tmp_path / "tools.py"
    tools.write_text(
        "def _ensure_node_modules(examples_dir):\n"
        '    """Return node_modules path."""\n'
        "    return None\n",
        encoding="utf-8",
    )
    result = check_ensure_node_modules(tools)
    assert result["status"] == "not_fixed"
    assert result["runs_npm_install"] is False


def test_check_ensure_node_modules_reports_real_state(tmp_path: Path):
    """The real repo state should be reported accurately, whatever it is."""
    result = check_ensure_node_modules()
    assert result["status"] in {"fixed", "not_fixed", "unknown"}
    if result["status"] == "fixed":
        assert result["runs_npm_install"] is True


def test_check_cross_pipeline_counts_strings(tmp_path: Path):
    repo = tmp_path / "repo"
    repo.mkdir()
    (repo / "a.py").write_text("_is_dist_stale = True\n--userversion\n", encoding="utf-8")
    publishing = tmp_path / "pub"
    publishing.mkdir()
    (publishing / "b.py").write_text("deployed_version = '1.0'\n", encoding="utf-8")

    result = check_cross_pipeline_version_tracking(repo, publishing)
    assert result["repo_counts"]["_is_dist_stale"] == 1
    assert result["repo_counts"]["--userversion"] == 1
    assert result["repo_counts"]["deployed_version"] == 0
    assert result["publishing_counts"]["deployed_version"] == 1
    assert result["status"] == "fixed"


def test_check_cross_pipeline_reports_real_state():
    result = check_cross_pipeline_version_tracking()
    assert "repo_counts" in result
    assert "publishing_counts" in result
    assert result["status"] in {"fixed", "partial", "not_fixed"}
