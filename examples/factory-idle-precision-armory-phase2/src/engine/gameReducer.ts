import { 
  GameState, 
  GameAction, 
  GridTile, 
  ItemPacket, 
  CardinalDirection, 
  RawPartId, 
  WeaponId, 
  TileType,
  CustomerOrder,
  TechUpgrade,
  SectorData
} from '../types';
import { 
  RAW_PARTS, 
  WEAPON_RECIPES, 
  TECH_UPGRADES, 
  BUILDING_DEFS,
  INITIAL_SECTORS,
  PRESET_FACTORIES 
} from './recipes';
import { 
  playConveyorTick, 
  playAssemblyComplete, 
  playCashSale, 
  playMissedSale 
} from './audio';

// Helper direction offsets
export function getDirectionOffset(dir: CardinalDirection): { dx: number; dy: number } {
  switch (dir) {
    case 'N': return { dx: 0, dy: -1 };
    case 'E': return { dx: 1, dy: 0 };
    case 'S': return { dx: 0, dy: 1 };
    case 'W': return { dx: -1, dy: 0 };
  }
}

export function getOppositeDirection(dir: CardinalDirection): CardinalDirection {
  switch (dir) {
    case 'N': return 'S';
    case 'E': return 'W';
    case 'S': return 'N';
    case 'W': return 'E';
  }
}

export function turnRight(dir: CardinalDirection): CardinalDirection {
  switch (dir) {
    case 'N': return 'E';
    case 'E': return 'S';
    case 'S': return 'W';
    case 'W': return 'N';
  }
}

export function turnLeft(dir: CardinalDirection): CardinalDirection {
  switch (dir) {
    case 'N': return 'W';
    case 'E': return 'N';
    case 'S': return 'E';
    case 'W': return 'S';
  }
}

export function rotateClockwise(dir: CardinalDirection): CardinalDirection {
  return turnRight(dir);
}

