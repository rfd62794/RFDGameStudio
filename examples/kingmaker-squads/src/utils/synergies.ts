import { SynergyBonus, UnitState, Zodiac } from '../types';

const ZODIAC_OPPOSITES: Record<Zodiac, Zodiac> = {
  aries: 'libra',
  libra: 'aries',
  taurus: 'scorpio',
  scorpio: 'taurus',
  gemini: 'sagittarius',
  sagittarius: 'gemini',
  cancer: 'capricorn',
  capricorn: 'cancer',
  leo: 'aquarius',
  aquarius: 'leo',
  virgo: 'pisces',
  pisces: 'virgo',
};

function countOpposingZodiacPairs(units: UnitState[]): number {
  let pairCount = 0;
  const used = new Set<string>();

  for (let i = 0; i < units.length; i++) {
    if (used.has(units[i].id)) continue;
    for (let j = i + 1; j < units.length; j++) {
      if (used.has(units[j].id)) continue;
      if (units[i].zodiac && units[j].zodiac && ZODIAC_OPPOSITES[units[i].zodiac] === units[j].zodiac) {
        pairCount++;
        used.add(units[i].id);
        used.add(units[j].id);
        break;
      }
    }
  }

  return pairCount;
}

export function calculateSynergies(units: UnitState[]): SynergyBonus[] {
  const counts = {
    pawn: 0,
    knight: 0,
    bishop: 0,
    rook: 0,
    queen: 0,
  };

  units.forEach((u) => {
    if (counts[u.archetype] !== undefined) {
      counts[u.archetype]++;
    }
  });

  const bishopPairActive = counts.bishop >= 2;
  const knightOutpostActive = counts.knight >= 1 && counts.pawn >= 1;
  const batteryActive = counts.rook >= 2 || (counts.rook >= 1 && counts.queen >= 1);
  const royalGuardActive = counts.queen >= 1 && counts.knight >= 1;
  const pawnPhalanxActive = counts.pawn >= 2;

  const opposingPairs = countOpposingZodiacPairs(units);
  const celestialAlignmentActive = opposingPairs >= 1;

  return [
    {
      type: 'bishop_pair',
      name: 'Bishop Pair',
      countNeeded: 2,
      currentCount: counts.bishop,
      description: '+30% Healing output & Spell Criticals',
      isActive: bishopPairActive,
    },
    {
      type: 'knight_outpost',
      name: 'Knight Outpost',
      countNeeded: 2,
      currentCount: counts.knight + counts.pawn,
      description: '+3 Defense & +2 Speed to Outpost units',
      isActive: knightOutpostActive,
    },
    {
      type: 'battery',
      name: 'Battery',
      countNeeded: 2,
      currentCount: counts.rook + counts.queen,
      description: '+15 Max HP & Heavy Impact (+5 Atk)',
      isActive: batteryActive,
    },
    {
      type: 'royal_guard',
      name: 'Royal Guard',
      countNeeded: 2,
      currentCount: counts.queen + counts.knight,
      description: 'Escort Protection & +25% Critical Chance',
      isActive: royalGuardActive,
    },
    {
      type: 'pawn_phalanx',
      name: 'Pawn Phalanx',
      countNeeded: 2,
      currentCount: counts.pawn,
      description: '+3 Attack per adjacent Pawn in Phalanx',
      isActive: pawnPhalanxActive,
    },
    {
      type: 'celestial_alignment',
      name: 'Celestial Alignment',
      countNeeded: 2,
      currentCount: opposingPairs * 2,
      description: 'Harmonizes opposing zodiac signs in cosmic alignment',
      isActive: celestialAlignmentActive,
    },
  ];
}
