import { NamedCard, DeckCard, DeckState, Card, TypedBoon, Relic } from '../types';
import { canonicalizeElements } from './combat';

export const DECK_SIZE = 8;
export const HAND_SIZE = 5;
export const RESHUFFLE_THRESHOLD = 5;

export const EMBER_ELEMENTS = ['ember', 'ash', 'spark', 'cinder'];

export function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function drawCard(deckState: DeckState): DeckState {
  let { drawPile, hand, discard } = deckState;
  if (drawPile.length === 0) {
    drawPile = shuffle(discard);
    discard = [];
  }
  if (drawPile.length > 0) {
    const card = drawPile[0];
    return {
      drawPile: drawPile.slice(1),
      hand: [...hand, card],
      discard
    };
  }
  return { drawPile, hand, discard };
}

export function drawHand(deckState: DeckState, handSize: number = 5): DeckState {
  let current = { ...deckState };
  while (current.hand.length < handSize && (current.drawPile.length > 0 || current.discard.length > 0)) {
    current = drawCard(current);
  }
  return current;
}

export const NAMED_CARD_POOL: NamedCard[] = [
  // --- SINGLE (75 Essence) ---
  {
    id: 'ember_none',
    name: 'Ignis Spark',
    el1: 'ember',
    el2: null,
    relationType: 'single',
    description: 'Channel pure fire. Applies single Ember alignment.',
    cost: 75,
    culture: 'ember'
  },
  {
    id: 'ash_none',
    name: 'Ashen Drift',
    el1: 'ash',
    el2: null,
    relationType: 'single',
    description: 'Channel drifting ash. Applies single Ash alignment.',
    cost: 75,
    culture: 'ember'
  },
  {
    id: 'spark_none',
    name: 'Flickering Flare',
    el1: 'spark',
    el2: null,
    relationType: 'single',
    description: 'Channel crackling electricity. Applies single Spark alignment.',
    cost: 75,
    culture: 'ember'
  },
  {
    id: 'cinder_none',
    name: 'Glowing Smolder',
    el1: 'cinder',
    el2: null,
    relationType: 'single',
    description: 'Channel residual heat. Applies single Cinder alignment.',
    cost: 75,
    culture: 'ember'
  },

  // --- SAME (125 Essence) ---
  {
    id: 'ember_ember',
    name: 'Consuming Inferno',
    el1: 'ember',
    el2: 'ember',
    relationType: 'same',
    description: 'Perfect resonance of dual flame. 1.5x power multiplier.',
    cost: 125,
    culture: 'ember'
  },
  {
    id: 'ash_ash',
    name: 'Volcanic Ashstorm',
    el1: 'ash',
    el2: 'ash',
    relationType: 'same',
    description: 'Perfect resonance of dual ash. 1.5x power multiplier.',
    cost: 125,
    culture: 'ember'
  },
  {
    id: 'spark_spark',
    name: 'Static Discharge',
    el1: 'spark',
    el2: 'spark',
    relationType: 'same',
    description: 'Perfect resonance of dual spark. 1.5x power multiplier.',
    cost: 125,
    culture: 'ember'
  },
  {
    id: 'cinder_cinder',
    name: 'Cinder Monolith',
    el1: 'cinder',
    el2: 'cinder',
    relationType: 'same',
    description: 'Perfect resonance of dual cinder. 1.5x power multiplier.',
    cost: 125,
    culture: 'ember'
  },

  // --- ADJACENT (100 Essence) ---
  {
    id: 'ember_ash',
    name: 'Rising Smoke',
    el1: 'ember',
    el2: 'ash',
    relationType: 'adjacent',
    description: 'Combines Ember and Ash. Triggers Ash adjacent bonus (+2 Shield).',
    cost: 100,
    culture: 'ember'
  },
  {
    id: 'ash_ember',
    name: 'Ashen Sirocco',
    el1: 'ash',
    el2: 'ember',
    relationType: 'adjacent',
    description: 'Combines Ash and Ember. Triggers Heat adjacent bonus (+2 Damage).',
    cost: 100,
    culture: 'ember'
  },
  {
    id: 'ash_spark',
    name: 'Spark Shower',
    el1: 'ash',
    el2: 'spark',
    relationType: 'adjacent',
    description: 'Combines Ash and Spark. Triggers Spark adjacent bonus (+2 Heal).',
    cost: 100,
    culture: 'ember'
  },
  {
    id: 'spark_ash',
    name: 'Ashen Spark',
    el1: 'spark',
    el2: 'ash',
    relationType: 'adjacent',
    description: 'Combines Spark and Ash. Triggers Ash adjacent bonus (+2 Shield).',
    cost: 100,
    culture: 'ember'
  },
  {
    id: 'spark_cinder',
    name: 'Sparking Cinder',
    el1: 'spark',
    el2: 'cinder',
    relationType: 'adjacent',
    description: 'Combines Spark and Cinder. Triggers Cinder adjacent bonus (+2 Shield).',
    cost: 100,
    culture: 'ember'
  },
  {
    id: 'cinder_spark',
    name: 'Cinder Spark',
    el1: 'cinder',
    el2: 'spark',
    relationType: 'adjacent',
    description: 'Combines Cinder and Spark. Triggers Spark adjacent bonus (+2 Heal).',
    cost: 100,
    culture: 'ember'
  },
  {
    id: 'cinder_ember',
    name: 'Volcanic Magma',
    el1: 'cinder',
    el2: 'ember',
    relationType: 'adjacent',
    description: 'Combines Cinder and Ember. Triggers Heat adjacent bonus (+2 Damage).',
    cost: 100,
    culture: 'ember'
  },
  {
    id: 'ember_cinder',
    name: 'Molten Crucible',
    el1: 'ember',
    el2: 'cinder',
    relationType: 'adjacent',
    description: 'Combines Ember and Cinder. Triggers Cinder adjacent bonus (+2 Shield).',
    cost: 100,
    culture: 'ember'
  },

  // --- OPPOSED (150 Essence) ---
  {
    id: 'ember_spark',
    name: 'Plasma Pressure',
    el1: 'ember',
    el2: 'spark',
    relationType: 'opposed',
    description: 'Combines Opposed Ember and Spark. 50% chance for 1.5x power, otherwise 0.5x penalty.',
    cost: 150,
    culture: 'ember'
  },
  {
    id: 'spark_ember',
    name: 'Boiling Spark',
    el1: 'spark',
    el2: 'ember',
    relationType: 'opposed',
    description: 'Combines Opposed Spark and Ember. 50% chance for 1.5x power, otherwise 0.5x penalty.',
    cost: 150,
    culture: 'ember'
  },
  {
    id: 'ash_cinder',
    name: 'Searing Gale',
    el1: 'ash',
    el2: 'cinder',
    relationType: 'opposed',
    description: 'Combines Opposed Ash and Cinder. 50% chance for 1.5x power, otherwise 0.5x penalty.',
    cost: 150,
    culture: 'ember'
  },
  {
    id: 'cinder_ash',
    name: 'Cinder Ash',
    el1: 'cinder',
    el2: 'ash',
    relationType: 'opposed',
    description: 'Combines Opposed Cinder and Ash. 50% chance for 1.5x power, otherwise 0.5x penalty.',
    cost: 150,
    culture: 'ember'
  }
];

