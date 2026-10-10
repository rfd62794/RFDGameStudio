// new: ts/tests/test_playtest_monkey.ts
import { describe, expect, it } from 'vitest';
import { formatFinding } from '../src/engine/playtest';
import { mulberry32 } from '../src/engine/shared/seededRandom';
import {
  blankStreak,
  canvasSignature,
  findBadText,
  isHang,
  lowFps,
  makeFinding,
  severityOf,
  shouldStop,
} from '../tools/playtest/detectors';
import {
  DEFAULT_MIX,
  KEY_SET,
  formatLogLine,
  nextAction,
  parseLog,
  type MonkeyAction,
} from '../tools/playtest/monkey';
import { parseMonkeyArgs } from '../tools/playtest/monkeyArgs';
import {
  renderMonkeyReport,
  type MonkeyDemoResult,
} from '../tools/playtest/monkeyReport';

const VP = { w: 390, h: 844 };

describe('playtest monkey fuzz', () => {
  it('nextAction is deterministic: same seed twice equal, seeds 5 and 6 differ', () => {
    const targets = [{ x: 10, y: 10, w: 50, h: 50 }];
    const run = (seed: number): MonkeyAction[] => {
      const rng = mulberry32(seed);
      return Array.from({ length: 50 }, (_, i) => nextAction(rng, i, VP, targets));
    };
    expect(run(5)).toEqual(run(5));
    expect(run(5)).not.toEqual(run(6));
  });

  it('mix shares match DEFAULT_MIX; points, keys and dy stay in range', () => {
    const rng = mulberry32(1);
    const counts: Record<string, number> = { tap: 0, key: 0, drag: 0, scroll: 0 };
    for (let i = 0; i < 2000; i++) {
      const a = nextAction(rng, i, VP, []);
      counts[a.kind] += 1;
      if (a.kind === 'tap' || a.kind === 'drag') {
        for (const [px, py] of a.kind === 'drag'
          ? [
              [a.x, a.y],
              [a.x2, a.y2],
            ]
          : [[a.x, a.y]]) {
          expect(Number.isInteger(px)).toBe(true);
          expect(Number.isInteger(py)).toBe(true);
          expect(px).toBeGreaterThanOrEqual(0);
          expect(px).toBeLessThanOrEqual(VP.w - 1);
          expect(py).toBeGreaterThanOrEqual(0);
          expect(py).toBeLessThanOrEqual(VP.h - 1);
        }
      }
      if (a.kind === 'key') expect(KEY_SET).toContain(a.key);
      if (a.kind === 'scroll') {
        expect(a.dy).toBeGreaterThanOrEqual(-400);
        expect(a.dy).toBeLessThanOrEqual(400);
      }
    }
    for (const kind of ['tap', 'key', 'drag', 'scroll'] as const) {
      expect(Math.abs(counts[kind] / 2000 - DEFAULT_MIX[kind])).toBeLessThan(0.05);
    }
  });

  it('target bias lands 60-80% of taps inside the single target rect', () => {
    const rect = { x: 100, y: 100, w: 40, h: 40 };
    const rng = mulberry32(3);
    let taps = 0;
    let inside = 0;
    for (let i = 0; i < 3000; i++) {
      const a = nextAction(rng, i, VP, [rect]);
      if (a.kind !== 'tap') continue;
      taps += 1;
      if (
        a.x! >= rect.x &&
        a.x! < rect.x + rect.w &&
        a.y! >= rect.y &&
        a.y! < rect.y + rect.h
      ) {
        inside += 1;
      }
    }
    const share = inside / taps;
    expect(share).toBeGreaterThanOrEqual(0.6);
    expect(share).toBeLessThanOrEqual(0.8);
  });

  it('log round-trips; a cut last line is partial; a mid bad line throws', () => {
    const rng = mulberry32(9);
    const actions = Array.from({ length: 10 }, (_, i) =>
      nextAction(rng, i, VP, []),
    );
    const round = parseLog(`${actions.map(formatLogLine).join('\n')}\n`);
    expect(round.actions).toEqual(actions);
    expect(round.partial).toBe(false);
    const cut = parseLog(
      `${formatLogLine(actions[0])}\n${formatLogLine(actions[1])}\n{"i":3,"ki`,
    );
    expect(cut.actions).toEqual([actions[0], actions[1]]);
    expect(cut.partial).toBe(true);
    expect(() =>
      parseLog(`${formatLogLine(actions[0])}\nnot-json\n${formatLogLine(actions[1])}`),
    ).toThrow('bad log line');
    const blanks = parseLog(
      `\n${formatLogLine(actions[0])}\n\n${formatLogLine(actions[1])}\n`,
    );
    expect(blanks.actions).toEqual([actions[0], actions[1]]);
    expect(blanks.partial).toBe(false);
  });

  it('findBadText flags NaN, undefined and [object Object], not lookalikes', () => {
    const hit = findBadText('Time NaN');
    expect(hit).not.toBeNull();
    expect(hit!).toContain('NaN');
    expect(findBadText('undefined:undefined')).not.toBeNull();
    expect(findBadText('[object Object]')).not.toBeNull();
    expect(findBadText('banana')).toBeNull();
    expect(findBadText('Nan')).toBeNull();
    expect(findBadText('Pandemic')).toBeNull();
    expect(findBadText('')).toBeNull();
  });

  it('canvasSignature and blankStreak classify uniform canvases', () => {
    const same = Array.from({ length: 16 }, () => [7, 7, 7, 255]).flat();
    expect(canvasSignature(same)).toBe('blank');
    expect(canvasSignature([7, 7, 7, 255, 9, 9, 9, 255])).toBe('varied');
    expect(canvasSignature([])).toBe('blank');
    expect(blankStreak(['varied', 'blank', 'blank', 'blank'])).toBe(true);
    expect(blankStreak(['blank', 'blank'])).toBe(false);
    expect(blankStreak(['blank', 'varied', 'blank'])).toBe(false);
  });

  it('isHang trips on an old frame or a pending action only', () => {
    expect(isHang(6000, 0)).toBe(true);
    expect(isHang(100, 11000)).toBe(true);
    expect(isHang(100, 100)).toBe(false);
  });

  it('lowFps flags a slow average, not 60 fps or an empty list', () => {
    expect(lowFps(Array(60).fill(16))).toBe(false);
    expect(lowFps(Array(60).fill(80))).toBe(true);
    expect(lowFps([])).toBe(false);
  });

  it('makeFinding keeps the last 5 actions; shouldStop and severityOf', () => {
    const actions: MonkeyAction[] = Array.from({ length: 8 }, (_, i) => ({
      i,
      kind: 'tap',
      x: i,
      y: i,
    }));
    const f = makeFinding('bad-text', 'm', 42, 7, actions);
    expect(f.lastActions).toHaveLength(5);
    expect(f.lastActions[0].i).toBe(3);
    expect(f.seed).toBe(42);
    expect(shouldStop(Array(9).fill(f))).toBe(false);
    expect(shouldStop(Array(10).fill(f))).toBe(true);
    expect(severityOf('stall')).toBe('soft');
    expect(severityOf('low-fps')).toBe('soft');
    expect(severityOf('blank-canvas')).toBe('hard');
  });

  it('parseMonkeyArgs defaults, live forces readonly, bad input errors', () => {
    const d = parseMonkeyArgs([]);
    expect(d.ok).toBe(true);
    if (d.ok) {
      expect(d.value).toEqual({
        base: 'http://127.0.0.1:5199',
        target: 'local',
        demos: 'all',
        seconds: 60,
        seed: 'random',
        throttleMs: 150,
        viewport: 'phone',
        out: 'docs/state',
        replay: null,
        readonly: false,
      });
    }
    const live = parseMonkeyArgs(['--target', 'live']);
    expect(live.ok && live.value.readonly).toBe(true);
    const seeded = parseMonkeyArgs(['--seed', '42', '--seconds', '30']);
    expect(seeded.ok).toBe(true);
    if (seeded.ok) {
      expect(seeded.value.seed).toBe(42);
      expect(seeded.value.seconds).toBe(30);
    }
    const replay = parseMonkeyArgs(['--demos', 'scrapcrawl', '--replay', 'x.jsonl']);
    expect(replay.ok).toBe(true);
    for (const argv of [
      ['--seconds', '0'],
      ['--seconds', '601'],
      ['--nope'],
      ['--viewport', 'tv'],
      ['--replay', 'x.jsonl'],
    ]) {
      expect(parseMonkeyArgs(argv).ok).toBe(false);
    }
  });

  it('renderMonkeyReport counts verdicts, orders UNSAFE first, lists CLEAN', () => {
    const result = (
      demo: string,
      seed: number,
      findings: ReturnType<typeof makeFinding>[],
    ): MonkeyDemoResult => ({
      demo,
      seed,
      seconds: 60,
      actionCount: 100,
      findings,
      longTasks: 0,
      logPath: `log-${demo}`,
      repro: `repro-${demo}`,
    });
    const results = [
      result('clean_one', 1, []),
      result('soft_one', 2, [makeFinding('stall', 'idle', 2, 40, [])]),
      result('hard_one', 3, [makeFinding('bad-text', 'NaN shown', 3, 9, [])]),
    ];
    const report = renderMonkeyReport('2026-10-10', results);
    const lines = report.split('\n');
    expect(lines[0]).toBe('# Playtest monkey 2026-10-10');
    expect(lines[1]).toBe('CLEAN 1 | NEEDS-LOOK 1 | UNSAFE 1');
    const unsafeIdx = lines.findIndex((l) => l.startsWith('## hard_one: UNSAFE'));
    const needsIdx = lines.findIndex((l) => l.startsWith('## soft_one: NEEDS-LOOK'));
    expect(unsafeIdx).toBeGreaterThanOrEqual(0);
    expect(needsIdx).toBeGreaterThan(unsafeIdx);
    expect(report).toContain('log: log-hard_one');
    expect(report).toContain('repro: repro-hard_one');
    expect(report).toContain('log: log-soft_one');
    expect(report).toContain('repro: repro-soft_one');
    expect(report).toContain('CLEAN: clean_one');
    expect(report).not.toContain('## clean_one');
    expect(renderMonkeyReport('d', [])).toContain('CLEAN: none');
  });

  it('formatFinding renders the L3 finding line exactly', () => {
    expect(
      formatFinding(
        'L3',
        'scrapcrawl',
        'blank-canvas',
        4242,
        212,
        'canvas stayed one colour',
        'r',
      ),
    ).toBe(
      'FINDING scrapcrawl L3/blank-canvas seed=4242 step=212 :: canvas stayed one colour :: repro: r',
    );
  });
});
