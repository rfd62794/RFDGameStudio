#!/usr/bin/env python3
"""Check if the Devin browser preview iframe is clipping the page."""
import json
from playwright.sync_api import sync_playwright

PREVIEW_URL = "http://127.0.0.1:52656"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    page.goto(PREVIEW_URL, wait_until="networkidle")
    page.wait_for_timeout(2000)

    metrics = page.evaluate("""() => {
        const iframe = document.querySelector('iframe');
        if (!iframe) return {error: 'no iframe found'};
        const rect = iframe.getBoundingClientRect();
        const cs = getComputedStyle(iframe);
        const doc = iframe.contentDocument;
        const body = doc ? doc.body : null;
        const html = doc ? doc.documentElement : null;
        return {
            iframeWidth: rect.width,
            iframeHeight: rect.height,
            iframeOverflow: cs.overflow,
            iframeOverflowY: cs.overflowY,
            iframeHeightStyle: cs.height,
            iframeMaxHeight: cs.maxHeight,
            innerBodyScrollHeight: body ? body.scrollHeight : 'no body',
            innerBodyClientHeight: body ? body.clientHeight : 'no body',
            innerHtmlScrollHeight: html ? html.scrollHeight : 'no html',
            innerHtmlClientHeight: html ? html.clientHeight : 'no html',
            innerWindowInnerHeight: iframe.contentWindow ? iframe.contentWindow.innerHeight : 'no contentWindow',
            innerCanScroll: body && iframe.contentWindow ? body.scrollHeight > iframe.contentWindow.innerHeight : 'unknown',
        };
    }""")

    print(json.dumps(metrics, indent=2))
    browser.close()
