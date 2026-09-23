// ═══════════════════════════════════════════════════════════════
//  Trait Definitions — Single source of truth for all colors/shapes
// ═══════════════════════════════════════════════════════════════

// ── Color Definitions ───────────────────────────────────────────

export type SlimeColor =
  // Tier 1 — Primary (starting pool, RYB)
  | 'Red' | 'Yellow' | 'Blue'
  // Tier 2 — Secondary (breed two different primaries)
  | 'Orange' | 'Green' | 'Purple'
  // Tier 3 — Tertiary (breed primary + secondary)
  | 'Amber' | 'Crimson' | 'Gold' | 'Lime' | 'Indigo' | 'Teal'
  // Tier 4 — Exotic (breed two different secondaries)
  | 'Rust' | 'Olive' | 'Slate'

export interface ColorDef {
  tier: number
  designation: string          // Corporate UI label
  chipBg: string               // Hex background for chips
  chipText: string             // Hex text color for chips
  gradient: {
    light: string              // SVG gradient highlight
    dark: string               // SVG gradient shadow
    glow: string               // Drop-shadow glow
    pupil: string              // Eye pupil tint
  }
}

export const COLOR_DEFS: Record<SlimeColor, ColorDef> = {
  // ── Tier 1: Primary ─────────────────────────────
  Red: {
    tier: 1,
    designation: 'CHROMATIC_RED',
    chipBg: '#93000a', chipText: '#ffdad6',
    gradient: { light: '#ff9090', dark: '#3c0700', glow: 'rgba(255,65,54,0.4)', pupil: '#1a0505' },
  },
  Yellow: {
    tier: 1,
    designation: 'CHROMATIC_YLW',
    chipBg: '#594400', chipText: '#fff0c0',
    gradient: { light: '#fff490', dark: '#3c3200', glow: 'rgba(255,230,0,0.4)', pupil: '#1a1805' },
  },
  Blue: {
    tier: 1,
    designation: 'CHROMATIC_BLU',
    chipBg: '#00616d', chipText: '#bdf4ff',
    gradient: { light: '#9ef0ff', dark: '#001f24', glow: 'rgba(0,227,253,0.4)', pupil: '#070e14' },
  },

  // ── Tier 2: Secondary ───────────────────────────
  Orange: {
    tier: 2,
    designation: 'CHROMATIC_ORG',
    chipBg: '#6b2e00', chipText: '#ffdbc8',
    gradient: { light: '#ffb870', dark: '#3c1e00', glow: 'rgba(255,150,0,0.4)', pupil: '#1a0f05' },
  },
  Green: {
    tier: 2,
    designation: 'CHROMATIC_GRN',
    chipBg: '#007117', chipText: '#ebffe2',
    gradient: { light: '#a0ffa0', dark: '#003907', glow: 'rgba(0,255,65,0.4)', pupil: '#071a07' },
  },
  Purple: {
    tier: 2,
    designation: 'CHROMATIC_PUR',
    chipBg: '#4a0080', chipText: '#e8d0ff',
    gradient: { light: '#d090ff', dark: '#1e003c', glow: 'rgba(180,0,255,0.4)', pupil: '#0f051a' },
  },

  // ── Tier 3: Tertiary ────────────────────────────
  Amber: {
    tier: 3,
    designation: 'CHROMATIC_AMB',
    chipBg: '#5c3d00', chipText: '#ffe0a0',
    gradient: { light: '#ffd070', dark: '#3c2800', glow: 'rgba(255,190,0,0.4)', pupil: '#1a1405' },
  },
  Crimson: {
    tier: 3,
    designation: 'CHROMATIC_CRM',
    chipBg: '#7a0020', chipText: '#ffd0d8',
    gradient: { light: '#ff6080', dark: '#3c000f', glow: 'rgba(255,30,60,0.4)', pupil: '#1a0508' },
  },
  Gold: {
    tier: 3,
    designation: 'CHROMATIC_GLD',
    chipBg: '#5c4d00', chipText: '#fff8a0',
    gradient: { light: '#fff0a0', dark: '#3c3500', glow: 'rgba(255,220,50,0.4)', pupil: '#1a1705' },
  },
  Lime: {
    tier: 3,
    designation: 'CHROMATIC_LME',
    chipBg: '#2a5c00', chipText: '#d8ffa0',
    gradient: { light: '#c0ff60', dark: '#1a3c00', glow: 'rgba(150,255,0,0.4)', pupil: '#0f1a05' },
  },
  Indigo: {
    tier: 3,
    designation: 'CHROMATIC_IND',
    chipBg: '#1a0070', chipText: '#c8c0ff',
    gradient: { light: '#8080ff', dark: '#0a003c', glow: 'rgba(60,0,255,0.4)', pupil: '#08051a' },
  },
  Teal: {
    tier: 3,
    designation: 'CHROMATIC_TEL',
    chipBg: '#005c3a', chipText: '#a0ffe0',
    gradient: { light: '#80ffe0', dark: '#003c2a', glow: 'rgba(0,255,180,0.4)', pupil: '#051a12' },
  },

  // ── Tier 4: Exotic ──────────────────────────────
  Rust: {
    tier: 4,
    designation: 'CHROMATIC_RST',
    chipBg: '#5c2000', chipText: '#ffc8a0',
    gradient: { light: '#d08060', dark: '#3c1500', glow: 'rgba(200,100,50,0.4)', pupil: '#1a0a05' },
  },
  Olive: {
    tier: 4,
    designation: 'CHROMATIC_OLV',
    chipBg: '#3a4a00', chipText: '#d8e0a0',
    gradient: { light: '#b0c060', dark: '#2a3c00', glow: 'rgba(150,170,50,0.4)', pupil: '#121a05' },
  },
  Slate: {
    tier: 4,
    designation: 'CHROMATIC_SLT',
    chipBg: '#1a2838', chipText: '#b0c0d0',
    gradient: { light: '#8090a0', dark: '#0a1020', glow: 'rgba(100,130,160,0.4)', pupil: '#080c14' },
  },
}

