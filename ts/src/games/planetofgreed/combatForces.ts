import { MapCell, UnitTransit, UnitGroup, GameState, CellCombatState } from './types';
import { resolveCellCombat } from '../../engine/shared/combat';

// The combat-force assembly existed twice in App.tsx (advanceDay's
// month-end block and the combat view render); it lives here once now.

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
