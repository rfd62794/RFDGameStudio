import { TerritoryCell } from '../../types';
import {
  CAPITAL_HILL_ANCHOR,
  OUTER_CITY_LIMIT,
  RIVER_PATH,
  BRIDGE_LOCATIONS,
  isPointInsidePolygon,
} from '../../data/worldGeometry';

export interface Patch {
  id: string;
  seedPoint: { x: number; y: number };
  polygonPoints: [number, number][];
  center: { x: number; y: number };
  neighborIds: string[];
  isCapital: boolean;
}

export interface PatchGeneratorOptions {
  seedCount?: number; // e.g. 9 or 15
  worldBounds?: { width: number; height: number };
  capitalAnchor?: { x: number; y: number };
  seed?: number; // PRNG seed
  relaxIterations?: number; // Default 2
  outerLimitPolygon?: [number, number][];
}

// Simple deterministic pseudo-random generator (LCG)
function createPRNG(seed = 12345) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Sutherland-Hodgman polygon clipping against a half-plane defined by line equation Ax + By + C <= 0.
 */
export function clipPolygonHalfPlane(
  polygon: [number, number][],
  A: number,
  B: number,
  C: number
): [number, number][] {
  if (polygon.length === 0) return [];

  const isInside = (x: number, y: number) => A * x + B * y + C <= 1e-4;

  const output: [number, number][] = [];
  let s = polygon[polygon.length - 1];

  for (let i = 0; i < polygon.length; i++) {
    const e = polygon[i];
    const sInside = isInside(s[0], s[1]);
    const eInside = isInside(e[0], e[1]);

    if (eInside) {
      if (!sInside) {
        // Calculate intersection point of segment (s, e) with line Ax + By + C = 0
        const dx = e[0] - s[0];
        const dy = e[1] - s[1];
        const denominator = A * dx + B * dy;
        if (Math.abs(denominator) > 1e-6) {
          const t = -(A * s[0] + B * s[1] + C) / denominator;
          const ix = s[0] + t * dx;
          const iy = s[1] + t * dy;
          output.push([Math.round(ix), Math.round(iy)]);
        }
      }
      output.push([Math.round(e[0]), Math.round(e[1])]);
    } else if (sInside) {
      // s is inside, e is outside -> output intersection
      const dx = e[0] - s[0];
      const dy = e[1] - s[1];
      const denominator = A * dx + B * dy;
      if (Math.abs(denominator) > 1e-6) {
        const t = -(A * s[0] + B * s[1] + C) / denominator;
        const ix = s[0] + t * dx;
        const iy = s[1] + t * dy;
        output.push([Math.round(ix), Math.round(iy)]);
      }
    }
    s = e;
  }

  // Deduplicate consecutive identical points
  const deduped: [number, number][] = [];
  for (let i = 0; i < output.length; i++) {
    const prev = deduped[deduped.length - 1];
    const curr = output[i];
    if (!prev || Math.abs(prev[0] - curr[0]) > 1 || Math.abs(prev[1] - curr[1]) > 1) {
      deduped.push(curr);
    }
  }

  return deduped;
}

/**
 * Computes centroid center of a polygon.
 */
export function computePolygonCenter(points: [number, number][]): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };
  let sumX = 0;
  let sumY = 0;
  for (const [x, y] of points) {
    sumX += x;
    sumY += y;
  }
  return {
    x: Math.round(sumX / points.length),
    y: Math.round(sumY / points.length),
  };
}

/**
 * Checks if line segment (p1-p2) intersects segment (p3-p4).
 */
export function lineSegmentsIntersect(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number }
): boolean {
  const ccw = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) => {
    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
  };
  return (
    ccw(p1, p3, p4) !== ccw(p2, p3, p4) &&
    ccw(p1, p2, p3) !== ccw(p1, p2, p4)
  );
}

/**
 * Checks if line segment between pA and pB crosses the river without a bridge.
 */
export function crossesRiver(
  pA: { x: number; y: number },
  pB: { x: number; y: number },
  riverPath: [number, number][] = RIVER_PATH,
  bridges: [number, number][] = BRIDGE_LOCATIONS
): boolean {
  for (let i = 0; i < riverPath.length - 1; i++) {
    const r1 = { x: riverPath[i][0], y: riverPath[i][1] };
    const r2 = { x: riverPath[i + 1][0], y: riverPath[i + 1][1] };
    if (lineSegmentsIntersect(pA, pB, r1, r2)) {
      // Check if a bridge connects them or is nearby
      const bridgeNear = bridges.some((b) => {
        const bx = b[0];
        const by = b[1];
        const distA = Math.hypot(pA.x - bx, pA.y - by);
        const distB = Math.hypot(pB.x - bx, pB.y - by);
        return distA < 100 && distB < 100;
      });
      if (!bridgeNear) return true;
    }
  }
  return false;
}

/**
 * Computes single-pass Voronoi patches for given seeds clipped against outer limit polygon.
 */
