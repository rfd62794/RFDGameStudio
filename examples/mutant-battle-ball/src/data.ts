/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Part, PartType, PartVariant, PartRarity, Equipment, Mutant, MutantRole } from "./types";

// Base Part Presets
export const PARTS_POOL: Part[] = [
  // --- HEAD PARTS ---
  {
    id: "h_bio_1",
    name: "Serrated Glandular Head",
    type: PartType.Head,
    variant: PartVariant.Biological,
    accuracy: 8,
    endurance: 3,
    power: 4,
    speed: 5,
    price: 150,
    description: "Highly sensitive sensory lobes and bio-luminescent sensory receptors. Grants superior throw decision making."
  },
  {
    id: "h_bio_2",
    name: "Chitinous Maw",
    type: PartType.Head,
    variant: PartVariant.Biological,
    accuracy: 6,
    endurance: 6,
    power: 4,
    speed: 4,
    price: 130,
    description: "Layered organic bone plates with triple rows of razor-sharp fangs. Sturdy and threatening."
  },
  {
    id: "h_mech_1",
    name: "Optic Laser Chassis",
    type: PartType.Head,
    variant: PartVariant.Mechanical,
    accuracy: 10,
    endurance: 2,
    power: 2,
    speed: 6,
    price: 200,
    description: "Equipped with tactical laser rangefinders and high-hz tracking processors. Unmatched throw accuracy."
  },
  {
    id: "h_mech_2",
    name: "Steel-Plated Visor",
    type: PartType.Head,
    variant: PartVariant.Mechanical,
    accuracy: 5,
    endurance: 8,
    power: 5,
    speed: 2,
    price: 160,
    description: "Heavy steel shielding encasing a low-res sonar sensor. Provides immense head protection."
  },

  // --- CHEST PARTS ---
  {
    id: "c_bio_1",
    name: "Bile-Sack Ribcage",
    type: PartType.Chest,
    variant: PartVariant.Biological,
    accuracy: 4,
    endurance: 9,
    power: 4,
    speed: 3,
    price: 180,
    description: "Pulsating sack of thick acidic enzyme fluids. Absorbs heavy tackles, acting as a natural cushion."
  },
  {
    id: "c_bio_2",
    name: "Serrated Shell Carapace",
    type: PartType.Chest,
    variant: PartVariant.Biological,
    accuracy: 3,
    endurance: 7,
    power: 5,
    speed: 5,
    price: 140,
    description: "Insectoid shell plates grown from concentrated calcium. Decent defense with moderate speed."
  },
  {
    id: "c_mech_1",
    name: "Nuclear Core Boiler",
    type: PartType.Chest,
    variant: PartVariant.Mechanical,
    accuracy: 2,
    endurance: 10,
    power: 7,
    speed: 1,
    price: 240,
    description: "Supercharged steam engine boiler with thick lead plating. Unstoppable endurance, but incredibly heavy."
  },
  {
    id: "c_mech_2",
    name: "Tubular Roll Cage",
    type: PartType.Chest,
    variant: PartVariant.Mechanical,
    accuracy: 5,
    endurance: 6,
    power: 4,
    speed: 5,
    price: 130,
    description: "High-tensile chrome-alloy bars safeguarding internal motor components. Great all-rounder chest."
  },

  // --- ARM PARTS ---
  {
    id: "a_bio_1",
    name: "Tendon-Stretched Claw",
    type: PartType.Arm,
    variant: PartVariant.Biological,
    accuracy: 5,
    endurance: 3,
    power: 8,
    speed: 4,
    price: 160,
    description: "Oversized claw with exposed elastic tendons. Launches the heavy iron ball at lethal speeds."
  },
  {
    id: "a_bio_2",
    name: "Whiplash Spore-Tentacle",
    type: PartType.Arm,
    variant: PartVariant.Biological,
    accuracy: 7,
    endurance: 4,
    power: 5,
    speed: 4,
    price: 140,
    description: "Whip-like arm ending in sticky spores. Exceptional for latching onto opponents or securing ball fumbles."
  },
  {
    id: "a_mech_1",
    name: "Hydraulic Piston Smasher",
    type: PartType.Arm,
    variant: PartVariant.Mechanical,
    accuracy: 3,
    endurance: 4,
    power: 10,
    speed: 3,
    price: 220,
    description: "Pneumatic cylinder that can discharge with 20 tons of explosive force. Decimates anyone holding the ball."
  },
  {
    id: "a_mech_2",
    name: "Rotor-Magnetic Grabber",
    type: PartType.Arm,
    variant: PartVariant.Mechanical,
    accuracy: 8,
    endurance: 4,
    power: 6,
    speed: 2,
    price: 170,
    description: "Dual-polarity electromagnet clamp. Instantly attracts and holds onto the heavy magnetic iron ball."
  },

  // --- LEG PARTS ---
  {
    id: "l_bio_1",
    name: "Feline-Grafted Digits",
    type: PartType.Leg,
    variant: PartVariant.Biological,
    accuracy: 3,
    endurance: 3,
    power: 4,
    speed: 10,
    price: 190,
    description: "Grafted powerful muscles of a mutated predator. Unbelievable dash speeds, but fragile under impact."
  },
  {
    id: "l_bio_2",
    name: "Chitinous Scuttling Limbs",
    type: PartType.Leg,
    variant: PartVariant.Biological,
    accuracy: 5,
    endurance: 5,
    power: 4,
    speed: 6,
    price: 120,
    description: "Multi-jointed insectoid legs providing unmatched stability on magnetically charged iron courts."
  },
  {
    id: "l_mech_1",
    name: "Treaded Gyro-Wheel",
    type: PartType.Leg,
    variant: PartVariant.Mechanical,
    accuracy: 2,
    endurance: 6,
    power: 5,
    speed: 7,
    price: 160,
    description: "Heavy-duty rubber treads powered by a high-torque electric motor. Keeps speed consistent across plates."
  },
  {
    id: "l_mech_2",
    name: "Hydraulic Pneumatic Stompers",
    type: PartType.Leg,
    variant: PartVariant.Mechanical,
    accuracy: 4,
    endurance: 8,
    power: 6,
    speed: 2,
    price: 150,
    description: "Bulky mechanical legs with reinforced metal pads designed to stamp onto plates with heavy pressure."
  }
];

