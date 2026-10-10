// new: ts/tests/test_tuning_export.ts
import { describe, it, expect } from 'vitest';
import { formatPatch, formatYaml } from '../src/engine/tuning/exportFormat';
import type { KnobDef } from '../src/engine/tuning';

const POWER: KnobDef = {
  key: 'chimera_wilds.baseline_player.power',
  label: 'Starting power',
  group: 'Player',
  min: 40,
  max: 140,
  step: 5,
  default: 90,
  affects: "How hard the player's chimera hits.",
  source: { kind: 'data', file: 'games/chimera_wilds/data.yaml', path: 'baseline_player.power' },
};

const ENDURANCE: KnobDef = {
  ...POWER,
  key: 'chimera_wilds.baseline_player.endurance',
  default: 85,
  source: { kind: 'data', file: 'games/chimera_wilds/data.yaml', path: 'baseline_player.endurance' },
};

const LOSS_DAMAGE: KnobDef = {
  key: 'scrapcrawl.loss_damage',
  label: 'Damage per lost fight',
  group: 'Combat',
  min: 1,
  max: 4,
  step: 1,
  default: 2,
  affects: 'How much a lost fight costs.',
  source: { kind: 'const', file: 'ts/src/games/scrapcrawl/utils/runEnd.ts', name: 'LOSS_DAMAGE' },
};

describe('formatYaml', () => {
  it('prints the exact chimera example', () => {
    expect(formatYaml({ 'chimera_wilds.baseline_player.power': 80 }, [POWER])).toBe(
      '# games/chimera_wilds/data.yaml\nbaseline_player:\n  power: 80'
    );
  });

  it('merges two knobs under one parent', () => {
    const changed = {
      'chimera_wilds.baseline_player.power': 80,
      'chimera_wilds.baseline_player.endurance': 100,
    };
    expect(formatYaml(changed, [POWER, ENDURANCE])).toBe(
      '# games/chimera_wilds/data.yaml\nbaseline_player:\n  power: 80\n  endurance: 100'
    );
  });

  it('drops unchanged knobs and unknown keys', () => {
    const changed = {
      'chimera_wilds.baseline_player.power': 90,
      'unknown_game.nope': 5,
    };
    expect(formatYaml(changed, [POWER, ENDURANCE])).toBe('# no changes');
  });

  it('returns # no changes when empty', () => {
    expect(formatYaml({}, [POWER])).toBe('# no changes');
    expect(formatPatch({}, [POWER])).toBe('# no changes');
  });

  it('lists const knobs as comment lines', () => {
    expect(formatYaml({ 'scrapcrawl.loss_damage': 3 }, [LOSS_DAMAGE])).toBe(
      '# ts/src/games/scrapcrawl/utils/runEnd.ts: LOSS_DAMAGE = 3'
    );
  });
});

describe('formatPatch', () => {
  it('prints one line per changed knob', () => {
    const changed = {
      'chimera_wilds.baseline_player.power': 80,
      'scrapcrawl.loss_damage': 3,
    };
    expect(formatPatch(changed, [POWER, LOSS_DAMAGE])).toBe(
      'games/chimera_wilds/data.yaml: baseline_player.power = 80 (was 90)\n' +
        'ts/src/games/scrapcrawl/utils/runEnd.ts: LOSS_DAMAGE = 3 (was 2)'
    );
  });
});
