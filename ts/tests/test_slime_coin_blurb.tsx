// new: ts/tests/test_slime_coin_blurb.tsx
import { describe, it, expect, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import config from '../src/games/slime_coin/config';
import { SLIME_COIN_BLURB } from '../src/games/slime_coin/blurb';
import App from '../src/games/slime_coin/App';
import { loadGame } from '../src/engine/runtime';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('SlimeCoin blurb', () => {
  const text = SLIME_COIN_BLURB.toLowerCase();

  it('is 60 words or fewer and sells the 15-round run', () => {
    expect(SLIME_COIN_BLURB.split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(60);
    expect(text).toContain('15 rounds');
  });

  it('has no inside-baseball or developer wording', () => {
    for (const banned of ['shooter', 'two-layer', 'synerg', 'phase', 'directive', 'prototype', 'todo']) {
      expect(text).not.toContain(banned);
    }
  });

  it('is the text on the arcade card and on the title screen', async () => {
    expect(config.description).toBe(SLIME_COIN_BLURB);
    const session = loadGame('slime_coin', 1);
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<App session={session} />);
    });
    expect(container.textContent).toContain(SLIME_COIN_BLURB);
    root.unmount();
  });
});
