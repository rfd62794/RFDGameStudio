import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Coins } from 'lucide-react';
import { loadGame, call, getSchema } from './engine/runtime';
import type { GameSession, GameState, Horse, CurrentRace, RaceHistoryEntry, RaceResult, Bet, RaceParticipant } from './engine/types';
import { RuntimeError } from './engine/types';
import StableTab from './components/StableTab';
import BettingTab from './components/BettingTab';
import BreederTab from './components/BreederTab';
import RaceTrack from './components/RaceTrack';

const SEED = 42;
const GAME_ID = 'horse_racing';
const SAVE_KEY = 'derby_sim_state_v1';

const safeGetStorage = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const safeSetStorage = (key: string, value: string): void => {
  try { localStorage.setItem(key, value); } catch { }
};

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
  const funds = (stable['starting_funds'] as number) ?? 1000;
  const starterHorses = data['starter_horses'] as Array<Record<string, unknown>>;
  const horses: Horse[] = (starterHorses ?? []).map(h => luaHorseToTs(h));
  return { funds, horses, current_race: null, race_history: [], emergency_grant_shown: false };
}

function buildRace(session: GameSession, playerHorses: Horse[]): CurrentRace | null {
  const data = session.files.data as Record<string, unknown>;
  const playerHorse = playerHorses[0];
  if (!playerHorse) return null;

  const result = call(session, 'create_race', playerHorse, data) as unknown;
  const resultArr = Array.isArray(result) ? result : [result, null];
  const raceObj = resultArr[0] as Record<string, unknown> | null;
  const errMsg = resultArr[1] as string | null;

  if (!raceObj || errMsg) {
    console.warn('create_race error:', errMsg);
    return null;
  }

  const rawParticipants = Object.values(
    raceObj['participants'] as Record<string, unknown>
  ) as Array<Record<string, unknown>>;

  const participants = rawParticipants.map((p, i) => ({
    horse: luaHorseToTs({
      ...(p['horse'] as Record<string, unknown>),
      player_owned: i === 0,
    }),
    gate: (p['gate'] as number) ?? i + 1,
    odds: (p['odds'] as number) ?? 4.0,
    progress: 0,
    current_distance: 0,
    current_speed: 0,
    energy: 100,
    is_finished: false,
  }));

  return {
    id: raceObj['id'] as string,
    name: raceObj['name'] as string,
    description: raceObj['description'] as string,
    distance: raceObj['distance'] as number,
    race_class: raceObj['race_class'] as string,
    prize_pool: raceObj['prize_pool'] as number,
    prize_split: Object.values(raceObj['prize_split'] as Record<string, number>),
    participants,
    status: 'scheduled',
  };
}

