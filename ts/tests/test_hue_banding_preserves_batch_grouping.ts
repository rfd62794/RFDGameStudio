import { describe, it, expect } from 'vitest';
import {
  HUE_BANDS,
  HUE_BAND_SIZE,
  hueToBand,
  bandToHue,
  getBatchColor,
  parseHueFromColor,
  hslColor,
} from '../src/games/shoal/art/shoal.config';

/**
 * test_hue_banding_preserves_batch_grouping
 *
 * Entities within the same hue band batch under one fillStyle key.
 * Band count matches the chosen value (12). This preserves the
 * batched-rendering performance pattern that per-entity unique hue
 * would otherwise silently break.
 */
describe('test_hue_banding_preserves_batch_grouping', () => {
  it('HUE_BANDS is 12 (chosen for ~5-8 entities per band at 60-100 fish)', () => {
    expect(HUE_BANDS).toBe(12);
  });

  it('HUE_BAND_SIZE is 30 degrees (360 / 12)', () => {
    expect(HUE_BAND_SIZE).toBe(30);
  });

  it('hueToBand maps 0-360 to 0-11 correctly', () => {
    expect(hueToBand(0)).toBe(0);
    expect(hueToBand(29)).toBe(0);
    expect(hueToBand(30)).toBe(1);
    expect(hueToBand(59)).toBe(1);
    expect(hueToBand(180)).toBe(6);
    expect(hueToBand(359)).toBe(11);
  });

  it('hueToBand wraps negative and >360 values', () => {
    expect(hueToBand(-30)).toBe(11); // wraps to 330-359
    expect(hueToBand(360)).toBe(0);
    expect(hueToBand(390)).toBe(1);
  });

  it('bandToHue returns the center of each band', () => {
    expect(bandToHue(0)).toBe(15);   // center of 0-30
    expect(bandToHue(1)).toBe(45);   // center of 30-60
    expect(bandToHue(6)).toBe(195);  // center of 180-210
    expect(bandToHue(11)).toBe(345); // center of 330-360
  });

  it('getBatchColor returns hsl() string for hsl input', () => {
    const result = getBatchColor('hsl(180, 70%, 55%)');
    expect(result).toMatch(/^hsl\(/);
    // Hue 180 → band 6 → center 195
    expect(result).toContain('195');
  });

  it('getBatchColor returns hsl() string for hex input', () => {
    // #ff0000 = pure red = hue 0 → band 0 → center 15
    const result = getBatchColor('#ff0000');
    expect(result).toMatch(/^hsl\(/);
    expect(result).toContain('15');
  });

  it('getBatchColor returns input unchanged for unparseable colors', () => {
    const result = getBatchColor('rgb(100, 100, 100)');
    expect(result).toBe('rgb(100, 100, 100)');
  });

  it('entities with similar hues batch under the same color', () => {
    // Two hues in the same band (0-30) should produce the same batch color
    const color1 = getBatchColor('hsl(10, 70%, 55%)');
    const color2 = getBatchColor('hsl(20, 70%, 55%)');
    expect(color1).toBe(color2); // both in band 0
  });

  it('entities in different bands produce different batch colors', () => {
    const color1 = getBatchColor('hsl(10, 70%, 55%)');  // band 0
    const color2 = getBatchColor('hsl(100, 70%, 55%)'); // band 3
    expect(color1).not.toBe(color2);
  });

  it('all 12 bands produce distinct batch colors', () => {
    const colors = new Set<string>();
    for (let band = 0; band < HUE_BANDS; band++) {
      colors.add(hslColor(bandToHue(band), 0.7, 0.55));
    }
    expect(colors.size).toBe(HUE_BANDS);
  });

  it('parseHueFromColor extracts hue from hsl() string', () => {
    expect(parseHueFromColor('hsl(180, 70%, 55%)')).toBe(180);
    expect(parseHueFromColor('hsl(0, 70%, 55%)')).toBe(0);
    expect(parseHueFromColor('hsl(359, 70%, 55%)')).toBe(359);
  });

  it('parseHueFromColor converts hex to hue', () => {
    expect(parseHueFromColor('#ff0000')).toBe(0);   // red
    expect(parseHueFromColor('#00ff00')).toBe(120); // green
    expect(parseHueFromColor('#0000ff')).toBe(240); // blue
  });

  it('parseHueFromColor returns null for unparseable input', () => {
    expect(parseHueFromColor('rgb(100, 100, 100)')).toBeNull();
    expect(parseHueFromColor('not-a-color')).toBeNull();
  });
});
