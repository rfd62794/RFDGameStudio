"""test_generate_audit_report.py — on-demand generator for PipelineAuditReport.

Deliberately placed outside tests/ so the default suite (testpaths) never
collects it: collecting it inside a normal run would recurse, since the
report's floor runner spawns a full `uv run pytest` itself. Invoke directly:

    uv run pytest studio_mcp/pipeline_audit/test_generate_audit_report.py
"""

from __future__ import annotations

import os
from pathlib import Path

from studio_mcp.pipeline_audit.report import PipelineAuditor

_MAIN_CHECKOUT_INTAKE = Path(r"C:\Github\RFDGameStudio\intake")


def _resolve_intake_dir() -> Path | None:
    override = os.environ.get("PIPELINE_AUDIT_INTAKE_DIR")
    if override:
        return Path(override)
    if _MAIN_CHECKOUT_INTAKE.is_dir():
        return _MAIN_CHECKOUT_INTAKE
    return None


def test_generate_audit_report():
    auditor = PipelineAuditor()
    report = auditor.collect(
        python_cmd='uv run pytest -m "not slow"',
        python_timeout=1800.0,
        typescript_timeout=1800.0,
        intake_dir=_resolve_intake_dir(),
    )
    report_path = auditor.write_report(report)
    assert report_path.exists()
    assert report["floors"]["python"]["passed"] > 0
    assert report["floors"]["typescript"]["passed"] > 0