function computeVoronoiPatchesForSeeds(
  seedPoints: { x: number; y: number; isCapital: boolean }[],
  outerPolygon: [number, number][]
): Patch[] {
  const patches: Patch[] = [];

  for (let i = 0; i < seedPoints.length; i++) {
    const Pi = seedPoints[i];
    let poly = [...outerPolygon];

    // Clip against Voronoi bisectors of other seeds
    for (let j = 0; j < seedPoints.length; j++) {
      if (i === j) continue;
      const Pj = seedPoints[j];

      const Mx = (Pi.x + Pj.x) / 2;
      const My = (Pi.y + Pj.y) / 2;

      const Vx = Pj.x - Pi.x;
      const Vy = Pj.y - Pi.y;

      const A = Vx;
      const B = Vy;
      const C = -(Vx * Mx + Vy * My);

      poly = clipPolygonHalfPlane(poly, A, B, C);
    }

    const center = poly.length >= 3 ? computePolygonCenter(poly) : { x: Pi.x, y: Pi.y };

    patches.push({
      id: i === 0 ? 'cell_capital' : `cell_gen_${i}`,
      seedPoint: { x: Pi.x, y: Pi.y },
      polygonPoints: poly,
      center,
      neighborIds: [],
      isCapital: Pi.isCapital,
    });
  }

  return patches;
}

/**
 * Standard Lloyd relaxation: moves non-capital seed points to cell centroids and recomputes.
 * Capital anchor point is FIXED and EXCLUDED from relaxation.
 */
export function lloydRelax(
  initialSeeds: { x: number; y: number; isCapital: boolean }[],
  outerPolygon: [number, number][],
  iterations = 2
): { seeds: { x: number; y: number; isCapital: boolean }[]; patches: Patch[] } {
  let seeds = initialSeeds.map((s) => ({ ...s }));
  let patches = computeVoronoiPatchesForSeeds(seeds, outerPolygon);

  for (let iter = 0; iter < iterations; iter++) {
    seeds = seeds.map((s, idx) => {
      // CAPITAL ANCHOR EXCLUDED FROM RELAXATION
      if (s.isCapital || idx === 0) {
        return { ...s };
      }
      const patch = patches[idx];
      if (patch && patch.polygonPoints.length >= 3) {
        const centroid = computePolygonCenter(patch.polygonPoints);
        return {
          ...s,
          x: centroid.x,
          y: centroid.y,
        };
      }
      return { ...s };
    });

    patches = computeVoronoiPatchesForSeeds(seeds, outerPolygon);
  }

  return { seeds, patches };
}

/**
 * Computes area of a polygon using the shoelace formula.
 */
export function computePolygonArea(polygon: [number, number][]): number {
  if (polygon.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % polygon.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
}

/**
 * Generates Voronoi-tessellated patches clipped against permanent outer city limit.
 * Capital anchor point is fixed and never relocated.
 */
export function generatePatches(options: PatchGeneratorOptions = {}): Patch[] {
  const seedCount = options.seedCount ?? 9;
  const capitalAnchor = options.capitalAnchor ?? CAPITAL_HILL_ANCHOR;
  const outerPolygon = options.outerLimitPolygon ?? OUTER_CITY_LIMIT;
  const relaxIterations = options.relaxIterations ?? 4;
  const rng = createPRNG(options.seed ?? 42);

  // Capital seed point is fixed at index 0
  const seedPoints: { x: number; y: number; isCapital: boolean }[] = [
    { x: capitalAnchor.x, y: capitalAnchor.y, isCapital: true },
  ];

  // Bounding box of outer polygon for sampling candidate seeds
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of outerPolygon) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  // Sample seed points inside outer polygon using Mitchell's Best-Candidate algorithm
  // to ensure even spacing and minimize area variance between regions
  let attempts = 0;
  while (seedPoints.length < seedCount && attempts < 2000) {
    let bestCand: { x: number; y: number } | null = null;
    let bestDist = -1;

    for (let c = 0; c < 20; c++) {
      attempts++;
      const rx = Math.round(minX + rng() * (maxX - minX));
      const ry = Math.round(minY + rng() * (maxY - minY));

      if (isPointInsidePolygon({ x: rx, y: ry }, outerPolygon)) {
        const distToCapital = Math.hypot(rx - capitalAnchor.x, ry - capitalAnchor.y);
        if (distToCapital > 25) {
          let minDistToExisting = Infinity;
          for (const sp of seedPoints) {
            const d = Math.hypot(rx - sp.x, ry - sp.y);
            if (d < minDistToExisting) minDistToExisting = d;
          }
          if (minDistToExisting > bestDist) {
            bestDist = minDistToExisting;
            bestCand = { x: rx, y: ry };
          }
        }
      }
    }

    if (bestCand && bestDist > 15) {
      seedPoints.push({ x: bestCand.x, y: bestCand.y, isCapital: false });
    }
  }

  // Fallback if not enough points sampled inside polygon
  while (seedPoints.length < seedCount) {
    const rx = Math.round(minX + rng() * (maxX - minX));
    const ry = Math.round(minY + rng() * (maxY - minY));
    seedPoints.push({ x: rx, y: ry, isCapital: false });
  }

  // Compute Voronoi patches and apply Lloyd relaxation
  const { patches } = lloydRelax(seedPoints, outerPolygon, relaxIterations);

  // Compute neighbor adjacencies considering river barrier
  for (let i = 0; i < patches.length; i++) {
    const pA = patches[i];
    const neighbors: string[] = [];

    for (let j = 0; j < patches.length; j++) {
      if (i === j) continue;
      const pB = patches[j];
      const dist = Math.hypot(pA.center.x - pB.center.x, pA.center.y - pB.center.y);

      // Distance threshold for adjacency
      if (dist < 250) {
        // Exclude if river blocks direct path without a bridge
        if (!crossesRiver(pA.center, pB.center)) {
          neighbors.push(pB.id);
        }
      }
    }
    pA.neighborIds = neighbors;
  }

  return patches;
}
