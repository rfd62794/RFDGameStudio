/**
 * Gladiator Arena — Champion Ladder & Opponent Generation
 * Inspired by Swords & Sandals ladder progression, Blood Bowl consequences, and How Many Dudes fallen state.
 */

import { ArenaTier, BodySlot, Gladiator } from '../types';
import { SHOP_PART_CATALOG, STARTER_PARTS } from '../data/defaultParts';

function createEnemyGladiator(
  name: string,
  title: string,
  personality: Gladiator['personality'],
  tier: number,
  preferredOrigin: 'organic' | 'cybernetic' | 'hybrid',
  options: {
    statScale?: number;
    allowShopParts?: boolean;
  } = {}
): Gladiator {
  const { statScale = 1.0, allowShopParts = tier >= 2 } = options;
  const parts: Record<BodySlot, any> = { ...STARTER_PARTS };

  // Equip tier-appropriate parts matching the gladiator's theme if allowed
  const matchingParts = SHOP_PART_CATALOG.filter(p => {
    if (preferredOrigin === 'organic') return p.cyberOrganicLean < -0.4;
    if (preferredOrigin === 'cybernetic') return p.cyberOrganicLean > 0.4;
    return Math.abs(p.cyberOrganicLean) <= 0.4;
  });

  (['head', 'torso', 'left_arm', 'right_arm', 'left_leg', 'right_leg'] as BodySlot[]).forEach(slot => {
    const candidate = matchingParts.find(p => p.slot === slot);
    if (allowShopParts && candidate && Math.random() < 0.5) {
      parts[slot] = {
        ...candidate,
        id: `enemy-${name}-${slot}-${Math.random().toString(36).substr(2, 4)}`,
        currentHp: Math.round(candidate.maxHp * statScale),
        maxHp: Math.round(candidate.maxHp * statScale),
        scarHpPenalty: 0,
      };
    } else {
      // Starter part scaled by tier progression and squad size
      const starter = STARTER_PARTS[slot];
      const tierHpMult = (1 + (tier - 1) * 0.18) * statScale;
      const statBonus = Math.floor((tier - 1) * 1.5 * statScale);
      parts[slot] = {
        ...starter,
        id: `enemy-${name}-${slot}-${Math.random().toString(36).substr(2, 4)}`,
        maxHp: Math.round(starter.maxHp * tierHpMult),
        currentHp: Math.round(starter.maxHp * tierHpMult),
        power: Math.max(1, Math.round(starter.power * statScale) + statBonus),
        speed: Math.max(1, Math.round(starter.speed * statScale) + statBonus),
        armor: Math.max(0, Math.round(starter.armor * statScale) + Math.floor(statBonus / 2)),
      };
    }
  });

  return {
    id: `gladiator-enemy-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    name,
    title,
    personality,
    frameId: `ENEMY-FRAME-${Math.floor(Math.random() * 900 + 100)}`,
    parts,
    wins: tier * 3,
    losses: Math.floor(Math.random() * tier * 2),
    kills: tier * 2,
    totalDamageDealt: 0,
  };
}

export const ARENA_TIERS: ArenaTier[] = [
  // ==========================================
  // TIER 1: THE DUST PIT (Tuned for accessible Rookie Progression)
  // ==========================================
  {
    id: 1,
    name: 'The Dust Pit',
    location: 'Outer Slums — Scrap Ring',
    description: 'A sunken blood-stained sand ring where rookie managers test their freshly bolted frames.',
    minWinsToUnlock: 0,
    opponents: [
      {
        id: 'tier1-opp-1',
        name: 'Gristle Jack',
        title: 'The Meat-Hook Brawler',
        avatarSeed: 'jack',
        difficulty: 'novice',
        arenaTier: 1,
        purseReward: 80,
        description: 'A reckless rookie with salvaged scrap claws and feral bio-tendons.',
        gladiators: [
          createEnemyGladiator('Gristle Jack', 'The Meat-Hook Brawler', 'berserker', 1, 'organic', { statScale: 0.85 }),
        ],
      },
      {
        id: 'tier1-opp-2',
        name: 'Sparky 404',
        title: 'Overclocked Junk-Drone',
        avatarSeed: 'sparky',
        difficulty: 'novice',
        arenaTier: 1,
        purseReward: 95,
        description: 'Equipped with salvaged pneumatic pistons that sputter smoke on every punch.',
        gladiators: [
          createEnemyGladiator('Sparky 404', 'Overclocked Junk-Drone', 'tactician', 1, 'cybernetic', { statScale: 0.9 }),
        ],
      },
      {
        id: 'tier1-opp-3',
        name: 'The Mud Rats',
        title: 'Tag-Team Scavengers',
        avatarSeed: 'mudrats',
        difficulty: 'veteran',
        arenaTier: 1,
        purseReward: 130,
        description: 'A lightweight 2-scavenger squad testing multi-target rotation and stamina.',
        gladiators: [
          createEnemyGladiator('Mud Rat Alpha', 'Pack Runner', 'survivor', 1, 'hybrid', { statScale: 0.65 }),
          createEnemyGladiator('Mud Rat Beta', 'Scrap Hound', 'brawler', 1, 'organic', { statScale: 0.65 }),
        ],
      },
    ],
    champion: {
      id: 'tier1-champion',
      name: 'Gorgon the Cleaver',
      title: 'Pit Master & Bone-Splitter',
      avatarSeed: 'gorgon',
      difficulty: 'champion',
      arenaTier: 1,
      purseReward: 220,
      description: 'The reigning pit master of the Sand Pit. Wields heavy cleavers and reinforced scrap armor.',
      gladiators: [
        createEnemyGladiator('Gorgon', 'The Cleaver', 'berserker', 1, 'hybrid', { statScale: 1.05, allowShopParts: true }),
      ],
      specialLootPart: {
        ...SHOP_PART_CATALOG.find(p => p.id === 'part-rarm-bio-1')!,
        name: "Gorgon's Severed Trophy Scythe",
        power: 16,
      },
    },
  },

  // ==========================================
  // TIER 2: THE RUST YARDS
  // ==========================================
  {
    id: 2,
    name: 'The Rust Yards',
    location: 'Industrial Foundry Grid',
    description: 'An abandoned steel reclamation plant littered with crushing hydraulic presses and live voltage conduits.',
    minWinsToUnlock: 3,
    opponents: [
      {
        id: 'tier2-opp-1',
        name: 'Viper Suture',
        title: 'Bio-Surgical Assassin',
        avatarSeed: 'viper',
        difficulty: 'veteran',
        arenaTier: 2,
        purseReward: 160,
        description: 'Boasts mutated chitin needles and hyper-speed sinew legs. Deadly hit-and-run tactician.',
        gladiators: [
          createEnemyGladiator('Viper Suture', 'Bio-Surgical Assassin', 'tactician', 2, 'organic'),
        ],
      },
      {
        id: 'tier2-opp-2',
        name: 'Iron Forge Syndicate',
        title: 'Industrial Dual Frame Unit',
        avatarSeed: 'syndicate',
        difficulty: 'veteran',
        arenaTier: 2,
        purseReward: 220,
        description: 'A coordinated 2-man tag squad: an armored shield-turtle backed by a piledriver bruiser.',
        gladiators: [
          createEnemyGladiator('Anvil-01', 'Riot Barrier', 'survivor', 2, 'cybernetic'),
          createEnemyGladiator('Hammer-02', 'Pneumatic Bruiser', 'brawler', 2, 'cybernetic'),
        ],
      },
    ],
    champion: {
      id: 'tier2-champion',
      name: 'Unit 7-Scrapjaw',
      title: 'Repurposed Demolition Mech',
      avatarSeed: 'scrapjaw',
      difficulty: 'champion',
      arenaTier: 2,
      purseReward: 350,
      description: 'A towering military demolition frame equipped with high-pressure pneumatic piledrivers.',
      gladiators: [
        createEnemyGladiator('Unit 7-Scrapjaw', 'Demolition Mech', 'brawler', 2, 'cybernetic'),
      ],
      specialLootPart: {
        ...SHOP_PART_CATALOG.find(p => p.id === 'part-rarm-cyber-1')!,
        name: "Scrapjaw's Overcharged Jackhammer",
        power: 19,
        armor: 8,
      },
    },
  },

  // ==========================================
  // TIER 3: THE IRON COLOSSEUM
  // ==========================================
  {
    id: 3,
    name: 'The Iron Colosseum',
    location: 'Central Metropolis Arena',
    description: 'The roaring heart of the professional circuit. Crowds number in the thousands, showering glory and gold on flashy showmen.',
    minWinsToUnlock: 6,
    opponents: [
      {
        id: 'tier3-opp-1',
        name: 'Crimson Gladius',
        title: 'Showman of the Scarlet Ring',
        avatarSeed: 'crimson',
        difficulty: 'veteran',
        arenaTier: 3,
        purseReward: 290,
        description: 'Plays the audience like an instrument. Flares crowd favor to trigger devastating adrenaline crits.',
        gladiators: [
          createEnemyGladiator('Crimson Gladius', 'Showman of the Scarlet Ring', 'showman', 3, 'hybrid'),
        ],
      },
      {
        id: 'tier3-opp-2',
        name: 'Tri-Core Legion',
        title: '3-Frame Tag Battalion',
        avatarSeed: 'legion',
        difficulty: 'veteran',
        arenaTier: 3,
        purseReward: 420,
        description: 'Full 3-Frame tag-team roster cycling between bio-fury, cyber-shielding, and surgical piercing.',
        gladiators: [
          createEnemyGladiator('Legion Vanguard', 'Adrenal Ripper', 'berserker', 3, 'organic'),
          createEnemyGladiator('Legion Bastion', 'Titanium Shield', 'survivor', 3, 'cybernetic'),
          createEnemyGladiator('Legion Executioner', 'Chain-Blade Striker', 'tactician', 3, 'hybrid'),
        ],
      },
    ],
    champion: {
      id: 'tier3-champion',
      name: 'Valkyrie Steel-Vein',
      title: 'High-Duchess of the Colosseum',
      avatarSeed: 'valkyrie',
      difficulty: 'boss',
      arenaTier: 3,
      purseReward: 600,
      description: 'Master of pure cybernetic neural overclocking. Strikes with supersonic speed and unmatched parry timing.',
      gladiators: [
        createEnemyGladiator('Valkyrie Steel-Vein', 'High-Duchess', 'tactician', 3, 'cybernetic'),
      ],
      specialLootPart: {
        ...SHOP_PART_CATALOG.find(p => p.id === 'part-rarm-cyber-legendary')!,
        name: "Valkyrie's Resonating Plasma Rapier",
      },
    },
  },

  // ==========================================
  // TIER 4: THE NEON CRUCIBLE
  // ==========================================
  {
    id: 4,
    name: 'The Neon Crucible',
    location: 'Cyber-Underground Deep Sector',
    description: 'Illegal high-stakes black arena where untested bio-mutations clash against prototype military cyberware.',
    minWinsToUnlock: 9,
    opponents: [
      {
        id: 'tier4-opp-1',
        name: 'Neural Void-Stalker',
        title: 'Ghost in the Bio-Chassis',
        avatarSeed: 'voidstalker',
        difficulty: 'veteran',
        arenaTier: 4,
        purseReward: 480,
        description: 'High-frequency telemetry HUD and cloaked carbon limbs that strike vital anatomical weak points.',
        gladiators: [
          createEnemyGladiator('Void-Stalker', 'Ghost in the Bio-Chassis', 'tactician', 4, 'hybrid'),
        ],
      },
      {
        id: 'tier4-opp-2',
        name: 'The Mutagen Harvesters',
        title: '3-Frame Bio-Apex Swarm',
        avatarSeed: 'mutagen',
        difficulty: 'champion',
        arenaTier: 4,
        purseReward: 680,
        description: 'A relentless bio-organic hive squad capable of regenerating torn limbs and rending heavy armor.',
        gladiators: [
          createEnemyGladiator('Chitin Behemoth', 'Exoskeleton Goliath', 'brawler', 4, 'organic'),
          createEnemyGladiator('Venom Scythe', 'Hyper-Toxin Striker', 'berserker', 4, 'organic'),
          createEnemyGladiator('Hydra Flesh-Weaver', 'Sinew Vanguard', 'survivor', 4, 'organic'),
        ],
      },
    ],
    champion: {
      id: 'tier4-champion',
      name: 'Apex Chimera',
      title: 'Uncontrollable Bio-Cyber Godling',
      avatarSeed: 'chimera',
      difficulty: 'boss',
      arenaTier: 4,
      purseReward: 950,
      description: 'A monstrous synthesis of apex predatory genetics fused with military-grade fusion cores.',
      gladiators: [
        createEnemyGladiator('Apex Chimera', 'Bio-Cyber Godling', 'berserker', 4, 'hybrid'),
      ],
      specialLootPart: {
        ...SHOP_PART_CATALOG.find(p => p.id === 'part-head-bio-legendary')!,
        name: "Crown of the Apex Chimera",
      },
    },
  },

  // ==========================================
  // TIER 5: THE GOD-ENGINE RING
  // ==========================================
  {
    id: 5,
    name: 'The God-Engine Ring',
    location: 'Orbiting Apex Megastructure',
    description: 'The pinnacle of gladiatorial combat. Only the greatest managers and most perfectly engineered frames survive.',
    minWinsToUnlock: 13,
    opponents: [
      {
        id: 'tier5-opp-1',
        name: 'Solar Praetorian',
        title: 'Nuclear-Fueled Warmachine',
        avatarSeed: 'praetorian',
        difficulty: 'champion',
        arenaTier: 5,
        purseReward: 850,
        description: 'Powered by an unshielded miniature fusion reactor. Hits with the force of an artillery shell.',
        gladiators: [
          createEnemyGladiator('Solar Praetorian', 'Nuclear Warmachine', 'brawler', 5, 'cybernetic'),
        ],
      },
    ],
    champion: {
      id: 'tier5-champion',
      name: 'Overlord Kronos',
      title: 'The Eternal Grand Sovereign',
      avatarSeed: 'kronos',
      difficulty: 'boss',
      arenaTier: 5,
      purseReward: 1800,
      description: 'The supreme champion of all arenas. Armored in impenetrable God-Engine tungsten with dual high-frequency plasma blades.',
      gladiators: [
        createEnemyGladiator('Kronos the Undefeated', 'Eternal Sovereign', 'tactician', 5, 'cybernetic'),
        createEnemyGladiator('Aegis Sentinel', 'Indestructible Ward', 'survivor', 5, 'cybernetic'),
      ],
      specialLootPart: {
        ...SHOP_PART_CATALOG.find(p => p.id === 'part-torso-cyber-legendary')!,
        name: "God-Engine Core of Kronos",
      },
    },
  },
];
