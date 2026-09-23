/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Unit,
  OrcUnit,
  UnitShape,
  SHAPE_MATRIX,
  RACE_LEAN,
  DuelLog,
  BattleResult,
  Attack,
  Race,
} from "./types";

/**
 * Returns the index of the best defender against a given attacker shape.
 */
export function selectBestDefender(attackerShape: UnitShape, activeDefenders: Unit[]): number {
  let bestIdx = 0;
  let bestMult = -1;
  activeDefenders.forEach((def, idx) => {
    const mult = SHAPE_MATRIX[def.shape][attackerShape];
    if (mult > bestMult) {
      bestMult = mult;
      bestIdx = idx;
    }
  });
  return bestIdx;
}

/**
 * Resolves combat on a single tile using the Paired (Cascading) method.
 * Attackers and defenders are paired 1-by-1 in duels.
 */
export function resolvePaired(
  lane: number,
  attackers: OrcUnit[],
  defenders: Unit[],
  hasWall: boolean
): BattleResult {
  const duels: DuelLog[] = [];
  const activeAttackers = attackers.map(u => ({ ...u, currentStrength: u.baseStrength }));
  const activeDefenders = defenders.map(u => ({ ...u, currentStrength: u.currentStrength }));

  const initialAttackerCount = attackers.length;
  const initialDefenderCount = defenders.length;

  let duelCount = 0;

  // If there are no defenders, the wall does nothing and attackers breach instantly with zero damage
  if (activeDefenders.length === 0) {
    const remainingStrength = activeAttackers.reduce((sum, a) => sum + a.currentStrength, 0);
    const survivingAttackers = activeAttackers.map(a => ({
      id: a.id,
      shape: a.shape,
      baseStrength: a.currentStrength,
    }));
    return {
      lane,
      duels: [],
      victory: false,
      attackerInitialCount: initialAttackerCount,
      defenderInitialCount: 0,
      breached: activeAttackers.length > 0,
      attackerRemainingStrength: remainingStrength,
      survivingAttackers,
    };
  }

  // Resolve 1v1 cascading duels
  while (activeAttackers.length > 0 && activeDefenders.length > 0) {
    const attacker = activeAttackers[0];
    const defIdx = selectBestDefender(attacker.shape, activeDefenders);
    const defender = activeDefenders[defIdx];

    const attShape = attacker.shape;
    const defShape = defender.shape;

    // Multipliers
    const attMult = SHAPE_MATRIX[attShape][defShape] * RACE_LEAN.ORC;
    // Wall requires garrison: Since activeDefenders.length > 0, wall is active!
    const wallMult = hasWall ? 2.0 : 1.0;
    const defMult = SHAPE_MATRIX[defShape][attShape] * RACE_LEAN.PLAYER * wallMult;

    // Effective strengths
    const attEff = attacker.currentStrength * attMult;
    const defEff = defender.currentStrength * defMult;

    let outcome: "defender_wins" | "attacker_wins" | "both_die";
    let attRemaining = 0;
    let defRemaining = 0;

    const diff = defEff - attEff;

    if (Math.abs(diff) < 0.001) {
      outcome = "both_die";
      activeAttackers.shift();
      activeDefenders.splice(defIdx, 1);
    } else if (diff > 0) {
      outcome = "defender_wins";
      // Defender survives, strength is reduced by attacker's effective hit
      const newDefEff = defEff - attEff;
      defender.currentStrength = Number((newDefEff / defMult).toFixed(1));
      defRemaining = defender.currentStrength;
      activeAttackers.shift();
    } else {
      outcome = "attacker_wins";
      // Attacker survives, strength is reduced by defender's effective hit
      const newAttEff = attEff - defEff;
      attacker.currentStrength = Number((newAttEff / attMult).toFixed(1));
      attRemaining = attacker.currentStrength;
      activeDefenders.splice(defIdx, 1);
    }

    duels.push({
      id: `${lane}-duel-${duelCount++}`,
      attackerShape: attShape,
      attackerInitialStrength: attacker.currentStrength + (outcome === "attacker_wins" ? (attEff - defEff) / attMult : 0), // trace back
      defenderShape: defShape,
      defenderInitialStrength: defender.currentStrength + (outcome === "defender_wins" ? (defEff - attEff) / defMult : 0),
      defenderHasWall: hasWall,
      attackerEffectiveStrength: Number(attEff.toFixed(1)),
      defenderEffectiveStrength: Number(defEff.toFixed(1)),
      outcome,
      attackerRemainingStrength: Number(attRemaining.toFixed(1)),
      defenderRemainingStrength: Number(defRemaining.toFixed(1)),
    });
  }

  // If attackers are completely wiped out, victory!
  const victory = activeAttackers.length === 0;
  // If attackers remain and defenders are wiped out, breached!
  const breached = activeAttackers.length > 0 && activeDefenders.length === 0;

  const attackerRemainingStrength = victory
    ? 0
    : Number(activeAttackers.reduce((sum, a) => sum + a.currentStrength, 0).toFixed(1));

  const survivingAttackers = victory
    ? []
    : activeAttackers.map(a => ({
        id: a.id,
        shape: a.shape,
        baseStrength: a.currentStrength,
      }));

  return {
    lane,
    duels,
    victory,
    attackerInitialCount: initialAttackerCount,
    defenderInitialCount: initialDefenderCount,
    breached,
    survivingDefenders: activeDefenders,
    attackerRemainingStrength,
    survivingAttackers,
  };
}

