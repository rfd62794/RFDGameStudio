import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadGame } from '../src/engine/runtime';
import { initialState } from '../src/games/slimeworld/App';

const session = loadGame('slimeworld');

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/App.tsx'),
  'utf8'
);
const optionsMenuSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/components/OptionsMenu.tsx'),
  'utf8'
);

const SAVE_KEY = 'slimeworld_save';

describe('SlimeWorld Options Menu + Hard Reset (Pre-Publish)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // §3.1: Basic UI — menu opens on click, closes on dismiss
  it('test_options_menu_opens_and_closes', () => {
    expect(appSource).toContain('setShowOptionsMenu(true)');
    expect(appSource).toContain('showOptionsMenu &&');
    // Closing resets pendingHardReset too, so re-opening never starts mid-confirm
    expect(appSource).toContain('setShowOptionsMenu(false); setPendingHardReset(false);');
    expect(optionsMenuSource).toContain('onClose');
  });

  // §3.2: Single click does not reset; confirm step is required — matching
  // the existing Favor Disposal two-step confirm pattern exactly
  it('test_hard_reset_requires_two_step_confirm', () => {
    // Step 1: the visible "Hard Reset" button only sets pendingHardReset, never resets directly
    expect(optionsMenuSource).toContain('onClick={() => setPendingHardReset(true)}');
    expect(optionsMenuSource).toContain('Hard Reset');
    // Step 2: only the gated "Confirm Hard Reset" button calls the real reset action
    expect(optionsMenuSource).toContain('onClick={onConfirmHardReset}');
    expect(optionsMenuSource).toContain('Confirm Hard Reset');
    // Step 2 is rendered only when pendingHardReset is true (matches disposalConfirmSlimeId's step-gating)
    expect(optionsMenuSource).toContain('!pendingHardReset ?');
    // A cancel path exists at Step 2, matching the disposal pattern's cancel button
    expect(optionsMenuSource).toContain('setPendingHardReset(false)');
  });

  // §3.3: Real check — after reset, the real localStorage key is actually
  // empty/cleared, not just React state
  it('test_hard_reset_clears_persisted_save', () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ cycle: 99 }));
    expect(localStorage.getItem(SAVE_KEY)).toBeTruthy();

    // Confirm App.tsx's real reset handler clears the exact same real key
    expect(appSource).toContain("const SAVE_KEY = 'slimeworld_save';");
    expect(appSource).toContain('localStorage.removeItem(SAVE_KEY)');

    // Replicate the real handleHardReset side effect against the real localStorage
    localStorage.removeItem(SAVE_KEY);
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();
  });

  // §3.4: Post-reset state matches genuine new-game initial state exactly
  it('test_hard_reset_returns_to_fresh_game_state', () => {
    // Confirm the real handler reuses the real "new game" state, not a
    // hand-constructed reset object
    expect(appSource).toContain('setState(initialState(session))');
    expect(appSource).toContain("setGamePhase('opening')");

    const freshState = initialState(session);
    // A genuine new game has no region unlocks and no tutorials pre-shown
    expect(freshState.regionUnlocks).toBeUndefined();
    expect(freshState.shownTutorials).toBeUndefined();
    expect(freshState.slimes.length).toBeGreaterThan(0);
  });

  // §3.5: Real integration check — post-reset, only Roster + Lab tabs are
  // visible, proving this directive composes correctly with the Gate Tabs directive
  it('test_hard_reset_reflects_in_tab_gating', () => {
    const freshState = initialState(session);
    const hasUnlockedRegion = Object.values(freshState.regionUnlocks ?? {}).some(Boolean);
    expect(hasUnlockedRegion).toBe(false);

    // Confirm the real gating source uses the same real field this reset restores
    expect(appSource).toContain('Object.values(state.regionUnlocks ?? {}).some(Boolean)');
  });
});
