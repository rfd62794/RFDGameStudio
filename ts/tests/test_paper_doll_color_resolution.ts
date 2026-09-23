// @vitest-environment node
//
// Paper Doll — Hierarchical Color Resolution — Dedicated Tests
//
// Covers every real branch of ts/src/engine/paperDoll/colorResolution.ts:
// the priority-key walk and its null/undefined skips, the 13-slot
// hierarchy table and its unknown-slot fallback, the default-genetics
// fallback chain, and blendColors' t clamping. Some of these paths are
// already exercised via test_paper_doll_chimeralab_port.ts through the
// composer; this file pins the module's own contract directly.

import { describe, it, expect } from 'vitest';
import {
  resolveColor,
  getColorForPart,
  blendColors,
  lightenColor,
  darkenColor,
  DEFAULT_COLOR_GENETICS,
} from '../src/engine/paperDoll/colorResolution';
import type { ColorGenetics } from '../src/engine/paperDoll/types';

const TABLE_SLOTS = [
  'head', 'torso', 'chest',
  'arm_upper', 'arm_lower', 'left_arm', 'right_arm',
  'leg_upper', 'leg_lower', 'left_leg', 'right_leg',
  'hand', 'foot',
];

describe('test_resolve_color', () => {
  it('returns the first defined color walking priority-ordered keys', () => {
    const genetics: ColorGenetics = {
      arm_color: '#00ff00',
      body_base_color: '#ff0000',
    };
    // arm_upper_color absent → next defined key wins
    expect(
      resolveColor(genetics, ['arm_upper_color', 'arm_color', 'body_base_color']),
    ).toBe('#00ff00');
    // First defined key wins even when later keys are also defined
    expect(
      resolveColor(genetics, ['arm_color', 'body_base_color']),
    ).toBe('#00ff00');
  });

  it('returns the fallback when no key is defined', () => {
    expect(resolveColor({}, ['head_color', 'body_base_color'], '#cccccc')).toBe('#cccccc');
    expect(resolveColor({ other_key: '#123456' }, ['head_color'], '#cccccc')).toBe('#cccccc');
  });

  it('returns the fallback for an empty key list', () => {
    expect(resolveColor({ body_base_color: '#ff0000' }, [], '#cccccc')).toBe('#cccccc');
  });

  it('defaults to the ChimeraLab tan when no fallback is given', () => {
    // The module's built-in default equals DEFAULT_COLOR_GENETICS.body_base_color
    expect(resolveColor({}, ['head_color'])).toBe(DEFAULT_COLOR_GENETICS.body_base_color);
  });

  it('skips null values as well as absent keys', () => {
    // The implementation explicitly checks `!== null` — a null entry must
    // not short-circuit the walk ahead of a later defined key.
    const genetics = {
      head_color: null,
      body_base_color: '#ff0000',
    } as unknown as ColorGenetics;
    expect(resolveColor(genetics, ['head_color', 'body_base_color'])).toBe('#ff0000');
  });
});

