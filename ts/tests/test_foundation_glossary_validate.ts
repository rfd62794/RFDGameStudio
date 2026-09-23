import { describe, expect, it } from 'vitest';
import { parseGlossary } from '../src/foundation/glossary/validate';

const GOOD = `
version: 1
entries:
  hp:
    kind: stat
    label: HP
    tone: heal
    bind: player.hp
    max: player.maxHp
  burning:
    kind: status
    label: Burning
    icon: flame
    tone: ember
    text: "Takes {level} damage for {turnsLeft} turns."
    bind: enemy.residues[tag=burning]
    fields: { level: number, turnsLeft: turns }
  dodge:
    kind: event
    label: Dodged
    tone: spark
    text: "{target} dodged for {amount}."
`;

describe('parseGlossary', () => {
  it('parses_a_valid_glossary', () => {
    const r = parseGlossary(GOOD);
    expect(r.issues).toEqual([]);
    expect(r.glossary?.version).toBe(1);
    expect(Object.keys(r.glossary!.entries)).toEqual(['hp', 'burning', 'dodge']);
    expect(r.glossary!.entries.burning.id).toBe('burning');
    expect(r.glossary!.entries.burning.fields).toEqual({ level: 'number', turnsLeft: 'turns' });
  });

  it('absent_tone_defaults_to_neutral', () => {
    const r = parseGlossary('version: 1\nentries:\n  gold:\n    kind: resource\n    label: Gold\n    bind: gold\n');
    expect(r.glossary!.entries.gold.tone).toBe('neutral');
  });

  it('yaml_error_is_an_issue', () => {
    const r = parseGlossary('version: 1\nentries:\n  a: [unclosed\n');
    expect(r.glossary).toBeNull();
    expect(r.issues[0].entry).toBeNull();
    expect(r.issues[0].message).toMatch(/yaml/i);
  });

  it('duplicate_key_is_an_issue', () => {
    const r = parseGlossary('version: 1\nversion: 1\nentries: {}\n');
    expect(r.glossary).toBeNull();
    expect(r.issues.length).toBe(1);
  });

  it('unknown_version_fails_closed', () => {
    const r = parseGlossary('version: 2\nentries: {}\n');
    expect(r.glossary).toBeNull();
    expect(r.issues[0].message).toMatch(/version/);
  });

  it('non_mapping_entries_fails_closed', () => {
    const r = parseGlossary('version: 1\nentries: [1, 2]\n');
    expect(r.glossary).toBeNull();
  });

  it('bad_entry_is_skipped_and_reported', () => {
    const r = parseGlossary(`
version: 1
entries:
  ok: { kind: stat, label: OK, bind: a }
  badkind: { kind: potion, label: X, bind: a }
  nolabel: { kind: stat, bind: a }
  badtone: { kind: stat, label: X, tone: purple, bind: a }
  nobind: { kind: status, label: X }
  badfield: { kind: status, label: X, bind: a, fields: { n: float } }
  undeclared: { kind: status, label: X, bind: a, text: "{level} left" }
`);
    expect(Object.keys(r.glossary!.entries)).toEqual(['ok']);
    expect(r.issues.map(i => i.entry)).toEqual(['badkind', 'nolabel', 'badtone', 'nobind', 'badfield', 'undeclared']);
  });

  it('event_and_card_field_need_no_bind_and_events_may_use_any_placeholder', () => {
    const r = parseGlossary(`
version: 1
entries:
  hit: { kind: event, label: Hit, text: "{target} took {amount}" }
  cost: { kind: card_field, label: Cost }
`);
    expect(r.issues).toEqual([]);
  });

  it('juice_must_be_a_mapping_when_present', () => {
    const r = parseGlossary('version: 1\nentries:\n  hp: { kind: stat, label: HP, bind: a, juice: hurt }\n');
    expect(r.issues[0].entry).toBe('hp');
  });
});
