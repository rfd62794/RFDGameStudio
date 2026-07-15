import { Slime, SlimeColor, SlimePattern, SlimeStats, CombatZone, CorporateContract, LogEntry, PlanetNode, PlanetRegion, LabState, CodexEntry, LifeStage } from './types';

// Melancholic, space-age, corporate slime names
const SLIME_NAME_PREFIXES = [
  'Specimen', 'Subject', 'Orbital', 'Cinder', 'Dusty', 'Rusty', 'Void', 
  'Gloop', 'Solder', 'Glitch', 'Slick', 'Vapor', 'Anode', 'Cathode', 
  'Zero', 'Ion', 'Debris', 'Vector', 'Echo', 'Drift'
];

const SLIME_NAME_SUFFIXES = [
  'A-01', 'B-12', 'X', 'Beta', 'Omega', 'Prime', 'Zero', '09', '402', 
  '77', 'Core', 'V', 'Dampener', 'Isotope', 'Sol', 'Flux', 'Drifter', 'Echo'
];

export function generateSlimeName(): string {
  const p = SLIME_NAME_PREFIXES[Math.floor(Math.random() * SLIME_NAME_PREFIXES.length)];
  const s = SLIME_NAME_SUFFIXES[Math.floor(Math.random() * SLIME_NAME_SUFFIXES.length)];
  return `${p}-${s}`;
}

// Colors and their specializations
export const COLOR_SPECS: Record<SlimeColor, { specialty: string; baseStats: SlimeStats; growth: SlimeStats; rgb: string }> = {
  Red: {
    specialty: 'High HP & ATK (Cinder Strain)',
    baseStats: { hp: 120, atk: 18, def: 8, agi: 6, int: 5, chm: 6 },
    growth: { hp: 15, atk: 3, def: 1, agi: 0.8, int: 0.5, chm: 0.6 },
    rgb: 'rgb(239, 68, 68)',
  },
  Blue: {
    specialty: 'High DEF & INT (Abyssal Strain)',
    baseStats: { hp: 90, atk: 10, def: 14, agi: 5, int: 15, chm: 12 },
    growth: { hp: 10, atk: 1.2, def: 2, agi: 0.6, int: 2.5, chm: 1.5 },
    rgb: 'rgb(59, 130, 246)',
  },
  Yellow: {
    specialty: 'High AGI & ATK (Sulphur Strain)',
    baseStats: { hp: 80, atk: 15, def: 6, agi: 18, int: 8, chm: 10 },
    growth: { hp: 9, atk: 2.2, def: 0.8, agi: 2.4, int: 1.0, chm: 1.0 },
    rgb: 'rgb(234, 179, 8)',
  },
  Purple: {
    specialty: 'Ultra-High INT & Balanced (Nebula Strain)',
    baseStats: { hp: 100, atk: 12, def: 10, agi: 10, int: 20, chm: 15 },
    growth: { hp: 11, atk: 1.5, def: 1.2, agi: 1.2, int: 3.0, chm: 2.0 },
    rgb: 'rgb(168, 85, 247)',
  },
  Orange: {
    specialty: 'Extreme ATK & AGI (Solar Strain)',
    baseStats: { hp: 110, atk: 22, def: 5, agi: 14, int: 6, chm: 8 },
    growth: { hp: 12, atk: 3.5, def: 0.5, agi: 1.8, int: 0.6, chm: 0.8 },
    rgb: 'rgb(249, 115, 22)',
  },
  Green: {
    specialty: 'Extreme HP & DEF (Jungle Strain)',
    baseStats: { hp: 160, atk: 8, def: 16, agi: 4, int: 7, chm: 14 },
    growth: { hp: 22, atk: 1.0, def: 2.5, agi: 0.5, int: 0.8, chm: 1.6 },
    rgb: 'rgb(34, 197, 94)',
  },
  Gray: {
    specialty: 'Balanced Mysterious Trait (Void Strain)',
    baseStats: { hp: 110, atk: 14, def: 11, agi: 11, int: 14, chm: 11 },
    growth: { hp: 13, atk: 2.0, def: 1.5, agi: 1.5, int: 2.0, chm: 1.2 },
    rgb: 'rgb(107, 114, 128)',
  },
};

// Patterns and descriptions
export const PATTERN_DESCRIPTIONS: Record<SlimePattern, { name: string; bonus: string; description: string }> = {
  Solid: {
    name: 'Basic Solid',
    bonus: 'None',
    description: 'A completely unadorned, standard membrane texture.',
  },
  Stripe: {
    name: 'Parallel Banding',
    bonus: '+10% Agility',
    description: 'Vibrating, longitudinal muscle fibers lined along the skin.',
  },
  Polka: {
    name: 'Mitosis Clusters',
    bonus: '+10% Max HP',
    description: 'Localized pockets of nutrient-dense slime spheres.',
  },
  Glow: {
    name: 'Bioluminescence',
    bonus: '+15% Intelligence',
    description: 'A pale cosmic hum radiating from within the nucleus.',
  },
  Crown: {
    name: 'Crystalline Spines',
    bonus: '+15% Attack',
    description: 'Calcified solar debris solidified onto the head mantle.',
  },
  Ringed: {
    name: 'Orbit Rings',
    bonus: '+15% Defense',
    description: 'Rotational electromagnetic bands spinning around the core.',
  },
  Nebula: {
    name: 'Star Swirls',
    bonus: '+10% All Stats',
    description: 'A swirling mixture of cosmic stardust that traps ambient light.',
  },
  Obsidian: {
    name: 'Asteroid Crust',
    bonus: '+25% HP & +25% DEF',
    description: 'Blackened basalt segments fused during sub-orbital entry.',
  },
};

// Colors blending matrix
export function breedColors(c1: SlimeColor, c2: SlimeColor): SlimeColor {
  if (c1 === c2) return c1;

  const pair = [c1, c2].sort().join('+');

  switch (pair) {
    case 'Blue+Red':
      return 'Purple'; // Nebula
    case 'Red+Yellow':
      return 'Orange'; // Solar
    case 'Blue+Yellow':
      return 'Green';  // Jungle
    default:
      // Non-standard mixtures have a 40% parent A, 40% parent B, 20% Gray (Void mutation)
      const rand = Math.random();
      if (rand < 0.4) return c1;
      if (rand < 0.8) return c2;
      return 'Gray';
  }
}

