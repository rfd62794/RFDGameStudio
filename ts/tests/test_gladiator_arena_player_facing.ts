import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import config from '../src/games/gladiator_arena/config';

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/gladiator_arena/App.tsx'),
  'utf8'
);

describe('gladiator_arena player-facing copy and tabs', () => {
  it('blurb is 60 words or fewer, plain, and free of developer jargon', () => {
    const description = config.description ?? '';
    expect(description.trim().split(/\s+/).length).toBeLessThanOrEqual(60);
    for (const jargon of ['Blood Bowl', 'agent-driven', 'decision AI', 'continuous anatomy']) {
      expect(description).not.toContain(jargon);
    }
  });

  it('hides the Balance Lab tab and its view unless ?dev=1 is in the address', () => {
    expect(appSource).toContain("new URLSearchParams(window.location.search).get('dev') === '1'");
    const buttonIdx = appSource.indexOf('id="tab-balance-btn"');
    expect(buttonIdx).toBeGreaterThan(-1);
    expect(appSource.lastIndexOf('{showDevTools && (', buttonIdx)).toBeGreaterThan(buttonIdx - 400);
    expect(appSource).toContain("currentTab === 'balance' && showDevTools");
  });

  it('keeps the four player tabs', () => {
    for (const id of ['tab-roster-btn', 'tab-forge-btn', 'tab-medbay-btn', 'tab-ladder-btn']) {
      expect(appSource).toContain(`id="${id}"`);
    }
  });
});
