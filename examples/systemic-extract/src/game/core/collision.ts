import { TileState } from '../../types';
import { MAP_WIDTH, MAP_HEIGHT } from '../map';

/**
 * Checks whether a given grid coordinate (tx, ty) corresponds to a solid wall tile.
 * Boundary coordinates outside the 100x100 map are treated as solid.
 */
export function isSolidTile(map: TileState[][], tx: number, ty: number): boolean {
  if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return true;
  const tile = map[ty]?.[tx];
  if (!tile) return true;
  return tile.wallEntityId !== null;
}

/**
 * Returns the exact AABB bounding box in world coordinates for tile (tx, ty).
 * In our continuous coordinate system, integer (tx, ty) represents the tile center,
 * so the tile spans [tx - 0.5, tx + 0.5] along X and [ty - 0.5, ty + 0.5] along Y.
 */
export function getTileBounds(tx: number, ty: number) {
  return {
    minX: tx - 0.5,
    maxX: tx + 0.5,
    minY: ty - 0.5,
    maxY: ty + 0.5,
  };
}

export interface CollisionResult {
  x: number;
  y: number;
  collided: boolean;
  normalX: number;
  normalY: number;
}

/**
 * Circle vs Block-Tile Collision Resolver with Internal Edge Filtering.
 *
 * Resolves continuous circle penetration against solid tile AABBs in the local neighborhood.
 * Internal Edge Filtering ensures that adjacent solid tiles behave as a single seamless
 * continuous surface, completely eliminating snagging or "catching" on internal tile boundaries.
 */
export function resolveCircleTileCollision(
  startX: number,
  startY: number,
  radius: number,
  map: TileState[][],
  iterations: number = 3
): CollisionResult {
  let currX = startX;
  let currY = startY;
  let hasCollided = false;
  let totalNormalX = 0;
  let totalNormalY = 0;

  for (let iter = 0; iter < iterations; iter++) {
    // Determine the tile neighborhood overlapping the circle's bounding box
    const minTx = Math.max(0, Math.floor(currX - radius + 0.5));
    const maxTx = Math.min(MAP_WIDTH - 1, Math.floor(currX + radius + 0.5));
    const minTy = Math.max(0, Math.floor(currY - radius + 0.5));
    const maxTy = Math.min(MAP_HEIGHT - 1, Math.floor(currY + radius + 0.5));

    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (!isSolidTile(map, tx, ty)) continue;

        // Exposed Face Topology: detect which faces are external
        const solidLeft = isSolidTile(map, tx - 1, ty);
        const solidRight = isSolidTile(map, tx + 1, ty);
        const solidTop = isSolidTile(map, tx, ty - 1);
        const solidBottom = isSolidTile(map, tx, ty + 1);

        // If completely enclosed by solid tiles, skip internal geometry
        if (solidLeft && solidRight && solidTop && solidBottom) continue;

        const tileMinX = tx - 0.5;
        const tileMaxX = tx + 0.5;
        const tileMinY = ty - 0.5;
        const tileMaxY = ty + 0.5;

        // Compute closest point on the tile box to the circle center
        let clampX = Math.max(tileMinX, Math.min(tileMaxX, currX));
        let clampY = Math.max(tileMinY, Math.min(tileMaxY, currY));

        // INTERNAL EDGE FILTERING:
        // If the closest point lies on a seam shared with another solid tile,
        // cancel the axis clamp so that no false tangential resistance or corner snagging occurs.
        if (clampX === tileMaxX && solidRight && currX >= tileMaxX) {
          clampX = currX;
        }
        if (clampX === tileMinX && solidLeft && currX <= tileMinX) {
          clampX = currX;
        }
        if (clampY === tileMaxY && solidBottom && currY >= tileMaxY) {
          clampY = currY;
        }
        if (clampY === tileMinY && solidTop && currY <= tileMinY) {
          clampY = currY;
        }

        const dx = currX - clampX;
        const dy = currY - clampY;
        const distSq = dx * dx + dy * dy;

        if (distSq < radius * radius) {
          hasCollided = true;
          if (distSq > 0.000001) {
            const dist = Math.sqrt(distSq);
            const overlap = radius - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            currX += nx * overlap;
            currY += ny * overlap;
            totalNormalX += nx;
            totalNormalY += ny;
          } else {
            // Deep penetration recovery: push along shallowest exposed face
            let bestDist = Infinity;
            let pushX = 0;
            let pushY = 0;

            if (!solidLeft) {
              const d = currX - tileMinX;
              if (d < bestDist) {
                bestDist = d;
                pushX = -1;
                pushY = 0;
              }
            }
            if (!solidRight) {
              const d = tileMaxX - currX;
              if (d < bestDist) {
                bestDist = d;
                pushX = 1;
                pushY = 0;
              }
            }
            if (!solidTop) {
              const d = currY - tileMinY;
              if (d < bestDist) {
                bestDist = d;
                pushX = 0;
                pushY = -1;
              }
            }
            if (!solidBottom) {
              const d = tileMaxY - currY;
              if (d < bestDist) {
                bestDist = d;
                pushX = 0;
                pushY = 1;
              }
            }

            if (bestDist !== Infinity) {
              const ejectDist = bestDist + radius + 0.002;
              currX += pushX * ejectDist;
              currY += pushY * ejectDist;
              totalNormalX += pushX;
              totalNormalY += pushY;
            }
          }
        }
      }
    }
  }

  // Normalize composite collision normal if any
  const normalLen = Math.hypot(totalNormalX, totalNormalY);
  const normalX = normalLen > 0.0001 ? totalNormalX / normalLen : 0;
  const normalY = normalLen > 0.0001 ? totalNormalY / normalLen : 0;

  // Map boundary safety clamp
  currX = Math.max(radius, Math.min(MAP_WIDTH - 1 - radius, currX));
  currY = Math.max(radius, Math.min(MAP_HEIGHT - 1 - radius, currY));

  return {
    x: currX,
    y: currY,
    collided: hasCollided,
    normalX,
    normalY,
  };
}

