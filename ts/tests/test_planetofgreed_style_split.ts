import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  HOUSE_THEMES,
  POG_DEFAULT_THEME,
  getHouseTheme,
} from '../src/games/planetofgreed/houseThemes';
import {
  factionThemeVars,
  FACTION_THEME_VARS,
  type FactionTheme,
} from '../src/ui/components/FactionTheme';
import type { CultureId } from '../src/games/planetofgreed/types';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');
const appSource = readFileSync(
  resolve(repoRoot, 'ts/src/games/planetofgreed/App.tsx'),
  'utf-8'
);
const walkthroughSource = readFileSync(
  resolve(repoRoot, 'ts/src/games/planetofgreed/components/GuidedWalkthrough.tsx'),
  'utf-8'
);
const headerSource = readFileSync(
  resolve(repoRoot, 'ts/src/engine/shared/components/BoardroomHeader.tsx'),
  'utf-8'
);
const cssSource = readFileSync(
  resolve(repoRoot, 'ts/src/games/planetofgreed/index.css'),
  'utf-8'
);
const planetMapSource = readFileSync(
  resolve(repoRoot, 'ts/src/engine/shared/components/PlanetMap.tsx'),
  'utf-8'
);
const weeklyOrdersSource = readFileSync(
  resolve(repoRoot, 'ts/src/games/planetofgreed/components/WeeklyOrdersPanel.tsx'),
  'utf-8'
);

const CULTURE_WHEEL: CultureId[] = ['ember', 'marsh', 'gale', 'tundra', 'crystal', 'tide'];

const FACTION_THEME_KEYS: (keyof FactionTheme)[] = [
  'accent',
  'accentHover',
  'accentBright',
  'accentStrong',
  'accentSoft',
  'accentFaint',
  'accentBg',
  'accentFillDim',
  'text',
  'textDim',
  'onAccent',
];

describe('Planet of Greed — UI/UX style split (per-House chrome themes)', () => {
  describe('houseThemes — the palette registry', () => {
    it('defines a theme for every House on the culture wheel', () => {
      for (const cultureId of CULTURE_WHEEL) {
        expect(HOUSE_THEMES[cultureId]).toBeDefined();
      }
      expect(Object.keys(HOUSE_THEMES).sort()).toEqual([...CULTURE_WHEEL].sort());
    });

    it('every House theme is a complete FactionTheme (all tokens set)', () => {
      for (const cultureId of CULTURE_WHEEL) {
        for (const key of FACTION_THEME_KEYS) {
          expect(HOUSE_THEMES[cultureId][key]).toBeTruthy();
        }
      }
    });

    it('each House has a distinct accent color', () => {
      const accents = CULTURE_WHEEL.map(c => HOUSE_THEMES[c].accent);
      expect(new Set(accents).size).toBe(CULTURE_WHEEL.length);
    });

    it('getHouseTheme returns the palette for the requested House', () => {
      expect(getHouseTheme('ember')).toBe(HOUSE_THEMES.ember);
      expect(getHouseTheme('tide')).toBe(HOUSE_THEMES.tide);
    });

    it('default theme is the shipped greed-gold ramp', () => {
      expect(POG_DEFAULT_THEME).toBe(HOUSE_THEMES.marsh);
      expect(POG_DEFAULT_THEME.accent).toBe('#d97706');
    });
  });

  describe('FactionTheme — the shared token mechanism', () => {
    it('factionThemeVars emits one CSS var per contract token', () => {
      const vars = factionThemeVars(HOUSE_THEMES.ember) as Record<string, string>;
      for (const varName of FACTION_THEME_VARS) {
        expect(vars[varName]).toBeTruthy();
      }
      expect(vars['--faction-accent']).toBe(HOUSE_THEMES.ember.accent);
    });

    it('index.css declares :root defaults for every faction var', () => {
      for (const varName of FACTION_THEME_VARS) {
        expect(cssSource).toContain(`${varName}:`);
      }
    });
  });

  describe('App wiring — theme scope + culture-select previews', () => {
    it('game root carries the player House theme and data-faction', () => {
      expect(appSource).toContain('getHouseTheme(playerCorp.cultureId)');
      expect(appSource).toContain('factionThemeVars(houseTheme)');
      expect(appSource).toContain('data-faction={playerCorp.cultureId}');
    });

    it('culture-select cards preview each House palette', () => {
      expect(appSource).toContain('factionThemeVars(getHouseTheme(cultureId))');
      expect(appSource).toContain('data-faction={cultureId}');
    });

    it('planning-mode tabs consume faction tokens', () => {
      expect(appSource).toContain('bg-(--faction-accent) text-(--faction-on-accent)');
    });

    it('ending screen keeps the Ore-gold identity (amber literals intact)', () => {
      expect(appSource).toContain('amber-600');
      expect(appSource).toContain('pog-ending-fragment-count');
    });
  });

  describe('chrome surfaces consume the theme', () => {
    it('GuidedWalkthrough identity classes are faction tokens', () => {
      expect(walkthroughSource).toContain('(--faction-accent-faint)');
      expect(walkthroughSource).toContain('bg-(--faction-accent) hover:bg-(--faction-accent-hover)');
      expect(walkthroughSource).toContain('text-(--faction-text-dim)');
      // Identity chrome no longer hardcodes the amber ramp
      expect(walkthroughSource).not.toContain('border-amber-600');
      expect(walkthroughSource).not.toContain('bg-amber-600');
      expect(walkthroughSource).not.toContain('bg-amber-950');
    });

    it('BoardroomHeader identity classes are faction tokens', () => {
      expect(headerSource).toContain('(--faction-accent-faint)');
      expect(headerSource).toContain('text-(--faction-accent-strong)');
      expect(headerSource).toContain('bg-(--faction-accent)');
    });

    it('BoardroomHeader keeps FRAGMENTS gold literal (Ore color is universal)', () => {
      expect(headerSource).toContain('text-amber-400');
      expect(headerSource).toContain('fragment-counter');
    });
  });

  describe('document layer stays neutral paper (not themed)', () => {
    it('PlanetMap does not consume faction vars', () => {
      expect(planetMapSource).not.toContain('--faction-');
    });

    it('WeeklyOrdersPanel does not consume faction vars', () => {
      expect(weeklyOrdersSource).not.toContain('--faction-');
    });
  });

  describe('onboarding flow preserved', () => {
    it('GuidedWalkthrough and OnboardingGate usage intact', () => {
      expect(appSource).toContain('GuidedWalkthrough');
      expect(appSource).toContain('useOnboardingGate');
      expect(appSource).toContain('OnboardingGate');
    });
  });
});
