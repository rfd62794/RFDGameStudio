import { TileState, GuardEntity, PlayerEntity, Carrier, Property, GameObject, GuardType } from '../types';

export const VISION_CONE_CONFIG: Record<GuardType, { angle: number; range: number }> = {
  watcher: { angle: 55, range: 3 },
  patrol: { angle: 45, range: 2 },
};

function segmentsIntersect(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number }
): boolean {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (Math.abs(d) < 1e-9) {
    return false;
  }

  const u = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
  const v = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;

  const eps = 1e-9;
  return u >= -eps && u <= 1 + eps && v >= -eps && v <= 1 + eps;
}

function computeVisibleTiles(
  originX: number,
  originY: number,
  grid: TileState[][]
): { x: number; y: number }[] {
  const size = grid.length;
  const visible: { x: number; y: number }[] = [];

  const blockers: { x: number; y: number }[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const tile = grid[y][x];
      const isBlocked = tile.isWall || (tile.isGated && !tile.isGatedUnlocked);
      if (isBlocked) {
        blockers.push({ x, y });
      }
    }
  }

  const p1 = { x: originX + 0.5, y: originY + 0.5 };

  for (let ty = 0; ty < size; ty++) {
    for (let tx = 0; tx < size; tx++) {
      if (tx === originX && ty === originY) {
        visible.push({ x: tx, y: ty });
        continue;
      }

      const p2 = { x: tx + 0.5, y: ty + 0.5 };
      let hasIntersection = false;

      for (const blocker of blockers) {
        if ((blocker.x === originX && blocker.y === originY) || (blocker.x === tx && blocker.y === ty)) {
          continue;
        }

        const bx = blocker.x;
        const by = blocker.y;

        const leftSegment =   { p3: { x: bx, y: by },     p4: { x: bx, y: by + 1 } };
        const rightSegment =  { p3: { x: bx + 1, y: by }, p4: { x: bx + 1, y: by + 1 } };
        const topSegment =    { p3: { x: bx, y: by },     p4: { x: bx + 1, y: by } };
        const bottomSegment = { p3: { x: bx, y: by + 1 }, p4: { x: bx + 1, y: by + 1 } };

        if (
          segmentsIntersect(p1, p2, leftSegment.p3, leftSegment.p4) ||
          segmentsIntersect(p1, p2, rightSegment.p3, rightSegment.p4) ||
          segmentsIntersect(p1, p2, topSegment.p3, topSegment.p4) ||
          segmentsIntersect(p1, p2, bottomSegment.p3, bottomSegment.p4)
        ) {
          hasIntersection = true;
          break;
        }
      }

      if (!hasIntersection) {
        visible.push({ x: tx, y: ty });
      }
    }
  }

  return visible;
}

function maskToCone(
  visibleTiles: { x: number; y: number }[],
  originX: number,
  originY: number,
  facing: 'U' | 'D' | 'L' | 'R',
  coneAngleDegrees: number,
  range: number
): { x: number; y: number }[] {
  let fdx = 0;
  let fdy = 0;
  if (facing === 'U') fdy = -1;
  else if (facing === 'D') fdy = 1;
  else if (facing === 'L') fdx = -1;
  else if (facing === 'R') fdx = 1;

  const halfAngleRad = (coneAngleDegrees / 2) * (Math.PI / 180);
  const cosHalfAngle = Math.cos(halfAngleRad);

  return visibleTiles.filter(tile => {
    if (tile.x === originX && tile.y === originY) {
      return true;
    }

    const targetDx = tile.x - originX;
    const targetDy = tile.y - originY;
    const distSq = targetDx * targetDx + targetDy * targetDy;

    if (distSq > range * range) {
      return false;
    }

    const dot = targetDx * fdx + targetDy * fdy;
    const dist = Math.sqrt(distSq);
    const cosTheta = dot / dist;

    return cosTheta >= cosHalfAngle - 1e-9;
  });
}

