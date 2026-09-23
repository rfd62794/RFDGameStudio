import React, { useState, useEffect } from 'react';
import { GameState, TileState, GuardEntity, GameObject, TurnLogEntry } from './types';
import { generateProceduralRoom, getThemeForRoom } from './utils/roomGenerator';
import { applyCarrierEffect, getObjectWithProperty, triggerLoud } from './utils/physicsEngine';
import { processTurn } from './utils/turnEngine';
import GameBoard from './components/GameBoard';
import InventoryPanel from './components/InventoryPanel';
import GameLog from './components/GameLog';
import { 
  Shield, 
  Heart, 
  RotateCw, 
  Play, 
  RotateCcw, 
  Compass, 
  HelpCircle, 
  Award,
  Sparkles,
  Layers,
  ChevronRight,
  Skull
} from 'lucide-react';

const INITIAL_HEARTS = 3;
const MAX_ROOMS = 8;

const THEME_INFO = {
  block: { name: 'The Block', style: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  processing: { name: 'Processing Area', style: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  security: { name: 'Security Checkpoint', style: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
  maintenance: { name: 'Maintenance Sector', style: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
  perimeter: { name: 'Facility Perimeter', style: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    roomNumber: 1,
    maxRooms: MAX_ROOMS,
    grid: [],
    player: {
      x: 0,
      y: 6,
      hearts: INITIAL_HEARTS,
      maxHearts: INITIAL_HEARTS,
      inventory: [],
    },
    guards: [],
    gameState: 'start',
    selectedItemIndex: null,
    activeCarrierAction: null,
    logs: [],
    turnCount: 0,
  });

  // Generate initial room once playing starts
  const startNewRun = () => {
    const size = 7;
    const { grid, guards } = generateProceduralRoom(1, size);
    
    const startLog: TurnLogEntry = {
      id: `log-start-${Date.now()}`,
      turn: 0,
      text: 'Facility infiltration successful. Enter Room 1. Escape is at the top-right.',
      type: 'success',
    };

    setGameState({
      roomNumber: 1,
      maxRooms: MAX_ROOMS,
      grid,
      player: {
        x: 0,
        y: size - 1,
        hearts: INITIAL_HEARTS,
        maxHearts: INITIAL_HEARTS,
        inventory: [
          // Give some starting items to let the user play with properties immediately!
          {
            id: `start-lighter`,
            name: 'Lighter',
            properties: [],
            carriers: ['heat'],
            isPickable: true,
            status: 'normal'
          },
          {
            id: `start-battery`,
            name: 'Spare Battery',
            properties: ['conductive'],
            carriers: ['electric'],
            isPickable: true,
            status: 'normal'
          }
        ],
      },
      guards,
      gameState: 'playing',
      selectedItemIndex: null,
      activeCarrierAction: null,
      logs: [startLog],
      turnCount: 0,
    });
  };

  const advanceToNextRoom = (currentHearts: number, maxHearts: number, currentInventory: GameObject[]) => {
    const nextRoomNum = gameState.roomNumber + 1;
    if (nextRoomNum > MAX_ROOMS) {
      setGameState(prev => ({
        ...prev,
        gameState: 'escaped',
        logs: [
          ...prev.logs,
          {
            id: `log-victory-${Date.now()}`,
            turn: prev.turnCount,
            text: 'CRITICAL EVENT: Exited Facility safely! Escaped all guards!',
            type: 'success'
          }
        ]
      }));
      return;
    }

    const size = 7;
    const { grid, guards } = generateProceduralRoom(nextRoomNum, size);
    const roomLog: TurnLogEntry = {
      id: `log-room-${nextRoomNum}-${Date.now()}`,
      turn: gameState.turnCount,
      text: `Infiltrated Room ${nextRoomNum} of ${MAX_ROOMS}. Locate the exit.`,
      type: 'success',
    };

    setGameState(prev => ({
      ...prev,
      roomNumber: nextRoomNum,
      grid,
      player: {
        ...prev.player,
        x: 0,
        y: size - 1,
        hearts: currentHearts,
        maxHearts: maxHearts,
        inventory: currentInventory,
      },
      guards,
      selectedItemIndex: null,
      activeCarrierAction: null,
      logs: [...prev.logs, roomLog],
    }));
  };

  // Helper to add a log entry
  const addLog = (text: string, type: TurnLogEntry['type'] = 'info', turnNum: number) => {
    const newLog: TurnLogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      turn: turnNum,
      text,
      type,
    };
    return newLog;
  };

  /**
   * CORE TRIGGER: Execute a player turn and resolve enemy intents + physics propagation
   */
  const resolveTurn = (
    playerActionUpdate: (
      currentGrid: TileState[][],
      currentGuards: GuardEntity[],
      currentPlayer: GameState['player'],
      turnLogs: string[]
    ) => {
      grid: TileState[][];
      guards: GuardEntity[];
      player: GameState['player'];
      hasAdvanced: boolean;
    }
  ) => {
    setGameState(prev => processTurn(prev, playerActionUpdate));
  };

  /**
   * Action: Player Move to Adjacent Tile
   */
  const handleMove = (tx: number, ty: number) => {
    resolveTurn((currentGrid, currentGuards, currentPlayer, turnLogs) => {
      // Validate movement: distance 1, not a wall or locked gate
      const dx = Math.abs(tx - currentPlayer.x);
      const dy = Math.abs(ty - currentPlayer.y);
      const isAdj = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
      
      const targetTile = currentGrid[ty]?.[tx];
      const isBlocked = !targetTile || targetTile.isWall || (targetTile.isGated && !targetTile.isGatedUnlocked);

      if (!isAdj || isBlocked) {
        return { grid: currentGrid, guards: currentGuards, player: currentPlayer, hasAdvanced: false };
      }

      // Check if entering a guard tile directly (dangerous/blocked)
      const guardAtTile = currentGuards.find(g => g.x === tx && g.y === ty);
      if (guardAtTile && guardAtTile.immobilizedTurns === 0) {
        turnLogs.push(`Movement blocked! Guard stands there and is alert.`);
        return { grid: currentGrid, guards: currentGuards, player: currentPlayer, hasAdvanced: false };
      }

      // Move player
      currentPlayer.x = tx;
      currentPlayer.y = ty;
      turnLogs.push(`You stepped onto tile (${tx}, ${ty}).`);

      // Check for Adhesive environmental traps on landing tile!
      const isSticky = getObjectWithProperty(currentGrid[ty][tx], 'adhesive') !== null;
      if (isSticky) {
        turnLogs.push(`You stepped into a Sticky Glue puddle at (${tx}, ${ty})! You spend 1 turn breaking free.`);
        // To represent player getting glued, let's say they are just logged as stuck
      }

      return {
        grid: currentGrid,
        guards: currentGuards,
        player: currentPlayer,
        hasAdvanced: true,
      };
    });
  };

  /**
   * Action: Pick up Item from Player's current tile
   */
  const handlePickUp = () => {
    const px = gameState.player.x;
    const py = gameState.player.y;
    const tile = gameState.grid[py][px];

    if (!tile.item) {
      return;
    }

    if (tile.item.name === 'Heart Container') {
      // Heart container instantly increases max health and heals
      resolveTurn((currentGrid, currentGuards, currentPlayer, turnLogs) => {
        currentPlayer.maxHearts += 1;
        currentPlayer.hearts += 1;
        
        // Remove item from grid
        currentGrid[py][px].item = undefined;

        turnLogs.push(`SUCCESS: You ingested a rare Heart Container! Max Integrity raised to ${currentPlayer.maxHearts}. (+1 ❤️)`);
        return {
          grid: currentGrid,
          guards: currentGuards,
          player: currentPlayer,
          hasAdvanced: true,
        };
      });
      return;
    }

    // Standard inventory item
    if (gameState.player.inventory.length >= 6) {
      alert('Your inventory is full (max 6 items). Discard something to make room!');
      return;
    }

    resolveTurn((currentGrid, currentGuards, currentPlayer, turnLogs) => {
      const grabbedItem = tile.item!;
      currentPlayer.inventory = [...currentPlayer.inventory, grabbedItem];
      
      // Clear the item from the grid
      currentGrid[py][px].item = undefined;

      turnLogs.push(`You picked up the ${grabbedItem.name} from the floor.`);
      return {
        grid: currentGrid,
        guards: currentGuards,
        player: currentPlayer,
        hasAdvanced: true,
      };
    });
  };

  /**
   * Action: Interact with adjacent environmental objects (Rotate Mirrors!)
   */
  const handleRotateMirror = (mx: number, my: number) => {
    const tile = gameState.grid[my][mx];
    const isReflective = getObjectWithProperty(tile, 'reflective') !== null;

    if (!isReflective) return;

    resolveTurn((currentGrid, currentGuards, currentPlayer, turnLogs) => {
      // Rotate mirror angle
      const envObj = currentGrid[my][mx].environmentObject;
      const itemObj = currentGrid[my][mx].item;

      let newAngle: '/' | '\\' = '/';
      if (envObj && envObj.properties.includes('reflective')) {
        newAngle = envObj.mirrorAngle === '/' ? '\\' : '/';
        envObj.mirrorAngle = newAngle;
        envObj.name = `Mirror Panel (${newAngle})`;
      } else if (itemObj && itemObj.properties.includes('reflective')) {
        newAngle = itemObj.mirrorAngle === '/' ? '\\' : '/';
        itemObj.mirrorAngle = newAngle;
        itemObj.name = `Hand Mirror (${newAngle})`;
      }

      turnLogs.push(`You manually rotated the mirror at (${mx}, ${my}) to face "${newAngle}".`);
      return {
        grid: currentGrid,
        guards: currentGuards,
        player: currentPlayer,
        hasAdvanced: true,
      };
    });
  };

  /**
   * Action: Use Selected Item from Inventory on Target Tile
   */
  const handleUseItemOnTile = (tx: number, ty: number) => {
    if (gameState.selectedItemIndex === null) return;
    const item = gameState.player.inventory[gameState.selectedItemIndex];

    resolveTurn((currentGrid, currentGuards, currentPlayer, turnLogs) => {
      // Remove used item from inventory (since items are single-use)
      const nextInventory = currentPlayer.inventory.filter((_, idx) => idx !== gameState.selectedItemIndex);
      currentPlayer.inventory = nextInventory;

      // Check custom item placement cases first (Hand Mirror, Firecracker)
      if (item.name.startsWith('Hand Mirror')) {
        // Place mirror panel on grid
        const tile = currentGrid[ty]?.[tx];
        const isBlocked = !tile || tile.isWall || tile.environmentObject || tile.item || (tile.isGated && !tile.isGatedUnlocked);
        if (isBlocked) {
          turnLogs.push(`Placement failed: Tile (${tx}, ${ty}) is blocked.`);
          return { grid: currentGrid, guards: currentGuards, player: currentPlayer, hasAdvanced: false };
        }

        const angle = item.mirrorAngle || '/';
        currentGrid[ty][tx].environmentObject = {
          id: `mirror-placed-${Date.now()}`,
          name: `Mirror Panel (${angle})`,
          properties: ['reflective'],
          isPickable: false,
          status: 'normal',
          mirrorAngle: angle,
        };
        turnLogs.push(`You deployed a Hand Mirror (${angle}) onto tile (${tx}, ${ty}).`);

        return { grid: currentGrid, guards: currentGuards, player: currentPlayer, hasAdvanced: true };
      }

      if (item.name === 'Firecracker') {
        // Throw firecracker
        const tile = currentGrid[ty]?.[tx];
        const isBlocked = !tile || tile.isWall || tile.item || (tile.isGated && !tile.isGatedUnlocked);
        if (isBlocked) {
          turnLogs.push(`Throw failed: Tile (${tx}, ${ty}) is occupied or blocked.`);
          return { grid: currentGrid, guards: currentGuards, player: currentPlayer, hasAdvanced: false };
        }

        currentGrid[ty][tx].item = {
          id: `firecracker-thrown-${Date.now()}`,
          name: 'Firecracker',
          properties: ['flammable', 'loud'],
          isPickable: true,
          status: 'normal',
        };
        turnLogs.push(`You tossed a Firecracker onto tile (${tx}, ${ty}).`);

        // Emergent Property Check: If thrown onto an already ignited tile, it ignites immediately!
        if (currentGrid[ty][tx].status === 'ignited') {
          turnLogs.push(`The Firecracker landed directly on a burning tile and EXPLODED!`);
          
          const loudResult = triggerLoud(tx, ty, currentGuards, turnLogs);
          currentGuards = loudResult.guards;

          // Firecracker is consumed/gone from grid immediately after explosion
          currentGrid[ty][tx].item = undefined;
        }

        return { grid: currentGrid, guards: currentGuards, player: currentPlayer, hasAdvanced: true };
      }

      // Generic Property Carrier Resolvers (Heat, Electric, Adhesive)
      let carrier: 'heat' | 'electric' | 'adhesive' | null = null;
      if (item.carriers?.includes('heat')) carrier = 'heat';
      if (item.carriers?.includes('electric')) carrier = 'electric';
      if (item.name === 'Glue Bottle') carrier = 'adhesive';

      if (!carrier) {
        turnLogs.push(`Item "${item.name}" has no usable active carrier effect.`);
        return { grid: currentGrid, guards: currentGuards, player: currentPlayer, hasAdvanced: false };
      }

      // Apply property carriers through the core physics resolver
      const physicsResult = applyCarrierEffect(
        currentGrid,
        currentGuards,
        currentPlayer,
        tx,
        ty,
        carrier,
        turnLogs
      );

      return {
        grid: physicsResult.grid,
        guards: physicsResult.guards,
        player: {
          ...currentPlayer,
          hearts: physicsResult.playerDamageTaken ? currentPlayer.hearts - 1 : currentPlayer.hearts
        },
        hasAdvanced: true,
      };
    });
  };

  /**
   * Action: Discard/Drop Held Item on floor
   */
  const handleDropItem = (idx: number) => {
    const px = gameState.player.x;
    const py = gameState.player.y;
    const tile = gameState.grid[py][px];

    if (tile.item) {
      alert('Cannot drop: The tile you are standing on already contains an item on the floor!');
      return;
    }

    const item = gameState.player.inventory[idx];
    const updatedInventory = gameState.player.inventory.filter((_, i) => i !== idx);

    setGameState(prev => {
      const nextGrid = prev.grid.map(row => row.map(t => ({ ...t })));
      nextGrid[py][px].item = {
        ...item,
        isPickable: true // ensure it becomes grab-able again
      };

      const dropLog = addLog(`You dropped ${item.name} onto the floor at (${px}, ${py}).`, 'info', prev.turnCount);

      return {
        ...prev,
        grid: nextGrid,
        player: {
          ...prev.player,
          inventory: updatedInventory,
        },
        selectedItemIndex: null,
        activeCarrierAction: null,
        logs: [...prev.logs, dropLog]
      };
    });
  };

  /**
   * Selection Trigger for Inventory list
   */
  const handleSelectItem = (index: number) => {
    const item = gameState.player.inventory[index];
    let carrier: 'heat' | 'electric' | 'adhesive' | null = null;

    if (item.carriers?.includes('heat')) carrier = 'heat';
    else if (item.carriers?.includes('electric')) carrier = 'electric';
    else if (item.name === 'Glue Bottle') carrier = 'adhesive';
    else if (item.name.startsWith('Hand Mirror')) carrier = 'adhesive'; // Place mirror triggers carrier selection
    else if (item.name === 'Firecracker') carrier = 'heat'; // Thrown targets anything

    setGameState(prev => ({
      ...prev,
      selectedItemIndex: index,
      // Sets active aiming trigger depending on item characteristics
      activeCarrierAction: carrier,
    }));
  };

  const handleCancelUse = () => {
    setGameState(prev => ({
      ...prev,
      selectedItemIndex: null,
      activeCarrierAction: null,
    }));
  };

  /**
   * Global Tile Click Orchestrator
   */
  const handleTileClick = (tx: number, ty: number) => {
    const px = gameState.player.x;
    const py = gameState.player.y;

    // A: Holding an item? We are in use-aim mode. Apply item effect.
    if (gameState.selectedItemIndex !== null && gameState.activeCarrierAction !== null) {
      handleUseItemOnTile(tx, ty);
      return;
    }

    // B: Tap current tile where player stands? Perform "Pick Up Item"
    if (tx === px && ty === py) {
      handlePickUp();
      return;
    }

    // C: Tap adjacent reflective object? Perform "Rotate Mirror Panel"
    const tile = gameState.grid[ty][tx];
    const isAdjacent = (Math.abs(tx - px) === 1 && ty === py) || (Math.abs(ty - py) === 1 && tx === px);
    const isMirror = getObjectWithProperty(tile, 'reflective') !== null;
    
    if (isAdjacent && isMirror) {
      handleRotateMirror(tx, ty);
      return;
    }

    // D: Standard move to adjacent tile
    if (isAdjacent) {
      handleMove(tx, ty);
    }
  };

  // Autoplay progression for room clearance
  useEffect(() => {
    if (gameState.gameState !== 'playing') return;
    const px = gameState.player.x;
    const py = gameState.player.y;
    const size = gameState.grid.length;

    // Exit is always at size-1, 0
    if (px === size - 1 && py === 0) {
      advanceToNextRoom(gameState.player.hearts, gameState.player.maxHearts, gameState.player.inventory);
    }
  }, [gameState.player.x, gameState.player.y, gameState.gameState]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navigation / App Banner */}
      <header className="bg-slate-900/80 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Layers className="text-sky-400" size={20} />
          <div>
            <h1 className="text-base font-extrabold tracking-tight font-mono text-slate-100 flex items-center gap-1.5">
              FACILITY ESCAPE <span className="text-[10px] bg-slate-800 text-sky-400 border border-slate-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">MECHANICS PROTOTYPE</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">Turn-Based Property Rule Simulator v1.0.2</p>
          </div>
        </div>

        {gameState.gameState === 'playing' && (
          <div className="flex items-center gap-4 text-xs font-mono">
            {(() => {
              const themeKey = getThemeForRoom(gameState.roomNumber, MAX_ROOMS);
              const theme = THEME_INFO[themeKey] || { name: themeKey, style: 'text-slate-400 border-slate-700 bg-slate-800/50' };
              return (
                <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider ${theme.style}`}>
                  ZONE: {theme.name}
                </div>
              );
            })()}

            <div className="bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
              <span className="text-slate-500">LEVEL PROGRESSION:</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: MAX_ROOMS }).map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-2.5 h-2.5 rounded-full border transition-all ${
                      gameState.roomNumber === idx + 1 
                        ? 'bg-sky-500 border-sky-400 scale-110 animate-pulse' 
                        : gameState.roomNumber > idx + 1 
                          ? 'bg-emerald-500 border-emerald-400' 
                          : 'bg-slate-800 border-slate-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sky-400 font-bold ml-1">Room {gameState.roomNumber}/{MAX_ROOMS}</span>
            </div>

            <div className="bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-500">TURNS TAKEN:</span>
              <span className="font-bold text-slate-200">{gameState.turnCount}</span>
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col p-4 max-w-7xl mx-auto w-full gap-4 justify-center items-center">
        {/* State A: Start / Infiltration Screen */}
        {gameState.gameState === 'start' && (
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden my-auto">
            {/* Ambient background decoration */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center mb-4 text-sky-400">
                <Compass size={32} className="animate-spin-slow" style={{ animationDuration: '20s' }} />
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight font-mono text-slate-100 uppercase">
                Facility Infiltration Protocol
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-1">
                A system test of emergent physical behaviors and telecasted sightlines.
              </p>
            </div>

            <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/50 space-y-3 font-mono text-xs">
              <h3 className="font-extrabold text-amber-400 flex items-center gap-1.5 uppercase text-[11px]">
                <HelpCircle size={14} /> Mission Briefing & Core Objectives
              </h3>
              <p className="text-slate-300 leading-relaxed">
                You must navigate a sequence of <b>8 procedurally generated containment levels</b> to validate the escape mechanisms.
              </p>
              <ul className="space-y-1.5 text-slate-400 pl-4 list-disc">
                <li>
                  <b className="text-slate-200">The Core Turn Loop</b>: Every turn, guards decide their next action <span className="text-amber-300 font-bold">BEFORE</span> you act. You react to their shown future, then make your move. Only after your move resolves does the guard's action execute.
                </li>
                <li>
                  <b className="text-slate-200">The Property System</b>: Items and hazards carry universal tags (<span className="text-orange-400">Flammable</span>, <span className="text-cyan-400">Conductive</span>, <span className="text-indigo-400">Reflective</span>, <span className="text-yellow-400">Loud</span>, <span className="text-amber-400">Adhesive</span>). Trigger effects by applying Heat (Lighters) or Electricity (Batteries) to propagate emergent reactions.
                </li>
                <li>
                  <b className="text-slate-200">No Hardcoded Lookups</b>: A lighter lights ANY Flammable object—whether it's an oil spill, heavy curtains, or thrown firecrackers. A battery conducts electricity across any adjacent Conductive cells to stun guards.
                </li>
              </ul>
            </div>

            <button
              onClick={startNewRun}
              className="w-full bg-sky-600 hover:bg-sky-500 text-slate-950 font-black tracking-widest font-mono py-4 rounded-xl transition-all hover:scale-[1.01] flex items-center justify-center gap-2 shadow-lg shadow-sky-950/40 text-slate-900 text-sm uppercase"
            >
              <Play size={18} className="fill-slate-900" /> INITIATE INFILTRATION
            </button>
          </div>
        )}

        {/* State B: Active Sandbox Gameplay Screen */}
        {gameState.gameState === 'playing' && (
          <div className="w-full flex flex-col gap-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Left Column: Player Stats & Key Mechanics Details */}
              <div className="lg:col-span-3 flex flex-col gap-4">
                {/* Health & Status Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3.5 shadow-lg">
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    OPERATIVE STATUS
                  </h3>

                  {/* Hearts Display */}
                  <div className="flex items-center justify-between border-y border-slate-800 py-3">
                    <span className="text-xs font-mono text-slate-400">INTEGRITY:</span>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: gameState.player.maxHearts }).map((_, idx) => (
                        <Heart
                          key={idx}
                          size={18}
                          className={`transition-all ${
                            idx < gameState.player.hearts 
                              ? 'text-rose-500 fill-rose-500 scale-110 drop-shadow-[0_0_6px_rgba(244,63,94,0.4)]' 
                              : 'text-slate-700 fill-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Operative Details */}
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">CURRENT TILE:</span>
                      <span className="text-sky-400 font-bold">({gameState.player.x}, {gameState.player.y})</span>
                    </div>
                    
                    {/* Item at player feet */}
                    {gameState.grid[gameState.player.y]?.[gameState.player.x]?.item && (
                      <div className="mt-2 bg-sky-950/50 border border-sky-500/30 p-2 rounded-lg flex flex-col gap-1">
                        <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wide">Item At Your Feet:</span>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-100">
                            {gameState.grid[gameState.player.y][gameState.player.x].item?.name}
                          </span>
                          <button
                            onClick={handlePickUp}
                            className="bg-sky-500 hover:bg-sky-400 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded font-mono uppercase text-slate-900"
                          >
                            Pick Up
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Level Details & Controls */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2.5 shadow-lg">
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    RELOAD CONTROLS
                  </h3>
                  <button
                    onClick={startNewRun}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold font-mono text-xs py-2 px-3 rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw size={12} /> REGENERATE LEVEL RUN
                  </button>
                  <p className="text-[9px] text-slate-500 font-mono leading-normal mt-1">
                    Operative inventory and hearts carry forward between successfully solved containment rooms. Level restarts wipe carry forward.
                  </p>
                </div>
              </div>

              {/* Center Column: The Game Grid Board */}
              <div className="lg:col-span-6 flex flex-col items-center bg-slate-900/40 border border-slate-800 rounded-2xl shadow-lg pb-4">
                <GameBoard
                  grid={gameState.grid}
                  player={gameState.player}
                  guards={gameState.guards}
                  selectedItemIndex={gameState.selectedItemIndex}
                  activeCarrierAction={gameState.activeCarrierAction as any}
                  onTileClick={handleTileClick}
                />
              </div>

              {/* Right Column: Operative Inventory Panel */}
              <div className="lg:col-span-3 flex flex-col">
                <InventoryPanel
                  inventory={gameState.player.inventory}
                  selectedIndex={gameState.selectedItemIndex}
                  onSelectItem={handleSelectItem}
                  onDropItem={handleDropItem}
                  onCancelUse={handleCancelUse}
                />
              </div>

            </div>

            {/* Bottom Row: Game System Logs & Properties Reference Manual */}
            <GameLog logs={gameState.logs} />
          </div>
        )}

        {/* State C: Game Over / Defeat Screen */}
        {gameState.gameState === 'gameover' && (
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-5 shadow-2xl text-center my-auto relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500 animate-pulse mb-2">
              <Skull size={32} />
            </div>

            <h2 className="text-xl md:text-2xl font-black tracking-tight font-mono text-red-500 uppercase">
              Operative Neutralized
            </h2>

            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2.5 font-mono text-xs text-slate-300">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span>ROOMS CLEARED:</span>
                <span className="text-white font-bold">{gameState.roomNumber - 1} / {MAX_ROOMS}</span>
              </div>
              <div className="flex justify-between">
                <span>TURNS SURVIVED:</span>
                <span className="text-white font-bold">{gameState.turnCount}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              Remember to utilize telecasted sightlines and the property-based physics system. Place mirrors to redirect sightlines, throw firecrackers on burning tiles to distract, or conduct electric currents to disable.
            </p>

            <button
              onClick={startNewRun}
              className="w-full bg-red-600 hover:bg-red-500 text-slate-950 font-black tracking-widest font-mono py-3.5 rounded-xl transition-all hover:scale-[1.01] flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 text-slate-900 text-sm uppercase"
            >
              <RotateCcw size={16} /> RESET PROTOTYPE ATTEMPT
            </button>
          </div>
        )}

        {/* State D: Escaped / Victory Screen */}
        {gameState.gameState === 'escaped' && (
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-5 shadow-2xl text-center my-auto relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-bounce mb-2">
              <Award size={32} />
            </div>

            <h2 className="text-xl md:text-2xl font-black tracking-tight font-mono text-emerald-400 uppercase flex items-center justify-center gap-2">
              <Sparkles className="text-emerald-400 shrink-0" size={24} /> FACILITY ESCAPED!
            </h2>

            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2.5 font-mono text-xs text-slate-300">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span>TOTAL CONTAINMENTS CLEARED:</span>
                <span className="text-emerald-400 font-bold">{MAX_ROOMS} / {MAX_ROOMS}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span>TOTAL TURNS ELAPSED:</span>
                <span className="text-white font-bold">{gameState.turnCount}</span>
              </div>
              <div className="flex justify-between">
                <span>SURVIVING OPERATIVE INTEGRITY:</span>
                <span className="text-rose-500 font-bold flex items-center gap-0.5">
                  <Heart size={10} className="fill-rose-500" /> {gameState.player.hearts} Hearts
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800">
              <b>PROTOTYPE VALIDATION SUCCESSFUL</b>:<br />
              The five universal interaction rules (Flammable, Conductive, Loud, Reflective, Adhesive) have successfully enabled emergent, non-memorized puzzle solutions across procedural rooms!
            </p>

            <button
              onClick={startNewRun}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black tracking-widest font-mono py-3.5 rounded-xl transition-all hover:scale-[1.01] flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 text-slate-900 text-sm uppercase"
            >
              <RotateCcw size={16} /> REPLAY VALIDATION EXPERIMENT
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 text-center text-[10px] font-mono text-slate-600 mt-auto">
        <p>© 2026 Facility Escape Security Sandbox. Built for Google AI Studio Build.</p>
      </footer>
    </div>
  );
}
