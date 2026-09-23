/**
 * Technique Showcase — Interactive, through the REAL production composer.
 *
 * All techniques rendered through composeFigure() + renderFigureSvg().
 * Sliders adjust stroke widths, joint blend radius, seed, and colors
 * in real-time. Same bone positions for all techniques — only the
 * primitive type and parameters change.
 */

import { renderFigureSvg } from '../../engine/paperDoll/index';
import type { BodyPlan, CompositionInput, PartForComposition } from '../../engine/paperDoll/types';
import { humanoidBilateral } from '../../engine/paperDoll/bodyPlans/humanoidBilateral';
import { chimeraAsymmetric } from '../../engine/paperDoll/bodyPlans/chimeraAsymmetric';

const bones = humanoidBilateral.nodes;
const renderOrder = humanoidBilateral.renderOrder;

// ── State (adjustable via sliders) ──
let state = {
  seed: 42,
  // Stroke skeleton params
  headRadius: 10,
  headStroke: 6,
  torsoWidth: 20,
  torsoHeight: 12,
  armWidthProx: 10,
  armWidthDist: 5,
  legWidthProx: 12,
  legWidthDist: 6,
  jointBlendRadius: 7,
  // Ellipse/sigmoid params
  headRx: 7,
  headRy: 8,
  chestWidthStart: 18,
  chestWidthEnd: 9,
  armWidthStart: 15,
  armWidthEnd: 9,
  legWidthStart: 11,
  legWidthEnd: 10,
  // Polygon params
  polyHeadRadius: 12,
  polyChestRadius: 18,
  polyArmRadius: 10,
  polyLegRadius: 11,
  // Color
  bodyColor: '#3b82f6',
};

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

function makeColors(color: string): Record<string, string> {
  return { head: color, chest: color, left_arm: color, right_arm: color, left_leg: color, right_leg: color };
}

function buildPlans(): Record<string, BodyPlan> {
  const s = state;
  return {
    stroke: {
      id: 'stroke_skeleton', root: 'chest', nodes: bones, renderOrder,
      shapeMappings: [
        { slot: 'head', primitive: 'strokeSkeleton', baseParams: { widthProximal: s.headRadius, widthDistal: s.headStroke, jointBlendRadius: s.jointBlendRadius, jointBlendK: 4 } },
        { slot: 'chest', primitive: 'strokeSkeleton', baseParams: { widthProximal: s.torsoWidth, widthDistal: s.torsoWidth * 0.7, jointBlendRadius: s.torsoHeight, jointBlendK: 5 } },
        { slot: 'left_arm', primitive: 'strokeSkeleton', baseParams: { widthProximal: s.armWidthProx, widthDistal: s.armWidthDist, jointBlendRadius: s.jointBlendRadius, jointBlendK: 4 } },
        { slot: 'right_arm', primitive: 'strokeSkeleton', baseParams: { widthProximal: s.armWidthProx, widthDistal: s.armWidthDist, jointBlendRadius: s.jointBlendRadius, jointBlendK: 4 } },
        { slot: 'left_leg', primitive: 'strokeSkeleton', baseParams: { widthProximal: s.legWidthProx, widthDistal: s.legWidthDist, jointBlendRadius: s.jointBlendRadius, jointBlendK: 4 } },
        { slot: 'right_leg', primitive: 'strokeSkeleton', baseParams: { widthProximal: s.legWidthProx, widthDistal: s.legWidthDist, jointBlendRadius: s.jointBlendRadius, jointBlendK: 4 } },
      ],
    },
    ellipseSigmoid: {
      id: 'ellipse_sigmoid', root: 'chest', nodes: bones, renderOrder,
      shapeMappings: [
        { slot: 'head', primitive: 'ellipse', baseParams: { rx: s.headRx, ry: s.headRy } },
        { slot: 'chest', primitive: 'sigmoidBulge', baseParams: { widthStart: s.chestWidthStart, widthEnd: s.chestWidthEnd, segments: 8, bulgeFactor: 0.3 } },
        { slot: 'left_arm', primitive: 'sigmoidBulge', baseParams: { widthStart: s.armWidthStart, widthEnd: s.armWidthEnd, segments: 6, bulgeFactor: 0.4 } },
        { slot: 'right_arm', primitive: 'sigmoidBulge', baseParams: { widthStart: s.armWidthStart, widthEnd: s.armWidthEnd, segments: 6, bulgeFactor: 0.4 } },
        { slot: 'left_leg', primitive: 'sigmoidBulge', baseParams: { widthStart: s.legWidthStart, widthEnd: s.legWidthEnd, segments: 6, bulgeFactor: 0.35 } },
        { slot: 'right_leg', primitive: 'sigmoidBulge', baseParams: { widthStart: s.legWidthStart, widthEnd: s.legWidthEnd, segments: 6, bulgeFactor: 0.35 } },
      ],
    },
    polygon: {
      id: 'polygon', root: 'chest', nodes: bones, renderOrder,
      shapeMappings: [
        { slot: 'head', primitive: 'polygon', baseParams: { vertexCount: 6, irregularity: 10, radius: s.polyHeadRadius } },
        { slot: 'chest', primitive: 'polygon', baseParams: { vertexCount: 6, irregularity: 15, radius: s.polyChestRadius } },
        { slot: 'left_arm', primitive: 'polygon', baseParams: { vertexCount: 5, irregularity: 20, radius: s.polyArmRadius } },
        { slot: 'right_arm', primitive: 'polygon', baseParams: { vertexCount: 5, irregularity: 20, radius: s.polyArmRadius } },
        { slot: 'left_leg', primitive: 'polygon', baseParams: { vertexCount: 5, irregularity: 18, radius: s.polyLegRadius } },
        { slot: 'right_leg', primitive: 'polygon', baseParams: { vertexCount: 5, irregularity: 18, radius: s.polyLegRadius } },
      ],
    },
    teardrop: {
      id: 'teardrop', root: 'chest', nodes: bones, renderOrder,
      shapeMappings: [
        { slot: 'head', primitive: 'polygon', baseParams: { vertexCount: 6, irregularity: 10, radius: s.polyHeadRadius } },
        { slot: 'chest', primitive: 'polygon', baseParams: { vertexCount: 6, irregularity: 15, radius: s.polyChestRadius } },
        { slot: 'left_arm', primitive: 'teardropFin', baseParams: { scale: 0.6, angularity: 30 } },
        { slot: 'right_arm', primitive: 'teardropFin', baseParams: { scale: 0.6, angularity: 30 } },
        { slot: 'left_leg', primitive: 'teardropFin', baseParams: { scale: 0.7, angularity: 25 } },
        { slot: 'right_leg', primitive: 'teardropFin', baseParams: { scale: 0.7, angularity: 25 } },
      ],
    },
    chimeraStyle: {
      id: 'chimera_style', root: 'chest', nodes: bones, renderOrder,
      shapeMappings: [
        { slot: 'head', primitive: 'irregularFragment', baseParams: { vertexCount: 7, irregularity: 50, radius: s.polyHeadRadius } },
        { slot: 'chest', primitive: 'irregularFragment', baseParams: { vertexCount: 8, irregularity: 40, radius: s.polyChestRadius } },
        { slot: 'left_arm', primitive: 'radialBurst', baseParams: { armCount: 4, radius: s.polyArmRadius + 4 } },
        { slot: 'right_arm', primitive: 'radialBurst', baseParams: { armCount: 5, radius: s.polyArmRadius + 6 } },
        { slot: 'left_leg', primitive: 'irregularFragment', baseParams: { vertexCount: 6, irregularity: 55, radius: s.polyLegRadius } },
        { slot: 'right_leg', primitive: 'irregularFragment', baseParams: { vertexCount: 7, irregularity: 65, radius: s.polyLegRadius + 2 } },
      ],
    },
  };
}