// ── Shape Definitions ───────────────────────────────────────────

export type SlimeShape =
  // Tier 1 — Basic geometry
  | 'Circle' | 'Square' | 'Triangle'
  // Tier 2 — Hybrid geometry
  | 'Star' | 'Diamond' | 'Teardrop'
  // Tier 3 — Complex geometry
  | 'Pentagon' | 'Crescent' | 'Hexa'
  // Tier 4 — Exotic geometry
  | 'Crown' | 'Crystal'

export interface ShapeDef {
  tier: number
  designation: string
  svgPath: string
  /** Highlight ellipse position */
  highlight: { cx: number; cy: number }
  /** Radial gradient focal point */
  gradFocal: { cy: string; r: string }
  /** Eye and mouth geometry */
  face: FaceConfig
  /** Optional shape-specific decorations */
  extras?: 'core' | 'drip'
}

export interface EyeConfig {
  cx: number; cy: number
  rx: number; ry: number
  px: number; py: number
  pr: number
  gx: number; gy: number
}

export interface FaceConfig {
  left: EyeConfig
  right: EyeConfig
  mouth: string
}

// ── SVG Path Helpers ────────────────────────────────────────────

/** Generate a regular polygon path with organic bulge using quadratic bezier curves */
function organicPolygon(
  sides: number,
  cx: number, cy: number, r: number,
  rotDeg = -90,
  bulge = 0.12,
): string {
  const rotRad = (rotDeg * Math.PI) / 180
  const pts = Array.from({ length: sides }, (_, i) => {
    const a = (2 * Math.PI * i) / sides + rotRad
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
  })
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 0; i < sides; i++) {
    const cur = pts[i]
    const nxt = pts[(i + 1) % sides]
    const mx = (cur.x + nxt.x) / 2
    const my = (cur.y + nxt.y) / 2
    const dx = mx - cx, dy = my - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    const bx = mx + (dx / dist) * r * bulge
    const by = my + (dy / dist) * r * bulge
    d += ` Q${bx.toFixed(1)},${by.toFixed(1)} ${nxt.x.toFixed(1)},${nxt.y.toFixed(1)}`
  }
  return d + 'Z'
}

