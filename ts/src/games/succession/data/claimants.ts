import { ClaimantId } from '../engine/types';

export interface ClaimantData {
  id: ClaimantId;
  name: string;
  title: string;
  description: string;
  isPlayer: boolean;
}

export const CLAIMANTS: Record<ClaimantId, ClaimantData> = {
  player: {
    id: 'player',
    name: 'The Claimant',
    title: 'The Contender',
    description: 'An audacious outsider making an all-or-nothing play for the throne in the shadow of the King’s passing.',
    isPlayer: true,
  },
  aldric: {
    id: 'aldric',
    name: 'Lord Aldric',
    title: 'Scion of House Montfort',
    description: 'A wealthy, smooth-tongued patrician who levers family coffers and courtly connections.',
    isPlayer: false,
  },
  vivienne: {
    id: 'vivienne',
    name: 'Lady Vivienne',
    title: 'Duchess of the High Reaches',
    description: 'A cunning, sharp-witted strategist with quiet allies across clergy and high nobility.',
    isPlayer: false,
  },
};
