/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { GameStats, LevelSettings, BoardTheme, CoinType, WheelReward, PocketCoinType, PocketCoinInstance } from './types';
import { LEVEL_SETTINGS, COIN_TYPES, WHEEL_REWARDS, POCKET_COIN_TYPES, BOARD_THEMES } from './data';
import { sound } from './sound';
import CoinPusherGame from './components/CoinPusherGame';
import RewardWheelModal from './components/RewardWheelModal';
import PocketCoinPickerModal from './components/PocketCoinPickerModal';
import {
  Trophy,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Flame,
  HelpCircle,
  Coins,
  Shield,
  Zap,
  Lock,
  Gift,
  Play,
  ArrowRight,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

const STORAGE_KEY = 'coin_pusher_meta_stats';

export default function App() {
  // --- Game Stats & Meta-Progression (LocalStorage) ---
  const [stats, setStats] = useState<GameStats>({
    totalCoinsPushed: 0,
    totalRoundsCleared: 0,
    highScores: {},
  });

  // Load stats from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStats({
          totalCoinsPushed: parsed.totalCoinsPushed || 0,
          totalRoundsCleared: parsed.totalRoundsCleared || 0,
          highScores: parsed.highScores || {},
        });
      } catch (e) {
        console.error('Error parsing meta-stats from LocalStorage', e);
      }
    }
  }, []);

  // Save stats helper
  const saveStats = (newStats: GameStats) => {
    setStats(newStats);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
  };

  // --- Active Level & Theme States ---
  const [levelIndex, setLevelIndex] = useState(0);
  const currentLevel = LEVEL_SETTINGS[levelIndex];

  const [themeId, setThemeId] = useState('neon');
  const currentTheme = BOARD_THEMES.find(t => t.id === themeId) || BOARD_THEMES[0];

  // --- Session gameplay states ---
  const [dropQueue, setDropQueue] = useState(15);
  const [runScore, setRunScore] = useState(0);
  const [guttersCount, setGuttersCount] = useState(0);

  // Refill progression state (starts at 10 pushed = +10 drops)
  const [refillProgress, setRefillProgress] = useState(0);
  const REFILL_THRESHOLD = 10;

  // Pocket Coin drafting progress (starts at 15 pushed = draft pick)
  const [pocketProgress, setPocketProgress] = useState(0);
  const POCKET_THRESHOLD = 15;

  // Player's pocket coins hand
  const [pocketCoinsHand, setPocketCoinsHand] = useState<PocketCoinInstance[]>([
    { id: 'start-tnt', typeId: 'tnt', isUsed: false },
    { id: 'start-magnet', typeId: 'magnet', isUsed: false },
  ]);

  // Sound mute state
  const [isMuted, setIsMuted] = useState(false);

  // Help panel overlay state
  const [showHelp, setShowHelp] = useState(false);

  // Board settled / animation loop state
  const [activeBoardCoins, setActiveBoardCoins] = useState(0);
  const [isBoardSettled, setIsBoardSettled] = useState(true);

  // Win / Loss end condition states
  const [hasWonRound, setHasWonRound] = useState(false);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Combo display tracking
  const [currentCombo, setCurrentCombo] = useState(0);
  const [comboTimer, setComboTimer] = useState(0); // visual decay progress

  // Modals visibility states
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [isPocketPickerOpen, setIsPocketPickerOpen] = useState(false);

  // --- Particle / Spawner Triggers (fed into Canvas) ---
  const [pocketCoinToDrop, setPocketCoinToDrop] = useState<string | null>(null);
  
  const [triggerCoinBird, setTriggerCoinBird] = useState(false);
  const [triggerCoinTower, setTriggerCoinTower] = useState(false);
  const [triggerBumper, setTriggerBumper] = useState(false);
  const [triggerMultiplierPad, setTriggerMultiplierPad] = useState(false);
  const [triggerGutterShield, setTriggerGutterShield] = useState(false);
  const [gutterShieldActive, setGutterShieldActive] = useState(false);

  // --- Computed Unlocked Pools based on Meta Stats ---
  const unlockedCoins = COIN_TYPES.filter(
    coin => stats.totalCoinsPushed >= coin.unlockedAtPushed
  );

  const unlockedRewards = WHEEL_REWARDS.filter(
    reward => stats.totalRoundsCleared >= reward.unlockedAtRounds
  );

  const unlockedPocketCoins = POCKET_COIN_TYPES.filter(
    coin => stats.totalCoinsPushed >= coin.unlockedAtPushed
  );

  const unlockedThemes = BOARD_THEMES.filter(
    t => stats.totalCoinsPushed >= t.unlockedAtCoins
  );

  // --- Reset/Restart Run Handler ---
  const restartRun = useCallback((chosenLevelIndex = levelIndex) => {
    setDropQueue(15);
    setRunScore(0);
    setGuttersCount(0);
    setRefillProgress(0);
    setPocketProgress(0);
    setHasWonRound(false);
    setIsInfiniteMode(false);
    setIsGameOver(false);
    setCurrentCombo(0);
    setComboTimer(0);
    setGutterShieldActive(false);

    // Re-initialize a basic hand: 1 TNT, 1 Magnet (refilled)
    setPocketCoinsHand([
      { id: `tnt-${Date.now()}`, typeId: 'tnt', isUsed: false },
      { id: `magnet-${Date.now()}`, typeId: 'magnet', isUsed: false },
    ]);

    setLevelIndex(chosenLevelIndex);
  }, [levelIndex]);

  // Audio Toggle
  const toggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // --- Drop execution triggers ---
  const triggerStandardDrop = () => {
    if (dropQueue <= 0 || isGameOver || hasWonRound && !isInfiniteMode) return;

    // Send a drop event to the Canvas centered on current hover pointer X or randomly in center
    const canvas = document.getElementById('coin-pusher-canvas');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const dropX = rect.left + rect.width / 2 + (Math.random() - 0.5) * 80;
      
      const customEvent = new CustomEvent('request-coin-drop', {
        detail: { x: dropX }
      });
      window.dispatchEvent(customEvent);
    }

    setDropQueue(prev => prev - 1);
  };

  // Trigger special pocket coin drop
  const dropPocketCoin = (instanceId: string, typeId: string) => {
    if (isGameOver) return;
    
    // Mark as used
    setPocketCoinsHand(prev =>
      prev.map(c => (c.id === instanceId ? { ...c, isUsed: true } : c))
    );

    // Pass typeId to trigger drop inside canvas
    setPocketCoinToDrop(typeId);
  };

  // --- Canvas callback event handlers ---
  const handleCoinPushed = (value: number, isPocket: boolean, pocketTypeId?: string) => {
    // 1. Increment run score
    setRunScore(prev => {
      const nextScore = prev + value;
      
      // Check win condition
      if (nextScore >= currentLevel.pushTarget && !hasWonRound) {
        setHasWonRound(true);
        sound.playWin();

        // Save round progression highscore
        const nextRounds = stats.totalRoundsCleared + 1;
        const levelHighScore = Math.max(stats.highScores[currentLevel.level] || 0, nextScore);
        
        saveStats({
          ...stats,
          totalRoundsCleared: Math.max(stats.totalRoundsCleared, currentLevel.level),
          highScores: {
            ...stats.highScores,
            [currentLevel.level]: levelHighScore
          }
        });
      }
      return nextScore;
    });

    // 2. Increment permanent meta stats
    saveStats({
      ...stats,
      totalCoinsPushed: stats.totalCoinsPushed + 1,
      highScores: {
        ...stats.highScores,
        [currentLevel.level]: Math.max(stats.highScores[currentLevel.level] || 0, runScore + value)
      }
    });

    // 3. Update Refill progress bar
    setRefillProgress(prev => {
      const next = prev + 1;
      if (next >= REFILL_THRESHOLD) {
        sound.playRefill();
        setDropQueue(q => q + 10);
        return 0; // reset progress
      }
      return next;
    });

    // 4. Update Pocket Coin draft progress bar
    setPocketProgress(prev => {
      const next = prev + 1;
      if (next >= POCKET_THRESHOLD) {
        // Trigger Draft card select modal
        setIsPocketPickerOpen(true);
        return 0; // reset progress
      }
      return next;
    });
  };

  const handleGutterCoin = () => {
    setGuttersCount(prev => prev + 1);
  };

  const handleComboTriggered = (comboCount: number) => {
    setCurrentCombo(comboCount);
    setComboTimer(100); // start full decay timer

    sound.playCombo(comboCount);

    // Hit a threshold for COMBO SPIN:
    // e.g. every combo count of 3, 6, 9... triggers a wheel spin!
    if (comboCount % 3 === 0) {
      setTimeout(() => {
        setIsWheelOpen(true);
      }, 800);
    }
  };

  // Keeps combo meter visual decaying
  useEffect(() => {
    if (currentCombo > 0) {
      const interval = setInterval(() => {
        setComboTimer(prev => {
          if (prev <= 1) {
            setCurrentCombo(0);
            return 0;
          }
          return prev - 2;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [currentCombo]);

  const handleBoardStateChange = (activeCount: number, settled: boolean) => {
    setActiveBoardCoins(activeCount);
    setIsBoardSettled(settled);

    // End-run Game Over check
    // If drop queue is empty, and board is settled, game over!
    if (dropQueue === 0 && settled && activeCount === 0 && !isGameOver) {
      setIsGameOver(true);
    }
  };

  // Modal selector handles
  const handleRewardWheelSelected = (reward: WheelReward) => {
    setIsWheelOpen(false);

    // Activate the award
    if (reward.id === 'coin_bird') {
      setTriggerCoinBird(true);
    } else if (reward.id === 'coin_tower') {
      setTriggerCoinTower(true);
    } else if (reward.id === 'bumper') {
      setTriggerBumper(true);
    } else if (reward.id === 'multiplier_pad') {
      setTriggerMultiplierPad(true);
    } else if (reward.id === 'gutter_shield') {
      setTriggerGutterShield(true);
    }
  };

  const handlePocketCoinSelected = (selected: PocketCoinType) => {
    setIsPocketPickerOpen(false);

    // Add selected to hand, and reload all existing pocket coins
    setPocketCoinsHand(prev => {
      const reloaded = prev.map(item => ({ ...item, isUsed: false }));
      return [
        ...reloaded,
        {
          id: `${selected.id}-${Date.now()}`,
          typeId: selected.id,
          isUsed: false,
        }
      ];
    });
  };

  // Keyboard shortcut drop (Spacebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        triggerStandardDrop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dropQueue, isGameOver, hasWonRound, isInfiniteMode]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col font-sans selection:bg-pink-500 selection:text-white relative overflow-x-hidden bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_#0f172a_100%)]">
      {/* HEADER BAR */}
      <header className="h-20 bg-slate-800/50 border-b border-pink-500/30 flex items-center justify-between px-6 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Coins className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-pink-400 font-bold block leading-none">PRESSURE LEVEL {String(currentLevel.level).padStart(2, '0')}</span>
              <h1 className="text-xl font-black text-white italic tracking-wide uppercase leading-tight">
                COIN PUSHER ARCADE
              </h1>
            </div>
          </div>
          
          {/* Level Progress bar integrated beautifully like the mockup */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="w-64 h-4 bg-slate-900 rounded-full border border-slate-700 overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 to-violet-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (runScore / currentLevel.pushTarget) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-slate-300">{runScore} / {currentLevel.pushTarget} PUSHED</span>
          </div>
        </div>

        {/* Global actions & High Contrast Badges */}
        <div className="flex gap-4 items-center">
          <div className="hidden md:flex bg-amber-500/10 border border-amber-500/50 px-4 py-1.5 rounded-lg text-center flex-col">
            <span className="block text-[10px] text-amber-500 uppercase font-bold tracking-wider leading-none mb-0.5">Meta Score</span>
            <span className="text-lg font-bold text-amber-400 font-mono leading-none">
              {(stats.totalCoinsPushed * 10).toLocaleString()}
            </span>
          </div>
          <div className="hidden md:flex bg-cyan-500/10 border border-cyan-500/50 px-4 py-1.5 rounded-lg text-center flex-col">
            <span className="block text-[10px] text-cyan-500 uppercase font-bold tracking-wider leading-none mb-0.5">Rounds</span>
            <span className="text-lg font-bold text-cyan-400 font-mono leading-none">{stats.totalRoundsCleared}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 rounded-lg border border-pink-500/30 bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-pink-400 transition-colors"
              title="How to Play"
              id="help-btn"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg border border-pink-500/30 bg-slate-800/40 hover:bg-slate-800 text-slate-300 transition-colors"
              title="Mute/Unmute sound synthesizers"
              id="mute-btn"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
            </button>
            <button
              onClick={() => restartRun()}
              className="p-2 rounded-lg border border-pink-500/30 bg-slate-800/40 hover:bg-slate-800 text-slate-300 transition-colors flex items-center gap-1.5 font-semibold text-xs tracking-wide uppercase"
              id="restart-btn"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* DETAILED STATS BANNER */}
      <section className="bg-slate-900/40 border-b border-pink-500/10 px-6 py-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-center backdrop-blur-sm">
        <div className="p-2">
          <span className="text-[10px] text-pink-400 uppercase tracking-widest font-black block">Total Pushed</span>
          <p className="text-xl font-black text-white font-mono mt-0.5">{stats.totalCoinsPushed}</p>
        </div>
        <div className="p-2 border-l border-white/5">
          <span className="text-[10px] text-violet-400 uppercase tracking-widest font-black block">Rounds Cleared</span>
          <p className="text-xl font-black text-white font-mono mt-0.5">{stats.totalRoundsCleared} / 4</p>
        </div>
        <div className="p-2 border-l border-white/5">
          <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-black block">Active Board Load</span>
          <p className="text-xl font-black text-cyan-400 font-mono mt-0.5">{activeBoardCoins} Coins</p>
        </div>
        <div className="p-2 border-l border-white/5">
          <span className="text-[10px] text-amber-400 uppercase tracking-widest font-black block">High Score (Lvl {currentLevel.level})</span>
          <p className="text-xl font-black text-yellow-500 font-mono mt-0.5">{stats.highScores[currentLevel.level] || 0}</p>
        </div>
      </section>

      {/* MAIN BENTO LAYOUT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: GAME CABINET VIEW (lg:span-7) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          
          {/* THE PHYSICAL CABINET CONTROLLER wrapper */}
          <div className="w-full bg-slate-900/60 rounded-3xl border border-pink-500/20 shadow-2xl overflow-hidden p-1 relative backdrop-blur-md"
               style={{
                 boxShadow: `0 0 40px -10px ${currentTheme.accentColor}30`
               }}>
            
            {/* Glowing vertical lines along the physical frame */}
            <div className="absolute top-0 bottom-0 left-0 w-1.5 transition-colors duration-300"
                 style={{ backgroundColor: currentTheme.accentColor, boxShadow: `0 0 15px ${currentTheme.accentColor}` }} />
            <div className="absolute top-0 bottom-0 right-0 w-1.5 transition-colors duration-300"
                 style={{ backgroundColor: currentTheme.accentColor, boxShadow: `0 0 15px ${currentTheme.accentColor}` }} />

            {/* MARQUEE BOARD SCREEN */}
            <div className="bg-slate-900/80 p-4 border-b border-pink-500/20 flex justify-between items-center px-6">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-pink-400 uppercase tracking-widest font-mono">ACTIVE LEVEL</span>
                <span className="text-sm font-black text-white uppercase tracking-wider italic">{currentLevel.name}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-pink-400 uppercase tracking-widest font-mono">TARGET TARGET</span>
                <div className="text-sm font-black font-mono text-yellow-400 tracking-wider">
                  {runScore} <span className="text-slate-500">/</span> {currentLevel.pushTarget}
                </div>
              </div>
            </div>

            {/* THE CANVAS SCREEN STAGE */}
            <div className="bg-[#040508] p-4 flex justify-center items-center overflow-hidden min-h-[510px] relative">
              
              <CoinPusherGame
                level={currentLevel}
                theme={currentTheme}
                unlockedCoins={unlockedCoins}
                onCoinPushed={handleCoinPushed}
                onGutterCoin={handleGutterCoin}
                onComboTriggered={handleComboTriggered}
                onBoardStateChange={handleBoardStateChange}
                pocketCoinToDrop={pocketCoinToDrop}
                onPocketCoinDropped={() => setPocketCoinToDrop(null)}
                triggerCoinBird={triggerCoinBird}
                onCoinBirdTriggered={() => setTriggerCoinBird(false)}
                triggerCoinTower={triggerCoinTower}
                onCoinTowerTriggered={() => setTriggerCoinTower(false)}
                triggerBumper={triggerBumper}
                onBumperTriggered={() => setTriggerBumper(false)}
                triggerMultiplierPad={triggerMultiplierPad}
                onMultiplierPadTriggered={() => setTriggerMultiplierPad(false)}
                triggerGutterShield={triggerGutterShield}
                onGutterShieldTriggered={() => setTriggerGutterShield(false)}
                onGutterShieldActiveState={setGutterShieldActive}
                isMuted={isMuted}
              />

              {/* OVERLAYS: GAME OVER SCREEN */}
              {isGameOver && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col justify-center items-center p-6 text-center z-10">
                  <Coins className="w-16 h-16 text-rose-500 animate-bounce mb-3" />
                  <h3 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-red-600 mb-1">
                    OUT OF DROPS!
                  </h3>
                  <p className="text-sm text-slate-400 max-w-xs mb-6">
                    Your queue is completely empty and all coins have settled. Better luck next time!
                  </p>
                  <button
                    onClick={() => restartRun()}
                    id="retry-game-btn"
                    className="py-3 px-8 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold rounded-xl shadow-lg shadow-red-500/20 active:scale-95 transition-all uppercase tracking-widest text-sm"
                  >
                    🎮 Play Again
                  </button>
                </div>
              )}

              {/* OVERLAYS: ROUND VICTORY SCREEN */}
              {hasWonRound && !isInfiniteMode && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col justify-center items-center p-6 text-center z-10 animate-fadeIn">
                  <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center border-2 border-yellow-500 mb-4 animate-pulse">
                    <Trophy className="w-10 h-10 text-yellow-500" />
                  </div>
                  <h3 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-400 mb-1">
                    ROUND CLEARED!
                  </h3>
                  <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
                    You cleared the target push threshold of <strong>{currentLevel.pushTarget} coins</strong> on level {currentLevel.level}!
                  </p>
                  
                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    {levelIndex < LEVEL_SETTINGS.length - 1 ? (
                      <button
                        onClick={() => {
                          restartRun(levelIndex + 1);
                        }}
                        id="next-level-btn"
                        className="py-3 px-6 bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black rounded-xl shadow-lg shadow-yellow-500/20 active:scale-95 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                      >
                        <span>Next Level</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                        🏆 GRAND CHAMPION! ALL LEVELS CLEARED!
                      </div>
                    )}
                    
                    <button
                      onClick={() => setIsInfiniteMode(true)}
                      id="continue-infinite-btn"
                      className="py-2 px-6 border border-slate-700 hover:border-slate-600 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-widest active:scale-95 transition-all"
                    >
                      ♾️ Play Infinite Mode
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* PHYSICAL BUTTONS PANEL BELOW SCREEN */}
            <div className="bg-slate-900/95 border-t border-pink-500/20 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              
              {/* Giant digital drop queue indicator */}
              <div className="flex items-center gap-4">
                <div className="bg-slate-950/85 px-5 py-3 rounded-xl border border-pink-500/30 text-center min-w-[120px] shadow-[inset_0_0_12px_rgba(236,72,153,0.15)] relative overflow-hidden">
                  <span className="text-[9px] text-pink-400 uppercase tracking-widest font-black block mb-1">DROPS QUEUE</span>
                  <span className="text-3xl font-black font-mono tracking-wider text-pink-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                    {dropQueue}
                  </span>
                  
                  {/* Digital warning if empty */}
                  {dropQueue === 0 && (
                    <span className="absolute inset-x-0 bottom-0 bg-rose-950/80 text-rose-400 font-bold text-[8px] uppercase tracking-widest py-0.5">
                      EMPTY
                    </span>
                  )}
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Quick Drop Instruction</span>
                  <p className="text-xs text-slate-400 max-w-[160px] leading-relaxed">
                    Click anywhere inside the dropping channel on screen to place!
                  </p>
                </div>
              </div>

              {/* Physical trigger launch button with Vibrant 3D styling */}
              <button
                onClick={triggerStandardDrop}
                disabled={dropQueue === 0 || isGameOver || (hasWonRound && !isInfiniteMode)}
                id="cabinet-drop-btn"
                className={`h-14 px-12 rounded-xl font-black italic text-xl uppercase tracking-widest flex items-center justify-center gap-3 select-none transition-all duration-100 ${
                  dropQueue === 0 || isGameOver || (hasWonRound && !isInfiniteMode)
                    ? 'bg-slate-800/40 border border-slate-900 text-slate-600 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-b from-pink-400 to-pink-600 text-white shadow-[0_8px_0_#9d174d] hover:translate-y-[2px] hover:shadow-[0_6px_0_#9d174d] active:translate-y-[6px] active:shadow-none'
                }`}
              >
                <Zap className="w-5 h-5 fill-white animate-pulse" />
                <span>DROP COIN</span>
              </button>
            </div>

            {/* PHYSICAL CARD HAND FOR POCKET COINS */}
            <div className="bg-slate-950/60 border-t border-pink-500/10 p-4">
              <span className="text-[10px] text-pink-400/80 uppercase tracking-widest font-black block mb-3 text-center">
                ACTIVE POCKET COINS HAND (CLICK CARD TO DROP)
              </span>
              
              <div className="flex flex-wrap justify-center gap-3">
                {pocketCoinsHand.map((cInstance) => {
                  const type = POCKET_COIN_TYPES.find(p => p.id === cInstance.typeId);
                  if (!type) return null;

                  const isUsed = cInstance.isUsed;
                  let icon = '🪙';
                  if (type.id === 'tnt') icon = '🧨';
                  if (type.id === 'magnet') icon = '🧲';
                  if (type.id === 'double_drop') icon = '⚡';
                  if (type.id === 'giga_gold') icon = '👑';

                  // Map specific badge backgrounds and shadow colors
                  let badgeBg = 'bg-slate-700';
                  let shadowClass = '';
                  if (!isUsed) {
                    if (type.id === 'tnt') {
                      badgeBg = 'bg-red-600';
                      shadowClass = 'shadow-[0_0_10px_rgba(220,38,38,0.5)]';
                    } else if (type.id === 'magnet') {
                      badgeBg = 'bg-cyan-500';
                      shadowClass = 'shadow-[0_0_10px_rgba(6,182,212,0.5)]';
                    } else if (type.id === 'double_drop') {
                      badgeBg = 'bg-amber-500';
                      shadowClass = 'shadow-[0_0_10px_rgba(245,158,11,0.5)]';
                    } else if (type.id === 'giga_gold') {
                      badgeBg = 'bg-yellow-500';
                      shadowClass = 'shadow-[0_0_10px_rgba(234,179,8,0.5)]';
                    }
                  }

                  return (
                    <button
                      key={cInstance.id}
                      disabled={isUsed || isGameOver}
                      onClick={() => dropPocketCoin(cInstance.id, type.id)}
                      id={`pocket-hand-${cInstance.id}`}
                      className={`group p-3 rounded-xl border flex gap-3 items-center transition-all cursor-pointer focus:outline-none ${
                        isUsed
                          ? 'bg-slate-900/40 border-slate-950 text-slate-600 opacity-40 cursor-not-allowed'
                          : 'bg-slate-800 border-white/5 hover:bg-slate-700 text-white hover:border-pink-500/30 active:scale-95'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-transform ${!isUsed && 'group-hover:scale-110'} ${badgeBg} ${shadowClass}`}>
                        {icon}
                      </div>
                      
                      <div className="flex flex-col text-left">
                        <span className={`text-xs font-bold leading-none ${isUsed ? 'text-slate-500' : 'text-white'}`}>
                          {type.name.toUpperCase()}
                        </span>
                        <span className={`text-[9px] uppercase font-mono mt-0.5 leading-none ${isUsed ? 'text-slate-600' : 'text-pink-400'}`}>
                          {isUsed ? 'Used: 1 Available: 0' : 'Ready to Use'}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {pocketCoinsHand.length === 0 && (
                  <p className="text-xs text-slate-500 font-semibold italic uppercase tracking-wider py-2">
                    No active cards. Push coins to unlock card choices!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: STATS, METRICS, ACHIEVEMENTS, THEMES (lg:span-5) */}
        <div className="lg:col-span-5 grid grid-cols-1 gap-6">
          
          {/* 1. SECTOR METRICS (COMBOS, REFILS) */}
          <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-5 shadow-lg flex flex-col gap-4 backdrop-blur-sm">
            <h3 className="text-xs font-black uppercase text-pink-400 tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span>ARCADE METRICS</span>
            </h3>

            {/* COMBO COUNTER METER with Vibrant theme combo box style */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Active Combo</span>
              <div className="p-4 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl shadow-lg border-b-4 border-indigo-900 flex flex-col items-center justify-center relative overflow-hidden min-h-[110px]">
                {currentCombo > 0 ? (
                  <>
                    <span className="text-5xl font-black italic text-white tracking-tight animate-bounce">x{currentCombo}</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-violet-200 mt-1">Streak Bonus</span>
                    <div className="w-full h-1.5 bg-black/30 rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-cyan-400 transition-all duration-100" style={{ width: `${comboTimer}%` }} />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center py-2 text-center">
                    <span className="text-sm font-black uppercase text-indigo-200/50 tracking-wider">READY TO TRIGGER</span>
                    <span className="text-[9px] font-bold text-indigo-300/40 uppercase tracking-widest">Push 3+ coins fast</span>
                  </div>
                )}
              </div>
            </div>

            {/* COIN REFILL BAR */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                <span className="text-slate-400 flex items-center gap-1.5 text-[10px]">
                  <Coins className="w-3.5 h-3.5 text-pink-400" />
                  <span>Drops Refill Progress</span>
                </span>
                <span className="text-pink-400 font-mono text-[10px]">{refillProgress} / {REFILL_THRESHOLD} Coins</span>
              </div>
              <div className="w-full bg-slate-950 border border-slate-800 rounded-full h-3 p-0.5 shadow-inner">
                <div
                  className="bg-gradient-to-r from-pink-500 to-violet-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(refillProgress / REFILL_THRESHOLD) * 100}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block">
                Completing triggers a full <strong>+10 standard drops</strong> payout!
              </span>
            </div>

            {/* POCKET COIN GAUGE BAR */}
            <div className="border-t border-white/5 pt-3 space-y-1">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                <span className="text-slate-400 flex items-center gap-1.5 text-[10px]">
                  <Gift className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Card Reload Gauge</span>
                </span>
                <span className="text-cyan-400 font-mono text-[10px]">{pocketProgress} / {POCKET_THRESHOLD} Coins</span>
              </div>
              <div className="w-full bg-slate-950 border border-slate-800 rounded-full h-3 p-0.5 shadow-inner">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-violet-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(pocketProgress / POCKET_THRESHOLD) * 100}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block">
                Triggers selection drafting to add one <strong>special coin card</strong> to your hand!
              </span>
            </div>
          </div>

          {/* 2. PERSISTENT META ACHIEVEMENT TRACKS */}
          <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-5 shadow-lg flex flex-col gap-4 backdrop-blur-sm">
            <h3 className="text-xs font-black uppercase text-amber-500 tracking-widest flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span>ACHIEVEMENTS & UNLOCKS</span>
            </h3>

            {/* UNLOCKED COINS CAROUSEL */}
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block mb-2">
                UNLOCKED COIN TYPES ({unlockedCoins.length} / {COIN_TYPES.length})
              </span>
              <div className="grid grid-cols-2 gap-3">
                {COIN_TYPES.map((coin) => {
                  const unlocked = stats.totalCoinsPushed >= coin.unlockedAtPushed;
                  return (
                    <div
                      key={coin.id}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-left ${
                        unlocked
                          ? 'bg-slate-950/40 border-slate-800'
                          : 'bg-slate-950/20 border-slate-900/40 opacity-45'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-black"
                        style={{
                          backgroundColor: unlocked ? coin.color : '#334155',
                          borderColor: unlocked ? coin.borderColor : '#475569',
                          color: unlocked ? coin.textColor : '#94a3b8',
                        }}
                      >
                        {unlocked ? coin.name[0] : '?' }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-extrabold truncate text-white">{coin.name}</p>
                        <span className="text-[9px] text-slate-500 font-mono block truncate">
                          {unlocked ? `Val: ${coin.value}` : coin.unlockRequirement}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* UNLOCKED WHEEL MODIFIERS */}
            <div className="border-t border-slate-900 pt-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block mb-2">
                UNLOCKED WHEEL REWARDS ({unlockedRewards.length} / {WHEEL_REWARDS.length})
              </span>
              <div className="flex flex-col gap-2">
                {WHEEL_REWARDS.map((reward) => {
                  const unlocked = stats.totalRoundsCleared >= reward.unlockedAtRounds;
                  return (
                    <div
                      key={reward.id}
                      className={`flex items-center justify-between p-2 rounded-xl border text-left text-xs ${
                        unlocked
                          ? 'bg-slate-950/40 border-slate-800 text-slate-200'
                          : 'bg-slate-950/20 border-slate-900/40 opacity-45 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: unlocked ? reward.color : '#475569' }}
                        />
                        <span className="font-extrabold">{reward.name}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">
                        {unlocked ? 'ACTIVE' : reward.unlockRequirement}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. PHYSICAL BOARD THEMES CABINET PANEL */}
          <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-5 shadow-lg flex flex-col gap-3 backdrop-blur-sm">
            <h3 className="text-xs font-black uppercase text-pink-400 tracking-widest flex items-center gap-2">
              <Shield className="w-4 h-4 text-pink-500" />
              <span>CABINET COIN THEMES</span>
            </h3>
            
            <p className="text-[10px] text-slate-400 leading-relaxed mb-1">
              Switch the physical cosmetics of the board instantly! Higher themes unlock as your total coin push career grows.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {BOARD_THEMES.map((t) => {
                const unlocked = stats.totalCoinsPushed >= t.unlockedAtCoins;
                const active = themeId === t.id;

                return (
                  <button
                    key={t.id}
                    disabled={!unlocked}
                    onClick={() => {
                      setThemeId(t.id);
                      sound.playRefill();
                    }}
                    id={`theme-btn-${t.id}`}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      active
                        ? 'bg-slate-950 border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.15)]'
                        : unlocked
                        ? 'bg-slate-950/50 border-slate-800 hover:border-slate-600 text-slate-200'
                        : 'bg-slate-950/10 border-slate-900/30 opacity-45 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-black uppercase tracking-wider ${active ? 'text-pink-400' : 'text-white'}`}>
                        {t.name.split(' ')[0]}
                      </span>
                      {active && <div className="w-2 h-2 rounded-full bg-pink-500" />}
                      {!unlocked && <Lock className="w-3 h-3 text-slate-600" />}
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono block">
                      {unlocked ? 'Unlocked' : `Requires ${t.unlockedAtCoins} pushed`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. LEVEL SELECTION MAP */}
          <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-5 shadow-lg flex flex-col gap-3 backdrop-blur-sm">
            <span className="text-xs font-black uppercase text-pink-400 tracking-widest block">
              PRESSURE LEVELS SELECTOR
            </span>
            <div className="flex flex-col gap-2">
              {LEVEL_SETTINGS.map((level, idx) => {
                // To unlock level N, player must have cleared at least N-1 rounds
                const unlocked = stats.totalRoundsCleared >= idx;
                const active = levelIndex === idx;

                return (
                  <button
                    key={level.level}
                    disabled={!unlocked}
                    onClick={() => {
                      restartRun(idx);
                      sound.playRefill();
                    }}
                    id={`level-select-btn-${level.level}`}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      active
                        ? 'bg-slate-950 border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.15)]'
                        : unlocked
                        ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-200'
                        : 'bg-slate-950/10 border-slate-900/40 opacity-45 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs border ${
                        active ? 'bg-pink-500 border-pink-400 text-white shadow-[0_0_8px_#ec4899]' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}>
                        {level.level}
                      </span>
                      <div>
                        <p className={`text-xs font-extrabold ${active ? 'text-pink-400' : 'text-white'}`}>
                           {level.name}
                        </p>
                        <span className="text-[9px] font-mono text-slate-400 uppercase">
                          Target: {level.pushTarget} coins • Width: {level.boardWidth}px
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      {idx < stats.totalRoundsCleared ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : active ? (
                        <span className="text-[10px] font-bold text-pink-400 tracking-wider font-mono">PLAYING</span>
                      ) : !unlocked ? (
                        <Lock className="w-4 h-4 text-slate-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </main>

      {/* FOOTER METADATA SYSTEM */}
      <footer className="border-t border-slate-900 bg-slate-950/40 p-4 text-center text-xs text-slate-500 uppercase tracking-widest font-mono">
        COIN PUSHER ARCADE • ALL RIGHTS RESERVED • BUILD {new Date().getFullYear()}
      </footer>

      {/* --- OVERLAY MODAL: HOW TO PLAY HELP PANEL --- */}
      {showHelp && (
        <div className="fixed inset-0 bg-slate-950/90 flex justify-center items-center z-50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-xl w-full text-left relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-cyan-400" />
            
            <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-cyan-400" />
              <span>ARCADE INSTRUCTIONS</span>
            </h2>

            <div className="space-y-4 text-sm text-slate-300 overflow-y-auto max-h-[400px] pr-2">
              <div>
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wider text-cyan-400 mb-1">🎮 Core Objective</h3>
                <p className="text-xs leading-relaxed">
                  Drop heavy tokens onto the continuous sliding pusher shelf. Let them fall forward to shove existing coins off the front ledge to win score points. Clear the target score to win!
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wider text-cyan-400 mb-1">🕹️ How to Drop</h3>
                <p className="text-xs leading-relaxed">
                  Click/tap inside the central dropping channel of the board. Guide your mouse cursor left/right to aim with the ghost pointer guide. You have a limited queue of 15 drops.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wider text-cyan-400 mb-1">🚨 Side Gutters</h3>
                <p className="text-xs leading-relaxed">
                  Avoid letting coins slide off into the caution-striped left and right gutters. Coins lost to side gutters do not score, reset combo meters, or count towards drop refills!
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wider text-cyan-400 mb-1">🔥 Combo & Wheel Spin</h3>
                <p className="text-xs leading-relaxed">
                  Pushing 3+ coins off the front edge within a rapid {currentLevel.comboWindowMs / 1000}s window triggers a combo streak! Every 3-step combo chain awards a <strong>Wheel of Fortune Spin</strong> containing Coin Birds, Coin Towers, bumpers, and gutter shields!
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wider text-cyan-400 mb-1">💼 Pocket Coins Hand</h3>
                <p className="text-xs leading-relaxed">
                  Earn a choice of robust special cards (TNT explosives, magnetic waves, double value pads, and giga steel rollers) every 15 coins pushed. Spending a card drops a free utility token without consuming your standard queue!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              id="close-help-btn"
              className="mt-6 py-2 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest text-center"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}

      {/* --- OVERLAY MODALS: WHEEL SPIN & POCKET DRAFTING --- */}
      <RewardWheelModal
        isOpen={isWheelOpen}
        unlockedRewards={unlockedRewards}
        onRewardSelected={handleRewardWheelSelected}
      />

      <PocketCoinPickerModal
        isOpen={isPocketPickerOpen}
        unlockedPocketCoins={unlockedPocketCoins}
        onSelect={handlePocketCoinSelected}
      />
    </div>
  );
}
