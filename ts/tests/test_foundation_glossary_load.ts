import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getGlossary, glossaryGameIds, ENTRY_KINDS, TONES, FIELD_FORMATS, GLOSSARY_VERSION } from '../src/foundation/glossary';

describe('glossary loader', () => {
  it('a_game_without_a_glossary_returns_null', () => {
    expect(getGlossary('no_such_game')).toBeNull();
  });

  it('every_bundled_glossary_is_valid', () => {
    for (const id of glossaryGameIds()) {
      const r = getGlossary(id)!;
      expect(r.issues, `${id}: ${JSON.stringify(r.issues)}`).toEqual([]);
      expect(r.glossary, id).not.toBeNull();
    }
  });

  it('returns_the_same_result_object_on_repeat_calls', () => {
    for (const id of glossaryGameIds()) expect(getGlossary(id)).toBe(getGlossary(id));
  });
});

describe('docs/glossary.schema.json mirrors schema.ts', () => {
  const schema = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../docs/glossary.schema.json'), 'utf8'));
  const entry = schema.$defs.entry.properties;
  it('version', () => expect(schema.properties.version.const).toBe(GLOSSARY_VERSION));
  it('kinds', () => expect(entry.kind.enum).toEqual([...ENTRY_KINDS]));
  it('tones', () => expect(entry.tone.enum).toEqual([...TONES]));
  it('field_formats', () => expect(entry.fields.additionalProperties.enum).toEqual([...FIELD_FORMATS]));
});
