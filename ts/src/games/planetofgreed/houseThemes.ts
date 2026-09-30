import type { CultureId } from './types';
import type { FactionTheme } from '../../ui/components/FactionTheme';

/**
 * Per-House theme palettes — the presentation half of culture asymmetry.
 *
 * Design grounding: Design.md v0.2 locked each House's "visual signature"
 * as culture-coded naming and color. The mechanical half landed earlier
 * (houseStats.ts); this is the deferred UI/UX style split: the dark
 * boardroom chrome re-dresses itself in the player's House palette via the
 * shared FactionTheme tokens, while the paper "document" surfaces
 * (PlanetMap, DailyEventModal, CombatResolutionView, AnnualReportView,
 * WeeklyOrdersPanel, intel feed) deliberately stay house-neutral paper —
 * chrome is the House's identity, documents are its paperwork.
 *
 * Every palette is built from the same Tailwind hue family as the House's
 * existing wheel color (CULTURE_DEFINITIONS in App.tsx), so the UI accent
 * now matches the color the map and header already use for that House:
 *   600 shade → accent        500 shade → accentHover
 *   400 shade → accentBright/accentSoft   300 shade → accentStrong
 *   hue-tinted 50/100 → text/textDim      900/700 rgba → accentBg/fillDim
 *
 * Semantic colors are deliberately NOT themed: emerald stays treasury/
 * success, red stays danger/attack, sky/cyan stays reinforce/info, and
 * Ore-gold (Fragments, the ending screen) stays amber across all Houses —
 * the Ore's color does not change when the boardroom does.
 */

export const HOUSE_THEMES: Record<CultureId, FactionTheme> = {
  ember: {
    accent: '#dc2626',
    accentHover: '#ef4444',
    accentBright: '#f87171',
    accentStrong: '#fca5a5',
    accentSoft: '#f87171',
    accentFaint: 'rgba(239, 68, 68, 0.45)',
    accentBg: 'rgba(153, 27, 27, 0.3)',
    accentFillDim: 'rgba(185, 28, 28, 0.6)',
    text: '#fef2f2',
    textDim: 'rgba(254, 226, 226, 0.65)',
    onAccent: '#fff1f2',
  },
  marsh: {
    accent: '#d97706',
    accentHover: '#f59e0b',
    accentBright: '#fbbf24',
    accentStrong: '#fde68a',
    accentSoft: '#fbbf24',
    accentFaint: 'rgba(217, 119, 6, 0.45)',
    accentBg: 'rgba(120, 53, 15, 0.3)',
    accentFillDim: 'rgba(180, 83, 9, 0.6)',
    text: '#fffbeb',
    textDim: 'rgba(254, 243, 199, 0.65)',
    onAccent: '#1a1a2e',
  },
  gale: {
    accent: '#16a34a',
    accentHover: '#22c55e',
    accentBright: '#4ade80',
    accentStrong: '#86efac',
    accentSoft: '#4ade80',
    accentFaint: 'rgba(22, 163, 74, 0.45)',
    accentBg: 'rgba(20, 83, 45, 0.3)',
    accentFillDim: 'rgba(21, 128, 61, 0.6)',
    text: '#f0fdf4',
    textDim: 'rgba(220, 252, 231, 0.65)',
    onAccent: '#052e16',
  },
  tundra: {
    accent: '#0891b2',
    accentHover: '#06b6d4',
    accentBright: '#22d3ee',
    accentStrong: '#67e8f9',
    accentSoft: '#22d3ee',
    accentFaint: 'rgba(8, 145, 178, 0.45)',
    accentBg: 'rgba(22, 78, 99, 0.3)',
    accentFillDim: 'rgba(14, 116, 144, 0.6)',
    text: '#ecfeff',
    textDim: 'rgba(207, 250, 254, 0.65)',
    onAccent: '#083344',
  },
  crystal: {
    accent: '#4f46e5',
    accentHover: '#6366f1',
    accentBright: '#818cf8',
    accentStrong: '#a5b4fc',
    accentSoft: '#818cf8',
    accentFaint: 'rgba(79, 70, 229, 0.5)',
    accentBg: 'rgba(55, 48, 163, 0.3)',
    accentFillDim: 'rgba(67, 56, 202, 0.6)',
    text: '#eef2ff',
    textDim: 'rgba(224, 231, 255, 0.65)',
    onAccent: '#eef2ff',
  },
  tide: {
    accent: '#c026d3',
    accentHover: '#d946ef',
    accentBright: '#e879f9',
    accentStrong: '#f0abfc',
    accentSoft: '#e879f9',
    accentFaint: 'rgba(192, 38, 211, 0.45)',
    accentBg: 'rgba(112, 26, 117, 0.3)',
    accentFillDim: 'rgba(162, 28, 175, 0.6)',
    text: '#fdf4ff',
    textDim: 'rgba(250, 232, 255, 0.65)',
    onAccent: '#fdf4ff',
  },
};

/**
 * The pre-House neutral identity: the greed/Ore-gold ramp the game shipped
 * with. Title, opening, culture-selection and loading screens render before
 * a House is chosen, so they use this theme (Marsh's palette coincides with
 * it — the game's base identity was always greed-gold). Also declared as
 * :root defaults in index.css for any unscoped consumer.
 */
export const POG_DEFAULT_THEME: FactionTheme = HOUSE_THEMES.marsh;

export function getHouseTheme(cultureId: CultureId): FactionTheme {
  return HOUSE_THEMES[cultureId];
}
