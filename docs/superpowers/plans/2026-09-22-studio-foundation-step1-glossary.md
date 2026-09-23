# Studio Foundation Step 1: Glossary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every game can ship a `games/<id>/glossary.yaml` that says what its state means; the Studio parses, validates and resolves it, and Dissonance Depths has the first one.

**Architecture:** A new `ts/src/foundation/glossary/` module: pure parse/validate, a bind resolver (dot paths plus `[key=value]`), a `{field}` template filler, and a loader that bundles every `games/*/glossary.yaml` with `import.meta.glob`. A dev-only `GlossaryPanel` mounted by `GameShell` when the URL has `?glossary` is the visible proof. Nothing else in any game changes.

**Tech Stack:** TypeScript, React 18, Vite `import.meta.glob`, `js-yaml` (already a dependency), Vitest + jsdom (already configured in `ts/vite.config.ts`).

**Spec:** `docs/superpowers/specs/2026-09-22-studio-foundation-design.md` (sections 3, 4, 9 step 1, 10).

This plan is step 1 of 5. Steps 2-5 (overlay, juice, events, style) each get their own plan once the step before merges, because each consumes the interfaces this one produces.

## Global Constraints

- All TS commands run from `RFDGameStudio/ts`: `npx vitest run <file>`; full suite `npx vitest run`.
- Floor: the full suite has no new failures against `main` and no skipped or deleted tests. `main` currently has 6 failing files (`Failed to resolve import "../src/games/game-metadata.json"`, a gitignored generated file) and a flaky sports-sim test; those are baseline, not yours.
- Glossary `version` is exactly `1`; any other value fails closed (glossary ignored, issue reported).
- Entry kinds, exactly: `stat`, `status`, `effect`, `resource`, `card_field`, `event`.
- Tones, exactly: `ember`, `spark`, `ash`, `cinder`, `danger`, `heal`, `neutral`, `gold`. Absent tone means `neutral`.
- Field formats, exactly: `number`, `turns`, `percent`, `text`.
- Text templates substitute `{name}` only. No expressions.
- A bad glossary never throws out of the loader and never crashes a game.
- No new dependencies. No changes to any game's logic, `data.yaml`, `ui.yaml` or App.

## Review Focus

