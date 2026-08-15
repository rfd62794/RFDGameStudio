#!/usr/bin/env python3
"""
test_character_viewer_scroll.py — Objective test anchors for Character Viewer page scroll fix.

Per §3 of the Page Scroll Fix directive, these tests use Playwright's page.evaluate()
to pull real, objective values — not visual judgment.

Test anchors:
  1. test_page_scrollheight_exceeds_viewport_when_content_tall
  2. test_overflow_y_permits_scroll
  3. test_figure_render_box_still_220px
  4. test_screenshot_artifacts_saved
  5. test_no_regression (delegated to TS floor — this script checks CSS rules exist)

Usage: python test_character_viewer_scroll.py
Exit code: 0 = all pass, 1 = any fail
"""
import json
import os
import sys
from datetime import datetime
from pathlib import Path

from playwright.sync_api import sync_playwright

URL = "http://localhost:5173/arcade/rfdgamestudio/?game=character_viewer"
REPO_ROOT = Path(__file__).resolve().parent
SCREENSHOT_DIR = REPO_ROOT / "docs" / "state" / "screenshots"
CSS_PATH = REPO_ROOT / "ts" / "src" / "standalone" / "character_viewer" / "styles.css"

passed = 0
failed = 0
results = []


def report(name, ok, detail):
    global passed, failed
    status = "PASS" if ok else "FAIL"
    if ok:
        passed += 1
    else:
        failed += 1
    results.append({"test": name, "status": status, "detail": detail})
    print(f"  [{status}] {name}")
    if detail:
        print(f"         {detail}")


def main():
    if not os.environ.get("CI") and not _server_running():
        print("ERROR: Vite dev server not running on localhost:5173")
        print("       Start it with: cd ts && npx vite --port 5173")
        sys.exit(1)

    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.goto(URL, wait_until="networkidle")
        page.wait_for_timeout(1500)

        metrics = page.evaluate("""() => {
            const body = document.body;
            const html = document.documentElement;
            const root = document.getElementById('root');
            const cv = document.querySelector('.character-viewer');
            const figRender = document.querySelector('.cv-figure-render');

            const get = (el, prop) =>
                el ? getComputedStyle(el).getPropertyValue(prop) : 'ELEMENT_NOT_FOUND';

            return {
                bodyScrollHeight: body.scrollHeight,
                bodyClientHeight: body.clientHeight,
                htmlScrollHeight: html.scrollHeight,
                htmlClientHeight: html.clientHeight,
                windowInnerHeight: window.innerHeight,
                htmlOverflowY: get(html, 'overflow-y'),
                bodyOverflowY: get(body, 'overflow-y'),
                rootOverflowY: get(root, 'overflow-y'),
                cvOverflowY: get(cv, 'overflow-y'),
                figRenderHeight: figRender ? figRender.getBoundingClientRect().height : null,
                figRenderOverflow: get(figRender, 'overflow'),
                canScrollVertical: body.scrollHeight > window.innerHeight,
            };
        }""")

        # -- Test 1: scrollHeight exceeds viewport when content is tall --
        print("\n-- Test Anchors (section 3) --\n")
        can_scroll = metrics["canScrollVertical"]
        scroll_diff = metrics["bodyScrollHeight"] - metrics["windowInnerHeight"]
        report(
            "test_page_scrollheight_exceeds_viewport_when_content_tall",
            can_scroll and scroll_diff > 0,
            f"body.scrollHeight={metrics['bodyScrollHeight']}px > "
            f"window.innerHeight={metrics['windowInnerHeight']}px "
            f"(diff={scroll_diff}px, canScroll={can_scroll})",
        )

        # -- Test 2: overflow-y permits scroll (not hidden) --
        overflow_values = {
            "html": metrics["htmlOverflowY"],
            "body": metrics["bodyOverflowY"],
            "#root": metrics["rootOverflowY"],
            ".character-viewer": metrics["cvOverflowY"],
        }
        all_permit_scroll = all(v in ("auto", "visible", "scroll") for v in overflow_values.values())
        none_hidden = all(v != "hidden" for v in overflow_values.values())
        report(
            "test_overflow_y_permits_scroll",
            all_permit_scroll and none_hidden,
            f"overflow-y chain: html={overflow_values['html']}, "
            f"body={overflow_values['body']}, "
            f"#root={overflow_values['#root']}, "
            f".cv={overflow_values['.character-viewer']} — "
            f"all permit scroll (auto/visible/scroll), none hidden",
        )

        # -- Test 3: figure render box still 220px (Bug 1 regression check) --
        fig_height = metrics["figRenderHeight"]
        fig_overflow = metrics["figRenderOverflow"]
        report(
            "test_figure_render_box_still_220px",
            fig_height is not None and fig_height == 220 and fig_overflow == "hidden",
            f"getBoundingClientRect().height={fig_height}px, "
            f"overflow={fig_overflow} (expected: 220px, hidden)",
        )

        # -- Test 4: screenshot artifacts saved --
        ts = datetime.now().strftime("%Y%m%d-%H%M%S")
        screenshot_path = SCREENSHOT_DIR / f"cv_test_anchor_{ts}.png"
        page.screenshot(path=str(screenshot_path), full_page=True)
        screenshot_exists = screenshot_path.exists()
        screenshot_size = screenshot_path.stat().st_size if screenshot_exists else 0
        report(
            "test_screenshot_artifacts_saved",
            screenshot_exists and screenshot_size > 0,
            f"File: {screenshot_path} ({screenshot_size} bytes) — "
            f"artifact for Robert to review, NOT self-certified by Devin",
        )

        browser.close()

    # -- Test 5: no regression -- CSS rules exist in styles.css --
    css_content = CSS_PATH.read_text(encoding="utf-8") if CSS_PATH.exists() else ""
    has_html_overflow = "html { overflow-y: auto; }" in css_content
    has_fig_height = "height: 220px;" in css_content
    has_fig_overflow = "overflow: hidden;" in css_content
    has_svg_sizing = "width: 100%;" in css_content and "height: 100%;" in css_content
    report(
        "test_no_regression",
        has_html_overflow and has_fig_height and has_fig_overflow and has_svg_sizing,
        f"CSS rules present: html.overflow-y:auto={has_html_overflow}, "
        f"fig.height:220px={has_fig_height}, "
        f"fig.overflow:hidden={has_fig_overflow}, "
        f"svg.width/height:100%={has_svg_sizing}",
    )

    # -- Summary --
    print(f"\n-- Summary --\n")
    print(f"  Passed: {passed}/{passed + failed}")
    print(f"  Failed: {failed}/{passed + failed}")
    if failed > 0:
        print(f"\n  FAILURES:")
        for r in results:
            if r["status"] == "FAIL":
                print(f"    - {r['test']}: {r['detail']}")

    # Save results JSON
    results_path = SCREENSHOT_DIR / f"cv_test_results_{ts}.json"
    with open(results_path, "w") as f:
        json.dump({"results": results, "metrics": metrics}, f, indent=2)
    print(f"\n  Results JSON: {results_path}")

    sys.exit(0 if failed == 0 else 1)


def _server_running():
    import urllib.request
    try:
        urllib.request.urlopen(URL, timeout=3)
        return True
    except Exception:
        return False


if __name__ == "__main__":
    main()
