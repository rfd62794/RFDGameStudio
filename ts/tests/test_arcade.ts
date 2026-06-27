import { describe, it, expect } from 'vitest';
import { GAME_REGISTRY } from '../src/games/registry';

describe('Arcade Registry', () => {
  it('test_all_games_have_color', () => {
    for (const config of GAME_REGISTRY) {
      expect(config.color).toBeDefined();
      expect(config.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('test_all_games_have_description', () => {
    for (const config of GAME_REGISTRY) {
      expect(config.description).toBeDefined();
      expect(config.description!.length).toBeGreaterThan(10);
    }
  });
});
