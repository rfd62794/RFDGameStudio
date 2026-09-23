"""Tests for report.py / ZipVerifier."""

from pathlib import Path
from zipfile import ZipFile

import pytest

from studio_mcp.zip_verify.report import ZipVerifier


class FakeClient:
    def __init__(self, content: str = "UNVERIFIABLE\nNo issues found."):
        self.content = content
        self.model = "fake-model"

    def complete(self, messages, temperature=0.1):
        return {"choices": [{"message": {"content": self.content}}]}

    def get_content(self, response):
        return response["choices"][0]["message"]["content"]


def test_report_writes_real_markdown(tmp_path: Path):
    zip_path = tmp_path / "demo-project_v0.1.0R1.zip"
    with ZipFile(zip_path, "w") as zf:
        zf.writestr("src/App.tsx", "function App() { return null; }")
        zf.writestr("docs/state/current.md", "Phase complete.")

    out_dir = tmp_path / "reports"
    verifier = ZipVerifier(zip_path, client=FakeClient())
    report_path = verifier.write_report(out_dir=out_dir)

    assert report_path.exists()
    text = report_path.read_text(encoding="utf-8")
    assert "Zip Verification Report" in text
    assert "demo-project" in text
    assert "UNVERIFIABLE" in text
    assert "## Component Findings" in text
