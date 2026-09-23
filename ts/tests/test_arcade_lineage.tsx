import { describe, it, expect } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { GAME_REGISTRY } from '../src/games/registry';
import { GameSelector } from '../src/arcade';

const ORIGINS: Record<string, string> = {
  slimegarden: 'slimeworld',
  slimebreeder: 'slimeworld',
  corpworld: 'planetofgreed',
  kingmaker_squads: 'planetofgreed',
  dissonance_prototype: 'dissonance',
};

describe('Arcade lineage', () => {
  it('no label carries the "(Origin)" suffix', () => {
    for (const g of GAME_REGISTRY) expect(g.label).not.toContain('(Origin)');
  });

  it('each Origin game points at its real successor', () => {
    const ids = new Set(GAME_REGISTRY.map(g => g.gameId));
    for (const [id, successor] of Object.entries(ORIGINS)) {
      const g = GAME_REGISTRY.find(x => x.gameId === id);
      expect(g?.supersededBy).toBe(successor);
      expect(ids.has(successor)).toBe(true);
    }
  });

  it('every supersededBy in the registry names a registered game', () => {
    const ids = new Set(GAME_REGISTRY.map(g => g.gameId));
    for (const g of GAME_REGISTRY) if (g.supersededBy) expect(ids.has(g.supersededBy)).toBe(true);
  });

  it('the studio app grid shows an Origin tag for superseded games only', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => { root.render(<GameSelector />); });
    expect(container.querySelector('[data-testid="arcade-card-origin-slimegarden"]')?.textContent).toBe('Origin');
    expect(container.querySelector('[data-testid="arcade-card-origin-slimeworld"]')).toBeNull();
    root.unmount();
  });
});
