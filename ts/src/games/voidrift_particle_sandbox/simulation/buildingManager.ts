import {
  BuildingCategory,
  BuildingDef,
  BuildingInstance,
  MaterialType,
  PipeDirection,
  PipeNode,
  ProcessorType,
  SocketDef,
  TilePos,
} from '../types';
import { BUILDING_TILE, createDefaultFilter } from './buildingDefs';
import { CellularGrid, GRID_WIDTH } from './grid';
import { COLLECTOR_MAX_TILE_Y, computeSegmentDirection, TILES_X, TILES_Y } from './routing';
import { findFacingSocket, getSocketCAPosition, spillMaterialToGrid } from './buildingOps';
import {
  updateBuildingOutputs,
  updateCollectors,
  updatePipes,
  updateProcessors,
} from './buildingFlow';

export class BuildingManager {
  public buildings: BuildingInstance[];
  public pipes: Map<string, PipeNode>; // "tx,ty" -> PipeNode
  public buildingTileGrid: Int32Array; // Maps (ty * 40 + tx) to buildingId (or 0)
  public pipeTileGrid: Uint8Array; // 1 if tile has a pipe, 0 otherwise
  public nextBuildingId = 1;

  constructor() {
    this.buildings = [];
    this.pipes = new Map();
    this.buildingTileGrid = new Int32Array(TILES_X * TILES_Y);
    this.pipeTileGrid = new Uint8Array(TILES_X * TILES_Y);
  }

  public clearAll() {
    this.buildings = [];
    this.pipes.clear();
    this.buildingTileGrid.fill(0);
    this.pipeTileGrid.fill(0);
  }

  public getTileKey(tx: number, ty: number): string {
    return `${tx},${ty}`;
  }

  public getBuildingAt(txOrCx: number, tyOrCy: number): BuildingInstance | null {
    // If coordinates are in CA cell range (>= TILES_X or >= TILES_Y), convert to tile
    if (txOrCx >= TILES_X || tyOrCy >= TILES_Y) {
      return this.getBuildingAtCell(txOrCx, tyOrCy);
    }
    // Otherwise check tile first
    const fromTile = this.getBuildingAtTile(txOrCx, tyOrCy);
    if (fromTile) return fromTile;
    // Fallback in case coordinates were small CA coords
    return this.getBuildingAtCell(txOrCx, tyOrCy);
  }

  public getBuildingAtTile(tx: number, ty: number): BuildingInstance | null {
    if (tx < 0 || tx >= TILES_X || ty < 0 || ty >= TILES_Y) return null;
    const bId = this.buildingTileGrid[ty * TILES_X + tx];
    if (!bId) return null;
    return this.buildings.find((b) => b.id === bId) || null;
  }

  public getBuildingAtCell(cx: number, cy: number): BuildingInstance | null {
    const tx = Math.floor(cx / BUILDING_TILE);
    const ty = Math.floor(cy / BUILDING_TILE);
    return this.getBuildingAtTile(tx, ty);
  }

  public getPipeAt(txOrCx: number, tyOrCy: number): PipeNode | null {
    if (txOrCx >= TILES_X || tyOrCy >= TILES_Y) {
      return this.getPipeAtCell(txOrCx, tyOrCy);
    }
    const fromTile = this.getPipeAtTile(txOrCx, tyOrCy);
    if (fromTile) return fromTile;
    return this.getPipeAtCell(txOrCx, tyOrCy);
  }

  public getPipeAtTile(tx: number, ty: number): PipeNode | null {
    return this.pipes.get(this.getTileKey(tx, ty)) || null;
  }

  public getPipeAtCell(cx: number, cy: number): PipeNode | null {
    const tx = Math.floor(cx / BUILDING_TILE);
    const ty = Math.floor(cy / BUILDING_TILE);
    return this.getPipeAtTile(tx, ty);
  }

