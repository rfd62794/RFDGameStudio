from types import SimpleNamespace

from studio_mcp import tools


def _runner(codes):
    calls = []

    def run(cmd, **kwargs):
        calls.append((cmd, kwargs["cwd"]))
        return SimpleNamespace(returncode=codes[len(calls) - 1], stdout="out", stderr="")

    return run, calls


def test_runs_export_then_inject_then_health_check():
    run, calls = _runner([0, 0, 0])
    result = tools._prepare_site_arcade(run=run)
    assert result["ok"] is True
    assert [s["step"] for s in result["steps"]] == ["export_manifest", "inject_return", "check_arcade"]
    assert "export-arcade-manifest.ts" in calls[0][0]
    assert calls[0][1].endswith("ts")
    assert calls[1][0][-1] == "scripts/site/inject_return.py"
    assert calls[2][0][-1] == "scripts/site/check_arcade.py"


def test_stops_at_the_first_failing_step():
    run, calls = _runner([0, 1, 0])
    result = tools._prepare_site_arcade(run=run)
    assert result["ok"] is False
    assert len(calls) == 2
    assert result["steps"][-1]["returncode"] == 1
