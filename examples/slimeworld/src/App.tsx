import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dna, Sparkles, ShieldAlert, Swords, Briefcase, Clock, Database, 
  ChevronRight, RefreshCw, Sliders, Plus, Trash2, Edit2, Terminal, 
  AlertTriangle, CheckCircle2, Moon, Info, Lock, Unlock, Coins, X,
  RotateCcw, Target, Beaker, BookOpen, Compass
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
  calculateWorkerIncome, isSlimeInMatchingCultureEnvironment,
  CURRENT_GEOMETRY_VERSION, isCapitolHardened
} from './gameLogic';

import { SlimeVisual } from './components/SlimeVisual';
import { LabTab } from './components/LabTab';
import { PlanetTab } from './components/PlanetTab';
import { useBreedingActions } from './hooks/useBreedingActions';
import { useDispatchActions } from './hooks/useDispatchActions';
import { useMediationActions } from './hooks/useMediationActions';
import { useExplorationActions } from './hooks/useExplorationActions';
import { useEconomyActions } from './hooks/useEconomyActions';
import { useUpgradeActions } from './hooks/useUpgradeActions';
import { useCycleActions } from './hooks/useCycleActions';
import { useGarrisonActions } from './hooks/useGarrisonActions';
import { useClaimActions } from './hooks/useClaimActions';

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
        } else if (parsed.planetRegion && parsed.planetRegion.geometryVersion !== CURRENT_GEOMETRY_VERSION) {
          parsed.planetRegion = null;
        }
        if (parsed.wildsRegion === undefined) {
          parsed.wildsRegion = null;
        } else if (parsed.wildsRegion && parsed.wildsRegion.geometryVersion !== CURRENT_GEOMETRY_VERSION) {
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
        if (!parsed.cultureRelationships) {
          parsed.cultureRelationships = {
            Red: 50,
            Blue: 50,
            Yellow: 50,
            Purple: 50,
            Orange: 50,
            Green: 50,
            Gray: 50
          };
        }
        
        // Backward-populate hue and saturation for loaded slimes
        const HUE_MAP: Record<SlimeColor, number> = {
          Red: 0, Orange: 60, Yellow: 120, Green: 180, Purple: 240, Blue: 300, Gray: 0
        };
        if (parsed.slimes) {
          parsed.slimes = parsed.slimes.map(slime => {
            const h = slime.hue !== undefined ? slime.hue : (HUE_MAP[slime.color] || 0);
            const s = slime.saturation !== undefined ? slime.saturation : (slime.color === 'Gray' ? 0 : 100);
            return {
              ...slime,
              hue: h,
              saturation: s,
              colorSaturation: s
            };
          });
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
      hasAutoFeeder: false,
      colorTargetCodex: {},
      targetRegentInventory: {},
      cultureRelationships: {
        Red: 50,
        Blue: 50,
        Yellow: 50,
        Purple: 50,
        Orange: 50,
        Green: 50,
        Gray: 50
      }
    };

    return syncCodexWithRoster(freshState);
  });

  // Top level active main tab
  const [activeTab, setActiveTab] = useState<'lab' | 'planet'>('lab');
  
  // Persisted sub-tab selections for each main tab
  const [labSubTab, setLabSubTab] = useState<'collection' | 'breeding' | 'slimedex' | 'upgrades' | 'requisitions'>('collection');
  const [planetSubTab, setPlanetSubTab] = useState<'regions' | 'mediation' | 'exploration' | 'active' | 'zones'>('regions');

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
  const [activeTargetRegent, setActiveTargetRegent] = useState<string | null>(null);

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

  // Selected Node state (Planet Map Click-to-Select)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

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

  // New Game/Reset confirmation state
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Helper to add system logs (declared early for use in hooks)
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

  // Hooks for domain actions
  const {
    handleAdvanceCycle
  } = useCycleActions({
    state,
    setState,
    setActiveDispatchReport,
    setActiveMediationReport,
    setActiveExplorationReport
  });

  const {
    handleInitiateBreeding,
    handleBuyRegent,
    handleBuyColorRegent,
    handleBuyTargetRegent
  } = useBreedingActions({
    state,
    setState,
    parentAId,
    parentBId,
    setParentAId,
    setParentBId,
    activeRegentPattern,
    setActiveRegentPattern,
    activeRegentColor,
    setActiveRegentColor,
    activeTargetRegent,
    setActiveTargetRegent,
    setIsBreedingHatching,
    setNewOffspring,
    addSystemLog,
    setActiveTab,
    setLabSubTab
  });

  const {
    handleLaunchDispatch,
    handleRetrieveCompletedPod,
    executeLaunchDispatchWithLocks
  } = useDispatchActions({
    state,
    setState,
    selectedZoneId,
    setSelectedZoneId,
    dispatchDraftIds,
    setDispatchDraftIds,
    setRealtimeRemainingMs,
    setPlanetSubTab,
    setRoleLockConfirm,
    handleAdvanceCycle: () => handleAdvanceCycle()
  });

  const {
    executeLaunchMediationWithLocks,
    handleLaunchMediation
  } = useMediationActions({
    state,
    setState,
    selectedMediationNodeId,
    setSelectedMediationNodeId,
    mediationDraftIds,
    setMediationDraftIds,
    setPlanetSubTab,
    setRoleLockConfirm
  });

  const {
    executeLaunchExplorationWithLocks,
    handleLaunchExploration
  } = useExplorationActions({
    state,
    setState,
    selectedExplorationNodeId,
    setSelectedExplorationNodeId,
    explorationDraftIds,
    setExplorationDraftIds,
    setPlanetSubTab,
    setRoleLockConfirm
  });

  const {
    handleDeliverContract,
    handleSellOnMarket
  } = useEconomyActions({
    state,
    setState,
    addSystemLog
  });

  const {
    handleBuyUpgrade,
    handleToggleWorkerRole
  } = useUpgradeActions({
    state,
    setState
  });

  const {
    handleAssignGarrison,
    handleRecallGarrison
  } = useGarrisonActions({
    state,
    setState
  });

  const {
    handleForceClaim,
    handleBribeClaim,
    handleConvertClaim
  } = useClaimActions({
    state,
    setState
  });

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

  // Synchronize garrisons: if a node is no longer owned, or its ownerColor doesn't match, or the node's garrisonSlimeId doesn't match, or the node is unclaimed, release the slime.
  useEffect(() => {
    if (!state.planetRegion) return;
    let slimesModified = false;
    const updatedSlimes = state.slimes.map(s => {
      if (s.lockedRole === 'garrison' && s.garrisonedAt) {
        const node = state.planetRegion?.nodes.find(n => n.id === s.garrisonedAt);
        // If node doesn't exist, is unclaimed, or its ownerColor doesn't match the slime's color, or the node's garrisonSlimeId doesn't match the slime's ID, release it!
        if (!node || !node.ownerColor || node.ownerColor !== s.color || node.garrisonSlimeId !== s.id) {
          slimesModified = true;
          return { ...s, lockedRole: null, garrisonedAt: null };
        }
      }
      return s;
    });

    // Also verify nodes have correct garrisonSlimeId
    let nodesModified = false;
    const updatedNodes = state.planetRegion.nodes.map(n => {
      if (n.garrisonSlimeId) {
        const hasGarrisonSlime = state.slimes.some(s => s.id === n.garrisonSlimeId && s.lockedRole === 'garrison' && s.garrisonedAt === n.id);
        if (!hasGarrisonSlime) {
          nodesModified = true;
          return { ...n, garrisonSlimeId: null };
        }
      }
      return n;
    });

    if (slimesModified || nodesModified) {
      setState(prev => ({
        ...prev,
        slimes: slimesModified ? updatedSlimes : prev.slimes,
        planetRegion: prev.planetRegion ? {
          ...prev.planetRegion,
          nodes: updatedNodes
        } : null
      }));
    }
  }, [state.planetRegion?.nodes, state.slimes]);

  // Track the last processed cycle to apply the hardening bonus exactly once per cycle advancement
  const lastProcessedHardeningCycle = useRef<number>(state.cycle);

  useEffect(() => {
    if (state.cycle > lastProcessedHardeningCycle.current) {
      lastProcessedHardeningCycle.current = state.cycle;
      
      if (state.planetRegion) {
        const hardenedCapitols: string[] = [];
        state.planetRegion.nodes.forEach(node => {
          if (node.isCapitol && node.ownerColor) {
            const allNeighborsOwnedBySameColor = node.neighbors.every(neighborId => {
              const neighbor = state.planetRegion?.nodes.find(n => n.id === neighborId);
              return neighbor && neighbor.ownerColor === node.ownerColor;
            });
            if (allNeighborsOwnedBySameColor) {
              hardenedCapitols.push(node.name);
            }
          }
        });

        if (hardenedCapitols.length > 0) {
          const totalBonus = hardenedCapitols.length * 15; // 15 Credits per hardened capitol
          setState(prev => {
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return {
              ...prev,
              credits: prev.credits + totalBonus,
              logs: [
                ...prev.logs,
                {
                  id: `log_hardening_bonus_${Date.now()}`,
                  cycle: prev.cycle,
                  timestamp: timeStr,
                  text: `HARDENING BONUS: Capitol clusters hardened: [${hardenedCapitols.join(', ')}]. Earned extra +${totalBonus} Credits.`,
                  type: 'corporate'
                }
              ]
            };
          });
        }
      }
    } else if (state.cycle < lastProcessedHardeningCycle.current) {
      // Handle manual reset/new game
      lastProcessedHardeningCycle.current = state.cycle;
    }
  }, [state.cycle]);

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
            onClick={() => setResetConfirmOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 text-slate-400 hover:text-red-400 hover:bg-red-950/10 cursor-pointer text-xs font-mono uppercase tracking-wider transition-all duration-200"
            title="Reset Game (Wipe Save)"
          >
            <RefreshCw className="w-4 h-4 text-red-400" />
            <span>Reset</span>
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
            onClick={() => setActiveTab('lab')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3.5 text-xs font-bold font-mono uppercase tracking-wider rounded-lg cursor-pointer transition-all relative ${
              activeTab === 'lab' 
                ? 'bg-slate-800 text-white shadow' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Dna className="w-4 h-4" />
            <span>Lab</span>
            {state.contracts.length > 0 && (
              <span className="absolute top-2.5 right-2 w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
            )}
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
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping" />
            )}
            {state.activeDispatch && (
              <span className="absolute top-2.5 right-6 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            )}
          </button>
        </div>

        {/* Horizontal Sub-tab Rail */}
        <div className="flex flex-wrap items-center gap-1.5 border border-slate-800/80 bg-[#080d16]/60 p-1 rounded-xl w-full">
          {activeTab === 'lab' ? (
            <>
              <button
                onClick={() => setLabSubTab('collection')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  labSubTab === 'collection'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Collection</span>
              </button>
              <button
                onClick={() => setLabSubTab('breeding')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  labSubTab === 'breeding'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                }`}
              >
                <Dna className="w-3.5 h-3.5 text-purple-400" />
                <span>Splicing Lab</span>
              </button>
              <button
                onClick={() => setLabSubTab('slimedex')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  labSubTab === 'slimedex'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>SlimeDex</span>
              </button>
              <button
                onClick={() => setLabSubTab('upgrades')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  labSubTab === 'upgrades'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-yellow-400" />
                <span>Upgrades</span>
              </button>
              <button
                onClick={() => setLabSubTab('requisitions')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  labSubTab === 'requisitions'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                <span>Requisitions</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setPlanetSubTab('regions')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  planetSubTab === 'regions'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Planetary Map</span>
              </button>
              <button
                onClick={() => setPlanetSubTab('mediation')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer relative ${
                  planetSubTab === 'mediation'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-yellow-400" />
                <span>Mediation Portal</span>
                {state.activeMediation && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                )}
              </button>
              <button
                onClick={() => setPlanetSubTab('exploration')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer relative ${
                  planetSubTab === 'exploration'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                <span>Exploration Portal</span>
                {state.activeExploration && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </button>
              <button
                onClick={() => setPlanetSubTab('active')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer relative ${
                  planetSubTab === 'active'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-red-400" />
                <span>Active Deployment</span>
                {state.activeDispatch && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>
              <button
                onClick={() => setPlanetSubTab('zones')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  planetSubTab === 'zones'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                }`}
              >
                <Swords className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zones Board</span>
              </button>
            </>
          )}
        </div>

        {/* Active Tab Screen Component Panel */}
        <div className="border border-slate-800/80 rounded-xl bg-[#0c1220]/75 backdrop-blur-md p-6 flex-1 flex flex-col min-h-[480px]">
          <AnimatePresence mode="wait">
            {activeTab === 'lab' && (
              <LabTab
                key="tab_lab_comp"
                state={state}
                handleBuyUpgrade={handleBuyUpgrade}
                handlePurchaseSeedSlime={handlePurchaseSeedSlime}
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
                activeSubTab={labSubTab}
                setActiveSubTab={setLabSubTab}
                activeRegentPattern={activeRegentPattern}
                setActiveRegentPattern={setActiveRegentPattern}
                onBuyRegent={handleBuyRegent}
                activeRegentColor={activeRegentColor}
                setActiveRegentColor={setActiveRegentColor}
                onBuyColorRegent={handleBuyColorRegent}
                activeTargetRegent={activeTargetRegent}
                setActiveTargetRegent={setActiveTargetRegent}
                onBuyTargetRegent={handleBuyTargetRegent}
                handleToggleWorkerRole={handleToggleWorkerRole}
                handleDeliverContract={handleDeliverContract}
                handleSellOnMarket={handleSellOnMarket}
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
                selectedNodeId={selectedNodeId}
                setSelectedNodeId={setSelectedNodeId}
                setSelectedZoneId={setSelectedZoneId}
                setActiveTab={setActiveTab}
                selectedZoneId={selectedZoneId}
                dispatchDraftIds={dispatchDraftIds}
                setDispatchDraftIds={setDispatchDraftIds}
                realtimeRemainingMs={realtimeRemainingMs}
                activeDispatchReport={activeDispatchReport}
                setActiveDispatchReport={setActiveDispatchReport}
                handleLaunchDispatch={handleLaunchDispatch}
                handleRetrieveCompletedPod={handleRetrieveCompletedPod}
                handleAssignGarrison={handleAssignGarrison}
                handleRecallGarrison={handleRecallGarrison}
                handleForceClaim={handleForceClaim}
                handleBribeClaim={handleBribeClaim}
                handleConvertClaim={handleConvertClaim}
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

      {/* RESET GAME CONFIRMATION MODAL */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div 
            className="border border-red-500/30 bg-[#0c1220] rounded-xl p-6 max-w-md w-full space-y-4 shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
            
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-850">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Wipe Laboratory Records</h3>
              <button 
                onClick={() => setResetConfirmOpen(false)}
                className="ml-auto text-slate-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-normal font-mono">
              This action initiates a full system purge of the computer terminal. <span className="text-red-400 font-bold">ALL current progress, unlocked slimes, planetary sectors, and laboratory upgrades will be permanently deleted.</span>
            </p>

            <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg flex items-start space-x-2 text-[10px] font-mono text-red-300 leading-normal">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">DESTRUCTIVE TERMINAL RESET:</span> This procedure cannot be undone. The laboratory will restart with a fresh pair of starter specimens and default corporate grants.
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button 
                onClick={() => setResetConfirmOpen(false)}
                className="flex-1 py-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 font-mono text-xs uppercase cursor-pointer transition-colors"
              >
                Cancel Purge
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem(LOCAL_STORAGE_KEY);
                  window.location.reload();
                }}
                className="flex-1 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-[0_0_15px_rgba(239,68,68,0.25)] flex items-center justify-center space-x-1.5"
              >
                <span>Authorize Purge</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
