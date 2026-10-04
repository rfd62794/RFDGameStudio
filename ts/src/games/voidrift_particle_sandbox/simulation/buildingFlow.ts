import {
  BuildingCategory,
  BuildingInstance,
  MaterialType,
  ProcessorType,
} from '../types';
import { BUILDING_TILE, getMaterialState } from './buildingDefs';
import { CellularGrid, GRID_WIDTH } from './grid';
import { findFacingSocket, getSocketCAPosition, spillMaterialToGrid } from './buildingOps';
import { TILES_X, TILES_Y } from './routing';
import type { BuildingManager } from './buildingManager';

export function updateCollectors(mgr: BuildingManager, grid: CellularGrid) {
  for (const b of mgr.buildings) {
    if (b.category !== BuildingCategory.COLLECTOR) continue;

    let currentTotal = 0;
    for (const val of Object.values(b.buffer)) currentTotal += val;
    if (currentTotal >= b.capacity) continue;

    // Check all CA cells directly inside collector bounding box or 1 CA cell above it
    const startX = b.x;
    const endX = b.x + b.width;
    const startY = Math.max(0, b.y - 1);
    const endY = b.y + b.height;

    for (let cy = startY; cy < endY; cy++) {
      for (let cx = startX; cx < endX; cx++) {
        if (!grid.isInBounds(cx, cy)) continue;

        const cIdx = cy * GRID_WIDTH + cx;
        const mat = grid.materials[cIdx];
        if (mat === MaterialType.VACUUM) continue;

        // Check if accepted by collector definition
        let isAccepted = false;
        if (b.universal) {
          isAccepted = mat !== MaterialType.SOLID && mat !== MaterialType.STRUCTURAL_SOLID;
        } else if (b.targetMaterial === mat) {
          isAccepted = true;
        }

        // Check building filter for output socket
        if (isAccepted && b.sockets.length > 0) {
          const outSocket = b.sockets[0];
          const allowedSet = b.filter.allowed[outSocket.id];
          if (allowedSet && !allowedSet.has(mat)) {
            // Denied: let material flow freely without intercepting
            continue;
          }
        }

        if (isAccepted && currentTotal < b.capacity) {
          b.buffer[mat] = (b.buffer[mat] || 0) + 1;
          currentTotal++;
          grid.setCell(cx, cy, MaterialType.VACUUM, 0);
        }
      }
    }
  }
}

export function updateBuildingOutputs(mgr: BuildingManager) {
  // Feed from output sockets into connected pipes or adjacent containers
  for (const b of mgr.buildings) {
    if (b.category !== BuildingCategory.COLLECTOR && b.category !== BuildingCategory.CONTAINER) {
      continue;
    }

    for (const socket of b.sockets) {
      if (socket.kind !== 'output') continue;

      // Determine destination tile for this output socket
      let targetTx = b.tileX;
      let targetTy = b.tileY;
      if (socket.side === 'bottom') {
        targetTx = b.tileX + Math.floor(socket.dtx);
        targetTy = b.tileY + b.tileH;
      } else if (socket.side === 'top') {
        targetTx = b.tileX + Math.floor(socket.dtx);
        targetTy = b.tileY - 1;
      } else if (socket.side === 'left') {
        targetTx = b.tileX - 1;
        targetTy = b.tileY + Math.floor(socket.dty);
      } else if (socket.side === 'right') {
        targetTx = b.tileX + b.tileW;
        targetTy = b.tileY + Math.floor(socket.dty);
      }

      if (targetTx < 0 || targetTx >= TILES_X || targetTy < 0 || targetTy >= TILES_Y) continue;

      const pipe = mgr.getPipeAtTile(targetTx, targetTy);
      if (!pipe) continue;

      // Push available buffered material to pipe
      for (const [matStr, amt] of Object.entries(b.buffer)) {
        const mat = Number(matStr) as MaterialType;
        if (amt <= 0) continue;

        // Check if filter allows this material out
        const allowed = b.filter.allowed[socket.id];
        if (allowed && !allowed.has(mat)) continue;

        let pipeTotal = 0;
        for (const item of pipe.buffer) pipeTotal += item.amount;

        if (pipeTotal < pipe.maxBuffer) {
          const pushAmt = Math.min(amt, 1);
          b.buffer[mat] -= pushAmt;

          const existing = pipe.buffer.find((i) => i.material === mat);
          if (existing) {
            existing.amount += pushAmt;
          } else {
            pipe.buffer.push({ material: mat, amount: pushAmt });
          }
          break;
        }
      }
    }
  }
}