// Patterns breeding logic
export function breedPatterns(p1: SlimePattern, p2: SlimePattern): SlimePattern {
  const rand = Math.random();

  // If identical patterns
  if (p1 === p2) {
    if (p1 === 'Solid') {
      return rand < 0.8 ? 'Solid' : 'Stripe';
    }
    if (p1 === 'Stripe') {
      return rand < 0.6 ? 'Stripe' : rand < 0.9 ? 'Polka' : 'Glow';
    }
    if (p1 === 'Polka') {
      return rand < 0.6 ? 'Polka' : rand < 0.85 ? 'Glow' : 'Crown';
    }
    if (p1 === 'Glow') {
      return rand < 0.6 ? 'Glow' : rand < 0.85 ? 'Crown' : 'Ringed';
    }
    if (p1 === 'Crown') {
      return rand < 0.6 ? 'Crown' : rand < 0.85 ? 'Ringed' : 'Nebula';
    }
    if (p1 === 'Ringed') {
      return rand < 0.6 ? 'Ringed' : rand < 0.85 ? 'Nebula' : 'Obsidian';
    }
    if (p1 === 'Nebula') {
      return rand < 0.7 ? 'Nebula' : 'Obsidian';
    }
    return 'Obsidian'; // Highest tier, stable
  }

  // If different patterns, merge/upgrade
  const pair = [p1, p2].sort().join('+');

  if (pair === 'Solid+Stripe') {
    return rand < 0.5 ? 'Stripe' : rand < 0.9 ? 'Solid' : 'Polka';
  }
  if (pair === 'Solid+Polka' || pair === 'Solid+Glow') {
    return rand < 0.4 ? p1 : rand < 0.8 ? p2 : 'Stripe';
  }
  if (pair === 'Polka+Stripe') {
    return rand < 0.4 ? 'Polka' : rand < 0.8 ? 'Stripe' : 'Glow';
  }
  if (pair === 'Glow+Stripe' || pair === 'Glow+Polka') {
    return rand < 0.35 ? 'Glow' : rand < 0.7 ? p2 : rand < 0.9 ? 'Crown' : 'Ringed';
  }
  if (pair === 'Crown+Glow' || pair === 'Crown+Polka') {
    return rand < 0.4 ? 'Crown' : rand < 0.8 ? p1 : 'Ringed';
  }
  if (pair === 'Crown+Ringed') {
    return rand < 0.4 ? 'Crown' : rand < 0.8 ? 'Ringed' : 'Nebula';
  }
  if (pair === 'Nebula+Ringed' || pair === 'Nebula+Crown') {
    return rand < 0.45 ? 'Nebula' : rand < 0.8 ? p2 : 'Obsidian';
  }

  // Default fallback for crazy crossbreeds: 45% parent A, 45% parent B, 10% mutation
  if (rand < 0.45) return p1;
  if (rand < 0.9) return p2;
  const allPatterns: SlimePattern[] = ['Solid', 'Stripe', 'Polka', 'Glow', 'Crown', 'Ringed', 'Nebula', 'Obsidian'];
  return allPatterns[Math.floor(Math.random() * allPatterns.length)];
}

export function stageFromLevel(level: number): LifeStage {
  if (level <= 1) return 'Hatchling';
  if (level <= 3) return 'Juvenile';
  if (level <= 5) return 'Young';
  if (level <= 7) return 'Prime';
  if (level <= 9) return 'Veteran';
  return 'Elder';
}

export function stageModifier(stage: LifeStage): number {
  const table: Record<LifeStage, number> = {
    Hatchling: 0.6, Juvenile: 0.8, Young: 1.0,
    Prime: 1.2, Veteran: 1.1, Elder: 0.85
  };
  return table[stage];
}

// Generate stats based on color, level, and pattern modifiers
export function calculateStats(color: SlimeColor, pattern: SlimePattern, level: number): SlimeStats {
  const spec = COLOR_SPECS[color];
  const L = level - 1;

  let hp = Math.floor(spec.baseStats.hp + spec.growth.hp * L);
  let atk = Math.floor(spec.baseStats.atk + spec.growth.atk * L);
  let def = Math.floor(spec.baseStats.def + spec.growth.def * L);
  let agi = Math.floor(spec.baseStats.agi + spec.growth.agi * L);
  let int = Math.floor(spec.baseStats.int + spec.growth.int * L);
  let chm = Math.floor(spec.baseStats.chm + spec.growth.chm * L);

  // Apply pattern bonuses
  switch (pattern) {
    case 'Stripe':
      agi = Math.floor(agi * 1.10);
      break;
    case 'Polka':
      hp = Math.floor(hp * 1.10);
      break;
    case 'Glow':
      int = Math.floor(int * 1.15);
      break;
    case 'Crown':
      atk = Math.floor(atk * 1.15);
      break;
    case 'Ringed':
      def = Math.floor(def * 1.15);
      break;
    case 'Nebula':
      hp = Math.floor(hp * 1.10);
      atk = Math.floor(atk * 1.10);
      def = Math.floor(def * 1.10);
      agi = Math.floor(agi * 1.10);
      int = Math.floor(int * 1.10);
      chm = Math.floor(chm * 1.10);
      break;
    case 'Obsidian':
      hp = Math.floor(hp * 1.25);
      def = Math.floor(def * 1.25);
      break;
    case 'Solid':
    default:
      break;
  }

  // Apply Life Stage modifier
  const stage = stageFromLevel(level);
  const mult = stageModifier(stage);
  hp = Math.floor(hp * mult);
  atk = Math.floor(atk * mult);
  def = Math.floor(def * mult);
  agi = Math.floor(agi * mult);
  int = Math.floor(int * mult);
  chm = Math.floor(chm * mult);

  return { hp, atk, def, agi, int, chm };
}

// Create offspring slime
export function breedSlimes(p1: Slime, p2: Slime, generation: number): Slime {
  const offspringColor = breedColors(p1.color, p2.color);
  const offspringPattern = breedPatterns(p1.pattern, p2.pattern);
  const name = generateSlimeName();
  const stats = calculateStats(offspringColor, offspringPattern, 1);

  return {
    id: `slime_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name,
    color: offspringColor,
    pattern: offspringPattern,
    level: 1,
    xp: 0,
    stats,
    role: 'idle',
    generation: generation,
    parentA: p1.id,
    parentB: p2.id,
    createdAt: Date.now(),
  };
}

// Create a randomized basic seed slime
export function createSeedSlime(color: SlimeColor = 'Red', pattern: SlimePattern = 'Solid'): Slime {
  const name = generateSlimeName();
  const stats = calculateStats(color, pattern, 1);

  return {
    id: `slime_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name,
    color,
    pattern,
    level: 1,
    xp: 0,
    stats,
    role: 'idle',
    generation: 0,
    createdAt: Date.now(),
  };
}