function computeReflectedRay(
  gx: number,
  gy: number,
  facing: 'U' | 'D' | 'L' | 'R',
  grid: TileState[][],
  isImmobilized?: boolean
): { x: number; y: number }[] {
  const size = grid.length;
  const path: { x: number; y: number }[] = [];
  let cx = gx;
  let cy = gy;
  let dir = facing;
  const visited = new Set<string>();

  while (true) {
    let nx = cx;
    let ny = cy;

    if (dir === 'U') ny--;
    else if (dir === 'D') ny++;
    else if (dir === 'L') nx--;
    else if (dir === 'R') nx++;

    if (nx < 0 || nx >= size || ny < 0 || ny >= size) {
      break;
    }

    if (grid[ny][nx].isWall) {
      break;
    }

    const key = `${nx},${ny},${dir}`;
    if (visited.has(key)) {
      break;
    }
    visited.add(key);

    path.push({ x: nx, y: ny });

    const tile = grid[ny][nx];
    const refObj = !isImmobilized ? getObjectWithProperty(tile, 'reflective') : null;

    if (refObj) {
      const angle = refObj.mirrorAngle || '/';
      if (angle === '/') {
        if (dir === 'R') dir = 'U';
        else if (dir === 'L') dir = 'D';
        else if (dir === 'U') dir = 'R';
        else if (dir === 'D') dir = 'L';
      } else { // '\\'
        if (dir === 'R') dir = 'D';
        else if (dir === 'L') dir = 'U';
        else if (dir === 'U') dir = 'L';
        else if (dir === 'D') dir = 'R';
      }
    }

    cx = nx;
    cy = ny;
  }

  return path;
}

/**
 * Computes the sightline path for a guard.
 * Supports multiple 90-degree reflections when hitting any object with the 'reflective' property.
 */
export function computeSightline(
  gx: number,
  gy: number,
  facing: 'U' | 'D' | 'L' | 'R',
  grid: TileState[][],
  isImmobilized: boolean = false,
  guardType: GuardType = 'watcher'
): { x: number; y: number }[] {
  const config = VISION_CONE_CONFIG[guardType] || VISION_CONE_CONFIG.watcher;
  const visible = computeVisibleTiles(gx, gy, grid);
  const coneTiles = maskToCone(visible, gx, gy, facing, config.angle, config.range);
  const reflectedTiles = computeReflectedRay(gx, gy, facing, grid, isImmobilized);

  const seenMap = new Map<string, { x: number; y: number }>();

  coneTiles.forEach(tile => {
    if (tile.x !== gx || tile.y !== gy) {
      seenMap.set(`${tile.x},${tile.y}`, tile);
    }
  });

  reflectedTiles.forEach(tile => {
    if (tile.x !== gx || tile.y !== gy) {
      seenMap.set(`${tile.x},${tile.y}`, tile);
    }
  });

  return Array.from(seenMap.values());
}

/**
 * Helper to retrieve an object (environment or item) on a tile carrying a specific property
 */
export function getObjectWithProperty(tile: TileState, prop: Property): GameObject | null {
  if (tile.environmentObject?.properties.includes(prop)) {
    return tile.environmentObject;
  }
  if (tile.item?.properties.includes(prop)) {
    return tile.item;
  }
  return null;
}

/**
 * Triggers a loud sound on a tile, drawing guard attention towards it.
 * Guards turn to face the sound tile, modifying their sightline/telecast.
 */
export function triggerLoud(
  soundX: number,
  soundY: number,
  guards: GuardEntity[],
  logs: string[]
): { guards: GuardEntity[] } {
  const updatedGuards = guards.map(guard => {
    if (guard.immobilizedTurns > 0) {
      return guard; // Immobilized guards cannot turn
    }

    const dx = soundX - guard.x;
    const dy = soundY - guard.y;

    if (dx === 0 && dy === 0) {
      return guard; // Triggered on guard tile itself, no turn
    }

    let newFacing = guard.facing;
    if (Math.abs(dx) >= Math.abs(dy)) {
      newFacing = dx > 0 ? 'R' : 'L';
    } else {
      newFacing = dy > 0 ? 'D' : 'U';
    }

    if (newFacing !== guard.facing) {
      logs.push(`Guard at (${guard.x}, ${guard.y}) heard a loud noise and turned to face (${soundX}, ${soundY}).`);
    } else {
      logs.push(`Guard at (${guard.x}, ${guard.y}) heard a loud noise from (${soundX}, ${soundY}).`);
    }

    return {
      ...guard,
      facing: newFacing,
      investigateTarget: { x: soundX, y: soundY }
    };
  });

  return { guards: updatedGuards };
}