// Initial State Generator
export function getInitialGameState(): GameState {
  const sectors = JSON.parse(JSON.stringify(INITIAL_SECTORS)) as Record<string, SectorData>;
  const starterPreset = PRESET_FACTORIES[0];
  
  // Apply starter preset to sector A
  starterPreset.tiles.forEach((t) => {
    if (t.x !== undefined && t.y !== undefined && sectors.sector_a.grid[t.y]?.[t.x]) {
      sectors.sector_a.grid[t.y][t.x] = {
        ...sectors.sector_a.grid[t.y][t.x],
        ...t,
        type: t.type || 'conveyor',
        direction: t.direction || 'E',
        isEnabled: t.isEnabled ?? true,
        tier: 1,
        cycleProgress: 0,
      } as GridTile;
    }
  });

  return {
    tick: 0,
    funds: 350,
    researchPoints: 0,
    reputation: 80,
    
    cashflowRate: 0,
    grossIncomeRate: 0,
    operatingCostRate: 0,
    researchRate: 0,
    powerCapacity: 25,
    powerConsumed: 5,
    powerRatio: 1.0,
    
    activeSectorId: 'sector_a',
    sectors,
    
    gridWidth: sectors.sector_a.gridWidth,
    gridHeight: sectors.sector_a.gridHeight,
    grid: sectors.sector_a.grid,
    items: sectors.sector_a.items,
    
    hopperStock: {
      chassis: 20,
      barrel: 0,
      magazine: 20,
      stock: 0,
      optic: 0,
    },
    
    shelfStock: {
      pistol: 0,
      shotgun: 0,
      rifle: 0,
      smg: 0,
      dmr: 0,
    },
    shelfCapacity: 5,
    
    activeCustomers: [
      {
        id: 'cust_init_1',
        customerName: 'Officer Miller',
        customerRole: 'Metro Patrol Chief',
        weaponId: 'pistol',
        quantity: 1,
        maxPatienceTicks: 120,
        remainingPatienceTicks: 120,
        bonusMultiplier: 1.0,
        avatarBg: '#0284c7',
      },
    ],
    nextCustomerSpawnInTicks: 60,
    
    upgrades: JSON.parse(JSON.stringify(TECH_UPGRADES)),
    
    tickRateMs: 400,
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
      totalRPProduced: 0,
      directSalesCount: 0,
      currentEfficiency: 100,
    },
    recentLogs: [
      {
        id: 'log_0',
        text: 'Factory Idle automation online. Sector α initialized.',
        type: 'info',
        tick: 0,
      },
    ],
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_RUNNING':
      return { ...state, isRunning: action.isRunning };

    case 'SET_SPEED':
      return { ...state, speed: action.speed };

    case 'TOGGLE_SOUND':
      return { ...state, soundEnabled: !state.soundEnabled };

    case 'SWITCH_SECTOR': {
      const targetSector = state.sectors[action.sectorId];
      if (!targetSector || !targetSector.unlocked) return state;
      
      // Save current active sector grid/items
      const updatedSectors = {
        ...state.sectors,
        [state.activeSectorId]: {
          ...state.sectors[state.activeSectorId],
          grid: state.grid,
          items: state.items,
        },
      };

      return {
        ...state,
        activeSectorId: action.sectorId,
        sectors: updatedSectors,
        gridWidth: targetSector.gridWidth,
        gridHeight: targetSector.gridHeight,
        grid: targetSector.grid,
        items: targetSector.items,
      };
    }

    case 'UNLOCK_SECTOR': {
      const sector = state.sectors[action.sectorId];
      if (!sector || sector.unlocked || state.funds < sector.unlockCost) return state;

      const updatedSectors = {
        ...state.sectors,
        [action.sectorId]: {
          ...sector,
          unlocked: true,
        },
      };

      return {
        ...state,
        funds: state.funds - sector.unlockCost,
        sectors: updatedSectors,
        recentLogs: [
          {
            id: `log_unlock_${Date.now()}`,
            text: `Unlocked ${sector.name} for $${sector.unlockCost}!`,
            type: 'info',
            tick: state.tick,
          },
          ...state.recentLogs.slice(0, 19),
        ],
      };
    }

    case 'PLACE_TILE': {
      const { x, y, tileType, direction, spawnerPart, filterPart } = action;
      if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) return state;
      
      const bDef = BUILDING_DEFS[tileType];
      if (state.funds < bDef.cost) return state;

      const newGrid = state.grid.map((row, rY) =>
        row.map((tile, rX) => {
          if (rX === x && rY === y) {
            return {
              ...tile,
              type: tileType,
              direction,
              isEnabled: true,
              tier: 1,
              cycleProgress: 0,
              spawnerPart: tileType === 'spawner' ? (spawnerPart || tile.spawnerPart || 'chassis') : undefined,
              filterPart: tileType === 'filter' ? (filterPart || tile.filterPart || 'chassis') : undefined,
              fitterTargetRecipe: tileType === 'fitter' ? (tile.fitterTargetRecipe || 'pistol') : undefined,
              fitterBuffer: tileType === 'fitter' ? [] : undefined,
              splitterState: 0,
              switchState: 0,
              switchDirection: turnRight(direction),
              totalPassed: 0,
              totalAssembled: 0,
              totalPacked: 0,
              totalSold: 0,
              lastStatus: 'ok',
            } as GridTile;
          }
          return tile;
        })
      );

      return {
        ...state,
        funds: state.funds - bDef.cost,
        grid: newGrid,
      };
    }

    case 'DRAG_PLACE_CONVEYOR': {
      const { prevX, prevY, nextX, nextY, direction: dragDir } = action;
      if (nextX < 0 || nextX >= state.gridWidth || nextY < 0 || nextY >= state.gridHeight) return state;

      const conveyorDef = BUILDING_DEFS['conveyor'];
      let funds = state.funds;

      const newGrid = state.grid.map((row, rY) =>
        row.map((tile, rX) => {
          // Update previous tile orientation towards current drag tile
          if (rX === prevX && rY === prevY) {
            if (tile.type === 'conveyor' || tile.type === 'empty') {
              return {
                ...tile,
                type: 'conveyor' as TileType,
                direction: dragDir,
                isEnabled: true,
              };
            }
          }
          // Place/update next tile
          if (rX === nextX && rY === nextY) {
            if (tile.type === 'empty') {
              if (funds >= conveyorDef.cost) {
                funds -= conveyorDef.cost;
                return {
                  ...tile,
                  type: 'conveyor' as TileType,
                  direction: dragDir,
                  isEnabled: true,
                  tier: 1 as 1 | 2 | 3,
                  cycleProgress: 0,
                };
              }
            } else if (tile.type === 'conveyor') {
              return {
                ...tile,
                direction: dragDir,
              };
            }
          }
          return tile;
        })
      );

      const updatedSectors = {
        ...state.sectors,
        [state.activeSectorId]: {
          ...state.sectors[state.activeSectorId],
          grid: newGrid,
        },
      };

      return {
        ...state,
        funds,
        grid: newGrid,
        sectors: updatedSectors,
      };
    }

    case 'CLEAR_TILE': {
      const { x, y } = action;
      if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) return state;

      const newGrid = state.grid.map((row, rY) =>
        row.map((tile, rX) => {
          if (rX === x && rY === y) {
            return {
              x,
              y,
              type: 'empty' as TileType,
              direction: 'E' as CardinalDirection,
              isEnabled: true,
              tier: 1 as 1 | 2 | 3,
            } as GridTile;
          }
          return tile;
        })
      );

      // Remove items on this tile
      const newItems = state.items.filter(item => item.x !== x || item.y !== y);

      return {
        ...state,
        grid: newGrid,
        items: newItems,
      };
    }

    case 'ROTATE_TILE':
    case 'CYCLE_TILE_DIRECTION': {
      const { x, y } = action;
      if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) return state;
      const current = state.grid[y][x];
      if (current.type === 'empty') return state;

      const newDirection = rotateClockwise(current.direction);
      const newGrid = state.grid.map((row, rY) =>
        row.map((tile, rX) => {
          if (rX === x && rY === y) {
            return {
              ...tile,
              direction: newDirection,
              switchDirection: turnRight(newDirection),
            };
          }
          return tile;
        })
      );

      return { ...state, grid: newGrid };
    }

    case 'TOGGLE_TILE_ENABLED':
    case 'TOGGLE_TILE_POWER': {
      const { x, y } = action;
      if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) return state;
      const current = state.grid[y][x];
      if (current.type === 'empty') return state;

      const newEnabled = current.isEnabled === false ? true : false;
      const newGrid = state.grid.map((row, rY) =>
        row.map((tile, rX) => {
          if (rX === x && rY === y) {
            return {
              ...tile,
              isEnabled: newEnabled,
            };
          }
          return tile;
        })
      );

      const statusText = newEnabled ? 'Active (ON)' : 'Paused (OFF)';
      return { 
        ...state, 
        grid: newGrid,
        recentLogs: [
          {
            id: `toggle_${state.tick}_${x}_${y}_${Date.now()}`,
            text: `${current.type.toUpperCase()} [${x},${y}] ${statusText}`,
            type: 'info',
            tick: state.tick,
          },
          ...state.recentLogs.slice(0, 19),
        ],
      };
    }

    case 'UPGRADE_TILE_TIER': {
      const { x, y } = action;
      if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) return state;
      const current = state.grid[y][x];
      if (current.type === 'empty') return state;
      
      const nextTier = (current.tier === 1 ? 2 : current.tier === 2 ? 3 : 3) as 1 | 2 | 3;
      if (nextTier === current.tier) return state;

      const upgradeCost = nextTier === 2 ? 60 : 150;
      if (state.funds < upgradeCost) return state;

      const newGrid = state.grid.map((row, rY) =>
        row.map((tile, rX) => {
          if (rX === x && rY === y) {
            return {
              ...tile,
              tier: nextTier,
            };
          }
          return tile;
        })
      );

      return {
        ...state,
        funds: state.funds - upgradeCost,
        grid: newGrid,
        recentLogs: [
          {
            id: `upg_${Date.now()}`,
            text: `Upgraded ${current.type.toUpperCase()} to Mk${nextTier}!`,
            type: 'info',
            tick: state.tick,
          },
          ...state.recentLogs.slice(0, 19),
        ],
      };
    }

    case 'SET_SPAWNER_PART': {
      const { x, y, partId } = action;
      if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) return state;

      const newGrid = state.grid.map((row, rY) =>
        row.map((tile, rX) => {
          if (rX === x && rY === y && tile.type === 'spawner') {
            return { ...tile, spawnerPart: partId };
          }
          return tile;
        })
      );

      return { ...state, grid: newGrid };
    }

    case 'TOGGLE_SPAWNER_AUTOBUY': {
      const { x, y } = action;
      if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) return state;

      const newGrid = state.grid.map((row, rY) =>
        row.map((tile, rX) => {
          if (rX === x && rY === y && tile.type === 'spawner') {
            return { ...tile, spawnerAutoBuy: !tile.spawnerAutoBuy };
          }
          return tile;
        })
      );

      return { ...state, grid: newGrid };
    }

    case 'SET_FITTER_TARGET': {
      const { x, y, recipeId } = action;
      if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) return state;

      const newGrid = state.grid.map((row, rY) =>
        row.map((tile, rX) => {
          if (rX === x && rY === y && tile.type === 'fitter') {
            return { ...tile, fitterTargetRecipe: recipeId, cycleProgress: 0 };
          }
          return tile;
        })
      );

      return { ...state, grid: newGrid };
    }

    case 'SET_FILTER_PART': {
      const { x, y, part } = action;
      if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) return state;

      const newGrid = state.grid.map((row, rY) =>
        row.map((tile, rX) => {
          if (rX === x && rY === y && tile.type === 'filter') {
            return { ...tile, filterPart: part };
          }
          return tile;
        })
      );

      return { ...state, grid: newGrid };
    }

    case 'TOGGLE_SWITCH_TILE': {
      const { x, y } = action;
      if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) return state;

      const newGrid = state.grid.map((row, rY) =>
        row.map((tile, rX) => {
          if (rX === x && rY === y && tile.type === 'switch') {
            const newState = (tile.switchState === 0 ? 1 : 0) as 0 | 1;
            return { ...tile, switchState: newState } as GridTile;
          }
          return tile;
        })
      );

      return { ...state, grid: newGrid };
    }

    case 'BUY_PART': {
      const { partId, quantity } = action;
      const part = RAW_PARTS[partId];
      if (!part) return state;
      const cost = part.cost * quantity;
      if (state.funds < cost) return state;

      return {
        ...state,
        funds: state.funds - cost,
        hopperStock: {
          ...state.hopperStock,
          [partId]: (state.hopperStock[partId] || 0) + quantity,
        },
      };
    }

    case 'BUY_UPGRADE': {
      const { upgradeId } = action;
      const upgrade = state.upgrades.find(u => u.id === upgradeId);
      if (!upgrade || upgrade.purchased) return state;

      if (state.funds < upgrade.cost || state.researchPoints < upgrade.rpCost) return state;

      const updatedUpgrades = state.upgrades.map(u =>
        u.id === upgradeId ? { ...u, purchased: true } : u
      );

      let newShelfCap = state.shelfCapacity;
      if (upgradeId === 'tech_expanded_shelf') {
        newShelfCap = 10;
      }

      return {
        ...state,
        funds: state.funds - upgrade.cost,
        researchPoints: state.researchPoints - upgrade.rpCost,
        upgrades: updatedUpgrades,
        shelfCapacity: newShelfCap,
        recentLogs: [
          {
            id: `tech_${Date.now()}`,
            text: `RESEARCH UNLOCKED: ${upgrade.name}`,
            type: 'research',
            tick: state.tick,
          },
          ...state.recentLogs.slice(0, 19),
        ],
      };
    }

    case 'LOAD_PRESET': {
      const preset = PRESET_FACTORIES.find(p => p.id === action.presetId);
      if (!preset) return state;

      const newGrid: GridTile[][] = Array.from({ length: state.gridHeight }, (_, y) =>
        Array.from({ length: state.gridWidth }, (_, x) => ({
          x,
          y,
          type: 'empty' as TileType,
          direction: 'E' as CardinalDirection,
          isEnabled: true,
          tier: 1,
        }))
      );

      preset.tiles.forEach(t => {
        if (t.x !== undefined && t.y !== undefined && newGrid[t.y]?.[t.x]) {
          newGrid[t.y][t.x] = {
            ...newGrid[t.y][t.x],
            ...t,
            type: t.type || 'conveyor',
            direction: t.direction || 'E',
            isEnabled: t.isEnabled ?? true,
            tier: 1,
            cycleProgress: 0,
          } as GridTile;
        }
      });

      return {
        ...state,
        grid: newGrid,
        items: [],
      };
    }

    case 'CLEAR_ALL_TILES': {
      const newGrid: GridTile[][] = Array.from({ length: state.gridHeight }, (_, y) =>
        Array.from({ length: state.gridWidth }, (_, x) => ({
          x,
          y,
          type: 'empty' as TileType,
          direction: 'E' as CardinalDirection,
          isEnabled: true,
          tier: 1,
        }))
      );

      return {
        ...state,
        grid: newGrid,
        items: [],
      };
    }

    case 'TICK': {
      const tick = state.tick + 1;
      let funds = state.funds;
      let researchPoints = state.researchPoints;
      let reputation = state.reputation;
      const logs = [...state.recentLogs];
      const metrics = { ...state.metrics };
      const hopperStock = { ...state.hopperStock };
      const shelfStock = { ...state.shelfStock };

      // Multipliers from upgrades
      const isPowerMk2 = state.upgrades.some(u => u.id === 'tech_power_mk2' && u.purchased);
      const isFastBelts = state.upgrades.some(u => u.id === 'tech_fast_belts' && u.purchased);

      // --- STEP 1: CALCULATE POWER GRID & MAINTENANCE ---
      let totalPowerGen = 0;
      let totalPowerUsage = 0;
      let operatingCosts = 0;

      // Scan all tiles for power and running costs
      state.grid.forEach(row => {
        row.forEach(tile => {
          if (tile.type === 'empty') return;
          const bDef = BUILDING_DEFS[tile.type];
          if (tile.type === 'power_gen' && tile.isEnabled !== false) {
            totalPowerGen += isPowerMk2 ? 50 : 25;
          }
          if (tile.isEnabled !== false) {
            totalPowerUsage += bDef.powerUsage * (tile.tier || 1);
            operatingCosts += bDef.operatingCost;
          }
        });
      });

      const powerRatio = totalPowerGen === 0 && totalPowerUsage > 0 
        ? 0.3 
        : totalPowerGen >= totalPowerUsage 
        ? 1.0 
        : Math.max(0.2, totalPowerGen / totalPowerUsage);

      // Deduct operating costs every 5 ticks
      if (tick % 5 === 0 && operatingCosts > 0) {
        funds = Math.max(0, funds - operatingCosts);
        metrics.totalExpenses += operatingCosts;
      }

      // --- STEP 2: RESEARCH LABS (RP GENERATION) ---
      let rpThisTick = 0;
      state.grid.forEach(row => {
        row.forEach(tile => {
          if (tile.type === 'lab' && tile.isEnabled !== false) {
            const labOutput = 0.5 * (tile.tier || 1) * powerRatio;
            rpThisTick += labOutput;
          }
        });
      });

      researchPoints += rpThisTick;
      metrics.totalRPProduced += rpThisTick;

      // --- STEP 3: SPAWNERS / BUYERS ---
      let currentGrid = state.grid.map(row => row.map(tile => ({ ...tile })));
      let currentItems = [...state.items];

      currentGrid.forEach(row => {
        row.forEach(tile => {
          if (tile.type === 'spawner' && tile.isEnabled !== false && tile.spawnerPart) {
            const partId = tile.spawnerPart;
            const partDef = RAW_PARTS[partId];
            
            // Auto buy if empty and enabled
            if (hopperStock[partId] <= 0 && tile.spawnerAutoBuy && funds >= partDef.cost) {
              funds -= partDef.cost;
              hopperStock[partId] += 1;
              metrics.totalExpenses += partDef.cost;
            }

            if (hopperStock[partId] > 0) {
              const hasItemAtOrigin = currentItems.some(i => i.x === tile.x && i.y === tile.y && i.progress < 0.5);
              if (!hasItemAtOrigin) {
                hopperStock[partId] -= 1;
                metrics.totalPartsUsed += 1;
                currentItems.push({
                  id: `part_${partId}_${tick}_${Math.random().toString(36).substr(2, 4)}`,
                  kind: 'part',
                  itemId: partId,
                  x: tile.x,
                  y: tile.y,
                  progress: 0,
                  createdTick: tick,
                  sourceDirection: tile.direction,
                });
                tile.totalPassed = (tile.totalPassed || 0) + 1;
                tile.lastStatus = 'ok';
              } else {
                tile.lastStatus = 'jammed';
              }
            } else {
              tile.lastStatus = 'starved';
            }
          }
        });
      });

      // --- STEP 4: MOVE ITEMS & RESOLVE LOGISTICS ---
      const nextItems: ItemPacket[] = [];
      let soundPlayedThisTick = false;

      for (const item of currentItems) {
        const curX = item.x;
        const curY = item.y;
        const tile = currentGrid[curY]?.[curX];

        if (!tile || tile.type === 'empty') {
          // Off grid or empty lot
          continue;
        }

        // Trash / Recycler
        if (tile.type === 'trash') {
          const scrapVal = item.kind === 'part' ? Math.ceil(RAW_PARTS[item.itemId as RawPartId].cost * 0.5) : 10;
          funds += scrapVal;
          continue;
        }

        // Direct Seller Port (Factory Idle continuous market export)
        if (tile.type === 'seller' && tile.isEnabled !== false) {
          let saleVal = 0;
          if (item.kind === 'weapon') {
            const recipe = WEAPON_RECIPES[item.itemId as WeaponId];
            saleVal = Math.round(recipe.salePrice * 1.15); // 15% continuous direct export margin
            metrics.totalWeaponsCrafted += 1;
          } else {
            saleVal = RAW_PARTS[item.itemId as RawPartId].cost;
          }

          funds += saleVal;
          metrics.totalRevenue += saleVal;
          metrics.directSalesCount = (metrics.directSalesCount || 0) + 1;
          tile.totalSold = (tile.totalSold || 0) + 1;

          if (state.soundEnabled && !soundPlayedThisTick) {
            playCashSale(true);
            soundPlayedThisTick = true;
          }

          logs.unshift({
            id: `sell_${tick}_${Date.now()}`,
            text: `Exported ${item.itemId.toUpperCase()} via Direct Port (+${saleVal}$)`,
            type: 'sale',
            tick,
          });
          continue;
        }

        // Storefront Packer
        if (tile.type === 'packer' && tile.isEnabled !== false) {
          if (item.kind === 'weapon') {
            const wId = item.itemId as WeaponId;
            if ((shelfStock[wId] || 0) < state.shelfCapacity) {
              shelfStock[wId] = (shelfStock[wId] || 0) + 1;
              tile.totalPacked = (tile.totalPacked || 0) + 1;
              metrics.totalWeaponsCrafted += 1;
              if (state.soundEnabled && !soundPlayedThisTick) {
                playAssemblyComplete(true);
                soundPlayedThisTick = true;
              }
              logs.unshift({
                id: `pack_${tick}_${Date.now()}`,
                text: `Packed ${WEAPON_RECIPES[wId].name} onto Storefront Shelf.`,
                type: 'craft',
                tick,
              });
              continue;
            } else {
              tile.lastStatus = 'jammed';
            }
          }
        }

        // Assembly Fitter - Buffer Intake
        if (tile.type === 'fitter' && tile.isEnabled !== false) {
          if (item.kind === 'part') {
            const partId = item.itemId as RawPartId;
            tile.fitterBuffer = tile.fitterBuffer || [];
            if (tile.fitterBuffer.length < 12) {
              tile.fitterBuffer.push(partId);
            }
            continue; // Part absorbed into machine staging
          }
        }

        // Underground Tunnel Entry
        if (tile.type === 'underground_entry' && tile.isEnabled !== false) {
          // Find matching exit in tile.direction (1 to 4 tiles away)
          const offset = getDirectionOffset(tile.direction);
          let targetX = curX;
          let targetY = curY;
          let foundExit = false;

          for (let dist = 1; dist <= 4; dist++) {
            const checkX = curX + offset.dx * dist;
            const checkY = curY + offset.dy * dist;
            const checkTile = currentGrid[checkY]?.[checkX];
            if (checkTile && checkTile.type === 'underground_exit' && checkTile.direction === tile.direction) {
              targetX = checkX;
              targetY = checkY;
              foundExit = true;
              break;
            }
          }

          if (foundExit) {
            nextItems.push({
              ...item,
              x: targetX,
              y: targetY,
              progress: 0,
              sourceDirection: tile.direction,
            });
            continue;
          }
        }

        // Determine destination direction based on tile logic
        let outDir: CardinalDirection = tile.direction;

        // Belt Splitter (Round-Robin with Auto-Balancer Bypass to prevent deadlocks)
        if (tile.type === 'splitter' && tile.isEnabled !== false) {
          const splitState = tile.splitterState || 0;
          const candidateDirections: CardinalDirection[] = [
            tile.direction,
            turnRight(tile.direction),
            turnLeft(tile.direction),
          ];

          // Rotate candidates by current split state
          const orderedCandidates = [
            candidateDirections[splitState % 3],
            candidateDirections[(splitState + 1) % 3],
            candidateDirections[(splitState + 2) % 3],
          ];

          let chosenDir = orderedCandidates[0];
          for (const cand of orderedCandidates) {
            const testOffset = getDirectionOffset(cand);
            const tx = curX + testOffset.dx;
            const ty = curY + testOffset.dy;
            if (tx >= 0 && tx < state.gridWidth && ty >= 0 && ty < state.gridHeight) {
              const destTile = currentGrid[ty]?.[tx];
              if (destTile && destTile.type !== 'empty') {
                chosenDir = cand;
                break;
              }
            }
          }

          outDir = chosenDir;
          tile.splitterState = (splitState + 1) % 3;
        }

        // Filter / Sorter Gate
        if (tile.type === 'filter' && tile.isEnabled !== false) {
          if (tile.filterPart && item.itemId === tile.filterPart) {
            outDir = tile.direction; // Match -> Forward
          } else {
            outDir = turnRight(tile.direction); // Non-match -> Right Deflect
          }
        }

        // Switch Conveyor
        if (tile.type === 'switch' && tile.isEnabled !== false) {
          outDir = tile.switchState === 1 ? (tile.switchDirection || turnRight(tile.direction)) : tile.direction;
        }

        // Conveyor Crossing (Bridge - preserves straight trajectory)
        if (tile.type === 'crossing') {
          outDir = item.sourceDirection || tile.direction;
        }

        const offset = getDirectionOffset(outDir);
        const nextX = curX + offset.dx;
        const nextY = curY + offset.dy;

        // Check boundary
        if (nextX < 0 || nextX >= state.gridWidth || nextY < 0 || nextY >= state.gridHeight) {
          continue; // Item falls off edge
        }

        const nextTile = currentGrid[nextY]?.[nextX];
        if (nextTile && nextTile.type !== 'empty') {
          nextItems.push({
            ...item,
            x: nextX,
            y: nextY,
            progress: 0,
            sourceDirection: outDir,
          });
          tile.totalPassed = (tile.totalPassed || 0) + 1;
        } else {
          // Blocked / fallen
        }
      }

      // --- STEP 4.5: FITTER CRAFTING CYCLES & OUTPUT EMISSION ---
      currentGrid.forEach((row) => {
        row.forEach((tile) => {
          if (tile.type === 'fitter') {
            if (tile.isEnabled === false) {
              tile.lastStatus = 'disabled';
              tile.cycleProgress = 0;
              return;
            }

            const targetRecipeId = tile.fitterTargetRecipe || 'pistol';
            const recipe = WEAPON_RECIPES[targetRecipeId];
            tile.fitterBuffer = tile.fitterBuffer || [];

            // Case A: Machine is currently crafting
            if ((tile.cycleProgress || 0) > 0) {
              const speedMult = (tile.tier || 1) * powerRatio;
              const cycleInc = (1 / Math.max(1, recipe.craftTimeTicks)) * speedMult;
              tile.cycleProgress = Math.min(1.0, (tile.cycleProgress || 0) + cycleInc);
              tile.lastStatus = powerRatio < 0.75 ? 'no_power' : 'ok';

              if (tile.cycleProgress >= 1.0) {
                // Check if destination or current tile is clear to emit finished weapon
                const hasItemAtFitter = nextItems.some(i => i.x === tile.x && i.y === tile.y && i.progress < 0.5);
                if (!hasItemAtFitter) {
                  nextItems.push({
                    id: `weapon_${targetRecipeId}_${tick}_${Math.random().toString(36).substr(2, 4)}`,
                    kind: 'weapon',
                    itemId: targetRecipeId,
                    x: tile.x,
                    y: tile.y,
                    progress: 0,
                    createdTick: tick,
                    sourceDirection: tile.direction,
                  });

                  tile.cycleProgress = 0;
                  tile.totalAssembled = (tile.totalAssembled || 0) + 1;
                  tile.lastStatus = 'ok';

                  if (state.soundEnabled && !soundPlayedThisTick) {
                    playAssemblyComplete(true);
                    soundPlayedThisTick = true;
                  }

                  logs.unshift({
                    id: `assembled_${tick}_${Date.now()}`,
                    text: `Crafted ${recipe.name} (Mk${tile.tier || 1})`,
                    type: 'craft',
                    tick,
                  });
                } else {
                  tile.lastStatus = 'jammed';
                }
              }
              return;
            }

            // Case B: Machine is idle, check if buffer contains required parts
            const bufferCounts: Record<RawPartId, number> = {
              chassis: 0, barrel: 0, magazine: 0, stock: 0, optic: 0,
            };
            tile.fitterBuffer.forEach(p => { bufferCounts[p] = (bufferCounts[p] || 0) + 1; });

            let canCraft = true;
            for (const [reqPart, reqCount] of Object.entries(recipe.requiredParts)) {
              if (bufferCounts[reqPart as RawPartId] < reqCount) {
                canCraft = false;
                break;
              }
            }

            if (canCraft) {
              // Consume required parts from buffer
              for (const [reqPart, reqCount] of Object.entries(recipe.requiredParts)) {
                let toRemove = reqCount;
                tile.fitterBuffer = tile.fitterBuffer.filter(p => {
                  if (p === reqPart && toRemove > 0) {
                    toRemove--;
                    return false;
                  }
                  return true;
                });
              }

              // Initiate crafting progress
              const speedMult = (tile.tier || 1) * powerRatio;
              const cycleInc = (1 / Math.max(1, recipe.craftTimeTicks)) * speedMult;
              tile.cycleProgress = Math.min(1.0, cycleInc);
              tile.lastStatus = powerRatio < 0.75 ? 'no_power' : 'ok';
            } else {
              tile.lastStatus = tile.fitterBuffer.length > 0 ? 'starved' : 'idle';
              tile.cycleProgress = 0;
            }
          }
        });
      });

      // --- STEP 5: STOREFRONT CUSTOMER FULFILLMENT & SPAWN ---
      let nextCustomerSpawn = state.nextCustomerSpawnInTicks - 1;
      let activeCustomers: CustomerOrder[] = [];

      for (const cust of state.activeCustomers) {
        let remainingPatience = cust.remainingPatienceTicks - 1;
        const recipe = WEAPON_RECIPES[cust.weaponId];

        // Check if customer can be fulfilled
        if (shelfStock[cust.weaponId] >= cust.quantity) {
          shelfStock[cust.weaponId] -= cust.quantity;
          const isSpeedy = cust.remainingPatienceTicks > (cust.maxPatienceTicks * 0.5);
          const speedBonus = isSpeedy ? 1.15 : 1.0;
          const revenue = Math.round(recipe.salePrice * cust.quantity * cust.bonusMultiplier * speedBonus);
          funds += revenue;
          reputation = Math.min(100, reputation + 3);
          metrics.fulfilledOrders += 1;
          metrics.totalRevenue += revenue;

          if (state.soundEnabled && !soundPlayedThisTick) {
            playCashSale(true);
            soundPlayedThisTick = true;
          }

          logs.unshift({
            id: `sale_${tick}_${cust.id}`,
            text: `VIP ORDER: ${cust.customerName} bought ${cust.quantity}x ${recipe.name} (+$${revenue}${isSpeedy ? ' incl. Speed Tip' : ''})`,
            type: 'sale',
            tick,
          });
          continue; // Order fulfilled
        }

        // Check if customer patience ran out
        if (remainingPatience <= 0) {
          reputation = Math.max(0, reputation - 4);
          metrics.missedSalesCount += 1;

          if (state.soundEnabled) {
            playMissedSale(true);
          }

          logs.unshift({
            id: `miss_${tick}_${cust.id}`,
            text: `ORDER EXPIRED: ${cust.customerName} walked out unsatisfied (-4% Rep)`,
            type: 'miss',
            tick,
          });
          continue; // Customer leaves
        }

        activeCustomers.push({
          ...cust,
          remainingPatienceTicks: remainingPatience,
        });
      }

      // Spawn new customer if timer expired
      if (nextCustomerSpawn <= 0) {
        if (activeCustomers.length < 4) {
          const isScattershotUnlocked = state.upgrades.some(u => u.id === 'tech_scattershot' && u.purchased);
          const isRifleUnlocked = state.upgrades.some(u => u.id === 'tech_rifle_license' && u.purchased);
          const isSpecOpsUnlocked = state.upgrades.some(u => u.id === 'tech_specops' && u.purchased);
          const isPrecisionUnlocked = state.upgrades.some(u => u.id === 'tech_precision' && u.purchased);

          const availableWeapons: WeaponId[] = ['pistol'];
          if (isScattershotUnlocked) availableWeapons.push('shotgun');
          if (isRifleUnlocked) availableWeapons.push('rifle');
          if (isSpecOpsUnlocked) availableWeapons.push('smg');
          if (isPrecisionUnlocked) availableWeapons.push('dmr');

          const chosenWeapon = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
          const names = ['Captain Vargas', 'Agent Vance', 'Sheriff Thorne', 'Commander Hayes', 'Operative Cruz', 'Marshal Stone', 'Major Sterling', 'Director Novak'];
          const roles = ['Tactical SWAT Unit', 'Federal Task Force', 'County Constabulary', 'Private Security Detail', 'Special Recon Group', 'High-Risk Armored Escort'];
          const avatarColors = ['#0284c7', '#0f766e', '#7c3aed', '#d97706', '#be123c', '#4338ca'];

          // High-tier weapons and reputation boost bonus multiplier (1.5x to 2.2x)
          const repBonus = 1.0 + (reputation / 200);
          const tierBonus = chosenWeapon === 'dmr' ? 1.8 : chosenWeapon === 'smg' ? 1.6 : chosenWeapon === 'rifle' ? 1.5 : 1.4;
          const finalBonus = Number((tierBonus * repBonus).toFixed(2));

          const orderQty = (chosenWeapon === 'pistol' && Math.random() > 0.6) ? 2 : 1;

          activeCustomers.push({
            id: `cust_${tick}_${Math.random().toString(36).substr(2, 4)}`,
            customerName: names[Math.floor(Math.random() * names.length)],
            customerRole: roles[Math.floor(Math.random() * roles.length)],
            weaponId: chosenWeapon,
            quantity: orderQty,
            maxPatienceTicks: 150,
            remainingPatienceTicks: 150,
            bonusMultiplier: finalBonus,
            avatarBg: avatarColors[Math.floor(Math.random() * avatarColors.length)],
          });
        }
        nextCustomerSpawn = 45 + Math.floor(Math.random() * 35);
      }

      // Update Efficiency KPI
      const totalDemanded = metrics.fulfilledOrders + metrics.missedSalesCount;
      metrics.currentEfficiency = totalDemanded > 0 ? Math.round((metrics.fulfilledOrders / totalDemanded) * 100) : 100;
      metrics.netProfit = metrics.totalRevenue - metrics.totalExpenses;

      // Live Rates
      const cashflowRate = Math.round((metrics.totalRevenue - metrics.totalExpenses) / Math.max(1, tick * 0.4));
      const researchRate = Number((rpThisTick * 2.5).toFixed(1));

      // Save updated active sector data
      const updatedSectors = {
        ...state.sectors,
        [state.activeSectorId]: {
          ...state.sectors[state.activeSectorId],
          grid: currentGrid,
          items: nextItems,
        },
      };

      return {
        ...state,
        tick,
        funds,
        researchPoints,
        reputation,
        cashflowRate,
        grossIncomeRate: Math.round(metrics.totalRevenue / Math.max(1, tick * 0.4)),
        operatingCostRate: Math.round(operatingCosts * 2.5),
        researchRate,
        powerCapacity: totalPowerGen,
        powerConsumed: Math.round(totalPowerUsage),
        powerRatio,
        sectors: updatedSectors,
        grid: currentGrid,
        items: nextItems,
        hopperStock,
        shelfStock,
        activeCustomers,
        nextCustomerSpawnInTicks: nextCustomerSpawn,
        metrics,
        recentLogs: logs.slice(0, 25),
      };
    }

    default:
      return state;
  }
}
