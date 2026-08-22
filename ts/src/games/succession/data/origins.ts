import { FigureId } from '../engine/types';
import {
  BASTARD_CHANCELLOR_STARTING_FAVOR,
  KNIGHT_COMMANDER_APPEAL_FAVOR_GAIN,
  KNIGHT_ARCHBISHOP_APPEAL_FAVOR_GAIN,
  MERCHANT_RIVAL_FIRST_WHISPER_BONUS,
  MERCHANT_SLANDER_PENALTY,
  RIVAL_SLANDER_PENALTY,
} from './gameConstants';

export type PlayerOriginId = 'bastard_scion' | 'disgraced_knight' | 'merchant_banker';

export interface PlayerOriginModifiers {
  startingFavor?: Partial<Record<FigureId, number>>;
  startingEvidenceIndices?: number[];
  appealFavorGainOverride?: Partial<Record<FigureId, number>>;
  appealRequiredBeforeWhisper?: FigureId[];
  slanderPenaltyMultiplier?: number;
  rivalFirstWhisperBonus?: number;
}

export interface PlayerOrigin {
  id: PlayerOriginId;
  name: string;
  subtitle: string;
  icon: string;
  strategicAdvantage: string;
  inherentFriction: string;
  description: string;
  modifiers: PlayerOriginModifiers;
}

export function getOriginModifiers(playerOrigin: PlayerOriginId): PlayerOriginModifiers {
  return PLAYER_ORIGINS.find((o) => o.id === playerOrigin)?.modifiers ?? {};
}

export const PLAYER_ORIGINS: PlayerOrigin[] = [
  {
    id: 'bastard_scion',
    name: 'Bastard Scion',
    subtitle: 'The Unacknowledged Bloodline',
    icon: 'Sparkles',
    strategicAdvantage: 'Starts with 1 Scouted Clue ("The Smuggler\'s Vault Ledger") in inventory.',
    inherentFriction: 'Chancellor begins with Cold favor (-5 starting penalty).',
    description: 'Born in the shadow of the palace with direct knowledge of royal secrets, but despised by the noble establishment.',
    modifiers: {
      startingFavor: { chancellor: BASTARD_CHANCELLOR_STARTING_FAVOR },
      startingEvidenceIndices: [0],
    },
  },
  {
    id: 'disgraced_knight',
    name: 'Disgraced Iron Knight',
    subtitle: 'Veteran of the Citadel Siege',
    icon: 'Shield',
    strategicAdvantage: 'Commander Appeals grant +50% favor gain (+12 instead of +8).',
    inherentFriction: 'Archbishop Appeals grant -50% favor gain (4 instead of 8), and require 1 formal Appeal before Whispers unlock in his antechamber.',
    description: 'A decorated legionary revered by the garrison, but viewed with holy skepticism by the High Sanctum.',
    modifiers: {
      appealFavorGainOverride: { commander: KNIGHT_COMMANDER_APPEAL_FAVOR_GAIN, archbishop: KNIGHT_ARCHBISHOP_APPEAL_FAVOR_GAIN },
      appealRequiredBeforeWhisper: ['archbishop'],
    },
  },
  {
    id: 'merchant_banker',
    name: 'Merchant Banker',
    subtitle: 'Financier of the High Estates',
    icon: 'Coins',
    strategicAdvantage: 'Slander against you has its penalty halved (-5 instead of -10).',
    inherentFriction: 'Rivals gain +5 extra favor on their first Whisper maneuver (+20 instead of +15).',
    description: 'Armed with deep bullion reserves to absorb political libel, though rival claimants rush to outbid your wealth.',
    modifiers: {
      slanderPenaltyMultiplier: MERCHANT_SLANDER_PENALTY / RIVAL_SLANDER_PENALTY,
      rivalFirstWhisperBonus: MERCHANT_RIVAL_FIRST_WHISPER_BONUS,
    },
  },
];
