// @vitest-environment node
//
// MBB Corner-Stuck Bug — Live Instrumentation
//
// Runs real matches with NaN/finite checks after every tick to catch
// the exact code path and condition that produces invalid agent positions.
// This is the CONFIRM step before any fix is applied.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as parse } from 'js-yaml';

import { createMbbSimulation } from '../src/games/mutant_battle_ball/simulation/mbbSimulation';
import type { Part, PartsBySlot } from '../src/engine/shared/partSlots';
import type { Mutant } from '../src/games/mutant_battle_ball/types';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');
const dataPath = resolve(repoRoot, 'games', 'mutant_battle_ball', 'data.yaml');
const dataYaml = readFileSync(dataPath, 'utf-8');
const data = parse(dataYaml) as Record<string, unknown>;

// ── Build real mutants from data.yaml ──────────────────────────────

function buildPartsMap(): Record<string, Part> {
  const partsData = data['parts'] as Array<Record<string, unknown>>;
  const map: Record<string, Part> = {};
  for (const p of partsData) {
    map[p['id'] as string] = p as unknown as Part;
  }
  return map;
}

function buildPlayerMutantsFromData(): Mutant[] {
  const partsMap = buildPartsMap();
  const starters = data['starter_mutants'] as Array<Record<string, unknown>>;
  return starters.map(m => {
    const rawParts = m['parts'] as Record<string, string>;
    return {
      id: m['id'] as string,
      name: m['name'] as string,
      color: m['color'] as string,
      parts: {
        head: rawParts['head'] ? partsMap[rawParts['head']] : null,
        chest: rawParts['chest'] ? partsMap[rawParts['chest']] : null,
        left_arm: rawParts['left_arm'] ? partsMap[rawParts['left_arm']] : null,
        right_arm: rawParts['right_arm'] ? partsMap[rawParts['right_arm']] : null,
        left_leg: rawParts['left_leg'] ? partsMap[rawParts['left_leg']] : null,
        right_leg: rawParts['right_leg'] ? partsMap[rawParts['right_leg']] : null,
      } as PartsBySlot,
      status: 'healthy' as const,
      matchesPlayed: 0,
    };
  });
}

function buildOpponentMutantsFromData(): Array<{ id: string; name: string; color: string; parts: PartsBySlot }> {
  const partsMap = buildPartsMap();
  const opponents = data['opponents'] as Array<Record<string, unknown>>;
  const result: Array<{ id: string; name: string; color: string; parts: PartsBySlot }> = [];
  for (const opp of opponents) {
    const mutants = opp['mutants'] as Array<Record<string, unknown>>;
    for (const m of mutants) {
      const rawParts = m['parts'] as Record<string, string>;
      if (!rawParts) continue;
      result.push({
        id: m['id'] as string,
        name: m['name'] as string,
        color: m['color'] as string,
        parts: {
          head: rawParts['head'] ? partsMap[rawParts['head']] : null,
          chest: rawParts['chest'] ? partsMap[rawParts['chest']] : null,
          left_arm: rawParts['left_arm'] ? partsMap[rawParts['left_arm']] : null,
          right_arm: rawParts['right_arm'] ? partsMap[rawParts['right_arm']] : null,
          left_leg: rawParts['left_leg'] ? partsMap[rawParts['left_leg']] : null,
          right_leg: rawParts['right_leg'] ? partsMap[rawParts['right_leg']] : null,
        },
      });
    }
  }
  return result;
}

// ── Instrumentation ────────────────────────────────────────────────

interface NaNReport {
  tick: number;
  agentId: string;
  agentName: string;
  role: string;
  status: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ballState: string;
  possession: string;
  eventsThisTick: string[];
  scorePlayer: number;
  scoreOpponent: number;
}

function checkAgentPositions(
  sim: ReturnType<typeof createMbbSimulation>,
  tickCount: number,
  lastEvents: Array<Record<string, unknown>>,
): NaNReport | null {
  const st = sim.getState();
  if (!st) return null;
  for (const ag of st.agents) {
    if (!Number.isFinite(ag.x) || !Number.isFinite(ag.y) ||
        !Number.isFinite(ag.vx) || !Number.isFinite(ag.vy)) {
      return {
        tick: tickCount,
        agentId: ag.id,
        agentName: ag.name,
        role: ag.role,
        status: ag.status,
        x: ag.x,
        y: ag.y,
        vx: ag.vx,
        vy: ag.vy,
        ballState: st.ball.state,
        possession: st.possession,
        eventsThisTick: lastEvents.map(e => e['type'] as string),
        scorePlayer: st.scorePlayer,
        scoreOpponent: st.scoreOpponent,
      };
    }
  }
  return null;
}

// ── Test: Run real matches with instrumentation ───────────────────

