import { DefenseForce, TerritoryCell, DeclaredAction, FactionId } from '../types';
import { CROWN_HOUSE } from '../data/factions';

export const LOYALTY_EROSION_PER_UNREINFORCED_THREATENED_TURN = 12;
export const DEFAULT_FORCE_LOYALTY = 100;

export interface BrokenForceEvent {
  forceName: string;
  cellName: string;
  occupyingFaction: FactionId;
}

export interface LoyaltyProcessingResult {
  updatedDefenseForces: DefenseForce[];
  updatedCells: TerritoryCell[];
  brokenForces: BrokenForceEvent[];
}

/**
 * Checks if a DefenseForce cell is under threat.
 * A cell is under threat if cell.isExposed is true (has enemy neighbors) or an enemy declared an attack targeting cellId.
 */
export function isForceUnderThreat(
  df: DefenseForce,
  cells: TerritoryCell[],
  declaredActions: DeclaredAction[] = []
): boolean {
  const cell = cells.find((c) => c.id === df.cellId);
  if (!cell) return false;
  const isExposed = Boolean(cell.isExposed);
  const enemyAttacking = declaredActions.some(
    (a) => a.targetCellId === df.cellId && a.actionIntent === 'attack' && a.factionId !== 'player'
  );
  return isExposed || enemyAttacking;
}

/**
 * Checks if a DefenseForce was reinforced this turn.
 * Reinforced if a player action exists targeting df.cellId with 'reinforce' intent.
 */
export function isForceReinforced(
  df: DefenseForce,
  declaredActions: DeclaredAction[] = []
): boolean {
  return declaredActions.some(
    (a) => a.targetCellId === df.cellId && a.actionIntent === 'reinforce' && a.factionId === 'player'
  );
}

/**
 * Evaluates Loyalty erosion, reinforcement restoration, and break conditions for Defense Forces.
 * If loyalty drops to <= 0 while under threat and unreinforced, the Force breaks without combat resolving,
 * and the territory cell falls to enemy occupation.
 */
export function processDefenseForceLoyalty(
  defenseForces: DefenseForce[] = [],
  cells: TerritoryCell[] = [],
  declaredActions: DeclaredAction[] = []
): LoyaltyProcessingResult {
  const brokenForces: BrokenForceEvent[] = [];
  let updatedCells = [...cells];
  const updatedDefenseForces: DefenseForce[] = [];

  for (const df of defenseForces) {
    const currentLoyalty = df.loyalty ?? DEFAULT_FORCE_LOYALTY;
    const underThreat = isForceUnderThreat(df, updatedCells, declaredActions);
    const reinforced = isForceReinforced(df, declaredActions);

    let newLoyalty = currentLoyalty;

    if (reinforced) {
      // Reinforcement restores loyalty back to max (100)
      newLoyalty = DEFAULT_FORCE_LOYALTY;
    } else if (underThreat) {
      // Unreinforced under threat -> erodes loyalty, modulated by district Allegiance (publicOpinion)
      const cell = updatedCells.find((c) => c.id === df.cellId);
      const allegiance = cell?.publicOpinion ?? 50; // 50 = neutral default
      const allegianceModifier = 1 + (50 - allegiance) / 100; // 0.5x at 100 allegiance to 1.5x at 0 allegiance
      const erosionThisTurn = Math.round(LOYALTY_EROSION_PER_UNREINFORCED_THREATENED_TURN * allegianceModifier);

      newLoyalty = Math.max(0, currentLoyalty - erosionThisTurn);
    }

    if (underThreat && !reinforced && newLoyalty <= 0) {
      // Force breaks! It collapses without fighting.
      const cell = updatedCells.find((c) => c.id === df.cellId);
      const cellName = cell?.name || 'District Cell';

      const attackingAction = declaredActions.find(
        (a) => a.targetCellId === df.cellId && a.actionIntent === 'attack' && a.factionId !== 'player'
      );
      const occupyingFaction: FactionId = (attackingAction
        ? attackingAction.factionId
        : cell?.owner && cell.owner !== 'player'
        ? cell.owner
        : 'tundra') as FactionId;

      brokenForces.push({
        forceName: df.name,
        cellName,
        occupyingFaction,
      });

      // Cell falls to the occupying enemy faction without combat resolving!
      updatedCells = updatedCells.map((c) => {
        if (c.id === df.cellId) {
          return {
            ...c,
            owner: occupyingFaction,
            assignedDefenseForceId: null,
            scouted: true,
          };
        }
        return c;
      });
      // Force is disbanded/broken (not added to updatedDefenseForces)
    } else {
      updatedDefenseForces.push({
        ...df,
        loyalty: newLoyalty,
      });
    }
  }

  return {
    updatedDefenseForces,
    updatedCells,
    brokenForces,
  };
}

/**
 * Restores a Defense Force's loyalty (e.g. when directly transferred units or reinforced in UI).
 */
export function restoreForceLoyalty(df: DefenseForce, amount: number = DEFAULT_FORCE_LOYALTY): DefenseForce {
  return {
    ...df,
    loyalty: Math.min(DEFAULT_FORCE_LOYALTY, (df.loyalty ?? DEFAULT_FORCE_LOYALTY) + amount),
  };
}
