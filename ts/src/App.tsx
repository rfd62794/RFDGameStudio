import React, { useEffect, useState, useCallback } from 'react';
import { loadGame, call, getSchema } from './engine/runtime';
import type { GameSession, GameState, Horse, CurrentRace, RaceHistoryEntry, RaceResult, Bet } from './engine/types';
import { RuntimeError } from './engine/types';
import StableTab from './components/StableTab';
import BettingTab from './components/BettingTab';
import BreederTab from './components/BreederTab';

const SEED = 42;
const GAME_ID = 'horse_racing';

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
    player_owned: (raw['player_owned'] as boolean) ?? false,
    price: (raw['price'] as number) ?? 0,
  };
}

function buildInitialState(session: GameSession): GameState {
  const data = session.files.data as Record<string, unknown>;
  const stable = data['stable'] as Record<string, unknown>;
  const funds = (stable['starting_funds'] as number) ?? 3000;

  const prefixes = data['name_prefixes'];
  const suffixes = data['name_suffixes'];
  const coatColors = data['coat_colors'];
  const silkColors = data['silk_colors'];
  const options = { min_stat: 30, max_stat: 70, generation: 1, player_owned: true };

  const horses: Horse[] = [];
  for (let i = 0; i < 3; i++) {
    const raw = call(session, 'generate_horse', options, coatColors, silkColors, prefixes, suffixes) as Record<string, unknown>;
    horses.push(luaHorseToTs({ ...raw, player_owned: true }));
  }
  return { funds, horses, current_race: null, race_history: [] };
}

function buildRace(session: GameSession, playerHorses: Horse[]): CurrentRace {
  const data = session.files.data as Record<string, unknown>;
  const prefixes = data['name_prefixes'];
  const suffixes = data['name_suffixes'];
  const coatColors = data['coat_colors'];
  const silkColors = data['silk_colors'];
  const raceClasses = data['race_classes'] as Array<Record<string, unknown>>;
  const distances = data['race_distances'] as Array<Record<string, unknown>>;
  const venues = data['race_venues'] as string[];
  const types = data['race_types'] as string[];

  const distEntry = distances[Math.floor(Math.random() * distances.length)] as Record<string, unknown>;
  const distance = distEntry['meters'] as number;
  const raceClass = raceClasses[Math.floor(Math.random() * raceClasses.length)] as Record<string, unknown>;
  const prizePool = raceClass['prize_pool'] as number;
  const prizeSplit = raceClass['prize_split'] as number[];
  const venue = venues[Math.floor(Math.random() * venues.length)];
  const type = types[Math.floor(Math.random() * types.length)];

  const participants: CurrentRace['participants'] = [];

  for (const h of playerHorses.slice(0, 1)) {
    participants.push({ horse: h, gate: participants.length + 1, odds: 0, progress: 0, current_distance: 0, current_speed: 0, energy: 100, is_finished: false });
  }

  const npcOptions = { min_stat: 25, max_stat: 65, generation: 1, player_owned: false };
  while (participants.length < 6) {
    const raw = call(session, 'generate_horse', npcOptions, coatColors, silkColors, prefixes, suffixes) as Record<string, unknown>;
    const npc = luaHorseToTs(raw);
    participants.push({ horse: npc, gate: participants.length + 1, odds: 0, progress: 0, current_distance: 0, current_speed: 0, energy: 100, is_finished: false });
  }

  const horseList = participants.map(p => ({
    speed: p.horse.speed, stamina: p.horse.stamina,
    acceleration: p.horse.acceleration, temperament: p.horse.temperament,
  }));
  const oddsRaw = call(session, 'calculate_odds', horseList, distance) as Record<number, number> | number[];
  const oddsArr = Array.isArray(oddsRaw) ? oddsRaw : Object.values(oddsRaw);
  participants.forEach((p, i) => { p.odds = (oddsArr[i] as number) ?? 4.0; });

  return {
    id: `race_${Date.now()}`,
    name: `${venue} ${type}`,
    description: `${raceClass['name']} · ${distance}m · Prize $${prizePool}`,
    distance,
    race_class: raceClass['name'] as string,
    prize_pool: prizePool,
    prize_split: prizeSplit,
    participants,
    status: 'scheduled',
  };
}

