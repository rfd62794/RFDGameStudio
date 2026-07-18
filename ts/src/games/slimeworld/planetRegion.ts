import type { PlanetNode, PlanetRegion, SlimeColor } from './types';

interface Point { x: number; y: number; }

function getSegmentCircleIntersection(A: Point, B: Point, C: Point, R: number): Point | null {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const ox = A.x - C.x;
  const oy = A.y - C.y;

  const a = dx * dx + dy * dy;
  const b = 2 * (ox * dx + oy * dy);
  const c = ox * ox + oy * oy - R * R;

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;

  const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
  const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

  if (t1 >= 0 && t1 <= 1) {
    return { x: A.x + t1 * dx, y: A.y + t1 * dy };
  }
  if (t2 >= 0 && t2 <= 1) {
    return { x: A.x + t2 * dx, y: A.y + t2 * dy };
  }
  return null;
}

function clipPolygonAgainstLine(poly: Point[], p1: Point, p2: Point): Point[] {
  const result: Point[] = [];
  if (poly.length === 0) return result;

  const isInside = (p: Point) => {
    return (p2.x - p1.x) * (p.y - p1.y) - (p2.y - p1.y) * (p.x - p1.x) >= -1e-5;
  };

  const getIntersection = (s: Point, e: Point): Point => {
    const dc = { x: s.x - e.x, y: s.y - e.y };
    const dp = { x: p1.x - p2.x, y: p1.y - p2.y };
    const n1 = s.x * e.y - s.y * e.x;
    const n2 = p1.x * p2.y - p1.y * p2.x;
    const num = n1 * dp.x - dc.x * n2;
    const den = dc.x * dp.y - dc.y * dp.x;
    if (Math.abs(den) < 1e-9) return s;
    return {
      x: num / den,
      y: (n1 * dp.y - dc.y * n2) / den
    };
  };

  let s = poly[poly.length - 1];
  for (const e of poly) {
    if (isInside(e)) {
      if (!isInside(s)) {
        result.push(getIntersection(s, e));
      }
      result.push(e);
    } else if (isInside(s)) {
      result.push(getIntersection(s, e));
    }
    s = e;
  }
  return result;
}

function getOuterCirclePolygon(C: Point, R: number, numVertices = 64): Point[] {
  const poly: Point[] = [];
  for (let i = 0; i < numVertices; i++) {
    const angle = (i * 2 * Math.PI) / numVertices;
    poly.push({
      x: C.x + R * Math.cos(angle),
      y: C.y + R * Math.sin(angle)
    });
  }
  return poly;
}

function clipPolygonAgainstPolygon(subjectPoly: Point[], clipPoly: Point[]): Point[] {
  let result = subjectPoly;
  let s = clipPoly[clipPoly.length - 1];
  for (const e of clipPoly) {
    result = clipPolygonAgainstLine(result, s, e);
    s = e;
  }
  return result;
}

function getPolygonCentroid(poly: Point[]): Point {
  if (poly.length === 0) return { x: 300, y: 300 };
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % poly.length];
    const f = p1.x * p2.y - p2.x * p1.y;
    area += f;
    cx += (p1.x + p2.x) * f;
    cy += (p1.y + p2.y) * f;
  }
  area = area / 2;
  if (Math.abs(area) < 1e-5) {
    let sx = 0, sy = 0;
    poly.forEach(p => { sx += p.x; sy += p.y; });
    return { x: sx / poly.length, y: sy / poly.length };
  }
  cx = cx / (6 * area);
  cy = cy / (6 * area);
  return { x: cx, y: cy };
}

const CURRENT_GEOMETRY_VERSION = 3;

