import { MapCell, Point, UnitGroup, Corporation } from '../types';

// List of 36 unique immersive sector names
const SECTOR_NAMES = [
  'Sector Alpha-12', 'Sector Beta-9', 'Sector Gamma-4', 'Sector Delta-7',
  'Sector Epsilon-11', 'Sector Zeta-3', 'Sector Eta-8', 'Sector Theta-2',
  'Sector Iota-14', 'Sector Kappa-5', 'Sector Lambda-1', 'Sector Mu-10',
  'Sector Nu-6', 'Sector Xi-13', 'Sector Omicron-2', 'Sector Pi-15',
  'Sector Rho-3', 'Sector Sigma-10', 'Sector Tau-8', 'Sector Upsilon-12',
  'Sector Phi-1', 'Sector Chi-7', 'Sector Psi-11', 'Sector Omega-4',
  'Basin Prime', 'Rift Delta-5', 'Tundra Beta-3', 'Plateau Sigma-8',
  'Ridge Epsilon-2', 'Craters of Xi-12', 'Horizon Flatlands', 'Canyon Gamma-1',
  'Site Crimson-9', 'Glacier Omega-2', 'Dunes of Eta-5', 'Vale of Theta-3'
];

function getDistance(p1: Point, p2: Point): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

// Sutherland-Hodgman polygon clipping algorithm by a half-plane
function clipPolygon(poly: Point[], pointOnLine: Point, normal: Point): Point[] {
  const result: Point[] = [];
  if (poly.length === 0) return result;
  
  for (let i = 0; i < poly.length; i++) {
    const current = poly[i];
    const next = poly[(i + 1) % poly.length];
    
    // Normal vector points towards the inside of the cell we want to keep.
    // Equation of line: (Q - pointOnLine) . normal = 0
    // dCurr is projection of (current - pointOnLine) onto normal.
    const dCurr = (current.x - pointOnLine.x) * normal.x + (current.y - pointOnLine.y) * normal.y;
    const dNext = (next.x - pointOnLine.x) * normal.x + (next.y - pointOnLine.y) * normal.y;
    
    const currInside = dCurr >= -1e-5;
    const nextInside = dNext >= -1e-5;
    
    if (currInside) {
      if (nextInside) {
        result.push(next);
      } else {
        // Intersect segment with line
        const t = dCurr / (dCurr - dNext);
        const intersect = {
          x: current.x + t * (next.x - current.x),
          y: current.y + t * (next.y - current.y)
        };
        result.push(intersect);
      }
    } else {
      if (nextInside) {
        // Intersect segment with line
        const t = dCurr / (dCurr - dNext);
        const intersect = {
          x: current.x + t * (next.x - current.x),
          y: current.y + t * (next.y - current.y)
        };
        result.push(intersect);
        result.push(next);
      }
    }
  }
  return result;
}

// Generate mathematically perfect Voronoi cells that tile the map
export function generateVoronoiMap(width: number, height: number, cellCount: number, corps: Corporation[]): MapCell[] {
  // 1. Generate 36 seeds on a 6x6 grid with jitter
  const cols = Math.ceil(Math.sqrt(cellCount)); // 6
  const rows = Math.ceil(cellCount / cols); // 6
  const seeds: Point[] = [];
  
  const cellW = width / cols;
  const cellH = height / rows;
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (seeds.length >= cellCount) break;
      
      const baseX = (c + 0.5) * cellW;
      const baseY = (r + 0.5) * cellH;
      
      // Jitter must be restricted so seeds stay in their own grid area and don't overlap too much,
      // which avoids self-intersection or weird clipping artifacts.
      const maxJitterX = cellW * 0.35;
      const maxJitterY = cellH * 0.35;
      
      const jitterX = (Math.random() * 2 - 1) * maxJitterX;
      const jitterY = (Math.random() * 2 - 1) * maxJitterY;
      
      seeds.push({
        x: Math.round(baseX + jitterX),
        y: Math.round(baseY + jitterY)
      });
    }
  }

  // 2. Compute the Voronoi polygon for each seed by clipping the bounding box
  const cells: MapCell[] = [];
  
  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    // Start with the bounding box of the map
    let poly: Point[] = [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height }
    ];
    
    for (let j = 0; j < seeds.length; j++) {
      if (i === j) continue;
      const other = seeds[j];
      
      // Perpendicular bisector line
      const midpoint = {
        x: (seed.x + other.x) / 2,
        y: (seed.y + other.y) / 2
      };
      // Normal points from other to seed (into the half-plane containing seed)
      const normal = {
        x: seed.x - other.x,
        y: seed.y - other.y
      };
      
      // Normalize normal vector
      const len = Math.hypot(normal.x, normal.y);
      const normalizedNormal = {
        x: normal.x / len,
        y: normal.y / len
      };
      
      poly = clipPolygon(poly, midpoint, normalizedNormal);
    }
    
    // Clean up floating point errors by rounding coordinates
    const roundedPoly = poly.map(p => ({
      x: Math.round(p.x * 10) / 10,
      y: Math.round(p.y * 10) / 10
    }));

    cells.push({
      id: i,
      name: SECTOR_NAMES[i] || `Sector-${i}`,
      seed,
      polygon: roundedPoly,
      neighbors: [],
      ownerId: null,
      units: { circle: 0, square: 0, triangle: 0 },
      fortification: 0,
      recruitmentQueue: [],
      preferredProduction: 'circle',
      productionProgress: 0
    });
  }

  // 3. Detect neighbors: cells are neighbors if they share a common boundary.
  // We check if two cells share at least two vertices that are within 3 pixels of each other.
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const cellA = cells[i];
      const cellB = cells[j];
      
      let sharedVerticesCount = 0;
      for (const pA of cellA.polygon) {
        for (const pB of cellB.polygon) {
          if (getDistance(pA, pB) < 3.0) {
            sharedVerticesCount++;
            break; // Move to next vertex of cellA
          }
        }
      }
      
      // If they share at least 2 vertices, they are adjacent
      if (sharedVerticesCount >= 2) {
        cellA.neighbors.push(cellB.id);
        cellB.neighbors.push(cellA.id);
      }
    }
  }

  // 4. Spread crash sites (corporation capitals)
  // Let's find 5 seeds that are highly spread out from each other.
  // We can do this with a greedy farthest-point selection:
  const assignedCellIds: number[] = [];
  const sortedCorps = [...corps];

  for (let c = 0; c < sortedCorps.length; c++) {
    const corp = sortedCorps[c];
    let selectedCellId = -1;
    
    if (assignedCellIds.length === 0) {
      // First corp gets a random cell in the middle or corner
      selectedCellId = Math.floor(Math.random() * cells.length);
    } else {
      // Choose cell that maximizes the minimum distance to any already assigned site
      let bestDist = -1;
      let bestId = -1;
      
      for (let k = 0; k < cells.length; k++) {
        if (assignedCellIds.includes(k)) continue;
        
        let minDist = Infinity;
        for (const assignedId of assignedCellIds) {
          const d = getDistance(cells[k].seed, cells[assignedId].seed);
          if (d < minDist) minDist = d;
        }
        
        if (minDist > bestDist) {
          bestDist = minDist;
          bestId = k;
        }
      }
      selectedCellId = bestId;
    }
    
    assignedCellIds.push(selectedCellId);
    
    // Setup the Capital Cell
    const cell = cells[selectedCellId];
    cell.ownerId = corp.id;
    // STARTING_UNITS = 2 (1 circle, 1 square)
    cell.units = { circle: 1, square: 1, triangle: 0 };
    cell.fortification = 1; // Start with fortification 1 at capital
  }

  return cells;
}