- A glossary with a YAML syntax error (or a duplicate key, which `js-yaml` rejects) must come back as an issue, not an exception - Task 1 test `yaml_error_is_an_issue`.
- A game with no glossary file must behave exactly as today: `getGlossary` returns `null` and `GameShell` renders nothing new - Task 3 and Task 5 tests.
- Binding into state that is `null` mid-path (Dissonance's `enemy` is `null` outside combat) must return `undefined`, never throw - Task 2 test `null_mid_path_is_undefined`.
- A `[key=value]` selector on something that is not an array, or with a numeric value (`[level=2]`), must behave predictably: non-array gives `undefined`, values compare as strings - Task 2 tests.
- A template placeholder with no value must render visibly (`?`), not vanish or print `undefined` - Task 2 test `missing_value_renders_question_mark`.

---

## File structure

| File | Responsibility |
|---|---|
| `ts/src/foundation/glossary/schema.ts` | The constants and types above; nothing else |
| `ts/src/foundation/glossary/validate.ts` | `parseGlossary(raw)`: YAML text to `LoadResult` |
| `ts/src/foundation/glossary/bind.ts` | `resolveBind(state, path)` |
| `ts/src/foundation/glossary/template.ts` | `fillTemplate(text, values)`, `placeholders(text)` |
| `ts/src/foundation/glossary/load.ts` | Bundles `games/*/glossary.yaml`; `getGlossary(gameId)`, `glossaryGameIds()` |
| `ts/src/foundation/glossary/index.ts` | Public exports |
| `ts/src/foundation/glossary/GlossaryPanel.tsx` | Dev panel listing entries and issues |
| `ts/src/components/GameShell.tsx` | Mounts `GlossaryPanel` when `?glossary` is present |
| `docs/glossary.schema.json` | JSON-schema mirror for non-TS tools |
| `games/dissonance/glossary.yaml` | First glossary |
| `ts/tests/test_foundation_glossary_*.ts(x)` | Tests, one file per task |

---

### Task 1: Schema types and `parseGlossary`

**Files:**
- Create: `ts/src/foundation/glossary/schema.ts`
- Create: `ts/src/foundation/glossary/validate.ts`
- Create: `ts/src/foundation/glossary/template.ts` (only `placeholders` is needed here; Task 2 adds `fillTemplate`)
- Test: `ts/tests/test_foundation_glossary_validate.ts`

**Interfaces:**
- Produces: `GLOSSARY_VERSION`, `ENTRY_KINDS`, `TONES`, `FIELD_FORMATS`, types `EntryKind`, `Tone`, `FieldFormat`, `GlossaryEntry`, `Glossary`, `GlossaryIssue`, `LoadResult`; `parseGlossary(raw: string): LoadResult`; `placeholders(text: string): string[]`.

- [ ] **Step 1: Write the failing test**

```ts
// ts/tests/test_foundation_glossary_validate.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/test_foundation_glossary_validate.ts`
Expected: FAIL - cannot resolve `../src/foundation/glossary/validate`.

- [ ] **Step 3: Write the implementation**

```ts
// ts/src/foundation/glossary/schema.ts
/** The glossary says what a game's state MEANS. See docs/superpowers/specs/2026-09-22-studio-foundation-design.md. */
export const GLOSSARY_VERSION = 1;
export const ENTRY_KINDS = ['stat', 'status', 'effect', 'resource', 'card_field', 'event'] as const;
export const TONES = ['ember', 'spark', 'ash', 'cinder', 'danger', 'heal', 'neutral', 'gold'] as const;
export const FIELD_FORMATS = ['number', 'turns', 'percent', 'text'] as const;
/** Kinds that describe something living in state, so they must say where (`bind`). */
export const BOUND_KINDS: readonly EntryKind[] = ['stat', 'status', 'effect', 'resource'];

export type EntryKind = (typeof ENTRY_KINDS)[number];
export type Tone = (typeof TONES)[number];
export type FieldFormat = (typeof FIELD_FORMATS)[number];

export interface GlossaryEntry {
  id: string;
  kind: EntryKind;
  label: string;
  icon?: string;
  tone: Tone;
  text?: string;
  bind?: string;
  max?: string;
  fields?: Record<string, FieldFormat>;
  /** Opaque until step 3 defines juice; validated only as a mapping. */
  juice?: Record<string, unknown>;
  log?: string;
}

export interface Glossary {
  version: typeof GLOSSARY_VERSION;
  entries: Record<string, GlossaryEntry>;
  /** Game-defined juice presets; opaque until step 3. */
  juice: Record<string, unknown>;
}

export interface GlossaryIssue {
  /** Entry id, or null for a whole-file problem. */
  entry: string | null;
  message: string;
}

export interface LoadResult {
  /** null when the whole file is unusable (fail closed). */
  glossary: Glossary | null;
  issues: GlossaryIssue[];
}
```

```ts
// ts/src/foundation/glossary/template.ts
const PLACEHOLDER = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

/** Names used as {name} in a template, in order of first use. */
export function placeholders(text: string): string[] {
  const seen: string[] = [];
  for (const m of text.matchAll(PLACEHOLDER)) if (!seen.includes(m[1])) seen.push(m[1]);
  return seen;
}
```

```ts
// ts/src/foundation/glossary/validate.ts
import yaml from 'js-yaml';
import {
  BOUND_KINDS, ENTRY_KINDS, FIELD_FORMATS, GLOSSARY_VERSION, TONES,
  type EntryKind, type FieldFormat, type Glossary, type GlossaryEntry, type GlossaryIssue, type LoadResult, type Tone,
} from './schema';
import { placeholders } from './template';

const isMap = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

function fail(message: string): LoadResult {
  return { glossary: null, issues: [{ entry: null, message }] };
}

/** Returns the entry, or a reason it is invalid. */
function validateEntry(id: string, raw: unknown): GlossaryEntry | string {
  if (!isMap(raw)) return 'entry must be a mapping';
  const { kind, label, icon, tone = 'neutral', text, bind, max, fields, juice, log } = raw;
  if (!ENTRY_KINDS.includes(kind as EntryKind)) return `kind must be one of ${ENTRY_KINDS.join(', ')}`;
  if (!isStr(label)) return 'label is required';
  if (!TONES.includes(tone as Tone)) return `tone must be one of ${TONES.join(', ')}`;
  if (icon !== undefined && !isStr(icon)) return 'icon must be a string';
  if (text !== undefined && typeof text !== 'string') return 'text must be a string';
  if (log !== undefined && typeof log !== 'string') return 'log must be a string';
  if (max !== undefined && !isStr(max)) return 'max must be a bind path';
  if (BOUND_KINDS.includes(kind as EntryKind) && !isStr(bind)) return `a ${kind} entry needs bind`;
  if (bind !== undefined && !isStr(bind)) return 'bind must be a path';
  if (juice !== undefined && !isMap(juice)) return 'juice must be a mapping';
  let fieldMap: Record<string, FieldFormat> | undefined;
  if (fields !== undefined) {
    if (!isMap(fields)) return 'fields must be a mapping';
    for (const [name, fmt] of Object.entries(fields)) {
      if (!FIELD_FORMATS.includes(fmt as FieldFormat)) return `field ${name} must be one of ${FIELD_FORMATS.join(', ')}`;
    }
    fieldMap = fields as Record<string, FieldFormat>;
  }
  // Events are filled from the event payload, which the glossary cannot know in advance.
  if (kind !== 'event' && typeof text === 'string') {
    const undeclared = placeholders(text).filter(p => !(fieldMap && p in fieldMap));
    if (undeclared.length) return `text uses undeclared field(s): ${undeclared.join(', ')}`;
  }
  return {
    id, kind: kind as EntryKind, label: label as string, tone: tone as Tone,
    ...(icon !== undefined && { icon: icon as string }),
    ...(text !== undefined && { text: text as string }),
    ...(bind !== undefined && { bind: bind as string }),
    ...(max !== undefined && { max: max as string }),
    ...(fieldMap && { fields: fieldMap }),
    ...(juice !== undefined && { juice: juice as Record<string, unknown> }),
    ...(log !== undefined && { log: log as string }),
  };
}

/** Parse glossary YAML. Never throws: every problem becomes an issue. */
export function parseGlossary(raw: string): LoadResult {
  let doc: unknown;
  try {
    doc = yaml.load(raw);
  } catch (err) {
    return fail(`glossary is not valid YAML: ${(err as Error).message.split('\n')[0]}`);
  }
  if (!isMap(doc)) return fail('glossary must be a mapping');
  if (doc.version !== GLOSSARY_VERSION) return fail(`unsupported glossary version ${String(doc.version)}; expected ${GLOSSARY_VERSION}`);
  if (!isMap(doc.entries)) return fail('entries must be a mapping');
  if (doc.juice !== undefined && !isMap(doc.juice)) return fail('juice must be a mapping');

  const issues: GlossaryIssue[] = [];
  const entries: Record<string, GlossaryEntry> = {};
  for (const [id, rawEntry] of Object.entries(doc.entries)) {
    const result = validateEntry(id, rawEntry);
    if (typeof result === 'string') issues.push({ entry: id, message: result });
    else entries[id] = result;
  }
  const glossary: Glossary = { version: GLOSSARY_VERSION, entries, juice: (doc.juice as Record<string, unknown>) ?? {} };
  return { glossary, issues };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/test_foundation_glossary_validate.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add ts/src/foundation/glossary/schema.ts ts/src/foundation/glossary/validate.ts ts/src/foundation/glossary/template.ts ts/tests/test_foundation_glossary_validate.ts
git commit -m "foundation: glossary schema and parseGlossary (fail closed, never throws)"
```

---

### Task 2: `resolveBind` and `fillTemplate`

**Files:**
- Create: `ts/src/foundation/glossary/bind.ts`
- Modify: `ts/src/foundation/glossary/template.ts` (add `fillTemplate`)
- Test: `ts/tests/test_foundation_glossary_bind.ts`

**Interfaces:**
- Consumes: nothing from Task 1 except the file `template.ts`.
- Produces: `resolveBind(state: unknown, path: string): unknown`; `fillTemplate(text: string, values: Record<string, unknown>): string`.

- [ ] **Step 1: Write the failing test**

```ts
// ts/tests/test_foundation_glossary_bind.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/test_foundation_glossary_bind.ts`
Expected: FAIL - cannot resolve `bind`, and `fillTemplate` is not exported.

- [ ] **Step 3: Write the implementation**

```ts
// ts/src/foundation/glossary/bind.ts
const SEGMENT = /^([A-Za-z_][A-Za-z0-9_]*)(?:\[([A-Za-z_][A-Za-z0-9_]*)=([^\]]+)\])?$/;

/**
 * Resolve a glossary bind path against game state.
 * `a.b.c` walks objects; `list[key=value]` picks the first item whose `key`
 * equals `value` (compared as strings). Anything unresolvable is undefined -
 * this never throws, because state legitimately has gaps (no enemy outside combat).
 */
export function resolveBind(state: unknown, path: string): unknown {
  if (!path) return undefined;
  let cur: unknown = state;
  for (const part of path.split('.')) {
    const m = SEGMENT.exec(part);
    if (!m || cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[m[1]];
    if (m[2] !== undefined) {
      if (!Array.isArray(cur)) return undefined;
      const [key, want] = [m[2], m[3]];
      cur = cur.find(item => item !== null && typeof item === 'object'
        && String((item as Record<string, unknown>)[key]) === want);
    }
  }
  return cur;
}
```

Append to `ts/src/foundation/glossary/template.ts`:

```ts
/** Replace each {name} with its value; a missing or null value shows as '?'. */
export function fillTemplate(text: string, values: Record<string, unknown>): string {
  return text.replace(PLACEHOLDER, (_, name: string) => {
    const v = values[name];
    return v === undefined || v === null ? '?' : String(v);
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/test_foundation_glossary_bind.ts tests/test_foundation_glossary_validate.ts`
Expected: PASS, 19 tests.

- [ ] **Step 5: Commit**

```bash
git add ts/src/foundation/glossary/bind.ts ts/src/foundation/glossary/template.ts ts/tests/test_foundation_glossary_bind.ts
git commit -m "foundation: resolveBind with [key=value] selectors, fillTemplate"
```

---

### Task 3: Loader, public index and the JSON-schema mirror

**Files:**
- Create: `ts/src/foundation/glossary/load.ts`
- Create: `ts/src/foundation/glossary/index.ts`
- Create: `docs/glossary.schema.json`
- Test: `ts/tests/test_foundation_glossary_load.ts`

**Interfaces:**
- Consumes: `parseGlossary`, schema constants (Task 1); `resolveBind`, `fillTemplate` (Task 2).
- Produces: `getGlossary(gameId: string): LoadResult | null` (null = the game has no glossary file); `glossaryGameIds(): string[]`; `index.ts` re-exports everything public from Tasks 1-3.

- [ ] **Step 1: Write the failing test**

```ts
// ts/tests/test_foundation_glossary_load.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/test_foundation_glossary_load.ts`
Expected: FAIL - cannot resolve `../src/foundation/glossary`.

- [ ] **Step 3: Write the implementation**

```ts
// ts/src/foundation/glossary/load.ts
import { parseGlossary } from './validate';
import type { LoadResult } from './schema';

// Paths are relative to THIS file (ts/src/foundation/glossary/load.ts); ../../../../ is the repo root.
// eager + ?raw embeds every glossary as a string at build time, same as loader.ts does for Lua.
const RAW = import.meta.glob('../../../../games/*/glossary.yaml', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

const BY_GAME: Record<string, string> = Object.fromEntries(
  Object.entries(RAW).map(([file, text]) => [file.split('/').slice(-2)[0], text]),
);

const cache = new Map<string, LoadResult>();

/** The parsed glossary for a game, or null when the game has no glossary.yaml. */
export function getGlossary(gameId: string): LoadResult | null {
  const raw = BY_GAME[gameId];
  if (raw === undefined) return null;
  let result = cache.get(gameId);
  if (!result) {
    result = parseGlossary(raw);
    cache.set(gameId, result);
  }
  return result;
}

/** Every game id that ships a glossary.yaml. */
export function glossaryGameIds(): string[] {
  return Object.keys(BY_GAME).sort();
}
```

```ts
// ts/src/foundation/glossary/index.ts
export * from './schema';
export { parseGlossary } from './validate';
export { resolveBind } from './bind';
export { fillTemplate, placeholders } from './template';
export { getGlossary, glossaryGameIds } from './load';
```

```json
// docs/glossary.schema.json  (write it WITHOUT this comment line - JSON has no comments)
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://rfditservices.com/schemas/glossary.schema.json",
  "title": "RFDGameStudio glossary (games/<id>/glossary.yaml)",
  "description": "Mirror of ts/src/foundation/glossary/schema.ts, kept in sync by ts/tests/test_foundation_glossary_load.ts.",
  "type": "object",
  "required": ["version", "entries"],
  "properties": {
    "version": { "const": 1 },
    "entries": { "type": "object", "additionalProperties": { "$ref": "#/$defs/entry" } },
    "juice": { "type": "object" }
  },
  "$defs": {
    "entry": {
      "type": "object",
      "required": ["kind", "label"],
      "properties": {
        "kind": { "enum": ["stat", "status", "effect", "resource", "card_field", "event"] },
        "label": { "type": "string", "minLength": 1 },
        "icon": { "type": "string" },
        "tone": { "enum": ["ember", "spark", "ash", "cinder", "danger", "heal", "neutral", "gold"] },
        "text": { "type": "string" },
        "bind": { "type": "string" },
        "max": { "type": "string" },
        "fields": { "type": "object", "additionalProperties": { "enum": ["number", "turns", "percent", "text"] } },
        "juice": { "type": "object" },
        "log": { "type": "string" }
      }
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/test_foundation_glossary_load.ts`
Expected: PASS. `every_bundled_glossary_is_valid` passes vacuously until Task 4 adds the first glossary.

- [ ] **Step 5: Commit**

```bash
git add ts/src/foundation/glossary/load.ts ts/src/foundation/glossary/index.ts docs/glossary.schema.json ts/tests/test_foundation_glossary_load.ts
git commit -m "foundation: bundle games/*/glossary.yaml, getGlossary, JSON-schema mirror"
```

---

### Task 4: Dissonance's glossary

**Files:**
- Create: `games/dissonance/glossary.yaml`
- Test: `ts/tests/test_foundation_glossary_dissonance.ts`

**Interfaces:**
- Consumes: `getGlossary`, `resolveBind` (Tasks 2-3). State shape: `RunState` in `ts/src/games/dissonance/types.ts` (`playerHp`, `playerMaxHp`, `playerShield`, `essence`, `enemy.hp`, `enemy.maxHp`, `enemy.dot`, `residue.marks[]` of `{element, level}`).
- Produces: the glossary step 2 renders. Entries `burning`, `soaked`, `fortified`, `windswept` bind to `enemy.residues[...]`, which exists only after the Brewfield branch merges; until then they resolve to `undefined`, which is correct (nothing to show).

- [ ] **Step 1: Write the failing test**

```ts
// ts/tests/test_foundation_glossary_dissonance.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/test_foundation_glossary_dissonance.ts`
Expected: FAIL - `getGlossary('dissonance')` is null.

- [ ] **Step 3: Write the glossary**

```yaml
# games/dissonance/glossary.yaml
# What Dissonance Depths' state MEANS - read by the Studio foundation
# (docs/superpowers/specs/2026-09-22-studio-foundation-design.md). Never how it is computed.
version: 1
entries:
  player_hp:
    kind: stat
    label: HP
    icon: heart
    tone: heal
    bind: playerHp
    max: playerMaxHp
  player_shield:
    kind: resource
    label: Shield
    icon: shield
    tone: cinder
    text: "Blocks the next {value} damage."
    bind: playerShield
    fields: { value: number }
  essence:
    kind: resource
    label: Essence
    icon: gem
    tone: gold
    text: "Spend at stores and rest sites."
    bind: essence
  enemy_hp:
    kind: stat
    label: Enemy HP
    icon: skull
    tone: danger
    bind: enemy.hp
    max: enemy.maxHp
  enemy_dot:
    kind: status
    label: Wound
    icon: drop
    tone: danger
    text: "Takes {damage} damage each turn for {duration} turns."
    bind: enemy.dot
    fields: { damage: number, duration: turns }
  ember_mark:
    kind: status
    label: Ember mark
    icon: flame
    tone: ember
    text: "Ember residue at level {level}."
    bind: residue.marks[element=ember]
    fields: { level: number }
  spark_mark:
    kind: status
    label: Spark mark
    icon: bolt
    tone: spark
    text: "Spark residue at level {level}."
    bind: residue.marks[element=spark]
    fields: { level: number }
  ash_mark:
    kind: status
    label: Ash mark
    icon: wind
    tone: ash
    text: "Ash residue at level {level}."
    bind: residue.marks[element=ash]
    fields: { level: number }
  cinder_mark:
    kind: status
    label: Cinder mark
    icon: stone
    tone: cinder
    text: "Cinder residue at level {level}."
    bind: residue.marks[element=cinder]
    fields: { level: number }
  # Brewfield chemistry - bound to enemy.residues, present once that branch merges.
  burning:
    kind: status
    label: Burning
    icon: flame
    tone: ember
    text: "Takes {level} ember damage each turn for {turnsLeft} turns."
    bind: enemy.residues[tag=burning]
    fields: { level: number, turnsLeft: turns }
  soaked:
    kind: status
    label: Soaked
    icon: drop
    tone: spark
    text: "Soaked at level {level} for {turnsLeft} turns."
    bind: enemy.residues[tag=soaked]
    fields: { level: number, turnsLeft: turns }
  fortified:
    kind: status
    label: Fortified
    icon: stone
    tone: cinder
    text: "Resists overwrite; level {level} for {turnsLeft} turns."
    bind: enemy.residues[tag=fortified]
    fields: { level: number, turnsLeft: turns }
  windswept:
    kind: status
    label: Windswept
    icon: wind
    tone: ash
    text: "Windswept at level {level} for {turnsLeft} turns."
    bind: enemy.residues[tag=windswept]
    fields: { level: number, turnsLeft: turns }
  card_cost:
    kind: card_field
    label: Cost
    icon: gem
    tone: gold
  card_element:
    kind: card_field
    label: Element
  dodge:
    kind: event
    label: Dodged
    tone: spark
    text: "{target} dodged the attack."
  retaliate:
    kind: event
    label: Retaliate
    tone: ember
    text: "{target} took {amount} retaliation damage."
  detonate:
    kind: event
    label: Detonate
    tone: danger
    text: "The fuse detonated for {amount}."
  cauterize:
    kind: event
    label: Cauterize
    tone: heal
    text: "Cauterized - the wound closes."
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/test_foundation_glossary_dissonance.ts tests/test_foundation_glossary_load.ts`
Expected: PASS; `every_bundled_glossary_is_valid` now checks Dissonance for real.

- [ ] **Step 5: Commit**

```bash
git add games/dissonance/glossary.yaml ts/tests/test_foundation_glossary_dissonance.ts
git commit -m "dissonance: first glossary (stats, marks, Brewfield residues and events)"
```

---

### Task 5: `GlossaryPanel` and the `?glossary` switch in `GameShell`

**Files:**
- Create: `ts/src/foundation/glossary/GlossaryPanel.tsx`
- Modify: `ts/src/foundation/glossary/index.ts` (export the panel)
- Modify: `ts/src/components/GameShell.tsx` (mount the panel)
- Test: `ts/tests/test_foundation_glossary_panel.tsx`

**Interfaces:**
- Consumes: `getGlossary`, `LoadResult` (Tasks 1-3); `ErrorBox` from `ts/src/ui/components` (`<ErrorBox message={string} />`).
- Produces: `GlossaryPanel({ result }: { result: LoadResult })`; `glossaryPanelRequested(search: string): boolean`.

- [ ] **Step 1: Write the failing test**

```tsx
// ts/tests/test_foundation_glossary_panel.tsx
import { describe, expect, it } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { GlossaryPanel, glossaryPanelRequested, parseGlossary } from '../src/foundation/glossary';
import { GameShell } from '../src/components/GameShell';

async function render(el: React.ReactElement) {
  const container = document.createElement('div');
  const root = createRoot(container);
  await act(async () => { root.render(el); });
  return { container, root };
}

describe('GlossaryPanel', () => {
  it('lists_entries_with_kind_and_label', async () => {
    const result = parseGlossary('version: 1\nentries:\n  hp: { kind: stat, label: HP, bind: a }\n');
    const { container, root } = await render(<GlossaryPanel result={result} />);
    expect(container.querySelector('[data-glossary-entry="hp"]')?.textContent).toContain('HP');
    expect(container.querySelector('[data-glossary-entry="hp"]')?.textContent).toContain('stat');
    root.unmount();
  });

  it('shows_issues_in_an_error_box', async () => {
    const result = parseGlossary('version: 1\nentries:\n  bad: { kind: potion, label: X }\n');
    const { container, root } = await render(<GlossaryPanel result={result} />);
    expect(container.querySelector('.error-box')?.textContent).toContain('bad');
    root.unmount();
  });

  it('shows_a_whole_file_failure', async () => {
    const { container, root } = await render(<GlossaryPanel result={parseGlossary('version: 9\nentries: {}\n')} />);
    expect(container.querySelector('.error-box')?.textContent).toMatch(/version/);
    root.unmount();
  });
});

describe('glossaryPanelRequested', () => {
  it('reads_the_query_flag', () => {
    expect(glossaryPanelRequested('?game=dissonance&glossary')).toBe(true);
    expect(glossaryPanelRequested('?game=dissonance&glossary=1')).toBe(true);
    expect(glossaryPanelRequested('?game=dissonance')).toBe(false);
  });
});

describe('GameShell', () => {
  it('renders_no_panel_without_the_flag', async () => {
    const { container, root } = await render(<GameShell gameLabel="D" gameId="dissonance"><p>x</p></GameShell>);
    expect(container.querySelector('.glossary-panel')).toBeNull();
    root.unmount();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/test_foundation_glossary_panel.tsx`
Expected: FAIL - `GlossaryPanel` is not exported.

- [ ] **Step 3: Write the implementation**

```tsx
// ts/src/foundation/glossary/GlossaryPanel.tsx
import { ErrorBox } from '../../ui/components';
import type { LoadResult } from './schema';

/** True when the URL asks for the dev glossary panel (?glossary or ?glossary=1). */
export function glossaryPanelRequested(search: string): boolean {
  return new URLSearchParams(search).has('glossary');
}

/** Dev-only view of a game's glossary: every entry, and every problem found loading it. */
export function GlossaryPanel({ result }: { result: LoadResult }) {
  const entries = result.glossary ? Object.values(result.glossary.entries) : [];
  return (
    <aside className="glossary-panel" aria-label="Glossary (dev)">
      <h2>Glossary</h2>
      {result.issues.map((issue, i) => (
        <ErrorBox key={i} message={`${issue.entry ?? 'glossary'}: ${issue.message}`} />
      ))}
      <ul>
        {entries.map(e => (
          <li key={e.id} data-glossary-entry={e.id}>
            <strong>{e.label}</strong> <code>{e.kind}</code> <code>{e.tone}</code>
            {e.bind && <> <code>{e.bind}</code></>}
          </li>
        ))}
      </ul>
    </aside>
  );
}
```

Add to `ts/src/foundation/glossary/index.ts`:

```ts
export { GlossaryPanel, glossaryPanelRequested } from './GlossaryPanel';
```

In `ts/src/components/GameShell.tsx`, add the import after the existing routing import:

```tsx
import { getGlossary, GlossaryPanel, glossaryPanelRequested } from '../foundation/glossary';
```

and replace the main-content line

```tsx
      <div className={`game-shell-main ${mainClassName}`}>{children}</div>
```

with

```tsx
      <div className={`game-shell-main ${mainClassName}`}>{children}</div>

      {typeof window !== 'undefined' && glossaryPanelRequested(window.location.search) && (() => {
        const result = getGlossary(gameId);
        return result ? <GlossaryPanel result={result} /> : null;
      })()}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/test_foundation_glossary_panel.tsx`
Expected: PASS, 5 tests.

Then the full suite: `npx vitest run`
Expected: no new failures against `main` (baseline: 6 files failing on the missing generated `game-metadata.json`, plus the known flaky sports-sim test); no skipped or deleted tests.

- [ ] **Step 5: Commit**

```bash
git add ts/src/foundation/glossary/GlossaryPanel.tsx ts/src/foundation/glossary/index.ts ts/src/components/GameShell.tsx ts/tests/test_foundation_glossary_panel.tsx
git commit -m "foundation: dev GlossaryPanel, mounted by GameShell on ?glossary"
```

---

## Done when

- `http://localhost:5173/?game=dissonance&glossary` shows the panel listing Dissonance's entries (needs `ts/src/games/game-metadata.json` present, as for any dev run).
- `npx vitest run tests/test_foundation_glossary_*` passes; the full suite has no new failures.
- No game other than Dissonance has any new file; no game's behaviour changes without `?glossary`.
