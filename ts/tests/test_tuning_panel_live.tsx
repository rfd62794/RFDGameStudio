// new: ts/tests/test_tuning_panel_live.tsx
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import TuningPanel from '../src/components/TuningPanel';
import { tuned, tuningStorageKey, writeDevOverrides } from '../src/engine/tuning';

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

function knobInput(container: HTMLElement, key: string): HTMLInputElement {
  const row = container.querySelector(`[data-tuning-knob="${key}"]`) as HTMLElement;
  expect(row, `knob row ${key}`).toBeTruthy();
  return row.querySelector('input[type="number"]') as HTMLInputElement;
}

afterEach(() => {
  localStorage.clear();
  window.history.pushState({}, '', '/');
});

describe('TuningPanel live apply', () => {
  it('a live knob applies without reload and tuned() reads the new value', async () => {
    window.history.pushState({}, '', '/?dev=1');
    const reload = vi.fn();
    const { container, root } = await render(<TuningPanel gameId="scrapcrawl" reload={reload} />);
    await act(async () => {
      setInputValue(knobInput(container, 'scrapcrawl.loss_damage'), '4');
    });
    await act(async () => {
      findButton(container, 'Apply').click();
    });
    expect(reload).not.toHaveBeenCalled();
    expect(tuned('scrapcrawl.loss_damage')).toBe(4);
    expect(container.querySelector('[data-tuning-status]')!.textContent).toBe('Applied live.');
    root.unmount();
  });

  it('a next-run knob saves without reload and the status says so', async () => {
    window.history.pushState({}, '', '/?dev=1');
    const reload = vi.fn();
    const { container, root } = await render(<TuningPanel gameId="scrapcrawl" reload={reload} />);
    await act(async () => {
      setInputValue(knobInput(container, 'scrapcrawl.player_max_hp'), '14');
    });
    await act(async () => {
      findButton(container, 'Apply').click();
    });
    expect(reload).not.toHaveBeenCalled();
    expect(localStorage.getItem(tuningStorageKey('scrapcrawl'))).toBe(
      JSON.stringify({ 'scrapcrawl.player_max_hp': 14 })
    );
    const status = container.querySelector('[data-tuning-status]');
    expect(status).toBeTruthy();
    expect(status!.getAttribute('role')).toBe('status');
    expect(status!.textContent).toContain('next run');
    root.unmount();
  });

  it('a reload-mode knob still reloads', async () => {
    window.history.pushState({}, '', '/?dev=1');
    const reload = vi.fn();
    const { container, root } = await render(
      <TuningPanel gameId="chimera_wilds" reload={reload} />
    );
    await act(async () => {
      setInputValue(knobInput(container, 'chimera_wilds.baseline_player.power'), '80');
    });
    await act(async () => {
      findButton(container, 'Apply').click();
    });
    expect(reload).toHaveBeenCalledTimes(1);
    root.unmount();
  });

  it('Reset follows the same rule for live-only overrides', async () => {
    window.history.pushState({}, '', '/?dev=1');
    writeDevOverrides('scrapcrawl', { 'scrapcrawl.loss_damage': 4 });
    const reload = vi.fn();
    const { container, root } = await render(<TuningPanel gameId="scrapcrawl" reload={reload} />);
    await act(async () => {
      findButton(container, 'Reset').click();
    });
    expect(reload).not.toHaveBeenCalled();
    expect(localStorage.getItem(tuningStorageKey('scrapcrawl'))).toBeNull();
    expect(tuned('scrapcrawl.loss_damage')).toBe(2);
    root.unmount();
  });

  it('each scrapcrawl knob row carries its apply mode', async () => {
    window.history.pushState({}, '', '/?dev=1');
    const { container, root } = await render(<TuningPanel gameId="scrapcrawl" />);
    const loss = container.querySelector('[data-tuning-knob="scrapcrawl.loss_damage"]')!;
    const hp = container.querySelector('[data-tuning-knob="scrapcrawl.player_max_hp"]')!;
    expect(loss.getAttribute('data-tuning-apply')).toBe('live');
    expect(hp.getAttribute('data-tuning-apply')).toBe('next-run');
    expect(loss.querySelector('[data-tuning-apply="live"]')!.textContent).toBe('live');
    expect(hp.querySelector('[data-tuning-apply="next-run"]')!.textContent).toBe('next run');
    root.unmount();
  });
});
