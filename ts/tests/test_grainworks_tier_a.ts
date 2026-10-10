import { describe, it, expect } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import TitleGate from '../src/games/grainworks/TitleGate';
import type { GameSession } from '../src/engine/types';

const root = resolve(import.meta.dirname, '..');
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8');
const GAME = 'src/games/grainworks';

const session: GameSession = {
  gameId: 'grainworks',
  files: { gameId: 'grainworks', data: {}, ui: {}, logic: '', engineSource: '' },
  executor: { call: () => [] },
};

describe('GrainWorks Tier A', () => {
  it('opens on a title screen with a one-line pitch and a Start Building button', async () => {
    const container = document.createElement('div');
    const reactRoot = createRoot(container);
    await act(async () => {
      reactRoot.render(React.createElement(TitleGate, { session }));
    });
    expect(container.textContent).toContain('GrainWorks');
    expect(container.textContent).toContain('Drop it. Catch it. Build on it.');
    const start = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Start Building')
    );
    expect(start).toBeTruthy();
    reactRoot.unmount();
  });

  it('is lazy-loaded through the title gate', () => {
    expect(read(`${GAME}/config.ts`)).toContain("import('./TitleGate')");
  });

  it('no longer blocks on window.confirm', () => {
    expect(read(`${GAME}/App.tsx`)).not.toContain('window.confirm');
  });

  it('Header has a text Restart button and a two-step Clear', () => {
    const header = read(`${GAME}/components/Header.tsx`);
    expect(header).toContain('id="btn-restart"');
    expect(header).toContain('Tap again to clear');
    expect(read(`${GAME}/App.tsx`)).toContain('onRestart={onRestart}');
  });

  it('Restart remounts the game and returns to the title', () => {
    const gate = read(`${GAME}/TitleGate.tsx`);
    expect(gate).toContain('setRunKey((k) => k + 1);');
    expect(gate).toContain("setScreen('title');");
    expect(gate).toContain('key={runKey}');
  });

  it('keeps App.tsx under 600 lines', () => {
    expect(read(`${GAME}/App.tsx`).split('\n').length).toBeLessThanOrEqual(600);
  });

  it('has the standalone files and the build script', () => {
    expect(existsSync(resolve(root, 'vite.grainworks.config.ts'))).toBe(true);
    expect(existsSync(resolve(root, 'src/standalone/grainworks/entry.tsx'))).toBe(true);
    expect(existsSync(resolve(root, 'src/standalone/grainworks/index.html'))).toBe(true);
    expect(read('src/standalone/grainworks/entry.tsx')).toContain(
      "'../../games/grainworks/TitleGate'"
    );
    const scripts = (JSON.parse(read('package.json')) as { scripts: Record<string, string> }).scripts;
    expect(scripts['build:grainworks']).toBe(
      'vite build --config vite.grainworks.config.ts'
    );
  });
});
