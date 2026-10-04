// logic/wheel.ts — reward wheel and draft-pick selection (pure).

import type { PocketCoinType, WheelReward } from '../types';

// Pick a random unlocked reward index.
export function pickWheelIndex(count: number, rng: () => number): number {
  return Math.floor(rng() * count);
}

// Rotation that lands the chosen slice under the top pointer after 5-7
// full spins — the same arithmetic the modal used inline.
export function wheelRotationFor(index: number, count: number, rng: () => number): number {
  const sliceAngle = 360 / count;
  const extraRot = 360 - index * sliceAngle - sliceAngle / 2;
  const totalSpins = 5 + rng() * 2;
  return totalSpins * 360 + extraRot;
}

export function pickWheelReward(
  unlockedRewards: WheelReward[],
  rng: () => number
): { reward: WheelReward; index: number; rotation: number } | null {
  if (unlockedRewards.length === 0) return null;
  const index = pickWheelIndex(unlockedRewards.length, rng);
  return {
    reward: unlockedRewards[index],
    index,
    rotation: wheelRotationFor(index, unlockedRewards.length, rng),
  };
}

// Draw up to `count` distinct draft options via the same shuffle the picker
// modal used.
export function pickDraftChoices(
  unlockedPocketCoins: PocketCoinType[],
  rng: () => number,
  count = 3
): PocketCoinType[] {
  const shuffled = [...unlockedPocketCoins].sort(() => 0.5 - rng());
  return shuffled.slice(0, count);
}
