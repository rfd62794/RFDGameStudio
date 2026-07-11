/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Trash2, Sprout, Info, RefreshCw, Eye, EyeOff } from 'lucide-react';
import {
  Cell,
  AlgaeHub,
  PlacementMode,
  Fish,
  Shark,
  FleshChunk,
  Occupant,
} from './types';
import {
  GRID_COLS,
  GRID_ROWS,
  FISH_LINEAGES,
  SHARK_LINEAGES,
  generateBalancedWorld,
  resolveTick,
  getHubCells,
  wrap,
  burstFleshChunks,
} from './simulation';

export default function App() {
  // Master simulation state in a single combined object for atomic updates and rendering safety
  const [simState, setSimState] = useState<{ grid: Cell[][]; algaeHubs: AlgaeHub[] }>({
    grid: [],
    algaeHubs: [],
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeMode, setActiveMode] = useState<PlacementMode>('fish');
  const [tickCount, setTickCount] = useState<number>(0);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(true);
  const [tickRate, setTickRate] = useState<number>(500); // 500ms default for a calmer, slower pace

  // Drag interaction tracking state
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [draggedCells, setDraggedCells] = useState<Set<string>>(new Set());

  // Population counts for minimal metadata display
  const [counts, setCounts] = useState({ fish: 0, sharks: 0, kelp: 0, chunks: 0 });
  
  // Track selected creature ID for the persistent highlight ring
  const [selectedCreatureId, setSelectedCreatureId] = useState<string | null>(null);

  // Initialize world on mount
  useEffect(() => {
    const { grid: initialGrid, algaeHubs: initialHubs } = generateBalancedWorld();
    setSimState({ grid: initialGrid, algaeHubs: initialHubs });
  }, []);

  // Compute counts from the current grid state
  useEffect(() => {
    let fish = 0;
    let sharks = 0;
    let kelp = 0;
    let chunks = 0;

    simState.grid.forEach((col) => {
      col.forEach((cell) => {
        if (cell.terrain === 'kelp') kelp++;
        if (cell.occupant?.type === 'fish') fish++;
        if (cell.occupant?.type === 'shark') sharks++;
        if (cell.occupant?.type === 'flesh_chunk') chunks++;
      });
    });

    setCounts({ fish, sharks, kelp, chunks });
  }, [simState.grid]);

  // Handle single simulation step (tick)
  const handleTick = useCallback(() => {
    setSimState((prev) => {
      const { grid: nextGrid, algaeHubs: nextHubs } = resolveTick(prev.grid, prev.algaeHubs);
      return { grid: nextGrid, algaeHubs: nextHubs };
    });
    setTickCount((t) => t + 1);
  }, []);

  // Tick interval loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      handleTick();
    }, tickRate);

    return () => clearInterval(interval);
  }, [isPlaying, handleTick, tickRate]);

  // Restart/reseed the simulation
  const handleReset = () => {
    const { grid: initialGrid, algaeHubs: initialHubs } = generateBalancedWorld();
    setSimState({ grid: initialGrid, algaeHubs: initialHubs });
    setTickCount(0);
    setSelectedCreatureId(null);
  };

  // Perform action on a cell based on current mode
  const interactWithCell = useCallback((x: number, y: number, mode: PlacementMode) => {
    setSimState((prev) => {
      const nextGrid = prev.grid.map((col) => col.map((cell) => ({ ...cell })));
      let nextHubs = [...prev.algaeHubs];
      const cell = nextGrid[x][y];
      const oldOccupantId = cell.occupant?.id;

      if (mode === 'cull') {
        // Cull occupant first
        if (cell.occupant) {
          if (cell.occupant.type === 'fish' || cell.occupant.type === 'shark') {
            burstFleshChunks(x, y, nextGrid);
          }
          cell.occupant = null;
        } else if (cell.terrain === 'kelp') {
          // If no occupant, Cull clears kelp terrain
          cell.terrain = 'water';
          // Clean up dead hub references
          nextHubs = nextHubs.filter((hub) => {
            const hubCells = getHubCells(hub.cx, hub.cy);
            const anyKelpLeft = hubCells.some((hc) => nextGrid[hc.x][hc.y].terrain === 'kelp');
            return anyKelpLeft;
          });
        }
      } else if (mode === 'fish') {
        if (cell.occupant === null) {
          // Place default pale fish
          cell.occupant = {
            id: `fish-${Math.random().toString(36).substr(2, 9)}`,
            type: 'fish',
            age: 2,
            fed: false,
            lineageId: 'default-fish',
            lineageColor: '#64748b', // Soft silver slate
          };
        } else if (cell.occupant.type === 'fish') {
          // Cycle lineages: default -> Coral -> Teal -> Orchid -> Rose -> Azure -> Empty (removed)
          const currId = cell.occupant.lineageId;
          if (currId === 'default-fish') {
            const nextL = FISH_LINEAGES[0];
            (cell.occupant as Fish).lineageId = nextL.id;
            (cell.occupant as Fish).lineageColor = nextL.color;
          } else {
            const index = FISH_LINEAGES.findIndex((l) => l.id === currId);
            if (index === FISH_LINEAGES.length - 1) {
              // Cycle to empty (remove)
              cell.occupant = null;
            } else {
              const nextL = FISH_LINEAGES[index + 1];
              (cell.occupant as Fish).lineageId = nextL.id;
              (cell.occupant as Fish).lineageColor = nextL.color;
            }
          }
        } else {
          // Replace different occupant
          cell.occupant = {
            id: `fish-${Math.random().toString(36).substr(2, 9)}`,
            type: 'fish',
            age: 2,
            fed: false,
            lineageId: 'default-fish',
            lineageColor: '#64748b',
          };
        }
      } else if (mode === 'shark') {
        if (cell.occupant === null) {
          // Place default slate shark
          cell.occupant = {
            id: `shark-${Math.random().toString(36).substr(2, 9)}`,
            type: 'shark',
            age: 5,
            fed: false,
            ticksSinceLastMeal: 0,
            lineageId: 'default-shark',
            lineageColor: '#334155', // Sleek dark slate
          };
        } else if (cell.occupant.type === 'shark') {
          // Cycle lineages: default -> Obsidian -> Crimson -> Emerald -> Indigo -> Empty (removed)
          const currId = cell.occupant.lineageId;
          if (currId === 'default-shark') {
            const nextL = SHARK_LINEAGES[0];
            (cell.occupant as Shark).lineageId = nextL.id;
            (cell.occupant as Shark).lineageColor = nextL.color;
          } else {
            const index = SHARK_LINEAGES.findIndex((l) => l.id === currId);
            if (index === SHARK_LINEAGES.length - 1) {
              // Cycle to empty (remove)
              cell.occupant = null;
            } else {
              const nextL = SHARK_LINEAGES[index + 1];
              (cell.occupant as Shark).lineageId = nextL.id;
              (cell.occupant as Shark).lineageColor = nextL.color;
            }
          }
        } else {
          // Replace different occupant
          cell.occupant = {
            id: `shark-${Math.random().toString(36).substr(2, 9)}`,
            type: 'shark',
            age: 5,
            fed: false,
            ticksSinceLastMeal: 0,
            lineageId: 'default-shark',
            lineageColor: '#334155',
          };
        }
      } else if (mode === 'algae') {
        if (cell.terrain === 'water') {
          // Place an Algae Hub centered here
          const hubId = `hub-${Math.random().toString(36).substr(2, 9)}`;
          nextHubs.push({ id: hubId, cx: x, cy: y, growthCooldown: 0 });

          // Set all hub cells to kelp terrain
          const hubCells = getHubCells(x, y);
          hubCells.forEach((hc) => {
            nextGrid[hc.x][hc.y].terrain = 'kelp';
          });
        } else if (cell.terrain === 'kelp') {
          if (nextHubs.length > 0) {
            // Find closest hub using toroidal distance
            let closestHub = nextHubs[0];
            let minDist = Infinity;

            nextHubs.forEach((hub) => {
              const dx = Math.abs(hub.cx - x);
              const dy = Math.abs(hub.cy - y);
              const toroidalDist = Math.min(dx, GRID_COLS - dx) + Math.min(dy, GRID_ROWS - dy);
              if (toroidalDist < minDist) {
                minDist = toroidalDist;
                closestHub = hub;
              }
            });

            // Clear its terrain cells
            const cellsToClear = getHubCells(closestHub.cx, closestHub.cy);
            cellsToClear.forEach((hc) => {
              nextGrid[hc.x][hc.y].terrain = 'water';
            });

            nextHubs = nextHubs.filter((h) => h.id !== closestHub.id);
          }
        }
      }

      // Sync persistent selection highlighting to the tapped creature
      const nextOccupant = nextGrid[x][y].occupant;
      if (nextOccupant && mode !== 'cull') {
        setTimeout(() => setSelectedCreatureId(nextOccupant.id), 0);
      } else if (mode === 'cull' && oldOccupantId) {
        setTimeout(() => {
          setSelectedCreatureId((curr) => (curr === oldOccupantId ? null : curr));
        }, 0);
      }

      return { grid: nextGrid, algaeHubs: nextHubs };
    });
  }, []);

  // Mouse drag handlers to draw onto the grid
  const handleCellMouseDown = (x: number, y: number) => {
    setIsMouseDown(true);
    setDraggedCells(new Set([`${x},${y}`]));
    interactWithCell(x, y, activeMode);
  };

  const handleCellMouseEnter = (x: number, y: number) => {
    if (!isMouseDown) return;
    const key = `${x},${y}`;
    if (!draggedCells.has(key)) {
      setDraggedCells((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
      interactWithCell(x, y, activeMode);
    }
  };

  // Listen for mouse up globally to stop drawing
  useEffect(() => {
    const handleMouseUp = () => {
      setIsMouseDown(false);
      setDraggedCells(new Set());
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Accumulate all active occupants across the grid for high-fidelity continuous absolute overlay rendering
  const activeOccupants: any[] = [];
  simState.grid.forEach((column, x) => {
    column.forEach((cell, y) => {
      if (cell.occupant) {
        activeOccupants.push({
          id: cell.occupant.id,
          type: cell.occupant.type,
          x,
          y,
          age: cell.occupant.type === 'fish' || cell.occupant.type === 'shark' ? cell.occupant.age : undefined,
          ticksRemaining: cell.occupant.type === 'flesh_chunk' ? cell.occupant.ticksRemaining : undefined,
          lineageColor: cell.occupant.type === 'fish' || cell.occupant.type === 'shark' ? cell.occupant.lineageColor : undefined,
        });
      }
    });
  });

  // Check if cell is the center of any AlgaeHub
  const checkHubCenter = (x: number, y: number) => {
    return simState.algaeHubs.find((hub) => hub.cx === x && hub.cy === y);
  };

  return (
    <div className="min-h-screen bg-[#faf6eb] text-[#331c0e] font-sans flex flex-col items-center justify-between p-3 md:p-6 select-none relative overflow-y-auto">
      {/* Background Water Shimmer effect */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#fdf9f0] pointer-events-none opacity-40" />

      {/* Header section */}
      <header className="w-full max-w-7xl flex flex-col items-center justify-center pt-2 pb-4 z-10">
        <div className="flex items-center gap-3">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-display font-bold tracking-[0.25em] text-[#2c1a0c]"
          >
            SHOAL
          </motion.h1>
          {/* Subtle heartbeat simulation status indicator */}
          <div className="relative flex h-3 w-3">
            {isPlaying && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                isPlaying ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            ></span>
          </div>
        </div>
        <p className="font-mono text-[10px] md:text-xs text-amber-800 uppercase tracking-[0.3em] mt-1.5">
          a toroidal reef ecosystem sandbox
        </p>
      </header>

      {/* Main Sandbox Grid Workspace */}
      <main className="w-full max-w-7xl flex-1 flex flex-col items-center justify-center my-2 z-10">
        <div className="w-full overflow-x-auto pb-4 flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-block bg-[#f4ece0] p-2 md:p-3 rounded-2xl shadow-xl border-4 border-[#e9ded0] relative"
            id="simulation-canvas-container"
          >
            {/* The Toroidal Grid of 50 columns x 35 rows */}
            <div
              className="grid grid-cols-[repeat(50,minmax(0,1fr))] gap-[1px] bg-[#dfd4c5] overflow-hidden rounded-lg select-none cursor-crosshair relative"
              style={{
                width: 'min(92vw, 1050px)',
                height: 'min(64.4vw, 735px)', // perfectly scales rows 35 : cols 50 (aspect ratio 1.428)
              }}
            >
              {simState.grid.length > 0 && Array.from({ length: GRID_ROWS }).map((_, y) =>
                Array.from({ length: GRID_COLS }).map((_, x) => {
                  const cell = simState.grid[x]?.[y];
                  if (!cell) return null;
                  const hubCenter = checkHubCenter(x, y);
                  const isKelp = cell.terrain === 'kelp';

                  return (
                    <div
                      key={`${x}-${y}`}
                      onMouseDown={() => handleCellMouseDown(x, y)}
                      onMouseEnter={() => handleCellMouseEnter(x, y)}
                      className={`relative aspect-square flex items-center justify-center transition-colors duration-300 overflow-hidden ${
                        isKelp
                          ? 'bg-[#d0ebd0]/40 hover:bg-[#b0dbb0]/60'
                          : 'bg-[#faf6eb] hover:bg-[#e9dfcf]'
                      }`}
                    >
                      {/* Grid overlay for toroidal wrapping lines */}
                      <div className="absolute inset-0 border-[0.2px] border-[#ecdcb9]/30 pointer-events-none" />

                      {/* Terrain Rendering: Kelp Foliage Spoke & Hub */}
                      {isKelp && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {hubCenter ? (
                            // Large breathing root hub node
                            <motion.div
                              animate={{ scale: [0.95, 1.05, 0.95] }}
                              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                              className="w-[85%] h-[85%] rounded-full bg-emerald-700/25 border border-emerald-600 flex items-center justify-center"
                            >
                              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-emerald-800 shadow" />
                            </motion.div>
                          ) : (
                            // Organic looking leafy spoke tip
                            <div className="w-[60%] h-[60%] rounded-tr-2xl rounded-bl-2xl bg-emerald-600/30 transform rotate-12 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Gentle Hover Cursor Preview ghost */}
                      <div className="absolute inset-0 opacity-0 hover:opacity-20 flex items-center justify-center pointer-events-none bg-amber-500/10 transition-opacity duration-150">
                        {activeMode === 'fish' && !cell.occupant && renderFishIcon('#64748b', 3)}
                        {activeMode === 'shark' && !cell.occupant && renderSharkIcon('#334155', 7)}
                        {activeMode === 'algae' && cell.terrain === 'water' && (
                          <div className="w-[60%] h-[60%] rounded-tr-2xl rounded-bl-2xl bg-emerald-600/30" />
                        )}
                        {activeMode === 'cull' && (cell.occupant || cell.terrain === 'kelp') && (
                          <div className="w-full h-full border border-rose-600 rounded bg-rose-500/25" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Absolute high-fidelity overlay for occupants (Continuous gliding, organic wiggle, and highlight rings) */}
              <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-10">
                <AnimatePresence>
                  {activeOccupants.map((occ) => (
                    <LivingOccupant
                      key={occ.id}
                      occupant={occ}
                      tickRate={tickRate}
                      selected={selectedCreatureId === occ.id}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Control Interface Panel */}
      <footer className="w-full max-w-5xl flex flex-col items-center gap-4 mt-1 z-10">
        {/* Core Control Panel */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between bg-[#f2e7d8] border border-[#e2d5c4] p-4 rounded-2xl shadow-md gap-4">
          
          {/* Element 1: Play/Pause tactile ring */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md border-2 transition-all active:scale-95 ${
                isPlaying
                  ? 'bg-amber-100 hover:bg-amber-50 border-amber-900/10 text-amber-900'
                  : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white'
              }`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </button>
            <div className="flex flex-col">
              <span className="font-mono text-xs font-semibold tracking-wide text-amber-950 uppercase">
                {isPlaying ? 'Reef Alive' : 'Simulation Paused'}
              </span>
              <button
                onClick={() => {
                  setTickRate((prev) => {
                    if (prev === 800) return 500;
                    if (prev === 500) return 200;
                    return 800;
                  });
                }}
                className="font-mono text-[9px] text-amber-700 hover:text-amber-950 uppercase text-left transition-colors font-medium mt-0.5 flex items-center gap-1 cursor-pointer"
                title="Click to cycle simulation speeds"
              >
                <span>Speed:</span>
                <span className="underline decoration-dashed underline-offset-2">
                  {tickRate === 800 ? '🐢 Serene (800ms)' : tickRate === 500 ? '🌊 Calm (500ms)' : '⚡ Swift (200ms)'}
                </span>
              </button>
              <span className="font-mono text-[9px] text-amber-700 uppercase mt-0.5">
                Chronon Ticks: {tickCount}
              </span>
            </div>
          </div>

          {/* Element 2: Mode Selector Segment (Fish, Shark, Algae, Cull) */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { id: 'fish', label: 'Fish mode', color: '#0d9488', bg: 'bg-[#e0f2f1]' },
              { id: 'shark', label: 'Shark mode', color: '#dc2626', bg: 'bg-[#ffebee]' },
              { id: 'algae', label: 'Algae mode', color: '#15803d', bg: 'bg-[#e8f5e9]' },
              { id: 'cull', label: 'Cull mode', color: '#9f1239', bg: 'bg-[#fff1f2]' },
            ].map((mode) => {
              const active = activeMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id as PlacementMode)}
                  className={`px-4 py-2.5 rounded-xl font-display text-xs font-semibold tracking-wider flex items-center gap-2 border-2 transition-all cursor-pointer select-none active:scale-95 ${
                    active
                      ? `${mode.bg} border-amber-900 text-amber-950 shadow-sm scale-[1.03]`
                      : 'bg-[#faf6eb]/50 hover:bg-[#faf6eb] border-transparent text-amber-900/70 hover:text-amber-900'
                  }`}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: mode.color }}
                  />
                  {mode.label}
                </button>
              );
            })}
          </div>

          {/* Action Tools: Reset and Rules Drawer togglers */}
          <div className="flex gap-2">
            {/* Show/Hide Stats */}
            <button
              onClick={() => setShowStats(!showStats)}
              className="p-2.5 rounded-xl bg-[#faf6eb]/70 hover:bg-[#faf6eb] border border-[#e2d5c4] text-amber-900/80 hover:text-amber-900 transition-colors cursor-pointer"
              title="Toggle Stats"
            >
              {showStats ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            {/* Reseed World */}
            <button
              onClick={handleReset}
              className="p-2.5 rounded-xl bg-[#faf6eb]/70 hover:bg-[#faf6eb] border border-[#e2d5c4] text-amber-900/80 hover:text-amber-900 transition-colors cursor-pointer"
              title="Reseed Ecosystem"
            >
              <RefreshCw size={16} />
            </button>
            {/* Information & Rules button */}
            <button
              onClick={() => setShowRules(!showRules)}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                showRules
                  ? 'bg-amber-950 border-amber-950 text-[#faf6eb]'
                  : 'bg-[#faf6eb]/70 hover:bg-[#faf6eb] border-[#e2d5c4] text-amber-900/80 hover:text-amber-900'
              }`}
              title="Reef Ledger Instructions"
            >
              <Info size={16} />
            </button>
          </div>

        </div>

        {/* Population Stats HUD Overlay (Collapsible) */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full grid grid-cols-4 bg-[#fbf5eb] rounded-xl border border-[#e6dfd3] p-3 text-center"
            >
              <div className="flex flex-col items-center border-r border-[#e6dfd3]/60">
                <span className="font-display text-lg md:text-xl font-bold text-[#0d9488]">{counts.fish}</span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-amber-800">Prey Fish</span>
              </div>
              <div className="flex flex-col items-center border-r border-[#e6dfd3]/60">
                <span className="font-display text-lg md:text-xl font-bold text-[#dc2626]">{counts.sharks}</span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-amber-800">Sharks</span>
              </div>
              <div className="flex flex-col items-center border-r border-[#e6dfd3]/60">
                <span className="font-display text-lg md:text-xl font-bold text-[#15803d]">{counts.kelp}</span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-amber-800">Kelp Sprouts</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-display text-lg md:text-xl font-bold text-[#be123c]">{counts.chunks}</span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-amber-800">Flesh Chunks</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Elegant Ecosystem Rules Drawer */}
        <AnimatePresence>
          {showRules && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden w-full bg-[#faf6eb] border border-amber-900/10 rounded-2xl mt-1 shadow-inner"
            >
              <div className="p-4 md:p-6 text-xs md:text-sm text-amber-900/80 space-y-4 max-h-[250px] overflow-y-auto">
                <div className="border-b border-amber-900/10 pb-2">
                  <h3 className="font-display font-bold text-sm uppercase tracking-wider text-amber-950">
                    The Reef Ledger — Mechanics & Life Cycles
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p>
                      <strong>🐟 Prey Fish:</strong> Move randomly to adjacent water. If a live **Kelp** spoke is adjacent, they graze it (gaining nourishment) instead. They breed at **5 chronons** if nourished, provided there is adjacent **Kelp** terrain.
                    </p>
                    <p>
                      <strong>🦈 Sharks:</strong> Hunt adjacent Fish. If no Fish is nearby, they use toroidal pathfinding to seek out and consume **Flesh Chunks** up to 8 cells away, or move randomly. They breed at **15 chronons** if they have eaten, and starve after **8 ticks** without food.
                    </p>
                    <p>
                      <strong>🌿 Algae (Kelp Hubs):</strong> Form a hub-and-spoke cluster radiating up to 2 cells. Left alone, grazed spoke tips regrow outward from the center over time. If a hub center and all its spokes are grazed to water, the hub goes extinct.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p>
                      <strong>🍖 Flesh Chunks:</strong> Burst 3 Chunks into the Moore neighborhood upon any creature's death (starvation, predation, or culling). Chunks decay and disappear after **10 chronons** if not eaten by sharks.
                    </p>
                    <p>
                      <strong>🎨 Lineage Tagging:</strong> Clicking an existing creature with its mode active cycles through **vibrant colors**. Newborn offspring inherit their parent's lineage color and tint, letting you watch lineages propagate and dominate the reef!
                    </p>
                    <p>
                      <strong>🖌️ Drag Painting:</strong> Click and hold on any cell, then drag across the grid to smoothly paint or erase elements in real time!
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimal Footer text */}
        <div className="text-[10px] text-amber-700/60 font-mono mt-2 select-none tracking-widest text-center">
          SHOAL SANDBOX • 2026 REEF EXPERIMENT
        </div>
      </footer>
    </div>
  );
}

// SVG Render Helpers for creatures (moved to module scope)
export const renderFishIcon = (color: string, age: number) => {
  // Mature fish are larger and brighter
  const scale = 0.5 + 0.5 * (Math.min(age, 5) / 5);
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-full h-full transition-all duration-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]"
      style={{ transform: `scale(${scale})` }}
    >
      <path
        d="M2,12 C5,8 10,6 16,12 C10,18 5,16 2,12 M16,12 L22,8 L20,12 L22,16 Z"
        fill={color}
        stroke="#451a03"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Eye */}
      <circle cx="6" cy="11.5" r="1.2" fill="#451a03" />
    </svg>
  );
};

export const renderSharkIcon = (color: string, age: number) => {
  const scale = 0.6 + 0.6 * (Math.min(age, 15) / 15);
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-full h-full transition-all duration-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.2)]"
      style={{ transform: `scale(${scale})` }}
    >
      <path
        d="M2,15 C6,12 11,7 16,7 C17,5 19,3 20,4 C19,6 18,8 17,9 C19,11 21,13 22,14 C17,16 13,17 10,18 L6,21 L7,17 Z"
        fill={color}
        stroke="#0f172a"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Eye */}
      <circle cx="15" cy="11" r="1.2" fill="#ef4444" />
    </svg>
  );
};

export const renderFleshChunkIcon = (ticksRemaining: number) => {
  const scale = ticksRemaining / 10;
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-full h-full transition-all duration-200"
      style={{ transform: `scale(${scale})` }}
    >
      <path
        d="M6,12 C4,10 5,6 10,6 C13,6 15,8 18,7 C20,9 19,13 16,14 C13,16 8,16 6,12 Z"
        fill="#be123c"
        stroke="#4c0519"
        strokeWidth="0.8"
      />
      {/* Speck of white bone */}
      <path d="M12,9 L13,10 L11,11 Z" fill="#ffffff" />
    </svg>
  );
};

interface LivingOccupantProps {
  key?: string;
  occupant: {
    id: string;
    type: 'fish' | 'shark' | 'flesh_chunk';
    x: number;
    y: number;
    age?: number;
    ticksRemaining?: number;
    lineageColor?: string;
  };
  tickRate: number;
  selected: boolean;
}

function LivingOccupant({ occupant, tickRate, selected }: LivingOccupantProps) {
  const { id, type, x, y, age, ticksRemaining, lineageColor } = occupant;

  // Track previous position to detect toroidal wrap and movement direction
  const prevPosRef = useRef({ x, y });
  const [prevPos, setPrevPos] = useState({ x, y });

  useEffect(() => {
    setPrevPos(prevPosRef.current);
    prevPosRef.current = { x, y };
  }, [x, y]);

  const prevX = prevPos.x;
  const prevY = prevPos.y;

  const dx = x - prevX;
  const dy = y - prevY;

  // Any cardinal shift > 1 cell is a toroidal wrap
  const isWrapped = Math.abs(dx) > 1 || Math.abs(dy) > 1;

  // Toroidal distance difference helper
  const wrapDiff = (diff: number, max: number) => {
    if (diff > max / 2) return diff - max;
    if (diff < -max / 2) return diff + max;
    return diff;
  };

  const moveX = wrapDiff(x - prevX, GRID_COLS);
  const moveY = wrapDiff(y - prevY, GRID_ROWS);

  const isMoving = (moveX !== 0 || moveY !== 0) && !isWrapped;

  // Rotation setup (Fish default faces Left/180deg, Shark faces Right/0deg)
  const headingRef = useRef(type === 'fish' ? 180 : 0);
  if (moveX !== 0 || moveY !== 0) {
    const angle = Math.atan2(moveY, moveX) * (180 / Math.PI);
    headingRef.current = type === 'fish' ? angle - 180 : angle;
  }
  const rotation = headingRef.current;

  // Transition: instant (duration 0) on toroidal wrap to prevent cross-screen sliding, smooth ease otherwise
  const transition = isWrapped
    ? { duration: 0 }
    : { duration: tickRate / 1000, ease: 'easeInOut' };

  return (
    <motion.div
      key={id}
      initial={{
        x: `${prevX * 100}%`,
        y: `${prevY * 100}%`,
        scale: 0.4,
        opacity: 0,
      }}
      animate={{
        x: `${x * 100}%`,
        y: `${y * 100}%`,
        scale: 1,
        opacity: 1,
      }}
      exit={{ scale: 0.2, opacity: 0 }}
      transition={transition}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: `${(1 / GRID_COLS) * 100}%`,
        height: `${(1 / GRID_ROWS) * 100}%`,
      }}
      className="flex items-center justify-center p-[4%] z-10 select-none pointer-events-none"
    >
      {/* Sprite Rotation Frame */}
      <div
        style={{
          transform: `rotate(${rotation}deg)`,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="relative"
      >
        {/* Organic Perpendicular Swim/Wobble Wiggle */}
        <div
          style={{
            animation: isMoving
              ? `swim-wiggle ${Math.min(tickRate * 0.7, 500)}ms ease-in-out infinite`
              : type !== 'flesh_chunk'
              ? `swim-wiggle 3000ms ease-in-out infinite` // slow idle breathing
              : 'none',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="relative"
        >
          {type === 'fish' && renderFishIcon(lineageColor || '#64748b', age || 2)}
          {type === 'shark' && renderSharkIcon(lineageColor || '#334155', age || 5)}
          {type === 'flesh_chunk' && renderFleshChunkIcon(ticksRemaining || 10)}
        </div>

        {/* Persistent selection highlight ring */}
        {selected && (
          <div className="absolute inset-[-15%] rounded-full border-2 border-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse z-20 pointer-events-none" />
        )}
      </div>
    </motion.div>
  );
}