/**
 * Corner Assistance (Corner Nudging).
 *
 * When an operative is moving toward an opening (doorway, corridor mouth, or corner)
 * but is slightly misaligned (clipping the corner by a few pixels), this system
 * smoothly applies a tangential alignment nudge so the player effortlessly slips
 * into the passage instead of coming to a frustrating, abrupt halt.
 */
export function applyCornerAssistance(
  posX: number,
  posY: number,
  inX: number,
  inY: number,
  radius: number,
  dt: number,
  map: TileState[][]
): { x: number; y: number } {
  let adjustedX = posX;
  let adjustedY = posY;
  const ASSIST_SPEED = 4.8; // tiles per second alignment speed
  const MAX_ALIGNMENT_OFFSET = 0.38; // maximum tolerance in tile units

  // 1. Horizontal Motion Corner Assistance (moving Left/Right)
  if (Math.abs(inX) > 0.3 && Math.abs(inY) < 0.7) {
    const dirX = Math.sign(inX);
    const forwardX = adjustedX + dirX * (radius + 0.12);
    const checkTx = Math.floor(forwardX + 0.5);
    const currTy = Math.floor(adjustedY + 0.5);

    const isAheadBlocked = isSolidTile(map, checkTx, currTy);
    const canPassUp = !isSolidTile(map, checkTx, currTy - 1) && !isSolidTile(map, Math.floor(adjustedX + 0.5), currTy - 1);
    const canPassDown = !isSolidTile(map, checkTx, currTy + 1) && !isSolidTile(map, Math.floor(adjustedX + 0.5), currTy + 1);

    if (isAheadBlocked) {
      // Direct obstruction ahead: check if adjacent row is open
      if (canPassUp && !canPassDown) {
        const targetY = currTy - 1;
        const diff = adjustedY - targetY;
        if (diff > 0 && diff <= MAX_ALIGNMENT_OFFSET + 0.5) {
          adjustedY -= Math.min(diff, ASSIST_SPEED * dt);
        }
      } else if (canPassDown && !canPassUp) {
        const targetY = currTy + 1;
        const diff = targetY - adjustedY;
        if (diff > 0 && diff <= MAX_ALIGNMENT_OFFSET + 0.5) {
          adjustedY += Math.min(diff, ASSIST_SPEED * dt);
        }
      }
    } else {
      // Forward path in current row is open; check if grazing a corner above or below
      const targetCenterY = currTy;
      const offset = adjustedY - targetCenterY;
      if (Math.abs(offset) > 0.08 && Math.abs(offset) <= MAX_ALIGNMENT_OFFSET) {
        // If grazing lower corner
        if (offset > 0 && isSolidTile(map, checkTx, currTy + 1)) {
          adjustedY -= Math.min(offset, ASSIST_SPEED * dt);
        }
        // If grazing upper corner
        else if (offset < 0 && isSolidTile(map, checkTx, currTy - 1)) {
          adjustedY += Math.min(-offset, ASSIST_SPEED * dt);
        }
      }
    }
  }

  // 2. Vertical Motion Corner Assistance (moving Up/Down)
  if (Math.abs(inY) > 0.3 && Math.abs(inX) < 0.7) {
    const dirY = Math.sign(inY);
    const forwardY = adjustedY + dirY * (radius + 0.12);
    const checkTy = Math.floor(forwardY + 0.5);
    const currTx = Math.floor(adjustedX + 0.5);

    const isAheadBlocked = isSolidTile(map, currTx, checkTy);
    const canPassLeft = !isSolidTile(map, currTx - 1, checkTy) && !isSolidTile(map, currTx - 1, Math.floor(adjustedY + 0.5));
    const canPassRight = !isSolidTile(map, currTx + 1, checkTy) && !isSolidTile(map, currTx + 1, Math.floor(adjustedY + 0.5));

    if (isAheadBlocked) {
      if (canPassLeft && !canPassRight) {
        const targetX = currTx - 1;
        const diff = adjustedX - targetX;
        if (diff > 0 && diff <= MAX_ALIGNMENT_OFFSET + 0.5) {
          adjustedX -= Math.min(diff, ASSIST_SPEED * dt);
        }
      } else if (canPassRight && !canPassLeft) {
        const targetX = currTx + 1;
        const diff = targetX - adjustedX;
        if (diff > 0 && diff <= MAX_ALIGNMENT_OFFSET + 0.5) {
          adjustedX += Math.min(diff, ASSIST_SPEED * dt);
        }
      }
    } else {
      const targetCenterX = currTx;
      const offset = adjustedX - targetCenterX;
      if (Math.abs(offset) > 0.08 && Math.abs(offset) <= MAX_ALIGNMENT_OFFSET) {
        if (offset > 0 && isSolidTile(map, currTx + 1, checkTy)) {
          adjustedX -= Math.min(offset, ASSIST_SPEED * dt);
        } else if (offset < 0 && isSolidTile(map, currTx - 1, checkTy)) {
          adjustedX += Math.min(-offset, ASSIST_SPEED * dt);
        }
      }
    }
  }

  return { x: adjustedX, y: adjustedY };
}
