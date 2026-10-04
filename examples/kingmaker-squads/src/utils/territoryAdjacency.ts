import { TerritoryCell } from '../types';

/**
 * Utility to compute shared-edge adjacency between territory polygon cells.
 */

function pointsMatch(p1: [number, number], p2: [number, number], tolerance: number = 3.0): boolean {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return Math.sqrt(dx * dx + dy * dy) <= tolerance;
}

function doSegmentsMatch(
  a1: [number, number],
  a2: [number, number],
  b1: [number, number],
  b2: [number, number],
  tolerance: number = 3.0
): boolean {
  const directMatch = pointsMatch(a1, b1, tolerance) && pointsMatch(a2, b2, tolerance);
  const reverseMatch = pointsMatch(a1, b2, tolerance) && pointsMatch(a2, b1, tolerance);
  return directMatch || reverseMatch;
}

export function doPolygonsShareEdge(
  polyA: [number, number][],
  polyB: [number, number][],
  tolerance: number = 3.0
): boolean {
  for (let i = 0; i < polyA.length; i++) {
    const a1 = polyA[i];
    const a2 = polyA[(i + 1) % polyA.length];

    for (let j = 0; j < polyB.length; j++) {
      const b1 = polyB[j];
      const b2 = polyB[(j + 1) % polyB.length];

      if (doSegmentsMatch(a1, a2, b1, b2, tolerance)) {
        return true;
      }
    }
  }

  // Fallback: Check if they share at least two vertices within tolerance
  let sharedVertexCount = 0;
  for (const ptA of polyA) {
    if (polyB.some((ptB) => pointsMatch(ptA, ptB, tolerance))) {
      sharedVertexCount++;
    }
  }

  return sharedVertexCount >= 2;
}

export function computeTerritoryAdjacency(cells: TerritoryCell[]): TerritoryCell[] {
  return cells.map((cell) => {
    const neighborIds = cells
      .filter((other) => other.id !== cell.id && doPolygonsShareEdge(cell.polygonPoints, other.polygonPoints))
      .map((other) => other.id);

    return {
      ...cell,
      neighborIds,
    };
  });
}
