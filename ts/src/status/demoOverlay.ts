// new: Phase 1 D1.2 -- the hand-written parts of the demo rows (moved verbatim from board.data.ts); the rest is generated.
import type { DemoOverlay } from './demoRows';

export const DEMO_OVERLAY: Record<string, DemoOverlay> = {
  trinity_siege: {
    name: 'Trinity Siege/Combat', category: 'ai_studio_track', status: 'active',
    currentState: 'Hex-ring wave defense, an AI Studio embed at /arcade/trinity_siege/: shape counters, race leans, 5 waves, 15 lives. The Rust three-faction chassis is Far Future; only the TS embed is maintained.',
    nextAction: 'Cover screenshot and a phone re-measure (browser steps).',
    lastUpdated: '2026-10-04', verificationMethod: 'direct file read',
  },
  '7_days_to_fry': {
    name: '7 Days to Fry', category: 'ai_studio_track', status: 'shipped_mature',
    currentState: 'Complete cooking-survival sim (7-day arc, win/lose). Registered in GAME_REGISTRY as an external demo and in website_collection. Own state doc (Aug 2026) reports 241/241 vitest floor — self-reported, not re-runnable in-repo.',
    nextAction: 'Promotion decision if revived — TS-native port or permanent external status; wire its own test suite into a runner the studio executes.',
    lastUpdated: '2026-09-29', verificationMethod: 'direct file read',
    capabilities: { mainMenu: 'Y', tutorial: 'N', graphicalUpgrade: '2026-08-30', soundEffects: 'N' },
  },
  antsim_redux: {
    name: 'AntSim Redux', category: 'separate_infrastructure', status: 'shipped_deliberately_paused',
    currentState: 'Phase 5, 90-test floor. Closed via named engine-death-pattern acknowledgment.',
    lastUpdated: '2026-08-15',
    capabilities: { mainMenu: 'N', tutorial: 'N', graphicalUpgrade: '—', soundEffects: 'N' },
  },
  slimegarden: {
    name: 'SlimeGarden', category: 'ai_studio_track', status: 'status_unconfirmed',
    currentState: 'Substantial design work as of mid-July (SlimeDex, Life Stages, partial Color Tree). Audit 2026-09-29 found it is the origin project merged with SlimeBreeder into the live SlimeWorld (ADR-023).',
    nextAction: 'Recommendation only: retire, superseded by SlimeWorld (origin project per ADR-023; source preserved in examples/slimegarden). Retirement is Robert\'s call.',
    lastUpdated: '2026-08-15', verificationMethod: 'research/inference',
  },
  corpworld: {
    name: 'CorpWorld', category: 'retired', status: 'retired',
    currentState: 'Source preserved read-only.', supersededBy: 'Planet of Greed', lastUpdated: '2026-08-15',
  },
  kingmaker_squads: {
    name: 'KingMaker Squads', category: 'retired', status: 'retired',
    currentState: 'Source preserved read-only.', supersededBy: 'Planet of Greed', lastUpdated: '2026-08-15',
  },
  slimebreeder: {
    name: 'SlimeBreeder', category: 'retired', status: 'retired',
    currentState: 'Established the retirement pattern itself.', lastUpdated: '2026-08-15',
  },
  voiddrift_redux: {
    name: 'VoidDrift Redux (web)', category: 'separate_infrastructure', status: 'active',
    currentState: 'Fragment drift correction landed (FRAGMENT_DRIFT_RATE in engine.ts). Auto-dispatch FSM with manual toggle. Orbital canvas with zoom/pan. Web simulation, separate from native VoidDrift.',
    lastUpdated: '2026-08-16',
    capabilities: { mainMenu: 'N', tutorial: 'N', graphicalUpgrade: '2026-08-16', soundEffects: 'N' },
  },
};
