import { describe, it, expect, vi, beforeAll } from 'vitest';

/**
 * succession-balance-sim.ts is a script module: it has no exports and runs
 * runAll() at import time. Its entire observable contract is the report it
 * prints to console.log, so these tests spy on console.log, dynamically
 * import the module (which executes all 18 deterministic simulations), and
 * then check the report's structure and internal consistency.
 */

const STRATEGIES = [
  'RushOneFigure',
  'SpreadEvenly',
  'SafeAppealsOnly',
  'ScoutThenEvidence',
  'WhisperHeavy',
  'DiscreditHeavy',
];
const ORIGINS = ['bastard_scion', 'disgraced_knight', 'merchant_banker'];
const RIVALS = ['aldric', 'vivienne'];
const CLAIMANT_CELLS = ['player', 'aldric', 'vivienne', '-'];

const MOVE_TOKEN =
  /^(S\d+:(scout|(whisper|appeal|evidence|discredit)→\w+(\(\w+\))?)|NO-OP→fallback:appeal)$/;

async function importSim(): Promise<string[]> {
  const lines: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    lines.push(args.map(String).join(' '));
  });
  try {
    await import('../tools/succession-balance-sim');
  } finally {
    spy.mockRestore();
  }
  return lines;
}

/** Lines strictly between the two banner texts (exclusive), blanks kept. */
function section(lines: string[], from: string, to: string): string[] {
  const start = lines.findIndex((l) => l.includes(from));
  const end = lines.findIndex((l, i) => i > start && l.includes(to));
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThanOrEqual(0);
  return lines.slice(start + 1, end);
}

interface RunRow {
  strategy: string;
  origin: string;
  winner: string;
  type: string;
  margin: number;
  exposures: number;
  exposureSegment: string;
}

function parseRunRows(lines: string[]): RunRow[] {
  return section(lines, 'PER-RUN RESULTS', 'PER-FIGURE WINNERS')
    .filter((l) => l.includes(' | '))
    .map((l) => l.split(' | ').map((c) => c.trim()))
    .filter((cells) => STRATEGIES.includes(cells[0]))
    .map((cells) => ({
      strategy: cells[0],
      origin: cells[1],
      winner: cells[2],
      type: cells[3],
      margin: parseInt(cells[4], 10),
      exposures: parseInt(cells[5], 10),
      exposureSegment: cells[6],
    }));
}

interface FigureRow {
  strategy: string;
  origin: string;
  cells: string[];
}

function parseFigureRows(lines: string[]): FigureRow[] {
  return section(lines, 'PER-FIGURE WINNERS', 'AGGREGATE STATISTICS')
    .filter((l) => l.includes(' | '))
    .map((l) => l.split(' | ').map((c) => c.trim()))
    .filter((cells) => STRATEGIES.includes(cells[0]))
    .map((cells) => ({ strategy: cells[0], origin: cells[1], cells: cells.slice(2) }));
}

interface MoveLog {
  strategy: string;
  origin: string;
  tokens: string[];
}

function parseMoveLogs(lines: string[]): MoveLog[] {
  const block = section(lines, 'PLAYER MOVE LOGS', 'END OF RAW FINDINGS');
  const logs: MoveLog[] = [];
  for (let i = 0; i < block.length; i++) {
    const header = /^(\w+) \/ (\w+):$/.exec(block[i].trim());
    if (!header) continue;
    const chain = block[i + 1]?.trim() ?? '';
    logs.push({
      strategy: header[1],
      origin: header[2],
      tokens: chain.length === 0 ? [] : chain.split(/\s+→\s+/),
    });
  }
  return logs;
}

function parseAggregate(lines: string[]): string[] {
  return section(lines, 'AGGREGATE STATISTICS', 'PLAYER MOVE LOGS');
}

let report: string[];
let runRows: RunRow[];
let figureRows: FigureRow[];
let moveLogs: MoveLog[];
let aggregate: string[];

beforeAll(async () => {
  report = await importSim();
  runRows = parseRunRows(report);
  figureRows = parseFigureRows(report);
  moveLogs = parseMoveLogs(report);
  aggregate = parseAggregate(report);
});

