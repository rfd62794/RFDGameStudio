import { GameState, TileState, GuardEntity, GameObject, Property, Carrier } from '../types';
import { processTurn } from './turnEngine';
import { getObjectWithProperty, triggerLoud, applyCarrierEffect, computeSightline, derivePredictedFacing } from './physicsEngine';

// §6 Tunable Constants — Explicit, Not Buried
export const RISK_PENALTY = 100;
export const TOOL_COST = 5;
export const MAX_STATES = 2000; // Limit search space to prevent infinite loops

export interface SolverResult {
  solvable: boolean;
  maxStatesReached: boolean;
  depth: number;
  toolDiversity: number;
  avgBranchWidth: number;
  maxBranchWidth: number;
  totalCost: number;
  totalRiskPenalty: number;
  totalToolCost: number;
  solutionPath?: { x: number; y: number }[];
}

export interface RelevanceResult {
  itemRelevance: Record<string, boolean>; // item id -> isRelevant
  guardRelevance: Record<string, boolean>; // guard id -> isRelevant
}

interface QueueNode {
  state: GameState;
  cost: number;
  path: GameState[];
  totalRiskPenalty: number;
  totalToolCost: number;
  priority: number;
}

class PriorityQueue {
  private elements: QueueNode[] = [];

  push(node: QueueNode) {
    this.elements.push(node);
  }

  pop(): QueueNode | undefined {
    if (this.elements.length === 0) return undefined;
    let minIdx = 0;
    for (let i = 1; i < this.elements.length; i++) {
      if (this.elements[i].priority < this.elements[minIdx].priority) {
        minIdx = i;
      }
    }
    return this.elements.splice(minIdx, 1)[0];
  }

  get length(): number {
    return this.elements.length;
  }
}

/**
 * Unique serialization key representing all critical game state variables.
 */
function getGameStateKey(state: GameState): string {
  const p = state.player;
  const invStr = p.inventory.map(item => `${item.name}:${item.mirrorAngle || ''}`).sort().join(',');

  const gates: string[] = [];
  state.grid.forEach((row, y) => {
    row.forEach((tile, x) => {
      if (tile.isGated) {
        gates.push(`${x},${y}:${tile.isGated}:${tile.isGatedUnlocked}`);
      }
    });
  });
  const gatesStr = gates.sort().join('|');

  const guardsStr = state.guards.map(g => 
    `${g.id}:${g.x},${g.y}:${g.facing}:${g.immobilizedTurns}:${g.investigateTarget ? `${g.investigateTarget.x},${g.investigateTarget.y}` : 'none'}`
  ).sort().join('|');

  const activeTiles: string[] = [];
  state.grid.forEach((row, y) => {
    row.forEach((tile, x) => {
      if (tile.status !== 'normal') {
        activeTiles.push(`${x},${y}:${tile.status}:${tile.burnTurnsLeft || 0}`);
      }
    });
  });
  const activeTilesStr = activeTiles.sort().join('|');

  const mirrorTiles: string[] = [];
  state.grid.forEach((row, y) => {
    row.forEach((tile, x) => {
      if (tile.environmentObject?.mirrorAngle) {
        mirrorTiles.push(`${x},${y}:${tile.environmentObject.mirrorAngle}`);
      }
    });
  });
  const mirrorTilesStr = mirrorTiles.sort().join('|');

  return `P:${p.x},${p.y}|H:${p.hearts}|Inv:${invStr}|Gates:${gatesStr}|Guards:${guardsStr}|Active:${activeTilesStr}|Mirrors:${mirrorTilesStr}`;
}

/**
 * Determines which tools/carriers or property actions were used between two states.
 */