export function generatePlanetRegion(): PlanetRegion {
  const centerX = 300;
  const centerY = 300;

  // 20 nodes: 6 capitols at 60° increments (R=180), 6 inner frontier nodes (R=75), 8 midpoint nodes (R=125)
  const seedDefs = [
    // Outer Capitols (R=180)
    { id: 'node_ember', angle: 0, r: 180 },
    { id: 'node_marsh', angle: Math.PI / 3, r: 180 },
    { id: 'node_gale', angle: 2 * Math.PI / 3, r: 180 },
    { id: 'node_tundra', angle: Math.PI, r: 180 },
    { id: 'node_crystal', angle: 4 * Math.PI / 3, r: 180 },
    { id: 'node_tide', angle: 5 * Math.PI / 3, r: 180 },

    // Inner Frontier Ring (R=75, offset by 30° from capitols)
    { id: 'node_frontier_a', angle: Math.PI / 6, r: 75 },
    { id: 'node_frontier_b', angle: Math.PI / 2, r: 75 },
    { id: 'node_frontier_c', angle: 5 * Math.PI / 6, r: 75 },
    { id: 'node_frontier_d', angle: 7 * Math.PI / 6, r: 75 },
    { id: 'node_frontier_e', angle: 3 * Math.PI / 2, r: 75 },
    { id: 'node_frontier_f', angle: 11 * Math.PI / 6, r: 75 },

    // Middle Ring (R=125, 22.5° spacing)
    { id: 'node_mid_a', angle: Math.PI / 8, r: 125 },
    { id: 'node_mid_b', angle: 3 * Math.PI / 8, r: 125 },
    { id: 'node_mid_c', angle: 5 * Math.PI / 8, r: 125 },
    { id: 'node_mid_d', angle: 7 * Math.PI / 8, r: 125 },
    { id: 'node_mid_e', angle: 9 * Math.PI / 8, r: 125 },
    { id: 'node_mid_f', angle: 11 * Math.PI / 8, r: 125 },
    { id: 'node_mid_g', angle: 13 * Math.PI / 8, r: 125 },
    { id: 'node_mid_h', angle: 15 * Math.PI / 8, r: 125 }
  ];

  const seeds = seedDefs.map(def => {
    const x = centerX + def.r * Math.cos(def.angle);
    const y = centerY + def.r * Math.sin(def.angle);
    return { id: def.id, x, y };
  });

  const paths: string[] = [];
  const polys: Point[][] = [];

  for (let i = 0; i < seeds.length; i++) {
    const pi = seeds[i];
    let cellPoly: Point[] = [
      { x: -1000, y: -1000 },
      { x: 1600, y: -1000 },
      { x: 1600, y: 1600 },
      { x: -1000, y: 1600 }
    ];

    for (let j = 0; j < seeds.length; j++) {
      if (j === i) continue;
      const pj = seeds[j];

      const mx = (pi.x + pj.x) / 2;
      const my = (pi.y + pj.y) / 2;

      const dx = pj.x - pi.x;
      const dy = pj.y - pi.y;

      const p1 = { x: mx, y: my };
      const p2 = { x: mx - dy, y: my + dx };

      cellPoly = clipPolygonAgainstLine(cellPoly, p1, p2);
    }

    const outerPoly = getOuterCirclePolygon({ x: 300, y: 300 }, 300, 64);
    cellPoly = clipPolygonAgainstPolygon(cellPoly, outerPoly);

    polys.push(cellPoly);

    const innerC = { x: 300, y: 300 };
    const innerR = 30;

    const isInsideInner = (p: Point) => {
      const dx = p.x - innerC.x;
      const dy = p.y - innerC.y;
      return dx * dx + dy * dy < innerR * innerR - 1e-5;
    };

    const elements: { point: Point; isInside: boolean; intersectionType?: 'entry' | 'exit' }[] = [];
    const n = cellPoly.length;

    for (let k = 0; k < n; k++) {
      const curr = cellPoly[k];
      const next = cellPoly[(k + 1) % n];

      const currIn = isInsideInner(curr);
      const nextIn = isInsideInner(next);

      elements.push({ point: curr, isInside: currIn });

      if (currIn !== nextIn) {
        const intersect = getSegmentCircleIntersection(curr, next, innerC, innerR);
        if (intersect) {
          elements.push({
            point: intersect,
            isInside: false,
            intersectionType: currIn ? 'exit' : 'entry'
          });
        }
      }
    }

    const filtered = elements.filter(el => !el.isInside);

    let pathStr = '';
    if (filtered.length > 0) {
      pathStr += `M ${filtered[0].point.x.toFixed(1)} ${filtered[0].point.y.toFixed(1)}`;
      for (let k = 0; k < filtered.length; k++) {
        const curr = filtered[k];
        const next = filtered[(k + 1) % filtered.length];

        if (curr.intersectionType === 'entry' && next.intersectionType === 'exit') {
          pathStr += ` A 30 30 0 0 0 ${next.point.x.toFixed(1)} ${next.point.y.toFixed(1)}`;
        } else {
          pathStr += ` L ${next.point.x.toFixed(1)} ${next.point.y.toFixed(1)}`;
        }
      }
      pathStr += ' Z';
    }

    paths.push(pathStr);
  }

  // Compute adjacency on-the-fly from the clipped polygons (tolerance 0.1)
  const computedNeighbors: Record<string, string[]> = {};
  seeds.forEach(s => {
    computedNeighbors[s.id] = [];
  });

  for (let i = 0; i < seeds.length; i++) {
    for (let j = i + 1; j < seeds.length; j++) {
      const polyA = polys[i];
      const polyB = polys[j];
      let sharedCount = 0;
      const toleranceSq = 0.1 * 0.1;

      for (const pA of polyA) {
        for (const pB of polyB) {
          const dx = pA.x - pB.x;
          const dy = pA.y - pB.y;
          if (dx * dx + dy * dy < toleranceSq) {
            sharedCount++;
            break;
          }
        }
        if (sharedCount >= 2) break;
      }

      if (sharedCount >= 2) {
        computedNeighbors[seeds[i].id].push(seeds[j].id);
        computedNeighbors[seeds[j].id].push(seeds[i].id);
      }
    }
  }

  const nodeDefs = [
    // Outer Capitols
    { id: 'node_ember', name: 'Ember', ownerColor: 'Red' as SlimeColor | null, strength: 0.8, isCapitol: true, isSupplied: true, pressure: {} },
    { id: 'node_marsh', name: 'Marsh', ownerColor: 'Orange' as SlimeColor | null, strength: 0.8, isCapitol: true, isSupplied: true, pressure: {} },
    { id: 'node_gale', name: 'Gale', ownerColor: 'Yellow' as SlimeColor | null, strength: 0.8, isCapitol: true, isSupplied: true, pressure: {} },
    { id: 'node_tundra', name: 'Tundra', ownerColor: 'Green' as SlimeColor | null, strength: 0.8, isCapitol: true, isSupplied: true, pressure: {} },
    { id: 'node_crystal', name: 'Crystal', ownerColor: 'Purple' as SlimeColor | null, strength: 0.8, isCapitol: true, isSupplied: true, pressure: {} },
    { id: 'node_tide', name: 'Tide', ownerColor: 'Blue' as SlimeColor | null, strength: 0.8, isCapitol: true, isSupplied: true, pressure: {} },

    // Inner Frontier Ring
    { id: 'node_frontier_a', name: 'Frontier Alpha', ownerColor: null as SlimeColor | null, strength: 0, isCapitol: false, isSupplied: false, pressure: { Red: 15, Orange: 15 } },
    { id: 'node_frontier_b', name: 'Frontier Beta', ownerColor: null as SlimeColor | null, strength: 0, isCapitol: false, isSupplied: false, pressure: { Yellow: 15, Green: 15 } },
    { id: 'node_frontier_c', name: 'Frontier Gamma', ownerColor: null as SlimeColor | null, strength: 0, isCapitol: false, isSupplied: false, pressure: { Purple: 15, Blue: 15 } },
    { id: 'node_frontier_d', name: 'Frontier Delta', ownerColor: null as SlimeColor | null, strength: 0, isCapitol: false, isSupplied: false, pressure: { Red: 10, Blue: 15, Yellow: 10 } },
    { id: 'node_frontier_e', name: 'Frontier Epsilon', ownerColor: null as SlimeColor | null, strength: 0, isCapitol: false, isSupplied: false, pressure: { Orange: 10, Green: 15 } },
    { id: 'node_frontier_f', name: 'Frontier Zeta', ownerColor: null as SlimeColor | null, strength: 0, isCapitol: false, isSupplied: false, pressure: { Yellow: 10, Purple: 15 } },

    // Middle Ring (Midpoint Nodes)
    { id: 'node_mid_a', name: 'Midpoint Alpha', ownerColor: null as SlimeColor | null, strength: 0, isCapitol: false, isSupplied: false, pressure: { Red: 20 } },
    { id: 'node_mid_b', name: 'Midpoint Beta', ownerColor: null as SlimeColor | null, strength: 0, isCapitol: false, isSupplied: false, pressure: { Orange: 20 } },
    { id: 'node_mid_c', name: 'Midpoint Gamma', ownerColor: null as SlimeColor | null, strength: 0, isCapitol: false, isSupplied: false, pressure: { Yellow: 20 } },
    { id: 'node_mid_d', name: 'Midpoint Delta', ownerColor: null as SlimeColor | null, strength: 0, isCapitol: false, isSupplied: false, pressure: { Green: 20 } },
    { id: 'node_mid_e', name: 'Midpoint Epsilon', ownerColor: null as SlimeColor | null, strength: 0, isCapitol: false, isSupplied: false, pressure: { Purple: 20 } },
    { id: 'node_mid_f', name: 'Midpoint Zeta', ownerColor: null as SlimeColor | null, strength: 0, isCapitol: false, isSupplied: false, pressure: { Blue: 20 } },
    { id: 'node_mid_g', name: 'Midpoint Eta', ownerColor: null as SlimeColor | null, strength: 0, isCapitol: false, isSupplied: false, pressure: { Red: 10, Blue: 10 } },
    { id: 'node_mid_h', name: 'Midpoint Theta', ownerColor: null as SlimeColor | null, strength: 0, isCapitol: false, isSupplied: false, pressure: { Yellow: 10, Orange: 10 } }
  ];

  const nodes: PlanetNode[] = nodeDefs.map((def) => {
    const seedIdx = seedDefs.findIndex(s => s.id === def.id);
    const poly = polys[seedIdx];
    const path = paths[seedIdx];
    const centroid = getPolygonCentroid(poly);

    const discovered = def.isCapitol;

    return {
      id: def.id,
      name: def.name,
      cellShape: path,
      labelX: parseFloat(centroid.x.toFixed(1)),
      labelY: parseFloat(centroid.y.toFixed(1)),
      neighbors: computedNeighbors[def.id] || [],
      ownerColor: def.ownerColor,
      pressure: def.pressure,
      strength: def.strength,
      isCapitol: def.isCapitol,
      isSupplied: def.isSupplied,
      distanceFromCenter: seedDefs[seedIdx].r,
      discovered
    };
  });

  return {
    generatedAt: Date.now(),
    geometryVersion: CURRENT_GEOMETRY_VERSION,
    nodes
  };
}
