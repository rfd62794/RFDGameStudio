import { describe, it, expect } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { GAME_REGISTRY, findGame } from '../src/games/registry';
import { loadGame } from '../src/engine/runtime';
import { chimeraWildsConfig } from '../src/games/chimera_wilds/config';
import App from '../src/games/chimera_wilds/App';
import { scrapcrawlConfig } from '../src/games/scrapcrawl/config';
import ScrapCrawlApp from '../src/games/scrapcrawl/App';

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

  it('test_mutant_battle_ball_in_registry', () => {
    const config = findGame('mutant_battle_ball');
    expect(config).toBeDefined();
    expect(config?.gameId).toBe('mutant_battle_ball');
  });

  it('test_mutant_battle_ball_has_red_color', () => {
    const config = findGame('mutant_battle_ball');
    expect(config?.color).toBe('#f87171');
  });

  it('test_slime_coin_in_registry', () => {
    const config = findGame('slime_coin');
    expect(config).toBeDefined();
    expect(config?.gameId).toBe('slime_coin');
  });

  it('test_slime_coin_has_purple_color', () => {
    const config = findGame('slime_coin');
    expect(config?.color).toBe('#a855f7');
  });

  it('test_chimera_wilds_in_registry', () => {
    const config = findGame('chimera_wilds');
    expect(config).toBeDefined();
    expect(config?.gameId).toBe('chimera_wilds');
  });

  it('test_chimera_wilds_config_lazy_loads_app', () => {
    expect(chimeraWildsConfig.component).toBeDefined();
    expect(chimeraWildsConfig.gameId).toBe('chimera_wilds');
  });

  it('test_chimera_wilds_app_renders_without_crash', async () => {
    const session = loadGame('chimera_wilds');
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(App, { session }));
    });

    expect(container.textContent).toContain('CHIMERA WILDS');
    root.unmount();
  });

  it('test_encounter_button_triggers_lua_call', async () => {
    const session = loadGame('chimera_wilds');
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(App, { session }));
    });

    const buttons = container.querySelectorAll('button');
    const encounterButton = Array.from(buttons).find(b => b.textContent?.includes('Face the Wilds'));
    expect(encounterButton).toBeTruthy();

    await act(async () => {
      encounterButton!.click();
    });

    const text = container.textContent ?? '';
    expect(text.includes('WIN') || text.includes('LOSS')).toBe(true);
    root.unmount();
  });

  it('test_scrapcrawl_in_registry', () => {
    const config = findGame('scrapcrawl');
    expect(config).toBeDefined();
    expect(config?.gameId).toBe('scrapcrawl');
  });

  it('test_scrapcrawl_config_lazy_loads_app', () => {
    expect(scrapcrawlConfig.component).toBeDefined();
    expect(scrapcrawlConfig.gameId).toBe('scrapcrawl');
  });

  it('test_scrapcrawl_app_renders_without_crash', async () => {
    const session = loadGame('scrapcrawl');
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(ScrapCrawlApp, { session }));
    });

    expect(container.textContent).toContain('SCRAPCRAWL');
    root.unmount();
  });

  it('test_scrapcrawl_fight_button_triggers_lua_call', async () => {
    const session = loadGame('scrapcrawl');
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(ScrapCrawlApp, { session }));
    });

    // Move from Home Base to a fight room first.
    const moveButton = container.querySelector('.sc-connection') as HTMLButtonElement | null;
    expect(moveButton).toBeTruthy();

    await act(async () => {
      moveButton!.click();
    });

    const fightButton = container.querySelector('.sc-fight-button') as HTMLButtonElement | null;
    expect(fightButton).toBeTruthy();
    expect(fightButton!.disabled).toBe(false);

    await act(async () => {
      fightButton!.click();
    });

    const text = container.textContent ?? '';
    expect(text.includes('WIN') || text.includes('LOSS')).toBe(true);
    root.unmount();
  });

  it('test_fight_button_disabled_at_home_base', async () => {
    const session = loadGame('scrapcrawl');
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(ScrapCrawlApp, { session }));
    });

    const fightButton = container.querySelector('.sc-fight-button') as HTMLButtonElement | null;
    expect(fightButton).toBeTruthy();
    expect(fightButton!.disabled).toBe(true);
    root.unmount();
  });

  it('test_fight_button_enabled_in_fight_room', async () => {
    const session = loadGame('scrapcrawl');
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(ScrapCrawlApp, { session }));
    });

    const moveButton = container.querySelector('.sc-connection') as HTMLButtonElement | null;
    expect(moveButton).toBeTruthy();

    await act(async () => {
      moveButton!.click();
    });

    const fightButton = container.querySelector('.sc-fight-button') as HTMLButtonElement | null;
    expect(fightButton).toBeTruthy();
    expect(fightButton!.disabled).toBe(false);
    root.unmount();
  });

  it('test_scrapcrawl_craft_reduces_scrap_in_ts_runtime', () => {
    const session = loadGame('scrapcrawl', 42);
    const data = session.files.data;
    const player = session.executor.call('init_player') as Record<string, unknown>;
    player.scrap = 10;
    const home = session.executor.call('get_room', data, 'home_base') as Record<string, unknown>;
    const next = session.executor.call('craft', data, player, home, 'beatStick', 1) as Record<string, unknown>;
    expect(next.scrap).toBe(0);
    expect((next.equipped as Record<string, unknown>).weapon).toBeDefined();
  });

  it('test_craft_buttons_disabled_in_non_craft_room', async () => {
    const session = loadGame('scrapcrawl', 42);
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(ScrapCrawlApp, { session }));
    });

    const moveButton = container.querySelector('.sc-connection') as HTMLButtonElement | null;
    expect(moveButton).toBeTruthy();

    await act(async () => {
      moveButton!.click();
    });

    const craftButtons = container.querySelectorAll('.sc-craft-button');
    expect(craftButtons.length).toBeGreaterThan(0);
    craftButtons.forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
      expect((btn as HTMLButtonElement).title).toBe('No workbench detected in this node');
    });
    root.unmount();
  });

  it('test_craft_buttons_show_workbench_at_home_base', async () => {
    const session = loadGame('scrapcrawl', 42);
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(ScrapCrawlApp, { session }));
    });

    const craftButtons = container.querySelectorAll('.sc-craft-button');
    expect(craftButtons.length).toBeGreaterThan(0);
    craftButtons.forEach((btn) => {
      expect((btn as HTMLButtonElement).title).toBe('Craft at Home Base workbench');
    });
    root.unmount();
  });
});
