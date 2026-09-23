/**
 * @file src/App.tsx
 * 7 Days to Fry — Fast-Food Kitchen Utility AI Simulation Application.
 * Features phase-based screen architecture, screen gating, and reorganized UI layout.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { EventFeed } from './components/EventFeed';
import { GameOverScreen } from './components/GameOverScreen';
import { IntroScreen } from './components/IntroScreen';
import { KitchenCanvas } from './components/KitchenCanvas';
import { NewGameScreen } from './components/NewGameScreen';
import { NightScreen } from './components/NightScreen';
import { SituationPanel } from './components/SituationPanel';
import { StaffRoster } from './components/StaffRoster';
import { VictoryScreen } from './components/VictoryScreen';
import { CONTAGION_EPSILON_FLOOR } from './data';
import { getLiveStats } from './liveStats';
import { createInitialKitchenState, startNextDay, tickKitchenState } from './sessionLoop';
import { KitchenState } from './types';
import { dischargeStaffMeal } from './wasteEconomy';
import { unloadTruck } from './stockEconomy';
import { purchaseBrandRecovery, purchaseBufferCapacity, purchaseDayDuration, purchaseFriesUnlock, purchaseStockCapacity } from './nightShop';
import { Award, Clock, DollarSign, Info, Shield, ShoppingBag, Trash2, Zap } from 'lucide-react';

export default function App() {
  const [screen, setScreen] = useState<'new_game' | 'playing'>('new_game');
  const [kitchenState, setKitchenState] = useState<KitchenState | null>(null);
  const [showSpecInfo, setShowSpecInfo] = useState(false);
  const lastTimeRef = useRef<number>(performance.now());

  // 60Hz Physics & Steering Loop
  useEffect(() => {
    let animId: number;

    const loop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      if (screen === 'playing' && kitchenState && kitchenState.gamePhase === 'day') {
        setKitchenState((prev) => {
          if (!prev || prev.isPaused || prev.gamePhase !== 'day') return prev;
          const nextState = { ...prev };
          tickKitchenState(nextState, dt);
          return nextState;
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [screen, kitchenState?.gamePhase, kitchenState?.isPaused]);

  // Phase & Screen Action Handlers
  const handleStartGame = () => {
    const state = createInitialKitchenState();
    state.gamePhase = 'intro';
    state.dayNumber = 1;
    setKitchenState(state);
    setScreen('playing');
  };

  const handleContinueFromIntro = () => {
    setKitchenState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        gamePhase: 'night',
      };
    });
  };

  const handleStartNextDay = () => {
    setKitchenState((prev) => {
      if (!prev) return null;
      const next = { ...prev };
      startNextDay(next);
      return next;
    });
  };

  const handleUpdatePolicy = (policy: number) => {
    setKitchenState((prev) => {
      if (!prev) return null;
      return { ...prev, policyDial: policy };
    });
  };

  const handleRestartGame = () => {
    setKitchenState(null);
    setScreen('new_game');
  };

  const handleDischargeStaffMeal = () => {
    setKitchenState((prev) => {
      if (!prev) return null;
      const next = { ...prev };
      dischargeStaffMeal(next);
      return next;
    });
  };

  const handleRestockUnits = () => {
    setKitchenState((prev) => {
      if (!prev) return null;
      const next = { ...prev };
      unloadTruck(next);
      return next;
    });
  };

  const handleToggleAutoRestock = () => {
    setKitchenState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        autoRestockEnabled: !prev.autoRestockEnabled,
      };
    });
  };

  const handlePurchaseUpgrade = (upgradeType: 'buffer_capacity' | 'stock_capacity' | 'day_duration' | 'brand_recovery' | 'fries_unlock') => {
    setKitchenState((prev) => {
      if (!prev) return null;
      const next: KitchenState = {
        ...prev,
        purchasedUpgrades: { ...prev.purchasedUpgrades },
        unlockedStations: { ...prev.unlockedStations },
        stations: prev.stations.map((s) => ({ ...s })),
        shopItemsEverAvailable: { ...prev.shopItemsEverAvailable },
      };
      if (upgradeType === 'buffer_capacity') purchaseBufferCapacity(next);
      else if (upgradeType === 'stock_capacity') purchaseStockCapacity(next);
      else if (upgradeType === 'day_duration') purchaseDayDuration(next);
      else if (upgradeType === 'brand_recovery') purchaseBrandRecovery(next);
      else if (upgradeType === 'fries_unlock') purchaseFriesUnlock(next);
      return next;
    });
  };

  const handleResetSession = () => {
    const state = createInitialKitchenState();
    state.gamePhase = 'day';
    state.dayNumber = 1;
    setKitchenState(state);
  };

  // Render Screen Gating
  if (screen === 'new_game' || !kitchenState) {
    return <NewGameScreen onStartGame={handleStartGame} />;
  }

  if (kitchenState.gamePhase === 'intro') {
    return <IntroScreen onContinue={handleContinueFromIntro} />;
  }

  if (kitchenState.gamePhase === 'night') {
    return (
      <NightScreen
        state={kitchenState}
        onUpdatePolicy={handleUpdatePolicy}
        onStartNextDay={handleStartNextDay}
        onPurchaseUpgrade={handlePurchaseUpgrade}
      />
    );
  }

  if (kitchenState.gamePhase === 'game_over') {
    return <GameOverScreen state={kitchenState} onRestart={handleRestartGame} />;
  }

  if (kitchenState.gamePhase === 'victory') {
    return <VictoryScreen state={kitchenState} onRestart={handleRestartGame} />;
  }

  // Day Phase Simulation Layout
  const liveStats = getLiveStats(kitchenState);
  const elapsedSec = Math.floor(kitchenState.elapsedSeconds);
  const timeFormatted = `${Math.floor(elapsedSec / 60)
    .toString()
    .padStart(2, '0')}:${(elapsedSec % 60).toString().padStart(2, '0')}`;

  const demandTier = kitchenState.demandTier || 1;
  const queueStation = kitchenState.stations.find((s) => s.id === 'queue');
  const queueCount = queueStation ? queueStation.orders.length : 0;
  const contagionPct = Math.round(
    Math.max(CONTAGION_EPSILON_FLOOR, kitchenState.peerCorrCutNorm) * 100
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-amber-500/20">
              7F
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                7 Days to Fry
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Day {kitchenState.dayNumber}
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Fast-Food Kitchen Policy, Backpressure & Crew Sync Engine
              </p>
            </div>
          </div>

          {/* Rush Timer, Cash & Demand Tier */}
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl">
            <div className="flex items-center gap-2 font-mono text-xl font-bold text-amber-400">
              <Clock className="w-5 h-5 text-amber-500" />
              {timeFormatted}
            </div>
            <div className="flex items-center gap-1 font-mono text-base font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-2.5 py-0.5 rounded-md">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              {kitchenState.cash.toFixed(2)}
            </div>
            <div className="text-xs font-bold px-2.5 py-1 rounded-md border bg-amber-950/80 border-amber-600/80 text-amber-300">
              Demand Tier {demandTier.toFixed(1)}
            </div>
          </div>

          {/* Live Grade & Brand Equity Gauge */}
          <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              <span className="font-mono font-black text-xl text-purple-300 bg-purple-950 border border-purple-700/60 px-2 py-0.5 rounded-lg">
                {liveStats.currentGrade}
              </span>
            </div>

            <div className="space-y-1 w-28">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Brand Equity</span>
                <span
                  className={
                    kitchenState.brandEquity >= 70
                      ? 'text-emerald-400'
                      : kitchenState.brandEquity >= 40
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }
                >
                  {Math.round(kitchenState.brandEquity)}%
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    kitchenState.brandEquity >= 70
                      ? 'bg-emerald-500'
                      : kitchenState.brandEquity >= 40
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, kitchenState.brandEquity))}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Spec Info Toggle */}
          <button
            onClick={() => setShowSpecInfo(!showSpecInfo)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="View Architecture Directive Info"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* Situation Queue & Manager Repair Commitment Panel */}
        <SituationPanel state={kitchenState} onUpdate={() => setKitchenState({ ...kitchenState })} />

        {/* Metric Bar Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-md">
            <div className="p-3 bg-emerald-950 border border-emerald-700/50 rounded-lg text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Orders Served</div>
              <div className="text-xl font-bold font-mono text-emerald-400 flex items-baseline gap-1">
                {kitchenState.ordersServed}
                <span className="text-xs text-slate-400 font-normal">
                  ({liveStats.throughputPerMinute}/m)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-md">
            <div className="p-3 bg-blue-950 border border-blue-700/50 rounded-lg text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Customer Queue</div>
              <div className="text-xl font-bold font-mono text-blue-400">
                {queueCount} / {queueStation?.bufferCapacity || 8}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-md">
            <div className="p-3 bg-amber-950 border border-amber-700/50 rounded-lg text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Peer Contagion</div>
              <div className="text-xl font-bold font-mono text-amber-400">
                {contagionPct}%
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-md">
            <div className="p-3 bg-rose-950 border border-rose-700/50 rounded-lg text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Waste Buffer</div>
              <div className="text-xl font-bold font-mono text-rose-400">
                {kitchenState.wasteBuffer.toFixed(1)} <span className="text-xs text-slate-500">units</span>
              </div>
            </div>
          </div>
        </div>

        {/* Spec Info Modal */}
        {showSpecInfo && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-3 text-xs text-slate-300">
            <div className="flex justify-between items-center font-bold text-slate-100 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-2 text-amber-400">
                <Shield className="w-4 h-4" /> Locked Architectural Constraints (§0)
              </span>
              <button
                onClick={() => setShowSpecInfo(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 leading-relaxed text-slate-300">
              <li>
                <strong>Phase-Based Screen Architecture:</strong> Gated application flow through New Game, Intro, Night Setup, Day Shift, and Game Over states.
              </li>
              <li>
                <strong>No Threshold Gates:</strong> Workers select tasks via candidate utility scoring argmax at 2Hz.
              </li>
              <li>
                <strong>Epsilon Floor:</strong> Peer contagion uses <code className="text-amber-300">Math.max(0.05, k.peerCorrCutNorm)</code>.
              </li>
            </ul>
          </div>
        )}

        {/* Primary Workspace Grid */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Kitchen Canvas & Control Panel (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <KitchenCanvas
                state={kitchenState}
                onUpdatePolicy={handleUpdatePolicy}
                onStartNextDay={handleStartNextDay}
              />
              <ControlPanel
                state={kitchenState}
                onTogglePause={() =>
                  setKitchenState((prev) => (prev ? { ...prev, isPaused: !prev.isPaused } : null))
                }
                onChangeSpeed={(spd) =>
                  setKitchenState((prev) => (prev ? { ...prev, speedMultiplier: spd } : null))
                }
                onResetSession={handleResetSession}
              />
            </div>

            {/* Right Column: Event Feed (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <EventFeed state={kitchenState} />
            </div>
          </div>

          {/* Horizontal Staff Roster Below Canvas & Event Feed */}
          <StaffRoster state={kitchenState} />
        </div>
      </main>
    </div>
  );
}
