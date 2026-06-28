import React, { useState, useCallback, useEffect } from 'react';
import { GameShell } from '../../components';
import { useLuaCall, useGameLoop, useGameState } from '../../hooks';
import type { GameRendererProps } from '../../engine/types';
import type { SlimeCoinGameState, SlimeCoinInput, SlimeCoinRenderState } from './types';
import BoardCanvas from './components/BoardCanvas';
import CardSelectModal from './components/CardSelectModal';
import PocketPicker from './components/PocketPicker';
import './styles.css';

function buildInitialState(session: unknown): SlimeCoinGameState {
  const data = (session as { files: { data: Record<string, unknown> } }).files.data;
  const roundConfig = data['round_config'] as Record<string, unknown>;
  
  return {
    phase: 'playing',
    round: 1,
    total_rounds: (roundConfig?.['total_rounds'] as number) ?? 15,
    score: 0,
    target_score: 100,
    score_rate: 1.0,
    hand_in: (roundConfig?.['base_hand_in'] as number) ?? 10,
    max_hand_in: (roundConfig?.['base_hand_in'] as number) ?? 10,
    pocket_coin_type: null,
    pusher_phase: 0.0,
    pusher_speed: 1.0,
    shelf_coins: [],
    floor_coins: [],
    obstacles: [],
    owned_chips: [],
    pocket_coins: {
      boom: 1,
      pull: 1,
      echo: 1,
      giga: 0,
    },
    active_modifiers: [],
    combo_count: 0,
    combo_timer: 0,
    last_score_time: 0,
    offered_cards: [],
    selected_card: null,
  };
}

export default function App({ session }: GameRendererProps) {
  const { state, setState, isInitialized } = useGameState(session, buildInitialState);
  const { call } = useLuaCall(session);
  
  const [renderState, setRenderState] = useState<SlimeCoinRenderState | null>(null);
  const [input, setInput] = useState<SlimeCoinInput>({ fire: false, side: 'right' });
  const [showPocketPicker, setShowPocketPicker] = useState(false);
  
  // Initialize game
  useEffect(() => {
    if (isInitialized && state) {
      call('init_game', {});
    }
  }, [isInitialized, state, call]);
  
  // Game loop
  const tick = useCallback((dt: number) => {
    if (!state || state.phase !== 'playing') return;

    const currentInput = input;

    // Reset fire immediately so it only fires once per keypress
    if (currentInput.fire) {
      setInput(prev => ({ ...prev, fire: false }));
    }

    const result = call('tick_game', dt, currentInput) as SlimeCoinRenderState;
    if (result) {
      setRenderState(result);

      // Check for phase transition
      if (result.phase === 'card_select') {
        setState(prev => prev ? { ...prev, phase: 'card_select', offered_cards: result.offered_cards ?? [] } : prev);
      } else if (result.phase === 'run_end') {
        setState(prev => prev ? { ...prev, phase: 'run_end' } : prev);
      }
    }
  }, [state, input, call, setState]);
  
  useGameLoop(tick);
  
  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!state || state.phase !== 'playing') return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          // Left arrow fires from RIGHT shooter, coin travels LEFT
          setInput({ fire: true, side: 'left', pocket_coin_type: state.pocket_coin_type ?? undefined });
          break;
        case 'ArrowRight':
          e.preventDefault();
          // Right arrow fires from LEFT shooter, coin travels RIGHT
          setInput({ fire: true, side: 'right', pocket_coin_type: state.pocket_coin_type ?? undefined });
          break;
        case 'p':
        case 'P':
          setShowPocketPicker(true);
          break;
        case 'Escape':
          setShowPocketPicker(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state]);
  
  const handleSelectCard = useCallback((cardId: string) => {
    call('select_card', cardId);
    setState(prev => prev ? { ...prev, selected_card: cardId } : prev);
  }, [call, setState]);
  
  const handleSelectPocketCoin = useCallback((coinType: string) => {
    setState(prev => prev ? { ...prev, pocket_coin_type: coinType } : prev);
    setShowPocketPicker(false);
  }, [setState]);
  
  const handleRestart = useCallback(() => {
    call('init_game', {});
    setState(buildInitialState(session));
    setRenderState(null);
  }, [call, session, setState]);
  
  if (!isInitialized || !state) {
    return <div className="sc-loading">Loading SlimeCoin…</div>;
  }
  
  return (
    <GameShell
      header={
        <div className="sc-header">
          <span className="sc-round">Round {state.round}/{state.total_rounds}</span>
          <span className="sc-score">{state.score} / {state.target_score}</span>
          <span className="sc-rate">×{state.score_rate.toFixed(1)}</span>
          <span className="sc-hand">Hand: {state.hand_in}</span>
        </div>
      }
    >
      <div className="sc-main">
        <BoardCanvas
          renderState={renderState}
        />
      </div>
      
      {state.phase === 'card_select' && state.offered_cards.length > 0 && (
        <CardSelectModal
          cards={state.offered_cards}
          onSelect={handleSelectCard}
        />
      )}
      
      {showPocketPicker && (
        <PocketPicker
          pocketCoins={state.pocket_coins}
          onSelect={handleSelectPocketCoin}
          onClose={() => setShowPocketPicker(false)}
        />
      )}
      
      {state.phase === 'run_end' && (
        <div className="sc-run-end">
          <h2>Run Complete</h2>
          <p>Final Score: {state.score}</p>
          <button onClick={handleRestart}>New Run</button>
        </div>
      )}
      
      <div className="sc-footer">
        <span>← Right shooter fires left | → Left shooter fires right | P: Pocket Coins</span>
      </div>
    </GameShell>
  );
}
