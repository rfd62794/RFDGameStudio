import type { ProjectEntry, ProjectCategory, ProjectStatus } from './types';

const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  live_catalog: 'Live Catalog',
  separate_infrastructure: 'Separate Infrastructure',
  ai_studio_track: 'AI-Studio-Origin Track',
  retired: 'Retired',
};

const CATEGORY_ORDER: ProjectCategory[] = [
  'live_catalog',
  'separate_infrastructure',
  'ai_studio_track',
  'retired',
];

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Active',
  shipped_mature: 'Shipped/Mature',
  shipped_deliberately_paused: 'Shipped/Deliberately Paused',
  blocked: 'Blocked',
  status_unconfirmed: 'Status Unconfirmed',
  retired: 'Retired',
};

function escapePipe(text: string): string {
  return text.replace(/\|/g, '\\|');
}

function formatLastUpdated(entry: ProjectEntry): string {
  if (entry.verificationMethod) {
    return `${entry.lastUpdated} (${entry.verificationMethod})`;
  }
  return entry.lastUpdated;
}

function renderCategorySection(category: ProjectCategory, entries: ProjectEntry[]): string {
  if (entries.length === 0) return '';

  const label = CATEGORY_LABELS[category];
  const lines: string[] = [];

  lines.push(`## ${CATEGORY_ORDER.indexOf(category) + 1}. ${label}`);

  if (category === 'retired') {
    lines.push('');
    lines.push('| Game | Status | Superseded By | Current State | Last Updated |');
    lines.push('|---|---|---|---|---|');
    for (const e of entries) {
      lines.push(
        `| **${escapePipe(e.name)}** | ${STATUS_LABELS[e.status]} | ${escapePipe(e.supersededBy ?? '—')} | ${escapePipe(e.currentState)} | ${formatLastUpdated(e)} |`,
      );
    }
  } else {
    lines.push('');
    lines.push('| Game | Status | Current State | Next Real Action | Menu | Tutorial | Visual | Sound | Last Updated |');
    lines.push('|---|---|---|---|---|---|---|---|---|');
    for (const e of entries) {
      const caps = e.capabilities ?? {};
      lines.push(
        `| **${escapePipe(e.name)}** | ${STATUS_LABELS[e.status]} | ${escapePipe(e.currentState)} | ${escapePipe(e.nextAction ?? '—')} | ${caps.mainMenu ?? '—'} | ${caps.tutorial ?? '—'} | ${escapePipe(caps.graphicalUpgrade ?? '—')} | ${caps.soundEffects ?? '—'} | ${formatLastUpdated(e)} |`,
      );
    }
  }

  return lines.join('\n');
}

/**
 * Pure function: converts the STATUS_BOARD data into the markdown
 * representation used by docs/state/StatusBoard.md.
 * No I/O — the writing happens in the generation script.
 */
export function generateMarkdown(entries: ProjectEntry[]): string {
  const sections: string[] = [];

  sections.push('<!-- GENERATED FILE — edit ts/src/status/board.data.ts, then run ts/tools/generate-status-board.ts -->');
  sections.push('');
  sections.push('# RFD Game Studio — Status Board');
  sections.push('');
  sections.push('*August 15, 2026 | RFD IT Services Ltd. | Generated from `ts/src/status/board.data.ts`.*');
  sections.push('');
  sections.push('> **How this stays alive:** refreshed at natural checkpoints — the start of a');
  sections.push('> big multi-thread studio session, or whenever three or more threads below');
  sections.push('> have moved since the last refresh. Not continuously maintained, and not');
  sections.push('> meant to be. Each game\'s own `docs/state/current.md` (or AI-Studio');
  sections.push('> equivalent) remains the real source of truth; this is a rollup, not a');
  sections.push('> replacement. If this document and a project\'s own state file disagree,');
  sections.push('> the project\'s own file wins.');
  sections.push('');
  sections.push('---');
  sections.push('');

  // Legend
  sections.push('## Legend');
  sections.push('');
  sections.push('**Active** — real, ongoing work this month. **Shipped/Mature** — live,');
  sections.push('stable, touched only for maintenance. **Shipped/Deliberately Paused** — a');
  sections.push('real, chosen stopping point (engine-death pattern named explicitly), not a');
  sections.push('stall. **Blocked** — real work exists, next step needs a decision or a');
  sections.push('verify-first check before continuing. **Retired** — superseded, source');
  sections.push('preserved read-only, explicitly removed from the live registry. **Status');
  sections.push('Unconfirmed** — real evidence this exists and had real work done on it, but');
  sections.push('no recent enough confirmation to state its current state.');
  sections.push('');
  sections.push('---');
  sections.push('');

  // Category sections
  for (const category of CATEGORY_ORDER) {
    const categoryEntries = entries.filter(e => e.category === category);
    const section = renderCategorySection(category, categoryEntries);
    if (section) {
      sections.push(section);
      sections.push('');
      sections.push('---');
      sections.push('');
    }
  }

  // Shared engine infrastructure section
  sections.push('## 5. Shared Engine Infrastructure');
  sections.push('');
  sections.push('| Piece | Status | Note |');
  sections.push('|---|---|---|');
  sections.push('| Four-file Lua contract + `RFDStudioMCP` | Stable, live | 28/0/0, port 8025, NSSM-registered |');
  sections.push('| TS-native default (ADR-010/ADR-013) | Stable, current policy | Now the actual default, not the exception |');
  sections.push('| Shared UI components (`ts/src/ui/components/`, ADR-008) | Active use | 6+ games |');
  sections.push('| OnboardingGate (`ts/src/ui/components/OnboardingGate.tsx`) | Built, 2 consumers | Shared fire-once gate mechanism extracted from SlimeWorld. Consumed by SlimeWorld (original) + Planet of Greed (validation) |');
  sections.push('| Guided First-Action Walkthrough | Single instance, watching | `planetofgreed/GuidedWalkthrough.tsx` — guides real gameplay decisions with state-derived defaults. Not extracted yet — watching for a second independent build |');
  sections.push('| Shared logic (`ts/src/engine/shared/`) | Active, first-class | ADR-014: shared engine modules are the default, not demand-gated |');
  sections.push('| `artGen` module | Built AND consumed | Consumed by Shoal (canvas paths, hunger-aware specs) and SlimeWorld (seeded random, polygon generation) — ADR-014 proof case |');
  sections.push('| Standalone publishing pipeline + `RFD_IT_Publishing` | Working | 7 games packaged, Butler-based, real analytics confirmed |');
  sections.push('| Rust runtime (mlua bridge) | **Confirmed Far Future Dream** | Not active roadmap — VoidDrift remains fully separate native Rust |');
  sections.push('| Bevy vs. egui (studio-wide Rust graphical layer) | Open, deprioritized | Low priority — see Trinity Siege\'s row above |');
  sections.push('');
  sections.push('---');
  sections.push('');

  // Footer
  sections.push('*RFD Game Studio Status Board | Generated from `ts/src/status/board.data.ts`*');
  sections.push('*A rollup, not a rewrite. Refresh it, don\'t rebuild it.*');

  return sections.join('\n');
}
