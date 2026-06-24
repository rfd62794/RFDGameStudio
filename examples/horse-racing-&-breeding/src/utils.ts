/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Horse, RaceParticipant, Race } from './types';

// Constants for names
const NAME_PREFIXES = [
  'Midnight', 'Golden', 'Silver', 'Blazing', 'Starlight', 'Stormy', 'Crimson', 'Desert',
  'Lunar', 'Solar', 'Gilded', 'Phantom', 'Velvet', 'Noble', 'Iron', 'Ocean', 'Rapid',
  'Whispering', 'Royal', 'Sassy', 'Classic', 'Copper', 'Platinum', 'Sovereign', 'Misty',
  'Zephyr', 'Slick', 'Voodoo', 'Dapper', 'Bold', 'Dusk', 'Dawn', 'Secret', 'Swift'
];

const NAME_SUFFIXES = [
  'Rider', 'Storm', 'Dancer', 'Bullet', 'Runner', 'Streak', 'Star', 'Flame', 'Shadow',
  'Whisper', 'Gallop', 'Dream', 'Spirit', 'Crown', 'Glory', 'Echo', 'Blitz', 'Breeze',
  'Arrow', 'Pride', 'Chaser', 'Quest', 'Comet', 'Heart', 'Legacy', 'Symphony', 'Slayer',
  'Crest', 'Tide', 'Monarch', 'Vanguard', 'Eclipse', 'Miracle', 'Spectre'
];

// Aesthetic natural horse color profiles
export interface ColorProfile {
  name: string;
  body: string;
  mane: string;
  socks: string;
  weight: number; // probability weighting
}

export const COAT_COLORS: ColorProfile[] = [
  { name: 'Bay', body: '#91532B', mane: '#1C1917', socks: '#1C1917', weight: 30 },            // Reddish brown, black points
  { name: 'Chestnut', body: '#A15C21', mane: '#B46E2A', socks: '#A15C21', weight: 25 },       // Reddish copper
  { name: 'Black', body: '#292524', mane: '#1C1917', socks: '#1C1917', weight: 15 },          // Coal black
  { name: 'Gray', body: '#D6D3D1', mane: '#F5F5F4', socks: '#A8A29E', weight: 15 },           // Speckled gray/white
  { name: 'Palomino', body: '#EAB308', mane: '#FEF08A', socks: '#FEF08A', weight: 8 },        // Golden, white mane
  { name: 'Buckskin', body: '#EAB308', mane: '#1C1917', socks: '#1C1917', weight: 5 },        // Tan, black points
  { name: 'Albino', body: '#FAFAF9', mane: '#FAFAF9', socks: '#E7E5E4', weight: 1 },          // pure snowy white
  { name: 'Emerald (Rare Mutation)', body: '#059669', mane: '#34D399', socks: '#059669', weight: 0.4 }, // Special mutant
  { name: 'Sapphire (Rare Mutation)', body: '#2563EB', mane: '#60A5FA', socks: '#2563EB', weight: 0.3 }, // Special mutant
  { name: 'Ruby (Rare Mutation)', body: '#DC2626', mane: '#F87171', socks: '#DC2626', weight: 0.3 }       // Special mutant
];

// Jockey Jersey Colors (bright, highly visible)
export const SILK_COLORS = [
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Orange/Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#14B8A6'  // Teal
];

// Helper to get random item from array
export function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate random name
export function generateHorseName(): string {
  return `${getRandomItem(NAME_PREFIXES)} ${getRandomItem(NAME_SUFFIXES)}`;
}

// Generate random color profile based on probability weights
export function generateColorProfile(): Pick<Horse, 'colorBody' | 'colorMane' | 'colorSocks'> {
  const totalWeight = COAT_COLORS.reduce((acc, current) => acc + current.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const profile of COAT_COLORS) {
    if (random < profile.weight) {
      return {
        colorBody: profile.body,
        colorMane: profile.mane,
        colorSocks: profile.socks
      };
    }
    random -= profile.weight;
  }
  
  // Fallback
  return {
    colorBody: '#91532B',
    colorMane: '#1C1917',
    colorSocks: '#1C1917'
  };
}

