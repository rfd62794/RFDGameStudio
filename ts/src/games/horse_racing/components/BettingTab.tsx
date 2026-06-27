import { useState, useCallback } from 'react';
import type { CurrentRace, RaceParticipant, GameSession, Bet, Horse } from '../../../engine/types';
import { call } from '../../../engine/runtime';
import { SVGRacer } from './SVGRacer';
import { Badge } from '../../../ui/components';

interface Props {
  race: CurrentRace | null;
  funds: number;
  horses: Horse[];
  unlockedSlots: number;
  lastRaceNetPayout: number | null;
  lastRaceBets: Bet[];
  session: GameSession;
  onNewRace: (horseId?: string) => void;
  onSkipRace: (horseId?: string) => void;
  onStartRace: (enrichedParticipants: RaceParticipant[], bets: Bet[], netPayout: number) => void;
  onPurchaseStarter: (gender: 'Stallion' | 'Mare', price: number) => void;
}

interface HorseBets {
  win: number;
  place: number;
  show: number;
}

export default function BettingTab({ race, funds, horses, unlockedSlots, lastRaceNetPayout, lastRaceBets, session, onNewRace, onSkipRace, onStartRace, onPurchaseStarter }: Props) {
  const [betEntries, setBetEntries] = useState<Record<string, HorseBets>>({});
  const [simulated, setSimulated] = useState(false);

  const data = session.files.data as Record<string, unknown>;
  const bettingCfg = (data['betting'] as Record<string, unknown>) ?? {};

  const getPlaceOdds = useCallback((winOdds: number): number => {
    return call(session, 'calculate_place_odds', winOdds, bettingCfg) as number;
  }, [session, bettingCfg]);

  const getShowOdds = useCallback((winOdds: number): number => {
    return call(session, 'calculate_show_odds', winOdds, bettingCfg) as number;
  }, [session, bettingCfg]);

  const handleBetChange = useCallback((horseId: string, type: 'win' | 'place' | 'show', amount: number) => {
    setBetEntries(prev => ({
      ...prev,
      [horseId]: { ...(prev[horseId] ?? { win: 0, place: 0, show: 0 }), [type]: Math.max(0, Math.min(amount, funds)) },
    }));
  }, [funds]);

  const handleRace = useCallback(() => {
    if (!race) return;

    const activeBets: Bet[] = [];
    for (const p of race.participants) {
      const entry = betEntries[p.horse.id];
      if (!entry) continue;
      if (entry.win > 0) activeBets.push({ horse_id: p.horse.id, horse_name: p.horse.name, amount: entry.win, type: 'Win', payout_odds: p.odds });
      if (entry.place > 0) activeBets.push({ horse_id: p.horse.id, horse_name: p.horse.name, amount: entry.place, type: 'Place', payout_odds: getPlaceOdds(p.odds) });
      if (entry.show > 0) activeBets.push({ horse_id: p.horse.id, horse_name: p.horse.name, amount: entry.show, type: 'Show', payout_odds: getShowOdds(p.odds) });
    }

    const luaParticipants = race.participants.map(p => ({
      horse: {
        id: p.horse.id,
        name: p.horse.name,
        speed: p.horse.speed,
        stamina: p.horse.stamina,
        acceleration: p.horse.acceleration,
        temperament: p.horse.temperament,
      },
      energy: 100,
      current_distance: 0,
      current_speed: 0,
      is_finished: false,
      progress: 0,
    }));

    const simResults = call(session, 'simulate_race', luaParticipants, { distance: race.distance }) as
      Array<Record<string, unknown>>;

    const rawArr = (Array.isArray(simResults) ? simResults : Object.values(simResults)) as Array<Record<string, unknown>>;
    const ordered = rawArr
      .map((r) => ({
        rank: r['rank'] as number,
        horse_id: String(r['horse_id']),
        horse_name: String(r['horse_name']),
        finish_time: r['finish_time'] as number | undefined,
      }))
      .sort((a, b) => a.rank - b.rank);

    const standings = ordered.map(r => ({ horse_id: r.horse_id, final_rank: r.rank }));
    const prizeSplits = race.prize_split;

    const settlement = call(
      session, 'settle_bets', activeBets, standings, race.prize_pool, prizeSplits
    ) as Record<string, unknown>;

    const betPayout = (settlement['bet_payout'] as number) ?? 0;
    const horseEarnings = (settlement['horse_earnings'] as Record<string, number>) ?? {};

    // Enrich participants with Lua-determined final_rank and finish_time
    const enriched: RaceParticipant[] = race.participants.map(p => {
      const r = ordered.find(o => o.horse_id === p.horse.id);
      return { ...p, final_rank: r?.rank, finish_time: r?.finish_time };
    });

    const prizeEarningsTotal = race.participants
      .filter(p => p.horse.player_owned)
      .reduce((s, p) => s + (horseEarnings[p.horse.id] ?? 0), 0);
    const totalBetsDeducted = activeBets.reduce((s, b) => s + b.amount, 0);
    const net = betPayout - totalBetsDeducted + prizeEarningsTotal;

    setSimulated(true);
    onStartRace(enriched, activeBets, net);
  }, [race, betEntries, session, getPlaceOdds, getShowOdds, onStartRace]);

  const [selectedHorseId, setSelectedHorseId] = useState<string>('');

  const handleNewRace = useCallback((id?: string) => {
    setBetEntries({});
    setSimulated(false);
    onNewRace((id ?? selectedHorseId) || undefined);
  }, [onNewRace, selectedHorseId]);

  const handleSkipRace = useCallback((id?: string) => {
    setBetEntries({});
    setSimulated(false);
    onSkipRace((id ?? selectedHorseId) || undefined);
  }, [onSkipRace, selectedHorseId]);

  const handleClearBets = useCallback(() => {
    setBetEntries({});
  }, []);

  const playerHorses = horses.filter(h => h.player_owned);
  const starterCost = 400;
  const now = Date.now();

  if (!race) {
    const readyHorses = playerHorses.filter(h => h.cooldown_until < now);
    const restingHorses = playerHorses.filter(h => h.cooldown_until >= now);
    const pickedHorse = playerHorses.find(h => h.id === selectedHorseId) ?? readyHorses[0] ?? playerHorses[0];
    return (
      <div>
        <div className="section-header">
          <h2>Betting Office</h2>
        </div>
        <div className="bet-panel" style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Choose Your Racer</h3>
          {playerHorses.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No horses in stable.</div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {playerHorses.map(h => {
                  const resting = h.cooldown_until >= now;
                  const selected = (selectedHorseId ? h.id === selectedHorseId : h.id === pickedHorse?.id);
                  return (
                    <button
                      key={h.id}
                      onClick={() => setSelectedHorseId(h.id)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.5rem 0.75rem', borderRadius: '6px', cursor: resting ? 'not-allowed' : 'pointer',
                        border: selected ? '2px solid var(--accent)' : '2px solid var(--border)',
                        background: selected ? 'rgba(99,102,241,0.12)' : 'var(--surface2)',
                        opacity: resting ? 0.55 : 1,
                        fontSize: '0.88rem', fontWeight: selected ? 700 : 400,
                      }}
                    >
                      <span>{h.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.78rem' }}>· Gen {h.generation} · {h.gender}</span></span>
                      {resting
                        ? <span style={{ fontSize: '0.75rem', color: 'var(--yellow)' }}>Resting</span>
                        : <span style={{ fontSize: '0.75rem', color: 'var(--green)' }}>Ready</span>}
                    </button>
                  );
                })}
              </div>
              {readyHorses.length === 0 && (
                <div style={{ color: 'var(--yellow)', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                  All horses are resting — you can still race but cooldown applies.
                </div>
              )}
              <button
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={() => handleNewRace(selectedHorseId || pickedHorse?.id)}
              >
                Enter Race with {pickedHorse?.name ?? '…'} →
              </button>
              {restingHorses.length > 0 && readyHorses.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', textAlign: 'center' }}>
                  Greyed horses are on cooldown
                </div>
              )}
            </>
          )}
        </div>
        {playerHorses.length < unlockedSlots && (
          <div className="starter-market">
            <h3>Starter Market</h3>
            <p>Acquire replacement foundation stock to grow your stable.</p>
            <div className="starter-buttons">
              <button className="btn-primary" onClick={() => onPurchaseStarter('Stallion', starterCost)}
                disabled={funds < starterCost}>
                Buy Stallion (${starterCost})
              </button>
              <button className="btn-primary" onClick={() => onPurchaseStarter('Mare', starterCost)}
                disabled={funds < starterCost}>
                Buy Mare (${starterCost})
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const isCompleted = race.status === 'completed' || simulated;

  return (
    <div>
      <div className="section-header">
        <h2>Betting Office</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-neutral" onClick={() => handleSkipRace()}>Skip &amp; New Race</button>
          <button className="btn-neutral" onClick={() => handleNewRace()}>New Race</button>
        </div>
      </div>

      <div className="race-panel">
        <div>
          <div className="race-info">
            <div className="race-title">{race.name}</div>
            <div className="race-sub">{race.description}</div>

            <table className="participants-table">
              <thead>
                <tr>
                  <th>Gate</th>
                  <th>Horse</th>
                  <th>Win</th>
                  <th>Place</th>
                  <th>Show</th>
                  {!isCompleted && <th style={{ textAlign: 'right', minWidth: '200px' }}>Bets (W / P / S)</th>}
                </tr>
              </thead>
              <tbody>
                {race.participants.map(p => {
                  return (
                    <tr key={p.horse.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{p.gate}</td>
                      <td>
                        <span style={{ color: p.horse.color_silk, marginRight: '4px', display: 'inline-flex', verticalAlign: 'middle' }}>
                          <SVGRacer
                            colorBody={p.horse.color_body}
                            colorMane={p.horse.color_mane}
                            colorSocks={p.horse.color_socks}
                            colorJockeySilk={p.horse.color_silk}
                            isRunning={false}
                            size={36}
                          />
                        </span>
                        {p.horse.name}
                        {p.horse.player_owned && <Badge label="You" variant="accent" />}
                      </td>
                      <td><span className="odds-badge">{p.odds.toFixed(1)}x</span></td>
                      <td><span className="odds-badge" style={{ opacity: 0.75 }}>{getPlaceOdds(p.odds).toFixed(2)}x</span></td>
                      <td><span className="odds-badge" style={{ opacity: 0.55 }}>{getShowOdds(p.odds).toFixed(2)}x</span></td>
                      {!isCompleted && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <input type="number" min={0} max={funds} step={10} placeholder="W"
                              value={betEntries[p.horse.id]?.win || ''}
                              onChange={e => handleBetChange(p.horse.id, 'win', Number(e.target.value))}
                              style={{ width: '52px' }} />
                            <input type="number" min={0} max={funds} step={10} placeholder="P"
                              value={betEntries[p.horse.id]?.place || ''}
                              onChange={e => handleBetChange(p.horse.id, 'place', Number(e.target.value))}
                              style={{ width: '52px' }} />
                            <input type="number" min={0} max={funds} step={10} placeholder="S"
                              value={betEntries[p.horse.id]?.show || ''}
                              onChange={e => handleBetChange(p.horse.id, 'show', Number(e.target.value))}
                              style={{ width: '52px' }} />
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {simulated && (
            <div className="race-result-banner" style={{ marginTop: '1rem' }}>
              <strong>Simulation complete — heading to the track…</strong>
            </div>
          )}
        </div>

        {!isCompleted && (
          <div className="bet-panel">
            <h2>Bet Slip</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Available: <strong style={{ color: 'var(--text)' }}>${funds.toLocaleString()}</strong>
            </p>
            {race.participants.filter(p => {
              const e = betEntries[p.horse.id];
              return e && (e.win > 0 || e.place > 0 || e.show > 0);
            }).flatMap(p => {
              const e = betEntries[p.horse.id]!;
              const rows = [];
              if (e.win > 0) rows.push({ horse: p.horse, type: 'Win', amount: e.win, odds: p.odds });
              if (e.place > 0) rows.push({ horse: p.horse, type: 'Place', amount: e.place, odds: getPlaceOdds(p.odds) });
              if (e.show > 0) rows.push({ horse: p.horse, type: 'Show', amount: e.show, odds: getShowOdds(p.odds) });
              return rows;
            }).map((row, i) => (
                <div key={i} className="bet-row">
                  <span className="horse-name-short">{row.horse.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.type}</span>
                  <span className="odds-badge">{row.odds.toFixed(2)}x</span>
                  <span style={{ color: 'var(--yellow)' }}>${row.amount}</span>
                </div>
              ))}
            <button
              className="btn-neutral"
              style={{ marginTop: '0.25rem', width: '100%' }}
              onClick={handleClearBets}
            >
              Clear Bets
            </button>
            <button
              className="btn-primary"
              style={{ marginTop: '0.5rem', width: '100%' }}
              onClick={handleRace}
            >
              Run Race →
            </button>
          </div>
        )}

        {isCompleted && lastRaceNetPayout !== null && (
          <div className="bet-panel">
            <h3 style={{ marginBottom: '0.6rem' }}>Bet Results</h3>
            {lastRaceBets.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No bets placed.</div>
            ) : (
              lastRaceBets.map((b, i) => {
                const p = race.participants.find(x => x.horse.id === b.horse_id);
                const finished = p?.final_rank;
                const won =
                  (b.type === 'Win' && finished === 1) ||
                  (b.type === 'Place' && finished != null && finished <= 2) ||
                  (b.type === 'Show' && finished != null && finished <= 3);
                return (
                  <div key={i} className="bet-row">
                    <span className="horse-name-short">{b.horse_name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.type}</span>
                    <span className="odds-badge">{b.payout_odds.toFixed(2)}x</span>
                    <span style={{ color: 'var(--yellow)' }}>${b.amount}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 700, color: won ? 'var(--green)' : 'var(--red)' }}>
                      {won ? `+$${Math.floor(b.amount * b.payout_odds)}` : '✗'}
                    </span>
                  </div>
                );
              })
            )}
            <div style={{
              marginTop: '0.75rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}>
              <span>Net Payout</span>
              <span style={{ color: lastRaceNetPayout >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {lastRaceNetPayout >= 0 ? '+' : ''}{lastRaceNetPayout.toLocaleString()}
              </span>
            </div>
          </div>
        )}
        {isCompleted && lastRaceNetPayout === null && (
          <div className="bet-panel">
            <h2>Going to Track</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Race is starting…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
