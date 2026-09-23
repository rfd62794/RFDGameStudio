export type RealmEventId =
  | 'bountiful_harvest'
  | 'timber_rush'
  | 'crown_jubilee'
  | 'holy_convocation';

export type ModifierType = 'food_worker' | 'wood_worker' | 'task_gold' | 'festival_reputation';

export interface RealmEvent {
  id: RealmEventId;
  name: string;
  description: string;
  modifierType: ModifierType;
  multiplier: number;
  iconName: string;
  themeColor: string;
}

export const REALM_EVENTS: RealmEvent[] = [
  {
    id: 'bountiful_harvest',
    name: 'Bountiful Harvest',
    description: 'Golden fields overflow with wheat and grain across the realm.',
    modifierType: 'food_worker',
    multiplier: 1.5,
    iconName: 'Wheat',
    themeColor: 'emerald',
  },
  {
    id: 'timber_rush',
    name: 'Timber Rush',
    description: 'Lumberjacks harvest sacred hardwoods at an unprecedented pace.',
    modifierType: 'wood_worker',
    multiplier: 1.5,
    iconName: 'TreePine',
    themeColor: 'amber',
  },
  {
    id: 'crown_jubilee',
    name: 'Crown Jubilee',
    description: 'Royal celebrations grant extra gold bounties for all lordly expeditions.',
    modifierType: 'task_gold',
    multiplier: 1.25,
    iconName: 'Coins',
    themeColor: 'yellow',
  },
  {
    id: 'holy_convocation',
    name: 'Holy Convocation',
    description: 'Divine blessings elevate House Fertility Festival contributions and reputation.',
    modifierType: 'festival_reputation',
    multiplier: 1.5,
    iconName: 'Sparkles',
    themeColor: 'indigo',
  },
];

/**
 * Deterministic Realm Event based on hourly rotation: Math.floor(now / 3,600,000) % 4
 * 0: bountiful_harvest (Food Worker Yield x1.5)
 * 1: timber_rush (Wood Worker Yield x1.5)
 * 2: crown_jubilee (Expedition Gold x1.25)
 * 3: holy_convocation (Festival Reputation Gain x1.5)
 */
export function getCurrentRealmEvent(timestampMs: number = Date.now()): {
  event: RealmEvent;
  nextRotationMs: number;
  remainingMs: number;
  rotationIndex: number;
} {
  const ONE_HOUR_MS = 3600000;
  const hourBucket = Math.floor(timestampMs / ONE_HOUR_MS);
  const rotationIndex = ((hourBucket % 4) + 4) % 4; // safe non-negative modulo
  const event = REALM_EVENTS[rotationIndex];

  const nextRotationMs = (hourBucket + 1) * ONE_HOUR_MS;
  const remainingMs = Math.max(0, nextRotationMs - timestampMs);

  return {
    event,
    nextRotationMs,
    remainingMs,
    rotationIndex,
  };
}
