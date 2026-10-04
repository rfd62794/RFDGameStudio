import { CellType } from '../types';

// Swap this table's values when reflavoring. CellType itself never changes.
export const TERRAIN_DISPLAY_NAMES: Record<CellType, string> = {
  capital: 'Rebel HQ',
  fortress: 'Held District',
  pass: 'Checkpoint',
  outpost: 'Loose District',
  plains: 'Open Street',
};

export function getTerrainDisplayName(type: CellType): string {
  return TERRAIN_DISPLAY_NAMES[type];
}