export function updatePipes(mgr: BuildingManager, grid: CellularGrid) {
  const pipeList = Array.from(mgr.pipes.values());

  for (const pipe of pipeList) {
    if (pipe.buffer.length === 0) continue;

    // Target tile along pipe direction
    let targetTx = pipe.tileX;
    let targetTy = pipe.tileY;
    switch (pipe.direction) {
      case 'UP':
        targetTy--;
        break;
      case 'DOWN':
        targetTy++;
        break;
      case 'LEFT':
        targetTx--;
        break;
      case 'RIGHT':
        targetTx++;
        break;
    }

    // Check bounds
    if (targetTx < 0 || targetTx >= TILES_X || targetTy < 0 || targetTy >= TILES_Y) {
      const item = pipe.buffer[0];
      spillMaterialToGrid(grid, pipe.x + 4, pipe.y + 4, item.material, 1);
      item.amount--;
      if (item.amount <= 0) pipe.buffer.shift();
      continue;
    }

    // 1. If target is another Pipe
    const nextPipe = mgr.getPipeAtTile(targetTx, targetTy);
    if (nextPipe) {
      let nextTotal = 0;
      for (const item of nextPipe.buffer) nextTotal += item.amount;

      if (nextTotal < nextPipe.maxBuffer) {
        const item = pipe.buffer[0];
        const pushAmt = Math.min(item.amount, 1);
        item.amount -= pushAmt;
        if (item.amount <= 0) pipe.buffer.shift();

        const existing = nextPipe.buffer.find((i) => i.material === item.material);
        if (existing) {
          existing.amount += pushAmt;
        } else {
          nextPipe.buffer.push({ material: item.material, amount: pushAmt });
        }
      }
      continue;
    }

    // 2. If target is a Building (Container or Processor)
    const targetBuilding = mgr.getBuildingAtTile(targetTx, targetTy);
    if (targetBuilding) {
      const item = pipe.buffer[0];
      const pushAmt = 1;

      // Find receiving input socket on target building
      const socket = findFacingSocket(targetBuilding, pipe.tileX, pipe.tileY);
      const socketId = socket ? socket.id : 'in_1';

      // Check Filter Enforcement
      const allowedSet = targetBuilding.filter.allowed[socketId];
      const isStateAllowed = socket
        ? socket.acceptedStates.includes(getMaterialState(item.material))
        : true;
      const isFilterAllowed = allowedSet ? allowedSet.has(item.material) : true;

      if (!isStateAllowed || !isFilterAllowed) {
        // Denied by filter or state: REJECT AND SPILL to CA grid!
        const caPos = getSocketCAPosition(targetBuilding, socket);
        spillMaterialToGrid(grid, caPos.x, caPos.y, item.material, pushAmt);
        item.amount -= pushAmt;
        if (item.amount <= 0) pipe.buffer.shift();
        continue;
      }

      if (targetBuilding.category === BuildingCategory.CONTAINER) {
        let containerTotal = 0;
        for (const val of Object.values(targetBuilding.buffer)) containerTotal += val;

        if (containerTotal >= targetBuilding.capacity) {
          // Overflow: spill at input socket
          const caPos = getSocketCAPosition(targetBuilding, socket);
          spillMaterialToGrid(grid, caPos.x, caPos.y, item.material, pushAmt);
        } else {
          targetBuilding.buffer[item.material] =
            (targetBuilding.buffer[item.material] || 0) + pushAmt;
        }
        item.amount -= pushAmt;
        if (item.amount <= 0) pipe.buffer.shift();
      } else if (targetBuilding.category === BuildingCategory.PROCESSOR) {
        targetBuilding.buffer[item.material] =
          (targetBuilding.buffer[item.material] || 0) + pushAmt;
        item.amount -= pushAmt;
        if (item.amount <= 0) pipe.buffer.shift();
      }
      continue;
    }

    // 3. Target is open CA grid: deposit as free particle!
    const item = pipe.buffer[0];
    const dropX = targetTx * BUILDING_TILE + 4;
    const dropY = targetTy * BUILDING_TILE + 4;
    const deposited = spillMaterialToGrid(grid, dropX, dropY, item.material, 1);
    if (deposited) {
      item.amount--;
      if (item.amount <= 0) pipe.buffer.shift();
    }
  }
}