describe('succession-balance-sim report', () => {
  it('executes all 18 runs to completion and prints every report section in order', () => {
    const markers = [
      'SUCCESSION BALANCE SIMULATION',
      'PER-RUN RESULTS',
      'PER-FIGURE WINNERS',
      'AGGREGATE STATISTICS',
      'PLAYER MOVE LOGS',
      'END OF RAW FINDINGS',
    ];
    let cursor = -1;
    for (const marker of markers) {
      const idx = report.findIndex((l, i) => i > cursor && l.includes(marker));
      expect(idx, `missing or out-of-order section: ${marker}`).toBeGreaterThan(cursor);
      cursor = idx;
    }
  });

  it('per-run table has exactly one row per strategy × origin pair, in declaration order', () => {
    expect(runRows.length).toBe(18);

    const seen = new Set(runRows.map((r) => `${r.strategy}|${r.origin}`));
    expect(seen.size).toBe(18);
    for (const s of STRATEGIES) {
      for (const o of ORIGINS) {
        expect(seen.has(`${s}|${o}`)).toBe(true);
      }
    }

    // runAll loops strategies outer, origins inner — rows follow that order.
    const expectedOrder = STRATEGIES.flatMap((s) => ORIGINS.map((o) => `${s}|${o}`));
    expect(runRows.map((r) => `${r.strategy}|${r.origin}`)).toEqual(expectedOrder);
  });

  it('per-run rows carry well-formed winner, type, margin and exposure columns', () => {
    for (const r of runRows) {
      expect([...CLAIMANT_CELLS.slice(0, 3), 'DRAW']).toContain(r.winner);
      expect(['Majority', 'Deadlock']).toContain(r.type);
      // margin = player figure wins − rival figure wins over 3 figures.
      expect(Math.abs(r.margin)).toBeLessThanOrEqual(3);
      expect(Number.isInteger(r.margin)).toBe(true);
      expect(r.exposures).toBeGreaterThanOrEqual(0);
      expect(r.exposureSegment === '-' || /^S\d+$/.test(r.exposureSegment)).toBe(true);
    }
  });

  it('per-figure winners table mirrors run order and honours verdict rules', () => {
    expect(figureRows.length).toBe(18);
    expect(figureRows.map((r) => `${r.strategy}|${r.origin}`)).toEqual(
      runRows.map((r) => `${r.strategy}|${r.origin}`)
    );

    for (let i = 0; i < figureRows.length; i++) {
      const fr = figureRows[i];
      const rr = runRows[i];

      expect(fr.cells.length).toBe(3);
      for (const cell of fr.cells) {
        expect(CLAIMANT_CELLS).toContain(cell);
      }

      const playerCells = fr.cells.filter((c) => c === 'player').length;
      const rivalCells = fr.cells.filter((c) => RIVALS.includes(c)).length;
      const allEmpty = fr.cells.every((c) => c === '-');

      // The margin column must equal player wins minus rival wins —
      // recomputing it catches a sim that reports a verdict incorrectly.
      expect(rr.margin).toBe(playerCells - rivalCells);

      if (allEmpty) {
        // Run never reached a verdict (the stuck branch): no winner at all.
        expect(rr.winner).toBe('DRAW');
      } else {
        const majority = CLAIMANT_CELLS.slice(0, 3).find(
          (c) => fr.cells.filter((x) => x === c).length >= 2
        );
        if (majority) {
          expect(rr.winner).toBe(majority);
          expect(rr.type).toBe('Majority');
        } else {
          expect(rr.type).toBe('Deadlock');
        }
      }
    }
  });

  it('aggregate per-strategy stats are recomputed correctly from the run table', () => {
    for (const s of STRATEGIES) {
      const line = aggregate.find((l) => l.trim().startsWith(`${s} `));
      expect(line, `missing aggregate line for ${s}`).toBeDefined();

      const m =
        /W:(\d+) L:(\d+) D:(\d+) \| Blowout:(\d+) Contested:(\d+) \| AvgMargin:([+-]?\d+\.\d+)/.exec(
          line!
        );
      expect(m, `malformed aggregate line for ${s}`).not.toBeNull();

      const rows = runRows.filter((r) => r.strategy === s);
      const wins = rows.filter((r) => r.winner === 'player').length;
      const losses = rows.filter((r) => RIVALS.includes(r.winner)).length;
      const draws = rows.filter((r) => r.winner === 'DRAW').length;
      const blowouts = rows.filter((r) => Math.abs(r.margin) >= 2).length;
      const contested = rows.filter((r) => Math.abs(r.margin) < 2).length;
      const avg = rows.reduce((sum, r) => sum + r.margin, 0) / rows.length;

      expect(Number(m![1])).toBe(wins);
      expect(Number(m![2])).toBe(losses);
      expect(Number(m![3])).toBe(draws);
      expect(wins + losses + draws).toBe(3);
      expect(Number(m![4])).toBe(blowouts);
      expect(Number(m![5])).toBe(contested);
      expect(blowouts + contested).toBe(3);
      expect(m![6]).toBe(avg.toFixed(2));
    }
  });

  it('aggregate per-origin stats are recomputed correctly from the run table', () => {
    for (const o of ORIGINS) {
      const line = aggregate.find((l) => l.trim().startsWith(`${o} `));
      expect(line, `missing aggregate line for ${o}`).toBeDefined();

      const m = /W:(\d+) L:(\d+) D:(\d+)$/.exec(line!.trim());
      expect(m, `malformed origin line for ${o}`).not.toBeNull();

      const rows = runRows.filter((r) => r.origin === o);
      expect(Number(m![1])).toBe(rows.filter((r) => r.winner === 'player').length);
      expect(Number(m![2])).toBe(rows.filter((r) => RIVALS.includes(r.winner)).length);
      expect(Number(m![3])).toBe(rows.filter((r) => r.winner === 'DRAW').length);
      expect(Number(m![1]) + Number(m![2]) + Number(m![3])).toBe(6);
    }
  });

  it('exposure statistics match the per-run exposure column', () => {
    const playerLine = aggregate.find((l) => l.includes('Player exposures:'));
    const rivalLine = aggregate.find((l) => l.includes('Rival exposures:'));
    expect(playerLine).toBeDefined();
    expect(rivalLine).toBeDefined();

    const pm = /Player exposures: (\d+) \(runs with exposure: (\d+)\/18\)/.exec(playerLine!);
    const rm = /Rival exposures: (\d+) \(runs with exposure: (\d+)\/18\)/.exec(rivalLine!);
    expect(pm).not.toBeNull();
    expect(rm).not.toBeNull();

    // The Exp column in the per-run table is the same exposureCount value.
    expect(Number(pm![1])).toBe(runRows.reduce((s, r) => s + r.exposures, 0));
    expect(Number(pm![2])).toBe(runRows.filter((r) => r.exposures > 0).length);

    // Rival exposures are aggregate-only: check the counting invariant.
    expect(Number(rm![2])).toBeLessThanOrEqual(Math.min(Number(rm![1]), 18));
    expect(Number(rm![1]) === 0).toBe(Number(rm![2]) === 0);
  });

  it('dominance check names exactly the strategies holding the best win count', () => {
    const line = aggregate.find((l) => l.includes('Best win count:'));
    expect(line).toBeDefined();

    const m = /Best win count: (\d+)\/3 by (.*)$/.exec(line!.trim());
    expect(m).not.toBeNull();
    const best = Number(m![1]);
    const named = m![2].trim().length === 0 ? [] : m![2].split(',').map((s) => s.trim());

    const winCounts = new Map(
      STRATEGIES.map((s) => [
        s,
        runRows.filter((r) => r.strategy === s && r.winner === 'player').length,
      ])
    );
    const expectedBest = Math.max(0, ...winCounts.values());
    const expectedNames = STRATEGIES.filter((s) => winCounts.get(s) === expectedBest);

    expect(best).toBe(expectedBest);
    expect(new Set(named)).toEqual(new Set(expectedNames));
  });

  it('move logs exist for all 18 runs with well-formed, ordered segment tokens', () => {
    expect(moveLogs.length).toBe(18);
    expect(moveLogs.map((l) => `${l.strategy}|${l.origin}`)).toEqual(
      runRows.map((r) => `${r.strategy}|${r.origin}`)
    );

    for (let i = 0; i < moveLogs.length; i++) {
      const log = moveLogs[i];
      expect(log.tokens.length).toBeGreaterThan(0);

      for (const token of log.tokens) {
        expect(MOVE_TOKEN.test(token), `bad move token "${token}"`).toBe(true);
      }

      // Every player move is recorded against the segment it ran on, and
      // every applied move advances the segment — so S-numbers strictly
      // increase from 1 and can never exceed MAX_TURNS (20).
      const segments = log.tokens
        .map((t) => /^S(\d+):/.exec(t))
        .filter((x): x is RegExpExecArray => x !== null)
        .map((x) => Number(x[1]));

      expect(segments[0]).toBe(1);
      for (let j = 1; j < segments.length; j++) {
        expect(segments[j]).toBeGreaterThan(segments[j - 1]);
      }
      expect(segments.length).toBeLessThanOrEqual(20);

      // A run that reached a verdict finished on segment 8, so it logged at
      // most 8 moves; only a stuck run can show more.
      const reachedVerdict = !figureRows[i].cells.every((c) => c === '-');
      if (reachedVerdict) {
        expect(segments.length).toBeLessThanOrEqual(8);
        expect(Math.max(...segments)).toBeLessThanOrEqual(8);
      }
    }
  });

  it('is fully deterministic: a fresh import produces identical output', async () => {
    vi.resetModules();
    const second = await importSim();
    expect(second).toEqual(report);
  });
});
