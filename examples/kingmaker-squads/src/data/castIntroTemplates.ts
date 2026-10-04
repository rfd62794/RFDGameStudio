import { UnitArchetype } from '../types';

export const CAST_INTRO_TEMPLATES: Record<UnitArchetype, string> = {
  rook: "Doesn't talk about the night you fell. Was there for it. Won't say more than that, and you've learned not to ask.",
  bishop: "Figured out who you were before you did. Never told anyone. Still hasn't explained why.",
  knight: "Doesn't care whose blood you carry. Cares that you're the only person down here who's ever meant a promise.",
  queen: "Was offered something worth having, once, for what they know about you. Still here. Never explains why that wasn't enough.",
  pawn: "Too young to remember the palace. Old enough to know what happens to people who talk about who lives in this room.",
};

export function getArchetypeClassTitle(archetype: UnitArchetype): string {
  switch (archetype) {
    case 'rook':
      return 'Warden';
    case 'bishop':
      return 'Adept';
    case 'knight':
      return 'Outrider';
    case 'queen':
      return 'Champion';
    case 'pawn':
    default:
      return 'Recruit';
  }
}
