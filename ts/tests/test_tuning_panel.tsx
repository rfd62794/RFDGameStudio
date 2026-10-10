// new: ts/tests/test_tuning_panel.tsx
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { GameShell } from '../src/components/GameShell';
import { tuningStorageKey, writeDevOverrides } from '../src/engine/tuning';

const GAME = 'chimera_wilds';

async function render(el: ReactElement) {
  const container = document.createElement('div');
  const root = createRoot(container);
  await act(async () => {
    root.render(el);
  });
  for (let i = 0; i < 10; i += 1) {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  }
  return { container, root };
}

function shell() {
  return (
    <GameShell gameLabel="CHIMERA WILDS" gameId={GAME}>
      <div>content</div>
    </GameShell>
  );
}

function findButton(container: HTMLElement, label: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll('button')).find(
    b => b.textContent === label
  );
  expect(button, `button ${label}`).toBeTruthy();
  return button as HTMLButtonElement;
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

afterEach(() => {
  localStorage.clear();
  window.history.pushState({}, '', '/');
  vi.restoreAllMocks();
  delete (navigator as { clipboard?: unknown }).clipboard;
});

describe('TuningPanel via GameShell', () => {
  beforeAll(async () => {
    await import('../src/components/TuningPanel');
  });

  it('renders no panel without ?dev=1 and the shell text is unchanged', async () => {
    window.history.pushState({}, '', '/');
    localStorage.setItem(
      tuningStorageKey(GAME),
      JSON.stringify({ 'chimera_wilds.baseline_player.power': 50 })
    );
    const { container, root } = await render(shell());
    expect(container.querySelector('[data-tuning-panel]')).toBeNull();
    const text = container.textContent ?? '';
    expect(text).toContain('CHIMERA WILDS');
    expect(text).toContain('chimera_wilds');
    expect(text).toContain('content');
    root.unmount();
  });

  it('mounts the panel with ?dev=1 and shows a knob row', async () => {
    window.history.pushState({}, '', '/?dev=1');
    const { container, root } = await render(shell());
    const panel = container.querySelector('[data-tuning-panel]');
    expect(panel).toBeTruthy();
    expect(
      container.querySelector('[data-tuning-knob="chimera_wilds.baseline_player.power"]')
    ).toBeTruthy();
    expect(panel!.textContent).toContain(
      'Dev tuning: only you see this. Copy the changes into the files to keep them.'
    );
    root.unmount();
  });

  it('Apply writes changed knobs to localStorage', async () => {
    window.history.pushState({}, '', '/?dev=1');
    const { container, root } = await render(shell());
    const row = container.querySelector(
      '[data-tuning-knob="chimera_wilds.baseline_player.power"]'
    ) as HTMLElement;
    const numberInput = row.querySelector('input[type="number"]') as HTMLInputElement;
    await act(async () => {
      setInputValue(numberInput, '80');
    });
    await act(async () => {
      findButton(container, 'Apply').click();
    });
    expect(localStorage.getItem(tuningStorageKey(GAME))).toBe(
      JSON.stringify({ 'chimera_wilds.baseline_player.power': 80 })
    );
    root.unmount();
  });

  it('Reset removes the stored overrides', async () => {
    window.history.pushState({}, '', '/?dev=1');
    writeDevOverrides(GAME, { 'chimera_wilds.baseline_player.power': 80 });
    const { container, root } = await render(shell());
    await act(async () => {
      findButton(container, 'Reset').click();
    });
    expect(localStorage.getItem(tuningStorageKey(GAME))).toBeNull();
    root.unmount();
  });

  it('Copy as YAML writes the export to the clipboard', async () => {
    window.history.pushState({}, '', '/?dev=1');
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const { container, root } = await render(shell());
    await act(async () => {
      findButton(container, 'Copy as YAML').click();
    });
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toMatch(/^# /);
    root.unmount();
  });
});
