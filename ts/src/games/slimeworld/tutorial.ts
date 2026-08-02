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
