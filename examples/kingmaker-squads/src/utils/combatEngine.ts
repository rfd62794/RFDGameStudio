/**
 * Deterministic Auto-Combat Engine for KingMaker Squads (Design.md Revision 2: 5x5 Grid Real Chess Movement)
 */

import {
  CombatAction,
  CombatFrame,
  CombatResult,
  CombatUnit,
  SynergyBonus,
  UnitState,
} from '../types';

import { BOARD_SIZE } from '../constants';

import {
  GridPos,
  isOutOfBounds,
  isSamePos,
  getSlidingMoves,
  getKnightMoves,
  getPawnMoves,
  getLegalMoves,
  canAttackFrom,
} from './chessMovement';

import { calculateSynergies } from './synergies';

// Re-export geometry, movement, and synergy functions for backward compatibility & direct standalone usage
export type { GridPos } from './chessMovement';
export {
  isOutOfBounds,
  isSamePos,
  getSlidingMoves,
  getKnightMoves,
  getPawnMoves,
  getLegalMoves,
  canAttackFrom,
} from './chessMovement';

export { calculateSynergies } from './synergies';

export function simulateCombat(
  playerSquad: UnitState[],
  enemySquad: UnitState[],
  isKingCell: boolean = false
): CombatResult {
  const activeSynergies = calculateSynergies(playerSquad).filter((s) => s.isActive);
  const batteryBonus = activeSynergies.find((s) => s.type === 'battery' || s.type === 'iron_vanguard');
  const shadowBonus = activeSynergies.find((s) => s.type === 'royal_guard' || s.type === 'knight_outpost' || s.type === 'shadow_flankers');
  const holyBonus = activeSynergies.find((s) => s.type === 'bishop_pair' || s.type === 'holy_sanctum');
  const ironBonus = batteryBonus ? 4 : 0;

  // Helper to assign formation grid positions on 8x8 board
  const assignFormationPos = (units: UnitState[], isPlayer: boolean): CombatUnit[] => {
    const assignedPositions: GridPos[] = [];

    return units.map((u, idx) => {
      const isFrontline = u.archetype === 'rook' || u.archetype === 'pawn';
      const preferredX = isPlayer
        ? (isFrontline ? 1 : 0)
        : (isFrontline ? BOARD_SIZE - 2 : BOARD_SIZE - 1);
      let chosenPos: GridPos | null = null;

      // Try preferred column y = idx % BOARD_SIZE
      for (let y = 0; y < BOARD_SIZE; y++) {
        const testY = (idx + y) % BOARD_SIZE;
        if (!assignedPositions.some((p) => p.x === preferredX && p.y === testY)) {
          chosenPos = { x: preferredX, y: testY };
          break;
        }
      }

      // Fallback to secondary formation column
      if (!chosenPos) {
        const altX = isPlayer
          ? (preferredX === 1 ? 0 : 1)
          : (preferredX === BOARD_SIZE - 2 ? BOARD_SIZE - 1 : BOARD_SIZE - 2);
        for (let y = 0; y < BOARD_SIZE; y++) {
          const testY = (idx + y) % BOARD_SIZE;
          if (!assignedPositions.some((p) => p.x === altX && p.y === testY)) {
            chosenPos = { x: altX, y: testY };
            break;
          }
        }
      }

      if (!chosenPos) {
        chosenPos = { x: isPlayer ? 0 : BOARD_SIZE - 1, y: idx % BOARD_SIZE };
      }

      assignedPositions.push(chosenPos);

      const bonusHp = isPlayer ? ironBonus * 5 : 0;
      const bonusDef = isPlayer ? ironBonus : 0;

      return {
        ...u,
        currentHp: u.stats.hp + bonusHp,
        stats: {
          ...u.stats,
          maxHp: u.stats.maxHp + bonusHp,
          def: u.stats.def + bonusDef,
          speed: u.stats.speed + (isPlayer && shadowBonus ? 3 : 0),
        },
        position: chosenPos,
        team: isPlayer ? 'player' : 'enemy',
        initiative: u.stats.speed + Math.floor(Math.random() * 5),
      };
    });
  };

  const playerCombatUnits = assignFormationPos(playerSquad, true);
  const enemyCombatUnits = assignFormationPos(enemySquad, false);

  let allUnits: CombatUnit[] = [...playerCombatUnits, ...enemyCombatUnits];
  const frames: CombatFrame[] = [];
  let turnStep = 1;
  const maxTurns = 30; // 8x8 Grid Pacing cap (increased to accommodate larger board movement)

  // Initial setup frame
  frames.push({
    step: 0,
    units: JSON.parse(JSON.stringify(allUnits)),
    log: {
      turn: 0,
      actorId: 'system',
      actorName: 'War Horn',
      actorTeam: 'player',
      actionType: 'ability',
      description: 'Squads assemble on the 8x8 battle grid. Combat begins!',
    },
  });

  let kingEscaped = false;

  while (turnStep <= maxTurns) {
    const playerAlive = allUnits.filter((u) => u.team === 'player' && u.currentHp > 0);
    const enemyAlive = allUnits.filter((u) => u.team === 'enemy' && u.currentHp > 0);

    if (playerAlive.length === 0 || enemyAlive.length === 0) break;

    // Sort turn order by initiative
    const turnQueue = [...allUnits]
      .filter((u) => u.currentHp > 0)
      .sort((a, b) => b.initiative - a.initiative);

    for (const actor of turnQueue) {
      if (actor.currentHp <= 0) continue;

      const playerRemaining = allUnits.filter((u) => u.team === 'player' && u.currentHp > 0);
      const enemyRemaining = allUnits.filter((u) => u.team === 'enemy' && u.currentHp > 0);

      if (playerRemaining.length === 0 || enemyRemaining.length === 0) break;

      const allies = allUnits.filter((u) => u.team === actor.team && u.currentHp > 0);
      const opponents = allUnits.filter((u) => u.team !== actor.team && u.currentHp > 0);

      if (opponents.length === 0) break;

      // Special action: Bishop healing
      if (actor.archetype === 'bishop' && Math.random() < 0.45) {
        const woundedAlly = [...allies].sort((a, b) => a.currentHp / a.stats.maxHp - b.currentHp / b.stats.maxHp)[0];
        if (woundedAlly && woundedAlly.currentHp < woundedAlly.stats.maxHp) {
          const healAmt = Math.round(actor.stats.atk * (holyBonus ? 1.3 : 1.0) + 10);
          woundedAlly.currentHp = Math.min(woundedAlly.stats.maxHp, woundedAlly.currentHp + healAmt);

          frames.push({
            step: turnStep++,
            units: JSON.parse(JSON.stringify(allUnits)),
            log: {
              turn: turnStep,
              actorId: actor.id,
              actorName: actor.name,
              actorTeam: actor.team,
              actionType: 'heal',
              targetId: woundedAlly.id,
              targetName: woundedAlly.name,
              value: healAmt,
              gridFrom: { ...actor.position },
              gridTo: { ...woundedAlly.position },
              description: `${actor.name} casts Radiant Benediction, healing ${woundedAlly.name} for +${healAmt} HP.`,
            },
          });
          continue;
        }
      }

      // --- DESIGN.MD REVISION 2: MOVE & ATTACK SAME TURN ---
      const initialPos = { ...actor.position };

      // 1. Check legal moves & candidate positions
      const legalMoves = getLegalMoves(actor, allUnits);
      const candidatePositions = [initialPos, ...legalMoves];

      // Evaluate best candidate position
      let bestPos = initialPos;
      let bestTarget: CombatUnit | null = null;
      let maxScore = -99999;

      for (const candPos of candidatePositions) {
        // Can actor attack any opponent from candPos?
        const reachableTargets = opponents.filter((op) => canAttackFrom(actor, candPos, op, allUnits));

        if (reachableTargets.length > 0) {
          // Select target by archetype priority
          let target: CombatUnit;
          if (actor.archetype === 'knight') {
            target = reachableTargets.find((u) => u.isKing) || reachableTargets.sort((a, b) => a.currentHp - b.currentHp)[0];
          } else {
            const taunter = reachableTargets.find((u) => u.archetype === 'rook');
            target = taunter || reachableTargets.find((u) => u.isKing) || reachableTargets.sort((a, b) => a.currentHp - b.currentHp)[0];
          }

          const targetPriority = target.isKing ? 500 : target.archetype === 'rook' ? 200 : 100;
          const distMoved = Math.abs(candPos.x - initialPos.x) + Math.abs(candPos.y - initialPos.y);
          const score = 1000 + targetPriority - distMoved;

          if (score > maxScore) {
            maxScore = score;
            bestPos = candPos;
            bestTarget = target;
          }
        } else {
          // Repositioning candidate: move towards closest opponent
          const closestOpp = [...opponents].sort((a, b) => {
            const distA = Math.abs(candPos.x - a.position.x) + Math.abs(candPos.y - a.position.y);
            const distB = Math.abs(candPos.x - b.position.x) + Math.abs(candPos.y - b.position.y);
            return distA - distB;
          })[0];

          if (closestOpp) {
            const distToOpp = Math.abs(candPos.x - closestOpp.position.x) + Math.abs(candPos.y - closestOpp.position.y);
            const score = 100 - distToOpp;

            if (score > maxScore) {
              maxScore = score;
              bestPos = candPos;
              bestTarget = null;
            }
          }
        }
      }

      // Execute movement
      const hasMoved = !isSamePos(initialPos, bestPos);
      if (hasMoved) {
        actor.position = { ...bestPos };
      }

      // If a target is in attack range after movement, resolve attack
      if (bestTarget) {
        let baseAtk = actor.stats.atk;

        if (actor.hasHonorScar && isKingCell) baseAtk *= 1.3;

        if (actor.archetype === 'pawn') {
          const adjacentPawns = allies.filter((a) => a.archetype === 'pawn' && a.id !== actor.id).length;
          baseAtk += adjacentPawns * 3;
        }

        const isCrit = shadowBonus && Math.random() < 0.25;
        if (isCrit) baseAtk *= 1.5;

        const rawDamage = Math.max(5, baseAtk - Math.floor(bestTarget.stats.def * 0.4));
        const finalDamage = Math.round(rawDamage);

        // Check fatal blow to King with Escort
        const teamEscort = allUnits.find(
          (u) => u.team === bestTarget!.team && u.archetype === 'knight' && u.isEscort && u.currentHp > 0
        );

        if (bestTarget.isKing && bestTarget.currentHp - finalDamage <= 0 && teamEscort) {
          bestTarget.currentHp = 1;
          kingEscaped = true;

          frames.push({
            step: turnStep++,
            units: JSON.parse(JSON.stringify(allUnits)),
            log: {
              turn: turnStep,
              actorId: teamEscort.id,
              actorName: teamEscort.name,
              actorTeam: teamEscort.team,
              actionType: 'escort_save',
              targetId: bestTarget.id,
              targetName: bestTarget.name,
              gridFrom: hasMoved ? initialPos : undefined,
              gridTo: { ...bestTarget.position },
              description: `ESCORT ESCAPE! ${teamEscort.name} shielding ${bestTarget.name} from fatal strike! The Cell Leader flees ousted with 1 HP!`,
            },
          });
        } else {
          bestTarget.currentHp -= finalDamage;

          frames.push({
            step: turnStep++,
            units: JSON.parse(JSON.stringify(allUnits)),
            log: {
              turn: turnStep,
              actorId: actor.id,
              actorName: actor.name,
              actorTeam: actor.team,
              actionType: 'attack',
              targetId: bestTarget.id,
              targetName: bestTarget.name,
              value: finalDamage,
              isCritical: isCrit,
              gridFrom: hasMoved ? initialPos : undefined,
              gridTo: { ...bestTarget.position },
              description: `${actor.name} ${hasMoved ? 'advances and ' : ''}attacks ${bestTarget.name} dealing ${finalDamage} damage${isCrit ? ' (CRITICAL STRIKE!)' : ''}.`,
            },
          });

          if (bestTarget.currentHp <= 0) {
            bestTarget.currentHp = 0;
            frames.push({
              step: turnStep++,
              units: JSON.parse(JSON.stringify(allUnits)),
              log: {
                turn: turnStep,
                actorId: bestTarget.id,
                actorName: bestTarget.name,
                actorTeam: bestTarget.team,
                actionType: 'defeat',
                description: `${bestTarget.name} falls in battle!`,
              },
            });
          }
        }
      } else if (hasMoved) {
        // Repositioning turn only
        frames.push({
          step: turnStep++,
          units: JSON.parse(JSON.stringify(allUnits)),
          log: {
            turn: turnStep,
            actorId: actor.id,
            actorName: actor.name,
            actorTeam: actor.team,
            actionType: 'move',
            gridFrom: initialPos,
            gridTo: { ...actor.position },
            description: `${actor.name} advances across the 8x8 board to position (${actor.position.x}, ${actor.position.y}).`,
          },
        });
      }
    }
  }

  const finalPlayerAlive = allUnits.filter((u) => u.team === 'player' && u.currentHp > 0);
  const isPlayerWinner = finalPlayerAlive.length > 0;

  // Separate survivors & casualties
  const playerSurvivors: UnitState[] = [];
  const playerCasualties: UnitState[] = [];

  playerCombatUnits.forEach((cu) => {
    const original = playerSquad.find((u) => u.id === cu.id);
    if (!original) return;

    if (cu.currentHp > 0) {
      playerSurvivors.push({
        ...original,
        survivalFights: original.survivalFights + 1,
      });
    } else {
      playerCasualties.push(original);
    }
  });

  const enemySurvivors = enemyCombatUnits
    .filter((u) => u.currentHp > 0)
    .map((cu) => enemySquad.find((u) => u.id === cu.id)!);
  const enemyCasualties = enemyCombatUnits
    .filter((u) => u.currentHp <= 0)
    .map((cu) => enemySquad.find((u) => u.id === cu.id)!);

  // Check King outcomes
  let kingAction: 'killed' | 'escaped_dethroned' | 'victorious' | 'none' = 'none';
  let dethronedUnit: UnitState | undefined = undefined;

  const originalKing = playerSquad.find((u) => u.isKing) || enemySquad.find((u) => u.isKing);
  if (originalKing) {
    const kingInCombat = allUnits.find((u) => u.id === originalKing.id);
    if (kingInCombat) {
      const isKingTeamWinner = (kingInCombat.team === 'player' && isPlayerWinner) || (kingInCombat.team === 'enemy' && !isPlayerWinner);
      if (kingEscaped) {
        kingAction = 'escaped_dethroned';
        dethronedUnit = {
          ...originalKing,
          isKing: false,
          hasHonorScar: true,
        };
      } else if (kingInCombat.currentHp <= 0) {
        kingAction = 'killed';
      } else if (isKingTeamWinner) {
        kingAction = 'victorious';
      }
    }
  }

  return {
    winner: isPlayerWinner ? 'player' : 'enemy',
    frames,
    playerSurvivors,
    playerCasualties,
    enemySurvivors,
    enemyCasualties,
    kingAction,
    dethronedUnit,
  };
}
