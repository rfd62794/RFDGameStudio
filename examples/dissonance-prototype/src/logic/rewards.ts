import { buildEmberCardPool, EMBER_CARD_NAMES } from './deck';
import { BOON_POOL } from './boons';
import { RELIC_POOL } from './relics';

export type RewardSlot =
  | { kind: 'card'; cardId: string }
  | { kind: 'benefit'; boonId: string }
  | { kind: 'heal'; amount: number }
  | { kind: 'relic'; relicId: string };

export function generateFixedReward(
  currentMaxHp: number = 20,
  ownedCardIds: string[] = [],
  heldBoonIds: string[] = [],
  heldRelicIds: string[] = [],
  enemyTier: 'basic' | 'advanced' | 'elite' | 'master' = 'basic'
): RewardSlot[] {
  const relationByTier = { basic: 'single', advanced: 'same', elite: 'adjacent', master: 'opposed' };
  const cardPool = buildEmberCardPool()
    .filter(c => c.relationType === relationByTier[enemyTier])
    .filter(c => !ownedCardIds.includes(c.id));
  const boonPool = BOON_POOL
    .filter(b => b.tier === enemyTier)
    .filter(b => !heldBoonIds.includes(b.id))
    .filter(b => !b.requiresBoonId || heldBoonIds.includes(b.requiresBoonId));

  const healAmount = Math.round(currentMaxHp * 0.4);
  const slots: RewardSlot[] = [
    { kind: 'heal', amount: healAmount }
  ];

  if (cardPool.length > 0) {
    const c = cardPool[Math.floor(Math.random() * cardPool.length)];
    slots.push({ kind: 'card', cardId: c.id });
  } else {
    slots.push({ kind: 'heal', amount: healAmount });
  }

  if (boonPool.length > 0) {
    const b = boonPool[Math.floor(Math.random() * boonPool.length)];
    slots.push({ kind: 'benefit', boonId: b.id });
  } else {
    slots.push({ kind: 'heal', amount: healAmount });
  }

  // 10% chance ANY ONE of the three fixed slots upgrades to a Relic instead
  const RELIC_UPGRADE_CHANCE = 0.10; // first-pass placeholder, flag as such
  if (Math.random() < RELIC_UPGRADE_CHANCE) {
    const eligible = RELIC_POOL.filter(r => !heldRelicIds.includes(r.id));
    if (eligible.length > 0) {
      const slotIdx = Math.floor(Math.random() * 3);
      const chosenRelic = eligible[Math.floor(Math.random() * eligible.length)];
      slots[slotIdx] = { kind: 'relic', relicId: chosenRelic.id };
    }
  }

  return slots;
}

export function generateReward(
  currentUnlocked: string[],
  enemyTier: 'basic' | 'advanced' | 'elite' | 'master'
): { slots: string[] } {
  const relationByTier = { basic: 'single', advanced: 'same', elite: 'adjacent', master: 'opposed' };
  const pool = buildEmberCardPool()
    .filter(c => c.relationType === relationByTier[enemyTier])
    .filter(c => !currentUnlocked.includes(c.id));

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const slots = shuffled.slice(0, 3).map(c => c.id);

  return { slots };
}

const ACTIONS_ORDER = ['sever', 'guard', 'mend', 'unmake'] as const;

export function generateOpeningPack(): { action: string; element: string; cardId: string; name: string }[] {
  const elements = ['ember', 'ash', 'spark', 'cinder'];
  // Fisher-Yates shuffle — genuine randomness, not a fixed order
  for (let i = elements.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [elements[i], elements[j]] = [elements[j], elements[i]];
  }

  return ACTIONS_ORDER.map((action, i) => {
    const element = elements[i];
    const cardId = `${element}_none_${action}`; // matches existing Single-tier card ID convention
    const name = EMBER_CARD_NAMES[cardId]; // reuse the existing verified name table, don't reinvent
    return { action, element, cardId, name };
  });
}
