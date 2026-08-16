import { useState, useEffect } from 'react';
import type { GameRendererProps } from '../../engine/types';
import {
  GameState, MapCell, Corporation, WeeklyOrder, UnitTransit, UnitGroup,
  UnitType, GameEvent, CellCombatState, GameDate, CultureId
} from './types';
import { generateVoronoiMap } from './utils/mapGenerator';
import { resolveCellCombat } from '../../engine/shared/combat';
import { selectWeightedNeighbor } from './aiDecisions';
import { initializeFragments, onHouseEliminated } from './fragmentSystem';
import { checkEnding } from './endingSystem';

import BoardroomHeader from '../../engine/shared/components/BoardroomHeader';
import PlanetMap from '../../engine/shared/components/PlanetMap';
import WeeklyOrdersPanel from './components/WeeklyOrdersPanel';
import DailyEventModal from '../../engine/shared/components/DailyEventModal';
import CombatResolutionView from '../../engine/shared/components/CombatResolutionView';
import AnnualReportView from './components/AnnualReportView';
import AlertQueue from '../../engine/shared/components/AlertQueue';
import { AnimatePresence, motion } from 'framer-motion';
import './index.css';
import GuidedWalkthrough from './components/GuidedWalkthrough';
import OpeningSequence from './components/OpeningSequence';
import { HOUSE_DESCRIPTIONS, ENDING_TEXT } from './flavorText';
import { GameShell } from '../../components/GameShell';
import { TitleScreen } from '../../ui/components/TitleScreen';

import {
  Activity, Info, RefreshCw
} from 'lucide-react';

const PLAYER_CORP_ID = 'player-vanguard';

// Six Cultures, real hue-order wheel (OperatorGame_Vision.docx §8.3):
// Ember -> Marsh -> Gale -> Tundra -> Crystal -> Tide -> (back to Ember).
// This array's order IS the wheel order -- mapGenerator.ts's capital
// placement depends on the corps array it receives being in this exact
// cyclic sequence, so wheel-adjacency maps to map-adjacency.
const CULTURE_WHEEL = ['ember', 'marsh', 'gale', 'tundra', 'crystal', 'tide'] as const;

interface CultureDefinition {
  corpName: string;
  color: string;
  borderColor: string;
  bgClass: string;
  textClass: string;
}

// Naming/flavor only (per Phase 1's ⚠️ RULE) -- no stat or gameplay
// modifier is derived from culture identity anywhere in this phase.
// Colors follow a real, evenly-spaced hue wheel (0/60/120/180/240/300deg)
// in the same cyclic order as CULTURE_WHEEL.
const CULTURE_DEFINITIONS: Record<CultureId, CultureDefinition> = {
  ember: {
    corpName: 'Ember Ironworks',
    color: '#ef4444', // red — aggressive/industrial
    borderColor: '#dc2626',
    bgClass: 'bg-red-950/20',
    textClass: 'text-red-400'
  },
  marsh: {
    corpName: 'Marshveil Biotech',
    color: '#eab308', // amber/olive — tough, beloved wetlands
    borderColor: '#a16207',
    bgClass: 'bg-yellow-950/20',
    textClass: 'text-yellow-400'
  },
  gale: {
    corpName: 'Gale Vector Logistics',
    color: '#22c55e', // green — swift, elusive
    borderColor: '#15803d',
    bgClass: 'bg-green-950/20',
    textClass: 'text-green-400'
  },
  tundra: {
    corpName: 'Tundra Bastion Holdings',
    color: '#06b6d4', // cyan — immovable wall
    borderColor: '#0e7490',
    bgClass: 'bg-cyan-950/20',
    textClass: 'text-cyan-400'
  },
  crystal: {
    corpName: 'Crystal Lattice Consortium',
    color: '#6366f1', // indigo — wise defender
    borderColor: '#4338ca',
    bgClass: 'bg-indigo-950/20',
    textClass: 'text-indigo-400'
  },
  tide: {
    corpName: 'Tidewell Capital',
    color: '#d946ef', // fuchsia — charismatic/financial
    borderColor: '#a21caf',
    bgClass: 'bg-fuchsia-950/20',
    textClass: 'text-fuchsia-400'
  }
};

// Builds all six corporations, in wheel order, with identical starting
// treasury/garrison/combat strength -- only the player's chosen culture
// differs in which slot gets PLAYER_CORP_ID vs an `ai-{cultureId}` id.
function buildInitialCorporations(playerCultureId: CultureId): Corporation[] {
  return CULTURE_WHEEL.map((cultureId) => {
    const def = CULTURE_DEFINITIONS[cultureId];
    const isPlayer = cultureId === playerCultureId;
    return {
      id: isPlayer ? PLAYER_CORP_ID : `ai-${cultureId}`,
      name: def.corpName,
      color: def.color,
      borderColor: def.borderColor,
      bgClass: def.bgClass,
      textClass: def.textClass,
      isPlayer,
      cultureId,
      treasury: 100000,
      scoutedCells: {},
      rank: 1, // placeholder -- computeRank() sets this for real right after map generation
      fragments: [] // placeholder -- initializeFragments() sets this to [cultureId] right after
    };
  });
}

// Population Balance is read/written on a 0-100 scale, always clamped.
// `cell.publicOpinion` is optional at the type level only because
// mapGenerator.ts (read-only this phase) doesn't set it on cell literals --
// treat the fallback here as normalizing a real, already-50-defaulted
// value, not as a meaningful "missing data" case (see types.ts).
function applyPublicOpinionOffset(cell: MapCell, offset: number) {
  const current = cell.publicOpinion ?? 50;
  cell.publicOpinion = Math.max(0, Math.min(100, current + offset));
}

// Rank = Territory + Population Balance standing, computed fresh from real
// state -- not incrementally maintained. Mutates corp.rank in place on the
// corps array passed in, matching this file's existing convention for
// per-corp updates (e.g. generateAIWeeklyOrders' direct `corp.treasury -=`,
// `corp.scoutedCells[...] =`). Called only at real, distinct trigger points
// (Annual Report; post-combat displacement check) -- never continuously.
function computeRank(corps: Corporation[], cells: MapCell[]): void {
  const scores = corps.map(corp => {
    const ownedCells = cells.filter(c => c.ownerId === corp.id);
    const territory = ownedCells.length;
    const avgPublicOpinion = ownedCells.length > 0
      ? ownedCells.reduce((sum, c) => sum + (c.publicOpinion ?? 50), 0) / ownedCells.length
      : 50;
    // Placeholder weighting, tunable -- territory and standing both matter,
    // neither dominates by construction alone.
    return { corp, score: territory * 10 + avgPublicOpinion };
  });
  scores.sort((a, b) => b.score - a.score);
  scores.forEach((s, i) => { s.corp.rank = i + 1; });
}

// 5 Boardroom events templates
const EVENTS_TEMPLATES = [
  {
    title: "Labor Strike Contingency",
    description: "Union laborers in the assembly sectors are staging an unauthorized oxygen sit-in, halting production.",
    choices: [
      {
        text: "Appease Union Demands",
        cost: 20000,
        effectText: "Pay off union leadership. Production continues uninterrupted. (Cost: -$20,000)",
        action: (_state: GameState, _cellId: number) => ({
          log: `Negotiated resolution with labor union. Paid $20,000 corporate settlement.`,
          stateUpdates: { publicOpinionOffset: 5 }
        })
      },
      {
        text: "Authorize Security Enforcement",
        cost: 0,
        effectText: "Deploy security squads to clear the sit-in. Subdues workers, but damages infrastructure. (Sectors lose -1 Fortification)",
        action: (_state: GameState, _cellId: number) => ({
          log: `Deployed security personnel. Restored order by force, but local defensive shields degraded (-1 Fortification).`,
          stateUpdates: { fortificationOffset: -1, publicOpinionOffset: -10 }
        })
      },
      {
        text: "Impose Production Halt",
        cost: 0,
        effectText: "Ignore union sit-in. No cash cost, but sector production is stalled.",
        action: (_state: GameState, _cellId: number) => ({
          log: `Production locked down. Refused negotiation; local factory operations frozen.`,
          stateUpdates: { stallWeeks: 2, publicOpinionOffset: -2 }
        })
      }
    ]
  },
  {
    title: "Iridium Lode Discovered",
    description: "Deep sensor core scans have registered an extremely rich, untapped iridium pocket in local bedrock.",
    choices: [
      {
        text: "Settle Drilling Contracts",
        cost: 0,
        effectText: "Lease mineral excavation rights to private contractors. Gain $60,000 immediately.",
        action: (_state: GameState, _cellId: number) => ({
          log: `Executed drilling contracts. Deposited $60,000 iridium lease payment.`,
          stateUpdates: { treasuryOffset: 60000, publicOpinionOffset: 0 }
        })
      },
      {
        text: "In-House Deep-Core Strip Mining",
        cost: 0,
        effectText: "Excavate the vein immediately. Gain $100,000, but destabilizes local defenses (-1 Fortification level).",
        action: (_state: GameState, _cellId: number) => ({
          log: `Conducted strip mining operations. Generated $100,000 revenue, but structural damage reduced fortification levels.`,
          stateUpdates: { treasuryOffset: 100000, fortificationOffset: -1, publicOpinionOffset: -8 }
        })
      },
      {
        text: "Secure Strategic Reserves",
        cost: 10000,
        effectText: "Store iridium for local shield reinforcements. Cost: -$10,000. Adds +1 Fortification level.",
        action: (_state: GameState, _cellId: number) => ({
          log: `Fortified strategic iridium vaults. Spent $10,000 on shield alloy reinforcers.`,
          stateUpdates: { fortificationOffset: 1, publicOpinionOffset: 3 }
        })
      }
    ]
  },
  {
    title: "Rogue Drop Pod Landing",
    description: "An encrypted military-grade cargo capsule from the initial orbital crash has been located in the sector perimeter.",
    choices: [
      {
        text: "Send Retrieval Squad",
        cost: 10000,
        effectText: "Spend $10,000 to recover secure crates. Adds +1 Circle and +1 Square unit to local garrison.",
        action: (_state: GameState, _cellId: number) => ({
          log: `Secured drop pod crates. Recovered advanced combat components: +1 Circle and +1 Square added to garrison.`,
          stateUpdates: { unitsBonus: { circle: 1, square: 1, triangle: 0 }, publicOpinionOffset: 0 }
        })
      },
      {
        text: "Remote Detonate Payload",
        cost: 2000,
        effectText: "Spend $2,000 to detonate coordinates, denying assets to rivals. Adds +1 Fortification from scrap.",
        action: (_state: GameState, _cellId: number) => ({
          log: `Detonated capsule remotely. Recycled titanium shielding scrap into sector fortification (+1 Fortification).`,
          stateUpdates: { fortificationOffset: 1, publicOpinionOffset: 0 }
        })
      },
      {
        text: "Sell Pod GPS Coordinates",
        cost: 0,
        effectText: "Sell target coordinates to independent salvage freelancers. Gain $30,000.",
        action: (_state: GameState, _cellId: number) => ({
          log: `Coordinates sold. Credited $30,000 from salvage brokers.`,
          stateUpdates: { treasuryOffset: 30000, publicOpinionOffset: 0 }
        })
      }
    ]
  },
  {
    title: "Solar Flare Geomagnetic Storm",
    description: "An intense solar discharge is bombarding the planet's magnetosphere, inducing heavy telemetry static.",
    choices: [
      {
        text: "Acquire High-Orbit Satellite Shielding",
        cost: 15000,
        effectText: "Deploy satellite Faraday cages. Cost: -$15,000. Telemetry stays online.",
        action: (_state: GameState, _cellId: number) => ({
          log: `Faraday shields activated. Maintained complete telemetry feed.`,
          stateUpdates: { publicOpinionOffset: 2 }
        })
      },
      {
        text: "Accept Telemetry Glitch",
        cost: 0,
        effectText: "Accept temporary static. Free, but 1 random scouted sector is lost back to Fog of War.",
        action: (_state: GameState, _cellId: number) => ({
          log: `Telemetry blackout. Lost coordinates for 1 previously scouted sector due to solar noise.`,
          stateUpdates: { fogOfWarScoutReset: true, publicOpinionOffset: -2 }
        })
      }
    ]
  }
];