export default function App() {
  const [session, setSession] = useState<GameSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [activeTab, setActiveTab] = useState<string>('stable');
  const [isRacingActive, setIsRacingActive] = useState(false);
  const [pendingBets, setPendingBets] = useState<Bet[]>([]);
  const [pendingNetPayout, setPendingNetPayout] = useState(0);
  const [lastRaceNetPayout, setLastRaceNetPayout] = useState<number | null>(null);
  const [lastRaceBets, setLastRaceBets] = useState<Bet[]>([]);
  const [unlockedSlots, setUnlockedSlots] = useState(3);
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTicker(prev => prev + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    try {
      const s = loadGame(GAME_ID, SEED);
      setSession(s);
      const stableCfg = (s.files.data as Record<string, unknown>)['stable'] as Record<string, unknown>;
      const defaultSlots = (stableCfg['starting_slots'] as number) ?? 3;

      const saved = safeGetStorage(SAVE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as {
            funds: number;
            horses: Horse[];
            race_history: RaceHistoryEntry[];
            unlocked_slots: number;
          };
          if (Array.isArray(parsed.horses) && parsed.horses.length > 0) {
            setUnlockedSlots(parsed.unlocked_slots ?? defaultSlots);
            setGameState({
              funds: parsed.funds,
              horses: parsed.horses,
              current_race: null,
              race_history: parsed.race_history ?? [],
              emergency_grant_shown: false,
            });
            return;
          }
        } catch {
          // invalid save — fall through
        }
      }
      setUnlockedSlots(defaultSlots);
      setGameState(buildInitialState(s));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    if (!gameState) return;
    safeSetStorage(SAVE_KEY, JSON.stringify({
      funds: gameState.funds,
      horses: gameState.horses,
      race_history: gameState.race_history,
      unlocked_slots: unlockedSlots,
    }));
  }, [gameState, unlockedSlots]);

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

  const handleSkipRace = useCallback(() => {
    if (!session || !gameState) return;
    try {
      const race = buildRace(session, gameState.horses);
      setGameState(prev => prev ? { ...prev, current_race: race } : prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [session, gameState]);

  const handleStartRace = useCallback((enrichedParticipants: RaceParticipant[], bets: Bet[], netPayout: number) => {
    if (!gameState) return;
    setGameState(prev => {
      if (!prev || !prev.current_race) return prev;
      return { ...prev, current_race: { ...prev.current_race, participants: enrichedParticipants } };
    });
    setPendingBets(bets);
    setPendingNetPayout(netPayout);
    setIsRacingActive(true);
  }, [gameState]);

  const handleRaceComplete = useCallback((results: RaceResult[], netPayout: number, _betsPlaced: Bet[]) => {
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
      let next = {
        ...prev,
        funds: prev.funds + netPayout,
        horses: updatedHorses,
        current_race: { ...race, status: 'completed' as const, results },
        race_history: [entry, ...prev.race_history],
      };
      if (next.funds < 50 && next.horses.filter(h => h.player_owned).length === 0) {
        next = { ...next, funds: next.funds + 250, emergency_grant_shown: true };
      }
      return next;
    });
  }, [session, gameState]);

  const handleCloseRaceTrack = useCallback((_results: RaceResult[]) => {
    setLastRaceNetPayout(pendingNetPayout);
    setLastRaceBets(pendingBets);
    handleRaceComplete(_results, pendingNetPayout, pendingBets);
    setIsRacingActive(false);
    setPendingBets([]);
    setPendingNetPayout(0);
    setActiveTab('betting');
  }, [handleRaceComplete, pendingNetPayout, pendingBets]);

  const handleRenameHorse = useCallback((id: string, newName: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        horses: prev.horses.map(h => h.id === id ? { ...h, name: newName.trim() } : h),
      };
    });
  }, []);

  const handleSellHorse = useCallback((id: string) => {
    if (!session || !gameState) return;
    const horse = gameState.horses.find(h => h.id === id);
    if (!horse) return;
    const price = call(session, 'calculate_horse_price', horse) as number;
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        funds: prev.funds + price,
        horses: prev.horses.filter(h => h.id !== id),
      };
    });
  }, [session, gameState]);

  const handlePurchaseStarter = useCallback((gender: 'Stallion' | 'Mare', price: number) => {
    if (!session || !gameState) return;
    const data = session.files.data as Record<string, unknown>;
    const stable = (data['stable'] as Record<string, unknown>) ?? {};
    const minStat = (stable['starter_min_stat'] as number) ?? 35;
    const maxStat = (stable['starter_max_stat'] as number) ?? 55;
    const prefixes = data['name_prefixes'];
    const suffixes = data['name_suffixes'];
    const coatColors = data['coat_colors'];
    const silkColors = data['silk_colors'];
    const options = { min_stat: minStat, max_stat: maxStat, generation: 1, player_owned: true, gender };
    const raw = call(session, 'generate_horse', options, coatColors, silkColors, prefixes, suffixes) as Record<string, unknown>;
    const horse = luaHorseToTs({ ...raw, player_owned: true, id: `horse_${Date.now()}` });
    setGameState(prev => {
      if (!prev) return prev;
      return { ...prev, funds: prev.funds - price, horses: [...prev.horses, horse] };
    });
  }, [session, gameState]);

  const handleAddOffspring = useCallback((foal: Horse, cost: number) => {
    if (!session || !gameState) return;
    const data = session.files.data as Record<string, unknown>;
    const stableCfg = (data['stable'] as Record<string, unknown>) ?? {};
    const breedCooldownMs = (stableCfg['breed_cooldown_ms'] as number) ?? 180000;
    const cooldownUntil = Date.now() + breedCooldownMs;
    setGameState(prev => {
      if (!prev) return prev;
      const foalWithId = { ...foal, id: `horse_${Date.now()}`, cooldown_until: cooldownUntil };
      return {
        ...prev,
        funds: prev.funds - cost,
        horses: [...prev.horses, foalWithId],
      };
    });
  }, [session, gameState]);

  const handleUnlockSlot = useCallback(() => {
    if (!session || !gameState) return;
    const data = session.files.data as Record<string, unknown>;
    const stableCfg = (data['stable'] as Record<string, unknown>) ?? {};
    const maxSlots = (stableCfg['max_slots'] as number) ?? 12;
    const unlockCost = (stableCfg['unlock_cost_per_slot'] as number) ?? 500;
    const canResult = call(session, 'can_unlock_slot', unlockedSlots, maxSlots, gameState.funds, unlockCost) as unknown;
    const resultArr = Array.isArray(canResult) ? canResult : [canResult, null];
    const ok = resultArr[0] as boolean;
    const reason = resultArr[1] as string | null;
    if (!ok) {
      setError(reason ?? 'Cannot unlock slot');
      return;
    }
    setUnlockedSlots(prev => prev + 1);
    setGameState(prev => prev ? { ...prev, funds: prev.funds - unlockCost } : prev);
  }, [session, gameState, unlockedSlots]);

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

  if (isRacingActive && gameState.current_race) {
    return (
      <RaceTrack
        race={gameState.current_race}
        bets={pendingBets}
        onRaceFinish={handleCloseRaceTrack}
        onClose={() => {
          setIsRacingActive(false);
          setActiveTab('stable');
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header-styled">
        <div className="header-brand">
          <div className="header-logo"><Trophy size={18} /></div>
          <div>
            <div className="header-title">DERBY SIM <span className="header-version">v1.2</span></div>
            <div className="header-subtitle">CHAMPIONSHIP SEASON • RACING &amp; BREEDING</div>
          </div>
        </div>

        {!isRacingActive && (
          <nav className="header-tabs">
            {tabs.map(t => (
              <button key={t['id'] as string}
                className={`header-tab-btn${activeTab === t['id'] ? ' active' : ''}`}
                onClick={() => setActiveTab(t['id'] as string)}>
                {t['label'] as string}
              </button>
            ))}
          </nav>
        )}

        <div className="header-bank">
          <div className="bank-icon"><Coins size={14} /></div>
          <div>
            <div className="bank-label">STABLE BANK</div>
            <div className="bank-amount">${gameState.funds.toLocaleString()}</div>
          </div>
        </div>
      </header>

      {!isRacingActive && (
        <div className="mobile-tab-bar">
          {tabs.map(t => (
            <button key={t['id'] as string}
              className={`mobile-tab-btn${activeTab === t['id'] ? ' active' : ''}`}
              onClick={() => setActiveTab(t['id'] as string)}>
              {t['label'] as string}
            </button>
          ))}
        </div>
      )}

      <main className="tab-content">
        {schemaErr && <div className="error-box" style={{ marginBottom: '1rem' }}>{schemaErr}</div>}

        {gameState.emergency_grant_shown && (
          <div className="emergency-grant-banner">
            You're broke and horseless. Here's $250. Don't waste it.
            <button
              className="btn-dismiss"
              onClick={() => setGameState(prev => prev ? { ...prev, emergency_grant_shown: false } : prev)}
            >
              ✕
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'stable' && (
              <StableTab
                horses={gameState.horses}
                session={session}
                funds={gameState.funds}
                unlockedSlots={unlockedSlots}
                ticker={ticker}
                onNewRace={handleNewRace}
                onUnlockSlot={handleUnlockSlot}
                onRenameHorse={handleRenameHorse}
                onSellHorse={handleSellHorse}
              />
            )}
            {activeTab === 'betting' && (
              <BettingTab
                race={gameState.current_race}
                funds={gameState.funds}
                horses={gameState.horses}
                unlockedSlots={unlockedSlots}
                lastRaceNetPayout={lastRaceNetPayout}
                lastRaceBets={lastRaceBets}
                onNewRace={() => { setLastRaceNetPayout(null); setLastRaceBets([]); handleNewRace(); }}
                onSkipRace={() => { setLastRaceNetPayout(null); setLastRaceBets([]); handleSkipRace(); }}
                onStartRace={handleStartRace}
                onPurchaseStarter={handlePurchaseStarter}
                session={session}
              />
            )}
            {activeTab === 'history' && (
              <div>
                <h2 style={{ marginBottom: '1rem' }}>Race History</h2>
                {gameState.race_history.length === 0
                  ? <div className="empty-state">No races completed yet.</div>
                  : gameState.race_history.map((entry, i) => (
                    <div key={i} className="history-card">
                      <div className="history-card-header">
                        <div>
                          <span className="history-race-name">{entry.race_name}</span>
                          <span className="history-distance-badge">{entry.distance}m</span>
                        </div>
                        <span className="history-purse">Purse: ${entry.prize_pool}</span>
                      </div>
                      <div className="history-standings">
                        {entry.results.slice(0, 3).map(r => (
                          <div key={r.rank} className="history-standing-row">
                            <span className={`rank-badge rank-${r.rank}`}>#{r.rank}</span>
                            <span className="history-horse-name">{r.horse_name}</span>
                            {r.player_owned && <span className="badge-player">You</span>}
                            {r.payout > 0 && <span className="history-payout">+${r.payout}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
            {activeTab === 'breed' && (
              <BreederTab
                horses={gameState.horses}
                session={session}
                funds={gameState.funds}
                onAddOffspring={handleAddOffspring}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="app-footer">
        <span className="footer-copy">© 2026 DERBY SIMULATOR. ALL RIGHTS RESERVED.</span>
        <div className="footer-links">
          <span>GAME RULES</span>
          <span className="footer-sep">•</span>
          <span>PEDIGREE GENETICS DATA</span>
        </div>
      </footer>
    </div>
  );
}