// Set all base parts to Common rarity
PARTS_POOL.forEach((part) => {
  if (!part.rarity) {
    part.rarity = PartRarity.Common;
  }
});

export const NAMED_PARTS_POOL: Part[] = [
  {
    id: "named_h_1",
    name: "Aegis-9 Optic Crown",
    type: PartType.Head,
    variant: PartVariant.Mechanical,
    accuracy: 10,
    endurance: 4,
    power: 2,
    speed: 3,
    price: 320,
    description: "Military target lock-on visor (+2 Accuracy, +1 Speed).",
    rarity: PartRarity.Epic,
    isNamed: true,
    backstory: "Forged by the old world militarized syndicates, this masterwork optical visor provides target lock-on within 0.02 milliseconds.",
    bonusStat: { accuracy: 2, speed: 1 },
    visualFlair: "glowing-red-laser"
  },
  {
    id: "named_h_2",
    name: "Gorgon's Calcified Eye",
    type: PartType.Head,
    variant: PartVariant.Biological,
    accuracy: 8,
    endurance: 5,
    power: 3,
    speed: 4,
    price: 290,
    description: "Terrifying multi-lens predator eye (+1 Accuracy, +2 Endurance).",
    rarity: PartRarity.Epic,
    isNamed: true,
    backstory: "Harvested from a high-tier subterranean waste leviathan. The petrifying gaze of this multi-lens eye terrifies blockers.",
    bonusStat: { accuracy: 1, endurance: 2 },
    visualFlair: "bio-emerald-gaze"
  },
  {
    id: "named_c_1",
    name: "Vanguard Reactor Husk",
    type: PartType.Chest,
    variant: PartVariant.Mechanical,
    accuracy: 3,
    endurance: 11,
    power: 4,
    speed: 2,
    price: 350,
    description: "Super-heavy generator chestplate (+3 Endurance, +1 Power).",
    rarity: PartRarity.Epic,
    isNamed: true,
    backstory: "A super-heavy tank reactor core salvaged from the ruins of sector-7. It generates a localized kinetic dampener field.",
    bonusStat: { endurance: 3, power: 1 },
    visualFlair: "plasma-blue-flicker"
  },
  {
    id: "named_c_2",
    name: "Behemoth's Bile Heart",
    type: PartType.Chest,
    variant: PartVariant.Biological,
    accuracy: 2,
    endurance: 10,
    power: 5,
    speed: 3,
    price: 310,
    description: "Self-healing biological organ core (+2 Endurance, +2 Speed).",
    rarity: PartRarity.Epic,
    isNamed: true,
    backstory: "The primary organ of an ancient biological monstrosity. Its pulsing bio-glands continuously pump self-healing coagulants.",
    bonusStat: { endurance: 2, speed: 2 },
    visualFlair: "corrosive-green-bubbles"
  },
  {
    id: "named_a_1",
    name: "Oblivion Hydraulic Claw",
    type: PartType.Arm,
    variant: PartVariant.Mechanical,
    accuracy: 4,
    endurance: 3,
    power: 11,
    speed: 2,
    price: 340,
    description: "High-pressure impact launch claw (+3 Power, +1 Accuracy).",
    rarity: PartRarity.Epic,
    isNamed: true,
    backstory: "A hydraulic-pneumatic mining drill repurposed for brutal ball-launching. Capable of shattering reinforced concrete.",
    bonusStat: { power: 3, accuracy: 1 },
    visualFlair: "steam-vent-blasts"
  },
  {
    id: "named_a_2",
    name: "Slayer's Spiked Tendon",
    type: PartType.Arm,
    variant: PartVariant.Biological,
    accuracy: 6,
    endurance: 4,
    power: 9,
    speed: 4,
    price: 300,
    description: "Bone-spike whip tendon arm (+2 Power, +2 Speed).",
    rarity: PartRarity.Epic,
    isNamed: true,
    backstory: "A thick bone-spike arm containing high-tensile mutant animal ligaments. Snap-releases with explosive whip velocity.",
    bonusStat: { power: 2, speed: 2 },
    visualFlair: "blood-spray-splatter"
  },
  {
    id: "named_l_1",
    name: "Hermes Levitation Servos",
    type: PartType.Leg,
    variant: PartVariant.Mechanical,
    accuracy: 3,
    endurance: 4,
    power: 3,
    speed: 11,
    price: 330,
    description: "Magnetic repulsion levitation boots (+3 Speed, +1 Accuracy).",
    rarity: PartRarity.Epic,
    isNamed: true,
    backstory: "Equipped with magnetic repulsion coils that allow the mutant to slightly hover above the magnetic court plate rails.",
    bonusStat: { speed: 3, accuracy: 1 },
    visualFlair: "sparking-blue-arcs"
  },
  {
    id: "named_l_2",
    name: "Predator's Raptor Claws",
    type: PartType.Leg,
    variant: PartVariant.Biological,
    accuracy: 4,
    endurance: 3,
    power: 4,
    speed: 10,
    price: 310,
    description: "Radioactive kinetic raptor claws (+2 Speed, +2 Power).",
    rarity: PartRarity.Epic,
    isNamed: true,
    backstory: "Grafted talons from a radioactive alpha raptor. The claw fibers store kinetic energy, discharging it in extreme leaps.",
    bonusStat: { speed: 2, power: 2 },
    visualFlair: "shadow-dash-afterimage"
  }
];

