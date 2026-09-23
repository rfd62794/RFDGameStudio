// Re-export color/shape types from the central registry
export type { SlimeColor, SlimeShape } from './data/traitDefs'
export { COLOR_DEFS, SHAPE_DEFS, getColorTier, getShapeTier } from './data/traitDefs'
export type { ColorDef, ShapeDef, FaceConfig, EyeConfig } from './data/traitDefs'

export interface Slime {
  id: string
  color: import('./data/traitDefs').SlimeColor
  shape: import('./data/traitDefs').SlimeShape
  variance: number
  actualValue: number
  createdAt: number
}

// In-memory shape for a filled display slot.
// Distinct from PersistedDisplaySlot (which embeds slimeData as PersistedSlime).
export interface DisplaySlot {
  slimeId: string
  assignedAt: number  // epoch ms — used for idle income calculation on load
  slime: Slime        // full in-memory slime; drives rendering and rate calculation
}