describe('test_get_color_for_part', () => {
  it('every table slot falls back to body_base_color', () => {
    const genetics: ColorGenetics = { body_base_color: '#ff0000' };
    for (const slot of TABLE_SLOTS) {
      expect(getColorForPart(genetics, slot)).toBe('#ff0000');
    }
  });

  it('part-specific key wins over group key, group key wins over base', () => {
    const genetics: ColorGenetics = {
      arm_upper_color: '#00ff00',
      arm_color: '#0000ff',
      body_base_color: '#ff0000',
    };
    // left_arm → ['arm_upper_color', 'arm_color', 'body_base_color']
    expect(getColorForPart(genetics, 'left_arm')).toBe('#00ff00');
    // arm_lower → ['arm_lower_color', 'arm_color', 'body_base_color']
    expect(getColorForPart(genetics, 'arm_lower')).toBe('#0000ff');
    // head → ['head_color', 'body_base_color']
    expect(getColorForPart(genetics, 'head')).toBe('#ff0000');
  });

  it('chest and torso both resolve through torso_color', () => {
    const genetics: ColorGenetics = {
      torso_color: '#123456',
      body_base_color: '#ff0000',
    };
    expect(getColorForPart(genetics, 'chest')).toBe('#123456');
    expect(getColorForPart(genetics, 'torso')).toBe('#123456');
  });

  it('hand and foot resolve through extremity_color before the limb group', () => {
    const genetics: ColorGenetics = {
      extremity_color: '#111111',
      arm_color: '#222222',
      leg_color: '#333333',
      body_base_color: '#444444',
    };
    // hand → ['extremity_color', 'arm_color', 'body_base_color']
    expect(getColorForPart(genetics, 'hand')).toBe('#111111');
    // foot → ['extremity_color', 'leg_color', 'body_base_color']
    expect(getColorForPart(genetics, 'foot')).toBe('#111111');
    // Without extremity_color, the limb group key wins
    delete genetics.extremity_color;
    expect(getColorForPart(genetics, 'hand')).toBe('#222222');
    expect(getColorForPart(genetics, 'foot')).toBe('#333333');
  });

  it('unknown slot falls back to body_base_color', () => {
    const genetics: ColorGenetics = {
      body_base_color: '#ff0000',
      wing_color: '#00ff00',
    };
    // 'wing' is not in the 13-slot table → ['body_base_color'] fallback list
    expect(getColorForPart(genetics, 'wing')).toBe('#ff0000');
  });

  it('falls back to DEFAULT_COLOR_GENETICS tan when body_base_color is absent', () => {
    expect(getColorForPart({}, 'head')).toBe(DEFAULT_COLOR_GENETICS.body_base_color);
    expect(getColorForPart({}, 'wing')).toBe(DEFAULT_COLOR_GENETICS.body_base_color);
  });
});

describe('test_default_color_genetics', () => {
  it('carries the ChimeraLab default palette', () => {
    // The ported DEFAULT_COLORS: tan body, white sclera, brown iris,
    // dark red mouth, off-white nails.
    expect(DEFAULT_COLOR_GENETICS.body_base_color).toBe('#b4967a');
    expect(DEFAULT_COLOR_GENETICS.eye_white_color).toBe('#ffffff');
    expect(DEFAULT_COLOR_GENETICS.eye_iris_color).toBe('#503c28');
    expect(DEFAULT_COLOR_GENETICS.mouth_color).toBe('#783c3c');
    expect(DEFAULT_COLOR_GENETICS.nail_color).toBe('#c8b4a0');
  });
});

describe('test_blend_colors', () => {
  it('returns c1 at t=0 and c2 at t=1', () => {
    expect(blendColors('#123456', '#abcdef', 0)).toBe('#123456');
    expect(blendColors('#123456', '#abcdef', 1)).toBe('#abcdef');
  });

  it('interpolates each channel independently', () => {
    // Midpoint of black→white is 128 (round(127.5)) per channel
    expect(blendColors('#000000', '#ffffff', 0.5)).toBe('#808080');
    // Red→green midpoint: r drops to 0x80, g rises to 0x80, b stays 0
    expect(blendColors('#ff0000', '#00ff00', 0.5)).toBe('#808000');
  });

  it('clamps t below 0 to c1 and above 1 to c2', () => {
    expect(blendColors('#123456', '#abcdef', -0.5)).toBe('#123456');
    expect(blendColors('#123456', '#abcdef', 2)).toBe('#abcdef');
  });
});

describe('test_lighten_darken', () => {
  it('lightenColor moves towards white: factor 0 is identity, 1 is white', () => {
    expect(lightenColor('#336699', 0)).toBe('#336699');
    expect(lightenColor('#336699', 1)).toBe('#ffffff');
    expect(lightenColor('#000000', 0.5)).toBe('#808080');
  });

  it('darkenColor moves towards black: factor 0 is identity, 1 is black', () => {
    expect(darkenColor('#336699', 0)).toBe('#336699');
    expect(darkenColor('#336699', 1)).toBe('#000000');
    expect(darkenColor('#ffffff', 0.5)).toBe('#808080');
  });

  it('darkenColor at 0.15 produces the painter\'s-algorithm left-side dim', () => {
    // The composer darkens left-side parts by exactly this factor.
    // 255 * (1 - 0.15) = 216.75 → 217 → 0xd9
    expect(darkenColor('#ff0000', 0.15)).toBe('#d90000');
  });
});
