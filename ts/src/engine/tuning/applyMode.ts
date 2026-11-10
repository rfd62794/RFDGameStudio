// new: ts/src/engine/tuning/applyMode.ts
import type { ApplyMode, KnobDef, Overrides } from './types';

const MODE_STRENGTH: Record<ApplyMode, number> = { live: 0, 'next-run': 1, reload: 2 };

export function knobApplyMode(knob: KnobDef): ApplyMode {
  return knob.applies ?? 'reload';
}

export function changedKeys(before: Overrides, after: Overrides): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(before)) {
    if (!(key in after) || before[key] !== after[key]) keys.push(key);
  }
  for (const key of Object.keys(after)) {
    if (!(key in before)) keys.push(key);
  }
  return keys;
}

export function requiredApplyMode(keys: string[], knobs: KnobDef[]): ApplyMode | null {
  if (keys.length === 0) return null;
  const byKey = new Map(knobs.map(knob => [knob.key, knob]));
  let strongest: ApplyMode = 'live';
  for (const key of keys) {
    const knob = byKey.get(key);
    const mode = knob ? knobApplyMode(knob) : 'reload';
    if (MODE_STRENGTH[mode] > MODE_STRENGTH[strongest]) strongest = mode;
    if (strongest === 'reload') break;
  }
  return strongest;
}
