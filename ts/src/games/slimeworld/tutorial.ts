import type { SlimeColor } from './types';

export const TUTORIAL_IDS = {
  T1_HUB_VIEW: 't1_hub_view',
  T2_BREEDING_SCREEN: 't2_breeding_screen',
  T3_REGION_UNLOCK: 't3_region_unlock',
} as const;

export const ALL_TUTORIAL_IDS = Object.values(TUTORIAL_IDS);

export const TUTORIAL_CONTENT: Record<string, { title: string; body: string }> = {
  [TUTORIAL_IDS.T1_HUB_VIEW]: {
    title: 'Regions Await',
    body: 'Ember is your home. Two regions — Thornward and Abyssal Ember — lie within reach, but they are locked. Breed the right specimen to open them.',
  },
  [TUTORIAL_IDS.T2_BREEDING_SCREEN]: {
    title: 'Breed Toward a Target',
    body: 'Select two parents in the Roster tab. Their offspring may match a locked region\'s color, shape, and pattern requirements — unlocking it permanently.',
  },
  [TUTORIAL_IDS.T3_REGION_UNLOCK]: {
    title: 'Region Unlocked — Forever',
    body: 'You bred a specimen matching this region\'s composite lock. It is now permanently unlocked — reaching a region unlocks it forever.',
  },
};

// Real culture/neighbor-guild mapping for the three possible starting
// colors (Red/Yellow/Blue) — per naming_reference.lua's
// CULTURE_COLOR_STRAIN_REFERENCE (Red→ember, Yellow→gale, Blue→tide) and
// data.yaml's real color_targets guild ring (each culture's two immediate
// neighbors on the color wheel). No place names invented — every name
// used already exists in data.yaml.
const HOME_CULTURE_BY_STARTING_COLOR: Record<'Red' | 'Yellow' | 'Blue', { cultureName: string; neighborGuildIds: [string, string] }> = {
  Red: { cultureName: 'Ember', neighborGuildIds: ['guild_tide_ember', 'guild_ember_marsh'] },
  Yellow: { cultureName: 'Gale', neighborGuildIds: ['guild_marsh_gale', 'guild_gale_tundra'] },
  Blue: { cultureName: 'Tide', neighborGuildIds: ['guild_crystal_tide', 'guild_tide_ember'] },
};

function stripGuildPrefix(name: string): string {
  return name.replace(/^Guild: /, '');
}

function resolveHomeRegionNames(startingColor: SlimeColor | undefined, colorTargets: Array<Record<string, unknown>>): { cultureName: string; neighborNames: [string, string] } {
  const mapping = HOME_CULTURE_BY_STARTING_COLOR[(startingColor as 'Red' | 'Yellow' | 'Blue') ?? 'Red'] ?? HOME_CULTURE_BY_STARTING_COLOR.Red;
  const neighborNames = mapping.neighborGuildIds.map(id => {
    const target = colorTargets.find(t => t['id'] === id);
    return stripGuildPrefix(String(target?.['name'] ?? id));
  }) as [string, string];
  return { cultureName: mapping.cultureName, neighborNames };
}

// Real, data-driven T1 body — parameterized by the real assigned starting
// color instead of always hardcoding "Ember"/"Thornward"/"Abyssal Ember".
export function getT1RegionsAwaitBody(startingColor: SlimeColor | undefined, colorTargets: Array<Record<string, unknown>>): string {
  const { cultureName, neighborNames } = resolveHomeRegionNames(startingColor, colorTargets);
  return `${cultureName} is your home. Two regions — ${neighborNames[0]} and ${neighborNames[1]} — lie within reach, but they are locked. Breed the right specimen to open them.`;
}

// Real, data-driven Ember/Gale/Tide Station opening beat text.
export function getOpeningBeatText(startingColor: SlimeColor | undefined, colorTargets: Array<Record<string, unknown>>): { title: string; body: string } {
  const { cultureName, neighborNames } = resolveHomeRegionNames(startingColor, colorTargets);
  return {
    title: `${cultureName.toUpperCase()} STATION`,
    body: `${cultureName} is your home. Two regions — ${neighborNames[0]} and ${neighborNames[1]} — lie within reach, but they are locked. Reach them to open them.`,
  };
}

export function shouldFireTutorial(
  shownTutorials: Record<string, boolean> | undefined,
  tutorialId: string
): boolean {
  if (!shownTutorials) return true;
  return !shownTutorials[tutorialId];
}

export function markTutorialShown(
  shownTutorials: Record<string, boolean> | undefined,
  tutorialId: string
): Record<string, boolean> {
  return { ...(shownTutorials ?? {}), [tutorialId]: true };
}

export function prepopulateAllTutorials(): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const id of ALL_TUTORIAL_IDS) {
    result[id] = true;
  }
  return result;
}
