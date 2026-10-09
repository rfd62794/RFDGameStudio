// NEW: tests for the shared ErrorBoundary fallback, see docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { ErrorBoundary } from '../src/ui/components/ErrorBoundary';
import { GameShell } from '../src/components/GameShell';
import { clearDiagnostics } from '../src/engine/diagnostics/diagnostics';

let bombArmed = true;
function Bomb() {
  if (bombArmed) throw new Error('test bomb');
  return <div>calm child</div>;
}

async function renderInto(element: ReactElement) {
  const container = document.createElement('div');
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return { container, root };
}

function buttonByText(container: HTMLElement, text: string) {
  return Array.from(container.querySelectorAll('button')).find((b) => b.textContent === text);
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React logs caught errors via console.error; expected here, silenced to keep output readable.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    bombArmed = true;
    clearDiagnostics();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the fallback instead of a blank screen when a child throws', async () => {
    const { container, root } = await renderInto(
      <ErrorBoundary gameId="testgame"><Bomb /></ErrorBoundary>
    );
    expect(container.textContent).toContain('Something went wrong');
    expect(container.textContent).not.toContain('calm child');
    root.unmount();
  });

  it('re-renders the child after Try again when it no longer throws', async () => {
    const { container, root } = await renderInto(
      <ErrorBoundary gameId="testgame"><Bomb /></ErrorBoundary>
    );
    expect(container.textContent).toContain('Something went wrong');
    bombArmed = false;
    const tryAgain = buttonByText(container, 'Try again');
    expect(tryAgain).toBeTruthy();
    await act(async () => {
      tryAgain!.click();
    });
    expect(container.textContent).toContain('calm child');
    expect(container.textContent).not.toContain('Something went wrong');
    root.unmount();
  });

  it('Copy diagnostics calls navigator.clipboard.writeText with a report containing the game id', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const { container, root } = await renderInto(
      <ErrorBoundary gameId="copygame"><Bomb /></ErrorBoundary>
    );
    const copyButton = buttonByText(container, 'Copy diagnostics');
    expect(copyButton).toBeTruthy();
    await act(async () => {
      copyButton!.click();
    });
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('copygame'));
    delete (navigator as { clipboard?: unknown }).clipboard;
    root.unmount();
  });

  it('a GameShell wrapping a throwing child still shows its marquee header', async () => {
    const { container, root } = await renderInto(
      <GameShell gameLabel="SCRAPCRAWL" gameId="scrapcrawl"><Bomb /></GameShell>
    );
    expect(container.textContent).toContain('SCRAPCRAWL');
    expect(container.querySelector('.game-shell-title')).toBeTruthy();
    expect(container.textContent).toContain('Something went wrong');
    root.unmount();
  });
});