const techniqueLabels: Array<{key: string, name: string, desc: string, isProd?: boolean}> = [
  { key: 'stroke', name: 'Stroke Skeleton + Joint Blend', desc: 'Stroked lines + SDF joint circles', isProd: true },
  { key: 'ellipseSigmoid', name: 'Ellipse + SigmoidBulge', desc: 'Smooth ellipse head + muscle bulge limbs' },
  { key: 'polygon', name: 'Polygon', desc: 'Vertex-jittered polygons' },
  { key: 'teardrop', name: 'TeardropFin', desc: 'Elongated directional fins for limbs' },
  { key: 'chimeraStyle', name: 'IrregularFragment + RadialBurst', desc: 'Chimera-style: rough fragments + spiky bursts' },
];

const root = document.getElementById('root')!;

function slider(label: string, id: keyof typeof state, min: number, max: number, step: number = 1): string {
  const val = state[id] as number;
  return `<div style="display:flex;align-items:center;gap:6px;">
    <label style="font-size:10px;width:90px;text-align:right;">${label}</label>
    <input type="range" id="slider_${id}" min="${min}" max="${max}" step="${step}" value="${val}" style="width:100px;">
    <span id="val_${id}" style="font-size:10px;width:30px;">${typeof val === 'number' ? val.toFixed(step < 1 ? 2 : 0) : val}</span>
  </div>`;
}

