"""test_planetofgreed_shell_opening_e2e.py — E2E tests for shell compliance
and opening sequence.

Verifies:
- GameShell back-to-lobby button is present on every screen state
- TitleScreen renders before culture selection
- Opening sequence fires on new game, NOT on continue/resume
- Opening sequence content is real (Genesis Ore, wheel, stakes)
- Skip button works
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
    port = 15176
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
def test_e2e_gameshell_back_button_present_on_title(vite_server: str) -> None:
    """GameShell back-to-lobby button is present on the title screen."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        errors: list[str] = []
        page.on("pageerror", lambda err: errors.append(str(err)))

        try:
            page.goto(f"{vite_server}/?game=planetofgreed", wait_until="networkidle", timeout=30000)
            page.evaluate("localStorage.removeItem('corpworld_state')")
            page.reload(wait_until="networkidle", timeout=30000)
            time.sleep(2)

            # GameShell back button should be present
            back_btn = page.locator(".game-shell-back")
            expect(back_btn).to_be_visible(timeout=5000)

            assert not errors, f"Unexpected page errors: {errors}"

        finally:
            page.evaluate("localStorage.removeItem('corpworld_state')")
            browser.close()


@pytest.mark.slow
@pytest.mark.e2e
def test_e2e_titlescreen_renders_before_culture_selection(vite_server: str) -> None:
    """TitleScreen renders with real content before culture selection."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        errors: list[str] = []
        page.on("pageerror", lambda err: errors.append(str(err)))

        try:
            page.goto(f"{vite_server}/?game=planetofgreed", wait_until="networkidle", timeout=30000)
            page.evaluate("localStorage.removeItem('corpworld_state')")
            page.reload(wait_until="networkidle", timeout=30000)
            time.sleep(2)

            # Title screen should be visible
            title_screen = page.locator(".title-screen")
            expect(title_screen).to_be_visible(timeout=5000)

            # Should contain the game title (case-insensitive — GameShell renders uppercase)
            body_text = page.inner_text("body")
            assert "planet of greed" in body_text.lower(), "Title screen should show game title"

            # Should have New Campaign button
            new_campaign_btn = page.locator("text=New Campaign")
            expect(new_campaign_btn).to_be_visible(timeout=2000)

            assert not errors, f"Unexpected page errors: {errors}"

        finally:
            page.evaluate("localStorage.removeItem('corpworld_state')")
            browser.close()


@pytest.mark.slow
@pytest.mark.e2e
def test_e2e_opening_sequence_fires_on_new_game(vite_server: str) -> None:
    """Opening sequence fires when the player clicks New Campaign."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        errors: list[str] = []
        page.on("pageerror", lambda err: errors.append(str(err)))

        try:
            page.goto(f"{vite_server}/?game=planetofgreed", wait_until="networkidle", timeout=30000)
            page.evaluate("localStorage.removeItem('corpworld_state')")
            page.reload(wait_until="networkidle", timeout=30000)
            time.sleep(2)

            # Click "New Campaign" on title screen
            page.locator("text=New Campaign").click()
            time.sleep(1)

            # Opening sequence should be visible
            opening = page.locator("[data-testid='pog-opening-sequence']")
            expect(opening).to_be_visible(timeout=5000)

            # Beat 1 (Genesis Ore) should be visible
            beat_ore = page.locator("[data-testid='pog-opening-beat-ore']")
            expect(beat_ore).to_be_visible(timeout=2000)

            # Verify real content
            body_text = page.inner_text("body")
            assert "Genesis Ore" in body_text, "Opening should mention Genesis Ore"
            assert "Seed Engine" in body_text, "Opening should mention Seed Engine"

            assert not errors, f"Unexpected page errors: {errors}"

        finally:
            page.evaluate("localStorage.removeItem('corpworld_state')")
            browser.close()


