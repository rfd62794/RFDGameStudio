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
