import { CombatUnit } from '../types';
import { BOARD_SIZE } from '../constants';

export interface GridPos {
  x: number;
  y: number;
}

export function isOutOfBounds(pos: GridPos): boolean {
  return pos.x < 0 || pos.x >= BOARD_SIZE || pos.y < 0 || pos.y >= BOARD_SIZE;
}

export function isSamePos(a: GridPos, b: GridPos): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Get legal sliding moves along ray directions for Rook, Bishop, Queen on 8x8 grid.
 * Stopped by first occupied square (can move onto enemy square to capture/attack).
 */
export function getSlidingMoves(
  unit: CombatUnit,
  directions: GridPos[],
  allUnits: CombatUnit[]
): GridPos[] {
  const moves: GridPos[] = [];
  const livingUnits = allUnits.filter((u) => u.currentHp > 0 && u.id !== unit.id);

  for (const dir of directions) {
    let curr = { x: unit.position.x + dir.x, y: unit.position.y + dir.y };
    while (!isOutOfBounds(curr)) {
      const occupant = livingUnits.find((u) => isSamePos(u.position, curr));
      if (!occupant) {
        moves.push({ ...curr });
      } else {
        if (occupant.team !== unit.team) {
          // Can move onto enemy square to capture / attack
          moves.push({ ...curr });
        }
        // Blocked by piece (ally or enemy)
        break;
      }
      curr = { x: curr.x + dir.x, y: curr.y + dir.y };
    }
  }
  return moves;
}

/**
 * Get legal Knight L-shaped jump moves on 8x8 grid (bypasses intermediate blocks).
 */
export function getKnightMoves(
  unit: CombatUnit,
  allUnits: CombatUnit[]
): GridPos[] {
  const moves: GridPos[] = [];
  const offsets = [
    { x: 2, y: 1 }, { x: 2, y: -1 }, { x: -2, y: 1 }, { x: -2, y: -1 },
    { x: 1, y: 2 }, { x: 1, y: -2 }, { x: -1, y: 2 }, { x: -1, y: -2 },
  ];
  const livingUnits = allUnits.filter((u) => u.currentHp > 0 && u.id !== unit.id);

  for (const off of offsets) {
    const targetPos = { x: unit.position.x + off.x, y: unit.position.y + off.y };
    if (isOutOfBounds(targetPos)) continue;

    const occupant = livingUnits.find((u) => isSamePos(u.position, targetPos));
    if (!occupant || occupant.team !== unit.team) {
      moves.push(targetPos);
    }
  }
  return moves;
}

/**
 * Get legal Pawn moves on 8x8 grid: forward step if empty, diagonal forward if enemy present.
 */
export function getPawnMoves(
  unit: CombatUnit,
  allUnits: CombatUnit[]
): GridPos[] {
  const moves: GridPos[] = [];
  const forwardDir = unit.team === 'player' ? 1 : -1;
  const livingUnits = allUnits.filter((u) => u.currentHp > 0 && u.id !== unit.id);

  // 1. Straight forward step (must be empty)
  const straightPos = { x: unit.position.x + forwardDir, y: unit.position.y };
  if (!isOutOfBounds(straightPos)) {
    const occupant = livingUnits.find((u) => isSamePos(u.position, straightPos));
    if (!occupant) {
      moves.push(straightPos);
    }
  }

  // 2. Diagonal capture steps (must have enemy)
  const diagLeft = { x: unit.position.x + forwardDir, y: unit.position.y - 1 };
  const diagRight = { x: unit.position.x + forwardDir, y: unit.position.y + 1 };

  [diagLeft, diagRight].forEach((diagPos) => {
    if (!isOutOfBounds(diagPos)) {
      const occupant = livingUnits.find((u) => isSamePos(u.position, diagPos));
      if (occupant && occupant.team !== unit.team) {
        moves.push(diagPos);
      }
    }
  });

  return moves;
}

/**
 * Get all legal destination squares on 8x8 grid for a unit based on archetype.
 */
export function getLegalMoves(unit: CombatUnit, allUnits: CombatUnit[]): GridPos[] {
  switch (unit.archetype) {
    case 'rook':
      return getSlidingMoves(
        unit,
        [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }],
        allUnits
      );
    case 'bishop':
      return getSlidingMoves(
        unit,
        [{ x: 1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: -1, y: -1 }],
        allUnits
      );
    case 'queen':
      return getSlidingMoves(
        unit,
        [
          { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
          { x: 1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: -1, y: -1 },
        ],
        allUnits
      );
    case 'knight':
      return getKnightMoves(unit, allUnits);
    case 'pawn':
      return getPawnMoves(unit, allUnits);
    default:
      return getPawnMoves(unit, allUnits);
  }
}

/**
 * Check if unit at `fromPos` can attack enemy `target` at `target.position`.
 */
export function canAttackFrom(
  unit: CombatUnit,
  fromPos: GridPos,
  target: CombatUnit,
  allUnits: CombatUnit[]
): boolean {
  if (target.currentHp <= 0 || target.team === unit.team) return false;

  const dx = target.position.x - fromPos.x;
  const dy = target.position.y - fromPos.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  const forwardDir = unit.team === 'player' ? 1 : -1;

  if (unit.archetype === 'pawn') {
    const isDiagCapture = dx === forwardDir && (dy === 1 || dy === -1);
    const isStraightAdj = dx === forwardDir && dy === 0;
    return isDiagCapture || isStraightAdj;
  }

  if (unit.archetype === 'knight') {
    return (absDx === 2 && absDy === 1) || (absDx === 1 && absDy === 2);
  }

  // Sliding pieces: Rook, Bishop, Queen
  let isLegalLine = false;
  if (unit.archetype === 'rook') {
    isLegalLine = (absDx === 0 && absDy > 0) || (absDy === 0 && absDx > 0);
  } else if (unit.archetype === 'bishop') {
    isLegalLine = absDx === absDy && absDx > 0;
  } else if (unit.archetype === 'queen') {
    isLegalLine = (absDx === 0 && absDy > 0) || (absDy === 0 && absDx > 0) || (absDx === absDy && absDx > 0);
  }

  if (!isLegalLine) return false;

  // Check path blocking
  const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
  const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;

  let currX = fromPos.x + stepX;
  let currY = fromPos.y + stepY;

  const otherUnits = allUnits.filter((u) => u.currentHp > 0 && u.id !== unit.id && u.id !== target.id);

  while (currX !== target.position.x || currY !== target.position.y) {
    if (otherUnits.some((u) => u.position.x === currX && u.position.y === currY)) {
      return false; // Line is blocked!
    }
    currX += stepX;
    currY += stepY;
  }

  return true;
}
