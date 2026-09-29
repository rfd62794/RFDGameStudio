import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadGame } from '../src/engine/runtime';
import { isBetWin } from '../src/games/horse_racing/utils/bets';
import { sound } from '../src/games/horse_racing/utils/sound';

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/horse_racing/App.tsx'),
  'utf8'
);
const trackSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/horse_racing/components/RaceTrack.tsx'),
  'utf8'
);
const bettingSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/horse_racing/components/BettingTab.tsx'),
  'utf8'
);

describe('Horse Racing polish — tutorial', () => {
  it('gates the tutorial to first launch via a persisted flag', () => {
    expect(appSource).toContain('useOnboardingGate');
    expect(appSource).toContain("'derby_sim_tutorial_seen'");
    // Fires only when no tutorial-seen save exists (New Game path)
    expect(appSource).toContain('loadSave<boolean>(TUTORIAL_SEEN_KEY)');
    expect(appSource).toContain('triggerTutorial()');
    // Dismissal persists the flag
    expect(appSource).toContain('writeSave(TUTORIAL_SEEN_KEY, true)');
  });

  it('renders 3-5 tutorial lines inside the shared Modal', () => {
    expect(appSource).toContain('<Modal title="How to Play"');
    const listMatch = appSource.match(/<ul className="hr-tutorial">([\s\S]*?)<\/ul>/);
    expect(listMatch).toBeTruthy();
    const lineCount = (listMatch![1].match(/<li>/g) ?? []).length;
    expect(lineCount).toBeGreaterThanOrEqual(3);
    expect(lineCount).toBeLessThanOrEqual(5);
  });
});

describe('Horse Racing polish — HUD', () => {
  it('surfaces bank, stable capacity, condition, and record chips', () => {
    expect(appSource).toContain('hr-hud');
    expect(appSource).toContain('STABLE BANK');
    expect(appSource).toContain('Stable {ownedHorses.length}/{unlockedSlots}');
    expect(appSource).toContain('Ready {readyCount}');
    expect(appSource).toContain('Races {gameState.race_history.length}');
    expect(appSource).toContain('Wins {careerWins}');
  });
});

describe('Horse Racing polish — sound', () => {
  it('wires gun, finish, and result sounds to race events', () => {
    expect(appSource).toContain("import { sound } from './utils/sound'");
    expect(trackSource).toContain('sound.playStartGun');
    expect(trackSource).toContain('sound.playFinish');
    expect(trackSource).toContain('sound.playWin');
  });

  it('exposes a mute toggle in the HUD and on the track', () => {
    expect(appSource).toContain('hr-sound-toggle');
    expect(trackSource).toContain('hr-sound-toggle');
    expect(trackSource).toContain('onToggleSound');
  });

  it('sound engine no-ops safely without AudioContext and honors mute', () => {
    // jsdom has no AudioContext — every play call must be a safe no-op
    expect(() => {
      sound.playStartGun();
      sound.playFinish();
      sound.playWin();
      sound.playLoss();
    }).not.toThrow();
    sound.setEnabled(false);
    expect(sound.isSoundEnabled()).toBe(false);
    expect(() => sound.playWin()).not.toThrow();
    sound.setEnabled(true);
    expect(sound.isSoundEnabled()).toBe(true);
  });
});

describe('Horse Racing polish — end state & bet rules', () => {
  it('shows EndStateScreen on bankruptcy (the existing grant trigger)', () => {
    expect(appSource).toContain('EndStateScreen');
    expect(appSource).toContain('gameState.emergency_grant_shown');
    expect(appSource).toContain('Stable Bankrupt');
    expect(appSource).toContain('handleDismissBankruptcy');
  });

  it('isBetWin matches settlement: Win=1st, Place<=2, Show<=3', () => {
    expect(isBetWin('Win', 1)).toBe(true);
    expect(isBetWin('Win', 2)).toBe(false);
    expect(isBetWin('Place', 2)).toBe(true);
    expect(isBetWin('Place', 3)).toBe(false);
    expect(isBetWin('Show', 3)).toBe(true);
    expect(isBetWin('Show', 4)).toBe(false);
    expect(isBetWin('Win', undefined)).toBe(false);
    expect(isBetWin('Show', null)).toBe(false);
  });

  it('both result surfaces share the same bet-win helper', () => {
    expect(trackSource).toContain("import { isBetWin } from '../utils/bets'");
    expect(bettingSource).toContain("import { isBetWin } from '../utils/bets'");
    expect(trackSource).toContain('isBetWin(bet.type, p.final_rank)');
    expect(bettingSource).toContain('isBetWin(b.type, finished)');
  });
});

describe('Horse Racing — game still loads', () => {
  it('loadGame resolves the four-file contract', () => {
    const session = loadGame('horse_racing');
    expect(session).toBeTruthy();
    expect(session.files.data).toBeTruthy();
    expect(session.files.ui).toBeTruthy();
  });
});
