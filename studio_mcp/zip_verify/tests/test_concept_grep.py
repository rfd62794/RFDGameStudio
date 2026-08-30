"""Tests for concept_grep.py."""

from pathlib import Path

from studio_mcp.zip_verify.concept_grep import concept_check, find_source_directive


def test_find_source_directive_reports_missing():
    result = find_source_directive("nonexistent-slug-xyz")
    assert result["found"] is False


def test_concept_grep_reports_missing_source_directive(tmp_path: Path):
    result = concept_check(tmp_path, "nonexistent-slug-xyz")
    assert result["no_source_directive_found"] is True
    assert result["concept_coverage"] == 0.0


def test_concept_grep_finds_concepts_when_directive_present(tmp_path: Path, monkeypatch):
    from studio_mcp.zip_verify import concept_grep as cg

    directives = tmp_path / "directives"
    directives.mkdir()
    (directives / "demo_project_directive.md").write_text(
        "The directive asks for a robust pheromone trail system and worker aging mechanics.",
        encoding="utf-8",
    )
    monkeypatch.setattr(cg, "DIRECTIVE_DIRS", [directives])

    src = tmp_path / "src"
    src.mkdir()
    (src / "simulation.ts").write_text(
        "function updatePheromoneTrail() {} function applyWorkerAging() {}",
        encoding="utf-8",
    )

    result = concept_check(tmp_path, "demo-project")
    assert result["no_source_directive_found"] is False
    assert result["concept_coverage"] > 0
    assert "pheromone" in result["matches"] or "trail" in result["matches"]
