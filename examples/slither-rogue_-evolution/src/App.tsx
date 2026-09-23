import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import MainMenu from './components/MainMenu';
import GameHUD from './components/GameHUD';
import GameCanvas from './components/GameCanvas';
import EvolutionModal from './components/EvolutionModal';
import GameOverModal from './components/GameOverModal';
import { EvolutionCard } from './types';

// Declare all standard roguelike evolution cards available
const ALL_CARDS: EvolutionCard[] = [
  {
    id: 'speed',
    title: 'Nitrous Slither',
    description: 'Injects nitrogen enzymes. Permanent +15% boost to snake base speed.',
    iconName: 'speed',
    rarity: 'common'
  },
  {
    id: 'magnet',
    title: 'Magnetic Glide',
    description: 'Generates an organic gravitational field. Nearby fruits are pulled towards your head (+60px pull radius).',
    iconName: 'magnet',
    rarity: 'common'
  },
  {
    id: 'shield',
    title: 'Reinforced Joints',
    description: 'Protects tail joints. Grants +1 Node Armor shield charge to block a segment theft completely.',
    iconName: 'shield',
    rarity: 'rare'
  },
  {
    id: 'wide',
    title: 'Thick Scales',
    description: 'Increases segment radius by +3px. Expands collision box to easily block, corner, and slither past NPCs.',
    iconName: 'wide',
    rarity: 'common'
  },
  {
    id: 'sense',
    title: 'Fruity Radar',
    description: 'Grants sonic vibration sense. Draws indicators pointing to off-screen fruits (+200px detection range).',
    iconName: 'sense',
    rarity: 'common'
  },
  {
    id: 'ghost',
    title: 'Spectral End',
    description: 'Phases out tail nodes. Protects the last +1 segment from being stolen by hostile NPC snakes.',
    iconName: 'ghost',
    rarity: 'epic'
  },
  {
    id: 'regen',
    title: 'Chrono Growth',
    description: 'Accelerates cellular mitosis. Automatically spawns a new tail segment every few seconds.',
    iconName: 'regen',
    rarity: 'rare'
  },
  {
    id: 'venom',
    title: 'Acidic Sprayer',
    description: 'Emits a toxic trace behind. Automatically sprays slow-inducing acid drops from your tail segment.',
    iconName: 'venom',
    rarity: 'epic'
  }
];

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'game' | 'gameover'>('menu');
  
  // Game Setup Configuration
  const [controlType, setControlType] = useState<'mouse' | 'keyboard'>('mouse');
  const [playerColor, setPlayerColor] = useState('#14b8a6');
  const [playerHeadColor, setPlayerHeadColor] = useState('#06b6d4');
  const [gameDuration, setGameDuration] = useState(300);

  // Active Gameplay Stats & States
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [score, setScore] = useState(0);
  const [currentLength, setCurrentLength] = useState(5);
  const [peakLength, setPeakLength] = useState(5);
  const [fruitsEatenSinceEvolution, setFruitsEatenSinceEvolution] = useState(0);
  
  // Evolution Selection Tracking
  const [level, setLevel] = useState(1);
  const [activeEvolutions, setActiveEvolutions] = useState<Record<string, number>>({
    speed: 0,
    magnet: 0,
    shield: 0,
    wide: 0,
    sense: 0,
    ghost: 0,
    regen: 0,
    venom: 0
  });
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [evolutionPool, setEvolutionPool] = useState<EvolutionCard[]>([]);

  // Start the actual game session
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
    
    // Reset all game counters
    setScore(0);
    setCurrentLength(5);
    setPeakLength(5);
    setFruitsEatenSinceEvolution(0);
    setLevel(1);
    setIsPaused(false);
    
    setActiveEvolutions({
      speed: 0,
      magnet: 0,
      shield: 0,
      wide: 0,
      sense: 0,
      ghost: 0,
      regen: 0,
      venom: 0
    });

    setScreen('game');
  };

  // Triggered when any fruit is eaten
  const handleFruitEaten = () => {
    setFruitsEatenSinceEvolution(prev => {
      const next = prev + 1;
      if (next >= 3) {
        // Trigger Evolution level selection!
        triggerEvolutionChoice();
        return 0;
      }
      return next;
    });
  };

  // Choose 3 random distinct upgrades from ALL_CARDS to display
  const triggerEvolutionChoice = () => {
    setIsPaused(true);
    
    // Shuffle and pick 3 unique cards
    const shuffled = [...ALL_CARDS].sort(() => Math.random() - 0.5);
    setEvolutionPool(shuffled.slice(0, 3));
    setShowEvolutionModal(true);
  };

  // Level Up card selected by player
  const handleSelectEvolution = (cardId: string) => {
    setActiveEvolutions(prev => ({
      ...prev,
      [cardId]: prev[cardId] + 1
    }));

    setLevel(prev => prev + 1);
    setShowEvolutionModal(false);
    setIsPaused(false); // resume
  };

  // Called when shield breaks during collision
  const handleShieldConsumed = () => {
    setActiveEvolutions(prev => ({
      ...prev,
      shield: Math.max(0, prev.shield - 1)
    }));
  };

  const handleGameOver = () => {
    setScreen('gameover');
  };

  const handleRestart = () => {
    handleStartGame({
      controlType,
      playerColor,
      playerHeadColor,
      gameDuration
    });
  };

  const handleGoHome = () => {
    setScreen('menu');
  };

  // Computed upgrade modifiers to feed into Canvas physics
  const speedMultiplier = 1 + (activeEvolutions.speed * 0.15);
  const magnetismRadius = activeEvolutions.magnet * 60;
  const shieldCharges = activeEvolutions.shield;
  const wideBodyAdd = activeEvolutions.wide * 3;
  const fruitSenseRange = activeEvolutions.sense * 200;
  const ghostTailCount = activeEvolutions.ghost;
  const tailGrowthLevel = activeEvolutions.regen;
  const venomTrailLevel = activeEvolutions.venom;

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      
      {screen === 'menu' && (
        <MainMenu onStartGame={handleStartGame} />
      )}

      {screen === 'game' && (
        <div className="w-full h-screen flex flex-col relative overflow-hidden">
          <GameHUD
            score={score}
            fruitsToNextEvolution={3 - fruitsEatenSinceEvolution}
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

          <div className="flex-1 w-full relative">
            <GameCanvas
              controlType={controlType}
              playerColor={playerColor}
              playerHeadColor={playerHeadColor}
              gameDuration={gameDuration}
              isPaused={isPaused}
              onFruitEaten={handleFruitEaten}
              onUpdateMetrics={(metrics) => {
                setCurrentLength(metrics.currentLength);
                setPeakLength(metrics.peakLength);
                setScore(metrics.score);
              }}
              onGameOver={handleGameOver}
              onTick={setTimeLeft}
              speedMultiplier={speedMultiplier}
              magnetismRadius={magnetismRadius}
              shieldCharges={shieldCharges}
              onShieldConsumed={handleShieldConsumed}
              wideBodyAdd={wideBodyAdd}
              fruitSenseRange={fruitSenseRange}
              ghostTailCount={ghostTailCount}
              tailGrowthLevel={tailGrowthLevel}
              venomTrailLevel={venomTrailLevel}
            />
          </div>

          {/* PAUSED OVERLAY */}
          {isPaused && !showEvolutionModal && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col items-center gap-4 max-w-xs text-center animate-scale-up">
                <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  Game Suspended
                </span>
                <p className="text-slate-300 text-sm">
                  Run is paused. Adjust your grip, then press Resume to re-enter the arena.
                </p>
                <button
                  onClick={() => setIsPaused(false)}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-colors"
                >
                  Resume Run
                </button>
              </div>
            </div>
          )}

          {/* EVOLUTION CHOICE SELECTION OVERLAY */}
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
