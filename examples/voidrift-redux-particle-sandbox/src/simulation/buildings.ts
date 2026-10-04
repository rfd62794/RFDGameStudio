import {
  BuildingCategory,
  BuildingDef,
  BuildingFilter,
  BuildingInstance,
  ContainerType,
  FlowParticle,
  MaterialType,
  PipeDirection,
  PipeNode,
  ProcessorType,
  SocketDef,
  TilePos,
} from '../types';
import {
  BUILDING_TILE,
  createDefaultFilter,
  getMaterialState,
} from './buildingDefs';
import { ASTEROID_ZONE_HEIGHT, CellularGrid, GRID_HEIGHT, GRID_WIDTH } from './grid';

export const TILES_X = GRID_WIDTH / BUILDING_TILE; // 40
export const TILES_Y = GRID_HEIGHT / BUILDING_TILE; // 25
export const COLLECTOR_MAX_TILE_Y = ASTEROID_ZONE_HEIGHT / BUILDING_TILE; // 5 (rows 0-4)

export function snapToTile(caX: number, caY: number): TilePos {
  return {
    tx: Math.max(0, Math.min(TILES_X - 1, Math.floor(caX / BUILDING_TILE))),
    ty: Math.max(0, Math.min(TILES_Y - 1, Math.floor(caY / BUILDING_TILE))),
  };
}

export function tileToCA(tx: number, ty: number): { x: number; y: number } {
  return {
    x: tx * BUILDING_TILE,
    y: ty * BUILDING_TILE,
  };
}

export const EMISSIVE_MATERIALS = new Set<MaterialType>([
  MaterialType.PLASMA,
  MaterialType.VOID_CRYSTAL,
  MaterialType.REACTIVE_VAPOR,
  MaterialType.LUMINITE,
]);

export function spawnFlowParticle(pipe: PipeNode): FlowParticle {
  const topMaterial = pipe.buffer.length > 0 ? pipe.buffer[0].material : MaterialType.DUST;

  // Random lateral offset 0.25 to 0.75 across the pipe cross-section
  const lateral = 0.25 + Math.random() * 0.5;
  let localX = 0.5;
  let localY = 0.5;

  switch (pipe.direction) {
    case 'RIGHT':
      localX = 0.0;
      localY = lateral;
      break;
    case 'LEFT':
      localX = 1.0;
      localY = lateral;
      break;
    case 'DOWN':
      localX = lateral;
      localY = 0.0;
      break;
    case 'UP':
      localX = lateral;
      localY = 1.0;
      break;
  }

  return {
    localX,
    localY,
    progress: 0.0,
    speed: 1.0,
    material: topMaterial,
    opacity: 0.85 + Math.random() * 0.15,
    size: 1.2 + Math.random() * 0.6,
  };
}

export function updatePipeFlowParticles(pipe: PipeNode, dt: number) {
  if (!pipe.flowParticles) {
    pipe.flowParticles = [];
  }

  const bufferAmount = pipe.buffer.reduce((s, i) => s + i.amount, 0);
  const bufferFillRatio = Math.min(1.0, bufferAmount / (pipe.maxBuffer || 50));
  const speed = pipe.hasWarning ? 0.1 : Math.max(0.3, 1.0 - bufferFillRatio * 0.6);
  const targetCount = Math.round(bufferFillRatio * 6); // MAX 6 particles per pipe

  // Advance existing particles
  pipe.flowParticles = pipe.flowParticles
    .map((p) => ({ ...p, progress: p.progress + dt * speed * 1.5, speed }))
    .filter((p) => p.progress < 1.0);

  // Spawn new particles to reach target count
  while (pipe.flowParticles.length < targetCount && pipe.buffer.length > 0) {
    pipe.flowParticles.push(spawnFlowParticle(pipe));
  }

  // Update localX/localY from progress based on flow direction
  for (const p of pipe.flowParticles) {
    switch (pipe.direction) {
      case 'RIGHT':
        p.localX = p.progress;
        break;
      case 'LEFT':
        p.localX = 1.0 - p.progress;
        break;
      case 'DOWN':
        p.localY = p.progress;
        break;
      case 'UP':
        p.localY = 1.0 - p.progress;
        break;
    }
  }
}

