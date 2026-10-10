// new: ts/tools/playtest/monkey.ts
export type MonkeyKind = 'tap' | 'key' | 'drag' | 'scroll';

export interface MonkeyAction {
  i: number;
  kind: MonkeyKind;
  x?: number;
  y?: number;
  x2?: number;
  y2?: number;
  key?: string;
  dy?: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Mix {
  tap: number;
  key: number;
  drag: number;
  scroll: number;
}

export const DEFAULT_MIX: Mix = { tap: 0.6, key: 0.25, drag: 0.1, scroll: 0.05 };

export const KEY_SET: string[] = [
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'Escape',
  'Tab', 'w', 'a', 's', 'd', '1', '2', '3',
];

export const TARGET_BIAS = 0.7;

const clampInt = (v: number, max: number): number =>
  Math.min(max - 1, Math.max(0, Math.round(v)));

/**
 * The next monkey action. Consumes rng() in a fixed order so a seed replays
 * the identical sequence: kind pick, then per-kind draws (bias draw always
 * for tap/drag, even when there are no targets).
 */
export function nextAction(
  rng: () => number,
  i: number,
  viewport: { w: number; h: number },
  targets: Rect[],
  mix?: Mix,
): MonkeyAction {
  const m = mix ?? DEFAULT_MIX;
  const r = rng();
  let kind: MonkeyKind;
  if (r < m.tap) kind = 'tap';
  else if (r < m.tap + m.key) kind = 'key';
  else if (r < m.tap + m.key + m.drag) kind = 'drag';
  else kind = 'scroll';
  const a: MonkeyAction = { i, kind };
  if (kind === 'tap' || kind === 'drag') {
    const bias = rng();
    let x: number;
    let y: number;
    if (bias < TARGET_BIAS && targets.length > 0) {
      const t = targets[Math.floor(rng() * targets.length)];
      x = t.x + rng() * t.w;
      y = t.y + rng() * t.h;
    } else {
      x = rng() * viewport.w;
      y = rng() * viewport.h;
    }
    a.x = clampInt(x, viewport.w);
    a.y = clampInt(y, viewport.h);
    if (kind === 'drag') {
      a.x2 = clampInt(rng() * viewport.w, viewport.w);
      a.y2 = clampInt(rng() * viewport.h, viewport.h);
    }
  } else if (kind === 'key') {
    a.key = KEY_SET[Math.floor(rng() * KEY_SET.length)];
  } else {
    a.dy = Math.round((rng() - 0.5) * 800);
  }
  return a;
}

export function formatLogLine(a: MonkeyAction): string {
  return JSON.stringify(a);
}

/**
 * Parses a JSONL action log. A last non-blank line that fails to parse is a
 * write cut off by a hang or crash: dropped, partial=true. A bad line
 * anywhere else throws.
 */
export function parseLog(text: string): { actions: MonkeyAction[]; partial: boolean } {
  const raw = text.split('\n');
  const lines: { n: number; s: string }[] = [];
  raw.forEach((s, n) => {
    if (s.trim() !== '') lines.push({ n, s });
  });
  const actions: MonkeyAction[] = [];
  let partial = false;
  for (let k = 0; k < lines.length; k++) {
    try {
      actions.push(JSON.parse(lines[k].s) as MonkeyAction);
    } catch {
      if (k === lines.length - 1) {
        partial = true;
      } else {
        throw new Error(`bad log line ${lines[k].n}`);
      }
    }
  }
  return { actions, partial };
}
