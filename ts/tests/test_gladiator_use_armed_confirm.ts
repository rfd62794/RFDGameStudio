// new: ts/tests/test_gladiator_use_armed_confirm.ts
//
// Behavioural tests for useArmedConfirm — the two-step confirm behind the
// Gladiator Arena New Game button. No pragma: the repo default environment
// is jsdom (ts/vite.config.ts). Mounted via the repo's createRoot + act
// pattern (see test_choke_point_restart.ts); all timers are vitest fakes.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { useArmedConfirm } from '../src/games/gladiator_arena/utils/useArmedConfirm';

type Handle = { armed: boolean; trigger: () => void };

function mount(onConfirm: () => void, ms?: number) {
  const handle: { current: Handle | null } = { current: null };
  function Probe() {
    handle.current = useArmedConfirm(onConfirm, ms);
    return null;
  }
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => { root.render(React.createElement(Probe)); });
  return { handle, unmount: () => act(() => { root.unmount(); }) };
}

describe('useArmedConfirm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts disarmed and does not call onConfirm', () => {
    const onConfirm = vi.fn();
    const { handle } = mount(onConfirm);
    expect(handle.current?.armed).toBe(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('first trigger arms without calling onConfirm', () => {
    const onConfirm = vi.fn();
    const { handle } = mount(onConfirm);
    act(() => {
      handle.current?.trigger();
    });
    expect(handle.current?.armed).toBe(true);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('second trigger inside the window confirms once and clears the pending timeout', () => {
    const onConfirm = vi.fn();
    const { handle } = mount(onConfirm, 3000);
    act(() => {
      handle.current?.trigger();
    });
    act(() => {
      handle.current?.trigger();
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(handle.current?.armed).toBe(false);
    // The arm timer was cleared by the confirming trigger, so advancing past
    // the window must not fire anything further.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(handle.current?.armed).toBe(false);
  });

  it('timeout disarms: armed at ms - 1, disarmed at ms, onConfirm never called', () => {
    const onConfirm = vi.fn();
    const { handle } = mount(onConfirm, 3000);
    act(() => {
      handle.current?.trigger();
    });
    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(handle.current?.armed).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(handle.current?.armed).toBe(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('after a timeout, the next trigger arms again rather than confirming', () => {
    const onConfirm = vi.fn();
    const { handle } = mount(onConfirm, 3000);
    act(() => {
      handle.current?.trigger();
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(handle.current?.armed).toBe(false);
    act(() => {
      handle.current?.trigger();
    });
    expect(handle.current?.armed).toBe(true);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('default window is 3000 ms when ms is omitted', () => {
    const onConfirm = vi.fn();
    const { handle } = mount(onConfirm);
    act(() => {
      handle.current?.trigger();
    });
    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(handle.current?.armed).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(handle.current?.armed).toBe(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('unmount while armed clears the timer', () => {
    const onConfirm = vi.fn();
    const { handle, unmount } = mount(onConfirm, 3000);
    act(() => {
      handle.current?.trigger();
    });
    expect(handle.current?.armed).toBe(true);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
