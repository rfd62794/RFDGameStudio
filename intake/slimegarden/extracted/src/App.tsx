import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dna, Sparkles, ShieldAlert, Swords, Briefcase, Clock, Database, 
  ChevronRight, RefreshCw, Sliders, Plus, Trash2, Edit2, Terminal, 
  AlertTriangle, CheckCircle2, Moon, Info, Lock, Unlock, Coins, X,
  RotateCcw, Target, Beaker
} from 'lucide-react';

import { 
  Slime, SlimeColor, SlimePattern, CombatZone, CorporateContract, ActiveDispatch, LogEntry, LabState,
  PlanetNode, PlanetRegion, MediationMission, ExplorationMission
} from './types';

import { 
  generateSlimeName, COLOR_SPECS, PATTERN_DESCRIPTIONS, breedSlimes, 
  calculateStats, createSeedSlime, INITIAL_ZONES, generateContract, 
  getRandomMelancholicLog, resolveDispatch,
  resolveMediation, updatePlanetSupplyAndPressure, generatePlanetRegion,
  resolveExploration,
  syncCodexWithRoster, applyDispatchStabilityHook,
  checkWildsUnlockCondition, stageFromLevel, stageModifier, getColorRegentCost,
  calculateWorkerIncome, isSlimeInMatchingCultureEnvironment
} from './gameLogic';

import { SlimeVisual } from './components/SlimeVisual';
import { RosterTab } from './components/RosterTab';
import { MissionsTab } from './components/MissionsTab';
import { EconomyTab } from './components/EconomyTab';
import { LabTab } from './components/LabTab';
import { PlanetTab } from './components/PlanetTab';

const LOCAL_STORAGE_KEY = 'slime_garden_mvp_state';

