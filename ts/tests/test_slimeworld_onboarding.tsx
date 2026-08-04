import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadGame, call } from '../src/engine/runtime';
import { stateToLua, slimeToLua, type LabState, type Slime, type SlimeColor } from '../src/games/slimeworld/types';
import { prepopulateAllTutorials, shouldFireTutorial, ALL_TUTORIAL_IDS } from '../src/games/slimeworld/tutorial';

const session = loadGame('slimeworld');

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/App.tsx'),
  'utf8'
);

const missionsSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/components/MissionsTab.tsx'),
  'utf8'
);

const tutorialSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/tutorial.ts'),
  'utf8'
);

function makeMinimalState(): LabState {
  const slime: Slime = {
    id: 's1', name: 'Test Slime', color: 'Red', pattern: 'Solid', level: 5, xp: 0,
    stats: { hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: 10 },
    role: 'idle', generation: 0, colorSaturation: 100, hue: 0, saturation: 100,
    diffusionRatio: 20, amplitude: 40, accentHue: 0, vertexCount: 4, irregularity: 10,
    createdAt: Date.now(), lockedRole: null, garrisonedAt: null, stage: 'Juvenile',
  };
  return {
    cycle: 1, credits: 1000, rosterCap: 10, breedingSuccessRateModifier: 0,
    slimes: [slime], contracts: [], zones: [], activeDispatch: null,
    logs: [], activeMediation: null, activeExploration: null, planetRegion: null,
    wildsUnlocked: false, hasAutoFeeder: false,
    colorRelationships: {} as Record<SlimeColor, number>,
    recentMarketSales: [], regentInventory: {}, colorRegentInventory: {}, targetRegentInventory: {},
    petitions: [],
  };
}

