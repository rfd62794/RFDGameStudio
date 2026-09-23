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
