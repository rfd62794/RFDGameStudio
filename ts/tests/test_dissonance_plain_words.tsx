// new: ts/tests/test_dissonance_plain_words.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import App from '../src/games/dissonance/App';
import OpeningPhase from '../src/games/dissonance/phases/OpeningPhase';
import CombatPhase from '../src/games/dissonance/phases/CombatPhase';
import FirstCombatHint, { COMBAT_HINT_SEEN_KEY } from '../src/games/dissonance/components/FirstCombatHint';
import { loadGame } from '../src/engine/runtime';
import type { RunState } from '../src/games/dissonance/types';

const BANNED = ['phase a', 'renderer', 'core initialization', 'directive', 'prototype', 'todo', 'gameid'];

async function mount(element: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return { container, root };
}

function fightingRun(): RunState {
  return {
    playerHp: 20,
    playerMaxHp: 25,
    playerShield: 0,
    enemy: { name: 'Rust Wisp', hp: 10, maxHp: 10, dot: null, intent: { type: 'attack', value: 3, description: 'Strikes for 3' } },
    deckState: { drawPile: [], hand: [], discard: [] },
    logs: [],
  } as unknown as RunState;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('plain words on the Dissonance screens', () => {
  it('the title screen and the shell header carry no developer wording', async () => {
    const session = loadGame('dissonance', 1);
    const { container, root } = await mount(<App session={session} />);
    const text = (container.textContent ?? '').toLowerCase();
    expect(text).toContain('dissonance depths');
    for (const word of BANNED) expect(text).not.toContain(word);
    root.unmount();
  });

  it('the first-cards screen carries no developer wording', async () => {
    const pack = [{ action: 'sever', element: 'ember', cardId: 'ember_none_sever', name: 'Ember Cut' }];
    const { container, root } = await mount(<OpeningPhase pack={pack} onComplete={() => {}} />);
    const text = (container.textContent ?? '').toLowerCase();
    expect(text).toContain('your first cards');
    for (const word of BANNED) expect(text).not.toContain(word);
    root.unmount();
  });
});

describe('first combat hint', () => {
  it('shows on the first fight, is dismissed with one click, and stays gone', async () => {
    let { container, root } = await mount(<CombatPhase run={fightingRun()} onPlayCard={() => {}} />);
    expect(container.querySelector('#dissonance-first-combat-hint')).not.toBeNull();
    const button = container.querySelector('#dissonance-first-combat-hint-dismiss') as HTMLElement;
    await act(async () => {
      button.click();
    });
    expect(container.querySelector('#dissonance-first-combat-hint')).toBeNull();
    expect(localStorage.getItem(COMBAT_HINT_SEEN_KEY)).toBe('true');
    root.unmount();

    ({ container, root } = await mount(<CombatPhase run={fightingRun()} onPlayCard={() => {}} />));
    expect(container.querySelector('#dissonance-first-combat-hint')).toBeNull();
    root.unmount();
  });

  it('does not show for a player who has already seen it', async () => {
    localStorage.setItem(COMBAT_HINT_SEEN_KEY, 'true');
    const { container, root } = await mount(<FirstCombatHint />);
    expect(container.querySelector('#dissonance-first-combat-hint')).toBeNull();
    root.unmount();
  });
});
