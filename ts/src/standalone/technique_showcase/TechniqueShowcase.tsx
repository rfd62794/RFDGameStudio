/**
 * Technique Showcase — Independent panels, each with its own sliders + colors.
 *
 * Every technique gets its own self-contained panel with:
 *   - Its figure rendered through the real production composer
 *   - Dedicated per-slot sliders (primitive params)
 *   - Per-slot color picker + swatches
 *   - Per-panel seed + body plan toggle
 *
 * No shared sidebar — each panel is independent and fully adjustable.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  renderFigureSvg,
  humanoidBilateral,
  chimeraAsymmetric,
} from '../../engine/paperDoll';
import type {
  BodyPlan,
  SlotShapeMapping,
  CompositionInput,
  PartForComposition,
} from '../../engine/paperDoll';
import type { PartSlot } from '../../engine/shared/partSlots';
import { PART_SLOTS } from '../../engine/shared/partSlots';

// ── Types ──

type PrimitiveType = 'polygon' | 'radialBurst' | 'teardropFin' | 'irregularFragment' | 'sigmoidBulge' | 'ellipse' | 'strokeSkeleton';

interface TechniqueConfig {
  id: string;
  label: string;
  description: string;
  bodyPlanId: 'humanoid_bilateral' | 'chimera_asymmetric';
  shapeOverrides: Record<string, SlotShapeMapping>;
  colors: Record<string, string>;
  seed: number;
  isProduction?: boolean;
}

// ── Default parts ──

function makeDummyParts(): Record<string, PartForComposition | null> {
  const parts: Record<string, PartForComposition | null> = {};
  for (const slot of PART_SLOTS) {
    parts[slot] = { id: `dummy_${slot}`, name: slot, slot };
  }
  return parts;
}
const DUMMY_PARTS = makeDummyParts();

function makeShape(slot: PartSlot, primitive: PrimitiveType, params: Record<string, number>): SlotShapeMapping {
  return { slot, primitive, baseParams: params };
}

// ── Default configs for each technique ──

function defaultConfigs(): Record<string, TechniqueConfig> {
  return {
    stroke: {
      id: 'stroke', label: 'Stroke Skeleton', description: 'Stroked lines + SDF joint circles',
      bodyPlanId: 'humanoid_bilateral', isProduction: true, seed: 42,
      shapeOverrides: {
        head: makeShape('head', 'strokeSkeleton', { widthProximal: 10, widthDistal: 6, jointBlendRadius: 7, jointBlendK: 4 }),
        chest: makeShape('chest', 'strokeSkeleton', { widthProximal: 20, widthDistal: 14, jointBlendRadius: 12, jointBlendK: 5 }),
        left_arm: makeShape('left_arm', 'strokeSkeleton', { widthProximal: 10, widthDistal: 5, jointBlendRadius: 6, jointBlendK: 4 }),
        right_arm: makeShape('right_arm', 'strokeSkeleton', { widthProximal: 10, widthDistal: 5, jointBlendRadius: 6, jointBlendK: 4 }),
        left_leg: makeShape('left_leg', 'strokeSkeleton', { widthProximal: 12, widthDistal: 6, jointBlendRadius: 7, jointBlendK: 4 }),
        right_leg: makeShape('right_leg', 'strokeSkeleton', { widthProximal: 12, widthDistal: 6, jointBlendRadius: 7, jointBlendK: 4 }),
      },
      colors: { head: '#3b82f6', chest: '#3b82f6', left_arm: '#3b82f6', right_arm: '#3b82f6', left_leg: '#3b82f6', right_leg: '#3b82f6' },
    },
    ellipseSigmoid: {
      id: 'ellipseSigmoid', label: 'Ellipse + Sigmoid', description: 'Smooth ellipse head + muscle bulge limbs',
      bodyPlanId: 'humanoid_bilateral', seed: 42,
      shapeOverrides: {
        head: makeShape('head', 'ellipse', { rx: 7, ry: 8 }),
        chest: makeShape('chest', 'sigmoidBulge', { widthStart: 18, widthEnd: 9, segments: 8, bulgeFactor: 0.3 }),
        left_arm: makeShape('left_arm', 'sigmoidBulge', { widthStart: 15, widthEnd: 9, segments: 6, bulgeFactor: 0.4 }),
        right_arm: makeShape('right_arm', 'sigmoidBulge', { widthStart: 15, widthEnd: 9, segments: 6, bulgeFactor: 0.4 }),
        left_leg: makeShape('left_leg', 'sigmoidBulge', { widthStart: 11, widthEnd: 10, segments: 6, bulgeFactor: 0.35 }),
        right_leg: makeShape('right_leg', 'sigmoidBulge', { widthStart: 11, widthEnd: 10, segments: 6, bulgeFactor: 0.35 }),
      },
      colors: { head: '#3b82f6', chest: '#3b82f6', left_arm: '#3b82f6', right_arm: '#3b82f6', left_leg: '#3b82f6', right_leg: '#3b82f6' },
    },
    polygon: {
      id: 'polygon', label: 'Polygon', description: 'Vertex-jittered polygons',
      bodyPlanId: 'humanoid_bilateral', seed: 42,
      shapeOverrides: {
        head: makeShape('head', 'polygon', { vertexCount: 6, irregularity: 10, radius: 12 }),
        chest: makeShape('chest', 'polygon', { vertexCount: 6, irregularity: 15, radius: 18 }),
        left_arm: makeShape('left_arm', 'polygon', { vertexCount: 5, irregularity: 20, radius: 10 }),
        right_arm: makeShape('right_arm', 'polygon', { vertexCount: 5, irregularity: 20, radius: 10 }),
        left_leg: makeShape('left_leg', 'polygon', { vertexCount: 5, irregularity: 18, radius: 11 }),
        right_leg: makeShape('right_leg', 'polygon', { vertexCount: 5, irregularity: 18, radius: 11 }),
      },
      colors: { head: '#3b82f6', chest: '#3b82f6', left_arm: '#3b82f6', right_arm: '#3b82f6', left_leg: '#3b82f6', right_leg: '#3b82f6' },
    },
    teardrop: {
      id: 'teardrop', label: 'TeardropFin', description: 'Elongated directional fins for limbs',
      bodyPlanId: 'humanoid_bilateral', seed: 42,
      shapeOverrides: {
        head: makeShape('head', 'polygon', { vertexCount: 6, irregularity: 10, radius: 12 }),
        chest: makeShape('chest', 'polygon', { vertexCount: 6, irregularity: 15, radius: 18 }),
        left_arm: makeShape('left_arm', 'teardropFin', { scale: 0.6, angularity: 30 }),
        right_arm: makeShape('right_arm', 'teardropFin', { scale: 0.6, angularity: 30 }),
        left_leg: makeShape('left_leg', 'teardropFin', { scale: 0.7, angularity: 25 }),
        right_leg: makeShape('right_leg', 'teardropFin', { scale: 0.7, angularity: 25 }),
      },
      colors: { head: '#3b82f6', chest: '#3b82f6', left_arm: '#3b82f6', right_arm: '#3b82f6', left_leg: '#3b82f6', right_leg: '#3b82f6' },
    },
    chimeraStyle: {
      id: 'chimeraStyle', label: 'Irregular + RadialBurst', description: 'Chimera-style: rough fragments + spiky bursts',
      bodyPlanId: 'humanoid_bilateral', seed: 42,
      shapeOverrides: {
        head: makeShape('head', 'irregularFragment', { vertexCount: 7, irregularity: 50, radius: 13 }),
        chest: makeShape('chest', 'irregularFragment', { vertexCount: 8, irregularity: 40, radius: 20 }),
        left_arm: makeShape('left_arm', 'radialBurst', { armCount: 4, radius: 14 }),
        right_arm: makeShape('right_arm', 'radialBurst', { armCount: 5, radius: 16 }),
        left_leg: makeShape('left_leg', 'irregularFragment', { vertexCount: 6, irregularity: 55, radius: 12 }),
        right_leg: makeShape('right_leg', 'irregularFragment', { vertexCount: 7, irregularity: 65, radius: 14 }),
      },
      colors: { head: '#3b82f6', chest: '#3b82f6', left_arm: '#3b82f6', right_arm: '#3b82f6', left_leg: '#3b82f6', right_leg: '#3b82f6' },
    },
    chimeraReal: {
      id: 'chimeraReal', label: 'Chimera Asymmetric', description: 'Actual chimeraAsymmetric body plan — different bones',
      bodyPlanId: 'chimera_asymmetric', seed: 42,
      shapeOverrides: {},
      colors: { head: '#3b82f6', chest: '#3b82f6', left_arm: '#3b82f6', right_arm: '#3b82f6', left_leg: '#3b82f6', right_leg: '#3b82f6' },
    },
  };
}

// ── Primitive param definitions ──

const PRIMITIVE_PARAMS: Record<PrimitiveType, Array<{ key: string; label: string; min: number; max: number; step: number }>> = {
  polygon: [
    { key: 'vertexCount', label: 'Vertices', min: 3, max: 12, step: 1 },
    { key: 'irregularity', label: 'Irregularity', min: 0, max: 100, step: 1 },
    { key: 'radius', label: 'Radius', min: 5, max: 40, step: 1 },
  ],
  radialBurst: [
    { key: 'armCount', label: 'Arms', min: 3, max: 12, step: 1 },
    { key: 'radius', label: 'Radius', min: 5, max: 40, step: 1 },
  ],
  teardropFin: [
    { key: 'scale', label: 'Scale', min: 0.2, max: 1.5, step: 0.05 },
    { key: 'angularity', label: 'Angularity', min: 0, max: 100, step: 1 },
  ],
  irregularFragment: [
    { key: 'vertexCount', label: 'Vertices', min: 3, max: 12, step: 1 },
    { key: 'irregularity', label: 'Irregularity', min: 0, max: 100, step: 1 },
    { key: 'radius', label: 'Radius', min: 5, max: 40, step: 1 },
  ],
  sigmoidBulge: [
    { key: 'widthStart', label: 'Width Start', min: 5, max: 30, step: 1 },
    { key: 'widthEnd', label: 'Width End', min: 3, max: 20, step: 1 },
    { key: 'bulgeFactor', label: 'Bulge', min: 0, max: 1, step: 0.05 },
  ],
  ellipse: [
    { key: 'rx', label: 'Radius X', min: 3, max: 40, step: 1 },
    { key: 'ry', label: 'Radius Y', min: 3, max: 40, step: 1 },
  ],
  strokeSkeleton: [
    { key: 'widthProximal', label: 'Width Prox', min: 3, max: 30, step: 1 },
    { key: 'widthDistal', label: 'Width Dist', min: 2, max: 20, step: 1 },
    { key: 'jointBlendRadius', label: 'Joint Blend R', min: 3, max: 20, step: 1 },
  ],
};

const PRIMITIVE_OPTIONS: PrimitiveType[] = ['strokeSkeleton', 'polygon', 'radialBurst', 'teardropFin', 'irregularFragment', 'sigmoidBulge', 'ellipse'];

const COLOR_PRESETS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280', '#1e293b', '#37474f', '#558b2f', '#8d6e63', '#6d4c41'];

// ── Helpers ──

function buildBodyPlan(config: TechniqueConfig): BodyPlan {
  const base = config.bodyPlanId === 'humanoid_bilateral' ? humanoidBilateral : chimeraAsymmetric;
  if (config.shapeOverrides && Object.keys(config.shapeOverrides).length > 0) {
    return {
      ...base,
      shapeMappings: PART_SLOTS.map(slot => config.shapeOverrides[slot] ?? base.shapeMappings.find(sm => sm.slot === slot)!),
    };
  }
  return base;
}

function buildInput(config: TechniqueConfig): CompositionInput {
  return { bodyPlan: buildBodyPlan(config), parts: DUMMY_PARTS, colors: config.colors, seed: config.seed };
}

// ── Styles ──

const styles = `
  html { overflow-y: auto; }
  /* Arcade wrapper override: when loaded via ?game=technique_showcase,
     the arcade's GameLoader wraps this component in .arcade-game-wrap
     (height: 100vh) > .arcade-game-content (overflow: hidden). That
     clips all content past the viewport with no scrollbar. Override
     both so the page scrolls naturally. */
  .arcade-game-wrap { height: auto; min-height: 100vh; }
  .arcade-game-content { overflow: visible; }
  body { background: #0f1117; color: #e0e0e0; font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; }
  .ts-page { padding: 1rem; max-width: 1400px; margin: 0 auto; }
  .ts-title { font-size: 1.3rem; margin: 0; }
  .ts-subtitle { color: #888; font-size: 0.85rem; margin: 0.25rem 0 1rem; }
  .ts-panels { display: flex; flex-direction: column; gap: 1.5rem; }
  .ts-panel { background: #1a1d28; border: 2px solid #2a3040; border-radius: 10px; overflow: hidden; }
  .ts-panel.production { border-color: #10b981; }
  .ts-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: #14171f; border-bottom: 1px solid #2a3040; cursor: pointer; }
  .ts-panel-header:hover { background: #1a1d28; }
  .ts-panel.production .ts-panel-header { border-bottom-color: #10b981; }
  .ts-panel-title { font-size: 0.95rem; font-weight: 700; }
  .ts-panel.production .ts-panel-title { color: #10b981; }
  .ts-panel-desc { font-size: 0.7rem; color: #888; margin-left: 0.5rem; font-weight: 400; }
  .ts-panel-toggle { font-size: 0.7rem; color: #888; }
  .ts-panel-body { display: flex; gap: 1rem; padding: 1rem; }
  .ts-panel-figure { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
  .ts-panel-figure svg { max-width: 200px; max-height: 200px; background: #0f1117; border-radius: 6px; }
  .ts-panel-controls { flex: 1; min-width: 0; }
  .ts-global-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
  .ts-btn { padding: 0.25rem 0.6rem; background: #2a3040; color: #e0e0e0; border: 1px solid #4a5070; border-radius: 4px; cursor: pointer; font-size: 0.7rem; }
  .ts-btn:hover { border-color: #3b82f6; }
  .ts-btn.active { background: #1a2235; border-color: #3b82f6; color: #3b82f6; }
  .ts-seed-label { font-size: 0.7rem; color: #aaa; }
  .ts-seed-label input[type="range"] { width: 100px; accent-color: #3b82f6; margin-left: 0.3rem; vertical-align: middle; }
  .ts-slots { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; }
  .ts-slot-card { background: #0f1117; border: 1px solid #2a3040; border-radius: 6px; padding: 0.5rem; }
  .ts-slot-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem; }
  .ts-slot-name { font-weight: bold; text-transform: capitalize; font-size: 0.75rem; }
  .ts-select { padding: 0.15rem 0.3rem; background: #2a3040; color: #e0e0e0; border: 1px solid #4a5070; border-radius: 4px; font-size: 0.65rem; max-width: 110px; }
  .ts-params { display: flex; flex-direction: column; gap: 0.2rem; margin-bottom: 0.3rem; }
  .ts-param { display: flex; flex-direction: column; gap: 0.1rem; }
  .ts-param-label { font-size: 0.6rem; color: #aaa; }
  .ts-param input[type="range"] { width: 100%; accent-color: #3b82f6; height: 4px; }
  .ts-color-row { display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; }
  .ts-color-picker { width: 20px; height: 20px; border: 1px solid #4a5070; border-radius: 3px; cursor: pointer; background: none; padding: 0; }
  .ts-swatches { display: flex; gap: 0.1rem; flex-wrap: wrap; }
  .ts-swatch { width: 12px; height: 12px; border: 1px solid #4a5070; border-radius: 2px; cursor: pointer; padding: 0; }
  .ts-swatch:hover { border-color: #3b82f6; }
`;

// ── Single Technique Panel (independent, self-contained) ──

interface PanelProps {
  config: TechniqueConfig;
  onChange: (updater: (prev: TechniqueConfig) => TechniqueConfig) => void;
}

function TechniquePanel({ config, onChange }: PanelProps) {
  const [expanded, setExpanded] = useState(true);

  const svg = useMemo(() => {
    try {
      return renderFigureSvg(buildInput(config), 200, 200);
    } catch (e) {
      return `<svg width="200" height="200" viewBox="0 0 200 200"><text x="10" y="100" fill="red" font-size="10">Error: ${(e as Error).message}</text></svg>`;
    }
  }, [config]);

  const updateShapeOverride = useCallback((slot: PartSlot, primitive: PrimitiveType) => {
    onChange(prev => ({
      ...prev,
      shapeOverrides: {
        ...prev.shapeOverrides,
        [slot]: { slot, primitive, baseParams: prev.shapeOverrides[slot]?.baseParams ?? PRIMITIVE_PARAMS[primitive].reduce((acc, p) => ({ ...acc, [p.key]: Math.round((p.min + p.max) / 2) }), {}) },
      },
    }));
  }, [onChange]);

  const updateShapeParam = useCallback((slot: PartSlot, paramKey: string, value: number) => {
    onChange(prev => {
      const existing = prev.shapeOverrides[slot];
      if (!existing) return prev;
      return { ...prev, shapeOverrides: { ...prev.shapeOverrides, [slot]: { ...existing, baseParams: { ...existing.baseParams, [paramKey]: value } } } };
    });
  }, [onChange]);

  const updateColor = useCallback((slot: PartSlot, color: string) => {
    onChange(prev => ({ ...prev, colors: { ...prev.colors, [slot]: color } }));
  }, [onChange]);

  const updateSeed = useCallback((seed: number) => {
    onChange(prev => ({ ...prev, seed }));
  }, [onChange]);

  const updateBodyPlan = useCallback((planId: 'humanoid_bilateral' | 'chimera_asymmetric') => {
    onChange(prev => ({ ...prev, bodyPlanId: planId }));
  }, [onChange]);

  return (
    <div className={`ts-panel ${config.isProduction ? 'production' : ''}`}>
      <div className="ts-panel-header" onClick={() => setExpanded(!expanded)}>
        <div>
          <span className="ts-panel-title">{config.label}{config.isProduction ? ' ★' : ''}</span>
          <span className="ts-panel-desc">{config.description}</span>
        </div>
        <span className="ts-panel-toggle">{expanded ? '▼ collapse' : '▶ expand'}</span>
      </div>
      {expanded && (
        <div className="ts-panel-body">
          {/* Figure */}
          <div className="ts-panel-figure">
            <div dangerouslySetInnerHTML={{ __html: svg }} />
          </div>

          {/* Controls */}
          <div className="ts-panel-controls">
            <div className="ts-global-row">
              <span className="ts-seed-label">Body:</span>
              <button className={`ts-btn ${config.bodyPlanId === 'humanoid_bilateral' ? 'active' : ''}`} onClick={() => updateBodyPlan('humanoid_bilateral')}>Humanoid</button>
              <button className={`ts-btn ${config.bodyPlanId === 'chimera_asymmetric' ? 'active' : ''}`} onClick={() => updateBodyPlan('chimera_asymmetric')}>Chimera</button>
              <span className="ts-seed-label">Seed: {config.seed}<input type="range" min={0} max={999} value={config.seed} onChange={e => updateSeed(Number(e.target.value))} /></span>
            </div>

            <div className="ts-slots">
              {PART_SLOTS.map(slot => {
                const override = config.shapeOverrides[slot];
                const base = (config.bodyPlanId === 'humanoid_bilateral' ? humanoidBilateral : chimeraAsymmetric).shapeMappings.find(sm => sm.slot === slot);
                const primitive = (override?.primitive ?? base?.primitive ?? 'polygon') as PrimitiveType;
                const params = override?.baseParams ?? base?.baseParams ?? {};
                const color = config.colors[slot] ?? '#888';
                const paramDefs = PRIMITIVE_PARAMS[primitive] ?? [];

                return (
                  <div key={slot} className="ts-slot-card">
                    <div className="ts-slot-header">
                      <span className="ts-slot-name">{slot.replace('_', ' ')}</span>
                      <select value={primitive} onChange={e => updateShapeOverride(slot, e.target.value as PrimitiveType)} className="ts-select">
                        {PRIMITIVE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>

                    <div className="ts-params">
                      {paramDefs.map(pd => (
                        <div key={pd.key} className="ts-param">
                          <label className="ts-param-label">{pd.label}: {params[pd.key]?.toFixed(pd.step < 1 ? 2 : 0) ?? '—'}</label>
                          <input type="range" min={pd.min} max={pd.max} step={pd.step} value={params[pd.key] ?? pd.min} onChange={e => updateShapeParam(slot, pd.key, Number(e.target.value))} />
                        </div>
                      ))}
                    </div>

                    <div className="ts-color-row">
                      <input type="color" value={color} onChange={e => updateColor(slot, e.target.value)} className="ts-color-picker" />
                      <div className="ts-swatches">
                        {COLOR_PRESETS.map(c => <button key={c} className="ts-swatch" style={{ background: c }} onClick={() => updateColor(slot, c)} />)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ──

const PANEL_ORDER = ['stroke', 'ellipseSigmoid', 'polygon', 'teardrop', 'chimeraStyle', 'chimeraReal'];

export default function TechniqueShowcase() {
  const [configs, setConfigs] = useState<Record<string, TechniqueConfig>>(defaultConfigs);

  const updateConfig = useCallback((id: string, updater: (prev: TechniqueConfig) => TechniqueConfig) => {
    setConfigs(prev => ({ ...prev, [id]: updater(prev[id]) }));
  }, []);

  return (
    <>
      <style>{styles}</style>
      <div className="ts-page">
        <h1 className="ts-title">Technique Showcase</h1>
        <p className="ts-subtitle">
          Each technique is an independent panel with its own sliders and color controls.
          All rendered through the real production composer. ★ = current production technique.
        </p>
        <div className="ts-panels">
          {PANEL_ORDER.map(id => (
            <TechniquePanel
              key={id}
              config={configs[id]}
              onChange={(updater) => updateConfig(id, updater)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