// Generate a random horse
export function generateRandomHorse(options: { 
  playerOwned?: boolean; 
  minStat?: number; 
  maxStat?: number;
  generation?: number;
  gender?: 'Stallion' | 'Mare';
} = {}): Horse {
  const { 
    playerOwned = false, 
    minStat = 25, 
    maxStat = 65, 
    generation = 1,
    gender = Math.random() > 0.5 ? 'Stallion' : 'Mare'
  } = options;

  const randStat = () => Math.floor(minStat + Math.random() * (maxStat - minStat));
  const colors = generateColorProfile();

  // Price calculation based on stats
  const speed = randStat();
  const stamina = randStat();
  const acc = randStat();
  const temperament = randStat();
  
  const avgStat = (speed + stamina + acc + temperament) / 4;
  const price = Math.floor(avgStat * avgStat * 0.35 + (generation * 100) + Math.random() * 50);

  return {
    id: `horse_${Math.random().toString(36).substr(2, 9)}`,
    name: generateHorseName(),
    gender,
    generation,
    speed,
    stamina,
    acceleration: acc,
    temperament,
    ...colors,
    colorJockeySilk: getRandomItem(SILK_COLORS),
    runs: 0,
    wins: 0,
    places: 0,
    thirds: 0,
    careerEarnings: 0,
    cooldownUntil: 0,
    isPlayerOwned: playerOwned,
    price
  };
}

// Breed details
export function breedHorses(father: Horse, mother: Horse): Horse {
  if (father.gender !== 'Stallion' || mother.gender !== 'Mare') {
    throw new Error("Breeding requires a Stallion (father) and a Mare (mother).");
  }

  const nextGen = Math.max(father.generation, mother.generation) + 1;
  const gender = Math.random() > 0.5 ? 'Stallion' : 'Mare';

  // Inherit stats with a genetic variance/mutation
  // Formula: average of parents + statistical shift (could turn out better or worse)
  // Shift is normally biased towards a slight improvement for generations, but with random risk.
  const breedStat = (statF: number, statM: number) => {
    const parentAvg = (statF + statM) / 2;
    // Standard normal distribution approximation
    const mutation = (Math.random() + Math.random() + Math.random() - 1.5) * 10; // -15 to +15 centered on 0
    // Slight generational boost: 1.5 pts average increase
    const finalStat = Math.round(parentAvg + mutation + 2.0);
    return Math.max(10, Math.min(100, finalStat));
  };

  const speed = breedStat(father.speed, mother.speed);
  const stamina = breedStat(father.stamina, mother.stamina);
  const acceleration = breedStat(father.acceleration, mother.acceleration);
  const temperament = breedStat(father.temperament, mother.temperament);

  // Inherit coat colors with some probability logic:
  // 45% father color, 45% mother color, 10% completely new mutation
  let colorBody = father.colorBody;
  let colorMane = father.colorMane;
  let colorSocks = father.colorSocks;

  const colorRoll = Math.random();
  if (colorRoll > 0.45 && colorRoll <= 0.90) {
    colorBody = mother.colorBody;
    colorMane = mother.colorMane;
    colorSocks = mother.colorSocks;
  } else if (colorRoll > 0.90) {
    // New mutation roll
    const profile = generateColorProfile();
    colorBody = profile.colorBody;
    colorMane = profile.colorMane;
    colorSocks = profile.colorSocks;
  }

  // Jockey silk: mixed/random
  const colorJockeySilk = Math.random() > 0.5 ? father.colorJockeySilk : mother.colorJockeySilk;

  const childName = `${father.name.split(' ')[0]} ${mother.name.split(' ')[1] || generateHorseName().split(' ')[1]}`;

  return {
    id: `horse_${Math.random().toString(36).substr(2, 9)}`,
    name: childName,
    gender,
    generation: nextGen,
    speed,
    stamina,
    acceleration,
    temperament,
    colorBody,
    colorMane,
    colorSocks,
    colorJockeySilk,
    runs: 0,
    wins: 0,
    places: 0,
    thirds: 0,
    careerEarnings: 0,
    cooldownUntil: 0,
    isPlayerOwned: true,
    parents: {
      fatherId: father.id,
      fatherName: father.name,
      motherId: mother.id,
      motherName: mother.name
    }
  };
}

