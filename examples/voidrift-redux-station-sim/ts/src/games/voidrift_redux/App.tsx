import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState } from './types';
import {
  createInitialGameState,
  tickSimulation,
  computePowerBalance,
} from './services/simulation';
import { StationView } from './components/StationView';
import { ContainerPanel } from './components/ContainerPanel';
import { SynthesisPanel } from './components/SynthesisPanel';
import { ReconstructionPanel } from './components/ReconstructionPanel';
import { SignalPanel } from './components/SignalPanel';
import {
  Zap,
  Layers,
  LayoutGrid,
  Boxes,
  FlaskConical,
  Radio,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';

const STORAGE_KEY = 'voidrift_redux_phase1_save';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return createInitialGameState();
  });

  const [activeTab, setActiveTab] = useState<'station' | 'containers' | 'synthesis' | 'signals' | 'reconstruction'>('station');

  const gameStateRef = useRef<GameState>(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Real delta tick loop via requestAnimationFrame
  useEffect(() => {
    let lastTime = performance.now();
    let animId: number;

    const loop = (time: number) => {
      const deltaSec = Math.min((time - lastTime) / 1000, 0.2);
      lastTime = time;

      setGameState((prev) => {
        const next = tickSimulation({ ...prev }, deltaSec);
        return { ...next };
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Periodic save
  useEffect(() => {
    const timer = setInterval(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameStateRef.current));
      } catch {
        // ignore
      }
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectModule = useCallback((id: string | null) => {
    setGameState((prev) => ({ ...prev, selectedModuleId: id }));
  }, []);

  const handlePurgeSlot = useCallback((slotId: string) => {
    setGameState((prev) => {
      const slot = prev.containerSlots.find((s) => s.id === slotId);
      if (slot) {
        slot.amount = 0;
        slot.compoundId = null;
      }
      return { ...prev };
    });
  }, []);

  const handleSetRecipe = useCallback((moduleId: string, recipeId: string) => {
    setGameState((prev) => {
      const mod = prev.modules.find((m) => m.id === moduleId);
      if (mod) {
        mod.activeRecipeId = recipeId;
        mod.processingProgress = 0;
      }
      return { ...prev };
    });
  }, []);

  const handleTractorBottle = useCallback((bottleId: string) => {
    setGameState((prev) => {
      const bottle = prev.signalBottles.find((b) => b.id === bottleId);
      if (bottle) {
        bottle.status = 'retrieved';
      }
      return { ...prev };
    });
  }, []);

  const handleTogglePause = () => {
    setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleReset = () => {
    if (window.confirm('Reset VoidRift Station?')) {
      const fresh = createInitialGameState();
      setGameState(fresh);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      } catch {
        // ignore
      }
    }
  };

  const power = computePowerBalance(gameState);

  return (
    <div className="flex flex-col min-h-screen bg-[#050811] text-slate-100 font-sans select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#080d1a] border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold text-sm">
            VR
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>VoidRift Redux</span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                Phase 1
              </span>
            </h1>
            <span className="text-[10px] text-slate-400 font-mono">
              The black hole consumed what came before. Rebuild forward.
            </span>
          </div>
        </div>

        {/* Global Resources & Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-400">Dust:</span>
            <span className="text-slate-100 font-bold">{Math.round(gameState.dust)}</span>
            <span className="text-[10px] text-slate-500">/ {gameState.maxDust}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs">
            <Zap className={`w-3.5 h-3.5 ${power.sufficient ? 'text-yellow-400' : 'text-red-400'}`} />
            <span className="text-slate-400">Power:</span>
            <span className={power.sufficient ? 'text-yellow-300 font-bold' : 'text-red-400 font-bold'}>
              {power.generated.toFixed(0)} kW
            </span>
            <span className="text-[10px] text-slate-500">({power.consumed.toFixed(0)} kW load)</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleTogglePause}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
              title={gameState.isPaused ? 'Resume' : 'Pause'}
            >
              {gameState.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-300"
              title="Reset Station"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col p-4 gap-4 max-w-7xl w-full mx-auto">
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('station')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              activeTab === 'station'
                ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>STATION</span>
          </button>

          <button
            onClick={() => setActiveTab('containers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              activeTab === 'containers'
                ? 'bg-sky-950/80 text-sky-300 border border-sky-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>CONTAINERS</span>
          </button>

          <button
            onClick={() => setActiveTab('synthesis')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              activeTab === 'synthesis'
                ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>SYNTHESIS</span>
          </button>

          <button
            onClick={() => setActiveTab('reconstruction')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              activeTab === 'reconstruction'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>RECONSTRUCTION</span>
          </button>

          <button
            onClick={() => setActiveTab('signals')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              activeTab === 'signals'
                ? 'bg-blue-950/80 text-blue-300 border border-blue-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>SIGNALS</span>
          </button>
        </nav>

        {/* Tab Viewport */}
        <main className="flex-1">
          {activeTab === 'station' && (
            <StationView
              gameState={gameState}
              gameStateRef={gameStateRef}
              onSelectModule={handleSelectModule}
            />
          )}
          {activeTab === 'containers' && (
            <ContainerPanel gameState={gameState} onPurgeSlot={handlePurgeSlot} />
          )}
          {activeTab === 'synthesis' && (
            <SynthesisPanel gameState={gameState} onSetRecipe={handleSetRecipe} />
          )}
          {activeTab === 'reconstruction' && (
            <ReconstructionPanel gameState={gameState} />
          )}
          {activeTab === 'signals' && (
            <SignalPanel gameState={gameState} onTractorBottle={handleTractorBottle} />
          )}
        </main>
      </div>
    </div>
  );
}
