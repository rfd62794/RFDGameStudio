/**
 * Generic seam for procedural art generation.
 *
 * Per ADR-005, this is a named pattern, not a shared binary. Each game
 * provides its own ArtGenConfig that maps its own entities to colors,
 * shapes, and tiers. The module itself never contains vocabulary tied to
 * any particular game.
 */

/** A single color or a primary/secondary pair. */
export type ColorSource = string | { primary: string; secondary?: string };

/** Border styles abstracted from Dissonance's relationType mapping. */
export type BorderStyle = 'solid' | 'thick' | 'glow' | 'dashed';

/** Generic tier tags. Callers may extend this union with their own strings. */
export type TierId = 'basic' | 'advanced' | 'elite' | 'master' | (string & {});

/**
 * Generic shape tags. The library supports the ones listed here; unknown
 * strings fall back to a safe default.
 */
export type ShapeId =
  | 'blade'
  | 'cross'
  | 'shield'
  | 'spiral'
  | 'coin'
  | 'heart'
  | 'eye'
  | 'gear'
  | 'dice'
  | 'link'
  | 'starburst'
  | (string & {});

/**
 * Per-game configuration object. The generator asks these questions when
 * rendering an entity; the answers are entirely game-specific.
 */
export interface ArtGenConfig<TEntity> {
  colorFor: (entity: TEntity) => ColorSource;
  shapeFor: (entity: TEntity) => ShapeId;
  tierFor?: (entity: TEntity) => TierId;
}

/** Specification for rendering a rectangular border. */
export interface BorderSpec {
  width: number;
  height: number;
  color: string;
  style: BorderStyle;
  id?: string;
  rx?: number;
}

/** Specification for a two-color or single-color gradient background. */
export interface GradientBackgroundSpec {
  width: number;
  height: number;
  gradientId: string;
  color: ColorSource;
  surface: string;
}

/** Specification for rendering an icon shape. */
export interface ShapeRenderSpec {
  shape: ShapeId;
  color: string;
  cx?: number;
  cy?: number;
  scale?: number;
}

/** Specification for generating a polygon point cloud. */
export interface PolygonSpec {
  vertexCount: number;
  irregularity: number;
  seed: number;
  radius?: number;
  center?: number;
}

/** Specification for a spiky star / enemy silhouette. */
export interface SpikyStarSpec {
  radius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  center?: number;
  points?: number;
}

/** Specification for a teardrop/fin silhouette (fish/shark body family). */
export interface TeardropFinSpec {
  scale: number;       // base scale multiplier (1 = standard fish)
  angularity: number;  // 0-100, higher = more angular/shark-like
  dorsalFin: boolean;  // add a dorsal fin (shark)
  seed?: number;       // for deterministic jitter
}

/** Specification for a radial burst shape (algae/debris). */
export interface RadialBurstSpec {
  armCount: number;    // number of arms/spokes
  radius: number;      // outer radius
  innerRadius?: number; // inner radius (default radius * 0.3)
  fill: string;
  stroke: string;
  strokeWidth?: number;
  center?: number;
  seed?: number;       // for deterministic arm-length jitter
}

/** Specification for an irregular fragment (debris/flesh-chunk). */
export interface IrregularFragmentSpec {
  seed: number;
  vertexCount?: number;  // default 7
  irregularity?: number; // default 60
  radius?: number;
  center?: number;
  fill: string;
  stroke: string;
  strokeWidth?: number;
}

/**
 * Specification for a sigmoid muscle bulge shape (limb with organic bulge).
 *
 * Ported from ChimeraLab's body_renderer.py::get_sigmoid_polygon.
 * Generates a polygon for a limb with a sine-based "muscle bulge"
 * peaking at t=0.5 (40% of base width). The shape is drawn from
 * start to end along the bone axis, with left and right edge points
 * offset by the perpendicular vector.
 */
export interface SigmoidBulgeSpec {
  widthStart: number;    // width at the start (proximal joint)
  widthEnd: number;      // width at the end (distal joint)
  segments?: number;     // default 6 — number of segments along the length
  bulgeFactor?: number;  // default 0.4 — fraction of base width for bulge peak
  fill: string;
  stroke: string;
  strokeWidth?: number;
}

/**
 * Specification for a true ellipse shape.
 *
 * Generates a smooth <ellipse> SVG element — not a polygon approximation.
 * Used for heads, joints, and other shapes that need to read as round,
 * not faceted. The ellipse is centered at (cx, cy) with radii rx and ry.
 */
export interface EllipseSpec {
  cx: number;       // center x
  cy: number;       // center y
  rx: number;       // horizontal radius
  ry: number;       // vertical radius
  fill: string;
  stroke: string;
  strokeWidth?: number;
}
