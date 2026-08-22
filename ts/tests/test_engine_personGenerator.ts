import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ARCHETYPE_BASE_SPECS,
  PERSON_ARCHETYPES,
  PersonArchetype,
} from '../src/engine/shared/personGenerator/archetypes';
import {
  generateRoleSymbol,
  archetypeShape,
  archetypePalette,
  DEFAULT_ROLE_SYMBOL_SEED,
} from '../src/engine/shared/personGenerator/roleSymbols';
import { FIGURE_ARCHETYPE_MAP, SuccessionCastId } from '../src/games/succession/data/figureArchetypeMap';
import { FigureId, ClaimantId } from '../src/games/succession/engine/types';

describe('personGenerator v1 — role symbols', () => {
  describe('archetype vocabulary', () => {
    it('test_exactly_five_archetypes', () => {
      expect(PERSON_ARCHETYPES).toHaveLength(5);
      expect([...PERSON_ARCHETYPES].sort()).toEqual(
        ['cleric', 'merchant', 'ruler', 'scholar', 'warrior'],
      );
    });

    it('test_every_archetype_has_a_real_base_spec', () => {
      for (const a of PERSON_ARCHETYPES) {
        const spec = ARCHETYPE_BASE_SPECS[a];
        expect(spec, `base spec for ${a}`).toBeDefined();
        expect(spec.archetype).toBe(a);
        expect(spec.charge.length).toBeGreaterThan(0);
        expect(spec.defaultPalette).toMatch(/^#[0-9a-f]{6}$/i);
        expect(['circle', 'shield', 'diamond', 'hexagon']).toContain(spec.shape);
      }
    });
  });

  describe('generateRoleSymbol determinism', () => {
    it('test_same_archetype_and_seed_produces_byte_identical_output', () => {
      for (const a of PERSON_ARCHETYPES) {
        for (const seed of [0, 1, 7, 42, 999, 0xdeadbeef]) {
          const first = generateRoleSymbol(a, seed);
          const second = generateRoleSymbol(a, seed);
          expect(second).toEqual(first);
        }
      }
    });

    it('test_repeated_calls_within_a_session_are_identical', () => {
      const a: PersonArchetype = 'ruler';
      const first = generateRoleSymbol(a, 123);
      // Call several times — must remain stable (no internal mutable state).
      for (let i = 0; i < 10; i++) {
        expect(generateRoleSymbol(a, 123)).toEqual(first);
      }
    });

    it('test_default_seed_is_stable_and_reproducible', () => {
      const a: PersonArchetype = 'merchant';
      const withDefault = generateRoleSymbol(a);
      const explicit = generateRoleSymbol(a, DEFAULT_ROLE_SYMBOL_SEED);
      expect(withDefault).toEqual(explicit);
    });
  });

  describe('archetype distinctness', () => {
    it('test_different_archetypes_produce_distinct_shapes_or_charges', () => {
      // Distinctness is about the visual identity, not just palette. Two
      // archetypes may share a shape (e.g. cleric & scholar both diamond),
      // so we require the (shape, charge) pair to be unique per archetype.
      const seen = new Map<string, PersonArchetype>();
      for (const a of PERSON_ARCHETYPES) {
        const spec = ARCHETYPE_BASE_SPECS[a];
        const key = `${spec.shape}|${spec.charge}`;
        expect(seen.has(key), `duplicate (shape,charge) for ${a}`).toBe(false);
        seen.set(key, a);
      }
    });

    it('test_different_archetypes_have_distinct_base_palettes', () => {
      const palettes = PERSON_ARCHETYPES.map((a) => ARCHETYPE_BASE_SPECS[a].defaultPalette);
      expect(new Set(palettes).size).toBe(palettes.length);
    });

    it('test_generated_specs_carry_their_archetype_identity', () => {
      for (const a of PERSON_ARCHETYPES) {
        const spec = generateRoleSymbol(a, 5);
        expect(spec.archetype).toBe(a);
        expect(spec.shape).toBe(archetypeShape(a));
      }
    });
  });

  describe('pure helpers', () => {
    it('test_archetypeShape_and_archetypePalette_match_base_specs', () => {
      for (const a of PERSON_ARCHETYPES) {
        expect(archetypeShape(a)).toBe(ARCHETYPE_BASE_SPECS[a].shape);
        expect(archetypePalette(a)).toBe(ARCHETYPE_BASE_SPECS[a].defaultPalette);
      }
    });
  });

  describe('palette sourcing from design tokens', () => {
    it('test_base_palettes_match_tokens_css', () => {
      const tokens = readFileSync(
        resolve(import.meta.dirname, '../src/ui/tokens.css'),
        'utf8',
      );
      const expected: Record<PersonArchetype, string> = {
        ruler: '#6c8ef7', // --accent
        warrior: '#f87171', // --red
        cleric: '#fbbf24', // --yellow
        merchant: '#34d399', // --green
        scholar: '#f59e0b', // --amber
      };
      for (const a of PERSON_ARCHETYPES) {
        const hex = expected[a];
        expect(ARCHETYPE_BASE_SPECS[a].defaultPalette.toLowerCase()).toBe(hex);
        // Confirm the token really exists in tokens.css.
        expect(tokens.toLowerCase()).toContain(hex);
      }
    });
  });

  describe('Succession figure archetype map', () => {
    const CAST_IDS: SuccessionCastId[] = ['chancellor', 'archbishop', 'commander', 'aldric', 'vivienne'];

    it('test_all_five_cast_members_map_to_a_real_archetype', () => {
      for (const id of CAST_IDS) {
        const a = FIGURE_ARCHETYPE_MAP[id];
        expect(a, `archetype for ${id}`).toBeDefined();
        expect(PERSON_ARCHETYPES).toContain(a);
      }
    });

    it('test_court_figures_map_as_expected_from_flavor_text', () => {
      expect(FIGURE_ARCHETYPE_MAP.chancellor).toBe('ruler');
      expect(FIGURE_ARCHETYPE_MAP.archbishop).toBe('cleric');
      expect(FIGURE_ARCHETYPE_MAP.commander).toBe('warrior');
    });

    it('test_rivals_map_to_real_archetypes', () => {
      expect(PERSON_ARCHETYPES).toContain(FIGURE_ARCHETYPE_MAP.aldric);
      expect(PERSON_ARCHETYPES).toContain(FIGURE_ARCHETYPE_MAP.vivienne);
    });

    it('test_player_claimant_is_not_in_the_cast_map', () => {
      // The player's archetype varies by origin and is not a fixed NPC.
      expect((FIGURE_ARCHETYPE_MAP as Record<string, PersonArchetype>)['player']).toBeUndefined();
    });

    it('test_types_align_with_succession_engine_types', () => {
      // Sanity: the cast ids are a real subset of FigureId | ClaimantId.
      const figureIds: FigureId[] = ['chancellor', 'archbishop', 'commander'];
      const claimantIds: ClaimantId[] = ['player', 'aldric', 'vivienne'];
      for (const id of CAST_IDS) {
        expect(figureIds.includes(id as FigureId) || claimantIds.includes(id as ClaimantId)).toBe(true);
      }
    });
  });

  describe('no live Succession UI imports the new module (grep anchor)', () => {
    const LIVE_FILES = [
      'src/games/succession/App.tsx',
      'src/games/succession/components/AudienceStage.tsx',
      'src/games/succession/components/ChamberStage.tsx',
      'src/games/succession/components/FigureCard.tsx',
    ];

    it('test_no_live_succession_component_imports_personGenerator_or_figureArchetypeMap', () => {
      const repoRoot = resolve(import.meta.dirname, '..');
      for (const rel of LIVE_FILES) {
        const path = resolve(repoRoot, rel);
        const src = readFileSync(path, 'utf8');
        expect(
          src.includes('personGenerator'),
          `${rel} imports personGenerator — forbidden this directive`,
        ).toBe(false);
        expect(
          src.includes('figureArchetypeMap'),
          `${rel} imports figureArchetypeMap — forbidden this directive`,
        ).toBe(false);
      }
    });
  });
});
