import { MapCell, Corporation, UnitTransit, UnitGroup, UnitType } from './types';
import { PLAYER_CORP_ID } from './campaignConstants';
import { EngineContext, pickOne } from './rng';
import { getHouseStats } from './houseStats';
import { selectWeightedNeighbor } from './aiDecisions';

// Moved verbatim from App.tsx, with the random/clock inputs injected via
// `ctx` and the player-skip generalized to `humanCorpIds` (an empty list
// lets every House act, which the headless soak test needs). Still mutates
// the cells/corps/transits it is handed, exactly like the code it replaces.
export function generateAIWeeklyOrders(
  cells: MapCell[], corps: Corporation[], transits: UnitTransit[],
  ctx: EngineContext, humanCorpIds: readonly string[] = [PLAYER_CORP_ID]
): void {
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
    if (humanCorpIds.includes(corp.id)) continue; // Skip human Houses

    const aiStats = getHouseStats(corp.cultureId);
    const ownedCells = cells.filter(c => c.ownerId === corp.id);
    if (ownedCells.length === 0) continue; // Wiped out

    for (const cell of ownedCells) {
      const totalUnits = cell.units.circle + cell.units.square + cell.units.triangle;

      // Random AI choice weights:
      // 40% chance Expand (if they have units)
      // 20% chance Reinforce (if treasury >= $30k)
      // 20% chance Fortify (if treasury >= fortifyCost and fortification < fortifyMax)
      // 20% chance Idle/Hold
      const roll = ctx.rng();

      if (roll < 0.40 && totalUnits >= 2) {
        // AI Expand
        // Phase 3: wheel-aware weighted target selection (was uniform
        // random). Wheel-opposite-owned neighbors weighted 3, wheel-
        // adjacent-owned 1.5, baseline (neutral/non-rival/own) 1.
        // Weighted random, not deterministic -- avoids every AI House
        // behaving identically predictable every playthrough.
        const targetNeighId = selectWeightedNeighbor(corp, cell, cellsById, corpsById, ctx.rng);
        if (targetNeighId === null) continue; // no neighbors, skip this cell
        const targetCell = cells.find(c => c.id === targetNeighId)!;

        // AI sends 1 or 2 units of random types, + bonus units from House stats
        const maxSend = 2 + aiStats.expandBonusUnits;
        const sendUnits: UnitGroup = { circle: 0, square: 0, triangle: 0 };
        let unitsAdded = 0;

        const unitTypes: UnitType[] = ['circle', 'square', 'triangle'];
        for (const type of unitTypes) {
          if (cell.units[type] > 0 && unitsAdded < maxSend) {
            sendUnits[type] = 1;
            cell.units[type]--;
            unitsAdded++;
          }
        }

        if (unitsAdded > 0) {
          transits.push({
            id: `transit-ai-${corp.id}-${cell.id}-${targetNeighId}-${ctx.now()}`,
            corpId: corp.id,
            originCellId: cell.id,
            targetCellId: targetNeighId,
            units: sendUnits,
            totalDays: aiStats.transitDays,
            daysLeft: aiStats.transitDays
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
        const type = pickOne<UnitType>(ctx.rng, ['circle', 'square', 'triangle']);
        cell.recruitmentQueue.push({ type, weeksLeft: 1 });
      } else if (roll < 0.80 && corp.treasury >= aiStats.fortifyCost && cell.fortification < aiStats.fortifyMax) {
        // AI Fortify
        corp.treasury -= aiStats.fortifyCost;
        // Increment fortification at end of week
        cell.fortification = Math.min(aiStats.fortifyMax, cell.fortification + 1);
      } else {
        // AI Idle
        // Maintain garrison, progress passive production
      }
    }
  }
}
