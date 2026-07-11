import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { GAME_REGISTRY, findGame } from '../src/games/registry';
import { loadGame } from '../src/engine/runtime';
import { chimeraWildsConfig } from '../src/games/chimera_wilds/config';
import App from '../src/games/chimera_wilds/App';
import { scrapcrawlConfig } from '../src/games/scrapcrawl/config';
import ScrapCrawlApp from '../src/games/scrapcrawl/App';
import brewfieldConfig from '../src/games/brewfield/config';
import BrewfieldApp from '../src/games/brewfield/App';
import GameSelector from '../src/arcade/GameSelector';
import * as routing from '../src/arcade/routing';

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

  it('test_brewfield_in_registry', () => {
    const config = findGame('brewfield');
    expect(config).toBeDefined();
    expect(config?.gameId).toBe('brewfield');
    expect(config?.status).toBe('stable');
  });

  it('test_scrapcrawl_config_lazy_loads_app', () => {
    expect(scrapcrawlConfig.component).toBeDefined();
    expect(scrapcrawlConfig.gameId).toBe('scrapcrawl');
  });

  it('test_brewfield_config_lazy_loads_app', () => {
    expect(brewfieldConfig.component).toBeDefined();
    expect(brewfieldConfig.gameId).toBe('brewfield');
    expect(brewfieldConfig.embedUrl).toBeUndefined();
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

  it('test_brewfield_app_renders_without_crash', async () => {
    const session = loadGame('brewfield');
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(BrewfieldApp, { session }));
    });

    expect(container.textContent).toContain('BREWFIELD');
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

describe('GameSelector runtime detail', () => {
  async function renderSelector() {
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(GameSelector));
    });
    return { container, root };
  }

  it('shows PyGame renderer and race class count for horse_racing', async () => {
    const { container, root } = await renderSelector();
    const text = container.textContent ?? '';
    expect(text).toContain('PyGame renderer');
    expect(text).toContain('race classes');
    root.unmount();
  });

  it('shows PyGame renderer and evolution card count for slither_rogue', async () => {
    const { container, root } = await renderSelector();
    const text = container.textContent ?? '';
    expect(text).toContain('PyGame renderer');
    expect(text).toContain('evolution cards');
    root.unmount();
  });

  it('shows real part and opponent counts for mutant_battle_ball', async () => {
    const { container, root } = await renderSelector();
    const text = container.textContent ?? '';
    expect(text).toContain('mutant parts');
    expect(text).toContain('opponents');
    root.unmount();
  });

  it('shows real round and chip card counts for slime_coin', async () => {
    const { container, root } = await renderSelector();
    const text = container.textContent ?? '';
    expect(text).toContain('rounds');
    expect(text).toContain('chip cards');
    root.unmount();
  });

  it('shows real part and body slot counts for chimera_wilds', async () => {
    const { container, root } = await renderSelector();
    const text = container.textContent ?? '';
    expect(text).toContain('mutant parts');
    expect(text).toContain('body slots');
    root.unmount();
  });

  it('shows real room and craftable counts for scrapcrawl', async () => {
    const { container, root } = await renderSelector();
    const text = container.textContent ?? '';
    expect(text).toContain('5 rooms');
    expect(text).toContain('4 craftables');
    root.unmount();
  });
});

describe('VoidDrift external entry', () => {
  it('test_voiddrift_registry_entry_present', () => {
    const cfg = findGame('voiddrift');
    expect(cfg).toBeDefined();
    expect(cfg!.externalUrl).toBe('https://rdug627.itch.io/voidrift');
    expect(cfg!.status).toBe('external');
    expect(cfg!.component).toBeUndefined();
  });

  it('test_game_selector_embed_click_navigates_inline', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const navSpy = vi.spyOn(routing, 'navigateTo').mockImplementation(() => {});

    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(GameSelector));
    });

    const cards = Array.from(container.querySelectorAll('.arcade-card'));
    const voiddriftCard = cards.find(c => c.textContent?.includes('VoidRift')) as HTMLButtonElement | undefined;
    expect(voiddriftCard).toBeDefined();

    await act(async () => {
      voiddriftCard!.click();
    });

    // embedUrl takes priority — navigates inline, does NOT open new tab
    expect(navSpy).toHaveBeenCalledWith('voiddrift');
    expect(openSpy).not.toHaveBeenCalled();

    openSpy.mockRestore();
    navSpy.mockRestore();
    root.unmount();
  });

  it('test_game_selector_internal_click_unchanged', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const navSpy = vi.spyOn(routing, 'navigateTo').mockImplementation(() => {});

    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(GameSelector));
    });

    const cards = Array.from(container.querySelectorAll('.arcade-card'));
    const hrCard = cards.find(c => c.textContent?.includes('Derby Sim')) as HTMLButtonElement | undefined;
    expect(hrCard).toBeDefined();

    await act(async () => {
      hrCard!.click();
    });

    expect(navSpy).toHaveBeenCalledWith('horse_racing');
    expect(openSpy).not.toHaveBeenCalled();

    openSpy.mockRestore();
    navSpy.mockRestore();
    root.unmount();
  });

  it('test_external_card_shows_itch_detail', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(GameSelector));
    });
    const text = container.textContent ?? '';
    expect(text).toContain('Rust/Bevy');
    expect(text).toContain('itch.io');
    root.unmount();
  });
});
