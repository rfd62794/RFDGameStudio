// App.tsx — Coin Pusher Arcade shell.
//
// Ported from examples/coin-pusher-arcade (AI Studio export) for the
// TS-native arcade: wrapped in the shared GameShell, meta-progression
// persisted via engine/shared/persistence instead of hand-rolled
// localStorage, session prop accepted per the GameRendererProps contract.

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { GameRendererProps } from '../../engine/types';
import { GameShell } from '../../components';
import { Badge, EndStateScreen, MoreGamesByMe } from '../../ui/components';
import { navigateTo } from '../../arcade/routing';
import { loadSave, writeSave } from '../../engine/shared/persistence';
import { STANDALONE_BUILD_GAMES } from '../registry';
import type { GameStats, WheelReward, PocketCoinType, PocketCoinInstance } from './types';
import { LEVEL_SETTINGS, COIN_TYPES, WHEEL_REWARDS, POCKET_COIN_TYPES, BOARD_THEMES } from './data';
import { sound } from './utils/sound';
import BoardCanvas from './components/BoardCanvas';
import SidePanel from './components/SidePanel';
import PocketHand from './components/PocketHand';
import HelpModal from './components/HelpModal';
import RewardWheelModal from './components/RewardWheelModal';
import PocketCoinPickerModal from './components/PocketCoinPickerModal';
import {
  Trophy,
  Volume2,
  VolumeX,
  RotateCcw,
  HelpCircle,
  Zap,
  ArrowRight,
} from 'lucide-react';

const STORAGE_KEY = 'coin_pusher_arcade_meta_stats';
const REFILL_THRESHOLD = 10;
const POCKET_THRESHOLD = 15;
const STARTING_DROPS = 15;

const DEFAULT_STATS: GameStats = {
  totalCoinsPushed: 0,
  totalRoundsCleared: 0,
  highScores: {},
};

function startingHand(): PocketCoinInstance[] {
  return [
    { id: `tnt-${Date.now()}`, typeId: 'tnt', isUsed: false },
    { id: `magnet-${Date.now()}`, typeId: 'magnet', isUsed: false },
  ];
}