// 3-4 zones reachable by Combat Dispatch matching Phase E zone guidelines
export const INITIAL_ZONES: CombatZone[] = [
  {
    id: 'zone_cinder',
    name: 'Rusty Cinder Craters',
    requiredColor: 'Red',
    recommendedLevel: 1,
    difficulty: 1,
    creditsReward: 50,
    xpReward: 60,
    isUnlocked: true,
    isFirstClearCompleted: false,
    flavorText: 'An iron-rich expanse of heat chimneys and jagged slag-heaps. Ideal for Red Slimes to solidify their core.',
  },
  {
    id: 'zone_sulphur',
    name: 'Yellow Sulphur Fissures',
    requiredColor: 'Yellow',
    recommendedLevel: 2,
    difficulty: 1,
    creditsReward: 75,
    xpReward: 80,
    isUnlocked: false,
    isFirstClearCompleted: false,
    flavorText: 'Acrid volcanic streams containing raw energetic sulfur dust. Yellow Slimes thrive in the high-speed thermal winds.',
  },
  {
    id: 'zone_abyssal',
    name: 'Abyssal Frost Caves',
    requiredColor: 'Blue',
    recommendedLevel: 4,
    difficulty: 2,
    creditsReward: 120,
    xpReward: 150,
    isUnlocked: false,
    isFirstClearCompleted: false,
    flavorText: 'Sub-surface ice tunnels with deep lithium reservoirs. Extremely dense. Blue Slimes absorb freezing pressure with ease.',
  },
  {
    id: 'zone_jungle',
    name: 'Overgrown Biome Reactor',
    requiredColor: 'Green',
    recommendedLevel: 6,
    difficulty: 3,
    creditsReward: 200,
    xpReward: 250,
    isUnlocked: false,
    isFirstClearCompleted: false,
    flavorText: 'A derelict agriculture vessel overgrown with synthetic bioluminescent flora. Green Slimes can assimilate the dense foliage.',
  },
];

// Melancholic / corporate contract flavor texts
const CONTRACT_FLAVORS = [
  'Requesting high-density organic insulation cores. Do not ask for details regarding the thermal payload.',
  'Specimen requested to act as immediate chemical neutralizer in standard waste tanks.',
  'Urgent laboratory trial requirement for sub-cellular membrane shearing. Specimen will be disassembled.',
  'Corporate compliance requires bio-mass buffer reserves to meet annual asteroid operations quotas.',
  'Requested specimen matches target criteria for experimental neuro-network mapping. Energy discharge expected.',
  'A private investor demands a specimen of pristine coloration to decorate their terminal reservoir.',
  'Sub-orbital testing requires low-gravity biological payloads. High probability of orbital separation.',
];

// Generate corporate contracts
export function generateContract(cycle: number): CorporateContract {
  const colors: SlimeColor[] = ['Red', 'Blue', 'Yellow', 'Purple', 'Orange', 'Green'];
  const patterns: SlimePattern[] = ['Solid', 'Stripe', 'Polka', 'Glow', 'Crown', 'Ringed'];

  const color = colors[Math.floor(Math.random() * colors.length)];
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];

  // Rarity increases reward
  let rewardMultiplier = 1;
  if (color === 'Purple' || color === 'Orange' || color === 'Green') rewardMultiplier += 0.5;
  if (pattern !== 'Solid') rewardMultiplier += 0.5;
  if (pattern === 'Glow' || pattern === 'Crown' || pattern === 'Ringed') rewardMultiplier += 0.8;

  const baseCredits = 100;
  const creditsReward = Math.floor(baseCredits * rewardMultiplier + Math.random() * 30);
  const totalCycles = Math.floor(Math.random() * 4) + 5; // 5 to 8 cycles to complete

  const titleCode = `RQ-${Math.floor(Math.random() * 8000 + 1000)}`;

  return {
    id: `contract_${Date.now()}_${Math.floor(Math.random() * 100)}`,
    title: `CONTRACT ${titleCode}`,
    requiredColor: color,
    requiredPattern: pattern,
    creditsReward,
    cyclesRemaining: totalCycles,
    totalCycles,
    flavorText: CONTRACT_FLAVORS[Math.floor(Math.random() * CONTRACT_FLAVORS.length)],
  };
}

// Astronaut's melancholic diary entries (ambient flavor log)
const ASTRONAUT_THOUGHTS = [
  'LOG: Day 312. I watched the black hole devour a communication node today. The static lasted three minutes. Standard corporate response received immediately after: "Keep breeding."',
  'LOG: Day 445. The slimes are the only warm things on this rock. They hum when I rest my hand on the glass. I wonder if they know we are both just debris.',
  'LOG: Day 519. The Corporation paid my monthly credits, but there is nothing to buy here except nutrient pellets and gene splicing regulators. They are literally paying me to feed their food.',
  'LOG: Day 608. One of the slimes was looking at the star charts today. Or maybe it was just reacting to the screen flicker. I choose to believe it wanted to see Earth.',
  'LOG: Day 722. It is quiet. So quiet that I can hear the refrigeration unit on the containment cells clicking. Cycle after cycle. We make slimes, we send them to the dark, and we repeat.',
  'LOG: Day 803. I called the corporate hotline. The automated voice informed me that my soul was a valuable regional asset. Then it played elevator music for three hours.',
];

export function getRandomMelancholicLog(cycle: number): LogEntry {
  return {
    id: `log_mel_${Date.now()}`,
    cycle,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    text: ASTRONAUT_THOUGHTS[Math.floor(Math.random() * ASTRONAUT_THOUGHTS.length)],
    type: 'melancholy',
  };
}

// Combat / Dispatch simulation logic
export interface CombatLogDetail {
  success: boolean;
  victoryLog: string[];
  xpGained: number;
  creditsGained: number;
  firstClearUnlockedZoneId?: string;
}

