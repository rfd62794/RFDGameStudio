import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MoreGamesByMe } from '../src/ui/components';

const STABLE_GAMES = [
  { id: 'brewfield', label: 'Brewfield' },
  { id: 'shoal', label: 'Shoal' },
  { id: 'slimeworld', label: 'SlimeWorld' },
];

async function render(element: React.ReactElement) {
  const container = document.createElement('div');
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return { container, root };
}

describe('MoreGamesByMe', () => {
  it('arcade mode calls onSelectGame when another game button is clicked', async () => {
    const onSelect = vi.fn();
    const { container, root } = await render(
      <MoreGamesByMe
        mode="arcade"
        currentGameId="brewfield"
        games={STABLE_GAMES}
        onSelectGame={onSelect}
      />
    );

    const btn = container.querySelector('#more-games-shoal') as HTMLElement | null;
    expect(btn).toBeTruthy();
    expect(btn?.textContent).toContain('Shoal');
    await act(async () => btn?.click());
    expect(onSelect).toHaveBeenCalledWith('shoal');
    root.unmount();
  });

  it('standalone mode opens the arcade URL when another game button is clicked', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const { container, root } = await render(
      <MoreGamesByMe
        mode="standalone"
        currentGameId="brewfield"
        games={STABLE_GAMES}
        arcadeBaseUrl="https://rfditservices.com/games/rfdgamestudio/"
      />
    );

    const btn = container.querySelector('#more-games-shoal') as HTMLElement | null;
    await act(async () => btn?.click());
    expect(open).toHaveBeenCalledWith(
      'https://rfditservices.com/games/rfdgamestudio/?game=shoal',
      '_blank'
    );
    open.mockRestore();
    root.unmount();
  });

  it('omits the current game from the list', async () => {
    const { container, root } = await render(
      <MoreGamesByMe mode="arcade" currentGameId="shoal" games={STABLE_GAMES} />
    );

    expect(container.querySelector('#more-games-shoal')).toBeFalsy();
    expect(container.querySelector('#more-games-brewfield')).toBeTruthy();
    expect(container.querySelector('#more-games-slimeworld')).toBeTruthy();
    root.unmount();
  });
});
