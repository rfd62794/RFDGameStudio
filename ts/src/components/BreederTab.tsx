import React, { useState, useCallback } from 'react';
import type { Horse, GameSession } from '../engine/types';
import { call } from '../engine/runtime';
import { SVGRacer } from './SVGRacer';

interface Props {
  horses: Horse[];
  session: GameSession;
  funds: number;
  onAddOffspring: (foal: Horse, cost: number) => void;
}

const FACILITY_FEE = 100;

function luaHorseToTs(raw: Record<string, unknown>): Horse {
  return {
    id: raw['id'] as string,
    name: raw['name'] as string,
    gender: (raw['gender'] as string) as 'Stallion' | 'Mare',
    generation: raw['generation'] as number,
    speed: raw['speed'] as number,
    stamina: raw['stamina'] as number,
    acceleration: raw['acceleration'] as number,
    temperament: raw['temperament'] as number,
    color_body: raw['color_body'] as string,
    color_mane: raw['color_mane'] as string,
    color_socks: raw['color_socks'] as string,
    color_silk: raw['color_silk'] as string,
    runs: (raw['runs'] as number) ?? 0,
    wins: (raw['wins'] as number) ?? 0,
    places: (raw['places'] as number) ?? 0,
    thirds: (raw['thirds'] as number) ?? 0,
    earnings: (raw['earnings'] as number) ?? 0,
    cooldown_until: (raw['cooldown_until'] as number) ?? 0,
    player_owned: true,
    price: (raw['price'] as number) ?? 0,
  };
}

