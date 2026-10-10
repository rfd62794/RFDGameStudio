// new: ts/src/games/chimera_wilds/tuning.ts
import { defineKnob, type GameTuning, type KnobDef, type Metrics } from '../../engine/tuning';
import { loadGame, call } from '../../engine/runtime';
import { mulberry32 } from '../../engine/shared/seededRandom';

const SLOTS = ['head', 'chest', 'left_arm', 'right_arm', 'left_leg', 'right_leg'];
type Part = { id: string; slot: string };

function pickParts(parts: Part[], rng: () => number): Part[] {
  return SLOTS.map(slot => {
    const options = parts.filter(p => p.slot === slot);
    return options[Math.floor(rng() * options.length)];
  });
}

const CHIMERA_WILDS_KNOBS: KnobDef[] = [
  {
    key: 'chimera_wilds.baseline_player.power',
    label: 'Starting power',
    group: 'Player',
    min: 40, max: 140, step: 5,
    default: 90,
    affects: "How hard the player's chimera hits; the main lever on whether a first encounter is winnable.",
    source: { kind: 'data', file: 'games/chimera_wilds/data.yaml', path: 'baseline_player.power' },
  },
  {
    key: 'chimera_wilds.baseline_player.endurance',
    label: 'Starting endurance',
    group: 'Player',
    min: 40, max: 140, step: 5,
    default: 85,
    affects: "How much punishment the player's chimera survives.",
    source: { kind: 'data', file: 'games/chimera_wilds/data.yaml', path: 'baseline_player.endurance' },
  },
];
CHIMERA_WILDS_KNOBS.forEach(defineKnob);

const tuning: GameTuning = {
  gameId: 'chimera_wilds',
  knobs: CHIMERA_WILDS_KNOBS,
  targets: [
    {
      id: 'fresh_player_win_rate',
      metric: 'won',
      min: 0.35,
      max: 0.65,
      note: 'A fresh player should win about half of first encounters (matches test_chimera_wilds_balance.ts).',
    },
  ],
  simulate({ seed }): Metrics {
    const session = loadGame('chimera_wilds');
    const data = session.files.data as Record<string, unknown>;
    const baseline = data['baseline_player'] as { power: number; endurance: number };
    const parts = data['parts'] as Part[];
    const rng = mulberry32(seed);
    const [chimera] = call(session, 'generate_chimera', pickParts(parts, rng)) as [unknown];
    const roll = Math.floor(rng() * 20) + 1;
    const [result] = call(session, 'resolve_encounter', baseline.power, baseline.endurance, chimera, roll) as [{ won: boolean }];
    return { won: result.won ? 1 : 0 };
  },
};

export default tuning;
