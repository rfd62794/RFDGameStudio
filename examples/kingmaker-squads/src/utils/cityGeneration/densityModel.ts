import { Patch } from './patchGenerator';

export interface DensityCalculationParams {
  patch: Patch;
  allPatches: Patch[];
  capitalAnchor: { x: number; y: number };
  isForceBroken?: boolean; // If Defense Force collapsed / zero loyalty
}

/**
 * Computes building density score (0.0 to 1.0) for a patch based on:
 * 1. Spatial distance to the Capital anchor (fewer distance = higher density)
 * 2. Defense Force state: broken forces (loyalty collapsed) drastically reduce density.
 */
export function computeBuildingDensity(params: DensityCalculationParams): number {
  const { patch, capitalAnchor, isForceBroken } = params;

  // Spatial distance from capital
  const dist = Math.hypot(patch.center.x - capitalAnchor.x, patch.center.y - capitalAnchor.y);
  const maxDist = 500;

  // Base density inversely proportional to capital distance
  let density = Math.max(0.15, 1.0 - (dist / maxDist) * 0.7);

  // Capital itself has max density
  if (patch.isCapital || patch.id === 'cell_capital') {
    density = 1.0;
  }

  // Broken Defense Force penalty (district in collapse / unrest)
  if (isForceBroken) {
    density = Math.max(0.05, density * 0.35); // Visually fewer buildings render after force breaks
  }

  return Math.round(density * 100) / 100;
}

/**
 * Deterministically checks whether a building tile should render at grid (col, row)
 * given a patch density and seed.
 */
export function shouldRenderBuildingAt(
  density: number,
  seedStr: string,
  col: number,
  row: number
): boolean {
  // Deterministic hash based on seed string + col + row
  let hash = 0;
  const str = `${seedStr}_c${col}_r${row}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }

  const normHash = (Math.abs(hash) % 1000) / 1000;
  return normHash <= density;
}