export default function App({ session }: GameRendererProps) {
  void session; // destructured per contract; the game is TS-native and self-contained
  const env = import.meta.env as Record<string, string | undefined>;
  const mode = env.VITE_STANDALONE === 'true' ? 'standalone' : 'arcade';
  const arcadeBaseUrl = env.VITE_ARCADE_BASE_URL;

  // Meta-progression, persisted via shared persistence helpers
  const [stats, setStats] = useState<GameStats>(
    () => loadSave<GameStats>(STORAGE_KEY) ?? DEFAULT_STATS
  );

  const saveStats = (newStats: GameStats) => {
    setStats(newStats);
    writeSave(STORAGE_KEY, newStats);
  };

  // Active level & theme
  const [levelIndex, setLevelIndex] = useState(0);
  const currentLevel = LEVEL_SETTINGS[levelIndex];
  const [themeId, setThemeId] = useState('neon');
  const currentTheme = BOARD_THEMES.find(t => t.id === themeId) || BOARD_THEMES[0];

  // Session gameplay
  const [dropQueue, setDropQueue] = useState(STARTING_DROPS);
  const [runScore, setRunScore] = useState(0);
  const [guttersCount, setGuttersCount] = useState(0);
  const [refillProgress, setRefillProgress] = useState(0);
  const [pocketProgress, setPocketProgress] = useState(0);
  const [pocketCoinsHand, setPocketCoinsHand] = useState<PocketCoinInstance[]>(startingHand);
  const [isMuted, setIsMuted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [activeBoardCoins, setActiveBoardCoins] = useState(0);
  const [hasWonRound, setHasWonRound] = useState(false);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [currentCombo, setCurrentCombo] = useState(0);
  const [comboTimer, setComboTimer] = useState(0);
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [isPocketPickerOpen, setIsPocketPickerOpen] = useState(false);

  // Particle/spawner triggers fed into the board
  const [pocketCoinToDrop, setPocketCoinToDrop] = useState<string | null>(null);
  const [triggerCoinBird, setTriggerCoinBird] = useState(false);
  const [triggerCoinTower, setTriggerCoinTower] = useState(false);
  const [triggerBumper, setTriggerBumper] = useState(false);
  const [triggerMultiplierPad, setTriggerMultiplierPad] = useState(false);
  const [triggerGutterShield, setTriggerGutterShield] = useState(false);
  const [gutterShieldActive, setGutterShieldActive] = useState(false);

  // Unlocked pools, memoized on the stats they derive from: the example
  // passed fresh .filter() arrays into the board component's init effect,
  // so the board re-initialized on every re-render.
  const unlockedCoins = useMemo(
    () => COIN_TYPES.filter(coin => stats.totalCoinsPushed >= coin.unlockedAtPushed),
    [stats.totalCoinsPushed]
  );
  const unlockedRewards = useMemo(
    () => WHEEL_REWARDS.filter(reward => stats.totalRoundsCleared >= reward.unlockedAtRounds),
    [stats.totalRoundsCleared]
  );
  const unlockedPocketCoins = useMemo(
    () => POCKET_COIN_TYPES.filter(coin => stats.totalCoinsPushed >= coin.unlockedAtPushed),
    [stats.totalCoinsPushed]
  );

  const restartRun = useCallback((chosenLevelIndex = levelIndex) => {
    setDropQueue(STARTING_DROPS);
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
    setPocketCoinsHand(startingHand());
    setLevelIndex(chosenLevelIndex);
  }, [levelIndex]);

  const toggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const triggerStandardDrop = () => {
    if (dropQueue <= 0 || isGameOver || (hasWonRound && !isInfiniteMode)) return;

    const canvas = document.getElementById('coin-pusher-canvas');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const dropX = rect.left + rect.width / 2 + (Math.random() - 0.5) * 80;
      const customEvent = new CustomEvent('request-coin-drop', {
        detail: { x: dropX },
      });
      window.dispatchEvent(customEvent);
    }

    setDropQueue(prev => prev - 1);
  };

  const dropPocketCoin = (instanceId: string, typeId: string) => {
    if (isGameOver) return;
    setPocketCoinsHand(prev =>
      prev.map(c => (c.id === instanceId ? { ...c, isUsed: true } : c))
    );
    setPocketCoinToDrop(typeId);
  };

  const handleCoinPushed = (value: number, _isPocket: boolean, _pocketTypeId?: string) => {
    const nextScore = runScore + value;
    setRunScore(nextScore);

    const wonNow = nextScore >= currentLevel.pushTarget && !hasWonRound;
    if (wonNow) {
      setHasWonRound(true);
      sound.playWin();
    }

    // Single merged write. The example wrote stats twice per push and its
    // second write re-spread pre-win stats, reverting totalRoundsCleared on
    // the winning push — which kept levels 2-4 and late wheel rewards
    // permanently locked. One ordered write preserves the designed outcome.
    saveStats({
      ...stats,
      totalCoinsPushed: stats.totalCoinsPushed + 1,
      totalRoundsCleared: wonNow
        ? Math.max(stats.totalRoundsCleared, currentLevel.level)
        : stats.totalRoundsCleared,
      highScores: {
        ...stats.highScores,
        [currentLevel.level]: Math.max(stats.highScores[currentLevel.level] || 0, nextScore),
      },
    });

    setRefillProgress(prev => {
      const next = prev + 1;
      if (next >= REFILL_THRESHOLD) {
        sound.playRefill();
        setDropQueue(q => q + 10);
        return 0;
      }
      return next;
    });

    setPocketProgress(prev => {
      const next = prev + 1;
      if (next >= POCKET_THRESHOLD) {
        setIsPocketPickerOpen(true);
        return 0;
      }
      return next;
    });
  };

  const handleGutterCoin = () => {
    setGuttersCount(prev => prev + 1);
  };

  const handleComboTriggered = (comboCount: number) => {
    setCurrentCombo(comboCount);
    setComboTimer(100);
    sound.playCombo(comboCount);

    // Every 3-step combo chain awards a wheel spin.
    if (comboCount % 3 === 0) {
      setTimeout(() => {
        setIsWheelOpen(true);
      }, 800);
    }
  };

  // Combo meter visual decay
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

    if (dropQueue === 0 && settled && activeCount === 0 && !isGameOver) {
      setIsGameOver(true);
    }
  };

  const handleRewardWheelSelected = (reward: WheelReward) => {
    setIsWheelOpen(false);

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
    setPocketCoinsHand(prev => {
      const reloaded = prev.map(item => ({ ...item, isUsed: false }));
      return [
        ...reloaded,
        { id: `${selected.id}-${Date.now()}`, typeId: selected.id, isUsed: false },
      ];
    });
  };

  // Spacebar quick drop
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

  const dropsBlocked = dropQueue === 0 || isGameOver || (hasWonRound && !isInfiniteMode);

  return (
    <GameShell
      gameLabel="COIN PUSHER"
      gameId="coin_pusher_arcade"
      statusArea={
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Badge label={`LVL ${String(currentLevel.level).padStart(2, '0')}`} variant="accent" />
          <Badge label={`${runScore}/${currentLevel.pushTarget}`} variant="amber" />
          <Badge label={`DROPS ${dropQueue}`} variant={dropQueue === 0 ? 'red' : 'green'} />
          <Badge label={`META ${(stats.totalCoinsPushed * 10).toLocaleString()}`} variant="muted" />
          {gutterShieldActive && <Badge label="SHIELD UP" variant="green" />}
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-pink-400 transition-colors"
            title="How to Play"
            id="help-btn"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Mute/Unmute sound synthesizers"
            id="mute-btn"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={() => restartRun()}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 transition-colors flex items-center gap-1 font-semibold text-xs tracking-wide uppercase"
            id="restart-btn"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      }
      footer={
        <div className="flex flex-col gap-2">
          <span className="text-xs text-slate-500">
            Space or DROP COIN to drop · push coins off the front ledge to score
          </span>
          <MoreGamesByMe
            mode={mode}
            currentGameId="coin_pusher_arcade"
            games={STANDALONE_BUILD_GAMES}
            onSelectGame={navigateTo}
            arcadeBaseUrl={arcadeBaseUrl}
          />
        </div>
      }
    >
      <div className="bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_#0f172a_100%)] min-h-full text-white">
        {/* STATS BANNER */}
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

        {/* MAIN BENTO LAYOUT */}
        <main className="max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 flex flex-col items-center">
            <div
              className="w-full bg-slate-900/60 rounded-3xl border border-pink-500/20 shadow-2xl overflow-hidden p-1 relative backdrop-blur-md"
              style={{ boxShadow: `0 0 40px -10px ${currentTheme.accentColor}30` }}
            >
              <div
                className="absolute top-0 bottom-0 left-0 w-1.5 transition-colors duration-300"
                style={{ backgroundColor: currentTheme.accentColor, boxShadow: `0 0 15px ${currentTheme.accentColor}` }}
              />
              <div
                className="absolute top-0 bottom-0 right-0 w-1.5 transition-colors duration-300"
                style={{ backgroundColor: currentTheme.accentColor, boxShadow: `0 0 15px ${currentTheme.accentColor}` }}
              />

              {/* MARQUEE STRIP */}
              <div className="bg-slate-900/80 p-4 border-b border-pink-500/20 flex justify-between items-center px-6">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-pink-400 uppercase tracking-widest font-mono">ACTIVE LEVEL</span>
                  <span className="text-sm font-black text-white uppercase tracking-wider italic">{currentLevel.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-pink-400 uppercase tracking-widest font-mono">SCORE TARGET</span>
                  <div className="text-sm font-black font-mono text-yellow-400 tracking-wider">
                    {runScore} <span className="text-slate-500">/</span> {currentLevel.pushTarget}
                  </div>
                </div>
              </div>

              {/* CANVAS STAGE */}
              <div className="bg-[#040508] p-4 flex justify-center items-center overflow-hidden min-h-[510px] relative">
                <BoardCanvas
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
                />

                {/* OVERLAY: GAME OVER */}
                {isGameOver && (
                  <div className="absolute inset-0 z-10 bg-slate-950/95">
                    <EndStateScreen
                      won={false}
                      headline="Out of Drops!"
                      flavorLine="Your queue is completely empty and all coins have settled. Better luck next time!"
                      stats={[
                        { label: 'Run Score', value: runScore },
                        { label: 'Target', value: currentLevel.pushTarget },
                        { label: 'Coins Guttered', value: guttersCount },
                      ]}
                      onRestart={() => restartRun()}
                      restartLabel="Play Again"
                    />
                  </div>
                )}

                {/* OVERLAY: ROUND VICTORY (two actions — kept bespoke) */}
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
                          onClick={() => restartRun(levelIndex + 1)}
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

              {/* CONTROLS PANEL */}
              <div className="bg-slate-900/95 border-t border-pink-500/20 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-950/85 px-5 py-3 rounded-xl border border-pink-500/30 text-center min-w-[120px] shadow-[inset_0_0_12px_rgba(236,72,153,0.15)] relative overflow-hidden">
                    <span className="text-[9px] text-pink-400 uppercase tracking-widest font-black block mb-1">DROPS QUEUE</span>
                    <span className="text-3xl font-black font-mono tracking-wider text-pink-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                      {dropQueue}
                    </span>
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

                <button
                  onClick={triggerStandardDrop}
                  disabled={dropsBlocked}
                  id="cabinet-drop-btn"
                  className={`h-14 px-12 rounded-xl font-black italic text-xl uppercase tracking-widest flex items-center justify-center gap-3 select-none transition-all duration-100 ${
                    dropsBlocked
                      ? 'bg-slate-800/40 border border-slate-900 text-slate-600 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-b from-pink-400 to-pink-600 text-white shadow-[0_8px_0_#9d174d] hover:translate-y-[2px] hover:shadow-[0_6px_0_#9d174d] active:translate-y-[6px] active:shadow-none'
                  }`}
                >
                  <Zap className="w-5 h-5 fill-white animate-pulse" />
                  <span>DROP COIN</span>
                </button>
              </div>

              <PocketHand
                hand={pocketCoinsHand}
                isGameOver={isGameOver}
                onDropPocketCoin={dropPocketCoin}
              />
            </div>
          </div>

          <div className="lg:col-span-5">
            <SidePanel
              stats={stats}
              currentCombo={currentCombo}
              comboTimer={comboTimer}
              refillProgress={refillProgress}
              refillThreshold={REFILL_THRESHOLD}
              pocketProgress={pocketProgress}
              pocketThreshold={POCKET_THRESHOLD}
              themeId={themeId}
              onSelectTheme={setThemeId}
              levelIndex={levelIndex}
              onSelectLevel={(idx) => restartRun(idx)}
              unlockedCoins={unlockedCoins}
              unlockedRewards={unlockedRewards}
            />
          </div>
        </main>

        <footer className="border-t border-slate-900 bg-slate-950/40 p-4 text-center text-xs text-slate-500 uppercase tracking-widest font-mono">
          COIN PUSHER ARCADE • ALL RIGHTS RESERVED • BUILD {new Date().getFullYear()}
        </footer>
      </div>

      {showHelp && (
        <HelpModal comboWindowMs={currentLevel.comboWindowMs} onClose={() => setShowHelp(false)} />
      )}

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
    </GameShell>
  );
}
