import type { SiteStatusEntry, SiteStatusHub, StatusBadge } from './site-pages.types';

/**
 * Pure functions that convert the structured site-pages data into
 * Hugo-compatible markdown files (one hub page + one detail page per
 * project thread).
 *
 * The output follows the existing "Games, Engines, and Systems" pattern:
 * - type: system, category: Games/Engines/Systems
 * - Same front matter shape as rpgcore.md, operatorgame.md, etc.
 * - Hub page has a card grid linking to detail pages
 * - Detail pages use the full bodyContent, not the compressed card summary
 * - Each detail page has a back link to the hub
 *
 * No I/O — the writing happens in the tool script.
 */

/** Hugo front matter date format: YYYY-MM-DD */
const HUGO_DATE = '2026-08-15';

/** Status badge → Tailwind color classes for the hub card. */
const BADGE_CLASSES: Record<StatusBadge, string> = {
  'Live': 'bg-green-500 bg-opacity-20 text-green-400',
  'In Progress': 'bg-yellow-500 bg-opacity-20 text-yellow-400',
  'Designed': 'bg-cyan-500 bg-opacity-20 text-cyan-400',
  'Complete': 'bg-cyan-500 bg-opacity-20 text-cyan-400',
};

/**
 * Generate the hub page markdown. Contains a card grid with one card
 * per entry, each linking to its dedicated breakdown page.
 */
export function generateHubMarkdown(hub: SiteStatusHub, entries: SiteStatusEntry[]): string {
  const lines: string[] = [];

  // --- Front matter ---
  lines.push('---');
  lines.push(`title: "${hub.title}"`);
  lines.push('category: Games/Engines/Systems');
  lines.push(`date: ${HUGO_DATE}`);
  lines.push(`tagline: "${hub.tagline}"`);
  lines.push('type: system');
  lines.push('consulting: false');
  lines.push(`problem: "${hub.problem}"`);
  lines.push('approach:');
  for (const a of hub.approach) {
    lines.push(`  - "${a}"`);
  }
  lines.push('highlights:');
  for (const h of hub.highlights) {
    lines.push(`  - "${h}"`);
  }
  lines.push(`stack: [${hub.stack.map(s => `"${s}"`).join(', ')}]`);
  lines.push('---');
  lines.push('');

  // --- Body ---
  lines.push(hub.intro);
  lines.push('');
  lines.push('<div class="grid md:grid-cols-2 gap-8 mt-8">');
  lines.push('');

  for (const entry of entries) {
    lines.push(`<!-- Card: ${entry.name} -->`);
    lines.push('<article class="bg-gray-900 rounded-lg border border-gray-800 hover:border-cyan-500 transition overflow-hidden">');
    lines.push('    <div class="p-8">');
    lines.push('        <div class="flex items-center justify-between mb-3">');
    lines.push(`            <h3 class="text-2xl font-bold text-white">${entry.name}</h3>`);
    lines.push(`            <span class="px-3 py-1 ${BADGE_CLASSES[entry.statusBadge]} rounded-full text-sm font-semibold">${entry.statusBadge}</span>`);
    lines.push('        </div>');
    // Tagline as subtitle
    lines.push(`        <p class="text-gray-400 mb-4">${entry.tagline}</p>`);
    // Card summary
    lines.push(`        <p class="text-gray-300 mb-6">${entry.cardSummary}</p>`);
    // Link to detail page
    lines.push(`        <a href="/projects/${entry.id}/" class="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center">`);
    lines.push('            Full Breakdown <span class="ml-2">&rarr;</span>');
    lines.push('        </a>');
    lines.push('    </div>');
    lines.push('</article>');
    lines.push('');
  }

  lines.push('</div>');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('### Deferred / Routed Elsewhere');
  lines.push('');
  lines.push(hub.deferredNote);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`*This page is the hub. Each card links to a dedicated breakdown page with the full real history. [&larr; Back to Projects](/projects/)*`);

  return lines.join('\n');
}

/**
 * Generate a single detail page markdown. Uses the full bodyContent,
 * not the compressed card summary. Includes a back link to the hub.
 */
export function generateDetailMarkdown(entry: SiteStatusEntry, hubId: string): string {
  const lines: string[] = [];

  // --- Front matter ---
  lines.push('---');
  lines.push(`title: "${entry.name} — Studio Status"`);
  lines.push('category: Games/Engines/Systems');
  lines.push(`date: ${HUGO_DATE}`);
  lines.push(`tagline: "${entry.tagline}"`);
  lines.push('type: system');
  lines.push('consulting: false');
  lines.push(`problem: "${entry.problem}"`);
  lines.push('approach:');
  for (const a of entry.approach) {
    lines.push(`  - "${a}"`);
  }
  lines.push('highlights:');
  for (const h of entry.highlights) {
    lines.push(`  - "${h}"`);
  }
  lines.push(`stack: [${entry.stack.map(s => `"${s}"`).join(', ')}]`);
  lines.push('---');
  lines.push('');

  // --- Body: the full §1 content, not the compressed card summary ---
  lines.push(entry.bodyContent);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`[&larr; Back to Studio Status](/projects/${hubId}/) · [Back to Projects](/projects/)*`);

  return lines.join('\n');
}

/**
 * Generate all pages: the hub + one detail page per entry.
 * Returns a map of filename → markdown content.
 */
export function generateAllSitePages(
  hub: SiteStatusHub,
  entries: SiteStatusEntry[],
): Map<string, string> {
  const pages = new Map<string, string>();
  pages.set(`${hub.id}.md`, generateHubMarkdown(hub, entries));
  for (const entry of entries) {
    pages.set(`${entry.id}.md`, generateDetailMarkdown(entry, hub.id));
  }
  return pages;
}
