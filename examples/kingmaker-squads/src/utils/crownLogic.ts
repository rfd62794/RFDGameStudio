import { DefenseForce, TerritoryCell, UnitState } from '../types';
import { createUnit } from '../data/archetypes';
import { soundFx } from './audio';

export function recalculateCellExposures(cells: TerritoryCell[] = []): TerritoryCell[] {
  return (cells || []).map((cell) => {
    if (cell.owner !== 'player') {
      return { ...cell, isExposed: false };
    }

    const hasEnemyNeighbor = (cell.neighborIds || []).some((nbrId) => {
      const neighborCell = cells.find((c) => c.id === nbrId);
      return neighborCell && neighborCell.owner !== 'player';
    });

    return {
      ...cell,
      isExposed: hasEnemyNeighbor,
    };
  });
}

export function enforceCoronation(
  currentUnits: UnitState[],
  kingSettlingTurns: number = 0,
  forceNewKingReason?: string
) {
  let kingUnit = currentUnits.find((u) => u.isKing);

  if (!kingUnit && currentUnits.length > 0) {
    const sorted = [...currentUnits].sort((a, b) => {
      const rankValue = { elite: 3, veteran: 2, recruit: 1 };
      if (rankValue[b.rank] !== rankValue[a.rank]) {
        return rankValue[b.rank] - rankValue[a.rank];
      }
      return b.survivalFights - a.survivalFights;
    });

    const newKing = { ...sorted[0], isKing: true };
    soundFx.playCoronationHorn();

    return {
      updatedUnits: currentUnits.map((u) => (u.id === newKing.id ? newKing : u)),
      newKingId: newKing.id,
      coronationEvent: {
        unitName: newKing.name,
        archetype: newKing.archetype,
        reason: forceNewKingReason || 'Prior Cell Leader fallen or ousted. Mandatory leadership enacted.',
      },
      settlingTurns: 2, // New King is vulnerable for 2 turns!
    };
  }

  return {
    updatedUnits: currentUnits,
    newKingId: kingUnit ? kingUnit.id : null,
    coronationEvent: null,
    settlingTurns: kingSettlingTurns,
  };
}

export function evaluateDefenseForceLifecycle(
  cells: TerritoryCell[] = [],
  defenseForces: DefenseForce[] = [],
  availableUnits: UnitState[] = []
): {
  updatedDefenseForces: DefenseForce[];
  proposal: {
    fromDefenseForceId: string;
    toCellId: string;
    status: 'proposed' | 'accepted' | 'rejected';
  } | null;
  usedUnitIds?: string[];
} {
  const exposedPlayerCells = (cells || []).filter((c) => c.owner === 'player' && c.isExposed);
  const coveredCellIds = (defenseForces || []).map((df) => df.cellId);
  const gapCells = exposedPlayerCells.filter((c) => !coveredCellIds.includes(c.id));

  const freedForces = (defenseForces || []).filter((df) => !exposedPlayerCells.some((c) => c.id === df.cellId));

  let updatedDefenseForces = [...(defenseForces || [])];
  let proposal: {
    fromDefenseForceId: string;
    toCellId: string;
    status: 'proposed' | 'accepted' | 'rejected';
  } | null = null;

  let handledGapCellId: string | null = null;

  if (freedForces.length > 0 && gapCells.length === 1) {
    // Single-gap auto-move: SUGGESTED, not silent
    proposal = {
      fromDefenseForceId: freedForces[0].id,
      toCellId: gapCells[0].id,
      status: 'proposed',
    };
    handledGapCellId = gapCells[0].id;
  }

  // Auto-form Defense Forces for remaining gap cells if available units exist
  const unhandledGapCells = gapCells.filter((c) => c.id !== handledGapCellId);
  // Ensure king-flagged units are never freshly consumed for auto-formation garrisons
  let remainingAvailable = (availableUnits || []).filter((u) => !u.isKing);
  const usedUnitIds: string[] = [];

  for (const gapCell of unhandledGapCells) {
    let forceUnitsToTake: UnitState[] = [];

    if (remainingAvailable.length > 0) {
      forceUnitsToTake = remainingAvailable.slice(0, Math.min(2, remainingAvailable.length));
    } else {
      // Unconditionally draft a Guard Pawn for this Exposed Tile garrison so EVERY Exposed Tile gets a Defensive Squad
      const garrisonGuard = createUnit('pawn', `${gapCell.name} Guard`, 'recruit');
      forceUnitsToTake = [garrisonGuard];
    }

    // Ensure permanent district leader is included in force units
    const districtLeader = gapCell.autoGenLeaderUnit;
    if (districtLeader && !forceUnitsToTake.some((u) => u.id === districtLeader.id)) {
      forceUnitsToTake = [districtLeader, ...forceUnitsToTake];
    }

    // Atomically crown a Leader for this new force
    const coronationRes = enforceCoronation(forceUnitsToTake, 2, 'Auto-formed District Cell leadership assigned.');
    const leaderId = gapCell.autoGenLeaderId || coronationRes.newKingId || (districtLeader ? districtLeader.id : 'leader_fallback');

    const finalUnits = coronationRes.updatedUnits.map((u) =>
      u.id === leaderId ? { ...u, isKing: true } : u
    );

    const newForce: DefenseForce = {
      id: `df_auto_${gapCell.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      cellId: gapCell.id,
      name: `${gapCell.name} District Cell`,
      units: finalUnits,
      autoGenLeaderId: leaderId,
      stewardUnitId: null,
      kingUnitId: leaderId,
      settlingTurnsLeft: 2,
    };

    updatedDefenseForces.push(newForce);

      const takenExistingIds = forceUnitsToTake
        .filter((u) => availableUnits.some((au) => au.id === u.id))
        .map((u) => u.id);
      usedUnitIds.push(...takenExistingIds);
      remainingAvailable = remainingAvailable.filter((u) => !takenExistingIds.includes(u.id));
    }

  return {
    updatedDefenseForces,
    proposal,
    usedUnitIds,
  };
}
