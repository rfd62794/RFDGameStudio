import { PipeDirection, TilePos } from '../types';
import { BUILDING_TILE } from './buildingDefs';
import { ASTEROID_ZONE_HEIGHT, GRID_HEIGHT, GRID_WIDTH } from './grid';
import type { BuildingManager } from './buildingManager';

export const TILES_X = GRID_WIDTH / BUILDING_TILE; // 40
export const TILES_Y = GRID_HEIGHT / BUILDING_TILE; // 25
export const COLLECTOR_MAX_TILE_Y = ASTEROID_ZONE_HEIGHT / BUILDING_TILE; // 5 (rows 0-4)

export function snapToTile(caX: number, caY: number): TilePos {
  return {
    tx: Math.max(0, Math.min(TILES_X - 1, Math.floor(caX / BUILDING_TILE))),
    ty: Math.max(0, Math.min(TILES_Y - 1, Math.floor(caY / BUILDING_TILE))),
  };
}

export function tileToCA(tx: number, ty: number): { x: number; y: number } {
  return {
    x: tx * BUILDING_TILE,
    y: ty * BUILDING_TILE,
  };
}

export function computeRoute(
  start: TilePos,
  end: TilePos,
  horizontalFirst: boolean,
  buildingMgr: BuildingManager
): TilePos[] {
  const rawTiles: TilePos[] = [];

  const dx = end.tx > start.tx ? 1 : end.tx < start.tx ? -1 : 0;
  const dy = end.ty > start.ty ? 1 : end.ty < start.ty ? -1 : 0;

  let cx = start.tx;
  let cy = start.ty;

  if (horizontalFirst) {
    // Walk horizontal first
    while (cx !== end.tx) {
      rawTiles.push({ tx: cx, ty: cy });
      cx += dx;
    }
    // Walk vertical
    while (cy !== end.ty) {
      rawTiles.push({ tx: cx, ty: cy });
      cy += dy;
    }
    rawTiles.push({ tx: end.tx, ty: end.ty });
  } else {
    // Walk vertical first
    while (cy !== end.ty) {
      rawTiles.push({ tx: cx, ty: cy });
      cy += dy;
    }
    // Walk horizontal
    while (cx !== end.tx) {
      rawTiles.push({ tx: cx, ty: cy });
      cx += dx;
    }
    rawTiles.push({ tx: end.tx, ty: end.ty });
  }

  // Filter contiguous valid tiles starting from start tile
  // Must stop at first occupied or out-of-bounds tile
  const validTiles: TilePos[] = [];
  for (let i = 0; i < rawTiles.length; i++) {
    const t = rawTiles[i];
    if (t.tx < 0 || t.tx >= TILES_X || t.ty < 0 || t.ty >= TILES_Y) {
      break;
    }
    // Check if within asteroid zone: Pipes are outside Asteroid Zone (rows 5-24)
    if (t.ty < COLLECTOR_MAX_TILE_Y) {
      break;
    }

    const tileIdx = t.ty * TILES_X + t.tx;
    const isOccupiedByBuilding = buildingMgr.buildingTileGrid[tileIdx] !== 0;
    const isOccupiedByPipe = buildingMgr.pipeTileGrid[tileIdx] !== 0;

    if (isOccupiedByBuilding || isOccupiedByPipe) {
      break;
    }
    validTiles.push(t);
  }

  return validTiles;
}

export function computeSegmentDirection(
  route: TilePos[],
  index: number,
  fallbackDir: PipeDirection = 'DOWN'
): PipeDirection {
  if (route.length <= 1) {
    return fallbackDir;
  }

  const cur = route[index];

  // Point toward next tile in route
  if (index < route.length - 1) {
    const next = route[index + 1];
    if (next.tx > cur.tx) return 'RIGHT';
    if (next.tx < cur.tx) return 'LEFT';
    if (next.ty > cur.ty) return 'DOWN';
    if (next.ty < cur.ty) return 'UP';
  }

  // If last tile, continue from previous tile
  if (index > 0) {
    const prev = route[index - 1];
    if (cur.tx > prev.tx) return 'RIGHT';
    if (cur.tx < prev.tx) return 'LEFT';
    if (cur.ty > prev.ty) return 'DOWN';
    if (cur.ty < prev.ty) return 'UP';
  }

  return fallbackDir;
}
