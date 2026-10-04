import { BuildingInstance, MaterialType, SocketDef } from '../types';
import { BUILDING_TILE } from './buildingDefs';
import { CellularGrid, GRID_HEIGHT, GRID_WIDTH } from './grid';

export function findFacingSocket(
  b: BuildingInstance,
  pipeTx: number,
  pipeTy: number
): SocketDef | null {
  for (const socket of b.sockets) {
    // Calculate tile position of socket on the building perimeter
    let sockTx = b.tileX;
    let sockTy = b.tileY;

    if (socket.side === 'top') {
      sockTx = b.tileX + Math.floor(socket.dtx);
      sockTy = b.tileY - 1;
    } else if (socket.side === 'bottom') {
      sockTx = b.tileX + Math.floor(socket.dtx);
      sockTy = b.tileY + b.tileH;
    } else if (socket.side === 'left') {
      sockTx = b.tileX - 1;
      sockTy = b.tileY + Math.floor(socket.dty);
    } else if (socket.side === 'right') {
      sockTx = b.tileX + b.tileW;
      sockTy = b.tileY + Math.floor(socket.dty);
    }

    if (sockTx === pipeTx && sockTy === pipeTy) {
      return socket;
    }
  }
  return null;
}

export function getSocketCAPosition(
  b: BuildingInstance,
  socket: SocketDef | null
): { x: number; y: number } {
  if (!socket) return { x: b.x + b.width / 2, y: b.y };

  let caX = b.x + socket.dtx * BUILDING_TILE;
  let caY = b.y + socket.dty * BUILDING_TILE;

  if (socket.side === 'top') {
    caY = Math.max(0, b.y - 1);
  } else if (socket.side === 'bottom') {
    caY = Math.min(GRID_HEIGHT - 1, b.y + b.height);
  } else if (socket.side === 'left') {
    caX = Math.max(0, b.x - 1);
  } else if (socket.side === 'right') {
    caX = Math.min(GRID_WIDTH - 1, b.x + b.width);
  }

  return { x: Math.floor(caX), y: Math.floor(caY) };
}

export function spillMaterialToGrid(
  grid: CellularGrid,
  x: number,
  y: number,
  mat: MaterialType,
  count: number
): boolean {
  let placed = 0;
  const offsets = [
    { dx: 0, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: -1 },
    { dx: -1, dy: 1 },
    { dx: 1, dy: 1 },
    { dx: -1, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: -2, dy: 0 },
    { dx: 2, dy: 0 },
  ];

  for (let c = 0; c < count; c++) {
    let found = false;
    for (const { dx, dy } of offsets) {
      const nx = Math.floor(x + dx);
      const ny = Math.floor(y + dy);
      if (!grid.isInBounds(nx, ny)) continue;

      const idx = ny * GRID_WIDTH + nx;
      if (grid.materials[idx] === MaterialType.VACUUM && grid.structureFlags[idx] === 0) {
        grid.setCell(nx, ny, mat);
        placed++;
        found = true;
        break;
      }
    }
    if (!found) break;
  }
  return placed > 0;
}
