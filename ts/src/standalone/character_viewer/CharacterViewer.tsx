/**
 * Character Viewer — Paper Doll Shape Iteration Tool
 *
 * A dev-only surface for iterating on the Paper Doll module's actual
 * shapes at real size, side by side, with live controls. Consumes the
 * real, unmodified paperDoll module exactly as MBB and Chimera Wilds
 * do — via renderFigureSvg with a CompositionInput.
 *
 * Access: http://localhost:5173/src/standalone/character_viewer/index.html
 *
 * Three reference-informed presets:
 *   - Bionicle: clean, distinct-silhouette proportions (Brand axis)
 *   - Giger: organic/mechanical blending (Cyber/Organic axis)
 *   - Frankenstein: deliberate asymmetry, visible mismatch (Quality axis)
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

// ── Types ────────────────────────────────────────────────────────────

type PrimitiveType = 'polygon' | 'radialBurst' | 'teardropFin' | 'irregularFragment' | 'sigmoidBulge';

interface ViewerConfig {
  id: string;
  label: string;
  bodyPlanId: 'humanoid_bilateral' | 'chimera_asymmetric';
  shapeOverrides: Record<string, SlotShapeMapping>;
  colors: Record<string, string>;
  seed: number;
}

// ── Default parts (dummy parts for all 6 slots) ──────────────────────

function makeDummyParts(): Record<string, PartForComposition | null> {
  const parts: Record<string, PartForComposition | null> = {};
  for (const slot of PART_SLOTS) {
    parts[slot] = { id: `dummy_${slot}`, name: slot, slot };
  }
  return parts;
}

const DUMMY_PARTS = makeDummyParts();

// ── Reference presets ────────────────────────────────────────────────
//
// Three presets reflecting the three real visual reference axes:
//   - Bionicle: clean polygons, distinct silhouette, uniform color
//   - Giger: teardropFin (mechanical) + irregularFragment (organic),
//     dark metallic palette
//   - Frankenstein: mixed primitives, high irregularity, mismatched colors

function makeShapeMapping(slot: PartSlot, primitive: PrimitiveType, params: Record<string, number>): SlotShapeMapping {
  return { slot, primitive, baseParams: params };
}

const BIONICLE_PRESET: ViewerConfig = {
  id: 'bionicle',
  label: 'Bionicle (Brand/silhouette)',
  bodyPlanId: 'humanoid_bilateral',
  shapeOverrides: {
    head: makeShapeMapping('head', 'polygon', { vertexCount: 6, irregularity: 5, radius: 16 }),
    chest: makeShapeMapping('chest', 'polygon', { vertexCount: 5, irregularity: 5, radius: 20 }),
    left_arm: makeShapeMapping('left_arm', 'teardropFin', { scale: 0.55, angularity: 40 }),
    right_arm: makeShapeMapping('right_arm', 'teardropFin', { scale: 0.55, angularity: 40 }),
    left_leg: makeShapeMapping('left_leg', 'teardropFin', { scale: 0.6, angularity: 30 }),
    right_leg: makeShapeMapping('right_leg', 'teardropFin', { scale: 0.6, angularity: 30 }),
  },
  colors: {
    head: '#1e88e5',
    chest: '#1e88e5',
    left_arm: '#1e88e5',
    right_arm: '#1e88e5',
    left_leg: '#1e88e5',
    right_leg: '#1e88e5',
  },
  seed: 100,
};

const GIGER_PRESET: ViewerConfig = {
  id: 'giger',
  label: 'Giger (Cyber/Organic)',
  bodyPlanId: 'humanoid_bilateral',
  shapeOverrides: {
    head: makeShapeMapping('head', 'irregularFragment', { vertexCount: 9, irregularity: 30, radius: 15 }),
    chest: makeShapeMapping('chest', 'teardropFin', { scale: 0.8, angularity: 80 }),
    left_arm: makeShapeMapping('left_arm', 'teardropFin', { scale: 0.6, angularity: 90 }),
    right_arm: makeShapeMapping('right_arm', 'teardropFin', { scale: 0.6, angularity: 90 }),
    left_leg: makeShapeMapping('left_leg', 'irregularFragment', { vertexCount: 8, irregularity: 40, radius: 18 }),
    right_leg: makeShapeMapping('right_leg', 'irregularFragment', { vertexCount: 8, irregularity: 40, radius: 18 }),
  },
  colors: {
    head: '#37474f',
    chest: '#263238',
    left_arm: '#455a64',
    right_arm: '#455a64',
    left_leg: '#37474f',
    right_leg: '#37474f',
  },
  seed: 200,
};

const FRANKENSTEIN_PRESET: ViewerConfig = {
  id: 'frankenstein',
  label: 'Frankenstein (Quality/asymmetry)',
  bodyPlanId: 'chimera_asymmetric',
  shapeOverrides: {
    head: makeShapeMapping('head', 'irregularFragment', { vertexCount: 7, irregularity: 70, radius: 14 }),
    chest: makeShapeMapping('chest', 'polygon', { vertexCount: 8, irregularity: 50, radius: 19 }),
    left_arm: makeShapeMapping('left_arm', 'radialBurst', { armCount: 4, radius: 16 }),
    right_arm: makeShapeMapping('right_arm', 'teardropFin', { scale: 0.5, angularity: 10 }),
    left_leg: makeShapeMapping('left_leg', 'irregularFragment', { vertexCount: 6, irregularity: 80, radius: 15 }),
    right_leg: makeShapeMapping('right_leg', 'polygon', { vertexCount: 5, irregularity: 60, radius: 17 }),
  },
  colors: {
    head: '#558b2f',
    chest: '#8d6e63',
    left_arm: '#6d4c41',
    right_arm: '#558b2f',
    left_leg: '#8d6e63',
    right_leg: '#6d4c41',
  },
  seed: 300,
};

const PRESETS = [BIONICLE_PRESET, GIGER_PRESET, FRANKENSTEIN_PRESET];

// ── Helper: build a real BodyPlan from a base + shape overrides ──────

function buildBodyPlan(config: ViewerConfig): BodyPlan {
  const base = config.bodyPlanId === 'humanoid_bilateral' ? humanoidBilateral : chimeraAsymmetric;
  // Clone the base plan, replacing shapeMappings with the overrides
  return {
    ...base,
    shapeMappings: PART_SLOTS.map(slot => config.shapeOverrides[slot] ?? base.shapeMappings.find(sm => sm.slot === slot)!),
  };
}

// ── Helper: build a CompositionInput from a ViewerConfig ─────────────

function buildCompositionInput(config: ViewerConfig): CompositionInput {
  return {
    bodyPlan: buildBodyPlan(config),
    parts: DUMMY_PARTS,
    colors: config.colors,
    seed: config.seed,
  };
}

// ── Primitive param definitions (for live controls) ──────────────────

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
};

const PRIMITIVE_OPTIONS: PrimitiveType[] = ['polygon', 'radialBurst', 'teardropFin', 'irregularFragment', 'sigmoidBulge'];

const COLOR_PRESETS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280', '#1e293b', '#37474f', '#558b2f', '#8d6e63', '#6d4c41'];

// ── Main Component ───────────────────────────────────────────────────

export default function CharacterViewer() {
  const [leftConfig, setLeftConfig] = useState<ViewerConfig>(BIONICLE_PRESET);
  const [rightConfig, setRightConfig] = useState<ViewerConfig>(FRANKENSTEIN_PRESET);
  const [activePanel, setActivePanel] = useState<'left' | 'right'>('left');
  const [showExport, setShowExport] = useState(false);

  const activeConfig = activePanel === 'left' ? leftConfig : rightConfig;
  const setActiveConfig = activePanel === 'left' ? setLeftConfig : setRightConfig;

  const leftSvg = useMemo(() => renderFigureSvg(buildCompositionInput(leftConfig), 400, 400), [leftConfig]);
  const rightSvg = useMemo(() => renderFigureSvg(buildCompositionInput(rightConfig), 400, 400), [rightConfig]);

  // ── Config update helpers ──

  const updateShapeOverride = useCallback((slot: PartSlot, primitive: PrimitiveType, params?: Record<string, number>) => {
    setActiveConfig(prev => ({
      ...prev,
      shapeOverrides: {
        ...prev.shapeOverrides,
        [slot]: {
          slot,
          primitive,
          baseParams: params ?? prev.shapeOverrides[slot]?.baseParams ?? {},
        },
      },
    }));
  }, [setActiveConfig]);

  const updateShapeParam = useCallback((slot: PartSlot, paramKey: string, value: number) => {
    setActiveConfig(prev => {
      const existing = prev.shapeOverrides[slot];
      if (!existing) return prev;
      return {
        ...prev,
        shapeOverrides: {
          ...prev.shapeOverrides,
          [slot]: {
            ...existing,
            baseParams: { ...existing.baseParams, [paramKey]: value },
          },
        },
      };
    });
  }, [setActiveConfig]);

  const updateColor = useCallback((slot: PartSlot, color: string) => {
    setActiveConfig(prev => ({
      ...prev,
      colors: { ...prev.colors, [slot]: color },
    }));
  }, [setActiveConfig]);

  const updateBodyPlan = useCallback((planId: 'humanoid_bilateral' | 'chimera_asymmetric') => {
    setActiveConfig(prev => ({ ...prev, bodyPlanId: planId }));
  }, [setActiveConfig]);

  const updateSeed = useCallback((seed: number) => {
    setActiveConfig(prev => ({ ...prev, seed }));
  }, [setActiveConfig]);

  const loadPreset = useCallback((preset: ViewerConfig) => {
    setActiveConfig(() => ({ ...preset }));
  }, [setActiveConfig]);

  // ── Export ──

  const exportConfig = useMemo(() => {
    const config = activeConfig;
    return JSON.stringify({
      id: config.id,
      label: config.label,
      bodyPlanId: config.bodyPlanId,
      shapeMappings: PART_SLOTS.map(slot => config.shapeOverrides[slot]),
      colors: config.colors,
      seed: config.seed,
    }, null, 2);
  }, [activeConfig]);

  return (
    <div className="character-viewer">
      <header className="cv-header">
        <h1>Character Viewer</h1>
        <p className="cv-subtitle">Paper Doll Shape Iteration Tool — dev-only</p>
      </header>

      {/* Side-by-side comparison */}
      <div className="cv-comparison">
        <div
          className={`cv-figure-panel ${activePanel === 'left' ? 'active' : ''}`}
          onClick={() => setActivePanel('left')}
        >
          <div className="cv-figure-label">Left — {leftConfig.label}</div>
          <div className="cv-figure-render" dangerouslySetInnerHTML={{ __html: leftSvg }} />
        </div>
        <div
          className={`cv-figure-panel ${activePanel === 'right' ? 'active' : ''}`}
          onClick={() => setActivePanel('right')}
        >
          <div className="cv-figure-label">Right — {rightConfig.label}</div>
          <div className="cv-figure-render" dangerouslySetInnerHTML={{ __html: rightSvg }} />
        </div>
      </div>

      {/* Controls for the active panel */}
      <div className="cv-controls">
        <div className="cv-controls-header">
          <h2>Controls — {activePanel} panel</h2>
          <button className="cv-btn" onClick={() => setShowExport(!showExport)}>
            {showExport ? 'Hide Export' : 'Show Export'}
          </button>
        </div>

        {/* Preset selector */}
        <div className="cv-control-group">
          <label className="cv-label">Preset (reference axes)</label>
          <div className="cv-preset-row">
            {PRESETS.map(preset => (
              <button
                key={preset.id}
                className="cv-preset-btn"
                onClick={() => loadPreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body Plan selector */}
        <div className="cv-control-group">
          <label className="cv-label">Body Plan</label>
          <div className="cv-btn-row">
            <button
              className={`cv-btn ${activeConfig.bodyPlanId === 'humanoid_bilateral' ? 'selected' : ''}`}
              onClick={() => updateBodyPlan('humanoid_bilateral')}
            >
              humanoid_bilateral
            </button>
            <button
              className={`cv-btn ${activeConfig.bodyPlanId === 'chimera_asymmetric' ? 'selected' : ''}`}
              onClick={() => updateBodyPlan('chimera_asymmetric')}
            >
              chimera_asymmetric
            </button>
          </div>
        </div>

        {/* Seed control */}
        <div className="cv-control-group">
          <label className="cv-label">Seed: {activeConfig.seed}</label>
          <input
            type="range"
            min={0}
            max={999}
            step={1}
            value={activeConfig.seed}
            onChange={e => updateSeed(Number(e.target.value))}
          />
        </div>

        {/* Per-slot controls */}
        <div className="cv-slots">
          {PART_SLOTS.map(slot => {
            const override = activeConfig.shapeOverrides[slot];
            const primitive = override?.primitive ?? 'polygon';
            const params = override?.baseParams ?? {};
            const color = activeConfig.colors[slot] ?? '#888';
            const paramDefs = PRIMITIVE_PARAMS[primitive];

            return (
              <div key={slot} className="cv-slot-control">
                <div className="cv-slot-header">
                  <span className="cv-slot-name">{slot.replace('_', ' ')}</span>
                  <select
                    value={primitive}
                    onChange={e => updateShapeOverride(slot, e.target.value as PrimitiveType)}
                    className="cv-select"
                  >
                    {PRIMITIVE_OPTIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Shape params */}
                <div className="cv-params">
                  {paramDefs.map(pd => (
                    <div key={pd.key} className="cv-param">
                      <label className="cv-param-label">
                        {pd.label}: {params[pd.key]?.toFixed(pd.step < 1 ? 2 : 0) ?? '—'}
                      </label>
                      <input
                        type="range"
                        min={pd.min}
                        max={pd.max}
                        step={pd.step}
                        value={params[pd.key] ?? 0}
                        onChange={e => updateShapeParam(slot, pd.key, Number(e.target.value))}
                      />
                    </div>
                  ))}
                </div>

                {/* Color control */}
                <div className="cv-color-row">
                  <label className="cv-param-label">Color</label>
                  <input
                    type="color"
                    value={color}
                    onChange={e => updateColor(slot, e.target.value)}
                    className="cv-color-picker"
                  />
                  <div className="cv-color-swatches">
                    {COLOR_PRESETS.map(c => (
                      <button
                        key={c}
                        className="cv-swatch"
                        style={{ background: c }}
                        onClick={() => updateColor(slot, c)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Export */}
        {showExport && (
          <div className="cv-export">
            <h3>Exported Config (SlotShapeMapping set)</h3>
            <pre className="cv-export-code">{exportConfig}</pre>
            <button
              className="cv-btn"
              onClick={() => navigator.clipboard.writeText(exportConfig)}
            >
              Copy to clipboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
