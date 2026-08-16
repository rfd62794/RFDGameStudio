// @vitest-environment node
//
// Interactive Status Board — Site Pages Test Anchors
//
// Verifies the 5 test anchors from the directive §3:
//   1. test_existing_pattern_read_and_reused — real hub/card/detail structure reused
//   2. test_all_cards_present_and_clickable — all 5 cards present, each links to its detail page
//   3. test_dedicated_pages_use_full_content — detail pages use full §1 content, not compressed
//   4. test_navigation_back_to_hub_works — detail pages have a working path back to the hub
//   5. test_no_regression — current floor holds
//
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATUS_BOARD } from '../src/status/board.data';
import { SITE_STATUS_HUB, SITE_STATUS_ENTRIES } from '../src/status/site-pages.data';
import { generateHubMarkdown, generateDetailMarkdown, generateAllSitePages } from '../src/status/generateSitePages';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');
const stagingDir = resolve(repoRoot, 'docs', 'site-status-pages');

// --- Test 1: Existing pattern read and reused ---

describe('test_existing_pattern_read_and_reused', () => {
  it('hub page uses the same Hugo front matter shape as the real existing pattern (type: system, category: Games/Engines/Systems)', () => {
    const hubMd = generateHubMarkdown(SITE_STATUS_HUB, SITE_STATUS_ENTRIES);
    // Same front matter fields as games-engines-systems.md and legacy-projects.md
    expect(hubMd).toContain('type: system');
    expect(hubMd).toContain('category: Games/Engines/Systems');
    expect(hubMd).toContain('tagline:');
    expect(hubMd).toContain('problem:');
    expect(hubMd).toContain('approach:');
    expect(hubMd).toContain('highlights:');
    expect(hubMd).toContain('stack:');
  });

  it('hub page reuses the real card HTML pattern from projects/list.html (bg-gray-900, border-gray-800, hover:border-cyan-500)', () => {
    const hubMd = generateHubMarkdown(SITE_STATUS_HUB, SITE_STATUS_ENTRIES);
    // The real card classes from themes/portfolio/layouts/projects/list.html
    expect(hubMd).toContain('bg-gray-900');
    expect(hubMd).toContain('border-gray-800');
    expect(hubMd).toContain('hover:border-cyan-500');
    // The real "Read More →" pattern (we use "Full Breakdown →" via &rarr; entity)
    expect(hubMd).toContain('text-cyan-400');
    expect(hubMd).toContain('&rarr;');
  });

  it('detail pages use the same front matter shape as real existing project pages (rpgcore.md pattern)', () => {
    const detailMd = generateDetailMarkdown(SITE_STATUS_ENTRIES[0]!, SITE_STATUS_HUB.id);
    // Same front matter shape as rpgcore.md
    expect(detailMd).toContain('type: system');
    expect(detailMd).toContain('category: Games/Engines/Systems');
    expect(detailMd).toContain('tagline:');
    expect(detailMd).toContain('problem:');
    expect(detailMd).toContain('approach:');
    expect(detailMd).toContain('highlights:');
    expect(detailMd).toContain('stack:');
  });
});

// --- Test 2: All cards present and clickable ---

describe('test_all_cards_present_and_clickable', () => {
  it('all 5 project cards present in the hub markdown', () => {
    const hubMd = generateHubMarkdown(SITE_STATUS_HUB, SITE_STATUS_ENTRIES);
    expect(SITE_STATUS_ENTRIES.length).toBe(5);
    for (const entry of SITE_STATUS_ENTRIES) {
      expect(hubMd).toContain(entry.name);
      expect(hubMd).toContain(entry.statusBadge);
      expect(hubMd).toContain(entry.cardSummary);
    }
  });

  it('each card links to its real dedicated page permalink', () => {
    const hubMd = generateHubMarkdown(SITE_STATUS_HUB, SITE_STATUS_ENTRIES);
    for (const entry of SITE_STATUS_ENTRIES) {
      // Hugo permalink: /projects/{slug}/
      expect(hubMd).toContain(`/projects/${entry.id}/`);
    }
  });

  it('each detail page file exists in the staging directory', () => {
    for (const entry of SITE_STATUS_ENTRIES) {
      const filePath = resolve(stagingDir, `${entry.id}.md`);
      expect(existsSync(filePath)).toBe(true);
    }
  });

  it('hub page file exists in the staging directory', () => {
    const filePath = resolve(stagingDir, `${SITE_STATUS_HUB.id}.md`);
    expect(existsSync(filePath)).toBe(true);
  });
});

// --- Test 3: Dedicated pages use full content ---

