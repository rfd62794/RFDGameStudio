/**
 * Gladiator Arena — Main Header Navigation
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ARENA_TIERS } from '../simulation/championLadder';
import { sound } from '../utils/soundEffects';
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

interface NavbarProps {
  currentTab: 'roster' | 'forge' | 'medbay' | 'ladder' | 'balance';
  setCurrentTab: (tab: 'roster' | 'forge' | 'medbay' | 'ladder' | 'balance') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { gold, roster, currentTierId, wins, losses, resetGame } = useGame();
  const [soundMuted, setSoundMuted] = useState(!sound.isSoundEnabled());
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const currentTier = ARENA_TIERS.find(t => t.id === currentTierId) || ARENA_TIERS[0];

  const toggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    sound.setEnabled(!next);
  };

  return (
    <header id="main-navbar" className="bg-stone-900 border-b border-stone-800 sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Arena Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-wide text-stone-100 text-base uppercase">Gladiator Arena</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 font-mono border border-stone-700">v1.0</span>
              </div>
              <p className="text-xs text-amber-400/90 flex items-center gap-1 font-medium">
                <Trophy className="w-3 h-3 text-amber-400" />
                {currentTier.name} • {wins}W - {losses}L
              </p>
            </div>
          </div>

          {/* Quick Gold Counter on Mobile */}
          <div className="md:hidden flex items-center gap-1.5 px-3 py-1 rounded bg-amber-950/40 border border-amber-600/30 text-amber-300 font-mono font-bold text-sm">
            <Coins className="w-4 h-4 text-amber-400" />
            {gold}g
          </div>
        </div>

        {/* Center Tabs */}
        <nav className="flex items-center gap-1 bg-stone-950/80 p-1 rounded-xl border border-stone-800 text-sm font-medium w-full md:w-auto overflow-x-auto">
          <button
            id="tab-roster-btn"
            onClick={() => setCurrentTab('roster')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'roster'
                ? 'bg-amber-600 text-stone-950 font-semibold shadow'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Frames ({roster.length})</span>
          </button>

          <button
            id="tab-forge-btn"
            onClick={() => setCurrentTab('forge')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'forge'
                ? 'bg-amber-600 text-stone-950 font-semibold shadow'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>The Forge</span>
          </button>

          <button
            id="tab-medbay-btn"
            onClick={() => setCurrentTab('medbay')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'medbay'
                ? 'bg-amber-600 text-stone-950 font-semibold shadow'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span>Medbay Clinic</span>
          </button>

          <button
            id="tab-ladder-btn"
            onClick={() => setCurrentTab('ladder')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'ladder'
                ? 'bg-red-600 text-white font-semibold shadow shadow-red-950/50 animate-pulse'
                : 'text-stone-400 hover:text-red-300 hover:bg-red-950/20'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Arena Bouts</span>
          </button>

          <button
            id="tab-balance-btn"
            onClick={() => setCurrentTab('balance')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'balance'
                ? 'bg-emerald-600 text-stone-950 font-bold shadow'
                : 'text-stone-400 hover:text-emerald-300 hover:bg-emerald-950/30'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Balance Lab</span>
          </button>
        </nav>

        {/* Right Stats & Controls */}
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
      </div>
    </header>
  );
};
