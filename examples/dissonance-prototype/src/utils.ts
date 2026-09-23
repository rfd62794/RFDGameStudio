import React from 'react';
import { Flame, Wind, Sparkles, Mountain } from 'lucide-react';

export {
  EMBER_ELEMENTS,
  EMBER_MODIFIERS,
  FUTURE_CULTURES,
  resolve_combination,
  getEnemyIntent,
  canonicalizeElements,
  getSecondaryType,
  TYPE_ADVANTAGE,
  getTypeMultiplier
} from './logic/combat';

export {
  DECK_SIZE,
  HAND_SIZE,
  RESHUFFLE_THRESHOLD,
  shuffle,
  drawCard,
  drawHand,
  NAMED_CARD_POOL,
  EMBER_CARD_NAMES,
  getComboKey,
  getCardName,
  buildEmberCardPool,
  generateReward,
  generateFixedReward,
  generateOpeningPack,
  type RewardSlot,
  BOON_POOL,
  RELIC_POOL
} from './logic/deck';

export { FLOOR_FLAVOR } from './types';
export { MAX_MAP_ATTEMPTS } from './logic/mapGraph';

import { Card, TypedBoon } from './types';
import { resolve_combination } from './logic/combat';
import { buildEmberCardPool } from './logic/deck';

const ACTION_WEIGHT: Record<string, number> = { sever: 1.0, guard: 0.8, mend: 0.9, unmake: 0.85 };
const TIER_MULT: Record<string, number> = { single: 1.0, same: 1.15, adjacent: 1.3, opposed: 1.5 };

export function computeCardPowerValue(card: Card): number {
  const result = resolve_combination(card.el1, card.el2, card.component, 0);
  let effectiveValue = result.modifiedValue;
  if (card.component === 'unmake') {
    effectiveValue = result.modifiedValue * (result.dotDuration || 2); // uses §2's corrected duration
  }
  return effectiveValue * (ACTION_WEIGHT[card.component] ?? 1.0) * (TIER_MULT[card.relationType] ?? 1.0);
}

export function computeDeckPowerLevel(deckCardIds: string[]): number {
  const pool = buildEmberCardPool();
  return deckCardIds.reduce((sum, id) => {
    const card = pool.find(c => c.id === id);
    return sum + (card ? computeCardPowerValue(card) : 0);
  }, 0);
}

const REFERENCE_DECK_POWER = 72; // 8 cards × pool mean CardValue (~9)

export function computeLiveDifficultyMultiplier(
  currentDeckPowerLevel: number,
  currentHp: number,
  maxHp: number
): number {
  const powerRatio = currentDeckPowerLevel / REFERENCE_DECK_POWER;
  // Stronger deck -> lower multiplier (easier). Bounded so this is a
  // NUDGE, not a wild swing that would undermine the validated band.
  let multiplier = 1 / (powerRatio || 1);
  multiplier = Math.max(0.8, Math.min(1.25, multiplier));

  // Mercy nudge at low current HP — real precedent: RE4's hidden DDA
  // softens challenge when a player is struggling, not just when
  // their build is objectively weak.
  const hpFraction = currentHp / maxHp;
  if (hpFraction < 0.4) multiplier *= 0.9;

  return multiplier;
}

export const POWER_LEVEL_CAP: Record<number, number | null> = {
  1: null,
  2: null,
  3: null, // no cap — breadth floors
  4: 72,
  5: 60,
};

export function previewCardEffect(card: { el1: string; el2: string | null; component: string }): {
  label: string;
} {
  const actionLabelMap: Record<string, string> = {
    sever: 'Damage',
    mend: 'Heal',
    guard: 'Shield',
    unmake: 'DoT',
  };
  const actionLabel = actionLabelMap[card.component] || 'Effect';

  const result = resolve_combination(card.el1, card.el2, card.component, 0);

  if (result.relationType === 'opposed') {
    const successVal = Math.round(result.baseValue * 1.5);
    const failVal = Math.round(result.baseValue * 0.5);
    return { label: `${successVal} ${actionLabel} (Success) / ${failVal} ${actionLabel} (Fizzle)` };
  }

  if (card.component === 'unmake') {
    return { label: `${result.modifiedValue} DoT (${result.dotDuration} turns)` };
  }

  const multiplierTag = result.multiplier !== 1.0 ? ` (${result.multiplier}x)` : '';
  return { label: `${result.modifiedValue} ${actionLabel}${multiplierTag}` };
}

// New function, wraps previewCardEffect() rather than duplicating it
export function previewCardEffectWithBoons(card: Card, activeBoons: TypedBoon[]): {
  baseLabel: string;
  boostedLabel?: string;
  baseValue?: number;
  boostedValue?: number;
  contributingBoons?: TypedBoon[];
} {
  const base = previewCardEffect(card);
  if (!activeBoons || !activeBoons.length) return { baseLabel: base.label };

  const applicable = activeBoons.filter(b =>
    (b.targetType === 'element' && (b.targetId === card.el1 || b.targetId === card.el2)) ||
    (b.targetType === 'action' && b.targetId === card.component) ||
    (b.targetType === 'combination' && (
      b.targetId === card.relationType ||
      b.targetId === `${card.el1}_${card.component}` ||
      (card.el2 && b.targetId === `${card.el2}_${card.component}`)
    ))
  );
  if (!applicable.length) return { baseLabel: base.label };

  const totalBonus = applicable.reduce((sum, b) => sum + (b.modifier || 0), 0);
  if (!totalBonus) return { baseLabel: base.label };

  const res = resolve_combination(card.el1, card.el2, card.component, 0);
  const baseNum = res.modifiedValue;
  const boostedNum = baseNum + totalBonus;

  return {
    baseLabel: base.label,
    boostedLabel: `${baseNum} (${boostedNum})`,
    baseValue: baseNum,
    boostedValue: boostedNum,
    contributingBoons: applicable,
  };
}

// Get distinct color themes for Elements
export const getElementColor = (el: string | null) => {
  if (!el) return 'border-slate-700 bg-slate-900/40 text-slate-400';
  switch (el) {
    case 'ember': return 'border-amber-500/55 bg-amber-950/20 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.15)]';
    case 'ash': return 'border-slate-500/55 bg-slate-950/20 text-slate-300 shadow-[0_0_8px_rgba(148,163,184,0.15)]';
    case 'spark': return 'border-yellow-500/55 bg-yellow-950/20 text-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.15)]';
    case 'cinder': return 'border-red-600/55 bg-red-950/20 text-red-500 shadow-[0_0_8px_rgba(220,38,38,0.15)]';
    default: return 'border-slate-700 bg-slate-950/20 text-slate-400';
  }
};

export const getElementIcon = (el: string | null) => {
  if (!el) return null;
  switch (el) {
    case 'ember': return React.createElement(Flame, { className: "w-4.5 h-4.5" });
    case 'ash': return React.createElement(Wind, { className: "w-4.5 h-4.5" });
    case 'spark': return React.createElement(Sparkles, { className: "w-4.5 h-4.5" });
    case 'cinder': return React.createElement(Mountain, { className: "w-4.5 h-4.5" });
    default: return null;
  }
};

export const getComponentColor = (comp: string) => {
  switch (comp) {
    case 'mend': return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/10';
    case 'guard': return 'text-blue-400 border-blue-500/40 bg-blue-950/10';
    case 'sever': return 'text-rose-400 border-rose-500/40 bg-rose-950/10';
    case 'unmake': return 'text-indigo-400 border-indigo-500/40 bg-indigo-950/10';
    default: return 'text-slate-400 border-slate-700 bg-slate-800';
  }
};