function getUsedToolsInTransition(fromState: GameState, toState: GameState): string[] {
  const tools: string[] = [];

  if (toState.player.inventory.length < fromState.player.inventory.length) {
    const fromCounts = getItemCounts(fromState.player.inventory);
    const toCounts = getItemCounts(toState.player.inventory);
    
    for (const [name, count] of Object.entries(fromCounts)) {
      const toCount = toCounts[name] || 0;
      if (toCount < count) {
        if (name === 'Windproof Lighter' || name === 'Thermal Flare') {
          tools.push('heat');
        } else if (name === 'Spare Battery') {
          tools.push('electric');
        } else if (name === 'Glue Bottle') {
          tools.push('adhesive');
        } else if (name.startsWith('Hand Mirror')) {
          tools.push('reflective');
        } else if (name === 'Firecracker') {
          tools.push('loud');
        }
      }
    }
  }

  // Rotating adjacent mirrors
  fromState.grid.forEach((row, y) => {
    row.forEach((fromTile, x) => {
      const toTile = toState.grid[y][x];
      const fromAngle = fromTile.environmentObject?.mirrorAngle || fromTile.item?.mirrorAngle;
      const toAngle = toTile.environmentObject?.mirrorAngle || toTile.item?.mirrorAngle;
      if (fromAngle && toAngle && fromAngle !== toAngle) {
        tools.push('reflective');
      }
    });
  });

  return tools;
}

function getItemCounts(inv: GameObject[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of inv) {
    counts[item.name] = (counts[item.name] || 0) + 1;
  }
  return counts;
}

/**
 * A* Search Solver
 */
