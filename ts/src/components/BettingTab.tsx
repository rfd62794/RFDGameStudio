import React, { useState, useCallback } from 'react';
import type { CurrentRace, RaceResult, GameSession } from '../engine/types';
import { call } from '../engine/runtime';
import RaceTrack from './RaceTrack';

interface Props {
  race: CurrentRace | null;
  funds: number;
  session: GameSession;
  onNewRace: () => void;
  onRaceComplete: (results: RaceResult[], netPayout: number) => void;
}

interface Bet {
  horseId: string;
  horseName: string;
  amount: number;
  odds: number;
}

export default function BettingTab({ race, funds, session, onNewRace, onRaceComplete }: Props) {
  const [bets, setBets] = useState<Record<string, number>>({});
  const [results, setResults] = useState<RaceResult[] | null>(null);
  const [netPayout, setNetPayout] = useState<number>(0);

  const handleBetChange = useCallback((horseId: string, amount: number) => {
    setBets(prev => ({ ...prev, [horseId]: Math.max(0, Math.min(amount, funds)) }));
  }, [funds]);

  const handleRace = useCallback(() => {
    if (!race) return;
    const activeBets: Bet[] = race.participants
      .filter(p => (bets[p.horse.id] ?? 0) > 0)
      .map(p => ({ horseId: p.horse.id, horseName: p.horse.name, amount: bets[p.horse.id]!, odds: p.odds }));

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
    const luaConfig = { distance: race.distance };

    const rawResults = call(session, 'simulate_race', luaParticipants, luaConfig) as
      Record<number, Record<string, unknown>>;

    const ordered: Array<{ rank: number; horse_id: string; horse_name: string }> =
      Object.values(rawResults).map(r => ({
        rank: r['rank'] as number,
        horse_id: String(r['horse_id']),
        horse_name: String(r['horse_name']),
      })).sort((a, b) => a.rank - b.rank);

    const raceResults: RaceResult[] = ordered.map(entry => {
      const participant = race.participants.find(p => p.horse.id === entry.horse_id);
      const horse = participant?.horse;
      const { rank, horse_id } = entry;
      const bet = activeBets.find(b => b.horseId === horse_id);
      let payout = 0;
      if (bet) {
        payout = rank === 1 ? Math.round(bet.amount * bet.odds) : -bet.amount;
      }
      const prizeShare = race.prize_split[rank - 1] ?? 0;
      if (horse?.player_owned && rank <= 3) {
        payout += Math.round(race.prize_pool * prizeShare);
      }
      return {
        rank,
        horse_id: horse?.id ?? horse_id,
        horse_name: horse?.name ?? entry.horse_name,
        player_owned: horse?.player_owned ?? false,
        payout,
      };
    });

    const net = raceResults
      .filter(r => r.player_owned || activeBets.some(b => b.horseId === r.horse_id))
      .reduce((sum, r) => sum + r.payout, 0);

    setResults(raceResults);
    setNetPayout(net);
    onRaceComplete(raceResults, net);
  }, [race, bets, session, onRaceComplete]);

  const handleNewRace = useCallback(() => {
    setBets({});
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
                  <th>Odds</th>
                  <th style={{ textAlign: 'right' }}>Bet</th>
                </tr>
              </thead>
              <tbody>
                {race.participants.map(p => (
                  <tr key={p.horse.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{p.gate}</td>
                    <td>
                      <span style={{ color: p.horse.color_silk, marginRight: '4px' }}>●</span>
                      {p.horse.name}
                      {p.horse.player_owned && <span className="badge-player">You</span>}
                    </td>
                    <td><span className="odds-badge">{p.odds.toFixed(1)}x</span></td>
                    <td style={{ textAlign: 'right' }}>
                      {!isCompleted && (
                        <input
                          type="number"
                          min={0}
                          max={funds}
                          step={10}
                          value={bets[p.horse.id] ?? 0}
                          onChange={e => handleBetChange(p.horse.id, Number(e.target.value))}
                        />
                      )}
                      {isCompleted && (bets[p.horse.id] ?? 0) > 0 && (
                        <span style={{ color: 'var(--text-muted)' }}>${bets[p.horse.id]}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {results && (
            <>
              <div className={`race-result-banner`} style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>Race Complete</strong>
                  <span style={{ color: netPayout >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                    Net: {netPayout >= 0 ? '+' : ''}${netPayout}
                  </span>
                </div>
                <table className="result-table">
                  <thead>
                    <tr><th>Rank</th><th>Horse</th><th>Payout</th></tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <tr key={r.rank}>
                        <td className={`rank-${r.rank}`}>{r.rank}</td>
                        <td>
                          {r.horse_name}
                          {r.player_owned && <span className="badge-player">You</span>}
                        </td>
                        <td className={r.payout > 0 ? 'payout-pos' : r.payout < 0 ? 'payout-neg' : ''}>
                          {r.payout > 0 ? `+$${r.payout}` : r.payout < 0 ? `-$${Math.abs(r.payout)}` : '—'}
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
            <h2>Place Bets</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Available: <strong style={{ color: 'var(--text)' }}>${funds.toLocaleString()}</strong>
            </p>
            {race.participants.filter(p => (bets[p.horse.id] ?? 0) > 0).map(p => (
              <div key={p.horse.id} className="bet-row">
                <span className="horse-name-short">{p.horse.name}</span>
                <span className="odds-badge">{p.odds.toFixed(1)}x</span>
                <span style={{ color: 'var(--yellow)' }}>${bets[p.horse.id]}</span>
              </div>
            ))}
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