export function resolveDispatch(zone: CombatZone, party: Slime[]): CombatLogDetail {
  const log: string[] = [];
  log.push(`DISPATCH: Executing deployment to [${zone.name}]...`);

  if (party.length === 0) {
    return {
      success: false,
      victoryLog: ['DISPATCH FAILED: No slime specimens deployed in landing pod.'],
      xpGained: 0,
      creditsGained: 0,
    };
  }

  // Calculate party strength
  let totalLevel = 0;
  let colorMatchCount = 0;
  let highestStatSpecialist: Slime | null = null;
  let highestAtk = 0;

  party.forEach((slime) => {
    totalLevel += slime.level;
    if (slime.color === zone.requiredColor) {
      colorMatchCount++;
    }
    if (slime.stats.atk > highestAtk) {
      highestAtk = slime.stats.atk;
      highestStatSpecialist = slime;
    }
  });

  // Color requirement matching formula (2x rating contribution per matching slime)
  log.push(`SPECS: Analyzing team composition...`);
  party.forEach((slime) => {
    const matching = slime.color === zone.requiredColor;
    log.push(`  - ${slime.name} (Lv. ${slime.level} ${slime.color} ${slime.pattern}): Stats - HP:${slime.stats.hp} ATK:${slime.stats.atk} DEF:${slime.stats.def}. Color match bonus: ${matching ? 'ACTIVE (2.0x)' : 'NONE'}`);
  });

  // Calculate Party Combat Power
  let combatRating = 0;
  party.forEach((slime) => {
    const matchBonus = slime.color === zone.requiredColor ? 2.0 : 1.0;
    // Rating = level * matchBonus + stat weight
    const slimePower = (slime.level * 10 + (slime.stats.hp / 15) + (slime.stats.atk) + (slime.stats.def)) * matchBonus;
    combatRating += slimePower;
  });

  // Recommended level power target
  // Tier 1: Level 1 (Power Target 30)
  // Tier 2: Level 2 (Power Target 55)
  // Tier 3: Level 4 (Power Target 120)
  // Tier 4: Level 6 (Power Target 210)
  const powerTarget = zone.recommendedLevel * 30 + zone.difficulty * 25;
  log.push(`EVALUATION: Party Combat Rating ${Math.floor(combatRating)} vs Zone Hazard Level ${powerTarget}`);

  // Success chance is based on rating ratio, capped between 10% and 98%
  let successChance = combatRating / powerTarget;
  if (successChance > 1) {
    successChance = 0.85 + (successChance - 1) * 0.1; // Diminishing returns above 100%
  } else {
    successChance = 0.2 + successChance * 0.6; // Linear scale with a 20% floor for risky tries
  }
  successChance = Math.min(0.98, Math.max(0.1, successChance));

  const rolledChance = Math.random();
  const isSuccess = rolledChance <= successChance;

  log.push(`HAZARD RATIO: Calculated safety index is ${(successChance * 100).toFixed(1)}%. Pod entered orbit...`);

  // Narrative rounds
  if (party.length > 0) {
    const leader = party[0];
    log.push(`ROUND 1: Landed in the sulfur fumes. ${leader.name} took point, navigating around radioactive debris.`);
  }

  if (party.length > 1) {
    const support = party[1];
    log.push(`ROUND 2: Encountered automated cleaning drones. ${support.name} discharged reactive enzyme membrane to short-circuit target.`);
  } else {
    log.push(`ROUND 2: Navigating narrow canyons. Automated security scanners triggered, but were bypassed via low thermal profile.`);
  }

  if (isSuccess) {
    log.push(`VICTORY: Zone hazards successfully fully neutralized! Specimens harvested rich lithium crystals and biological sediments.`);
    const xpReward = zone.xpReward;
    const creditsReward = zone.creditsReward;

    party.forEach(s => {
      log.push(`  - ${s.name} absorbed substantial ambient energy, gaining +${xpReward} XP.`);
    });

    log.push(`REPORT: Cargo hold received +${creditsReward} Corporate Requisition Credits.`);
    
    // Unlock next zone if first clear
    let unlockedZoneId: string | undefined = undefined;
    if (!zone.isFirstClearCompleted) {
      log.push(`SYSTEM CLEAR: First-clear protocol completed. Orbital lock on next zone has been dissolved!`);
      if (zone.id === 'zone_cinder') unlockedZoneId = 'zone_sulphur';
      else if (zone.id === 'zone_sulphur') unlockedZoneId = 'zone_abyssal';
      else if (zone.id === 'zone_abyssal') unlockedZoneId = 'zone_jungle';
    }

    return {
      success: true,
      victoryLog: log,
      xpGained: xpReward,
      creditsGained: creditsReward,
      firstClearUnlockedZoneId: unlockedZoneId,
    };
  } else {
    log.push(`FAILURE: Hazard levels exceeded containment limits. Party suffered heavy kinetic shearing and energy discharge.`);
    log.push(`RETREAT: Emergency return beacon triggered. specimens sustained structural depletion, but survived. Gained +15 XP consolation buffer.`);
    return {
      success: false,
      victoryLog: log,
      xpGained: 15,
      creditsGained: 0,
    };
  }
}

export function calculateMarketPrice(
  slime: Slime,
  recentSalesForColor: number
): number {
  const baseValue = 40 + (slime.level - 1) * 5;
  const floodMultiplier = Math.max(0.3, 1 - recentSalesForColor * 0.12);
  return Math.floor(baseValue * floodMultiplier);
}

// resolveMediation - uses Charm (chm) stat to pacify/stabilize a PlanetNode
export function resolveMediation(
  node: PlanetNode,
  party: Slime[]
): { success: boolean; stabilityChange: number; log: string[] } {
  const log: string[] = [];
  log.push(`MEDIATION PROTOCOL: Deployed diplomatic delegates to contested Node [${node.name}].`);

  if (party.length === 0) {
    return {
      success: false,
      stabilityChange: 0,
      log: ['MEDIATION ABORTED: No diplomatic delegates selected.'],
    };
  }

  // Calculate CHM power
  let totalChm = 0;
  let dominantColor: SlimeColor = party[0].color;
  const colorCounts: Record<SlimeColor, number> = {} as any;

  party.forEach(s => {
    totalChm += s.stats.chm;
    colorCounts[s.color] = (colorCounts[s.color] || 0) + 1;
  });

  // Dominant color is the one with the most representatives in the party
  let maxCount = 0;
  (Object.keys(colorCounts) as SlimeColor[]).forEach(c => {
    if (colorCounts[c]! > maxCount) {
      maxCount = colorCounts[c]!;
      dominantColor = c;
    }
  });

  log.push(`TEAM: Analyzing delegation composition... Dominant strain is ${dominantColor}.`);
  party.forEach(s => {
    log.push(`  - Delegate ${s.name} (Lv. ${s.level} ${s.color} ${s.pattern}) | Individual Charm: ${s.stats.chm}`);
  });

  // Target difficulty based on current node stability / foreign pressure
  const targetPower = 40 + (node.strength > 0 ? Math.round((1 - node.strength) * 60) : 35);
  log.push(`EVALUATION: Party Diplomacy Rating ${totalChm} vs Local Colony Resistance Rating ${targetPower}`);

  // Success chance calculated from total CHM ratio, capped between 15% and 98%
  let successChance = totalChm / targetPower;
  if (successChance > 1) {
    successChance = 0.85 + (successChance - 1) * 0.1; // Diminishing returns
  } else {
    successChance = 0.2 + successChance * 0.6; // Linear scaling with safety floor
  }
  successChance = Math.min(0.98, Math.max(0.15, successChance));

  log.push(`PROBABILITY: Harmony alignment index calculated at ${(successChance * 100).toFixed(1)}%.`);

  const roll = Math.random();
  const isSuccess = roll <= successChance;

  let stabilityChange = 0;
  if (isSuccess) {
    stabilityChange = Math.floor(15 + (totalChm / 6) + Math.random() * 8);
    log.push(`SUCCESS: Diplomatic resonance established. Pheromones aligned.`);
    log.push(`  - Local colony pacified. Tension lowered, ownership strength fortified by +${stabilityChange}%.`);
  } else {
    stabilityChange = Math.floor(5 + Math.random() * 5);
    log.push(`MISALIGNMENT: Local factions refused to yield. Pheromone reception rejected.`);
    log.push(`  - Minor progress made. Node stability adjusted marginally by +${stabilityChange}%.`);
  }

  return {
    success: isSuccess,
    stabilityChange,
    log,
  };
}