export function solveLevel(
  initialState: GameState,
  maxStatesOverride?: number,
  useDijkstra?: boolean
): SolverResult {
  const size = initialState.grid.length;
  const exitX = size - 1;
  const exitY = 0;

  function heuristic(px: number, py: number): number {
    if (useDijkstra) return 0;
    return Math.abs(px - exitX) + Math.abs(py - exitY);
  }

  const pq = new PriorityQueue();
  const visited = new Set<string>();

  pq.push({
    state: initialState,
    cost: 0,
    path: [initialState],
    totalRiskPenalty: 0,
    totalToolCost: 0,
    priority: heuristic(initialState.player.x, initialState.player.y)
  });

  let totalBranchWidth = 0;
  let maxBranchWidth = 0;
  let visitedStateCount = 0;

  const stateLimit = maxStatesOverride ?? MAX_STATES;

  while (pq.length > 0) {
    const node = pq.pop();
    if (!node) break;

    const u = node.state;
    const key = getGameStateKey(u);

    if (visited.has(key)) continue;
    visited.add(key);
    visitedStateCount++;

    // Reached exit tile and player is alive
    if (u.player.x === size - 1 && u.player.y === 0 && u.player.hearts > 0) {
      // Reconstruct Tool Diversity
      const toolSet = new Set<string>();
      for (let i = 0; i < node.path.length - 1; i++) {
        const tools = getUsedToolsInTransition(node.path[i], node.path[i + 1]);
        tools.forEach(t => toolSet.add(t));
      }

      return {
        solvable: true,
        maxStatesReached: false,
        depth: node.path.length - 1,
        toolDiversity: toolSet.size,
        avgBranchWidth: visitedStateCount > 0 ? totalBranchWidth / visitedStateCount : 0,
        maxBranchWidth,
        totalCost: node.cost,
        totalRiskPenalty: node.totalRiskPenalty,
        totalToolCost: node.totalToolCost,
        solutionPath: node.path.map(s => ({ x: s.player.x, y: s.player.y }))
      };
    }

    if (visitedStateCount >= stateLimit) {
      return {
        solvable: false,
        maxStatesReached: true,
        depth: 0,
        toolDiversity: 0,
        avgBranchWidth: visitedStateCount > 0 ? totalBranchWidth / visitedStateCount : 0,
        maxBranchWidth,
        totalCost: Infinity,
        totalRiskPenalty: 0,
        totalToolCost: 0,
        solutionPath: []
      };
    }

    // Generate legal next actions
    const candidateNextStates: { nextState: GameState; isToolUsed: boolean }[] = [];
    const px = u.player.x;
    const py = u.player.y;

    const adjacentOffsets = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 }
    ];

    // 1. Move actions
    for (const { dx, dy } of adjacentOffsets) {
      const tx = px + dx;
      const ty = py + dy;
      if (tx >= 0 && tx < size && ty >= 0 && ty < size) {
        const targetTile = u.grid[ty][tx];
        if (targetTile.isWall) continue;
        if (targetTile.isGated && !targetTile.isGatedUnlocked) continue;

        const guardAtTile = u.guards.find(g => g.x === tx && g.y === ty);
        if (guardAtTile && guardAtTile.immobilizedTurns === 0) continue;

        const nextState = processTurn(u, (currentGrid, currentGuards, currentPlayer, turnLogs) => {
          currentPlayer.x = tx;
          currentPlayer.y = ty;
          turnLogs.push(`Moved to (${tx}, ${ty})`);
          
          const isSticky = getObjectWithProperty(currentGrid[ty][tx], 'adhesive') !== null;
          if (isSticky) {
            turnLogs.push(`Stuck in adhesive trap`);
          }

          return {
            grid: currentGrid,
            guards: currentGuards,
            player: currentPlayer,
            hasAdvanced: true,
          };
        });

        if (nextState.turnCount > u.turnCount && nextState.player.hearts > 0 && nextState.gameState !== 'gameover') {
          candidateNextStates.push({ nextState, isToolUsed: false });
        }
      }
    }

    // 2. Pick up item on current tile
    const currentTile = u.grid[py][px];
    if (currentTile.item) {
      const nextState = processTurn(u, (currentGrid, currentGuards, currentPlayer, turnLogs) => {
        const tile = currentGrid[py][px];
        if (!tile.item) {
          return { grid: currentGrid, guards: currentGuards, player: currentPlayer, hasAdvanced: false };
        }

        if (tile.item.name === 'Heart Container') {
          currentPlayer.maxHearts += 1;
          currentPlayer.hearts += 1;
          currentGrid[py][px].item = undefined;
          turnLogs.push(`Healed via Heart Container`);
          return {
            grid: currentGrid,
            guards: currentGuards,
            player: currentPlayer,
            hasAdvanced: true,
          };
        }

        if (currentPlayer.inventory.length >= 6) {
          return { grid: currentGrid, guards: currentGuards, player: currentPlayer, hasAdvanced: false };
        }

        const grabbedItem = tile.item;
        currentPlayer.inventory = [...currentPlayer.inventory, grabbedItem];
        currentGrid[py][px].item = undefined;
        turnLogs.push(`Grabbed floor item`);
        return {
          grid: currentGrid,
          guards: currentGuards,
          player: currentPlayer,
          hasAdvanced: true,
        };
      });

      if (nextState.turnCount > u.turnCount && nextState.player.hearts > 0 && nextState.gameState !== 'gameover') {
        candidateNextStates.push({ nextState, isToolUsed: false });
      }
    }

    // 3. Rotate Adjacent Mirror
    for (const { dx, dy } of adjacentOffsets) {
      const mx = px + dx;
      const my = py + dy;
      if (mx >= 0 && mx < size && my >= 0 && my < size) {
        const tile = u.grid[my][mx];
        const isReflective = getObjectWithProperty(tile, 'reflective') !== null;
        if (isReflective) {
          const nextState = processTurn(u, (currentGrid, currentGuards, currentPlayer, turnLogs) => {
            const envObj = currentGrid[my][mx].environmentObject;
            const itemObj = currentGrid[my][mx].item;

            let newAngle: '/' | '\\' = '/';
            if (envObj && envObj.properties.includes('reflective')) {
              newAngle = envObj.mirrorAngle === '/' ? '\\' : '/';
              envObj.mirrorAngle = newAngle;
              envObj.name = `Mirror Panel (${newAngle})`;
            } else if (itemObj && itemObj.properties.includes('reflective')) {
              newAngle = itemObj.mirrorAngle === '/' ? '\\' : '/';
              itemObj.mirrorAngle = newAngle;
              itemObj.name = `Hand Mirror (${newAngle})`;
            }

            turnLogs.push(`Rotated mirror`);
            return {
              grid: currentGrid,
              guards: currentGuards,
              player: currentPlayer,
              hasAdvanced: true,
            };
          });

          if (nextState.turnCount > u.turnCount && nextState.player.hearts > 0 && nextState.gameState !== 'gameover') {
            candidateNextStates.push({ nextState, isToolUsed: false });
          }
        }
      }
    }

    // 4. Use Held Items
    for (let itemIndex = 0; itemIndex < u.player.inventory.length; itemIndex++) {
      const item = u.player.inventory[itemIndex];
      for (let ty = 0; ty < size; ty++) {
        for (let tx = 0; tx < size; tx++) {
          if (item.name.startsWith('Hand Mirror')) {
            const tile = u.grid[ty][tx];
            const isBlocked = tile.isWall || tile.environmentObject || tile.item || (tile.isGated && !tile.isGatedUnlocked);
            if (isBlocked) continue;
          }
          if (item.name === 'Firecracker') {
            const tile = u.grid[ty][tx];
            const isBlocked = tile.isWall || tile.item || (tile.isGated && !tile.isGatedUnlocked);
            if (isBlocked) continue;
          }
          if (item.carriers?.includes('heat')) {
            const tile = u.grid[ty][tx];
            const hasFlammable = getObjectWithProperty(tile, 'flammable') !== null;
            if (!hasFlammable) continue;
          }
          if (item.carriers?.includes('electric')) {
            const tile = u.grid[ty][tx];
            const hasConductive = getObjectWithProperty(tile, 'conductive') !== null;
            if (!hasConductive) continue;
          }
          if (item.name === 'Glue Bottle') {
            const tile = u.grid[ty][tx];
            const hasGuard = u.guards.some(g => g.x === tx && g.y === ty);
            const isBlocked = tile.isWall || tile.environmentObject || tile.item || (tile.isGated && !tile.isGatedUnlocked);
            if (!hasGuard && isBlocked) continue;
          }

          const nextState = processTurn(u, (currentGrid, currentGuards, currentPlayer, turnLogs) => {
            const nextInventory = currentPlayer.inventory.filter((_, idx) => idx !== itemIndex);
            currentPlayer.inventory = nextInventory;

            if (item.name.startsWith('Hand Mirror')) {
              const tile = currentGrid[ty]?.[tx];
              const isBlocked = !tile || tile.isWall || tile.environmentObject || tile.item || (tile.isGated && !tile.isGatedUnlocked);
              if (isBlocked) {
                return { grid: currentGrid, guards: currentGuards, player: currentPlayer, hasAdvanced: false };
              }

              const angle = item.mirrorAngle || '/';
              currentGrid[ty][tx].environmentObject = {
                id: `mirror-placed-${Date.now()}`,
                name: `Mirror Panel (${angle})`,
                properties: ['reflective'],
                isPickable: false,
                status: 'normal',
                mirrorAngle: angle,
              };
              turnLogs.push(`Placed Mirror`);
              return { grid: currentGrid, guards: currentGuards, player: currentPlayer, hasAdvanced: true };
            }

            if (item.name === 'Firecracker') {
              const tile = currentGrid[ty]?.[tx];
              const isBlocked = !tile || tile.isWall || tile.item || (tile.isGated && !tile.isGatedUnlocked);
              if (isBlocked) {
                return { grid: currentGrid, guards: currentGuards, player: currentPlayer, hasAdvanced: false };
              }

              currentGrid[ty][tx].item = {
                id: `firecracker-thrown-${Date.now()}`,
                name: 'Firecracker',
                properties: ['flammable', 'loud'],
                isPickable: true,
                status: 'normal',
              };
              turnLogs.push(`Threw Firecracker`);

              if (currentGrid[ty][tx].status === 'ignited') {
                const loudResult = triggerLoud(tx, ty, currentGuards, turnLogs);
                currentGuards = loudResult.guards;
                currentGrid[ty][tx].item = undefined;
              }
              return { grid: currentGrid, guards: currentGuards, player: currentPlayer, hasAdvanced: true };
            }

            let carrier: 'heat' | 'electric' | 'adhesive' | null = null;
            if (item.carriers?.includes('heat')) carrier = 'heat';
            if (item.carriers?.includes('electric')) carrier = 'electric';
            if (item.name === 'Glue Bottle') carrier = 'adhesive';

            if (!carrier) {
              return { grid: currentGrid, guards: currentGuards, player: currentPlayer, hasAdvanced: false };
            }

            const physicsResult = applyCarrierEffect(
              currentGrid,
              currentGuards,
              currentPlayer,
              tx,
              ty,
              carrier,
              turnLogs
            );

            return {
              grid: physicsResult.grid,
              guards: physicsResult.guards,
              player: {
                ...currentPlayer,
                hearts: physicsResult.playerDamageTaken ? currentPlayer.hearts - 1 : currentPlayer.hearts
              },
              hasAdvanced: true,
            };
          });

          if (nextState.turnCount > u.turnCount && nextState.player.hearts > 0 && nextState.gameState !== 'gameover') {
            candidateNextStates.push({ nextState, isToolUsed: true });
          }
        }
      }
    }

    const branchCount = candidateNextStates.length;
    totalBranchWidth += branchCount;
    if (branchCount > maxBranchWidth) {
      maxBranchWidth = branchCount;
    }

    // Push valid transitions into priority queue with calculated risk/tool cost adjustments
    for (const { nextState, isToolUsed } of candidateNextStates) {
      const nextKey = getGameStateKey(nextState);
      if (visited.has(nextKey)) continue;

      // §2 Risk penalty & Tool cost calculations
      let riskPenalty = 0;
      const rx = nextState.player.x;
      const ry = nextState.player.y;
      const isInsideThreat = u.guards.some(guard => {
        if (guard.immobilizedTurns > 0) return false;
        return guard.intent.targetTiles.some(t => t.x === rx && t.y === ry);
      });

      if (isInsideThreat) {
        riskPenalty = RISK_PENALTY;
      }

      const toolCost = isToolUsed ? TOOL_COST : 0;
      const stepCost = 1 + riskPenalty + toolCost;

      pq.push({
        state: nextState,
        cost: node.cost + stepCost,
        path: [...node.path, nextState],
        totalRiskPenalty: node.totalRiskPenalty + riskPenalty,
        totalToolCost: node.totalToolCost + toolCost,
        priority: (node.cost + stepCost) + heuristic(nextState.player.x, nextState.player.y)
      });
    }
  }

  return {
    solvable: false,
    maxStatesReached: false,
    depth: 0,
    toolDiversity: 0,
    avgBranchWidth: visitedStateCount > 0 ? totalBranchWidth / visitedStateCount : 0,
    maxBranchWidth,
    totalCost: Infinity,
    totalRiskPenalty: 0,
    totalToolCost: 0,
    solutionPath: []
  };
}