  public canPlaceBuilding(
    grid: CellularGrid,
    def: BuildingDef,
    tx: number,
    ty: number
  ): { valid: boolean; reason?: string } {
    // 1. Tile grid boundary check
    if (tx < 0 || tx + def.tileW > TILES_X || ty < 0 || ty + def.tileH > TILES_Y) {
      return { valid: false, reason: 'Out of bounds' };
    }

    // 2. Zone check: Collectors only allowed in rows 0-4 (CA rows 0-39)
    if (def.category === BuildingCategory.COLLECTOR) {
      if (ty + def.tileH > COLLECTOR_MAX_TILE_Y) {
        return { valid: false, reason: 'Collectors must be in Asteroid Zone (top 5 rows)' };
      }
    } else {
      // Non-collectors only allowed in rows 5-24 (CA rows 40-199)
      if (ty < COLLECTOR_MAX_TILE_Y) {
        return { valid: false, reason: 'Must build outside Asteroid Zone (rows 5-24)' };
      }
    }

    // 3. Overlap / Collision check across tile area
    for (let dty = 0; dty < def.tileH; dty++) {
      for (let dtx = 0; dtx < def.tileW; dtx++) {
        const curTx = tx + dtx;
        const curTy = ty + dty;
        const tileIdx = curTy * TILES_X + curTx;

        // Check if another building or pipe occupies this tile
        if (this.buildingTileGrid[tileIdx] !== 0) {
          return { valid: false, reason: 'Tile occupied by building' };
        }
        if (this.pipeTileGrid[tileIdx] !== 0) {
          return { valid: false, reason: 'Tile occupied by pipe' };
        }

        // Check if natural bedrock occupies CA cells within this tile
        const startX = curTx * BUILDING_TILE;
        const startY = curTy * BUILDING_TILE;
        for (let cy = startY; cy < startY + BUILDING_TILE; cy++) {
          for (let cx = startX; cx < startX + BUILDING_TILE; cx++) {
            const caIdx = cy * GRID_WIDTH + cx;
            if (grid.structureFlags[caIdx] === 1) {
              return { valid: false, reason: 'Blocked by natural bedrock' };
            }
          }
        }
      }
    }

    return { valid: true };
  }

  public placeBuilding(
    grid: CellularGrid,
    def: BuildingDef,
    tx: number,
    ty: number,
    manualDirection?: PipeDirection
  ): BuildingInstance | PipeNode | null {
    const check = this.canPlaceBuilding(grid, def, tx, ty);
    if (!check.valid) return null;

    if (def.category === BuildingCategory.PIPE) {
      return this.placePipe(grid, tx, ty, manualDirection);
    }

    if (def.category === BuildingCategory.WALL) {
      // Set 8x8 CA cells to structural solid
      const startX = tx * BUILDING_TILE;
      const startY = ty * BUILDING_TILE;
      for (let cy = startY; cy < startY + BUILDING_TILE; cy++) {
        for (let cx = startX; cx < startX + BUILDING_TILE; cx++) {
          grid.setCell(cx, cy, MaterialType.STRUCTURAL_SOLID, 2);
        }
      }
      return null;
    }

    // Create new Building Instance
    const instanceId = this.nextBuildingId++;
    const instance: BuildingInstance = {
      id: instanceId,
      buildingId: def.id,
      category: def.category,
      tileX: tx,
      tileY: ty,
      tileW: def.tileW,
      tileH: def.tileH,
      x: tx * BUILDING_TILE,
      y: ty * BUILDING_TILE,
      width: def.tileW * BUILDING_TILE,
      height: def.tileH * BUILDING_TILE,
      sockets: JSON.parse(JSON.stringify(def.sockets)),
      filter: createDefaultFilter(def, instanceId.toString()),
      connected: {},
      targetMaterial: def.acceptedMaterials ? def.acceptedMaterials[0] : undefined,
      universal: def.id === 'collector_universal',
      buffer: {},
      capacity: def.category === BuildingCategory.CONTAINER ? 500 : 200,
      containerType: def.containerType,
      processorType: def.processorType,
      progress: 0,
      cooldownMax: this.getProcessorCooldown(def.processorType),
      cooldownRemaining: 0,
      catalystCount: def.processorType === ProcessorType.CATALYST_CHAMBER ? 0 : undefined,
      catalystRunsRemaining: 0,
    };

    // Register building on tile grid
    for (let dty = 0; dty < def.tileH; dty++) {
      for (let dtx = 0; dtx < def.tileW; dtx++) {
        const curTx = tx + dtx;
        const curTy = ty + dty;
        this.buildingTileGrid[curTy * TILES_X + curTx] = instance.id;
      }
    }

    this.buildings.push(instance);

    // Auto-lock with adjacent existing pipes
    this.refreshBuildingConnections(instance);

    return instance;
  }

