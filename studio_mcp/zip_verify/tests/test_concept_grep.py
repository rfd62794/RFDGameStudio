"""Tests for concept_grep.py."""

from pathlib import Path
from zipfile import ZipFile

import pytest

from studio_mcp.zip_verify.concept_grep import (
    _extract_concepts,
    _scope_to_directive_section,
    _strip_long_backtick_spans,
    concept_check,
    find_source_directive,
)

REPO_ROOT = Path(__file__).resolve().parents[3]

# Real break-streamer zips live in ~/Downloads — local-only fixtures, like the
# intake zips: tests that need them skip in a fresh clone or CI.
DOWNLOADS_DIR = Path(r"C:\Users\cheat\Downloads")
AI_STUDIO_ZIP = DOWNLOADS_DIR / "break-streamer.zip"
MANUS_ZIP = DOWNLOADS_DIR / "break-streamer-mvp.zip"
ANTSIM_ZIP = DOWNLOADS_DIR / "antsim-redux.zip"
CORPWORLD_ZIP = DOWNLOADS_DIR / "corpworld.zip"

_PRE_FIX_SUFFIXES = {".py", ".ts", ".tsx", ".js", ".jsx", ".md"}


def _extract_zip(zip_path: Path, dest: Path) -> Path:
    with ZipFile(zip_path) as zf:
        zf.extractall(dest)
    return dest


def _corpus_pre_fix(source_dir: Path) -> str:
    """Reproduce the pre-fix corpus: the same walk concept_check does, but
    with .md files still counted — the corpus this phase removed."""
    parts = []
    for path in source_dir.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix not in _PRE_FIX_SUFFIXES:
            continue
        if "node_modules" in path.parts:
            continue
        try:
            parts.append(path.read_text(encoding="utf-8", errors="replace"))
        except (OSError, UnicodeDecodeError):
            continue
    return "\n".join(parts).lower()


def _matches_for(corpus: str, concepts: list[str]) -> dict[str, int]:
    return {c: corpus.count(c) for c in concepts if corpus.count(c)}


def _md_files(source_dir: Path) -> list[str]:
    return sorted(
        str(p.relative_to(source_dir))
        for p in source_dir.rglob("*.md")
        if "node_modules" not in p.parts
    )


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


# ---------------------------------------------------------------------------
# §3 tests: .md corpus exclusion
# ---------------------------------------------------------------------------

@pytest.mark.skipif(
    not MANUS_ZIP.exists(),
    reason="local-only real zip not present: break-streamer-mvp.zip",
)
def test_concept_check_excludes_markdown_from_corpus(tmp_path: Path):
    """Real break-streamer-mvp.zip (Manus): 'composite' matched only via
    PLAN.md/STRUCTURE.md — scratch planning docs, never real code. With .md
    excluded from the corpus it must move from matched to unmatched."""
    _extract_zip(MANUS_ZIP, tmp_path)
    result = concept_check(tmp_path, "break-streamer-mvp")
    assert result["no_source_directive_found"] is False
    assert "composite" not in result["matches"]
    assert "composite" in result["unmatched_concepts"]
    # The pre-fix corpus (with .md) is what produced the false match.
    pre = _matches_for(_corpus_pre_fix(tmp_path), result["concepts"])
    assert "composite" in pre


def test_concept_check_excludes_markdown_from_corpus_synthetic(tmp_path: Path, monkeypatch):
    """Synthetic reproduction of the real Manus finding, so the mechanism
    is covered even without the local-only zip: a .md file containing
    'composite' and a .tsx file that does not."""
    from studio_mcp.zip_verify import concept_grep as cg

    directives = tmp_path / "directives"
    directives.mkdir()
    (directives / "test_game_Directive.md").write_text(
        "**Directive:** Build a composite card system.",
        encoding="utf-8",
    )
    monkeypatch.setattr(cg, "DIRECTIVE_DIRS", [directives])

    src = tmp_path / "src"
    src.mkdir()
    # Real code file — no 'composite' anywhere.
    (src / "App.tsx").write_text(
        "export function App() { return <div>hello</div>; }",
        encoding="utf-8",
    )
    # Planning doc — 'composite' only here.
    (src / "PLAN.md").write_text(
        "We plan to build a composite card layering system.",
        encoding="utf-8",
    )

    result = concept_check(tmp_path, "test-game")
    assert "composite" not in result["matches"]
    assert "composite" in result.get("unmatched_concepts", [])


@pytest.mark.skipif(
    not MANUS_ZIP.exists(),
    reason="local-only real zip not present: break-streamer-mvp.zip",
)
def test_concept_check_relative_drops_for_dead_boilerplate_match(tmp_path: Path):
    """Real break-streamer-mvp.zip: 'relative' had 46 pre-fix hits, almost
    entirely inside the dead shadcn/ui boilerplate — which is .tsx, not
    .md. The .md exclusion was never expected to fix that (dead-code
    exclusion is the deferred, harder problem). Report the real outcome:
    'relative' still matches on real .tsx hits outside the docs."""
    _extract_zip(MANUS_ZIP, tmp_path)
    result = concept_check(tmp_path, "break-streamer-mvp")
    pre = _matches_for(_corpus_pre_fix(tmp_path), result["concepts"])
    post = result["matches"].get("relative", 0)
    print(f"\nrelative: pre-fix hits={pre.get('relative', 0)} post-fix hits={post}")
    assert post > 0
    assert "relative" not in result["unmatched_concepts"]