/**
 * §5 Item and Guard Relevance Testing
 * Runs the solver per item/guard to see if their removal impacts solvability or difficulty.
 */
export function testRelevance(
  initialState: GameState,
  baseResult: SolverResult
): RelevanceResult {
  const itemRelevance: Record<string, boolean> = {};
  const guardRelevance: Record<string, boolean> = {};

  // Gather placed items on the grid
  const itemsInRoom: { id: string; x: number; y: number }[] = [];
  initialState.grid.forEach((row, y) => {
    row.forEach((tile, x) => {
      if (tile.item && tile.item.id) {
        itemsInRoom.push({ id: tile.item.id, x, y });
      }
    });
  });

  // Test relevance of each placed item
  for (const itemRef of itemsInRoom) {
    // Construct state clone with item removed
    const modifiedGrid = initialState.grid.map(row => row.map(t => ({ ...t })));
    modifiedGrid[itemRef.y][itemRef.x].item = undefined;

    const modifiedState: GameState = {
      ...initialState,
      grid: modifiedGrid
    };

    const runResult = solveLevel(modifiedState);
    
    // Check if removal meaningfully shifts outcomes per §5
    const changedSolvability = baseResult.solvable !== runResult.solvable;
    const changedDifficulty = 
      baseResult.depth !== runResult.depth ||
      baseResult.toolDiversity !== runResult.toolDiversity ||
      baseResult.totalCost !== runResult.totalCost;

    itemRelevance[itemRef.id] = changedSolvability || changedDifficulty;
  }

  // Test relevance of each placed guard
  for (const guard of initialState.guards) {
    const modifiedState: GameState = {
      ...initialState,
      guards: initialState.guards.filter(g => g.id !== guard.id)
    };

    const runResult = solveLevel(modifiedState);

    const changedSolvability = baseResult.solvable !== runResult.solvable;
    const changedDifficulty = 
      baseResult.depth !== runResult.depth ||
      baseResult.toolDiversity !== runResult.toolDiversity ||
      baseResult.totalCost !== runResult.totalCost;

    guardRelevance[guard.id] = changedSolvability || changedDifficulty;
  }

  return {
    itemRelevance,
    guardRelevance
  };
}