// resolveExploration - uses combined Mind (stats.int) + Agility (stats.agi) to clear Fog of War
// on a target node. Per STAT_SYSTEM.md: "Exploration/foraging: MND, AGI."
export function resolveExploration(
  node: PlanetNode,
  party: Slime[]
): { success: boolean; revealed: boolean; log: string[] } {
  const log: string[] = [];
  log.push(`EXPLORATION PROTOCOL: Scouting party dispatched to fogged sector near [${node.name}].`);

  if (party.length === 0) {
    return {
      success: false,
      revealed: false,
      log: ['EXPLORATION ABORTED: No scouts selected.'],
    };
  }

  let totalScoutPower = 0;
  party.forEach(s => {
    totalScoutPower += s.stats.int + s.stats.agi;
  });

  log.push(`TEAM: Analyzing scouting squad composition...`);
  party.forEach(s => {
    log.push(`  - Scout ${s.name} (Lv. ${s.level} ${s.color} ${s.pattern}) | MND/INT: ${s.stats.int} | AGI: ${s.stats.agi}`);
  });

  // Target difficulty based on local colony resistance (or generic sector complexity)
  const targetPower = 40 + (node.strength > 0 ? Math.round((1 - node.strength) * 60) : 35);
  log.push(`EVALUATION: Scout Expedition Power ${totalScoutPower} vs Sector Environmental Complexity Rating ${targetPower}`);

  // Success chance calculated from total scout power ratio, capped between 15% and 98% (mirroring resolveMediation)
  let successChance = totalScoutPower / targetPower;
  if (successChance > 1) {
    successChance = 0.85 + (successChance - 1) * 0.1; // Diminishing returns
  } else {
    successChance = 0.2 + successChance * 0.6; // Linear scaling with safety floor
  }
  successChance = Math.min(0.98, Math.max(0.15, successChance));

  log.push(`PROBABILITY: Scouting pathfinding success index calculated at ${(successChance * 100).toFixed(1)}%.`);

  const roll = Math.random();
  const isSuccess = roll <= successChance;

  if (isSuccess) {
    log.push(`SUCCESS: Scouting party mapped and cleared environmental interference.`);
    log.push(`  - Fog of War dissipated. Sector [${node.name}] coordinates confirmed.`);
  } else {
    log.push(`FAILURE: Scouting party disoriented by anomalous radiation.`);
    log.push(`  - Map lock failed. Sector remains obscured.`);
  }

  return {
    success: isSuccess,
    revealed: isSuccess,
    log,
  };
}

// revealAdjacentCapitolTerritory - Called when a color's SlimeDex entry
// flips to discovered. Finds that color's capitol and reveals only its
// directly-adjacent, same-colored, still-fogged neighbors. Deliberately
// narrow — this is a ripple from one event, not a flood.
export function revealAdjacentCapitolTerritory(
  region: PlanetRegion,
  color: SlimeColor
): PlanetRegion {
  const capitol = region.nodes.find(n => n.isCapitol && n.ownerColor === color);
  if (!capitol) return region; // no capitol for this color yet — nothing to ripple from

  const revealedIds = new Set(
    capitol.neighbors.filter(id => {
      const neighbor = region.nodes.find(n => n.id === id);
      return neighbor && neighbor.ownerColor === color && !neighbor.discovered;
    })
  );

  if (revealedIds.size === 0) return region; // correct outcome, not an error

  return {
    ...region,
    nodes: region.nodes.map(n =>
      revealedIds.has(n.id) ? { ...n, discovered: true } : n
    ),
  };
}

// updatePlanetSupplyAndPressure - Ported BFS & Pressure math from culture_node_wars.py concept
export function updatePlanetSupplyAndPressure(nodes: PlanetNode[]): { updatedNodes: PlanetNode[], logs: string[] } {
  const logs: string[] = [];
  
  // 1. Accumulate pressure: each owned, supplied node exerts same-color pressure on its non-owned neighbors
  const pressureChanges: Record<string, Record<string, number>> = {}; // nodeId -> color -> delta
  
  nodes.forEach(node => {
    if (node.ownerColor && node.isSupplied) {
      // Base pressure of 5, scaling up with the owner's strength up to 15
      const pressureAmount = Math.round(5 + node.strength * 10);
      node.neighbors.forEach(neighborId => {
        const neighbor = nodes.find(n => n.id === neighborId);
        if (neighbor && neighbor.ownerColor !== node.ownerColor) {
          if (!pressureChanges[neighborId]) {
            pressureChanges[neighborId] = {};
          }
          pressureChanges[neighborId][node.ownerColor!] = (pressureChanges[neighborId][node.ownerColor!] || 0) + pressureAmount;
        }
      });
    }
  });

  // Apply pressure changes & decay old pressures
  const nextNodes = nodes.map(node => {
    const newNode = { ...node, pressure: { ...node.pressure } };
    const deltas = pressureChanges[node.id];
    
    // Add new pressure
    if (deltas) {
      Object.entries(deltas).forEach(([color, amount]) => {
        const c = color as SlimeColor;
        newNode.pressure[c] = (newNode.pressure[c] || 0) + amount;
      });
    }
    
    // Decay all pressures slightly to prevent infinite buildup
    Object.keys(newNode.pressure).forEach(colorKey => {
      const c = colorKey as SlimeColor;
      if (newNode.pressure[c]! > 0) {
        newNode.pressure[c] = Math.max(0, newNode.pressure[c]! - 2);
      }
    });

    return newNode;
  });

  // 2. Check for ownership flips: if maximum foreign pressure exceeds flip threshold (100) and owner's defense
  const threshold = 100;
  const processedNodes = nextNodes.map(node => {
    let highestForeignColor: SlimeColor | null = null;
    let highestForeignPressure = 0;

    Object.entries(node.pressure).forEach(([color, val]) => {
      const c = color as SlimeColor;
      const pressureVal = val !== undefined ? (val as number) : 0;
      if (c !== node.ownerColor && pressureVal > highestForeignPressure) {
        highestForeignPressure = pressureVal;
        highestForeignColor = c;
      }
    });

    // Defense rating is based on current owner's strength (0 to 100)
    const defense = node.ownerColor ? Math.round(node.strength * 100) : 0;
    
    if (highestForeignPressure >= threshold && highestForeignPressure > defense) {
      const oldOwner = node.ownerColor;
      const newOwner = highestForeignColor!;
      
      logs.push(`TERRITORY FLIP: Node [${node.name}] has collapsed under external pressure. Control transferred from ${oldOwner || 'Unclaimed'} to ${newOwner}.`);
      
      return {
        ...node,
        ownerColor: newOwner,
        strength: 0.3, // base strength after conquest
        pressure: {}, // reset pressure
        isCapitol: false, // loses capitol status if it was one
      };
    }

    // Steady stabilization if supplied, otherwise decay strength
    if (node.ownerColor) {
      let nextStrength = node.strength;
      if (node.isSupplied) {
        nextStrength = Math.min(1.0, node.strength + 0.02);
      } else {
        nextStrength = Math.max(0.1, node.strength - 0.08);
      }
      return {
        ...node,
        strength: parseFloat(nextStrength.toFixed(3))
      };
    }

    return node;
  });

  // 3. BFS Supply Chain update from Capitols
  // First reset supplied status of all nodes
  processedNodes.forEach(n => {
    n.isSupplied = false;
  });

  // Find all capitols that have owners
  const capitolNodes = processedNodes.filter(n => n.isCapitol && n.ownerColor);
  
  capitolNodes.forEach(capitol => {
    capitol.isSupplied = true;
    const color = capitol.ownerColor!;
    const queue: PlanetNode[] = [capitol];
    const visited = new Set<string>([capitol.id]);

    while (queue.length > 0) {
      const current = queue.shift()!;
      current.neighbors.forEach(neighborId => {
        const neighbor = processedNodes.find(n => n.id === neighborId);
        if (neighbor && neighbor.ownerColor === color && !visited.has(neighbor.id)) {
          neighbor.isSupplied = true;
          visited.add(neighbor.id);
          queue.push(neighbor);
        }
      });
    }
  });

  // 4. Cascade collapse: unsupplied owned nodes revert to Unclaimed
  processedNodes.forEach(node => {
    if (node.ownerColor && !node.isSupplied && !node.isCapitol) {
      logs.push(`SUPPLY COLLAPSE: Node [${node.name}] lost same-color supply line connection to its Capitol. Node reverted to Unclaimed.`);
      node.ownerColor = null;
      node.strength = 0;
      node.pressure = {};
    }
  });

  return { updatedNodes: processedNodes, logs };
}

