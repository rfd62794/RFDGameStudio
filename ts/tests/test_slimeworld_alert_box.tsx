import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadGame, call } from '../src/engine/runtime';
import {
  stateToLua, type LabState, type Slime, type PlanetNode, type SlimeColor,
} from '../src/games/slimeworld/types';

const session = loadGame('slimeworld');

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/App.tsx'),
  'utf8'
);

const alertBoxSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/components/AlertBox.tsx'),
  'utf8'
);

const logicSource = readFileSync(
  resolve(import.meta.dirname, '../../games/slimeworld/logic.lua'),
  'utf8'
);

function makeMinimalState(): LabState {
  const slime: Slime = {
    id: 's1', name: 'Test Slime', color: 'Red', pattern: 'Solid', level: 5, xp: 0,
    stats: { hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: 10 },
    role: 'idle', generation: 0, colorSaturation: 100, hue: 0, saturation: 100,
    diffusionRatio: 20, amplitude: 40, accentHue: 0, vertexCount: 4, irregularity: 10,
    createdAt: Date.now(), lockedRole: null, garrisonedAt: null, stage: 'Juvenile',
  };
  return {
    cycle: 1, credits: 1000, rosterCap: 10, breedingSuccessRateModifier: 0,
    slimes: [slime], contracts: [], zones: [], activeDispatch: null,
    logs: [], activeMediation: null, activeExploration: null, planetRegion: null,
    wildsUnlocked: false, hasAutoFeeder: false, colorRelationships: {} as Record<SlimeColor, number>,
    recentMarketSales: [], regentInventory: {}, colorRegentInventory: {}, targetRegentInventory: {},
    petitions: [],
  };
}

function makeNode(id: string, ownerColor: SlimeColor, pressure: Partial<Record<SlimeColor, number>>, neighbors: string[] = [], isCapitol = false): PlanetNode {
  return {
    id, name: id, cellShape: '', labelX: 0, labelY: 0, neighbors,
    ownerColor, pressure, strength: 0.5, isCapitol, isSupplied: true,
    distanceFromCenter: 50, discovered: true, garrisonSlimeId: null,
  };
}