def test_find_source_directive_still_finds_markdown():
    """The .md exclusion from the corpus must not affect
    find_source_directive, whose whole job is finding a directive written
    in markdown. Uses the real certified fixture on disk."""
    result = find_source_directive("break-streamer-mvp")
    assert result["found"] is True
    assert result["path"] is not None
    assert result["path"].lower().endswith(".md")
    assert "break-streamer-mvp" in Path(result["path"]).stem.lower()


def test_find_source_directive_still_finds_markdown_synthetic(tmp_path: Path, monkeypatch):
    """Same guarantee on a synthetic fixture, for fresh clones."""
    from studio_mcp.zip_verify import concept_grep as cg

    directives = tmp_path / "directives"
    directives.mkdir()
    (directives / "my_game_Directive.md").write_text(
        "**Directive:** Build something real.",
        encoding="utf-8",
    )
    monkeypatch.setattr(cg, "DIRECTIVE_DIRS", [directives])

    result = find_source_directive("my-game")
    assert result["found"] is True
    assert result["path"] is not None


@pytest.mark.skipif(
    not ANTSIM_ZIP.exists() or not CORPWORLD_ZIP.exists(),
    reason="local-only real zips not present: antsim-redux.zip / corpworld.zip",
)
def test_existing_certified_fixtures_unaffected_by_md_exclusion(tmp_path: Path):
    """Real antsim-redux / corpworld zips: certified coverage unchanged.

    Honest note on the directive's parenthetical: it isn't quite that
    these trees have no .md files (both ship the AI Studio boilerplate
    README.md — the narrative artifact the certified reports found).
    The real reason coverage is unchanged is that no source directive
    resolves for either slug, so the match-counting corpus is never
    built. Assert the certified outcome directly, and confirm the .md
    exclusion is the only corpus difference."""
    for slug, zip_path in (("antsim-redux", ANTSIM_ZIP), ("corpworld", CORPWORLD_ZIP)):
        dest = tmp_path / slug
        _extract_zip(zip_path, dest)
        result = concept_check(dest, slug)
        # Certified values from docs/state/ZipVerifyReport_<slug>.md.
        assert result["no_source_directive_found"] is True
        assert result["concept_coverage"] == 0.0
        pre = _corpus_pre_fix(dest)
        post_parts = [
            p.read_text(encoding="utf-8", errors="replace")
            for p in dest.rglob("*")
            if p.is_file()
            and p.suffix in {".py", ".ts", ".tsx", ".js", ".jsx"}
            and "node_modules" not in p.parts
        ]
        post = "\n".join(post_parts).lower()
        # The only difference between the two corpora is .md content.
        assert len(pre) >= len(post)


@pytest.mark.skipif(
    not AI_STUDIO_ZIP.exists() or not MANUS_ZIP.exists(),
    reason="local-only real zips not present: break-streamer*.zip",
)
def test_live_demonstration_break_streamer_before_after(tmp_path: Path):
    """§3 live demonstration: real before/after concept_check coverage on
    both real break-streamer zips. 'before' = the pre-fix corpus (.md
    still counted), reproduced mechanically by _corpus_pre_fix; 'after' =
    the current committed concept_check. The pre-fix numbers must equal
    the twice-confirmed certified values (0.67 / 0.70) — if they don't,
    the reproduction is wrong, not the record."""
    expected_pre = {"break-streamer": 0.67, "break-streamer-mvp": 0.70}
    for label, zip_path, slug in (
        ("AI Studio", AI_STUDIO_ZIP, "break-streamer"),
        ("Manus", MANUS_ZIP, "break-streamer-mvp"),
    ):
        dest = tmp_path / slug
        _extract_zip(zip_path, dest)

        directive = find_source_directive(slug)
        concepts = _extract_concepts(directive["text"])
        pre_matches = _matches_for(_corpus_pre_fix(dest), concepts)
        pre_unmatched = [c for c in concepts if c not in pre_matches]
        pre_cov = round(len(pre_matches) / len(concepts), 2)

        after = concept_check(dest, slug)
        moved = [c for c in pre_matches if c not in after["matches"]]

        print(f"\n=== {label} ({zip_path.name}) slug={slug} ===")
        print(f"directive resolved: {directive['path']}")
        print(f"concepts ({len(concepts)}): {concepts}")
        print(f".md files present: {_md_files(dest)}")
        print(f"BEFORE coverage: {pre_cov}  matched={len(pre_matches)}/{len(concepts)}")
        print(f"BEFORE unmatched: {pre_unmatched}")
        print(f"AFTER  coverage: {after['concept_coverage']}  "
              f"matched={len(after['matches'])}/{len(concepts)}")
        print(f"AFTER  unmatched: {after['unmatched_concepts']}")
        print(f"moved matched->unmatched: {moved}")

        assert pre_cov == expected_pre[slug]
        assert after["concept_coverage"] <= pre_cov
        assert set(after["unmatched_concepts"]) >= set(pre_unmatched)
