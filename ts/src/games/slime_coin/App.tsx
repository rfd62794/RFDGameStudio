import { useState, useCallback, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { GameShell } from '../../components';
import { useLuaCall, useGameLoop, useGameState } from '../../hooks';
import { navigateTo } from '../../arcade/routing';
import { Badge, EndStateScreen, MoreGamesByMe, StatBar } from '../../ui/components';
import { TitleScreen } from '../../ui/components/TitleScreen';
import { useOnboardingGate } from '../../ui/components/OnboardingGate';
import { loadSave, writeSave } from '../../engine/shared/persistence';
import { STANDALONE_BUILD_GAMES } from '../../games/registry';
import type { GameRendererProps } from '../../engine/types';
import type { SlimeCoinGameState, SlimeCoinInput, SlimeCoinRenderState } from './types';
import { sound } from './utils/sound';
import BoardCanvas from './components/BoardCanvas';
import ShopModal from './components/ShopModal';
import PocketPicker from './components/PocketPicker';
import CoinPrimer from './components/CoinPrimer';
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
    tokens: 0,
    shot_queue: [],
    exchanges_used: 0,
  };
}

export default function App({ session }: GameRendererProps) {
  const { state, setState, isInitialized } = useGameState(session, buildInitialState);
  const { call } = useLuaCall(session);
  const env = import.meta.env as Record<string, string | undefined>;
  const mode = env.VITE_STANDALONE === 'true' ? 'standalone' : 'arcade';
  const arcadeBaseUrl = env.VITE_ARCADE_BASE_URL;
  const [showTitle, setShowTitle] = useState(true);
  const [soundMuted, setSoundMuted] = useState(!sound.isSoundEnabled());
  
  const [renderState, setRenderState] = useState<SlimeCoinRenderState | null>(null);
  const [input, setInput] = useState<SlimeCoinInput>({ fire: false, side: 'right' });
  const [showPocketPicker, setShowPocketPicker] = useState(false);

  // First-run pusher primer: fires only when the game has never been
  // completed-onboarded, via the shared OnboardingGate (boolean mode).
  const [hasOnboarded] = useState<boolean>(
    () => loadSave<boolean>('slime_coin_tutorial_seen') === true
  );
  const { shouldShow: showPrimer, handleComplete: completePrimer, trigger: triggerPrimer } =
    useOnboardingGate({ mode: 'boolean', initialShow: false });

  const prevVatCountRef = useRef(0);
  const prevPhaseRef = useRef<string>('playing');
  
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

      // Sound: vat collects and phase transitions
      const vatCount = result.vat_coins?.length ?? prevVatCountRef.current;
      if (vatCount > prevVatCountRef.current) {
        sound.playCollect(result.combo_count ?? 0);
      }
      prevVatCountRef.current = vatCount;
      if (result.phase !== prevPhaseRef.current) {
        if (result.phase === 'card_select') sound.playCardOffer();
        prevPhaseRef.current = result.phase;
      }

      // Sync v0.3 fields into game state
      setState(prev => prev ? {
        ...prev,
        score: result.score,
        score_rate: result.score_rate,
        hand_in: result.hand_in,
        tokens: result.tokens ?? prev.tokens,
        shot_queue: result.shot_queue ?? prev.shot_queue,
        exchanges_used: result.exchanges_used ?? prev.exchanges_used,
      } : prev);

      // Check for phase transition
      if (result.phase === 'card_select') {
        setState(prev => prev ? { ...prev, phase: 'card_select', offered_cards: result.offered_cards ?? [] } : prev);
      } else if (result.phase === 'run_end') {
        sound.playRunEnd(result.score >= state.target_score);
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
          sound.unlock();
          sound.playFire();
          setInput({ fire: true, side: 'left', pocket_coin_type: state.pocket_coin_type ?? undefined });
          break;
        case 'ArrowRight':
          e.preventDefault();
          // Right arrow fires from LEFT shooter, coin travels RIGHT
          sound.unlock();
          sound.playFire();
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
    sound.playCardPick();
    // Lua advances the round (or ends the run) inside select_card — pull the
    // authoritative phase/round back so the tick loop resumes correctly.
    const summary = call('get_state_summary') as {
      phase: SlimeCoinGameState['phase'];
      round?: number;
      score?: number;
      target_score?: number;
      hand_in?: number;
    } | null;
    setState(prev => prev ? {
      ...prev,
      selected_card: cardId,
      phase: summary?.phase ?? 'playing',
      round: summary?.round ?? prev.round,
      score: summary?.score ?? prev.score,
      target_score: summary?.target_score ?? prev.target_score,
      hand_in: summary?.hand_in ?? prev.hand_in,
      offered_cards: [],
    } : prev);
    if (summary?.phase === 'run_end') {
      sound.playRunEnd((summary?.score ?? 0) >= (summary?.target_score ?? 0));
    }
    prevPhaseRef.current = summary?.phase ?? 'playing';
  }, [call, setState]);
  
  const handleSelectPocketCoin = useCallback((coinType: string) => {
    setState(prev => prev ? { ...prev, pocket_coin_type: coinType } : prev);
    setShowPocketPicker(false);
    sound.playUiConfirm();
  }, [setState]);
  
  const handleRestart = useCallback(() => {
    call('init_game', {});
    prevVatCountRef.current = 0;
    prevPhaseRef.current = 'playing';
    setState(buildInitialState(session));
    setRenderState(null);
    sound.playUiConfirm();
  }, [call, session, setState]);

  const handleNewGame = useCallback(() => {
    sound.unlock();
    sound.playUiConfirm();
    if (!hasOnboarded) triggerPrimer();
    setShowTitle(false);
  }, [hasOnboarded, triggerPrimer]);

  const handlePrimerBegin = useCallback(() => {
    writeSave('slime_coin_tutorial_seen', true);
    sound.unlock();
    sound.playUiConfirm();
    completePrimer();
  }, [completePrimer]);

  const toggleSound = useCallback(() => {
    const next = !soundMuted;
    setSoundMuted(next);
    sound.setEnabled(!next);
  }, [soundMuted]);
  
  if (showTitle) {
    return (
      <GameShell
        gameLabel="SLIME COIN"
        gameId="slime_coin"
        mode={mode}
        arcadeBaseUrl={arcadeBaseUrl}
        footer={
          <MoreGamesByMe
            mode={mode}
            currentGameId="slime_coin"
            games={STANDALONE_BUILD_GAMES}
            onSelectGame={navigateTo}
            arcadeBaseUrl={arcadeBaseUrl}
          />
        }
      >
        <TitleScreen
          title="SlimeCoin"
          tagline="Real-time coin pusher"
          pitch="Real-time coin pusher with shooter, two-layer board, and chip synergies."
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
        gameLabel="SLIME COIN"
        gameId="slime_coin"
        mode={mode}
        arcadeBaseUrl={arcadeBaseUrl}
        footer={
          <MoreGamesByMe
            mode={mode}
            currentGameId="slime_coin"
            games={STANDALONE_BUILD_GAMES}
            onSelectGame={navigateTo}
            arcadeBaseUrl={arcadeBaseUrl}
          />
        }
      >
        <div className="game-loading sc-loading">Loading SlimeCoin…</div>
      </GameShell>
    );
  }
  
  return (
    <GameShell
      gameLabel="SLIME COIN"
      gameId="slime_coin"
      statusArea={
        <div className="sc-header">
          <Badge label={`Round ${state.round}/${state.total_rounds}`} variant="accent" />
          <div className="sc-score-track" title="Score toward this round's target">
            <StatBar
              label={`Score ${state.score}/${state.target_score}`}
              value={state.score}
              max={state.target_score}
              color="var(--green)"
              showValue={false}
            />
          </div>
          <Badge
            label={`Rate ×${state.score_rate.toFixed(1)}`}
            variant={state.score_rate > 1 ? 'amber' : 'muted'}
          />
          <Badge
            label={`Hand ${state.hand_in}`}
            variant={state.hand_in === 0 ? 'red' : 'green'}
          />
          <Badge label={`Tokens ${state.tokens}`} variant="green" />
          <button
            type="button"
            className="sc-mute-btn"
            onClick={toggleSound}
            title={soundMuted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label={soundMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {soundMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
      }
      footer={
        <>
          <div className="sc-footer">
            <span>← fire left · → fire right · P pocket coins</span>
          </div>
          <MoreGamesByMe
            mode={mode}
            currentGameId="slime_coin"
            games={STANDALONE_BUILD_GAMES}
            onSelectGame={navigateTo}
            arcadeBaseUrl={arcadeBaseUrl}
          />
        </>
      }
    >
      {showPrimer && <CoinPrimer onBegin={handlePrimerBegin} />}

      <div className="sc-main">
        <BoardCanvas
          renderState={renderState}
        />
      </div>

      {state.phase === 'playing' && state.hand_in === 0 && state.exchanges_used < 3 && (
        <div className="sc-exchange">
          <button
            className="btn-exchange"
            onClick={() => {
              const result = call('exchange') as { tokens: number; hand_in: number } | null;
              if (result) {
                sound.playExchange();
                setState(prev => prev ? {
                  ...prev,
                  tokens: result.tokens,
                  hand_in: result.hand_in,
                  exchanges_used: (prev.exchanges_used ?? 0) + 1,
                } : prev);
              }
            }}
          >
            Exchange ({state.exchanges_used ?? 0}/3) — Cost: {
              [5, 8, 12][state.exchanges_used ?? 0] ?? 12
            } tokens
          </button>
        </div>
      )}

      {state.phase === 'card_select' && state.offered_cards.length > 0 && (
        <ShopModal
          offeredCards={state.offered_cards}
          tokens={state.tokens ?? 0}
          onSelectCard={handleSelectCard}
          onPurchase={(itemId) => {
            const result = call('shop_purchase', itemId) as { tokens: number } | null;
            if (result) {
              sound.playExchange();
              setState(prev => prev ? { ...prev, tokens: result.tokens } : prev);
            }
          }}
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
        <div className="sc-modal-overlay">
          <EndStateScreen
            won={state.score >= state.target_score}
            headline={state.score >= state.target_score ? 'Vat Overflowing' : 'Run Complete'}
            flavorLine={
              state.score >= state.target_score
                ? 'The pusher paid out — final target cleared.'
                : 'The shelf went quiet before the final target fell.'
            }
            stats={[
              { label: 'Final Score', value: state.score },
              { label: 'Final Target', value: state.target_score },
              { label: 'Rounds', value: state.total_rounds },
              { label: 'Tokens Banked', value: state.tokens },
              { label: 'Chips Owned', value: state.owned_chips.length },
            ]}
            onRestart={handleRestart}
            restartLabel="New Run"
          />
        </div>
      )}
    </GameShell>
  );
}