// Custom Equipment items
export const EQUIPMENT_LIST: Equipment[] = [
  {
    id: "eq_mag_boots",
    name: "Polarity Magnetic Boots",
    description: "+3 Speed. Keeps limbs firmly locked to the iron court. Ideal for speedsters.",
    price: 90,
    statModifier: { speed: 3 }
  },
  {
    id: "eq_targeting_array",
    name: "Optic Targeting Array",
    description: "+3 Accuracy. Calibrates trajectory for long-range tactical passes and weapon throws.",
    price: 80,
    statModifier: { accuracy: 3 }
  },
  {
    id: "eq_impact_plate",
    name: "Graphene Impact Plate",
    description: "+4 Endurance. Reinforced chest barrier that absorbs direct collision forces.",
    price: 100,
    statModifier: { endurance: 4 }
  },
  {
    id: "eq_knuckles",
    name: "Spiked Steel Knuckles",
    description: "+3 Power. Amplifies arm swings to execute devastating, bone-shattering tackles.",
    price: 85,
    statModifier: { power: 3 }
  },
  {
    id: "eq_adrenaline_pump",
    name: "Adrenaline Surge Pump",
    description: "+2 Speed, +2 Power. Biological-friendly drug injector triggering a combat frenzy.",
    price: 110,
    statModifier: { speed: 2, power: 2 },
    gatedBy: { variant: PartVariant.Biological }
  },
  {
    id: "eq_battery_pack",
    name: "Overclock Sub-Reactor",
    description: "+3 Accuracy, +2 Endurance. Overcharges mechanical chassis logic boards.",
    price: 115,
    statModifier: { accuracy: 3, endurance: 2 },
    gatedBy: { variant: PartVariant.Mechanical }
  }
];

