// new: ts/tests/test_choke_point_wave_counter.ts
import { describe, it, expect } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { loadGame } from '../src/engine/runtime';
import App from '../src/games/choke_point/App';

describe('Choke Point wave counter', () => {
  it('shows "Wave 1 of N" once play starts, N from the data file', async () => {
    const session = loadGame('choke_point');
    const total = Object.keys((session.files.data as { waves: Record<string, unknown> }).waves).length;
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => { root.render(React.createElement(App, { session })); });
    const start = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Establish Connection'));
    await act(async () => { start!.click(); });
    expect(container.textContent).toContain(`Wave 1 of ${total}`);
    root.unmount();
  });
});
