// MBB Math helpers — pure math utilities and LCG PRNG.
// Extracted from mbbSimulation.ts as part of module decomposition.
//
// All values are byte-identical to the original monolith.

export function clamp(v: number, min: number, max: number): number { return Math.max(min, Math.min(max, v)); }
export function dist2(ax: number, ay: number, bx: number, by: number): number { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }
export function distance(ax: number, ay: number, bx: number, by: number): number { return Math.sqrt(dist2(ax, ay, bx, by)); }
export function normalize(vx: number, vy: number): [number, number] { const m = Math.sqrt(vx * vx + vy * vy); if (m === 0) return [0, 0]; return [vx / m, vy / m]; }
export function limitVector(vx: number, vy: number, max: number): [number, number] { const m2 = vx * vx + vy * vy; if (m2 > max * max) { const m = Math.sqrt(m2); return [(vx / m) * max, (vy / m) * max]; } return [vx, vy]; }

// ── LCG PRNG (deterministic, matching Lua math.random semantics) ────
// Lua: math.random() → [0,1); math.random(a,b) → integer in [a,b].

const LCG_MOD = 2147483648, LCG_MULT = 1103515245, LCG_INC = 12345;
const LCG_MULT_HI = Math.floor(LCG_MULT / 65536), LCG_MULT_LO = LCG_MULT % 65536;

export function makePrng(seed: number): () => number {
  let s = seed;
  return () => { s = (((s * LCG_MULT_HI) % LCG_MOD) * 65536 + s * LCG_MULT_LO + LCG_INC) % LCG_MOD; return s / LCG_MOD; };
}
export function prngFloat(prng: () => number, a: number, b: number): number { return a + prng() * (b - a); }
export function prngInt(prng: () => number, a: number, b: number): number { return Math.floor(a + prng() * (b - a + 1)); }