/**
 * Propagates electricity through adjacent conductive tiles using BFS.
 * Stuns guards standing on electrified tiles, and damages player if caught.
 */
export function propagateElectricity(
  startX: number,
  startY: number,
  grid: TileState[][],
  guards: GuardEntity[],
  player: PlayerEntity,
  logs: string[]
): {
  grid: TileState[][];
  guards: GuardEntity[];
  playerDamageTaken: boolean;
} {
  const size = grid.length;
  const electrifiedTiles: { x: number; y: number }[] = [];
  const queue: { x: number; y: number }[] = [{ x: startX, y: startY }];
  const visited = new Set<string>();
  visited.add(`${startX},${startY}`);

  // Perform BFS across connected Conductive tiles
  while (queue.length > 0) {
    const curr = queue.shift()!;
    const tile = grid[curr.y][curr.x];
    const isConductive = getObjectWithProperty(tile, 'conductive') !== null;

    if (isConductive || (curr.x === startX && curr.y === startY)) {
      electrifiedTiles.push(curr);

      // Check 4-way neighbors
      const neighbors = [
        { x: curr.x + 1, y: curr.y },
        { x: curr.x - 1, y: curr.y },
        { x: curr.x, y: curr.y + 1 },
        { x: curr.x, y: curr.y - 1 },
      ];

      for (const nb of neighbors) {
        if (nb.x >= 0 && nb.x < size && nb.y >= 0 && nb.y < size) {
          const nbTile = grid[nb.y][nb.x];
          const nbKey = `${nb.x},${nb.y}`;
          const isNbConductive = getObjectWithProperty(nbTile, 'conductive') !== null;

          if (isNbConductive && !visited.has(nbKey) && !nbTile.isWall) {
            visited.add(nbKey);
            queue.push(nb);
          }
        }
      }
    }
  }

  // Update grid tiles
  const updatedGrid = grid.map((row, y) =>
    row.map((tile, x) => {
      const isElectrified = electrifiedTiles.some(t => t.x === x && t.y === y);
      if (isElectrified) {
        logs.push(`Tile at (${x}, ${y}) is ELECTRIFIED!`);
        return {
          ...tile,
          status: 'electrified' as const,
        };
      }
      return tile;
    })
  );

  // Shock Guards on electrified tiles
  let updatedGuards = [...guards];
  electrifiedTiles.forEach(tile => {
    updatedGuards = updatedGuards.map(guard => {
      if (guard.x === tile.x && guard.y === tile.y) {
        logs.push(`Guard at (${guard.x}, ${guard.y}) was SHOCKED and immobilized for 2 turns!`);
        return {
          ...guard,
          immobilizedTurns: 2,
          intent: {
            actionType: 'idle' as const,
            targetTiles: [],
            description: 'Stunned by Electrical Shock'
          }
        };
      }
      return guard;
    });
  });

  // Shock Player
  let playerDamageTaken = false;
  const isPlayerOnElectrified = electrifiedTiles.some(
    tile => tile.x === player.x && tile.y === player.y
  );
  if (isPlayerOnElectrified) {
    logs.push(`Player was SHOCKED on an electrified tile! (-1 Heart)`);
    playerDamageTaken = true;
  }

  return {
    grid: updatedGrid,
    guards: updatedGuards,
    playerDamageTaken
  };
}

/**
 * Universal, property-based carrier application.
 * Resolves against properties (Flammable, Conductive, Loud, etc.) on the tile,
 * not named items.
 */
