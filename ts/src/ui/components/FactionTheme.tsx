import type { CSSProperties } from 'react';

/**
 * FactionTheme — the shared per-faction theme-token mechanism (ADR-014).
 *
 * What it is: a small, dependency-free palette contract. A game declares one
 * FactionTheme per faction/House/brand and applies it to a scope element via
 * factionThemeVars(). Every descendant that consumes the `--faction-*` CSS
 * custom properties then renders in that faction's identity — no component
 * needs to know which faction is active.
 *
 * The token set is deliberately small and semantic: an accent ramp
 * (accent → hover → bright fills; strong/soft text; faint borders; tinted
 * backgrounds; dim fills) plus house-tinted body text and an on-accent ink.
 * Games keep their own base surface colors; a theme only carries the
 * identity layer, exactly like a faction kit.
 *
 * Consumption contract:
 *   - A scope element sets the vars: `style={factionThemeVars(theme)}`
 *     (typically the game's root render div).
 *   - Components consume via Tailwind arbitrary values:
 *     `text-(--faction-accent-strong)`, `bg-(--faction-accent)`,
 *     `border-(--faction-accent-faint)`, or with an explicit fallback for
 *     shared components consumed outside a theme scope:
 *     `bg-[var(--faction-accent,#d97706)]`.
 *   - Unscoped consumers resolve to whatever the host CSS defines as
 *     `:root` defaults (Planet of Greed defines its shipped greed-gold ramp
 *     as the default in index.css).
 *
 * First consumer: Planet of Greed — the six Houses re-theme the boardroom
 * chrome from the player's chosen House (the deferred "UI/UX style split").
 * Real second consumer already known: Mutant Battle Ball — its six-Brand
 * Trinity (brandModifiers.ts) is the same per-faction palette axis and can
 * consume this exact token contract when its Brands get visual identity.
 */

export interface FactionTheme {
  /** Solid accent — primary buttons, active chips, badges, progress fills. */
  accent: string;
  /** Hover shade for accent-filled controls. */
  accentHover: string;
  /** Bright accent — pulsing "current" ticks, solid accent borders. */
  accentBright: string;
  /** Emphasis text — titles, stat values, accent headlines. */
  accentStrong: string;
  /** Mid accent — icons, secondary emphasis text. */
  accentSoft: string;
  /** Translucent accent — borders, dividers, faint outlines. */
  accentFaint: string;
  /** Very dim accent wash — tinted panels, progress tracks. */
  accentBg: string;
  /** Mid-strength accent fill — "elapsed" ticks and dim fills. */
  accentFillDim: string;
  /** Faction-tinted body text. */
  text: string;
  /** Muted body text. */
  textDim: string;
  /** Text color on accent-filled controls. */
  onAccent: string;
}

/** Every CSS custom property the contract defines, in declaration order. */
export const FACTION_THEME_VARS = [
  '--faction-accent',
  '--faction-accent-hover',
  '--faction-accent-bright',
  '--faction-accent-strong',
  '--faction-accent-soft',
  '--faction-accent-faint',
  '--faction-accent-bg',
  '--faction-accent-fill-dim',
  '--faction-text',
  '--faction-text-dim',
  '--faction-on-accent',
] as const;

/**
 * Convert a FactionTheme into a React style object of CSS custom
 * properties. Apply to any scope element; descendants consume the vars.
 */
export function factionThemeVars(theme: FactionTheme): CSSProperties {
  return {
    '--faction-accent': theme.accent,
    '--faction-accent-hover': theme.accentHover,
    '--faction-accent-bright': theme.accentBright,
    '--faction-accent-strong': theme.accentStrong,
    '--faction-accent-soft': theme.accentSoft,
    '--faction-accent-faint': theme.accentFaint,
    '--faction-accent-bg': theme.accentBg,
    '--faction-accent-fill-dim': theme.accentFillDim,
    '--faction-text': theme.text,
    '--faction-text-dim': theme.textDim,
    '--faction-on-accent': theme.onAccent,
  } as CSSProperties;
}
