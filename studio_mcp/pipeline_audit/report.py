"""report.py — assemble repo_state, floor_runner, zip_inventory and known_issues into one report."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .floor_runner import (
    TS_LOG_FILENAME,
    TS_PID_FILENAME,
    LOG_FILENAME,
    PID_FILENAME,
    collect_test_log,
    parse_pytest_summary,
    parse_vitest_summary,
    start_test_run,
)
from .known_issues import check_known_issues
from .repo_state import read_repo_state
from .zip_inventory import read_zip_inventory

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
REPORT_PATH = REPO_ROOT / "docs" / "state" / "PipelineAuditReport.md"


def _build_registry_game_ids(repo_state: dict) -> set[str]:
    return {g["id"] for g in repo_state.get("games", [])}


def _format_as_markdown(report: dict) -> str:
    ts = report["timestamp"]
    lines = [
        "# Pipeline Audit Report",
        "",
        f"**Generated:** {ts}",
        "",
        "## Summary",
        "",
        f"- Registry entries: {report['repo_state']['game_count']}",
        f"- Example directories: {len(report['repo_state']['examples'])}",
        f"- AI Studio zip exports: {report['zip_inventory']['total_exports']}",
        f"- Unimported zip exports: {report['zip_inventory']['pending']}",
        "",
        "## Test Floors",
        "",
        "### Python (`pytest`)",
        "",
        f"- Command: `{report['floors']['python']['cmd']}`",
        f"- Passed: {report['floors']['python']['passed']}",
        f"- Failed: {report['floors']['python']['failed']}",
        f"- Skipped: {report['floors']['python']['skipped']}",
        f"- Certified: {report['floors']['python']['certified']}",
        "",
        "### TypeScript (`vitest`)",
        "",
        f"- Command: `{report['floors']['typescript']['cmd']}`",
        f"- Passed: {report['floors']['typescript']['passed']}",
        f"- Failed: {report['floors']['typescript']['failed']}",
        f"- Skipped: {report['floors']['typescript']['skipped']}",
        f"- Certified: {report['floors']['typescript']['certified']}",
        "",
        "## Registry",
        "",
        "| Game ID | Pipeline Stage | Tracked | Version | Created | Last Updated |",
        "|---|---|---|---|---|---|",
    ]
    for game in report["repo_state"]["games"]:
        lines.append(
            f"| {game['id']} | {game.get('pipeline_stage', 'ai_studio')} | "
            f"{game.get('tracked', False)} | {game.get('version', '0.1.0')} | "
            f"{game.get('created', '')} | {game.get('last_updated', '')} |"
        )

    lines.extend([
        "",
        "## Examples Directories",
        "",
    ])
    for name in report["repo_state"]["examples"]:
        lines.append(f"- `{name}`")

    lines.extend([
        "",
        "## Zip Inventory",
        "",
        "| Slug | Version | Created | Imported | Game ID | Path |",
        "|---|---|---|---|---|---|",
    ])
    for export in report["zip_inventory"]["exports"]:
        lines.append(
            f"| {export['slug']} | {export['version']} | {export['created']} | "
            f"{export['imported']} | {export['game_id'] or ''} | `{export['path']}` |"
        )

    if report["zip_inventory"]["pending_exports"]:
        lines.extend(["", "### Pending imports (no matching registry entry)", ""])
        for export in report["zip_inventory"]["pending_exports"]:
            lines.append(
                f"- `{export['slug']}` v{export['version']} at `{export['path']}`"
            )

    issues = report["known_issues"]
    lines.extend([
        "",
        "## Known Issues",
        "",
        f"### _ensure_node_modules",
        "",
        f"- Status: `{issues['ensure_node_modules']['status']}`",
        f"- Runs `npm install`: {issues['ensure_node_modules']['runs_npm_install']}",
        f"- Returns `None` on missing package.json: {issues['ensure_node_modules']['returns_none_on_no_match']}",
        f"- Details: {issues['ensure_node_modules']['details']}",
        "",
        f"### CrossPipeline Version Tracking",
        "",
        f"- Status: `{issues['cross_pipeline_version_tracking']['status']}`",
        f"- Total hits: {issues['cross_pipeline_version_tracking']['total_hits']}",
        "",
        "**RFDGameStudio hits:**",
    ])
    for s, count in issues["cross_pipeline_version_tracking"]["repo_counts"].items():
        lines.append(f"- `{s}`: {count}")

    lines.append("", "**RFD_IT_Publishing hits:**")
    for s, count in issues["cross_pipeline_version_tracking"]["publishing_counts"].items():
        lines.append(f"- `{s}`: {count}")

    lines.append(f"\n- Details: {issues['cross_pipeline_version_tracking']['details']}")
    lines.append("")

    return "\n".join(lines)


class PipelineAuditor:
    """Read-only auditor for the AI-Studio-to-Arcade pipeline."""

    def __init__(self, repo_root: Path | str | None = None):
        self.repo_root = Path(repo_root or REPO_ROOT).resolve()
        self.report_path = self.repo_root / "docs" / "state" / "PipelineAuditReport.md"

    def collect(
        self,
        python_cmd: str = "uv run pytest",
        typescript_cmd: str = "npx vitest run",
        python_timeout: float = 300.0,
        typescript_timeout: float = 300.0,
    ) -> dict[str, Any]:
        """Run the full read-only audit and return a structured report."""
        repo_state = read_repo_state()
        registry_ids = _build_registry_game_ids(repo_state)
        zip_inventory = read_zip_inventory(registry_game_ids=registry_ids)
        known_issues_result = check_known_issues()

        py_start = start_test_run(self.repo_root, python_cmd, LOG_FILENAME, PID_FILENAME)
        ts_start = start_test_run(
            self.repo_root,
            typescript_cmd,
            TS_LOG_FILENAME,
            TS_PID_FILENAME,
            cwd=self.repo_root / "ts",
        )

        py_log = collect_test_log(
            py_start.get("log_path") if py_start["status"] == "started" else None,
            py_start.get("pid"),
            python_timeout,
        )
        ts_log = collect_test_log(
            ts_start.get("log_path") if ts_start["status"] == "started" else None,
            ts_start.get("pid"),
            typescript_timeout,
        )

        py_summary = parse_pytest_summary(py_log)
        ts_summary = parse_vitest_summary(ts_log)

        report = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "repo_state": repo_state,
            "zip_inventory": zip_inventory,
            "known_issues": known_issues_result,
            "floors": {
                "python": {
                    "cmd": python_cmd,
                    "raw_log": py_log,
                    **py_summary,
                },
                "typescript": {
                    "cmd": typescript_cmd,
                    "raw_log": ts_log,
                    **ts_summary,
                },
            },
        }
        return report

    def write_report(self, report: dict[str, Any] | None = None) -> Path:
        """Write the structured report as JSON and Markdown to docs/state."""
        if report is None:
            report = self.collect()

        self.report_path.parent.mkdir(parents=True, exist_ok=True)
        json_path = self.report_path.with_suffix(".json")
        json_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
        self.report_path.write_text(_format_as_markdown(report), encoding="utf-8")
        return self.report_path


if __name__ == "__main__":
    path = PipelineAuditor().write_report()
    print(f"Wrote report to {path}")
