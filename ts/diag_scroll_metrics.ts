/**
 * diag_scroll_metrics.ts — Objective page-level measurements for Character Viewer.
 *
 * Uses Playwright's page.evaluate() to pull real computed CSS values:
 *   - scrollHeight vs clientHeight vs innerHeight
 *   - computed overflow-y on html, body, #root, .character-viewer
 *   - getBoundingClientRect() on .cv-figure-render (Bug 1 regression check)
 *
 * Saves a screenshot artifact to docs/state/screenshots/.
 *
 * Usage: npx tsx diag_scroll_metrics.ts
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const URL = 'http://localhost:5173/arcade/rfdgamestudio/src/standalone/character_viewer/index.html';
const SCREENSHOT_DIR = join(__dirname, '..', 'docs', 'state', 'screenshots');

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  console.log(`Navigating to ${URL} ...`);
  await page.goto(URL, { waitUntil: 'networkidle' });
  // Give React + SVG rendering a moment to settle
  await page.waitForTimeout(1500);

  // ── Objective measurements via page.evaluate() ──
  const metrics = await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;
    const root = document.getElementById('root');
    const cv = document.querySelector('.character-viewer') as HTMLElement | null;
    const figRender = document.querySelector('.cv-figure-render') as HTMLElement | null;

    const get = (el: Element | null, prop: string) =>
      el ? getComputedStyle(el).getPropertyValue(prop) : 'ELEMENT_NOT_FOUND';

    return {
      // Scroll/viewport dimensions
      bodyScrollHeight: body.scrollHeight,
      bodyClientHeight: body.clientHeight,
      htmlScrollHeight: html.scrollHeight,
      htmlClientHeight: html.clientHeight,
      windowInnerHeight: window.innerHeight,
      windowInnerWidth: window.innerWidth,

      // Overflow-y computed values
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

      // Bug 1: figure render box dimensions
      figRenderRect: figRender ? figRender.getBoundingClientRect() : null,
      figRenderHeight: figRender ? figRender.getBoundingClientRect().height : null,
      figRenderOverflow: get(figRender, 'overflow'),

      // Can the page actually scroll?
      canScrollVertical: body.scrollHeight > window.innerHeight,
    };
  });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  OBJECTIVE PAGE-LEVEL MEASUREMENTS — Character Viewer');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('── Viewport ──');
  console.log(`  window.innerHeight:     ${metrics.windowInnerHeight}px`);
  console.log(`  window.innerWidth:      ${metrics.windowInnerWidth}px`);

  console.log('\n── Scroll dimensions ──');
  console.log(`  body.scrollHeight:      ${metrics.bodyScrollHeight}px`);
  console.log(`  body.clientHeight:      ${metrics.bodyClientHeight}px`);
  console.log(`  html.scrollHeight:      ${metrics.htmlScrollHeight}px`);
  console.log(`  html.clientHeight:      ${metrics.htmlClientHeight}px`);
  console.log(`  canScrollVertical:      ${metrics.canScrollVertical}  (body.scrollHeight > innerHeight)`);

  console.log('\n── Computed overflow-y chain (html → body → #root → .character-viewer) ──');
  console.log(`  html.overflow-y:         ${metrics.htmlOverflowY}`);
  console.log(`  html.overflow:           ${metrics.htmlOverflow}`);
  console.log(`  body.overflow-y:         ${metrics.bodyOverflowY}`);
  console.log(`  body.overflow:           ${metrics.bodyOverflow}`);
  console.log(`  #root.overflow-y:        ${metrics.rootOverflowY}`);
  console.log(`  #root.overflow:          ${metrics.rootOverflow}`);
  console.log(`  #root.display:           ${metrics.rootDisplay}`);
  console.log(`  #root.min-height:        ${metrics.rootMinHeight}`);
  console.log(`  #root.height:            ${metrics.rootHeight}`);
  console.log(`  .character-viewer.overflow-y: ${metrics.cvOverflowY}`);
  console.log(`  .character-viewer.overflow:   ${metrics.cvOverflow}`);
  console.log(`  .character-viewer.height:     ${metrics.cvHeight}`);
  console.log(`  .character-viewer.max-height: ${metrics.cvMaxHeight}`);

  console.log('\n── Bug 1 regression check: .cv-figure-render ──');
  console.log(`  figRender.height:       ${metrics.figRenderHeight}px`);
  console.log(`  figRender.overflow:     ${metrics.figRenderOverflow}`);
  console.log(`  figRender.getBoundingClientRect():`);
  console.log(`    width=${metrics.figRenderRect?.width}, height=${metrics.figRenderRect?.height}`);
  console.log(`    top=${metrics.figRenderRect?.top}, bottom=${metrics.figRenderRect?.bottom}`);

  // ── Save screenshot artifact ──
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = join(SCREENSHOT_DIR, `character_viewer_scroll_diag_${ts}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`\n── Screenshot artifact ──`);
  console.log(`  Saved to: ${screenshotPath}`);
  console.log(`  (Artifact for Robert to review — NOT self-certified by Devin)`);

  // ── Write raw metrics JSON for docs ──
  const metricsPath = join(SCREENSHOT_DIR, `character_viewer_scroll_metrics_${ts}.json`);
  const fs = await import('fs');
  fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
  console.log(`  Metrics JSON: ${metricsPath}`);

  await browser.close();
  console.log('\nDone.');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