/**
 * Computes the union of every tile any guard could see across their states.
 */
export function computeTotalVisionCoverage(
  guards: GuardEntity[],
  grid: TileState[][]
): Set<string> {
  const covered = new Set<string>();
  for (const guard of guards) {
    if (guard.immobilizedTurns > 0) continue;
    if (guard.guardType === 'watcher') {
      const cone = computeSightline(guard.x, guard.y, guard.facing, grid, false, 'watcher');
      cone.forEach(t => covered.add(`${t.x},${t.y}`));
    } else if (guard.guardType === 'patrol' && guard.patrolPath) {
      for (let i = 0; i < guard.patrolPath.length; i++) {
        const pos = guard.patrolPath[i];
        const nextPos = guard.patrolPath[(i + 1) % guard.patrolPath.length];
        const facing = derivePredictedFacing(pos.x, pos.y, nextPos.x, nextPos.y, guard.facing);
        const cone = computeSightline(pos.x, pos.y, facing, grid, false, 'patrol');
        cone.forEach(t => covered.add(`${t.x},${t.y}`));
      }
    }
  }
  return covered;
}

/**
 * Verifies if there's at least one dead zone tile that is reachable from start
 * without crossing covered territory, and sits adjacent to or along the solution path.
 */
export function verifyDeadZones(
  initialState: GameState,
  solutionPath: { x: number; y: number }[]
): { x: number; y: number }[] {
  const size = initialState.grid.length;
  const startX = initialState.player.x;
  const startY = initialState.player.y;

  const covered = computeTotalVisionCoverage(initialState.guards, initialState.grid);

  // If start is covered, we can't reach any uncovered tile without crossing covered territory
  if (covered.has(`${startX},${startY}`)) {
    return [];
  }

  // BFS to find reachable uncovered tiles
  const reachableUncovered = new Set<string>();
  const queue: { x: number; y: number }[] = [{ x: startX, y: startY }];
  const visited = new Set<string>();
  visited.add(`${startX},${startY}`);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    reachableUncovered.add(`${curr.x},${curr.y}`);

    const neighbors = [
      { x: curr.x + 1, y: curr.y },
      { x: curr.x - 1, y: curr.y },
      { x: curr.x, y: curr.y + 1 },
      { x: curr.x, y: curr.y - 1 },
    ];

    for (const nb of neighbors) {
      if (nb.x >= 0 && nb.x < size && nb.y >= 0 && nb.y < size) {
        const tile = initialState.grid[nb.y][nb.x];
        const key = `${nb.x},${nb.y}`;
        const isBlocked = tile.isWall || (tile.isGated && !tile.isGatedUnlocked);
        if (!isBlocked && !covered.has(key) && !visited.has(key)) {
          visited.add(key);
          queue.push(nb);
        }
      }
    }
  }

  // Find which reachable uncovered tiles are adjacent to or along the solution path
  const deadZones: { x: number; y: number }[] = [];

  for (const coordStr of reachableUncovered) {
    const [cx, cy] = coordStr.split(',').map(Number);
    
    let isAdjacentOrAlong = false;
    for (const p of solutionPath) {
      if (Math.abs(cx - p.x) + Math.abs(cy - p.y) <= 1) {
        isAdjacentOrAlong = true;
        break;
      }
    }

    if (isAdjacentOrAlong) {
      deadZones.push({ x: cx, y: cy });
    }
  }

  return deadZones;
}