  private placePipe(
    _grid: CellularGrid,
    tx: number,
    ty: number,
    manualDir?: PipeDirection
  ): PipeNode {
    const key = this.getTileKey(tx, ty);
    const pipe: PipeNode = {
      tileX: tx,
      tileY: ty,
      x: tx * BUILDING_TILE,
      y: ty * BUILDING_TILE,
      direction: manualDir || 'DOWN',
      buffer: [],
      maxBuffer: 100,
      connected: {
        top: null,
        bottom: null,
        left: null,
        right: null,
      },
      flowParticles: [],
    };

    this.pipes.set(key, pipe);
    this.pipeTileGrid[ty * TILES_X + tx] = 1;

    // Run Auto-Socket-Lock and Direction Resolution
    this.autoLockPipe(pipe);

    return pipe;
  }

  public placePipeRoute(
    grid: CellularGrid,
    route: TilePos[],
    fallbackDir: PipeDirection = 'DOWN'
  ): PipeNode[] {
    const placedPipes: PipeNode[] = [];

    for (let i = 0; i < route.length; i++) {
      const tile = route[i];
      const dir = computeSegmentDirection(route, i, fallbackDir);
      const pipe = this.placePipe(grid, tile.tx, tile.ty, dir);
      placedPipes.push(pipe);
    }

    // Run autoLockPipe on each placed segment to synchronize connections
    for (const pipe of placedPipes) {
      this.autoLockPipe(pipe);
    }

    return placedPipes;
  }

  /**
   * Auto-socket-lock: Checks adjacent tiles for building sockets and other pipes.
   * Connects compatible sockets, updates pipe flow direction, and detects conflicts.
   */
  public autoLockPipe(pipe: PipeNode) {
    const { tileX: tx, tileY: ty } = pipe;

    // Check 4 adjacent directions: top, bottom, left, right
    const neighbors: {
      side: 'top' | 'bottom' | 'left' | 'right';
      ntx: number;
      nty: number;
      oppSide: 'top' | 'bottom' | 'left' | 'right';
      flowToNeighbor: PipeDirection;
      flowFromNeighbor: PipeDirection;
    }[] = [
      { side: 'top', ntx: tx, nty: ty - 1, oppSide: 'bottom', flowToNeighbor: 'UP', flowFromNeighbor: 'DOWN' },
      { side: 'bottom', ntx: tx, nty: ty + 1, oppSide: 'top', flowToNeighbor: 'DOWN', flowFromNeighbor: 'UP' },
      { side: 'left', ntx: tx - 1, nty: ty, oppSide: 'right', flowToNeighbor: 'LEFT', flowFromNeighbor: 'RIGHT' },
      { side: 'right', ntx: tx + 1, nty: ty, oppSide: 'left', flowToNeighbor: 'RIGHT', flowFromNeighbor: 'LEFT' },
    ];

    let foundOutputSource: { dir: PipeDirection; bId: number; sockId: string } | null = null;
    let foundInputTarget: { dir: PipeDirection; bId: number; sockId: string } | null = null;
    let adjacentOutputsCount = 0;
    let adjacentInputsCount = 0;

    for (const n of neighbors) {
      if (n.ntx < 0 || n.ntx >= TILES_X || n.nty < 0 || n.nty >= TILES_Y) continue;

      // 1. Check if adjacent tile has a building
      const b = this.getBuildingAtTile(n.ntx, n.nty);
      if (b) {
        // Find if this building has a socket on the edge facing this pipe
        const socket = findFacingSocket(b, tx, ty);
        if (socket) {
          if (socket.kind === 'output') {
            adjacentOutputsCount++;
            if (!foundOutputSource && (!b.connected[socket.id] || b.connected[socket.id] === this.getTileKey(tx, ty))) {
              foundOutputSource = { dir: n.flowFromNeighbor, bId: b.id, sockId: socket.id };
              pipe.connected[n.side] = `b:${b.id}:${socket.id}`;
              b.connected[socket.id] = this.getTileKey(tx, ty);
            }
          } else if (socket.kind === 'input') {
            adjacentInputsCount++;
            if (!foundInputTarget && (!b.connected[socket.id] || b.connected[socket.id] === this.getTileKey(tx, ty))) {
              foundInputTarget = { dir: n.flowToNeighbor, bId: b.id, sockId: socket.id };
              pipe.connected[n.side] = `b:${b.id}:${socket.id}`;
              b.connected[socket.id] = this.getTileKey(tx, ty);
            }
          }
        }
      }

      // 2. Check if adjacent tile is another pipe
      const adjPipe = this.getPipeAtTile(n.ntx, n.nty);
      if (adjPipe) {
        pipe.connected[n.side] = `p:${this.getTileKey(n.ntx, n.nty)}`;
        adjPipe.connected[n.oppSide] = `p:${this.getTileKey(tx, ty)}`;
      }
    }

    // Determine pipe direction:
    // If connected between Output Source and Input Target, flow from source to target
    if (foundOutputSource && foundInputTarget) {
      pipe.direction = foundInputTarget.dir;
      pipe.hasWarning = false;
    } else if (foundOutputSource) {
      // Flow away from output source
      pipe.direction = foundOutputSource.dir;
      pipe.hasWarning = false;
    } else if (foundInputTarget) {
      // Flow toward input target
      pipe.direction = foundInputTarget.dir;
      pipe.hasWarning = false;
    } else {
      // Check upstream adjacent pipe flow direction to auto-chain
      for (const n of neighbors) {
        const adjPipe = this.getPipeAtTile(n.ntx, n.nty);
        if (adjPipe && adjPipe.direction === n.flowFromNeighbor) {
          pipe.direction = adjPipe.direction;
          break;
        }
      }
    }

    // Check for incompatible connections: output-to-output or input-to-input
    if (adjacentOutputsCount >= 2 || (adjacentOutputsCount === 0 && adjacentInputsCount >= 2)) {
      pipe.hasWarning = true;
    } else {
      pipe.hasWarning = false;
    }
  }

