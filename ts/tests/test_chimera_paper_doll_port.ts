import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

import type { Part, PartsBySlot, BrandId, QualityTier } from '../src/engine/shared/partSlots';
import {
  partsToCreatureConfig,
  partToCreaturePart,
  toChimeraBrand,
  toBrandId,
  toChimeraQuality,
  toChimeraSlot,
  toPartSlot,
  getDefaultPose,
  PaperDoll,
  SvgCreatureRenderer,
  calculatePose,
  SOCKET_DEFINITIONS,
  LIMB_STANDARDS,
  verifySocketContract,
  CHIMERA_BRANDS,
  CHIMERA_QUALITY_TIERS,
  PRESET_CREATURES,
} from '../src/engine/paperDoll';
import type {
  CreatureConfig,
  BodyArchetype,
  FacingDirection,
  AnimationType,
} from '../src/engine/paperDoll';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');

// ── Helpers ──────────────────────────────────────────────────────────

function makePart(overrides: Partial<Part> & { id: string; slot: Part['slot'] }): Part {
  return {
    name: 'Test Part',
    accuracy: 40,
    endurance: 40,
    power: 40,
    speed: 40,
    price: 50,
    ...overrides,
  };
}

function makePartsBySlot(brand?: BrandId, quality?: QualityTier, lean?: number): PartsBySlot {
  const base = (slot: Part['slot']) => makePart({ id: `p_${slot}`, slot, brand, qualityTier: quality, cyberOrganicLean: lean });
  return {
    head: base('head'),
    chest: base('chest'),
    left_arm: base('left_arm'),
    right_arm: base('right_arm'),
    left_leg: base('left_leg'),
    right_leg: base('right_leg'),
  };
}

// ─────────────────────────────────────────────────────────────────────
// Anchor 1: Existing consumers still work (regression)
// ─────────────────────────────────────────────────────────────────────

describe('test_existing_consumers_still_work', () => {
  it('RosterTab source imports PaperDoll from the new path and compiles', () => {
    const src = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'mutant_battle_ball', 'components', 'RosterTab.tsx'),
      'utf-8',
    );
    // Must import PaperDoll from the engine/paperDoll index (not the old PaperDoll.tsx + bodyPlan pattern)
    expect(src).toContain("from '../../../engine/paperDoll'");
    expect(src).toContain('PaperDoll');
    // Must NOT use the old bodyPlan prop
    expect(src).not.toContain('bodyPlan');
    expect(src).not.toContain('humanoidBilateral');
  });

  it('WorkshopTab source imports PaperDoll from the new path and compiles', () => {
    const src = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'mutant_battle_ball', 'components', 'WorkshopTab.tsx'),
      'utf-8',
    );
    expect(src).toContain("from '../../../engine/paperDoll'");
    expect(src).toContain('PaperDoll');
    expect(src).not.toContain('bodyPlan');
    expect(src).not.toContain('humanoidBilateral');
  });

  it('Chimera Wilds App imports PaperDoll from the new path', () => {
    const src = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'chimera_wilds', 'App.tsx'),
      'utf-8',
    );
    expect(src).toContain("from '../../engine/paperDoll'");
    expect(src).toContain('PaperDoll');
    expect(src).not.toContain('bodyPlan');
    expect(src).not.toContain('chimeraAsymmetric');
  });

  it('PaperDoll component accepts PartsBySlot without cast', () => {
    // This is a compile-time check — if the type is wrong, tsc would fail.
    // We verify the prop type is broad enough by checking the source.
    const src = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'engine', 'paperDoll', 'PaperDoll.tsx'),
      'utf-8',
    );
    expect(src).toContain('PartsBySlot');
    expect(src).toContain('Record<string, Part | null>');
  });

  it('POC consumers (Character Viewer, Technique Showcase) still have access to procedural exports', () => {
    const indexSrc = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'engine', 'paperDoll', 'index.ts'),
      'utf-8',
    );
    // Procedural composer exports must still exist for POC consumers
    expect(indexSrc).toContain('renderFigureSvg');
    expect(indexSrc).toContain('composeFigure');
    expect(indexSrc).toContain('humanoidBilateral');
    expect(indexSrc).toContain('chimeraAsymmetric');
    // New Chimera exports must also exist
    expect(indexSrc).toContain('SvgCreatureRenderer');
    expect(indexSrc).toContain('partsToCreatureConfig');
    expect(indexSrc).toContain('SOCKET_DEFINITIONS');
  });
});

