import { BREED_HOST_WEIGHT } from '../config'
import { computeBaseValue } from './economics'
import { breedColor, breedShape } from './discovery'
import type { SlimeColor, SlimeShape } from '../data/traitDefs'
import type { Slime } from '../types'
import type { PersistedSlime } from '../db/db'

export interface BreedResult {
  offspring: Slime
  newColorDiscovery: SlimeColor | null
  newShapeDiscovery: SlimeShape | null
}

/**
 * Produce a genetically-derived offspring from two parent slimes.
 * Uses the recipe-based discovery system:
 * - Different parent colors/shapes may trigger new trait discoveries
 * - Same-color/shape parents always pass that trait through
 *
 * @param host       - The surviving parent
 * @param donor      - The consumed parent (snapshot)
 * @param discovered - Currently discovered colors and shapes
 */
export function breedSlimes(
  host: Slime | PersistedSlime,
  donor: PersistedSlime,
  discoveredColors: Set<SlimeColor>,
  discoveredShapes: Set<SlimeShape>,
): BreedResult {
  const colorResult = breedColor(
    host.color as SlimeColor,
    donor.color as SlimeColor,
    discoveredColors,
    BREED_HOST_WEIGHT,
  )

  const shapeResult = breedShape(
    host.shape as SlimeShape,
    donor.shape as SlimeShape,
    discoveredShapes,
    BREED_HOST_WEIGHT,
  )

  const variance = parseFloat((Math.random() * 0.2 - 0.1).toFixed(2))
  const actualValue = computeBaseValue(colorResult.color, shapeResult.shape, variance)

  return {
    offspring: {
      id: crypto.randomUUID(),
      color: colorResult.color,
      shape: shapeResult.shape,
      variance,
      actualValue,
      createdAt: Date.now(),
    },
    newColorDiscovery: colorResult.isNewDiscovery ? colorResult.color : null,
    newShapeDiscovery: shapeResult.isNewDiscovery ? shapeResult.shape : null,
  }
}
