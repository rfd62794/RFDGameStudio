import { describe, it, expect, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { GameShell } from '../src/components/GameShell';
import * as routing from '../src/arcade/routing';

describe('GameShell', () => {
  it('renders the gameLabel and gameId in the marquee header', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(<GameShell gameLabel="SCRAPCRAWL" gameId="scrapcrawl"><div>content</div></GameShell>);
    });
    const text = container.textContent ?? '';
    expect(text).toContain('SCRAPCRAWL');
    expect(text).toContain('scrapcrawl');
    expect(text).toContain('content');
    root.unmount();
  });

  it('renders the phase badge when provided', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(<GameShell gameLabel="SCRAPCRAWL" gameId="scrapcrawl" phase="PHASE A.1"><div /></GameShell>);
    });
    expect(container.textContent).toContain('PHASE A.1');
    root.unmount();
  });

  it('renders the statusArea slot', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <GameShell gameLabel="SCRAPCRAWL" gameId="scrapcrawl" statusArea={<span>Scrap: 12</span>}>
          <div />
        </GameShell>
      );
    });
    expect(container.textContent).toContain('Scrap: 12');
    root.unmount();
  });

  it('renders the footer slot', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <GameShell gameLabel="SCRAPCRAWL" gameId="scrapcrawl" footer={<span>footer note</span>}>
          <div />
        </GameShell>
      );
    });
    expect(container.textContent).toContain('footer note');
    root.unmount();
  });

  it('navigates home when the back button is clicked', async () => {
    const navigateHome = vi.spyOn(routing, 'navigateHome').mockImplementation(() => undefined);
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(<GameShell gameLabel="SCRAPCRAWL" gameId="scrapcrawl"><div /></GameShell>);
    });
    const backButton = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Arcade'));
    expect(backButton).toBeTruthy();
    await act(async () => {
      backButton!.click();
    });
    expect(navigateHome).toHaveBeenCalled();
    navigateHome.mockRestore();
    root.unmount();
  });

  it('uses the display font class for the title', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(<GameShell gameLabel="SCRAPCRAWL" gameId="scrapcrawl"><div /></GameShell>);
    });
    const title = container.querySelector('.game-shell-title');
    expect(title).toBeTruthy();
    root.unmount();
  });
});
