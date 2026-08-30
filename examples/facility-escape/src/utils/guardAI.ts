import { GuardEntity, PlayerEntity, TileState, GuardType } from '../types';
import { computeSightline } from './physicsEngine';

export interface GuardBehavior {
  computeIntent(
    guard: GuardEntity,
    player: PlayerEntity,
    grid: TileState[][]
  ): GuardEntity['intent'];

  executeIntent(
    guard: GuardEntity,
    grid: TileState[][],
    player: PlayerEntity
  ): { guard: GuardEntity; player: PlayerEntity; logs: string[] };
}

/**
 * BFS pathfinding algorithm to navigate the grid.
 */
export function findPath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  grid: TileState[][]
): { x: number; y: number }[] | null {
  const size = grid.length;
  if (fromX === toX && fromY === toY) return [];

  const queue: { x: number; y: number; path: { x: number; y: number }[] }[] = [
    { x: fromX, y: fromY, path: [] }
  ];
  const visited = new Set<string>();
  visited.add(`${fromX},${fromY}`);

  while (queue.length > 0) {
    const { x, y, path } = queue.shift()!;
    if (x === toX && y === toY) {
      return path;
    }

    const neighbors = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    ];

    for (const nb of neighbors) {
      if (nb.x >= 0 && nb.x < size && nb.y >= 0 && nb.y < size) {
        const tile = grid[nb.y][nb.x];
        const key = `${nb.x},${nb.y}`;
        const isBlocked = tile.isWall || (tile.isGated && !tile.isGatedUnlocked);
        if (!isBlocked && !visited.has(key)) {
          visited.add(key);
          queue.push({ x: nb.x, y: nb.y, path: [...path, nb] });
        }
      }
    }
  }

  return null;
}

/**
 * Shared logic to execute movement intents (both patrol moves and investigation moves).
 */
function executeMove(
  guard: GuardEntity,
  grid: TileState[][],
  player: PlayerEntity
): { guard: GuardEntity; player: PlayerEntity; logs: string[] } {
  const logs: string[] = [];
  const updatedPlayer = { ...player };

  if (!guard.intent.nextPos) {
    return { guard, player: updatedPlayer, logs };
  }

  const fromX = guard.x;
  const fromY = guard.y;
  const toX = guard.intent.nextPos.x;
  const toY = guard.intent.nextPos.y;

  let newFacing = guard.facing;
  if (toX > fromX) newFacing = 'R';
  else if (toX < fromX) newFacing = 'L';
  else if (toY > fromY) newFacing = 'D';
  else if (toY < fromY) newFacing = 'U';

  const updatedGuard: GuardEntity = {
    ...guard,
    x: toX,
    y: toY,
    facing: newFacing,
    patrolIndex: (guard.guardType === 'patrol' && !guard.investigateTarget)
      ? ((guard.patrolIndex ?? 0) + 1) % (guard.patrolPath?.length ?? 1)
      : guard.patrolIndex
  };

  const guardLabel = guard.guardType === 'patrol' ? 'Patrol Guard' : 'Guard';
  logs.push(`${guardLabel} moved to (${toX}, ${toY}).`);

  if (toX === updatedPlayer.x && toY === updatedPlayer.y) {
    updatedPlayer.hearts -= 1;
    logs.push(`COLLISION: ${guardLabel} ran into you at (${toX}, ${toY})! (-1 Heart)`);
  } else {
    const newSightline = computeSightline(toX, toY, newFacing, grid, false, guard.guardType);
    const spotted = newSightline.some(tile => tile.x === updatedPlayer.x && tile.y === updatedPlayer.y);
    if (spotted) {
      updatedPlayer.hearts -= 1;
      logs.push(`ALERT: ${guardLabel} spotted you at (${updatedPlayer.x}, ${updatedPlayer.y}) after moving! (-1 Heart)`);
    }
  }

  return { guard: updatedGuard, player: updatedPlayer, logs };
}

/**
 * Watcher-specific behavior implementation.
 */
export const WatcherBehavior: GuardBehavior = {
  computeIntent(guard, player, grid) {
    const sightline = computeSightline(guard.x, guard.y, guard.facing, grid, false, guard.guardType);
    return {
      actionType: 'watch',
      targetTiles: sightline,
      description: 'Watching sightline'
    };
  },
  executeIntent(guard, grid, player) {
    return { guard, player, logs: [] };
  }
};