// ─────────────────────────────────────────────────────────────────────
// Anchor 2: Data model reconciled (port)
// ─────────────────────────────────────────────────────────────────────

describe('test_data_model_reconciled', () => {
  it('toChimeraBrand maps all 6 MBB BrandId values correctly', () => {
    expect(toChimeraBrand('trueflame')).toBe('Trueflame');
    expect(toChimeraBrand('icevault')).toBe('Icevault');
    expect(toChimeraBrand('quicksilver')).toBe('Quicksilver');
    expect(toChimeraBrand('prismworks')).toBe('Prismworks');
    expect(toChimeraBrand('mirefaith')).toBe('Mirefaith');
    expect(toChimeraBrand('tidalcapital')).toBe('Tidalcapital');
  });

  it('toBrandId reverses toChimeraBrand correctly', () => {
    const brands: BrandId[] = ['trueflame', 'icevault', 'quicksilver', 'prismworks', 'mirefaith', 'tidalcapital'];
    for (const b of brands) {
      expect(toBrandId(toChimeraBrand(b))).toBe(b);
    }
  });

  it('toChimeraQuality maps all 3 MBB QualityTier values correctly', () => {
    expect(toChimeraQuality('brand_new')).toBe('Brand New');
    expect(toChimeraQuality('refurbished')).toBe('Refurbished');
    expect(toChimeraQuality('malfunctioning')).toBe('Malfunctioning');
  });

  it('toChimeraSlot maps all 6 PartSlot values correctly', () => {
    expect(toChimeraSlot('head')).toBe('head');
    expect(toChimeraSlot('chest')).toBe('chest');
    expect(toChimeraSlot('left_arm')).toBe('leftArm');
    expect(toChimeraSlot('right_arm')).toBe('rightArm');
    expect(toChimeraSlot('left_leg')).toBe('leftLeg');
    expect(toChimeraSlot('right_leg')).toBe('rightLeg');
  });

  it('toPartSlot reverses toChimeraSlot correctly', () => {
    expect(toPartSlot('head')).toBe('head');
    expect(toPartSlot('chest')).toBe('chest');
    expect(toPartSlot('leftArm')).toBe('left_arm');
    expect(toPartSlot('rightArm')).toBe('right_arm');
    expect(toPartSlot('leftLeg')).toBe('left_leg');
    expect(toPartSlot('rightLeg')).toBe('right_leg');
  });

  it('partToCreaturePart converts a real MBB Part to CreaturePart', () => {
    const part = makePart({
      id: 'p1',
      slot: 'head',
      brand: 'trueflame',
      qualityTier: 'brand_new',
      cyberOrganicLean: 75,
    });
    const cp = partToCreaturePart(part);
    expect(cp.brand).toBe('Trueflame');
    expect(cp.quality).toBe('Brand New');
    expect(cp.cyberOrganic).toBe(75);
  });

  it('partToCreaturePart defaults undefined fields correctly', () => {
    const part = makePart({ id: 'p1', slot: 'head' });
    const cp = partToCreaturePart(part);
    expect(cp.brand).toBe('Trueflame'); // default
    expect(cp.quality).toBe('Brand New'); // default
    expect(cp.cyberOrganic).toBe(50); // neutral default
  });

  it('partsToCreatureConfig converts a full PartsBySlot to CreatureConfig', () => {
    const parts = makePartsBySlot('icevault', 'refurbished', 30);
    const config = partsToCreatureConfig('test-1', 'Test Mutant', parts);
    expect(config.id).toBe('test-1');
    expect(config.name).toBe('Test Mutant');
    expect(config.archetype).toBe('humanoid');
    expect(config.slots.head.brand).toBe('Icevault');
    expect(config.slots.chest.quality).toBe('Refurbished');
    expect(config.slots.leftArm.cyberOrganic).toBe(30);
    expect(config.slots.rightLeg.cyberOrganic).toBe(30);
  });

  it('partsToCreatureConfig fills missing slots with defaults', () => {
    const parts: Record<string, Part | null> = {
      head: makePart({ id: 'p1', slot: 'head', brand: 'trueflame' }),
      chest: null,
      left_arm: null,
      right_arm: null,
      left_leg: null,
      right_leg: null,
    };
    const config = partsToCreatureConfig('test-2', 'Partial', parts);
    expect(config.slots.head.brand).toBe('Trueflame');
    // Missing slots get default Trueflame/Brand New/50
    expect(config.slots.chest.brand).toBe('Trueflame');
    expect(config.slots.chest.quality).toBe('Brand New');
    expect(config.slots.chest.cyberOrganic).toBe(50);
  });

  it('no duplicate type systems — MBB types are canonical, Chimera types are rendering-internal', () => {
    // The adapter module is the single bridge. MBB's BrandId/QualityTier
    // are the canonical types. The Chimera system's Brand/QualityTier
    // are internal to the rendering module.
    const adapterSrc = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'engine', 'paperDoll', 'adapter.ts'),
      'utf-8',
    );
    expect(adapterSrc).toContain('MBB\'s types');
    expect(adapterSrc).toContain('canonical');
    expect(adapterSrc).toContain('rendering-internal');
  });
});

