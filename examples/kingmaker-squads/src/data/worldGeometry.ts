// src/data/worldGeometry.ts
// PERMANENT. Per World-Building Reference doc. Do not regenerate,
// do not treat as a parameter, do not "fix" the sprawl elongation —
// it is intentional, not an artifact.

export const CAPITAL_HILL_ANCHOR = { x: 180, y: 120 }; // matches existing Capital position, Revision 5 locked
export const HOVEL_NAME = 'The Underbelly Hovel';

// The old wall — round/oval, encloses hill + original riverside settlement only
export const OLD_WALL_BOUNDARY: [number, number][] = [
  [180, 20],
  [280, 60],
  [320, 140],
  [280, 220],
  [180, 260],
  [80, 220],
  [40, 140],
  [80, 60],
];

// The river — a real hard edge. Bridges are the only crossing points.
export const RIVER_PATH: [number, number][] = [
  [40, 140],
  [-50, 160],
  [-150, 190],
  [-260, 230],
];

// Bridge locations along the river (e.g. main bridge near base of hill)
export const BRIDGE_LOCATIONS: [number, number][] = [
  [40, 140],
];

// The outer city limit — round core + one deliberate elongation
// following the river. THIS is the boundary Layer 1 clips against,
// replacing the old rectangular worldBounds entirely.
export const OUTER_CITY_LIMIT: [number, number][] = [
  [180, 0],
  [320, 50],
  [400, 140],
  [340, 260],
  [180, 320],
  [20, 260],
  [-40, 220],
  [-150, 210],
  [-280, 240],
  [-260, 180],
  [-140, 160],
  [-20, 150],
  [-40, 140],
  [80, 60],
];

/**
 * Point-in-polygon ray casting algorithm.
 */
export function isPointInsidePolygon(
  point: { x: number; y: number },
  polygon: [number, number][]
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function riverPathToSvgD(path: [number, number][]): string {
  if (!path || path.length === 0) return '';
  return path.reduce((acc, point, i) => `${acc}${i === 0 ? 'M' : ' L '} ${point[0]} ${point[1]}`, '');
}

export function isInsideOldWall(point: { x: number; y: number }): boolean {
  return isPointInsidePolygon(point, OLD_WALL_BOUNDARY);
}

export function isInsideCityLimit(point: { x: number; y: number }): boolean {
  return isPointInsidePolygon(point, OUTER_CITY_LIMIT);
}
