// ═══════════════════════════════════════════════════════════════
//  Discovery System — Recipes and breed-discovery logic
// ═══════════════════════════════════════════════════════════════

import type { SlimeColor, SlimeShape } from '../data/traitDefs'
import { BREED_DISCOVERY_CHANCE } from '../config'

// ── Recipe Tables ───────────────────────────────────────────────
// Key: sorted pair "A+B" — order doesn't matter

function recipeKey(a: string, b: string): string {
  return [a, b].sort().join('+')
}

// Color recipes (RYB color mixing)
const COLOR_RECIPES = new Map<string, SlimeColor>([
  // T2: Primary + Primary
  [recipeKey('Red', 'Yellow'), 'Orange'],
  [recipeKey('Yellow', 'Blue'), 'Green'],
  [recipeKey('Red', 'Blue'), 'Purple'],
  // T3: Primary + Secondary
  [recipeKey('Red', 'Orange'), 'Amber'],
  [recipeKey('Red', 'Purple'), 'Crimson'],
  [recipeKey('Yellow', 'Orange'), 'Gold'],
  [recipeKey('Yellow', 'Green'), 'Lime'],
  [recipeKey('Blue', 'Purple'), 'Indigo'],
  [recipeKey('Blue', 'Green'), 'Teal'],
  // T4: Secondary + Secondary
  [recipeKey('Orange', 'Purple'), 'Rust'],
  [recipeKey('Orange', 'Green'), 'Olive'],
  [recipeKey('Purple', 'Green'), 'Slate'],
])

// Shape recipes (geometric morphology)
const SHAPE_RECIPES = new Map<string, SlimeShape>([
  // T2: Basic + Basic
  [recipeKey('Triangle', 'Square'), 'Star'],
  [recipeKey('Square', 'Circle'), 'Diamond'],
  [recipeKey('Circle', 'Triangle'), 'Teardrop'],
  // T3: Basic + Hybrid
  [recipeKey('Circle', 'Star'), 'Pentagon'],
  [recipeKey('Square', 'Teardrop'), 'Crescent'],
  [recipeKey('Triangle', 'Diamond'), 'Hexa'],
  // T4: Hybrid + Hybrid
  [recipeKey('Star', 'Diamond'), 'Crown'],
  [recipeKey('Teardrop', 'Star'), 'Crystal'],
])

// ── Discovery Breeding ─────────────────────────────────────────

export interface BreedColorResult {
  color: SlimeColor
  isNewDiscovery: boolean
}

export interface BreedShapeResult {
  shape: SlimeShape
  isNewDiscovery: boolean
}

/**
 * Determine offspring color from two parents.
 * If parents have different colors that match a recipe → BREED_DISCOVERY_CHANCE to produce the recipe result.
 * Otherwise → 60/40 host/donor inheritance.
 */
export function breedColor(
  hostColor: SlimeColor,
  donorColor: SlimeColor,
  discoveredColors: Set<SlimeColor>,
  hostWeight: number,
): BreedColorResult {
  // Same color parents → offspring inherits that color
  if (hostColor === donorColor) {
    return { color: hostColor, isNewDiscovery: false }
  }

  // Check for recipe match
  const key = recipeKey(hostColor, donorColor)
  const recipeResult = COLOR_RECIPES.get(key)

  if (recipeResult && Math.random() < BREED_DISCOVERY_CHANCE) {
    const isNew = !discoveredColors.has(recipeResult)
    return { color: recipeResult, isNewDiscovery: isNew }
  }

  // No recipe or recipe didn't fire → inherit from parent
  const color = Math.random() < hostWeight ? hostColor : donorColor
  return { color, isNewDiscovery: false }
}

/**
 * Determine offspring shape from two parents.
 * Same logic as breedColor but for shapes.
 */
export function breedShape(
  hostShape: SlimeShape,
  donorShape: SlimeShape,
  discoveredShapes: Set<SlimeShape>,
  hostWeight: number,
): BreedShapeResult {
  if (hostShape === donorShape) {
    return { shape: hostShape, isNewDiscovery: false }
  }

  const key = recipeKey(hostShape, donorShape)
  const recipeResult = SHAPE_RECIPES.get(key)

  if (recipeResult && Math.random() < BREED_DISCOVERY_CHANCE) {
    const isNew = !discoveredShapes.has(recipeResult)
    return { shape: recipeResult, isNewDiscovery: isNew }
  }

  const shape = Math.random() < hostWeight ? hostShape : donorShape
  return { shape, isNewDiscovery: false }
}

// ── Recipe Hints ────────────────────────────────────────────────
// For the UI: show what two traits can produce

export function getColorRecipeHint(color: SlimeColor): [SlimeColor, SlimeColor] | null {
  for (const [key, result] of COLOR_RECIPES) {
    if (result === color) {
      const [a, b] = key.split('+') as [SlimeColor, SlimeColor]
      return [a, b]
    }
  }
  return null
}

export function getShapeRecipeHint(shape: SlimeShape): [SlimeShape, SlimeShape] | null {
  for (const [key, result] of SHAPE_RECIPES) {
    if (result === shape) {
      const [a, b] = key.split('+') as [SlimeShape, SlimeShape]
      return [a, b]
    }
  }
  return null
}
