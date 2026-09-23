"""Tests for caller_check.py."""

from pathlib import Path

from studio_mcp.zip_verify.caller_check import caller_check


def test_caller_check_flags_unused_changed_function(tmp_path: Path):
    src = tmp_path / "src"
    src.mkdir()
    (src / "utils.ts").write_text(
        "function changedButUnused() { return 1; }\n",
        encoding="utf-8",
    )
    (src / "main.ts").write_text(
        "function main() { return 0; }\n",
        encoding="utf-8",
    )

    result = caller_check(tmp_path, ["changedButUnused", "main"])
    assert "changedButUnused" in result["unused_functions"]
    assert result["all_called"] is False


def test_caller_check_passes_called_function(tmp_path: Path):
    src = tmp_path / "src"
    src.mkdir()
    (src / "utils.ts").write_text("export function helper() { return 1; }\n")
    (src / "main.ts").write_text("import { helper } from './utils';\nhelper();\n")

    result = caller_check(tmp_path, ["helper"])
    assert result["all_called"] is True
    assert "helper" not in result["unused_functions"]
