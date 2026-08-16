// MBB Steering forces — seek, arrive, flee, interpose.
// Extracted from mbbSimulation.ts as part of module decomposition.
//
// Adapted from Shoal's real production pattern (forceSeek/forceArrive/
// forceFlee), with MBB-specific additions (forceInterpose for escort
// blocking — not present in Shoal's fish/shark set).
//
// All function bodies are byte-identical to the original monolith.

export function forceSeek(x: number, y: number, tx: number, ty: number, weight: number, maxForce: number): [number, number] {
  const dx = tx - x, dy = ty - y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return [0, 0];
  return [(dx / dist) * weight * maxForce, (dy / dist) * weight * maxForce];
}

export function forceArrive(x: number, y: number, vx: number, vy: number, tx: number, ty: number, weight: number, maxSpeed: number, _maxForce: number, slowingRadius: number, minSpeed: number): [number, number] {
  const dx = tx - x, dy = ty - y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return [0, 0];
  let desiredSpeed = maxSpeed;
  if (dist < slowingRadius) {
    desiredSpeed = maxSpeed * (dist / slowingRadius);
    if (desiredSpeed < minSpeed) desiredSpeed = minSpeed;
  }
  return [((dx / dist) * desiredSpeed - vx) * weight, ((dy / dist) * desiredSpeed - vy) * weight];
}

export function forceFlee(x: number, y: number, tx: number, ty: number, weight: number, maxForce: number, radiusSq: number): [number, number] {
  const dx = x - tx, dy = y - ty;
  const d2 = dx * dx + dy * dy;
  if (d2 === 0 || d2 > radiusSq) return [0, 0];
  const dist = Math.sqrt(d2);
  // Stronger repulsion as the threat gets closer (inverse-distance scaling)
  const intensity = 1 - (dist / Math.sqrt(radiusSq));
  return [(dx / dist) * weight * maxForce * intensity, (dy / dist) * weight * maxForce * intensity];
}

// Interpose: seek to the midpoint between two agents. This is the escort's
// blocking behavior — get between the carrier and the nearest tackler to
// intercept. NOT present in Shoal's fish/shark steering set.
export function forceInterpose(x: number, y: number, vx: number, vy: number, ax: number, ay: number, bx: number, by: number, weight: number, maxSpeed: number, maxForce: number, slowingRadius: number): [number, number] {
  const mx = (ax + bx) / 2, my = (ay + by) / 2;
  return forceArrive(x, y, vx, vy, mx, my, weight, maxSpeed, maxForce, slowingRadius, 0);
}