// Biological Name Presets
const BIO_PREFIXES = ["Grisly", "Fleshy", "Serrated", "Bile-born", "Chitinous", "Necrotic", "Putrid", "Grafted", "Glandular", "Toxic", "Mutated", "Plague"];
const BIO_NOUNS = ["Ghoul", "Tendon", "Carapace", "Gland", "Maw", "Spore", "Claw", "Tumor", "Slime", "Organ", "Flesh", "Stalker"];

// Mechanical Name Presets
const MECH_PREFIXES = ["Hydraulic", "Cyber", "Steam-fed", "Pneumatic", "Chassis", "Titanium", "Rust-core", "Chrome", "Ironclad", "Bolted", "Carbon-coated", "Dynamic"];
const MECH_NOUNS = ["Boiler", "Piston", "Wheel", "Vise", "Processor", "Gear", "Vessel", "Magnet", "Welder", "Grinder", "Smasher", "Sprocket"];

// General Name Combiner
export function generateMutantName(parts: { [key in PartType]: Part }): string {
  // Determine if majority is Biological or Mechanical
  let bioCount = 0;
  let mechCount = 0;
  Object.values(parts).forEach((p) => {
    if (p.variant === PartVariant.Biological) bioCount++;
    else mechCount++;
  });

  const isBio = bioCount >= mechCount;
  const prefixes = isBio ? BIO_PREFIXES : MECH_PREFIXES;
  const nouns = isBio ? BIO_NOUNS : MECH_NOUNS;

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  // 15% chance of numeric designation
  if (Math.random() < 0.15) {
    const num = Math.floor(Math.random() * 900) + 100;
    return `${prefix} Unit-${num}`;
  }

  return `${prefix} ${noun}`;
}