export const EMBER_CARD_NAMES: Record<string, string> = {
  // SEVER — Single
  'ember_none_sever': 'Ember Strike',
  'ash_none_sever': 'Ashen Lash',
  'spark_none_sever': 'Spark Lance',
  'cinder_none_sever': 'Cinder Blade',
  // SEVER — Same
  'ember_ember_sever': 'Blazing Twinstrike',
  'ash_ash_sever': 'Ashfall Reaper',
  'spark_spark_sever': 'Overcharged Spark',
  'cinder_cinder_sever': 'Cinderstorm Cleave',
  // SEVER — Adjacent
  'ember_ash_sever': 'Smoldering Edge',
  'ash_spark_sever': 'Kindling Arc',
  'spark_cinder_sever': 'Ember-Forged Spike',
  'ember_cinder_sever': 'Coalfire Slash',
  // SEVER — Opposed
  'ember_spark_sever': 'Volatile Ignition',
  'ash_cinder_sever': "Smother's Gambit",

  // MEND — Single
  'ember_none_mend': "Ember's Mend",
  'ash_none_mend': 'Ashen Balm',
  'spark_none_mend': 'Quickspark Recovery',
  'cinder_none_mend': "Cinder's Comfort",
  // MEND — Same
  'ember_ember_mend': "Ember's Full Warmth",
  'ash_ash_mend': 'Deep Ash Rest',
  'spark_spark_mend': 'Surge Restoration',
  'cinder_cinder_mend': 'Cinderbed Recovery',
  // MEND — Adjacent
  'ember_ash_mend': 'Smoke-Cured Wound',
  'ash_spark_mend': 'Rekindled Vigor',
  'spark_cinder_mend': 'Glowing Renewal',
  'ember_cinder_mend': 'Hearthfire Mend',
  // MEND — Opposed
  'ember_spark_mend': 'Unstable Regeneration',
  'ash_cinder_mend': "Buried Ember's Gift",

  // GUARD — Single
  'ember_none_guard': 'Ember Ward',
  'ash_none_guard': 'Ashen Bulwark',
  'spark_none_guard': 'Static Barrier',
  'cinder_none_guard': 'Cinder Plating',
  // GUARD — Same
  'ember_ember_guard': 'Blazing Bastion',
  'ash_ash_guard': 'Ashen Fortress',
  'spark_spark_guard': 'Overcharged Barrier',
  'cinder_cinder_guard': 'Iron Cinder Wall',
  // GUARD — Adjacent
  'ember_ash_guard': 'Smoke Veil',
  'ash_spark_guard': 'Charged Cinderscreen',
  'spark_cinder_guard': 'Insulated Plating',
  'ember_cinder_guard': 'Hearthguard',
  // GUARD — Opposed
  'ember_spark_guard': 'Volatile Aegis',
  'ash_cinder_guard': 'Smothered Bastion',

  // UNMAKE — Single
  'ember_none_unmake': 'Slow Burn',
  'ash_none_unmake': 'Choking Ash',
  'spark_none_unmake': 'Arcing Decay',
  'cinder_none_unmake': 'Smoldering Rot',
  // UNMAKE — Same
  'ember_ember_unmake': 'Twin Cinder Unmaking',
  'ash_ash_unmake': 'Ashfall Blight',
  'spark_spark_unmake': 'Overload Decay',
  'cinder_cinder_unmake': 'Deep Cinder Rot',
  // UNMAKE — Adjacent
  'ember_ash_unmake': 'Smoldering Curse',
  'ash_spark_unmake': 'Static Ashburn',
  'spark_cinder_unmake': 'Emberous Decay',
  'ember_cinder_unmake': 'Hearthrot',
  // UNMAKE — Opposed
  'ember_spark_unmake': 'Volatile Unmaking',
  'ash_cinder_unmake': 'Silent Consumption',
};