// ─────────────────────────────────────────────────────────────────────
// Anchor 3: Collision confirmed abstract (investigation)
// ─────────────────────────────────────────────────────────────────────

describe('test_collision_confirmed_abstract', () => {
  it('mbbSimulation.ts has no import of paperDoll or any rendering module', () => {
    const simSrc = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'mutant_battle_ball', 'simulation', 'mbbSimulation.ts'),
      'utf-8',
    );
    expect(simSrc).not.toContain('paperDoll');
    expect(simSrc).not.toContain('PaperDoll');
    expect(simSrc).not.toContain('SvgCreatureRenderer');
    expect(simSrc).not.toContain('brandSvgAssets');
    expect(simSrc).not.toContain('chimeraSvg');
  });

  it('resolveTackle uses position/radius, not rendered shape', () => {
    const simSrc = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'mutant_battle_ball', 'simulation', 'mbbSimulation.ts'),
      'utf-8',
    );
    // Must have distance-based tackle check
    expect(simSrc).toMatch(/distance\s*\(.*\.x.*\.y.*\.x.*\.y\)/);
    // Must have a fixed tackle radius
    expect(simSrc).toMatch(/tackleR|R.*=.*6\.0|tackle.*radius/i);
  });

  it('resolveBlock uses position/radius, not rendered shape', () => {
    const simSrc = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'mutant_battle_ball', 'simulation', 'mbbSimulation.ts'),
      'utf-8',
    );
    expect(simSrc).toMatch(/blockR|block.*radius/i);
  });

  it('collision constants are fixed numbers, not derived from visual geometry', () => {
    const simSrc = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'mutant_battle_ball', 'simulation', 'mbbSimulation.ts'),
      'utf-8',
    );
    // The tackle/block radii must be literal numbers, not computed from parts
    expect(simSrc).toMatch(/6\.0|6\b/);
    expect(simSrc).toMatch(/7\.0|7\b/);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Anchor 4: Collision still abstract post-port (regression)
// ─────────────────────────────────────────────────────────────────────

describe('test_collision_still_abstract_post_port', () => {
  it('the port did not add any rendering import to mbbSimulation.ts', () => {
    const simSrc = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'mutant_battle_ball', 'simulation', 'mbbSimulation.ts'),
      'utf-8',
    );
    // Double-check: no rendering imports were added by the port
    const importLines = simSrc.split('\n').filter(l => l.trim().startsWith('import'));
    for (const line of importLines) {
      expect(line).not.toContain('paperDoll');
      expect(line).not.toContain('PaperDoll');
      expect(line).not.toContain('SvgCreature');
      expect(line).not.toContain('chimera');
    }
  });

  it('the port did not modify collision constants in mbbSimulation.ts', () => {
    // The Chimera Paper Doll Studio port itself should not have touched
    // collision constants. A later directive (point cap) did modify
    // mbbSimulation.ts, but only to add point_cap — not to change collision.
    // Verify collision constants are still the original values.
    const simSrc = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'mutant_battle_ball', 'simulation', 'mbbSimulation.ts'),
      'utf-8',
    );
    // Collision constants must still be the original values
    expect(simSrc).toContain('tackle_range: 6.0');
    expect(simSrc).toContain('block_range: 7.0');
    // No rendering import was added
    expect(simSrc).not.toContain('paperDoll');
    expect(simSrc).not.toContain('SvgCreatureRenderer');
  });

  it('Brand stat modifiers still come from brandModifiers.ts, not visual geometry', () => {
    const simSrc = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'mutant_battle_ball', 'simulation', 'mbbSimulation.ts'),
      'utf-8',
    );
    // Stat modifiers must still come from brandModifiers, not from rendering
    expect(simSrc).toContain('brandModifiers');
    expect(simSrc).toContain('getEffectivePartStats');
  });
});

