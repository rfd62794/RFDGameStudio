import { ReconstructionItem } from '../types';

export const RECONSTRUCTION_ITEMS: ReconstructionItem[] = [
  // Tier 1: Miscellaneous Entities & Phenomena (Phase 1 Demo Scope)
  {
    id: 'rec_void_bloom',
    tier: 1,
    name: 'Void Bloom',
    type: 'Entity',
    description: 'A bioluminescent vascular flora that metabolizes ambient Hawking radiation.',
    loreBackstory:
      'Native to orbital greenhouse rings of the Old Sol civilization. Its petals emit a gentle turquoise luminescence in total vacuum.',
    requiredInputs: [{ inputId: 'fracture_solvent', amount: 1 }],
    dustCost: 50,
    reconstructionDuration: 8,
    progress: 0,
    isReconstructing: false,
    isCompleted: false,
    iconType: 'Flower2',
    visualDetails: {
      color: '#34d399',
      glow: 'rgba(52, 211, 153, 0.4)',
      symbol: '✿',
    },
  },
  {
    id: 'rec_memory_beacon',
    tier: 1,
    name: 'Memory Beacon',
    type: 'Entity',
    description: 'An ancient automated navigational lighthouse repeating the coordinates of lost colony worlds.',
    loreBackstory:
      'Broadcasted navigation pulses along the pre-void trade corridors. Its harmonic frequency still cuts through space.',
    requiredInputs: [{ inputId: 'void_stabilizer', amount: 1 }],
    dustCost: 80,
    reconstructionDuration: 10,
    progress: 0,
    isReconstructing: false,
    isCompleted: false,
    iconType: 'RadioTower',
    visualDetails: {
      color: '#38bdf8',
      glow: 'rgba(56, 189, 248, 0.4)',
      symbol: '📡',
    },
  },
  {
    id: 'rec_silicon_nautilus',
    tier: 1,
    name: 'Silicon Nautilus',
    type: 'Entity',
    description: 'A micro-crystalline organism that glides along solar magnetic field lines.',
    loreBackstory:
      'Engineered in asteroid belt biosensors. It absorbs charged ions and crystallizes delicate mineral shells.',
    requiredInputs: [{ inputId: 'hull_binder', amount: 1 }],
    dustCost: 100,
    reconstructionDuration: 12,
    progress: 0,
    isReconstructing: false,
    isCompleted: false,
    iconType: 'Sparkles',
    visualDetails: {
      color: '#fbbf24',
      glow: 'rgba(251, 191, 36, 0.4)',
      symbol: '🐚',
    },
  },
  {
    id: 'rec_auroral_filament',
    tier: 1,
    name: 'Auroral Filament',
    type: 'Entity',
    description: 'A floating ribbon of stabilized planetary ionosphere dancing in the vacuum.',
    loreBackstory:
      'Recovered remnants of ancient gas giant rings. It shimmers with iridescent green and violet plasma arcs.',
    requiredInputs: [
      { inputId: 'fracture_solvent', amount: 1 },
      { inputId: 'void_stabilizer', amount: 1 },
    ],
    dustCost: 140,
    reconstructionDuration: 15,
    progress: 0,
    isReconstructing: false,
    isCompleted: false,
    iconType: 'Waves',
    visualDetails: {
      color: '#a855f7',
      glow: 'rgba(168, 85, 247, 0.4)',
      symbol: '≋',
    },
  },
  {
    id: 'rec_harmonic_monolith',
    tier: 1,
    name: 'Harmonic Monolith',
    type: 'Entity',
    description: 'A black obsidian obelisk vibrating with the acoustic signature of the first universe.',
    loreBackstory:
      'Carved from compressed core basalt. It acts as an anchor point for space station stability.',
    requiredInputs: [
      { inputId: 'void_stabilizer', amount: 2 },
      { inputId: 'hull_binder', amount: 1 },
    ],
    dustCost: 200,
    reconstructionDuration: 20,
    progress: 0,
    isReconstructing: false,
    isCompleted: false,
    iconType: 'Milestone',
    visualDetails: {
      color: '#f43f5e',
      glow: 'rgba(244, 63, 94, 0.4)',
      symbol: '▲',
    },
  },

  // Tier 2: Planets (Phase 2 - Placeholder Stubs)
  {
    id: 'rec_thalassa_primus',
    tier: 2,
    name: 'Thalassa Primus (Ocean World)',
    type: 'Planet',
    description: 'A globe-spanning azure ocean world with deep hydrothermal mineral vents.',
    loreBackstory:
      'The cradle of aquatic civilizations before the compression event.',
    requiredInputs: [
      { inputId: 'geolithic_core', amount: 2 },
      { inputId: 'biomass_matrix', amount: 2 },
    ],
    dustCost: 800,
    reconstructionDuration: 45,
    progress: 0,
    isReconstructing: false,
    isCompleted: false,
    iconType: 'Globe2',
    visualDetails: {
      color: '#06b6d4',
      glow: 'rgba(6, 182, 212, 0.5)',
      symbol: '🌐',
    },
  },

  // Tier 3: Stars (Phase 2 - Placeholder Stubs)
  {
    id: 'rec_sol_restored',
    tier: 3,
    name: 'Sol-Restored (White Dwarf)',
    type: 'Star',
    description: 'The first rekindled star of the new universe, casting radiant golden light across the void.',
    loreBackstory:
      'Igniting Sol-Restored initiates the Cosmic Cascade. All station manufacturing speeds permanently increase by +25%.',
    requiredInputs: [
      { inputId: 'stellar_ignition_core', amount: 2 },
      { inputId: 'geolithic_core', amount: 6 },
    ],
    dustCost: 3500,
    reconstructionDuration: 120,
    progress: 0,
    isReconstructing: false,
    isCompleted: false,
    iconType: 'SunMedium',
    visualDetails: {
      color: '#facc15',
      glow: 'rgba(250, 204, 21, 0.6)',
      symbol: '☀️',
    },
  },
];
