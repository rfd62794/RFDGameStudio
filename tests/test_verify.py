"""test_verify.py — Regression tests for the embedUrl deploy verification pipeline.

These tests use Playwright's Chromium browser and are slower than the pure
unit tests. They verify both Tier 1 (asset presence) and Tier 2 (headless
render) in an isolated temporary static site.
"""

from __future__ import annotations

import tempfile
from pathlib import Path

import pytest

from studio_mcp import verify as verify_module
from studio_mcp.verify import check_http_reachable, get_embed_games, verify_arcade_deploy


# ---------------------------------------------------------------------------
# Registry parsing
# ---------------------------------------------------------------------------


def test_get_embed_games_includes_embedded_games_and_lobby() -> None:
    games = get_embed_games()
    game_ids = {g["game_id"] for g in games}
    assert "ledger" in game_ids
    assert "trinity_siege" in game_ids
    assert "slimebreeder" in game_ids
    assert "voiddrift" in game_ids
    assert "arcade" in game_ids
    assert "shoal" not in game_ids


# ---------------------------------------------------------------------------
# Tier 1 — asset reachability
# ---------------------------------------------------------------------------


def test_check_http_reachable_catches_missing_assets() -> None:
    with tempfile.TemporaryDirectory() as td:
        public = Path(td) / "arcade" / "ledger"
        public.mkdir(parents=True)
        html = (
            '<!doctype html><html><head>'
            '<script type="module" src="/arcade/ledger/assets/missing.js"></script>'
            '<link rel="stylesheet" href="/arcade/ledger/assets/missing.css">'
            '</head><body><div id="root"></div></body></html>'
        )
        (public / "index.html").write_text(html, encoding="utf-8")

        result = check_http_reachable("/arcade/ledger/", public)

        assert result["ok"] is False
        assert result["missing_assets"] == [
            "/arcade/ledger/assets/missing.js",
            "/arcade/ledger/assets/missing.css",
        ]


def test_check_http_reachable_passes_for_valid_assets() -> None:
    with tempfile.TemporaryDirectory() as td:
        public = Path(td) / "arcade" / "demo"
        public.mkdir(parents=True)
        assets = public / "assets"
        assets.mkdir()
        (assets / "index.js").write_text("console.log('ok');", encoding="utf-8")
        (assets / "index.css").write_text("body{}", encoding="utf-8")
        html = (
            '<!doctype html><html><head>'
            '<script type="module" src="/arcade/demo/assets/index.js"></script>'
            '<link rel="stylesheet" href="/arcade/demo/assets/index.css">'
            '</head><body><div id="root">hello</div></body></html>'
        )
        (public / "index.html").write_text(html, encoding="utf-8")

        result = check_http_reachable("/arcade/demo/", public)

        assert result["ok"] is True
        assert result["missing_assets"] == []


# ---------------------------------------------------------------------------
# Tier 2 — headless render (slow, runs Chromium)
# ---------------------------------------------------------------------------


@pytest.mark.slow

def test_verify_arcade_deploy_runs_tier1_and_tier2(tmp_path, monkeypatch) -> None:
    """End-to-end: local HTTP server + Playwright over a tiny static demo."""
    public = tmp_path / "public"
    public.mkdir()
    demo = public / "arcade" / "demo"
    demo.mkdir(parents=True)
    assets = demo / "assets"
    assets.mkdir()
    (assets / "index.js").write_text(
        "document.getElementById('root').innerHTML = 'ok';",
        encoding="utf-8",
    )
    (assets / "index.css").write_text("body{}", encoding="utf-8")
    (demo / "index.html").write_text(
        '<!doctype html><html><head>'
        '<script type="module" src="/arcade/demo/assets/index.js"></script>'
        '<link rel="stylesheet" href="/arcade/demo/assets/index.css">'
        '</head><body><div id="root"></div></body></html>',
        encoding="utf-8",
    )

    monkeypatch.setattr(
        verify_module,
        "get_embed_games",
        lambda: [{"game_id": "demo", "embed_url": "/arcade/demo/"}],
    )
    monkeypatch.setattr(verify_module, "SCREENSHOT_DIR", tmp_path / "screenshots")

    result = verify_arcade_deploy(public, include_render=True)

    assert result["ok"] is True
    assert result["games"]["demo"]["http"]["ok"] is True
    assert result["games"]["demo"]["render"]["ok"] is True
    assert result["games"]["demo"]["render"]["root_has_content"] is True
    assert (tmp_path / "screenshots" / "demo.png").exists()
