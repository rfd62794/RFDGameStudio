"""test_pipeline_status.py — Tests for scripts/pipeline_status.py.

Real anchor from RFDGameStudio_PipelineStageTracking_Directive.md §3:
  test_pipeline_status_report_groups_correctly
"""
from __future__ import annotations

import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


def test_pipeline_status_report_groups_correctly(tmp_path, monkeypatch) -> None:
    """Given a known real metadata fixture, the report's grouping and
    counts are correct."""
    import importlib
    import scripts.pipeline_status as pipeline_status

    fixture = {
        "brewfield": {"pipeline_stage": "website_collection", "pipeline_flag": "itch_push_regressed: test flag"},
        "shoal": {"pipeline_stage": "itch_published"},
        "voiddrift": {"pipeline_stage": "itch_published"},
        "horse_racing": {"pipeline_stage": "website_collection"},
        "some_new_game": {},  # no pipeline_stage key at all -> defaults to ai_studio
    }
    fixture_path = tmp_path / "game-metadata.json"
    fixture_path.write_text(json.dumps(fixture), encoding="utf-8")
    monkeypatch.setattr(pipeline_status, "METADATA_PATH", fixture_path)

    import io
    from contextlib import redirect_stdout

    buf = io.StringIO()
    with redirect_stdout(buf):
        pipeline_status.main()
    output = buf.getvalue()

    assert "ai_studio (1):" in output
    assert "some_new_game" in output
    assert "website_collection (2):" in output
    assert "brewfield" in output
    assert "horse_racing" in output
    assert "itch_published (2):" in output
    assert "shoal" in output
    assert "voiddrift" in output
    # Flag surfaced separately, not silently absorbed into a stage bucket
    assert "Flags needing attention:" in output
    assert "itch_push_regressed" in output
    # Flagged game still marked inline under its real current stage
    assert "brewfield  [!] FLAGGED" in output
