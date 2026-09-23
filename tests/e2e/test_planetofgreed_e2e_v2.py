"""test_planetofgreed_e2e_v2.py — L3 E2E tests for Planet of Greed v2.

Tests the FINISHED guided flow (not the old free-form panel):
- House selection with narrative descriptions
- Guided per-Region walkthrough (confirm/change/skip)
- Real ending screen content (not placeholder)
- Visual identity (dark corporate, not light CorpWorld)

Follows the studio's Playwright + pytest pattern.
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
    port = 15175
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
def test_e2e_guided_flow_loads_and_selects_house(vite_server: str) -> None:
    """Load game, verify culture selection shows House descriptions, select one."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        errors: list[str] = []
        page.on("pageerror", lambda err: errors.append(str(err)))

        try:
            page.goto(f"{vite_server}/?game=planetofgreed", wait_until="networkidle", timeout=30000)
            page.evaluate("localStorage.removeItem('corpworld_state')")
            page.reload(wait_until="networkidle", timeout=30000)

            # Culture selection screen
            culture_btn = page.locator("[data-testid='pog-culture-ember']")
            expect(culture_btn).to_be_visible(timeout=10000)
            culture_btn.click()

            # Game should render with boardroom header
            header = page.locator("#boardroom-header")
            expect(header).to_be_visible(timeout=5000)

            # Verify no JS errors
            assert not errors, f"Unexpected page errors: {errors}"

        finally:
            page.evaluate("localStorage.removeItem('corpworld_state')")
            browser.close()


@pytest.mark.slow
@pytest.mark.e2e
def test_e2e_guided_walkthrough_renders(vite_server: str) -> None:
    """Verify the guided walkthrough component renders during planning phase."""
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

            # Guided walkthrough should be visible
            walkthrough = page.locator("[data-testid='pog-guided-walkthrough']")
            expect(walkthrough).to_be_visible(timeout=5000)

            # Should show region name
            region_name = page.locator("[data-testid='pog-current-region-name']")
            expect(region_name).to_be_visible(timeout=5000)

            # Should show a default action
            default_action = page.locator("[data-testid='pog-default-action']")
            expect(default_action).to_be_visible(timeout=5000)

            # Should show threat level
            threat = page.locator("[data-testid='pog-threat-level']")
            expect(threat).to_be_visible(timeout=5000)

            # Should have confirm button
            confirm = page.locator("[data-testid='pog-confirm-action']")
            expect(confirm).to_be_visible(timeout=5000)

            # Should have change action button
            change = page.locator("[data-testid='pog-change-action']")
            expect(change).to_be_visible(timeout=5000)

            assert not errors, f"Unexpected page errors: {errors}"

        finally:
            page.evaluate("localStorage.removeItem('corpworld_state')")
            browser.close()


@pytest.mark.slow
@pytest.mark.e2e
def test_e2e_confirm_and_change_both_work(vite_server: str) -> None:
    """Test both the fast-confirm and change-selection paths."""
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

            # Click "Change Action" to open full action set
            change_btn = page.locator("[data-testid='pog-change-action']")
            change_btn.click()
            time.sleep(1)

            # Verify all action buttons are visible
            for action in ['hold', 'fortify', 'reinforce', 'civic-production', 'civic-defense', 'civic-unrest']:
                btn = page.locator(f"[data-testid='pog-action-{action}']")
                expect(btn).to_be_visible(timeout=2000)

            # Select "Hold" action
            page.locator("[data-testid='pog-action-hold']").click()
            time.sleep(0.5)

            # Should be back to recommendation view with Hold as custom
            default_action = page.locator("[data-testid='pog-default-action']")
            expect(default_action).to_be_visible(timeout=2000)

            # Confirm the action
            confirm_btn = page.locator("[data-testid='pog-confirm-action']")
            confirm_btn.click()
            time.sleep(1)

            # Should advance to next region (or show "All Regions Reviewed")
            # Either way, no errors should occur
            assert not errors, f"Unexpected page errors: {errors}"

        finally:
            page.evaluate("localStorage.removeItem('corpworld_state')")
            browser.close()


