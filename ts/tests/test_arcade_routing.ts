import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { getGameId, navigateTo, navigateHome } from '../src/arcade/routing';
import { GameSelector, GameLoader } from '../src/arcade';
import { GAME_REGISTRY } from '../src/games/registry';

class FakeLocation {
  href = 'http://localhost:3000/arcade/rfdgamestudio/';

  get search(): string {
    const idx = this.href.indexOf('?');
    return idx === -1 ? '' : this.href.slice(idx);
  }

  get pathname(): string {
    return new URL(this.href).pathname;
  }
}

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).location = new FakeLocation();
});

describe('Arcade routing', () => {
  it('test_navigate_to_respects_current_path', () => {
    navigateTo('slime_coin');
    expect(window.location.href).toBe('http://localhost:3000/arcade/rfdgamestudio/?game=slime_coin');
  });

  it('test_navigate_to_sets_game_query_param', () => {
    navigateTo('scrapcrawl');
    expect(window.location.search).toContain('?game=scrapcrawl');
  });

  it('test_get_game_id_returns_null_when_absent', () => {
    expect(getGameId()).toBeNull();
  });

  it('test_get_game_id_parses_present_param', () => {
    window.location.href = 'http://localhost:3000/arcade/rfdgamestudio/?game=mutant_battle_ball';
    expect(getGameId()).toBe('mutant_battle_ball');
  });

  describe('navigateHome', () => {
    it('navigates to the current pathname, not domain root', () => {
      window.location.href = 'http://localhost:3000/arcade/rfdgamestudio/?game=horse_racing';
      navigateHome();
      expect(window.location.href).toBe('http://localhost:3000/arcade/rfdgamestudio/');
      expect(window.location.href).not.toBe('http://localhost:3000/');
    });

    it('does not hardcode a root-relative path', () => {
      window.location.href = 'http://localhost:3000/some/other/base/?game=horse_racing';
      navigateHome();
      expect(window.location.pathname).toBe('/some/other/base/');
    });
  });
});

describe('Arcade GameSelector', () => {
  it('test_game_selector_renders_all_registry_entries', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(GameSelector));
    });
    const cards = container.querySelectorAll('.arcade-card');
    expect(cards.length).toBe(GAME_REGISTRY.length);
    GAME_REGISTRY.forEach((config, i) => {
      expect(cards[i]!.textContent).toContain(config.label);
      expect(cards[i]!.textContent).toContain(config.gameId);
    });
    root.unmount();
  });

  it('test_game_selector_card_click_navigates', async () => {
    window.history.pushState({}, '', '/arcade/rfdgamestudio/');
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(GameSelector));
    });
    const firstCard = container.querySelector('.arcade-card') as HTMLButtonElement | null;
    expect(firstCard).toBeTruthy();
    await act(async () => {
      firstCard!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(window.location.href).toContain(`?game=${GAME_REGISTRY[0]!.gameId}`);
    document.body.removeChild(container);
    root.unmount();
  });
});

describe('Arcade GameLoader', () => {
  it('test_game_loader_back_button_returns_clean_url', async () => {
    window.history.pushState({}, '', '/arcade/rfdgamestudio/?game=horse_racing');
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(GameLoader, { gameId: 'horse_racing' }));
    });
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
    const backButton = container.querySelector('.arcade-back-btn') as HTMLButtonElement | null;
    expect(backButton).toBeTruthy();
    await act(async () => {
      backButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(window.location.href).not.toContain('?game=');
    expect(window.location.href).toContain('/arcade/rfdgamestudio/');
    document.body.removeChild(container);
    root.unmount();
  });
});
