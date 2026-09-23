import { describe, expect, it } from 'vitest';
import { getGlossary, resolveBind } from '../src/foundation/glossary';

const inCombat = {
  playerHp: 28, playerMaxHp: 40, playerShield: 5, essence: 12,
  enemy: { name: 'Husk', hp: 9, maxHp: 20, dot: { duration: 2, damage: 3 } },
  residue: { marks: [{ element: 'ember', level: 2 }], fortifiedCharges: 0 },
};

describe('dissonance glossary', () => {
  const g = getGlossary('dissonance')!.glossary!;

  it('loads_without_issues', () => {
    expect(getGlossary('dissonance')!.issues).toEqual([]);
  });

  it('core_stats_resolve_in_combat', () => {
    expect(resolveBind(inCombat, g.entries.player_hp.bind!)).toBe(28);
    expect(resolveBind(inCombat, g.entries.player_hp.max!)).toBe(40);
    expect(resolveBind(inCombat, g.entries.enemy_hp.bind!)).toBe(9);
    expect(resolveBind(inCombat, g.entries.enemy_dot.bind!)).toEqual({ duration: 2, damage: 3 });
    expect(resolveBind(inCombat, g.entries.ember_mark.bind!)).toEqual({ element: 'ember', level: 2 });
  });

  it('enemy_entries_are_undefined_outside_combat', () => {
    const outOfCombat = { ...inCombat, enemy: null };
    expect(resolveBind(outOfCombat, g.entries.enemy_hp.bind!)).toBeUndefined();
  });

  it('declares_the_four_brewfield_events', () => {
    for (const id of ['dodge', 'retaliate', 'detonate', 'cauterize']) expect(g.entries[id]?.kind).toBe('event');
  });
});
