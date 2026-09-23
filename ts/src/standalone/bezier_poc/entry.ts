/**
 * Bezier POC — Entry point
 *
 * Renders a single organic blob using real cubic Bézier curves.
 * Provides minimal controls (seed, anchor count, tension, jitter)
 * so Robert can judge the technique across different parameter ranges.
 */

import { generateBezierBlob } from './bezier_blob';

const root = document.getElementById('root')!;

// ── State ──
let seed = 42;
let anchorCount = 8;
let tension = 0.1667;
let jitterAmount = 0.15;
let baseRadius = 60;

// ── Render function ──
function render() {
  const result = generateBezierBlob({
    seed,
    anchorCount,
    baseRadius,
    jitterAmount,
    tension,
    cx: 100,
    cy: 100,
    fill: '#3b82f6',
    stroke: '#1e3a8a',
    strokeWidth: 2,
  });

  // Show 3 shapes at different tensions to demonstrate the technique's range
  const tight = generateBezierBlob({
    seed, anchorCount, baseRadius, jitterAmount,
    tension: 0.05,
    cx: 100, cy: 100,
    fill: '#10b981', stroke: '#065f46', strokeWidth: 2,
  });
  const standard = generateBezierBlob({
    seed, anchorCount, baseRadius, jitterAmount,
    tension: 0.1667,
    cx: 100, cy: 100,
    fill: '#3b82f6', stroke: '#1e3a8a', strokeWidth: 2,
  });
  const loose = generateBezierBlob({
    seed, anchorCount, baseRadius, jitterAmount,
    tension: 0.35,
    cx: 100, cy: 100,
    fill: '#f59e0b', stroke: '#92400e', strokeWidth: 2,
  });

  root.innerHTML = `
    <div style="font-family: monospace; max-width: 900px; margin: 0 auto; padding: 20px;">
      <h1 style="font-size: 18px; margin-bottom: 4px;">Bézier Curve POC — Isolated</h1>
      <p style="font-size: 12px; color: #666; margin-bottom: 20px;">
        One organic shape built with real cubic Bézier <code>C</code> path commands.
        Not wired into anything. Judge the technique, not the parameters.
      </p>

      <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 24px;">
        <div>
          <label style="font-size: 12px; display: block;">Seed: <strong>${seed}</strong></label>
          <input type="range" id="seed" min="0" max="999" value="${seed}" style="width: 120px;">
        </div>
        <div>
          <label style="font-size: 12px; display: block;">Anchors: <strong>${anchorCount}</strong></label>
          <input type="range" id="anchors" min="4" max="16" value="${anchorCount}" step="1" style="width: 120px;">
        </div>
        <div>
          <label style="font-size: 12px; display: block;">Tension: <strong>${tension.toFixed(3)}</strong></label>
          <input type="range" id="tension" min="0" max="0.5" value="${tension}" step="0.01" style="width: 120px;">
        </div>
        <div>
          <label style="font-size: 12px; display: block;">Jitter: <strong>${jitterAmount.toFixed(2)}</strong></label>
          <input type="range" id="jitter" min="0" max="0.5" value="${jitterAmount}" step="0.01" style="width: 120px;">
        </div>
        <div>
          <label style="font-size: 12px; display: block;">Radius: <strong>${baseRadius}</strong></label>
          <input type="range" id="radius" min="20" max="90" value="${baseRadius}" step="1" style="width: 120px;">
        </div>
        <button id="randomize" style="height: 28px; align-self: flex-end; font-family: monospace; cursor: pointer;">Randomize Seed</button>
      </div>

      <h2 style="font-size: 14px; margin-bottom: 8px;">Three tensions, same seed (left → right: tight, standard, loose)</h2>
      <div style="display: flex; gap: 16px; margin-bottom: 24px;">
        <div>
          <p style="font-size: 11px; color: #666; margin: 0 0 4px 0;">tension=0.05 (sharp)</p>
          <svg width="200" height="200" viewBox="0 0 200 200" style="border: 1px solid #ddd;">
            ${tight.svg}
          </svg>
        </div>
        <div>
          <p style="font-size: 11px; color: #666; margin: 0 0 4px 0;">tension=0.167 (standard)</p>
          <svg width="200" height="200" viewBox="0 0 200 200" style="border: 1px solid #ddd;">
            ${standard.svg}
          </svg>
        </div>
        <div>
          <p style="font-size: 11px; color: #666; margin: 0 0 4px 0;">tension=0.35 (loose)</p>
          <svg width="200" height="200" viewBox="0 0 200 200" style="border: 1px solid #ddd;">
            ${loose.svg}
          </svg>
        </div>
      </div>

      <h2 style="font-size: 14px; margin-bottom: 8px;">Current shape (interactive)</h2>
      <svg width="200" height="200" viewBox="0 0 200 200" style="border: 1px solid #ddd; display: block; margin-bottom: 16px;">
        ${result.svg}
      </svg>

      <details style="font-size: 11px; color: #666;">
        <summary style="cursor: pointer; margin-bottom: 8px;">Raw path data (objective output)</summary>
        <pre style="background: #f5f5f5; padding: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-all;">${result.pathData}</pre>
        <p style="margin-top: 8px;">Command types: ${result.commandTypes.join(', ')}</p>
        <p>Anchor count: ${result.anchorPoints.length}</p>
        <p>Control point count: ${result.controlPoints.length}</p>
      </details>

      <p style="font-size: 11px; color: #999; margin-top: 24px;">
        This is an isolated proof of concept. Not wired into artGen, composer,
        or any existing consumer. The question: do genuine Bézier curves look
        organic enough to pursue as a real primitive?
      </p>
    </div>
  `;

  // Wire up controls
  document.getElementById('seed')!.addEventListener('input', (e) => {
    seed = parseInt((e.target as HTMLInputElement).value);
    render();
  });
  document.getElementById('anchors')!.addEventListener('input', (e) => {
    anchorCount = parseInt((e.target as HTMLInputElement).value);
    render();
  });
  document.getElementById('tension')!.addEventListener('input', (e) => {
    tension = parseFloat((e.target as HTMLInputElement).value);
    render();
  });
  document.getElementById('jitter')!.addEventListener('input', (e) => {
    jitterAmount = parseFloat((e.target as HTMLInputElement).value);
    render();
  });
  document.getElementById('radius')!.addEventListener('input', (e) => {
    baseRadius = parseInt((e.target as HTMLInputElement).value);
    render();
  });
  document.getElementById('randomize')!.addEventListener('click', () => {
    seed = Math.floor(Math.random() * 999);
    render();
  });
}

render();
