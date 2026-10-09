import { describe, it, expect } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import TitleGate from '../src/games/voidrift_particle_sandbox/TitleGate';
import type { GameSession } from '../src/engine/types';

const root = resolve(import.meta.dirname, '..');
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8');
const GAME = 'src/games/voidrift_particle_sandbox';

const session: GameSession = {
  gameId: 'voidrift_particle_sandbox',
  files: { gameId: 'voidrift_particle_sandbox', data: {}, ui: {}, logic: '', engineSource: '' },
  executor: { call: () => [] },
};

describe('VoidRift Particle Sandbox Tier A', () => {
  it('opens on a title screen with a one-line pitch and a Start Building button', async () => {
    const container = document.createElement('div');
    const reactRoot = createRoot(container);
    await act(async () => {
      reactRoot.render(React.createElement(TitleGate, { session }));
    });
    expect(container.textContent).toContain('Particle Sandbox');
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
    expect(existsSync(resolve(root, 'vite.voidrift_particle_sandbox.config.ts'))).toBe(true);
    expect(existsSync(resolve(root, 'src/standalone/voidrift_particle_sandbox/entry.tsx'))).toBe(true);
    expect(existsSync(resolve(root, 'src/standalone/voidrift_particle_sandbox/index.html'))).toBe(true);
    expect(read('src/standalone/voidrift_particle_sandbox/entry.tsx')).toContain(
      "'../../games/voidrift_particle_sandbox/TitleGate'"
    );
    const scripts = (JSON.parse(read('package.json')) as { scripts: Record<string, string> }).scripts;
    expect(scripts['build:voidrift_particle_sandbox']).toBe(
      'vite build --config vite.voidrift_particle_sandbox.config.ts'
    );
  });
});
