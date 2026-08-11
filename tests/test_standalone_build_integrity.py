"""test_standalone_build_integrity.py — Permanent regression check for standalone builds.

Rebuilds every real standalone game from source, verifies the resulting
`dist-{gameId}` contains the required runtime files, and runs a headless
browser smoke test to confirm no runtime Lua-load warnings appear. This
catches the exact class of bug fixed for SlimeWorld: entry.tsx files that
fail to import (via import.meta.glob) all required Lua files.

These tests are intentionally slow (one full Vite build + browser launch
per game) and are therefore marked with `pytest.mark.slow`.
"""

from __future__ import annotations

import socketserver
import subprocess
import threading
from http.server import SimpleHTTPRequestHandler
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

REPO_ROOT = Path(__file__).resolve().parents[1]
TS_DIR = REPO_ROOT / "ts"
STANDALONE_DIR = TS_DIR / "src" / "standalone"
GAMES_DIR = REPO_ROOT / "games"

REQUIRED_YAML = ["data.yaml", "ui.yaml", "systems.yaml"]
ENGINE_PRIMITIVES = [
    "action.lua",
    "consequence.lua",
    "entity.lua",
    "lifecycle.lua",
    "movement.lua",
    "physics.lua",
    "resolution.lua",
]

BROKEN_SLIME_COIN_ENTRY = """import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/slime_coin/App';
import { buildStandaloneSession } from '../../engine/standaloneLoader';

import dataRaw from '../../../../games/slime_coin/data.yaml?raw';
import uiRaw from '../../../../games/slime_coin/ui.yaml?raw';
import systemsRaw from '../../../../games/slime_coin/systems.yaml?raw';
import logicRaw from '../../../../games/slime_coin/logic.lua?raw';

const gameId = 'slime_coin';

const session = buildStandaloneSession({
  gameId,
  dataRaw,
  uiRaw,
  systemsRaw,
  gameLuaFiles: { 'logic.lua': logicRaw },
  engineLuaFiles: {},
});

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App session={session} />);
}
"""


def list_game_ids() -> list[str]:
    """Return every game with both a standalone entry.tsx and a matching Vite config."""
    return sorted(
        d.name for d in STANDALONE_DIR.iterdir()
        if d.is_dir()
        and (d / "entry.tsx").exists()
        and (TS_DIR / f"vite.{d.name}.config.ts").exists()
    )


def run_vite_build(game_id: str) -> None:
    cmd = f"npx vite build --config vite.{game_id}.config.ts"
    result = subprocess.run(
        cmd,
        cwd=TS_DIR,
        shell=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="ignore",
    )
    assert result.returncode == 0, (
        f"Vite build failed for {game_id}:\nSTDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}"
    )


def assert_dist_files(game_id: str) -> None:
    dist = TS_DIR / f"dist-{game_id}"
    game_dist = dist / "games" / game_id
    engine_dir = dist / "engine" / "primitives"

    missing: list[str] = []
    for name in REQUIRED_YAML:
        if not (game_dist / name).exists():
            missing.append(f"games/{game_id}/{name}")
    for lua in (GAMES_DIR / game_id).glob("*.lua"):
        if not (game_dist / lua.name).exists():
            missing.append(f"games/{game_id}/{lua.name}")
    for name in ENGINE_PRIMITIVES:
        if not (engine_dir / name).exists():
            missing.append(f"engine/primitives/{name}")

    assert not missing, f"{game_id}: missing required files in dist: {missing}"


def run_headless_smoke(game_id: str) -> tuple[list[str], list[str]]:
    """Serve dist-{game_id} locally and return (warnings, errors)."""
    dist = TS_DIR / f"dist-{game_id}"

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(dist), **kwargs)

    server = socketserver.TCPServer(("127.0.0.1", 0), Handler)
    url = f"http://127.0.0.1:{server.server_address[1]}/"
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    warnings: list[str] = []
    errors: list[str] = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 640, "height": 360})
            page.on(
                "console",
                lambda msg: (
                    warnings.append(msg.text)
                    if msg.type == "warning"
                    else errors.append(msg.text)
                    if msg.type == "error"
                    else None
                ),
            )
            page.on("pageerror", lambda err: errors.append(str(err)))
            page.goto(url, wait_until="networkidle", timeout=20000)
            page.wait_for_timeout(1000)
            root_len = page.evaluate("document.getElementById('root')?.innerHTML.length || 0")
            assert root_len > 0, f"{game_id}: #root rendered no content"
            browser.close()
    finally:
        server.shutdown()

    return warnings, errors


@pytest.mark.slow
@pytest.mark.parametrize("game_id", list_game_ids())
def test_standalone_build_integrity(game_id: str) -> None:
    """Real rebuild + real file-count + real headless smoke check for every game."""
    run_vite_build(game_id)
    assert_dist_files(game_id)
    warnings, errors = run_headless_smoke(game_id)
    assert not errors, f"{game_id}: console/page errors: {errors}"
    standalone_warnings = [w for w in warnings if "[standaloneLoader]" in w]
    assert not standalone_warnings, (
        f"{game_id}: [standaloneLoader] warnings indicate missing Lua files: {standalone_warnings}"
    )


@pytest.mark.slow
def test_standalone_build_integrity_catches_broken_entry() -> None:
    """Deliberate regression test: a manual-import entry should produce warnings."""
    entry = STANDALONE_DIR / "slime_coin" / "entry.tsx"
    original = entry.read_text(encoding="utf-8")
    try:
        entry.write_text(BROKEN_SLIME_COIN_ENTRY, encoding="utf-8")
        run_vite_build("slime_coin")

        # The copy plugin still puts files on disk, so file-count alone is NOT enough.
        assert_dist_files("slime_coin")

        warnings, errors = run_headless_smoke("slime_coin")
        assert not errors, f"slime_coin (broken): unexpected errors: {errors}"
        standalone_warnings = [w for w in warnings if "[standaloneLoader]" in w]
        assert standalone_warnings, (
            "Expected [standaloneLoader] warnings when engine primitives are missing, got none. "
            f"All warnings: {warnings}"
        )
    finally:
        entry.write_text(original, encoding="utf-8")
        run_vite_build("slime_coin")
        assert_dist_files("slime_coin")
        warnings, errors = run_headless_smoke("slime_coin")
        assert not errors, f"slime_coin (restored): unexpected errors: {errors}"
        standalone_warnings = [w for w in warnings if "[standaloneLoader]" in w]
        assert not standalone_warnings, (
            f"slime_coin (restored): still has missing-Lua warnings: {standalone_warnings}"
        )