  private refreshBuildingConnections(b: BuildingInstance) {
    for (const socket of b.sockets) {
      let adjTx = b.tileX;
      let adjTy = b.tileY;

      if (socket.side === 'top') {
        adjTx = b.tileX + Math.floor(socket.dtx);
        adjTy = b.tileY - 1;
      } else if (socket.side === 'bottom') {
        adjTx = b.tileX + Math.floor(socket.dtx);
        adjTy = b.tileY + b.tileH;
      } else if (socket.side === 'left') {
        adjTx = b.tileX - 1;
        adjTy = b.tileY + Math.floor(socket.dty);
      } else if (socket.side === 'right') {
        adjTx = b.tileX + b.tileW;
        adjTy = b.tileY + Math.floor(socket.dty);
      }

      const pipe = this.getPipeAtTile(adjTx, adjTy);
      if (pipe) {
        this.autoLockPipe(pipe);
      }
    }
  }

  public removeBuildingOrPipe(grid: CellularGrid, txOrCx: number, tyOrCy: number): boolean {
    let tx = txOrCx;
    let ty = tyOrCy;
    if (tx >= TILES_X || ty >= TILES_Y) {
      tx = Math.floor(tx / BUILDING_TILE);
      ty = Math.floor(ty / BUILDING_TILE);
    }
    if (tx < 0 || tx >= TILES_X || ty < 0 || ty >= TILES_Y) return false;
    const tileIdx = ty * TILES_X + tx;

    // Check if player structural wall at this tile
    const caStartX = tx * BUILDING_TILE;
    const caStartY = ty * BUILDING_TILE;
    const firstCaIdx = caStartY * GRID_WIDTH + caStartX;
    if (grid.structureFlags[firstCaIdx] === 2) {
      for (let cy = caStartY; cy < caStartY + BUILDING_TILE; cy++) {
        for (let cx = caStartX; cx < caStartX + BUILDING_TILE; cx++) {
          grid.setCell(cx, cy, MaterialType.VACUUM, 0);
        }
      }
      return true;
    }

    // Check if pipe
    if (this.pipeTileGrid[tileIdx] === 1) {
      const pipe = this.getPipeAtTile(tx, ty);
      if (pipe) {
        // Spill remaining buffer
        for (const item of pipe.buffer) {
          this.spillMaterial(grid, pipe.x + 4, pipe.y + 4, item.material, item.amount);
        }
      }
      this.pipes.delete(this.getTileKey(tx, ty));
      this.pipeTileGrid[tileIdx] = 0;

      // Notify adjacent buildings
      for (const b of this.buildings) {
        for (const [sockId, connectedKey] of Object.entries(b.connected)) {
          if (connectedKey === this.getTileKey(tx, ty)) {
            b.connected[sockId] = null;
          }
        }
      }
      return true;
    }

    // Check if building
    const bId = this.buildingTileGrid[tileIdx];
    if (bId) {
      const bIndex = this.buildings.findIndex((b) => b.id === bId);
      if (bIndex >= 0) {
        const b = this.buildings[bIndex];

        // Spill contents into grid at building center
        for (const [matStr, amount] of Object.entries(b.buffer)) {
          const mat = Number(matStr) as MaterialType;
          if (amount > 0) {
            this.spillMaterial(grid, b.x + b.width / 2, b.y + b.height / 2, mat, Math.min(amount, 50));
          }
        }

        // Clear building tile grid
        for (let dty = 0; dty < b.tileH; dty++) {
          for (let dtx = 0; dtx < b.tileW; dtx++) {
            const curTx = b.tileX + dtx;
            const curTy = b.tileY + dty;
            this.buildingTileGrid[curTy * TILES_X + curTx] = 0;
          }
        }

        this.buildings.splice(bIndex, 1);
        return true;
      }
    }

    return false;
  }

