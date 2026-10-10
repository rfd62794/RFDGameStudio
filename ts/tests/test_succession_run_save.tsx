// new: ts/tests/test_succession_run_save.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import App from '../src/games/succession/App';
import { createInitialGameState, appealTo } from '../src/games/succession/utils/gameOrchestration';
import {
  RUN_SAVE_KEY,
  isValidSavedRun,
  saveRun,
  loadRun,
  clearRun,
} from '../src/games/succession/utils/runSave';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('runSave', () => {
  it('round-trips a run saved after a move', () => {
    const state = appealTo(createInitialGameState('merchant_banker'), 'chancellor');
    expect(state.segment).toBe(2);
    saveRun({ originId: 'merchant_banker', gameState: state });
    const loaded = loadRun();
    expect(loaded?.originId).toBe('merchant_banker');
    expect(loaded?.gameState.segment).toBe(2);
    expect(loaded?.gameState).toEqual(state);
  });

  it('clearRun removes the save', () => {
    saveRun({ originId: 'bastard_scion', gameState: createInitialGameState('bastard_scion') });
    expect(loadRun()).not.toBeNull();
    clearRun();
    expect(loadRun()).toBeNull();
    expect(localStorage.getItem(RUN_SAVE_KEY)).toBeNull();
  });

  it('never saves a finished run', () => {
    const done = { ...createInitialGameState('bastard_scion'), phase: 'verdict' as const };
    saveRun({ originId: 'bastard_scion', gameState: done });
    expect(loadRun()).toBeNull();
  });

  it('treats damaged saves as no save', () => {
    localStorage.setItem(RUN_SAVE_KEY, '{not json');
    expect(loadRun()).toBeNull();
    localStorage.setItem(RUN_SAVE_KEY, JSON.stringify({ v: 99, data: {} }));
    expect(loadRun()).toBeNull();
    const good = createInitialGameState('bastard_scion');
    expect(isValidSavedRun({ originId: 'nobody', gameState: good })).toBe(false);
    expect(isValidSavedRun({ originId: 'bastard_scion', gameState: { ...good, segment: 9 } })).toBe(false);
    expect(isValidSavedRun({ originId: 'bastard_scion', gameState: { ...good, figures: [] } })).toBe(false);
    expect(isValidSavedRun(null)).toBe(false);
  });
});

async function mountApp() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<App session={undefined as never} />);
  });
  return { container, root };
}

async function click(el: Element | null) {
  if (!el) throw new Error('element not found');
  await act(async () => {
    (el as HTMLElement).click();
  });
}

describe('Succession Continue and reset save', () => {
  it('a begun run survives a reload and can be continued, then forgotten', async () => {
    let { container, root } = await mountApp();
    expect(container.querySelector('#continue-claim-btn')).toBeNull();

    await click(container.querySelector('#begin-claim-btn'));
    expect(loadRun()?.gameState.segment).toBe(1);

    // "Reload": throw the page away and mount a fresh App on the same storage.
    root.unmount();
    document.body.innerHTML = '';
    ({ container, root } = await mountApp());

    const cont = container.querySelector('#continue-claim-btn');
    expect(cont?.textContent).toContain('segment 1 of 8');
    await click(cont);
    expect(container.querySelector('#succession-restart-run')).not.toBeNull();

    // Back to the title keeps the save.
    await click(container.querySelector('#succession-back-to-title'));
    await click(container.querySelector('#succession-back-to-title'));
    expect(container.querySelector('#continue-claim-btn')).not.toBeNull();

    // Forgetting it needs two clicks and removes both the button and the save.
    await click(container.querySelector('#succession-reset-save'));
    expect(container.querySelector('#continue-claim-btn')).not.toBeNull();
    await click(container.querySelector('#succession-reset-save'));
    expect(container.querySelector('#continue-claim-btn')).toBeNull();
    expect(loadRun()).toBeNull();
    root.unmount();
  });
});
