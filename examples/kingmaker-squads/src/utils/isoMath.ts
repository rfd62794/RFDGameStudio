import { TerritoryCell } from '../types';

export interface IsoTilePosParams {
  anchor: { x: number; y: number };
  col: number;
  row: number;
  tileWidth?: number;
  tileHeight?: number;
}

/**
 * Computes screen (x, y) coordinates for an isometric grid tile given an anchor point and col/row indices.
 * Standard 2:1 isometric projection:
 * screenX = anchor.x + (col - row) * (tileWidth / 2)
 * screenY = anchor.y + (col + row) * (tileHeight / 2)
 */
export function computeIsoTileScreenPos(params: IsoTilePosParams): { x: number; y: number } {
  const tileW = params.tileWidth ?? 32;
  const tileH = params.tileHeight ?? 16;
  const x = params.anchor.x + (params.col - params.row) * (tileW / 2);
  const y = params.anchor.y + (params.col + params.row) * (tileH / 2);
  return { x, y };
}

/**
 * Computes bounding box for an array of 2D polygon points.
 */
export function getPolygonBoundingBox(polygonPoints: [number, number][]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const [x, y] of polygonPoints) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return { minX, maxX, minY, maxY };
}

/**
 * Checks if a point is inside a 2D polygon using ray casting algorithm.
 */
export function isPointInsidePolygon(point: { x: number; y: number }, polygonPoints: [number, number][]): boolean {
  const { x, y } = point;
  let inside = false;
  for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
    const xi = polygonPoints[i][0], yi = polygonPoints[i][1];
    const xj = polygonPoints[j][0], yj = polygonPoints[j][1];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Verifies whether a cell's isometric grid footprint is within its polygon bounding box/interior.
 */
export function isCellIsoGridWithinBounds(cell: TerritoryCell, tileW = 32, tileH = 16): boolean {
  if (!cell.isoGridAnchor || cell.isoGridCols === undefined || cell.isoGridRows === undefined) {
    return true; // Unset cells are trivially valid
  }

  const { minX, maxX, minY, maxY } = getPolygonBoundingBox(cell.polygonPoints);

  const corners = [
    { col: 0, row: 0 },
    { col: Math.max(0, cell.isoGridCols - 1), row: 0 },
    { col: 0, row: Math.max(0, cell.isoGridRows - 1) },
    { col: Math.max(0, cell.isoGridCols - 1), row: Math.max(0, cell.isoGridRows - 1) },
  ];

  for (const c of corners) {
    const pos = computeIsoTileScreenPos({
      anchor: cell.isoGridAnchor,
      col: c.col,
      row: c.row,
      tileWidth: tileW,
      tileHeight: tileH,
    });

    if (pos.x < minX - 10 || pos.x > maxX + 10 || pos.y < minY - 10 || pos.y > maxY + 10) {
      return false;
    }
  }

  return true;
}
