import { GameState, TileState, GuardEntity, TurnLogEntry } from '../types';
import { propagateEnvironment } from './physicsEngine';
import { executeGuardIntent, computeGuardIntent } from './guardAI';

/**
 * Thin orchestrator that processes a player turn.
 * Sequences the 6 explicit turn resolution steps.
 */
export function processTurn(
  gameState: GameState,
  playerActionUpdate: (
    currentGrid: TileState[][],
    currentGuards: GuardEntity[],
    currentPlayer: GameState['player'],
    turnLogs: string[]
  ) => {
    grid: TileState[][];
    guards: GuardEntity[];
    player: GameState['player'];
    hasAdvanced: boolean;
  }
): GameState {
  const newLogs: string[] = [];
  const currentTurn = gameState.turnCount + 1;

  // 1. Resolve player action first
  const playerResult = playerActionUpdate(
    gameState.grid.map(row => row.map(t => ({ ...t }))),
    gameState.guards.map(g => ({ ...g })),
    { ...gameState.player },
    newLogs
  );

  if (!playerResult.hasAdvanced) {
    // Action was cancelled or invalid, do not advance state
    return gameState;
  }

  let resolvedGrid = playerResult.grid;
  let resolvedGuards = playerResult.guards;
  let resolvedPlayer = playerResult.player;

  // 2. Resolve environment propagation (fire-spread, electric decay, gate transitions) via physicsEngine
  const envResult = propagateEnvironment(resolvedGrid, resolvedGuards, newLogs);
  resolvedGrid = envResult.grid;
  resolvedGuards = envResult.guards;

  // 3. Execute each guard's ALREADY-DECIDED intent via guardAI
  resolvedGuards = resolvedGuards.map(guard => {
    const execResult = executeGuardIntent(guard, resolvedGrid, resolvedPlayer);
    resolvedPlayer = execResult.player;
    newLogs.push(...execResult.logs);
    return execResult.guard;
  });

  // 4. Decrement immobilization
  resolvedGuards = resolvedGuards.map(guard => {
    if (guard.immobilizedTurns > 0) {
      const left = guard.immobilizedTurns - 1;
      if (left === 0) {
        newLogs.push(`Guard at (${guard.x}, ${guard.y}) recovered from stun.`);
      }
      return {
        ...guard,
        immobilizedTurns: left
      };
    }
    return guard;
  });

  // 5. Compute each guard's NEXT intent via guardAI, using the post-action state
  resolvedGuards = resolvedGuards.map(guard => {
    return computeGuardIntent(guard, resolvedPlayer, resolvedGrid);
  });

  // 6. Check win/loss
  let nextState: GameState['gameState'] = 'playing';
  if (resolvedPlayer.hearts <= 0) {
    nextState = 'gameover';
    newLogs.push('CRITICAL INTEGRITY FAILURE: You were terminated.');
  }

  // Prepare Turn logs
  const logEntries: TurnLogEntry[] = newLogs.map((msg, idx) => ({
    id: `resolved-log-${idx}-${Date.now()}-${Math.random()}`,
    turn: currentTurn,
    text: msg,
    type: msg.includes('-1 Heart')
      ? 'damage'
      : msg.includes('ignited') || msg.includes('SPREADS') || msg.includes('Fire burned out') || msg.includes('burned down')
      ? 'system'
      : 'enemy'
  }));

  return {
    ...gameState,
    grid: resolvedGrid,
    guards: resolvedGuards,
    player: resolvedPlayer,
    gameState: nextState,
    selectedItemIndex: null,
    activeCarrierAction: null,
    turnCount: currentTurn,
    logs: [...gameState.logs, ...logEntries],
  };
}
