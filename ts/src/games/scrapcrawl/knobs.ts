// new: ts/src/games/scrapcrawl/knobs.ts
import { defineKnob } from '../../engine/tuning';
import type { KnobDef } from '../../engine/tuning';

export const SCRAPCRAWL_KNOBS: KnobDef[] = [
  {
    key: 'scrapcrawl.player_max_hp',
    label: 'Player hit points',
    group: 'Run',
    min: 4,
    max: 20,
    step: 1,
    default: 10,
    affects: 'How many mistakes a run survives.',
    source: { kind: 'const', file: 'ts/src/games/scrapcrawl/utils/runEnd.ts', name: 'PLAYER_MAX_HP' },
  },
  {
    key: 'scrapcrawl.loss_damage',
    label: 'Damage per lost fight',
    group: 'Run',
    min: 1,
    max: 5,
    step: 1,
    default: 2,
    affects: 'How punishing a lost fight is; the main lever on the win rate.',
    source: { kind: 'const', file: 'ts/src/games/scrapcrawl/utils/runEnd.ts', name: 'LOSS_DAMAGE' },
  },
];

for (const knob of SCRAPCRAWL_KNOBS) defineKnob(knob);
