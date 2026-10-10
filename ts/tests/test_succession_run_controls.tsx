// new: ts/tests/test_succession_run_controls.tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import App from '../src/games/succession/App';
import ConfirmButton from '../src/games/succession/components/ConfirmButton';

async function mount(element: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return { container, root };
}

function byId(container: HTMLElement, id: string): HTMLButtonElement | null {
  return container.querySelector(`#${id}`);
}

async function click(el: HTMLElement | null) {
  if (!el) throw new Error('element not found');
  await act(async () => {
    el.click();
  });
}

function beginButton(container: HTMLElement): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll('button')).find((b) =>
    (b.textContent ?? '').includes('Begin Your Claim'),
  );
}

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('ConfirmButton', () => {
  it('needs two clicks to confirm', async () => {
    const onConfirm = vi.fn();
    const { container, root } = await mount(
      <ConfirmButton id="cb" label="Do it" confirmLabel="Really?" onConfirm={onConfirm} />,
    );
    await click(byId(container, 'cb'));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(byId(container, 'cb')?.textContent).toContain('Really?');
    await click(byId(container, 'cb'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    root.unmount();
  });

  it('disarms itself after 3 seconds', async () => {
    vi.useFakeTimers();
    const onConfirm = vi.fn();
    const { container, root } = await mount(
      <ConfirmButton id="cb" label="Do it" confirmLabel="Really?" onConfirm={onConfirm} />,
    );
    await click(byId(container, 'cb'));
    await act(async () => {
      vi.advanceTimersByTime(3100);
    });
    expect(byId(container, 'cb')?.textContent).toContain('Do it');
    await click(byId(container, 'cb'));
    expect(onConfirm).not.toHaveBeenCalled();
    root.unmount();
  });
});

describe('Succession in-play run controls', () => {
  it('are absent on the title screen and present once a run begins', async () => {
    const { container, root } = await mount(<App session={undefined as never} />);
    expect(byId(container, 'succession-restart-run')).toBeNull();
    await click(beginButton(container) ?? null);
    expect(byId(container, 'succession-restart-run')).not.toBeNull();
    expect(byId(container, 'succession-back-to-title')).not.toBeNull();
    root.unmount();
  });

  it('Restart run keeps the player in play, Back to title returns to the title screen', async () => {
    const { container, root } = await mount(<App session={undefined as never} />);
    await click(beginButton(container) ?? null);

    await click(byId(container, 'succession-restart-run'));
    await click(byId(container, 'succession-restart-run'));
    expect(byId(container, 'succession-restart-run')).not.toBeNull();
    expect(beginButton(container)).toBeUndefined();

    await click(byId(container, 'succession-back-to-title'));
    await click(byId(container, 'succession-back-to-title'));
    expect(byId(container, 'succession-restart-run')).toBeNull();
    expect(beginButton(container)).toBeDefined();
    root.unmount();
  });
});