  private getProcessorCooldown(procType?: ProcessorType): number {
    switch (procType) {
      case ProcessorType.COMPRESSOR:
        return 2.0;
      case ProcessorType.CONDENSER:
        return 3.0;
      case ProcessorType.SEPARATOR:
        return 4.0;
      case ProcessorType.PLASMA_FORGE:
        return 6.0;
      case ProcessorType.CATALYST_CHAMBER:
        return 8.0;
      default:
        return 3.0;
    }
  }

  public getMaterialTotalInContainers(mat: MaterialType): number {
    let total = 0;
    for (const b of this.buildings) {
      if (b.category === BuildingCategory.CONTAINER) {
        total += b.buffer[mat] || 0;
      }
    }
    return total;
  }

  public consumeMaterialFromContainers(mat: MaterialType, amount: number): boolean {
    if (this.getMaterialTotalInContainers(mat) < amount) return false;

    let remaining = amount;
    for (const b of this.buildings) {
      if (b.category === BuildingCategory.CONTAINER && b.buffer[mat]) {
        const take = Math.min(b.buffer[mat], remaining);
        b.buffer[mat] -= take;
        remaining -= take;
        if (remaining <= 0) break;
      }
    }
    return true;
  }

  public updateFilter(buildingId: string, socketId: string, material: MaterialType, allow: boolean) {
    const b = this.buildings.find((item) => item.id.toString() === buildingId);
    if (!b) return;
    if (!b.filter.allowed[socketId]) {
      b.filter.allowed[socketId] = new Set();
    }
    if (allow) {
      b.filter.allowed[socketId].add(material);
    } else {
      b.filter.allowed[socketId].delete(material);
    }
  }

  public resetFilterToDefaults(buildingId: string) {
    const b = this.buildings.find((item) => item.id.toString() === buildingId);
    if (!b) return;
    const def = { sockets: b.sockets } as BuildingDef;
    b.filter = createDefaultFilter(def, buildingId);
  }

  public step(grid: CellularGrid, dtSeconds: number) {
    // 1. Update Collectors: catch physical materials touching collector intake
    updateCollectors(this, grid);

    // 2. Update Processors: progress recipes and output results
    updateProcessors(this, grid, dtSeconds);

    // 3. Update Pipe Network Flow
    updatePipes(this, grid);

    // 4. Update Output Feeds from Collectors & Containers into connected Pipes
    updateBuildingOutputs(this);
  }

  public getSocketCAPosition(
    b: BuildingInstance,
    socket: SocketDef | null
  ): { x: number; y: number } {
    return getSocketCAPosition(b, socket);
  }

  public spillMaterial(
    grid: CellularGrid,
    x: number,
    y: number,
    mat: MaterialType,
    count: number
  ): boolean {
    return spillMaterialToGrid(grid, x, y, mat, count);
  }
}
