import { describe, it, expect, beforeEach } from 'vitest';
import { getGameId, navigateTo, navigateHome } from '../src/arcade/routing';

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