export default function App() {
  const [session, setSession] = useState<GameSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [activeTab, setActiveTab] = useState<string>('stable');

  useEffect(() => {
    try {
      const s = loadGame(GAME_ID, SEED);
      setSession(s);
      setGameState(buildInitialState(s));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const handleNewRace = useCallback(() => {
    if (!session || !gameState) return;
    try {
      const race = buildRace(session, gameState.horses);
      setGameState(prev => prev ? { ...prev, current_race: race } : prev);
      setActiveTab('betting');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [session, gameState]);

  const handleRaceComplete = useCallback((results: RaceResult[], netPayout: number, betsPlaced: Bet[]) => {
    if (!session || !gameState || !gameState.current_race) return;
    const race = gameState.current_race;
    const data = session.files.data as Record<string, unknown>;
    const stableCfg = (data['stable'] as Record<string, unknown>) ?? {};
    const raceCooldownMs = (stableCfg['race_cooldown_ms'] as number) ?? 90000;

    const entry: RaceHistoryEntry = {
      race_name: race.name,
      distance: race.distance,
      prize_pool: race.prize_pool,
      results,
      timestamp: Date.now(),
    };
    const cooldownUntil = Date.now() + raceCooldownMs;

    setGameState(prev => {
      if (!prev) return prev;
      const horseEarnings: Record<string, number> = {};
      results.forEach(r => { if (r.player_owned) horseEarnings[r.horse_id] = r.payout; });

      const updatedHorses = prev.horses.map(h => {
        const r = results.find(res => res.horse_id === h.id);
        if (!r) return h;
        const updated = call(session!, 'update_horse_after_race', h, r.rank, horseEarnings[h.id] ?? 0) as Record<string, unknown>;
        return { ...luaHorseToTs(updated), cooldown_until: cooldownUntil };
      });
      return {
        ...prev,
        funds: prev.funds + netPayout,
        horses: updatedHorses,
        current_race: { ...race, status: 'completed', results },
        race_history: [entry, ...prev.race_history],
      };
    });
  }, [session, gameState]);

  const uiLayout = session
    ? (session.files.ui as Record<string, unknown>)['layout'] as Record<string, unknown>
    : null;
  const tabs = uiLayout ? (uiLayout['tabs'] as Array<Record<string, unknown>>) : [];

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div className="error-box">
          <strong>Startup error:</strong> {error}
        </div>
      </div>
    );
  }
  if (!session || !gameState) {
    return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading engine…</div>;
  }

  const schemaErr = (() => {
    try { getSchema(session, 'horse'); return null; }
    catch (e) { return e instanceof RuntimeError ? e.message : null; }
  })();

  return (
    <>
      <header className="app-header">
        <span className="title">
          <strong>{(session.files.data as Record<string, unknown>)['game']
            ? ((session.files.data as Record<string, unknown>)['game'] as Record<string, unknown>)['name'] as string
            : 'Derby Sim'}</strong>
        </span>
        <span className="funds">${gameState.funds.toLocaleString()}</span>
      </header>

      <nav className="tab-bar">
        {tabs.map((t) => (
          <button
            key={t['id'] as string}
            className={`tab-btn${activeTab === t['id'] ? ' active' : ''}`}
            onClick={() => setActiveTab(t['id'] as string)}
          >
            {t['label'] as string}
          </button>
        ))}
      </nav>

      <main className="tab-content">
        {schemaErr && <div className="error-box" style={{ marginBottom: '1rem' }}>{schemaErr}</div>}

        {activeTab === 'stable' && (
          <StableTab
            horses={gameState.horses}
            session={session}
            onNewRace={handleNewRace}
          />
        )}
        {activeTab === 'betting' && (
          <BettingTab
            race={gameState.current_race}
            funds={gameState.funds}
            onNewRace={handleNewRace}
            onRaceComplete={handleRaceComplete}
            session={session}
          />
        )}
        {activeTab === 'history' && (
          <div>
            <h2 style={{ marginBottom: '1rem' }}>Race History</h2>
            {gameState.race_history.length === 0
              ? <div className="empty-state">No races completed yet.</div>
              : gameState.race_history.map((entry, i) => (
                <div key={i} className="race-result-banner" style={{ marginBottom: '1rem' }}>
                  <strong>{entry.race_name}</strong>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                    {entry.distance}m · Prize ${entry.prize_pool}
                  </span>
                  <table className="result-table">
                    <thead><tr><th>Rank</th><th>Horse</th><th>Payout</th></tr></thead>
                    <tbody>
                      {entry.results.map((r) => (
                        <tr key={r.rank}>
                          <td className={`rank-${r.rank}`}>{r.rank}</td>
                          <td>{r.horse_name}{r.player_owned && <span className="badge-player">You</span>}</td>
                          <td className={r.payout > 0 ? 'payout-pos' : 'payout-neg'}>
                            {r.payout > 0 ? `+$${r.payout}` : r.payout === 0 ? '—' : `-$${Math.abs(r.payout)}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            }
          </div>
        )}
        {activeTab === 'breeding' && (
          <div className="empty-state">Breeding — coming in Phase 4.</div>
        )}
      </main>
    </>
  );
}
