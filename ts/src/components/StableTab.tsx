import React, { useState } from 'react';
import type { Horse, GameSession } from '../engine/types';
import { getSchema } from '../engine/runtime';
import { SVGRacer } from './SVGRacer';

interface Props {
  horses: Horse[];
  session: GameSession;
  funds: number;
  unlockedSlots: number;
  ticker: number;
  onNewRace: () => void;
  onUnlockSlot: () => void;
  onRenameHorse: (id: string, newName: string) => void;
  onSellHorse: (id: string) => void;
}

const STAT_KEYS: (keyof Horse)[] = ['speed', 'stamina', 'acceleration', 'temperament'];

export default function StableTab({ horses, session, funds, unlockedSlots, ticker: _ticker, onNewRace, onUnlockSlot, onRenameHorse, onSellHorse }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const schema = (() => {
    try { return getSchema(session, 'horse'); }
    catch { return null; }
  })();

  const statDescs: Record<string, string> = {};
  if (schema && schema['stats']) {
    const stats = schema['stats'] as Record<string, unknown>;
    for (const [k, v] of Object.entries(stats)) {
      statDescs[k] = (v as Record<string, string>)['description'] ?? k;
    }
  }

  return (
    <div>
      <div className="section-header">
        <h2>Stable</h2>
        <button className="btn-primary" onClick={onNewRace}>
          Enter a Race →
        </button>
      </div>

      {horses.length === 0
        ? <div className="empty-state">No horses in stable.</div>
        : (
          <div className="card-grid">
            {horses.map(horse => {
              const isResting = horse.cooldown_until > Date.now();
              const secsLeft = isResting ? Math.max(0, Math.ceil((horse.cooldown_until - Date.now()) / 1000)) : 0;
              const minsLeft = Math.floor(secsLeft / 60);
              const sLeft = secsLeft % 60;
              return (
                <div key={horse.id} className="horse-card">
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '0.25rem 0 0.5rem', position: 'relative' }}>
                    <SVGRacer
                      colorBody={horse.color_body}
                      colorMane={horse.color_mane}
                      colorSocks={horse.color_socks}
                      colorJockeySilk={horse.color_silk}
                      isRunning={false}
                      size={72}
                    />
                  </div>

                  {editingId === horse.id ? (
                    <input
                      className="rename-input"
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { onRenameHorse(horse.id, editName); setEditingId(null); }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onBlur={() => { onRenameHorse(horse.id, editName); setEditingId(null); }}
                    />
                  ) : (
                    <div
                      className="horse-name horse-name-editable"
                      title="Click to rename"
                      onClick={() => { setEditingId(horse.id); setEditName(horse.name); }}
                    >
                      {horse.name}
                    </div>
                  )}

                  <div className="horse-meta">
                    Gen {horse.generation} · {horse.gender}
                    {horse.player_owned && <span className="badge-player">Yours</span>}
                  </div>

                  {isResting && (
                    <div className="cooldown-badge">
                      Resting {minsLeft}m {sLeft}s
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.25rem' }}>
                    {STAT_KEYS.map(key => {
                      const val = horse[key] as number;
                      const label = statDescs[key as string] ?? key;
                      return (
                        <div key={key as string} className="stat-row">
                          <span style={{ width: '90px', color: 'var(--text-muted)', fontSize: '0.78rem' }}
                            title={label}>
                            {String(key).charAt(0).toUpperCase() + String(key).slice(1)}
                          </span>
                          <span style={{ width: '28px', textAlign: 'right', fontWeight: 600 }}>{val}</span>
                          <div className="stat-bar-wrap">
                            <div className="stat-bar-bg">
                              <div
                                className="stat-bar-fill"
                                style={{ width: `${val}%`, opacity: 0.7 + val / 300 }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {horse.runs} runs · {horse.wins}W {horse.places}P {horse.thirds}T ·
                    ${horse.earnings.toLocaleString()} earned
                  </div>

                  <button
                    className="btn-sell"
                    onClick={() => onSellHorse(horse.id)}
                    title={`Sell for ~$${horse.price}`}
                  >
                    Sell (~${horse.price})
                  </button>
                </div>
              );
            })}
          </div>
        )
      }

      {(() => {
        const data = session.files.data as Record<string, unknown>;
        const stableCfg = (data['stable'] as Record<string, unknown>) ?? {};
        const maxSlots = (stableCfg['max_slots'] as number) ?? 12;
        const unlockCost = (stableCfg['unlock_cost_per_slot'] as number) ?? 500;
        if (unlockedSlots >= maxSlots) return null;
        return (
          <div className="slot-unlock-panel">
            <span>Stable slots: {horses.filter(h => h.player_owned).length} / {unlockedSlots}</span>
            <button
              className="btn-secondary"
              disabled={funds < unlockCost}
              onClick={onUnlockSlot}
            >
              Unlock Slot (${unlockCost})
            </button>
          </div>
        );
      })()}
    </div>
  );
}