function render() {
  const plans = buildPlans();
  const parts = makeParts();
  const colors = makeColors(state.bodyColor);

  const sections = techniqueLabels.map(t => {
    const plan = t.key === 'chimeraAsymmetric' ? chimeraAsymmetric : plans[t.key];
    const input: CompositionInput = { bodyPlan: plan, parts, colors, seed: state.seed };
    let svg: string;
    try {
      svg = renderFigureSvg(input, 200, 200);
    } catch (e) {
      svg = `<svg width="200" height="200" viewBox="0 0 200 200"><text x="10" y="100" fill="red" font-size="10">Error: ${(e as Error).message}</text></svg>`;
    }
    const border = t.isProd ? '#10b981' : '#ddd';
    const bg = t.isProd ? '#f0fdf4' : '#fff';
    const tag = t.isProd ? ' (PRODUCTION)' : '';
    return `<div style="border:2px solid ${border};border-radius:8px;padding:12px;background:${bg};">
      <h3 style="font-size:12px;margin:0 0 4px;font-family:monospace;">${t.name}${tag}</h3>
      <p style="font-size:9px;color:#666;margin:0 0 8px;font-family:monospace;">${t.desc}</p>
      <div style="display:flex;justify-content:center;">${svg}</div>
    </div>`;
  }).join('');

  root.innerHTML = `
    <div style="font-family:monospace;max-width:1300px;margin:0 auto;padding:16px;">
      <h1 style="font-size:16px;margin-bottom:4px;">Technique Showcase — Interactive, Real Production Composer</h1>
      <p style="font-size:11px;color:#666;margin-bottom:12px;">
        All techniques through real <code>composeFigure()</code>. Same bones, same seed, same color.
        Adjust sliders to compare fairly. Green = current production.
      </p>

      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:16px;padding:12px;background:#f8f8f8;border-radius:8px;">
        <div style="font-size:11px;font-weight:bold;width:100%;color:#3b82f6;">Stroke Skeleton</div>
        ${slider('Head radius', 'headRadius', 4, 20)}
        ${slider('Head stroke', 'headStroke', 2, 14)}
        ${slider('Torso width', 'torsoWidth', 8, 35)}
        ${slider('Torso height', 'torsoHeight', 4, 25)}
        ${slider('Arm proximal', 'armWidthProx', 4, 20)}
        ${slider('Arm distal', 'armWidthDist', 2, 14)}
        ${slider('Leg proximal', 'legWidthProx', 5, 24)}
        ${slider('Leg distal', 'legWidthDist', 2, 16)}
        ${slider('Joint blend r', 'jointBlendRadius', 3, 18)}

        <div style="font-size:11px;font-weight:bold;width:100%;color:#f59e0b;margin-top:8px;">Ellipse / Sigmoid</div>
        ${slider('Head rx', 'headRx', 3, 16)}
        ${slider('Head ry', 'headRy', 3, 18)}
        ${slider('Chest wStart', 'chestWidthStart', 8, 35)}
        ${slider('Chest wEnd', 'chestWidthEnd', 4, 20)}
        ${slider('Arm wStart', 'armWidthStart', 5, 25)}
        ${slider('Arm wEnd', 'armWidthEnd', 3, 16)}
        ${slider('Leg wStart', 'legWidthStart', 5, 22)}
        ${slider('Leg wEnd', 'legWidthEnd', 3, 18)}

        <div style="font-size:11px;font-weight:bold;width:100%;color:#8b5cf6;margin-top:8px;">Polygon (shared)</div>
        ${slider('Poly head r', 'polyHeadRadius', 5, 22)}
        ${slider('Poly chest r', 'polyChestRadius', 8, 32)}
        ${slider('Poly arm r', 'polyArmRadius', 4, 18)}
        ${slider('Poly leg r', 'polyLegRadius', 5, 20)}

        <div style="font-size:11px;font-weight:bold;width:100%;color:#ec4899;margin-top:8px;">Global</div>
        ${slider('Seed', 'seed', 0, 999)}
        <div style="display:flex;align-items:center;gap:6px;">
          <label style="font-size:10px;width:90px;text-align:right;">Body color</label>
          <input type="color" id="slider_bodyColor" value="${state.bodyColor}" style="width:40px;height:20px;">
        </div>
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:16px;">
        ${sections}
      </div>
    </div>
  `;

  // Wire up all sliders
  const sliderIds: Array<keyof typeof state> = [
    'headRadius','headStroke','torsoWidth','torsoHeight',
    'armWidthProx','armWidthDist','legWidthProx','legWidthDist','jointBlendRadius',
    'headRx','headRy','chestWidthStart','chestWidthEnd','armWidthStart','armWidthEnd',
    'legWidthStart','legWidthEnd',
    'polyHeadRadius','polyChestRadius','polyArmRadius','polyLegRadius',
    'seed',
  ];
  for (const id of sliderIds) {
    const el = document.getElementById(`slider_${id}`) as HTMLInputElement | null;
    if (!el) continue;
    el.addEventListener('input', () => {
      state[id] = parseFloat(el.value) as never;
      const valEl = document.getElementById(`val_${id}`);
      if (valEl) valEl.textContent = (state[id] as number).toFixed(el.step.includes('.') ? 2 : 0);
      render();
    });
  }
  const colorEl = document.getElementById('slider_bodyColor') as HTMLInputElement | null;
  if (colorEl) {
    colorEl.addEventListener('input', () => {
      state.bodyColor = colorEl.value;
      render();
    });
  }
}

render();