describe('SlimeWorld Alert Box for Real-Time Notifications', () => {
  // §3.1: AlertBox component renders given a LogEntry-shaped prop
  it('test_alert_box_renders_given_log_entry', () => {
    // Source-level: AlertBox accepts a generic LogEntry prop, not hardcoded to Stray
    expect(alertBoxSource).toContain('LogEntry');
    expect(alertBoxSource).toContain('entry');
    expect(alertBoxSource).toContain('onDismiss');
    // It renders the entry's text
    expect(alertBoxSource).toContain('entry.text');
    // It is NOT hardcoded to Stray-specific text
    expect(alertBoxSource).not.toContain('STRAY');
    expect(alertBoxSource).not.toContain('refugee');
  });

  // §3.2: AlertBox is dismissable
  it('test_alert_box_dismissable', () => {
    // Source-level: dismiss button calls onDismiss with entry id
    expect(alertBoxSource).toContain('onDismiss(entry.id)');
    // App.tsx: dismiss removes from activeAlerts by id
    expect(appSource).toContain('setActiveAlerts');
    expect(appSource).toContain('filter(a => a.id !== id)');
  });

  // §3.3: Real bridge test — trigger a stray arrival via advance_cycle, confirm alert appears
  it('test_stray_arrival_triggers_alert_real_bridge', () => {
    const state = makeMinimalState();
    // Set up a planet region where a territory flip will generate a stray
    // n_cap (Red capitol) pressures n1 (Blue) until it flips to Red
    state.planetRegion = {
      nodes: [
        makeNode('n_cap', 'Red', {}, ['n1'], true),
        makeNode('n1', 'Blue', { Red: 95 }, ['n_cap']),
      ],
      generatedAt: Date.now(),
    };
    // Run advance_cycle — the high Red pressure should flip n1 to Red,
    // generating a "STRAY DETECTION" log entry
    const data = session.files.data as Record<string, unknown>;
    const colorSpecs: Record<string, { base_stats: Record<string, number>; growth: Record<string, number> }> = {};
    const cultures = data['cultures'] as Record<string, Record<string, unknown>>;
    if (cultures) {
      for (const [, culture] of Object.entries(cultures)) {
        const colorName = String(culture['color']);
        colorSpecs[colorName] = {
          base_stats: culture['base_stats'] as Record<string, number>,
          growth: culture['growth'] as Record<string, number>,
        };
      }
    }
    const neutralTraits = data['neutral_traits'] as Record<string, Record<string, unknown>>;
    if (neutralTraits) {
      const gray = neutralTraits['gray'];
      if (gray) colorSpecs['Gray'] = { base_stats: gray['base_stats'] as Record<string, number>, growth: gray['growth'] as Record<string, number> };
    }

    const [raw] = call(session, 'advance_cycle', stateToLua(state), colorSpecs);
    const result = raw as Record<string, unknown>;
    expect(result).toBeTruthy();

    const logs = Array.isArray(result['logs']) ? (result['logs'] as Array<Record<string, unknown>>) : [];
    const strayLog = logs.find(l =>
      String(l['type'] ?? '') === 'combat' &&
      String(l['text'] ?? '').startsWith('STRAY DETECTION')
    );

    // If the flip didn't happen this cycle (random pressure decay), try with higher pressure
    if (!strayLog) {
      // Re-run with pressure at 100 to guarantee a flip
      state.planetRegion!.nodes[1].pressure = { Red: 100 };
      const [raw2] = call(session, 'advance_cycle', stateToLua(state), colorSpecs);
      const result2 = raw2 as Record<string, unknown>;
      const logs2 = Array.isArray(result2['logs']) ? (result2['logs'] as Array<Record<string, unknown>>) : [];
      const strayLog2 = logs2.find(l =>
        String(l['type'] ?? '') === 'combat' &&
        String(l['text'] ?? '').startsWith('STRAY DETECTION')
      );
      expect(strayLog2).toBeTruthy();
      expect(String(strayLog2!['text'])).toContain('refugee');
    } else {
      expect(strayLog).toBeTruthy();
      expect(String(strayLog!['text'])).toContain('refugee');
    }

    // Confirm App.tsx wires the detection: filters luaLogs for type=combat + STRAY DETECTION prefix
    expect(appSource).toContain("l.type === 'combat'");
    expect(appSource).toContain("l.text.startsWith('STRAY DETECTION')");
    expect(appSource).toContain('setActiveAlerts');
  });

  // §3.4: Non-stray combat logs do not trigger the alert
  it('test_non_stray_combat_logs_do_not_trigger_alert', () => {
    // Confirm the filter is precise: type === 'combat' AND text.startsWith('STRAY DETECTION')
    // Not just type === 'combat' alone
    expect(appSource).toContain("l.type === 'combat' && l.text.startsWith('STRAY DETECTION')");

    // Grep logic.lua: confirm the ONLY type = "combat" entry is the STRAY DETECTION one
    const combatLines = logicSource.split('\n').filter(l => l.includes('type = "combat"'));
    expect(combatLines.length).toBe(1);
    expect(combatLines[0]).toContain('STRAY DETECTION');
  });

  // §3.5: Existing state.logs history still maintained (appended, sliced, not altered)
  it('test_existing_log_history_still_renders', () => {
    // state.logs is still appended to and sliced at -50
    expect(appSource).toContain('[...previous.logs, ...luaLogs].slice(-50)');
    // The logs array is not filtered or altered by the alert logic
    // The alert filtering happens AFTER setState, on luaLogs, not on state.logs
    expect(appSource).toContain('logs: [...previous.logs, ...luaLogs].slice(-50)');
    // Alert filtering is separate from the logs state update
    const lines = appSource.split('\n');
    const logsLineIdx = lines.findIndex(l => l.includes('logs: [...previous.logs, ...luaLogs].slice(-50)'));
    const strayFilterIdx = lines.findIndex(l => l.includes("strayAlerts"));
    // The stray filter comes AFTER the logs state update
    expect(strayFilterIdx).toBeGreaterThan(logsLineIdx);
  });
});
