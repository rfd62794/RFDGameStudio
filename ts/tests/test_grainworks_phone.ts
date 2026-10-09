import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BUILDING_DEFS } from '../src/games/grainworks/simulation/buildingDefs';
import { isUnlocked, unlockedDefs } from '../src/games/grainworks/components/buildPanelVisibility';

const GAME = resolve(import.meta.dirname, '../src/games/grainworks');
const read = (rel: string) => readFileSync(resolve(GAME, rel), 'utf8');

describe('GrainWorks progressive build panel', () => {
  it('shows only the 10 Tier 1 tools at Tier 1', () => {
    const shown = unlockedDefs(BUILDING_DEFS, 1).map((d) => d.id);
    expect(shown).toHaveLength(10);
    expect(shown).toContain('collector_dust');
    expect(shown).toContain('processor_compressor');
    expect(shown).not.toContain('collector_universal');
    expect(shown).not.toContain('processor_condenser');
    expect(shown).not.toContain('processor_plasma_forge');
  });

  it('reveals everything by Tier 3', () => {
    expect(unlockedDefs(BUILDING_DEFS, 3)).toHaveLength(BUILDING_DEFS.length);
    expect(isUnlocked({ unlockedAtTier: 2 }, 1)).toBe(false);
    expect(isUnlocked({ unlockedAtTier: 2 }, 2)).toBe(true);
  });

  it('BuildPanel filters its lists through unlockedDefs', () => {
    const panel = read('components/BuildPanel.tsx');
    expect(panel).toContain('const available = unlockedDefs(BUILDING_DEFS, currentTier);');
  });
});

describe('GrainWorks phone input and layout', () => {
  it('uses pointer events with touch-action none on the canvas', () => {
    const app = read('App.tsx');
    for (const handler of ['onPointerDown', 'onPointerMove', 'onPointerUp', 'onPointerCancel', 'onPointerLeave']) {
      expect(app, handler).toContain(handler);
    }
    expect(app).not.toContain('onMouseDown=');
    expect(app).toContain('touch-none');
  });

  it('has a Pan tool that drags the view', () => {
    expect(read('components/BuildPanel.tsx')).toContain("'BUILD' | 'DEMOLISH' | 'PAINT' | 'PAN'");
    expect(read('components/BuildPanel.tsx')).toContain('id="tool-pan"');
    expect(read('hooks/useCanvasInput.ts')).toContain("if (toolMode === 'PAN') {");
  });

  it('stacks the panel under the canvas on phones and beside it from md up', () => {
    const app = read('App.tsx');
    expect(app).toContain('flex-1 flex flex-col md:flex-row overflow-hidden relative');
    expect(app).toContain('w-full md:w-80 h-72 md:h-full');
    expect(read('components/BuildPanel.tsx')).toContain('w-full md:w-80');
    expect(read('components/ReconstructionCatalog.tsx')).toContain('w-full md:w-80');
  });

  it('shows a dismissible first-goal card at Tier 1 before any solid is stored', () => {
    const app = read('App.tsx');
    expect(app).toContain('currentTier === 1 && !goalCardDismissed');
    const card = read('components/FirstGoalCard.tsx');
    expect(card).toContain('Your first goal: collect 100 Structural Solid');
    expect(card).toContain('id="first-goal-dismiss"');
  });

  it('keeps App.tsx under 600 lines', () => {
    expect(read('App.tsx').split('\n').length).toBeLessThanOrEqual(600);
  });
});
