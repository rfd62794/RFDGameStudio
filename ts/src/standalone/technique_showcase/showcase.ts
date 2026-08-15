/**
 * Technique Showcase — All techniques through the REAL production composer.
 *
 * Creates body plan variants for each technique, all using the same
 * humanoidBilateral bone positions but different shapeMappings.
 * Renders them side by side through the actual composeFigure() +
 * renderFigureSvg() production pipeline.
 *
 * This is NOT an isolated POC — it imports the real production code.
 */

import { renderFigureSvg, composeFigure } from '../../engine/paperDoll/index';
import type { BodyPlan, CompositionInput, PartForComposition } from '../../engine/paperDoll/types';
import { humanoidBilateral } from '../../engine/paperDoll/bodyPlans/humanoidBilateral';
import { chimeraAsymmetric } from '../../engine/paperDoll/bodyPlans/chimeraAsymmetric';

// ── Build body plan variants for each technique ──
// All use the SAME bone positions from humanoidBilateral, only
// the shapeMappings (primitive + params) change.

const bones = humanoidBilateral.nodes;
const renderOrder = humanoidBilateral.renderOrder;

// Technique 1: Stroke Skeleton (current production)
const strokePlan: BodyPlan = {
  id: 'stroke_skeleton',
  root: 'chest',
  nodes: bones,
  renderOrder,
  shapeMappings: [
    { slot: 'head', primitive: 'strokeSkeleton', baseParams: { widthProximal: 10, widthDistal: 6, jointBlendRadius: 7, jointBlendK: 4 } },
    { slot: 'chest', primitive: 'strokeSkeleton', baseParams: { widthProximal: 20, widthDistal: 14, jointBlendRadius: 12, jointBlendK: 5 } },
    { slot: 'left_arm', primitive: 'strokeSkeleton', baseParams: { widthProximal: 10, widthDistal: 5, jointBlendRadius: 6, jointBlendK: 4 } },
    { slot: 'right_arm', primitive: 'strokeSkeleton', baseParams: { widthProximal: 10, widthDistal: 5, jointBlendRadius: 6, jointBlendK: 4 } },
    { slot: 'left_leg', primitive: 'strokeSkeleton', baseParams: { widthProximal: 12, widthDistal: 6, jointBlendRadius: 7, jointBlendK: 4 } },
    { slot: 'right_leg', primitive: 'strokeSkeleton', baseParams: { widthProximal: 12, widthDistal: 6, jointBlendRadius: 7, jointBlendK: 4 } },
  ],
};

// Technique 2: Ellipse + SigmoidBulge (previous production approach)
const ellipseSigmoidPlan: BodyPlan = {
  id: 'ellipse_sigmoid',
  root: 'chest',
  nodes: bones,
  renderOrder,
  shapeMappings: [
    { slot: 'head', primitive: 'ellipse', baseParams: { rx: 7, ry: 8 } },
    { slot: 'chest', primitive: 'sigmoidBulge', baseParams: { widthStart: 18, widthEnd: 9, segments: 8, bulgeFactor: 0.3 } },
    { slot: 'left_arm', primitive: 'sigmoidBulge', baseParams: { widthStart: 15, widthEnd: 9, segments: 6, bulgeFactor: 0.4 } },
    { slot: 'right_arm', primitive: 'sigmoidBulge', baseParams: { widthStart: 15, widthEnd: 9, segments: 6, bulgeFactor: 0.4 } },
    { slot: 'left_leg', primitive: 'sigmoidBulge', baseParams: { widthStart: 11, widthEnd: 10, segments: 6, bulgeFactor: 0.35 } },
    { slot: 'right_leg', primitive: 'sigmoidBulge', baseParams: { widthStart: 11, widthEnd: 10, segments: 6, bulgeFactor: 0.35 } },
  ],
};

// Technique 3: Polygon (original approach)
const polygonPlan: BodyPlan = {
  id: 'polygon',
  root: 'chest',
  nodes: bones,
  renderOrder,
  shapeMappings: [
    { slot: 'head', primitive: 'polygon', baseParams: { vertexCount: 6, irregularity: 10, radius: 12 } },
    { slot: 'chest', primitive: 'polygon', baseParams: { vertexCount: 6, irregularity: 15, radius: 18 } },
    { slot: 'left_arm', primitive: 'polygon', baseParams: { vertexCount: 5, irregularity: 20, radius: 10 } },
    { slot: 'right_arm', primitive: 'polygon', baseParams: { vertexCount: 5, irregularity: 20, radius: 10 } },
    { slot: 'left_leg', primitive: 'polygon', baseParams: { vertexCount: 5, irregularity: 18, radius: 11 } },
    { slot: 'right_leg', primitive: 'polygon', baseParams: { vertexCount: 5, irregularity: 18, radius: 11 } },
  ],
};

// Technique 4: TeardropFin
const teardropPlan: BodyPlan = {
  id: 'teardrop',
  root: 'chest',
  nodes: bones,
  renderOrder,
  shapeMappings: [
    { slot: 'head', primitive: 'polygon', baseParams: { vertexCount: 6, irregularity: 10, radius: 12 } },
    { slot: 'chest', primitive: 'polygon', baseParams: { vertexCount: 6, irregularity: 15, radius: 18 } },
    { slot: 'left_arm', primitive: 'teardropFin', baseParams: { scale: 0.6, angularity: 30 } },
    { slot: 'right_arm', primitive: 'teardropFin', baseParams: { scale: 0.6, angularity: 30 } },
    { slot: 'left_leg', primitive: 'teardropFin', baseParams: { scale: 0.7, angularity: 25 } },
    { slot: 'right_leg', primitive: 'teardropFin', baseParams: { scale: 0.7, angularity: 25 } },
  ],
};