export function updateProcessors(
  mgr: BuildingManager,
  grid: CellularGrid,
  dtSeconds: number
) {
  for (const b of mgr.buildings) {
    if (b.category !== BuildingCategory.PROCESSOR || !b.processorType) continue;

    const pType = b.processorType;

    if (b.cooldownRemaining > 0) {
      b.cooldownRemaining -= dtSeconds;
      b.progress = Math.min(1, 1 - b.cooldownRemaining / b.cooldownMax);
      if (b.cooldownRemaining <= 0) {
        b.progress = 0;
        executeProcessorOutput(mgr, grid, b, pType);
      }
      continue;
    }

    const canRun = canProcessorRun(b, pType);
    if (canRun) {
      consumeProcessorInputs(b, pType);
      b.cooldownRemaining = b.cooldownMax;
      b.progress = 0.01;
    }
  }
}

function canProcessorRun(b: BuildingInstance, pType: ProcessorType): boolean {
  switch (pType) {
    case ProcessorType.COMPRESSOR:
      return (b.buffer[MaterialType.DUST] || 0) >= 5;
    case ProcessorType.CONDENSER:
      return (b.buffer[MaterialType.GAS] || 0) >= 2;
    case ProcessorType.SEPARATOR:
      return (b.buffer[MaterialType.MINERAL_SLURRY] || 0) >= 2;
    case ProcessorType.PLASMA_FORGE:
      return (
        (b.buffer[MaterialType.VOID_CRYSTAL] || 0) >= 1 &&
        (b.buffer[MaterialType.GAS] || 0) >= 2
      );
    case ProcessorType.CATALYST_CHAMBER:
      const hasVapor = (b.buffer[MaterialType.REACTIVE_VAPOR] || 0) >= 2;
      const hasActiveCatalyst = (b.catalystRunsRemaining || 0) > 0;
      const hasStoredCatalyst = (b.buffer[MaterialType.CONDENSATE] || 0) >= 1;
      return hasVapor && (hasActiveCatalyst || hasStoredCatalyst);
    default:
      return false;
  }
}

function consumeProcessorInputs(b: BuildingInstance, pType: ProcessorType) {
  switch (pType) {
    case ProcessorType.COMPRESSOR:
      b.buffer[MaterialType.DUST] = (b.buffer[MaterialType.DUST] || 0) - 5;
      break;
    case ProcessorType.CONDENSER:
      b.buffer[MaterialType.GAS] = (b.buffer[MaterialType.GAS] || 0) - 2;
      break;
    case ProcessorType.SEPARATOR:
      b.buffer[MaterialType.MINERAL_SLURRY] = (b.buffer[MaterialType.MINERAL_SLURRY] || 0) - 2;
      break;
    case ProcessorType.PLASMA_FORGE:
      b.buffer[MaterialType.VOID_CRYSTAL] = (b.buffer[MaterialType.VOID_CRYSTAL] || 0) - 1;
      b.buffer[MaterialType.GAS] = (b.buffer[MaterialType.GAS] || 0) - 2;
      break;
    case ProcessorType.CATALYST_CHAMBER:
      b.buffer[MaterialType.REACTIVE_VAPOR] =
        (b.buffer[MaterialType.REACTIVE_VAPOR] || 0) - 2;
      if (!b.catalystRunsRemaining || b.catalystRunsRemaining <= 0) {
        b.buffer[MaterialType.CONDENSATE] = (b.buffer[MaterialType.CONDENSATE] || 0) - 1;
        b.catalystRunsRemaining = 3;
      }
      b.catalystRunsRemaining--;
      break;
  }
}

