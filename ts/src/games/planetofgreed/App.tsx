import { useState, useEffect, useRef } from 'react';
import type { GameRendererProps } from '../../engine/types';
import {
  GameState, MapCell, Corporation, WeeklyOrder, UnitGroup,
  CellCombatState, GameDate, CultureId
} from './types';
import { loadSave, writeSave } from '../../engine/shared/persistence';
import { sfx } from '../../engine/shared/sfx';
import { generateAIWeeklyOrders } from './aiWeeklyOrders';
import { resolvePendingCombats, concludeCombats } from './combatForces';
import { advanceDay as advanceDayEngine } from './turnEngine';
import { PLAYER_CORP_ID, CULTURE_WHEEL, CULTURE_DEFINITIONS } from './campaignConstants';
import { createInitialCampaign } from './campaignState';
import { defaultContext, pickOne } from './rng';
import { buildEndingViewModel, nextChapterHref, NEXT_CHAPTER_LABEL } from './endingView';
import { getHouseStats } from './houseStats';
import { getHouseTheme } from './houseThemes';
import { factionThemeVars } from '../../ui/components/FactionTheme';

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
import { useOnboardingGate } from '../../ui/components/OnboardingGate';

import {
  Activity, Info, RefreshCw
} from 'lucide-react';

// Population Balance is read/written on a 0-100 scale, always clamped.
// `cell.publicOpinion` is optional at the type level only because
// mapGenerator.ts (read-only this phase) doesn't set it on cell literals --
// treat the fallback here as normalizing a real, already-50-defaulted
// value, not as a meaningful "missing data" case (see types.ts).
function applyPublicOpinionOffset(cell: MapCell, offset: number) {
  const current = cell.publicOpinion ?? 50;
  cell.publicOpinion = Math.max(0, Math.min(100, current + offset));
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

export default function App({ session }: GameRendererProps) {
  void session; // destructured per contract; game is self-contained
  const env = import.meta.env as Record<string, string | undefined>;
  const mode = env.VITE_STANDALONE === 'true' ? 'standalone' : 'arcade';
  const arcadeBaseUrl = env.VITE_ARCADE_BASE_URL;
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<number | null>(null);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showAnnualReport, setShowAnnualReport] = useState<boolean>(false);
  const [isPlanningPhase, setIsPlanningPhase] = useState<boolean>(true);
  const [planningMode, setPlanningMode] = useState<'guided' | 'manual'>('guided');
  const lastTreasuryErrorRef = useRef<string>('');
  // No saved game exists yet: the player must pick a culture (and therefore
  // their wheel slot / rival) before a new game initializes. Minimal
  // selection step -- see the render branch below.
  const [pendingCultureSelection, setPendingCultureSelection] = useState<boolean>(false);

  // Title screen: shown on first load. Dismissed when the player chooses
  // to start a new game or continue. Matches Dissonance's appPhase='title'.
  const [showTitleScreen, setShowTitleScreen] = useState<boolean>(true);

  // Opening sequence: fires ONLY on a genuinely new game, never on a
  // resumed/returning session. Uses the shared OnboardingGate hook
  // (extracted from SlimeWorld's tutorial mechanism) in boolean mode.
  const { shouldShow: showOpeningSequence, handleComplete: handleOpeningGateComplete, trigger: triggerOpeningSequence } =
    useOnboardingGate({ mode: 'boolean', initialShow: false });

  // Load from local storage on startup if exists
  useEffect(() => {
    const parsed = loadSave<{ selectedCellId?: number | null; isPlanningPhase?: boolean }>('corpworld_state');
    if (parsed) {
      try {
        // Correct functions on choices need to be remapped if load from storage since they are omitted by JSON.stringify
        setGameState(rehydrateState(parsed));
        setSelectedCellId(parsed.selectedCellId ?? null);
        setIsPlanningPhase(parsed.isPlanningPhase ?? true);
        // Resuming an existing game: skip title and opening, go straight to game
        setShowTitleScreen(false);
        // OnboardingGate manages its own state — no manual clear needed on resume.
        return;
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
    // No saved game: show title screen first, then culture selection
    setShowTitleScreen(true);
  }, []);

  // Shared SFX: muted until the first user gesture (autoplay-safe).
  useEffect(() => { sfx.autoUnlock(); }, []);

  // Reset flow re-enters culture selection rather than assuming the
  // previous culture -- a real, deliberate choice each time, same as the
  // very first game.
  const handleRequestNewGame = () => {
    setGameState(null);
    setPendingCultureSelection(true);
    // OnboardingGate manages its own state — no manual clear needed.
  };

  // Title screen actions: "New Campaign" triggers the opening sequence
  // (new-game-only), then proceeds to culture selection. "Continue"
  // loads saved state (handled by the useEffect above).
  const handleTitleNewGame = () => {
    setShowTitleScreen(false);
    sfx.play('confirm');
    triggerOpeningSequence();
  };

  const handleTitleContinue = () => {
    setShowTitleScreen(false);
    // OnboardingGate manages its own state — no manual clear needed.
    // If there's a saved game, the useEffect already loaded it.
    // If not, fall through to culture selection.
    if (!gameState) {
      setPendingCultureSelection(true);
    }
  };

  const handleOpeningComplete = () => {
    handleOpeningGateComplete();
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
      writeSave('corpworld_state', stateToSave);
    }
  }, [gameState, isPlanningPhase, selectedCellId]);

  const initializeNewGame = (playerCultureId: CultureId) => {
    const initial = createInitialCampaign(playerCultureId, defaultContext);
    setGameState(initial);

    const capital = initial.cells.find(c => c.ownerId === PLAYER_CORP_ID);
    if (capital) {
      setSelectedCellId(capital.id);
    }
    setIsPlanningPhase(true);
    setPlanningMode('guided');
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

    const playerCorp = gameState.corporations.find(c => c.id === PLAYER_CORP_ID)!;
    const playerStats = getHouseStats(playerCorp.cultureId);

    // Helper: cost of a single order
    const orderCost = (order: WeeklyOrder): number => {
      if (order.type === 'expand') return playerStats.expandCost;
      if (order.type === 'reinforce') return 30000;
      if (order.type === 'fortify') return playerStats.fortifyCost;
      if (order.type === 'scan') return 5000;
      if (order.type === 'civic' && order.focus === 'defense') return 10000;
      if (order.type === 'civic' && order.focus === 'unrest') return 10000;
      return 0; // hold, civic production
    };

    // Build a processed-orders map: downgrade unaffordable orders to hold
    let remainingBudget = playerCorp.treasury;
    const processedOrders: { [cellId: number]: WeeklyOrder[] } = {};
    let totalOrderCost = 0;
    let anyDowngraded = false;

    for (const cellId in gameState.playerOrders) {
      const numericCellId = Number(cellId);
      const cellOrders = gameState.playerOrders[numericCellId] || [];
      const cell = gameState.cells.find(c => c.id === numericCellId);
      const affordableOrders: WeeklyOrder[] = [];

      for (const order of cellOrders) {
        const cost = orderCost(order);
        if (cost > 0 && remainingBudget < cost) {
          anyDowngraded = true;
          addLog(`Insufficient funds: ${order.type.charAt(0).toUpperCase() + order.type.slice(1)} order in ${cell?.name} downgraded to Hold.`, 'warning');
          affordableOrders.push({ type: 'hold' });
        } else {
          remainingBudget -= cost;
          totalOrderCost += cost;
          affordableOrders.push(order);
        }
      }
      processedOrders[numericCellId] = affordableOrders;
    }

    if (anyDowngraded) {
      const errorMsg = `Operational block: Weekly orders require $${(playerCorp.treasury - remainingBudget).toLocaleString()} but treasury holds only $${playerCorp.treasury.toLocaleString()}. Unaffordable orders downgraded to Hold.`;
      if (lastTreasuryErrorRef.current !== errorMsg) {
        addLog(errorMsg, 'error');
        lastTreasuryErrorRef.current = errorMsg;
      }
    } else {
      lastTreasuryErrorRef.current = '';
    }

    // Process orders
    const updatedCells = [...gameState.cells];
    const updatedCorps = [...gameState.corporations];
    const playerCorpIndex = updatedCorps.findIndex(c => c.id === PLAYER_CORP_ID);
    const updatedTransits = [...gameState.transits];

    // Deduct cost
    updatedCorps[playerCorpIndex].treasury -= totalOrderCost;

    for (const cellId in processedOrders) {
      const cellOrders = processedOrders[Number(cellId)] || [];
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
          // Apply House stat: bonus units on Expand (Ember +1)
          const bonusUnits = playerStats.expandBonusUnits;
          const finalUnitsSent: UnitGroup = {
            circle: order.unitsSent.circle + (bonusUnits > 0 && updatedCells[cellIndex].units.circle > order.unitsSent.circle ? Math.min(bonusUnits, updatedCells[cellIndex].units.circle - order.unitsSent.circle) : 0),
            square: order.unitsSent.square + (bonusUnits > 0 && updatedCells[cellIndex].units.square > order.unitsSent.square ? Math.min(bonusUnits - (order.unitsSent.circle < updatedCells[cellIndex].units.circle ? 1 : 0), updatedCells[cellIndex].units.square - order.unitsSent.square) : 0),
            triangle: order.unitsSent.triangle,
          };
          // Deduct units from cell garrison
          updatedCells[cellIndex].units.circle -= finalUnitsSent.circle;
          updatedCells[cellIndex].units.square -= finalUnitsSent.square;
          updatedCells[cellIndex].units.triangle -= finalUnitsSent.triangle;

          // Register Transit (transit days are per-House: Gale 2, Tide 6, default 4)
          const transitDays = playerStats.transitDays;
          const transitId = `transit-player-${cell.id}-${order.targetCellId}-${defaultContext.now()}-${defaultContext.rng()}`;
          updatedTransits.push({
            id: transitId,
            corpId: PLAYER_CORP_ID,
            originCellId: cell.id,
            targetCellId: order.targetCellId,
            units: finalUnitsSent,
            totalDays: transitDays,
            daysLeft: transitDays
          });
          addLog(`Expedition convoy authorized: Deploying ${finalUnitsSent.circle + finalUnitsSent.square + finalUnitsSent.triangle} units from ${cell.name} to Sector ${updatedCells.find(c => c.id === order.targetCellId)?.name}.`, 'info');
        }

        if (order.type === 'reinforce' && order.reinforceType) {
          updatedCells[cellIndex].recruitmentQueue.push({ type: order.reinforceType, weeksLeft: 1 });
          addLog(`Priority assembly queue initialized for ${order.reinforceType.toUpperCase()} in ${cell.name}. Arrival in 1 week.`, 'info');
        }

        if (order.type === 'fortify') {
          updatedCells[cellIndex].fortification = Math.min(playerStats.fortifyMax, updatedCells[cellIndex].fortification + 1);
          addLog(`Shield structures reinforced to Level ${updatedCells[cellIndex].fortification} in ${cell.name}.`, 'success');
        }

        if (order.type === 'civic') {
          if (order.focus === 'defense') {
            updatedCells[cellIndex].fortification = Math.min(playerStats.fortifyMax, updatedCells[cellIndex].fortification + 1);
            // Population Balance: militarization unsettles civilians (-1).
            applyPublicOpinionOffset(updatedCells[cellIndex], -1);
            addLog(`Civic Defense Focus authorized in ${cell.name}: Shields increased to Level ${updatedCells[cellIndex].fortification}.`, 'success');
          } else if (order.focus === 'production') {
            // Population Balance: accelerated production strains workforce (-2).
            applyPublicOpinionOffset(updatedCells[cellIndex], -2);
            addLog(`Civic Production Focus authorized in ${cell.name}: Passive assembly line throughput accelerated.`, 'success');
          } else if (order.focus === 'unrest') {
            applyPublicOpinionOffset(updatedCells[cellIndex], playerStats.unrestBoost);
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
    generateAIWeeklyOrders(updatedCells, updatedCorps, updatedTransits, defaultContext);

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

  // Main advancement of time
  const advanceDay = () => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return null;
      const out = advanceDayEngine(prev, defaultContext, EVENTS_TEMPLATES);
      if (out.showAnnualReport) setShowAnnualReport(true);
      if (out.enterPlanning) {
        setIsPlanningPhase(true);
        setPlanningMode('guided');
      }
      return out.state;
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
        const targetToReset = pickOne(defaultContext.rng, candidates);
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

    sfx.play('confirm');
    addLog(`Dilemma resolved: ${actionResult.log}`, 'success');
  };

  // Conclude Monthly Conflicts in Combat view
  const handleConcludeCombats = (results: { [cellId: number]: CellCombatState }) => {
    if (!gameState) return;
    if (Object.keys(results).length > 0) sfx.play('hit');
    const out = concludeCombats(gameState, results);
    if (out.eliminationCount > 0) sfx.play('alert');
    setGameState(out.state);
    if (out.endingFired) sfx.play('win');
    if (out.showAnnualReport) setShowAnnualReport(true);
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
        <div className="flex-1 bg-[#1a1a2e] text-amber-50 font-sans flex flex-col justify-center items-center gap-6 p-6 select-none">
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
                data-faction={cultureId}
                onClick={() => initializeNewGame(cultureId)}
                style={factionThemeVars(getHouseTheme(cultureId))}
                className="border-2 border-(--faction-accent-faint) bg-[#0f0f1a] p-4 flex flex-col items-center gap-2 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
              >
                <span
                  className="w-6 h-6 rounded-full border border-(--faction-accent-faint)"
                  style={{ backgroundColor: def.color }}
                />
                <span className="font-bold uppercase text-xs tracking-wide text-(--faction-accent-strong)">{cultureId}</span>
                <span className="text-[10px] font-mono text-(--faction-text-dim) text-center">{def.corpName}</span>
                <span className="text-[9px] font-serif italic text-(--faction-text-dim) text-center leading-snug mt-1">{HOUSE_DESCRIPTIONS[cultureId]}</span>
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
        <div className="flex-1 bg-[#1a1a2e] flex flex-col justify-center items-center text-amber-100 font-mono gap-3 select-none">
          <RefreshCw className="w-10 h-10 text-amber-400 animate-spin" />
          <span className="font-bold">BOOTING PLANET OF GREED EXECUTIVE TERMINAL...</span>
        </div>
      </GameShell>
    );
  }

  const playerCorp = gameState.corporations.find(c => c.id === PLAYER_CORP_ID)!;
  // Per-House style split: the boardroom chrome re-dresses itself in the
  // player's House palette. The --faction-* vars are scoped to the game
  // root; every descendant consuming var(--faction-*) picks up this theme.
  const houseTheme = getHouseTheme(playerCorp.cultureId);
  const playerControlledCellsCount = gameState.cells.filter(c => c.ownerId === PLAYER_CORP_ID).length;
  const selectedCell = gameState.cells.find(c => c.id === selectedCellId) || null;
  const currentOrders = selectedCellId !== null ? (gameState.playerOrders[selectedCellId] || []) : [];

  const pendingOrdersCount = isPlanningPhase
    ? gameState.cells.filter(c => c.ownerId === PLAYER_CORP_ID && (!gameState.playerOrders[c.id] || gameState.playerOrders[c.id].length === 0)).length
    : 0;

  return (
    <GameShell gameLabel="Planet of Greed" gameId="planetofgreed" phase="Chapter 1" mode={mode} arcadeBaseUrl={arcadeBaseUrl} mainClassName="game-shell-main--scrollable">
    <div className="flex-1 bg-[#1a1a2e] text-(--faction-text) font-sans flex flex-col relative overflow-x-hidden" style={factionThemeVars(houseTheme)} data-faction={playerCorp.cultureId}>

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
      <div className="flex-1 flex flex-col relative">
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
                combats={Object.values(resolvePendingCombats(gameState))}
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
              className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start"
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
                  {isPlanningPhase && (
                    <div className="flex gap-1 mb-2">
                      <button
                        onClick={() => setPlanningMode('guided')}
                        className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border-2 border-[#141414] transition cursor-pointer ${planningMode === 'guided' ? 'bg-(--faction-accent) text-(--faction-on-accent) font-black' : 'bg-[#1a1a2e] text-(--faction-accent-strong) hover:bg-(--faction-accent-bg)'}`}
                      >
                        Guided
                      </button>
                      <button
                        onClick={() => setPlanningMode('manual')}
                        className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border-2 border-[#141414] transition cursor-pointer ${planningMode === 'manual' ? 'bg-(--faction-accent) text-(--faction-on-accent) font-black' : 'bg-[#1a1a2e] text-(--faction-accent-strong) hover:bg-(--faction-accent-bg)'}`}
                      >
                        Manual
                      </button>
                    </div>
                  )}
                  {isPlanningPhase && planningMode === 'guided' ? (
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
              <section className="lg:col-span-5 flex flex-col justify-start">
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
              <section className="lg:col-span-3 flex flex-col gap-3 max-h-[calc(100svh-60px)] overflow-hidden" id="boardroom-right-column">
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
          <div className="bg-[#1a1a2e] border-2 border-amber-600/60 max-w-lg w-full max-h-full overflow-y-auto p-8 flex flex-col gap-5 text-center text-amber-50 shadow-[0_0_40px_rgba(217,119,6,0.3)]">
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
              {(() => {
                const summary = buildEndingViewModel(playerCorp, gameState.endingEvent, gameState.date);
                return (
                  <div className="mt-3 pt-3 border-t border-amber-700/30 text-left text-amber-100/70" data-testid="pog-ending-summary">
                    <div>{summary.houseName} finished at {summary.rankLabel} in {summary.yearLabel}.</div>
                    <div>Fragments gathered: {summary.fragmentsLabel}.</div>
                  </div>
                );
              })()}
            </div>
            <button
              onClick={handleRequestNewGame}
              className="w-full bg-amber-600 hover:bg-amber-500 text-[#1a1a2e] font-black border-2 border-amber-400 py-3 text-xs font-mono uppercase tracking-widest transition cursor-pointer"
              id="btn-restart-after-ending"
              data-testid="pog-restart-after-ending"
            >
              {ENDING_TEXT.restartLabel}
            </button>
            {nextChapterHref(mode, window.location.href) && (
              <a
                href={nextChapterHref(mode, window.location.href) ?? undefined}
                className="block w-full text-center border-2 border-amber-600/70 text-amber-200 hover:bg-amber-900/40 py-3 text-xs font-mono uppercase tracking-widest transition"
                data-testid="pog-ending-continue"
              >
                {NEXT_CHAPTER_LABEL}
              </a>
            )}
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
                Executive operational instructions for Planet of Greed commanders.
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
