import { useCallback } from 'react';
import { GameShell } from '../../components';
import { useLuaCall, useGameState } from '../../hooks';
import type { GameRendererProps, GameSession } from '../../engine/types';
import type { Part, Chimera, EncounterResult, ChimeraWildsGameState } from './types';
import './styles.css';

const SLOTS = ['head', 'chest', 'left_arm', 'right_arm', 'left_leg', 'right_leg'];

function buildInitialState(session: GameSession): ChimeraWildsGameState {
  const baseline = (session.files.data['baseline_player'] as { power: number; endurance: number })
    ?? { power: 20, endurance: 20 };
  return {
    player: baseline,
    currentChimera: null,
    lastResult: null,
    history: [],
  };
}

function pickRandomParts(partsData: Part[], rng: () => number): Part[] {
  const bySlot: Record<string, Part[]> = {};
  for (const part of partsData) {
    (bySlot[part.slot] ??= []).push(part);
  }
  return SLOTS.map(slot => {
    const opts = bySlot[slot];
    const index = Math.floor(rng() * opts.length);
    return opts[index];
  });
}

export default function App({ session }: GameRendererProps) {
  const { state, setState, isInitialized } = useGameState(session, buildInitialState);
  const { call, error } = useLuaCall(session);

  const handleEncounter = useCallback(() => {
    if (!state) return;
    const data = session.files.data as Record<string, unknown>;
    const partsData = (data['parts'] as Part[]) ?? [];
    const selectedParts = pickRandomParts(partsData, Math.random);

    const chimera = call('generate_chimera', selectedParts) as Chimera | null;
    if (!chimera) return;

    const roll = Math.floor(Math.random() * 20) + 1;
    const result = call('resolve_encounter', state.player.power, state.player.endurance, chimera, roll) as {
      won: boolean;
      score: number;
      chimera_score: number;
    } | null;
    if (!result) return;

    const encounter: EncounterResult = {
      won: result.won,
      score: result.score,
      chimera_score: result.chimera_score,
      roll,
      chimera,
    };

    setState(prev => prev ? {
      ...prev,
      currentChimera: chimera,
      lastResult: encounter,
      history: [encounter, ...prev.history],
    } : prev);
  }, [state, call, session, setState]);

  if (!isInitialized || !state) {
    return <div className="cw-loading">Loading Chimera Wilds…</div>;
  }

  return (
    <GameShell
      header={
        <div className="cw-header">
          <span className="cw-title">CHIMERA WILDS</span>
          <span className="cw-player">Player {state.player.power} PWR / {state.player.endurance} END</span>
          {error && <span className="cw-error">{error}</span>}
        </div>
      }
      footer={
        <div className="cw-footer">
          One-roll encounter. Each chimera is assembled from six real Mutant Battle Ball parts.
        </div>
      }
    >
      <div className="cw-main">
        <div className="cw-panel">
          <h2>Current Chimera</h2>
          {state.currentChimera ? (
            <>
              <ul className="cw-parts">
                {Object.entries(state.currentChimera.parts).map(([slot, part]) => (
                  <li key={slot}>
                    <strong>{slot}:</strong> {part.name}
                  </li>
                ))}
              </ul>
              <div className="cw-stats">
                <span>Power: {state.currentChimera.total_power}</span>
                <span>Endurance: {state.currentChimera.total_endurance}</span>
                <span>Score: {state.currentChimera.total_power + state.currentChimera.total_endurance}</span>
              </div>
            </>
          ) : (
            <p>No chimera yet. Press the button to face the wilds.</p>
          )}
        </div>

        <div className="cw-panel">
          <h2>Encounter</h2>
          <button className="cw-button" onClick={handleEncounter}>Face the Wilds</button>
          {state.lastResult && (
            <div className="cw-result">
              <span className={`cw-badge ${state.lastResult.won ? 'cw-win' : 'cw-loss'}`}>
                {state.lastResult.won ? 'WIN' : 'LOSS'}
              </span>
              <p>Player roll: {state.lastResult.roll} → total {state.lastResult.score}</p>
              <p>Chimera score: {state.lastResult.chimera_score}</p>
            </div>
          )}
        </div>

        {state.history.length > 0 && (
          <div className="cw-panel cw-history">
            <h2>History</h2>
            <ul>
              {state.history.map((entry, index) => (
                <li key={index} className={entry.won ? 'cw-win' : 'cw-loss'}>
                  {entry.won ? 'Win' : 'Loss'} — roll {entry.roll} vs chimera {entry.chimera_score}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </GameShell>
  );
}