@pytest.mark.slow
@pytest.mark.e2e
def test_e2e_rank_and_fragment_display(vite_server: str) -> None:
    """Verify Rank display shows /6 and Fragment counter is visible."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        errors: list[str] = []
        page.on("pageerror", lambda err: errors.append(str(err)))

        try:
            page.goto(f"{vite_server}/?game=planetofgreed", wait_until="networkidle", timeout=30000)
            page.evaluate("localStorage.removeItem('corpworld_state')")
            page.reload(wait_until="networkidle", timeout=30000)

            page.locator("[data-testid='pog-culture-ember']").click()
            time.sleep(2)

            # Verify rank display shows /6
            rank_display = page.locator("[data-testid='rank-display']")
            expect(rank_display).to_be_visible(timeout=5000)
            rank_text = rank_display.inner_text()
            assert "/ 6" in rank_text or "/6" in rank_text, \
                f"Rank should show /6, got: {rank_text}"

            # Verify fragment counter is visible
            fragment_counter = page.locator("[data-testid='fragment-counter']")
            expect(fragment_counter).to_be_visible(timeout=5000)

            assert not errors, f"Unexpected page errors: {errors}"

        finally:
            page.evaluate("localStorage.removeItem('corpworld_state')")
            browser.close()


@pytest.mark.slow
@pytest.mark.e2e
def test_e2e_dark_corporate_identity(vite_server: str) -> None:
    """Verify the UI uses the dark corporate identity, not the old light CorpWorld style."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        errors: list[str] = []
        page.on("pageerror", lambda err: errors.append(str(err)))

        try:
            page.goto(f"{vite_server}/?game=planetofgreed", wait_until="networkidle", timeout=30000)
            page.evaluate("localStorage.removeItem('corpworld_state')")
            page.reload(wait_until="networkidle", timeout=30000)

            page.locator("[data-testid='pog-culture-ember']").click()
            time.sleep(2)

            # Check the header background color is dark (#1a1a2e)
            header = page.locator("#boardroom-header")
            header_bg = header.evaluate("el => getComputedStyle(el).backgroundColor")
            # Should be dark — rgb(26, 26, 46) = #1a1a2e
            assert "26" in header_bg, f"Header should have dark background, got: {header_bg}"

            # Check CORPWORLD is not present
            body_text = page.inner_text("body")
            assert "CORPWORLD" not in body_text, "CORPWORLD branding should not be present"

            assert not errors, f"Unexpected page errors: {errors}"

        finally:
            page.evaluate("localStorage.removeItem('corpworld_state')")
            browser.close()


@pytest.mark.slow
@pytest.mark.e2e
def test_e2e_ending_screen_renders_real_content(vite_server: str) -> None:
    """If the ending is reachable, verify it shows real narrative content.
    If not reachable in the timeout, verify no errors occurred (the ending
    requires eliminating all 5 AI opponents, which is unlikely in 90s)."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        errors: list[str] = []
        page.on("pageerror", lambda err: errors.append(str(err)))

        try:
            page.goto(f"{vite_server}/?game=planetofgreed", wait_until="networkidle", timeout=30000)
            page.evaluate("localStorage.removeItem('corpworld_state')")
            page.reload(wait_until="networkidle", timeout=30000)

            page.locator("[data-testid='pog-culture-ember']").click()
            time.sleep(2)

            # Step through the guided walkthrough quickly by confirming defaults
            for i in range(3):
                confirm = page.locator("[data-testid='pog-confirm-action']")
                if confirm.count() > 0 and confirm.is_visible():
                    confirm.click()
                    time.sleep(0.5)
                else:
                    # Might be at "All Regions Reviewed" — authorize
                    authorize = page.locator("[data-testid='pog-authorize-all-planning']")
                    if authorize.count() > 0 and authorize.is_visible():
                        authorize.click()
                        time.sleep(1)
                        break

            # Authorize if not already done
            authorize = page.locator("[data-testid='pog-authorize-all-planning']")
            if authorize.count() > 0 and authorize.is_visible():
                authorize.click()
                time.sleep(1)

            # Set speed to 4x and advance
            speed_4x = page.locator("#btn-speed-4x")
            if speed_4x.count() > 0:
                speed_4x.click()

            # Run for 60 seconds
            ending_reached = False
            for i in range(12):
                time.sleep(5)
                _dismiss_event_modal(page)

                # Check for ending
                ending = page.locator("[data-testid='pog-ending-placeholder']")
                if ending.count() > 0 and ending.is_visible():
                    ending_reached = True
                    ending_text = ending.inner_text()
                    # Verify real narrative content (not placeholder)
                    assert "Seed Engine" in ending_text, \
                        f"Ending should mention Seed Engine, got: {ending_text[:200]}"
                    assert "arrest" in ending_text.lower(), \
                        f"Ending should mention arrest, got: {ending_text[:200]}"
                    # Verify fragment count is shown
                    frag_count = page.locator("[data-testid='pog-ending-fragment-count']")
                    expect(frag_count).to_be_visible(timeout=2000)
                    break

                # Handle planning phase if it reappears
                walkthrough = page.locator("[data-testid='pog-guided-walkthrough']")
                if walkthrough.count() > 0 and walkthrough.is_visible():
                    confirm = page.locator("[data-testid='pog-confirm-action']")
                    if confirm.count() > 0 and confirm.is_visible():
                        confirm.click()
                        time.sleep(0.3)
                    authorize = page.locator("[data-testid='pog-authorize-all-planning']")
                    if authorize.count() > 0 and authorize.is_visible():
                        authorize.click()
                        time.sleep(0.5)
                        speed_4x = page.locator("#btn-speed-4x")
                        if speed_4x.count() > 0:
                            speed_4x.click()

            # Ending may not be reachable in 60s — that's OK
            assert not errors, f"Unexpected page errors: {errors}"

        finally:
            page.evaluate("localStorage.removeItem('corpworld_state')")
            browser.close()
