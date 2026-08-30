"""Generate the Phase 1 Pipeline Audit Report using real collectors and the live observed test floors."""

import json
from pathlib import Path

from studio_mcp.pipeline_audit.floor_runner import parse_pytest_summary, parse_vitest_summary
from studio_mcp.pipeline_audit.known_issues import check_known_issues
from studio_mcp.pipeline_audit.repo_state import read_repo_state
from studio_mcp.pipeline_audit.report import _format_as_markdown
from studio_mcp.pipeline_audit.zip_inventory import read_zip_inventory

REPO_ROOT = Path(__file__).resolve().parent

# Live observed floors from this session (not stale numbers from the directive).
PYTEST_LOG = """==== 588 passed, 1 failed, 31 deselected, 8 warnings in 123.26s (0:02:03) ===="""
VITEST_LOG = """Test Files  2 failed | 132 passed (134)\nTests  2 failed | 1644 passed (1646)"""

repo_state = read_repo_state()
registry_ids = {g["id"] for g in repo_state["games"]}
zip_inventory = read_zip_inventory(registry_game_ids=registry_ids)
known_issues = check_known_issues()

report = {
    "timestamp": "2026-08-30T17:05:00-04:00",
    "repo_state": repo_state,
    "zip_inventory": zip_inventory,
    "known_issues": known_issues,
    "floors": {
        "python": {"cmd": "uv run pytest -m \"not slow\"", "raw_log": PYTEST_LOG, **parse_pytest_summary(PYTEST_LOG)},
        "typescript": {"cmd": "npx vitest run", "raw_log": VITEST_LOG, **parse_vitest_summary(VITEST_LOG)},
    },
}

report_path = REPO_ROOT / "docs" / "state" / "PipelineAuditReport.md"
report_path.parent.mkdir(parents=True, exist_ok=True)
report_path.write_text(_format_as_markdown(report), encoding="utf-8")
report_path.with_suffix(".json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(f"Wrote {report_path}")
