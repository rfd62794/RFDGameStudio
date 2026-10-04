import { 
  GameState, 
  GameAction, 
  ItemPacket, 
  GridTile, 
  CustomerOrder, 
  RawPartId, 
  WeaponId, 
  CardinalDirection 
} from '../types';
import { 
  RAW_PARTS, 
  WEAPON_RECIPES, 
  DEFAULT_UPGRADES, 
  CUSTOMER_NAMES, 
  CUSTOMER_ROLES, 
  createEmptyGrid, 
  PRESET_FACTORIES 
} from './recipes';
import { 
  playConveyorTick, 
  playAssemblyComplete, 
  playPackingComplete, 
  playCashSale, 
  playMissedSale, 
  playUpgradeChime 
} from './audio';

export const INITIAL_GRID_SIZE = 6;

export function getInitialGameState(): GameState {
  const initialUpgrades = JSON.parse(JSON.stringify(DEFAULT_UPGRADES));
  const starterPreset = PRESET_FACTORIES[0];
  const grid = createEmptyGrid(INITIAL_GRID_SIZE, INITIAL_GRID_SIZE);

  // Apply starter preset
  starterPreset.tiles.forEach(t => {
    if (t.x < INITIAL_GRID_SIZE && t.y < INITIAL_GRID_SIZE) {
      grid[t.y][t.x] = {
        x: t.x,
        y: t.y,
        type: t.type,
        direction: t.direction,
        spawnerPart: t.spawnerPart,
        fitterBuffer: [],
        totalPassed: 0,
        totalAssembled: 0,
        totalPacked: 0,
      };
    }
  });

  return {
    tick: 0,
    funds: 120, // Starting capital
    reputation: 60,
    gridWidth: INITIAL_GRID_SIZE,
    gridHeight: INITIAL_GRID_SIZE,
    grid,
    items: [],
    hopperStock: {
      chassis: 15,
      barrel: 10,
      magazine: 15,
      stock: 0,
      optic: 0,
    },
    shelfStock: {
      pistol: 1,
      shotgun: 0,
      rifle: 0,
      smg: 0,
      dmr: 0,
    },
    shelfCapacity: 5,
    activeCustomers: [
      {
        id: 'cust_init_1',
        customerName: 'Officer Vance',
        customerRole: 'City Metro Precinct',
        weaponId: 'pistol',
        quantity: 1,
        maxPatienceTicks: 24,
        remainingPatienceTicks: 24,
        bonusMultiplier: 1.0,
        avatarBg: '#38bdf8',
      },
    ],
    nextCustomerSpawnInTicks: 4,
    upgrades: initialUpgrades,
    tickRateMs: 800,
    isRunning: true,
    speed: 1,
    soundEnabled: true,
    metrics: {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      fulfilledOrders: 0,
      missedSalesCount: 0,
      totalWeaponsCrafted: 0,
      totalPartsUsed: 0,
      currentEfficiency: 100,
    },
    recentLogs: [
      {
        id: 'log_0',
        text: 'Workshop online. Starter Pistol Line initialized.',
        type: 'info',
        tick: 0,
      },
    ],
  };
}

export function getOffsetForDirection(dir: CardinalDirection): { dx: number; dy: number } {
  switch (dir) {
    case 'N': return { dx: 0, dy: -1 };
    case 'S': return { dx: 0, dy: 1 };
    case 'E': return { dx: 1, dy: 0 };
    case 'W': return { dx: -1, dy: 0 };
  }
}

export function rotateDirection(dir: CardinalDirection): CardinalDirection {
  switch (dir) {
    case 'N': return 'E';
    case 'E': return 'S';
    case 'S': return 'W';
    case 'W': return 'N';
  }
}

export function isRecipeSatisfied(
  buffer: RawPartId[],
  recipe: typeof WEAPON_RECIPES[WeaponId]
): boolean {
  const counts: Record<string, number> = {};
  buffer.forEach(p => {
    counts[p] = (counts[p] || 0) + 1;
  });

  for (const [partId, reqCount] of Object.entries(recipe.requiredParts)) {
    if (reqCount > 0 && (counts[partId] || 0) < reqCount) {
      return false;
    }
  }
  return true;
}

