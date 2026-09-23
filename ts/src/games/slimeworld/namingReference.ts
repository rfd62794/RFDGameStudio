// namingReference.ts — SlimeWorld Color/Culture/Strain Canonical Reference
//
// Documentation-grade only. Nothing in real game logic imports this table
// to convert anything, because color is already the only scheme that
// matters at runtime. It exists purely to give any future human or agent
// session one place to check the real mapping instead of reconstructing
// it from data.yaml or gameLogic.ts, or guessing.
//
// There are three parallel naming schemes for the same six real things,
// and only ONE of them is ever load-bearing in game logic:
//
//   1. Culture keys (ember, marsh, gale, tundra, crystal, tide) — real,
//      confirmed in data.yaml's top-level `cultures` entries. Used ONLY
//      as display names, node-ID prefixes (node_ember), and narrative /
//      tutorial text. Never used for real programmatic state lookups.
//
//   2. Color names (Red, Orange, Yellow, Green, Purple, Blue, plus Gray
//      as the neutral/unclaimed value) — the ONLY scheme actually used
//      for real state: LabState.colorRelationships (renamed from
//      cultureRelationships — see
//      SlimeWorld_NamingCorrection_ColorCultureStrain_Directive.md),
//      Favor.ownerColor, PlanetNode.ownerColor, PlanetNode.pressure, etc.
//
//   3. "Strain" names (Cinder Strain, Marsh Strain, Gale Strain, Tundra
//      Strain, Crystal Strain, Tide Strain, Void Strain) — a third,
//      separate flavor-text layer defined in gameLogic.ts
//      (COLOR_SPECS[color].specialty), used for "specialty" display text
//      only.
//
// Do not import this table into gameplay logic. If you find yourself
// needing to convert a culture key or Strain name INTO a color at
// runtime, stop and ask why culture keys are reaching this code path at
// all, since they never have before.
//
// Confirm this table's content against the real, current data.yaml and
// gameLogic.ts before trusting it — either file may have changed since
// this reference was written.

import type { SlimeColor } from './types';

export interface CultureColorStrainEntry {
  culture: string;
  color: SlimeColor;
  strain: string;
}

export const CULTURE_COLOR_STRAIN_REFERENCE: CultureColorStrainEntry[] = [
  { culture: 'ember', color: 'Red', strain: 'Cinder Strain' },
  { culture: 'marsh', color: 'Orange', strain: 'Marsh Strain' },
  { culture: 'gale', color: 'Yellow', strain: 'Gale Strain' },
  { culture: 'tundra', color: 'Green', strain: 'Tundra Strain' },
  { culture: 'crystal', color: 'Purple', strain: 'Crystal Strain' },
  { culture: 'tide', color: 'Blue', strain: 'Tide Strain' },
  // Gray/"Void Strain" is the neutral/unclaimed value, has no culture key
];
