/**
 * Shared math helpers — scalar/vector utilities plus the split-multiplication
 * LCG PRNG. Extracted verbatim from mutant_battle_ball's mbbMath.ts and
 * shoal's shoalSimulation.ts, where they existed as byte-identical copies
 * (ADR-014 shared-math extraction).
 *
 * The LCG here is a separate tool from seededRandom.ts's mulberry32:
 * mulberry32 is the studio's general seeded PRNG, while this LCG
 * deliberately matches Lua math.random semantics for ports that must stay
 * byte-identical to their Lua originals (Lua: math.random() → [0,1);
 * math.random(a,b) → integer in [a,b]).
 *
 * Do not change the algorithm or the LCG constants without a compelling
 * reason and a corresponding test that proves identical behavior is
 * preserved — the output sequence for any fixed seed is locked by tests.
 */

export function clamp(v: number, min: number, max: number): number { return Math.max(min, Math.min(max, v)); }
export function dist2(ax: number, ay: number, bx: number, by: number): number { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }
export function distance(ax: number, ay: number, bx: number, by: number): number { return Math.sqrt(dist2(ax, ay, bx, by)); }
export function normalize(vx: number, vy: number): [number, number] { const m = Math.sqrt(vx * vx + vy * vy); if (m === 0) return [0, 0]; return [vx / m, vy / m]; }
export function limitVector(vx: number, vy: number, max: number): [number, number] { const m2 = vx * vx + vy * vy; if (m2 > max * max) { const m = Math.sqrt(m2); return [(vx / m) * max, (vy / m) * max]; } return [vx, vy]; }
export function lerp(a: number, b: number, t: number): number { return a + (b - a) * clamp(t, 0, 1); }

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