/**
 * Resolves combat using the Aggregate (naive) method for comparison.
 * Total effective strengths are summed and compared.
 */
export function resolveAggregate(
  lane: number,
  attackers: OrcUnit[],
  defenders: Unit[],
  hasWall: boolean
): BattleResult {
  const initialAttackerCount = attackers.length;
  const initialDefenderCount = defenders.length;

  if (defenders.length === 0) {
    const survivingAttackers = attackers.map(a => ({
      id: a.id,
      shape: a.shape,
      baseStrength: a.baseStrength,
    }));
    return {
      lane,
      duels: [],
      victory: false,
      attackerInitialCount: initialAttackerCount,
      defenderInitialCount: 0,
      breached: attackers.length > 0,
      survivingAttackers,
    };
  }

  // Calculate sum of effective strengths
  let totalAttEff = 0;
  attackers.forEach(att => {
    // Average shape multiplier vs all defenders, or simplified standard multiplier (e.g. 1.0)
    // To make aggregate representative, let's match defender shapes
    let sumMults = 0;
    defenders.forEach(def => {
      sumMults += SHAPE_MATRIX[att.shape][def.shape];
    });
    const avgMult = (sumMults / defenders.length) * RACE_LEAN.ORC;
    totalAttEff += att.baseStrength * avgMult;
  });

  let totalDefEff = 0;
  const wallMult = hasWall ? 2.0 : 1.0;
  defenders.forEach(def => {
    let sumMults = 0;
    attackers.forEach(att => {
      sumMults += SHAPE_MATRIX[def.shape][att.shape];
    });
    const avgMult = (sumMults / attackers.length) * RACE_LEAN.PLAYER * wallMult;
    totalDefEff += def.currentStrength * avgMult;
  });

  const victory = totalDefEff >= totalAttEff;
  const breached = totalAttEff > totalDefEff;

  // Mock a single aggregated duel log for display
  const duels: DuelLog[] = [
    {
      id: `${lane}-aggregate`,
      attackerShape: attackers[0]?.shape || UnitShape.CIRCLE,
      attackerInitialStrength: attackers.reduce((acc, a) => acc + a.baseStrength, 0),
      defenderShape: defenders[0]?.shape || UnitShape.CIRCLE,
      defenderInitialStrength: defenders.reduce((acc, d) => acc + d.currentStrength, 0),
      defenderHasWall: hasWall,
      attackerEffectiveStrength: Number(totalAttEff.toFixed(1)),
      defenderEffectiveStrength: Number(totalDefEff.toFixed(1)),
      outcome: victory ? "defender_wins" : "attacker_wins",
      attackerRemainingStrength: victory ? 0 : Number((totalAttEff - totalDefEff).toFixed(1)),
      defenderRemainingStrength: victory ? Number((totalDefEff - totalAttEff).toFixed(1)) : 0,
    }
  ];

  const survivingDefenders: Unit[] = [];
  if (victory) {
    const remainingStrength = Number((totalDefEff - totalAttEff).toFixed(1));
    defenders.forEach((def, idx) => {
      const u = { ...def };
      if (idx === 0) {
        u.currentStrength = remainingStrength;
      }
      survivingDefenders.push(u);
    });
  }

  const attackerRemainingStrength = victory
    ? 0
    : Number((totalAttEff - totalDefEff).toFixed(1));

  const survivingAttackers: OrcUnit[] = [];
  if (!victory && attackers.length > 0) {
    const remainingStrength = Number((totalAttEff - totalDefEff).toFixed(1));
    attackers.forEach((att, idx) => {
      if (idx === 0) {
        survivingAttackers.push({
          id: att.id,
          shape: att.shape,
          baseStrength: remainingStrength,
        });
      }
    });
  }

  return {
    lane,
    duels,
    victory,
    attackerInitialCount: initialAttackerCount,
    defenderInitialCount: initialDefenderCount,
    breached,
    survivingDefenders,
    attackerRemainingStrength,
    survivingAttackers,
  };
}

