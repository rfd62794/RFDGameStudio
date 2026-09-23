import { computeBaseValue } from './economics'
import type { SlimeColor, SlimeShape } from '../data/traitDefs'
import type { Slime } from '../types'

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Generate a random slime from the player's discovered trait pool.
 * Higher-tier traits are rarer within the pool.
 * Optional locks (from Regent system) force specific color/shape.
 */
export function generateSlime(
  discoveredColors: SlimeColor[],
  discoveredShapes: SlimeShape[],
  lockedColor?: SlimeColor,
  lockedShape?: SlimeShape,
): Slime {
  const color = lockedColor ?? pick(discoveredColors)
  const shape = lockedShape ?? pick(discoveredShapes)
  const variance = parseFloat((Math.random() * 0.2 - 0.1).toFixed(2))
  const actualValue = computeBaseValue(color, shape, variance)

  return {
    id: crypto.randomUUID(),
    color,
    shape,
    variance,
    actualValue,
    createdAt: Date.now(),
  }
}