describe('SlimeWorld Demo Scope & Onboarding', () => {
  // §3.1: New Campaign → beat renders → Hub
  it('test_new_campaign_shows_opening_beat', () => {
    // Source-level check: App.tsx has a gamePhase state with 'opening' and 'hub' branches
    expect(appSource).toContain("gamePhase");
    expect(appSource).toContain("'opening'");
    expect(appSource).toContain("'hub'");
    // The opening beat must render before the Hub (early return)
    expect(appSource).toContain("gamePhase === 'opening'");
    // The opening beat is now parameterized by the real assigned starting
    // color (Random Starting Color Foundation directive) rather than
    // hardcoding "Ember is your home" — confirm the real template still
    // says "is your home" for whichever culture was actually assigned
    expect(appSource).toContain('getOpeningBeatText(state.startingColor');
    expect(readFileSync(resolve(import.meta.dirname, '../src/games/slimeworld/tutorial.ts'), 'utf8')).toContain('is your home');
    // The Begin button transitions to Hub
    expect(appSource).toContain("setGamePhase('hub')");
    // No breeding/mechanic explanation in the opening beat's rendered JSX
    // (narrowed to the <h2>...Begin span, not the color_targets data-access
    // line used only to resolve the real place names)
    const openingBeatMatch = appSource.match(/<h2[\s\S]*?Begin/);
    expect(openingBeatMatch).toBeTruthy();
    expect(openingBeatMatch![0]).not.toMatch(/breed|genetics/i);
  });

  // §3.2: Continue → Hub directly, beat never renders
  it('test_continue_skips_opening_beat', () => {
    // Source-level check: loadSavedState is called in gamePhase initializer
    expect(appSource).toContain('loadSavedState()');
    // When save exists, gamePhase starts as 'hub' (skips opening)
    const gamePhaseInit = appSource.match(/gamePhase.*useState.*\{[\s\S]*?loadSavedState[\s\S]*?'hub'[\s\S]*?'opening'/);
    expect(gamePhaseInit).toBeTruthy();
    // When save exists, state is loaded from save (not initialState)
    const stateInit = appSource.match(/state.*useState.*\{[\s\S]*?loadSavedState[\s\S]*?initialState/);
    expect(stateInit).toBeTruthy();
  });

  // §3.3: Loaded save → all 3 tutorial IDs pre-shown, zero popups fire
  it('test_new_game_guard_prevents_tutorial_replay', () => {
    // Source-level check: prepopulateAllTutorials is called when restoring
    expect(appSource).toContain('prepopulateAllTutorials');
    // The New Game Guard is applied in the state initializer
    const guardMatch = appSource.match(/saved[\s\S]*?prepopulateAllTutorials/);
    expect(guardMatch).toBeTruthy();

    // Functional test: prepopulateAllTutorials marks all 3 IDs as shown
    const allShown = prepopulateAllTutorials();
    for (const id of ALL_TUTORIAL_IDS) {
      expect(allShown[id]).toBe(true);
    }
    // shouldFireTutorial returns false for all pre-populated IDs
    for (const id of ALL_TUTORIAL_IDS) {
      expect(shouldFireTutorial(allShown, id)).toBe(false);
    }
  });

  // §3.4: Fresh game, first Hub view → T-1 fires once
  it('test_t1_fires_on_first_hub_view', () => {
    // Source-level check: T-1 trigger exists in App.tsx (as variable reference)
    expect(appSource).toContain('TUTORIAL_IDS.T1_HUB_VIEW');
    // T-1 fires on gamePhase === 'hub'
    expect(appSource).toMatch(/gamePhase.*hub[\s\S]*?TUTORIAL_IDS\.T1_HUB_VIEW/);
    // T-1 uses t1FiredRef to fire only once
    expect(appSource).toContain('t1FiredRef');
    // T-1 checks shouldFireTutorial before firing
    expect(appSource).toContain('shouldFireTutorial');
    // T-1 content mentions regions/reachable
    expect(tutorialSource).toContain('Thornward');
    expect(tutorialSource).toContain('Abyssal Ember');
  });

  // §3.5: First successful unlock, any region → T-3 fires, states permanence
  it('test_t3_fires_on_first_region_unlock', () => {
    // Source-level check: T-3 trigger exists in App.tsx (as variable reference)
    expect(appSource).toContain('TUTORIAL_IDS.T3_REGION_UNLOCK');
    // T-3 fires on region unlock state change (prevRegionUnlocksRef)
    expect(appSource).toContain('prevRegionUnlocksRef');
    // T-3 content states permanence ("forever")
    expect(tutorialSource).toContain('forever');
    expect(tutorialSource).toContain('permanently unlocked');

    // Bridge test: verify that breeding a matching slime actually produces region unlocks
    const data = session.files.data as Record<string, unknown>;
    const regionLocks = data['region_locks'] as Array<Record<string, unknown>>;
    const colorTargets = data['color_targets'] as Array<Record<string, unknown>>;
    const shapeTargets = data['shape_targets'] as Array<Record<string, unknown>>;
    const accentTargets = data['accent_targets'] as Array<Record<string, unknown>>;

    const slime = {
      ...makeMinimalState().slimes[0],
      hue: 30, saturation: 80, vertexCount: 3, irregularity: 10,
      diffusionRatio: 5, amplitude: 40,
    } as Slime;
    const state = makeMinimalState();
    state.slimes = [slime];
    const luaState = stateToLua(state);

    const [result, error] = call(session, 'check_region_unlocks', luaState, slimeToLua(slime),
      regionLocks, colorTargets, shapeTargets, accentTargets) as [Record<string, unknown> | null, string | null];
    expect(error).toBeFalsy();
    expect(result).toBeTruthy();
    const unlocked = Object.values(result as Record<string, unknown>);
    expect(unlocked.length).toBeGreaterThan(0);
    expect(unlocked).toContain('node_frontier_a');
  });

  // §3.6: Region-lock status renders within existing tab structure, not a new screen
  it('test_region_status_renders_as_subview', () => {
    // Source-level check: MissionsTab has isNodeLocked that checks region unlock state
    expect(missionsSource).toContain('regionLockNodeIds');
    expect(missionsSource).toContain('regionUnlocks');
    // The check is within the existing isNodeLocked function
    expect(missionsSource).toContain('isNodeLocked');
    // No new top-level screen — region status is in the existing MissionsTab
    expect(missionsSource).toContain('activeSubTab');
    expect(missionsSource).toContain("'regions'");
    // App.tsx passes regionLockNodeIds to MissionsTab (not a separate screen)
    expect(appSource).toContain('regionLockNodeIds');
  });
});
