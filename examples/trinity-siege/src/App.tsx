/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Unit,
  OrcUnit,
  UnitShape,
  Race,
  GamePhase,
  BattleResult,
  STARTING_GOLD,
  COST_UNIT,
  COST_WALL,
  INCOME_BASE,
  INCOME_PER_TERRITORY,
  MAX_WAVES,
  LANE_NAMES,
  WEIGHT_FLOOR_BASELINE,
  LIVES_STARTING,
} from "./types";
import { battle_ring } from "./combat";
import HexRingBoard from "./components/HexRingBoard";
import ControlPanel from "./components/ControlPanel";
import WaveLog from "./components/WaveLog";
import { Shield, Coins, Swords, RefreshCw, Trophy, Skull, HelpCircle, Info } from "lucide-react";

export default function App() {
  // --- Game State ---
  const [gold, setGold] = useState<number>(STARTING_GOLD);
  const [lives, setLives] = useState<number>(LIVES_STARTING);
  const [wave, setWave] = useState<number>(1);
  const [phase, setPhase] = useState<GamePhase>(GamePhase.FORECAST);
  
  // Frontier level (1, 2, or 3) for each of the 6 lanes
  const [frontiers, setFrontiers] = useState<Record<number, number>>({
    0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1,
  });

  // Claiming segment (if any, e.g. 2, 3, 4, 5) for each lane. null if no claim active.
  const [claiming, setClaiming] = useState<Record<number, number | null>>({
    0: null, 1: null, 2: null, 3: null, 4: null, 5: null,
  });

  // Player units
  const [units, setUnits] = useState<Unit[]>([]);

  // Walls state. Key: "lane-segment", value: boolean
  const [walls, setWalls] = useState<Record<string, boolean>>({});

  // Active wave threats
  const [forecastedLanes, setForecastedLanes] = useState<number[]>([]);
  const [forecastedAttacks, setForecastedAttacks] = useState<Record<number, OrcUnit[]>>({});

  // Pre-selected next wave second lane forecast
  const [preSelectedNextLane, setPreSelectedNextLane] = useState<number | null>(null);

  // Round battle results (from resolve phase)
  const [battleResults, setBattleResults] = useState<Record<number, BattleResult>>({});

  // Selection states
  const [selectedLane, setSelectedLane] = useState<number | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);

  // Reassignment/movement state
  const [movingUnitId, setMovingUnitId] = useState<string | null>(null);

  // Settings
  const [usePaired, setUsePaired] = useState<boolean>(true);
  const [gameOver, setGameOver] = useState<"won" | "lost" | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);

  // --- Initialize Wave Forecast on Game Start / Wave Advance ---
  useEffect(() => {
    if (phase === GamePhase.FORECAST && !gameOver) {
      generateWaveForecast();
    }
  }, [phase, wave, gameOver]);

  // --- Forecast Generator ---
  const generateWaveForecast = () => {
    // 1. Calculate defense strength per lane to create weighted random weights
    // weight[lane] = 1 / (1 + total_defense_strength[lane] + WEIGHT_FLOOR_BASELINE)
    const laneWeights = LANE_NAMES.map((_, laneId) => {
      const laneUnits = units.filter(u => u.lane === laneId);
      const defenseStrength = laneUnits.reduce((sum, u) => sum + u.currentStrength, 0);
      return {
        laneId,
        weight: 1.0 / (1.0 + defenseStrength + WEIGHT_FLOOR_BASELINE)
      };
    });

    // 2. Determine number of lanes attacked
    // Option A: delay lane count jump to wave 4 (wave <= 3 ? 1 : 2)
    const targetCount = wave <= 3 ? 1 : 2;
    const targeted: number[] = [];

    // Weighted random selection without replacement
    let candidates = [...laneWeights];

    // If we have a pre-selected next lane from the previous wave, lock it in!
    if (preSelectedNextLane !== null && targetCount >= 2) {
      const preSelectedIdx = candidates.findIndex(c => c.laneId === preSelectedNextLane);
      if (preSelectedIdx !== -1) {
        targeted.push(preSelectedNextLane);
        candidates.splice(preSelectedIdx, 1);
      }
    }

    // Roll remaining targets
    const remainingToRoll = targetCount - targeted.length;
    for (let t = 0; t < remainingToRoll; t++) {
      if (candidates.length === 0) break;
      const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
      let r = Math.random() * totalWeight;
      
      let selectedIdx = 0;
      let accum = 0;
      for (let i = 0; i < candidates.length; i++) {
        accum += candidates[i].weight;
        if (accum >= r) {
          selectedIdx = i;
          break;
        }
      }

      targeted.push(candidates[selectedIdx].laneId);
      candidates.splice(selectedIdx, 1); // remove selected to prevent duplicates
    }

    // 3. Generate Orc shapes and count
    // Attack size: 3 + wave/2, capped at 8
    const attackSize = Math.min(8, 3 + Math.floor((wave - 1) / 2));
    const shapes = [UnitShape.CIRCLE, UnitShape.SQUARE, UnitShape.TRIANGLE];
    const newAttacks: Record<number, OrcUnit[]> = {};

    targeted.forEach(laneId => {
      const orcs: OrcUnit[] = [];
      for (let i = 0; i < attackSize; i++) {
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        orcs.push({
          id: `orc-w${wave}-l${laneId}-u${i}`,
          shape: randomShape,
          baseStrength: 10,
        });
      }
      newAttacks[laneId] = orcs;
    });

    setForecastedLanes(targeted);
    setForecastedAttacks(newAttacks);

    // 4. Pre-select second lane for next wave (Wave N+1)
    let nextLane: number | null = null;
    const nextWaveTargetCount = (wave + 1) <= 3 ? 1 : 2;
    if (nextWaveTargetCount === 2 && (wave + 1) <= MAX_WAVES) {
      const candidatesForNext = [...laneWeights];
      const totalWeight = candidatesForNext.reduce((sum, c) => sum + c.weight, 0);
      let r = Math.random() * totalWeight;
      let selectedIdx = 0;
      let accum = 0;
      for (let i = 0; i < candidatesForNext.length; i++) {
        accum += candidatesForNext[i].weight;
        if (accum >= r) {
          selectedIdx = i;
          break;
        }
      }
      nextLane = candidatesForNext[selectedIdx].laneId;
    }
    setPreSelectedNextLane(nextLane);
  };

  // --- Dynamic Income Preview ---
  const incomePreview = useMemo(() => {
    let extra = 0;
    Object.entries(frontiers).forEach(([_, segment]) => {
      const segVal = segment as number;
      if (segVal > 1) {
        extra += (segVal - 1) * INCOME_PER_TERRITORY;
      }
    });
    return INCOME_BASE + extra;
  }, [frontiers]);

  // --- Unmanned Walls Counter ---
  const unmannedWallsCount = useMemo(() => {
    let count = 0;
    Object.entries(walls).forEach(([key, exists]) => {
      if (exists) {
        const [laneStr, segStr] = key.split("-");
        const l = parseInt(laneStr);
        const s = parseInt(segStr);
        const hasGarrison = units.some(u => u.lane === l && u.segment === s);
        if (!hasGarrison) count++;
      }
    });
    return count;
  }, [walls, units]);

  // --- Game Loop Phase Controllers ---
  const handleNextPhase = () => {
    if (phase === GamePhase.FORECAST) {
      setPhase(GamePhase.ALLOCATE);
    } else if (phase === GamePhase.ALLOCATE) {
      // Transition to Resolve: Run battles
      const activeAttacks = forecastedLanes.map(lane => ({
        lane,
        units: forecastedAttacks[lane] || [],
      }));

      // Map current claiming segments to active combat frontiers
      const combatFrontiers = { ...frontiers };
      Object.keys(frontiers).forEach(laneKey => {
        const laneId = parseInt(laneKey);
        const claimSeg = claiming[laneId];
        if (claimSeg !== null) {
          combatFrontiers[laneId] = claimSeg;
        }
      });

      const { results, survivingUnits } = battle_ring(
        activeAttacks,
        units,
        walls,
        combatFrontiers,
        usePaired
      );

      setBattleResults(results);
      setUnits(survivingUnits);
      setPhase(GamePhase.RESOLVE);
    } else if (phase === GamePhase.RESOLVE) {
      // Transition to Aftermath: apply territory changes and income
      const newFrontiers = { ...frontiers };
      const newClaiming = { ...claiming };
      const newWalls = { ...walls };
      let livesDeductedTotal = 0;

      Object.entries(battleResults).forEach(([laneStr, result]) => {
        const laneId = parseInt(laneStr);
        const res = result as BattleResult;
        const currentFrontier = frontiers[laneId];
        const currentClaim = claiming[laneId];

        if (res.victory) {
          // If the player won the battle:
          if (currentClaim !== null) {
            // Battle happened on the claiming segment. Claim is successfully held, remains claiming.
            newClaiming[laneId] = currentClaim;
          } else {
            // Battle happened on the owned frontier segment. Put the next segment under claim!
            if (currentFrontier < 5) {
              newClaiming[laneId] = currentFrontier + 1;
            }
          }
        } else {
          // If the player lost the battle:
          if (currentClaim !== null) {
            // Battle happened on the claiming segment. Revert claim to unclaimed, wall is destroyed.
            newClaiming[laneId] = null;
            newWalls[`${laneId}-${currentClaim}`] = false;
          } else {
            // Battle happened on the owned frontier segment. Fall back inward.
            const targetFallback = currentFrontier - 1;
            newWalls[`${laneId}-${currentFrontier}`] = false;

            if (targetFallback < 1) {
              // BREACH! Every surviving orc costs exactly 1 life.
              const breachingOrcCount = res.survivingAttackers?.length ?? 0;
              livesDeductedTotal += breachingOrcCount;
              res.isBreach = true;
              res.livesLost = breachingOrcCount;
              newFrontiers[laneId] = 1; // Unconditional fallback
            } else {
              newFrontiers[laneId] = targetFallback;
            }
          }
        }
      });

      // Aftermath securing phase: Claiming beachheads are fully secured only if a player unit physically holds them!
      for (let laneId = 0; laneId < 6; laneId++) {
        const claimSeg = newClaiming[laneId];
        if (claimSeg !== null) {
          // Check if there is a surviving player unit stationed on this claiming segment
          const hasGarrison = units.some(u => u.lane === laneId && u.segment === claimSeg);
          if (hasGarrison) {
            // Secure beachhead!
            newFrontiers[laneId] = claimSeg;
            newClaiming[laneId] = null;
          } else {
            // NEW: don't leave it stuck. One AFTERMATH cycle to garrison it, then it's lost.
            newClaiming[laneId] = null;
            // frontier does not advance; segment reverts to whatever it was before claiming
          }
        }
      }

      // Apply changes
      setFrontiers(newFrontiers);
      setClaiming(newClaiming);
      setWalls(newWalls);

      // Deduct lives
      const finalLives = Math.max(0, lives - livesDeductedTotal);
      setLives(finalLives);

      // Check center breach loss condition
      if (finalLives <= 0) {
        setGameOver("lost");
      }

      // Collect income
      let extra = 0;
      Object.entries(newFrontiers).forEach(([_, segment]) => {
        const segVal = segment as number;
        if (segVal > 1) {
          extra += (segVal - 1) * INCOME_PER_TERRITORY;
        }
      });
      const waveIncome = INCOME_BASE + extra;
      setGold(prev => prev + waveIncome);

      setPhase(GamePhase.AFTERMATH);
    } else if (phase === GamePhase.AFTERMATH) {
      // Check win condition (survived 5 waves)
      if (wave === MAX_WAVES) {
        setGameOver("won");
      } else {
        // Advance wave
        setWave(prev => prev + 1);
        setBattleResults({});
        setSelectedLane(null);
        setSelectedSegment(null);
        setPhase(GamePhase.FORECAST);
      }
    }
  };

  // --- Purchase & Garrison Actions ---
  const handleBuyUnit = (shape: UnitShape) => {
    if (selectedLane === null || selectedSegment === null) return;
    if (gold < COST_UNIT) return;

    const newUnit: Unit = {
      id: `unit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      shape,
      race: Race.PLAYER,
      baseStrength: 10,
      currentStrength: 10,
      lane: selectedLane,
      segment: selectedSegment,
    };

    setUnits(prev => [...prev, newUnit]);
    setGold(prev => prev - COST_UNIT);
  };

  const handleBuyWall = () => {
    if (selectedLane === null || selectedSegment === null) return;
    if (gold < COST_WALL) return;

    const key = `${selectedLane}-${selectedSegment}`;
    setWalls(prev => ({
      ...prev,
      [key]: true,
    }));
    setGold(prev => prev - COST_WALL);
  };

  const handleDismantleWall = () => {
    if (selectedLane === null || selectedSegment === null) return;
    const key = `${selectedLane}-${selectedSegment}`;
    setWalls(prev => ({
      ...prev,
      [key]: false,
    }));
  };

  const handleDisbandUnit = (unitId: string) => {
    setUnits(prev => prev.filter(u => u.id !== unitId));
  };

  // --- Unit Relocation Actions ---
  const handleStartMoveUnit = (unitId: string) => {
    setMovingUnitId(unitId);
  };

  const handleCompleteMoveUnit = (lane: number, segment: number) => {
    if (!movingUnitId) return;
    setUnits(prev =>
      prev.map(u => (u.id === movingUnitId ? { ...u, lane, segment } : u))
    );
    setMovingUnitId(null);
  };

  const handleCancelMoveUnit = () => {
    setMovingUnitId(null);
  };

  // --- Reset / Restart Game ---
  const handleRestart = () => {
    setGold(STARTING_GOLD);
    setLives(LIVES_STARTING);
    setWave(1);
    setPhase(GamePhase.FORECAST);
    setFrontiers({ 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 });
    setClaiming({ 0: null, 1: null, 2: null, 3: null, 4: null, 5: null });
    setUnits([]);
    setWalls({});
    setForecastedLanes([]);
    setForecastedAttacks({});
    setPreSelectedNextLane(null);
    setBattleResults({});
    setSelectedLane(null);
    setSelectedSegment(null);
    setMovingUnitId(null);
    setGameOver(null);
  };

  // --- Seeding a Quick Setup for Testing (Optional helper for users) ---
  const handleQuickSeed = () => {
    // Adds a few units and walls to make testing faster
    const shapes = [UnitShape.CIRCLE, UnitShape.SQUARE, UnitShape.TRIANGLE];
    const seededUnits: Unit[] = [];
    
    // Deploy 1 unit to segment 1 of each lane
    for (let i = 0; i < 6; i++) {
      seededUnits.push({
        id: `seeded-unit-${i}`,
        shape: shapes[i % 3],
        race: Race.PLAYER,
        baseStrength: 10,
        currentStrength: 10,
        lane: i,
        segment: 1,
      });
    }
    setUnits(seededUnits);
    setGold(15); // leave some gold
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Header Bar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between" id="app-header">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-950/50 p-2 rounded-lg border border-cyan-800/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Swords className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              TRINITY SIEGE <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/40 px-1.5 py-0.5 rounded font-mono uppercase font-semibold">Wave Defense MVP</span>
            </h1>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Tactical Sonar Defenses</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHowToPlay(!showHowToPlay)}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-400 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" /> {showHowToPlay ? "Hide Rules" : "Game Rules"}
          </button>
          
          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 bg-red-950/40 hover:bg-red-950/60 px-3 py-1.5 rounded-lg border border-red-900/30 text-xs font-mono text-red-400 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Force Reset
          </button>
        </div>
      </header>

      {/* Main Layout Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Help Screen Overlay (Inline) */}
        {showHowToPlay && (
          <div className="lg:col-span-12 bg-cyan-950/20 border border-cyan-800/30 p-5 rounded-xl flex flex-col gap-3 font-sans text-xs text-slate-300 leading-relaxed" id="rules-documentation">
            <div className="flex items-center gap-1.5 border-b border-cyan-900/60 pb-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <span className="font-display font-bold text-sm text-cyan-200">Trinity Siege Tactical Manual</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h5 className="font-bold text-white uppercase tracking-wider mb-1.5 font-mono text-[10px]">1. The Combat Trinity</h5>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li><strong className="text-cyan-300">Vanguard (Circle)</strong> counters Phalanx (Square).</li>
                  <li><strong className="text-cyan-300">Phalanx (Square)</strong> counters Skirmisher (Triangle).</li>
                  <li><strong className="text-cyan-300">Skirmisher (Triangle)</strong> counters Vanguard (Circle).</li>
                  <li>Winning shapes gain a <span className="text-amber-400 font-bold">1.5x effective damage</span> multiplier in 1v1 cascading duels.</li>
                </ul>
              </div>
              <div>
                <h5 className="font-bold text-white uppercase tracking-wider mb-1.5 font-mono text-[10px]">2. Fortifications & Garrisons</h5>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Walls cost 8 gold and provide a heavy <strong className="text-amber-400">2.0x strength bonus</strong> to defenders.</li>
                  <li><strong className="text-red-400 underline">Garrison Mandate:</strong> Walls require a unit on the same segment to function! An unmanned wall has 0 defense.</li>
                  <li>Durable Defenses: Units and walls persist wave-over-wave until destroyed (no auto-heal).</li>
                </ul>
              </div>
              <div>
                <h5 className="font-bold text-white uppercase tracking-wider mb-1.5 font-mono text-[10px]">3. Territorial Expansion</h5>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Lanes are uniform with 3 segments depth.</li>
                  <li>Winning a battle on a corridor <strong className="text-emerald-400">pushes the frontier outward</strong>, unlocking forward segments to deploy units.</li>
                  <li>Losing falls back. Falling past Segment 1 breaches the Citadel core, triggering <strong className="text-red-400">Defeat</strong>.</li>
                  <li>Forward segments generate +2 gold income each wave.</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-cyan-900/40 pt-2 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">MVP Ruleset version 1.0</span>
              <button onClick={() => setShowHowToPlay(false)} className="text-cyan-400 hover:underline font-mono text-[10px]">Got it, close manual</button>
            </div>
          </div>
        )}

        {/* Column 1: Board Visual Map (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">Tactical Sonar Plot</span>
            {units.length === 0 && phase === GamePhase.ALLOCATE && (
              <button
                onClick={handleQuickSeed}
                className="text-[9.5px] font-mono text-cyan-400 border border-cyan-800/40 bg-cyan-950/20 px-2 py-1 rounded hover:bg-cyan-950/50 transition-all cursor-pointer"
                title="Deploys a basic starting unit in each lane to speed up testing"
              >
                Quick Seed Defenders (Test Helper)
              </button>
            )}
          </div>
          <HexRingBoard
            frontiers={frontiers}
            claiming={claiming}
            units={units}
            walls={walls}
            forecastedLanes={forecastedLanes}
            forecastedAttacks={forecastedAttacks}
            selectedLane={selectedLane}
            selectedSegment={selectedSegment}
            onSelectTile={(lane, seg) => {
              setSelectedLane(lane);
              setSelectedSegment(seg);
            }}
            phase={phase}
          />
        </div>

        {/* Column 2: Control & Buy Panel (lg:col-span-3) */}
        <div className="lg:col-span-3">
          <ControlPanel
            gold={gold}
            wave={wave}
            lives={lives}
            phase={phase}
            selectedLane={selectedLane}
            selectedSegment={selectedSegment}
            units={units}
            walls={walls}
            frontiers={frontiers}
            claiming={claiming}
            onBuyUnit={handleBuyUnit}
            onBuyWall={handleBuyWall}
            onDismantleWall={handleDismantleWall}
            onDisbandUnit={handleDisbandUnit}
            movingUnitId={movingUnitId}
            onStartMoveUnit={handleStartMoveUnit}
            onCompleteMoveUnit={handleCompleteMoveUnit}
            onCancelMoveUnit={handleCancelMoveUnit}
            onNextPhase={handleNextPhase}
            incomePreview={incomePreview}
            unmannedWallsCount={unmannedWallsCount}
          />
        </div>

        {/* Column 3: Threat Analysis & Detailed Duels (lg:col-span-4) */}
        <div className="lg:col-span-4">
          <WaveLog
            phase={phase}
            forecastedLanes={forecastedLanes}
            forecastedAttacks={forecastedAttacks}
            battleResults={battleResults}
            units={units}
            usePaired={usePaired}
            onToggleResolver={() => setUsePaired(!usePaired)}
            preSelectedNextLane={preSelectedNextLane}
            wave={wave}
            lives={lives}
          />
        </div>
      </main>

      {/* Game Over Overlays */}
      {gameOver && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-6" id="game-over-screen">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center gap-6">
            
            {gameOver === "won" ? (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <Trophy className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="font-display text-2xl font-bold text-emerald-400">CITADEL SURVIVED!</h2>
                  <p className="font-mono text-xs text-slate-400 uppercase tracking-wider">Siege Repelled Successfully</p>
                </div>
                <div className="w-full bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-left font-mono text-xs flex flex-col gap-2.5">
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">Waves Survived:</span>
                    <span className="text-white font-bold">5 / 5</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">Citadel Integrity:</span>
                    <span className="text-red-400 font-bold">{lives} / 15 Lives</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">Final Treasury:</span>
                    <span className="text-amber-400 font-bold">{gold} Gold</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Active Roster Size:</span>
                    <span className="text-cyan-400 font-bold">{units.length} Defenders</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  The Cascading paired defense held the borders through coordinate siege tactics. The realm has been saved.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-red-950/60 border border-red-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                  <Skull className="w-8 h-8 text-red-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="font-display text-2xl font-bold text-red-500">CITADEL BREACHED</h2>
                  <p className="font-mono text-xs text-slate-400 uppercase tracking-wider">The core has fallen</p>
                </div>
                <div className="w-full bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-left font-mono text-xs flex flex-col gap-2.5">
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">Fallen in Wave:</span>
                    <span className="text-white font-bold">{wave}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">Citadel Integrity:</span>
                    <span className="text-red-500 font-bold">0 / 15 Lives</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">Garrison Size:</span>
                    <span className="text-cyan-400 font-bold">{units.length} surviving</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Treasury Left:</span>
                    <span className="text-amber-400 font-bold">{gold} Gold</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Citadel integrity dropped to 0. Orc shapes penetrated the defense rings and breached the core. Remember to reinforce unmanned walls with a garrison to trigger their protective multipliers!
                </p>
              </>
            )}

            <button
              onClick={handleRestart}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/10"
            >
              <RefreshCw className="w-4 h-4" /> Start New Siege Campaign
            </button>
          </div>
        </div>
      )}

      {/* Footer Bar */}
      <footer className="border-t border-slate-900 bg-slate-950/60 p-4 text-center text-[10px] font-mono text-slate-600 flex flex-col sm:flex-row items-center justify-between px-6 gap-2">
        <span>© 2026 Trinity Siege. Crafted with modular cascading math.</span>
        <div className="flex items-center gap-4">
          <span>Target Depth: Uniform 3-Segments</span>
          <span>Resolver Standard: Paired cascading</span>
        </div>
      </footer>
    </div>
  );
}