// generateWedgeAngles - Returns boundary angles (radians, 0 to 2π), sorted
export function generateWedgeAngles(count: number, rngNext: () => number): number[] {
  const cuts = Array.from({ length: count }, () => rngNext() * Math.PI * 2);
  cuts.sort((a, b) => a - b);
  return cuts;
}

// annularSectorPath - Creates SVG path string for a concentric slice
export function annularSectorPath(
  cx: number, cy: number,
  innerR: number, outerR: number,
  startAngle: number, endAngle: number
): string {
  const p = (r: number, a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [ox1, oy1] = p(outerR, startAngle);
  const [ox2, oy2] = p(outerR, endAngle);
  const [ix1, iy1] = p(innerR, endAngle);
  const [ix2, iy2] = p(innerR, startAngle);
  const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0;
  return `M ${ox1.toFixed(1)} ${oy1.toFixed(1)} A ${outerR} ${outerR} 0 ${largeArc} 1 ${ox2.toFixed(1)} ${oy2.toFixed(1)} L ${ix1.toFixed(1)} ${iy1.toFixed(1)} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2.toFixed(1)} ${iy2.toFixed(1)} Z`;
}

// getAngleIntervals - Normalizes start/end angles to 0 to 2pi interval sets
export function getAngleIntervals(start: number, end: number): [number, number][] {
  const s = start % (Math.PI * 2);
  const e = end % (Math.PI * 2);
  if (end - start >= Math.PI * 2) {
    return [[0, Math.PI * 2]];
  }
  if (e < s || Math.abs(e - s) < 1e-9) {
    return [[s, Math.PI * 2], [0, e]];
  } else {
    return [[s, e]];
  }
}

// intervalsOverlap - Checks if any sub-intervals overlap with a tolerance
export function intervalsOverlap(intervalsA: [number, number][], intervalsB: [number, number][]): boolean {
  for (const [as, ae] of intervalsA) {
    for (const [bs, be] of intervalsB) {
      const maxStart = Math.max(as, bs);
      const minEnd = Math.min(ae, be);
      if (maxStart + 1e-5 < minEnd) {
        return true;
      }
    }
  }
  return false;
}

// generatePlanetRegion - Generates all 8 nodes fresh in one unified radial space covering the full range
interface Point { x: number; y: number; }

function getSegmentCircleIntersection(A: Point, B: Point, C: Point, R: number): Point | null {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const ox = A.x - C.x;
  const oy = A.y - C.y;

  const a = dx * dx + dy * dy;
  const b = 2 * (ox * dx + oy * dy);
  const c = ox * ox + oy * oy - R * R;

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;

  const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
  const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

  if (t1 >= 0 && t1 <= 1) {
    return { x: A.x + t1 * dx, y: A.y + t1 * dy };
  }
  if (t2 >= 0 && t2 <= 1) {
    return { x: A.x + t2 * dx, y: A.y + t2 * dy };
  }
  return null;
}

function clipPolygonAgainstLine(poly: Point[], p1: Point, p2: Point): Point[] {
  const result: Point[] = [];
  if (poly.length === 0) return result;

  const isInside = (p: Point) => {
    return (p2.x - p1.x) * (p.y - p1.y) - (p2.y - p1.y) * (p.x - p1.x) >= -1e-5;
  };

  const getIntersection = (s: Point, e: Point): Point => {
    const dc = { x: s.x - e.x, y: s.y - e.y };
    const dp = { x: p1.x - p2.x, y: p1.y - p2.y };
    const n1 = s.x * e.y - s.y * e.x;
    const n2 = p1.x * p2.y - p1.y * p2.x;
    const num = n1 * dp.x - dc.x * n2;
    const den = dc.x * dp.y - dc.y * dp.x;
    if (Math.abs(den) < 1e-9) return s;
    return {
      x: num / den,
      y: (n1 * dp.y - dc.y * n2) / den
    };
  };

  let s = poly[poly.length - 1];
  for (const e of poly) {
    if (isInside(e)) {
      if (!isInside(s)) {
        result.push(getIntersection(s, e));
      }
      result.push(e);
    } else if (isInside(s)) {
      result.push(getIntersection(s, e));
    }
    s = e;
  }
  return result;
}

function getOuterCirclePolygon(C: Point, R: number, numVertices = 64): Point[] {
  const poly: Point[] = [];
  for (let i = 0; i < numVertices; i++) {
    const angle = (i * 2 * Math.PI) / numVertices;
    poly.push({
      x: C.x + R * Math.cos(angle),
      y: C.y + R * Math.sin(angle)
    });
  }
  return poly;
}

function clipPolygonAgainstPolygon(subjectPoly: Point[], clipPoly: Point[]): Point[] {
  let result = subjectPoly;
  let s = clipPoly[clipPoly.length - 1];
  for (const e of clipPoly) {
    result = clipPolygonAgainstLine(result, s, e);
    s = e;
  }
  return result;
}

function getPolygonCentroid(poly: Point[]): Point {
  if (poly.length === 0) return { x: 300, y: 300 };
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % poly.length];
    const f = p1.x * p2.y - p2.x * p1.y;
    area += f;
    cx += (p1.x + p2.x) * f;
    cy += (p1.y + p2.y) * f;
  }
  area = area / 2;
  if (Math.abs(area) < 1e-5) {
    let sx = 0, sy = 0;
    poly.forEach(p => { sx += p.x; sy += p.y; });
    return { x: sx / poly.length, y: sy / poly.length };
  }
  cx = cx / (6 * area);
  cy = cy / (6 * area);
  return { x: cx, y: cy };
}

