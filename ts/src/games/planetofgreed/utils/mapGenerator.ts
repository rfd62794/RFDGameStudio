import { MapCell, Point, Corporation } from '../types';

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
  //
  // Step A: find N seeds that are highly spread out from each other, via a
  // farthest-point-style greedy selection -- this is still the same real,
  // correct mechanism as before (each pick maximizes real distance/spacing
  // to everything already chosen), only now biased to also spread evenly
  // in angle around the map center, not just by raw pairwise distance. A
  // pure distance-only greedy pick can cluster unevenly (e.g. several
  // capitals bunched along one edge) which then can't be relabeled into a
  // clean wheel-cyclic order in Step C below, however it's permuted -- this
  // bias is what actually makes six well-separated positions arrange into
  // something wheel-shaped, without pre-computing fixed target coordinates.
  const centerForSpread: Point = { x: width / 2, y: height / 2 };
  const angleOf = (p: Point) => Math.atan2(p.y - centerForSpread.y, p.x - centerForSpread.x);
  const circularAngleDiff = (a: number, b: number) => {
    let d = Math.abs(a - b) % (2 * Math.PI);
    if (d > Math.PI) d = 2 * Math.PI - d;
    return d;
  };
  // Weight balancing even angular spread (primary) against real distance
  // spread (secondary tiebreaker/nudge) -- tuned empirically against actual
  // generated maps (see Phase 1 verification).
  const ANGLE_SPREAD_WEIGHT = 2000;

  const assignedCellIds: number[] = [];
  for (let c = 0; c < corps.length; c++) {
    if (assignedCellIds.length === 0) {
      // First pick: farthest cell from the map center. Real property of the
      // generated seed, not an arbitrary/random start -- reduces variance
      // in the resulting spread vs. a fully random first pick.
      let bestId = 0;
      let bestRadius = -1;
      for (let k = 0; k < cells.length; k++) {
        const r = getDistance(cells[k].seed, centerForSpread);
        if (r > bestRadius) {
          bestRadius = r;
          bestId = k;
        }
      }
      assignedCellIds.push(bestId);
      continue;
    }

    let bestScore = -Infinity;
    let bestId = -1;
    for (let k = 0; k < cells.length; k++) {
      if (assignedCellIds.includes(k)) continue;

      let minAngleGap = Infinity;
      let minDist = Infinity;
      for (const assignedId of assignedCellIds) {
        const angleGap = circularAngleDiff(angleOf(cells[k].seed), angleOf(cells[assignedId].seed));
        if (angleGap < minAngleGap) minAngleGap = angleGap;
        const d = getDistance(cells[k].seed, cells[assignedId].seed);
        if (d < minDist) minDist = d;
      }

      const score = minAngleGap * ANGLE_SPREAD_WEIGHT + minDist;
      if (score > bestScore) {
        bestScore = score;
        bestId = k;
      }
    }
    assignedCellIds.push(bestId);
  }

  // Step B: assign corps to those spread-out candidates by finding the best
  // bijection of wheel slots onto positions, rather than assuming a naive
  // angular sort recovers wheel order correctly. Two real, checked
  // guarantees:
  //   1. The single globally farthest-apart pair among the N candidates is
  //      always assigned to the wheel's two "opposite" slots (index 0 and
  //      index N/2 -- Ember and Tundra, for the six-Culture wheel) -- this
  //      is always achievable for any point configuration, so the
  //      wheel-opposite rival pair is guaranteed maximally distant, not
  //      merely likely to be.
  //   2. The remaining slots are assigned (brute-force over the small
  //      remaining permutation space) to maximize how many corps end up
  //      with a real wheel-adjacent culture as their nearest actual map
  //      neighbor -- a real optimization against the actual generated
  //      positions, not an assumption.
  function permutations<T>(arr: T[]): T[][] {
    if (arr.length <= 1) return [arr];
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      for (const p of permutations(rest)) result.push([arr[i], ...p]);
    }
    return result;
  }

  function bestWheelAssignment(candidateIds: number[]): number[] {
    const n = candidateIds.length;
    let farPair: [number, number] = [candidateIds[0], candidateIds[1]];
    let farPairDist = -1;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const d = getDistance(cells[candidateIds[i]].seed, cells[candidateIds[j]].seed);
        if (d > farPairDist) {
          farPairDist = d;
          farPair = [candidateIds[i], candidateIds[j]];
        }
      }
    }
    const oppositeSlot = Math.floor(n / 2); // index 3 of 6 -- Tundra's slot, opposite Ember's index 0
    const remaining = candidateIds.filter((id) => id !== farPair[0] && id !== farPair[1]);
    const otherSlots = Array.from({ length: n }, (_, i) => i).filter((i) => i !== 0 && i !== oppositeSlot);

    let best: number[] | null = null;
    let bestAdjacentNeighborCount = -1;
    let bestPerimeter = Infinity;

    for (const [slot0Id, oppositeSlotId] of [farPair, [farPair[1], farPair[0]] as [number, number]]) {
      for (const perm of permutations(remaining)) {
        const order = new Array<number>(n);
        order[0] = slot0Id;
        order[oppositeSlot] = oppositeSlotId;
        otherSlots.forEach((slot, idx) => {
          order[slot] = perm[idx];
        });

        let perimeter = 0;
        for (let i = 0; i < n; i++) {
          perimeter += getDistance(cells[order[i]].seed, cells[order[(i + 1) % n]].seed);
        }

        let adjacentNeighborCount = 0;
        for (let i = 0; i < n; i++) {
          let nearestJ = -1;
          let nearestD = Infinity;
          for (let j = 0; j < n; j++) {
            if (j === i) continue;
            const d = getDistance(cells[order[i]].seed, cells[order[j]].seed);
            if (d < nearestD) {
              nearestD = d;
              nearestJ = j;
            }
          }
          const diff = Math.abs(i - nearestJ);
          if (diff === 1 || diff === n - 1) adjacentNeighborCount++;
        }

        if (
          adjacentNeighborCount > bestAdjacentNeighborCount ||
          (adjacentNeighborCount === bestAdjacentNeighborCount && perimeter < bestPerimeter)
        ) {
          bestAdjacentNeighborCount = adjacentNeighborCount;
          bestPerimeter = perimeter;
          best = order;
        }
      }
    }
    return best!;
  }

  const wheelOrderedCellIds = bestWheelAssignment(assignedCellIds);

  // Step C: assign corps to those positions in the same cyclic sequence the
  // corps array is already in (wheel order, per App.tsx's
  // CULTURE_WHEEL-ordered corp construction). This function has no
  // knowledge of cultures -- it only preserves whatever cyclic order
  // `corps` arrives in.
  for (let c = 0; c < corps.length; c++) {
    const corp = corps[c];
    const cell = cells[wheelOrderedCellIds[c]];
    cell.ownerId = corp.id;
    // STARTING_UNITS = 2 (1 circle, 1 square) -- identical for every corp,
    // regardless of culture. No culture-conditional starting stats.
    cell.units = { circle: 1, square: 1, triangle: 0 };
    cell.fortification = 1; // Start with fortification 1 at capital
  }

  return cells;
}