/** Generate a star polygon (2n points, alternating outer/inner radii) */
function starPolygon(
  points: number,
  cx: number, cy: number,
  outerR: number, innerR: number,
  rotDeg = -90,
): string {
  const rotRad = (rotDeg * Math.PI) / 180
  const total = points * 2
  const pts = Array.from({ length: total }, (_, i) => {
    const a = (2 * Math.PI * i) / total + rotRad
    const r = i % 2 === 0 ? outerR : innerR
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
  })
  return `M${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')}Z`
}

// ── Shape Registry ──────────────────────────────────────────────

function stdFace(yCenterFrac: number, spread = 13, eyeRx = 7, eyeRy = 9): FaceConfig {
  const cy = yCenterFrac * 100
  const lx = 50 - spread, rx = 50 + spread
  return {
    left:  { cx: lx, cy, rx: eyeRx, ry: eyeRy, px: lx + 2, py: cy + 3, pr: eyeRx * 0.7, gx: lx + 4, gy: cy - 2 },
    right: { cx: rx, cy, rx: eyeRx, ry: eyeRy, px: rx - 2, py: cy + 3, pr: eyeRx * 0.7, gx: rx,     gy: cy - 2 },
    mouth: `M${lx - 4},${cy + 16} Q50,${cy + 28} ${rx + 4},${cy + 16}`,
  }
}

