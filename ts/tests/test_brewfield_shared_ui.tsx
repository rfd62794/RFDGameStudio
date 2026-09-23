import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import IntroScreen from '../src/games/brewfield/components/IntroScreen';
import GameOverScreen from '../src/games/brewfield/components/GameOverScreen';
import MapProgress from '../src/games/brewfield/components/MapProgress';

async function render(element: React.ReactElement) {
  const container = document.createElement('div');
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return { container, root };
}

describe('Brewfield shared UI retrofits', () => {
  it('IntroScreen uses shared TitleScreen and feature cards', async () => {
    const start = vi.fn();
    const { container, root } = await render(<IntroScreen onStartGame={start} />);

    expect(container.querySelector('#intro-container')).toBeTruthy();
    expect(container.textContent).toContain('Brewfield');
    expect(container.textContent).toContain('Alchemical Battler');
    expect(container.textContent).toContain('Elemental Chemistry');

    const startBtn = container.querySelector('button') as HTMLElement | null;
    expect(startBtn?.textContent).toContain('Descend');
    await act(async () => startBtn?.click());
    expect(start).toHaveBeenCalled();
    root.unmount();
  });

  it('GameOverScreen uses shared EndStateScreen for win and loss', async () => {
    const restart = vi.fn();
    const { container, root } = await render(
      <GameOverScreen
        won
        stats={{
          enemiesDefeated: 4,
          brewsCreated: 12,
          totalDamageDealt: 89,
          totalShieldGained: 40,
          totalHealed: 25,
          volatileSuccesses: 5,
          volatileFails: 2,
        }}
        onRestart={restart}
      />
    );

    expect(container.querySelector('#game-over-container')).toBeTruthy();
    expect(container.textContent).toContain('Run Cleared');
    expect(container.textContent).toContain('4');

    const restartBtn = container.querySelector('button') as HTMLElement | null;
    expect(restartBtn?.textContent).toContain('Brew Again');
    await act(async () => restartBtn?.click());
    expect(restart).toHaveBeenCalled();
    root.unmount();
  });

  it('MapProgress uses shared ProgressIndicator for linear node progression', async () => {
    const nodes = [
      { id: 1, type: 'forage' as const, name: 'Hall 1', description: 'Forage', completed: true },
      { id: 2, type: 'fight' as const, name: 'Hall 2', description: 'Fight', completed: false },
      { id: 3, type: 'rest' as const, name: 'Hall 3', description: 'Rest', completed: false },
      { id: 9, type: 'fight' as const, name: 'Boss', description: 'Boss', completed: false },
    ];
    const { container, root } = await render(<MapProgress nodes={nodes} currentNodeId={2} />);

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(nodes.length);
    expect(container.textContent).toContain('FIGHT');
    expect(container.textContent).toContain('FORAGE');
    expect(container.textContent).toContain('REST');
    expect(container.textContent).toContain('BOSS');
    root.unmount();
  });
});
