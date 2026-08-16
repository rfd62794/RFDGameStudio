import { useState } from 'react';
import type { GameRendererProps } from '../../engine/types';
import { GameState } from './types/gameState';
import { FigureId, PlayerOriginId, IndictmentTriad } from './engine/types';
import {
  createInitialGameState,
  whisperTo,
  appealTo,
  presentEvidenceTo,
  scoutForEvidence,
  deliverIndictmentTo,
} from './utils/gameOrchestration';
import { TitleScreen } from './components/TitleScreen';
import { SegmentHeader } from './components/SegmentHeader';
import { ChamberStage } from './components/ChamberStage';
import { AudienceStage } from './components/AudienceStage';
import { TurnInterlude } from './components/TurnInterlude';
import { GossipTicker } from './components/GossipTicker';
import { VerdictScreen } from './components/VerdictScreen';

type View = 'title' | 'playing' | 'verdict';
type PlayStage = 'chamber' | 'audience' | 'interlude';

export default function App({ session }: GameRendererProps) {
  void session; // destructured per contract; game is self-contained
  const [view, setView] = useState<View>('title');
  const [playStage, setPlayStage] = useState<PlayStage>('chamber');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedFigureId, setSelectedFigureId] = useState<FigureId | null>('chancellor');
  const [completedSegment, setCompletedSegment] = useState<number>(1);
  const [chosenOriginId, setChosenOriginId] = useState<PlayerOriginId>('bastard_scion');

  const handleBegin = (originId: PlayerOriginId) => {
    setChosenOriginId(originId);
    setGameState(createInitialGameState(originId));
    setSelectedFigureId('chancellor');
    setPlayStage('chamber');
    setView('playing');
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
    handleMove((s) => whisperTo(s, figureId, themeId));
  };

  const handleAppeal = (figureId: FigureId) => {
    handleMove((s) => appealTo(s, figureId));
  };

  const handlePresentEvidence = (figureId: FigureId, evidenceId: string) => {
    handleMove((s) => presentEvidenceTo(s, figureId, evidenceId));
  };

  const handleScout = () => {
    handleMove((s) => scoutForEvidence(s));
  };

  const handleDeliverIndictment = (figureId: FigureId, triad: IndictmentTriad) => {
    handleMove((s) => deliverIndictmentTo(s, figureId, triad));
  };

  // Title Screen View
  if (view === 'title' || !gameState) {
    return <TitleScreen onBegin={handleBegin} />;
  }

  // Verdict Screen View
  if (view === 'verdict') {
    return <VerdictScreen gameState={gameState} onPlayAgain={handlePlayAgain} />;
  }

  // Active Playing View with 3-Stage Chamber Loop
  const selectedFigure =
    gameState.figures.find((f) => f.id === selectedFigureId) || gameState.figures[0];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-900 selection:text-amber-100">
      <SegmentHeader segment={gameState.segment} />

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
    </div>
  );
}
