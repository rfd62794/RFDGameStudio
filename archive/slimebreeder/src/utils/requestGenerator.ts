import { WANDERER_PREMIUM_MULTI } from '../config'
import { getColorTier, getShapeTier } from '../data/traitDefs'
import type { SlimeColor, SlimeShape } from '../data/traitDefs'
import type { WandererRequest } from '../db/db'

export function generateWandererRequest(
  discoveredColors: string[],
  discoveredShapes: string[]
): WandererRequest {
  const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
  
  const requireColor = Math.random() > 0.3
  const requireShape = Math.random() > 0.3
  
  // Enforce at least one requirement
  const hasColor = requireColor || !requireShape
  const hasShape = requireShape || !requireColor

  const targetColor = hasColor ? pickRandom(discoveredColors) as SlimeColor : null
  const targetShape = hasShape ? pickRandom(discoveredShapes) as SlimeShape : null

  // Calculate base expected value if we had both
  // We assume an average tier of 1.5 for the missing piece if flexible to still offer good rewards
  const colorTier = targetColor ? getColorTier(targetColor) : 1.5
  const shapeTier = targetShape ? getShapeTier(targetShape) : 1.5
  
  // Base value formula without variance = colorTier * shapeTier * 10
  const expectedBaseValue = colorTier * shapeTier * 10
  
  const rewardGold = Math.floor(expectedBaseValue * WANDERER_PREMIUM_MULTI)

  return {
    id: crypto.randomUUID(),
    targetColor,
    targetShape,
    rewardGold,
    createdAt: Date.now()
  }
}
