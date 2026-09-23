/**
 * Gladiator Arena — Main Application Component
 * Manager-driven turn-based tactical gladiator combat simulation.
 *
 * Adapted for the RFDGameStudio arcade: accepts GameRendererProps (session)
 * per the studio contract. The game is TS-native and self-contained — the
 * session is destructured per contract but not used.
 */

import React, { useState } from 'react';
import type { GameRendererProps } from '../../engine/types';
import { GameShell } from '../../components';
import { GameProvider, useGame } from './context/GameContext';
import { RosterView } from './components/RosterView';
import { ShopView } from './components/ShopView';
import { MedbayView } from './components/MedbayView';
import { LadderView } from './components/LadderView';
import { ArenaCombatView } from './components/ArenaCombatView';
import { BalanceReportView } from './components/BalanceReportView';
import { ARENA_TIERS } from './simulation/championLadder';
import { sound } from './utils/soundEffects';
import {
  ShoppingBag,
  HeartPulse,
  Trophy,
  Coins,
  Users,
  Volume2,
  VolumeX,
  RotateCcw,
  Swords,
  Activity
} from 'lucide-react';

type ArenaTab = 'roster' | 'forge' | 'medbay' | 'ladder' | 'balance';

const GladiatorArenaApp: React.FC = () => {
  const env = import.meta.env as Record<string, string | undefined>;
  const mode = env.VITE_STANDALONE === 'true' ? 'standalone' : 'arcade';
  const arcadeBaseUrl = env.VITE_ARCADE_BASE_URL;
  const [currentTab, setCurrentTab] = useState<ArenaTab>('roster');
  const { activeBout, gold, roster, currentTierId, wins, losses, resetGame } = useGame();
  const [soundMuted, setSoundMuted] = useState(!sound.isSoundEnabled());
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const currentTier = ARENA_TIERS.find(t => t.id === currentTierId) || ARENA_TIERS[0];

  const toggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    sound.setEnabled(!next);
  };

  const tabCls = (tab: ArenaTab, activeCls: string, idleCls: string) =>
    `flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
      currentTab === tab ? activeCls : idleCls
    }`;

  return (
    <>
      <GameShell
        gameLabel="Gladiator Arena"
        gameId="gladiator_arena"
        phase="v1.0"
        mode={mode}
        arcadeBaseUrl={arcadeBaseUrl}
        className="bg-stone-950 text-stone-100 font-sans selection:bg-amber-500 selection:text-stone-950"
        mainClassName="game-shell-main--scrollable"
        headerExtra={
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
              <Swords className="w-5 h-5" />
            </div>
            <nav className="flex items-center gap-1 bg-stone-950/80 p-1 rounded-xl border border-stone-800 text-sm font-medium overflow-x-auto">
              <button
                id="tab-roster-btn"
                onClick={() => setCurrentTab('roster')}
                className={tabCls('roster', 'bg-amber-600 text-stone-950 font-semibold shadow', 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60')}
              >
                <Users className="w-4 h-4" />
                <span>Frames ({roster.length})</span>
              </button>

              <button
                id="tab-forge-btn"
                onClick={() => setCurrentTab('forge')}
                className={tabCls('forge', 'bg-amber-600 text-stone-950 font-semibold shadow', 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60')}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>The Forge</span>
              </button>

              <button
                id="tab-medbay-btn"
                onClick={() => setCurrentTab('medbay')}
                className={tabCls('medbay', 'bg-amber-600 text-stone-950 font-semibold shadow', 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60')}
              >
                <HeartPulse className="w-4 h-4" />
                <span>Medbay Clinic</span>
              </button>

              <button
                id="tab-ladder-btn"
                onClick={() => setCurrentTab('ladder')}
                className={tabCls('ladder', 'bg-red-600 text-white font-semibold shadow shadow-red-950/50 animate-pulse', 'text-stone-400 hover:text-red-300 hover:bg-red-950/20')}
              >
                <Swords className="w-4 h-4" />
                <span>Arena Bouts</span>
              </button>

              <button
                id="tab-balance-btn"
                onClick={() => setCurrentTab('balance')}
                className={tabCls('balance', 'bg-emerald-600 text-stone-950 font-bold shadow', 'text-stone-400 hover:text-emerald-300 hover:bg-emerald-950/30')}
              >
                <Activity className="w-4 h-4" />
                <span>Balance Lab</span>
              </button>

              <span className="text-xs text-amber-400/90 flex items-center gap-1 font-medium whitespace-nowrap px-2">
                <Trophy className="w-3 h-3 text-amber-400" />
                {currentTier.name} • {wins}W - {losses}L
              </span>
            </nav>

            {/* Quick Gold Counter on Mobile */}
            <div className="md:hidden flex items-center gap-1.5 px-3 py-1 rounded bg-amber-950/40 border border-amber-600/30 text-amber-300 font-mono font-bold text-sm shrink-0">
              <Coins className="w-4 h-4 text-amber-400" />
              {gold}g
            </div>
          </div>
        }
        statusArea={
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-950/40 border border-amber-600/40 text-amber-300 font-mono font-bold text-sm shadow-inner">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{gold} Gold</span>
            </div>

            <button
              id="sound-toggle-btn"
              onClick={toggleSound}
              title={soundMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="p-2 rounded-lg bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition"
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              id="reset-game-btn"
              onClick={() => {
                if (showResetConfirm) {
                  resetGame();
                  setShowResetConfirm(false);
                } else {
                  setShowResetConfirm(true);
                  setTimeout(() => setShowResetConfirm(false), 3000);
                }
              }}
              title="Reset Game State"
              className={`p-2 rounded-lg transition text-xs flex items-center gap-1 ${
                showResetConfirm
                  ? 'bg-red-600 text-white font-bold'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {showResetConfirm && <span>Confirm?</span>}
            </button>
          </div>
        }
        footer={
          <div className="border-t border-stone-900 bg-stone-950 py-4 px-4 text-center text-xs text-stone-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>Gladiator Arena Simulation Engine • Studio Anatomy & Forge Architecture</span>
              <span className="font-mono text-stone-600">
                "You don't swing the sword. You decide what it's attached to."
              </span>
            </div>
          </div>
        }
      >
        {/* Active Tab View Content */}
        <main className="flex-1 pb-16">
          {currentTab === 'roster' && <RosterView />}
          {currentTab === 'forge' && <ShopView />}
          {currentTab === 'medbay' && <MedbayView />}
          {currentTab === 'ladder' && <LadderView />}
          {currentTab === 'balance' && (
            <div className="max-w-7xl mx-auto px-4 py-6">
              <BalanceReportView />
            </div>
          )}
        </main>
      </GameShell>

      {/* Live Fullscreen Arena Battle Modal */}
      {activeBout && <ArenaCombatView />}
    </>
  );
};

export default function App({ session }: GameRendererProps) {
  void session; // destructured per contract; game is self-contained
  return (
    <GameProvider>
      <GladiatorArenaApp />
    </GameProvider>
  );
}