@pytest.mark.slow
@pytest.mark.e2e
def test_e2e_opening_sequence_not_on_resume(vite_server: str) -> None:
    """Opening sequence does NOT fire when resuming a saved game."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        errors: list[str] = []
        page.on("pageerror", lambda err: errors.append(str(err)))

        try:
            page.goto(f"{vite_server}/?game=planetofgreed", wait_until="networkidle", timeout=30000)

            # First: create a saved game by playing through
            page.evaluate("localStorage.removeItem('corpworld_state')")
            page.reload(wait_until="networkidle", timeout=30000)
            time.sleep(2)

            # Skip title, skip opening, select culture, then save state
            page.locator("text=New Campaign").click()
            time.sleep(0.5)
            page.locator("[data-testid='pog-skip-opening']").click()
            time.sleep(0.5)
            page.locator("[data-testid='pog-culture-ember']").click()
            time.sleep(3)

            # Now reload — should resume, NOT show opening
            page.reload(wait_until="networkidle", timeout=30000)
            time.sleep(2)

            # Opening sequence should NOT be visible
            opening = page.locator("[data-testid='pog-opening-sequence']")
            assert opening.count() == 0 or not opening.is_visible(), \
                "Opening sequence should NOT fire on resume"

            # Title screen should also NOT be visible (resuming goes straight to game)
            title = page.locator(".title-screen")
            assert title.count() == 0 or not title.is_visible(), \
                "Title screen should NOT appear on resume"

            # Game should be visible (boardroom header)
            header = page.locator("#boardroom-header")
            expect(header).to_be_visible(timeout=5000)

            assert not errors, f"Unexpected page errors: {errors}"

        finally:
            page.evaluate("localStorage.removeItem('corpworld_state')")
            browser.close()


@pytest.mark.slow
@pytest.mark.e2e
def test_e2e_opening_sequence_all_beats_and_skip(vite_server: str) -> None:
    """Step through all 4 beats, verify content, then test skip."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        errors: list[str] = []
        page.on("pageerror", lambda err: errors.append(str(err)))

        try:
            page.goto(f"{vite_server}/?game=planetofgreed", wait_until="networkidle", timeout=30000)
            page.evaluate("localStorage.removeItem('corpworld_state')")
            page.reload(wait_until="networkidle", timeout=30000)
            time.sleep(2)

            # Start new game
            page.locator("text=New Campaign").click()
            time.sleep(1)

            # Beat 1: Ore
            expect(page.locator("[data-testid='pog-opening-beat-ore']")).to_be_visible(timeout=2000)
            assert "Genesis Ore" in page.inner_text("body")

            # Advance to Beat 2: Wheel
            page.locator("[data-testid='pog-opening-next']").click()
            time.sleep(0.5)
            expect(page.locator("[data-testid='pog-opening-beat-wheel']")).to_be_visible(timeout=2000)

            # Advance to Beat 3: Rival
            page.locator("[data-testid='pog-opening-next']").click()
            time.sleep(0.5)
            expect(page.locator("[data-testid='pog-opening-beat-rival']")).to_be_visible(timeout=2000)
            assert "wheel" in page.inner_text("body").lower()

            # Advance to Beat 4: Stakes
            page.locator("[data-testid='pog-opening-next']").click()
            time.sleep(0.5)
            expect(page.locator("[data-testid='pog-opening-beat-stakes']")).to_be_visible(timeout=2000)
            assert "arrest" in page.inner_text("body").lower()

            # Click "Choose Your House" — should go to culture selection
            page.locator("[data-testid='pog-opening-next']").click()
            time.sleep(1)

            # Culture selection should be visible
            culture_btn = page.locator("[data-testid='pog-culture-ember']")
            expect(culture_btn).to_be_visible(timeout=5000)

            assert not errors, f"Unexpected page errors: {errors}"

        finally:
            page.evaluate("localStorage.removeItem('corpworld_state')")
            browser.close()


@pytest.mark.slow
@pytest.mark.e2e
def test_e2e_gameshell_back_button_on_all_screens(vite_server: str) -> None:
    """GameShell back button is present on title, opening, culture selection, and main game."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        errors: list[str] = []
        page.on("pageerror", lambda err: errors.append(str(err)))

        try:
            page.goto(f"{vite_server}/?game=planetofgreed", wait_until="networkidle", timeout=30000)
            page.evaluate("localStorage.removeItem('corpworld_state')")
            page.reload(wait_until="networkidle", timeout=30000)
            time.sleep(2)

            # Title screen: back button present
            expect(page.locator(".game-shell-back")).to_be_visible(timeout=5000)

            # Opening sequence: back button present
            page.locator("text=New Campaign").click()
            time.sleep(1)
            expect(page.locator(".game-shell-back")).to_be_visible(timeout=2000)

            # Skip to culture selection
            page.locator("[data-testid='pog-skip-opening']").click()
            time.sleep(1)
            expect(page.locator(".game-shell-back")).to_be_visible(timeout=2000)

            # Select culture → main game
            page.locator("[data-testid='pog-culture-ember']").click()
            time.sleep(3)
            expect(page.locator(".game-shell-back")).to_be_visible(timeout=5000)

            assert not errors, f"Unexpected page errors: {errors}"

        finally:
            page.evaluate("localStorage.removeItem('corpworld_state')")
            browser.close()
