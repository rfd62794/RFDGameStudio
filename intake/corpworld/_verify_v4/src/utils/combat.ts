import { CellCombatState, UnitGroup, CombatLogEntry, UnitType } from '../types';

// Rock-Paper-Scissors relationships:
// circle beats square
// square beats triangle
// triangle beats circle
export const RPS_COUNTERS: { [key in UnitType]: UnitType } = {
  circle: 'square',
  square: 'triangle',
  triangle: 'circle'
};

const SHAPE_LABELS: { [key in UnitType]: string } = {
  circle: '● Circle',
  square: '■ Square',
  triangle: '▲ Triangle'
};

function getUnitCount(group: UnitGroup): number {
  return group.circle + group.square + group.triangle;
}

// Deep clone a UnitGroup
function cloneUnitGroup(group: UnitGroup): UnitGroup {
  return { ...group };
}

// Find if any units remain in a group
function hasUnits(group: UnitGroup): boolean {
  return getUnitCount(group) > 0;
}

export const SHAPE_MATRIX: { [attacker in UnitType]: { [defender in UnitType]: number } } = {
  circle: {
    circle: 0.4,
    square: 0.7,
    triangle: 0.2
  },
  square: {
    circle: 0.2,
    square: 0.4,
    triangle: 0.7
  },
  triangle: {
    circle: 0.7,
    square: 0.2,
    triangle: 0.4
  }
};

