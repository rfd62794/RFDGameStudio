// new: Phase 1 D1.1, the glob registry.
import { describe, it, expect } from 'vitest';
import type { GameConfig } from '../src/engine/types';
import { collectConfigs } from '../src/games/collectConfigs';
import { GAME_REGISTRY } from '../src/games/registry';

const cfg = (gameId: string, order?: number): GameConfig => ({ gameId, label: gameId, order });

describe('collectConfigs', () => {
  it('sorts by order, then gameId', () => {
    const list = collectConfigs({
      './b/config.ts': { default: cfg('b', 20) },
      './a/config.ts': { default: cfg('a', 20) },
      './c/config.ts': { default: cfg('c', 10) },
    });
    expect(list.map(g => g.gameId)).toEqual(['c', 'a', 'b']);
  });

  it('fails loudly on a missing default export', () => {
    expect(() => collectConfigs({ './x/config.ts': {} })).toThrow('./x/config.ts: config has no default export');
  });

  it('fails loudly on a duplicate gameId', () => {
    expect(() => collectConfigs({
      './a/config.ts': { default: cfg('same', 10) },
      './b/config.ts': { default: cfg('same', 20) },
    })).toThrow("duplicate gameId 'same'");
  });

  it('fails loudly on a missing order', () => {
    expect(() => collectConfigs({ './a/config.ts': { default: cfg('a') } })).toThrow("'a' has no numeric order");
  });
});

describe('GAME_REGISTRY (glob)', () => {
  it('keeps exactly the order the hand-written array had on 2026-10-04', () => {
    expect(GAME_REGISTRY.map(g => g.gameId)).toEqual([
      'dissonance', 'slimeworld', 'shoal', 'voiddrift', 'horse_racing', 'slither_rogue', 'mutant_battle_ball',
      'slime_coin', 'chimera_wilds', 'scrapcrawl', 'wire_rust', 'choke_point', 'bpo_sim', 'ledger',
      'trinity_siege', '7_days_to_fry', 'antsim_redux', 'facility_escape', 'systemic_extract', 'coin_pusher_arcade',
      'factory_idle', 'planetofgreed', 'planetforge', 'gladiator_arena', 'voiddrift_redux',
      'voidrift_particle_sandbox', 'succession', 'house_of_kings_collab', 'character_viewer', 'technique_showcase',
      'role_symbol_viewer', 'dissonance_prototype', 'slimegarden', 'slimebreeder', 'corpworld', 'kingmaker_squads',
    ]);
  });

  it('gives every game a unique numeric order', () => {
    const orders = GAME_REGISTRY.map(g => g.order);
    expect(orders.every(o => typeof o === 'number')).toBe(true);
    expect(new Set(orders).size).toBe(orders.length);
  });
});