// Technique 5: IrregularFragment + RadialBurst (chimera approach)
const chimeraStylePlan: BodyPlan = {
  id: 'chimera_style',
  root: 'chest',
  nodes: bones,
  renderOrder,
  shapeMappings: [
    { slot: 'head', primitive: 'irregularFragment', baseParams: { vertexCount: 7, irregularity: 50, radius: 13 } },
    { slot: 'chest', primitive: 'irregularFragment', baseParams: { vertexCount: 8, irregularity: 40, radius: 20 } },
    { slot: 'left_arm', primitive: 'radialBurst', baseParams: { armCount: 4, radius: 14 } },
    { slot: 'right_arm', primitive: 'radialBurst', baseParams: { armCount: 5, radius: 16 } },
    { slot: 'left_leg', primitive: 'irregularFragment', baseParams: { vertexCount: 6, irregularity: 55, radius: 12 } },
    { slot: 'right_leg', primitive: 'irregularFragment', baseParams: { vertexCount: 7, irregularity: 65, radius: 14 } },
  ],
};

// ── Render function ──

function makeParts(): Record<string, PartForComposition | null> {
  return {
    head: { id: 'h', name: 'head', slot: 'head' },
    chest: { id: 'c', name: 'chest', slot: 'chest' },
    left_arm: { id: 'la', name: 'la', slot: 'left_arm' },
    right_arm: { id: 'ra', name: 'ra', slot: 'right_arm' },
    left_leg: { id: 'll', name: 'll', slot: 'left_leg' },
    right_leg: { id: 'rl', name: 'rl', slot: 'right_leg' },
  };
}

function makeColors(): Record<string, string> {
  return {
    head: '#3b82f6', chest: '#3b82f6',
    left_arm: '#3b82f6', right_arm: '#3b82f6',
    left_leg: '#3b82f6', right_leg: '#3b82f6',
  };
}

interface TechniqueEntry {
  name: string;
  description: string;
  plan: BodyPlan;
  isProduction?: boolean;
}

const techniques: TechniqueEntry[] = [
  { name: 'Stroke Skeleton + Joint Blend', description: 'Current production. Stroked lines + SDF joint circles.', plan: strokePlan, isProduction: true },
  { name: 'Ellipse + SigmoidBulge', description: 'Previous production. Smooth ellipse head + muscle bulge limbs.', plan: ellipseSigmoidPlan },
  { name: 'Polygon', description: 'Original approach. Vertex-jittered polygons.', plan: polygonPlan },
  { name: 'TeardropFin', description: 'Elongated directional fins for limbs.', plan: teardropPlan },
  { name: 'IrregularFragment + RadialBurst', description: 'Chimera-style: rough fragments + spiky bursts.', plan: chimeraStylePlan },
  { name: 'Chimera Asymmetric (real plan)', description: 'Actual chimeraAsymmetric body plan — different bone positions.', plan: chimeraAsymmetric },
];

// ── Entry point ──

const root = document.getElementById('root')!;

function render() {
  const parts = makeParts();
  const colors = makeColors();
  const seed = 42;

  const sections = techniques.map(t => {
    const input: CompositionInput = { bodyPlan: t.plan, parts, colors, seed };
    let svg: string;
    try {
      svg = renderFigureSvg(input, 200, 200);
    } catch (e) {
      svg = `<svg width="200" height="200" viewBox="0 0 200 200"><text x="10" y="100" fill="red" font-size="10">Error: ${(e as Error).message}</text></svg>`;
    }
    const composed = composeFigure(input);
    const partCount = composed.length;
    const hasLine = svg.includes('<line');
    const hasCircle = svg.includes('<circle');
    const hasPolygon = svg.includes('<polygon');
    const hasEllipse = svg.includes('<ellipse');
    const hasPath = svg.includes('<path');

    const border = t.isProduction ? '#10b981' : '#ddd';
    const label = t.isProduction ? ' (PRODUCTION)' : '';

    return `
      <div style="border: 2px solid ${border}; border-radius: 8px; padding: 12px; background: ${t.isProduction ? '#f0fdf4' : '#fff'};">
        <h3 style="font-size: 13px; margin: 0 0 4px 0; font-family: monospace;">${t.name}${label}</h3>
        <p style="font-size: 10px; color: #666; margin: 0 0 8px 0; font-family: monospace;">${t.description}</p>
        <div style="display: flex; justify-content: center; margin-bottom: 8px;">${svg}</div>
        <div style="font-size: 10px; color: #999; font-family: monospace;">
          Parts: ${partCount} |
          ${hasLine ? 'line ' : ''}${hasCircle ? 'circle ' : ''}${hasPolygon ? 'polygon ' : ''}${hasEllipse ? 'ellipse ' : ''}${hasPath ? 'path' : ''}
        </div>
      </div>
    `;
  }).join('');

  root.innerHTML = `
    <div style="font-family: monospace; max-width: 1200px; margin: 0 auto; padding: 20px;">
      <h1 style="font-size: 18px; margin-bottom: 4px;">Technique Showcase — Real Production Composer</h1>
      <p style="font-size: 12px; color: #666; margin-bottom: 16px;">
        All techniques rendered through the real <code>composeFigure()</code> + <code>renderFigureSvg()</code> pipeline.
        Same bone positions, same seed, same colors. Only the primitive type changes.
        Green border = current production technique.
      </p>
      <div style="display: flex; flex-wrap: wrap; gap: 16px;">
        ${sections}
      </div>
    </div>
  `;
}

render();