export function applyCarrierEffect(
  grid: TileState[][],
  guards: GuardEntity[],
  player: PlayerEntity,
  targetX: number,
  targetY: number,
  carrier: Carrier | 'adhesive',
  logs: string[]
): {
  grid: TileState[][];
  guards: GuardEntity[];
  playerDamageTaken: boolean;
} {
  const size = grid.length;
  if (targetX < 0 || targetX >= size || targetY < 0 || targetY >= size) {
    return { grid, guards, playerDamageTaken: false };
  }

  const tile = grid[targetY][targetX];
  let updatedGrid = grid.map(row => row.map(t => ({ ...t })));
  let updatedGuards = [...guards];
  let playerDamageTaken = false;

  if (carrier === 'heat') {
    logs.push(`Heat applied to tile (${targetX}, ${targetY}).`);
    
    // Check if tile contains a flammable object
    const flammableObj = getObjectWithProperty(tile, 'flammable');
    if (flammableObj) {
      logs.push(`Success: Flammable object "${flammableObj.name}" at (${targetX}, ${targetY}) ignited into flames!`);
      
      updatedGrid[targetY][targetX].status = 'ignited';
      updatedGrid[targetY][targetX].burnTurnsLeft = 3;

      // Handle custom properties of the ignited object.
      // E.g., if it's Flammable AND Loud (like a Firecracker), igniting it triggers Loud!
      const isLoud = getObjectWithProperty(tile, 'loud') !== null;
      if (isLoud) {
        logs.push(`The flammable/loud object "${flammableObj.name}" exploded!`);
        const loudResult = triggerLoud(targetX, targetY, updatedGuards, logs);
        updatedGuards = loudResult.guards;
      }
    } else {
      logs.push(`No flammable object found at (${targetX}, ${targetY}). Heat dissipates.`);
    }
  } 
  
  else if (carrier === 'electric') {
    logs.push(`Electricity applied to tile (${targetX}, ${targetY}).`);

    const conductiveObj = getObjectWithProperty(tile, 'conductive');
    if (conductiveObj || true) { // Can apply electric to any tile, but it only propagates if it's conductive
      const electricResult = propagateElectricity(targetX, targetY, updatedGrid, updatedGuards, player, logs);
      updatedGrid = electricResult.grid;
      updatedGuards = electricResult.guards;
      playerDamageTaken = electricResult.playerDamageTaken;
    }
  } 
  
  else if (carrier === 'adhesive') {
    logs.push(`Adhesive applied to tile (${targetX}, ${targetY}).`);

    // If there is a guard on this tile, immobilize them directly
    const guardAtTile = updatedGuards.find(g => g.x === targetX && g.y === targetY);
    if (guardAtTile) {
      logs.push(`Success: Guard at (${targetX}, ${targetY}) is glued to the floor and immobilized for 3 turns!`);
      updatedGuards = updatedGuards.map(g => {
        if (g.x === targetX && g.y === targetY) {
          return {
            ...g,
            immobilizedTurns: 3,
            intent: {
              actionType: 'idle' as const,
              targetTiles: [],
              description: 'Immobilized by Adhesive Glue'
            }
          };
        }
        return g;
      });
    } else {
      // Put adhesive on the environment
      logs.push(`Adhesive puddle placed on tile (${targetX}, ${targetY}).`);
      
      // Let's create an adhesive object on this tile
      const currentEnv = updatedGrid[targetY][targetX].environmentObject;
      updatedGrid[targetY][targetX].environmentObject = {
        id: currentEnv?.id || `glue-${Date.now()}`,
        name: currentEnv ? `${currentEnv.name} (Sticky)` : 'Glue Pool',
        properties: [...(currentEnv?.properties || []), 'adhesive' as const],
        isPickable: false,
        status: 'immobilized' as const,
        immobilizedTurnsLeft: 5
      };
    }
  }

  return {
    grid: updatedGrid,
    guards: updatedGuards,
    playerDamageTaken
  };
}

/**
 * Consolidates standard environmental turn propagation logic.
 * Handles fire-spreading, burning down flammable gates, electric unlocking of conductive gates, and decaying electricity.
 */
