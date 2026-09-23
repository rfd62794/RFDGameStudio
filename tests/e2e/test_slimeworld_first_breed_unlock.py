"""test_slimeworld_first_breed_unlock.py — Permanent L3 E2E test for the
SlimeWorld first-breed-to-region-unlock flow.

Formalizes the real, already-validated ad-hoc check: Begin -> pick two
starters -> Hatch -> confirm Missions/Economy tabs appear (proving the
first breed reliably unlocks a frontier region, which gates those tabs).

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
    port = 15173
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
def test_slimeworld_first_breed_to_missions_unlock(vite_server: str) -> None:
    """Full flow: Begin -> SPLICING -> pick two starters -> Hatch ->
    verify MISSIONS and ECONOMY tabs appear."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        errors: list[str] = []
        page.on("pageerror", lambda err: errors.append(str(err)))

        try:
            # Clear any saved state so we get the opening beat
            page.goto(f"{vite_server}/?game=slimeworld", wait_until="networkidle", timeout=30000)
            page.evaluate("localStorage.removeItem('slimeworld_save')")
            page.reload(wait_until="networkidle", timeout=30000)

            # 1. Opening beat -> click Begin
            begin_btn = page.locator("#slimeworld-begin")
            expect(begin_btn).to_be_visible(timeout=10000)
            begin_btn.click()

            # 2. Hub should be visible now — primary tabs should include ROSTER but NOT yet MISSIONS
            roster_tab = page.locator("[data-testid='sw-tab-roster']")
            expect(roster_tab).to_be_visible(timeout=5000)

            # Missions tab should NOT be visible yet (no region unlocked)
            missions_tab = page.locator("[data-testid='sw-tab-missions']")
            expect(missions_tab).not_to_be_visible(timeout=2000)

            # 3. Click SPLICING sub-tab to access the breeding interface
            splicing_tab = page.locator("[data-testid='sw-roster-sub-breeding']")
            expect(splicing_tab).to_be_visible(timeout=5000)
            splicing_tab.click()

            # 4. Select two idle candidates (starters) as parents
            # Wait for at least two candidates to appear
            candidates = page.locator("[data-testid^='sw-breed-candidate-']")
            expect(candidates.first).to_be_visible(timeout=5000)
            candidate_count = candidates.count()
            assert candidate_count >= 2, f"Expected at least 2 idle candidates, got {candidate_count}"

            # Click first candidate (becomes Parent A)
            candidates.nth(0).click()
            # Click second candidate (becomes Parent B)
            candidates.nth(1).click()

            # 5. Click the Hatch button
            hatch_btn = page.locator("[data-testid='sw-hatch-btn']")
            expect(hatch_btn).to_be_enabled(timeout=3000)
            hatch_btn.click()

            # 6. After hatching, the first breed should unlock a frontier region.
            #    This means MISSIONS and ECONOMY tabs should now appear.
            missions_tab = page.locator("[data-testid='sw-tab-missions']")
            expect(missions_tab).to_be_visible(timeout=10000)

            economy_tab = page.locator("[data-testid='sw-tab-economy']")
            expect(economy_tab).to_be_visible(timeout=5000)

            # Sanity: no page errors during the entire flow
            assert not errors, f"Unexpected page errors during E2E flow: {errors}"
        finally:
            # Clean up localStorage so we don't leave persistent state
            page.evaluate("localStorage.removeItem('slimeworld_save')")
            browser.close()
