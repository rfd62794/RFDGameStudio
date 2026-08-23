/**
 * Shared AI steering forces — extracted from Shoal's proven, tested
 * implementation (shoalSimulation.ts). Pure functions, no Shoal-specific
 * types baked in.
 *
 * Generalization decision: Shoal uses `depth` for the Y axis and `vd`
 * for Y-velocity. Rather than baking field names into the shared API,
 * the neighbor-based functions accept accessor callbacks that extract
 * position/velocity from whatever entity shape the caller uses. This
 * is the minimal generalization Shoal's real call sites require — it
 * avoids per-tick object allocation (critical for hot-path performance)
 * while keeping the force computation logic in one place.
 *
 * forceSeek and forceFlee take raw position numbers (no entity shapes),
 * so they need no accessors.
 *
 * Phase 1: extraction from Shoal, behavioral equivalence proven.
 * Phase 2 (deferred): investigate Slither Rogue / Mutant Battle Ball
 * adoption needs.
 */

// ── Math helpers ──────────────────────────────────────────────────────

function normalize(vx: number, vy: number): [number, number] {
  const m = Math.sqrt(vx * vx + vy * vy);
  if (m === 0) return [0, 0];
  return [vx / m, vy / m];
}

// ── Position-only forces (no entity shapes needed) ───────────────────

/**
 * Seek force: move toward a target position at max force.
 * Returns a force vector scaled by weight * maxForce.
 */
export function forceSeek(
  x: number, y: number,
  tx: number, ty: number,
  weight: number, maxForce: number,
): [number, number] {
  const dx = tx - x, dy = ty - y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return [0, 0];
  return [(dx / dist) * weight * maxForce, (dy / dist) * weight * maxForce];
}

/**
 * Flee force: move away from a threat position, only within radiusSq.
 * Returns a force vector scaled by weight * maxForce, or [0,0] if outside radius.
 */
export function forceFlee(
  x: number, y: number,
  tx: number, ty: number,
  weight: number, maxForce: number,
  radiusSq: number,
): [number, number] {
  const dx = x - tx, dy = y - ty;
  const d2 = dx * dx + dy * dy;
  if (d2 === 0 || d2 > radiusSq) return [0, 0];
  const dist = Math.sqrt(d2);
  return [(dx / dist) * weight * maxForce, (dy / dist) * weight * maxForce];
}

// ── Neighbor-based forces (accept accessor callbacks) ────────────────

/**
 * Separation force: push away from nearby neighbors.
 * Accumulates inverse-distance repulsion, normalizes, scales by weight * maxForce.
 * The accessor extracts {x, y, alive} from each neighbor entity.
 */
export function forceSeparate<T>(
  x: number, y: number,
  neighbors: T[],
  accessor: (n: T) => { x: number; y: number; alive: boolean },
  radiusSq: number,
  weight: number, maxForce: number,
): [number, number] {
  let sx = 0, sy = 0;
  for (const n of neighbors) {
    const p = accessor(n);
    if (!p.alive) continue;
    const dx = x - p.x, dy = y - p.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > 0 && d2 < radiusSq) {
      const dist = Math.sqrt(d2);
      sx += dx / dist / dist;
      sy += dy / dist / dist;
    }
  }
  if (sx === 0 && sy === 0) return [0, 0];
  const [nx, ny] = normalize(sx, sy);
  return [nx * weight * maxForce, ny * weight * maxForce];
}

/**
 * Avoid force: push away from obstacles (algae, chunks, etc).
 * Obstacles with id matching excludeId are skipped.
 * Same inverse-distance repulsion as separation.
 * The accessor extracts {x, y, id} from each obstacle entity.
 */
export function forceAvoid<T>(
  x: number, y: number,
  obstacles: T[],
  accessor: (o: T) => { x: number; y: number; id?: string },
  radiusSq: number,
  weight: number, maxForce: number,
  excludeId?: string,
): [number, number] {
  if (!obstacles) return [0, 0];
  let sx = 0, sy = 0;
  for (const o of obstacles) {
    const p = accessor(o);
    if (p.id === excludeId) continue;
    const dx = x - p.x, dy = y - p.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > 0 && d2 < radiusSq) {
      const dist = Math.sqrt(d2);
      sx += dx / dist / dist;
      sy += dy / dist / dist;
    }
  }
  if (sx === 0 && sy === 0) return [0, 0];
  const [nx, ny] = normalize(sx, sy);
  return [nx * weight * maxForce, ny * weight * maxForce];
}

/**
 * Alignment force: steer toward average velocity of nearby neighbors.
 * Averages neighbor velocities, normalizes, scales by weight * maxForce.
 * The accessor extracts {x, y, vx, vy, alive} from each neighbor entity.
 */
export function forceAlign<T>(
  x: number, y: number,
  neighbors: T[],
  accessor: (n: T) => { x: number; y: number; vx: number; vy: number; alive: boolean },
  radiusSq: number,
  weight: number, maxForce: number,
): [number, number] {
  let avx = 0, avy = 0, count = 0;
  for (const n of neighbors) {
    const p = accessor(n);
    if (!p.alive) continue;
    const dx = x - p.x, dy = y - p.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > 0 && d2 < radiusSq) {
      avx += p.vx;
      avy += p.vy;
      count++;
    }
  }
  if (count === 0) return [0, 0];
  avx /= count; avy /= count;
  const [nx, ny] = normalize(avx, avy);
  return [nx * weight * maxForce, ny * weight * maxForce];
}

/**
 * Cohesion force: steer toward the average position of nearby neighbors.
 * Computes centroid, then seeks toward it.
 * The accessor extracts {x, y, alive} from each neighbor entity.
 */
export function forceCohere<T>(
  x: number, y: number,
  neighbors: T[],
  accessor: (n: T) => { x: number; y: number; alive: boolean },
  radiusSq: number,
  weight: number, maxForce: number,
): [number, number] {
  let sx = 0, sy = 0, count = 0;
  for (const n of neighbors) {
    const p = accessor(n);
    if (!p.alive) continue;
    const dx = x - p.x, dy = y - p.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > 0 && d2 < radiusSq) {
      sx += p.x;
      sy += p.y;
      count++;
    }
  }
  if (count === 0) return [0, 0];
  return forceSeek(x, y, sx / count, sy / count, weight, maxForce);
}
