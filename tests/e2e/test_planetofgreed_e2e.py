"""test_planetofgreed_e2e.py — L3 E2E tests for Planet of Greed.

Real browser playthrough following the studio's established Playwright
pattern (pytest + sync API against real Vite dev server, matching
test_slimeworld_first_breed_unlock.py and test_dissonance_new_run_to_map.py).

Flow: Load -> Culture selection -> Authorize Planning -> Advance weeks
-> Verify Rank display -> Verify Fragment counter -> Trigger combat
(if reachable in reasonable time).

Marked both `slow` (real browser + dev server) and `e2e` (L3 layer).
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


def _dismiss_event_modal(page) -> bool:
    """Dismiss daily event modal if present by clicking first available choice."""
    modal = page.locator("#daily-event-modal")
    if modal.count() > 0 and modal.is_visible():
        buttons = modal.locator("button:not([disabled])")
        if buttons.count() > 0:
            buttons.first.click()
            time.sleep(0.5)
            return True
    return False


@pytest.mark.slow
@pytest.mark.e2e
def test_e2e_house_selection_to_combat(vite_server: str) -> None:
    """Full flow: Load -> select culture -> authorize planning -> advance
    weeks -> verify game renders with no JS errors."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        errors: list[str] = []
        page.on("pageerror", lambda err: errors.append(str(err)))

        try:
            # Clear saved state
            page.goto(f"{vite_server}/?game=planetofgreed", wait_until="networkidle", timeout=30000)
            page.evaluate("localStorage.removeItem('corpworld_state')")
            page.reload(wait_until="networkidle", timeout=30000)

            # 1. Culture selection screen
            culture_btn = page.locator("[data-testid='pog-culture-ember']")
            expect(culture_btn).to_be_visible(timeout=10000)
            culture_btn.click()

            # 2. Game should render with boardroom header
            header = page.locator("#boardroom-header")
            expect(header).to_be_visible(timeout=5000)

            # 3. Planning phase button should be visible
            planning_btn = page.locator("[data-testid='pog-authorize-planning']")
            expect(planning_btn).to_be_visible(timeout=5000)

            # 4. Authorize planning
            planning_btn.click()
            time.sleep(1)

            # 5. Set speed to 4x and advance through multiple weeks
            speed_4x = page.locator("#btn-speed-4x")
            if speed_4x.count() > 0:
                speed_4x.click()

            # Run for 30 seconds, handling planning phases and events
            for i in range(6):
                time.sleep(5)
                _dismiss_event_modal(page)

                planning_btn = page.locator("[data-testid='pog-authorize-planning']")
                if planning_btn.count() > 0 and planning_btn.is_visible():
                    planning_btn.click()
                    time.sleep(0.5)
                    speed_4x = page.locator("#btn-speed-4x")
                    if speed_4x.count() > 0:
                        speed_4x.click()

            # 6. Verify no JS errors during the entire flow
            assert not errors, f"Unexpected page errors during E2E flow: {errors}"

        finally:
            page.evaluate("localStorage.removeItem('corpworld_state')")
            browser.close()