export function resolveCellCombat(
  cellId: number,
  cellName: string,
  initialUnits: { [corpId: string]: UnitGroup },
  originalOwnerId: string | null,
  fortifications: number,
  corpNames: { [corpId: string]: string }
): CellCombatState {
  const finalUnits: { [corpId: string]: UnitGroup } = {};
  for (const corpId in initialUnits) {
    finalUnits[corpId] = cloneUnitGroup(initialUnits[corpId]);
  }

  let fortificationsLeft = originalOwnerId && finalUnits[originalOwnerId] ? fortifications : 0;
  const initialFortifications = fortificationsLeft;
  const roundsLog: CombatLogEntry[] = [];
  let round = 1;

  // Active corps in the fight (with units > 0)
  const getActiveCorps = () => Object.keys(finalUnits).filter(cid => hasUnits(finalUnits[cid]));

  while (getActiveCorps().length > 1 && round <= 15) { // max 15 rounds to prevent infinite loops
    const activeCorps = getActiveCorps();
    const roundDamage: { [corpId: string]: UnitGroup } = {};
    for (const cid of activeCorps) {
      roundDamage[cid] = { circle: 0, square: 0, triangle: 0 };
    }

    const roundMessages: string[] = [];

    // Gather all individual soldiers stably based on current unit floor counts
    interface Soldier {
      corpId: string;
      type: UnitType;
      idInGroup: number;
    }

    const soldiers: Soldier[] = [];
    for (const cid of activeCorps) {
      const g = finalUnits[cid];
      const circleCount = Math.floor(g.circle);
      const squareCount = Math.floor(g.square);
      const triangleCount = Math.floor(g.triangle);
      for (let i = 0; i < circleCount; i++) soldiers.push({ corpId: cid, type: 'circle', idInGroup: i });
      for (let i = 0; i < squareCount; i++) soldiers.push({ corpId: cid, type: 'square', idInGroup: i });
      for (let i = 0; i < triangleCount; i++) soldiers.push({ corpId: cid, type: 'triangle', idInGroup: i });
    }

    // Stable weave sort (deterministic attack order)
    soldiers.sort((a, b) => {
      if (a.idInGroup !== b.idInGroup) return a.idInGroup - b.idInGroup;
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return a.corpId.localeCompare(b.corpId);
    });

    // Each soldier executes one attack
    for (const attacker of soldiers) {
      const enemyCorps = activeCorps.filter(cid => cid !== attacker.corpId);
      if (enemyCorps.length === 0) continue;

      // Find the greedy best-counter target
      const counterTargetType = RPS_COUNTERS[attacker.type];
      let selectedTargetCorp: string | null = null;
      let selectedTargetType: UnitType | null = null;

      // 1. Look for a counter target
      for (const targetCorpId of enemyCorps) {
        if (finalUnits[targetCorpId][counterTargetType] - roundDamage[targetCorpId][counterTargetType] > 0) {
          selectedTargetCorp = targetCorpId;
          selectedTargetType = counterTargetType;
          break;
        }
      }

      // 2. Look for same-type target
      if (!selectedTargetCorp) {
        for (const targetCorpId of enemyCorps) {
          if (finalUnits[targetCorpId][attacker.type] - roundDamage[targetCorpId][attacker.type] > 0) {
            selectedTargetCorp = targetCorpId;
            selectedTargetType = attacker.type;
            break;
          }
        }
      }

      // 3. Target anything available
      if (!selectedTargetCorp) {
        const remainingTypes: UnitType[] = ['circle', 'square', 'triangle'];
        for (const targetCorpId of enemyCorps) {
          for (const t of remainingTypes) {
            if (finalUnits[targetCorpId][t] - roundDamage[targetCorpId][t] > 0) {
              selectedTargetCorp = targetCorpId;
              selectedTargetType = t;
              break;
            }
          }
          if (selectedTargetCorp) break;
        }
      }

      // If we found a target, resolve the clash deterministically!
      if (selectedTargetCorp && selectedTargetType) {
        const corpNameAttacker = corpNames[attacker.corpId] || attacker.corpId;
        const corpNameTarget = corpNames[selectedTargetCorp] || selectedTargetCorp;

        const attackerMultiplier = SHAPE_MATRIX[attacker.type][selectedTargetType];
        const defenderMultiplier = SHAPE_MATRIX[selectedTargetType][attacker.type];
        
        const attackerCurrentStrength = Math.max(0, finalUnits[attacker.corpId][attacker.type] - roundDamage[attacker.corpId][attacker.type]);
        const attackerEffective = attackerCurrentStrength * attackerMultiplier;
        const damage = attackerEffective / defenderMultiplier;

        let damageDealt = damage;
        let absorbed = 0;
        if (selectedTargetCorp === originalOwnerId && fortificationsLeft > 0) {
          absorbed = Math.min(damage, fortificationsLeft);
          fortificationsLeft -= absorbed;
          damageDealt = damage - absorbed;
        }

        if (damageDealt > 0) {
          roundDamage[selectedTargetCorp][selectedTargetType] += damageDealt;
        }

        if (absorbed > 0) {
          if (damageDealt > 0) {
            roundMessages.push(
              `[Fortification Shield] ${corpNameAttacker}'s ${SHAPE_LABELS[attacker.type]} targeted ${corpNameTarget}'s ${SHAPE_LABELS[selectedTargetType]}, but fortification absorbed ${absorbed.toFixed(2)} of the blast. Leftover ${damageDealt.toFixed(2)} damage was dealt.`
            );
          } else {
            roundMessages.push(
              `[Fortification Shield] ${corpNameAttacker}'s ${SHAPE_LABELS[attacker.type]} targeted ${corpNameTarget}'s ${SHAPE_LABELS[selectedTargetType]}, but local fortification absorbed the blast.`
            );
          }
        } else {
          roundMessages.push(
            `[Combat Hit] ${corpNameAttacker} ${SHAPE_LABELS[attacker.type]} reduced ${corpNameTarget} ${SHAPE_LABELS[selectedTargetType]} by ${damageDealt.toFixed(2)} units.`
          );
        }
      }
    }

    // Apply casualties simultaneously
    for (const cid of activeCorps) {
      finalUnits[cid].circle = Math.max(0, finalUnits[cid].circle - roundDamage[cid].circle);
      finalUnits[cid].square = Math.max(0, finalUnits[cid].square - roundDamage[cid].square);
      finalUnits[cid].triangle = Math.max(0, finalUnits[cid].triangle - roundDamage[cid].triangle);
    }

    // Record round log with deep copies of finalUnits
    const survivingState: { [corpId: string]: UnitGroup } = {};
    for (const cid in finalUnits) {
      survivingState[cid] = {
        circle: Math.round(finalUnits[cid].circle * 100) / 100,
        square: Math.round(finalUnits[cid].square * 100) / 100,
        triangle: Math.round(finalUnits[cid].triangle * 100) / 100
      };
    }

    roundsLog.push({
      round,
      message: roundMessages.join('\n') || 'Both forces sized each other up, maintaining defensive lines.',
      survivingUnits: survivingState
    });

    round++;
  }

  // Round final units to nearest integer at combat conclusion
  for (const cid in finalUnits) {
    finalUnits[cid].circle = Math.round(finalUnits[cid].circle);
    finalUnits[cid].square = Math.round(finalUnits[cid].square);
    finalUnits[cid].triangle = Math.round(finalUnits[cid].triangle);
  }

  // Determine Victor
  const activeCorpsAtEnd = getActiveCorps();
  let victorId: string | null = null;
  if (activeCorpsAtEnd.length === 1) {
    victorId = activeCorpsAtEnd[0];
  } else if (activeCorpsAtEnd.length > 1) {
    // Tie-breaker: largest force remaining
    let maxCount = -1;
    let bestCorp: string | null = null;
    for (const cid of activeCorpsAtEnd) {
      const cnt = getUnitCount(finalUnits[cid]);
      if (cnt > maxCount) {
        maxCount = cnt;
        bestCorp = cid;
      }
    }
    victorId = bestCorp;
  }

  return {
    cellId,
    cellName,
    initialUnits,
    roundsLog,
    victorId,
    finalUnits,
    fortificationsLost: initialFortifications - Math.round(fortificationsLeft)
  };
}
