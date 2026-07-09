import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { getGameId, navigateTo, navigateHome } from '../src/arcade/routing';
import { GameSelector, GameLoader } from '../src/arcade';
import { GAME_REGISTRY } from '../src/games/registry';

describe('Arcade routing', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/arcade/rfdgamestudio/');
  });

  it('test_navigate_to_respects_current_path', () => {
    window.history.pushState({}, '', '/arcade/rfdgamestudio/');
    navigateTo('slime_coin');
    expect(window.location.href).toContain('/arcade/rfdgamestudio/');
    expect(window.location.href).not.toBe('http://localhost:3000/?game=slime_coin');
  });

  it('test_navigate_to_sets_game_query_param', () => {
    navigateTo('scrapcrawl');
    expect(window.location.search).toContain('?game=scrapcrawl');
  });

  it('test_get_game_id_returns_null_when_absent', () => {
    window.history.pushState({}, '', '/arcade/rfdgamestudio/');
    expect(getGameId()).toBeNull();
  });

  it('test_get_game_id_parses_present_param', () => {
    window.history.pushState({}, '', '/arcade/rfdgamestudio/?game=mutant_battle_ball');
    expect(getGameId()).toBe('mutant_battle_ball');
  });

  describe('navigateHome', () => {
    beforeEach(() => {
      window.history.pushState({}, '', '/arcade/rfdgamestudio/?game=horse_racing');
    });

    it('navigates to the current pathname, not domain root', () => {
      navigateHome();
      expect(window.location.href).toContain('/arcade/rfdgamestudio/');
      expect(window.location.href).not.toBe('http://localhost:3000/');
    });

    it('does not hardcode a root-relative path', () => {
      window.history.pushState({}, '', '/some/other/base/');
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
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(GameSelector));
    });
    const firstCard = container.querySelector('.arcade-card') as HTMLButtonElement | null;
    expect(firstCard).toBeTruthy();
    await act(async () => {
      firstCard!.click();
    });
    expect(window.location.search).toContain(`?game=${GAME_REGISTRY[0]!.gameId}`);
    root.unmount();
  });
});

describe('Arcade GameLoader', () => {
  it('test_game_loader_back_button_returns_clean_url', async () => {
    window.history.pushState({}, '', '/arcade/rfdgamestudio/?game=horse_racing');
    const container = document.createElement('div');
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
      backButton!.click();
    });
    expect(window.location.search).toBe('');
    expect(window.location.pathname).toBe('/arcade/rfdgamestudio/');
    root.unmount();
  });
});