export function propagateEnvironment(
  grid: TileState[][],
  guards: GuardEntity[],
  logs: string[]
): {
  grid: TileState[][];
  guards: GuardEntity[];
} {
  let resolvedGrid = grid.map(row => row.map(t => ({ ...t })));
  let resolvedGuards = guards.map(g => ({ ...g }));
  const size = resolvedGrid.length;
  const tilesToIgnite: { x: number; y: number }[] = [];

  // 1. Heat Spread: ignited tiles propagate Heat to Flammable neighbors
  resolvedGrid.forEach((row, y) => {
    row.forEach((tile, x) => {
      if (tile.status === 'ignited') {
        // Spread to 4 neighbors
        const neighbors = [
          { x: x + 1, y },
          { x: x - 1, y },
          { x, y: y + 1 },
          { x, y: y - 1 },
        ];
        neighbors.forEach(nb => {
          if (nb.x >= 0 && nb.x < size && nb.y >= 0 && nb.y < size) {
            const nbTile = resolvedGrid[nb.y][nb.x];
            const isFlammable = getObjectWithProperty(nbTile, 'flammable') !== null;
            if (isFlammable && nbTile.status !== 'ignited' && !nbTile.isWall) {
              tilesToIgnite.push(nb);
            }
          }
        });
      }
    });
  });

  // 2. Tick down burning duration on currently ignited tiles
  resolvedGrid = resolvedGrid.map(row =>
    row.map(tile => {
      if (tile.status === 'ignited') {
        const left = (tile.burnTurnsLeft || 3) - 1;
        if (left <= 0) {
          logs.push(`Fire burned out at (${tile.x}, ${tile.y}). Object consumed.`);
          const isGatedFlammable = tile.isGated === 'flammable';
          if (isGatedFlammable) {
            logs.push(`Wooden Gate at (${tile.x}, ${tile.y}) burned down completely! Path is now passable.`);
          }
          return {
            ...tile,
            status: 'normal' as const,
            burnTurnsLeft: undefined,
            environmentObject: undefined, // Consumed!
            item: undefined, // Consumed!
            isGatedUnlocked: isGatedFlammable ? true : tile.isGatedUnlocked,
            isGated: isGatedFlammable ? undefined : tile.isGated
          };
        } else {
          return {
            ...tile,
            burnTurnsLeft: left
          };
        }
      }
      return tile;
    })
  );

  // 3. Apply new ignitions from spreading
  tilesToIgnite.forEach(target => {
    if (resolvedGrid[target.y][target.x].status !== 'ignited') {
      const obj = getObjectWithProperty(resolvedGrid[target.y][target.x], 'flammable');
      logs.push(`Fire SPREADS to the flammable "${obj?.name}" at (${target.x}, ${target.y})!`);
      resolvedGrid[target.y][target.x].status = 'ignited';
      resolvedGrid[target.y][target.x].burnTurnsLeft = 3;

      // If it's also Loud (e.g. Firecracker), explode it!
      const isLoud = getObjectWithProperty(resolvedGrid[target.y][target.x], 'loud') !== null;
      if (isLoud) {
        logs.push(`The exploding firecracker at (${target.x}, ${target.y}) went BOOM!`);
        
        const loudResult = triggerLoud(target.x, target.y, resolvedGuards, logs);
        resolvedGuards = loudResult.guards;
      }
    }
  });

  // 4. Conductive door unlock check (MUST happen before electricity decays!)
  resolvedGrid = resolvedGrid.map((row, y) =>
    row.map((tile, x) => {
      if (tile.isGated === 'conductive' && !tile.isGatedUnlocked) {
        const isSelfElectrified = tile.status === 'electrified';
        const neighbors = [
          { x: x + 1, y },
          { x: x - 1, y },
          { x, y: y + 1 },
          { x, y: y - 1 },
        ];
        const neighborElectrified = neighbors.some(nb => {
          if (nb.x >= 0 && nb.x < size && nb.y >= 0 && nb.y < size) {
            return resolvedGrid[nb.y][nb.x].status === 'electrified';
          }
          return false;
        });
        if (isSelfElectrified || neighborElectrified) {
          logs.push(`SUCCESS: Conductive-locked door at (${x}, ${y}) unlocked via electrical pulse!`);
          return {
            ...tile,
            isGatedUnlocked: true,
            isGated: undefined,
            environmentObject: undefined // Consumed/open
          };
        }
      }
      return tile;
    })
  );

  // 5. Electricity decays after 1 turn
  resolvedGrid = resolvedGrid.map(row =>
    row.map(tile => {
      if (tile.status === 'electrified') {
        return { ...tile, status: 'normal' as const };
      }
      return tile;
    })
  );

  return {
    grid: resolvedGrid,
    guards: resolvedGuards
  };
}

/**
 * Derives predicted facing from moving one position to another.
 */
export function derivePredictedFacing(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  currentFacing: 'U' | 'D' | 'L' | 'R'
): 'U' | 'D' | 'L' | 'R' {
  if (toX > fromX) return 'R';
  if (toX < fromX) return 'L';
  if (toY > fromY) return 'D';
  if (toY < fromY) return 'U';
  return currentFacing;
}

