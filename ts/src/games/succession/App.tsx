import { useState } from 'react';
import type { GameRendererProps } from '../../engine/types';
import { GameShell } from '../../components';
import { GameState, PlayerMoveType } from './types/gameState';
import { FigureId, PlayerOriginId, IndictmentTriad, ClaimantId } from './engine/types';
import {
  createInitialGameState,
  whisperTo,
  appealTo,
  presentEvidenceTo,
  scoutForEvidence,
  deliverIndictmentTo,
  discreditFigure,
} from './utils/gameOrchestration';
import { TitleScreen } from './components/TitleScreen';
import { SegmentHeader } from './components/SegmentHeader';
import { ChamberStage } from './components/ChamberStage';
import { AudienceStage } from './components/AudienceStage';
import { TurnInterlude } from './components/TurnInterlude';
import { GossipTicker } from './components/GossipTicker';
import { VerdictScreen } from './components/VerdictScreen';
import { OnboardingTip } from './components/OnboardingTip';
import { ONBOARDING_TIPS, OnboardingTipId } from './content/onboardingTips';
import { determineTip } from './utils/onboardingTriggers';

type View = 'title' | 'playing' | 'verdict';
type PlayStage = 'chamber' | 'audience' | 'interlude';

export default function App({ session }: GameRendererProps) {
  void session; // destructured per contract; game is self-contained
  // Matches the real pattern in games/planetofgreed/App.tsx and
  // games/chimera_wilds/App.tsx — mode/arcadeBaseUrl derived the same
  // way, passed to the same GameShell prop names.
  const env = import.meta.env as Record<string, string | undefined>;
  const mode = env.VITE_STANDALONE === 'true' ? 'standalone' : 'arcade';
  const arcadeBaseUrl = env.VITE_ARCADE_BASE_URL;
  const [view, setView] = useState<View>('title');
  const [playStage, setPlayStage] = useState<PlayStage>('chamber');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedFigureId, setSelectedFigureId] = useState<FigureId | null>('chancellor');
  const [completedSegment, setCompletedSegment] = useState<number>(1);
  const [chosenOriginId, setChosenOriginId] = useState<PlayerOriginId>('bastard_scion');
  const [activeTip, setActiveTip] = useState<OnboardingTipId | null>(null);

  const handleBegin = (originId: PlayerOriginId) => {
    setChosenOriginId(originId);
    setGameState(createInitialGameState(originId));
    setSelectedFigureId('chancellor');
    setPlayStage('chamber');
    setActiveTip(null);
    setView('playing');
  };

  // Delegates to determineTip (utils/onboardingTriggers.ts) — the same
  // real function exercised end-to-end in tests/test_succession_onboarding.ts
  // (ADR-005), so the tested logic and the live wiring are identical,
  // not a reimplementation that could silently diverge.
  const maybeTriggerTip = (moveType: PlayerMoveType, tipId: OnboardingTipId) => {
    if (!gameState) return;
    const tip = determineTip(gameState, moveType, tipId);
    if (tip) setActiveTip(tip);
  };

  const handleMove = (updater: (s: GameState) => GameState) => {
    setGameState((prev) => {
      if (!prev) return prev;
      const prevSegment = prev.segment;
      const next = updater(prev);
      setCompletedSegment(prevSegment);

      if (next.phase === 'verdict') {
        // Show interlude before final transition to verdict
        setPlayStage('interlude');
      } else {
        // Show turn interlude to summarize rival counter-moves
        setPlayStage('interlude');
      }
      return next;
    });
  };

  const handlePlayAgain = () => {
    setGameState(createInitialGameState(chosenOriginId));
    setSelectedFigureId('chancellor');
    setPlayStage('chamber');
    setView('playing');
  };

  const handleProceedFromInterlude = () => {
    if (!gameState) return;
    if (gameState.phase === 'verdict') {
      setView('verdict');
    } else {
      setPlayStage('chamber');
    }
  };

  // Specific move dispatches using the real orchestration functions
  const handleWhisper = (figureId: FigureId, themeId: string) => {
    maybeTriggerTip('whisper', 'whisper');
    handleMove((s) => whisperTo(s, figureId, themeId));
  };

  const handleAppeal = (figureId: FigureId) => {
    maybeTriggerTip('appeal', 'appeal');
    handleMove((s) => appealTo(s, figureId));
  };

  const handlePresentEvidence = (figureId: FigureId, evidenceId: string) => {
    handleMove((s) => presentEvidenceTo(s, figureId, evidenceId));
  };

  const handleScout = () => {
    maybeTriggerTip('scout', 'evidenceScout');
    handleMove((s) => scoutForEvidence(s));
  };

  const handleDeliverIndictment = (figureId: FigureId, triad: IndictmentTriad) => {
    handleMove((s) => deliverIndictmentTo(s, figureId, triad));
  };

  const handleDiscredit = (figureId: FigureId, targetRivalId: ClaimantId) => {
    maybeTriggerTip('discredit', 'discredit');
    handleMove((s) => discreditFigure(s, figureId, targetRivalId));
  };

  // Title Screen View
  if (view === 'title' || !gameState) {
    return (
      <GameShell
        gameLabel="Succession"
        gameId="succession"
        phase="The Council of Three"
        mode={mode}
        arcadeBaseUrl={arcadeBaseUrl}
        mainClassName="game-shell-main--scrollable"
      >
        <TitleScreen onBegin={handleBegin} />
      </GameShell>
    );
  }

  // Verdict Screen View
  if (view === 'verdict') {
    return (
      <GameShell
        gameLabel="Succession"
        gameId="succession"
        phase="The Council of Three"
        mode={mode}
        arcadeBaseUrl={arcadeBaseUrl}
        mainClassName="game-shell-main--scrollable"
      >
        <VerdictScreen gameState={gameState} onPlayAgain={handlePlayAgain} />
      </GameShell>
    );
  }

  // Active Playing View with 3-Stage Chamber Loop
  const selectedFigure =
    gameState.figures.find((f) => f.id === selectedFigureId) || gameState.figures[0];

  return (
    <GameShell
      gameLabel="Succession"
      gameId="succession"
      phase="The Council of Three"
      statusArea={<SegmentHeader segment={gameState.segment} />}
      mode={mode}
      arcadeBaseUrl={arcadeBaseUrl}
      mainClassName="game-shell-main--scrollable"
    >
      <div className="bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-900 selection:text-amber-100">
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Stage A: The Grand Chamber */}
          {playStage === 'chamber' && (
            <>
              <ChamberStage
                figures={gameState.figures}
                playerEvidence={gameState.playerEvidence}
                ticker={gameState.ticker}
                onRequestAudience={(figId) => {
                  setSelectedFigureId(figId);
                  setPlayStage('audience');
                }}
                onScout={handleScout}
              />
              <GossipTicker entries={gameState.ticker} />
            </>
          )}

          {/* Stage B: Focused 1-on-1 Audience Antechamber */}
          {playStage === 'audience' && (
            <AudienceStage
              figure={selectedFigure}
              playerEvidence={gameState.playerEvidence}
              allClaims={gameState.allClaims}
              playerOrigin={gameState.playerOrigin}
              ticker={gameState.ticker}
              onBackToChamber={() => setPlayStage('chamber')}
              onWhisper={handleWhisper}
              onAppeal={handleAppeal}
              onPresentEvidence={handlePresentEvidence}
              onDeliverIndictment={handleDeliverIndictment}
              onDiscredit={handleDiscredit}
            />
          )}

          {/* Stage C: Turn Resolution Interlude */}
          {playStage === 'interlude' && (
            <TurnInterlude
              gameState={gameState}
              completedSegment={completedSegment}
              onProceed={handleProceedFromInterlude}
            />
          )}
        </main>

        {activeTip && (
          <OnboardingTip tip={ONBOARDING_TIPS[activeTip]} onDismiss={() => setActiveTip(null)} />
        )}
      </div>
    </GameShell>
  );
}
