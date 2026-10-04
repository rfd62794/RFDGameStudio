/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Skull,
  Shield,
  Zap,
  Activity,
  Heart,
  ShoppingBag,
  Dumbbell,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Wrench,
  AlertTriangle,
  Sparkles,
  Award,
  LogOut,
  Info
} from "lucide-react";
import {
  Part,
  PartType,
  PartVariant,
  PartRarity,
  Equipment,
  Mutant,
  MutantRole,
  MatchSimulation,
  GameState
} from "./types";
import {
  PARTS_POOL,
  EQUIPMENT_LIST,
  generateMutantName,
  generateRandomPart,
  assembleMutant,
  getInitialState,
  generateOpponentTeam
} from "./data";
import {
  initMatch,
  updateMatch,
  resetKickoff,
  substituteActiveAgent
} from "./matchEngine";

export default function App() {
  // Game State
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem("mutant_battle_ball_state_v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clean active match if it got stuck
        parsed.activeMatch = null;
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    return getInitialState();
  });

  // Keep refs of state for stable game loop execution
  const gameStateRef = useRef(gameState);
  const activeMatchRef = useRef(gameState.activeMatch);

  useEffect(() => {
    gameStateRef.current = gameState;
    activeMatchRef.current = gameState.activeMatch;
  }, [gameState]);

  // Active Tab: 'stable' | 'shop' | 'arena' | 'showcase'
  const [activeTab, setActiveTab] = useState<"stable" | "shop" | "arena" | "showcase">("stable");

  // Showcase state
  const [showcaseRotation, setShowcaseRotation] = useState<number>(0);
  const [showcaseZoom, setShowcaseZoom] = useState<number>(1.2);

  // Assembly State
  const [assemblyHead, setAssemblyHead] = useState<Part | null>(null);
  const [assemblyChest, setAssemblyChest] = useState<Part | null>(null);
  const [assemblyArm, setAssemblyArm] = useState<Part | null>(null);
  const [assemblyLeg, setAssemblyLeg] = useState<Part | null>(null);
  const [assemblyName, setAssemblyName] = useState("");

  // Selected Mutant in Stable for equipping/inspecting
  const [selectedMutantId, setSelectedMutantId] = useState<string | null>(null);

  // Match Simulation Loop Ref
  const [simulationSpeed, setSimulationSpeed] = useState<1 | 2>(1);
  const [matchRunning, setMatchRunning] = useState(false);
  const [matchLogs, setMatchLogs] = useState<string[]>([]);
  const [scorchScreen, setScorchScreen] = useState(false); // Tackles trigger screen flash/shake
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

  // Dead Mutant Triage (Post-Match Death Harvesting)
  const [deadMutantHarvest, setDeadMutantHarvest] = useState<{
    mutant: Mutant;
    harvested: boolean;
  } | null>(null);

  // Save game helper
  const saveGame = (state: GameState) => {
    setGameState(state);
    localStorage.setItem("mutant_battle_ball_state_v1", JSON.stringify(state));
  };

  // Sync state changes
  useEffect(() => {
    localStorage.setItem("mutant_battle_ball_state_v1", JSON.stringify(gameState));
  }, [gameState]);

  // Reset Game Helper
  const handleResetGame = () => {
    if (window.confirm("Are you sure you want to retire your stable? This wipes all mutants, parts, and Iron!")) {
      const fresh = getInitialState();
      setAssemblyHead(null);
      setAssemblyChest(null);
      setAssemblyArm(null);
      setAssemblyLeg(null);
      setAssemblyName("");
      setSelectedMutantId(null);
      setMatchRunning(false);
      setMatchLogs([]);
      setDeadMutantHarvest(null);
      setActiveTab("stable");
      saveGame(fresh);
    }
  };

  // SIMULATION GAME LOOP
  useEffect(() => {
    const loop = (time: number) => {
      if (!matchRunning || !activeMatchRef.current) {
        requestRef.current = requestAnimationFrame(loop);
        return;
      }

      if (previousTimeRef.current !== null) {
        const dt = Math.min(0.03, (time - previousTimeRef.current) / 1000) * simulationSpeed;
        
        // Tick match physics using stable ref
        const { updatedMatch, events } = updateMatch({ ...activeMatchRef.current }, dt);
        
        if (events.length > 0) {
          setMatchLogs((prev) => [...events.map(ev => `[${formatTime(updatedMatch.timeRemaining)}] ${ev}`), ...prev].slice(0, 50));
          // If a tackle occurred, trigger a screen shake
          if (events.some(ev => ev.includes("TACKLE") || ev.includes("slam"))) {
            setScorchScreen(true);
            setTimeout(() => setScorchScreen(false), 250);
          }
        }

        // If goal scored, pause briefly or trigger reset
        if (updatedMatch.state === "scored") {
          setMatchRunning(false);
          setTimeout(() => {
            const resetMatch = resetKickoff(updatedMatch);
            activeMatchRef.current = resetMatch;
            saveGame({ ...gameStateRef.current, activeMatch: { ...resetMatch } });
            setMatchRunning(true);
          }, 2000);
        } else if (updatedMatch.state === "ended") {
          // Resolve Match results
          setMatchRunning(false);
          resolveMatchResults(updatedMatch);
          return; // stop loop
        } else {
          activeMatchRef.current = updatedMatch;
          setGameState((prev) => ({ ...prev, activeMatch: { ...updatedMatch } }));
        }
      }

      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(loop);
    };

    if (matchRunning) {
      previousTimeRef.current = null;
      requestRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [matchRunning, simulationSpeed]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  // POST-MATCH REWARD AND DEATH ASSESSMENTS
  const resolveMatchResults = (finalMatch: MatchSimulation) => {
    const currentGameState = gameStateRef.current;
    const playerWon = finalMatch.scorePlayer > finalMatch.scoreOpponent;
    // Earn Iron based on win or loss
    const ironEarned = playerWon ? 180 : 60;
    
    // Track injuries and deaths
    const injuredNames: string[] = [];
    const deadNames: string[] = [];
    let deceasedMutant: Mutant | null = null;

    // Assess player's mutants
    const updatedMutants = currentGameState.mutants.map((mut) => {
      // Find matching SimAgent
      const agent = finalMatch.agents.find((a) => a.mutantId === mut.id);
      if (!agent) return mut;

      let nextStatus = mut.status;
      let nextEndurance = agent.currentEndurance;

      // If knocked out during match, roll for serious injury or death!
      if (agent.state === "knocked-out" || agent.currentEndurance <= 0) {
        const roll = Math.random();
        if (roll < 0.35) {
          // 35% chance of permanent death!
          nextStatus = "Dead";
          deceasedMutant = { ...mut, status: "Dead" };
          deadNames.push(mut.name);
        } else {
          // Sent to Infirmary
          nextStatus = "Injured";
          injuredNames.push(mut.name);
        }
      } else {
        // Keeps healthy but saves current endurance
        nextEndurance = Math.max(15, agent.currentEndurance); // recover some stamina minimum
      }

      return {
        ...mut,
        status: nextStatus,
        currentEndurance: nextEndurance,
        matchesPlayed: mut.matchesPlayed + 1
      };
    });

    // Remove deceased mutant from the main list so they don't play, but hold for harvest selection
    const livingMutants = updatedMutants.filter((m) => m.status !== "Dead");

    // Assign injured mutants to empty Infirmary beds
    const updatedInfirmary = [...currentGameState.infirmary];
    livingMutants.forEach((mut) => {
      if (mut.status === "Injured") {
        // Find empty bed
        const emptyBed = updatedInfirmary.find((b) => b.mutantId === null);
        if (emptyBed) {
          emptyBed.mutantId = mut.id;
          emptyBed.matchesRemaining = 2; // recovery time is 2 matches played
        } else {
          // No bed available? Forced to wait! Let's keep status Injured.
        }
      }
    });

    // Progress existing patients in the Infirmary (decrement matchesRemaining by 1)
    const activeInfirmary = updatedInfirmary.map((bed) => {
      if (bed.mutantId) {
        const remaining = Math.max(0, bed.matchesRemaining - 1);
        if (remaining === 0) {
          // Healed! Bring mutant back to Healthy
          const idx = livingMutants.findIndex((m) => m.id === bed.mutantId);
          if (idx !== -1) {
            livingMutants[idx].status = "Healthy";
            livingMutants[idx].currentEndurance = livingMutants[idx].maxEndurance;
          }
          return { ...bed, mutantId: null, matchesRemaining: 0 };
        }
        return { ...bed, matchesRemaining: remaining };
      }
      return bed;
    });

    // Generate next Opponent Team for the arena
    const nextOpponent = generateOpponentTeam(playerWon ? Math.min(5, finalMatch.scorePlayer) : 1);

    // Save final match history to trigger the Results modal
    const nextState: GameState = {
      ...currentGameState,
      iron: currentGameState.iron + ironEarned,
      mutants: livingMutants,
      infirmary: activeInfirmary,
      opponentTeam: nextOpponent,
      activeMatch: null,
      matchHistory: {
        result: playerWon ? "won" : "lost",
        scorePlayer: finalMatch.scorePlayer,
        scoreOpponent: finalMatch.scoreOpponent,
        ironEarned,
        mutantInjuries: injuredNames,
        mutantDeaths: deadNames
      }
    };

    if (deceasedMutant) {
      setDeadMutantHarvest({
        mutant: deceasedMutant,
        harvested: false
      });
    }

    saveGame(nextState);
  };

  // HARVEST PROCESS (Clicking a part to keep from the dead mutant)
  const handleHarvestPart = (part: Part) => {
    if (!deadMutantHarvest) return;
    
    // Add part to inventory
    const newInventory = [...gameState.partsInventory, { ...part, id: `harvest_${Date.now()}_${part.id}` }];
    
    // Clear harvest prompt
    setDeadMutantHarvest(null);

    saveGame({
      ...gameState,
      partsInventory: newInventory
    });
  };

  // TRIGGER MATCH PREPARATION
  const handleStartMatchPrep = () => {
    // Requires exactly 2 healthy player mutants
    const activeMutants = gameState.mutants.filter(m => m.status === "Healthy");
    if (activeMutants.length < 2) {
      alert("You need at least 2 healthy mutants in your stable to launch a GridIron match! Assemble new ones or wait for recovery.");
      return;
    }

    // Initialize simulation
    const match = initMatch(activeMutants.slice(0, 2), gameState.opponentTeam);
    setMatchLogs([`[0:00] Match initiated between Bloodline Stable and ${gameState.opponentTeam.name}.`]);
    saveGame({
      ...gameState,
      activeMatch: match
    });
    setMatchRunning(true);
  };

  // IN-MATCH INTERVENTION: PULL FIGHTER
  const handlePullFighter = (agentId: string) => {
    if (!gameState.activeMatch) return;

    const agent = gameState.activeMatch.agents.find((a) => a.id === agentId);
    if (!agent || agent.team !== "player" || agent.state !== "active") return;

    // Is there a healthy mutant on the bench?
    // In our MVP, we have up to 3 mutants total. 2 are on court, 1 might be on the bench.
    const activeMutantIds = gameState.activeMatch.agents
      .filter((a) => a.isPlayerMutant)
      .map((a) => a.mutantId);

    const benchMutant = gameState.mutants.find(
      (m) => m.status === "Healthy" && !activeMutantIds.includes(m.id)
    );

    if (!benchMutant) {
      setMatchLogs((prev) => [`[Intervention Failed] No healthy bench backup available to tag in!`, ...prev]);
      return;
    }

    // Execute sub
    const { updatedMatch, success, message } = substituteActiveAgent(
      { ...gameState.activeMatch },
      agentId,
      benchMutant
    );

    if (success) {
      setMatchLogs((prev) => [`[Tactical Pull] ${message}`, ...prev]);
      saveGame({
        ...gameState,
        activeMatch: updatedMatch
      });
    }
  };

  // MUTANT ASSEMBLY PROCESS
  const handleSuggestName = () => {
    if (assemblyHead && assemblyChest && assemblyArm && assemblyLeg) {
      const name = generateMutantName({
        [PartType.Head]: assemblyHead,
        [PartType.Chest]: assemblyChest,
        [PartType.Arm]: assemblyArm,
        [PartType.Leg]: assemblyLeg
      });
      setAssemblyName(name);
    } else {
      alert("Select all 4 parts in the assembly bay first!");
    }
  };

  const handleAssembleMutant = () => {
    if (!assemblyHead || !assemblyChest || !assemblyArm || !assemblyLeg) {
      alert("You must select a Head, Chest, Arm, and Leg from your salvaged parts inventory.");
      return;
    }

    const name = assemblyName.trim() || "Unit-X";

    // Build the mutant
    const newMutant = assembleMutant(name, {
      [PartType.Head]: assemblyHead,
      [PartType.Chest]: assemblyChest,
      [PartType.Arm]: assemblyArm,
      [PartType.Leg]: assemblyLeg
    });

    // Remove consumed parts from inventory
    const consumedIds = [assemblyHead.id, assemblyChest.id, assemblyArm.id, assemblyLeg.id];
    const newInventory = gameState.partsInventory.filter((p) => !consumedIds.includes(p.id));

    // Append to mutants
    const newMutants = [...gameState.mutants, newMutant];

    // Reset assembly bay
    setAssemblyHead(null);
    setAssemblyChest(null);
    setAssemblyArm(null);
    setAssemblyLeg(null);
    setAssemblyName("");

    saveGame({
      ...gameState,
      partsInventory: newInventory,
      mutants: newMutants
    });
  };

  // EQUIP ITEM TO MUTANT
  const handleEquipItem = (mutantId: string, item: Equipment) => {
    const updatedMutants = gameState.mutants.map((mut) => {
      if (mut.id === mutantId) {
        // Return item to shop inventory if one is already equipped (or simple overwrite in MVP)
        // Check if item meets gating criteria (variant type)
        if (item.gatedBy) {
          const { variant, type } = item.gatedBy;
          if (variant) {
            // Count dominant variant among mutant parts
            let matches = 0;
            (Object.values(mut.parts) as Part[]).forEach(p => {
              if (p.variant === variant) matches++;
            });
            if (matches < 3) {
              alert(`Gated item: This gear requires at least 3 parts to be ${variant}!`);
              return mut;
            }
          }
        }

        // Deduct Iron and equip
        return assembleMutant(mut.name, mut.parts, item);
      }
      return mut;
    });

    saveGame({
      ...gameState,
      iron: Math.max(0, gameState.iron - item.price),
      mutants: updatedMutants
    });
  };

  const handleRemoveEquip = (mutantId: string) => {
    const updatedMutants = gameState.mutants.map((mut) => {
      if (mut.id === mutantId) {
        return assembleMutant(mut.name, mut.parts, null);
      }
      return mut;
    });
    saveGame({
      ...gameState,
      mutants: updatedMutants
    });
  };

  // SHOP PURCHASING
  const handleBuyPart = (part: Part) => {
    if (gameState.iron < part.price) {
      alert("Not enough Iron! Win matches to scavenge more.");
      return;
    }

    const purchasedPart = { ...part, id: `part_shop_${Date.now()}` };
    saveGame({
      ...gameState,
      iron: gameState.iron - part.price,
      partsInventory: [...gameState.partsInventory, purchasedPart]
    });
  };

  const handleSellPart = (part: Part) => {
    const sellPrice = Math.floor(part.price * 0.4);
    const newInventory = gameState.partsInventory.filter((p) => p.id !== part.id);
    saveGame({
      ...gameState,
      iron: gameState.iron + sellPrice,
      partsInventory: newInventory
    });
  };

  const handleBuyEquipment = (item: Equipment, targetMutantId: string) => {
    if (gameState.iron < item.price) {
      alert("Not enough Iron!");
      return;
    }
    handleEquipItem(targetMutantId, item);
  };

  // SHOWCASE BAY HANDLERS
  const handleShowcaseUnequipGear = (mutantId: string) => {
    const updatedMutants = gameState.mutants.map((mut) => {
      if (mut.id === mutantId) {
        return {
          ...assembleMutant(mut.name, mut.parts, null),
          id: mut.id,
          status: mut.status,
          role: mut.role,
          kills: mut.kills,
          scores: mut.scores
        };
      }
      return mut;
    });
    saveGame({
      ...gameState,
      mutants: updatedMutants
    });
  };

  const handleShowcaseEquipGear = (mutantId: string, item: Equipment) => {
    if (gameState.iron < item.price) {
      alert("Not enough Iron to purchase this gear!");
      return;
    }
    const updatedMutants = gameState.mutants.map((mut) => {
      if (mut.id === mutantId) {
        return {
          ...assembleMutant(mut.name, mut.parts, item),
          id: mut.id,
          status: mut.status,
          role: mut.role,
          kills: mut.kills,
          scores: mut.scores
        };
      }
      return mut;
    });
    saveGame({
      ...gameState,
      iron: gameState.iron - item.price,
      mutants: updatedMutants
    });
  };

  const handleShowcaseUnequipPart = (mutantId: string, slotType: PartType) => {
    const targetMutant = gameState.mutants.find(m => m.id === mutantId);
    if (!targetMutant) return;

    const partToReturn = targetMutant.parts[slotType];
    if (!partToReturn) return;

    // Remove the part from the mutant
    const updatedParts = { ...targetMutant.parts, [slotType]: null };
    const updatedMutants = gameState.mutants.map((mut) => {
      if (mut.id === mutantId) {
        return {
          ...assembleMutant(mut.name, updatedParts, mut.equipment),
          id: mut.id,
          status: mut.status,
          role: mut.role,
          kills: mut.kills,
          scores: mut.scores
        };
      }
      return mut;
    });

    saveGame({
      ...gameState,
      partsInventory: [...gameState.partsInventory, partToReturn],
      mutants: updatedMutants
    });
  };

  const handleShowcaseEquipPart = (mutantId: string, partId: string, slotType: PartType) => {
    const targetMutant = gameState.mutants.find(m => m.id === mutantId);
    if (!targetMutant) return;

    const newPart = gameState.partsInventory.find(p => p.id === partId);
    if (!newPart) return;

    // Check if slot currently has a part, if so, return it to inventory first
    const oldPart = targetMutant.parts[slotType];
    let newInventory = gameState.partsInventory.filter(p => p.id !== partId);
    if (oldPart) {
      newInventory.push(oldPart);
    }

    const updatedParts = { ...targetMutant.parts, [slotType]: newPart };
    const updatedMutants = gameState.mutants.map((mut) => {
      if (mut.id === mutantId) {
        return {
          ...assembleMutant(mut.name, updatedParts, mut.equipment),
          id: mut.id,
          status: mut.status,
          role: mut.role,
          kills: mut.kills,
          scores: mut.scores
        };
      }
      return mut;
    });

    saveGame({
      ...gameState,
      partsInventory: newInventory,
      mutants: updatedMutants
    });
  };

  // STAT BAR DATA HELPER
  const activeMutants = gameState.mutants.filter(m => m.status === "Healthy");
  const injuredMutants = gameState.mutants.filter(m => m.status === "Injured");
  const occupiedBeds = gameState.infirmary.filter(b => b.mutantId !== null).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 flex flex-col font-sans select-none overflow-x-hidden antialiased">
      {/* PERSISTENT STATUS BAR */}
      <header className="bg-zinc-900/50 border-b border-zinc-800 h-16 flex items-center justify-between px-6 sticky top-0 z-40 backdrop-blur-sm shrink-0">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-orange-600 rounded-sm flex items-center justify-center font-black text-black font-mono">MBB</div>
            <div>
              <h1 id="app-title" className="text-xl font-black tracking-tighter text-white">
                MUTANT BATTLE BALL <span className="text-orange-600 italic font-mono text-sm">// GRIDIRON v1.02</span>
              </h1>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">
                Stable Director Control Syndicate
              </p>
            </div>
          </div>

          {/* Quick HUD */}
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Current Capital</span>
              <div className="flex items-center gap-2 leading-none">
                <span className="text-orange-500 font-mono text-xl font-black">{gameState.iron}.00</span>
                <span className="text-[9px] font-bold text-zinc-400 uppercase">Iron</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6 text-xs font-mono bg-zinc-950/80 px-4 py-2 rounded border border-zinc-850">
              <div className="flex flex-col">
                <span className="text-[9px] text-zinc-500 uppercase">STABLE SIZE</span>
                <span className="text-zinc-300 font-semibold">{gameState.mutants.length}/3 Slots</span>
              </div>
              <div className="flex flex-col border-l border-zinc-800 pl-4">
                <span className="text-[9px] text-zinc-500 uppercase">INFIRMARY</span>
                <span className={`font-semibold ${occupiedBeds > 0 ? "text-orange-500 animate-pulse" : "text-emerald-500"}`}>
                  {occupiedBeds}/2 Active
                </span>
              </div>
            </div>

            <button
              onClick={handleResetGame}
              className="bg-zinc-800 hover:bg-red-950 hover:text-red-400 text-zinc-400 font-bold px-4 py-2 text-xs rounded-sm skew-x-[-12deg] transition-all border border-zinc-700/60"
              title="Wipe game data"
            >
              <span className="inline-block skew-x-[12deg] uppercase font-bold text-[10px] tracking-wider">Reset Stable</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* SUB-HEADER COMPONENT */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <nav className="flex gap-2">
            <button
              onClick={() => setActiveTab("stable")}
              className={`px-5 py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider skew-x-[-12deg] transition-all border ${
                activeTab === "stable"
                  ? "bg-orange-600 text-black border-orange-700 font-black shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border-zinc-850"
              }`}
            >
              <span className="inline-block skew-x-[12deg]">🛠️ Assembly &amp; Stable</span>
            </button>
            <button
              onClick={() => setActiveTab("showcase")}
              className={`px-5 py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider skew-x-[-12deg] transition-all border ${
                activeTab === "showcase"
                  ? "bg-orange-600 text-black border-orange-700 font-black shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border-zinc-850"
              }`}
            >
              <span className="inline-block skew-x-[12deg]">🔬 Mutant Showcase</span>
            </button>
            <button
              onClick={() => setActiveTab("shop")}
              className={`px-5 py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider skew-x-[-12deg] transition-all border ${
                activeTab === "shop"
                  ? "bg-orange-600 text-black border-orange-700 font-black shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border-zinc-850"
              }`}
            >
              <span className="inline-block skew-x-[12deg]">🛒 Scrap Shop</span>
            </button>
            <button
              onClick={() => setActiveTab("arena")}
              className={`px-5 py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider skew-x-[-12deg] transition-all relative border ${
                activeTab === "arena"
                  ? "bg-orange-600 text-black border-orange-700 font-black shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border-zinc-850"
              }`}
            >
              <span className="inline-block skew-x-[12deg] flex items-center gap-1">
                ⚡ GridIron Arena
                {activeMutants.length >= 2 && !gameState.activeMatch && (
                  <span className="w-1.5 h-1.5 bg-black rounded-full animate-ping inline-block" />
                )}
              </span>
            </button>
          </nav>
        </div>

        {/* --- STABLE TAB --- */}
        {activeTab === "stable" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* ASSEMBLY BAY SECTION */}
            <div className="bg-zinc-900/60 rounded-lg border border-zinc-800 p-5 flex flex-col gap-4 relative overflow-hidden">
              {/* GRID OVERLAY */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>

              <div className="border-b border-zinc-800 pb-2 flex items-center justify-between relative z-10">
                <h2 className="text-sm font-black font-mono text-zinc-200 tracking-wider flex items-center gap-2 uppercase">
                  🧬 Assembly Bay 01
                </h2>
                <span className="text-[9px] bg-orange-600/15 text-orange-400 border border-orange-600/35 px-2 py-0.5 rounded font-mono">
                  Solder Station
                </span>
              </div>

              <p className="text-xs text-zinc-400 relative z-10 leading-relaxed">
                Graft biological tissue onto cold titanium frames. Consumes one of each part type to produce a custom GridIron gladiator.
              </p>

              {/* Slots selection */}
              <div className="grid grid-cols-2 gap-3 my-2 relative z-10">
                {/* HEAD SLOT */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Head (Mind)</span>
                  {assemblyHead ? (
                    <div className="bg-zinc-800 p-2.5 rounded border border-orange-500/40 text-xs flex flex-col gap-1 relative">
                      <button
                        onClick={() => setAssemblyHead(null)}
                        className="absolute top-1 right-1 text-zinc-400 hover:text-red-400 font-bold"
                      >
                        ×
                      </button>
                      <span className="font-bold text-orange-500 truncate pr-3">{assemblyHead.name}</span>
                      <span className="text-[9px] text-zinc-400 uppercase font-mono">{assemblyHead.variant}</span>
                    </div>
                  ) : (
                    <select
                      className="bg-zinc-950 border border-zinc-800 text-xs rounded p-2 text-zinc-300 focus:outline-none focus:border-orange-500 h-[58px]"
                      onChange={(e) => {
                        const found = gameState.partsInventory.find(p => p.id === e.target.value);
                        if (found) setAssemblyHead(found);
                      }}
                      value=""
                    >
                      <option value="" disabled>-- Install Head --</option>
                      {gameState.partsInventory.filter(p => p.type === PartType.Head).map(p => (
                        <option key={p.id} value={p.id}>[{p.rarity?.toUpperCase() || "COMMON"}] {p.name} (Acc:{p.accuracy})</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* CHEST SLOT */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Chest (Core)</span>
                  {assemblyChest ? (
                    <div className="bg-zinc-800 p-2.5 rounded border border-orange-500/40 text-xs flex flex-col gap-1 relative">
                      <button
                        onClick={() => setAssemblyChest(null)}
                        className="absolute top-1 right-1 text-zinc-400 hover:text-red-400 font-bold"
                      >
                        ×
                      </button>
                      <span className="font-bold text-orange-500 truncate pr-3">{assemblyChest.name}</span>
                      <span className="text-[9px] text-zinc-400 uppercase font-mono">{assemblyChest.variant}</span>
                    </div>
                  ) : (
                    <select
                      className="bg-zinc-950 border border-zinc-800 text-xs rounded p-2 text-zinc-300 focus:outline-none focus:border-orange-500 h-[58px]"
                      onChange={(e) => {
                        const found = gameState.partsInventory.find(p => p.id === e.target.value);
                        if (found) setAssemblyChest(found);
                      }}
                      value=""
                    >
                      <option value="" disabled>-- Install Chest --</option>
                      {gameState.partsInventory.filter(p => p.type === PartType.Chest).map(p => (
                        <option key={p.id} value={p.id}>[{p.rarity?.toUpperCase() || "COMMON"}] {p.name} (End:{p.endurance})</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* ARM SLOT */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Arm (Force)</span>
                  {assemblyArm ? (
                    <div className="bg-zinc-800 p-2.5 rounded border border-orange-500/40 text-xs flex flex-col gap-1 relative">
                      <button
                        onClick={() => setAssemblyArm(null)}
                        className="absolute top-1 right-1 text-zinc-400 hover:text-red-400 font-bold"
                      >
                        ×
                      </button>
                      <span className="font-bold text-orange-500 truncate pr-3">{assemblyArm.name}</span>
                      <span className="text-[9px] text-zinc-400 uppercase font-mono">{assemblyArm.variant}</span>
                    </div>
                  ) : (
                    <select
                      className="bg-zinc-950 border border-zinc-800 text-xs rounded p-2 text-zinc-300 focus:outline-none focus:border-orange-500 h-[58px]"
                      onChange={(e) => {
                        const found = gameState.partsInventory.find(p => p.id === e.target.value);
                        if (found) setAssemblyArm(found);
                      }}
                      value=""
                    >
                      <option value="" disabled>-- Install Arm --</option>
                      {gameState.partsInventory.filter(p => p.type === PartType.Arm).map(p => (
                        <option key={p.id} value={p.id}>[{p.rarity?.toUpperCase() || "COMMON"}] {p.name} (Pow:{p.power})</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* LEG SLOT */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Leg (Speed)</span>
                  {assemblyLeg ? (
                    <div className="bg-zinc-800 p-2.5 rounded border border-orange-500/40 text-xs flex flex-col gap-1 relative">
                      <button
                        onClick={() => setAssemblyLeg(null)}
                        className="absolute top-1 right-1 text-zinc-400 hover:text-red-400 font-bold"
                      >
                        ×
                      </button>
                      <span className="font-bold text-orange-500 truncate pr-3">{assemblyLeg.name}</span>
                      <span className="text-[9px] text-zinc-400 uppercase font-mono">{assemblyLeg.variant}</span>
                    </div>
                  ) : (
                    <select
                      className="bg-zinc-950 border border-zinc-800 text-xs rounded p-2 text-zinc-300 focus:outline-none focus:border-orange-500 h-[58px]"
                      onChange={(e) => {
                        const found = gameState.partsInventory.find(p => p.id === e.target.value);
                        if (found) setAssemblyLeg(found);
                      }}
                      value=""
                    >
                      <option value="" disabled>-- Install Leg --</option>
                      {gameState.partsInventory.filter(p => p.type === PartType.Leg).map(p => (
                        <option key={p.id} value={p.id}>[{p.rarity?.toUpperCase() || "COMMON"}] {p.name} (Spd:{p.speed})</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Stat Projection Helper */}
              {assemblyHead && assemblyChest && assemblyArm && assemblyLeg && (
                <div className="bg-zinc-950 p-3 rounded border border-zinc-800 flex flex-col gap-2 relative z-10">
                  <span className="text-[10px] font-mono font-bold text-zinc-500 tracking-wider">PROJECTED BLOCK STATUS:</span>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                    <div className="bg-zinc-900 p-1.5 rounded border border-zinc-800/80">
                      <p className="text-[9px] text-zinc-500">ACC</p>
                      <p className="font-bold text-sky-400">{assemblyHead.accuracy + Math.floor((assemblyChest.accuracy + assemblyArm.accuracy + assemblyLeg.accuracy) * 0.25)}</p>
                    </div>
                    <div className="bg-zinc-900 p-1.5 rounded border border-zinc-800/80">
                      <p className="text-[9px] text-zinc-500">END</p>
                      <p className="font-bold text-emerald-400">{assemblyChest.endurance + Math.floor((assemblyHead.endurance + assemblyArm.endurance + assemblyLeg.endurance) * 0.25)}</p>
                    </div>
                    <div className="bg-zinc-900 p-1.5 rounded border border-zinc-800/80">
                      <p className="text-[9px] text-zinc-500">POW</p>
                      <p className="font-bold text-orange-500">{assemblyArm.power + Math.floor((assemblyHead.power + assemblyChest.power + assemblyLeg.power) * 0.25)}</p>
                    </div>
                    <div className="bg-zinc-900 p-1.5 rounded border border-zinc-800/80">
                      <p className="text-[9px] text-zinc-500">SPD</p>
                      <p className="font-bold text-yellow-500">{assemblyLeg.speed + Math.floor((assemblyHead.speed + assemblyChest.speed + assemblyArm.speed) * 0.25)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Name and Action */}
              <div className="flex flex-col gap-2 mt-2 relative z-10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Provide Mutant Name..."
                    value={assemblyName}
                    onChange={(e) => setAssemblyName(e.target.value.slice(0, 24))}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-xs focus:outline-none focus:border-orange-500 text-zinc-200"
                  />
                  <button
                    onClick={handleSuggestName}
                    disabled={!assemblyHead || !assemblyChest || !assemblyArm || !assemblyLeg}
                    className="bg-zinc-800 hover:bg-zinc-750 disabled:opacity-50 text-xs font-mono px-3 rounded text-zinc-300 border border-zinc-700 transition"
                    title="Generate Bio-Mechanical Designation Name"
                  >
                    🎲 Auto
                  </button>
                </div>

                <button
                  onClick={handleAssembleMutant}
                  disabled={!assemblyHead || !assemblyChest || !assemblyArm || !assemblyLeg || gameState.mutants.length >= 3}
                  className="w-full mt-1 py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:border-transparent text-black rounded-sm font-mono text-xs uppercase tracking-widest font-black transition-all skew-x-[-8deg] border border-orange-700 shadow-md"
                >
                  <span className="inline-block skew-x-[8deg]">
                    {gameState.mutants.length >= 3 ? "STABLE FULL (Limit 3)" : "☣️ FUSE NEW GLADIATOR"}
                  </span>
                </button>
              </div>
            </div>

            {/* ROSTER & BENCH SLOTS */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* CURRENT ACTIVE ROSTER & BENCH */}
              <div className="bg-zinc-900/60 rounded-lg border border-zinc-800 p-5 flex flex-col gap-4">
                <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
                  <h2 className="text-sm font-black font-mono text-zinc-200 tracking-wider flex items-center gap-2 uppercase">
                    🥋 Active Stable Roster ({gameState.mutants.length}/3)
                  </h2>
                  <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">
                    2 Active Field Slots + 1 Reserve Bench Slot
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {gameState.mutants.map((mut, idx) => {
                    const isSelected = selectedMutantId === mut.id;
                    const indexLabel = idx < 2 ? "ACTIVE" : "BENCH";

                    return (
                      <div
                        key={mut.id}
                        onClick={() => setSelectedMutantId(mut.id)}
                        className={`bg-zinc-950 p-4 rounded-md border cursor-pointer transition flex flex-col gap-3 relative ${
                          isSelected
                            ? "border-orange-500 shadow-md ring-1 ring-orange-500/30 bg-zinc-900/50"
                            : "border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        {/* Tags */}
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-sm font-bold tracking-wider ${
                            indexLabel === "ACTIVE" 
                              ? "bg-orange-600/15 text-orange-400 border border-orange-600/30"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}>
                            {indexLabel}
                          </span>
                          <span className={`text-[10px] font-mono font-bold uppercase ${
                            mut.status === "Healthy"
                              ? "text-emerald-400"
                              : mut.status === "Injured"
                              ? "text-orange-500 animate-pulse"
                              : "text-red-500"
                          }`}>
                            ● {mut.status}
                          </span>
                        </div>

                        {/* Name */}
                        <div>
                          <h3 className="text-sm font-black tracking-tight text-white uppercase">{mut.name}</h3>
                          <p className="text-[10px] font-mono text-zinc-500 mt-0.5">ROLE: <span className="text-orange-500 font-bold">{mut.role}</span></p>
                        </div>

                        {/* Visual SVG silhouette representation showing mutant part variations */}
                        <div className="bg-zinc-900/60 h-28 rounded border border-zinc-800 flex items-center justify-center p-2 relative overflow-hidden">
                          <svg className="w-full h-full opacity-70" viewBox="0 0 100 100">
                            {/* Glow behind */}
                            <circle cx="50" cy="50" r="30" fill="none" stroke={mut.parts.Head?.variant === PartVariant.Biological ? "#ef4444" : "#0284c7"} strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
                            
                            {/* Head representation */}
                            {mut.parts.Head ? (
                              <circle cx="50" cy="25" r="10" fill={mut.parts.Head.variant === PartVariant.Biological ? "#ef4444" : "#38bdf8"} opacity="0.8" />
                            ) : (
                              <circle cx="50" cy="25" r="10" fill="none" stroke="#27272a" strokeWidth="2" strokeDasharray="2,2" opacity="0.5" />
                            )}
                            {/* Chest representation */}
                            {mut.parts.Chest ? (
                              <rect x="38" y="38" width="24" height="28" rx="4" fill={mut.parts.Chest.variant === PartVariant.Biological ? "#b91c1c" : "#0284c7"} opacity="0.8" />
                            ) : (
                              <rect x="38" y="38" width="24" height="28" rx="4" fill="none" stroke="#27272a" strokeWidth="2" strokeDasharray="2,2" opacity="0.5" />
                            )}
                            {/* Arm representation (asymmetrical oversized) */}
                            {mut.parts.Arm ? (
                              mut.parts.Arm.variant === PartVariant.Biological ? (
                                <path d="M 38,42 L 18,52 L 20,62 L 34,48 Z" fill="#ef4444" opacity="0.8" />
                              ) : (
                                <path d="M 62,42 L 85,55 L 80,68 L 62,48 Z" fill="#38bdf8" opacity="0.8" />
                              )
                            ) : (
                              <line x1="25" y1="50" x2="38" y2="45" stroke="#27272a" strokeWidth="2" strokeDasharray="2,2" opacity="0.5" />
                            )}
                            {/* Leg representation */}
                            {mut.parts.Leg ? (
                              <>
                                <rect x="42" y="68" width="6" height="20" fill={mut.parts.Leg.variant === PartVariant.Biological ? "#f87171" : "#0ea5e9"} opacity="0.8" />
                                <rect x="52" y="68" width="6" height="20" fill={mut.parts.Leg.variant === PartVariant.Biological ? "#f87171" : "#0ea5e9"} opacity="0.8" />
                              </>
                            ) : (
                              <>
                                <line x1="45" y1="68" x2="45" y2="88" stroke="#27272a" strokeWidth="2" strokeDasharray="2,2" opacity="0.5" />
                                <line x1="55" y1="68" x2="55" y2="88" stroke="#27272a" strokeWidth="2" strokeDasharray="2,2" opacity="0.5" />
                              </>
                            )}
                          </svg>

                          {/* Gear visual indicator */}
                          {mut.equipment && (
                            <div className="absolute bottom-1 right-1 text-[9px] bg-zinc-950 text-orange-400 border border-zinc-800 px-1.5 py-0.5 rounded font-mono truncate max-w-[95px]">
                              🛡️ {mut.equipment.name}
                            </div>
                          )}
                        </div>

                        {/* Stat values */}
                        <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px] bg-zinc-900 p-1.5 rounded border border-zinc-850">
                          <div>
                            <span className="text-zinc-500 block text-[8px] font-bold">ACC</span>
                            <span className="font-semibold text-sky-400">{mut.accuracy}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[8px] font-bold">END</span>
                            <span className="font-semibold text-emerald-400">{mut.endurance}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[8px] font-bold">POW</span>
                            <span className="font-semibold text-orange-500">{mut.power}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[8px] font-bold">SPD</span>
                            <span className="font-semibold text-yellow-500">{mut.speed}</span>
                          </div>
                        </div>

                        {/* HP status indicator bar */}
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="flex justify-between text-[8px] font-mono text-zinc-400">
                            <span>ENDUR: {mut.currentEndurance}/{mut.maxEndurance}</span>
                            <span>{Math.floor((mut.currentEndurance / mut.maxEndurance) * 100)}%</span>
                          </div>
                          <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                mut.status === "Healthy" ? "bg-orange-600" : "bg-orange-400"
                              }`}
                              style={{ width: `${(mut.currentEndurance / mut.maxEndurance) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty Slot Fill-in */}
                  {gameState.mutants.length < 3 && (
                    <div className="bg-zinc-950 p-4 rounded-lg border border-dashed border-zinc-800 flex flex-col items-center justify-center text-center py-10">
                      <Plus className="w-8 h-8 text-zinc-600 mb-2" />
                      <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest font-bold">Empty Slot</span>
                      <p className="text-[10px] text-zinc-600 max-w-[150px] mt-1 leading-relaxed">Assemble parts in the assembly bay to recruit another gladiator.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* MUTANT INSPECTION & STABILIZATION PANEL */}
              {selectedMutantId && (
                (() => {
                  const mut = gameState.mutants.find((m) => m.id === selectedMutantId);
                  if (!mut) return null;

                  return (
                    <div className="bg-zinc-900/60 rounded-lg border border-zinc-800 p-5 flex flex-col gap-4">
                      <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
                        <h3 className="text-sm font-black font-mono text-orange-500 flex items-center gap-2 uppercase tracking-wider">
                          ⚙️ Gladiator Management: {mut.name}
                        </h3>
                        <button
                          onClick={() => {
                            // Retired mutant from stable, recover parts!
                            if (window.confirm(`Are you sure you want to dismantle ${mut.name}? You will salvage and retrieve all 4 of their parts back into your inventory!`)) {
                              const extraParts = [mut.parts.Head, mut.parts.Chest, mut.parts.Arm, mut.parts.Leg].filter((p): p is Part => p !== null);
                              const newInventory = [...gameState.partsInventory, ...extraParts];
                              const newMutants = gameState.mutants.filter(m => m.id !== mut.id);
                              setSelectedMutantId(null);
                              saveGame({
                                ...gameState,
                                partsInventory: newInventory,
                                mutants: newMutants
                              });
                            }
                          }}
                          className="text-xs text-red-500 hover:text-red-400 hover:bg-red-950/20 transition font-mono border border-zinc-800 px-3 py-1 rounded bg-zinc-950/50"
                        >
                          Dismantle Mutant
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        {/* Tactical Role Assignment */}
                        <div className="flex flex-col gap-3">
                          <h4 className="font-mono text-zinc-400 font-bold border-b border-zinc-800 pb-1 uppercase tracking-wider">
                            📋 Deploy Role Assignment
                          </h4>
                          <p className="text-zinc-400 text-[11px] leading-relaxed">
                            Assigning the right gladiator to the right role matters more than raw stats. Fast leg-dominant mutants fit **Carrier**. Bulkier, high-endurance, high-power mutants excel as **Blockers**.
                          </p>

                          <div className="flex flex-col gap-1.5 mt-2">
                            <label className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">SELECT MATCH ROLE:</label>
                            <select
                              className="bg-zinc-950 border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-orange-500"
                              value={mut.role}
                              onChange={(e) => {
                                const newRole = e.target.value as MutantRole;
                                const updatedMutants = gameState.mutants.map(m => m.id === mut.id ? { ...m, role: newRole } : m);
                                saveGame({ ...gameState, mutants: updatedMutants });
                              }}
                            >
                              <option value={MutantRole.Carrier}>Carrier (Ball Runner)</option>
                              <option value={MutantRole.Escort}>Escort (Offense Protector)</option>
                              <option value={MutantRole.Interceptor}>Interceptor (Defense Tackler)</option>
                              <option value={MutantRole.Blocker}>Blocker (Defense Path-Clearer)</option>
                            </select>
                          </div>

                          <div className="bg-zinc-950 p-3 rounded border border-zinc-800 mt-1 flex flex-col gap-1">
                            <span className="font-mono text-[10px] text-orange-500 font-bold uppercase tracking-wider">Role Instructions:</span>
                            <span className="text-[11px] text-zinc-400 leading-relaxed">
                              {mut.role === MutantRole.Carrier && "Advances directly down the court toward the target line. Weight of the iron ball slows speed."}
                              {mut.role === MutantRole.Escort && "Moves in advance of your Carrier, placing their torso directly in paths of defenders to absorb hits."}
                              {mut.role === MutantRole.Interceptor && "Chases the opposing ball carrier, attempting brutal tackles to force a fumble."}
                              {mut.role === MutantRole.Blocker && "Pins down the enemy Escorts, making a straight path for your Interceptor."}
                            </span>
                          </div>
                        </div>

                        {/* Equipment / Modifiers */}
                        <div className="flex flex-col gap-3">
                          <h4 className="font-mono text-zinc-400 font-bold border-b border-zinc-800 pb-1 uppercase tracking-wider">
                            🛡️ Equipment Socket (1 Limit)
                          </h4>

                          {mut.equipment ? (
                            <div className="bg-zinc-950 p-3 rounded border border-orange-500/30 flex flex-col gap-2 relative">
                              <button
                                onClick={() => handleRemoveEquip(mut.id)}
                                className="absolute top-2 right-2 text-zinc-500 hover:text-red-400 font-bold text-xs"
                              >
                                Unequip
                              </button>
                              <span className="font-bold text-orange-400 font-mono text-xs uppercase tracking-wider">{mut.equipment.name}</span>
                              <p className="text-[11px] text-zinc-400 leading-relaxed">{mut.equipment.description}</p>
                            </div>
                          ) : (
                            <div className="bg-zinc-950 p-3 rounded border border-dashed border-zinc-800 text-center py-6 text-zinc-500 text-[11px] font-mono uppercase tracking-wider">
                              No defensive or utility gear socketed. Visit the Scrap Shop to buy flat-modifier gear.
                            </div>
                          )}

                          {/* Historical records */}
                          <div className="border-t border-zinc-800 pt-3 flex flex-col gap-1.5 mt-2">
                            <span className="font-mono text-[10px] text-zinc-500 font-bold uppercase tracking-wider">GLADIATOR COMBAT STATS:</span>
                            <div className="grid grid-cols-2 gap-4 text-zinc-400 text-[11px] font-mono">
                              <div>MATCHES PLAYED: <span className="text-zinc-100 font-bold">{mut.matchesPlayed}</span></div>
                              <div>STATUS RATING: <span className="text-emerald-400 font-bold uppercase">{mut.status}</span></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Displaying Current Grafts (Assembled Parts detail) */}
                      <div className="border-t border-zinc-800 pt-4 mt-2">
                        <span className="font-mono text-[10px] text-zinc-500 font-bold block mb-2 uppercase tracking-wider">CURRENT INSTALLED GRAFTS:</span>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          {[PartType.Head, PartType.Chest, PartType.Arm, PartType.Leg].map((type) => {
                            const part = mut.parts[type];
                            return (
                              <div key={type} className="bg-zinc-950 p-2.5 rounded border border-zinc-850 flex flex-col gap-1 text-[11px]">
                                <span className="text-[9px] font-mono text-orange-500 uppercase font-bold">{type} Graft:</span>
                                <span className="font-bold text-zinc-200 truncate">{part.name}</span>
                                <span className="text-[9px] text-zinc-500 uppercase font-mono">{part.variant} variant</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* INFIRMARY SECTION */}
              <div className="bg-zinc-900/60 rounded-lg border border-zinc-800 p-5 flex flex-col gap-4">
                <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
                  <h2 className="text-sm font-black font-mono text-orange-500 flex items-center gap-2 uppercase tracking-wider">
                    🏥 Recovery Infirmary
                  </h2>
                  <span className="text-[9px] bg-orange-600/15 text-orange-400 border border-orange-600/35 px-2 py-0.5 rounded font-mono">
                    Bio-Triage Station
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Fighters who suffer a knockout match failure roll for death or injury. Survivors occupy Infirmary beds and recover fully after a set number of matches played.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
                  {gameState.infirmary.map((bed, idx) => {
                    const patient = bed.mutantId ? gameState.mutants.find(m => m.id === bed.mutantId) : null;

                    return (
                      <div
                        key={bed.id}
                        className={`p-4 rounded-md border flex flex-col justify-between gap-3 ${
                          patient
                            ? "bg-orange-600/5 border-orange-500/30"
                            : "bg-zinc-950 border-zinc-800 border-dashed"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-zinc-500 font-bold">BED #{idx + 1}</span>
                          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                            patient ? "bg-orange-600/15 text-orange-400 border border-orange-600/30 font-bold" : "bg-zinc-900 text-zinc-500 font-bold"
                          }`}>
                            {patient ? "Occupied" : "Vacant"}
                          </span>
                        </div>

                        {patient ? (
                          <div>
                            <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-tight">{patient.name}</h4>
                            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                              Undergoing cellular micro-tissue fusion...
                            </p>
                            <div className="mt-2 text-xs font-mono text-orange-500">
                              🕒 RECOVERY TIME: <span className="font-bold">{bed.matchesRemaining} Match(es)</span> remaining
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-zinc-600 text-xs font-mono uppercase tracking-widest font-bold">
                            READY FOR INJURED TRIAGE
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- SHOP TAB --- */}
        {activeTab === "shop" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* INVENTORY / SALVAGE SCRAP LIST */}
            <div className="lg:col-span-2 bg-zinc-900/60 rounded-lg border border-zinc-800 p-5 flex flex-col gap-4">
              <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
                <h2 className="text-sm font-black font-mono text-zinc-200 tracking-wider flex items-center gap-2 uppercase">
                  🎒 Salvaged Parts Inventory ({gameState.partsInventory.length})
                </h2>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  Swappable grafts awaiting assembly
                </span>
              </div>

              {gameState.partsInventory.length === 0 ? (
                <div className="text-center py-16 bg-zinc-950 rounded-lg border border-zinc-850 flex flex-col items-center justify-center">
                  <Wrench className="w-10 h-10 text-zinc-700 mb-2" />
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest font-bold">No Spare Parts Available</span>
                  <p className="text-[10px] text-zinc-600 max-w-sm mt-1 leading-relaxed">Buy newly harvested cyber parts or complete arena battles to salvage biological tissue from fallen mutants.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gameState.partsInventory.map((part) => {
                    const rarity = part.rarity || PartRarity.Common;
                    const borderClass = 
                      rarity === PartRarity.Epic
                        ? "border-amber-500/80 bg-gradient-to-b from-zinc-950 to-amber-950/20 shadow-[0_0_12px_rgba(245,158,11,0.12)]"
                        : rarity === PartRarity.Rare
                          ? "border-sky-500/50 bg-gradient-to-b from-zinc-950 to-sky-950/10"
                          : "border-zinc-850 bg-zinc-950";

                    return (
                      <div
                        key={part.id}
                        className={`p-4 rounded-md border flex flex-col justify-between gap-3 hover:border-zinc-700 transition ${borderClass}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-sm uppercase font-bold tracking-wider ${
                              part.variant === PartVariant.Biological
                                ? "bg-red-950/45 text-red-400 border border-red-800/30"
                                : "bg-sky-950/45 text-sky-400 border border-sky-800/30"
                            }`}>
                              {part.variant} {part.type}
                            </span>
                            <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-sm font-extrabold uppercase tracking-wide ${
                              rarity === PartRarity.Epic
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                                : rarity === PartRarity.Rare
                                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                                  : "bg-zinc-800 text-zinc-400"
                            }`}>
                              {rarity}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-orange-500 font-bold">
                            ⚙️ Salvage: {Math.floor(part.price * 0.4)} Iron
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-black text-zinc-200 uppercase tracking-tight flex items-center gap-1.5">
                            {part.isNamed && <span className="text-amber-400 text-xs">⭐</span>}
                            {part.name}
                          </h3>
                          <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{part.description}</p>
                          
                          {part.isNamed && part.backstory && (
                            <p className="text-[10px] text-zinc-400 italic bg-amber-500/5 p-2 rounded border border-amber-500/10 leading-relaxed font-sans mt-2">
                              📜 "{part.backstory}"
                            </p>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono bg-zinc-900/60 p-2 rounded border border-zinc-850/50">
                          <div>
                            <p className="text-zinc-500 text-[8px] font-bold">ACCURACY</p>
                            <p className="font-bold text-sky-400">
                              +{part.accuracy}
                              {part.bonusStat?.accuracy && (
                                <span className="text-amber-400 text-[8px] block font-normal">+{part.bonusStat.accuracy} Epic</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-zinc-500 text-[8px] font-bold">ENDURANCE</p>
                            <p className="font-bold text-emerald-400">
                              +{part.endurance}
                              {part.bonusStat?.endurance && (
                                <span className="text-amber-400 text-[8px] block font-normal">+{part.bonusStat.endurance} Epic</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-zinc-500 text-[8px] font-bold">POWER</p>
                            <p className="font-bold text-orange-500">
                              +{part.power}
                              {part.bonusStat?.power && (
                                <span className="text-amber-400 text-[8px] block font-normal">+{part.bonusStat.power} Epic</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-zinc-500 text-[8px] font-bold">SPEED</p>
                            <p className="font-bold text-yellow-400">
                              +{part.speed}
                              {part.bonusStat?.speed && (
                                <span className="text-amber-400 text-[8px] block font-normal">+{part.bonusStat.speed} Epic</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSellPart(part)}
                          className="w-full py-2 bg-zinc-900 hover:bg-red-950/40 hover:text-red-400 text-xs font-mono text-zinc-400 rounded-sm transition flex items-center justify-center gap-1 border border-zinc-850 cursor-pointer font-bold uppercase tracking-wider mt-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Sell Salvage Part
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* THE SHOP / TRADING STATION */}
            <div className="bg-zinc-900/60 rounded-lg border border-zinc-800 p-5 flex flex-col gap-4">
              <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
                <h2 className="text-sm font-black font-mono text-orange-500 flex items-center gap-2 uppercase tracking-wider">
                  🛒 Black Market Shop
                </h2>
                <span className="text-[9px] bg-orange-600/15 text-orange-400 border border-orange-600/35 px-2 py-0.5 rounded font-mono uppercase font-bold">
                  Solder &amp; Gear
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-zinc-400 bg-zinc-950 p-2.5 rounded border border-zinc-850 leading-relaxed">
                <Info className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span>
                  All parts are pre-certified biological graft tissues or heavy mechanical chassis modifications.
                </span>
              </div>

              {/* Quick Restock Part */}
              <div className="flex flex-col gap-3 mt-2">
                <h3 className="text-xs font-mono text-zinc-300 font-bold uppercase tracking-wider">
                  🧪 Purchase Uncertified Graft Parts
                </h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Buy newly harvested mystery biological or mechanical body body parts with randomly calibrated stats.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      const part = generateRandomPart();
                      part.variant = PartVariant.Biological;
                      part.price = 140;
                      handleBuyPart(part);
                    }}
                    className="py-3 bg-zinc-950 hover:bg-orange-600/10 border border-zinc-800 hover:border-orange-500/30 text-xs font-mono text-zinc-300 rounded-sm transition text-center flex flex-col items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="font-bold">Flesh Organ Graft</span>
                    <span className="text-orange-500 font-bold text-[10px]">⚙️ 140 Iron</span>
                  </button>

                  <button
                    onClick={() => {
                      const part = generateRandomPart();
                      part.variant = PartVariant.Mechanical;
                      part.price = 150;
                      handleBuyPart(part);
                    }}
                    className="py-3 bg-zinc-950 hover:bg-orange-600/10 border border-zinc-800 hover:border-orange-500/30 text-xs font-mono text-zinc-300 rounded-sm transition text-center flex flex-col items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="font-bold">Cybernetic Graft</span>
                    <span className="text-orange-500 font-bold text-[10px]">⚙️ 150 Iron</span>
                  </button>
                </div>
              </div>

              {/* Equipment Items list for Sale */}
              <div className="flex flex-col gap-3 border-t border-zinc-800 pt-4 mt-2">
                <h3 className="text-xs font-mono text-zinc-300 font-bold uppercase tracking-wider">
                  🛡️ Purchase Utility Gear (1 Socket Max)
                </h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Socket flat modifiers to customize your assembled gladiator. Select a healthy fighter below to equip.
                </p>

                {/* Target Mutant Select */}
                <div className="flex flex-col gap-1 text-[11px]">
                  <label className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">APPLY EQUIPMENT TO:</label>
                  <select
                    className="bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-300 focus:outline-none focus:border-orange-500 font-mono"
                    value={selectedMutantId || ""}
                    onChange={(e) => setSelectedMutantId(e.target.value)}
                  >
                    <option value="" disabled>-- Choose Gladiator --</option>
                    {gameState.mutants.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.status})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-3 mt-1 overflow-y-auto max-h-[350px] pr-1">
                  {EQUIPMENT_LIST.map((item) => (
                    <div
                      key={item.id}
                      className="bg-zinc-950 p-3 rounded-md border border-zinc-850 hover:border-zinc-800 transition flex flex-col justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center justify-between font-mono text-[11px] text-orange-500 font-bold uppercase tracking-wider">
                          <span>{item.name}</span>
                          <span className="text-orange-500">⚙️ {item.price} Iron</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">{item.description}</p>
                        {item.gatedBy && (
                          <span className="text-[9px] font-mono text-orange-400/80 block mt-1 uppercase font-bold tracking-wider">
                            Requires: 3x {item.gatedBy.variant} parts
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          if (!selectedMutantId) {
                            alert("Please select a target gladiator in the dropdown above to equip!");
                            return;
                          }
                          handleBuyEquipment(item, selectedMutantId);
                        }}
                        className="w-full py-1.5 bg-orange-600 hover:bg-orange-500 text-black text-xs font-mono font-black rounded-sm transition border border-orange-700 cursor-pointer uppercase tracking-widest text-[9px]"
                      >
                        Buy &amp; Equip Gear
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- MUTANT SHOWCASE TAB --- */}
        {activeTab === "showcase" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT RAIL: MUTANT SELECTOR */}
            <div className="lg:col-span-3 bg-zinc-900/60 rounded-lg border border-zinc-800 p-4 flex flex-col gap-4">
              <div className="border-b border-zinc-800 pb-2">
                <h2 className="text-xs font-black font-mono text-zinc-400 uppercase tracking-wider">
                  📋 Stable Roster ({gameState.mutants.length})
                </h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                  Select gladiator to inspect
                </p>
              </div>

              {gameState.mutants.length === 0 ? (
                <div className="text-center py-10 bg-zinc-950 rounded border border-zinc-850">
                  <Skull className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Stable is Empty</span>
                  <p className="text-[9px] text-zinc-600 mt-1 px-4">Assemble body grafts in the Assembly tab first!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px] pr-1">
                  {gameState.mutants.map((mut) => {
                    const isSelected = selectedMutantId === mut.id || (!selectedMutantId && gameState.mutants[0]?.id === mut.id);
                    return (
                      <button
                        key={mut.id}
                        onClick={() => setSelectedMutantId(mut.id)}
                        className={`w-full p-3 rounded text-left border transition flex flex-col gap-1.5 cursor-pointer ${
                          isSelected
                            ? "bg-orange-600/15 border-orange-500 text-white"
                            : "bg-zinc-950/60 border-zinc-850 hover:border-zinc-700 text-zinc-400"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-black uppercase tracking-tight truncate max-w-[130px]">
                            {mut.name}
                          </span>
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                            mut.status === "Healthy"
                              ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/20"
                              : "bg-red-950/40 text-red-400 border border-red-800/20"
                          }`}>
                            {mut.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[9px] font-mono border-t border-zinc-850/40 pt-1.5 mt-0.5 text-zinc-500">
                          <span>Role: <strong className="text-orange-500">{mut.role}</strong></span>
                          <span className="text-[8px] text-zinc-500">
                            💀 {mut.kills} | 🏈 {mut.scores}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CENTER PANEL: INTERACTIVE DIAGNOSTIC CANVASES */}
            {(() => {
              const activeShowcaseMutant = gameState.mutants.find(m => m.id === selectedMutantId) || gameState.mutants[0] || null;
              
              if (!activeShowcaseMutant) {
                return (
                  <div className="lg:col-span-9 bg-zinc-900/60 rounded-lg border border-zinc-800 p-12 text-center flex flex-col items-center justify-center gap-4">
                    <Wrench className="w-12 h-12 text-zinc-700 animate-pulse" />
                    <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-widest font-black">Stable is Empty</h3>
                    <p className="text-xs text-zinc-500 max-w-md">You need to assemble a mutant gladiator using body parts from your backpack before you can perform diagnostic inspections in the showcase bay.</p>
                    <button
                      onClick={() => setActiveTab("stable")}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-mono text-xs font-black uppercase tracking-wider rounded transition"
                    >
                      Go Assemble Gladiator
                    </button>
                  </div>
                );
              }

              return (
                <>
                  <div className="lg:col-span-5 bg-zinc-900/60 rounded-lg border border-zinc-800 p-5 flex flex-col gap-4 justify-between relative overflow-hidden">
                    {/* Diagnostic grid overlays */}
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
                    
                    {/* Showcase Header */}
                    <div className="relative z-10 border-b border-zinc-800 pb-2 flex justify-between items-start">
                      <div>
                        <span className="text-[8px] font-mono text-orange-500 font-bold uppercase tracking-widest bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-sm">
                          Gladiator Diagnostic Station
                        </span>
                        <h2 className="text-base font-black tracking-tight text-white uppercase mt-1">
                          {activeShowcaseMutant.name}
                        </h2>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-mono text-zinc-500 block">TACTICAL RATING</span>
                        <span className="text-sm font-black font-mono text-orange-500">
                          {activeShowcaseMutant.accuracy + activeShowcaseMutant.endurance + activeShowcaseMutant.power + activeShowcaseMutant.speed} pts
                        </span>
                      </div>
                    </div>

                    {/* ROTATING DIAGNOSTIC STAGE */}
                    <div className="bg-zinc-950 rounded-lg border border-zinc-850 h-[300px] flex items-center justify-center p-4 relative overflow-hidden">
                      {/* Technical Scanner lines */}
                      <div className="absolute top-0 left-0 w-full h-1/2 border-b border-orange-500/20 animate-[bounce_4s_infinite] pointer-events-none z-10 shadow-[0_4px_12px_rgba(249,115,22,0.1)]"></div>
                      
                      {/* Diagnostic crosshairs */}
                      <div className="absolute top-4 left-4 text-zinc-700 font-mono text-[8px] pointer-events-none select-none">
                        RX-7: ENG_OK<br />TEMP: 38.4°C
                      </div>
                      <div className="absolute top-4 right-4 text-zinc-700 font-mono text-[8px] pointer-events-none select-none text-right">
                        ZOOM: {showcaseZoom.toFixed(1)}x<br />ROT: {showcaseRotation}°
                      </div>
                      <div className="absolute bottom-4 left-4 text-zinc-700 font-mono text-[8px] pointer-events-none select-none">
                        GRIDIRON LABS v2.6<br />STABLE LOCK: SECURE
                      </div>
                      
                      {/* Actual character drawing with rotate and zoom applied */}
                      <svg viewBox="0 0 160 160" className="w-64 h-64 select-none drop-shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                        <g transform={`translate(80, 80) scale(${showcaseZoom}) rotate(${showcaseRotation})`}>
                          {(() => {
                            const mut = activeShowcaseMutant;
                            const headBio = mut.parts.Head?.variant === PartVariant.Biological;
                            const chestBio = mut.parts.Chest?.variant === PartVariant.Biological;
                            const armBio = mut.parts.Arm?.variant === PartVariant.Biological;
                            const legBio = mut.parts.Leg?.variant === PartVariant.Biological;

                            const isEpicHead = mut.parts.Head?.rarity === PartRarity.Epic;
                            const isEpicChest = mut.parts.Chest?.rarity === PartRarity.Epic;
                            const isEpicArm = mut.parts.Arm?.rarity === PartRarity.Epic;
                            const isEpicLeg = mut.parts.Leg?.rarity === PartRarity.Epic;

                            // Color palette
                            const bioColor = "#ef4444"; // Vivid blood crimson
                            const bioAccent = "#f87171";
                            const mechColor = "#38bdf8"; // Cyber cyan
                            const mechAccent = "#0ea5e9";

                            return (
                              <>
                                {/* Diagnostic scanner lines/rings background inside rotate */}
                                <circle cx="0" cy="0" r="38" fill="none" stroke="#22252a" strokeWidth="0.5" strokeDasharray="2,4" />
                                <circle cx="0" cy="0" r="26" fill="none" stroke="#22252a" strokeWidth="0.5" />

                                {/* LEGS SLOT */}
                                {mut.parts.Leg ? (
                                  legBio ? (
                                    <g>
                                      {/* Biological scuttling multi-limbs */}
                                      <path d="M -8,12 Q -22,24 -14,38" fill="none" stroke={isEpicLeg ? "#f43f5e" : bioColor} strokeWidth="3" strokeLinecap="round" />
                                      <path d="M 8,12 Q 22,24 14,38" fill="none" stroke={isEpicLeg ? "#f43f5e" : bioColor} strokeWidth="3" strokeLinecap="round" />
                                      <path d="M -4,15 Q -12,28 -5,40" fill="none" stroke={isEpicLeg ? "#fda4af" : bioAccent} strokeWidth="2.5" strokeLinecap="round" />
                                      <path d="M 4,15 Q 12,28 5,40" fill="none" stroke={isEpicLeg ? "#fda4af" : bioAccent} strokeWidth="2.5" strokeLinecap="round" />
                                    </g>
                                  ) : (
                                    <g>
                                      {/* Mechanical heavy tread tracks / gyro-wheels */}
                                      <circle cx="-10" cy="30" r="7" fill="#18181b" stroke={isEpicLeg ? "#38bdf8" : mechColor} strokeWidth="1.5" />
                                      <circle cx="10" cy="30" r="7" fill="#18181b" stroke={isEpicLeg ? "#38bdf8" : mechColor} strokeWidth="1.5" />
                                      <rect x="-18" y="27" width="36" height="6" rx="3" fill="none" stroke="#71717a" strokeWidth="1.5" />
                                      <line x1="-12" y1="30" x2="12" y2="30" stroke="#52525b" strokeWidth="2" />
                                    </g>
                                  )
                                ) : (
                                  <g opacity="0.2">
                                    <line x1="-10" y1="12" x2="-10" y2="35" stroke="#71717a" strokeWidth="1.5" strokeDasharray="3,3" />
                                    <line x1="10" y1="12" x2="10" y2="35" stroke="#71717a" strokeWidth="1.5" strokeDasharray="3,3" />
                                  </g>
                                )}

                                {/* CHEST / TORSO */}
                                {mut.parts.Chest ? (
                                  chestBio ? (
                                    <g>
                                      <path d="M -16,-12 Q -22,6 0,16 Q 22,6 16,-12 Z" fill={isEpicChest ? "#b91c1c" : "#991b1b"} stroke="#f87171" strokeWidth="1.5" />
                                      <circle cx="0" cy="0" r="5" fill="#ef4444" className="animate-pulse" />
                                      <path d="M -8,-6 Q 0,-2 8,-6" fill="none" stroke="#ef4444" strokeWidth="1" />
                                    </g>
                                  ) : (
                                    <g>
                                      <rect x="-15" y="-14" width="30" height="28" rx="3" fill={isEpicChest ? "#0f172a" : "#1e293b"} stroke={isEpicChest ? "#38bdf8" : "#0284c7"} strokeWidth="2" />
                                      <rect x="-6" y="-6" width="12" height="12" rx="1" fill="#09090b" stroke="#38bdf8" strokeWidth="1" />
                                      <circle cx="0" cy="0" r="3" fill="#38bdf8" className="animate-pulse" />
                                      <path d="M -11,-10 L -11,10" stroke="#4b5563" strokeWidth="1.5" />
                                      <path d="M 11,-10 L 11,10" stroke="#4b5563" strokeWidth="1.5" />
                                    </g>
                                  )
                                ) : (
                                  <rect x="-14" y="-12" width="28" height="24" rx="2" fill="none" stroke="#3f3f46" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.3" />
                                )}

                                {/* ARMS */}
                                {mut.parts.Arm ? (
                                  armBio ? (
                                    <g>
                                      <path d="M -15,-2 Q -32,-8 -30,-22 Q -24,-24 -18,-10" fill={isEpicArm ? "#ef4444" : "#b91c1c"} stroke="#f87171" strokeWidth="1" />
                                      <path d="M 15,-2 Q 35,-6 28,12 T 38,28" fill="none" stroke={isEpicArm ? "#f43f5e" : bioColor} strokeWidth="3" strokeLinecap="round" />
                                    </g>
                                  ) : (
                                    <g>
                                      <path d="M -15,-4 L -28,-4 L -32,2 L -28,8 L -15,4" fill="#334155" stroke={isEpicArm ? "#38bdf8" : mechColor} strokeWidth="1.5" />
                                      <line x1="-22" y1="-4" x2="-22" y2="8" stroke="#64748b" strokeWidth="2" />
                                      <path d="M 15,-4 L 28,-4 L 32,4 L 28,12 L 15,4" fill="#334155" stroke={isEpicArm ? "#38bdf8" : mechColor} strokeWidth="1.5" />
                                      <circle cx="28" cy="4" r="3.5" fill="none" stroke="#f59e0b" strokeWidth="1.5" className="animate-pulse" />
                                    </g>
                                  )
                                ) : (
                                  <g opacity="0.2">
                                    <line x1="-15" y1="0" x2="-28" y2="0" stroke="#71717a" strokeWidth="1.5" strokeDasharray="3,3" />
                                    <line x1="15" y1="0" x2="28" y2="0" stroke="#71717a" strokeWidth="1.5" strokeDasharray="3,3" />
                                  </g>
                                )}

                                {/* HEAD */}
                                {mut.parts.Head ? (
                                  headBio ? (
                                    <g transform="translate(0, -21)">
                                      <circle cx="0" cy="0" r="10" fill={isEpicHead ? "#f43f5e" : bioColor} stroke="#fda4af" strokeWidth="1" />
                                      <path d="M -8,-5 Q -14,-16 -6,-14" fill="none" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" />
                                      <path d="M 8,-5 Q 14,-16 6,-14" fill="none" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" />
                                      <circle cx="-3" cy="1" r="1.8" fill="#a855f7" />
                                      <circle cx="3" cy="1" r="1.8" fill="#a855f7" />
                                    </g>
                                  ) : (
                                    <g transform="translate(0, -21)">
                                      <rect x="-9" y="-9" width="18" height="18" rx="1.5" fill={isEpicHead ? "#0f172a" : "#334155"} stroke={isEpicHead ? "#38bdf8" : mechColor} strokeWidth="1.5" />
                                      <rect x="-6" y="-3" width="12" height="4" rx="0.5" fill="#09090b" stroke="#38bdf8" strokeWidth="1" />
                                      <line x1="-5" y1="-1" x2="5" y2="-1" stroke="#38bdf8" strokeWidth="1.5" className="animate-pulse" />
                                      <line x1="5" y1="-9" x2="9" y2="-15" stroke="#94a3b8" strokeWidth="1.2" />
                                      <circle cx="9" cy="-15" r="1" fill="#f43f5e" />
                                    </g>
                                  )
                                ) : (
                                  <circle cx="0" cy="-21" r="9" fill="none" stroke="#3f3f46" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.3" />
                                )}

                                {/* EQUIPMENT WEARABLE VISUAL COAT */}
                                {mut.equipment && (
                                  <g opacity="0.8">
                                    {mut.equipment.id.includes("plates") || mut.equipment.id.includes("cage") ? (
                                      <g>
                                        <path d="M -18,-15 Q -15,-20 -10,-14" fill="none" stroke="#fbbf24" strokeWidth="3" />
                                        <path d="M 18,-15 Q 15,-20 10,-14" fill="none" stroke="#fbbf24" strokeWidth="3" />
                                      </g>
                                    ) : (
                                      <circle cx="0" cy="-5" r="34" fill="none" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="2,6" className="animate-spin-slow" />
                                    )}
                                  </g>
                                )}
                              </>
                            );
                          })()}
                        </g>
                      </svg>
                    </div>

                    {/* INTERACTIVE CONTROLS */}
                    <div className="bg-zinc-950 p-4 rounded border border-zinc-850 flex flex-col gap-3 relative z-10">
                      <div>
                        <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold mb-1">
                          <span>ROTATION ANGLE</span>
                          <span className="text-orange-500">{showcaseRotation}°</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={showcaseRotation}
                          onChange={(e) => setShowcaseRotation(parseInt(e.target.value))}
                          className="w-full accent-orange-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold mb-1">
                          <span>DIAGNOSTIC ZOOM</span>
                          <span className="text-orange-500">{showcaseZoom.toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="2.5"
                          step="0.1"
                          value={showcaseZoom}
                          onChange={(e) => setShowcaseZoom(parseFloat(e.target.value))}
                          className="w-full accent-orange-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                        />
                      </div>

                      <div className="flex gap-2 justify-center pt-1">
                        <button
                          onClick={() => { setShowcaseRotation(0); setShowcaseZoom(1.2); }}
                          className="px-3 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-400 rounded-sm cursor-pointer transition uppercase"
                        >
                          🔄 Reset view
                        </button>
                      </div>
                    </div>

                    {/* STAT BLOCK CONTRIBUTIONS PANEL */}
                    <div className="bg-zinc-950 p-4 rounded border border-zinc-850 flex flex-col gap-3 relative z-10">
                      <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-wider block border-b border-zinc-900 pb-1.5">
                        📈 Generated Stat Block &amp; Solder Bonuses
                      </span>

                      <div className="flex flex-col gap-2 text-xs">
                        {/* Accuracy */}
                        <div>
                          <div className="flex justify-between font-mono text-[10px] mb-1">
                            <span className="text-zinc-400">ACCURACY (HEAD DETECTOR)</span>
                            <span className="text-sky-400 font-bold">{activeShowcaseMutant.accuracy} / 15</span>
                          </div>
                          <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden flex">
                            <div className="bg-sky-500 h-full" style={{ width: `${(activeShowcaseMutant.accuracy / 15) * 100}%` }}></div>
                          </div>
                        </div>

                        {/* Endurance */}
                        <div>
                          <div className="flex justify-between font-mono text-[10px] mb-1">
                            <span className="text-zinc-400">ENDURANCE (CHEST PLATE)</span>
                            <span className="text-emerald-400 font-bold">{activeShowcaseMutant.endurance} / 15</span>
                          </div>
                          <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden flex">
                            <div className="bg-emerald-500 h-full" style={{ width: `${(activeShowcaseMutant.endurance / 15) * 100}%` }}></div>
                          </div>
                        </div>

                        {/* Power */}
                        <div>
                          <div className="flex justify-between font-mono text-[10px] mb-1">
                            <span className="text-zinc-400">POWER (ARM PISTONS)</span>
                            <span className="text-orange-500 font-bold">{activeShowcaseMutant.power} / 15</span>
                          </div>
                          <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden flex">
                            <div className="bg-orange-500 h-full" style={{ width: `${(activeShowcaseMutant.power / 15) * 100}%` }}></div>
                          </div>
                        </div>

                        {/* Speed */}
                        <div>
                          <div className="flex justify-between font-mono text-[10px] mb-1">
                            <span className="text-zinc-400">SPEED (LEG THRUSTERS)</span>
                            <span className="text-yellow-400 font-bold">{activeShowcaseMutant.speed} / 15</span>
                          </div>
                          <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden flex">
                            <div className="bg-yellow-500 h-full" style={{ width: `${(activeShowcaseMutant.speed / 15) * 100}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT PANEL: SOCKET BAY FOR SLOTS & EQUIPMENT */}
                  <div className="lg:col-span-4 bg-zinc-900/60 rounded-lg border border-zinc-800 p-5 flex flex-col gap-4 overflow-y-auto max-h-[780px]">
                    <div className="border-b border-zinc-800 pb-2">
                      <h2 className="text-xs font-black font-mono text-zinc-400 uppercase tracking-wider">
                        🔧 Biological Socket Bay
                      </h2>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                        Equip, unequip, or hot-swap body grafts
                      </p>
                    </div>

                    {/* SOCKET ITERATOR */}
                    {(Object.values(PartType) as PartType[]).map((slotType) => {
                      const equippedPart = activeShowcaseMutant.parts[slotType];
                      const rarity = equippedPart?.rarity || PartRarity.Common;

                      const slotLabel = 
                        slotType === PartType.Head ? "HEAD SOCKET (Accuracy)" :
                        slotType === PartType.Chest ? "CHEST SOCKET (Endurance)" :
                        slotType === PartType.Arm ? "ARM SOCKET (Power)" : "LEG SOCKET (Speed)";

                      return (
                        <div key={slotType} className="bg-zinc-950 p-3.5 rounded border border-zinc-850 flex flex-col gap-3">
                          <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
                            <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-wider">
                              {slotLabel}
                            </span>
                            {equippedPart ? (
                              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-sm font-extrabold uppercase ${
                                rarity === PartRarity.Epic ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                                rarity === PartRarity.Rare ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" : "bg-zinc-850 text-zinc-400"
                              }`}>
                                {rarity}
                              </span>
                            ) : (
                              <span className="text-[8px] font-mono bg-red-950/40 text-red-400 border border-red-800/25 px-1.5 py-0.5 rounded-sm font-bold uppercase">
                                Empty
                              </span>
                            )}
                          </div>

                          {equippedPart ? (
                            <div className="flex flex-col gap-2">
                              <div>
                                <h3 className="text-xs font-black text-white uppercase flex items-center gap-1.5">
                                  {equippedPart.isNamed && <span className="text-amber-400">⭐</span>}
                                  {equippedPart.name}
                                  <span className="text-[9px] text-zinc-500 font-mono font-normal">({equippedPart.variant})</span>
                                </h3>
                                <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                                  {equippedPart.description}
                                </p>

                                {equippedPart.isNamed && equippedPart.backstory && (
                                  <p className="text-[9px] text-zinc-400 italic bg-amber-500/5 p-2 rounded border border-amber-500/10 leading-relaxed font-sans mt-1.5">
                                    📜 "{equippedPart.backstory}"
                                  </p>
                                )}
                              </div>

                              {/* Stats contributions */}
                              <div className="grid grid-cols-4 gap-1 text-center font-mono text-[9px] bg-zinc-900/40 p-1.5 rounded border border-zinc-850">
                                <div><span className="text-zinc-500 block text-[8px]">ACC</span><span className="text-sky-400 font-bold">+{equippedPart.accuracy}</span></div>
                                <div><span className="text-zinc-500 block text-[8px]">END</span><span className="text-emerald-400 font-bold">+{equippedPart.endurance}</span></div>
                                <div><span className="text-zinc-500 block text-[8px]">POW</span><span className="text-orange-500 font-bold">+{equippedPart.power}</span></div>
                                <div><span className="text-zinc-500 block text-[8px]">SPD</span><span className="text-yellow-400 font-bold">+{equippedPart.speed}</span></div>
                              </div>

                              <div className="flex gap-2 mt-1">
                                <button
                                  onClick={() => handleShowcaseUnequipPart(activeShowcaseMutant.id, slotType)}
                                  className="flex-1 py-1 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-[9px] font-mono font-bold text-red-400 rounded-sm cursor-pointer transition uppercase"
                                >
                                  ⚠️ Unequip Part
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-2 border border-dashed border-zinc-800 rounded bg-zinc-900/10">
                              <span className="text-[9px] font-mono text-zinc-600 block mb-2 uppercase font-black"> Gladiator Missing {slotType}!</span>
                            </div>
                          )}

                          {/* Swap/Equip selector list */}
                          <div className="flex flex-col gap-1 border-t border-zinc-900 pt-2 mt-1">
                            <span className="text-[8px] font-mono text-zinc-500 font-bold uppercase tracking-wider">
                              {equippedPart ? "🔄 Swap with Spare Part:" : "➕ Install Spare Part:"}
                            </span>
                            {gameState.partsInventory.filter(p => p.type === slotType).length > 0 ? (
                              <select
                                className="bg-zinc-950 border border-zinc-800 text-[10px] rounded p-1 text-zinc-300 focus:outline-none focus:border-orange-500 font-mono w-full"
                                value=""
                                onChange={(e) => handleShowcaseEquipPart(activeShowcaseMutant.id, e.target.value, slotType)}
                              >
                                <option value="" disabled>-- Graft Body Part --</option>
                                {gameState.partsInventory.filter(p => p.type === slotType).map(p => (
                                  <option key={p.id} value={p.id}>
                                    [{p.rarity?.toUpperCase() || "COMMON"}] {p.name} (+{p.type === PartType.Head ? p.accuracy : p.type === PartType.Chest ? p.endurance : p.type === PartType.Arm ? p.power : p.speed} Prim)
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-[8px] text-zinc-600 font-mono uppercase">No spare {slotType.toLowerCase()}s in inventory. Go scrap some in Battle!</span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* EQUIPMENT UTILITY SOCKET */}
                    <div className="bg-zinc-950 p-3.5 rounded border border-zinc-850 flex flex-col gap-3">
                      <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
                        <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-wider">
                          🛡️ EQUIPMENT CORE SOCKET (Max 1)
                        </span>
                        {activeShowcaseMutant.equipment ? (
                          <span className="text-[8px] font-mono bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-sm font-bold uppercase">
                            Equipped
                          </span>
                        ) : (
                          <span className="text-[8px] font-mono bg-zinc-850 text-zinc-400 px-1.5 py-0.5 rounded-sm font-bold uppercase">
                            Empty
                          </span>
                        )}
                      </div>

                      {activeShowcaseMutant.equipment ? (
                        <div className="flex flex-col gap-2">
                          <div>
                            <h3 className="text-xs font-black text-white uppercase">
                              🛡️ {activeShowcaseMutant.equipment.name}
                            </h3>
                            <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                              {activeShowcaseMutant.equipment.description}
                            </p>
                          </div>

                          <div className="grid grid-cols-4 gap-1 text-center font-mono text-[9px] bg-zinc-900/40 p-1.5 rounded border border-zinc-850">
                            <div><span className="text-zinc-500 block text-[8px]">ACC</span><span className="text-sky-400 font-bold">+{activeShowcaseMutant.equipment.statModifier.accuracy || 0}</span></div>
                            <div><span className="text-zinc-500 block text-[8px]">END</span><span className="text-emerald-400 font-bold">+{activeShowcaseMutant.equipment.statModifier.endurance || 0}</span></div>
                            <div><span className="text-zinc-500 block text-[8px]">POW</span><span className="text-orange-500 font-bold">+{activeShowcaseMutant.equipment.statModifier.power || 0}</span></div>
                            <div><span className="text-zinc-500 block text-[8px]">SPD</span><span className="text-yellow-400 font-bold">+{activeShowcaseMutant.equipment.statModifier.speed || 0}</span></div>
                          </div>

                          <button
                            onClick={() => handleShowcaseUnequipGear(activeShowcaseMutant.id)}
                            className="w-full py-1 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-[9px] font-mono font-bold text-red-400 rounded-sm cursor-pointer transition uppercase"
                          >
                            ⚠️ Unequip Gear Core
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-2 border border-dashed border-zinc-800 rounded bg-zinc-900/10">
                          <span className="text-[9px] font-mono text-zinc-600 block uppercase font-black">No Defensive Gear Installed</span>
                        </div>
                      )}

                      {/* Buy / Equip lists */}
                      <div className="flex flex-col gap-1 border-t border-zinc-900 pt-2 mt-1">
                        <span className="text-[8px] font-mono text-zinc-500 font-bold uppercase tracking-wider">
                          ➕ Graft Utility Gear Socket:
                        </span>
                        <select
                          className="bg-zinc-950 border border-zinc-800 text-[10px] rounded p-1 text-zinc-300 focus:outline-none focus:border-orange-500 font-mono w-full"
                          value=""
                          onChange={(e) => {
                            const selectedGear = EQUIPMENT_LIST.find(eq => eq.id === e.target.value);
                            if (selectedGear) {
                              handleShowcaseEquipGear(activeShowcaseMutant.id, selectedGear);
                            }
                          }}
                        >
                          <option value="" disabled>-- Buy &amp; Socket Gear --</option>
                          {EQUIPMENT_LIST.map(eq => (
                            <option key={eq.id} value={eq.id}>
                              {eq.name} (⚙️ {eq.price} Iron)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* --- GRIDIRON ARENA MATCH TAB --- */}
        {activeTab === "arena" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* MATCH SETUP OR PREMATCH PANEL */}
            {!gameState.activeMatch ? (
              <div className="lg:col-span-3 bg-zinc-900/60 rounded-lg border border-zinc-800 p-8 flex flex-col items-center justify-center text-center gap-6 max-w-3xl mx-auto relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)", backgroundSize: "30px 30px" }}></div>
                
                <div className="bg-orange-600/10 p-4 rounded-sm border border-orange-500/30 shadow-lg animate-pulse">
                  <Skull className="w-12 h-12 text-orange-500" />
                </div>

                <div>
                  <h2 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-orange-400 via-white to-orange-500 bg-clip-text text-transparent uppercase">
                    GRIDIRON BATTLEGROUND
                  </h2>
                  <p className="text-sm text-zinc-400 max-w-lg mt-2 mx-auto leading-relaxed">
                    The court is magnetically charged. The iron ball weighs 60lbs. Rules are loose, and limbs can be severed. Assemble your tactical line-up and release the spectacle.
                  </p>
                </div>

                {/* Team Pre-inspection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full border-y border-zinc-800/80 py-6 my-2 relative z-10">
                  {/* Your Stable line-up */}
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-mono text-orange-500 uppercase tracking-widest font-bold">Your Active Competitors:</span>
                    {activeMutants.length < 2 ? (
                      <div className="p-4 bg-zinc-950 rounded border border-dashed border-red-900/50 text-xs text-red-400 font-mono font-bold leading-relaxed">
                        ⚠️ INSUFFICIENT ACTIVE FIGHTERS!<br />You have {activeMutants.length}/2 healthy mutants available. Send injured to bed or assemble parts.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {activeMutants.slice(0, 2).map((m) => (
                          <div key={m.id} className="bg-zinc-950 p-3 rounded-md border border-zinc-850 flex items-center justify-between text-left">
                            <div>
                              <h4 className="text-sm font-bold text-zinc-100 uppercase">{m.name}</h4>
                              <span className="text-[10px] font-mono text-orange-500 font-bold uppercase">{m.role}</span>
                            </div>
                            <div className="text-right text-[10px] font-mono text-zinc-400">
                              <div>Acc: {m.accuracy} | End: {m.endurance}</div>
                              <div>Pow: {m.power} | Spd: {m.speed}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Enemy stable */}
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest font-bold">Next Opponent Stable:</span>
                    <div className="bg-zinc-950 p-4 rounded-md border border-zinc-850 text-left">
                      <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-tight">💥 {gameState.opponentTeam.name}</h4>
                      <p className="text-[11px] text-zinc-500 mt-1 font-bold">AI Rating Tier: Medium Danger</p>
                      <div className="mt-3 flex flex-col gap-2">
                        {gameState.opponentTeam.mutants.map((m, idx) => (
                          <div key={idx} className="bg-zinc-900/60 p-2 rounded-sm text-[11px] flex justify-between border border-zinc-850">
                            <span className="font-bold text-zinc-300">🤖 {m.name}</span>
                            <span className="font-mono text-zinc-500 font-bold">({m.role})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleStartMatchPrep}
                  disabled={activeMutants.length < 2}
                  className="px-8 py-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-black font-mono font-black uppercase tracking-widest text-sm rounded-sm shadow-xl border border-orange-700 transition transform hover:scale-[1.02] skew-x-[-8deg] cursor-pointer"
                >
                  <span className="inline-block skew-x-[8deg]">⚡ ENTER MAGNETIC GRIDIRON COURT</span>
                </button>
              </div>
            ) : (
              /* REAL-TIME SIMULATING MATCH SCREEN */
              <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* SVG PLAYING COURT PANEL */}
                <div className="lg:col-span-2 bg-zinc-900/60 rounded-lg border border-zinc-800 p-5 flex flex-col gap-4 relative">
                  
                  {/* Top Stats HUD */}
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3 font-mono">
                    <div className="flex items-center gap-3">
                      <div className="text-center bg-zinc-950 px-3 py-1.5 rounded border border-zinc-800">
                        <p className="text-[9px] text-zinc-500 font-bold">YOUR TEAM</p>
                        <p className="text-lg font-black text-sky-400">{gameState.activeMatch.scorePlayer}</p>
                      </div>
                      <span className="text-zinc-600 text-xs font-bold">VS</span>
                      <div className="text-center bg-zinc-950 px-3 py-1.5 rounded border border-zinc-800">
                        <p className="text-[9px] text-zinc-500 font-bold">AI OPPONENT</p>
                        <p className="text-lg font-black text-red-400">{gameState.activeMatch.scoreOpponent}</p>
                      </div>
                    </div>

                    <div className="text-center">
                      <span className="text-[10px] text-orange-500 block tracking-wider uppercase font-bold">MATCH TIMER</span>
                      <span className="text-xl font-black font-mono text-zinc-200">
                        {formatTime(gameState.activeMatch.timeRemaining)}
                      </span>
                    </div>

                    {/* Sim Controllers */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMatchRunning(!matchRunning)}
                        className={`px-3 py-1 rounded-sm transition font-mono text-xs font-bold uppercase tracking-wider ${
                          matchRunning ? "bg-red-950 text-red-400 border border-red-900" : "bg-emerald-950 text-emerald-400 border border-emerald-900"
                        }`}
                      >
                        {matchRunning ? <span className="flex items-center gap-1">⏸️ PAUSE</span> : <span className="flex items-center gap-1">▶️ RESUME</span>}
                      </button>

                      <button
                        onClick={() => setSimulationSpeed(speed => speed === 1 ? 2 : 1)}
                        className="bg-zinc-950 border border-zinc-800 px-2 py-1 rounded-sm text-xs font-mono text-zinc-300 font-bold"
                      >
                        ⚡ Speed: {simulationSpeed}x
                      </button>
                    </div>
                  </div>

                  {/* Status text banner */}
                  <div className="bg-zinc-950 px-4 py-2 rounded-sm text-center text-xs font-mono border border-zinc-855 text-orange-500 font-bold tracking-wider">
                    📢 {gameState.activeMatch.statusText.toUpperCase()}
                  </div>

                  {/* MAGNETIC COURT SVG STAGE */}
                  <div className={`relative w-full h-[380px] bg-zinc-950 rounded border border-zinc-800 shadow-inner ${
                    scorchScreen ? "animate-bounce ring-4 ring-orange-600/60" : ""
                  }`}>
                    
                    {/* SVG canvas */}
                    <svg className="w-full h-full select-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {/* Grid Lines (Iron Plates) */}
                      <g stroke="#1a1a1a" strokeWidth="0.3">
                        <line x1="10" y1="0" x2="10" y2="100" />
                        <line x1="20" y1="0" x2="20" y2="100" />
                        <line x1="30" y1="0" x2="30" y2="100" />
                        <line x1="40" y1="0" x2="40" y2="100" />
                        <line x1="50" y1="0" x2="50" y2="100" stroke="#333333" strokeWidth="0.6" />
                        <line x1="60" y1="0" x2="60" y2="100" />
                        <line x1="70" y1="0" x2="70" y2="100" />
                        <line x1="80" y1="0" x2="80" y2="100" />
                        <line x1="90" y1="0" x2="90" y2="100" />

                        <line x1="0" y1="16.6" x2="100" y2="16.6" />
                        <line x1="0" y1="33.3" x2="100" y2="33.3" />
                        <line x1="0" y1="50" x2="100" y2="50" stroke="#333333" strokeWidth="0.6" />
                        <line x1="0" y1="66.6" x2="100" y2="66.6" />
                        <line x1="0" y1="83.3" x2="100" y2="83.3" />
                      </g>

                      {/* Goal lines (End Zones) */}
                      {/* Left Player endzone line */}
                      <rect x="0" y="0" width="5" height="100" fill="#0ea5e9" fillOpacity="0.06" stroke="#0ea5e9" strokeWidth="0.4" strokeDasharray="1,1" />
                      {/* Right Opponent endzone line */}
                      <rect x="95" y="0" width="5" height="100" fill="#dc2626" fillOpacity="0.06" stroke="#fb7185" strokeWidth="0.4" strokeDasharray="1,1" />

                      {/* Magnetic flux glowing currents */}
                      <path d="M 50,0 Q 45,50 50,100" fill="none" stroke="#f97316" strokeWidth="0.3" strokeDasharray="2,5" opacity="0.3" />
                      <path d="M 50,0 Q 55,50 50,100" fill="none" stroke="#f97316" strokeWidth="0.3" strokeDasharray="2,5" opacity="0.3" />

                      {/* Scorch Marks */}
                      {gameState.activeMatch.scorchMarks.map((sm, idx) => (
                        <circle key={idx} cx={sm.x} cy={sm.y} r="1.5" fill="#f97316" opacity={sm.opacity} />
                      ))}

                      {/* The Iron Ball */}
                      <circle
                        cx={gameState.activeMatch.ballX}
                        cy={gameState.activeMatch.ballY}
                        r="2.2"
                        fill="url(#ironBallGrad)"
                        stroke="#e4e4e7"
                        strokeWidth="0.5"
                      />

                      {/* Render SimAgents */}
                      {gameState.activeMatch.agents.map((agent) => {
                        const isKO = agent.state === "knocked-out";
                        const hasBall = gameState.activeMatch?.ballCarrierId === agent.id;
                        
                        return (
                          <g key={agent.id} className="transition-all duration-100">
                            {/* Direction Indicator */}
                            {!isKO && (
                              <line
                                x1={agent.x}
                                y1={agent.y}
                                x2={agent.x + agent.vx * 8}
                                y2={agent.y + agent.vy * 8}
                                stroke={agent.team === "player" ? "#38bdf8" : "#fb7185"}
                                strokeWidth="0.5"
                              />
                            )}

                            {/* Ball carrier golden halo indicator */}
                            {hasBall && (
                              <circle
                                cx={agent.x}
                                cy={agent.y}
                                r="5.5"
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="0.8"
                                className="animate-ping"
                              />
                            )}

                            {/* Miniature Gladiator Character */}
                            {(() => {
                              // If it's a player mutant, retrieve its actual parts
                              let partsToRender = {
                                Head: { variant: PartVariant.Mechanical, rarity: PartRarity.Common },
                                Chest: { variant: PartVariant.Mechanical, rarity: PartRarity.Common },
                                Arm: { variant: PartVariant.Mechanical, rarity: PartRarity.Common },
                                Leg: { variant: PartVariant.Mechanical, rarity: PartRarity.Common }
                              };
                              let hasActualParts = false;
                              let equippedGear = null;

                              if (agent.isPlayerMutant && agent.mutantId) {
                                const playerMut = gameState.mutants.find(m => m.id === agent.mutantId);
                                if (playerMut) {
                                  partsToRender = {
                                    Head: playerMut.parts.Head ? { variant: playerMut.parts.Head.variant, rarity: playerMut.parts.Head.rarity || PartRarity.Common } : null,
                                    Chest: playerMut.parts.Chest ? { variant: playerMut.parts.Chest.variant, rarity: playerMut.parts.Chest.rarity || PartRarity.Common } : null,
                                    Arm: playerMut.parts.Arm ? { variant: playerMut.parts.Arm.variant, rarity: playerMut.parts.Arm.rarity || PartRarity.Common } : null,
                                    Leg: playerMut.parts.Leg ? { variant: playerMut.parts.Leg.variant, rarity: playerMut.parts.Leg.rarity || PartRarity.Common } : null
                                  } as any;
                                  hasActualParts = true;
                                  equippedGear = playerMut.equipment;
                                }
                              }

                              if (!hasActualParts) {
                                // Opponent mutants look: distinct configurations based on their role
                                const roleSeed = agent.role === MutantRole.Blocker || agent.role === MutantRole.Interceptor;
                                partsToRender = {
                                  Head: { variant: PartVariant.Mechanical, rarity: PartRarity.Common },
                                  Chest: { variant: roleSeed ? PartVariant.Mechanical : PartVariant.Biological, rarity: PartRarity.Common },
                                  Arm: { variant: PartVariant.Mechanical, rarity: PartRarity.Common },
                                  Leg: { variant: roleSeed ? PartVariant.Biological : PartVariant.Mechanical, rarity: PartRarity.Common }
                                } as any;
                              }

                              return (
                                <g 
                                  transform={`translate(${agent.x}, ${agent.y}) scale(0.18) ${isKO ? "rotate(75)" : ""}`}
                                  opacity={isKO ? 0.45 : 1}
                                >
                                  {(() => {
                                    const headBio = partsToRender.Head?.variant === PartVariant.Biological;
                                    const chestBio = partsToRender.Chest?.variant === PartVariant.Biological;
                                    const armBio = partsToRender.Arm?.variant === PartVariant.Biological;
                                    const legBio = partsToRender.Leg?.variant === PartVariant.Biological;

                                    const isEpicHead = partsToRender.Head?.rarity === PartRarity.Epic;
                                    const isEpicChest = partsToRender.Chest?.rarity === PartRarity.Epic;
                                    const isEpicArm = partsToRender.Arm?.rarity === PartRarity.Epic;
                                    const isEpicLeg = partsToRender.Leg?.rarity === PartRarity.Epic;

                                    // Colors based on team: Player vs Opponent
                                    const teamAccent = agent.team === "player" ? "#38bdf8" : "#fb7185";

                                    const bioColor = "#ef4444";
                                    const mechColor = "#38bdf8";

                                    return (
                                      <>
                                        {/* Team base platform glow ring */}
                                        <ellipse cx="0" cy="38" rx="12" ry="3.5" fill="none" stroke={teamAccent} strokeWidth="1" strokeDasharray="1.5,1.5" />

                                        {/* LEGS */}
                                        {partsToRender.Leg ? (
                                          legBio ? (
                                            <g>
                                              <path d="M -8,12 Q -20,24 -11,36" fill="none" stroke={isEpicLeg ? "#f43f5e" : bioColor} strokeWidth="3.5" strokeLinecap="round" />
                                              <path d="M 8,12 Q 20,24 11,36" fill="none" stroke={isEpicLeg ? "#f43f5e" : bioColor} strokeWidth="3.5" strokeLinecap="round" />
                                            </g>
                                          ) : (
                                            <g>
                                              <circle cx="-8" cy="28" r="4.5" fill="#18181b" stroke={isEpicLeg ? "#38bdf8" : mechColor} strokeWidth="1.2" />
                                              <circle cx="8" cy="28" r="4.5" fill="#18181b" stroke={isEpicLeg ? "#38bdf8" : mechColor} strokeWidth="1.2" />
                                              <line x1="-9" y1="28" x2="9" y2="28" stroke="#71717a" strokeWidth="1.5" />
                                            </g>
                                          )
                                        ) : (
                                          <g opacity="0.3">
                                            <line x1="-5" y1="12" x2="-5" y2="30" stroke="#71717a" strokeWidth="1.5" strokeDasharray="1.5,1.5" />
                                            <line x1="5" y1="12" x2="5" y2="30" stroke="#71717a" strokeWidth="1.5" strokeDasharray="1.5,1.5" />
                                          </g>
                                        )}

                                        {/* CHEST */}
                                        {partsToRender.Chest ? (
                                          chestBio ? (
                                            <g>
                                              <path d="M -13,-10 Q -18,6 0,14 Q 18,6 13,-10 Z" fill={isEpicChest ? "#b91c1c" : "#991b1b"} stroke={teamAccent} strokeWidth="1.8" />
                                              <circle cx="0" cy="0" r="3.5" fill="#f43f5e" />
                                            </g>
                                          ) : (
                                            <g>
                                              <rect x="-11" y="-11" width="22" height="22" rx="2" fill={isEpicChest ? "#0f172a" : "#1e293b"} stroke={teamAccent} strokeWidth="1.8" />
                                              <circle cx="0" cy="0" r="2.2" fill={teamAccent} />
                                            </g>
                                          )
                                        ) : (
                                          <rect x="-10" y="-10" width="20" height="20" rx="1.5" fill="none" stroke="#52525b" strokeWidth="1.2" strokeDasharray="2,2" opacity="0.4" />
                                        )}

                                        {/* ARMS */}
                                        {partsToRender.Arm ? (
                                          armBio ? (
                                            <g>
                                              <path d="M -13,-2 Q -22,-6 -20,-14" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                                              <path d="M 13,-2 Q 22,-4 19,10" fill="none" stroke={isEpicArm ? "#f43f5e" : bioColor} strokeWidth="3" strokeLinecap="round" />
                                            </g>
                                          ) : (
                                            <g>
                                              <path d="M -11,-3 L -21,-3 L -18,5 L -11,2" fill="#334155" stroke={isEpicArm ? "#38bdf8" : mechColor} strokeWidth="1.2" />
                                              <path d="M 11,-3 L 21,-3 L 18,5 L 11,2" fill="#334155" stroke={isEpicArm ? "#38bdf8" : mechColor} strokeWidth="1.2" />
                                            </g>
                                          )
                                        ) : (
                                          <g opacity="0.3">
                                            <line x1="-11" y1="0" x2="-19" y2="0" stroke="#71717a" strokeWidth="1.2" strokeDasharray="1.5,1.5" />
                                            <line x1="11" y1="0" x2="19" y2="0" stroke="#71717a" strokeWidth="1.2" strokeDasharray="1.5,1.5" />
                                          </g>
                                        )}

                                        {/* HEAD */}
                                        {partsToRender.Head ? (
                                          headBio ? (
                                            <g transform="translate(0, -18)">
                                              <circle cx="0" cy="0" r="7.5" fill={isEpicHead ? "#f43f5e" : bioColor} stroke="#fda4af" strokeWidth="1" />
                                              <circle cx="-2" cy="0.5" r="1" fill="#a855f7" />
                                              <circle cx="2" cy="0.5" r="1" fill="#a855f7" />
                                            </g>
                                          ) : (
                                            <g transform="translate(0, -18)">
                                              <rect x="-6" y="-6" width="12" height="12" rx="1" fill={isEpicHead ? "#0f172a" : "#334155"} stroke={teamAccent} strokeWidth="1.2" />
                                              <line x1="-3" y1="0" x2="3" y2="0" stroke={teamAccent} strokeWidth="1" />
                                            </g>
                                          )
                                        ) : (
                                          <circle cx="0" cy="-18" r="6" fill="none" stroke="#52525b" strokeWidth="1.2" strokeDasharray="1.5,1.5" opacity="0.4" />
                                        )}

                                        {/* WEARABLE GRAPHICS COAT */}
                                        {equippedGear && (
                                          <circle cx="0" cy="-4" r="21" fill="none" stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="1.5,3" />
                                        )}
                                      </>
                                    );
                                  })()}
                                </g>
                              );
                            })()}

                            {/* Text badge */}
                            <text
                              x={agent.x}
                              y={agent.y - 5.5}
                              textAnchor="middle"
                              fill="#f4f4f5"
                              fontSize="2.5"
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              {agent.name.split(" ")[0]} ({agent.role[0]})
                            </text>

                            {/* KO indicator */}
                            {isKO && (
                              <text
                                x={agent.x}
                                y={agent.y + 0.8}
                                textAnchor="middle"
                                fill="#f43f5e"
                                fontSize="2.8"
                                fontWeight="bold"
                                fontFamily="monospace"
                              >
                                KO
                              </text>
                            )}
                          </g>
                        );
                      })}

                      {/* Gradients */}
                      <defs>
                        <radialGradient id="ironBallGrad" cx="30%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="#e4e4e7" />
                          <stop offset="50%" stopColor="#71717a" />
                          <stop offset="100%" stopColor="#09090b" />
                        </radialGradient>
                      </defs>
                    </svg>

                    {/* Legend keys on court */}
                    <div className="absolute bottom-2 left-2 bg-zinc-900/80 px-2 py-1 rounded-sm text-[9px] font-mono border border-zinc-800 flex gap-4 text-zinc-400">
                      <div><span className="text-sky-400 font-bold">●</span> Your Team</div>
                      <div><span className="text-red-500 font-bold">●</span> Enemy Team</div>
                      <div><span className="text-orange-500 font-bold">●</span> Ball Carrier</div>
                      <div><span className="text-zinc-500 font-bold">●</span> KO'D</div>
                    </div>
                  </div>
                </div>

                {/* LOGS, COM-FEED AND IN-MATCH PULL INTERVENTIONS */}
                <div className="flex flex-col gap-5">
                  
                  {/* REAL-TIME CONTROLS & ACTIVE PULL BUTTONS */}
                  <div className="bg-zinc-900/60 rounded-lg border border-zinc-800 p-5 flex flex-col gap-4">
                    <h3 className="text-xs font-black font-mono text-orange-500 border-b border-zinc-800 pb-2 uppercase tracking-wider">
                      ⚠️ Sideline Tactical Pull
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Pull an active mutant off the court before they suffer a permanent knockout! Swaps them immediately with a healthy Reserve Bench mutant.
                    </p>

                    {/* Active Fighters List */}
                    <div className="flex flex-col gap-3 mt-1">
                      {gameState.activeMatch.agents
                        .filter((a) => a.isPlayerMutant)
                        .map((agent) => {
                          const isKO = agent.state === "knocked-out";
                          const healthPercent = Math.floor((agent.currentEndurance / agent.maxEndurance) * 100);

                          return (
                            <div
                              key={agent.id}
                              className="bg-zinc-950 p-3 rounded-md border border-zinc-850 flex flex-col gap-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-200 uppercase">{agent.name}</span>
                                <span className="text-[10px] font-mono text-orange-500 uppercase font-bold tracking-wider">
                                  {agent.role}
                                </span>
                              </div>

                              {/* Health stats */}
                              <div className="flex flex-col gap-1 text-[11px]">
                                <div className="flex justify-between font-mono text-[9px] text-zinc-500">
                                  <span>Endurance HP: {agent.currentEndurance}/{agent.maxEndurance}</span>
                                  <span>{healthPercent}%</span>
                                </div>
                                <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      healthPercent > 50 ? "bg-emerald-500" : healthPercent > 20 ? "bg-orange-500" : "bg-red-500"
                                    }`}
                                    style={{ width: `${healthPercent}%` }}
                                  />
                                </div>
                              </div>

                              {/* Pull/Intervention action button */}
                              <button
                                onClick={() => handlePullFighter(agent.id)}
                                disabled={isKO}
                                className="w-full mt-1 py-1.5 bg-zinc-900 hover:bg-red-950/40 disabled:opacity-50 text-red-400 text-xs font-mono font-bold rounded-sm transition flex items-center justify-center gap-1 border border-zinc-800"
                              >
                                {isKO ? "FIGHTER UNCONSCIOUS" : "🚨 EMERGENCY PULL (SUB)"}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* ACTIVE LIVE COMBAT FEED LOG */}
                  <div className="bg-zinc-900/60 rounded-lg border border-zinc-800 p-5 flex-1 flex flex-col gap-3 min-h-[220px]">
                    <h3 className="text-xs font-black font-mono text-zinc-300 uppercase tracking-widest border-b border-zinc-800 pb-2">
                      🛰️ Combat Feed Broadcast
                    </h3>

                    <div className="flex-1 overflow-y-auto max-h-[300px] text-[11px] font-mono text-zinc-400 flex flex-col gap-2 bg-zinc-950 p-3 rounded border border-zinc-850 h-full">
                      {matchLogs.length === 0 ? (
                        <div className="text-zinc-600 italic text-center py-8">Waiting for play kickoff...</div>
                      ) : (
                        matchLogs.map((log, idx) => (
                          <div
                            key={idx}
                            className={`border-l-2 pl-2 ${
                              log.includes("SCORE")
                                ? "border-emerald-500 text-emerald-400 bg-emerald-950/20 py-0.5"
                                : log.includes("BRUTAL")
                                ? "border-orange-500 text-orange-400 bg-orange-950/20 py-0.5 font-bold"
                                : log.includes("CRITICAL")
                                ? "border-yellow-500 text-yellow-400 bg-yellow-950/20 py-0.5"
                                : "border-zinc-800"
                            }`}
                          >
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* --- POST-MATCH RESULTS MODAL SCREEN --- */}
      {gameState.matchHistory && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 max-w-xl w-full rounded-md overflow-hidden shadow-2xl flex flex-col gap-5 p-6 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="text-center">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">GridIron Division Report</span>
              <h2 className={`text-3xl font-black font-mono mt-1 ${
                gameState.matchHistory.result === "won" ? "text-emerald-400" : "text-red-500"
              }`}>
                {gameState.matchHistory.result === "won" ? "🏆 MATCH VICTORY" : "💀 DEFEAT ON COURT"}
              </h2>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Final Score: <span className="text-zinc-200 font-bold">{gameState.matchHistory.scorePlayer} - {gameState.matchHistory.scoreOpponent}</span>
              </p>
            </div>

            {/* Rewards */}
            <div className="bg-zinc-950 p-4 rounded-md border border-zinc-850 flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-500 font-bold uppercase tracking-wider">SCRAP METAL RECOVERED:</span>
              <span className="text-orange-500 font-black text-base">⚙️ +{gameState.matchHistory.ironEarned} Iron</span>
            </div>

            {/* Injuries and Casualty report */}
            <div className="flex flex-col gap-2">
              <h3 className="font-mono text-xs text-zinc-400 font-bold uppercase tracking-wider">
                🏥 Field Casualty Assessment:
              </h3>

              {gameState.matchHistory.mutantInjuries.length === 0 && gameState.matchHistory.mutantDeaths.length === 0 ? (
                <p className="text-xs text-emerald-400 font-mono italic">
                  ✓ No severe casualties recorded. All active gladiators returned standing.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {gameState.matchHistory.mutantInjuries.map((name) => (
                    <div key={name} className="bg-orange-600/5 border border-orange-500/20 text-xs text-orange-400 p-2.5 rounded font-mono flex justify-between">
                      <span className="font-bold">🏥 {name} injured</span>
                      <span className="font-bold uppercase text-[9px] mt-0.5">Transferred to Infirmary</span>
                    </div>
                  ))}

                  {gameState.matchHistory.mutantDeaths.map((name) => (
                    <div key={name} className="bg-red-950/20 border border-red-950 text-xs text-red-400 p-2.5 rounded font-mono flex justify-between font-bold">
                      <span>💀 {name} DECEASED</span>
                      <span className="font-bold uppercase text-[9px] mt-0.5">Succumbed to Impact</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CLOSE ACTION BUTTON */}
            {!deadMutantHarvest ? (
              <button
                onClick={() => {
                  // Reset history log and close
                  saveGame({
                    ...gameState,
                    matchHistory: null
                  });
                }}
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-black rounded-sm font-mono text-xs uppercase tracking-widest font-black transition-colors border border-orange-700 cursor-pointer"
              >
                File Report &amp; Continue
              </button>
            ) : (
              <div className="bg-red-950/20 border border-red-900 p-4 rounded-md flex flex-col gap-3 mt-1">
                <span className="text-xs font-mono text-red-400 font-black block uppercase tracking-wider">
                  ⚙️ MANDATORY BIO-RECOVERY: HARVEST {deadMutantHarvest.mutant.name.toUpperCase()}
                </span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Select exactly **one** of their salvaged parts to return to your stock inventory. The other parts are lost to the arena furnace forever.
                </p>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  {[PartType.Head, PartType.Chest, PartType.Arm, PartType.Leg].map((type) => {
                    const part = deadMutantHarvest.mutant.parts[type];
                    return (
                      <button
                        key={type}
                        onClick={() => handleHarvestPart(part)}
                        className="p-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-mono rounded text-left transition flex flex-col gap-1 cursor-pointer"
                      >
                        <span className="text-[9px] text-red-400 uppercase font-bold">{type} Graft</span>
                        <span className="font-semibold truncate w-full">{part.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-zinc-950 text-center py-6 text-zinc-600 text-xs border-t border-zinc-900 mt-12 font-mono">
        <p>© 2026 GridIron Mutant Stable Management Syndicate. Permanent damage guaranteed.</p>
      </footer>
    </div>
  );
}
