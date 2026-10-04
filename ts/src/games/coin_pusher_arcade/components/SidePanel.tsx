// components/SidePanel.tsx — right column: arcade metrics, achievements,
// cabinet themes, and the pressure-level selector. Presentation only.

import { Sparkles, Trophy, Coins, Gift, Shield, Lock, ChevronRight, CheckCircle2 } from 'lucide-react';
import type { CoinType, GameStats, WheelReward } from '../types';
import { COIN_TYPES, WHEEL_REWARDS, BOARD_THEMES, LEVEL_SETTINGS } from '../data';
import { sound } from '../utils/sound';

interface SidePanelProps {
  stats: GameStats;
  currentCombo: number;
  comboTimer: number;
  refillProgress: number;
  refillThreshold: number;
  pocketProgress: number;
  pocketThreshold: number;
  themeId: string;
  onSelectTheme: (themeId: string) => void;
  levelIndex: number;
  onSelectLevel: (index: number) => void;
  unlockedCoins: CoinType[];
  unlockedRewards: WheelReward[];
}

export default function SidePanel({
  stats,
  currentCombo,
  comboTimer,
  refillProgress,
  refillThreshold,
  pocketProgress,
  pocketThreshold,
  themeId,
  onSelectTheme,
  levelIndex,
  onSelectLevel,
  unlockedCoins,
  unlockedRewards,
}: SidePanelProps) {
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* 1. SECTOR METRICS (COMBOS, REFILLS) */}
      <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-5 shadow-lg flex flex-col gap-4 backdrop-blur-sm">
        <h3 className="text-xs font-black uppercase text-pink-400 tracking-widest flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-500" />
          <span>ARCADE METRICS</span>
        </h3>

        {/* COMBO COUNTER METER */}
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
            <span className="text-pink-400 font-mono text-[10px]">{refillProgress} / {refillThreshold} Coins</span>
          </div>
          <div className="w-full bg-slate-950 border border-slate-800 rounded-full h-3 p-0.5 shadow-inner">
            <div
              className="bg-gradient-to-r from-pink-500 to-violet-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(refillProgress / refillThreshold) * 100}%` }}
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
            <span className="text-cyan-400 font-mono text-[10px]">{pocketProgress} / {pocketThreshold} Coins</span>
          </div>
          <div className="w-full bg-slate-950 border border-slate-800 rounded-full h-3 p-0.5 shadow-inner">
            <div
              className="bg-gradient-to-r from-cyan-400 to-violet-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(pocketProgress / pocketThreshold) * 100}%` }}
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
                  onSelectTheme(t.id);
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
                  onSelectLevel(idx);
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
  );
}
