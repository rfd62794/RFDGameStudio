"""test_dissonance_new_run_to_map.py — Permanent L3 E2E test for the
Dissonance Depths new-run-to-map flow.

Validates the second game in the two-game E2E coverage plan.
Dissonance is a phase-based card combat roguelike — structurally
different from SlimeWorld's persistent tab-based management sim.

Flow: Title -> New Run -> Opening Pack (flip all cards) -> Continue ->
Map phase renders with nodes visible. This proves the full phase
progression from fresh start through Lua-driven map generation.

Marked both `slow` (real browser + dev server) and `e2e` (new layer).
"""

from __future__ import annotations

import subprocess
import time
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright, expect

REPO_ROOT = Path(__file__).resolve().parents[2]
TS_DIR = REPO_ROOT / "ts"


def _wait_for_vite(port: int, timeout: float = 30.0) -> None:
    """Block until Vite dev server responds on the given port."""
    import urllib.request
    import urllib.error

    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            urllib.request.urlopen(f"http://localhost:{port}/", timeout=2)
            return
        except (urllib.error.URLError, ConnectionError, OSError):
            time.sleep(0.5)
    raise TimeoutError(f"Vite dev server did not start on port {port} within {timeout}s")


@pytest.fixture(scope="module")
def vite_server():
    """Start the Vite dev server on a fixed port and tear it down after tests."""
    port = 15174
    proc = subprocess.Popen(
        ["npx", "vite", "--port", str(port), "--strictPort"],
        cwd=str(TS_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        shell=True,
    )
    try:
        _wait_for_vite(port)
        yield f"http://localhost:{port}"
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()


@pytest.mark.slow
@pytest.mark.e2e
def test_dissonance_new_run_to_map(vite_server: str) -> None:
    """Full flow: Title -> New Run -> Opening Pack flip -> Continue -> Map."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        errors: list[str] = []
        page.on("pageerror", lambda err: errors.append(str(err)))

        try:
            # Clear any saved state so we get a fresh first-run experience
            page.goto(f"{vite_server}/?game=dissonance", wait_until="networkidle", timeout=30000)
            page.evaluate("localStorage.removeItem('dissonance_unlocked_cards')")
            page.evaluate("localStorage.removeItem('dissonance_saved_run')")
            page.reload(wait_until="networkidle", timeout=30000)

            # 1. Title phase — click "New Run"
            new_run_btn = page.locator("#new-run")
            expect(new_run_btn).to_be_visible(timeout=10000)
            new_run_btn.click()

            # 2. Opening phase — flip all cards then continue
            opening_phase = page.locator("#viewport-opening-phase")
            expect(opening_phase).to_be_visible(timeout=10000)

            # Flip cards one at a time until the continue button appears
            flip_btn = page.locator("#opening-flip-next-btn")
            while flip_btn.is_visible():
                flip_btn.click()
                page.wait_for_timeout(200)

            # 3. Click "Begin Run" to enter the map
            continue_btn = page.locator("#opening-continue-btn")
            expect(continue_btn).to_be_visible(timeout=5000)
            continue_btn.click()

            # 4. Map phase should now be visible
            map_phase = page.locator("#viewport-map-phase")
            expect(map_phase).to_be_visible(timeout=10000)

            # The map should have an "Enter" button for the first node
            enter_btn = page.locator("#map-enter-node-btn")
            expect(enter_btn).to_be_visible(timeout=5000)

            # Sanity: no page errors during the entire flow
            assert not errors, f"Unexpected page errors during E2E flow: {errors}"
        finally:
            # Clean up localStorage
            page.evaluate("localStorage.removeItem('dissonance_unlocked_cards')")
            page.evaluate("localStorage.removeItem('dissonance_saved_run')")
            browser.close()
