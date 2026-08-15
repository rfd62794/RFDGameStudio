/**
 * Generates Hugo-compatible markdown files for the Interactive Status
 * Board site pages (1 hub + 5 detail pages) from the structured data
 * in ts/src/status/site-pages.data.ts.
 *
 * Output is written to a staging directory within RFDGameStudio
 * (docs/site-status-pages/). The site repo's sync_status_pages.py
 * script then ports these to content/projects/ during the site build
 * — same pipeline pattern as sync_games.py.
 *
 * Usage (from ts/):
 *   npx vite-node tools/generate-site-status-pages.ts
 *
 * Or from repo root:
 *   npx vite-node ts/tools/generate-site-status-pages.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITE_STATUS_HUB, SITE_STATUS_ENTRIES } from '../src/status/site-pages.data';
import { generateAllSitePages } from '../src/status/generateSitePages';

const pages = generateAllSitePages(SITE_STATUS_HUB, SITE_STATUS_ENTRIES);

// Write to docs/site-status-pages/ (staging dir, ported by sync_status_pages.py)
const outputDir = resolve(__dirname, '..', '..', 'docs', 'site-status-pages');
mkdirSync(outputDir, { recursive: true });

for (const [filename, content] of pages) {
  const outputPath = resolve(outputDir, filename);
  writeFileSync(outputPath, content, 'utf-8');
  console.log(`Generated: ${outputPath}`);
}

console.log(`\nTotal pages: ${pages.size} (1 hub + ${SITE_STATUS_ENTRIES.length} detail)`);
console.log(`Staging dir: ${outputDir}`);
console.log(`\nNext step: run scripts/site/sync_status_pages.py in RFD_IT_Services_Site to port to content/projects/`);
