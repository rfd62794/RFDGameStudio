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

const NEIGHBORS_MAP: Record<string, string[]> = {
  node_solitude: ['node_abyss', 'node_sulphur', 'node_feral', 'node_twilight'],
  node_sulphur: ['node_solitude', 'node_jungle', 'node_rust', 'node_wetlands'],
  node_jungle: ['node_sulphur', 'node_abyss', 'node_wetlands'],
  node_abyss: ['node_jungle', 'node_solitude', 'node_twilight', 'node_wetlands'],
  node_feral: ['node_twilight', 'node_rust', 'node_solitude'],
  node_rust: ['node_feral', 'node_wetlands', 'node_sulphur'],
  node_wetlands: ['node_rust', 'node_twilight', 'node_sulphur', 'node_jungle', 'node_abyss'],
  node_twilight: ['node_wetlands', 'node_feral', 'node_solitude', 'node_abyss']
};

export function generatePlanetRegion(): PlanetRegion {
  const centerX = 300;
  const centerY = 300;

  const seedDefs = [
    { id: 'node_solitude', angle: 0, r: 90 },
    { id: 'node_feral', angle: Math.PI / 3, r: 225 },
    { id: 'node_rust', angle: 2 * Math.PI / 3, r: 225 },
    { id: 'node_sulphur', angle: 5 * Math.PI / 6, r: 90 },
    { id: 'node_wetlands', angle: Math.PI, r: 225 },
    { id: 'node_jungle', angle: 7 * Math.PI / 6, r: 90 },
    { id: 'node_abyss', angle: 4 * Math.PI / 3, r: 90 },
    { id: 'node_twilight', angle: 5 * Math.PI / 3, r: 225 },
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

  const nodeDefs = [
    { id: 'node_solitude', name: 'Solitude Ridge', ownerColor: 'Red' as SlimeColor | null, strength: 0.8, isCapitol: true, isSupplied: true, pressure: {} },
    { id: 'node_abyss', name: 'Abyssal Chasm', ownerColor: 'Blue' as SlimeColor | null, strength: 0.8, isCapitol: true, isSupplied: true, pressure: {} },
    { id: 'node_sulphur', name: 'Sulphur Gateway', ownerColor: null as SlimeColor | null, strength: 0, isCapitol: false, isSupplied: false, pressure: { Red: 15, Blue: 25 } },
    { id: 'node_jungle', name: 'Jungle Outpost', ownerColor: null as SlimeColor | null, strength: 0, isCapitol: false, isSupplied: false, pressure: { Red: 35, Blue: 10 } },
    { id: 'node_twilight', name: 'Twilight Grove', ownerColor: 'Purple' as SlimeColor | null, strength: 0.8, isCapitol: true, isSupplied: true, pressure: {} },
    { id: 'node_rust', name: 'Rust Crater', ownerColor: 'Orange' as SlimeColor | null, strength: 0.8, isCapitol: true, isSupplied: true, pressure: {} },
    { id: 'node_feral', name: 'Feral Canopy', ownerColor: 'Green' as SlimeColor | null, strength: 0.8, isCapitol: true, isSupplied: true, pressure: {} },
    { id: 'node_wetlands', name: 'Silt Wetlands', ownerColor: null as SlimeColor | null, strength: 0, isCapitol: false, isSupplied: false, pressure: { Purple: 20, Orange: 15, Green: 10 } },
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
      neighbors: NEIGHBORS_MAP[def.id] || [],
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
    nodes
  };
}
