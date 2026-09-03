import { describe, it, expect } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { loadGame } from '../src/engine/runtime';
import App from '../src/games/choke_point/App';

describe('Choke Point UI', () => {
  it('test_choke_point_renders_title_screen', async () => {
    const session = loadGame('choke_point');
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(App, { session }));
    });

    expect(container.textContent).toContain('CHOKE POINT');
    root.unmount();
  });

  it('test_choke_point_start_renders_grid', async () => {
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

    // Verify it renders the grid, Core HP, and Energy HUD items
    expect(container.textContent).toContain('CORE');
    expect(container.textContent).toContain('HP');
    expect(container.textContent).toContain('Energy');
    expect(container.textContent).toContain('Tactical Blueprint');
    expect(container.textContent).toContain('Commit Turn');
    root.unmount();
  });
});