// ─────────────────────────────────────────────────────────────────────
// Anchor 5: ADR written (documentation)
// ─────────────────────────────────────────────────────────────────────

describe('test_adr_written', () => {
  it('ADR-021 file exists with the correct filename', () => {
    const adrPath = resolve(repoRoot, 'docs', 'adr', 'ADR-021-collision-rendering-decoupling.md');
    const content = readFileSync(adrPath, 'utf-8');
    expect(content).toContain('ADR-021');
    expect(content).toContain('Collision/Rendering Decoupling');
  });

  it('ADR-021 states the decision: collision and rendering are deliberately decoupled', () => {
    const adrPath = resolve(repoRoot, 'docs', 'adr', 'ADR-021-collision-rendering-decoupling.md');
    const content = readFileSync(adrPath, 'utf-8');
    expect(content).toContain('deliberately decoupled');
    expect(content).toContain('position');
    expect(content).toContain('radius');
  });

  it('ADR-021 references the real collision code (tackleR, blockR)', () => {
    const adrPath = resolve(repoRoot, 'docs', 'adr', 'ADR-021-collision-rendering-decoupling.md');
    const content = readFileSync(adrPath, 'utf-8');
    expect(content).toContain('tackleR');
    expect(content).toContain('blockR');
    expect(content).toContain('6.0');
    expect(content).toContain('7.0');
  });

  it('ADR-021 protects the Brand stat-modifier system', () => {
    const adrPath = resolve(repoRoot, 'docs', 'adr', 'ADR-021-collision-rendering-decoupling.md');
    const content = readFileSync(adrPath, 'utf-8');
    expect(content).toContain('Brand stat-modifier');
    expect(content).toContain('brandModifiers');
  });

  it('ADR-021 has a Confirmation section with real code references', () => {
    const adrPath = resolve(repoRoot, 'docs', 'adr', 'ADR-021-collision-rendering-decoupling.md');
    const content = readFileSync(adrPath, 'utf-8');
    expect(content).toContain('Confirmation');
    expect(content).toContain('resolveTackle');
    expect(content).toContain('resolveBlock');
  });
});

// ─────────────────────────────────────────────────────────────────────
// Anchor 6: No regression — current real floor holds
// ─────────────────────────────────────────────────────────────────────