function executeProcessorOutput(
  mgr: BuildingManager,
  grid: CellularGrid,
  b: BuildingInstance,
  pType: ProcessorType
) {
  switch (pType) {
    case ProcessorType.COMPRESSOR:
      outputFromSocket(mgr, grid, b, 'out_1', MaterialType.STRUCTURAL_SOLID, 1);
      break;
    case ProcessorType.CONDENSER:
      outputFromSocket(mgr, grid, b, 'out_1', MaterialType.CONDENSATE, 1);
      break;
    case ProcessorType.SEPARATOR:
      outputFromSocket(mgr, grid, b, 'out_solid', MaterialType.DUST, 1);
      outputFromSocket(mgr, grid, b, 'out_liquid', MaterialType.LIQUID, 1);
      break;
    case ProcessorType.PLASMA_FORGE:
      outputFromSocket(mgr, grid, b, 'out_1', MaterialType.PLASMA, 1);
      break;
    case ProcessorType.CATALYST_CHAMBER:
      outputFromSocket(mgr, grid, b, 'out_solid', MaterialType.LUMINITE, 1);
      break;
  }
}

function outputFromSocket(
  mgr: BuildingManager,
  grid: CellularGrid,
  b: BuildingInstance,
  socketId: string,
  mat: MaterialType,
  amt: number
) {
  const socket = b.sockets.find((s) => s.id === socketId) || null;
  let targetTx = b.tileX;
  let targetTy = b.tileY + b.tileH;

  if (socket) {
    if (socket.side === 'bottom') {
      targetTx = b.tileX + Math.floor(socket.dtx);
      targetTy = b.tileY + b.tileH;
    } else if (socket.side === 'right') {
      targetTx = b.tileX + b.tileW;
      targetTy = b.tileY + Math.floor(socket.dty);
    }
  }

  if (targetTx >= 0 && targetTx < TILES_X && targetTy >= 0 && targetTy < TILES_Y) {
    // Check adjacent pipe
    const pipe = mgr.getPipeAtTile(targetTx, targetTy);
    if (pipe) {
      let pipeTotal = 0;
      for (const item of pipe.buffer) pipeTotal += item.amount;
      if (pipeTotal + amt <= pipe.maxBuffer) {
        const existing = pipe.buffer.find((i) => i.material === mat);
        if (existing) {
          existing.amount += amt;
        } else {
          pipe.buffer.push({ material: mat, amount: amt });
        }
        return;
      }
    }

    // Check adjacent container
    const container = mgr.getBuildingAtTile(targetTx, targetTy);
    if (container && container.category === BuildingCategory.CONTAINER) {
      const allowedSet = container.filter.allowed['in_1'];
      if (!allowedSet || allowedSet.has(mat)) {
        let containerTotal = 0;
        for (const v of Object.values(container.buffer)) containerTotal += v;
        if (containerTotal + amt <= container.capacity) {
          container.buffer[mat] = (container.buffer[mat] || 0) + amt;
          return;
        }
      }
    }
  }

  // Spill to CA grid at socket CA location
  const caPos = getSocketCAPosition(b, socket);
  spillMaterialToGrid(grid, caPos.x, caPos.y, mat, amt);
}