export const SHAPE_DEFS: Record<SlimeShape, ShapeDef> = {
  // ── Tier 1: Basic ───────────────────────────────
  Circle: {
    tier: 1,
    designation: 'MORPHO_CIRCLE',
    svgPath: 'M50,12 C72,12 90,30 90,52 C90,74 72,90 50,90 C28,90 10,74 10,52 C10,30 28,12 50,12Z',
    highlight: { cx: 38, cy: 32 },
    gradFocal: { cy: '33%', r: '65%' },
    face: stdFace(0.52),
  },
  Square: {
    tier: 1,
    designation: 'MORPHO_SQUARE',
    svgPath: 'M22,18 Q50,12 78,18 Q86,44 86,54 Q86,70 78,82 Q50,88 22,82 Q14,70 14,54 Q14,44 22,18Z',
    highlight: { cx: 36, cy: 30 },
    gradFocal: { cy: '30%', r: '65%' },
    face: stdFace(0.50, 14, 7, 8),
  },
  Triangle: {
    tier: 1,
    designation: 'MORPHO_TRIANGLE',
    svgPath: 'M50,8 Q58,8 88,78 Q86,86 78,88 Q50,92 22,88 Q14,86 12,78 Q42,8 50,8Z',
    highlight: { cx: 40, cy: 35 },
    gradFocal: { cy: '35%', r: '60%' },
    face: {
      left:  { cx: 38, cy: 55, rx: 7, ry: 8, px: 40, py: 57, pr: 4.5, gx: 42, gy: 53 },
      right: { cx: 62, cy: 55, rx: 7, ry: 8, px: 60, py: 57, pr: 4.5, gx: 64, gy: 53 },
      mouth: 'M35,68 Q50,78 65,68',
    },
  },

  // ── Tier 2: Hybrid ──────────────────────────────
  Star: {
    tier: 2,
    designation: 'MORPHO_STAR',
    svgPath: starPolygon(5, 50, 50, 42, 22),
    highlight: { cx: 40, cy: 32 },
    gradFocal: { cy: '33%', r: '60%' },
    face: stdFace(0.50, 10, 6, 7),
    extras: 'core',
  },
  Diamond: {
    tier: 2,
    designation: 'MORPHO_DIAMOND',
    svgPath: 'M50,6 Q60,6 92,46 Q92,54 88,58 Q60,94 50,94 Q40,94 12,58 Q8,54 8,46 Q40,6 50,6Z',
    highlight: { cx: 40, cy: 28 },
    gradFocal: { cy: '28%', r: '60%' },
    face: stdFace(0.46, 12, 7, 9),
  },
  Teardrop: {
    tier: 2,
    designation: 'MORPHO_TEARDROP',
    svgPath: 'M50,8 C65,8 80,22 80,45 C80,65 68,82 55,90 C52,92 48,92 45,90 C32,82 20,65 20,45 C20,22 35,8 50,8Z',
    highlight: { cx: 39, cy: 27 },
    gradFocal: { cy: '28%', r: '60%' },
    face: stdFace(0.44, 12, 7, 9),
    extras: 'drip',
  },

  // ── Tier 3: Complex ─────────────────────────────
  Pentagon: {
    tier: 3,
    designation: 'MORPHO_PENTA',
    svgPath: organicPolygon(5, 50, 52, 40),
    highlight: { cx: 38, cy: 30 },
    gradFocal: { cy: '30%', r: '65%' },
    face: stdFace(0.50, 12, 7, 8),
  },
  Crescent: {
    tier: 3,
    designation: 'MORPHO_CRESCENT',
    // Thick crescent moon facing right
    svgPath: 'M60,8 C85,20 92,45 85,72 C78,90 55,95 38,88 C50,82 58,65 58,50 C58,35 52,20 40,14 C46,8 54,6 60,8Z',
    highlight: { cx: 58, cy: 30 },
    gradFocal: { cy: '30%', r: '55%' },
    face: {
      left:  { cx: 54, cy: 46, rx: 6, ry: 7, px: 56, py: 48, pr: 4, gx: 57, gy: 44 },
      right: { cx: 72, cy: 46, rx: 6, ry: 7, px: 70, py: 48, pr: 4, gx: 73, gy: 44 },
      mouth: 'M52,58 Q63,66 74,58',
    },
  },
  Hexa: {
    tier: 3,
    designation: 'MORPHO_HEXA',
    svgPath: organicPolygon(6, 50, 50, 40, 0, 0.10),
    highlight: { cx: 38, cy: 30 },
    gradFocal: { cy: '30%', r: '65%' },
    face: stdFace(0.48, 13, 7, 8),
  },

  // ── Tier 4: Exotic ──────────────────────────────
  Crown: {
    tier: 4,
    designation: 'MORPHO_CROWN',
    svgPath: 'M15,85 L15,50 L28,62 L40,30 L50,55 L60,30 L72,62 L85,50 L85,85 Q50,92 15,85Z',
    highlight: { cx: 38, cy: 42 },
    gradFocal: { cy: '40%', r: '55%' },
    face: {
      left:  { cx: 36, cy: 64, rx: 7, ry: 7, px: 38, py: 66, pr: 4.5, gx: 40, gy: 62 },
      right: { cx: 64, cy: 64, rx: 7, ry: 7, px: 62, py: 66, pr: 4.5, gx: 66, gy: 62 },
      mouth: 'M32,76 Q50,84 68,76',
    },
  },
  Crystal: {
    tier: 4,
    designation: 'MORPHO_CRYSTAL',
    // Tall elongated hexagonal crystal
    svgPath: 'M50,4 L70,20 L70,65 L50,96 L30,65 L30,20Z',
    highlight: { cx: 40, cy: 22 },
    gradFocal: { cy: '25%', r: '55%' },
    face: stdFace(0.42, 10, 6, 8),
  },
}

// ── Convenience Lookups ─────────────────────────────────────────

export function getColorTier(c: SlimeColor): number { return COLOR_DEFS[c].tier }
export function getShapeTier(s: SlimeShape): number { return SHAPE_DEFS[s].tier }

export const ALL_COLORS: SlimeColor[] = Object.keys(COLOR_DEFS) as SlimeColor[]
export const ALL_SHAPES: SlimeShape[] = Object.keys(SHAPE_DEFS) as SlimeShape[]
export const STARTING_COLORS: SlimeColor[] = ALL_COLORS.filter((c) => COLOR_DEFS[c].tier === 1)
export const STARTING_SHAPES: SlimeShape[] = ALL_SHAPES.filter((s) => SHAPE_DEFS[s].tier === 1)
