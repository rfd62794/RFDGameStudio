/**
 * Technique Comparison POC — Entry point
 *
 * Renders all 9 (plus 10th shading check) techniques side by side
 * on one page. Each technique is clearly labeled with its family
 * (smooth-procedural-vector vs strategic fork) and description.
 *
 * Nothing is wired into artGen, composer, or any existing consumer.
 */

import { renderBezier, techniqueInfo as bezierInfo } from './technique_bezier';
import { renderMetaball, techniqueInfo as metaballInfo } from './technique_metaball';
import { renderStrokeSkeleton, techniqueInfo as strokeInfo } from './technique_stroke';
import { renderNoiseOutline, techniqueInfo as noiseInfo } from './technique_noise';
import { renderSquircle, techniqueInfo as squircleInfo } from './technique_squircle';
import { renderSDF, techniqueInfo as sdfInfo } from './technique_sdf';
import { renderCanvasContainer, techniqueInfo as canvasInfo } from './technique_canvas';
import { renderPaperDoll, techniqueInfo as paperdollInfo } from './technique_paperdoll';
import { renderPixelArt, techniqueInfo as pixelartInfo } from './technique_pixelart';
import { renderShadingComparison, techniqueInfo as shadingInfo } from './technique_shading';

interface Technique {
  info: typeof bezierInfo;
  render: () => string;
  isCanvas?: boolean;
}

const techniques: Technique[] = [
  { info: bezierInfo, render: renderBezier },
  { info: metaballInfo, render: renderMetaball },
  { info: strokeInfo, render: renderStrokeSkeleton },
  { info: noiseInfo, render: renderNoiseOutline },
  { info: squircleInfo, render: renderSquircle },
  { info: sdfInfo, render: renderSDF },
  { info: canvasInfo, render: renderCanvasContainer, isCanvas: true },
  { info: paperdollInfo, render: renderPaperDoll },
  { info: pixelartInfo, render: renderPixelArt },
  { info: shadingInfo, render: renderShadingComparison },
];

const root = document.getElementById('root')!;

function techniqueSection(t: Technique): string {
  const isStrategic = t.info.family.includes('Strategic') || t.info.family.includes('Comparison');
  const borderColor = isStrategic ? '#f59e0b' : '#3b82f6';
  const bgColor = isStrategic ? '#fffbeb' : '#f0f9ff';

  let content: string;
  if (t.isCanvas) {
    content = t.render();
  } else {
    content = `<svg width="200" height="200" viewBox="0 0 200 200" style="border: 1px solid #ddd; display: block; background: white;">${t.render()}</svg>`;
  }

  return `
    <div style="border: 2px solid ${borderColor}; border-radius: 8px; padding: 16px; background: ${bgColor}; width: 280px;">
      <h3 style="font-size: 13px; margin: 0 0 4px 0; font-family: monospace;">${t.info.name}</h3>
      <p style="font-size: 10px; color: #666; margin: 0 0 8px 0; font-family: monospace;">
        <strong>Family:</strong> ${t.info.family}
      </p>
      <p style="font-size: 10px; color: #555; margin: 0 0 12px 0; font-family: monospace;">${t.info.description}</p>
      <div style="display: flex; justify-content: center;">${content}</div>
    </div>
  `;
}

root.innerHTML = `
  <div style="font-family: monospace; max-width: 1400px; margin: 0 auto; padding: 20px;">
    <h1 style="font-size: 20px; margin-bottom: 4px;">Paper Doll — Full Technique Comparison POC</h1>
    <p style="font-size: 12px; color: #666; margin-bottom: 8px;">
      Nine real, distinct approaches side by side. Plus a 10th flat-vs-shaded comparison check.
      Nothing wired into production. Judge the techniques, not the parameters.
    </p>
    <p style="font-size: 11px; color: #999; margin-bottom: 24px;">
      Blue borders = smooth-procedural-vector family (same philosophy, different math).
      Amber borders = strategic forks (different philosophy — real commitment required).
    </p>

    <h2 style="font-size: 14px; margin-bottom: 12px; color: #3b82f6;">
      Smooth-Procedural-Vector Family (techniques 1-7)
    </h2>
    <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 32px;">
      ${techniques.slice(0, 7).map(techniqueSection).join('')}
    </div>

    <h2 style="font-size: 14px; margin-bottom: 12px; color: #f59e0b;">
      Strategic Forks (techniques 8-9) — ⚠️ Different philosophy, not just different math
    </h2>
    <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 32px;">
      ${techniques.slice(7, 9).map(techniqueSection).join('')}
    </div>

    <h2 style="font-size: 14px; margin-bottom: 12px; color: #6b7280;">
      Comparison Check (technique 10)
    </h2>
    <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 32px;">
      ${techniques.slice(9).map(techniqueSection).join('')}
    </div>

    <div style="border-top: 1px solid #ddd; padding-top: 16px; margin-top: 24px;">
      <h2 style="font-size: 14px; margin-bottom: 8px;">Cost Notes (for Robert's weighing)</h2>
      <ul style="font-size: 11px; color: #555; line-height: 1.6; font-family: monospace;">
        <li><strong>Techniques 1-7:</strong> Same philosophy, different math. All procedural, all seed-driven, all SVG or canvas. Picking one is a math choice.</li>
        <li><strong>Technique 8 (paper-doll):</strong> Real asset-authoring commitment. Every part/variant needs authored art. Compositing feel may be more recognizable even with crude art.</li>
        <li><strong>Technique 9 (pixel-art):</strong> Real aesthetic-direction change. Blocky/graphic look, not smooth. Different audience expectation.</li>
        <li><strong>Technique 10 (shading):</strong> Not a technique — a check. Flat color may damage all 9 techniques equally. Shading is orthogonal to shape choice.</li>
      </ul>
    </div>

    <p style="font-size: 11px; color: #999; margin-top: 24px;">
      This is an isolated comparison POC. Not wired into artGen, composer, paperDoll, or any existing consumer.
      No technique is declared a winner by this page — that's Robert's call.
    </p>
  </div>
`;