export default function BreederTab({ horses, session, funds, onAddOffspring }: Props) {
  const [selectedSireId, setSelectedSireId] = useState<string>('');
  const [selectedDamId, setSelectedDamId] = useState<string>('');
  const [foal, setFoal] = useState<Horse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const data = session.files.data as Record<string, unknown>;
  const coatColors = data['coat_colors'];
  const silkColors = data['silk_colors'];
  const prefixes = data['name_prefixes'];
  const suffixes = data['name_suffixes'];
  const publicStuds = (data['public_studs'] as Array<Record<string, unknown>> ?? []).map(luaHorseToTs);

  const allSires = [
    ...horses.filter(h => h.gender === 'Stallion'),
    ...publicStuds.filter(h => h.gender === 'Stallion'),
  ];
  const allDams = [
    ...horses.filter(h => h.gender === 'Mare'),
    ...publicStuds.filter(h => h.gender === 'Mare'),
  ];

  const selectedSire = allSires.find(h => h.id === selectedSireId) ?? null;
  const selectedDam = allDams.find(h => h.id === selectedDamId) ?? null;

  const studFee = (h: Horse | null) => (!h || h.player_owned ? 0 : h.price);
  const totalCost = FACILITY_FEE + studFee(selectedSire) + studFee(selectedDam);

  const canBreed =
    selectedSire !== null &&
    selectedDam !== null &&
    foal === null &&
    funds >= totalCost &&
    horses.length < 12 &&
    selectedSire.cooldown_until < Date.now() &&
    selectedDam.cooldown_until < Date.now();

  const handleBreed = useCallback(() => {
    if (!selectedSire || !selectedDam) return;
    setError(null);
    try {
      const raw = call(session, 'breed_horses', selectedSire, selectedDam, coatColors, silkColors, prefixes, suffixes) as Record<string, unknown>;
      if (!raw || raw['id'] === undefined) {
        setError('Breeding failed — check sire/dam genders.');
        return;
      }
      setFoal(luaHorseToTs({ ...raw, player_owned: true }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [session, selectedSire, selectedDam, coatColors, silkColors, prefixes, suffixes]);

  const handleClaim = useCallback(() => {
    if (!foal) return;
    onAddOffspring(foal, totalCost);
    setFoal(null);
    setSelectedSireId('');
    setSelectedDamId('');
  }, [foal, totalCost, onAddOffspring]);

  const statBar = (val: number) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{
        height: '6px', width: `${val}%`, maxWidth: '80px',
        background: val >= 70 ? 'var(--green)' : val >= 45 ? 'var(--yellow)' : 'var(--red)',
        borderRadius: '3px',
      }} />
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{val}</span>
    </div>
  );

  const horseCard = (h: Horse | null, label: string) => (
    <div className="breeder-horse-card">
      {h && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
          <SVGRacer
            colorBody={h.color_body}
            colorMane={h.color_mane}
            colorSocks={h.color_socks}
            colorJockeySilk={h.color_silk}
            isRunning={false}
            size={60}
          />
        </div>
      )}
      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{h ? h.name : `— Select ${label} —`}</div>
      {h && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', fontSize: '0.82rem', marginBottom: '6px' }}>
            <span>Spd</span>{statBar(h.speed)}
            <span>Stm</span>{statBar(h.stamina)}
            <span>Acc</span>{statBar(h.acceleration)}
            <span>Tmp</span>{statBar(h.temperament)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Gen {h.generation} · {h.runs} runs · {h.wins}W/{h.places}P/{h.thirds}T
          </div>
          {!h.player_owned && (
            <div style={{ fontSize: '0.78rem', color: 'var(--yellow)', marginTop: '2px' }}>
              Stud fee: ${h.price}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div>
      <div className="section-header">
        <h2>Breeding Lab</h2>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Stable: {horses.length}/12
        </span>
      </div>

      {error && <div className="error-box" style={{ marginBottom: '1rem' }}>{error}</div>}
      {horses.length >= 12 && (
        <div className="error-box" style={{ marginBottom: '1rem' }}>Stable full — sell a horse before breeding.</div>
      )}

      <div className="breeder-panel">
        <div className="breeder-col">
          <h3>Select Sire (Stallion)</h3>
          <select
            value={selectedSireId}
            onChange={e => setSelectedSireId(e.target.value)}
            style={{ width: '100%', marginBottom: '0.5rem' }}
          >
            <option value="">— Choose stallion —</option>
            {allSires.map(h => (
              <option key={h.id} value={h.id} disabled={h.cooldown_until >= Date.now()}>
                {h.name}{!h.player_owned ? ` ($${h.price})` : ''}{h.cooldown_until >= Date.now() ? ' [resting]' : ''}
              </option>
            ))}
          </select>
          {horseCard(selectedSire, 'Sire')}
        </div>

        <div className="breeder-col">
          <h3>Select Dam (Mare)</h3>
          <select
            value={selectedDamId}
            onChange={e => setSelectedDamId(e.target.value)}
            style={{ width: '100%', marginBottom: '0.5rem' }}
          >
            <option value="">— Choose mare —</option>
            {allDams.map(h => (
              <option key={h.id} value={h.id} disabled={h.cooldown_until >= Date.now()}>
                {h.name}{!h.player_owned ? ` ($${h.price})` : ''}{h.cooldown_until >= Date.now() ? ' [resting]' : ''}
              </option>
            ))}
          </select>
          {horseCard(selectedDam, 'Dam')}
        </div>

        <div className="breeder-col breeder-action-col">
          <h3>Cost</h3>
          <div className="cost-panel">
            <div className="cost-row"><span>Facility fee</span><span>${FACILITY_FEE}</span></div>
            {selectedSire && !selectedSire.player_owned && (
              <div className="cost-row"><span>{selectedSire.name} (stud)</span><span>${selectedSire.price}</span></div>
            )}
            {selectedDam && !selectedDam.player_owned && (
              <div className="cost-row"><span>{selectedDam.name} (stud)</span><span>${selectedDam.price}</span></div>
            )}
            <div className="cost-row cost-total">
              <span>Total</span><span>${totalCost}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: funds >= totalCost ? 'var(--green)' : 'var(--red)', marginTop: '4px' }}>
              Available: ${funds.toLocaleString()}
            </div>
          </div>

          {!foal && (
            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
              onClick={handleBreed}
              disabled={!canBreed}
            >
              Breed →
            </button>
          )}

          {!canBreed && !foal && selectedSire && selectedDam && funds < totalCost && (
            <div style={{ color: 'var(--red)', fontSize: '0.82rem', marginTop: '0.5rem' }}>
              Insufficient funds.
            </div>
          )}
        </div>
      </div>

      {foal && (
        <div className="foal-reveal">
          <h3>Foal Born!</h3>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            <span style={{ color: foal.color_silk, marginRight: '6px' }}>●</span>
            {foal.name}
            <span style={{ marginLeft: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Gen {foal.generation} · {foal.gender}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '1rem' }}>
            {[['Speed', foal.speed], ['Stamina', foal.stamina], ['Accel', foal.acceleration], ['Temp', foal.temperament]].map(([label, val]) => (
              <div key={label as string} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: (val as number) >= 70 ? 'var(--green)' : (val as number) >= 45 ? 'var(--yellow)' : 'var(--red)' }}>
                  {val}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-primary" onClick={handleClaim}>
              Claim Foal (−${totalCost})
            </button>
            <button className="btn-neutral" onClick={() => setFoal(null)}>
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
