import { MapCell, UnitTransit, UnitGroup, GameState, CellCombatState } from './types';
import { resolveCellCombat } from '../../engine/shared/combat';
import { finalizeAnnualReport } from './annualReport';
import { computeRank } from './campaignState';
import { onHouseEliminated } from './fragmentSystem';

// The combat-force assembly existed twice in App.tsx (advanceDay's
// month-end block and the combat view render); it lives here once now.
// concludeCombats below is App.tsx's handleConcludeCombats as a pure
// function (React state + sfx stay in App.tsx; it never mutates its
// input -- cells/corporations/transits are deep-cloned at entry).

// Garrison of the cell's current owner plus the summed units of every
// transit that has arrived (daysLeft === 0) at this cell.
export function buildCombatForces(cell: MapCell, transits: UnitTransit[]): { [corpId: string]: UnitGroup } {
  const combatInitialForces: { [corpId: string]: UnitGroup } = {};

  // Original owner's garrison (if any)
  if (cell.ownerId) {
    combatInitialForces[cell.ownerId] = { ...cell.units };
  }

  // Transiting invaders
  const cellInvaders = transits.filter(t => t.targetCellId === cell.id && t.daysLeft === 0);
  cellInvaders.forEach(inv => {
    if (!combatInitialForces[inv.corpId]) {
      combatInitialForces[inv.corpId] = { circle: 0, square: 0, triangle: 0 };
    }
    combatInitialForces[inv.corpId].circle += inv.units.circle;
    combatInitialForces[inv.corpId].square += inv.units.square;
    combatInitialForces[inv.corpId].triangle += inv.units.triangle;
  });

  return combatInitialForces;
}

// Runs resolveCellCombat for each id in state.activeCombatsToResolve and
// returns the results keyed by cell id -- the shape concludeCombats
// (and the combat view) consumes.
export function resolvePendingCombats(state: GameState): { [cellId: number]: CellCombatState } {
  const corpNames: { [corpId: string]: string } = {};
  state.corporations.forEach(c => { corpNames[c.id] = c.name; });

  const results: { [cellId: number]: CellCombatState } = {};
  for (const cellId of state.activeCombatsToResolve) {
    const cell = state.cells.find(c => c.id === cellId)!;
    results[cellId] = resolveCellCombat(
      cellId,
      cell.name,
      buildCombatForces(cell, state.transits),
      cell.ownerId,
      cell.fortification,
      corpNames
    );
  }
  return results;
}

// Same body as App.tsx's applyPublicOpinionOffset (which stays in App.tsx
// because tests read it there): Population Balance is on a 0-100 scale,
// always clamped.
function applyPublicOpinionOffset(cell: MapCell, offset: number) {
  const current = cell.publicOpinion ?? 50;
  cell.publicOpinion = Math.max(0, Math.min(100, current + offset));
}

export interface ConcludeCombatsOutcome {
  state: GameState;
  endingFired: boolean;
  showAnnualReport: boolean;
  eliminationCount: number;
}

export function concludeCombats(
  prev: GameState,
  results: { [cellId: number]: CellCombatState }
): ConcludeCombatsOutcome {
  const updatedCells = structuredClone(prev.cells);
  let updatedTransits = structuredClone(prev.transits);
  const updatedCorps = structuredClone(prev.corporations);

  // addLog equivalent: prepends a dated entry, capped at the last 100.
  let logs = [...prev.logs];
  const pushLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    logs = [{ date: prev.date, message, type }, ...logs].slice(0, 100);
  };

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

      pushLog(`Conflict Resolved in ${cell.name}: ${updatedCorps.find(c => c.id === battle.victorId)?.name} secures control.`, 'success');
    } else {
      // Mutual destruction
      cell.ownerId = null;
      cell.units = { circle: 0, square: 0, triangle: 0 };
      cell.fortification = 0;
      pushLog(`Conflict Resolved in ${cell.name}: Complete garrison annihilation. Sector reverts to Neutral.`, 'warning');
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
        pushLog(
          `House ${eliminatorCorp.name} eliminated House ${eliminatedCorp.name} — inherited ${transferredCount} Fragment${transferredCount === 1 ? '' : 's'}. (Total held: ${eliminatorCorp.fragments.length}/6)`,
          'warning'
        );
      }
    } else {
      // Edge case: eliminated by mutual destruction with no prior victor
      // in this batch. Fragments are lost, not transferred. Flagged, not
      // silently invented -- the directive says report rather than guess.
      pushLog(
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
    displacementMessages.forEach(msg => pushLog(msg, 'warning'));
  }

  const newCombatHistory = Object.values(results).map(log => ({
    date: prev.date,
    cellId: log.cellId,
    cellName: log.cellName,
    victorId: log.victorId,
    log
  }));

  let endingEvent = prev.endingEvent;
  let endingFired = false;
  let showAnnualReport = false;

  if (prev.campaignOver) {
    // Annual Report trigger, same as advanceDay's -- full recompute
    // whenever the report is about to be shown, on top of any
    // displacement recompute already applied above.
    // Phase 3: Rank-1 ending check, same as advanceDay's Annual Report
    // path. Only fires for the PLAYER reaching Rank 1. If it fires,
    // store the payload and halt cycling (campaignOver already true here,
    // but endingEvent must be set on state for the placeholder screen).
    const ending = finalizeAnnualReport(updatedCorps, updatedCells);
    if (ending) {
      endingFired = true;
      endingEvent = ending;
      pushLog(
        `ENDING TRIGGERED: Rank 1 reached. Fragment count: ${ending.fragmentCount}/${ending.total}.`,
        'success'
      );
    }
    showAnnualReport = true;
  }

  return {
    state: {
      ...prev,
      cells: updatedCells,
      transits: updatedTransits,
      corporations: updatedCorps,
      currentCombatInView: null,
      activeCombatsToResolve: [],
      combatHistory: [...prev.combatHistory, ...newCombatHistory],
      endingEvent,
      logs
    },
    endingFired,
    showAnnualReport,
    eliminationCount: eliminations.length
  };
}