const NEIGHBORS_MAP: Record<string, string[]> = {
  node_solitude: ['node_abyss', 'node_sulphur', 'node_feral', 'node_twilight'],
  node_sulphur: ['node_solitude', 'node_jungle', 'node_rust', 'node_wetlands'],
  node_jungle: ['node_sulphur', 'node_abyss', 'node_wetlands'],
  node_abyss: ['node_jungle', 'node_solitude', 'node_twilight', 'node_wetlands'],
  node_feral: ['node_twilight', 'node_rust', 'node_solitude'],
  node_rust: ['node_feral', 'node_wetlands', 'node_sulphur'],
  node_wetlands: ['node_rust', 'node_twilight', 'node_sulphur', 'node_jungle', 'node_abyss'],
  node_twilight: ['node_wetlands', 'node_feral', 'node_solitude', 'node_abyss']
};

export function generatePlanetRegion(): PlanetRegion {
  const centerX = 300;
  const centerY = 300;

  // 8 nodes in total: 5 capitols, 3 neutral frontier colonies
  const seedDefs = [
    { id: 'node_solitude', angle: 0, r: 90 }, // Red capitol, Ring 1 (0 rad)
    { id: 'node_feral', angle: Math.PI / 3, r: 225 }, // Green capitol, Ring 2 (Math.PI / 3)
    { id: 'node_rust', angle: 2 * Math.PI / 3, r: 225 }, // Orange capitol, Ring 2 (2 * Math.PI / 3)
    { id: 'node_sulphur', angle: 5 * Math.PI / 6, r: 90 }, // Neutral, Ring 1 (5 * Math.PI / 6)
    { id: 'node_wetlands', angle: Math.PI, r: 225 }, // Neutral, Ring 2 (Math.PI)
    { id: 'node_jungle', angle: 7 * Math.PI / 6, r: 90 }, // Neutral, Ring 1 (7 * Math.PI / 6)
    { id: 'node_abyss', angle: 4 * Math.PI / 3, r: 90 }, // Blue capitol, Ring 1 (4 * Math.PI / 3)
    { id: 'node_twilight', angle: 5 * Math.PI / 3, r: 225 }, // Purple capitol, Ring 2 (5 * Math.PI / 3)
  ];

  const seeds = seedDefs.map(def => {
    const x = centerX + def.r * Math.cos(def.angle);
    const y = centerY + def.r * Math.sin(def.angle);
    return { id: def.id, x, y };
  });

  const paths: string[] = [];
  const polys: Point[][] = [];

  for (let i = 0; i < seeds.length; i++) {
    const pi = seeds[i];
    let cellPoly: Point[] = [
      { x: -1000, y: -1000 },
      { x: 1600, y: -1000 },
      { x: 1600, y: 1600 },
      { x: -1000, y: 1600 }
    ];

    for (let j = 0; j < seeds.length; j++) {
      if (j === i) continue;
      const pj = seeds[j];

      const mx = (pi.x + pj.x) / 2;
      const my = (pi.y + pj.y) / 2;

      const dx = pj.x - pi.x;
      const dy = pj.y - pi.y;

      const p1 = { x: mx, y: my };
      const p2 = { x: mx - dy, y: my + dx };

      cellPoly = clipPolygonAgainstLine(cellPoly, p1, p2);
    }

    // Clip against outer circle (R = 300)
    const outerPoly = getOuterCirclePolygon({ x: 300, y: 300 }, 300, 64);
    cellPoly = clipPolygonAgainstPolygon(cellPoly, outerPoly);

    polys.push(cellPoly);

    // Clip against inner circle (R = 30) - the "hard part" arc subtraction
    const innerC = { x: 300, y: 300 };
    const innerR = 30;

    const isInsideInner = (p: Point) => {
      const dx = p.x - innerC.x;
      const dy = p.y - innerC.y;
      return dx * dx + dy * dy < innerR * innerR - 1e-5;
    };

    const elements: { point: Point; isInside: boolean; intersectionType?: 'entry' | 'exit' }[] = [];
    const n = cellPoly.length;

    for (let k = 0; k < n; k++) {
      const curr = cellPoly[k];
      const next = cellPoly[(k + 1) % n];

      const currIn = isInsideInner(curr);
      const nextIn = isInsideInner(next);

      elements.push({ point: curr, isInside: currIn });

      if (currIn !== nextIn) {
        const intersect = getSegmentCircleIntersection(curr, next, innerC, innerR);
        if (intersect) {
          elements.push({
            point: intersect,
            isInside: false,
            intersectionType: currIn ? 'exit' : 'entry'
          });
        }
      }
    }

    const filtered = elements.filter(el => !el.isInside);

    let pathStr = '';
    if (filtered.length > 0) {
      pathStr += `M ${filtered[0].point.x.toFixed(1)} ${filtered[0].point.y.toFixed(1)}`;
      for (let k = 0; k < filtered.length; k++) {
        const curr = filtered[k];
        const next = filtered[(k + 1) % filtered.length];

        if (curr.intersectionType === 'entry' && next.intersectionType === 'exit') {
          pathStr += ` A 30 30 0 0 0 ${next.point.x.toFixed(1)} ${next.point.y.toFixed(1)}`;
        } else {
          pathStr += ` L ${next.point.x.toFixed(1)} ${next.point.y.toFixed(1)}`;
        }
      }
      pathStr += ' Z';
    }

    paths.push(pathStr);
  }

  const nodeDefs = [
    { id: 'node_solitude', name: 'Solitude Ridge', ownerColor: 'Red' as SlimeColor | null, strength: 0.8, isCapitol: true, isSupplied: true, pressure: {} },
    { id: 'node_abyss', name: 'Abyssal Chasm', ownerColor: 'Blue' as SlimeColor | null, strength: 0.8, isCapitol: true, isSupplied: true, pressure: {} },
    { id: 'node_sulphur', name: 'Sulphur Gateway', ownerColor: null as SlimeColor | null, strength: 0, isCapitol: false, isSupplied: false, pressure: { Red: 15, Blue: 25 } },
    { id: 'node_jungle', name: 'Jungle Outpost', ownerColor: null as SlimeColor | null, strength: 0, isCapitol: false, isSupplied: false, pressure: { Red: 35, Blue: 10 } },
    { id: 'node_twilight', name: 'Twilight Grove', ownerColor: 'Purple' as SlimeColor | null, strength: 0.8, isCapitol: true, isSupplied: true, pressure: {} },
    { id: 'node_rust', name: 'Rust Crater', ownerColor: 'Orange' as SlimeColor | null, strength: 0.8, isCapitol: true, isSupplied: true, pressure: {} },
    { id: 'node_feral', name: 'Feral Canopy', ownerColor: 'Green' as SlimeColor | null, strength: 0.8, isCapitol: true, isSupplied: true, pressure: {} },
    { id: 'node_wetlands', name: 'Silt Wetlands', ownerColor: null as SlimeColor | null, strength: 0, isCapitol: false, isSupplied: false, pressure: { Purple: 20, Orange: 15, Green: 10 } },
  ];

  const nodes: PlanetNode[] = nodeDefs.map((def) => {
    const seedIdx = seedDefs.findIndex(s => s.id === def.id);
    const poly = polys[seedIdx];
    const path = paths[seedIdx];
    const centroid = getPolygonCentroid(poly);

    // Capitols start discovered. Neutral nodes start undiscovered (fogged).
    const discovered = def.isCapitol;

    return {
      id: def.id,
      name: def.name,
      cellShape: path,
      labelX: parseFloat(centroid.x.toFixed(1)),
      labelY: parseFloat(centroid.y.toFixed(1)),
      neighbors: NEIGHBORS_MAP[def.id] || [],
      ownerColor: def.ownerColor,
      pressure: def.pressure,
      strength: def.strength,
      isCapitol: def.isCapitol,
      isSupplied: def.isSupplied,
      distanceFromCenter: seedDefs[seedIdx].r,
      discovered
    };
  });

  return {
    generatedAt: Date.now(),
    nodes
  };
}