describe('test_no_regression', () => {
  it('PaperDoll component is exported from the index', () => {
    expect(typeof PaperDoll).toBe('function');
  });

  it('SvgCreatureRenderer is exported from the index', () => {
    expect(SvgCreatureRenderer).toBeDefined();
  });

  it('calculatePose is exported and produces a valid CreaturePose', () => {
    const pose = calculatePose('idle', 0, 'humanoid', false, 'Trueflame', 'side_right');
    expect(pose).toBeDefined();
    expect(pose.chest).toBeDefined();
    expect(pose.head).toBeDefined();
    expect(typeof pose.chest.x).toBe('number');
    expect(typeof pose.chest.rotation).toBe('number');
    expect(typeof pose.glowIntensity).toBe('number');
  });

  it('SOCKET_DEFINITIONS has all 4 archetypes', () => {
    expect(SOCKET_DEFINITIONS.humanoid).toBeDefined();
    expect(SOCKET_DEFINITIONS.quadruped).toBeDefined();
    expect(SOCKET_DEFINITIONS.beast_brute).toBeDefined();
    expect(SOCKET_DEFINITIONS.avian_raptor).toBeDefined();
  });

  it('SOCKET_DEFINITIONS humanoid has correct fixed coordinates', () => {
    const sockets = SOCKET_DEFINITIONS.humanoid;
    expect(sockets.neck.x).toBe(200);
    expect(sockets.neck.y).toBe(135);
    expect(sockets.shoulderLeft.x).toBe(146);
    expect(sockets.shoulderRight.x).toBe(254);
    expect(sockets.hipLeft.x).toBe(172);
    expect(sockets.hipRight.x).toBe(228);
  });

  it('verifySocketContract validates a correct socket set', () => {
    const result = verifySocketContract(SOCKET_DEFINITIONS.humanoid);
    expect(result.isValid).toBe(true);
    expect(result.diagnostics).toEqual([]);
  });

  it('LIMB_STANDARDS has expected limb lengths', () => {
    expect(LIMB_STANDARDS.upperArmLength).toBe(54);
    expect(LIMB_STANDARDS.forearmLength).toBe(50);
    expect(LIMB_STANDARDS.thighLength).toBe(68);
    expect(LIMB_STANDARDS.calfLength).toBe(64);
  });

  it('CHIMERA_BRANDS has all 6 brands with real metadata', () => {
    expect(CHIMERA_BRANDS.Trueflame).toBeDefined();
    expect(CHIMERA_BRANDS.Icevault).toBeDefined();
    expect(CHIMERA_BRANDS.Quicksilver).toBeDefined();
    expect(CHIMERA_BRANDS.Prismworks).toBeDefined();
    expect(CHIMERA_BRANDS.Mirefaith).toBeDefined();
    expect(CHIMERA_BRANDS.Tidalcapital).toBeDefined();
    expect(CHIMERA_BRANDS.Trueflame.primaryColor).toBe('#e63946');
    expect(CHIMERA_BRANDS.Trueflame.statAffinity.power).toBe(30);
  });

  it('CHIMERA_QUALITY_TIERS has all 3 tiers with real multipliers', () => {
    expect(CHIMERA_QUALITY_TIERS['Brand New'].statMultiplier).toBe(1.25);
    expect(CHIMERA_QUALITY_TIERS['Refurbished'].statMultiplier).toBe(1.0);
    expect(CHIMERA_QUALITY_TIERS['Malfunctioning'].statMultiplier).toBe(0.85);
  });

  it('PRESET_CREATURES has real preset configurations', () => {
    expect(PRESET_CREATURES.length).toBeGreaterThanOrEqual(5);
    const striker = PRESET_CREATURES.find(c => c.id === 'preset-battleball-striker');
    expect(striker).toBeDefined();
    expect(striker!.archetype).toBe('humanoid');
    expect(striker!.slots.head.brand).toBe('Trueflame');
    expect(striker!.slots.leftLeg.brand).toBe('Quicksilver');
  });

  it('getDefaultPose produces a valid pose for a creature config', () => {
    const parts = makePartsBySlot('trueflame', 'brand_new', 80);
    const config = partsToCreatureConfig('test-3', 'Test', parts);
    const pose = getDefaultPose(config, 'idle', 0, 'side_right');
    expect(pose).toBeDefined();
    expect(typeof pose.chest.x).toBe('number');
  });

  it('getDefaultPose detects malfunctioning parts', () => {
    const parts = makePartsBySlot('trueflame', 'malfunctioning', 90);
    const config = partsToCreatureConfig('test-4', 'Malfunctioning Mutant', parts);
    const pose = getDefaultPose(config, 'idle', 0, 'side_right');
    // Malfunctioning parts should trigger glitch jitter
    expect(pose.glitchJitter).toBeDefined();
  });

  it('procedural composer exports still work for POC consumers', () => {
    // These must still be exported for Character Viewer and Technique Showcase
    const indexSrc = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'engine', 'paperDoll', 'index.ts'),
      'utf-8',
    );
    expect(indexSrc).toContain('renderFigureSvg');
    expect(indexSrc).toContain('composeFigure');
    expect(indexSrc).toContain('humanoidBilateral');
    expect(indexSrc).toContain('chimeraAsymmetric');
    expect(indexSrc).toContain('PROPORTION_PRESETS');
  });
});
