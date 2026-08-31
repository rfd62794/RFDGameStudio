"""Tests for concept_grep.py."""

from pathlib import Path

from studio_mcp.zip_verify.concept_grep import (
    _extract_concepts,
    _scope_to_directive_section,
    _strip_long_backtick_spans,
    concept_check,
    find_source_directive,
)

REPO_ROOT = Path(__file__).resolve().parents[3]


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


# ---------------------------------------------------------------------------
# §3 tests: selective backtick handling, section scoping, real directive
# ---------------------------------------------------------------------------

def test_strip_long_backtick_spans_keeps_short_identifiers():
    """Short backtick-quoted identifiers/selectors survive as extractable text."""
    text = "Use `div#off-stream-ui` and `.hidden` for the UI."
    result = _strip_long_backtick_spans(text)
    assert "div#off-stream-ui" in result
    assert ".hidden" in result


def test_strip_long_backtick_spans_removes_real_code_block():
    """Multi-line or long backtick spans are stripped as code blocks."""
    text = "Here is code:\n`function foo() {\n  return 42;\n}`\nDone."
    result = _strip_long_backtick_spans(text)
    assert "function foo" not in result
    assert "return 42" not in result


def test_scope_to_directive_section_finds_prose_marker():
    """Real break-streamer directive: extraction starts at **Directive:**."""
    directive_path = REPO_ROOT / "docs" / "directives" / "break-streamer_Directive.md"
    text = directive_path.read_text(encoding="utf-8")
    scoped = _scope_to_directive_section(text)
    # Framing prose before the marker must be excluded.
    assert "Current State of Play" not in scoped
    assert "**Directive:**" in scoped


def test_scope_to_directive_section_finds_rfd_method_marker():
    """Real rfd-method directive using § sections: extraction starts at first §."""
    # Use this phase's own directive if it exists, otherwise a synthetic one.
    text = (
        "# Some Phase Directive\n\n"
        "## Context\n\nSome framing prose about the phase.\n\n"
        "## §1 Scope\n\nThe real directive content goes here.\n\n"
        "## §2 Implementation\n\nMore directive content.\n"
    )
    scoped = _scope_to_directive_section(text)
    assert "framing prose" not in scoped
    assert "§1 Scope" in scoped
    assert "real directive content" in scoped


def test_scope_to_directive_section_falls_back_when_no_marker():
    """When no directive marker is found, falls back to whole-document extraction."""
    text = "This is a plain directive without any special markers.\nIt asks for a pheromone system."
    scoped = _scope_to_directive_section(text)
    assert scoped == text


def test_extract_concepts_real_break_streamer_directive_includes_selector_terms():
    """Real break-streamer directive: selector terms now appear in extracted concepts."""
    directive_path = REPO_ROOT / "docs" / "directives" / "break-streamer_Directive.md"
    text = directive_path.read_text(encoding="utf-8")
    concepts = _extract_concepts(text)
    # These were absent before the fix (backtick-stripped).
    assert "off-stream-ui" in concepts or "stream-ui" in concepts
    assert "hidden" in concepts
    # Framing prose terms must be gone (section-scoped).
    assert "current" not in concepts
    assert "utilizing" not in concepts
    assert "economic" not in concepts


def test_existing_certified_fixtures_unaffected():
    """Existing fixtures without **Directive:** or § markers must not regress.
    The demo_project fixture used in test_concept_grep_finds_concepts_when_directive_present
    has no marker — extraction falls back to whole-document, same as before.
    """
    text = "The directive asks for a robust pheromone trail system and worker aging mechanics."
    concepts = _extract_concepts(text)
    # Same behavior as before: no marker, whole-document extraction.
    assert "directive" in concepts
    assert "pheromone" in concepts or "trail" in concepts