// Note: Redraw's "retrieve from discard" concept is real, deferred content for the future Power/Rule per-battle card system.

export function getComboKey(el1: string, el2: string | null, component: string): string {
  const [cEl1, cEl2] = canonicalizeElements(el1, el2);
  const second = cEl2 || 'none';
  return `${cEl1}_${second}_${component}`;
}

export function getCardName(el1: string, el2: string | null, component: string): string {
  const [cEl1, cEl2] = canonicalizeElements(el1, el2);
  const key = getComboKey(cEl1, cEl2, component);
  return EMBER_CARD_NAMES[key] ?? `${cEl1}/${cEl2 ?? '—'} ${component}`;
}

export function buildEmberCardPool(): Card[] {
  const cards: Card[] = [];
  const keys = Object.keys(EMBER_CARD_NAMES);
  for (const key of keys) {
    const parts = key.split('_');
    const el1 = parts[0];
    const el2 = parts[1] === 'none' ? null : parts[1];
    const component = parts[2];

    const [cEl1, cEl2] = canonicalizeElements(el1, el2);

    let relationType: 'single' | 'same' | 'adjacent' | 'opposed' = 'single';
    if (!cEl2) {
      relationType = 'single';
    } else if (cEl1 === cEl2) {
      relationType = 'same';
    } else {
      const idx1 = EMBER_ELEMENTS.indexOf(cEl1);
      const idx2 = EMBER_ELEMENTS.indexOf(cEl2);
      const diff = Math.abs(idx1 - idx2);
      if (diff === 1 || diff === 3) {
        relationType = 'adjacent';
      } else {
        relationType = 'opposed';
      }
    }

    cards.push({
      id: key,
      name: EMBER_CARD_NAMES[key],
      el1: cEl1,
      el2: cEl2,
      component,
      relationType,
    });
  }
  return cards;
}

export { BOON_POOL } from './boons';
export { RELIC_POOL } from './relics';
export { generateFixedReward, generateReward, generateOpeningPack, type RewardSlot } from './rewards';