describe('test_dedicated_pages_use_full_content', () => {
  it('detail pages contain the full bodyContent, not the compressed cardSummary', () => {
    for (const entry of SITE_STATUS_ENTRIES) {
      const detailMd = generateDetailMarkdown(entry, SITE_STATUS_HUB.id);
      // The full bodyContent must be present
      expect(detailMd).toContain(entry.bodyContent);
      // The bodyContent should be substantially longer than the cardSummary
      expect(entry.bodyContent.length).toBeGreaterThan(entry.cardSummary.length * 3);
    }
  });

  it('detail pages contain real section headings from the full content', () => {
    // Shoal should have "Six-Stage Performance Investigation"
    const shoal = SITE_STATUS_ENTRIES.find(e => e.id === 'studio-status-shoal')!;
    const shoalMd = generateDetailMarkdown(shoal, SITE_STATUS_HUB.id);
    expect(shoalMd).toContain('Six-Stage Performance Investigation');
    expect(shoalMd).toContain('artGen Consumption');

    // Mutant Battle Ball should have "Match Engine Investigation" and "Paper Doll Module"
    const mbb = SITE_STATUS_ENTRIES.find(e => e.id === 'studio-status-mutant-battle-ball')!;
    const mbbMd = generateDetailMarkdown(mbb, SITE_STATUS_HUB.id);
    expect(mbbMd).toContain('Match Engine Investigation');
    expect(mbbMd).toContain('Paper Doll Module');
    expect(mbbMd).toContain('Roster-Meaning Question');

    // Facility Escape should have "Locked Infrastructure" and "Loud Meter"
    const fe = SITE_STATUS_ENTRIES.find(e => e.id === 'studio-status-facility-escape')!;
    const feMd = generateDetailMarkdown(fe, SITE_STATUS_HUB.id);
    expect(feMd).toContain('Locked Infrastructure');
    expect(feMd).toContain('Loud Meter');
    expect(feMd).toContain('Rush System');
  });

  it('hub cards do NOT contain the full bodyContent (only the summary)', () => {
    const hubMd = generateHubMarkdown(SITE_STATUS_HUB, SITE_STATUS_ENTRIES);
    // The hub should contain the cardSummary but NOT the full bodyContent
    for (const entry of SITE_STATUS_ENTRIES) {
      expect(hubMd).toContain(entry.cardSummary);
      // Pick a unique phrase from bodyContent that's not in cardSummary
      // (bodyContent is much longer, so a section heading won't be in the hub)
      const bodyLines = entry.bodyContent.split('\n');
      const sectionHeading = bodyLines.find(l => l.startsWith('## '));
      if (sectionHeading) {
        expect(hubMd).not.toContain(sectionHeading);
      }
    }
  });
});

// --- Test 4: Navigation back to hub works ---

describe('test_navigation_back_to_hub_works', () => {
  it('each detail page has a back link to the hub', () => {
    for (const entry of SITE_STATUS_ENTRIES) {
      const detailMd = generateDetailMarkdown(entry, SITE_STATUS_HUB.id);
      // Back link to hub: /projects/studio-status/
      expect(detailMd).toContain(`/projects/${SITE_STATUS_HUB.id}/`);
      // Back link text
      expect(detailMd).toContain('Back to Studio Status');
    }
  });

  it('each detail page also has a back link to the projects list', () => {
    for (const entry of SITE_STATUS_ENTRIES) {
      const detailMd = generateDetailMarkdown(entry, SITE_STATUS_HUB.id);
      expect(detailMd).toContain('/projects/');
      expect(detailMd).toContain('Back to Projects');
    }
  });

  it('hub page has a back link to the projects list', () => {
    const hubMd = generateHubMarkdown(SITE_STATUS_HUB, SITE_STATUS_ENTRIES);
    expect(hubMd).toContain('/projects/');
    expect(hubMd).toContain('Back to Projects');
  });
});

// --- Test 5: No regression ---

describe('test_no_regression', () => {
  it('generateAllSitePages produces exactly 6 pages (1 hub + 5 detail)', () => {
    const pages = generateAllSitePages(SITE_STATUS_HUB, SITE_STATUS_ENTRIES);
    expect(pages.size).toBe(6);
    expect(pages.has(`${SITE_STATUS_HUB.id}.md`)).toBe(true);
    for (const entry of SITE_STATUS_ENTRIES) {
      expect(pages.has(`${entry.id}.md`)).toBe(true);
    }
  });

  it('all generated markdown files have valid Hugo front matter (start with ---)', () => {
    const pages = generateAllSitePages(SITE_STATUS_HUB, SITE_STATUS_ENTRIES);
    for (const [_filename, content] of pages) {
      expect(content.startsWith('---')).toBe(true);
      // Front matter must close with --- before the body
      const secondDelimiter = content.indexOf('---', 3);
      expect(secondDelimiter).toBeGreaterThan(0);
      // Must have a title
      expect(content).toContain('title:');
    }
  });

  it('staging directory contains exactly 6 files', () => {
    const files = readdirSync(stagingDir).filter(f => f.endsWith('.md'));
    expect(files.length).toBe(6);
  });

  it('existing status board data and tests are unaffected (STATUS_BOARD still has its entries)', () => {
    // Verify the existing status board is not broken by the new site-pages work
    expect(STATUS_BOARD.length).toBeGreaterThan(0);
    // The existing board has entries we know about
    const shoal = STATUS_BOARD.find(e => e.id === 'shoal');
    expect(shoal).toBeTruthy();
    const pog = STATUS_BOARD.find(e => e.id === 'planet_of_greed');
    expect(pog).toBeTruthy();
  });
});
