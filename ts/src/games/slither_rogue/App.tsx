import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { call } from '../../engine/runtime';
import type { GameRendererProps } from '../../engine/types';
import type { EvolutionCard } from './types';
import MainMenu from './components/MainMenu';
import GameHUD from './components/GameHUD';
import GameCanvas from './components/GameCanvas';
import EvolutionModal from './components/EvolutionModal';
import GameOverModal from './components/GameOverModal';
import './styles.css';

export default function App({ session }: GameRendererProps) {
  const [screen, setScreen] = useState<'menu' | 'game' | 'gameover'>('menu');

  const [controlType, setControlType] = useState<'mouse' | 'keyboard'>('mouse');
  const [playerColor, setPlayerColor] = useState('#14b8a6');
  const [playerHeadColor, setPlayerHeadColor] = useState('#06b6d4');
  const [gameDuration, setGameDuration] = useState(300);

  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [score, setScore] = useState(0);
  const [currentLength, setCurrentLength] = useState(5);
  const [peakLength, setPeakLength] = useState(5);
  const [fruitsEatenSinceEvolution, setFruitsEatenSinceEvolution] = useState(0);

  const [level, setLevel] = useState(1);
  const [activeEvolutions, setActiveEvolutions] = useState<Record<string, number>>({
    speed: 0, magnet: 0, shield: 0, wide: 0,
    sense: 0, ghost: 0, regen: 0, venom: 0,
  });
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [evolutionPool, setEvolutionPool] = useState<EvolutionCard[]>([]);
  const [restartKey, setRestartKey] = useState(0);

  const data = session.files.data as Record<string, unknown>;
  const evolutionCfg = (data['evolution'] as Record<string, unknown>) ?? {};
  const fruitsPerLevel = (evolutionCfg['fruits_per_level'] as number) ?? 3;
  const cardsOffered = (evolutionCfg['cards_offered'] as number) ?? 3;

  const handleStartGame = (settings: {
    controlType: 'mouse' | 'keyboard';
    playerColor: string;
    playerHeadColor: string;
    gameDuration: number;
  }) => {
    setControlType(settings.controlType);
    setPlayerColor(settings.playerColor);
    setPlayerHeadColor(settings.playerHeadColor);
    setGameDuration(settings.gameDuration);
    setTimeLeft(settings.gameDuration);
    setScore(0);
    setCurrentLength(5);
    setPeakLength(5);
    setFruitsEatenSinceEvolution(0);
    setLevel(1);
    setIsPaused(false);
    setActiveEvolutions({ speed: 0, magnet: 0, shield: 0, wide: 0, sense: 0, ghost: 0, regen: 0, venom: 0 });
    setRestartKey(prev => prev + 1);
    setScreen('game');
  };

  const triggerEvolutionChoice = () => {
    setIsPaused(true);
    const pool = call(session, 'select_evolution_pool', data['evolution_cards'], cardsOffered) as Array<Record<string, unknown>>;
    const cards: EvolutionCard[] = pool.map(c => ({
      id: c['id'] as string,
      title: c['title'] as string,
      description: c['description'] as string,
      iconName: c['icon'] as string,
      rarity: c['rarity'] as 'common' | 'rare' | 'epic',
    }));
    setEvolutionPool(cards);
    setShowEvolutionModal(true);
  };

  const handleFruitEaten = () => {
    setFruitsEatenSinceEvolution(prev => {
      const shouldEvolve = call(session, 'check_evolution_trigger', prev, fruitsPerLevel) as boolean;
      if (shouldEvolve) {
        triggerEvolutionChoice();
        return 0;
      }
      return prev + 1;
    });
  };

  const handleSelectEvolution = (cardId: string) => {
    const nextEvolutions = { ...activeEvolutions, [cardId]: (activeEvolutions[cardId] ?? 0) + 1 };
    setActiveEvolutions(nextEvolutions);
    setLevel(prev => prev + 1);
    setShowEvolutionModal(false);
    setIsPaused(false);
  };

  const handleShieldConsumed = () => {
    setActiveEvolutions(prev => ({ ...prev, shield: Math.max(0, prev.shield - 1) }));
  };

  const handleGameOver = () => setScreen('gameover');

  const handleRestart = () => handleStartGame({ controlType, playerColor, playerHeadColor, gameDuration });

  const handleGoHome = () => setScreen('menu');

  const shieldCharges = activeEvolutions.shield;

  return (
    <div className="sr-shell">
      {screen === 'menu' && (
        <MainMenu session={session} onStartGame={handleStartGame} />
      )}

      {screen === 'game' && (
        <div className="sr-game-wrap">
          <GameHUD
            score={score}
            fruitsToNextEvolution={fruitsPerLevel - fruitsEatenSinceEvolution}
            fruitsPerLevel={fruitsPerLevel}
            currentLength={currentLength}
            peakLength={peakLength}
            shieldCharges={shieldCharges}
            evolutionsCount={level - 1}
            timeLeft={timeLeft}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused(prev => !prev)}
            onReset={handleRestart}
            onReturnToMenu={handleGoHome}
            activeEvolutions={activeEvolutions}
          />

          <GameCanvas
            key={restartKey}
            session={session}
            controlType={controlType}
            isPaused={isPaused}
            activeEvolutions={activeEvolutions}
            onFruitEaten={handleFruitEaten}
            onUpdateMetrics={(metrics) => {
              setCurrentLength(metrics.currentLength);
              setPeakLength(metrics.peakLength);
              setScore(metrics.score);
            }}
            onGameOver={handleGameOver}
            onTick={setTimeLeft}
            onShieldConsumed={handleShieldConsumed}
          />

          {isPaused && !showEvolutionModal && (
            <div className="sr-pause-overlay">
              <div className="sr-pause-card">
                <span className="sr-pause-badge">Game Suspended</span>
                <p className="sr-pause-text">
                  Run is paused. Adjust your grip, then press Resume to re-enter the arena.
                </p>
                <button className="btn-primary" onClick={() => setIsPaused(false)}>
                  Resume Run
                </button>
              </div>
            </div>
          )}

          <AnimatePresence>
            {showEvolutionModal && (
              <EvolutionModal
                cards={evolutionPool}
                onSelect={handleSelectEvolution}
                level={level}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {screen === 'gameover' && (
        <GameOverModal
          session={session}
          score={score}
          peakLength={peakLength}
          evolutionsCount={level - 1}
          onRestart={handleRestart}
          onHome={handleGoHome}
        />
      )}
    </div>
  );
}
