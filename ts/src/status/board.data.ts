import type { ProjectEntry } from './types';

export const STATUS_BOARD: ProjectEntry[] = [
  // --- Live Catalog ---
  {
    id: 'planet_of_greed', name: 'Planet of Greed', category: 'live_catalog', status: 'active',
    currentState: 'Culture stat asymmetry implemented + balance-verified (60-game harness). House stats wired into all mechanics. UI/UX style split deferred.',
    lastUpdated: '2026-08-16',
    capabilities: { mainMenu: 'Shared', tutorial: 'Y', graphicalUpgrade: '2026-08-15', soundEffects: 'N' },
  },
  {
    id: 'shoal', name: 'Shoal', category: 'live_catalog', status: 'shipped_mature',
    currentState: 'TS-native migration complete (151.7x speedup). artGen fully consumed (canvas paths, hunger-aware specs, path caching).',
    lastUpdated: '2026-08-15',
    capabilities: { mainMenu: 'N', tutorial: 'N', graphicalUpgrade: '2026-08-15', soundEffects: 'N' },
  },
  {
    id: 'mutant_battle_ball', name: 'Mutant Battle Ball', category: 'live_catalog', status: 'active',
    currentState: 'TS-native migration done. Mid major creative overhaul — Neo Battlopolis, six-Brand Trinity, Body Part Synergy.',
    nextAction: 'Continue feature build-out — genuinely mid-build, not near done.',
    lastUpdated: '2026-08-15',
    capabilities: { mainMenu: 'Shared', tutorial: 'N', graphicalUpgrade: '2026-08-15', soundEffects: 'N' },
  },
  {
    id: 'slimeworld', name: 'SlimeWorld', category: 'live_catalog', status: 'shipped_mature',
    currentState: 'Live on itch.io + arcade. Survived a production crisis (missing Lua files in bundle, fixed retroactively across 5 games). artGen fully consumed.',
    lastUpdated: '2026-08-15',
    capabilities: { mainMenu: 'N', tutorial: 'Y', graphicalUpgrade: '2026-08-15', soundEffects: 'N' },
  },
  {
    id: 'dissonance_depths', name: 'Dissonance Depths', category: 'live_catalog', status: 'shipped_mature',
    currentState: 'Live on itch.io + rfditservices.com. Source of the artGen module.',
    lastUpdated: '2026-08-15',
    capabilities: { mainMenu: 'Shared', tutorial: 'Y', graphicalUpgrade: '2026-08-15', soundEffects: 'N' },
  },
  {
    id: 'gladiator_arena', name: 'Gladiator Arena', category: 'live_catalog', status: 'active',
    currentState: 'Cyber-organic gladiator roster management. Turn-based tactical combat with continuous anatomy damage. Procedural sound effects implemented (Web Audio API).',
    lastUpdated: '2026-08-16',
    capabilities: { mainMenu: 'N', tutorial: 'N', graphicalUpgrade: '2026-08-16', soundEffects: 'Y' },
  },
  {
    id: 'chimera_wilds', name: 'Chimera Wilds', category: 'live_catalog', status: 'shipped_mature',
    currentState: 'Live on itch.io + arcade. Lua-backed.',
    lastUpdated: '2026-08-15',
    capabilities: { mainMenu: 'Shared', tutorial: 'N', graphicalUpgrade: '2026-08-15', soundEffects: 'N' },
  },
  {
    id: 'scrapcrawl', name: 'ScrapCrawl', category: 'live_catalog', status: 'shipped_mature',
    currentState: 'Live on itch.io + arcade. Lua-backed.',
    lastUpdated: '2026-08-15',
    capabilities: { mainMenu: 'Shared', tutorial: 'N', graphicalUpgrade: '2026-08-15', soundEffects: 'N' },
  },
  {
    id: 'slime_coin', name: 'Slime Coin', category: 'live_catalog', status: 'shipped_mature',
    currentState: 'Live on itch.io + arcade. Lua-backed.',
    lastUpdated: '2026-08-15',
    capabilities: { mainMenu: 'Shared', tutorial: 'N', graphicalUpgrade: '2026-08-15', soundEffects: 'N' },
  },
  {
    id: 'horse_racing', name: 'Horse Racing', category: 'live_catalog', status: 'shipped_mature',
    currentState: 'Live on arcade. Lua-backed.',
    lastUpdated: '2026-08-15',
    capabilities: { mainMenu: 'Shared', tutorial: 'N', graphicalUpgrade: '2026-08-15', soundEffects: 'N' },
  },
  {
    id: 'slither_rogue', name: 'Slither Rogue', category: 'live_catalog', status: 'shipped_mature',
    currentState: 'Live on arcade. Lua-backed.',
    lastUpdated: '2026-08-15',
    capabilities: { mainMenu: 'N', tutorial: 'N', graphicalUpgrade: '2026-08-15', soundEffects: 'N' },
  },

  // --- Separate Infrastructure ---
  {
    id: 'voiddrift', name: 'VoidDrift', category: 'separate_infrastructure', status: 'status_unconfirmed',
    currentState: 'Rust/Bevy/Android. Act 1 of a locked 3-game narrative trilogy (VoidDrift -> Dissonance Depths -> SlimeWorld).',
    nextAction: 'Verify whether the previously-flagged OpeningCompleteEvent blocking bug is still open.',
    lastUpdated: '2026-08-15', verificationMethod: 'research/inference',
    capabilities: { mainMenu: 'N', tutorial: 'N', graphicalUpgrade: '—', soundEffects: 'N' },
  },
  {
    id: 'voiddrift_redux', name: 'VoidDrift Redux (web)', category: 'separate_infrastructure', status: 'active',
    currentState: 'Fragment drift correction landed (FRAGMENT_DRIFT_RATE in engine.ts). Auto-dispatch FSM with manual toggle. Orbital canvas with zoom/pan. Web simulation, separate from native VoidDrift.',
    lastUpdated: '2026-08-16',
    capabilities: { mainMenu: 'N', tutorial: 'N', graphicalUpgrade: '2026-08-16', soundEffects: 'N' },
  },
  {
    id: 'house_of_kings', name: 'House of Kings: Collab', category: 'separate_infrastructure', status: 'active',
    currentState: 'Firebase/Firestore. Phases 0-10 + full security remediation arc complete.',
    nextAction: 'Direct status check — architecturally isolated, easy to lose track of.',
    lastUpdated: '2026-08-15',
    capabilities: { mainMenu: 'N', tutorial: 'N', graphicalUpgrade: '—', soundEffects: 'N' },
  },
  {
    id: 'antsim_redux', name: 'AntSim Redux', category: 'separate_infrastructure', status: 'shipped_deliberately_paused',
    currentState: 'Phase 5, 90-test floor. Closed via named engine-death-pattern acknowledgment.',
    lastUpdated: '2026-08-15',
    capabilities: { mainMenu: 'N', tutorial: 'N', graphicalUpgrade: '—', soundEffects: 'N' },
  },
  {
    id: 'early_learning_buddy', name: 'Early Learning Buddy', category: 'separate_infrastructure', status: 'active',
    currentState: 'Voice-powered learning companion. Speech recognition, fuzzy matching, AI-generated story beats. Intentionally unlisted from public arcade.',
    lastUpdated: '2026-08-16',
    capabilities: { mainMenu: 'N', tutorial: 'N', graphicalUpgrade: '2026-08-16', soundEffects: 'Partial' },
  },

  // --- AI-Studio-Origin Track ---
  {
    id: 'succession', name: 'Succession', category: 'ai_studio_track', status: 'active',
    currentState: 'Persuasion-sim redesign, mid-development. Local TitleScreen implementation.',
    lastUpdated: '2026-08-15',
    capabilities: { mainMenu: 'N', tutorial: 'N', graphicalUpgrade: '2026-08-15', soundEffects: 'N' },
  },
  {
    id: 'slimegarden', name: 'SlimeGarden', category: 'ai_studio_track', status: 'status_unconfirmed',
    currentState: 'Substantial design work as of mid-July (SlimeDex, Life Stages, partial Color Tree).',
    nextAction: 'Direct status check needed.',
    lastUpdated: '2026-08-15', verificationMethod: 'research/inference',
  },
  {
    id: 'trinity_siege', name: 'Trinity Siege/Combat', category: 'ai_studio_track', status: 'status_unconfirmed',
    currentState: 'Bevy vs. egui architecture question left unresolved.',
    nextAction: 'Direct status check — no longer blocked on the Rust-chassis question, that is confirmed Far Future Dream now.',
    lastUpdated: '2026-08-15', verificationMethod: 'research/inference',
  },
  {
    id: '7_days_to_fry', name: '7 Days to Fry', category: 'ai_studio_track', status: 'status_unconfirmed',
    currentState: 'Imported alongside KingMaker Squads (now retired). No status since.',
    nextAction: 'Direct status check needed.',
    lastUpdated: '2026-08-15', verificationMethod: 'research/inference',
  },
  {
    id: 'turboshells', name: 'TurboShells', category: 'ai_studio_track', status: 'status_unconfirmed',
    currentState: 'Named as a genuine cross-language-origin Lua exception (with VoidDrift). No recent confirmation.',
    nextAction: 'Direct status check needed.',
    lastUpdated: '2026-08-15', verificationMethod: 'research/inference',
  },

  // --- Retired ---
  {
    id: 'corpworld', name: 'CorpWorld', category: 'retired', status: 'retired',
    currentState: 'Source preserved read-only.', supersededBy: 'Planet of Greed', lastUpdated: '2026-08-15',
  },
  {
    id: 'kingmaker_squads', name: 'KingMaker Squads', category: 'retired', status: 'retired',
    currentState: 'Source preserved read-only.', supersededBy: 'Planet of Greed', lastUpdated: '2026-08-15',
  },
  {
    id: 'brewfield', name: 'BrewField', category: 'retired', status: 'retired',
    currentState: 'Source preserved read-only. Had IntroScreen using shared TitleScreen.', supersededBy: 'Dissonance Depths', lastUpdated: '2026-08-15',
  },
  {
    id: 'slimebreeder', name: 'SlimeBreeder', category: 'retired', status: 'retired',
    currentState: 'Established the retirement pattern itself.', lastUpdated: '2026-08-15',
  },
];
