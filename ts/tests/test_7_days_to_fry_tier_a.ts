// @vitest-environment node
// new: ts/tests/test_7_days_to_fry_tier_a.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import config from '../src/games/7_days_to_fry/config';

const read = (rel: string) => readFileSync(new URL(`../../examples/7-days-to-fry/src/${rel}`, import.meta.url), 'utf8');

describe('test_7_days_to_fry_tier_a', () => {
  it('has gameId 7_days_to_fry and a genre from the curated list', () => {
    expect(config.gameId).toBe('7_days_to_fry');
    expect(config.genre).toBe('management-sim');
  });

  it('has an honest description of 60 words or fewer', () => {
    const description = config.description ?? '';
    expect(description.trim().split(/\s+/).length).toBeLessThanOrEqual(60);
    for (const marker of ['LEAST-VERIFIED', 'fabricated', 'TODO', 'TBD']) {
      expect(description).not.toContain(marker);
    }
    expect(description.toLowerCase()).not.toContain('survival game');
    expect(description).toContain('seven days');
  });

  it('tags describe the game, not the old survival label', () => {
    expect(config.tags).toEqual(['kitchen', 'crew-management']);
  });

  it('a labelled Restart week control is reachable on the intro, night and day screens', () => {
    const button = read('components/RestartButton.tsx');
    expect(button).toContain('Restart week');
    expect(button).toContain('Click again to restart the week');
    expect(read('components/IntroScreen.tsx')).toContain('<RestartButton onRestart={onRestart} />');
    expect(read('components/NightScreen.tsx')).toContain('<RestartButton onRestart={onRestart} />');
    expect(read('components/ControlPanel.tsx')).toContain('<RestartButton onRestart={onResetSession} />');
  });

  it('Restart week returns to the first screen', () => {
    const app = read('App.tsx');
    expect(app).toContain('onRestart={handleRestartGame}');
    expect(app).toContain('onResetSession={handleRestartGame}');
    expect(app).toContain("setScreen('new_game');");
  });
});
