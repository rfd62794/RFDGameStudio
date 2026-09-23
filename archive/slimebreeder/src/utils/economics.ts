import { getColorTier, getShapeTier } from '../data/traitDefs'
import type { SlimeColor, SlimeShape } from '../data/traitDefs'

/**
 * Gold contribution per trait tier.
 * T1+T1 = 10G, T2+T2 = 44G, T3+T3 = 190G, T4+T4 = 600G (at 0 variance).
 */
const TIER_VALUE: Record<number, number> = { 1: 5, 2: 22, 3: 95, 4: 300 }

/**
 * Compute the actual Gold value of a slime.
 * Tier is derived from the color/shape name — no separate tier fields needed.
 */
export function computeBaseValue(
  color: SlimeColor,
  shape: SlimeShape,
  variance: number,
): number {
  const colorVal = TIER_VALUE[getColorTier(color)] ?? 5
  const shapeVal = TIER_VALUE[getShapeTier(shape)] ?? 5
  const base = colorVal + shapeVal
  return Math.max(1, Math.round(base * (1 + variance)))
}
