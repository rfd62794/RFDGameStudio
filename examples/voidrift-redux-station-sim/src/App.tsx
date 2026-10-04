/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameState,
  createInitialGameState,
  loadGameState,
  saveGameState,
  runSimulationTick,
} from './services/simulation';
import { MODULE_BLUEPRINTS } from './data/recipes';
import { ModuleType } from './types';
import { soundEngine } from './services/audio';
import { Header } from './components/Header';
import { CosmicCanvas } from './components/CosmicCanvas';
import { ContainerInventory } from './components/ContainerInventory';
import { SynthesisChamber } from './components/SynthesisChamber';
import { ConstructionPallet } from './components/ConstructionPallet';
import { SignalArrayTerminal } from './components/SignalArrayTerminal';
import { ReconstructionCatalog } from './components/ReconstructionCatalog';
import { CollisionLogModal } from './components/CollisionLogModal';
import { HelpManualModal } from './components/HelpManualModal';
import {
  LayoutGrid,
  FlaskConical,
  Boxes,
  Radio,
  Sparkles,
  Hammer,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
} from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => loadGameState());
  const [activeTab, setActiveTab] = useState<
    'station' | 'synthesis' | 'storage' | 'signals' | 'reconstruction' | 'construction'
  >('station');
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showCollisionModal, setShowCollisionModal] = useState<boolean>(false);

  const stateRef = useRef<GameState>(gameState);
  stateRef.current = gameState;

  // 1. Core Simulation Tick Loop (60 FPS / dynamic delta)
  useEffect(() => {
    let lastTime = performance.now();
    let animationFrameId: number;

    const tick = (currentTime: number) => {
      const deltaSec = Math.min((currentTime - lastTime) / 1000, 0.2);
      lastTime = currentTime;

      setGameState((prevState) => {
        const nextState = runSimulationTick({ ...prevState }, deltaSec);
        return { ...nextState };
      });

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // 2. Periodic Auto-Save (Every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      saveGameState(stateRef.current);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleSelectModule = useCallback((moduleId: string | null) => {
    setGameState((prev) => ({
      ...prev,
      selectedModuleId: moduleId,
    }));
  }, []);

  const handleSelectBuildType = useCallback((type: ModuleType | null) => {
    setGameState((prev) => ({
      ...prev,
      buildingTypeToPlace: type,
    }));
  }, []);

  const handleCancelPlacement = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      buildingTypeToPlace: null,
    }));
  }, []);

  const handlePlaceModule = useCallback((x: number, y: number) => {
    setGameState((prev) => {
      if (!prev.buildingTypeToPlace) return prev;
      const bp = MODULE_BLUEPRINTS[prev.buildingTypeToPlace];
      if (prev.dust < bp.dustCost) {
        return {
          ...prev,
          notification: {
            message: `Insufficient Dust to construct ${bp.name} (Need ${bp.dustCost} Dust).`,
            type: 'warn',
            timestamp: Date.now(),
          },
        };
      }

      // Check if tile is occupied
      const occupied = prev.modules.some((m) => m.x === x && m.y === y);
      if (occupied) {
        return {
          ...prev,
          notification: {
            message: `Grid coordinate (${x}, ${y}) is already occupied!`,
            type: 'warn',
            timestamp: Date.now(),
          },
        };
      }

      const modId = 'mod_' + Math.random().toString(36).substr(2, 8);
      const isContainer = bp.containerState !== undefined;
      const slotId = isContainer ? 'slot_' + Math.random().toString(36).substr(2, 8) : undefined;

      const newModule = {
        id: modId,
        type: prev.buildingTypeToPlace,
        x,
        y,
        level: 1,
        health: bp.maxHealth,
        maxHealth: bp.maxHealth,
        isPowered: true,
        efficiency: 1.0,
        containerSlotId: slotId,
        activeRecipeId: prev.buildingTypeToPlace === 'processing_chamber' ? 'recipe_fracture_solvent' : undefined,
        processingProgress: 0,
      };

      const newSlots = [...prev.containerSlots];
      if (isContainer && slotId && bp.containerState) {
        newSlots.push({
          id: slotId,
          stateType: bp.containerState,
          compoundId: null,
          amount: 0,
          capacity: bp.containerState === 'dust' ? 250 : 100,
          integrity: 100,
          isBreached: false,
          moduleId: modId,
        });
      }

      soundEngine.playBuildClink();

      return {
        ...prev,
        dust: prev.dust - bp.dustCost,
        modules: [...prev.modules, newModule],
        containerSlots: newSlots,
        buildingTypeToPlace: null,
        selectedModuleId: modId,
        notification: {
          message: `Constructed ${bp.name} at coordinates (${x}, ${y}).`,
          type: 'success',
          timestamp: Date.now(),
        },
      };
    });
  }, []);

  const handleDismantleModule = useCallback((moduleId: string) => {
    setGameState((prev) => {
      const mod = prev.modules.find((m) => m.id === moduleId);
      if (!mod) return prev;
      if (prev.modules.length <= 1) {
        return {
          ...prev,
          notification: {
            message: 'Cannot dismantle the primary station module!',
            type: 'warn',
            timestamp: Date.now(),
          },
        };
      }

      const bp = MODULE_BLUEPRINTS[mod.type];
      const refund = Math.round(bp.dustCost * 0.6);

      return {
        ...prev,
        dust: Math.min(prev.maxDust, prev.dust + refund),
        modules: prev.modules.filter((m) => m.id !== moduleId),
        containerSlots: prev.containerSlots.filter((s) => s.moduleId !== moduleId),
        selectedModuleId: null,
        notification: {
          message: `Dismantled ${bp.name}. Refunded +${refund} Dust.`,
          type: 'info',
          timestamp: Date.now(),
        },
      };
    });
  }, []);

  const handleRepairModule = useCallback((moduleId: string) => {
    setGameState((prev) => {
      const mod = prev.modules.find((m) => m.id === moduleId);
      if (!mod || mod.health >= mod.maxHealth) return prev;
      const needed = mod.maxHealth - mod.health;
      const cost = Math.round(needed * 0.25);
      if (prev.dust < cost) {
        return {
          ...prev,
          notification: {
            message: `Need ${cost} Dust for instant repair!`,
            type: 'warn',
            timestamp: Date.now(),
          },
        };
      }

      mod.health = mod.maxHealth;
      return {
        ...prev,
        dust: prev.dust - cost,
        notification: {
          message: `${MODULE_BLUEPRINTS[mod.type].name} restored to 100% integrity.`,
          type: 'success',
          timestamp: Date.now(),
        },
      };
    });
  }, []);

  const handleSetChamberRecipe = useCallback((moduleId: string, recipeId: string) => {
    setGameState((prev) => {
      const mod = prev.modules.find((m) => m.id === moduleId);
      if (!mod) return prev;
      mod.activeRecipeId = recipeId || null;
      mod.processingProgress = 0;
      return { ...prev };
    });
  }, []);

  const handlePurgeSlot = useCallback((slotId: string) => {
    setGameState((prev) => {
      const slot = prev.containerSlots.find((s) => s.id === slotId);
      if (!slot) return prev;
      slot.amount = 0;
      slot.compoundId = null;
      return {
        ...prev,
        notification: {
          message: 'Container purged and vented to vacuum.',
          type: 'info',
          timestamp: Date.now(),
        },
      };
    });
  }, []);

  const handleRepairSlot = useCallback((slotId: string) => {
    setGameState((prev) => {
      const slot = prev.containerSlots.find((s) => s.id === slotId);
      if (!slot) return prev;
      slot.integrity = 100;
      slot.isBreached = false;
      return { ...prev };
    });
  }, []);

  const handleTractorBottle = useCallback((bottleId: string) => {
    setGameState((prev) => {
      const bottle = prev.signalBottles.find((b) => b.id === bottleId);
      if (!bottle) return prev;
      bottle.status = 'retrieved';
      return {
        ...prev,
        notification: {
          message: `Tractor beam locked! ${bottle.name} retrieved for decryption.`,
          type: 'info',
          timestamp: Date.now(),
        },
      };
    });
  }, []);

  const handleInitiateReconstruction = useCallback((itemId: string) => {
    setGameState((prev) => {
      const item = prev.reconstructionItems.find((i) => i.id === itemId);
      if (!item || item.isCompleted || item.isReconstructing) return prev;

      if (prev.dust < item.dustCost) return prev;

      // Deduct dust and inputs
      prev.dust -= item.dustCost;
      item.requiredInputs.forEach((req) => {
        if (prev.products[req.inputId]) {
          prev.products[req.inputId].count -= req.amount;
        }
      });

      item.isReconstructing = true;
      item.progress = 0;

      return {
        ...prev,
        notification: {
          message: `Reconstruction started: Forging atomic matter for ${item.name}...`,
          type: 'info',
          timestamp: Date.now(),
        },
      };
    });
  }, []);

  const handleSetGameSpeed = useCallback((speed: number) => {
    setGameState((prev) => ({
      ...prev,
      gameSpeed: speed,
      isPaused: false,
    }));
  }, []);

  const handleTogglePause = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  }, []);

  const handleResetGame = useCallback(() => {
    if (window.confirm('Reset VoidRift Station progress and start anew?')) {
      const fresh = createInitialGameState();
      setGameState(fresh);
      saveGameState(fresh);
    }
  }, []);

  const handleSaveGame = useCallback(() => {
    saveGameState(gameState);
    setGameState((prev) => ({
      ...prev,
      notification: {
        message: 'Station state saved to local storage.',
        type: 'success',
        timestamp: Date.now(),
      },
    }));
  }, [gameState]);

  const handleResolveAllCollisions = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      collisionLogs: prev.collisionLogs.map((l) => ({ ...l, resolved: true })),
    }));
    setShowCollisionModal(false);
  }, []);

  return (
    <div className="flex flex-col w-full h-screen bg-[#050811] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Header Navigation */}
      <Header
        gameState={gameState}
        onSetGameSpeed={handleSetGameSpeed}
        onTogglePause={handleTogglePause}
        onResetGame={handleResetGame}
        onSaveGame={handleSaveGame}
        onOpenHelp={() => setShowHelpModal(true)}
        onOpenCollisionLogs={() => setShowCollisionModal(true)}
      />

      {/* Main View Area: Canvas (Left/Top) + Dashboard Modules (Right/Bottom) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Side: Sandustry Space Viewport */}
        <div className="w-full md:w-1/2 lg:w-7/12 h-[380px] md:h-full relative border-b md:border-b-0 md:border-r border-slate-800 flex flex-col">
          <CosmicCanvas
            gameState={gameState}
            onSelectModule={handleSelectModule}
            onPlaceModule={handlePlaceModule}
            onCancelPlacement={handleCancelPlacement}
            onTractorBottle={handleTractorBottle}
          />
        </div>

        {/* Right Side: Operational Tabs & System Controls */}
        <div className="w-full md:w-1/2 lg:w-5/12 h-full flex flex-col bg-[#070c18] overflow-hidden">
          {/* Subsystem Navigation Bar */}
          <nav className="w-full bg-slate-950/80 border-b border-slate-800/80 px-2 py-1.5 flex items-center justify-between gap-1 overflow-x-auto select-none flex-shrink-0">
            <button
              id="tab-station"
              onClick={() => setActiveTab('station')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
                activeTab === 'station'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>STATION</span>
            </button>

            <button
              id="tab-synthesis"
              onClick={() => setActiveTab('synthesis')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
                activeTab === 'synthesis'
                  ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>SYNTHESIS</span>
            </button>

            <button
              id="tab-storage"
              onClick={() => setActiveTab('storage')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
                activeTab === 'storage'
                  ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>STORAGE</span>
            </button>

            <button
              id="tab-signals"
              onClick={() => setActiveTab('signals')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap relative ${
                activeTab === 'signals'
                  ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>SIGNALS</span>
              {gameState.signalBottles.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping absolute top-1 right-1" />
              )}
            </button>

            <button
              id="tab-reconstruction"
              onClick={() => setActiveTab('reconstruction')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
                activeTab === 'reconstruction'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>CATALOG</span>
            </button>

            <button
              id="tab-construction"
              onClick={() => setActiveTab('construction')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
                activeTab === 'construction'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>BUILD</span>
            </button>
          </nav>

          {/* Active Tab Panel Body */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {activeTab === 'station' && (
              <div className="p-4 flex flex-col gap-5">
                <ConstructionPallet
                  gameState={gameState}
                  onSelectBuildType={handleSelectBuildType}
                  onSelectModule={handleSelectModule}
                  onDismantleModule={handleDismantleModule}
                  onRepairModule={handleRepairModule}
                />
              </div>
            )}

            {activeTab === 'synthesis' && (
              <SynthesisChamber
                gameState={gameState}
                onSetChamberRecipe={handleSetChamberRecipe}
                onSelectModule={handleSelectModule}
              />
            )}

            {activeTab === 'storage' && (
              <ContainerInventory
                gameState={gameState}
                onPurgeSlot={handlePurgeSlot}
                onRepairSlot={handleRepairSlot}
                onSelectModule={handleSelectModule}
              />
            )}

            {activeTab === 'signals' && (
              <SignalArrayTerminal
                gameState={gameState}
                onTractorBottle={handleTractorBottle}
              />
            )}

            {activeTab === 'reconstruction' && (
              <ReconstructionCatalog
                gameState={gameState}
                onInitiateReconstruction={handleInitiateReconstruction}
              />
            )}

            {activeTab === 'construction' && (
              <ConstructionPallet
                gameState={gameState}
                onSelectBuildType={handleSelectBuildType}
                onSelectModule={handleSelectModule}
                onDismantleModule={handleDismantleModule}
                onRepairModule={handleRepairModule}
              />
            )}
          </div>
        </div>
      </div>

      {/* Floating System Notification Toast */}
      {gameState.notification && (
        <div
          id="system-notification-toast"
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 max-w-lg px-4 py-2.5 rounded-xl border backdrop-blur-md shadow-2xl flex items-center gap-3 z-40 transition-all text-xs font-mono ${
            gameState.notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
              : gameState.notification.type === 'danger'
              ? 'bg-red-950/90 border-red-500/60 text-red-200 animate-bounce'
              : gameState.notification.type === 'warn'
              ? 'bg-amber-950/90 border-amber-500/60 text-amber-200'
              : 'bg-slate-900/90 border-cyan-500/60 text-cyan-200'
          }`}
        >
          {gameState.notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
          {gameState.notification.type === 'danger' && <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />}
          {gameState.notification.type === 'warn' && <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
          {gameState.notification.type === 'info' && <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
          <span className="leading-snug">{gameState.notification.message}</span>
        </div>
      )}

      {/* Modals */}
      {showHelpModal && <HelpManualModal onClose={() => setShowHelpModal(false)} />}
      {showCollisionModal && (
        <CollisionLogModal
          logs={gameState.collisionLogs}
          onClose={() => setShowCollisionModal(false)}
          onResolveAll={handleResolveAllCollisions}
        />
      )}
    </div>
  );
}
