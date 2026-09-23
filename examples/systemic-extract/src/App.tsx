/**
 * Project "Systemic Extract" - Main Application Entry (ADR 011)
 * Seamless Megamap Action-Roguelite Base-Builder:
 * Merges Hideout progression and tactical expedition into a single 200x200 contiguous world space.
 */

import React from 'react';
import { GameViewport } from './components/GameViewport';

export default function App() {
  return (
    <div id="app-root" className="w-full h-screen overflow-hidden bg-[#090d13]">
      <GameViewport />
    </div>
  );
}

