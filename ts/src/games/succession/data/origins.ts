import { FigureId } from '../engine/types';

export type PlayerOriginId = 'bastard_scion' | 'disgraced_knight' | 'merchant_banker';

export interface PlayerOrigin {
  id: PlayerOriginId;
  name: string;
  subtitle: string;
  icon: string;
  strategicAdvantage: string;
  inherentFriction: string;
  description: string;
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
  },
  {
    id: 'disgraced_knight',
    name: 'Disgraced Iron Knight',
    subtitle: 'Veteran of the Citadel Siege',
    icon: 'Shield',
    strategicAdvantage: 'Commander Appeals grant +50% favor gain (+12 instead of +8).',
    inherentFriction: 'Archbishop requires 1 formal Appeal before Whispers unlock in his antechamber.',
    description: 'A decorated legionary revered by the garrison, but viewed with holy skepticism by the High Sanctum.',
  },
  {
    id: 'merchant_banker',
    name: 'Merchant Banker',
    subtitle: 'Financier of the High Estates',
    icon: 'Coins',
    strategicAdvantage: 'Slander against you has its penalty halved (-5 instead of -10).',
    inherentFriction: 'Rivals gain +5 extra favor on their first Whisper maneuver (+20 instead of +15).',
    description: 'Armed with deep bullion reserves to absorb political libel, though rival claimants rush to outbid your wealth.',
  },
];
