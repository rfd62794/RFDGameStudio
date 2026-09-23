import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { GameLoader } from '../src/arcade';
import type { GameSession } from '../src/engine/types';

vi.mock('../src/engine/runtime', () => ({
  loadGame: vi.fn(() => ({
    gameId: 'unregistered_studio_game',
    files: { logic: '', data: {}, engineSource: '' },
    executor: {} as unknown as GameSession['executor'],
  } as unknown as GameSession)),
}));

describe('Arcade GameLoader registry mismatch', () => {
  it('test_game_loader_shows_registry_mismatch_error', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(GameLoader, { gameId: 'unregistered_studio_game' }));
    });
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
    const text = container.textContent ?? '';
    expect(text).toContain('loaded successfully but has no registered config in registry.ts');
    expect(text).toContain('studio configuration error');
    expect(text).toContain('Game ID: unregistered_studio_game');
    root.unmount();
  });
});
