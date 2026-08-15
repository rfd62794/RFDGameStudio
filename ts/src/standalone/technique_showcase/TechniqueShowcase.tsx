/**
 * Technique Showcase — React, through the REAL production composer.
 *
 * Mixes the Character Viewer's polished UI (sidebar, panels, per-slot
 * controls, color swatches, export) with the technique comparison's
 * all-types-at-once approach. Every technique rendered side by side
 * through the real composeFigure() + renderFigureSvg() pipeline.
 *
 * Each technique panel is independently adjustable — primitive type
 * per slot, per-slot params, per-slot colors, seed, body plan.
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

// ── Technique presets (all use same humanoid bones) ──

const STROKE_PRESET: TechniqueConfig = {
  id: 'stroke',
  label: 'Stroke Skeleton',
  description: 'Stroked lines + SDF joint circles',
  bodyPlanId: 'humanoid_bilateral',
  shapeOverrides: {
    head: makeShape('head', 'strokeSkeleton', { widthProximal: 10, widthDistal: 6, jointBlendRadius: 7, jointBlendK: 4 }),
    chest: makeShape('chest', 'strokeSkeleton', { widthProximal: 20, widthDistal: 14, jointBlendRadius: 12, jointBlendK: 5 }),
    left_arm: makeShape('left_arm', 'strokeSkeleton', { widthProximal: 10, widthDistal: 5, jointBlendRadius: 6, jointBlendK: 4 }),
    right_arm: makeShape('right_arm', 'strokeSkeleton', { widthProximal: 10, widthDistal: 5, jointBlendRadius: 6, jointBlendK: 4 }),
    left_leg: makeShape('left_leg', 'strokeSkeleton', { widthProximal: 12, widthDistal: 6, jointBlendRadius: 7, jointBlendK: 4 }),
    right_leg: makeShape('right_leg', 'strokeSkeleton', { widthProximal: 12, widthDistal: 6, jointBlendRadius: 7, jointBlendK: 4 }),
  },
  colors: { head: '#3b82f6', chest: '#3b82f6', left_arm: '#3b82f6', right_arm: '#3b82f6', left_leg: '#3b82f6', right_leg: '#3b82f6' },
  seed: 42,
  isProduction: true,
};

const ELLIPSE_SIGMOID_PRESET: TechniqueConfig = {
  id: 'ellipse_sigmoid',
  label: 'Ellipse + Sigmoid',
  description: 'Smooth ellipse head + muscle bulge limbs',
  bodyPlanId: 'humanoid_bilateral',
  shapeOverrides: {
    head: makeShape('head', 'ellipse', { rx: 7, ry: 8 }),
    chest: makeShape('chest', 'sigmoidBulge', { widthStart: 18, widthEnd: 9, segments: 8, bulgeFactor: 0.3 }),
    left_arm: makeShape('left_arm', 'sigmoidBulge', { widthStart: 15, widthEnd: 9, segments: 6, bulgeFactor: 0.4 }),
    right_arm: makeShape('right_arm', 'sigmoidBulge', { widthStart: 15, widthEnd: 9, segments: 6, bulgeFactor: 0.4 }),
    left_leg: makeShape('left_leg', 'sigmoidBulge', { widthStart: 11, widthEnd: 10, segments: 6, bulgeFactor: 0.35 }),
    right_leg: makeShape('right_leg', 'sigmoidBulge', { widthStart: 11, widthEnd: 10, segments: 6, bulgeFactor: 0.35 }),
  },
  colors: { head: '#3b82f6', chest: '#3b82f6', left_arm: '#3b82f6', right_arm: '#3b82f6', left_leg: '#3b82f6', right_leg: '#3b82f6' },
  seed: 42,
};

const POLYGON_PRESET: TechniqueConfig = {
  id: 'polygon',
  label: 'Polygon',
  description: 'Vertex-jittered polygons',
  bodyPlanId: 'humanoid_bilateral',
  shapeOverrides: {
    head: makeShape('head', 'polygon', { vertexCount: 6, irregularity: 10, radius: 12 }),
    chest: makeShape('chest', 'polygon', { vertexCount: 6, irregularity: 15, radius: 18 }),
    left_arm: makeShape('left_arm', 'polygon', { vertexCount: 5, irregularity: 20, radius: 10 }),
    right_arm: makeShape('right_arm', 'polygon', { vertexCount: 5, irregularity: 20, radius: 10 }),
    left_leg: makeShape('left_leg', 'polygon', { vertexCount: 5, irregularity: 18, radius: 11 }),
    right_leg: makeShape('right_leg', 'polygon', { vertexCount: 5, irregularity: 18, radius: 11 }),
  },
  colors: { head: '#3b82f6', chest: '#3b82f6', left_arm: '#3b82f6', right_arm: '#3b82f6', left_leg: '#3b82f6', right_leg: '#3b82f6' },
  seed: 42,
};

const TEARDROP_PRESET: TechniqueConfig = {
  id: 'teardrop',
  label: 'TeardropFin',
  description: 'Elongated directional fins for limbs',
  bodyPlanId: 'humanoid_bilateral',
  shapeOverrides: {
    head: makeShape('head', 'polygon', { vertexCount: 6, irregularity: 10, radius: 12 }),
    chest: makeShape('chest', 'polygon', { vertexCount: 6, irregularity: 15, radius: 18 }),
    left_arm: makeShape('left_arm', 'teardropFin', { scale: 0.6, angularity: 30 }),
    right_arm: makeShape('right_arm', 'teardropFin', { scale: 0.6, angularity: 30 }),
    left_leg: makeShape('left_leg', 'teardropFin', { scale: 0.7, angularity: 25 }),
    right_leg: makeShape('right_leg', 'teardropFin', { scale: 0.7, angularity: 25 }),
  },
  colors: { head: '#3b82f6', chest: '#3b82f6', left_arm: '#3b82f6', right_arm: '#3b82f6', left_leg: '#3b82f6', right_leg: '#3b82f6' },
  seed: 42,
};

const CHIMERA_STYLE_PRESET: TechniqueConfig = {
  id: 'chimera_style',
  label: 'Irregular + RadialBurst',
  description: 'Chimera-style: rough fragments + spiky bursts',
  bodyPlanId: 'humanoid_bilateral',
  shapeOverrides: {
    head: makeShape('head', 'irregularFragment', { vertexCount: 7, irregularity: 50, radius: 13 }),
    chest: makeShape('chest', 'irregularFragment', { vertexCount: 8, irregularity: 40, radius: 20 }),
    left_arm: makeShape('left_arm', 'radialBurst', { armCount: 4, radius: 14 }),
    right_arm: makeShape('right_arm', 'radialBurst', { armCount: 5, radius: 16 }),
    left_leg: makeShape('left_leg', 'irregularFragment', { vertexCount: 6, irregularity: 55, radius: 12 }),
    right_leg: makeShape('right_leg', 'irregularFragment', { vertexCount: 7, irregularity: 65, radius: 14 }),
  },
  colors: { head: '#3b82f6', chest: '#3b82f6', left_arm: '#3b82f6', right_arm: '#3b82f6', left_leg: '#3b82f6', right_leg: '#3b82f6' },
  seed: 42,
};

const CHIMERA_REAL_PRESET: TechniqueConfig = {
  id: 'chimera_real',
  label: 'Chimera Asymmetric (real)',
  description: 'Actual chimeraAsymmetric body plan — different bones',
  bodyPlanId: 'chimera_asymmetric',
  shapeOverrides: {},
  colors: { head: '#3b82f6', chest: '#3b82f6', left_arm: '#3b82f6', right_arm: '#3b82f6', left_leg: '#3b82f6', right_leg: '#3b82f6' },
  seed: 42,
};

const ALL_PRESETS = [STROKE_PRESET, ELLIPSE_SIGMOID_PRESET, POLYGON_PRESET, TEARDROP_PRESET, CHIMERA_STYLE_PRESET, CHIMERA_REAL_PRESET];

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

// ── Styles (inline, matching Character Viewer aesthetic) ──

const styles = `
  html { overflow-y: auto; }
  body { background: #0f1117; color: #e0e0e0; font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; }
  .ts-page { padding: 1rem; max-width: 1400px; margin: 0 auto; }
  .ts-title { font-size: 1.3rem; margin: 0; }
  .ts-subtitle { color: #888; font-size: 0.85rem; margin: 0.25rem 0 1rem; }
  .ts-layout { display: flex; gap: 1.5rem; margin-top: 1rem; }
  .ts-sidebar { min-width: 220px; flex-shrink: 0; }
  .ts-sidebar h3 { font-size: 0.85rem; margin: 1rem 0 0.5rem; color: #aaa; }
  .ts-sidebar h3:first-child { margin-top: 0; }
  .ts-preset-card { display: flex; flex-direction: column; padding: 0.6rem 0.75rem; margin-bottom: 0.5rem; cursor: pointer; background: #1a1d28; border: 1px solid #2a3040; border-radius: 6px; transition: border-color 0.15s; }
  .ts-preset-card:hover { border-color: #4a5070; }
  .ts-preset-card.selected { border-color: #3b82f6; background: #1a2235; }
  .ts-preset-card.production { border-color: #10b981; }
  .ts-preset-card.production.selected { border-color: #10b981; background: #0f2a1a; }
  .ts-preset-name { font-size: 0.85rem; font-weight: 600; }
  .ts-preset-desc { font-size: 0.7rem; color: #888; margin-top: 2px; }
  .ts-detail { flex: 1; min-width: 0; }
  .ts-figure-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
  .ts-figure-card { background: #1a1d28; border: 2px solid #2a3040; border-radius: 8px; padding: 0.75rem; }
  .ts-figure-card.selected { border-color: #3b82f6; }
  .ts-figure-card.production { border-color: #10b981; }
  .ts-figure-card.production.selected { border-color: #10b981; }
  .ts-figure-label { font-size: 0.85rem; margin-bottom: 0.5rem; text-align: center; font-weight: 600; }
  .ts-figure-desc { font-size: 0.7rem; color: #888; text-align: center; margin-bottom: 0.5rem; }
  .ts-figure-render { display: flex; justify-content: center; align-items: center; height: 200px; overflow: hidden; background: #0f1117; border-radius: 4px; cursor: pointer; }
  .ts-figure-render svg { max-width: 100%; max-height: 100%; }
  .ts-figure-render.selected { outline: 2px solid #3b82f6; }
  .ts-controls { background: #1a1d28; border: 1px solid #2a3040; border-radius: 8px; padding: 1rem; margin-top: 1rem; }
  .ts-controls-header { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.75rem; color: #3b82f6; }
  .ts-slots { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.6rem; }
  .ts-slot-card { background: #0f1117; border: 1px solid #2a3040; border-radius: 6px; padding: 0.6rem; }
  .ts-slot-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }
  .ts-slot-name { font-weight: bold; text-transform: capitalize; font-size: 0.8rem; }
  .ts-select { padding: 0.2rem 0.4rem; background: #2a3040; color: #e0e0e0; border: 1px solid #4a5070; border-radius: 4px; font-size: 0.7rem; }
  .ts-params { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.4rem; }
  .ts-param { display: flex; flex-direction: column; gap: 0.15rem; }
  .ts-param-label { font-size: 0.65rem; color: #aaa; }
  .ts-param input[type="range"] { width: 100%; accent-color: #3b82f6; }
  .ts-color-row { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
  .ts-color-picker { width: 24px; height: 24px; border: 1px solid #4a5070; border-radius: 4px; cursor: pointer; background: none; padding: 0; }
  .ts-swatches { display: flex; gap: 0.15rem; flex-wrap: wrap; }
  .ts-swatch { width: 14px; height: 14px; border: 1px solid #4a5070; border-radius: 3px; cursor: pointer; padding: 0; }
  .ts-swatch:hover { border-color: #3b82f6; }
  .ts-global-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
  .ts-btn { padding: 0.3rem 0.8rem; background: #2a3040; color: #e0e0e0; border: 1px solid #4a5070; border-radius: 4px; cursor: pointer; font-size: 0.75rem; }
  .ts-btn:hover { border-color: #3b82f6; }
  .ts-btn.active { background: #1a2235; border-color: #3b82f6; color: #3b82f6; }
  .ts-btn.production { border-color: #10b981; color: #10b981; }
  .ts-btn.production.active { background: #0f2a1a; }
  .ts-seed { font-size: 0.8rem; color: #aaa; }
  .ts-seed input[type="range"] { width: 120px; accent-color: #3b82f6; margin-left: 0.5rem; }
  .ts-export { margin-top: 1rem; }
  .ts-export pre { background: #0a0c12; border: 1px solid #2a3040; border-radius: 4px; padding: 0.5rem; font-size: 0.7rem; overflow: auto; max-height: 200px; color: #a5d6ff; }
`;

// ── Main Component ──

export default function TechniqueShowcase() {
  const [configs, setConfigs] = useState<Record<string, TechniqueConfig>>(
    Object.fromEntries(ALL_PRESETS.map(p => [p.id, { ...p, shapeOverrides: { ...p.shapeOverrides }, colors: { ...p.colors } }]))
  );
  const [selectedId, setSelectedId] = useState<string>('stroke');
  const [showExport, setShowExport] = useState(false);

  const selected = configs[selectedId];

  const updateConfig = useCallback((id: string, updater: (prev: TechniqueConfig) => TechniqueConfig) => {
    setConfigs(prev => ({ ...prev, [id]: updater(prev[id]) }));
  }, []);

  const updateShapeOverride = useCallback((slot: PartSlot, primitive: PrimitiveType) => {
    updateConfig(selectedId, prev => ({
      ...prev,
      shapeOverrides: {
        ...prev.shapeOverrides,
        [slot]: { slot, primitive, baseParams: prev.shapeOverrides[slot]?.baseParams ?? PRIMITIVE_PARAMS[primitive].reduce((acc, p) => ({ ...acc, [p.key]: (p.min + p.max) / 2 }), {}) },
      },
    }));
  }, [selectedId, updateConfig]);

  const updateShapeParam = useCallback((slot: PartSlot, paramKey: string, value: number) => {
    updateConfig(selectedId, prev => {
      const existing = prev.shapeOverrides[slot];
      if (!existing) return prev;
      return { ...prev, shapeOverrides: { ...prev.shapeOverrides, [slot]: { ...existing, baseParams: { ...existing.baseParams, [paramKey]: value } } } };
    });
  }, [selectedId, updateConfig]);

  const updateColor = useCallback((slot: PartSlot, color: string) => {
    updateConfig(selectedId, prev => ({ ...prev, colors: { ...prev.colors, [slot]: color } }));
  }, [selectedId, updateConfig]);

  const updateSeed = useCallback((seed: number) => {
    updateConfig(selectedId, prev => ({ ...prev, seed }));
  }, [selectedId, updateConfig]);

  const updateBodyPlan = useCallback((planId: 'humanoid_bilateral' | 'chimera_asymmetric') => {
    updateConfig(selectedId, prev => ({ ...prev, bodyPlanId: planId }));
  }, [selectedId, updateConfig]);

  const resetPreset = useCallback((preset: TechniqueConfig) => {
    updateConfig(preset.id, () => ({ ...preset, shapeOverrides: { ...preset.shapeOverrides }, colors: { ...preset.colors } }));
  }, [updateConfig]);

  const exportConfig = useMemo(() => {
    return JSON.stringify({
      id: selected.id,
      label: selected.label,
      bodyPlanId: selected.bodyPlanId,
      shapeMappings: PART_SLOTS.map(slot => selected.shapeOverrides[slot]),
      colors: selected.colors,
      seed: selected.seed,
    }, null, 2);
  }, [selected]);

  return (
    <>
      <style>{styles}</style>
      <div className="ts-page">
        <h1 className="ts-title">Technique Showcase</h1>
        <p className="ts-subtitle">All techniques through the real production composer — interactive, side by side. Click a figure to edit its slots.</p>

        <div className="ts-layout">
          {/* Sidebar: technique selector */}
          <div className="ts-sidebar">
            <h3>Techniques</h3>
            {ALL_PRESETS.map(preset => (
              <div
                key={preset.id}
                className={`ts-preset-card ${selectedId === preset.id ? 'selected' : ''} ${preset.isProduction ? 'production' : ''}`}
                onClick={() => setSelectedId(preset.id)}
              >
                <span className="ts-preset-name">{preset.label}{preset.isProduction ? ' ★' : ''}</span>
                <span className="ts-preset-desc">{preset.description}</span>
              </div>
            ))}

            <h3>Reset Selected</h3>
            <button className="ts-btn" onClick={() => resetPreset(ALL_PRESETS.find(p => p.id === selectedId)!)}>Reset to default</button>
          </div>

          {/* Detail: figures + controls */}
          <div className="ts-detail">
            {/* All figures side by side */}
            <div className="ts-figure-grid">
              {ALL_PRESETS.map(preset => {
                const config = configs[preset.id];
                const svg = renderFigureSvg(buildInput(config), 200, 200);
                return (
                  <div
                    key={preset.id}
                    className={`ts-figure-card ${selectedId === preset.id ? 'selected' : ''} ${preset.isProduction ? 'production' : ''}`}
                    onClick={() => setSelectedId(preset.id)}
                  >
                    <div className="ts-figure-label">{preset.label}{preset.isProduction ? ' ★' : ''}</div>
                    <div className="ts-figure-desc">{preset.description}</div>
                    <div className={`ts-figure-render ${selectedId === preset.id ? 'selected' : ''}`} dangerouslySetInnerHTML={{ __html: svg }} />
                  </div>
                );
              })}
            </div>

            {/* Controls for the selected technique */}
            <div className="ts-controls">
              <div className="ts-controls-header">Editing: {selected.label}</div>

              <div className="ts-global-row">
                <span style={{ fontSize: '0.8rem', color: '#aaa' }}>Body Plan:</span>
                <button className={`ts-btn ${selected.bodyPlanId === 'humanoid_bilateral' ? 'active' : ''}`} onClick={() => updateBodyPlan('humanoid_bilateral')}>Humanoid</button>
                <button className={`ts-btn ${selected.bodyPlanId === 'chimera_asymmetric' ? 'active' : ''}`} onClick={() => updateBodyPlan('chimera_asymmetric')}>Chimera</button>
                <span className="ts-seed">Seed: {selected.seed}<input type="range" min={0} max={999} value={selected.seed} onChange={e => updateSeed(Number(e.target.value))} /></span>
              </div>

              <div className="ts-slots">
                {PART_SLOTS.map(slot => {
                  const override = selected.shapeOverrides[slot];
                  const base = (selected.bodyPlanId === 'humanoid_bilateral' ? humanoidBilateral : chimeraAsymmetric).shapeMappings.find(sm => sm.slot === slot);
                  const primitive = (override?.primitive ?? base?.primitive ?? 'polygon') as PrimitiveType;
                  const params = override?.baseParams ?? base?.baseParams ?? {};
                  const color = selected.colors[slot] ?? '#888';
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

              <div className="ts-export">
                <button className="ts-btn" onClick={() => setShowExport(!showExport)}>{showExport ? 'Hide' : 'Show'} Export</button>
                {showExport && <pre>{exportConfig}</pre>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
