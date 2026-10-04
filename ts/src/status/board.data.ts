import type { ProjectEntry } from './types';
import { GAME_REGISTRY } from '../games/registry';
import { buildDemoRows } from './demoRows';
import { DEMO_OVERLAY } from './demoOverlay';

export const STATUS_BOARD: ProjectEntry[] = [
  // --- Live Catalog ---
  {
    id: 'planet_of_greed', name: 'Planet of Greed', category: 'live_catalog', status: 'active',
    currentState: 'Culture stat asymmetry implemented + balance-verified (60-game harness). House stats wired into all mechanics. UI/UX style split landed: per-House chrome themes via shared FactionTheme tokens, document surfaces stay neutral paper.',
    lastUpdated: '2026-09-30', verificationMethod: 'direct file read',
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
    id: 'voiddrift', name: 'VoidDrift', category: 'separate_infrastructure', status: 'shipped_mature',
    currentState: 'Rust/Bevy/Android + WASM. Phase 4a complete, live on itch.io — opening cinematic live, OpeningCompleteEvent wired via Phase 3b event bus (bug closed). cargo test 48/48 green (re-verified 2026-09-29). Act 1 of a locked 3-game narrative trilogy (VoidDrift -> Dissonance Depths -> SlimeWorld).',
    lastUpdated: '2026-09-29', verificationMethod: 'direct file read',
    capabilities: { mainMenu: 'Y', tutorial: 'Y', graphicalUpgrade: '2026-05-17', soundEffects: 'N' },
  },
  {
    id: 'house_of_kings', name: 'House of Kings: Collab', category: 'separate_infrastructure', status: 'active',
    currentState: 'Firebase/Firestore. Phases 0-10 + full security remediation arc complete.',
    nextAction: 'Direct status check — architecturally isolated, easy to lose track of.',
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
    currentState: 'Persuasion-sim, mid-development. ADR-007 landed figure-locked persuasion methods (Chancellor=evidence, Archbishop=whisper, Commander=appeal) plus a first-run CourtPrimer via shared OnboardingGate.',
    lastUpdated: '2026-09-29',
    capabilities: { mainMenu: 'N', tutorial: 'Shared', graphicalUpgrade: '2026-08-15', soundEffects: 'N' },
  },
  {
    id: 'turboshells', name: 'TurboShells', category: 'separate_infrastructure', status: 'blocked',
    currentState: 'Parked, reference only (decided 2026-10-04). The only source found is the ChimeraLab pygame game (dormant since 2025-12-25); no game code in this repo, only the Feb 2026 audit doc (archive/rpgCore TURBOSHELLS_AUDIT_REPORT) and archived rpgCore racing/genetics modules adapted from it. The Lua carve-out protecting its port was retired by ADR-013 after the port lapsed.',
    nextAction: 'None. If breeding is ever wanted in the arcade, write a one-page TS genetics design note from ChimeraLab\'s gene model rather than a port.',
    lastUpdated: '2026-10-04', verificationMethod: 'direct file read',
    capabilities: { mainMenu: '—', tutorial: '—', graphicalUpgrade: '—', soundEffects: '—' },
  },

  // --- Retired ---
  {
    id: 'brewfield', name: 'BrewField', category: 'retired', status: 'retired',
    currentState: 'Source preserved read-only. Had IntroScreen using shared TitleScreen.', supersededBy: 'Dissonance Depths', lastUpdated: '2026-08-15',
  },

  // --- Generated demo rows (registry games with a source); hand-written parts live in demoOverlay.ts ---
  ...buildDemoRows(GAME_REGISTRY, DEMO_OVERLAY),
];