export function computeRoute(
  start: TilePos,
  end: TilePos,
  horizontalFirst: boolean,
  buildingMgr: BuildingManager
): TilePos[] {
  const rawTiles: TilePos[] = [];

  const dx = end.tx > start.tx ? 1 : end.tx < start.tx ? -1 : 0;
  const dy = end.ty > start.ty ? 1 : end.ty < start.ty ? -1 : 0;

  let cx = start.tx;
  let cy = start.ty;

  if (horizontalFirst) {
    // Walk horizontal first
    while (cx !== end.tx) {
      rawTiles.push({ tx: cx, ty: cy });
      cx += dx;
    }
    // Walk vertical
    while (cy !== end.ty) {
      rawTiles.push({ tx: cx, ty: cy });
      cy += dy;
    }
    rawTiles.push({ tx: end.tx, ty: end.ty });
  } else {
    // Walk vertical first
    while (cy !== end.ty) {
      rawTiles.push({ tx: cx, ty: cy });
      cy += dy;
    }
    // Walk horizontal
    while (cx !== end.tx) {
      rawTiles.push({ tx: cx, ty: cy });
      cx += dx;
    }
    rawTiles.push({ tx: end.tx, ty: end.ty });
  }

  // Filter contiguous valid tiles starting from start tile
  // Must stop at first occupied or out-of-bounds tile
  const validTiles: TilePos[] = [];
  for (let i = 0; i < rawTiles.length; i++) {
    const t = rawTiles[i];
    if (t.tx < 0 || t.tx >= TILES_X || t.ty < 0 || t.ty >= TILES_Y) {
      break;
    }
    // Check if within asteroid zone: Pipes are outside Asteroid Zone (rows 5-24)
    if (t.ty < COLLECTOR_MAX_TILE_Y) {
      break;
    }

    const tileIdx = t.ty * TILES_X + t.tx;
    const isOccupiedByBuilding = buildingMgr.buildingTileGrid[tileIdx] !== 0;
    const isOccupiedByPipe = buildingMgr.pipeTileGrid[tileIdx] !== 0;

    if (isOccupiedByBuilding || isOccupiedByPipe) {
      break;
    }
    validTiles.push(t);
  }

  return validTiles;
}

export function computeSegmentDirection(
  route: TilePos[],
  index: number,
  fallbackDir: PipeDirection = 'DOWN'
): PipeDirection {
  if (route.length <= 1) {
    return fallbackDir;
  }

  const cur = route[index];

  // Point toward next tile in route
  if (index < route.length - 1) {
    const next = route[index + 1];
    if (next.tx > cur.tx) return 'RIGHT';
    if (next.tx < cur.tx) return 'LEFT';
    if (next.ty > cur.ty) return 'DOWN';
    if (next.ty < cur.ty) return 'UP';
  }

  // If last tile, continue from previous tile
  if (index > 0) {
    const prev = route[index - 1];
    if (cur.tx > prev.tx) return 'RIGHT';
    if (cur.tx < prev.tx) return 'LEFT';
    if (cur.ty > prev.ty) return 'DOWN';
    if (cur.ty < prev.ty) return 'UP';
  }

  return fallbackDir;
}

export class BuildingManager {
  public buildings: BuildingInstance[];
  public pipes: Map<string, PipeNode>; // "tx,ty" -> PipeNode
  public buildingTileGrid: Int32Array; // Maps (ty * 40 + tx) to buildingId (or 0)
  public pipeTileGrid: Uint8Array; // 1 if tile has a pipe, 0 otherwise
  private nextBuildingId = 1;

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
    grid: CellularGrid,
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
        const socket = this.findFacingSocket(b, tx, ty);
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

  private findFacingSocket(b: BuildingInstance, pipeTx: number, pipeTy: number): SocketDef | null {
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
    this.updateCollectors(grid);

    // 2. Update Processors: progress recipes and output results
    this.updateProcessors(grid, dtSeconds);

    // 3. Update Pipe Network Flow
    this.updatePipes(grid, dtSeconds);

    // 4. Update Output Feeds from Collectors & Containers into connected Pipes
    this.updateBuildingOutputs(grid, dtSeconds);
  }

