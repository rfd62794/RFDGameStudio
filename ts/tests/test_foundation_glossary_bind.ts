import { describe, expect, it } from 'vitest';
import { resolveBind } from '../src/foundation/glossary/bind';
import { fillTemplate } from '../src/foundation/glossary/template';

const state = {
  playerHp: 30,
  enemy: { hp: 12, residues: [{ tag: 'soaked', level: 1 }, { tag: 'burning', level: 2, turnsLeft: 3 }] },
  residue: { marks: [{ element: 'ember', level: 2 }] },
};

describe('resolveBind', () => {
  it('resolves_a_dot_path', () => {
    expect(resolveBind(state, 'enemy.hp')).toBe(12);
    expect(resolveBind(state, 'playerHp')).toBe(30);
  });
  it('selects_a_list_item_by_key', () => {
    expect(resolveBind(state, 'enemy.residues[tag=burning]')).toEqual({ tag: 'burning', level: 2, turnsLeft: 3 });
    expect(resolveBind(state, 'enemy.residues[tag=burning].level')).toBe(2);
  });
  it('numeric_selector_values_compare_as_strings', () => {
    expect(resolveBind(state, 'enemy.residues[level=1].tag')).toBe('soaked');
  });
  it('missing_item_is_undefined', () => {
    expect(resolveBind(state, 'enemy.residues[tag=windswept]')).toBeUndefined();
  });
  it('selector_on_non_array_is_undefined', () => {
    expect(resolveBind(state, 'enemy[tag=x]')).toBeUndefined();
  });
  it('null_mid_path_is_undefined', () => {
    expect(resolveBind({ enemy: null }, 'enemy.hp')).toBeUndefined();
    expect(resolveBind(undefined, 'a.b')).toBeUndefined();
  });
  it('malformed_path_is_undefined', () => {
    expect(resolveBind(state, 'enemy.residues[tag]')).toBeUndefined();
    expect(resolveBind(state, '')).toBeUndefined();
  });
});

describe('fillTemplate', () => {
  it('fills_named_values', () => {
    expect(fillTemplate('Takes {level} for {turnsLeft} turns.', { level: 2, turnsLeft: 3 })).toBe('Takes 2 for 3 turns.');
  });
  it('missing_value_renders_question_mark', () => {
    expect(fillTemplate('Takes {level}.', {})).toBe('Takes ?.');
    expect(fillTemplate('Takes {level}.', { level: null })).toBe('Takes ?.');
  });
  it('leaves_text_without_placeholders_alone', () => {
    expect(fillTemplate('No braces here', { a: 1 })).toBe('No braces here');
  });
});
