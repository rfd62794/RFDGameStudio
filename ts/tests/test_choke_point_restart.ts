import { describe, it, expect } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { loadGame } from '../src/engine/runtime';
import App from '../src/games/choke_point/App';
import { isVictory, VICTORY_LOG } from '../src/games/choke_point/outcome';

describe('Choke Point Restart & Victory', () => {
  it('test_isVictory_true_only_with_victory_log_and_core_alive', () => {
    const base = {
      wave: 2,
      round: 3,
      energy: 5,
      core_hp: 4,
      towers: [],
      enemies: [],
      history: [VICTORY_LOG],
    };

    expect(isVictory(base)).toBe(true);
    expect(isVictory({ ...base, core_hp: 0 })).toBe(false);
    expect(isVictory({ ...base, history: ['Wave 1 cleared!'] })).toBe(false);
  });

  it('test_restart_returns_to_title', async () => {
    const session = loadGame('choke_point');
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(App, { session }));
    });

    const startButton = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Establish Connection')
    );
    expect(startButton).toBeTruthy();

    await act(async () => {
      startButton!.click();
    });

    const restartButton = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Restart')
    );
    expect(restartButton).toBeTruthy();

    await act(async () => {
      restartButton!.click();
    });

    expect(container.textContent).toContain('Establish Connection');
    root.unmount();
  });
});
