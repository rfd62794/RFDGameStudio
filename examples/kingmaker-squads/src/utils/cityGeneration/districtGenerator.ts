import { Patch, clipPolygonHalfPlane, computePolygonCenter } from './patchGenerator';
import { isPointInsidePolygon } from '../../data/worldGeometry';

/**
 * Simple deterministic PRNG
 */
function createPRNG(seed = 42) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Generates Districts within a Region patch using Voronoi tessellation
 * clipped strictly to the parent Region's polygon bounds.
 */
export function generateDistrictsWithinRegion(
  region: Patch,
  targetCount: number = 4,
  seed: number = 1234
): Patch[] {
  // Clamp targetCount to range [3, 8] per specification
  const count = Math.max(3, Math.min(8, targetCount));
  const rng = createPRNG(seed + region.polygonPoints.length);

  // Find bounding box of region polygon
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of region.polygonPoints) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  // Sample seed points inside region polygon
  const seeds: { x: number; y: number }[] = [];
  let attempts = 0;
  while (seeds.length < count && attempts < 1000) {
    attempts++;
    const rx = Math.round(minX + rng() * (maxX - minX));
    const ry = Math.round(minY + rng() * (maxY - minY));
    if (isPointInsidePolygon({ x: rx, y: ry }, region.polygonPoints)) {
      // Ensure seed points aren't identical
      if (!seeds.some((s) => Math.hypot(s.x - rx, s.y - ry) < 5)) {
        seeds.push({ x: rx, y: ry });
      }
    }
  }

  // Fallback if not enough points sampled inside polygon
  while (seeds.length < count) {
    const rx = Math.round(minX + (seeds.length + 1) * ((maxX - minX) / (count + 1)));
    const ry = Math.round(minY + (seeds.length + 1) * ((maxY - minY) / (count + 1)));
    seeds.push({ x: rx, y: ry });
  }

  // Compute Voronoi districts clipped to parent region polygon
  function computeVoronoi(points: { x: number; y: number }[]): Patch[] {
    const districts: Patch[] = [];
    for (let i = 0; i < points.length; i++) {
      const Pi = points[i];
      let poly = [...region.polygonPoints];

      for (let j = 0; j < points.length; j++) {
        if (i === j) continue;
        const Pj = points[j];

        const Mx = (Pi.x + Pj.x) / 2;
        const My = (Pi.y + Pj.y) / 2;
        const Vx = Pj.x - Pi.x;
        const Vy = Pj.y - Pi.y;

        const A = Vx;
        const B = Vy;
        const C = -(Vx * Mx + Vy * My);

        poly = clipPolygonHalfPlane(poly, A, B, C);
      }

      // If poly collapsed, fallback to small box around Pi
      if (poly.length < 3) {
        poly = [
          [Pi.x - 5, Pi.y - 5],
          [Pi.x + 5, Pi.y - 5],
          [Pi.x + 5, Pi.y + 5],
          [Pi.x - 5, Pi.y + 5],
        ];
      }

      const center = computePolygonCenter(poly);
      districts.push({
        id: `${region.id}_d${i + 1}`,
        seedPoint: Pi,
        polygonPoints: poly,
        center,
        neighborIds: [],
        isCapital: region.isCapital && i === 0,
      });
    }
    return districts;
  }

  // Lloyd relaxation inside parent region
  let currentSeeds = [...seeds];
  let districts = computeVoronoi(currentSeeds);

  for (let iter = 0; iter < 2; iter++) {
    currentSeeds = districts.map((d) => {
      const c = d.center;
      if (isPointInsidePolygon(c, region.polygonPoints)) {
        return c;
      }
      return d.seedPoint;
    });
    districts = computeVoronoi(currentSeeds);
  }

  // Compute local district adjacencies within region
  for (let i = 0; i < districts.length; i++) {
    const dA = districts[i];
    const neighbors: string[] = [];
    for (let j = 0; j < districts.length; j++) {
      if (i === j) continue;
      const dB = districts[j];
      const dist = Math.hypot(dA.center.x - dB.center.x, dA.center.y - dB.center.y);
      if (dist < 200) {
        neighbors.push(dB.id);
      }
    }
    dA.neighborIds = neighbors;
  }

  return districts;
}
