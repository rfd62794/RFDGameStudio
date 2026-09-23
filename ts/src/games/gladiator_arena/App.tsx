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
import { GameProvider, useGame } from './context/GameContext';
import { Navbar } from './components/Navbar';
import { RosterView } from './components/RosterView';
import { ShopView } from './components/ShopView';
import { MedbayView } from './components/MedbayView';
import { LadderView } from './components/LadderView';
import { ArenaCombatView } from './components/ArenaCombatView';
import { BalanceReportView } from './components/BalanceReportView';

const GladiatorArenaApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'roster' | 'forge' | 'medbay' | 'ladder' | 'balance'>('roster');
  const { activeBout } = useGame();

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Top Navbar */}
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

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

      {/* Live Fullscreen Arena Battle Modal */}
      {activeBout && <ArenaCombatView />}

      {/* Footer Info */}
      <footer className="border-t border-stone-900 bg-stone-950 py-4 px-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Gladiator Arena Simulation Engine • Studio Anatomy & Forge Architecture</span>
          <span className="font-mono text-stone-600">
            "You don't swing the sword. You decide what it's attached to."
          </span>
        </div>
      </footer>
    </div>
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