export default function App({ session: _session }: GameRendererProps) {
  const env = import.meta.env as Record<string, string | undefined>;
  const mode = env.VITE_STANDALONE === 'true' ? 'standalone' : 'arcade';
  const arcadeBaseUrl = env.VITE_ARCADE_BASE_URL;
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<number | null>(null);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showAnnualReport, setShowAnnualReport] = useState<boolean>(false);
  const [isPlanningPhase, setIsPlanningPhase] = useState<boolean>(true);
  // No saved game exists yet: the player must pick a culture (and therefore
  // their wheel slot / rival) before a new game initializes. Minimal
  // selection step -- see the render branch below.
  const [pendingCultureSelection, setPendingCultureSelection] = useState<boolean>(false);

  // Title screen: shown on first load. Dismissed when the player chooses
  // to start a new game or continue. Matches Dissonance's appPhase='title'.
  const [showTitleScreen, setShowTitleScreen] = useState<boolean>(true);

  // Opening sequence: fires ONLY on a genuinely new game, never on a
  // resumed/returning session. Matches KingMaker's confirmed mechanism:
  // handleStartNewCampaign sets showOpeningSequence=true, the continue
  // path sets it to false. Cleared after completion or skip.
  const [showOpeningSequence, setShowOpeningSequence] = useState<boolean>(false);

  // Load from local storage on startup if exists
  useEffect(() => {
    const saved = localStorage.getItem('corpworld_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Correct functions on choices need to be remapped if load from storage since they are omitted by JSON.stringify
        setGameState(rehydrateState(parsed));
        setSelectedCellId(parsed.selectedCellId ?? null);
        setIsPlanningPhase(parsed.isPlanningPhase ?? true);
        // Resuming an existing game: skip title and opening, go straight to game
        setShowTitleScreen(false);
        setShowOpeningSequence(false);
        return;
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
    // No saved game: show title screen first, then culture selection
    setShowTitleScreen(true);
  }, []);

  // Reset flow re-enters culture selection rather than assuming the
  // previous culture -- a real, deliberate choice each time, same as the
  // very first game.
  const handleRequestNewGame = () => {
    setGameState(null);
    setPendingCultureSelection(true);
    setShowOpeningSequence(false);
  };

  // Title screen actions: "New Campaign" triggers the opening sequence
  // (new-game-only), then proceeds to culture selection. "Continue"
  // loads saved state (handled by the useEffect above).
  const handleTitleNewGame = () => {
    setShowTitleScreen(false);
    setShowOpeningSequence(true);
  };

  const handleTitleContinue = () => {
    setShowTitleScreen(false);
    setShowOpeningSequence(false);
    // If there's a saved game, the useEffect already loaded it.
    // If not, fall through to culture selection.
    if (!gameState) {
      setPendingCultureSelection(true);
    }
  };

  const handleOpeningComplete = () => {
    setShowOpeningSequence(false);
    setPendingCultureSelection(true);
  };

  // Save to local storage on state change
  useEffect(() => {
    if (gameState) {
      const stateToSave = {
        ...gameState,
        currentActiveEvent: null, // never persisted — see Phase 2 fix
        isPlanningPhase,
        selectedCellId
      };
      localStorage.setItem('corpworld_state', JSON.stringify(stateToSave));
    }
  }, [gameState, isPlanningPhase, selectedCellId]);

  const initializeNewGame = (playerCultureId: CultureId) => {
    const freshCorps = buildInitialCorporations(playerCultureId);
    const freshCells = generateVoronoiMap(600, 600, 36, freshCorps);

    // Phase 3: each House starts holding exactly one Fragment -- its own
    // cultureId. Pure initialization, before any game state exists.
    initializeFragments(freshCorps);

    // Normalize Population Balance to a real, concrete 50 (neutral) on
    // every cell, including capitals -- mapGenerator.ts's cell literals
    // don't set this field (read-only this phase), so this is where the
    // "defaults to 50" guarantee actually becomes real game state.
    freshCells.forEach(cell => {
      cell.publicOpinion = 50;
    });

    // Initial scouted cells for corporations:
    // Mark capital cell and all immediate neighbors of capitals as scouted.
    for (const corp of freshCorps) {
      corp.scoutedCells = {};
      const capitalCell = freshCells.find(c => c.ownerId === corp.id);
      if (capitalCell) {
        corp.scoutedCells[capitalCell.id] = true;
        for (const neighId of capitalCell.neighbors) {
          corp.scoutedCells[neighId] = true;
        }
      }
    }

    // Real initial Rank, not a placeholder left dangling until the first
    // Annual Report.
    computeRank(freshCorps, freshCells);

    const initialDate: GameDate = { year: 1, month: 1, week: 1, day: 1 };

    const playerCorpName = freshCorps.find(c => c.id === PLAYER_CORP_ID)?.name ?? 'Player Corporation';
    const initialLog = {
      date: initialDate,
      message: `${playerCorpName} Pod landing confirmed. Grid operations initialized. Welcome to Sector Boardroom.`,
      type: 'success' as const
    };

    setGameState({
      date: initialDate,
      cells: freshCells,
      corporations: freshCorps,
      transits: [],
      playerOrders: {},
      isSimulating: false,
      simulationSpeed: 1,
      currentActiveEvent: null,
      eventHistory: [],
      combatHistory: [],
      activeCombatsToResolve: [],
      currentCombatInView: null,
      campaignOver: false,
      endingEvent: null,
      logs: [initialLog]
    });

    const capital = freshCells.find(c => c.ownerId === PLAYER_CORP_ID);
    if (capital) {
      setSelectedCellId(capital.id);
    }
    setIsPlanningPhase(true);
    setShowAnnualReport(false);
    setPendingCultureSelection(false);
  };

  const rehydrateState = (parsed: any): GameState => {
    // Phase 3 normalization: old saves (pre-Phase-3) have no `fragments` on
    // corps and no `endingEvent` on state. Default fragments to [cultureId]
    // (a fresh, un-eliminated House's natural starting state) and endingEvent
    // to null so loaded games don't crash on the new required fields. This is
    // a belt-and-suspenders migration step, not a gameplay change -- a real
    // Phase 3 game sets these correctly at initializeNewGame.
    const migratedCorps: Corporation[] = (parsed.corporations || []).map((c: any) => ({
      ...c,
      fragments: Array.isArray(c.fragments) ? c.fragments : [c.cultureId],
    }));
    return {
      ...parsed,
      corporations: migratedCorps,
      currentActiveEvent: null, // explicitly null out on load as second layer of defense
      endingEvent: parsed.endingEvent ?? null,
    } as GameState;
  };

  // Main simulation timer loop
  useEffect(() => {
    let timer: any;
    if (gameState && gameState.isSimulating && !isPlanningPhase && !gameState.currentActiveEvent && !gameState.currentCombatInView && !gameState.campaignOver) {
      // Speeds: 1x = 1500ms, 2x = 800ms, 4x = 350ms
      const speedMs = gameState.simulationSpeed === 4 ? 350 : gameState.simulationSpeed === 2 ? 800 : 1500;
      timer = setInterval(() => {
        advanceDay();
      }, speedMs);
    }
    return () => clearInterval(timer);
  }, [gameState?.isSimulating, isPlanningPhase, gameState?.currentActiveEvent, gameState?.currentCombatInView, gameState?.campaignOver, gameState?.simulationSpeed]);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', customDate?: GameDate) => {
    if (!gameState) return;
    const d = customDate || gameState.date;
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        logs: [{ date: d, message, type }, ...prev.logs].slice(0, 100) // keep last 100 logs
      };
    });
  };

  const handleTogglePlay = () => {
    if (!gameState) return;
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        isSimulating: !prev.isSimulating
      };
    });
  };

  const handleSetSpeed = (speed: number) => {
    if (!gameState) return;
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        simulationSpeed: speed,
        isSimulating: true // Auto start if changing speed
      };
    });
  };

  // Authorize Weekly Orders & End Planning Phase
  const handleEndPlanningPhase = () => {
    if (!gameState) return;

    // Apply corporate funds deduction for all player orders
    let totalOrderCost = 0;
    const playerCorp = gameState.corporations.find(c => c.id === PLAYER_CORP_ID)!;

    // Validate if player can afford these orders
    for (const cellId in gameState.playerOrders) {
      const cellOrders = gameState.playerOrders[Number(cellId)] || [];
      for (const order of cellOrders) {
        if (order.type === 'reinforce') totalOrderCost += 30000;
        if (order.type === 'fortify') totalOrderCost += 20000;
        if (order.type === 'scan') totalOrderCost += 5000;
        if (order.type === 'civic' && order.focus === 'defense') totalOrderCost += 10000;
        if (order.type === 'civic' && order.focus === 'unrest') totalOrderCost += 10000;
      }
    }

    if (playerCorp.treasury < totalOrderCost) {
      addLog(`Operational block: Cumulative weekly orders require $${totalOrderCost.toLocaleString()} but treasury holds only $${playerCorp.treasury.toLocaleString()}.`, 'error');
      return;
    }

    // Process orders
    const updatedCells = [...gameState.cells];
    const updatedCorps = [...gameState.corporations];
    const playerCorpIndex = updatedCorps.findIndex(c => c.id === PLAYER_CORP_ID);
    const updatedTransits = [...gameState.transits];

    // Deduct cost
    updatedCorps[playerCorpIndex].treasury -= totalOrderCost;

    for (const cellId in gameState.playerOrders) {
      const cellOrders = gameState.playerOrders[Number(cellId)] || [];
      const cellIndex = updatedCells.findIndex(c => c.id === Number(cellId));
      if (cellIndex === -1) continue;
      const cell = updatedCells[cellIndex];

      for (const order of cellOrders) {
        if (order.type === 'scan' && order.targetCellId !== undefined) {
          // Immediate fog lift
          updatedCorps[playerCorpIndex].scoutedCells[order.targetCellId] = true;
          // Lift fog for any adjacent cells of that target as well to expand scouting boundary
          const scannedCell = updatedCells.find(c => c.id === order.targetCellId);
          if (scannedCell) {
            scannedCell.neighbors.forEach(nid => {
              updatedCorps[playerCorpIndex].scoutedCells[nid] = true;
            });
          }
          addLog(`Deep scan completed successfully. Sector telemetry resolved for ${scannedCell?.name}.`, 'success');
        }

        if (order.type === 'expand' && order.targetCellId !== undefined && order.unitsSent) {
          // Deduct units from cell garrison
          updatedCells[cellIndex].units.circle -= order.unitsSent.circle;
          updatedCells[cellIndex].units.square -= order.unitsSent.square;
          updatedCells[cellIndex].units.triangle -= order.unitsSent.triangle;

          // Register Transit (Takes 4 days)
          const transitId = `transit-player-${cell.id}-${order.targetCellId}-${Date.now()}-${Math.random()}`;
          updatedTransits.push({
            id: transitId,
            corpId: PLAYER_CORP_ID,
            originCellId: cell.id,
            targetCellId: order.targetCellId,
            units: order.unitsSent,
            totalDays: 4,
            daysLeft: 4
          });
          addLog(`Expedition convoy authorized: Deploying ${order.unitsSent.circle + order.unitsSent.square + order.unitsSent.triangle} units from ${cell.name} to Sector ${updatedCells.find(c => c.id === order.targetCellId)?.name}.`, 'info');
        }

        if (order.type === 'reinforce' && order.reinforceType) {
          updatedCells[cellIndex].recruitmentQueue.push({ type: order.reinforceType, weeksLeft: 1 });
          addLog(`Priority assembly queue initialized for ${order.reinforceType.toUpperCase()} in ${cell.name}. Arrival in 1 week.`, 'info');
        }

        if (order.type === 'fortify') {
          updatedCells[cellIndex].fortification = Math.min(3, updatedCells[cellIndex].fortification + 1);
          addLog(`Shield structures reinforced to Level ${updatedCells[cellIndex].fortification} in ${cell.name}.`, 'success');
        }

        if (order.type === 'civic') {
          if (order.focus === 'defense') {
            updatedCells[cellIndex].fortification = Math.min(3, updatedCells[cellIndex].fortification + 1);
            // Population Balance: militarization unsettles civilians (-1).
            applyPublicOpinionOffset(updatedCells[cellIndex], -1);
            addLog(`Civic Defense Focus authorized in ${cell.name}: Shields increased to Level ${updatedCells[cellIndex].fortification}.`, 'success');
          } else if (order.focus === 'production') {
            // Population Balance: accelerated production strains workforce (-2).
            applyPublicOpinionOffset(updatedCells[cellIndex], -2);
            addLog(`Civic Production Focus authorized in ${cell.name}: Passive assembly line throughput accelerated.`, 'success');
          } else if (order.focus === 'unrest') {
            applyPublicOpinionOffset(updatedCells[cellIndex], 8);
            addLog(`Civic Unrest Focus authorized in ${cell.name}: Investment in the workforce lifts Population Balance to ${updatedCells[cellIndex].publicOpinion}.`, 'success');
          }
        }

        // Population Balance: military orders have real opinion costs.
        // Expand: conquered population is resentful (-3 on target cell).
        // Reinforce: conscription is unpopular (-1 on source cell).
        // Fortify: military buildup unsettles civilians (-1 on cell).
        if (order.type === 'expand' && order.targetCellId !== undefined) {
          const targetIdx = updatedCells.findIndex(c => c.id === order.targetCellId);
          if (targetIdx !== -1) {
            applyPublicOpinionOffset(updatedCells[targetIdx], -3);
          }
        }
        if (order.type === 'reinforce') {
          applyPublicOpinionOffset(updatedCells[cellIndex], -1);
        }
        if (order.type === 'fortify') {
          applyPublicOpinionOffset(updatedCells[cellIndex], -1);
        }
      }
    }

    // Generate AI Weekly Orders
    generateAIWeeklyOrders(updatedCells, updatedCorps, updatedTransits);

    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        cells: updatedCells,
        corporations: updatedCorps,
        transits: updatedTransits,
        isSimulating: true // automatically resume simulation when planning concludes
      };
    });

    setIsPlanningPhase(false);
    addLog(`Weekly planning finalized. Resuming simulation for Week ${gameState.date.week}.`, 'info');
  };

  const generateAIWeeklyOrders = (cells: MapCell[], corps: Corporation[], transits: UnitTransit[]) => {
    // Phase 3: lookup maps for the wheel-aware target selection. Built once
    // per call so selectWeightedNeighbor doesn't re-scan the arrays per cell.
    // The four-band probability roll (40/20/20/20) below is UNCHANGED --
    // only the *which neighbor* step inside the Expand branch is replaced.
    const cellsById: { [id: number]: MapCell } = {};
    for (const c of cells) cellsById[c.id] = c;
    const corpsById: { [id: string]: Corporation } = {};
    for (const c of corps) corpsById[c.id] = c;

    // Each AI corp reviews its controlled cells and makes a choice
    for (const corp of corps) {
      if (corp.id === PLAYER_CORP_ID) continue; // Skip player

      const ownedCells = cells.filter(c => c.ownerId === corp.id);
      if (ownedCells.length === 0) continue; // Wiped out

      for (const cell of ownedCells) {
        const totalUnits = cell.units.circle + cell.units.square + cell.units.triangle;

        // Random AI choice weights:
        // 40% chance Expand (if they have units)
        // 20% chance Reinforce (if treasury >= $30k)
        // 20% chance Fortify (if treasury >= $20k and fortification < 3)
        // 20% chance Idle/Hold
        const roll = Math.random();

        if (roll < 0.40 && totalUnits >= 2) {
          // AI Expand
          // Phase 3: wheel-aware weighted target selection (was uniform
          // random). Wheel-opposite-owned neighbors weighted 3, wheel-
          // adjacent-owned 1.5, baseline (neutral/non-rival/own) 1.
          // Weighted random, not deterministic -- avoids every AI House
          // behaving identically predictable every playthrough.
          const targetNeighId = selectWeightedNeighbor(corp, cell, cellsById, corpsById);
          if (targetNeighId === null) continue; // no neighbors, skip this cell
          const targetCell = cells.find(c => c.id === targetNeighId)!;

          // AI sends 1 or 2 units of random types
          const sendUnits: UnitGroup = { circle: 0, square: 0, triangle: 0 };
          let unitsAdded = 0;

          const unitTypes: UnitType[] = ['circle', 'square', 'triangle'];
          for (const type of unitTypes) {
            if (cell.units[type] > 0 && unitsAdded < 2) {
              sendUnits[type] = 1;
              cell.units[type]--;
              unitsAdded++;
            }
          }

          if (unitsAdded > 0) {
            transits.push({
              id: `transit-ai-${corp.id}-${cell.id}-${targetNeighId}-${Date.now()}`,
              corpId: corp.id,
              originCellId: cell.id,
              targetCellId: targetNeighId,
              units: sendUnits,
              totalDays: 4,
              daysLeft: 4
            });
            
            // AI also marks target cell as scouted
            corp.scoutedCells[targetNeighId] = true;
            targetCell.neighbors.forEach(nid => {
              corp.scoutedCells[nid] = true;
            });
          }
        } else if (roll < 0.60 && corp.treasury >= 30000) {
          // AI Reinforce
          corp.treasury -= 30000;
          // Queue reinforcement to spawn at end of week
          const type: UnitType = ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as UnitType;
          cell.recruitmentQueue.push({ type, weeksLeft: 1 });
        } else if (roll < 0.80 && corp.treasury >= 20000 && cell.fortification < 3) {
          // AI Fortify
          corp.treasury -= 20000;
          // Increment fortification at end of week
          cell.fortification = Math.min(3, cell.fortification + 1);
        } else {
          // AI Idle
          // Maintain garrison, progress passive production
        }
      }
    }
  };

  // Main advancement of time
  const advanceDay = () => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return null;

      const newDate = { ...prev.date };
      newDate.day += 1;

      let triggerEvent: GameEvent | null = null;
      let updatedLogs = [...prev.logs];

      const updatedTransits = prev.transits.map(t => {
        return {
          ...t,
          daysLeft: Math.max(0, t.daysLeft - 1)
        };
      });

      // Filter transits that arrived today (daysLeft === 0)
      const arrivedTransits = updatedTransits.filter(t => t.daysLeft === 0);
      const remainingTransits = updatedTransits.filter(t => t.daysLeft > 0);

      // Clone corporations early to allow updating scoutedCells during instant capture
      const updatedCorps = prev.corporations.map(c => ({
        ...c,
        scoutedCells: { ...c.scoutedCells }
      }));

      // Keep track of transits consumed by instant captures
      const instantCapturedTransitIds = new Set<string>();

      // Apply arrived transits to cells' garrisons/occupations
      const updatedCells = prev.cells.map(cell => {
        const matchingArrivals = arrivedTransits.filter(t => t.targetCellId === cell.id);
        if (matchingArrivals.length === 0) return cell;

        const newUnits = { ...cell.units };
        
        if (cell.ownerId === null) {
          const arrivingCorpIds = new Set(matchingArrivals.map(a => a.corpId));
          if (arrivingCorpIds.size === 1) {
            // Uncontested neutral claim — capture NOW, not at Month-End.
            const corpId = [...arrivingCorpIds][0];
            
            // Merge all arrived units
            matchingArrivals.forEach(arr => {
              newUnits.circle += arr.units.circle;
              newUnits.square += arr.units.square;
              newUnits.triangle += arr.units.triangle;
              instantCapturedTransitIds.add(arr.id);
            });

            // Mark cell + its neighbors scouted for the new owner
            const corpIdx = updatedCorps.findIndex(c => c.id === corpId);
            if (corpIdx !== -1) {
              updatedCorps[corpIdx].scoutedCells[cell.id] = true;
              for (const nid of cell.neighbors) {
                updatedCorps[corpIdx].scoutedCells[nid] = true;
              }
              
              // Add boarding alert log for instant neutral claim
              updatedLogs = [{
                date: newDate,
                message: `SEC-OP: ${updatedCorps[corpIdx].name} secured uncontested neutral sector ${cell.name}.`,
                type: 'success' as const
              }, ...updatedLogs];
            }

            return {
              ...cell,
              ownerId: corpId,
              units: newUnits
            };
          }
          // If arrivingCorpIds.size > 1, this IS a real dispute — leave it in
          // the existing Month-End contested flow, unchanged.
        }

        matchingArrivals.forEach(arr => {
          // If the arrived unit belongs to the cell's owner, they merge with garrison!
          if (arr.corpId === cell.ownerId) {
            newUnits.circle += arr.units.circle;
            newUnits.square += arr.units.square;
            newUnits.triangle += arr.units.triangle;
          }
        });

        return {
          ...cell,
          units: newUnits
        };
      });

      // Re-add arrived transits that are from other corps (invaders) or neutral claims
      // BUT exclude transits that were consumed by instant capture!
      const activeInvaders = arrivedTransits.filter(t => 
        !instantCapturedTransitIds.has(t.id) &&
        t.corpId !== updatedCells.find(c => c.id === t.targetCellId)?.ownerId
      );
      const finalTransits = [...remainingTransits, ...activeInvaders];

      // Random Event Chance!
      // Occurs on Days 2 to 6 with a 12% probability. (Avoid Day 1 which triggers planning, and Day 7 which ends the week).
      if (newDate.day >= 2 && newDate.day <= 6 && Math.random() < 0.12) {
        // Find a random cell owned by the player to anchor the event
        const playerCells = updatedCells.filter(c => c.ownerId === PLAYER_CORP_ID);
        if (playerCells.length > 0) {
          const anchorCell = playerCells[Math.floor(Math.random() * playerCells.length)];
          const template = EVENTS_TEMPLATES[Math.floor(Math.random() * EVENTS_TEMPLATES.length)];
          
          triggerEvent = {
            id: `event-${Date.now()}`,
            title: template.title,
            description: template.description.replace('local', anchorCell.name).replace('assembly sectors', anchorCell.name),
            targetCellId: anchorCell.id,
            choices: template.choices.map(c => ({
              text: c.text,
              cost: c.cost,
              effectText: c.effectText,
              action: c.action
            }))
          };
        }
      }

      // Transition Weekly?
      let mustPauseForPlanning = false;
      let monthEndCombatsToResolve: number[] = [];
      let isCampaignOver = prev.campaignOver;
      let isCampaignOverWithElimination = prev.campaignOver;

      if (newDate.day > 7) {
        newDate.day = 1;
        newDate.week += 1;

        // Process Week-End Recruitment and passive production
        updatedCells.forEach(cell => {
          // 1. Process Recruitment Queue (Reinforce order arrivals)
          cell.recruitmentQueue = cell.recruitmentQueue.map(item => {
            return {
              ...item,
              weeksLeft: item.weeksLeft - 1
            };
          });

          const completedRecruits = cell.recruitmentQueue.filter(item => item.weeksLeft <= 0);
          cell.recruitmentQueue = cell.recruitmentQueue.filter(item => item.weeksLeft > 0);

          completedRecruits.forEach(r => {
            cell.units[r.type] += 1;
          });

          // 2. Passive unit production: 1 unit every 2 weeks (accelerated by Civic Production Focus)
          if (cell.ownerId) {
            const cellOrders = prev.playerOrders[cell.id] || [];
            const hasProductionCivic = cell.ownerId === PLAYER_CORP_ID && cellOrders.some(o => o.type === 'civic' && o.focus === 'production');

            cell.productionProgress += hasProductionCivic ? 2 : 1;
            if (cell.productionProgress >= 2) {
              cell.units[cell.preferredProduction] += 1;
              cell.productionProgress = 0; // reset progress
            }
          }
        });

        // 3. Collect Weekly Profit: each controlled cell generates $10,000 to owner
        updatedCells.forEach(cell => {
          if (cell.ownerId) {
            const ownerIdx = updatedCorps.findIndex(c => c.id === cell.ownerId);
            if (ownerIdx !== -1) {
              // Population Balance consequence: cells with opinion <30 produce
              // no income (workforce strike). Real consequence, not just a
              // number that affects rank.
              if ((cell.publicOpinion ?? 50) >= 30) {
                updatedCorps[ownerIdx].treasury += 10000;
              }
            }
          }
        });

        // 4. Population Balance passive erosion: cells drift toward 50
        // (neutral) by 1 per week unless actively maintained. This makes
        // Population Balance a living system — investment via Civic Unrest
        // Focus is needed to keep it high, not a one-time boost.
        updatedCells.forEach(cell => {
          const current = cell.publicOpinion ?? 50;
          if (current > 50) {
            cell.publicOpinion = current - 1;
          } else if (current < 50) {
            cell.publicOpinion = current + 1;
          }
        });

        // Check if Month Ended!
        if (newDate.week > 4) {
          newDate.week = 1;
          newDate.month += 1;

          // Process Month-End Combat Check!
          // Find any cells that have invaders (transits with daysLeft === 0 ending at cell where corpId !== cell.ownerId,
          // or multiple corporations holding arrived units in a neutral cell).
          const contestedCellIds = new Set<number>();
          
          updatedCells.forEach(cell => {
            const cellInvaders = finalTransits.filter(t => t.targetCellId === cell.id && t.daysLeft === 0);
            
            if (cell.ownerId) {
              // Cell is owned. If any invader of different corp has arrived, it's contested!
              const alienInvaders = cellInvaders.filter(t => t.corpId !== cell.ownerId);
              if (alienInvaders.length > 0) {
                contestedCellIds.add(cell.id);
              }
            } else {
              // Neutral cell. If units from multiple corps have arrived, or even 1 corp has arrived,
              // it needs to be resolved! (If only 1 corp arrived, they easily capture it. If multiple corps arrived, they fight).
              if (cellInvaders.length > 0) {
                contestedCellIds.add(cell.id);
              }
            }
          });

          monthEndCombatsToResolve = Array.from(contestedCellIds);

          // Check if Year Ended!
          if (newDate.month > 12) {
            newDate.month = 1;
            newDate.year += 1;
          }
        }

        // Check if Campaign Over
        // Campaign completes at the end of Year 3 (meaning Year 4, Month 1, Week 1, Day 1 is reached)
        isCampaignOver = prev.campaignOver;
        if (newDate.year >= 4) {
          isCampaignOver = true;
          prev.isSimulating = false;
        }

        // Trigger Planning phase unless campaign is over
        if (!isCampaignOver) {
          mustPauseForPlanning = true;
        }
      }

      // Check if Player is Eliminated (owns 0 cells)
      const playerControlledCount = updatedCells.filter(c => c.ownerId === PLAYER_CORP_ID).length;
      isCampaignOverWithElimination = prev.campaignOver;
      if (playerControlledCount === 0 && !prev.campaignOver) {
        isCampaignOverWithElimination = true;
        prev.isSimulating = false;
      }

      // Assemble next logs or state
      if (triggerEvent) {
        updatedLogs = [{
          date: newDate,
          message: `URGENT BOARDROOM ALERT: ${triggerEvent.title} initiated. Simulation paused.`,
          type: 'warning' as const
        }, ...updatedLogs];
      }

      if (mustPauseForPlanning && !triggerEvent && !isCampaignOverWithElimination) {
        updatedLogs = [{
          date: newDate,
          message: `Weekly Epoch complete. Initializing strategic Planning Phase for Week ${newDate.week}.`,
          type: 'info' as const
        }, ...updatedLogs];
      }

      // If Month-End conflicts exist, we generate the combat logs
      let activeCombats: CellCombatState[] = [];
      let currentCombatView: CellCombatState | null = null;
      
      if (monthEndCombatsToResolve.length > 0) {
        // Generate battles
        activeCombats = monthEndCombatsToResolve.map(cellId => {
          const cell = updatedCells.find(c => c.id === cellId)!;
          
          // Assemble all initial forces
          const combatInitialForces: { [corpId: string]: UnitGroup } = {};
          
          // Original owner's garrison (if any)
          if (cell.ownerId) {
            combatInitialForces[cell.ownerId] = { ...cell.units };
          }
          
          // Transiting invaders
          const cellInvaders = finalTransits.filter(t => t.targetCellId === cellId && t.daysLeft === 0);
          cellInvaders.forEach(inv => {
            if (!combatInitialForces[inv.corpId]) {
              combatInitialForces[inv.corpId] = { circle: 0, square: 0, triangle: 0 };
            }
            combatInitialForces[inv.corpId].circle += inv.units.circle;
            combatInitialForces[inv.corpId].square += inv.units.square;
            combatInitialForces[inv.corpId].triangle += inv.units.triangle;
          });

          // Corp Name map
          const corpNames: { [corpId: string]: string } = {};
          updatedCorps.forEach(c => { corpNames[c.id] = c.name; });

          return resolveCellCombat(
            cellId,
            cell.name,
            combatInitialForces,
            cell.ownerId,
            cell.fortification,
            corpNames
          );
        });

        currentCombatView = activeCombats[0];
        prev.isSimulating = false; // Pause simulation during combat
      }

      // Check if we should auto-trigger the annual report view if year ticked up (and no combat)
      const yearTickReport = newDate.week === 1 && newDate.day === 1 && newDate.month === 1 && newDate.year > prev.date.year && monthEndCombatsToResolve.length === 0;
      if (yearTickReport) {
        setShowAnnualReport(true);
        prev.isSimulating = false;
      }

      if (isCampaignOverWithElimination) {
        setShowAnnualReport(true);
      }

      // Rank recompute trigger 1 of 2: Annual Report -- full recompute,
      // general growth (territory + Population Balance) reflected, any
      // time the report is about to be shown.
      if (yearTickReport || isCampaignOverWithElimination) {
        computeRank(updatedCorps, updatedCells);
      }

      // Phase 3: Rank-1 ending check at every Annual Report (not only the
      // campaign-final). Runs AFTER computeRank so ranks are fresh. Only
      // the PLAYER reaching Rank 1 fires; an AI at Rank 1 does not. If it
      // fires, halt further cycling (campaignOver) and store the payload.
      let endingEvent = prev.endingEvent;
      if ((yearTickReport || isCampaignOverWithElimination) && !prev.endingEvent) {
        const ending = checkEnding(updatedCorps, PLAYER_CORP_ID);
        if (ending) {
          endingEvent = ending;
          isCampaignOver = true;
          prev.isSimulating = false;
          updatedLogs = [{
            date: newDate,
            message: `ENDING TRIGGERED: Rank 1 reached. Fragment count: ${ending.fragmentCount}/${ending.total}.`,
            type: 'success' as const
          }, ...updatedLogs];
        }
      }

      // Reset player orders dict for the new week
      let nextPlayerOrders = prev.playerOrders;
      if (mustPauseForPlanning) {
        nextPlayerOrders = {};
        setIsPlanningPhase(true);
        prev.isSimulating = false; // Pause during planning phase
      }

      return {
        ...prev,
        date: newDate,
        cells: updatedCells,
        corporations: updatedCorps,
        transits: finalTransits,
        playerOrders: nextPlayerOrders,
        currentActiveEvent: triggerEvent,
        activeCombatsToResolve: monthEndCombatsToResolve,
        currentCombatInView: currentCombatView,
        campaignOver: isCampaignOver || isCampaignOverWithElimination,
        endingEvent,
        logs: updatedLogs
      };
    });
  };

  // Resolve a choice from a daily boardroom event
  const handleSelectChoice = (choiceIdx: number) => {
    if (!gameState || !gameState.currentActiveEvent) return;

    const event = gameState.currentActiveEvent;
    const choice = event.choices[choiceIdx];
    const cellId = event.targetCellId;

    const updatedCells = [...gameState.cells];
    const updatedCorps = [...gameState.corporations];
    
    const playerCorpIndex = updatedCorps.findIndex(c => c.id === PLAYER_CORP_ID);
    const cellIndex = updatedCells.findIndex(c => c.id === cellId);

    // Apply corporate funds deduction
    updatedCorps[playerCorpIndex].treasury -= choice.cost;

    // Run custom action
    const actionResult = choice.action(gameState, cellId);

    // Process state updates returned by action
    const updates = actionResult.stateUpdates;
    
    if (updates.treasuryOffset) {
      updatedCorps[playerCorpIndex].treasury += updates.treasuryOffset;
    }

    if (updates.fortificationOffset && cellIndex !== -1) {
      updatedCells[cellIndex].fortification = Math.max(0, Math.min(3, updatedCells[cellIndex].fortification + updates.fortificationOffset));
    }

    if (updates.publicOpinionOffset && cellIndex !== -1) {
      applyPublicOpinionOffset(updatedCells[cellIndex], updates.publicOpinionOffset);
    }

    if (updates.unitsBonus && cellIndex !== -1) {
      updatedCells[cellIndex].units.circle += updates.unitsBonus.circle;
      updatedCells[cellIndex].units.square += updates.unitsBonus.square;
      updatedCells[cellIndex].units.triangle += updates.unitsBonus.triangle;
    }

    if (updates.fogOfWarScoutReset) {
      // Find a random scouted cell and hide it
      const scoutedIds = Object.keys(updatedCorps[playerCorpIndex].scoutedCells).map(Number);
      // Ensure we don't hide player owned cells
      const playerOwnedIds = updatedCells.filter(c => c.ownerId === PLAYER_CORP_ID).map(c => c.id);
      const candidates = scoutedIds.filter(id => !playerOwnedIds.includes(id));
      if (candidates.length > 0) {
        const targetToReset = candidates[Math.floor(Math.random() * candidates.length)];
        delete updatedCorps[playerCorpIndex].scoutedCells[targetToReset];
      }
    }

    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        cells: updatedCells,
        corporations: updatedCorps,
        currentActiveEvent: null,
        eventHistory: [...prev.eventHistory, { date: prev.date, title: event.title, resolution: choice.text }]
      };
    });

    addLog(`Dilemma resolved: ${actionResult.log}`, 'success');
  };

  // Conclude Monthly Conflicts in Combat view
  const handleConcludeCombats = (results: { [cellId: number]: CellCombatState }) => {
    if (!gameState) return;

    const updatedCells = [...gameState.cells];
    let updatedTransits = [...gameState.transits];
    const updatedCorps = [...gameState.corporations];
    // Targeted displacement: real trigger off the real combat result below,
    // no separate system. Ranks compared here are the CURRENT ones (as of
    // the last Annual Report or previous displacement), captured before any
    // recompute happens in this batch -- consistent across every battle
    // concluded in the same call, not chained against each other.
    let displacementFired = false;
    const displacementMessages: string[] = [];

    // Phase 3: elimination detection + Fragment transfer. Track each corp's
    // running cell count as battles are resolved in this batch. When a corp
    // hits 0 cells, the eliminator is the victor of the battle that brought
    // the count to 0 (the clean, single-attributable-House case from the
    // directive). If that final battle was mutual destruction (no victor),
    // fall back to the most recent victor that took a cell from this corp in
    // the same batch (flagged in the log); if there was none, fragments are
    // lost (also flagged) -- rare edge case, not silently invented.
    const runningCellCount: { [corpId: string]: number } = {};
    for (const corp of updatedCorps) {
      runningCellCount[corp.id] = updatedCells.filter(c => c.ownerId === corp.id).length;
    }
    const lastVictorTookFrom: { [corpId: string]: string | null } = {};
    const eliminations: { eliminatedId: string; eliminatorId: string | null }[] = [];

    for (const cellIdStr in results) {
      const cellId = Number(cellIdStr);
      const battle = results[cellId];
      const cellIndex = updatedCells.findIndex(c => c.id === cellId);
      const cell = updatedCells[cellIndex];
      const previousOwnerId = cell.ownerId; // capture BEFORE mutating below

      // Update Owner and survivors
      if (battle.victorId) {
        // Targeted displacement check: did the victor just take this cell
        // from the corp CURRENTLY ranked directly above them?
        if (previousOwnerId && previousOwnerId !== battle.victorId) {
          const victorCorp = updatedCorps.find(c => c.id === battle.victorId);
          const defeatedCorp = updatedCorps.find(c => c.id === previousOwnerId);
          if (victorCorp && defeatedCorp && victorCorp.rank === defeatedCorp.rank + 1) {
            displacementFired = true;
            displacementMessages.push(
              `House ${victorCorp.name} displaces House ${defeatedCorp.name} — Rank ${defeatedCorp.rank} claimed by force.`
            );
          }
        }

        // Phase 3: track cell-loss attribution for elimination detection.
        // The previous owner lost this cell to the victor.
        if (previousOwnerId && previousOwnerId !== battle.victorId) {
          lastVictorTookFrom[previousOwnerId] = battle.victorId;
        }

        cell.ownerId = battle.victorId;
        cell.units = { ...battle.finalUnits[battle.victorId] };

        // Decrease fortifications by lost points
        cell.fortification = Math.max(0, cell.fortification - battle.fortificationsLost);

        // Mark this cell as scouted for the victor
        const victorIdx = updatedCorps.findIndex(c => c.id === battle.victorId);
        if (victorIdx !== -1) {
          updatedCorps[victorIdx].scoutedCells[cell.id] = true;
          cell.neighbors.forEach(nid => {
            updatedCorps[victorIdx].scoutedCells[nid] = true;
          });
        }

        addLog(`Conflict Resolved in ${cell.name}: ${updatedCorps.find(c => c.id === battle.victorId)?.name} secures control.`, 'success');
      } else {
        // Mutual destruction
        cell.ownerId = null;
        cell.units = { circle: 0, square: 0, triangle: 0 };
        cell.fortification = 0;
        addLog(`Conflict Resolved in ${cell.name}: Complete garrison annihilation. Sector reverts to Neutral.`, 'warning');
      }

      // Population Balance: combat damages public opinion on this cell (-5).
      // Violence is bad for civilian morale, regardless of who wins.
      applyPublicOpinionOffset(cell, -5);

      // Phase 3: update running cell counts and detect eliminations. The
      // previous owner lost this cell (to a victor or to mutual destruction).
      if (previousOwnerId && previousOwnerId !== cell.ownerId) {
        runningCellCount[previousOwnerId] = (runningCellCount[previousOwnerId] || 0) - 1;
        if (runningCellCount[previousOwnerId] <= 0) {
          // This corp just hit 0 cells -- eliminated. Eliminator is the
          // victor of THIS battle if there is one; otherwise fall back to
          // the last victor that took a cell from them this batch.
          const eliminatorId = battle.victorId ?? lastVictorTookFrom[previousOwnerId] ?? null;
          eliminations.push({ eliminatedId: previousOwnerId, eliminatorId });
        }
      }

      // Remove arrived transits that participated in this battle
      updatedTransits = updatedTransits.filter(t => !(t.targetCellId === cellId && t.daysLeft === 0));
    }

    // Phase 3: process eliminations -- transfer Fragments from each
    // eliminated House to its eliminator. Pure transfer logic lives in
    // fragmentSystem.onHouseEliminated; attribution is done above.
    for (const { eliminatedId, eliminatorId } of eliminations) {
      const eliminatedCorp = updatedCorps.find(c => c.id === eliminatedId);
      if (!eliminatedCorp) continue;
      if (eliminatorId) {
        const eliminatorCorp = updatedCorps.find(c => c.id === eliminatorId);
        if (eliminatorCorp) {
          const transferredCount = eliminatedCorp.fragments.length;
          onHouseEliminated(eliminatedCorp, eliminatorCorp);
          addLog(
            `House ${eliminatorCorp.name} eliminated House ${eliminatedCorp.name} — inherited ${transferredCount} Fragment${transferredCount === 1 ? '' : 's'}. (Total held: ${eliminatorCorp.fragments.length}/6)`,
            'warning'
          );
        }
      } else {
        // Edge case: eliminated by mutual destruction with no prior victor
        // in this batch. Fragments are lost, not transferred. Flagged, not
        // silently invented -- the directive says report rather than guess.
        addLog(
          `House ${eliminatedCorp.name} was annihilated with no attributable eliminator — Fragments lost (${eliminatedCorp.fragments.length}).`,
          'error'
        );
        eliminatedCorp.fragments = [];
      }
    }

    // Rank recompute trigger 2 of 2: immediate, but ONLY on a real
    // displacement -- not on every combat. Logged explicitly, not silently
    // folded into the routine "Conflict Resolved" lines above.
    if (displacementFired) {
      computeRank(updatedCorps, updatedCells);
      displacementMessages.forEach(msg => addLog(msg, 'warning'));
    }

    setGameState(prev => {
      if (!prev) return null;
      
      const newCombatHistory = Object.values(results).map(log => ({
        date: prev.date,
        cellId: log.cellId,
        cellName: log.cellName,
        victorId: log.victorId,
        log
      }));

      return {
        ...prev,
        cells: updatedCells,
        transits: updatedTransits,
        corporations: updatedCorps,
        currentCombatInView: null,
        activeCombatsToResolve: [],
        combatHistory: [...prev.combatHistory, ...newCombatHistory]
      };
    });

    if (gameState.campaignOver) {
      // Annual Report trigger, same as advanceDay's -- full recompute
      // whenever the report is about to be shown, on top of any
      // displacement recompute already applied above.
      computeRank(updatedCorps, updatedCells);
      // Phase 3: Rank-1 ending check, same as advanceDay's Annual Report
      // path. Only fires for the PLAYER reaching Rank 1. If it fires,
      // store the payload and halt cycling (campaignOver already true here,
      // but endingEvent must be set on state for the placeholder screen).
      const ending = checkEnding(updatedCorps, PLAYER_CORP_ID);
      if (ending) {
        setGameState(prev => prev ? { ...prev, endingEvent: ending, corporations: updatedCorps } : null);
        addLog(
          `ENDING TRIGGERED: Rank 1 reached. Fragment count: ${ending.fragmentCount}/${ending.total}.`,
          'success'
        );
      }
      setShowAnnualReport(true);
    }
  };

  // Manage planning order saving
  const handleSaveOrders = (cellId: number, orders: WeeklyOrder[]) => {
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        playerOrders: {
          ...prev.playerOrders,
          [cellId]: orders
        }
      };
    });
    
    // Log saving feedback
    const cell = gameState?.cells.find(c => c.id === cellId);
    let message = `Garrison directives updated for ${cell?.name}.`;
    addLog(message, 'info');
  };

  const handleManualAdvanceDay = () => {
    if (isPlanningPhase) {
      addLog('Cannot advance days manually. Planning directives must be authorized first.', 'warning');
      return;
    }
    advanceDay();
  };

  // Title screen: shown on first load, before any game state exists.
  // Matches Dissonance's TitlePhase and Shoal's TitleScreen usage.
  if (showTitleScreen) {
    return (
      <GameShell gameLabel="Planet of Greed" gameId="planetofgreed" phase="Chapter 1" mode={mode} arcadeBaseUrl={arcadeBaseUrl}>
        <TitleScreen
          title="Planet of Greed"
          tagline="Six Houses. One Engine. One winner."
          pitch="Genesis Ore runs through the planet's crust. Six Houses race to finish the Seed Engine first. Your rival is already chosen — by the wheel, not by chance."
          menuItems={[
            { id: 'new-game', label: 'New Campaign', variant: 'primary', onClick: handleTitleNewGame },
            { id: 'continue', label: 'Continue', variant: 'secondary', onClick: handleTitleContinue, disabled: !gameState },
          ]}
        />
      </GameShell>
    );
  }

  // Opening sequence: fires ONLY on a genuinely new game, never on resume.
  // Matches KingMaker's confirmed new-game-only mechanism.
  if (showOpeningSequence) {
    return (
      <GameShell gameLabel="Planet of Greed" gameId="planetofgreed" phase="Chapter 1" mode={mode} arcadeBaseUrl={arcadeBaseUrl}>
        <OpeningSequence onComplete={handleOpeningComplete} />
      </GameShell>
    );
  }

  // Minimal culture selection step: a real choice, not elaborate this
  // phase. Determines which of the six wheel slots (and therefore which
  // wheel-opposite rival) the player gets.
  if (pendingCultureSelection) {
    return (
      <GameShell gameLabel="Planet of Greed" gameId="planetofgreed" phase="Chapter 1" mode={mode} arcadeBaseUrl={arcadeBaseUrl}>
        <div className="min-h-screen bg-[#1a1a2e] text-amber-50 font-sans flex flex-col justify-center items-center gap-6 p-6 select-none">
          <div className="text-center">
            <h1 className="text-2xl font-bold uppercase tracking-tight text-amber-200">Choose Your House</h1>
            <p className="text-xs text-amber-100/70 font-serif italic mt-1">
              Six Houses share the wheel. Your wheel-opposite rival starts as far from you as the map allows.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl w-full">
            {CULTURE_WHEEL.map((cultureId) => {
              const def = CULTURE_DEFINITIONS[cultureId];
            return (
              <button
                key={cultureId}
                id={`btn-select-culture-${cultureId}`}
                data-testid={`pog-culture-${cultureId}`}
                onClick={() => initializeNewGame(cultureId)}
                className="border-2 border-amber-600/40 bg-[#0f0f1a] p-4 flex flex-col items-center gap-2 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
              >
                <span
                  className="w-6 h-6 rounded-full border border-amber-600/40"
                  style={{ backgroundColor: def.color }}
                />
                <span className="font-bold uppercase text-xs tracking-wide text-amber-200">{cultureId}</span>
                <span className="text-[10px] font-mono text-amber-100/70 text-center">{def.corpName}</span>
                <span className="text-[9px] font-serif italic text-amber-100/60 text-center leading-snug mt-1">{HOUSE_DESCRIPTIONS[cultureId]}</span>
              </button>
            );
          })}
        </div>
        </div>
      </GameShell>
    );
  }

  if (!gameState) {
    return (
      <GameShell gameLabel="Planet of Greed" gameId="planetofgreed" phase="Chapter 1" mode={mode} arcadeBaseUrl={arcadeBaseUrl}>
        <div className="min-h-screen bg-[#1a1a2e] flex flex-col justify-center items-center text-amber-100 font-mono gap-3 select-none">
          <RefreshCw className="w-10 h-10 text-amber-400 animate-spin" />
          <span className="font-bold">BOOTING PLANET OF GREED EXECUTIVE TERMINAL...</span>
        </div>
      </GameShell>
    );
  }

  const playerCorp = gameState.corporations.find(c => c.id === PLAYER_CORP_ID)!;
  const playerControlledCellsCount = gameState.cells.filter(c => c.ownerId === PLAYER_CORP_ID).length;
  const selectedCell = gameState.cells.find(c => c.id === selectedCellId) || null;
  const currentOrders = selectedCellId !== null ? (gameState.playerOrders[selectedCellId] || []) : [];

  const pendingOrdersCount = isPlanningPhase
    ? gameState.cells.filter(c => c.ownerId === PLAYER_CORP_ID && (!gameState.playerOrders[c.id] || gameState.playerOrders[c.id].length === 0)).length
    : 0;

  return (
    <GameShell gameLabel="Planet of Greed" gameId="planetofgreed" phase="Chapter 1" mode={mode} arcadeBaseUrl={arcadeBaseUrl}>
    <div className="min-h-screen bg-[#1a1a2e] text-amber-50 font-sans flex flex-col relative overflow-x-hidden">

      {/* HEADER SECTION */}
      <BoardroomHeader
        date={gameState.date}
        playerCorp={playerCorp}
        controlledCellsCount={playerControlledCellsCount}
        totalCellsCount={gameState.cells.length}
        isSimulating={gameState.isSimulating}
        simulationSpeed={gameState.simulationSpeed}
        onTogglePlay={handleTogglePlay}
        onSetSpeed={handleSetSpeed}
        onNextDay={handleManualAdvanceDay}
        onResetGame={handleRequestNewGame}
        showHelp={() => setShowHelpModal(true)}
        corporations={gameState.corporations}
        cells={gameState.cells}
      />

      {/* MAIN BOARDROOM CODESPACE WITH XCOM-STYLE TACTICAL TRANSITION */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <AnimatePresence mode="wait">
          {gameState.currentCombatInView ? (
            /* SPECIAL LAYER: MONTH-END COMBAT EXECUTOR */
            <motion.div
              key="combat-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex-1 p-6 flex flex-col justify-center items-center overflow-y-auto"
            >
              <CombatResolutionView
                combats={gameState.activeCombatsToResolve.map(cellId => {
                  // Retrieve precalculated combat logs
                  // If not precalculated, we can run resolve again or look it up
                  // We already pushed them into gameState.currentCombatInView or active combats
                  const cell = gameState.cells.find(c => c.id === cellId)!;
                  
                  const combatInitialForces: { [corpId: string]: UnitGroup } = {};
                  if (cell.ownerId) {
                    combatInitialForces[cell.ownerId] = { ...cell.units };
                  }
                  const cellInvaders = gameState.transits.filter(t => t.targetCellId === cellId && t.daysLeft === 0);
                  cellInvaders.forEach(inv => {
                    if (!combatInitialForces[inv.corpId]) {
                      combatInitialForces[inv.corpId] = { circle: 0, square: 0, triangle: 0 };
                    }
                    combatInitialForces[inv.corpId].circle += inv.units.circle;
                    combatInitialForces[inv.corpId].square += inv.units.square;
                    combatInitialForces[inv.corpId].triangle += inv.units.triangle;
                  });

                  const corpNames: { [corpId: string]: string } = {};
                  gameState.corporations.forEach(c => { corpNames[c.id] = c.name; });

                  return resolveCellCombat(
                    cellId,
                    cell.name,
                    combatInitialForces,
                    cell.ownerId,
                    cell.fortification,
                    corpNames
                  );
                })}
                corporations={gameState.corporations}
                date={gameState.date}
                onConcludeCombats={handleConcludeCombats}
              />
            </motion.div>
          ) : (
            /* STANDARD VIEWPORT */
            <motion.main
              key="standard-view"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch overflow-hidden"
            >
              {/* Left Column (4/12): Weekly Directives / Order controls */}
              <section className="lg:col-span-4 flex flex-col gap-4">
                {isPlanningPhase && (
                  <div className="bg-yellow-100 border-4 border-[#141414] p-4 text-[#141414] flex flex-col gap-2 shadow-[4px_4px_0px_0px_#141414] animate-pulse">
                    <div className="flex items-center gap-2 text-[#141414] font-bold uppercase text-xs tracking-wide">
                      <Activity className="w-4 h-4 shrink-0" />
                      <span>Planning Directives Required</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#141414]/90 font-serif italic">
                      A new Weekly Epoch has stabilized. Click sectors on the map to issue Hold, Deploy, Reinforce, or Scan directives. Click 'Authorize Planning' below when complete.
                    </p>
                    <button
                      onClick={handleEndPlanningPhase}
                      className="mt-2 w-full bg-[#141414] hover:bg-[#141414]/90 text-white font-black py-2.5 px-4 rounded-none text-xs font-mono uppercase tracking-widest transition shadow-[2px_2px_0px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                      id="btn-finalize-planning"
                      data-testid="pog-authorize-planning"
                    >
                      Authorize Planning Phase
                    </button>
                  </div>
                )}

                <div className="flex-1">
                  {isPlanningPhase ? (
                    <GuidedWalkthrough
                      allCells={gameState.cells}
                      corporations={gameState.corporations}
                      playerCorp={playerCorp}
                      currentOrders={gameState.playerOrders}
                      onSaveOrders={handleSaveOrders}
                      onAllRegionsProcessed={handleEndPlanningPhase}
                      selectedCellId={selectedCellId}
                      onSelectCell={(id) => setSelectedCellId(id)}
                    />
                  ) : (
                    <WeeklyOrdersPanel
                      selectedCell={selectedCell}
                      allCells={gameState.cells}
                      corporations={gameState.corporations}
                      currentOrders={currentOrders}
                      onSaveOrders={handleSaveOrders}
                      playerCorp={playerCorp}
                    />
                  )}
                </div>
              </section>

              {/* Center Column (5/12): Map View */}
              <section className="lg:col-span-5 flex flex-col justify-center">
                <PlanetMap
                  cells={gameState.cells}
                  corporations={gameState.corporations}
                  transits={gameState.transits}
                  selectedCellId={selectedCellId}
                  onSelectCell={(id) => setSelectedCellId(id)}
                  playerCorpId={PLAYER_CORP_ID}
                  isPlanningPhase={isPlanningPhase}
                  playerOrders={gameState.playerOrders}
                  activeEventTargetCellId={gameState.currentActiveEvent?.targetCellId || null}
                />
              </section>

              {/* Right Column (3/12): Action Queue & Realtime Boardroom Feed */}
              <section className="lg:col-span-3 flex flex-col gap-3 h-[580px] overflow-hidden" id="boardroom-right-column">
                {/* 1. Alert Queue */}
                <AlertQueue
                  hasPendingEvent={gameState.currentActiveEvent !== null}
                  pendingEventTitle={gameState.currentActiveEvent?.title}
                  pendingOrdersCount={pendingOrdersCount}
                  activeCombatsCount={gameState.activeCombatsToResolve.length}
                />

                {/* 2. Boardroom Intel Feed (historical log) */}
                <div className="flex-1 bg-[#D4D3D0] border-4 border-[#141414] p-4 flex flex-col gap-3 overflow-hidden shadow-[4px_4px_0px_0px_#141414]">
                  <div className="flex items-center justify-between border-b-2 border-[#141414]/20 pb-2">
                    <div className="flex items-center gap-1.5 text-[#141414] font-black font-sans uppercase text-xs tracking-wider">
                      <Activity className="w-4 h-4 text-[#141414]" />
                      <span>Boardroom Intel Feed</span>
                    </div>
                    <span className="text-[9px] font-mono bg-white border-2 border-[#141414] px-1.5 py-0.2 rounded-none text-[#141414] font-black shadow-[1px_1px_0px_0px_#141414]">LIVE</span>
                  </div>

                  {/* Event logs box */}
                  <div className="flex-1 bg-white border-2 border-[#141414] p-3 overflow-y-auto flex flex-col gap-2 font-mono text-[10px] shadow-[2px_2px_0px_0px_#141414]">
                    {gameState.logs.length === 0 ? (
                      <span className="text-[#141414]/40 text-center py-20 font-serif italic">Intel feed idle. Initiating telemetry...</span>
                    ) : (
                      gameState.logs.map((log, idx) => {
                        let badgeColor = 'text-[#141414]/70 bg-[#E4E3E0] border border-[#141414]/20';
                        if (log.type === 'success') badgeColor = 'text-emerald-800 bg-emerald-100 border border-emerald-400';
                        if (log.type === 'warning') badgeColor = 'text-amber-800 bg-amber-100 border border-amber-400';
                        if (log.type === 'error') badgeColor = 'text-red-800 bg-red-100 border border-red-400';

                        return (
                          <div key={idx} className="pb-2 border-b border-[#141414]/10 flex flex-col gap-1 leading-relaxed text-[#141414]">
                            <div className="flex justify-between items-center text-[8px] text-[#141414]/60 font-bold">
                              <span>Y{log.date.year} · M{log.date.month} · W{log.date.week} · D{log.date.day}</span>
                              <span className={`px-1 font-bold uppercase text-[8px] ${badgeColor}`}>{log.type.toUpperCase()}</span>
                            </div>
                            <p className="text-[#141414] text-[10px] font-mono leading-normal">{log.message}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </section>
            </motion.main>
          )}
        </AnimatePresence>
      </div>

      {/* DILEMMA POPUP MODAL */}
      <DailyEventModal
        event={gameState.currentActiveEvent}
        cell={gameState.cells.find(c => c.id === gameState.currentActiveEvent?.targetCellId)}
        playerCorp={playerCorp}
        onSelectChoice={handleSelectChoice}
        date={gameState.date}
      />

      {/* ANNUAL / END-OF-CAMPAIGN REPORT SCREEN */}
      {showAnnualReport && (
        <AnnualReportView
          corporations={gameState.corporations}
          cells={gameState.cells}
          date={gameState.date}
          campaignOver={gameState.campaignOver}
          onResetGame={handleRequestNewGame}
          onContinuePostGame={() => {
            // Let them keep playing by raising the year limit or marking campaignOver as false
            setGameState(prev => {
              if (!prev) return null;
              return {
                ...prev,
                campaignOver: false
              };
            });
            setShowAnnualReport(false);
            addLog('Sandbox mode authorized. Planetary land grab is now open-ended.', 'info');
          }}
        />
      )}

      {/* PHASE 3 ENDING PLACEHOLDER: minimal proof the Rank-1 ending
          trigger fired. Real ending content (cutscene/narration) is
          explicitly out of scope per Design.md v0.2 §Ending. Shows the
          Fragment-count readout that Chapter 3 will read. Rendered on top
          of the Annual Report (same z-50, later in DOM) so the ending
          takes precedence when both are up. */}
      {gameState.endingEvent && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none animate-fade-in" id="ending-placeholder" data-testid="pog-ending-placeholder">
          <div className="bg-[#1a1a2e] border-2 border-amber-600/60 max-w-lg w-full p-8 flex flex-col gap-5 text-center text-amber-50 shadow-[0_0_40px_rgba(217,119,6,0.3)]">
            <span className="font-serif italic text-[11px] text-amber-400/70 font-bold uppercase tracking-widest">
              {ENDING_TEXT.subtitle}
            </span>
            <h1 className="text-3xl font-bold uppercase tracking-tight text-amber-200">
              {ENDING_TEXT.title}
            </h1>
            <p className="text-sm font-serif leading-relaxed text-amber-100/80 italic">
              {ENDING_TEXT.body}
            </p>
            <div className="bg-amber-950/40 border border-amber-700/40 p-4 font-mono text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-amber-100/60">Fragment count:</span>
                <span className="font-black text-lg text-amber-200" data-testid="pog-ending-fragment-count">
                  {gameState.endingEvent.fragmentCount}/{gameState.endingEvent.total}
                </span>
              </div>
              <p className="text-[10px] text-amber-100/50 mt-3 italic font-serif leading-relaxed text-left">
                {gameState.endingEvent.fragmentCount === gameState.endingEvent.total
                  ? ENDING_TEXT.fragmentComplete
                  : ENDING_TEXT.fragmentIncomplete}
              </p>
            </div>
            <button
              onClick={handleRequestNewGame}
              className="w-full bg-amber-600 hover:bg-amber-500 text-[#1a1a2e] font-black border-2 border-amber-400 py-3 text-xs font-mono uppercase tracking-widest transition cursor-pointer"
              id="btn-restart-after-ending"
              data-testid="pog-restart-after-ending"
            >
              {ENDING_TEXT.restartLabel}
            </button>
          </div>
        </div>
      )}

      {/* HELP / INFORMATION DOSSIER DIALOG */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none animate-fade-in">
          <div className="bg-[#E4E3E0] border-4 border-[#141414] max-w-lg w-full p-6 shadow-[6px_6px_0px_0px_#141414] flex flex-col gap-4 text-[#141414]">
            <div className="border-b-2 border-[#141414]/20 pb-3">
              <h2 className="text-lg font-black text-[#141414] uppercase tracking-tight flex items-center gap-2">
                <Info className="w-5 h-5 text-[#141414]" />
                Planetary Land Grab Dossier
              </h2>
              <p className="text-xs text-[#141414]/60 font-serif italic font-bold">
                Executive operational instructions for CorpWorld commanders.
              </p>
            </div>

            <div className="flex flex-col gap-3 text-xs leading-relaxed max-h-[350px] overflow-y-auto pr-1">
              <div className="bg-white p-3 border-2 border-[#141414] shadow-[2px_2px_0px_0px_#141414]">
                <span className="font-mono text-[9px] text-[#141414]/80 font-black uppercase tracking-wider block mb-1.5">Combat Weapons Matrix (RPS)</span>
                <ul className="list-disc pl-4 font-mono text-[10px] text-[#141414]/70 space-y-1">
                  <li><strong className="text-[#141414]">● Circle</strong> beats <strong className="text-[#141414]">■ Square</strong></li>
                  <li><strong className="text-[#141414]">■ Square</strong> beats <strong className="text-[#141414]">▲ Triangle</strong></li>
                  <li><strong className="text-[#141414]">▲ Triangle</strong> beats <strong className="text-[#141414]">● Circle</strong></li>
                </ul>
                <p className="text-[10px] text-[#141414]/85 font-sans mt-1.5 leading-relaxed">
                  Attackers target best-counter defenders greedily. Matching counters increase hit probability to 70%!
                </p>
              </div>

              <div className="bg-white p-3 border-2 border-[#141414] shadow-[2px_2px_0px_0px_#141414]">
                <span className="font-mono text-[9px] text-[#141414]/80 font-black uppercase tracking-wider block mb-1.5">Time Flow & Cadence</span>
                <p className="text-[10px] text-[#141414]/85 leading-relaxed font-sans">
                  The simulation advances day-by-day. Every week starts with a <strong>Planning Phase</strong>. Units take exactly 4 days to cross membrane borders. 
                  Monthly battles occur at week-end 4 to resolve contested cells.
                </p>
              </div>

              <div className="bg-white p-3 border-2 border-[#141414] shadow-[2px_2px_0px_0px_#141414]">
                <span className="font-mono text-[9px] text-[#141414]/80 font-black uppercase tracking-wider block mb-1.5">Resource Economics</span>
                <ul className="list-disc pl-4 font-mono text-[10px] text-[#141414]/70 space-y-1">
                  <li><strong>Revenue:</strong> Each controlled sector generates <span className="text-emerald-700 font-bold">+$10,000</span> every week-end.</li>
                  <li><strong>Passive Recruitment:</strong> Each controlled sector spawns 1 unit every 2 weeks passively.</li>
                  <li><strong>Weekly Directives:</strong>
                    <ul className="list-disc pl-4 mt-1 text-[9px] text-[#141414]/65 space-y-0.5">
                      <li>Hold: Focus factory. Free.</li>
                      <li>Deploy: Transit troops to conquer neighbors. Free.</li>
                      <li>Reinforce: Instantly recruit +1 unit. Cost: <span className="text-red-700 font-semibold">-$30,000</span>.</li>
                      <li>Fortify: Install direct shields. Cost: <span className="text-red-700 font-semibold">-$20,000</span>.</li>
                      <li>Scan: Lift Fog of War instantly. Cost: <span className="text-red-700 font-semibold">-$5,000</span>.</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-3 border-2 border-[#141414] shadow-[2px_2px_0px_0px_#141414]">
                <span className="font-mono text-[9px] text-[#141414]/80 font-black uppercase tracking-wider block mb-1.5">Win & Loss Conditions</span>
                <p className="text-[10px] text-[#141414]/85 leading-relaxed font-sans">
                  The campaign runs for exactly <strong>3 Years</strong>. To secure rank #1, control more sectors than the 4 rival AI corporations. If your controlled sector count is reduced to 0 at any point, your contract is terminated immediately (Game Over).
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full bg-[#141414] hover:bg-[#141414]/90 text-white font-black py-2.5 rounded-none text-xs font-mono transition shadow-[3px_3px_0px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5 uppercase tracking-widest cursor-pointer mt-2"
            >
              Acknowledge Briefing
            </button>
          </div>
        </div>
      )}

    </div>
    </GameShell>
  );
}
