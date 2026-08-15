#!/usr/bin/env python3
"""
diag_scroll_metrics.py — Objective page-level measurements for Character Viewer.

Uses Playwright's page.evaluate() to pull real computed CSS values:
  - scrollHeight vs clientHeight vs innerHeight
  - computed overflow-y on html, body, #root, .character-viewer
  - getBoundingClientRect() on .cv-figure-render (Bug 1 regression check)

Saves screenshot artifacts to docs/state/screenshots/.

Usage: python diag_scroll_metrics.py
"""
import json
import os
import sys
from datetime import datetime
from pathlib import Path

from playwright.sync_api import sync_playwright

URL = "http://localhost:5173/arcade/rfdgamestudio/src/standalone/character_viewer/index.html"
SCRIPT_DIR = Path(__file__).resolve().parent
SCREENSHOT_DIR = SCRIPT_DIR / "docs" / "state" / "screenshots"


def run_measurement(browser, viewport_w, viewport_h, label):
    """Run measurements with a specific viewport size."""
    page = browser.new_page(viewport={"width": viewport_w, "height": viewport_h})

    print(f"\n{'='*65}")
    print(f"  MEASUREMENT: {label} (viewport {viewport_w}x{viewport_h})")
    print(f"{'='*65}\n")

    print(f"Navigating to {URL} ...")
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
        const rect = (el) =>
            el ? { width: el.getBoundingClientRect().width,
                   height: el.getBoundingClientRect().height,
                   top: el.getBoundingClientRect().top,
                   bottom: el.getBoundingClientRect().bottom } : null;

        return {
            bodyScrollHeight: body.scrollHeight,
            bodyClientHeight: body.clientHeight,
            htmlScrollHeight: html.scrollHeight,
            htmlClientHeight: html.clientHeight,
            windowInnerHeight: window.innerHeight,
            windowInnerWidth: window.innerWidth,
            htmlOverflowY: get(html, 'overflow-y'),
            htmlOverflow: get(html, 'overflow'),
            bodyOverflowY: get(body, 'overflow-y'),
            bodyOverflow: get(body, 'overflow'),
            rootOverflowY: get(root, 'overflow-y'),
            rootOverflow: get(root, 'overflow'),
            rootDisplay: get(root, 'display'),
            rootMinHeight: get(root, 'min-height'),
            rootHeight: get(root, 'height'),
            cvOverflowY: get(cv, 'overflow-y'),
            cvOverflow: get(cv, 'overflow'),
            cvHeight: get(cv, 'height'),
            cvMaxHeight: get(cv, 'max-height'),
            figRenderRect: rect(figRender),
            figRenderHeight: figRender ? figRender.getBoundingClientRect().height : null,
            figRenderOverflow: get(figRender, 'overflow'),
            canScrollVertical: body.scrollHeight > window.innerHeight,
        };
    }""")

    print(f"  window.innerHeight:     {metrics['windowInnerHeight']}px")
    print(f"  body.scrollHeight:      {metrics['bodyScrollHeight']}px")
    print(f"  body.clientHeight:      {metrics['bodyClientHeight']}px")
    print(f"  html.scrollHeight:      {metrics['htmlScrollHeight']}px")
    print(f"  html.clientHeight:      {metrics['htmlClientHeight']}px")
    print(f"  canScrollVertical:      {metrics['canScrollVertical']}")
    print(f"  html.overflow-y:        {metrics['htmlOverflowY']}")
    print(f"  body.overflow-y:        {metrics['bodyOverflowY']}")
    print(f"  #root.overflow-y:       {metrics['rootOverflowY']}")
    print(f"  #root.display:          {metrics['rootDisplay']}")
    print(f"  #root.min-height:       {metrics['rootMinHeight']}")
    print(f"  .cv.overflow-y:         {metrics['cvOverflowY']}")
    print(f"  figRender.height:       {metrics['figRenderHeight']}px")
    print(f"  figRender.overflow:     {metrics['figRenderOverflow']}")

    # Save screenshot
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    screenshot_path = SCREENSHOT_DIR / f"cv_scroll_{label}_{ts}.png"
    page.screenshot(path=str(screenshot_path), full_page=True)
    print(f"  Screenshot: {screenshot_path}")

    # Save metrics JSON
    metrics_path = SCREENSHOT_DIR / f"cv_metrics_{label}_{ts}.json"
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"  Metrics:   {metrics_path}")

    page.close()
    return metrics


def main():
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch()

        # Test 1: Standard desktop (1280x800)
        m1 = run_measurement(browser, 1280, 800, "desktop_1280x800")

        # Test 2: Small laptop (1366x768 — common laptop)
        m2 = run_measurement(browser, 1366, 768, "laptop_1366x768")

        # Test 3: Short viewport (1280x600 — worst case)
        m3 = run_measurement(browser, 1280, 600, "short_1280x600")

        browser.close()

    print(f"\n{'='*65}")
    print("  SUMMARY")
    print(f"{'='*65}\n")
    for label, m in [("desktop_1280x800", m1), ("laptop_1366x768", m2), ("short_1280x600", m3)]:
        print(f"  {label}: scrollHeight={m['bodyScrollHeight']}px, "
              f"innerHeight={m['windowInnerHeight']}px, "
              f"canScroll={m['canScrollVertical']}, "
              f"body.overflow-y={m['bodyOverflowY']}, "
              f"figRender.height={m['figRenderHeight']}px")

    print("\nDone.")


if __name__ == "__main__":
    main()