// Generate random part with rarity tiers and Named Parts chance
export function generateRandomPart(type?: PartType): Part {
  const chosenType = type || (Object.values(PartType)[Math.floor(Math.random() * 4)] as PartType);
  
  // Rarity roll: 15% Epic, 25% Rare, 60% Common
  const rarityRoll = Math.random();
  let rarity = PartRarity.Common;
  if (rarityRoll < 0.15) {
    rarity = PartRarity.Epic;
  } else if (rarityRoll < 0.40) {
    rarity = PartRarity.Rare;
  }

  // If Epic, 40% chance of being a unique "Named Part" with lore and backlog
  if (rarity === PartRarity.Epic && Math.random() < 0.40) {
    const candidates = NAMED_PARTS_POOL.filter(p => p.type === chosenType);
    const chosenNamed = candidates.length > 0 
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : NAMED_PARTS_POOL[Math.floor(Math.random() * NAMED_PARTS_POOL.length)];
    
    // Clone named part with unique ID
    return {
      ...chosenNamed,
      id: `${chosenNamed.id}_r_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };
  }

  const variant = Math.random() < 0.5 ? PartVariant.Biological : PartVariant.Mechanical;
  const id = `r_${chosenType.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // Create name
  const isBio = variant === PartVariant.Biological;
  let prefix = isBio
    ? BIO_PREFIXES[Math.floor(Math.random() * BIO_PREFIXES.length)]
    : MECH_PREFIXES[Math.floor(Math.random() * MECH_PREFIXES.length)];

  // Inject prefix based on rarity
  if (rarity === PartRarity.Epic) {
    prefix = `${["Overcharged", "Apex", "Syndicate's", "Prototype"][Math.floor(Math.random() * 4)]} ${prefix}`;
  } else if (rarity === PartRarity.Rare) {
    prefix = `${["Calibrated", "Spliced", "Refit", "Vanguard's", "Enhanced"][Math.floor(Math.random() * 5)]} ${prefix}`;
  }

  const suffixes: Record<PartType, string[]> = {
    [PartType.Head]: isBio ? ["Glands", "Sensors", "Skull", "Lobes", "Sight"] : ["Optic", "Visor", "Receptor", "Scanner", "Chassis"],
    [PartType.Chest]: isBio ? ["Carapace", "Sack", "Torso", "Cage", "Shell"] : ["Core", "Boiler", "Frame", "Hull", "Plate"],
    [PartType.Arm]: isBio ? ["Claw", "Tentacle", "Appendage", "Tendon", "Pincer"] : ["Piston", "Grabber", "Smasher", "Magnet", "Gripper"],
    [PartType.Leg]: isBio ? ["Limbs", "Talons", "Stompers", "Digits", "Joints"] : ["Gyro-Wheel", "Tracks", "Servos", "Hydros", "Stompers"]
  };

  const suffixList = suffixes[chosenType];
  const suffix = suffixList[Math.floor(Math.random() * suffixList.length)];
  const name = `${prefix} ${suffix}`;

  // Stat assignment depending on variant and part type
  let accuracy = Math.floor(Math.random() * 4) + 2;
  let endurance = Math.floor(Math.random() * 4) + 2;
  let power = Math.floor(Math.random() * 4) + 2;
  let speed = Math.floor(Math.random() * 4) + 2;

  // Type specific boosters
  if (chosenType === PartType.Head) accuracy += 4;
  else if (chosenType === PartType.Chest) endurance += 4;
  else if (chosenType === PartType.Arm) power += 4;
  else if (chosenType === PartType.Leg) speed += 4;

  // Variant adjustments
  if (isBio) {
    speed += Math.floor(Math.random() * 2);
    endurance += Math.floor(Math.random() * 2);
  } else {
    power += Math.floor(Math.random() * 2);
    accuracy += Math.floor(Math.random() * 2);
  }

  // Rarity stat adjustments & bonus stats
  let bonusStat: { accuracy?: number; endurance?: number; power?: number; speed?: number; } | undefined = undefined;
  let visualFlair: string | undefined = undefined;

  if (rarity === PartRarity.Epic) {
    accuracy += 2;
    endurance += 2;
    power += 2;
    speed += 2;
    // Add primary stat bonus
    if (chosenType === PartType.Head) bonusStat = { accuracy: 2 };
    else if (chosenType === PartType.Chest) bonusStat = { endurance: 2 };
    else if (chosenType === PartType.Arm) bonusStat = { power: 2 };
    else if (chosenType === PartType.Leg) bonusStat = { speed: 2 };
    visualFlair = isBio ? "toxic-bio-gaze" : "sparking-electric-chassis";
  } else if (rarity === PartRarity.Rare) {
    accuracy += 1;
    endurance += 1;
    power += 1;
    speed += 1;
    if (chosenType === PartType.Head) bonusStat = { accuracy: 1 };
    else if (chosenType === PartType.Chest) bonusStat = { endurance: 1 };
    else if (chosenType === PartType.Arm) bonusStat = { power: 1 };
    else if (chosenType === PartType.Leg) bonusStat = { speed: 1 };
    visualFlair = "tinted-neon-glow";
  }

  // Cap at 10, min at 1
  accuracy = Math.min(10, Math.max(1, accuracy));
  endurance = Math.min(10, Math.max(1, endurance));
  power = Math.min(10, Math.max(1, power));
  speed = Math.min(10, Math.max(1, speed));

  let priceMultiplier = rarity === PartRarity.Epic ? 1.75 : rarity === PartRarity.Rare ? 1.3 : 1.0;
  const price = Math.floor(((accuracy + endurance + power + speed) * 7.5 + Math.random() * 20) * priceMultiplier);

  const description = isBio
    ? `An organic biological specimen of ${chosenType.toLowerCase()} tissue featuring asymmetrical growth and high response times.`
    : `A heavy mechanical ${chosenType.toLowerCase()} chassis assembled with hydraulic valves and titanium alloy sheeting.`;

  return {
    id,
    name,
    type: chosenType,
    variant,
    accuracy,
    endurance,
    power,
    speed,
    price,
    description,
    rarity,
    bonusStat,
    visualFlair
  };
}

// Assemble a mutant from parts (or recalculate stats dynamically)
export function assembleMutant(
  name: string,
  parts: { [key in PartType]: Part | null },
  equipment: Equipment | null = null
): Mutant {
  const calcStat = (statName: "accuracy" | "endurance" | "power" | "speed", primaryType: PartType) => {
    const primaryPart = parts[primaryType];
    const primary = primaryPart ? primaryPart[statName] : 2; // default fallback if unequipped

    // sum other parts with a 0.25 multiplier
    let otherSum = 0;
    Object.keys(parts).forEach((key) => {
      const pType = key as PartType;
      if (pType !== primaryType) {
        const p = parts[pType];
        if (p) {
          otherSum += p[statName];
        }
      }
    });
    let finalStat = primary + Math.floor(otherSum * 0.25);
    
    // Add part-specific bonus stats (from Named/Epic/Rare parts)
    Object.values(parts).forEach((p) => {
      if (p && p.bonusStat && p.bonusStat[statName]) {
        finalStat += p.bonusStat[statName]!;
      }
    });

    // Add equipment modifiers
    if (equipment && equipment.statModifier[statName]) {
      finalStat += equipment.statModifier[statName]!;
    }

    return Math.min(15, Math.max(1, finalStat)); // Allow epic cap of 15
  };

  const accuracy = calcStat("accuracy", PartType.Head);
  const endurance = calcStat("endurance", PartType.Chest);
  const power = calcStat("power", PartType.Arm);
  const speed = calcStat("speed", PartType.Leg);

  // Health is directly endurance * 15
  const maxEndurance = endurance * 15;

  // Guess starting role
  let role = MutantRole.Carrier;
  if (speed > power && speed > endurance) {
    role = MutantRole.Carrier;
  } else if (power > speed && power > accuracy) {
    role = MutantRole.Blocker;
  } else if (accuracy > power && accuracy > speed) {
    role = MutantRole.Escort;
  } else {
    role = MutantRole.Interceptor;
  }

  return {
    id: `mutant_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name,
    parts: {
      [PartType.Head]: parts[PartType.Head] || null,
      [PartType.Chest]: parts[PartType.Chest] || null,
      [PartType.Arm]: parts[PartType.Arm] || null,
      [PartType.Leg]: parts[PartType.Leg] || null
    },
    equipment,
    role,
    currentEndurance: maxEndurance,
    maxEndurance,
    accuracy,
    power,
    speed,
    status: "Healthy",
    matchesPlayed: 0,
    kills: 0,
    scores: 0
  };
}

// Starter team and inventory
export function getInitialState() {
  const h1 = PARTS_POOL.find(p => p.id === "h_bio_2")!; // Chitinous Maw
  const c1 = PARTS_POOL.find(p => p.id === "c_bio_2")!; // Serrated Shell Carapace
  const a1 = PARTS_POOL.find(p => p.id === "a_bio_1")!; // Tendon Claw
  const l1 = PARTS_POOL.find(p => p.id === "l_bio_1")!; // Feline Grafted Digits

  const h2 = PARTS_POOL.find(p => p.id === "h_mech_1")!; // Optic Laser
  const c2 = PARTS_POOL.find(p => p.id === "c_mech_2")!; // Tubular Roll Cage
  const a2 = PARTS_POOL.find(p => p.id === "a_mech_1")!; // Hydraulic Piston Smasher
  const l2 = PARTS_POOL.find(p => p.id === "l_mech_1")!; // Treaded Gyro-Wheel

  const starterParts1 = {
    [PartType.Head]: h1,
    [PartType.Chest]: c1,
    [PartType.Arm]: a1,
    [PartType.Leg]: l1
  };

  const starterParts2 = {
    [PartType.Head]: h2,
    [PartType.Chest]: c2,
    [PartType.Arm]: a2,
    [PartType.Leg]: l2
  };

  const mutant1 = assembleMutant("Blood Claw", starterParts1);
  mutant1.role = MutantRole.Carrier;

  const mutant2 = assembleMutant("Steam Crusher", starterParts2);
  mutant2.role = MutantRole.Interceptor;

  // Extra initial parts in inventory so player can start assembling immediately!
  const hExtra = PARTS_POOL.find(p => p.id === "h_mech_2")!; // Steel Visor
  const cExtra = PARTS_POOL.find(p => p.id === "c_bio_1")!; // Bile Sack
  const aExtra = PARTS_POOL.find(p => p.id === "a_bio_2")!; // Spore Tentacle
  const lExtra = PARTS_POOL.find(p => p.id === "l_mech_2")!; // Pneumatic Stompers

  return {
    iron: 300,
    partsInventory: [hExtra, cExtra, aExtra, lExtra],
    mutants: [mutant1, mutant2], // 2 active start, bench empty (allows user to assemble a third!)
    infirmary: [
      { id: "bed_1", mutantId: null, matchesRemaining: 0 },
      { id: "bed_2", mutantId: null, matchesRemaining: 0 }
    ],
    activeMatch: null,
    opponentTeam: generateOpponentTeam(1),
    matchHistory: null
  };
}

// Generate random AI opponent team based on rating/difficulty
export function generateOpponentTeam(tier: number = 1) {
  const opponentNames = [
    "Acid Spitters",
    "Piston Grinders",
    "Gland Rippers",
    "The Cyber Ghoul Stable",
    "Rust Slayers",
    "Necro Slammers"
  ];

  const mutNames = [
    "Plague Bile", "Titan Maw", "Sprocket Jaw", "Tendon Ripper", 
    "Corrosion Tank", "Laser Stalker", "Hydra Piston", "Steel Chitin"
  ];

  const chosenStableName = opponentNames[Math.floor(Math.random() * opponentNames.length)];

  const makeOpponentMutant = (index: number) => {
    const role = index === 0 ? MutantRole.Carrier : MutantRole.Interceptor;
    const name = mutNames[(Math.floor(Math.random() * mutNames.length) + index * 3) % mutNames.length];
    
    // Scale stats with tier
    const baseVal = 4 + tier;
    return {
      name,
      role,
      accuracy: Math.min(10, baseVal + Math.floor(Math.random() * 3)),
      endurance: Math.min(10, baseVal + Math.floor(Math.random() * 3)),
      power: Math.min(10, baseVal + Math.floor(Math.random() * 3)),
      speed: Math.min(10, baseVal + Math.floor(Math.random() * 3))
    };
  };

  return {
    name: chosenStableName,
    mutants: [makeOpponentMutant(0), makeOpponentMutant(1)]
  };
}
