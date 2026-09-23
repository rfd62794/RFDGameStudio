/**
 * Bezier Blob Generator — Isolated POC
 *
 * Generates a closed organic silhouette using real cubic Bézier path
 * commands (SVG `C` commands), not polygon point lists.
 *
 * Technique: Catmull-Rom spline → cubic Bézier conversion.
 *   1. Place N anchor points around a circle with seed-driven radius jitter
 *   2. For each pair of adjacent anchors, compute two control points using
 *      the Catmull-Rom-to-Bézier formula:
 *        cp1 = anchor[i] + (anchor[i+1] - anchor[i-1]) * tension
 *        cp2 = anchor[i+1] - (anchor[i+2] - anchor[i]) * tension
 *   3. Emit `M anchor[0] C cp1 cp2 anchor[1] C cp1 cp2 anchor[2] ... Z`
 *
 * The `tension` parameter controls smoothness:
 *   - 0.0 = sharp corners (control points on the anchors)
 *   - 0.1667 = standard Catmull-Rom (smooth, organic)
 *   - 0.5 = very loose/round
 *
 * This is a standalone POC — not wired into artGen, composer, or any
 * existing consumer. It exists to answer one question: do genuine
 * Bézier curves look organic enough to pursue as a real primitive?
 */

// ── Seeded RNG (same algorithm as artGen's mulberry32) ──
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BezierBlobSpec {
  seed: number;          // deterministic seed for anchor jitter
  anchorCount: number;   // number of anchor points (e.g. 8-12)
  baseRadius: number;    // base circle radius
  jitterAmount: number;  // 0-1, how much radius varies per anchor
  tension: number;       // 0-0.5, smoothness (0.1667 = standard Catmull-Rom)
  cx?: number;           // center x (default 0)
  cy?: number;           // center y (default 0)
  fill?: string;         // fill color
  stroke?: string;       // stroke color
  strokeWidth?: number;  // stroke width
}

export interface BezierBlobResult {
  pathData: string;      // the `d` attribute for an SVG <path>
  svg: string;           // complete <path> element
  anchorPoints: Array<[number, number]>;  // for testing/inspection
  controlPoints: Array<[number, number, number, number]>;  // cp1x, cp1y, cp2x, cp2y per segment
  commandTypes: string[];  // list of command letters used (e.g. ['M', 'C', 'C', ..., 'Z'])
}

export function generateBezierBlob(spec: BezierBlobSpec): BezierBlobResult {
  const {
    seed,
    anchorCount,
    baseRadius,
    jitterAmount,
    tension,
    cx = 0,
    cy = 0,
    fill = '#3b82f6',
    stroke = '#1e40af',
    strokeWidth = 2,
  } = spec;

  const rng = mulberry32(seed);

  // ── Step 1: Generate anchor points around a circle with jitter ──
  const anchors: Array<[number, number]> = [];
  for (let i = 0; i < anchorCount; i++) {
    const angle = (i / anchorCount) * 2 * Math.PI;
    // Radius jitter: each anchor gets a deterministic variation
    const radiusJitter = 1 + (rng() - 0.5) * 2 * jitterAmount;
    const r = baseRadius * radiusJitter;
    anchors.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }

  // ── Step 2: Compute Catmull-Rom → cubic Bézier control points ──
  // For a closed loop, indices wrap around.
  const controlPoints: Array<[number, number, number, number]> = [];
  const getAnchor = (i: number): [number, number] => {
    return anchors[((i % anchorCount) + anchorCount) % anchorCount];
  };

  for (let i = 0; i < anchorCount; i++) {
    const p0 = getAnchor(i - 1);       // previous anchor
    const p1 = getAnchor(i);           // current anchor (segment start)
    const p2 = getAnchor(i + 1);       // next anchor (segment end)
    const p3 = getAnchor(i + 2);       // anchor after next

    // Catmull-Rom to Bézier conversion:
    // cp1 = p1 + (p2 - p0) * tension
    // cp2 = p2 - (p3 - p1) * tension
    const cp1x = p1[0] + (p2[0] - p0[0]) * tension;
    const cp1y = p1[1] + (p2[1] - p0[1]) * tension;
    const cp2x = p2[0] - (p3[0] - p1[0]) * tension;
    const cp2y = p2[1] - (p3[1] - p1[1]) * tension;

    controlPoints.push([cp1x, cp1y, cp2x, cp2y]);
  }

  // ── Step 3: Build the SVG path data string ──
  const fmt = (n: number) => n.toFixed(2);
  let pathData = `M${fmt(anchors[0][0])},${fmt(anchors[0][1])}`;
  const commandTypes: string[] = ['M'];

  for (let i = 0; i < anchorCount; i++) {
    const [cp1x, cp1y, cp2x, cp2y] = controlPoints[i];
    const nextAnchor = getAnchor(i + 1);
    // Cubic Bézier command: C cp1x cp1y cp2x cp2y endx endy
    pathData += ` C${fmt(cp1x)},${fmt(cp1y)} ${fmt(cp2x)},${fmt(cp2y)} ${fmt(nextAnchor[0])},${fmt(nextAnchor[1])}`;
    commandTypes.push('C');
  }

  pathData += ' Z';
  commandTypes.push('Z');

  const svg = `<path d="${pathData}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>`;

  return {
    pathData,
    svg,
    anchorPoints: anchors,
    controlPoints,
    commandTypes,
  };
}
