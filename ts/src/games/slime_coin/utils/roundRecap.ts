// roundRecap.ts — SlimeCoin end-of-round recap view-model (pure, no I/O)

export interface EndRoundResult {
  round: number;
  score: number;
  target: number;
  target_met: boolean;
  synergy_fired?: Record<string, number>;
  shortfall?: number;
  surplus?: number;
}

export interface RoundRecap {
  round: number;
  score: number;
  target: number;
  targetMet: boolean;
  margin: number;
  headline: string;
  fired: { label: string; count: number }[];
}

export const SYNERGY_LABELS: Record<string, string> = {
  convert_basic_to_zombie: 'Zombie spreads',
  double_crystal_tokens: 'Mirror and crystal double tokens',
  clear_area: 'Void clears an area',
  launch_to_shelf: 'Spark launches a coin back',
  zombie_slime: 'Zombie Slime chip',
  crystal_burst: 'Crystal Burst chip',
  bubble_chain: 'Bubble Chain chip',
};

export function buildRoundRecap(endRoundResult: EndRoundResult): RoundRecap {
  const { round, score, target, target_met } = endRoundResult;
  const margin = score - target;
  const headline =
    margin > 0
      ? `Target cleared with ${margin} to spare.`
      : margin === 0
        ? 'Target met exactly.'
        : `Short of target by ${-margin}.`;
  const fired = Object.entries(endRoundResult.synergy_fired ?? {})
    .map(([id, count]) => ({ label: SYNERGY_LABELS[id] ?? id, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  return { round, score, target, targetMet: target_met, margin, headline, fired };
}