/**
 * Patrol-specific behavior implementation.
 */
export const PatrolBehavior: GuardBehavior = {
  computeIntent(guard, player, grid) {
    const nextIdx = ((guard.patrolIndex ?? 0) + 1) % (guard.patrolPath?.length ?? 1);
    const nextPos = guard.patrolPath?.[nextIdx] ?? { x: guard.x, y: guard.y };
    return {
      actionType: 'move',
      targetTiles: [nextPos],
      description: `Patrolling to (${nextPos.x}, ${nextPos.y}) next turn.`,
      nextPos
    };
  },
  executeIntent(guard, grid, player) {
    return executeMove(guard, grid, player);
  }
};

const behaviors: Record<GuardType, GuardBehavior> = {
  watcher: WatcherBehavior,
  patrol: PatrolBehavior,
};

/**
 * High-level orchestration for Guard intent computation.
 * Intercepts general state overrides (immobilization, spotting) and shared investigation logic,
 * then delegates to specific GuardType behaviors.
 */
export function computeGuardIntent(
  guard: GuardEntity,
  player: PlayerEntity,
  grid: TileState[][]
): GuardEntity {
  // 1. Immobilization Layer
  if (guard.immobilizedTurns > 0) {
    return {
      ...guard,
      intent: {
        actionType: 'idle',
        targetTiles: [],
        description: `Immobilized (${guard.immobilizedTurns} turns left)`
      }
    };
  }

  // 2. Sightline/Spotting Player Layer
  const sightline = computeSightline(guard.x, guard.y, guard.facing, grid, false, guard.guardType);
  const playerSpotted = sightline.some(t => t.x === player.x && t.y === player.y);
  if (playerSpotted) {
    return {
      ...guard,
      intent: {
        actionType: 'shoot',
        targetTiles: sightline,
        description: `Target Spotted! Firing solution computed.`
      }
    };
  }

  // 3. Shared Sound Investigation Override Layer
  let updatedGuard = { ...guard };
  let target = updatedGuard.investigateTarget;
  if (target && updatedGuard.x === target.x && updatedGuard.y === target.y) {
    updatedGuard.investigateTarget = undefined;
    target = undefined;
  }

  if (target) {
    const path = findPath(updatedGuard.x, updatedGuard.y, target.x, target.y, grid);
    if (path && path.length > 0) {
      const nextPos = path[0];
      return {
        ...updatedGuard,
        intent: {
          actionType: 'move',
          targetTiles: [nextPos],
          description: `Investigating sound source...`,
          nextPos
        }
      };
    } else {
      updatedGuard.investigateTarget = undefined;
    }
  }

  // 4. Delegate to Type-specific Behavior
  const behavior = behaviors[updatedGuard.guardType];
  const intent = behavior.computeIntent(updatedGuard, player, grid);
  return {
    ...updatedGuard,
    intent
  };
}

/**
 * High-level orchestration for Guard intent execution.
 * Handles stuns, pre-decided shooting resolution, and delegates movement/other actions.
 */
export function executeGuardIntent(
  guard: GuardEntity,
  grid: TileState[][],
  player: PlayerEntity
): { guard: GuardEntity; player: PlayerEntity; logs: string[] } {
  const logs: string[] = [];
  const updatedPlayer = { ...player };

  // 1. Immobilized/Stunned guards cannot execute pre-decided actions
  if (guard.immobilizedTurns > 0) {
    return { guard, player: updatedPlayer, logs };
  }

  // 2. Pre-decided Shooting execution
  if (guard.intent.actionType === 'shoot') {
    const playerCaught = guard.intent.targetTiles.some(
      tile => tile.x === updatedPlayer.x && tile.y === updatedPlayer.y
    );

    if (playerCaught) {
      updatedPlayer.hearts -= 1;
      logs.push(`GUARD ATTACK RESOLUTION: Guard at (${guard.x}, ${guard.y}) FIRED and shot you! (-1 Heart)`);
    } else {
      logs.push(`Guard at (${guard.x}, ${guard.y}) fired, but you evaded their line of fire.`);
    }
    return { guard, player: updatedPlayer, logs };
  }

  // 3. Delegation for Movement (Move actions are unified under executeMove)
  if (guard.intent.actionType === 'move') {
    return executeMove(guard, grid, updatedPlayer);
  }

  // 4. Default watch or idle actions have no immediate action resolution impact
  return { guard, player: updatedPlayer, logs };
}
