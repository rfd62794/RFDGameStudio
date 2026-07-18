import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateSlimePolygonPoints, hashStringToSeed } from '../src/games/slimeworld/components/SlimeVisual';

const slimeVisualSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/components/SlimeVisual.tsx'),
  'utf8'
);

// SEED_SHAPE_DEFAULTS from data.yaml — real values
const SEED_SHAPE_DEFAULTS: Record<string, { vertex_count: number; irregularity: number }> = {
  Red: { vertex_count: 3, irregularity: 10 },
  Orange: { vertex_count: 3, irregularity: 15 },
  Yellow: { vertex_count: 6, irregularity: 10 },
  Green: { vertex_count: 5, irregularity: 20 },
  Purple: { vertex_count: 4, irregularity: 12 },
  Blue: { vertex_count: 8, irregularity: 8 },
  Gray: { vertex_count: 4, irregularity: 10 },
};

function parsePoints(pointsStr: string): Array<{ x: number; y: number }> {
  return pointsStr.split(' ').map(pair => {
    const [x, y] = pair.split(',').map(Number);
    return { x, y };
  });
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

describe('Slime Visual Geometry — Real Polygon Rendering', () => {

  it('test_zero_irregularity_produces_regular_polygon', () => {
    const vertexCount = 6;
    const seed = 12345;
    const center = 50;
    const radius = 40;

    const pointsStr = generateSlimePolygonPoints(vertexCount, 0, seed, radius, center);
    const pts = parsePoints(pointsStr);

    expect(pts.length).toBe(vertexCount);

    // All vertices must be exactly at `radius` distance from center
    for (const p of pts) {
      const d = distance(p, { x: center, y: center });
      expect(d).toBeCloseTo(radius, 6);
    }

    // All angular steps must be exactly equal
    const angleStep = (2 * Math.PI) / vertexCount;
    for (let i = 0; i < vertexCount; i++) {
      const angle = Math.atan2(pts[i].y - center, pts[i].x - center);
      const expectedAngle = i * angleStep;
      // Normalize angle difference to [-PI, PI]
      let diff = angle - expectedAngle;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      expect(diff).toBeCloseTo(0, 6);
    }
  });

  it('test_higher_irregularity_produces_more_vertex_deviation', () => {
    const vertexCount = 8;
    const seed = 42;
    const center = 50;
    const radius = 40;
    const angleStep = (2 * Math.PI) / vertexCount;

    // Compute average deviation from regular polygon at several irregularity levels
    function avgDeviation(irregularity: number): number {
      const pointsStr = generateSlimePolygonPoints(vertexCount, irregularity, seed, radius, center);
      const pts = parsePoints(pointsStr);
      let totalDev = 0;
      for (let i = 0; i < vertexCount; i++) {
        const expectedAngle = i * angleStep;
        const expectedX = center + radius * Math.cos(expectedAngle);
        const expectedY = center + radius * Math.sin(expectedAngle);
        totalDev += distance(pts[i], { x: expectedX, y: expectedY });
      }
      return totalDev / vertexCount;
    }

    const dev0 = avgDeviation(0);
    const dev25 = avgDeviation(25);
    const dev50 = avgDeviation(50);
    const dev100 = avgDeviation(100);

    // Deviation at 0 must be exactly 0 (perfect regular polygon)
    expect(dev0).toBeCloseTo(0, 6);

    // Monotonic increase: higher irregularity → more deviation
    expect(dev25).toBeGreaterThan(dev0);
    expect(dev50).toBeGreaterThan(dev25);
    expect(dev100).toBeGreaterThan(dev50);
  });

  it('test_same_slime_id_produces_identical_polygon_across_calls', () => {
    const vertexCount = 5;
    const irregularity = 30;
    const seed = hashStringToSeed('slime_abc_123');

    const result1 = generateSlimePolygonPoints(vertexCount, irregularity, seed);
    const result2 = generateSlimePolygonPoints(vertexCount, irregularity, seed);
    const result3 = generateSlimePolygonPoints(vertexCount, irregularity, seed);

    expect(result1).toBe(result2);
    expect(result2).toBe(result3);
  });

  it('test_different_vertex_counts_produce_different_point_counts', () => {
    const seed = 99;
    const irregularity = 20;

    const points3 = generateSlimePolygonPoints(3, irregularity, seed);
    const points12 = generateSlimePolygonPoints(12, irregularity, seed);
    const points22 = generateSlimePolygonPoints(22, irregularity, seed);

    expect(points3.split(' ').length).toBe(3);
    expect(points12.split(' ').length).toBe(12);
    expect(points22.split(' ').length).toBe(22);
  });

  it('test_red_and_yellow_starter_slimes_render_visually_distinct_shapes', () => {
    // Real SEED_SHAPE_DEFAULTS: Red=3 vertices, Yellow=6 vertices
    const redShape = SEED_SHAPE_DEFAULTS['Red'];
    const yellowShape = SEED_SHAPE_DEFAULTS['Yellow'];

    expect(redShape.vertex_count).toBe(3);
    expect(yellowShape.vertex_count).toBe(6);

    const redSeed = hashStringToSeed('starter_red_001');
    const yellowSeed = hashStringToSeed('starter_yellow_001');

    const redPoints = generateSlimePolygonPoints(
      redShape.vertex_count, redShape.irregularity, redSeed
    );
    const yellowPoints = generateSlimePolygonPoints(
      yellowShape.vertex_count, yellowShape.irregularity, yellowSeed
    );

    const redVertexCount = redPoints.split(' ').length;
    const yellowVertexCount = yellowPoints.split(' ').length;

    expect(redVertexCount).toBe(3);
    expect(yellowVertexCount).toBe(6);
    expect(redVertexCount).not.toBe(yellowVertexCount);

    // The actual point strings must be different — genuinely distinct shapes
    expect(redPoints).not.toBe(yellowPoints);
  });

  it('test_pattern_overlay_still_applies_to_new_polygon_shape', () => {
    // Source-level regression check: the new SVG polygon rendering
    // must still include pattern definitions and pattern fill overlays
    expect(slimeVisualSource).toContain('renderSvgPattern');
    expect(slimeVisualSource).toContain('patternFill');
    expect(slimeVisualSource).toContain('url(#');
    expect(slimeVisualSource).toContain('<polygon');
    expect(slimeVisualSource).toContain('points={polygonPoints}');

    // Existing patterns must still be present
    expect(slimeVisualSource).toContain('Stripe');
    expect(slimeVisualSource).toContain('Polka');
    expect(slimeVisualSource).toContain('Glow');
    expect(slimeVisualSource).toContain('Nebula');
    expect(slimeVisualSource).toContain('Crown');
    expect(slimeVisualSource).toContain('Ringed');
    expect(slimeVisualSource).toContain('Obsidian');

    // The face/nucleus overlay must still exist
    expect(slimeVisualSource).toContain('Core Nucleus');
    expect(slimeVisualSource).toContain('Adorable Face');
  });
});