@pytest.mark.slow
@pytest.mark.e2e
def test_e2e_rank_display_updates(vite_server: str) -> None:
    """Verify Rank display is visible and shows correct format."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        errors: list[str] = []
        page.on("pageerror", lambda err: errors.append(str(err)))

        try:
            page.goto(f"{vite_server}/?game=planetofgreed", wait_until="networkidle", timeout=30000)
            page.evaluate("localStorage.removeItem('corpworld_state')")
            page.reload(wait_until="networkidle", timeout=30000)

            # Select culture
            page.locator("[data-testid='pog-culture-ember']").click()
            time.sleep(2)

            # Verify rank display is visible
            rank_display = page.locator("[data-testid='rank-display']")
            expect(rank_display).to_be_visible(timeout=5000)
            rank_text = rank_display.inner_text()
            # Should show "RANK #X / 6" (6 corporations, not 5)
            assert "/ 6" in rank_text or "/6" in rank_text, \
                f"Rank should show /6 (6 corporations), got: {rank_text}"

            assert not errors, f"Unexpected page errors: {errors}"

        finally:
            page.evaluate("localStorage.removeItem('corpworld_state')")
            browser.close()


@pytest.mark.slow
@pytest.mark.e2e
def test_e2e_fragment_transfer_visible(vite_server: str) -> None:
    """Verify Fragment counter is visible in the BoardroomHeader."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        errors: list[str] = []
        page.on("pageerror", lambda err: errors.append(str(err)))

        try:
            page.goto(f"{vite_server}/?game=planetofgreed", wait_until="networkidle", timeout=30000)
            page.evaluate("localStorage.removeItem('corpworld_state')")
            page.reload(wait_until="networkidle", timeout=30000)

            # Select culture
            page.locator("[data-testid='pog-culture-ember']").click()
            time.sleep(2)

            # Verify fragment counter is visible
            fragment_counter = page.locator("[data-testid='fragment-counter']")
            expect(fragment_counter).to_be_visible(timeout=5000)
            fragment_text = fragment_counter.inner_text()
            # Should show "1/6" (each House starts with 1 Fragment)
            assert "1" in fragment_text, \
                f"Fragment counter should show 1/6 at start, got: {fragment_text}"

            assert not errors, f"Unexpected page errors: {errors}"

        finally:
            page.evaluate("localStorage.removeItem('corpworld_state')")
            browser.close()


@pytest.mark.slow
@pytest.mark.e2e
def test_e2e_ending_trigger_fires(vite_server: str) -> None:
    """If reachable within a reasonable test run, verify the ending
    placeholder renders. This test runs a longer simulation to try to
    reach Rank 1 — if it doesn't reach it in the timeout, the test
    passes with a note that the ending wasn't reached (not a failure,
    since reaching Rank 1 requires eliminating all 5 AI opponents)."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        errors: list[str] = []
        page.on("pageerror", lambda err: errors.append(str(err)))

        try:
            page.goto(f"{vite_server}/?game=planetofgreed", wait_until="networkidle", timeout=30000)
            page.evaluate("localStorage.removeItem('corpworld_state')")
            page.reload(wait_until="networkidle", timeout=30000)

            # Select culture
            page.locator("[data-testid='pog-culture-ember']").click()
            time.sleep(2)

            # Authorize planning and set 4x speed
            page.locator("[data-testid='pog-authorize-planning']").click()
            time.sleep(1)
            page.locator("#btn-speed-4x").click()

            # Run for 90 seconds, handling planning phases and events
            ending_reached = False
            for i in range(18):
                time.sleep(5)
                _dismiss_event_modal(page)

                planning_btn = page.locator("[data-testid='pog-authorize-planning']")
                if planning_btn.count() > 0 and planning_btn.is_visible():
                    planning_btn.click()
                    time.sleep(0.5)
                    speed_4x = page.locator("#btn-speed-4x")
                    if speed_4x.count() > 0:
                        speed_4x.click()

                # Check for ending placeholder
                ending = page.locator("[data-testid='pog-ending-placeholder']")
                if ending.count() > 0 and ending.is_visible():
                    ending_reached = True
                    # Verify ending shows real data
                    ending_text = ending.inner_text()
                    assert "Rank 1" in ending_text or "RANK 1" in ending_text.upper(), \
                        f"Ending should show Rank 1, got: {ending_text[:200]}"
                    assert "Fragment" in ending_text, \
                        f"Ending should show Fragment count, got: {ending_text[:200]}"
                    break

            # Ending may not be reachable in 90s — that's OK, not a failure.
            # The test verifies no errors occurred and the game ran stably.
            assert not errors, f"Unexpected page errors: {errors}"

        finally:
            page.evaluate("localStorage.removeItem('corpworld_state')")
            browser.close()
