import { CreatureConfig } from './chimeraTypes';

export const PRESET_CREATURES: CreatureConfig[] = [
  {
    id: 'preset-battleball-striker',
    name: "Ignis 'Vanguard' Prime",
    codename: 'BB-STRIKER-01',
    archetype: 'humanoid',
    lore: "Neo Battlopolis First-Division possession forward. High thermal output engine with Quicksilver lightweight evasion legs for lightning-fast ball breaks.",
    creatorTag: 'Neo Battlopolis Pro League',
    slots: {
      head: {
        brand: 'Trueflame',
        quality: 'Brand New',
        cyberOrganic: 85,
        variant: 'Thermal Horned Visor',
      },
      chest: {
        brand: 'Trueflame',
        quality: 'Brand New',
        cyberOrganic: 80,
        variant: 'Thermal Core Reactor',
      },
      leftArm: {
        brand: 'Trueflame',
        quality: 'Brand New',
        cyberOrganic: 75,
        variant: 'Booster Gauntlet',
      },
      rightArm: {
        brand: 'Trueflame',
        quality: 'Brand New',
        cyberOrganic: 75,
        variant: 'Booster Gauntlet',
      },
      leftLeg: {
        brand: 'Quicksilver',
        quality: 'Brand New',
        cyberOrganic: 90,
        variant: 'Carbon Spring Blades',
      },
      rightLeg: {
        brand: 'Quicksilver',
        quality: 'Brand New',
        cyberOrganic: 90,
        variant: 'Carbon Spring Blades',
      },
    },
  },
  {
    id: 'preset-chimera-beast',
    name: 'Mire-Stalker Bio-Alpha',
    codename: 'WILDS-CHIMERA-04',
    archetype: 'quadruped',
    lore: 'A feral predator encountered in the deep sulfur swamps of the Wilds. Highly mutated chitin carapace with Icevault reinforced chassis salvaged from a downed war freighter.',
    creatorTag: 'Renegade Field Archive',
    slots: {
      head: {
        brand: 'Mirefaith',
        quality: 'Refurbished',
        cyberOrganic: 15,
        variant: 'Compound Eye Spore Maw',
      },
      chest: {
        brand: 'Icevault',
        quality: 'Refurbished',
        cyberOrganic: 60,
        variant: 'Reinforced Bulkhead Chassis',
      },
      leftArm: {
        brand: 'Mirefaith',
        quality: 'Refurbished',
        cyberOrganic: 20,
        variant: 'Spiked Bio-Claw',
      },
      rightArm: {
        brand: 'Mirefaith',
        quality: 'Refurbished',
        cyberOrganic: 20,
        variant: 'Spiked Bio-Claw',
      },
      leftLeg: {
        brand: 'Mirefaith',
        quality: 'Refurbished',
        cyberOrganic: 10,
        variant: 'Digitigrade Beast Claw',
      },
      rightLeg: {
        brand: 'Mirefaith',
        quality: 'Refurbished',
        cyberOrganic: 10,
        variant: 'Digitigrade Beast Claw',
      },
    },
  },
  {
    id: 'preset-mismatched-scrapper',
    name: "Scrapper 'Apex Mismatch'",
    codename: 'RNG-FRANKEN-99',
    archetype: 'humanoid',
    lore: 'The quintessential Renegade chimera assembled entirely from 6 different Brands on a war-torn frontier. Demonstrates complete socket cross-compatibility across all manufacturers.',
    creatorTag: 'Wasteland Renegade Rig',
    slots: {
      head: {
        brand: 'Prismworks',
        quality: 'Refurbished',
        cyberOrganic: 95,
        variant: 'Precision Sensor Crown',
      },
      chest: {
        brand: 'Icevault',
        quality: 'Refurbished',
        cyberOrganic: 70,
        variant: 'Dreadnought Hull',
      },
      leftArm: {
        brand: 'Trueflame',
        quality: 'Malfunctioning',
        cyberOrganic: 65,
        variant: 'Booster Fist (Sparking)',
      },
      rightArm: {
        brand: 'Quicksilver',
        quality: 'Brand New',
        cyberOrganic: 85,
        variant: 'Kinetic Razor Gauntlet',
      },
      leftLeg: {
        brand: 'Tidalcapital',
        quality: 'Refurbished',
        cyberOrganic: 50,
        variant: 'Hydrofoil Stabilizer Leg',
      },
      rightLeg: {
        brand: 'Mirefaith',
        quality: 'Malfunctioning',
        cyberOrganic: 25,
        variant: 'Mutated Bio-Tendon Leg',
      },
    },
  },
  {
    id: 'preset-icevault-juggernaut',
    name: 'Glacier Aegis Goliath',
    codename: 'DEF-JUGGERNAUT-02',
    archetype: 'beast_brute',
    lore: 'Heavily armored defensive anchor built for blocking power-drives in Mutant Battle Ball. Cryo coolant circuits vent continuously to prevent thermal failure.',
    creatorTag: 'Icevault Heavy Industries',
    slots: {
      head: {
        brand: 'Icevault',
        quality: 'Brand New',
        cyberOrganic: 80,
      },
      chest: {
        brand: 'Icevault',
        quality: 'Brand New',
        cyberOrganic: 85,
      },
      leftArm: {
        brand: 'Icevault',
        quality: 'Brand New',
        cyberOrganic: 80,
      },
      rightArm: {
        brand: 'Icevault',
        quality: 'Brand New',
        cyberOrganic: 80,
      },
      leftLeg: {
        brand: 'Icevault',
        quality: 'Brand New',
        cyberOrganic: 80,
      },
      rightLeg: {
        brand: 'Icevault',
        quality: 'Brand New',
        cyberOrganic: 80,
      },
    },
  },
  {
    id: 'preset-prismworks-raptor',
    name: 'Prism Mirage Raptor',
    codename: 'AV-SNIPER-07',
    archetype: 'avian_raptor',
    lore: 'High-altitude reconnaissance chimera with faceted light-bending optic arrays. Capable of pinpoint accurate ball interceptions from the rafters.',
    creatorTag: 'Prismworks Optics Lab',
    slots: {
      head: {
        brand: 'Prismworks',
        quality: 'Brand New',
        cyberOrganic: 95,
      },
      chest: {
        brand: 'Prismworks',
        quality: 'Brand New',
        cyberOrganic: 90,
      },
      leftArm: {
        brand: 'Quicksilver',
        quality: 'Brand New',
        cyberOrganic: 90,
      },
      rightArm: {
        brand: 'Quicksilver',
        quality: 'Brand New',
        cyberOrganic: 90,
      },
      leftLeg: {
        brand: 'Prismworks',
        quality: 'Brand New',
        cyberOrganic: 95,
      },
      rightLeg: {
        brand: 'Prismworks',
        quality: 'Brand New',
        cyberOrganic: 95,
      },
    },
  },
  {
    id: 'preset-tidal-surge',
    name: 'Tidal Vortex Striker',
    codename: 'TC-SURGE-11',
    archetype: 'humanoid',
    lore: 'Possession runner utilizing internal hydro-turbines for sustained acceleration. Pressurized vortex gauntlets generate disruptive gravity swirls.',
    creatorTag: 'Tidal Syndicate',
    slots: {
      head: {
        brand: 'Tidalcapital',
        quality: 'Brand New',
        cyberOrganic: 70,
      },
      chest: {
        brand: 'Tidalcapital',
        quality: 'Brand New',
        cyberOrganic: 75,
      },
      leftArm: {
        brand: 'Tidalcapital',
        quality: 'Brand New',
        cyberOrganic: 65,
      },
      rightArm: {
        brand: 'Tidalcapital',
        quality: 'Brand New',
        cyberOrganic: 65,
      },
      leftLeg: {
        brand: 'Tidalcapital',
        quality: 'Brand New',
        cyberOrganic: 70,
      },
      rightLeg: {
        brand: 'Tidalcapital',
        quality: 'Brand New',
        cyberOrganic: 70,
      },
    },
  },
];