  private updateCollectors(grid: CellularGrid) {
    for (const b of this.buildings) {
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

  private updateBuildingOutputs(grid: CellularGrid, _dtSeconds: number) {
    // Feed from output sockets into connected pipes or adjacent containers
    for (const b of this.buildings) {
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

        const pipe = this.getPipeAtTile(targetTx, targetTy);
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

  private updatePipes(grid: CellularGrid, _dtSeconds: number) {
    const pipeList = Array.from(this.pipes.values());

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
        this.spillMaterial(grid, pipe.x + 4, pipe.y + 4, item.material, 1);
        item.amount--;
        if (item.amount <= 0) pipe.buffer.shift();
        continue;
      }

      // 1. If target is another Pipe
      const nextPipe = this.getPipeAtTile(targetTx, targetTy);
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
      const targetBuilding = this.getBuildingAtTile(targetTx, targetTy);
      if (targetBuilding) {
        const item = pipe.buffer[0];
        const pushAmt = 1;

        // Find receiving input socket on target building
        const socket = this.findFacingSocket(targetBuilding, pipe.tileX, pipe.tileY);
        const socketId = socket ? socket.id : 'in_1';

        // Check Filter Enforcement
        const allowedSet = targetBuilding.filter.allowed[socketId];
        const isStateAllowed = socket
          ? socket.acceptedStates.includes(getMaterialState(item.material))
          : true;
        const isFilterAllowed = allowedSet ? allowedSet.has(item.material) : true;

        if (!isStateAllowed || !isFilterAllowed) {
          // Denied by filter or state: REJECT AND SPILL to CA grid!
          const caPos = this.getSocketCAPosition(targetBuilding, socket);
          this.spillMaterial(grid, caPos.x, caPos.y, item.material, pushAmt);
          item.amount -= pushAmt;
          if (item.amount <= 0) pipe.buffer.shift();
          continue;
        }

        if (targetBuilding.category === BuildingCategory.CONTAINER) {
          let containerTotal = 0;
          for (const val of Object.values(targetBuilding.buffer)) containerTotal += val;

          if (containerTotal >= targetBuilding.capacity) {
            // Overflow: spill at input socket
            const caPos = this.getSocketCAPosition(targetBuilding, socket);
            this.spillMaterial(grid, caPos.x, caPos.y, item.material, pushAmt);
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
      const deposited = this.spillMaterial(grid, dropX, dropY, item.material, 1);
      if (deposited) {
        item.amount--;
        if (item.amount <= 0) pipe.buffer.shift();
      }
    }
  }

  public getSocketCAPosition(
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

  private updateProcessors(grid: CellularGrid, dtSeconds: number) {
    for (const b of this.buildings) {
      if (b.category !== BuildingCategory.PROCESSOR || !b.processorType) continue;

      const pType = b.processorType;

      if (b.cooldownRemaining > 0) {
        b.cooldownRemaining -= dtSeconds;
        b.progress = Math.min(1, 1 - b.cooldownRemaining / b.cooldownMax);
        if (b.cooldownRemaining <= 0) {
          b.progress = 0;
          this.executeProcessorOutput(grid, b, pType);
        }
        continue;
      }

      const canRun = this.canProcessorRun(b, pType);
      if (canRun) {
        this.consumeProcessorInputs(b, pType);
        b.cooldownRemaining = b.cooldownMax;
        b.progress = 0.01;
      }
    }
  }

  private canProcessorRun(b: BuildingInstance, pType: ProcessorType): boolean {
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

  private consumeProcessorInputs(b: BuildingInstance, pType: ProcessorType) {
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

  private executeProcessorOutput(
    grid: CellularGrid,
    b: BuildingInstance,
    pType: ProcessorType
  ) {
    switch (pType) {
      case ProcessorType.COMPRESSOR:
        this.outputFromSocket(grid, b, 'out_1', MaterialType.STRUCTURAL_SOLID, 1);
        break;
      case ProcessorType.CONDENSER:
        this.outputFromSocket(grid, b, 'out_1', MaterialType.CONDENSATE, 1);
        break;
      case ProcessorType.SEPARATOR:
        this.outputFromSocket(grid, b, 'out_solid', MaterialType.DUST, 1);
        this.outputFromSocket(grid, b, 'out_liquid', MaterialType.LIQUID, 1);
        break;
      case ProcessorType.PLASMA_FORGE:
        this.outputFromSocket(grid, b, 'out_1', MaterialType.PLASMA, 1);
        break;
      case ProcessorType.CATALYST_CHAMBER:
        this.outputFromSocket(grid, b, 'out_solid', MaterialType.LUMINITE, 1);
        break;
    }
  }

  private outputFromSocket(
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
      const pipe = this.getPipeAtTile(targetTx, targetTy);
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
      const container = this.getBuildingAtTile(targetTx, targetTy);
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
    const caPos = this.getSocketCAPosition(b, socket);
    this.spillMaterial(grid, caPos.x, caPos.y, mat, amt);
  }

  public spillMaterial(
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
}