// syncCodexWithRoster - Initializes and synchronizes codex entries based on current roster slimes.
export function syncCodexWithRoster(state: LabState): LabState {
  const colorCodex = { ...state.colorCodex } as Record<SlimeColor, CodexEntry>;
  const patternCodex = { ...state.patternCodex } as Record<SlimePattern, CodexEntry>;
  const regentInventory = { ...state.regentInventory } as Partial<Record<SlimePattern, number>>;
  const colorRegentInventory = { ...state.colorRegentInventory } as Partial<Record<SlimeColor, number>>;
  let modified = false;

  const colors: SlimeColor[] = ['Red', 'Blue', 'Yellow', 'Purple', 'Orange', 'Green', 'Gray'];
  const patterns: SlimePattern[] = ['Solid', 'Stripe', 'Polka', 'Glow', 'Crown', 'Ringed', 'Nebula', 'Obsidian'];

  colors.forEach(c => {
    if (!colorCodex[c]) {
      colorCodex[c] = { discovered: false, hintRevealed: false };
      modified = true;
    }
  });

  patterns.forEach(p => {
    if (!patternCodex[p]) {
      patternCodex[p] = { discovered: false, hintRevealed: false };
      modified = true;
    }
  });

  let planetRegion = state.planetRegion;

  // Always auto-discover anything currently in the roster
  state.slimes.forEach(slime => {
    if (!colorCodex[slime.color]?.discovered) {
      colorCodex[slime.color] = {
        discovered: true,
        discoveredAt: Date.now(),
        hintRevealed: colorCodex[slime.color]?.hintRevealed || false
      };
      modified = true;
      if (planetRegion) {
        planetRegion = revealAdjacentCapitolTerritory(planetRegion, slime.color);
      }
    }
    if (!patternCodex[slime.pattern]?.discovered) {
      patternCodex[slime.pattern] = {
        discovered: true,
        discoveredAt: Date.now(),
        hintRevealed: patternCodex[slime.pattern]?.hintRevealed || false
      };
      modified = true;
    }
  });

  if (modified || !state.colorCodex || !state.patternCodex || !state.regentInventory || !state.colorRegentInventory) {
    return {
      ...state,
      colorCodex,
      patternCodex,
      regentInventory,
      colorRegentInventory,
      planetRegion
    };
  }
  return state;
}

// applyDispatchStabilityHook - applies stability bonus (+0.05 strength, capped at 1.0) to any planet node owned by the requiredColor
export function applyDispatchStabilityHook(
  nodes: PlanetNode[],
  requiredColor: SlimeColor
): { updatedNodes: PlanetNode[]; appliedNodeName: string | null } {
  let appliedNodeName: string | null = null;
  const updatedNodes = nodes.map(node => {
    if (node.ownerColor === requiredColor) {
      appliedNodeName = node.name;
      const newStrength = Math.min(1.0, node.strength + 0.05);
      return {
        ...node,
        strength: parseFloat(newStrength.toFixed(3))
      };
    }
    return node;
  });
  return { updatedNodes, appliedNodeName };
}

// generateWildsPlanetRegion is retired since wilds are unified in generatePlanetRegion

// checkWildsUnlockCondition - checks if any secondary colors are present in the roster
export function checkWildsUnlockCondition(slimes: Slime[]): boolean {
  const secondaryColors: SlimeColor[] = ['Purple', 'Orange', 'Green'];
  return slimes.some(s => secondaryColors.includes(s.color));
}

export function getColorRegentCost(color: SlimeColor, discovered: boolean): number {
  const tierMap: Partial<Record<SlimeColor, number>> = {
    Purple: 1, Orange: 1, Green: 1, Gray: 3
  };
  const baseCost = 50 + (tierMap[color] || 0) * 25;
  return discovered ? baseCost : Math.round(baseCost * 2);
}

// isSlimeInMatchingCultureEnvironment - returns true if the worker slime's color matches the ownerColor of any owned node in the planet region
export function isSlimeInMatchingCultureEnvironment(slime: Slime, nodes: PlanetNode[]): boolean {
  if (!nodes || nodes.length === 0) return false;
  // Reuses the same concept of color matching (slime.color === targetColor)
  // where the targetColor is the ownerColor of any node in the planetary map
  return nodes.some(node => node.ownerColor === slime.color);
}

// calculateWorkerIncome - returns the worker slime's credit generation per cycle
export function calculateWorkerIncome(slime: Slime, hasAutoFeeder: boolean, nodes: PlanetNode[]): number {
  let income = 5; // base worker income
  if (hasAutoFeeder) {
    income *= 2; // Auto-Feeder upgrade doubles worker income
  }
  if (isSlimeInMatchingCultureEnvironment(slime, nodes)) {
    income *= 2; // Culture-matched assignment doubles worker income
  }
  return income;
}




