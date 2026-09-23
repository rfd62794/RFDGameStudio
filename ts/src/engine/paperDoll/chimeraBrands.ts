import { Brand, BrandMetadata, QualityTier, CreatureConfig } from './chimeraTypes';

export const BRANDS: Record<Brand, BrandMetadata> = {
  Trueflame: {
    id: 'Trueflame',
    name: 'Trueflame',
    mechanicalIdentity: 'Power, aggressive',
    visualDirection: 'Hot colors, sharp/angular, thermal vents',
    motionSignature: {
      title: 'Explosive & Committed',
      mechanicalIdentity: 'Power, aggressive',
      motionSignature: 'Sharp, committed, fast acceleration into strikes, minimal anticipation restraint',
      accelerationProfile: 'Explosive Snap (Cubic / Quartic Snap)',
    },
    primaryColor: '#e63946',
    secondaryColor: '#f77f00',
    accentColor: '#fcbf49',
    glowColor: '#ff4d00',
    organicColor: '#a8201a',
    cyberColor: '#2b2d42',
    statAffinity: {
      power: 30,
      mitigation: 5,
      agility: 15,
      precision: 10,
      adaptability: 10,
      momentum: 20,
    },
    symbol: '🔥',
    badgeBg: 'bg-gradient-to-r from-red-950/80 to-amber-950/80',
    badgeBorder: 'border-red-500/40 text-red-400',
  },
  Icevault: {
    id: 'Icevault',
    name: 'Icevault',
    mechanicalIdentity: 'Endurance, mitigation',
    visualDirection: 'Cool colors, armored/thick, frost-chassis',
    motionSignature: {
      title: 'Weighted & Grounded',
      mechanicalIdentity: 'Endurance, mitigation',
      motionSignature: 'Slower, weighted, deliberate — motion reads heavy with massive inertia and grounded compliance',
      accelerationProfile: 'Heavy Inertia / Sturdy Stance Damping',
    },
    primaryColor: '#0077b6',
    secondaryColor: '#00b4d8',
    accentColor: '#90e0ef',
    glowColor: '#48cae4',
    organicColor: '#1d3557',
    cyberColor: '#3d5a80',
    statAffinity: {
      power: 10,
      mitigation: 35,
      agility: 5,
      precision: 10,
      adaptability: 15,
      momentum: 15,
    },
    symbol: '❄️',
    badgeBg: 'bg-gradient-to-r from-cyan-950/80 to-blue-950/80',
    badgeBorder: 'border-cyan-500/40 text-cyan-400',
  },
  Quicksilver: {
    id: 'Quicksilver',
    name: 'Quicksilver',
    mechanicalIdentity: 'Agility, evasion',
    visualDirection: 'Sleek, light, aerodynamic fins',
    motionSignature: {
      title: 'Agile & Elastic',
      mechanicalIdentity: 'Agility, evasion',
      motionSignature: 'Fast, light, high-cadence spring with dynamic overshoot and settle oscillations on stops',
      accelerationProfile: 'High-Frequency Spring / Elastic Settle',
    },
    primaryColor: '#e0e1dd',
    secondaryColor: '#778da9',
    accentColor: '#00f5d4',
    glowColor: '#70e000',
    organicColor: '#415a77',
    cyberColor: '#1b263b',
    statAffinity: {
      power: 10,
      mitigation: 5,
      agility: 35,
      precision: 20,
      adaptability: 10,
      momentum: 10,
    },
    symbol: '⚡',
    badgeBg: 'bg-gradient-to-r from-slate-900/80 to-emerald-950/80',
    badgeBorder: 'border-emerald-500/40 text-emerald-400',
  },
  Prismworks: {
    id: 'Prismworks',
    name: 'Prismworks',
    mechanicalIdentity: 'Precision, accuracy',
    visualDirection: 'Faceted, clean, geometric crystals',
    motionSignature: {
      title: 'Calculated & Exact',
      mechanicalIdentity: 'Precision, accuracy',
      motionSignature: 'Clean, minimal secondary motion, exact mathematical trajectory timing, crisp stops',
      accelerationProfile: 'Linear-Cubic Exact / Zero Secondary Slop',
    },
    primaryColor: '#7209b7',
    secondaryColor: '#b5179e',
    accentColor: '#f72585',
    glowColor: '#4cc9f0',
    organicColor: '#560bad',
    cyberColor: '#240046',
    statAffinity: {
      power: 15,
      mitigation: 10,
      agility: 10,
      precision: 35,
      adaptability: 10,
      momentum: 10,
    },
    symbol: '💎',
    badgeBg: 'bg-gradient-to-r from-purple-950/80 to-fuchsia-950/80',
    badgeBorder: 'border-fuchsia-500/40 text-fuchsia-400',
  },
  Mirefaith: {
    id: 'Mirefaith',
    name: 'Mirefaith',
    mechanicalIdentity: 'Adaptive/hybrid',
    visualDirection: 'Murky, boundary-blurring, chitin & bio-spores',
    motionSignature: {
      title: 'Fluid & Biomorphic',
      mechanicalIdentity: 'Adaptive/hybrid',
      motionSignature: 'Fluid, slightly unpredictable timing with biomorphic joint phase lag and twitch bursts',
      accelerationProfile: 'Undulating Organic Lag / Asynchronous Waves',
    },
    primaryColor: '#2d6a4f',
    secondaryColor: '#52b788',
    accentColor: '#95d5b2',
    glowColor: '#74c69d',
    organicColor: '#1b4332',
    cyberColor: '#081c15',
    statAffinity: {
      power: 15,
      mitigation: 15,
      agility: 10,
      precision: 10,
      adaptability: 35,
      momentum: 5,
    },
    symbol: '☣️',
    badgeBg: 'bg-gradient-to-r from-emerald-950/80 to-lime-950/80',
    badgeBorder: 'border-lime-500/40 text-lime-400',
  },
  Tidalcapital: {
    id: 'Tidalcapital',
    name: 'Tidalcapital',
    mechanicalIdentity: 'Momentum, sustain',
    visualDirection: 'Flowing, fluid, hydro-turbines',
    motionSignature: {
      title: 'Momentum & Flow',
      mechanicalIdentity: 'Momentum, sustain',
      motionSignature: 'Builds smoothly, carries kinetic momentum through follow-through longer than other Brands',
      accelerationProfile: 'Progressive Wave Build / Sustained Inertia',
    },
    primaryColor: '#03045e',
    secondaryColor: '#0077b6',
    accentColor: '#00b4d8',
    glowColor: '#48cae4',
    organicColor: '#023e8a',
    cyberColor: '#001233',
    statAffinity: {
      power: 15,
      mitigation: 15,
      agility: 15,
      precision: 10,
      adaptability: 10,
      momentum: 25,
    },
    symbol: '🌊',
    badgeBg: 'bg-gradient-to-r from-blue-950/80 to-cyan-950/80',
    badgeBorder: 'border-blue-500/40 text-blue-400',
  },
};

