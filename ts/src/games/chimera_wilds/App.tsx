import { useCallback, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { GameShell } from '../../components';
import { useLuaCall, useGameState } from '../../hooks';
import { navigateTo } from '../../arcade/routing';
import { MoreGamesByMe, Modal, StatBar, useOnboardingGate } from '../../ui/components';
import { TitleScreen } from '../../ui/components/TitleScreen';
import { STANDALONE_BUILD_GAMES } from '../../games/registry';
import { PaperDoll } from '../../engine/paperDoll';
import { loadSave, writeSave } from '../../engine/shared/persistence';
import { sound } from './utils/sound';
import type { GameRendererProps, GameSession } from '../../engine/types';
import type { Part, Chimera, EncounterResult, ChimeraWildsGameState } from './types';
import './styles.css';

const SLOTS = ['head', 'chest', 'left_arm', 'right_arm', 'left_leg', 'right_leg'];
const TUTORIAL_SEEN_KEY = 'chimera_wilds_tutorial_seen';

function buildInitialState(session: GameSession): ChimeraWildsGameState {
  const baseline = (session.files.data['baseline_player'] as { power: number; endurance: number })
    ?? { power: 90, endurance: 85 };
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
  const env = import.meta.env as Record<string, string | undefined>;
  const mode = env.VITE_STANDALONE === 'true' ? 'standalone' : 'arcade';
  const arcadeBaseUrl = env.VITE_ARCADE_BASE_URL;
  const [showTitle, setShowTitle] = useState(true);
  const { shouldShow: showTutorial, handleComplete: completeTutorial, trigger: triggerTutorial } =
    useOnboardingGate({ mode: 'boolean', initialShow: false });
  const [soundMuted, setSoundMuted] = useState(!sound.isSoundEnabled());

  const handleNewGame = useCallback(() => {
    setShowTitle(false);
    if (!loadSave<boolean>(TUTORIAL_SEEN_KEY)) {
      triggerTutorial();
    }
  }, [triggerTutorial]);

  const handleDismissTutorial = useCallback(() => {
    writeSave(TUTORIAL_SEEN_KEY, true);
    completeTutorial();
  }, [completeTutorial]);

  const toggleSound = useCallback(() => {
    setSoundMuted(prev => {
      sound.setEnabled(prev);
      return !prev;
    });
  }, []);

  const handleEncounter = useCallback(() => {
    if (!state) return;
    const data = session.files.data as Record<string, unknown>;
    const partsData = (data['parts'] as Part[]) ?? [];
    const selectedParts = pickRandomParts(partsData, Math.random);

    const chimera = call('generate_chimera', selectedParts) as Chimera | null;
    if (!chimera) return;

    sound.playRoll();
    const roll = Math.floor(Math.random() * 20) + 1;
    const result = call('resolve_encounter', state.player.power, state.player.endurance, chimera, roll) as {
      won: boolean;
      score: number;
      chimera_score: number;
    } | null;
    if (!result) return;

    if (result.won) sound.playWin();
    else sound.playLoss();

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

  if (showTitle) {
    return (
      <GameShell
        gameLabel="CHIMERA WILDS"
        gameId="chimera_wilds"
        mode={mode}
        arcadeBaseUrl={arcadeBaseUrl}
        footer={
          <MoreGamesByMe
            mode={mode}
            currentGameId="chimera_wilds"
            games={STANDALONE_BUILD_GAMES}
            onSelectGame={navigateTo}
            arcadeBaseUrl={arcadeBaseUrl}
          />
        }
      >
        <TitleScreen
          title="Chimera Wilds"
          tagline="One-roll D20 encounters"
          pitch="Face a single randomly-assembled six-part enemy in a one-roll D20 encounter."
          menuItems={[
            { id: 'new-game', label: 'New Game', variant: 'primary', onClick: handleNewGame },
          ]}
        />
      </GameShell>
    );
  }

  if (!isInitialized || !state) {
    return (
      <GameShell
        gameLabel="CHIMERA WILDS"
        gameId="chimera_wilds"
        mode={mode}
        arcadeBaseUrl={arcadeBaseUrl}
        footer={
          <MoreGamesByMe
            mode={mode}
            currentGameId="chimera_wilds"
            games={STANDALONE_BUILD_GAMES}
            onSelectGame={navigateTo}
            arcadeBaseUrl={arcadeBaseUrl}
          />
        }
      >
        <div className="game-loading cw-loading">Loading Chimera Wilds…</div>
      </GameShell>
    );
  }

  const wins = state.history.filter(e => e.won).length;
  const losses = state.history.length - wins;

  return (
    <GameShell
      gameLabel="CHIMERA WILDS"
      gameId="chimera_wilds"
      statusArea={
        <div className="cw-header">
          <div className="cw-hud">
            <span className="cw-chip">PWR {state.player.power}</span>
            <span className="cw-chip">END {state.player.endurance}</span>
            <span className="cw-chip cw-chip-record">Record {wins}W – {losses}L</span>
          </div>
          <button
            type="button"
            className="cw-sound-toggle"
            onClick={toggleSound}
            aria-label={soundMuted ? 'Unmute sound' : 'Mute sound'}
          >
            {soundMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          {error && <span className="cw-error">{error}</span>}
        </div>
      }
      footer={
        <MoreGamesByMe
          mode={mode}
          currentGameId="chimera_wilds"
          games={STANDALONE_BUILD_GAMES}
          onSelectGame={navigateTo}
          arcadeBaseUrl={arcadeBaseUrl}
        />
      }
    >
      <div className="cw-main">
        <div className="cw-panel">
          <h2>Current Chimera</h2>
          {state.currentChimera ? (
            <>
              <PaperDoll
                parts={state.currentChimera.parts}
                color="#ef4444"
                size={120}
                archetype="quadruped"
              />
              <ul className="cw-parts">
                {Object.entries(state.currentChimera.parts).map(([slot, part]) => (
                  <li key={slot}>
                    <strong>{slot}:</strong> {part.name}
                  </li>
                ))}
              </ul>
              <div className="cw-stats">
                <StatBar label="Power" value={state.currentChimera.total_power} max={120} />
                <StatBar label="Endurance" value={state.currentChimera.total_endurance} max={120} />
                <span className="cw-chip cw-chip-score">
                  Score {state.currentChimera.total_power + state.currentChimera.total_endurance}
                </span>
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

      {showTutorial && (
        <Modal title="How to Play" onClose={handleDismissTutorial} showClose={false}>
          <ul className="cw-tutorial">
            <li>Each press of Face the Wilds assembles a random six-part chimera.</li>
            <li>You roll a D20 — your Power + Endurance + the roll, against the chimera's combined total.</li>
            <li>Meet or beat its score to win; the parts list shows where that score comes from.</li>
            <li>Every result lands in your History below.</li>
          </ul>
          <button className="cw-button cw-tutorial-dismiss" onClick={handleDismissTutorial}>
            Enter the Wilds
          </button>
        </Modal>
      )}
    </GameShell>
  );
}
