// new: ts/src/engine/tuning/exportFormat.ts
import type { KnobDef, Overrides } from './types';

interface ChangedKnob {
  knob: KnobDef;
  value: number;
}

function changedKnobs(changed: Overrides, knobs: KnobDef[]): ChangedKnob[] {
  const byKey = new Map(knobs.map(knob => [knob.key, knob]));
  const out: ChangedKnob[] = [];
  for (const [key, value] of Object.entries(changed)) {
    const knob = byKey.get(key);
    if (knob === undefined || !Number.isFinite(value) || value === knob.default) continue;
    out.push({ knob, value });
  }
  return out;
}

function setPath(tree: Record<string, unknown>, segments: string[], value: number): void {
  let node = tree;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i];
    const child = node[segment];
    if (typeof child !== 'object' || child === null) {
      node[segment] = {};
    }
    node = node[segment] as Record<string, unknown>;
  }
  node[segments[segments.length - 1]] = value;
}

function renderYaml(node: Record<string, unknown>, indent: string, lines: string[]): void {
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === 'object' && value !== null) {
      lines.push(`${indent}${key}:`);
      renderYaml(value as Record<string, unknown>, `${indent}  `, lines);
    } else {
      lines.push(`${indent}${key}: ${value}`);
    }
  }
}

export function formatYaml(changed: Overrides, knobs: KnobDef[]): string {
  const entries = changedKnobs(changed, knobs);
  if (entries.length === 0) return '# no changes';
  const byFile = new Map<string, Record<string, unknown>>();
  const constLines: string[] = [];
  for (const { knob, value } of entries) {
    if (knob.source.kind === 'data') {
      let tree = byFile.get(knob.source.file);
      if (tree === undefined) {
        tree = {};
        byFile.set(knob.source.file, tree);
      }
      setPath(tree, knob.source.path.split('.'), value);
    } else {
      constLines.push(`# ${knob.source.file}: ${knob.source.name} = ${value}`);
    }
  }
  const lines: string[] = [];
  for (const [file, tree] of byFile) {
    lines.push(`# ${file}`);
    renderYaml(tree, '', lines);
  }
  lines.push(...constLines);
  return lines.join('\n');
}

export function formatPatch(changed: Overrides, knobs: KnobDef[]): string {
  const entries = changedKnobs(changed, knobs);
  if (entries.length === 0) return '# no changes';
  return entries
    .map(({ knob, value }) => {
      const name = knob.source.kind === 'data' ? knob.source.path : knob.source.name;
      return `${knob.source.file}: ${name} = ${value} (was ${knob.default})`;
    })
    .join('\n');
}