export default function App() {
  // Game state
  const [state, setState] = useState<LabState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as LabState;
        if (!parsed.recentMarketSales) {
          parsed.recentMarketSales = [];
        }
        if (parsed.planetRegion === undefined) {
          parsed.planetRegion = null;
        } else if (parsed.planetRegion?.nodes?.length) {
          const firstShape = parsed.planetRegion.nodes[0]?.cellShape;
          if (typeof firstShape !== 'string') {
            parsed.planetRegion = null;
          }
        }
        if (parsed.wildsRegion === undefined) {
          parsed.wildsRegion = null;
        }
        if (parsed.wildsUnlocked === undefined) {
          parsed.wildsUnlocked = false;
        }
        if (parsed.activeMediation === undefined) {
          parsed.activeMediation = null;
        }
        if (parsed.activeExploration === undefined) {
          parsed.activeExploration = null;
        }
        return syncCodexWithRoster(parsed);
      }
    } catch (e) {
      console.error('Failed to load local storage state, initializing fresh state.', e);
    }

    // Default initial state
    const starter1 = createSeedSlime('Red', 'Solid');
    starter1.name = "Specimen-Cinder-Alpha";
    const starter2 = createSeedSlime('Blue', 'Solid');
    starter2.name = "Specimen-Abyssal-Beta";

    const initialContracts = [
      {
        id: 'contract_init_1',
        title: 'CONTRACT RQ-3109',
        requiredColor: 'Purple' as SlimeColor,
        requiredPattern: 'Solid' as SlimePattern,
        creditsReward: 120,
        cyclesRemaining: 6,
        totalCycles: 6,
        flavorText: 'Corporation chemical trial requested. Purple membrane needed to buffer thermal fuel waste tanks on Reactor C-4.'
      },
      {
        id: 'contract_init_2',
        title: 'CONTRACT RQ-8821',
        requiredColor: 'Red' as SlimeColor,
        requiredPattern: 'Stripe' as SlimePattern,
        creditsReward: 160,
        cyclesRemaining: 4,
        totalCycles: 4,
        flavorText: 'Physical shock loading test. Stripe pattern elastic membrane required for deceleration orbital sleds.'
      }
    ];

    const initialLogs: LogEntry[] = [
      {
        id: 'log_0',
        cycle: 1,
        timestamp: '07:00:00',
        text: 'SYSTEM BOOT: Welcome back, operator. Containment fields active. Refrigeration stable.',
        type: 'system'
      },
      {
        id: 'log_1',
        cycle: 1,
        timestamp: '07:00:15',
        text: 'LOG: Day 381. Left the capsule early. The stars are unusually bright today, but the office communications terminal has nothing but cold, synthetic orders.',
        type: 'melancholy'
      },
      {
        id: 'log_2',
        cycle: 1,
        timestamp: '07:01:00',
        text: 'BREEDING: Splicer diagnostic is nominal. Two basic specimens (Cinder-Alpha & Abyssal-Beta) prepared in the containment cell.',
        type: 'breeding'
      }
    ];

    const freshState: LabState = {
      cycle: 1,
      credits: 100,
      slimes: [starter1, starter2],
      contracts: initialContracts,
      zones: INITIAL_ZONES,
      activeDispatch: null,
      logs: initialLogs,
      rosterCap: 10,
      breedingSuccessRateModifier: 0,
      recentMarketSales: [],
      planetRegion: null,
      wildsRegion: null,
      wildsUnlocked: false,
      activeMediation: null,
      activeExploration: null,
      hasAutoFeeder: false
    };

    return syncCodexWithRoster(freshState);
  });

  // Top level active main tab
  const [activeTab, setActiveTab] = useState<'roster' | 'missions' | 'economy' | 'lab' | 'planet'>('roster');
  
  // Persisted sub-tab selections for each main tab
  const [rosterSubTab, setRosterSubTab] = useState<'collection' | 'breeding'>('collection');
  const [missionsSubTab, setMissionsSubTab] = useState<'active' | 'zones'>('zones'); // default to zones to draft first
  const [economySubTab, setEconomySubTab] = useState<'contracts' | 'market'>('contracts');
  const [labSubTab, setLabSubTab] = useState<'upgrades'>('upgrades');
  const [planetSubTab, setPlanetSubTab] = useState<'regions' | 'mediation' | 'exploration'>('regions');

  // Selection states
  const [selectedSlimeId, setSelectedSlimeId] = useState<string | null>(() => {
    return state.slimes.length > 0 ? state.slimes[0].id : null;
  });
  
  // Breeding selections
  const [parentAId, setParentAId] = useState<string | null>(null);
  const [parentBId, setParentBId] = useState<string | null>(null);
  const [isBreedingHatching, setIsBreedingHatching] = useState(false);
  const [newOffspring, setNewOffspring] = useState<Slime | null>(null);
  const [activeRegentPattern, setActiveRegentPattern] = useState<SlimePattern | null>(null);
  const [activeRegentColor, setActiveRegentColor] = useState<SlimeColor | null>(null);

  // Dispatch selection
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [dispatchDraftIds, setDispatchDraftIds] = useState<string[]>([]);
  const [realtimeRemainingMs, setRealtimeRemainingMs] = useState<number>(0);
  const [activeDispatchReport, setActiveDispatchReport] = useState<{ logs: string[]; success: boolean; xp: number; credits: number } | null>(null);

  // Mediation selection
  const [selectedMediationNodeId, setSelectedMediationNodeId] = useState<string | null>(null);
  const [mediationDraftIds, setMediationDraftIds] = useState<string[]>([]);
  const [activeMediationReport, setActiveMediationReport] = useState<{ logs: string[]; success: boolean; stabilityChange: number } | null>(null);

  // Exploration selection
  const [selectedExplorationNodeId, setSelectedExplorationNodeId] = useState<string | null>(null);
  const [explorationDraftIds, setExplorationDraftIds] = useState<string[]>([]);
  const [activeExplorationReport, setActiveExplorationReport] = useState<{ logs: string[]; success: boolean } | null>(null);

  // Rename modal state
  const [renameSlimeId, setRenameSlimeId] = useState<string | null>(null);
  const [newNameInput, setNewNameInput] = useState('');

  // Role lock confirmation state
  const [roleLockConfirm, setRoleLockConfirm] = useState<{
    type: 'dispatch' | 'mediation' | 'exploration';
    unlockedSlimes: Slime[];
    onConfirm: () => void;
  } | null>(null);

  // Log filter
  const [logFilter, setLogFilter] = useState<'all' | 'system' | 'breeding' | 'combat' | 'melancholy'>('all');

  // Terminal visibility state (defaults to false)
  const [terminalVisible, setTerminalVisible] = useState(false);

  // Keep Codex synced with the roster whenever slimes or state changes
  useEffect(() => {
    if (state.slimes && state.slimes.length > 0) {
      const synced = syncCodexWithRoster(state);
      if (
        !state.colorCodex || 
        !state.patternCodex || 
        Object.keys(synced.colorCodex || {}).length !== Object.keys(state.colorCodex || {}).length ||
        Object.keys(synced.patternCodex || {}).length !== Object.keys(state.patternCodex || {}).length ||
        state.slimes.some(s => !state.colorCodex?.[s.color]?.discovered || !state.patternCodex?.[s.pattern]?.discovered)
      ) {
        setState(synced);
      }
    }
  }, [state.slimes]);

  // Save game state to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Ensure planet region is generated once upon first visit
  const ensurePlanetRegionGenerated = () => {
    if (!state.planetRegion) {
      setState(prev => {
        if (prev.planetRegion) return prev;
        return {
          ...prev,
          planetRegion: generatePlanetRegion()
        };
      });
    }
  };

  useEffect(() => {
    if (activeTab === 'planet') {
      ensurePlanetRegionGenerated();
    }
  }, [activeTab]);

  // Set default selected slime if state changes
  useEffect(() => {
    if (state.slimes.length > 0 && (!selectedSlimeId || !state.slimes.some(s => s.id === selectedSlimeId))) {
      setSelectedSlimeId(state.slimes[0].id);
    }
  }, [state.slimes, selectedSlimeId]);

  // Real-time ticking effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.activeDispatch && state.activeDispatch.status === 'active') {
        const elapsed = Date.now() - state.activeDispatch.startedAt;
        const remaining = Math.max(0, state.activeDispatch.totalDurationMs - elapsed);
        setRealtimeRemainingMs(remaining);

        if (remaining <= 0) {
          // Dispatch is complete! Auto-update state to completed
          setState(prev => {
            if (!prev.activeDispatch) return prev;
            return {
              ...prev,
              activeDispatch: {
                ...prev.activeDispatch,
                status: 'completed'
              }
            };
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.activeDispatch]);

  // Advance manual Lab Cycle (Sleeping / Passing time)
  const handleAdvanceCycle = () => {
    setState(prev => {
      const nextCycle = prev.cycle + 1;
      
      // Update corporate contracts
      const updatedContracts = prev.contracts
        .map(c => ({ ...c, cyclesRemaining: c.cyclesRemaining - 1 }))
        .filter(c => c.cyclesRemaining > 0); // Remove expired ones

      // Maybe spawn a new corporate contract (cap of 4)
      const shouldSpawnContract = updatedContracts.length < 4 && (Math.random() < 0.65 || updatedContracts.length < 2);
      if (shouldSpawnContract) {
        updatedContracts.push(generateContract(nextCycle));
      }

      // Add a standard log about cycle progression
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const logs: LogEntry[] = [
        ...prev.logs,
        {
          id: `log_cycle_${Date.now()}`,
          cycle: nextCycle,
          timestamp: timeStr,
          text: `CYCLE ADVANCED: Lab cycle ${nextCycle} initiated. All energy cells replenished.`,
          type: 'system'
        }
      ];

      // Occasional random astronaut diary log (45% chance per cycle shift)
      if (Math.random() < 0.45) {
        logs.push(getRandomMelancholicLog(nextCycle));
      }

      // If there is an active dispatch, resolve it or tick down its cycle limit
      let nextDispatch = prev.activeDispatch;
      let newCredits = prev.credits;
      let newSlimes = [...prev.slimes];
      let newZones = [...prev.zones];
      let nextRegion = prev.planetRegion ? { ...prev.planetRegion, nodes: prev.planetRegion.nodes.map(n => ({ ...n, pressure: { ...n.pressure } })) } : null;
 
      if (nextDispatch && (nextDispatch.status === 'active' || nextDispatch.status === 'completed')) {
        const zone = prev.zones.find(z => z.id === nextDispatch!.zoneId)!;
        const partySlimes = prev.slimes.filter(s => nextDispatch!.slimeIds.includes(s.id));
        
        const result = resolveDispatch(zone, partySlimes);
        
        // Distribute XP and handle level up
        newSlimes = prev.slimes.map(s => {
          if (nextDispatch!.slimeIds.includes(s.id)) {
            let nextXp = s.xp + result.xpGained;
            let nextLevel = s.level;
            let currentStats = { ...s.stats };
 
            const xpNeeded = s.level * 100;
            if (nextXp >= xpNeeded) {
              nextXp -= xpNeeded;
              nextLevel += 1;
              currentStats = calculateStats(s.color, s.pattern, nextLevel);
            }
 
            return {
              ...s,
              xp: nextXp,
              level: nextLevel,
              stats: currentStats,
              role: 'idle' as const, // return to idle
            };
          }
          return s;
        });
 
        // Award Credits
        newCredits += result.creditsGained;
 
        // Unlock next zones if clear successful
        if (result.success) {
          newZones = prev.zones.map(z => {
            if (z.id === zone.id) {
              return { ...z, isFirstClearCompleted: true };
            }
            if (z.id === result.firstClearUnlockedZoneId) {
              return { ...z, isUnlocked: true };
            }
            return z;
          });
 
          // Dispatch -> Planet stability hook
          let hookLogText = "";
          if (nextRegion) {
            const hookRes = applyDispatchStabilityHook(nextRegion.nodes, zone.requiredColor);
            nextRegion.nodes = hookRes.updatedNodes;
            if (hookRes.appliedNodeName) {
              hookLogText = ` Stability hook triggered: [${hookRes.appliedNodeName}] strength increased (+0.05).`;
            }
          }
 
          logs.push({
            id: `log_comb_res_${Date.now()}`,
            cycle: nextCycle,
            timestamp: timeStr,
            text: `DISPATCH SUCCESS: Team cleared [${zone.name}]. Credits received (+${result.creditsGained}).${hookLogText}`,
            type: 'combat'
          });
        } else {
          logs.push({
            id: `log_comb_res_fail_${Date.now()}`,
            cycle: nextCycle,
            timestamp: timeStr,
            text: `DISPATCH ALERT: Team retreated from [${zone.name}]. Structural depletion sustained.`,
            type: 'combat'
          });
        }
 
        // Setup details to display in UI immediately
        setActiveDispatchReport({
          logs: result.victoryLog,
          success: result.success,
          xp: result.xpGained,
          credits: result.creditsGained
        });
 
        nextDispatch = null; // cleared
      }
 
      // --- Planet Mediation Mission Resolution ---
      let nextMediation = prev.activeMediation;

      if (nextMediation) {
        const targetNode = nextRegion ? nextRegion.nodes.find(n => n.id === nextMediation!.targetNodeId) : null;
        if (targetNode) {
          const partySlimes = prev.slimes.filter(s => nextMediation!.slimeIds.includes(s.id));
          const result = resolveMediation(targetNode, partySlimes);

          // Dominant color determination (fallback to Red if empty)
          let dominantColor: SlimeColor = 'Red';
          if (partySlimes.length > 0) {
            const colorCounts: Record<SlimeColor, number> = {} as any;
            partySlimes.forEach(s => { colorCounts[s.color] = (colorCounts[s.color] || 0) + 1; });
            let maxCount = 0;
            (Object.keys(colorCounts) as SlimeColor[]).forEach(c => {
              if (colorCounts[c]! > maxCount) {
                maxCount = colorCounts[c]!;
                dominantColor = c;
              }
            });
          }

          // Award XP and return delegates to idle
          newSlimes = newSlimes.map(s => {
            if (nextMediation!.slimeIds.includes(s.id)) {
              let nextXp = s.xp + (result.success ? 45 : 20);
              let nextLevel = s.level;
              let currentStats = { ...s.stats };

              const xpNeeded = s.level * 100;
              if (nextXp >= xpNeeded) {
                nextXp -= xpNeeded;
                nextLevel += 1;
                currentStats = calculateStats(s.color, s.pattern, nextLevel);
              }

              return {
                ...s,
                xp: nextXp,
                level: nextLevel,
                stats: currentStats,
                role: 'idle' as const,
              };
            }
            return s;
          });

          // Update target node owner and strength in region
          nextRegion.nodes = nextRegion.nodes.map(node => {
            if (node.id === targetNode.id) {
              let newOwner = node.ownerColor;
              let newStrength = node.strength;
              let newPressure = { ...node.pressure };

              if (result.success) {
                if (newOwner === null) {
                  newOwner = dominantColor;
                  newStrength = Math.min(1.0, result.stabilityChange / 100);
                  newPressure = {}; // reset
                } else {
                  newStrength = Math.min(1.0, node.strength + result.stabilityChange / 100);
                  // clear other pressures
                  Object.keys(newPressure).forEach(k => {
                    if (k !== newOwner) {
                      newPressure[k as SlimeColor] = 0;
                    }
                  });
                }
              } else {
                newStrength = Math.min(1.0, node.strength + result.stabilityChange / 100);
              }

              return {
                ...node,
                ownerColor: newOwner,
                strength: parseFloat(newStrength.toFixed(3)),
                pressure: newPressure,
              };
            }
            return node;
          });

          logs.push({
            id: `log_med_res_${Date.now()}`,
            cycle: nextCycle,
            timestamp: timeStr,
            text: `MEDIATION CONCLUDED: Delegation at [${targetNode.name}] resolved. Alignment stability adjusted.`,
            type: 'corporate'
          });

          setActiveMediationReport({
            logs: result.log,
            success: result.success,
            stabilityChange: result.stabilityChange,
          });

          // Trigger Stray arrival for mediation (always mediation-locked)
          // Always free, color matches dominant color involved
          if (newSlimes.length < prev.rosterCap) {
            const stray = createSeedSlime(dominantColor, 'Solid');
            stray.id = `stray_med_${Date.now()}`;
            stray.lockedRole = 'mediation';
            stray.name = `Refugee ${stray.name}`;
            newSlimes.push(stray);
            logs.push({
              id: `log_stray_med_${Date.now()}`,
              cycle: nextCycle,
              timestamp: timeStr,
              text: `STRAY DETECTION: A stray ${dominantColor} specimen fleeing mediation conflict has arrived at containment. lockedRole assigned to MEDIATION.`,
              type: 'corporate'
            });
          } else {
            logs.push({
              id: `log_stray_med_fail_${Date.now()}`,
              cycle: nextCycle,
              timestamp: timeStr,
              text: `STRAY WARNING: A stray ${dominantColor} specimen from mediation conflict tried to seek refuge but containment cells were full.`,
              type: 'system'
            });
          }
        }
        nextMediation = null; // cleared
      }

      // --- Planet Exploration Mission Resolution ---
      let nextExploration = prev.activeExploration;

      if (nextExploration) {
        const targetNode = nextRegion ? nextRegion.nodes.find(n => n.id === nextExploration!.targetNodeId) : null;
        if (targetNode) {
          const partySlimes = prev.slimes.filter(s => nextExploration!.slimeIds.includes(s.id));
          const result = resolveExploration(targetNode, partySlimes);

          // Award XP and return scouts to idle
          newSlimes = newSlimes.map(s => {
            if (nextExploration!.slimeIds.includes(s.id)) {
              let nextXp = s.xp + (result.success ? 45 : 20);
              let nextLevel = s.level;
              let currentStats = { ...s.stats };

              const xpNeeded = s.level * 100;
              if (nextXp >= xpNeeded) {
                nextXp -= xpNeeded;
                nextLevel += 1;
                currentStats = calculateStats(s.color, s.pattern, nextLevel);
              }

              return {
                ...s,
                xp: nextXp,
                level: nextLevel,
                stats: currentStats,
                role: 'idle' as const,
              };
            }
            return s;
          });

          // Update target node discovered status in region if successful
          if (result.success) {
            nextRegion.nodes = nextRegion.nodes.map(node => {
              if (node.id === targetNode.id) {
                return {
                  ...node,
                  discovered: true
                };
              }
              return node;
            });
          }

          logs.push({
            id: `log_exp_res_${Date.now()}`,
            cycle: nextCycle,
            timestamp: timeStr,
            text: `EXPLORATION CONCLUDED: Scouting expedition at [${targetNode.name}] resolved. ${result.success ? 'Sector revealed.' : 'Mission failed.'}`,
            type: 'corporate'
          });

          setActiveExplorationReport({
            logs: result.log,
            success: result.success,
          });
        }
        nextExploration = null; // cleared
      }

      // --- Planet Territory Simulation Ticks ---
      if (nextRegion) {
        const prevNodes = nextRegion.nodes.map(n => ({ ...n }));
        const simResult = updatePlanetSupplyAndPressure(nextRegion.nodes);
        nextRegion.nodes = simResult.updatedNodes;

        simResult.logs.forEach((simLog, idx) => {
          logs.push({
            id: `log_sim_${Date.now()}_${idx}`,
            cycle: nextCycle,
            timestamp: timeStr,
            text: simLog,
            type: 'system'
          });
        });

        // Detect node flips
        nextRegion.nodes.forEach(node => {
          const prevNode = prevNodes.find(n => n.id === node.id);
          if (prevNode && prevNode.ownerColor !== node.ownerColor && node.ownerColor !== null) {
            const flipColor = node.ownerColor;
            // Generate a stray locked to combat (dispatch)
            if (newSlimes.length < prev.rosterCap) {
              const stray = createSeedSlime(flipColor, 'Solid');
              stray.id = `stray_flip_${Date.now()}_${node.id}`;
              stray.lockedRole = 'dispatch';
              stray.name = `Refugee ${stray.name}`;
              newSlimes.push(stray);
              logs.push({
                id: `log_stray_flip_${Date.now()}_${node.id}`,
                cycle: nextCycle,
                timestamp: timeStr,
                text: `STRAY DETECTION: Node [${node.name}] flipped ownership to ${flipColor}. A stray ${flipColor} refugee fled the conflict zone and arrived at containment. lockedRole assigned to COMBAT/DISPATCH.`,
                type: 'combat'
              });
            } else {
              logs.push({
                id: `log_stray_flip_fail_${Date.now()}_${node.id}`,
                cycle: nextCycle,
                timestamp: timeStr,
                text: `STRAY WARNING: Node [${node.name}] flipped ownership to ${flipColor}. A stray tried to seek refuge but containment cells were full.`,
                type: 'system'
              });
            }
          }
        });
      }

      // --- Worker Income Calculation ---
      let workerIncomeTotal = 0;
      const workerDetails: string[] = [];
      const hasAutoFeeder = !!prev.hasAutoFeeder;
      const currentNodes = nextRegion ? nextRegion.nodes : [];

      newSlimes.forEach(slime => {
        if (slime.lockedRole === 'worker') {
          const income = calculateWorkerIncome(slime, hasAutoFeeder, currentNodes);
          workerIncomeTotal += income;
          const isMatched = isSlimeInMatchingCultureEnvironment(slime, currentNodes);
          workerDetails.push(`${slime.name} (+${income} Cr${isMatched ? ' - Culture Match!' : ''})`);
        }
      });

      if (workerIncomeTotal > 0) {
        newCredits += workerIncomeTotal;
        logs.push({
          id: `log_worker_income_${Date.now()}`,
          cycle: nextCycle,
          timestamp: timeStr,
          text: `WORKER INCOME: Lab workers generated +${workerIncomeTotal} Requisition Credits. Details: ${workerDetails.join(', ')}`,
          type: 'corporate'
        });
      }

      // --- Ring 2 (The Wilds) Unlock Check ---
      let isWildsUnlocked = !!prev.wildsUnlocked;

      if (!isWildsUnlocked && checkWildsUnlockCondition(newSlimes)) {
        isWildsUnlocked = true;
        logs.push({
          id: `log_wilds_unlock_${Date.now()}`,
          cycle: nextCycle,
          timestamp: timeStr,
          text: `PLANETARY TELEMETRY: Secondary color genetic signature detected in containment cells. Ring-2 [The Wilds] region orbital connection established!`,
          type: 'system'
        });
      }

      // Bounded to 5 cycles rolling window (keep records within last 5 cycles, meaning cycle >= nextCycle - 4)
      const keptRecentSales = (prev.recentMarketSales || []).filter(
        record => record.cycle >= nextCycle - 4
      );

      return {
        ...prev,
        cycle: nextCycle,
        credits: newCredits,
        contracts: updatedContracts,
        slimes: newSlimes,
        zones: newZones,
        activeDispatch: nextDispatch,
        activeMediation: nextMediation,
        activeExploration: nextExploration,
        planetRegion: nextRegion,
        wildsRegion: null,
        wildsUnlocked: isWildsUnlocked,
        logs: logs,
        recentMarketSales: keptRecentSales
      };
    });
  };

  // Breeding execute
  const handleInitiateBreeding = () => {
    if (!parentAId || !parentBId || parentAId === parentBId) return;
    
    const parentA = state.slimes.find(s => s.id === parentAId);
    const parentB = state.slimes.find(s => s.id === parentBId);
    if (!parentA || !parentB) return;

    if (stageFromLevel(parentA.level) === 'Elder' || stageFromLevel(parentB.level) === 'Elder') {
      addSystemLog('SPLICING DENIED: Elder specimens have exhausted genetic viability.', 'system');
      return;
    }

    if (state.slimes.length >= state.rosterCap) {
      addSystemLog('BREEDING HALTED: Specimen Roster capacity limit reached. Expand facility slots first.', 'system');
      return;
    }

    const breedingFee = 10;
    if (state.credits < breedingFee) {
      addSystemLog('BREEDING WARNING: Insufficient credits. Emergency biological grant authorized (-0 Credits).', 'system');
    }

    setIsBreedingHatching(true);
    
    // Cache the active pattern regent to ensure it remains constant over the setTimeout
    const regentSpent = activeRegentPattern;
    const colorRegentSpent = activeRegentColor;

    setTimeout(() => {
      const offspring = breedSlimes(parentA, parentB, Math.max(parentA.generation, parentB.generation) + 1);
      
      if (colorRegentSpent) {
        offspring.color = colorRegentSpent;
      }
      if (regentSpent) {
        offspring.pattern = regentSpent;
      }
      if (colorRegentSpent || regentSpent) {
        offspring.stats = calculateStats(offspring.color, offspring.pattern, offspring.level);
      }
      
      setState(prev => {
        const finalFee = prev.credits >= breedingFee ? breedingFee : 0;
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const updatedRegentInventory = { ...prev.regentInventory };
        if (regentSpent && (updatedRegentInventory[regentSpent] || 0) > 0) {
          updatedRegentInventory[regentSpent] = (updatedRegentInventory[regentSpent] || 0) - 1;
        }

        const updatedColorRegentInventory = { ...prev.colorRegentInventory };
        if (colorRegentSpent && (updatedColorRegentInventory[colorRegentSpent] || 0) > 0) {
          updatedColorRegentInventory[colorRegentSpent] = (updatedColorRegentInventory[colorRegentSpent] || 0) - 1;
        }

        let logText = `BREEDING: Spliced ${parentA.name} + ${parentB.name}`;
        if (colorRegentSpent && regentSpent) {
          logText += ` using ${colorRegentSpent} Color Regent and ${regentSpent} Pattern Regent. Born: ${offspring.name} (guaranteed ${offspring.color}, guaranteed ${offspring.pattern} pattern).`;
        } else if (colorRegentSpent) {
          logText += ` using ${colorRegentSpent} Color Regent. Born: ${offspring.name} (guaranteed ${offspring.color}, ${offspring.pattern} pattern).`;
        } else if (regentSpent) {
          logText += ` using ${regentSpent} Regent. Born: ${offspring.name} (${offspring.color}, guaranteed ${offspring.pattern} pattern).`;
        } else {
          logText += `. Born: ${offspring.name} (${offspring.color}, ${offspring.pattern} pattern).`;
        }

        const nextState = {
          ...prev,
          credits: Math.max(0, prev.credits - finalFee),
          slimes: [...prev.slimes, offspring],
          regentInventory: updatedRegentInventory,
          colorRegentInventory: updatedColorRegentInventory,
          logs: [
            ...prev.logs,
            {
              id: `log_breed_${Date.now()}`,
              cycle: prev.cycle,
              timestamp: timeStr,
              text: logText,
              type: 'breeding'
            }
          ]
        };

        return syncCodexWithRoster(nextState);
      });

      setNewOffspring(offspring);
      setIsBreedingHatching(false);
      setParentAId(null);
      setParentBId(null);
      setActiveRegentPattern(null);
      setActiveRegentColor(null);
    }, 2000);
  };

  // Commerce: Purchase a Pattern Regent from SlimeDex
  const handleBuyRegent = (pattern: SlimePattern) => {
    const patternTiers: Record<SlimePattern, number> = {
      Solid: 0,
      Stripe: 1,
      Polka: 2,
      Glow: 3,
      Crown: 4,
      Ringed: 5,
      Nebula: 6,
      Obsidian: 7
    };
    const tier = patternTiers[pattern] || 0;
    const baseCost = 50 + tier * 25;
    const isDiscovered = state.patternCodex?.[pattern]?.discovered;
    const cost = isDiscovered ? baseCost : Math.round(baseCost * 2);

    if (state.credits < cost) {
      addSystemLog(`TRANSACTION ERROR: Insufficient credits to procure ${pattern} Regent (${cost} Credits required).`, 'system');
      return;
    }

    setState(prev => {
      const updatedCredits = prev.credits - cost;
      const updatedRegentInventory = { ...prev.regentInventory };
      updatedRegentInventory[pattern] = (updatedRegentInventory[pattern] || 0) + 1;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newLog: LogEntry = {
        id: `log_buy_regent_${Date.now()}`,
        cycle: prev.cycle,
        timestamp: timeStr,
        text: `COMMERCE: Procured ${pattern} Membrane Regent for ${cost} Credits. Transferring to splicing lab.`,
        type: 'system'
      };

      return {
        ...prev,
        credits: updatedCredits,
        regentInventory: updatedRegentInventory,
        logs: [newLog, ...prev.logs]
      };
    });

    // Auto navigate to Roster - Splicing Lab sub-tab
    setActiveTab('roster');
    setRosterSubTab('breeding');
    setActiveRegentPattern(pattern);
  };

  // Commerce: Purchase a Color Regent from SlimeDex
  const handleBuyColorRegent = (color: SlimeColor) => {
    const isDiscovered = state.colorCodex?.[color]?.discovered || false;
    const cost = getColorRegentCost(color, isDiscovered);

    if (state.credits < cost) {
      addSystemLog(`TRANSACTION ERROR: Insufficient credits to procure ${color} Regent (${cost} Credits required).`, 'system');
      return;
    }

    setState(prev => {
      const updatedCredits = prev.credits - cost;
      const updatedColorRegentInventory = { ...prev.colorRegentInventory };
      updatedColorRegentInventory[color] = (updatedColorRegentInventory[color] || 0) + 1;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newLog: LogEntry = {
        id: `log_buy_color_regent_${Date.now()}`,
        cycle: prev.cycle,
        timestamp: timeStr,
        text: `COMMERCE: Procured ${color} Strain Regent for ${cost} Credits. Transferring to splicing lab.`,
        type: 'system'
      };

      return {
        ...prev,
        credits: updatedCredits,
        colorRegentInventory: updatedColorRegentInventory,
        logs: [newLog, ...prev.logs]
      };
    });

    // Auto navigate to Roster - Splicing Lab sub-tab
    setActiveTab('roster');
    setRosterSubTab('breeding');
    setActiveRegentColor(color);
  };

  // Recruit basic seed slime
  const handlePurchaseSeedSlime = (color: SlimeColor) => {
    const cost = 50;
    if (state.credits < cost) return;
    if (state.slimes.length >= state.rosterCap) {
      addSystemLog('PURCHASE REFUSED: Lab containment cells are fully occupied.', 'system');
      return;
    }

    const seed = createSeedSlime(color, 'Solid');
    setState(prev => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return {
        ...prev,
        credits: prev.credits - cost,
        slimes: [...prev.slimes, seed],
        logs: [
          ...prev.logs,
          {
            id: `log_seed_${Date.now()}`,
            cycle: prev.cycle,
            timestamp: timeStr,
            text: `RECRUITMENT: Dispensed starter specimen ${seed.name} (${color} Core).`,
            type: 'system'
          }
        ]
      };
    });

    addSystemLog(`Purchased starter ${color} specimen unit for ${cost} Credits.`, 'system');
  };

  // Recycle / Decommission Slime
  const handleRecycleSlime = (id: string) => {
    const slime = state.slimes.find(s => s.id === id);
    if (!slime) return;

    if (state.slimes.length <= 1) {
      addSystemLog('PROTOCOL DENIED: You cannot recycle your final remaining specimen. Breeding would become impossible.', 'system');
      return;
    }

    const creditGain = 15;
    setState(prev => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return {
        ...prev,
        credits: prev.credits + creditGain,
        slimes: prev.slimes.filter(s => s.id !== id),
        logs: [
          ...prev.logs,
          {
            id: `log_recycle_${Date.now()}`,
            cycle: prev.cycle,
            timestamp: timeStr,
            text: `DECOMMISSION: ${slime.name} returned to biological soup. Gained +${creditGain} reclamation credits.`,
            type: 'system'
          }
        ]
      };
    });

    setSelectedSlimeId(null);
    addSystemLog(`${slime.name} recycled. Bio-mass salvaged.`, 'system');
  };

  // Deliver Corporate Contract with explicit selected slime
  const handleDeliverContract = (contract: CorporateContract, targetSlime: Slime) => {
    setState(prev => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return {
        ...prev,
        credits: prev.credits + contract.creditsReward,
        contracts: prev.contracts.filter(c => c.id !== contract.id),
        slimes: prev.slimes.filter(s => s.id !== targetSlime.id),
        logs: [
          ...prev.logs,
          {
            id: `log_contract_f_${Date.now()}`,
            cycle: prev.cycle,
            timestamp: timeStr,
            text: `CORPORATE EXPORT: Specimen ${targetSlime.name} delivered through the black hole to satisfy ${contract.title}. Transferred +${contract.creditsReward} Requisition Credits.`,
            type: 'corporate'
          }
        ]
      };
    });

    addSystemLog(`Contract completed. Transferred ${targetSlime.name} to Headquarters for ${contract.creditsReward} Credits.`, 'corporate');
  };

  // Sell Slime on the Galactic Market
  const handleSellOnMarket = (targetSlime: Slime, price: number) => {
    setState(prev => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newRecord = { color: targetSlime.color, cycle: prev.cycle };
      const updatedSales = [...(prev.recentMarketSales || []), newRecord];

      return {
        ...prev,
        credits: prev.credits + price,
        slimes: prev.slimes.filter(s => s.id !== targetSlime.id),
        recentMarketSales: updatedSales,
        logs: [
          ...prev.logs,
          {
            id: `log_market_s_${Date.now()}`,
            cycle: prev.cycle,
            timestamp: timeStr,
            text: `GALACTIC MARKET SALE: Specimen ${targetSlime.name} sold for ${price} Requisition Credits. Market supply for ${targetSlime.color} increased.`,
            type: 'corporate'
          }
        ]
      };
    });

    addSystemLog(`Market Liquidation completed. Sold ${targetSlime.name} to the Galactic Market for ${price} Credits.`, 'corporate');
  };

  // Launch Combat Dispatch with locks
  const executeLaunchDispatchWithLocks = (idsToLock: string[]) => {
    if (!selectedZoneId) return;
    const zone = state.zones.find(z => z.id === selectedZoneId);
    if (!zone || dispatchDraftIds.length === 0) return;

    const dispatch: ActiveDispatch = {
      id: `dispatch_${Date.now()}`,
      zoneId: selectedZoneId,
      slimeIds: [...dispatchDraftIds],
      cyclesRemaining: 1, // Resolves upon cycle skip or real-time timer
      totalDurationMs: 15000, // 15 seconds real-time
      startedAt: Date.now(),
      status: 'active'
    };

    setRealtimeRemainingMs(15000);

    setState(prev => {
      // Set roles of drafted slimes to dispatch and lock unspecialized ones
      const updatedSlimes = prev.slimes.map(s => {
        let updated = { ...s };
        if (dispatchDraftIds.includes(s.id)) {
          updated.role = 'dispatch' as const;
        }
        if (idsToLock.includes(s.id)) {
          updated.lockedRole = 'dispatch';
        }
        return updated;
      });

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      return {
        ...prev,
        activeDispatch: dispatch,
        slimes: updatedSlimes,
        logs: [
          ...prev.logs,
          {
            id: `log_launch_${Date.now()}`,
            cycle: prev.cycle,
            timestamp: timeStr,
            text: `EXTRACTOR CAP: Launched landing pod with ${dispatchDraftIds.length} specimens into orbit of [${zone.name}].`,
            type: 'combat'
          }
        ]
      };
    });

    // Reset draft fields
    setDispatchDraftIds([]);
    setSelectedZoneId(null);
    setMissionsSubTab('active'); // auto focus to active sub tab to monitor
    setRoleLockConfirm(null);
  };

  const handleLaunchDispatch = () => {
    if (!selectedZoneId) return;
    const zone = state.zones.find(z => z.id === selectedZoneId);
    if (!zone || dispatchDraftIds.length === 0) return;

    const draftedSlimes = state.slimes.filter(s => dispatchDraftIds.includes(s.id));
    const unlockedSlimes = draftedSlimes.filter(s => !s.lockedRole);

    if (unlockedSlimes.length > 0) {
      setRoleLockConfirm({
        type: 'dispatch',
        unlockedSlimes,
        onConfirm: () => {
          executeLaunchDispatchWithLocks(unlockedSlimes.map(s => s.id));
        }
      });
      return;
    }

    executeLaunchDispatchWithLocks([]);
  };

  // Launch Mediation Mission with locks
  const executeLaunchMediationWithLocks = (idsToLock: string[]) => {
    if (!selectedMediationNodeId || !state.planetRegion) return;
    const node = state.planetRegion.nodes.find(n => n.id === selectedMediationNodeId);
    if (!node || mediationDraftIds.length === 0) return;

    const mediation: MediationMission = {
      id: `mediation_${Date.now()}`,
      targetNodeId: selectedMediationNodeId,
      slimeIds: [...mediationDraftIds],
      cyclesRemaining: 1,
      totalDurationMs: 15000,
      startedAt: Date.now(),
      status: 'active'
    };

    setState(prev => {
      // Set roles of drafted slimes to dispatch and lock unspecialized ones
      const updatedSlimes = prev.slimes.map(s => {
        let updated = { ...s };
        if (mediationDraftIds.includes(s.id)) {
          updated.role = 'dispatch' as const;
        }
        if (idsToLock.includes(s.id)) {
          updated.lockedRole = 'mediation';
        }
        return updated;
      });

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      return {
        ...prev,
        activeMediation: mediation,
        slimes: updatedSlimes,
        logs: [
          ...prev.logs,
          {
            id: `log_launch_med_${Date.now()}`,
            cycle: prev.cycle,
            timestamp: timeStr,
            text: `MEDIATION LAUNCH: Diplomatic pod dispatched to Node [${node.name}] with ${mediationDraftIds.length} representatives.`,
            type: 'corporate'
          }
        ]
      };
    });

    // Reset draft fields
    setMediationDraftIds([]);
    setSelectedMediationNodeId(null);
    setPlanetSubTab('mediation'); // switch subtab to mediation
    setRoleLockConfirm(null);
  };

  const handleLaunchMediation = () => {
    if (!selectedMediationNodeId || !state.planetRegion) return;
    const node = state.planetRegion.nodes.find(n => n.id === selectedMediationNodeId);
    if (!node || mediationDraftIds.length === 0) return;

    const draftedSlimes = state.slimes.filter(s => mediationDraftIds.includes(s.id));
    const unlockedSlimes = draftedSlimes.filter(s => !s.lockedRole);

    if (unlockedSlimes.length > 0) {
      setRoleLockConfirm({
        type: 'mediation',
        unlockedSlimes,
        onConfirm: () => {
          executeLaunchMediationWithLocks(unlockedSlimes.map(s => s.id));
        }
      });
      return;
    }

    executeLaunchMediationWithLocks([]);
  };

  // Launch Exploration Mission with locks
  const executeLaunchExplorationWithLocks = (idsToLock: string[]) => {
    if (!selectedExplorationNodeId || !state.planetRegion) return;
    const node = state.planetRegion.nodes.find(n => n.id === selectedExplorationNodeId);
    if (!node || explorationDraftIds.length === 0) return;

    const exploration: ExplorationMission = {
      id: `exploration_${Date.now()}`,
      targetNodeId: selectedExplorationNodeId,
      slimeIds: [...explorationDraftIds],
      cyclesRemaining: 1,
      totalDurationMs: 15000,
      startedAt: Date.now(),
      status: 'active'
    };

    setState(prev => {
      // Set roles of drafted slimes to dispatch and lock unspecialized ones
      const updatedSlimes = prev.slimes.map(s => {
        let updated = { ...s };
        if (explorationDraftIds.includes(s.id)) {
          updated.role = 'dispatch' as const;
        }
        if (idsToLock.includes(s.id)) {
          updated.lockedRole = 'exploration';
        }
        return updated;
      });

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      return {
        ...prev,
        activeExploration: exploration,
        slimes: updatedSlimes,
        logs: [
          ...prev.logs,
          {
            id: `log_launch_exp_${Date.now()}`,
            cycle: prev.cycle,
            timestamp: timeStr,
            text: `EXPLORATION LAUNCH: Scouting pod dispatched to Node [${node.name}] with ${explorationDraftIds.length} representatives.`,
            type: 'corporate'
          }
        ]
      };
    });

    // Reset draft fields
    setExplorationDraftIds([]);
    setSelectedExplorationNodeId(null);
    setPlanetSubTab('exploration'); // switch subtab to exploration
    setRoleLockConfirm(null);
  };

  const handleLaunchExploration = () => {
    if (!selectedExplorationNodeId || !state.planetRegion) return;
    const node = state.planetRegion.nodes.find(n => n.id === selectedExplorationNodeId);
    if (!node || explorationDraftIds.length === 0) return;

    const draftedSlimes = state.slimes.filter(s => explorationDraftIds.includes(s.id));
    const unlockedSlimes = draftedSlimes.filter(s => !s.lockedRole);

    if (unlockedSlimes.length > 0) {
      setRoleLockConfirm({
        type: 'exploration',
        unlockedSlimes,
        onConfirm: () => {
          executeLaunchExplorationWithLocks(unlockedSlimes.map(s => s.id));
        }
      });
      return;
    }

    executeLaunchExplorationWithLocks([]);
  };

  // Retrieve Completed pod (if real-time timer expired without cycle skip)
  const handleRetrieveCompletedPod = () => {
    if (!state.activeDispatch || state.activeDispatch.status !== 'completed') return;
    
    // Resolve right away
    handleAdvanceCycle();
  };

  // Buy Upgrades
  const handleBuyUpgrade = (type: 'capacity' | 'stabilizer' | 'autofeeder') => {
    if (type === 'capacity') {
      const cost = 150;
      if (state.credits < cost) return;
      setState(prev => ({
        ...prev,
        credits: prev.credits - cost,
        rosterCap: prev.rosterCap + 5,
        logs: [
          ...prev.logs,
          {
            id: `log_upg_cap_${Date.now()}`,
            cycle: prev.cycle,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            text: `LAB UPGRADE: Roster containment cells expanded (+5 Capacity). Max is now ${prev.rosterCap + 5}.`,
            type: 'system'
          }
        ]
      }));
    } else if (type === 'stabilizer') {
      const cost = 200;
      if (state.credits < cost) return;
      setState(prev => ({
        ...prev,
        credits: prev.credits - cost,
        breedingSuccessRateModifier: prev.breedingSuccessRateModifier + 0.1,
        logs: [
          ...prev.logs,
          {
            id: `log_upg_stb_${Date.now()}`,
            cycle: prev.cycle,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            text: `LAB UPGRADE: Splicer Stabilizer magnetic focus upgraded (+10% mutation stability).`,
            type: 'system'
          }
        ]
      }));
    } else if (type === 'autofeeder') {
      const cost = 250;
      if (state.credits < cost || state.hasAutoFeeder) return;
      setState(prev => ({
        ...prev,
        credits: prev.credits - cost,
        hasAutoFeeder: true,
        logs: [
          ...prev.logs,
          {
            id: `log_upg_feed_${Date.now()}`,
            cycle: prev.cycle,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            text: `LAB UPGRADE: Global Auto-Feeder module activated. Baseline credit generation for all Lab Workers doubled.`,
            type: 'system'
          }
        ]
      }));
    }
  };

  // Helper to add system logs
  const addSystemLog = (text: string, type: LogEntry['type'] = 'system') => {
    setState(prev => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return {
        ...prev,
        logs: [
          ...prev.logs,
          {
            id: `log_custom_${Date.now()}`,
            cycle: prev.cycle,
            timestamp: timeStr,
            text,
            type
          }
        ]
      };
    });
  };

  // Clear state for fresh restart
  const handleHardReset = () => {
    if (window.confirm("Warning: This will disintegrate your laboratory, wipe your active slimes, and restart your orbit assignment from day 1. Proceed?")) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      window.location.reload();
    }
  };

  // Executing slime renaming
  const handleExecuteRename = () => {
    if (!renameSlimeId || !newNameInput.trim()) return;
    setState(prev => ({
      ...prev,
      slimes: prev.slimes.map(s => s.id === renameSlimeId ? { ...s, name: newNameInput.trim() } : s)
    }));
    setRenameSlimeId(null);
    setNewNameInput('');
  };

  // Toggle Specimen Worker role lock
  const handleToggleWorkerRole = (slimeId: string) => {
    setState(prev => {
      const updatedSlimes = prev.slimes.map(s => {
        if (s.id === slimeId) {
          // If already worker, remove the role lock
          if (s.lockedRole === 'worker') {
            return { ...s, lockedRole: null };
          }
          // If not locked, lock as worker
          if (!s.lockedRole) {
            return { ...s, lockedRole: 'worker' as const };
          }
        }
        return s;
      });
      return {
        ...prev,
        slimes: updatedSlimes
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-slate-700 selection:text-white relative font-sans">
      {/* Background stars animation */}
      <div className="absolute inset-0 bg-[radial-gradient(#152033_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      <div className="absolute top-24 left-1/4 w-96 h-96 bg-blue-950/15 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-24 right-1/4 w-[500px] h-[500px] bg-red-950/10 rounded-full filter blur-3xl pointer-events-none" />

      {/* Main retro-futuristic header */}
      <header className="border-b border-slate-800/80 bg-[#0c121e]/90 backdrop-blur-md px-6 py-4 sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded bg-slate-900 flex items-center justify-center border border-slate-700/60 shadow-[0_0_15px_rgba(100,116,139,0.2)]">
            <Beaker className="w-5 h-5 text-slate-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display tracking-wide text-white flex items-center">
              SLIMEGARDEN
              <span className="ml-2.5 text-[9px] font-mono tracking-widest px-2 py-0.5 rounded border border-cyan-800/40 bg-cyan-950/40 text-cyan-400 font-normal">
                MVP // PHASE_E
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">Asteroid-317 Laboratory Terminal</p>
          </div>
        </div>

        {/* Global state indicators */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-mono">CYCLE</span>
            <span className="text-sm font-bold text-white font-mono">{state.cycle}</span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-slate-400 font-mono">CREDITS</span>
            <span className="text-sm font-bold text-yellow-400 font-mono">{state.credits}</span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50">
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400 font-mono">ROSTER</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {state.slimes.length} <span className="text-slate-600 font-normal">/ {state.rosterCap}</span>
            </span>
          </div>

          <button 
            onClick={() => setTerminalVisible(prev => !prev)}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer text-xs font-mono uppercase tracking-wider ${
              terminalVisible 
                ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-950/50 shadow-[0_0_10px_rgba(6,182,212,0.15)]' 
                : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-300 hover:bg-slate-900'
            }`}
            title="Toggle system console"
          >
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Terminal: {terminalVisible ? 'ON' : 'OFF'}</span>
          </button>

          <button 
            onClick={handleAdvanceCycle}
            className="group flex items-center space-x-2.5 px-4.5 py-1.5 rounded-lg border border-red-900/40 bg-red-950/20 hover:bg-red-950/40 text-red-300 font-bold text-xs font-mono uppercase tracking-wider cursor-pointer transition-all duration-200 shadow-md"
          >
            <Moon className="w-4 h-4 text-red-400 group-hover:rotate-12 transition-transform duration-300" />
            <span>Pass Lab Cycle</span>
          </button>
        </div>
      </header>

      {/* Main core full-width tabbed layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col space-y-6 pb-6">
        
        {/* Full-width Main Tab Rail */}
        <div className="flex border border-slate-800 bg-[#080d16] p-1 rounded-xl w-full">
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3.5 text-xs font-bold font-mono uppercase tracking-wider rounded-lg cursor-pointer transition-all ${
              activeTab === 'roster' 
                ? 'bg-slate-800 text-white shadow' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Specimens & Splicing</span>
          </button>
          <button
            onClick={() => setActiveTab('missions')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3.5 text-xs font-bold font-mono uppercase tracking-wider rounded-lg cursor-pointer transition-all relative ${
              activeTab === 'missions' 
                ? 'bg-slate-800 text-white shadow' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Orbit Missions</span>
            {state.activeDispatch && (
              <span className="absolute top-2.5 right-2 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('economy')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3.5 text-xs font-bold font-mono uppercase tracking-wider rounded-lg cursor-pointer transition-all relative ${
              activeTab === 'economy' 
                ? 'bg-slate-800 text-white shadow' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Economy Terminal</span>
            {state.contracts.length > 0 && (
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3.5 text-xs font-bold font-mono uppercase tracking-wider rounded-lg cursor-pointer transition-all ${
              activeTab === 'lab' 
                ? 'bg-slate-800 text-white shadow' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Facility Upgrades</span>
          </button>
          <button
            onClick={() => setActiveTab('planet')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3.5 text-xs font-bold font-mono uppercase tracking-wider rounded-lg cursor-pointer transition-all relative ${
              activeTab === 'planet' 
                ? 'bg-slate-800 text-white shadow' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Planetary Conflict</span>
            {state.activeMediation && (
              <span className="absolute top-2.5 right-2 w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping" />
            )}
          </button>
        </div>

        {/* Active Tab Screen Component Panel */}
        <div className="border border-slate-800/80 rounded-xl bg-[#0c1220]/75 backdrop-blur-md p-6 flex-1 flex flex-col min-h-[480px]">
          <AnimatePresence mode="wait">
            {activeTab === 'roster' && (
              <RosterTab
                key="tab_roster_comp"
                state={state}
                selectedSlimeId={selectedSlimeId}
                setSelectedSlimeId={setSelectedSlimeId}
                setRenameSlimeId={setRenameSlimeId}
                setNewNameInput={setNewNameInput}
                handleRecycleSlime={handleRecycleSlime}
                parentAId={parentAId}
                parentBId={parentBId}
                setParentAId={setParentAId}
                setParentBId={setParentBId}
                isBreedingHatching={isBreedingHatching}
                handleInitiateBreeding={handleInitiateBreeding}
                activeSubTab={rosterSubTab}
                setActiveSubTab={setRosterSubTab}
                activeRegentPattern={activeRegentPattern}
                setActiveRegentPattern={setActiveRegentPattern}
                onBuyRegent={handleBuyRegent}
                activeRegentColor={activeRegentColor}
                setActiveRegentColor={setActiveRegentColor}
                onBuyColorRegent={handleBuyColorRegent}
                handleToggleWorkerRole={handleToggleWorkerRole}
              />
            )}

            {activeTab === 'missions' && (
              <MissionsTab
                key="tab_missions_comp"
                state={state}
                selectedZoneId={selectedZoneId}
                setSelectedZoneId={setSelectedZoneId}
                dispatchDraftIds={dispatchDraftIds}
                setDispatchDraftIds={setDispatchDraftIds}
                realtimeRemainingMs={realtimeRemainingMs}
                activeDispatchReport={activeDispatchReport}
                setActiveDispatchReport={setActiveDispatchReport}
                handleLaunchDispatch={handleLaunchDispatch}
                handleRetrieveCompletedPod={handleRetrieveCompletedPod}
                handleAdvanceCycle={handleAdvanceCycle}
                activeSubTab={missionsSubTab}
                setActiveSubTab={setMissionsSubTab}
              />
            )}

            {activeTab === 'economy' && (
              <EconomyTab
                key="tab_economy_comp"
                state={state}
                handleDeliverContract={handleDeliverContract}
                handleSellOnMarket={handleSellOnMarket}
                activeSubTab={economySubTab}
                setActiveSubTab={setEconomySubTab}
              />
            )}

            {activeTab === 'lab' && (
              <LabTab
                key="tab_lab_comp"
                state={state}
                handleBuyUpgrade={handleBuyUpgrade}
                handlePurchaseSeedSlime={handlePurchaseSeedSlime}
                activeSubTab={labSubTab}
                setActiveSubTab={setLabSubTab}
              />
            )}

            {activeTab === 'planet' && (
              <PlanetTab
                key="tab_planet_comp"
                state={state}
                handleLaunchMediation={handleLaunchMediation}
                mediationDraftIds={mediationDraftIds}
                setMediationDraftIds={setMediationDraftIds}
                selectedMediationNodeId={selectedMediationNodeId}
                setSelectedMediationNodeId={setSelectedMediationNodeId}
                activeMediationReport={activeMediationReport}
                setActiveMediationReport={setActiveMediationReport}
                handleLaunchExploration={handleLaunchExploration}
                explorationDraftIds={explorationDraftIds}
                setExplorationDraftIds={setExplorationDraftIds}
                selectedExplorationNodeId={selectedExplorationNodeId}
                setSelectedExplorationNodeId={setSelectedExplorationNodeId}
                activeExplorationReport={activeExplorationReport}
                setActiveExplorationReport={setActiveExplorationReport}
                handleAdvanceCycle={handleAdvanceCycle}
                activeSubTab={planetSubTab}
                setActiveSubTab={setPlanetSubTab}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Floating Console log Terminal */}
      {terminalVisible && (
        <footer className="mt-auto border-t border-slate-800 bg-[#060a10]/95 p-4 z-20">
          <div className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            <div className="md:col-span-3 flex flex-row md:flex-col justify-between md:justify-center gap-2 pr-2 border-r border-slate-900 md:border-slate-800">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold font-mono tracking-widest text-slate-300 uppercase">System Terminal</span>
              </div>
              
              <div className="flex flex-wrap gap-1 mt-1.5">
                {(['all', 'system', 'breeding', 'combat', 'melancholy'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setLogFilter(f)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase border cursor-pointer transition-all ${
                      logFilter === f
                        ? 'bg-slate-800 text-white border-slate-700'
                        : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-8 overflow-y-auto max-h-[80px] space-y-1 font-mono text-[10px] leading-relaxed select-text text-slate-400 pl-2">
              {state.logs
                .filter(l => logFilter === 'all' || l.type === logFilter)
                .slice(-15) // Keep last 15 matching logs
                .map((log) => {
                  let colorClass = 'text-slate-400';
                  if (log.type === 'system') colorClass = 'text-cyan-400/90';
                  if (log.type === 'breeding') colorClass = 'text-purple-400/90';
                  if (log.type === 'combat') colorClass = 'text-red-400/90';
                  if (log.type === 'corporate') colorClass = 'text-yellow-400/90';
                  if (log.type === 'melancholy') colorClass = 'text-slate-300/80 italic font-light border-l border-slate-700 pl-1.5';

                  return (
                    <div key={log.id} className="flex items-start space-x-2">
                      <span className="text-slate-600 flex-shrink-0">[{log.timestamp}]</span>
                      <span className="text-slate-500 flex-shrink-0">C{log.cycle}</span>
                      <span className={`${colorClass} break-words`}>{log.text}</span>
                    </div>
                  );
                })}
            </div>

            <div className="md:col-span-1 text-right flex justify-end">
              <button
                onClick={handleHardReset}
                className="px-2 py-1 text-[8px] font-mono uppercase tracking-widest text-slate-700 hover:text-red-600 hover:bg-red-950/20 border border-slate-900 hover:border-red-950/40 rounded transition-all cursor-pointer"
                title="Disintegrate lab databases"
              >
                Terminal Reset
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* ROLE LOCK CONFIRMATION MODAL */}
      {roleLockConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div 
            className="border border-yellow-500/30 bg-[#0c1220] rounded-xl p-5 max-w-md w-full space-y-4 shadow-[0_0_50px_rgba(234,179,8,0.15)] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500" />
            
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-850">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <h3 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Confirm Track Specialization</h3>
              <button 
                onClick={() => setRoleLockConfirm(null)}
                className="ml-auto text-slate-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-normal font-mono">
              You are authorizing the first orbital launch of these specimens. This action permanently locks their specialization track to <span className="text-white font-bold">{roleLockConfirm.type === 'dispatch' ? 'COMBAT DISPATCH' : 'PLANETARY MEDIATION'}</span>:
            </p>

            {/* List of slimes to lock */}
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {roleLockConfirm.unlockedSlimes.map(slime => {
                const spec = COLOR_SPECS[slime.color];
                return (
                  <div key={slime.id} className="p-2.5 bg-slate-950/60 border border-slate-850 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full border border-slate-800 bg-slate-950/50 flex items-center justify-center">
                        <SlimeVisual slime={slime} size="xs" />
                      </div>
                      <div>
                        <div className="font-mono text-xs font-bold text-white leading-tight">{slime.name}</div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">Lv. {slime.level} {slime.color} {slime.pattern}</div>
                      </div>
                    </div>
                    <div className="text-right font-mono text-[9px] text-slate-500 uppercase tracking-wide">
                      UNSPECIALIZED
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Warning box */}
            <div className="p-3 bg-red-950/10 border border-red-900/20 rounded-lg flex items-start space-x-2 text-[10px] font-mono text-red-300 leading-normal">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">PERMANENT DEPLOYMENT LOCK:</span> Once confirmed, these specimens can <span className="font-bold text-white">NEVER</span> be drafted for {roleLockConfirm.type === 'dispatch' ? 'Planetary Mediation' : 'Combat Dispatch'} missions again. Breeding and roster functions remain fully operational.
              </div>
            </div>

            {/* Choices */}
            <div className="flex space-x-3 pt-2">
              <button 
                onClick={() => setRoleLockConfirm(null)}
                className="flex-1 py-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 font-mono text-xs uppercase cursor-pointer transition-colors"
              >
                Abort Mission
              </button>
              <button 
                onClick={roleLockConfirm.onConfirm}
                className="flex-1 py-2 rounded bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-[0_0_15px_rgba(234,179,8,0.25)] flex items-center justify-center space-x-1.5"
              >
                <span>Confirm & Specialize</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENAME MODAL */}
      {renameSlimeId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="border border-slate-800 bg-[#0c1220] rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Rename Bio-Specimen</h3>
            <p className="text-xs text-slate-400 leading-normal font-mono">Assign a customized reference title to this biological asset in the computer register.</p>
            
            <input 
              type="text"
              value={newNameInput}
              onChange={(e) => setNewNameInput(e.target.value)}
              placeholder="Enter new reference designation..."
              className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-500"
              maxLength={24}
              autoFocus
            />

            <div className="flex space-x-2.5">
              <button 
                onClick={() => setRenameSlimeId(null)}
                className="flex-1 py-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 font-mono text-xs uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleExecuteRename}
                className="flex-1 py-2 rounded bg-cyan-600 border border-cyan-500 hover:bg-cyan-500 text-white font-mono text-xs uppercase font-bold cursor-pointer"
              >
                Apply designation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW BREEDING HATCH COMPLETE MODAL */}
      {newOffspring && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="border border-cyan-500/30 bg-[#0b0f19] rounded-2xl p-6 max-w-sm w-full space-y-5 text-center shadow-[0_0_40px_rgba(6,182,212,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-500" />
            
            <div className="w-12 h-12 rounded-full bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-center mx-auto shadow-md">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">Hatch Sequence Stable</h3>
              <p className="text-sm font-bold text-white font-mono">{newOffspring.name}</p>
              <p className="text-[11px] text-slate-400 leading-normal max-w-xs mx-auto">
                Offspring genetics consolidated. Level 1 {newOffspring.color} specimen has successfully settled into containment cell grids.
              </p>
            </div>

            <div className="flex justify-center p-4 bg-slate-950/30 rounded-xl border border-slate-900">
              <SlimeVisual slime={newOffspring} size="lg" showDetails />
            </div>

            <div>
              <button 
                onClick={() => {
                  setSelectedSlimeId(newOffspring.id);
                  setNewOffspring(null);
                }}
                className="w-full py-2.5 rounded-lg bg-cyan-600 border border-cyan-500 hover:bg-cyan-500 text-white font-mono text-xs uppercase font-bold cursor-pointer"
              >
                Secure to Containment Cell
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH OUTCOME DETAILED REPORT MODAL */}
      {activeDispatchReport && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className={`border rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative overflow-hidden ${
            activeDispatchReport.success ? 'border-emerald-500/30' : 'border-red-500/30'
          }`}>
            <div className={`absolute top-0 left-0 right-0 h-1 ${
              activeDispatchReport.success ? 'bg-emerald-500' : 'bg-red-500'
            }`} />

            <div className="flex items-center space-x-3.5 border-b border-slate-900 pb-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                activeDispatchReport.success ? 'bg-emerald-950/30 border border-emerald-500/20' : 'bg-red-950/30 border border-red-500/20'
              }`}>
                {activeDispatchReport.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Extraction Pod Telemetry</h3>
                <h4 className="text-sm font-bold text-white">
                  {activeDispatchReport.success ? 'MISSION ACCOMPLISHED' : 'HAZARD THREAT DETECTED (RETREAT)'}
                </h4>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-900 text-[10px] font-mono leading-relaxed text-slate-300 max-h-[220px] overflow-y-auto space-y-1.5">
              {activeDispatchReport.logs.map((line, idx) => (
                <div key={idx} className={line.startsWith('VICTORY') || line.includes('SUCCESS') ? 'text-emerald-400 font-bold' : line.startsWith('  -') ? 'text-slate-400 pl-2' : ''}>
                  {line}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 text-center font-mono text-xs">
              <div className="bg-slate-900/40 p-2 rounded border border-slate-900">
                <div className="text-[9px] text-slate-500">Credits Harvested:</div>
                <div className="text-sm font-bold text-yellow-400 mt-0.5">+{activeDispatchReport.credits} Cr</div>
              </div>
              <div className="bg-[#091520]/40 p-2 rounded border border-slate-900">
                <div className="text-[9px] text-slate-500">Specimen Experience:</div>
                <div className="text-sm font-bold text-cyan-400 mt-0.5">+{activeDispatchReport.xp} XP / Unit</div>
              </div>
            </div>

            <div>
              <button 
                onClick={() => setActiveDispatchReport(null)}
                className={`w-full py-2.5 rounded-lg text-white font-mono text-xs uppercase font-bold cursor-pointer transition-all ${
                  activeDispatchReport.success 
                    ? 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-500' 
                    : 'bg-red-600 hover:bg-red-500 border border-red-500'
                }`}
              >
                Acknowledge report & release pod
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