/**
 * Derives the creature's dominant brand by weighting torso (2x) and limbs/head (1x).
 */
export function getDominantBrand(creature: CreatureConfig): Brand {
  const counts: Record<Brand, number> = {
    Trueflame: 0,
    Icevault: 0,
    Quicksilver: 0,
    Prismworks: 0,
    Mirefaith: 0,
    Tidalcapital: 0,
  };

  if (!creature || !creature.slots) return 'Trueflame';

  // Chest carries double weight as core power source
  if (creature.slots.chest) counts[creature.slots.chest.brand] += 2;
  if (creature.slots.head) counts[creature.slots.head.brand] += 1;
  if (creature.slots.leftArm) counts[creature.slots.leftArm.brand] += 1;
  if (creature.slots.rightArm) counts[creature.slots.rightArm.brand] += 1;
  if (creature.slots.leftLeg) counts[creature.slots.leftLeg.brand] += 1;
  if (creature.slots.rightLeg) counts[creature.slots.rightLeg.brand] += 1;

  let maxBrand: Brand = creature.slots.chest?.brand || 'Trueflame';
  let maxCount = -1;
  for (const [b, c] of Object.entries(counts)) {
    if (c > maxCount) {
      maxCount = c;
      maxBrand = b as Brand;
    }
  }

  return maxBrand;
}

export const QUALITY_TIERS: Record<QualityTier, {
  name: QualityTier;
  description: string;
  visualCue: string;
  statMultiplier: number;
  colorClass: string;
  badgeClass: string;
}> = {
  'Brand New': {
    name: 'Brand New',
    description: 'Pristine factory spec, frictionless micro-bearings and high-polish alloy',
    visualCue: 'Clean edges, dynamic sheen highlight, zero wear or discoloration',
    statMultiplier: 1.25,
    colorClass: 'text-emerald-400',
    badgeClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  },
  'Refurbished': {
    name: 'Refurbished',
    description: 'Battlefield salvage welded together with titanium rivets and reinforced seams',
    visualCue: 'Visible weld seams, mismatch plate patches, rivet lines and warning decals',
    statMultiplier: 1.0,
    colorClass: 'text-amber-400',
    badgeClass: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
  },
  'Malfunctioning': {
    name: 'Malfunctioning',
    description: 'Critical AI synapse degradation and leaking plasma coils — erratic and volatile',
    visualCue: 'Dynamic SVG feTurbulence distortion glitch, spark arc bursts, flickering glow',
    statMultiplier: 0.85,
    colorClass: 'text-rose-400',
    badgeClass: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
  },
};