describe('test_mbb_corner_stuck_instrumentation', () => {
  const playerMutants = buildPlayerMutantsFromData();
  const opponentMutants = buildOpponentMutantsFromData();

  it('real match from data.yaml: no NaN/Infinity positions across full match (seed 1, 60fps)', () => {
    const sim = createMbbSimulation();
    sim.initMatch(
      playerMutants,
      opponentMutants as unknown as Mutant[],
      data as unknown as Parameters<typeof sim.initMatch>[2],
      1,
    );

    const reports: NaNReport[] = [];
    const dt = 1 / 60; // 60fps — the real game loop rate
    let tickCount = 0;

    // Run the full match
    for (let i = 0; i < 60000; i++) {
      const ms = sim.tickMatch(dt);
      tickCount++;

      // Check for NaN after every tick
      const report = checkAgentPositions(sim, tickCount, ms.events);
      if (report) {
        reports.push(report);
        // Log the FIRST occurrence with full detail
        if (reports.length === 1) {
          console.error('NaN DETECTED — First occurrence:', JSON.stringify(report, null, 2));
        }
      }

      if (ms.state === 'ended') break;
    }

    // Report all NaN occurrences
    if (reports.length > 0) {
      console.error(`Total NaN ticks: ${reports.length} out of ${tickCount} ticks`);
      console.error('First 5 NaN reports:', JSON.stringify(reports.slice(0, 5), null, 2));
    }

    expect(reports).toHaveLength(0);
  });

  it('real match from data.yaml: no NaN/Infinity positions across full match (seed 42, 60fps)', () => {
    const sim = createMbbSimulation();
    sim.initMatch(
      playerMutants,
      opponentMutants as unknown as Mutant[],
      data as unknown as Parameters<typeof sim.initMatch>[2],
      42,
    );

    const reports: NaNReport[] = [];
    const dt = 1 / 60;
    let tickCount = 0;

    for (let i = 0; i < 60000; i++) {
      const ms = sim.tickMatch(dt);
      tickCount++;

      const report = checkAgentPositions(sim, tickCount, ms.events);
      if (report) {
        reports.push(report);
        if (reports.length === 1) {
          console.error('NaN DETECTED — First occurrence:', JSON.stringify(report, null, 2));
        }
      }

      if (ms.state === 'ended') break;
    }

    if (reports.length > 0) {
      console.error(`Total NaN ticks: ${reports.length} out of ${tickCount} ticks`);
      console.error('First 5 NaN reports:', JSON.stringify(reports.slice(0, 5), null, 2));
    }

    expect(reports).toHaveLength(0);
  });

  it('real match from data.yaml: no NaN/Infinity positions across full match (seed 100, 60fps)', () => {
    const sim = createMbbSimulation();
    sim.initMatch(
      playerMutants,
      opponentMutants as unknown as Mutant[],
      data as unknown as Parameters<typeof sim.initMatch>[2],
      100,
    );

    const reports: NaNReport[] = [];
    const dt = 1 / 60;
    let tickCount = 0;

    for (let i = 0; i < 60000; i++) {
      const ms = sim.tickMatch(dt);
      tickCount++;

      const report = checkAgentPositions(sim, tickCount, ms.events);
      if (report) {
        reports.push(report);
        if (reports.length === 1) {
          console.error('NaN DETECTED — First occurrence:', JSON.stringify(report, null, 2));
        }
      }

      if (ms.state === 'ended') break;
    }

    if (reports.length > 0) {
      console.error(`Total NaN ticks: ${reports.length} out of ${tickCount} ticks`);
      console.error('First 5 NaN reports:', JSON.stringify(reports.slice(0, 5), null, 2));
    }

    expect(reports).toHaveLength(0);
  });

  it('real match: no NaN with paused_sub resume cycle (seed 1, 60fps)', () => {
    // The real game pauses on agent_down and resumes via sim.resumeMatch().
    // The test must simulate this cycle — a paused match doesn't tick.
    // But if resumeMatch() is called, the match continues. This test
    // auto-resumes any paused_sub state to exercise that path.
    const sim = createMbbSimulation();
    sim.initMatch(
      playerMutants,
      opponentMutants as unknown as Mutant[],
      data as unknown as Parameters<typeof sim.initMatch>[2],
      1,
    );

    const reports: NaNReport[] = [];
    const dt = 1 / 60;
    let tickCount = 0;

    for (let i = 0; i < 60000; i++) {
      const ms = sim.tickMatch(dt);
      tickCount++;

      const report = checkAgentPositions(sim, tickCount, ms.events);
      if (report) {
        reports.push(report);
        if (reports.length === 1) {
          console.error('NaN DETECTED — First occurrence:', JSON.stringify(report, null, 2));
        }
      }

      // Auto-resume paused_sub (the real UI shows a modal and the user clicks)
      if (ms.state === 'paused_sub') {
        sim.resumeMatch();
      }

      if (ms.state === 'ended') break;
    }

    if (reports.length > 0) {
      console.error(`Total NaN ticks: ${reports.length} out of ${tickCount} ticks`);
      console.error('First 5 NaN reports:', JSON.stringify(reports.slice(0, 5), null, 2));
    }

    expect(reports).toHaveLength(0);
  });

  it('real match: no NaN with paused_sub resume cycle (seed 42, 60fps)', () => {
    const sim = createMbbSimulation();
    sim.initMatch(
      playerMutants,
      opponentMutants as unknown as Mutant[],
      data as unknown as Parameters<typeof sim.initMatch>[2],
      42,
    );

    const reports: NaNReport[] = [];
    const dt = 1 / 60;
    let tickCount = 0;

    for (let i = 0; i < 60000; i++) {
      const ms = sim.tickMatch(dt);
      tickCount++;

      const report = checkAgentPositions(sim, tickCount, ms.events);
      if (report) {
        reports.push(report);
        if (reports.length === 1) {
          console.error('NaN DETECTED — First occurrence:', JSON.stringify(report, null, 2));
        }
      }

      if (ms.state === 'paused_sub') {
        sim.resumeMatch();
      }

      if (ms.state === 'ended') break;
    }

    if (reports.length > 0) {
      console.error(`Total NaN ticks: ${reports.length} out of ${tickCount} ticks`);
      console.error('First 5 NaN reports:', JSON.stringify(reports.slice(0, 5), null, 2));
    }

    expect(reports).toHaveLength(0);
  });

  it('real match: check render state MatchAgent positions for NaN (seed 1)', () => {
    // Also check the MatchState (render state) for NaN — this is what
    // MatchCanvas actually consumes. If the internal state is fine but
    // the render state has NaN, the bug is in buildMatchRenderState.
    const sim = createMbbSimulation();
    sim.initMatch(
      playerMutants,
      opponentMutants as unknown as Mutant[],
      data as unknown as Parameters<typeof sim.initMatch>[2],
      1,
    );

    const dt = 0.05;
    let tickCount = 0;
    let firstNaN: { tick: number; agent: string; x: number; y: number } | null = null;

    for (let i = 0; i < 10000; i++) {
      const ms = sim.tickMatch(dt);
      tickCount++;

      for (const ag of ms.agents) {
        if (!Number.isFinite(ag.x) || !Number.isFinite(ag.y)) {
          if (!firstNaN) {
            firstNaN = { tick: tickCount, agent: ag.id, x: ag.x, y: ag.y };
            console.error('Render state NaN DETECTED:', JSON.stringify(firstNaN, null, 2));
          }
        }
      }

      // Also check ball position
      if (!Number.isFinite(ms.ballX) || !Number.isFinite(ms.ballY)) {
        if (!firstNaN) {
          firstNaN = { tick: tickCount, agent: 'BALL', x: ms.ballX, y: ms.ballY };
          console.error('Render state ball NaN DETECTED:', JSON.stringify(firstNaN, null, 2));
        }
      }

      if (ms.state === 'ended') break;
    }

    expect(firstNaN).toBeNull();
  });

  it('real match: check for agents stuck at (0,0) specifically (seed 1)', () => {
    // The reported symptom is agents at the top-left corner (0,0).
    // Check if any agent ever reaches exactly (0,0) or very close.
    const sim = createMbbSimulation();
    sim.initMatch(
      playerMutants,
      opponentMutants as unknown as Mutant[],
      data as unknown as Parameters<typeof sim.initMatch>[2],
      1,
    );

    const dt = 0.05;
    let tickCount = 0;
    const stuckReports: Array<{ tick: number; agentId: string; x: number; y: number; role: string; status: string }> = [];

    for (let i = 0; i < 10000; i++) {
      const ms = sim.tickMatch(dt);
      tickCount++;

      for (const ag of ms.agents) {
        // Check for agents at or very near (0,0) — the CSS fallback position
        if (ag.x <= 0.5 && ag.y <= 0.5) {
          stuckReports.push({
            tick: tickCount,
            agentId: ag.id,
            x: ag.x,
            y: ag.y,
            role: ag.role,
            status: ag.status,
          });
        }
      }

      if (ms.state === 'ended') break;
    }

    if (stuckReports.length > 0) {
      console.error(`Agents stuck at (0,0): ${stuckReports.length} occurrences`);
      console.error('First 5:', JSON.stringify(stuckReports.slice(0, 5), null, 2));
    }

    // Agents at (0,0) is a real symptom — but clamp(0, 0, courtW) = 0 is valid
    // (it's the court edge). The bug is NaN → CSS fallback to (0,0), not real 0.
    // So we report this but don't fail — the NaN check above is the real test.
    console.log(`Agents at (0,0) corner: ${stuckReports.length} occurrences across ${tickCount} ticks`);
  });
});