export function consumeRecipeParts(
  buffer: RawPartId[],
  recipe: typeof WEAPON_RECIPES[WeaponId]
): RawPartId[] {
  const newBuffer = [...buffer];
  for (const [partId, reqCount] of Object.entries(recipe.requiredParts)) {
    for (let i = 0; i < reqCount; i++) {
      const idx = newBuffer.indexOf(partId as RawPartId);
      if (idx !== -1) {
        newBuffer.splice(idx, 1);
      }
    }
  }
  return newBuffer;
}

/**
 * Main Deterministic Simulation Reducer
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_RUNNING':
      return { ...state, isRunning: action.isRunning };

    case 'SET_SPEED':
      return {
        ...state,
        speed: action.speed,
        tickRateMs: action.speed === 1 ? 800 : action.speed === 2 ? 450 : 250,
      };

    case 'TOGGLE_SOUND':
      return { ...state, soundEnabled: !state.soundEnabled };

    case 'BUY_PART': {
      const part = RAW_PARTS[action.partId];
      if (!part) return state;
      const totalCost = part.cost * action.quantity;
      if (state.funds < totalCost) return state;

      return {
        ...state,
        funds: state.funds - totalCost,
        hopperStock: {
          ...state.hopperStock,
          [action.partId]: (state.hopperStock[action.partId] || 0) + action.quantity,
        },
        metrics: {
          ...state.metrics,
          totalExpenses: state.metrics.totalExpenses + totalCost,
          netProfit: state.metrics.totalRevenue - (state.metrics.totalExpenses + totalCost),
        },
        recentLogs: [
          {
            id: `buy_${state.tick}_${Date.now()}`,
            text: `Ordered ${action.quantity}x ${part.name} for $${totalCost}`,
            type: 'info',
            tick: state.tick,
          },
          ...state.recentLogs.slice(0, 19),
        ],
      };
    }

    case 'BUY_UPGRADE': {
      const upgrade = state.upgrades.find(u => u.id === action.upgradeId);
      if (!upgrade || upgrade.purchased) return state;
      if (state.funds < upgrade.cost) return state;

      const newUpgrades = state.upgrades.map(u => 
        u.id === action.upgradeId ? { ...u, purchased: true } : u
      );

      let newGrid = state.grid;
      let newGridWidth = state.gridWidth;
      let newGridHeight = state.gridHeight;
      let newCapacity = state.shelfCapacity;

      if (action.upgradeId === 'tech_expanded_shelf') {
        newCapacity = 10;
      }

      if (action.upgradeId === 'tech_expanded_floor') {
        newGridWidth = 8;
        newGridHeight = 8;
        newGrid = createEmptyGrid(8, 8);
        for (let y = 0; y < state.gridHeight; y++) {
          for (let x = 0; x < state.gridWidth; x++) {
            newGrid[y][x] = { ...state.grid[y][x] };
          }
        }
      }

      if (state.soundEnabled) {
        playUpgradeChime(true);
      }

      return {
        ...state,
        funds: state.funds - upgrade.cost,
        upgrades: newUpgrades,
        shelfCapacity: newCapacity,
        grid: newGrid,
        gridWidth: newGridWidth,
        gridHeight: newGridHeight,
        metrics: {
          ...state.metrics,
          totalExpenses: state.metrics.totalExpenses + upgrade.cost,
          netProfit: state.metrics.totalRevenue - (state.metrics.totalExpenses + upgrade.cost),
        },
        recentLogs: [
          {
            id: `upg_${state.tick}_${Date.now()}`,
            text: `Researched Tech: ${upgrade.name}`,
            type: 'info',
            tick: state.tick,
          },
          ...state.recentLogs.slice(0, 19),
        ],
      };
    }

    case 'PLACE_TILE': {
      const { x, y, tileType, direction, spawnerPart } = action;
      if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) return state;

      const newGrid = state.grid.map((row, rY) =>
        row.map((cell, cX) => {
          if (rY === y && cX === x) {
            return {
              ...cell,
              type: tileType,
              direction,
              spawnerPart: tileType === 'spawner' ? (spawnerPart || cell.spawnerPart || 'chassis') : undefined,
              fitterBuffer: tileType === 'fitter' ? (cell.fitterBuffer || []) : [],
            };
          }
          return cell;
        })
      );

      return { ...state, grid: newGrid };
    }

    case 'ROTATE_TILE': {
      const { x, y } = action;
      if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) return state;
      const current = state.grid[y][x];
      if (current.type === 'empty') return state;

      const newDirection = rotateDirection(current.direction);
      const newGrid = state.grid.map((row, rY) =>
        row.map((cell, cX) => {
          if (rY === y && cX === x) {
            return { ...cell, direction: newDirection };
          }
          return cell;
        })
      );

      return { ...state, grid: newGrid };
    }

    case 'SET_SPAWNER_PART': {
      const { x, y, partId } = action;
      if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) return state;

      const newGrid = state.grid.map((row, rY) =>
        row.map((cell, cX) => {
          if (rY === y && cX === x) {
            return { ...cell, spawnerPart: partId };
          }
          return cell;
        })
      );

      return { ...state, grid: newGrid };
    }

    case 'CLEAR_TILE': {
      const { x, y } = action;
      if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) return state;

      const newGrid = state.grid.map((row, rY) =>
        row.map((cell, cX) => {
          if (rY === y && cX === x) {
            return {
              x,
              y,
              type: 'empty' as const,
              direction: 'E' as const,
              fitterBuffer: [],
              totalPassed: 0,
              totalAssembled: 0,
              totalPacked: 0,
            };
          }
          return cell;
        })
      );

      // Also clear items on that cell
      const newItems = state.items.filter(i => !(i.x === x && i.y === y));

      return { ...state, grid: newGrid, items: newItems };
    }

    case 'CLEAR_ALL_TILES': {
      const newGrid = createEmptyGrid(state.gridWidth, state.gridHeight);
      return { ...state, grid: newGrid, items: [] };
    }

    case 'LOAD_PRESET': {
      const preset = PRESET_FACTORIES.find(p => p.id === action.presetId);
      if (!preset) return state;

      const newGrid = createEmptyGrid(state.gridWidth, state.gridHeight);
      preset.tiles.forEach(t => {
        if (t.x < state.gridWidth && t.y < state.gridHeight) {
          newGrid[t.y][t.x] = {
            x: t.x,
            y: t.y,
            type: t.type,
            direction: t.direction,
            spawnerPart: t.spawnerPart,
            fitterBuffer: [],
            totalPassed: 0,
            totalAssembled: 0,
            totalPacked: 0,
          };
        }
      });

      return {
        ...state,
        grid: newGrid,
        items: [],
        recentLogs: [
          {
            id: `load_${state.tick}_${Date.now()}`,
            text: `Loaded blueprint preset: ${preset.name}`,
            type: 'info',
            tick: state.tick,
          },
          ...state.recentLogs.slice(0, 19),
        ],
      };
    }

    case 'RESET_GAME':
      return getInitialGameState();

    case 'TICK': {
      const currentTick = state.tick + 1;
      let newFunds = state.funds;
      let newReputation = state.reputation;
      let hopperStock = { ...state.hopperStock };
      let shelfStock = { ...state.shelfStock };
      const newLogs = [...state.recentLogs];
      const grid = state.grid.map(row => row.map(cell => ({ ...cell, fitterBuffer: [...(cell.fitterBuffer || [])] })));
      const hasAutoSupplier = state.upgrades.some(u => u.id === 'tech_auto_supplier' && u.purchased);
      const isSpecOpsUnlocked = state.upgrades.some(u => u.id === 'tech_specops' && u.purchased);
      const isPrecisionUnlocked = state.upgrades.some(u => u.id === 'tech_precision' && u.purchased);

      let totalWeaponsCrafted = state.metrics.totalWeaponsCrafted;
      let totalPartsUsed = state.metrics.totalPartsUsed;
      let fulfilledOrders = state.metrics.fulfilledOrders;
      let missedSalesCount = state.metrics.missedSalesCount;
      let totalRevenue = state.metrics.totalRevenue;
      let totalExpenses = state.metrics.totalExpenses;

      let soundTickPlayed = false;
      let soundAssemblyPlayed = false;
      let soundPackingPlayed = false;
      let soundSalePlayed = false;
      let soundMissedPlayed = false;

      // 1. Auto-Supplier Logic
      if (hasAutoSupplier) {
        const partsToCheck: RawPartId[] = ['chassis', 'barrel', 'magazine'];
        if (isSpecOpsUnlocked) partsToCheck.push('stock');
        if (isPrecisionUnlocked) partsToCheck.push('optic');

        for (const pId of partsToCheck) {
          if (hopperStock[pId] <= 2) {
            const cost = RAW_PARTS[pId].cost * 5;
            if (newFunds >= cost) {
              newFunds -= cost;
              hopperStock[pId] += 5;
              totalExpenses += cost;
              newLogs.unshift({
                id: `auto_${currentTick}_${pId}`,
                text: `Auto-restocked 5x ${RAW_PARTS[pId].name} (-$${cost})`,
                type: 'info',
                tick: currentTick,
              });
            }
          }
        }
      }

      // Map occupied positions by existing items
      const occupiedByExisting: Record<string, ItemPacket> = {};
      state.items.forEach(item => {
        occupiedByExisting[`${item.x},${item.y}`] = item;
      });

      // 2. Spawner Production (emit parts onto target cell if free)
      const spawnedItems: ItemPacket[] = [];
      for (let y = 0; y < state.gridHeight; y++) {
        for (let x = 0; x < state.gridWidth; x++) {
          const tile = grid[y][x];
          if (tile.type === 'spawner' && tile.spawnerPart) {
            const partId = tile.spawnerPart;
            if (hopperStock[partId] > 0) {
              const offset = getOffsetForDirection(tile.direction);
              const targetX = x + offset.dx;
              const targetY = y + offset.dy;

              if (targetX >= 0 && targetX < state.gridWidth && targetY >= 0 && targetY < state.gridHeight) {
                const targetKey = `${targetX},${targetY}`;
                // Only spawn if target cell is not currently occupied by another item
                if (!occupiedByExisting[targetKey]) {
                  hopperStock[partId] -= 1;
                  totalPartsUsed += 1;
                  const newItem: ItemPacket = {
                    id: `item_${currentTick}_${x}_${y}_${Math.random().toString(36).substring(2, 7)}`,
                    kind: 'part',
                    itemId: partId,
                    x: targetX,
                    y: targetY,
                    progress: 0,
                    createdTick: currentTick,
                  };
                  spawnedItems.push(newItem);
                  occupiedByExisting[targetKey] = newItem;
                  tile.totalPassed = (tile.totalPassed || 0) + 1;
                }
              }
            }
          }
        }
      }

      // 3. Process Item Movements, Machine Intakes & Fitting
      const survivingItems: ItemPacket[] = [];
      const movedPositions: Record<string, boolean> = {};

      // Sort items so items furthest down conveyor streams move first to prevent artificial jams
      const allCurrentItems = [...state.items, ...spawnedItems];

      for (const item of allCurrentItems) {
        const currentTile = grid[item.y]?.[item.x];
        if (!currentTile || currentTile.type === 'empty') {
          // Off grid or empty tile: item despawns
          continue;
        }

        // Check if item is currently on a special machine tile:
        // A. Fitter
        if (currentTile.type === 'fitter') {
          if (item.kind === 'part') {
            currentTile.fitterBuffer = currentTile.fitterBuffer || [];
            currentTile.fitterBuffer.push(item.itemId as RawPartId);
            currentTile.totalPassed = (currentTile.totalPassed || 0) + 1;
            // Item consumed into fitter buffer
            continue;
          }
        }

        // B. Packer
        if (currentTile.type === 'packer') {
          if (item.kind === 'weapon') {
            const wId = item.itemId as WeaponId;
            if (shelfStock[wId] < state.shelfCapacity) {
              shelfStock[wId] += 1;
              currentTile.totalPacked = (currentTile.totalPacked || 0) + 1;
              soundPackingPlayed = true;
              newLogs.unshift({
                id: `pack_${currentTick}_${wId}_${Date.now()}`,
                text: `Packed ${WEAPON_RECIPES[wId].name} into Storefront Shelf!`,
                type: 'craft',
                tick: currentTick,
              });
            }
          }
          // Consumed by packing crate
          continue;
        }

        // C. Trash
        if (currentTile.type === 'trash') {
          // Consumed and recycled
          continue;
        }

        // D. Conveyor / Normal Movement
        if (currentTile.type === 'conveyor' || currentTile.type === 'spawner') {
          const offset = getOffsetForDirection(currentTile.direction);
          const nextX = item.x + offset.dx;
          const nextY = item.y + offset.dy;

          // Check boundary
          if (nextX < 0 || nextX >= state.gridWidth || nextY < 0 || nextY >= state.gridHeight) {
            // Fell off factory floor
            continue;
          }

          const nextTile = grid[nextY][nextX];
          if (nextTile.type === 'empty') {
            // Cannot move onto empty space
            survivingItems.push(item);
            movedPositions[`${item.x},${item.y}`] = true;
            continue;
          }

          const nextPosKey = `${nextX},${nextY}`;
          // If next tile is Fitter / Packer / Trash, it can consume immediately even if another item is there
          if (nextTile.type === 'fitter' || nextTile.type === 'packer' || nextTile.type === 'trash') {
            item.x = nextX;
            item.y = nextY;
            survivingItems.push(item);
            soundTickPlayed = true;
          } else if (!movedPositions[nextPosKey]) {
            // Next conveyor tile is free!
            item.x = nextX;
            item.y = nextY;
            survivingItems.push(item);
            movedPositions[nextPosKey] = true;
            soundTickPlayed = true;
          } else {
            // Conveyor jammed - wait in place
            survivingItems.push(item);
            movedPositions[`${item.x},${item.y}`] = true;
          }
        } else {
          survivingItems.push(item);
        }
      }

      // 4. Run Fitter Assembly Check on all Fitter Workstations
      for (let y = 0; y < state.gridHeight; y++) {
        for (let x = 0; x < state.gridWidth; x++) {
          const tile = grid[y][x];
          if (tile.type === 'fitter' && tile.fitterBuffer && tile.fitterBuffer.length > 0) {
            // Check recipes from highest value to lowest
            const recipesInOrder: WeaponId[] = ['dmr', 'smg', 'rifle', 'shotgun', 'pistol'];
            
            for (const rId of recipesInOrder) {
              const recipe = WEAPON_RECIPES[rId];
              // If tech is required, check if purchased
              if (recipe.requiredTechId) {
                const hasTech = state.upgrades.some(u => u.id === recipe.requiredTechId && u.purchased);
                if (!hasTech) continue;
              }

              if (isRecipeSatisfied(tile.fitterBuffer, recipe)) {
                // Determine output coordinate
                const offset = getOffsetForDirection(tile.direction);
                const outX = x + offset.dx;
                const outY = y + offset.dy;

                if (outX >= 0 && outX < state.gridWidth && outY >= 0 && outY < state.gridHeight) {
                  tile.fitterBuffer = consumeRecipeParts(tile.fitterBuffer, recipe);
                  tile.totalAssembled = (tile.totalAssembled || 0) + 1;
                  totalWeaponsCrafted += 1;
                  soundAssemblyPlayed = true;

                  const finishedWeapon: ItemPacket = {
                    id: `wep_${currentTick}_${x}_${y}_${Math.random().toString(36).substring(2, 7)}`,
                    kind: 'weapon',
                    itemId: rId,
                    x: outX,
                    y: outY,
                    progress: 0,
                    createdTick: currentTick,
                  };
                  survivingItems.push(finishedWeapon);

                  newLogs.unshift({
                    id: `craft_${currentTick}_${rId}_${Date.now()}`,
                    text: `Assembled ${recipe.name}! (+${recipe.margin} margin potential)`,
                    type: 'craft',
                    tick: currentTick,
                  });
                  break; // Only assemble 1 weapon per fitter per tick
                }
              }
            }
          }
        }
      }

      // 5. Automated Storefront Customer Queue & Sales
      let activeCustomers = [...state.activeCustomers];
      let nextCustomerSpawn = state.nextCustomerSpawnInTicks - 1;

      // Spawn new customer if timer expired and queue not full
      if (nextCustomerSpawn <= 0) {
        if (activeCustomers.length < 4) {
          const availableWeapons: WeaponId[] = ['pistol', 'shotgun', 'rifle'];
          if (isSpecOpsUnlocked) availableWeapons.push('smg');
          if (isPrecisionUnlocked) availableWeapons.push('dmr');

          const chosenWeapon = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
          const name = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)];
          const role = CUSTOMER_ROLES[Math.floor(Math.random() * CUSTOMER_ROLES.length)];
          const bgColors = ['#38bdf8', '#10b981', '#f59e0b', '#a855f7', '#ec4899'];
          const avatarBg = bgColors[Math.floor(Math.random() * bgColors.length)];

          activeCustomers.push({
            id: `cust_${currentTick}_${Math.random().toString(36).substring(2, 6)}`,
            customerName: name,
            customerRole: role,
            weaponId: chosenWeapon,
            quantity: 1,
            maxPatienceTicks: 20,
            remainingPatienceTicks: 20,
            bonusMultiplier: 1.0,
            avatarBg,
          });
        }
        nextCustomerSpawn = Math.floor(Math.random() * 3) + 3; // 3-5 ticks
      }

      // Process orders and patience decay
      const remainingCustomers: CustomerOrder[] = [];
      for (const cust of activeCustomers) {
        const wId = cust.weaponId;
        const recipe = WEAPON_RECIPES[wId];

        // Check if weapon is in stock on the Storefront Shelf
        if (shelfStock[wId] >= cust.quantity) {
          // Sale fulfilled instantly!
          shelfStock[wId] -= cust.quantity;
          const revenue = recipe.salePrice * cust.quantity * cust.bonusMultiplier;
          newFunds += revenue;
          totalRevenue += revenue;
          fulfilledOrders += cust.quantity;
          newReputation = Math.min(100, newReputation + 2);
          soundSalePlayed = true;

          newLogs.unshift({
            id: `sale_${currentTick}_${cust.id}`,
            text: `Sold ${cust.quantity}x ${recipe.name} to ${cust.customerName} (+$${revenue})`,
            type: 'sale',
            tick: currentTick,
          });
        } else {
          // Decrement patience
          const newPatience = cust.remainingPatienceTicks - 1;
          if (newPatience <= 0) {
            // Customer walked away due to empty shelf!
            missedSalesCount += cust.quantity;
            newReputation = Math.max(10, newReputation - 3);
            soundMissedPlayed = true;

            newLogs.unshift({
              id: `miss_${currentTick}_${cust.id}`,
              text: `MISSED SALE: ${cust.customerName} wanted ${recipe.name} (Shelf was empty!)`,
              type: 'miss',
              tick: currentTick,
            });
          } else {
            remainingCustomers.push({
              ...cust,
              remainingPatienceTicks: newPatience,
            });
          }
        }
      }

      // Play audio cues if enabled
      if (state.soundEnabled) {
        if (soundSalePlayed) playCashSale(true);
        else if (soundAssemblyPlayed) playAssemblyComplete(true);
        else if (soundPackingPlayed) playPackingComplete(true);
        else if (soundMissedPlayed) playMissedSale(true);
        else if (soundTickPlayed && state.speed === 1) playConveyorTick(true);
      }

      const totalDemand = fulfilledOrders + missedSalesCount;
      const efficiency = totalDemand > 0 ? Math.round((fulfilledOrders / totalDemand) * 100) : 100;

      return {
        ...state,
        tick: currentTick,
        funds: newFunds,
        reputation: newReputation,
        grid,
        items: survivingItems,
        hopperStock,
        shelfStock,
        activeCustomers: remainingCustomers,
        nextCustomerSpawnInTicks: nextCustomerSpawn,
        metrics: {
          totalRevenue,
          totalExpenses,
          netProfit: totalRevenue - totalExpenses,
          fulfilledOrders,
          missedSalesCount,
          totalWeaponsCrafted,
          totalPartsUsed,
          currentEfficiency: efficiency,
        },
        recentLogs: newLogs.slice(0, 25),
      };
    }

    default:
      return state;
  }
}
