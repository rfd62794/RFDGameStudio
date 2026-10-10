// new: ts/tests/test_succession_ablation.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ParkedFeatures } from '../src/games/succession/parkedFeatures';
import { estimateSessionMinutes } from '../src/games/succession/utils/sessionTiming';

/**
 * Ablation of the parked systems. The balance sim is a script module: it has no exports
 * and prints its report at import time, so this test imports it once per configuration
 * (vi.resetModules) with the parked-features flag set first, captures console.log, and
 * parses the PER-RUN RESULTS table (strategy | origin | winner | ...).
 */

const ORIGINS = ['bastard_scion', 'disgraced_knight', 'merchant_banker'];

interface Row {
  strategy: string;
  origin: string;
  winner: string;
}

async function runSim(parked: Partial<ParkedFeatures>): Promise<Row[]> {
  vi.resetModules();
  const flags = await import('../src/games/succession/parkedFeatures');
  flags.resetParkedFeatures();
  flags.setParkedFeatures(parked);
  const lines: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    lines.push(args.map(String).join(' '));
  });
  try {
    await import('../tools/succession-balance-sim');
  } finally {
    spy.mockRestore();
    flags.resetParkedFeatures();
  }
  const start = lines.findIndex((l) => l.includes('PER-RUN RESULTS'));
  const end = lines.findIndex((l, i) => i > start && l.includes('PER-FIGURE WINNERS'));
  return lines
    .slice(start + 1, end)
    .filter((l) => l.includes(' | '))
    .map((l) => l.split(' | ').map((c) => c.trim()))
    .filter((cells) => ORIGINS.includes(cells[1]))
    .map((cells) => ({ strategy: cells[0], origin: cells[1], winner: cells[2] }));
}

function playerWinsByOrigin(rows: Row[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const o of ORIGINS) out[o] = rows.filter((r) => r.origin === o && r.winner === 'player').length;
  return out;
}

const CONFIGS: Array<{ name: string; parked: Partial<ParkedFeatures> }> = [
  { name: 'nothing parked (baseline)', parked: {} },
  { name: 'discredit parked', parked: { discredit: true } },
  { name: 'indictment parked', parked: { indictment: true } },
  { name: 'domain ripple parked', parked: { domainRipple: true } },
  { name: 'all three parked', parked: { discredit: true, indictment: true, domainRipple: true } },
];

describe('succession ablation (parked features)', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.restoreAllMocks());

  for (const cfg of CONFIGS) {
    it(`${cfg.name}: 7 strategies x 3 origins all finish; wins per origin printed`, async () => {
      const rows = await runSim(cfg.parked);
      expect(rows).toHaveLength(21);
      const wins = playerWinsByOrigin(rows);
      console.info(`ABLATION ${cfg.name}: player wins per origin ${JSON.stringify(wins)}`);
      for (const origin of ORIGINS) {
        expect(wins[origin], `${cfg.name}: ${origin} must still win at least once`).toBeGreaterThanOrEqual(1);
      }
    }, 60000);
  }

  it('prints the session-time estimate for the 8-segment run (assumptions, not a measurement)', () => {
    const e = estimateSessionMinutes();
    console.info(`SESSION ESTIMATE: ${e.fastMinutes} / ${e.typicalMinutes} / ${e.slowMinutes} minutes (fast / typical / slow, ${e.segments} segments)`);
    expect(e.typicalMinutes).toBeGreaterThan(0);
  });
});
