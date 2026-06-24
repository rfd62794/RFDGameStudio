import React, { useState, useCallback } from 'react';
import type { CurrentRace, RaceResult, GameSession, Bet } from '../engine/types';
import { call } from '../engine/runtime';
import RaceTrack from './RaceTrack';

interface Props {
  race: CurrentRace | null;
  funds: number;
  session: GameSession;
  onNewRace: () => void;
  onRaceComplete: (results: RaceResult[], netPayout: number, betsPlaced: Bet[]) => void;
}

interface BetEntry {
  amount: number;
  type: 'Win' | 'Place';
}

export default function BettingTab({ race, funds, session, onNewRace, onRaceComplete }: Props) {
  const [betEntries, setBetEntries] = useState<Record<string, BetEntry>>({});
  const [results, setResults] = useState<RaceResult[] | null>(null);
  const [netPayout, setNetPayout] = useState<number>(0);

  const data = session.files.data as Record<string, unknown>;
  const bettingCfg = (data['betting'] as Record<string, unknown>) ?? {};

  const getPlaceOdds = useCallback((winOdds: number): number => {
    return call(session, 'calculate_place_odds', winOdds, bettingCfg) as number;
  }, [session, bettingCfg]);

  const handleAmountChange = useCallback((horseId: string, amount: number) => {
    setBetEntries(prev => ({
      ...prev,
      [horseId]: { amount: Math.max(0, Math.min(amount, funds)), type: prev[horseId]?.type ?? 'Win' },
    }));
  }, [funds]);

  const handleTypeToggle = useCallback((horseId: string, type: 'Win' | 'Place') => {
    setBetEntries(prev => ({
      ...prev,
      [horseId]: { amount: prev[horseId]?.amount ?? 0, type },
    }));
  }, []);

  const handleRace = useCallback(() => {
    if (!race) return;

    const activeBets: Bet[] = race.participants
      .filter(p => (betEntries[p.horse.id]?.amount ?? 0) > 0)
      .map(p => {
        const entry = betEntries[p.horse.id]!;
        const winOdds = p.odds;
        const payoutOdds = entry.type === 'Place' ? getPlaceOdds(winOdds) : winOdds;
        return {
          horse_id: p.horse.id,
          horse_name: p.horse.name,
          amount: entry.amount,
          type: entry.type,
          payout_odds: payoutOdds,
        };
      });

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

    const ordered = (Array.isArray(simResults) ? simResults : Object.values(simResults))
      .map(r => ({
        rank: r['rank'] as number,
        horse_id: String(r['horse_id']),
        horse_name: String(r['horse_name']),
        finish_time: r['finish_time'] as number,
      }))
      .sort((a, b) => a.rank - b.rank);

    const standings = ordered.map(r => ({ horse_id: r.horse_id, final_rank: r.rank }));
    const prizeSplits = race.prize_split;

    const settlement = call(
      session, 'settle_bets', activeBets, standings, race.prize_pool, prizeSplits
    ) as { bet_payout: number; horse_earnings: Record<string, number> };

    const betPayout = settlement['bet_payout'] as number ?? 0;
    const horseEarnings = settlement['horse_earnings'] as Record<string, number> ?? {};

    const raceResults: RaceResult[] = ordered.map(entry => {
      const participant = race.participants.find(p => p.horse.id === entry.horse_id);
      const horse = participant?.horse;
      const prizeEarnings = horseEarnings[entry.horse_id] ?? 0;
      return {
        rank: entry.rank,
        horse_id: horse?.id ?? entry.horse_id,
        horse_name: horse?.name ?? entry.horse_name,
        player_owned: horse?.player_owned ?? false,
        payout: horse?.player_owned ? prizeEarnings : 0,
      };
    });

    const totalBetsDeducted = activeBets.reduce((s, b) => s + b.amount, 0);
    const net = betPayout - totalBetsDeducted + raceResults.filter(r => r.player_owned).reduce((s, r) => s + r.payout, 0);

    setResults(raceResults);
    setNetPayout(net);
    onRaceComplete(raceResults, net, activeBets);
  }, [race, betEntries, session, getPlaceOdds, onRaceComplete]);

  const handleNewRace = useCallback(() => {
    setBetEntries({});
    setResults(null);
    setNetPayout(0);
    onNewRace();
  }, [onNewRace]);

  if (!race) {
    return (
      <div>
        <div className="section-header">
          <h2>Betting Office</h2>
          <button className="btn-primary" onClick={onNewRace}>Enter New Race</button>
        </div>
        <div className="empty-state">No race scheduled. Enter a race from the Stable tab.</div>
      </div>
    );
  }

  const isCompleted = race.status === 'completed' || results !== null;

  return (
    <div>
      <div className="section-header">
        <h2>Betting Office</h2>
        <button className="btn-neutral" onClick={handleNewRace}>New Race</button>
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
                  {!isCompleted && <th>Type</th>}
                  {!isCompleted && <th style={{ textAlign: 'right' }}>Bet $</th>}
                </tr>
              </thead>
              <tbody>
                {race.participants.map(p => {
                  const entry = betEntries[p.horse.id];
                  const betType = entry?.type ?? 'Win';
                  const placeOdds = getPlaceOdds(p.odds);
                  return (
                    <tr key={p.horse.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{p.gate}</td>
                      <td>
                        <span style={{ color: p.horse.color_silk, marginRight: '4px' }}>●</span>
                        {p.horse.name}
                        {p.horse.player_owned && <span className="badge-player">You</span>}
                      </td>
                      <td><span className="odds-badge">{p.odds.toFixed(1)}x</span></td>
                      <td><span className="odds-badge" style={{ opacity: 0.75 }}>{placeOdds.toFixed(2)}x</span></td>
                      {!isCompleted && (
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              className={`btn-type${betType === 'Win' ? ' active' : ''}`}
                              onClick={() => handleTypeToggle(p.horse.id, 'Win')}
                            >W</button>
                            <button
                              className={`btn-type${betType === 'Place' ? ' active' : ''}`}
                              onClick={() => handleTypeToggle(p.horse.id, 'Place')}
                            >P</button>
                          </div>
                        </td>
                      )}
                      {!isCompleted && (
                        <td style={{ textAlign: 'right' }}>
                          <input
                            type="number"
                            min={0}
                            max={funds}
                            step={10}
                            value={entry?.amount ?? 0}
                            onChange={e => handleAmountChange(p.horse.id, Number(e.target.value))}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {results && (
            <>
              <div className="race-result-banner" style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>Race Complete</strong>
                  <span style={{ color: netPayout >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                    Net: {netPayout >= 0 ? '+' : ''}${netPayout}
                  </span>
                </div>
                <table className="result-table">
                  <thead>
                    <tr><th>Rank</th><th>Horse</th><th>Prize</th></tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <tr key={r.rank}>
                        <td className={`rank-${r.rank}`}>{r.rank}</td>
                        <td>
                          {r.horse_name}
                          {r.player_owned && <span className="badge-player">You</span>}
                        </td>
                        <td className={r.payout > 0 ? 'payout-pos' : ''}>
                          {r.payout > 0 ? `+$${r.payout}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <RaceTrack race={race} results={results} />
            </>
          )}
        </div>

        {!isCompleted && (
          <div className="bet-panel">
            <h2>Bet Slip</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Available: <strong style={{ color: 'var(--text)' }}>${funds.toLocaleString()}</strong>
            </p>
            {race.participants.filter(p => (betEntries[p.horse.id]?.amount ?? 0) > 0).map(p => {
              const entry = betEntries[p.horse.id]!;
              const odds = entry.type === 'Place' ? getPlaceOdds(p.odds) : p.odds;
              return (
                <div key={p.horse.id} className="bet-row">
                  <span className="horse-name-short">{p.horse.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entry.type}</span>
                  <span className="odds-badge">{odds.toFixed(2)}x</span>
                  <span style={{ color: 'var(--yellow)' }}>${entry.amount}</span>
                </div>
              );
            })}
            <button
              className="btn-primary"
              style={{ marginTop: '0.5rem', width: '100%' }}
              onClick={handleRace}
            >
              Run Race →
            </button>
          </div>
        )}

        {isCompleted && (
          <div className="bet-panel">
            <h2>Race Settled</h2>
            <button className="btn-primary" style={{ width: '100%' }} onClick={handleNewRace}>
              Enter New Race
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
