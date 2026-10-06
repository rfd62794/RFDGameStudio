import {
  GameState, GameEvent, GameEventChoice, CellCombatState
} from './types';
import { PLAYER_CORP_ID } from './campaignConstants';
import { EngineContext, pickOne } from './rng';
import { finalizeAnnualReport, isCampaignOverDate } from './annualReport';
import { getHouseStats } from './houseStats';
import { buildCombatForces } from './combatForces';
import { resolveCellCombat } from '../../engine/shared/combat';

// The day-advancement engine: the body of App.tsx's advanceDay as a pure
// function. Random and clock inputs come from the injected EngineContext;
// React state and sfx stay in App.tsx. Combat conclusion lives in
// combatForces.ts. The function never mutates its input:
// cells/corporations/transits are deep-cloned at entry and all work
// happens on the clones.

export interface BoardroomEventTemplate {
  title: string;
  description: string;
  choices: readonly GameEventChoice[];
}

export interface AdvanceDayOutcome {
  state: GameState;
  showAnnualReport: boolean;
  enterPlanning: boolean;
}

export function advanceDay(
  prev: GameState,
  ctx: EngineContext,
  eventTemplates: readonly BoardroomEventTemplate[] = []
): AdvanceDayOutcome {
  const newDate = { ...prev.date };
  newDate.day += 1;

  let triggerEvent: GameEvent | null = null;
  let updatedLogs = [...prev.logs];

  // React state writes in the old code become locals/outcome flags here.
  let isSimulating = prev.isSimulating;
  let showAnnualReport = false;
  let enterPlanning = false;

  // Deep-cloned inputs: the week-end recruitment, production, income and
  // annual-bonus steps below mutate these freely without touching prev.
  const updatedTransits = structuredClone(prev.transits).map(t => {
    return {
      ...t,
      daysLeft: Math.max(0, t.daysLeft - 1)
    };
  });

  // Filter transits that arrived today (daysLeft === 0)
  const arrivedTransits = updatedTransits.filter(t => t.daysLeft === 0);
  const remainingTransits = updatedTransits.filter(t => t.daysLeft > 0);

  // Clone corporations early to allow updating scoutedCells during instant capture
  const updatedCorps = structuredClone(prev.corporations).map(c => ({
    ...c,
    scoutedCells: { ...c.scoutedCells }
  }));

  // Keep track of transits consumed by instant captures
  const instantCapturedTransitIds = new Set<string>();

  // Apply arrived transits to cells' garrisons/occupations
  const updatedCells = structuredClone(prev.cells).map(cell => {
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
  if (eventTemplates.length > 0 && newDate.day >= 2 && newDate.day <= 6 && ctx.rng() < 0.12) {
    // Find a random cell owned by the player to anchor the event
    const playerCells = updatedCells.filter(c => c.ownerId === PLAYER_CORP_ID);
    if (playerCells.length > 0) {
      const anchorCell = pickOne(ctx.rng, playerCells);
      const template = pickOne(ctx.rng, eventTemplates);

      triggerEvent = {
        id: `event-${ctx.now()}`,
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

    // 3. Collect Weekly Profit: each controlled cell generates income
    // to owner (per-House: Tide $12k, default $10k)
    updatedCells.forEach(cell => {
      if (cell.ownerId) {
        const ownerIdx = updatedCorps.findIndex(c => c.id === cell.ownerId);
        if (ownerIdx !== -1) {
          // Population Balance consequence: cells with opinion <30 produce
          // no income (workforce strike). Real consequence, not just a
          // number that affects rank.
          if ((cell.publicOpinion ?? 50) >= 30) {
            const ownerStats = getHouseStats(updatedCorps[ownerIdx].cultureId);
            updatedCorps[ownerIdx].treasury += ownerStats.incomePerCell;
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
    if (isCampaignOverDate(newDate)) {
      isCampaignOver = true;
      isSimulating = false;
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
    isSimulating = false;
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
    // Corp Name map
    const corpNames: { [corpId: string]: string } = {};
    updatedCorps.forEach(c => { corpNames[c.id] = c.name; });

    // Generate battles
    activeCombats = monthEndCombatsToResolve.map(cellId => {
      const cell = updatedCells.find(c => c.id === cellId)!;
      return resolveCellCombat(
        cellId,
        cell.name,
        buildCombatForces(cell, finalTransits),
        cell.ownerId,
        cell.fortification,
        corpNames
      );
    });

    currentCombatView = activeCombats[0];
    isSimulating = false; // Pause simulation during combat
  }

  // Check if we should auto-trigger the annual report view if year ticked up (and no combat)
  const yearTickReport = newDate.week === 1 && newDate.day === 1 && newDate.month === 1 && newDate.year > prev.date.year && monthEndCombatsToResolve.length === 0;
  if (yearTickReport) {
    showAnnualReport = true;
    isSimulating = false;
  }

  if (isCampaignOverWithElimination) {
    showAnnualReport = true;
  }

  // Rank recompute trigger 1 of 2: Annual Report -- full recompute,
  // general growth (territory + Population Balance) reflected, any
  // time the report is about to be shown.
  // Phase 3: Rank-1 ending check at every Annual Report (not only the
  // campaign-final). Runs AFTER computeRank inside finalizeAnnualReport
  // so ranks are fresh. Only the PLAYER reaching Rank 1 fires; an AI at
  // Rank 1 does not. If it fires, halt further cycling (campaignOver) and
  // store the payload.
  let endingEvent = prev.endingEvent;
  if (yearTickReport || isCampaignOverWithElimination) {
    const ending = finalizeAnnualReport(updatedCorps, updatedCells);
    if (!prev.endingEvent && ending) {
      endingEvent = ending;
      isCampaignOver = true;
      isSimulating = false;
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
    enterPlanning = true;
    isSimulating = false; // Pause during planning phase
  }

  return {
    state: {
      ...prev,
      date: newDate,
      cells: updatedCells,
      corporations: updatedCorps,
      transits: finalTransits,
      playerOrders: nextPlayerOrders,
      isSimulating,
      currentActiveEvent: triggerEvent,
      activeCombatsToResolve: monthEndCombatsToResolve,
      currentCombatInView: currentCombatView,
      campaignOver: isCampaignOver || isCampaignOverWithElimination,
      endingEvent,
      logs: updatedLogs
    },
    showAnnualReport,
    enterPlanning
  };
}
