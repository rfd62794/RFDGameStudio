// @vitest-environment node
//
// paperDoll/proportionPresets — unit tests
//
// Covers the preset table shape, getProportionPreset lookup (including its
// unknown-name fallback), NORMAL_PROPORTIONS, and getNextProportionPreset
// cycling (including its not-in-order fallback).

import { describe, it, expect } from 'vitest';
import {
  PROPORTION_PRESETS,
  PROPORTION_PRESET_ORDER,
  NORMAL_PROPORTIONS,
  getProportionPreset,
  getNextProportionPreset,
} from '../src/engine/paperDoll/proportionPresets';

const MULTIPLIER_KEYS = [
  'headSize',
  'neckWidth',
  'shoulderWidth',
  'chestWidth',
  'waistWidth',
  'hipWidth',
  'upperArmWidth',
  'forearmWidth',
  'handSize',
  'thighWidth',
  'calfWidth',
  'footSize',
  'muscleBulge',
] as const;

describe('PROPORTION_PRESETS table', () => {
  it('test_normal_preset_has_all_multipliers_at_1', () => {
    // Module contract: multipliers are relative to normal, so 'normal'
    // itself must be the identity (1.0) on every axis.
    for (const key of MULTIPLIER_KEYS) {
      expect(PROPORTION_PRESETS.normal[key]).toBe(1.0);
    }
    expect(PROPORTION_PRESETS.normal.name).toBe('Normal');
  });

  it('test_every_preset_has_all_12_multipliers_and_a_name', () => {
    for (const [key, preset] of Object.entries(PROPORTION_PRESETS)) {
      for (const multiplierKey of MULTIPLIER_KEYS) {
        expect(typeof preset[multiplierKey]).toBe('number');
        expect(Number.isFinite(preset[multiplierKey])).toBe(true);
      }
      expect(preset.name.length).toBeGreaterThan(0);
      expect(key).toBe(key.toLowerCase()); // lookup lowercases input
    }
  });

  it('test_named_presets_scale_in_the_direction_their_name_describes', () => {
    const normal = PROPORTION_PRESETS.normal;
    // These directions are the semantic content of the presets, not
    // incidental values: big_head enlarges the head, slim narrows widths,
    // buff grows muscle-related axes, chibi enlarges the head while
    // shrinking the body.
    expect(PROPORTION_PRESETS.big_head.headSize).toBeGreaterThan(normal.headSize);
    expect(PROPORTION_PRESETS.tiny_head.headSize).toBeLessThan(normal.headSize);
    expect(PROPORTION_PRESETS.slim.waistWidth).toBeLessThan(normal.waistWidth);
    expect(PROPORTION_PRESETS.buff.muscleBulge).toBeGreaterThan(normal.muscleBulge);
    expect(PROPORTION_PRESETS.buff.shoulderWidth).toBeGreaterThan(normal.shoulderWidth);
    expect(PROPORTION_PRESETS.chibi.headSize).toBeGreaterThan(normal.headSize);
    expect(PROPORTION_PRESETS.chibi.calfWidth).toBeLessThan(normal.calfWidth);
  });
});

describe('NORMAL_PROPORTIONS export', () => {
  it('test_normal_proportions_is_all_ones_named_normal', () => {
    for (const key of MULTIPLIER_KEYS) {
      expect(NORMAL_PROPORTIONS[key]).toBe(1.0);
    }
    expect(NORMAL_PROPORTIONS.name).toBe('Normal');
  });

  it('test_normal_proportions_matches_normal_preset_values', () => {
    for (const key of MULTIPLIER_KEYS) {
      expect(NORMAL_PROPORTIONS[key]).toBe(PROPORTION_PRESETS.normal[key]);
    }
    expect(NORMAL_PROPORTIONS.name).toBe(PROPORTION_PRESETS.normal.name);
  });
});

describe('getProportionPreset', () => {
  it('test_returns_named_preset_for_known_key', () => {
    expect(getProportionPreset('big_head').headSize).toBe(
      PROPORTION_PRESETS.big_head.headSize,
    );
    expect(getProportionPreset('slim').name).toBe('Slim');
  });

  it('test_lookup_is_case_insensitive', () => {
    expect(getProportionPreset('BIG_HEAD')).toBe(PROPORTION_PRESETS.big_head);
    expect(getProportionPreset('Chibi')).toBe(PROPORTION_PRESETS.chibi);
  });

  it('test_unknown_name_falls_back_to_normal', () => {
    expect(getProportionPreset('does_not_exist')).toBe(PROPORTION_PRESETS.normal);
    expect(getProportionPreset('')).toBe(PROPORTION_PRESETS.normal);
  });
});

describe('PROPORTION_PRESET_ORDER and getNextProportionPreset', () => {
  it('test_order_contains_only_resolvable_preset_keys', () => {
    for (const key of PROPORTION_PRESET_ORDER) {
      expect(PROPORTION_PRESETS[key]).toBeDefined();
    }
  });

  it('test_advances_to_next_entry_in_order', () => {
    expect(getNextProportionPreset('normal')).toBe('baby_hands');
    expect(getNextProportionPreset('buff')).toBe('slim');
  });

  it('test_wraps_from_last_entry_back_to_first', () => {
    const last = PROPORTION_PRESET_ORDER[PROPORTION_PRESET_ORDER.length - 1];
    expect(getNextProportionPreset(last)).toBe(PROPORTION_PRESET_ORDER[0]);
  });

  it('test_input_matching_is_case_insensitive', () => {
    expect(getNextProportionPreset('NORMAL')).toBe('baby_hands');
  });

  it('test_preset_key_missing_from_order_falls_back_to_first_entry', () => {
    // tiny_head and long_legs exist in PROPORTION_PRESETS but are not in
    // PROPORTION_PRESET_ORDER, so the cycle skips them and the helper
    // treats them like any unknown name.
    expect(PROPORTION_PRESETS.tiny_head).toBeDefined();
    expect(PROPORTION_PRESETS.long_legs).toBeDefined();
    expect(PROPORTION_PRESET_ORDER).not.toContain('tiny_head');
    expect(PROPORTION_PRESET_ORDER).not.toContain('long_legs');
    expect(getNextProportionPreset('tiny_head')).toBe(PROPORTION_PRESET_ORDER[0]);
    expect(getNextProportionPreset('totally_unknown')).toBe(PROPORTION_PRESET_ORDER[0]);
  });

  it('test_full_cycle_returns_to_start', () => {
    let current = PROPORTION_PRESET_ORDER[0];
    for (let i = 0; i < PROPORTION_PRESET_ORDER.length; i++) {
      current = getNextProportionPreset(current);
    }
    expect(current).toBe(PROPORTION_PRESET_ORDER[0]);
  });
});
