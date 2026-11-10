// new: ts/src/components/TuningPanel.tsx
import { useState } from 'react';
import type { ApplyMode, KnobDef, Overrides } from '../engine/tuning';
import {
  changedKeys,
  clearDevOverrides,
  getOverrides,
  knobApplyMode,
  requiredApplyMode,
  writeDevOverrides,
} from '../engine/tuning';
import { formatPatch, formatYaml } from '../engine/tuning/exportFormat';
import { getTuning } from '../games/tuning-registry';
import './TuningPanel.css';

function applyModeText(mode: ApplyMode): string {
  return mode === 'live' ? 'live' : mode === 'next-run' ? 'next run' : 'needs reload';
}

export default function TuningPanel({
  gameId,
  reload = () => window.location.reload(),
}: {
  gameId: string;
  reload?: () => void;
}) {
  const tuning = getTuning(gameId);
  const knobs: KnobDef[] = tuning?.knobs ?? [];
  const [draft, setDraft] = useState<Overrides>(() => {
    if (!tuning) return {};
    const current = getOverrides(gameId);
    const init: Overrides = {};
    for (const knob of knobs) {
      init[knob.key] = current[knob.key] ?? knob.default;
    }
    return init;
  });
  const [copied, setCopied] = useState<'yaml' | 'patch' | null>(null);
  const [fallbackText, setFallbackText] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  if (!tuning) return null;

  const changedOnly: Overrides = {};
  for (const knob of knobs) {
    const value = draft[knob.key] ?? knob.default;
    if (value !== knob.default) changedOnly[knob.key] = value;
  }

  const groups: { name: string; knobs: KnobDef[] }[] = [];
  for (const knob of knobs) {
    let group = groups.find(g => g.name === knob.group);
    if (!group) {
      group = { name: knob.group, knobs: [] };
      groups.push(group);
    }
    group.knobs.push(knob);
  }

  function setValue(key: string, raw: string) {
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    setDraft(prev => ({ ...prev, [key]: value }));
  }

  function settle(keys: string[]) {
    const mode = requiredApplyMode(keys, knobs);
    if (mode === 'reload') {
      reload();
      return;
    }
    setStatus(
      mode === 'live'
        ? 'Applied live.'
        : mode === 'next-run'
          ? 'Saved. Takes effect on the next run.'
          : null
    );
  }

  function apply() {
    const keys = changedKeys(getOverrides(gameId), changedOnly);
    writeDevOverrides(gameId, changedOnly);
    settle(keys);
  }

  function reset() {
    const keys = changedKeys(getOverrides(gameId), {});
    clearDevOverrides(gameId);
    settle(keys);
  }

  async function copyAs(kind: 'yaml' | 'patch') {
    const text = kind === 'yaml' ? formatYaml(changedOnly, knobs) : formatPatch(changedOnly, knobs);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setFallbackText(null);
    } catch {
      setCopied(null);
      setFallbackText(text);
    }
  }

  return (
    <aside className="tuning-panel" aria-label="Tuning (dev)" data-tuning-panel>
      <h2 className="tuning-title">Tuning</h2>
      <p className="tuning-note">Dev tuning: only you see this. Copy the changes into the files to keep them.</p>
      {groups.map(group => (
        <section key={group.name} className="tuning-group">
          <h3 className="tuning-group-name">{group.name}</h3>
          {group.knobs.map(knob => {
            const value = draft[knob.key] ?? knob.default;
            const changed = value !== knob.default;
            const mode = knobApplyMode(knob);
            return (
              <div
                key={knob.key}
                data-tuning-knob={knob.key}
                data-tuning-apply={mode}
                className={changed ? 'tuning-row changed' : 'tuning-row'}
              >
                <div className="tuning-row-head">
                  <span className="tuning-label">{knob.label}</span>
                  <span className="tuning-default">default {knob.default}</span>
                </div>
                <div className="tuning-inputs">
                  <input
                    type="range"
                    min={knob.min}
                    max={knob.max}
                    step={knob.step}
                    value={value}
                    onChange={e => setValue(knob.key, e.target.value)}
                  />
                  <input
                    type="number"
                    min={knob.min}
                    max={knob.max}
                    step={knob.step}
                    value={value}
                    onChange={e => setValue(knob.key, e.target.value)}
                  />
                </div>
                <p className="tuning-affects">
                  {knob.affects}{' '}
                  <span className="tuning-apply" data-tuning-apply={mode}>
                    {applyModeText(mode)}
                  </span>
                </p>
              </div>
            );
          })}
        </section>
      ))}
      <div className="tuning-actions">
        <button type="button" onClick={apply}>Apply</button>
        <button type="button" onClick={reset}>Reset</button>
        <button type="button" onClick={() => { void copyAs('yaml'); }}>Copy as YAML</button>
        <button type="button" onClick={() => { void copyAs('patch'); }}>Copy as patch</button>
      </div>
      {status !== null && (
        <p className="tuning-status" data-tuning-status role="status">
          {status}
        </p>
      )}
      {copied !== null && <p className="tuning-copied">Copied</p>}
      {fallbackText !== null && <textarea className="tuning-fallback" readOnly value={fallbackText} />}
    </aside>
  );
}
