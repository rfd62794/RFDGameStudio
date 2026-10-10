// new: ts/src/components/TuningPanel.tsx
import { useState } from 'react';
import type { KnobDef, Overrides } from '../engine/tuning';
import { clearDevOverrides, getOverrides, writeDevOverrides } from '../engine/tuning';
import { formatPatch, formatYaml } from '../engine/tuning/exportFormat';
import { getTuning } from '../games/tuning-registry';
import './TuningPanel.css';

export default function TuningPanel({ gameId }: { gameId: string }) {
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

  function apply() {
    writeDevOverrides(gameId, changedOnly);
    window.location.reload();
  }

  function reset() {
    clearDevOverrides(gameId);
    window.location.reload();
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
            return (
              <div
                key={knob.key}
                data-tuning-knob={knob.key}
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
                <p className="tuning-affects">{knob.affects}</p>
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
      {copied !== null && <p className="tuning-copied">Copied</p>}
      {fallbackText !== null && <textarea className="tuning-fallback" readOnly value={fallbackText} />}
    </aside>
  );
}