// Calculate decimal payout odds based on stats and competitors
export function calculateOdds(participants: Horse[], distance: number): number[] {
  // Score horses based on how well their stats fit the race distance
  // Sprints (800m): Acceleration (45%), Speed (45%), Stamina (10%)
  // Medium (1200m): Speed (40%), Stamina (35%), Acceleration (25%)
  // Long (1600m): Stamina (55%), Speed (30%), Acceleration (15%)
  
  const scores = participants.map(h => {
    let score = 0;
    if (distance <= 900) {
      score = h.acceleration * 0.45 + h.speed * 0.45 + h.stamina * 0.10;
    } else if (distance <= 1400) {
      score = h.speed * 0.40 + h.stamina * 0.35 + h.acceleration * 0.25;
    } else {
      score = h.stamina * 0.55 + h.speed * 0.30 + h.acceleration * 0.15;
    }
    
    // Slight bump for temperament (consistency of peak performance)
    score += h.temperament * 0.05;
    return Math.max(1, score);
  });

  const totalScore = scores.reduce((sum, s) => sum + s, 0);
  
  // Ideal bookmaker balanced book with ~110% overround (total probability is 1.1)
  const overround = 1.12;
  
  const odds = scores.map(s => {
    // Probability is proportional to score
    const prob = (s / totalScore) * overround;
    // Odds = 1 / probability
    let decimalOdds = 1 / Math.max(0.01, prob);
    
    // Format odds cleanly (round to nearest tenth, e.g., 3.5, 12.0)
    decimalOdds = Math.round(decimalOdds * 10) / 10;
    return Math.max(1.1, decimalOdds);
  });

  return odds;
}

// Generate scheduling and detail template for a new race
export function createNewRace(availableRoster: Horse[], playerHorses: Horse[]): Race {
  const distances = [800, 1200, 1600];
  const rDistance = getRandomItem(distances);
  
  const raceClasses: { name: 'Maiden' | 'Class III' | 'Class II' | 'Class I' | 'Grand Prix'; min: number; max: number; fee: number; prize: number }[] = [
    { name: 'Maiden', min: 10, max: 40, fee: 0, prize: 300 },
    { name: 'Class III', min: 35, max: 55, fee: 30, prize: 600 },
    { name: 'Class II', min: 50, max: 70, fee: 75, prize: 1200 },
    { name: 'Class I', min: 65, max: 85, fee: 150, prize: 2500 },
    { name: 'Grand Prix', min: 80, max: 100, fee: 300, prize: 6000 }
  ];

  // Pick class based on random rolls, skewed by player horse ranks
  let selectedClass = raceClasses[0];
  const roll = Math.random();
  if (roll > 0.85) selectedClass = raceClasses[4];
  else if (roll > 0.65) selectedClass = raceClasses[3];
  else if (roll > 0.45) selectedClass = raceClasses[2];
  else if (roll > 0.20) selectedClass = raceClasses[1];

  // Compile a pool of competitors matching the class requirements
  const poolOfNPCs: Horse[] = [];
  for (let i = 0; i < 20; i++) {
    poolOfNPCs.push(generateRandomHorse({
      playerOwned: false,
      minStat: selectedClass.min,
      maxStat: selectedClass.max,
      generation: Math.floor(Math.random() * 2) + 1
    }));
  }

  // Choose participants:
  // Let's have exactly 6 horses in the race for clean visuals
  const numParticipants = 6;
  const participantsList: Horse[] = [];

  // Always offer a potential slot for a Player Horse if there's one that isn't resting
  const eligiblePlayerHorses = playerHorses.filter(h => h.cooldownUntil < Date.now());
  
  if (eligiblePlayerHorses.length > 0 && Math.random() > 0.1) {
    // Add one player horse
    participantsList.push(getRandomItem(eligiblePlayerHorses));
  }

  // Fill up the rest with NPCs
  while (participantsList.length < numParticipants) {
    const npc = poolOfNPCs.pop()!;
    if (!participantsList.some(p => p.id === npc.id)) {
      participantsList.push(npc);
    }
  }

  // Shuffle participants for gate assignment
  const shuffled = [...participantsList].sort(() => Math.random() - 0.5);

  // Calculate betting odds
  const odds = calculateOdds(shuffled, rDistance);

  const raceName = `${getRandomItem([
    'Kentucky', 'Royal Ascot', 'Melbourne', 'Epsom', 'Dubai', 'Tokyo', 'Saratoga', 'Chantilly', 'Belmont'
  ])} ${getRandomItem([
    'Derby', 'Cup', 'Stakes', 'Grand Classic', 'Mile', 'Oaks', 'Sprint', 'Showdown', 'Championship'
  ])}`;

  return {
    id: `race_${Math.random().toString(36).substr(2, 9)}`,
    name: raceName,
    description: `${selectedClass.name} - ${rDistance}m on standard turf. Prize: $${selectedClass.prize} split amongst 1st (60%), 2nd (25%), 3rd (15%).`,
    distance: rDistance,
    class: selectedClass.name,
    prizePool: selectedClass.prize,
    status: 'scheduled',
    participants: shuffled.map((horse, index) => ({
      horse,
      gate: index + 1,
      odds: odds[index],
      progress: 0,
      currentDistance: 0,
      currentSpeed: 0,
      energy: 100,
      isFinished: false
    }))
  };
}
