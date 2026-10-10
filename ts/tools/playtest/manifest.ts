// new: ts/tools/playtest/manifest.ts
export type Locator = { text: string } | { role: string; name: string };
export type SmokeStep =
  | { do: 'click'; target: Locator; expect?: string[]; expectGone?: string[] }
  | { do: 'key'; key: string; expect?: string[] }
  | { do: 'wait'; ms: number }
  | { do: 'see'; text: string[] };
export interface SmokeEntry {
  id: string;
  start: { kind: 'arcade'; gameId: string } | { kind: 'embed'; slug: string };
  firstMinute: SmokeStep[];
  changeChecks: SmokeStep[][];
  controls: string[];
  notes?: string;
}
export type Target = 'local' | 'live';

type RawStep = {
  do: string;
  target?: Locator;
  key?: string;
  ms?: number;
  text?: string[];
};

function validateStep(raw: SmokeStep, where: string): string[] {
  const step = raw as RawStep;
  const problems: string[] = [];
  switch (step.do) {
    case 'click': {
      const target = step.target;
      if (!target) {
        problems.push(`${where}: click step has no target`);
      } else if ('text' in target) {
        if (target.text.trim() === '') {
          problems.push(`${where}: click target has empty text`);
        }
      } else if (target.name.trim() === '') {
        problems.push(`${where}: click target has empty name`);
      }
      break;
    }
    case 'key':
      break;
    case 'wait':
      if (step.ms === undefined || step.ms <= 0 || step.ms > 10000) {
        problems.push(`${where}: wait ms must be 1..10000`);
      }
      break;
    case 'see':
      if (!step.text || step.text.length === 0) {
        problems.push(`${where}: see step has no texts`);
      }
      break;
    default:
      problems.push(`${where}: unknown step '${step.do}'`);
  }
  return problems;
}

export function validateEntries(entries: SmokeEntry[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    const label = entry.id && entry.id.trim() !== '' ? entry.id : '(empty id)';
    if (!entry.id || entry.id.trim() === '') {
      problems.push('entry has empty id');
    } else if (seen.has(entry.id)) {
      problems.push(`${entry.id}: duplicate id`);
    }
    seen.add(entry.id);
    if (!entry.start) {
      problems.push(`${label}: no start`);
    } else if (entry.start.kind === 'arcade') {
      if (!entry.start.gameId || entry.start.gameId.trim() === '') {
        problems.push(`${label}: arcade start has no gameId`);
      }
    } else if (entry.start.kind === 'embed') {
      if (!entry.start.slug || entry.start.slug.trim() === '') {
        problems.push(`${label}: embed start has no slug`);
      }
    } else {
      problems.push(`${label}: unknown start kind`);
    }
    (entry.firstMinute ?? []).forEach((s, i) => {
      problems.push(...validateStep(s, `${label} firstMinute[${i}]`));
    });
    (entry.changeChecks ?? []).forEach((check, ci) => {
      check.forEach((s, i) => {
        problems.push(...validateStep(s, `${label} changeChecks[${ci}][${i}]`));
      });
    });
  }
  return problems;
}

export function urlFor(entry: SmokeEntry, target: Target, base: string): string {
  const b = base.replace(/\/+$/, '');
  if (target === 'local') {
    return entry.start.kind === 'arcade'
      ? `${b}/arcade/rfdgamestudio/?game=${entry.start.gameId}`
      : `${b}/arcade/${entry.start.slug}/`;
  }
  return entry.start.kind === 'arcade'
    ? `${b}/games/${entry.start.gameId}/`
    : `${b}/games/${entry.start.slug}/`;
}