/**
 * battle_ring() resolves multiple simultaneous tile fights.
 * It iterates through active attacks, resolves them on the respective lane's frontier segment,
 * and compiles the overall results.
 * 
 * @param attacks Active attacks on lanes
 * @param units Player's unit roster
 * @param walls Player's walls state
 * @param frontiers Current active frontier segment per lane
 * @param usePaired Whether to use the paired cascading method or aggregate method
 */
export function battle_ring(
  attacks: Attack[],
  units: Unit[],
  walls: Record<string, boolean>, // key is "lane-segment"
  frontiers: Record<number, number>,
  usePaired: boolean = true
): {
  results: Record<number, BattleResult>;
  survivingUnits: Unit[];
} {
  const results: Record<number, BattleResult> = {};
  const survivingUnits: Unit[] = [];

  // Group existing player units by their location
  const unitsByLocation: Record<string, Unit[]> = {};
  units.forEach(u => {
    const key = `${u.lane}-${u.segment}`;
    if (!unitsByLocation[key]) {
      unitsByLocation[key] = [];
    }
    unitsByLocation[key].push(u);
  });

  // Resolve fights for lanes with active attacks
  attacks.forEach(attack => {
    const lane = attack.lane;
    const activeSegment = frontiers[lane]; // battle happens at the active frontier segment
    const locationKey = `${lane}-${activeSegment}`;
    
    const tileDefenders = unitsByLocation[locationKey] || [];
    const hasWall = !!walls[locationKey];

    const result = usePaired
      ? resolvePaired(lane, attack.units, tileDefenders, hasWall)
      : resolveAggregate(lane, attack.units, tileDefenders, hasWall);

    results[lane] = result;

    // If defenders won, map updated healths back to surviving units
    if (result.victory && result.survivingDefenders) {
      survivingUnits.push(...result.survivingDefenders);
    }
  });

  // Keep all units that were on tiles NOT involved in any fight
  units.forEach(u => {
    const activeAttackOnLane = attacks.find(a => a.lane === u.lane);
    const activeSegment = frontiers[u.lane];
    
    // If there's no attack on this lane, or the unit is NOT on the active frontier segment
    // (e.g. they are on segment 1 but the frontier is segment 2), they survive at full strength.
    if (!activeAttackOnLane || u.segment !== activeSegment) {
      survivingUnits.push({ ...u });
    }
  });

  return {
    results,
    survivingUnits,
  };
}


