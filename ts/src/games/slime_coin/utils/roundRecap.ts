// roundRecap.ts — SlimeCoin end-of-round recap data (pure; no React, no Lua, no I/O)
// <!-- new: ts/src/games/slime_coin/utils/roundRecap.ts -->

export const SYNERGY_LABELS: Record<string, string> = {
  convert_basic_to_zombie: 'Zombie spreads',
  double_crystal_tokens: 'Mirror and crystal double tokens',
  clear_area: 'Void clears an area',
  launch_to_shelf: 'Spark launches a coin back',
  zombie_slime: 'Zombie Slime chip',
  crystal_burst: 'Crystal Burst chip',
  bubble_chain: 'Bubble Chain chip',
};

export interface EndRoundResult {
  round?: number;
  score?: number;
  target?: number;
  target_met?: boolean;
  synergy_fired?: unknown;
}

export interface FiredSynergy {
  label: string;
  count: number;
}

export interface RoundRecap {
  round: number;
  score: number;
  target: number;
  targetMet: boolean;
  margin: number;
  headline: string;
  fired: FiredSynergy[];
}

export function buildRoundRecap(result: EndRoundResult): RoundRecap {
  const round = result.round ?? 0;
  const score = result.score ?? 0;
  const target = result.target ?? 0;
  const targetMet = result.target_met ?? score >= target;
  const margin = score - target;

  let headline: string;
  if (margin > 0) {
    headline = `Round ${round} cleared the target with ${margin} to spare.`;
  } else if (targetMet) {
    headline = `Round ${round} hit the target exactly.`;
  } else {
    headline = `Round ${round} fell short of the target by ${-margin}.`;
  }

  const fired: FiredSynergy[] = [];
  const table = result.synergy_fired;
  if (table !== null && typeof table === 'object') {
    for (const [id, count] of Object.entries(table)) {
      if (typeof count === 'number' && Number.isFinite(count) && count > 0) {
        fired.push({ label: SYNERGY_LABELS[id] ?? id, count });
      }
    }
  }
  fired.sort((a, b) => b.count - a.count || (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));

  return { round, score, target, targetMet, margin, headline, fired };
}
