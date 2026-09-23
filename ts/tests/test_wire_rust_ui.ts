import { describe, it, expect } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { loadGame } from '../src/engine/runtime';
import App from '../src/games/wire_rust/App';

describe('Wire & Rust UI', () => {
  it('test_wire_rust_renders_title_screen', async () => {
    const session = loadGame('wire_rust');
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(App, { session }));
    });

    expect(container.textContent).toContain('WIRE & RUST');
    root.unmount();
  });

  it('test_wire_rust_start_run_renders_game', async () => {
    const session = loadGame('wire_rust');
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(App, { session }));
    });

    const startButton = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Start Run')
    );
    expect(startButton).toBeTruthy();

    await act(async () => {
      startButton!.click();
    });

    expect(container.textContent).toContain('Location');
    expect(container.textContent).toContain('Vital Stats');
    expect(container.textContent).toContain('Active Hand');
    root.unmount();
  });
});
