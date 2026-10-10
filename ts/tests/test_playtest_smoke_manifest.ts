// new: ts/tests/test_playtest_smoke_manifest.ts
import { describe, expect, it } from 'vitest';
import { formatFinding } from '../src/engine/playtest';
import { parseArgs } from '../tools/playtest/args';
import { SMOKE_ENTRIES } from '../tools/playtest/entries';
import { urlFor, validateEntries, type SmokeEntry } from '../tools/playtest/manifest';
import { renderSmokeReport, type SmokeDemoResult } from '../tools/playtest/smokeReport';
import {
  classifyVerdict,
  isAllowedConsole,
  isClipped,
  tapTargetOk,
  type ChainLink,
} from '../tools/playtest/verdict';

const baseEntry = (id: string): SmokeEntry => ({
  id,
  start: { kind: 'arcade', gameId: id },
  firstMinute: [],
  changeChecks: [],
  controls: [],
});

describe('playtest smoke manifest', () => {
  it('SMOKE_ENTRIES validates clean: 5 entries, unique ids', () => {
    expect(validateEntries(SMOKE_ENTRIES)).toEqual([]);
    expect(SMOKE_ENTRIES).toHaveLength(5);
    expect(new Set(SMOKE_ENTRIES.map((e) => e.id)).size).toBe(5);
  });

  it('validateEntries reports each problem class', () => {
    expect(validateEntries([{ ...baseEntry('x'), id: '' }])).not.toEqual([]);
    const dup = validateEntries([baseEntry('x'), baseEntry('x')]);
    expect(dup.some((p) => p.includes('duplicate'))).toBe(true);
    expect(
      validateEntries([{ ...baseEntry('x'), start: { kind: 'arcade', gameId: '' } }]),
    ).not.toEqual([]);
    const badClick = {
      ...baseEntry('c'),
      firstMinute: [{ do: 'click', target: { text: '' } } as const],
    };
    expect(validateEntries([badClick])).not.toEqual([]);
    const wait0 = { ...baseEntry('w0'), firstMinute: [{ do: 'wait', ms: 0 } as const] };
    expect(validateEntries([wait0])).not.toEqual([]);
    const waitBig = { ...baseEntry('w1'), firstMinute: [{ do: 'wait', ms: 20000 } as const] };
    expect(validateEntries([waitBig])).not.toEqual([]);
  });

  it('urlFor builds the local and live routes, trimming a trailing base slash', () => {
    const arcade = baseEntry('slimeworld');
    const embed: SmokeEntry = {
      ...baseEntry('systemic_extract'),
      start: { kind: 'embed', slug: 'systemic_extract' },
    };
    expect(urlFor(arcade, 'local', 'http://x')).toBe(
      'http://x/arcade/rfdgamestudio/?game=slimeworld',
    );
    expect(urlFor(arcade, 'local', 'http://x/')).toBe(
      'http://x/arcade/rfdgamestudio/?game=slimeworld',
    );
    expect(urlFor(embed, 'local', 'http://x')).toBe('http://x/arcade/systemic_extract/');
    expect(urlFor(arcade, 'live', 'http://x')).toBe('http://x/games/slimeworld/');
    expect(urlFor(embed, 'live', 'http://x/')).toBe('http://x/games/systemic_extract/');
  });

  it('isAllowedConsole allows favicon at any type and AudioContext warnings only', () => {
    expect(isAllowedConsole('error', 'Failed to load resource: ... /favicon.ico')).toBe(true);
    expect(isAllowedConsole('warning', 'The AudioContext was not allowed to start')).toBe(true);
    expect(isAllowedConsole('error', 'AudioContext boom')).toBe(false);
    expect(isAllowedConsole('error', 'TypeError: x is undefined')).toBe(false);
  });

  it('isClipped sees hidden-ancestor and viewport clipping, not scrolling or the fold', () => {
    const vp = { w: 390, h: 844 };
    const real: ChainLink[] = [
      { tag: 'button', rect: { x: 571, y: 20, w: 66, h: 30 }, overflowX: 'visible', overflowY: 'visible' },
      { tag: 'div', rect: { x: 12, y: 10, w: 366, h: 50 }, overflowX: 'hidden', overflowY: 'hidden' },
      { tag: 'html', rect: { x: 0, y: 0, w: 390, h: 844 }, overflowX: 'visible', overflowY: 'visible' },
    ];
    expect(isClipped(real, vp)).toBe(true);
    const inside: ChainLink[] = [
      { tag: 'button', rect: { x: 300, y: 20, w: 60, h: 30 }, overflowX: 'visible', overflowY: 'visible' },
      real[1],
      real[2],
    ];
    expect(isClipped(inside, vp)).toBe(false);
    const autoAnc: ChainLink[] = [
      inside[0],
      { tag: 'div', rect: { x: 0, y: 0, w: 100, h: 50 }, overflowX: 'auto', overflowY: 'auto' },
      real[2],
    ];
    expect(isClipped(autoAnc, vp)).toBe(false);
    const belowFold: ChainLink[] = [
      { tag: 'button', rect: { x: 100, y: 2000, w: 60, h: 30 }, overflowX: 'visible', overflowY: 'visible' },
      { tag: 'div', rect: { x: 0, y: 0, w: 390, h: 844 }, overflowX: 'visible', overflowY: 'visible' },
      real[2],
    ];
    expect(isClipped(belowFold, vp)).toBe(false);
    const offRight: ChainLink[] = [
      { tag: 'button', rect: { x: 380, y: 20, w: 60, h: 30 }, overflowX: 'visible', overflowY: 'visible' },
      { tag: 'div', rect: { x: 0, y: 0, w: 390, h: 844 }, overflowX: 'visible', overflowY: 'visible' },
      real[2],
    ];
    expect(isClipped(offRight, vp)).toBe(true);
    expect(isClipped([], vp)).toBe(false);
  });

  it('tapTargetOk needs both dimensions at the minimum (44 default)', () => {
    expect(tapTargetOk({ x: 0, y: 0, w: 44, h: 44 })).toBe(true);
    expect(tapTargetOk({ x: 0, y: 0, w: 40, h: 44 })).toBe(false);
    expect(tapTargetOk({ x: 0, y: 0, w: 44, h: 43 })).toBe(false);
    expect(tapTargetOk({ x: 0, y: 0, w: 30, h: 30 }, 24)).toBe(true);
  });

  it('classifyVerdict: empty SAFE, soft NEEDS-LOOK, any hard UNSAFE', () => {
    const soft = { demo: 'd', viewport: 'v', check: 'c', severity: 'soft' as const, message: 'm', step: 0 };
    const hard = { ...soft, severity: 'hard' as const };
    expect(classifyVerdict([])).toBe('SAFE');
    expect(classifyVerdict([soft])).toBe('NEEDS-LOOK');
    expect(classifyVerdict([soft, hard])).toBe('UNSAFE');
  });

  it('renderSmokeReport orders UNSAFE then NEEDS-LOOK and counts the header', () => {
    const results: SmokeDemoResult[] = [
      {
        demo: 'needs_one',
        verdict: 'NEEDS-LOOK',
        findings: [
          { demo: 'needs_one', viewport: '390x844', check: 'tap-target-small', severity: 'soft', message: "'OK' is 30x30 px", step: 0 },
        ],
        firstActionMs: 2500,
        screenshots: ['docs/state/playtest-x/needs_one-390-load.png'],
        repro: 'repro-needs',
      },
      {
        demo: 'unsafe_one',
        verdict: 'UNSAFE',
        findings: [
          { demo: 'unsafe_one', viewport: '1280x720', check: 'nan-text', severity: 'hard', message: 'NaN in HUD', step: 2 },
        ],
        firstActionMs: null,
        screenshots: ['docs/state/playtest-x/unsafe_one-1280-load.png'],
        repro: 'repro-unsafe',
      },
      {
        demo: 'safe_one',
        verdict: 'SAFE',
        findings: [],
        firstActionMs: 900,
        screenshots: [],
        repro: 'repro-safe',
      },
    ];
    const report = renderSmokeReport('2026-10-08', results);
    const lines = report.split('\n');
    expect(lines[0]).toBe('# Playtest smoke 2026-10-08');
    expect(lines[1]).toBe('SAFE 1 | NEEDS-LOOK 1 | UNSAFE 1');
    const unsafeIdx = lines.findIndex((l) => l === '## unsafe_one: UNSAFE');
    const needsIdx = lines.findIndex((l) => l === '## needs_one: NEEDS-LOOK');
    expect(unsafeIdx).toBeGreaterThanOrEqual(0);
    expect(needsIdx).toBeGreaterThan(unsafeIdx);
    expect(report).toContain('repro: repro-unsafe');
    expect(report).toContain('repro: repro-needs');
    expect(report).toContain('SAFE: safe_one');
    expect(report).not.toContain('## safe_one');
    expect(report).not.toContain('repro-safe');
    expect(renderSmokeReport('d', [])).toContain('SAFE: none');
  });

  it('parseArgs defaults, live implies readonly, bad input collects errors', () => {
    const d = parseArgs([]);
    expect(d.ok).toBe(true);
    if (d.ok) {
      expect(d.value).toEqual({
        base: 'http://127.0.0.1:5199',
        target: 'local',
        demos: 'all',
        out: 'docs/state',
        readonly: false,
        viewports: ['desktop', 'phone'],
      });
    }
    const live = parseArgs(['--target', 'live']);
    expect(live.ok && live.value.readonly).toBe(true);
    const dv = parseArgs(['--demos', 'a,b', '--viewports', 'phone']);
    expect(dv.ok).toBe(true);
    if (dv.ok) {
      expect(dv.value.demos).toEqual(['a', 'b']);
      expect(dv.value.viewports).toEqual(['phone']);
    }
    const nope = parseArgs(['--nope']);
    expect(nope.ok).toBe(false);
    const noBase = parseArgs(['--base']);
    expect(noBase.ok).toBe(false);
    if (!noBase.ok) expect(noBase.errors.length).toBeGreaterThan(0);
    const badTarget = parseArgs(['--target', 'x']);
    expect(badTarget.ok).toBe(false);
    if (!badTarget.ok) expect(badTarget.errors.length).toBeGreaterThan(0);
  });

  it('formatFinding renders the L2 finding line exactly', () => {
    expect(
      formatFinding(
        'L2',
        'systemic_extract',
        'control-clipped',
        'script',
        0,
        'NEW RUN at x=571 w=66',
        'cd ts && npx vite-node tools/playtest-smoke.ts -- --demos systemic_extract',
      ),
    ).toBe(
      'FINDING systemic_extract L2/control-clipped seed=script step=0 :: NEW RUN at x=571 w=66 :: repro: cd ts && npx vite-node tools/playtest-smoke.ts -- --demos systemic_extract',
    );
  });
});
