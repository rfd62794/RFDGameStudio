import {
  BuildingCategory,
  BuildingDef,
  BuildingInstance,
  FlowParticle,
  MaterialState,
  MaterialType,
  MATERIAL_DEFS,
  PipeDirection,
  PipeNode,
  PipeRouteState,
  SocketDef,
  TilePos,
} from '../types';
import {
  BUILDING_TILE,
  FRAME_COLORS,
  getMaterialState,
  SOCKET_STATE_COLORS,
} from './buildingDefs';
import {
  BuildingManager,
  computeSegmentDirection,
  EMISSIVE_MATERIALS,
  TILES_X,
  TILES_Y,
} from './buildings';
import { ASTEROID_ZONE_HEIGHT, CellularGrid, GRID_HEIGHT, GRID_WIDTH } from './grid';

export interface RenderOptions {
  showZoneBoundary: boolean;
  showPipeArrows: boolean;
  showBuildingLabels: boolean;
  hoverCell?: { x: number; y: number } | null;
  selectedDef?: BuildingDef | null;
  selectedBuildingId?: string | null;
  pipeDirection?: PipeDirection;
  brushMaterial?: MaterialType | null;
  brushSize?: number;
  zoom: number;
  panX: number;
  panY: number;
  structuralSolidAvailable?: number;
  freeBuild?: boolean;
  pipeRouteState?: PipeRouteState | null;
  alternateRoute?: TilePos[] | null;
}

export class GameRenderer {
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private imageData: ImageData;
  private pixel32: Uint32Array;

  // Precomputed RGBA 32-bit colors for maximum performance
  private colorLut: Uint32Array;

  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = GRID_WIDTH;
    this.offscreenCanvas.height = GRID_HEIGHT;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: false })!;
    this.imageData = this.offscreenCtx.createImageData(GRID_WIDTH, GRID_HEIGHT);
    this.pixel32 = new Uint32Array(this.imageData.data.buffer);
    this.colorLut = new Uint32Array(16);

    this.initColorLut();
  }

  private initColorLut() {
    for (let i = 0; i < 16; i++) {
      const def = MATERIAL_DEFS[i as MaterialType];
      if (def) {
        const [r, g, b] = def.rgb;
        const a = def.isGas && def.id === MaterialType.GAS ? 180 : 255;
        this.colorLut[i] = (a << 24) | (b << 16) | (g << 8) | r;
      } else {
        this.colorLut[i] = (255 << 24) | (26 << 16) | (10 << 8) | 10;
      }
    }
  }

  public render(
    mainCtx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    grid: CellularGrid,
    buildingMgr: BuildingManager,
    timeMs: number,
    options: RenderOptions
  ) {
    // 1. Update pixel buffer directly for CA grid
    const pixel32 = this.pixel32;
    const materials = grid.materials;
    const structFlags = grid.structureFlags;
    const noise = grid.grainNoise;

    const pulse = 0.8 + 0.2 * Math.sin(timeMs * 0.005);
    const goldPulse = 0.85 + 0.15 * Math.sin(timeMs * 0.008);

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const idx = y * GRID_WIDTH + x;
        const mat = materials[idx];
        const flag = structFlags[idx];

        if (flag === 2) {
          // Player structural solid
          const [r, g, b] = MATERIAL_DEFS[MaterialType.STRUCTURAL_SOLID].rgb;
          pixel32[idx] = (255 << 24) | (b << 16) | (g << 8) | r;
          continue;
        }

        if (mat === MaterialType.VACUUM) {
          // Deep space vacuum
          pixel32[idx] = (255 << 24) | (26 << 16) | (10 << 8) | 10;
        } else if (mat === MaterialType.DUST) {
          // Dust with grain noise
          const gMul = noise[idx];
          const r = Math.min(255, Math.floor(200 * gMul));
          const g = Math.min(255, Math.floor(184 * gMul));
          const b = Math.min(255, Math.floor(154 * gMul));
          pixel32[idx] = (255 << 24) | (b << 16) | (g << 8) | r;
        } else if (mat === MaterialType.LIQUID) {
          // Surface shimmer on top cell
          const aboveIdx = (y - 1) * GRID_WIDTH + x;
          const isSurface = y === 0 || materials[aboveIdx] !== MaterialType.LIQUID;
          if (isSurface) {
            pixel32[idx] = (255 << 24) | (230 << 16) | (160 << 8) | 90;
          } else {
            pixel32[idx] = this.colorLut[MaterialType.LIQUID];
          }
        } else if (mat === MaterialType.VOID_CRYSTAL) {
          const r = Math.floor(184 * pulse);
          const g = Math.floor(160 * pulse);
          const b = Math.floor(255 * pulse);
          pixel32[idx] = (255 << 24) | (b << 16) | (g << 8) | r;
        } else if (mat === MaterialType.LUMINITE) {
          const r = Math.floor(255 * goldPulse);
          const g = Math.floor(224 * goldPulse);
          const b = Math.floor(128 * goldPulse);
          pixel32[idx] = (255 << 24) | (b << 16) | (g << 8) | r;
        } else if (mat === MaterialType.PLASMA) {
          const flicker = 0.9 + Math.random() * 0.15;
          const r = 255;
          const g = Math.min(255, Math.floor(106 * flicker));
          const b = Math.floor(20 * flicker);
          pixel32[idx] = (255 << 24) | (b << 16) | (g << 8) | r;
        } else {
          pixel32[idx] = this.colorLut[mat] || this.colorLut[0];
        }
      }
    }

    this.offscreenCtx.putImageData(this.imageData, 0, 0);

    // 2. Clear main canvas and draw scaled offscreen CA grid
    mainCtx.fillStyle = '#060610';
    mainCtx.fillRect(0, 0, canvasWidth, canvasHeight);

    mainCtx.save();
    mainCtx.translate(options.panX, options.panY);
    mainCtx.scale(options.zoom, options.zoom);

    // Disable image smoothing for ultra-crisp simulation
    mainCtx.imageSmoothingEnabled = false;
    mainCtx.drawImage(this.offscreenCanvas, 0, 0, GRID_WIDTH, GRID_HEIGHT);

    // 3. Draw Faint Building Grid (40x25 tiles) if in placement mode
    if (options.selectedDef) {
      this.renderBuildingGridLines(mainCtx);
    }

    // 4. Draw Asteroid Impact Zone Boundary line (Top 20% / Y = 40)
    if (options.showZoneBoundary) {
      mainCtx.save();
      mainCtx.strokeStyle = 'rgba(122, 184, 212, 0.35)';
      mainCtx.lineWidth = 1 / options.zoom;
      mainCtx.setLineDash([4, 4]);
      mainCtx.beginPath();
      mainCtx.moveTo(0, ASTEROID_ZONE_HEIGHT);
      mainCtx.lineTo(GRID_WIDTH, ASTEROID_ZONE_HEIGHT);
      mainCtx.stroke();
      mainCtx.setLineDash([]);
      mainCtx.restore();
    }

    // 4.5. Draw Pipe Route Preview (BEFORE building frames & pipes)
    if (options.pipeRouteState && options.pipeRouteState.mode === 'drawing') {
      if (options.alternateRoute && options.alternateRoute.length > 0) {
        this.renderRoutePreview(mainCtx, options.alternateRoute, true, options.zoom, true);
      }
      this.renderRoutePreview(
        mainCtx,
        options.pipeRouteState.route,
        options.pipeRouteState.valid,
        options.zoom,
        false
      );
    }

    // 5. Draw Pipes (Frames, directional arrows, and flow indicators)
    this.renderPipes(mainCtx, buildingMgr, options);

    // 6. Draw Buildings (Frames, transparent interiors, labels, sockets)
    this.renderBuildings(mainCtx, buildingMgr, options);

    // 7. Draw Placement Ghost Preview (Snapped to tile grid)
    let invalidInfo: { valid: boolean; reason?: string } | null = null;
    if (!options.pipeRouteState || options.pipeRouteState.mode !== 'drawing') {
      invalidInfo = this.renderPlacementPreview(mainCtx, grid, buildingMgr, options);
    }

    mainCtx.restore();

    // 8. Draw Screen-Space Tooltip if placement is invalid
    if (invalidInfo && invalidInfo.reason && options.hoverCell && options.selectedDef) {
      const snapTx = Math.max(0, Math.min(TILES_X - options.selectedDef.tileW, Math.floor(options.hoverCell.x / BUILDING_TILE)));
      const snapTy = Math.max(0, Math.min(TILES_Y - options.selectedDef.tileH, Math.floor(options.hoverCell.y / BUILDING_TILE)));
      const screenX = options.panX + (snapTx + options.selectedDef.tileW) * BUILDING_TILE * options.zoom + 12;
      const screenY = options.panY + snapTy * BUILDING_TILE * options.zoom;
      this.renderScreenTooltip(mainCtx, screenX, screenY, invalidInfo.reason, canvasWidth, canvasHeight);
    }
  }

  private renderBuildingGridLines(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;

    ctx.beginPath();
    for (let tx = 0; tx <= TILES_X; tx++) {
      const x = tx * BUILDING_TILE;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GRID_HEIGHT);
    }
    for (let ty = 0; ty <= TILES_Y; ty++) {
      const y = ty * BUILDING_TILE;
      ctx.moveTo(0, y);
      ctx.lineTo(GRID_WIDTH, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  private renderPipes(
    ctx: CanvasRenderingContext2D,
    buildingMgr: BuildingManager,
    options: RenderOptions
  ) {
    const zoom = options.zoom;
    const lineWidth = Math.max(0.5, 1.2 / zoom);

    for (const pipe of buildingMgr.pipes.values()) {
      const { tileX, tileY, direction, buffer, hasWarning, flowParticles } = pipe;
      const caX = tileX * BUILDING_TILE;
      const caY = tileY * BUILDING_TILE;
      const size = BUILDING_TILE;

      ctx.save();

      // 1. Pipe outer frame (outline only, transparent interior)
      ctx.strokeStyle = hasWarning ? '#ef4444' : FRAME_COLORS.pipe || '#aaaaaa';
      ctx.lineWidth = lineWidth;
      ctx.strokeRect(caX + 0.5, caY + 0.5, size - 1, size - 1);

      // 2. Render Material Flow Particles
      this.renderPipeFlowParticles(ctx, pipe, caX, caY, size);

      // 3. Determine arrow color and opacity based on material in pipe buffer
      let arrowColor = '#64748b'; // default grey
      const hasMaterial = buffer.length > 0;
      if (hasMaterial) {
        const topItem = buffer[0];
        const state = getMaterialState(topItem.material);
        arrowColor = SOCKET_STATE_COLORS[state] || '#ffffff';
      }

      // If particles/material are active, arrow opacity is 0.3; empty pipe is 1.0
      ctx.globalAlpha = hasMaterial && flowParticles && flowParticles.length > 0 ? 0.3 : 1.0;
      ctx.fillStyle = hasWarning ? '#ef4444' : arrowColor;

      // Draw directional arrow in center
      this.drawDirectionArrow(ctx, caX, caY, size, direction, hasWarning ? '#ef4444' : arrowColor);

      // Warning indicator
      if (hasWarning) {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = lineWidth * 1.5;
        ctx.strokeRect(caX + 1, caY + 1, size - 2, size - 2);
      }

      ctx.restore();
    }
  }

  private renderPipeFlowParticles(
    ctx: CanvasRenderingContext2D,
    pipe: PipeNode,
    caX: number,
    caY: number,
    size: number
  ) {
    if (!pipe.flowParticles || pipe.flowParticles.length === 0 || pipe.buffer.length === 0) {
      return;
    }

    const topMaterial = pipe.buffer[0].material;
    const matDef = MATERIAL_DEFS[topMaterial];
    const color = matDef?.color || '#ffffff';
    const isEmissive = EMISSIVE_MATERIALS.has(topMaterial);

    for (const p of pipe.flowParticles) {
      const px = caX + p.localX * size;
      const py = caY + p.localY * size;
      const radius = Math.max(0.5, p.size * 0.75);

      ctx.save();
      ctx.globalAlpha = p.opacity;

      if (isEmissive) {
        ctx.shadowBlur = 4;
        ctx.shadowColor = color;
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private renderRoutePreview(
    ctx: CanvasRenderingContext2D,
    route: TilePos[],
    valid: boolean,
    zoom: number,
    isAlternate: boolean = false
  ) {
    if (!route || route.length === 0) return;

    const lineWidth = Math.max(0.6, 1.5 / zoom);

    for (let i = 0; i < route.length; i++) {
      const { tx, ty } = route[i];
      const caX = tx * BUILDING_TILE;
      const caY = ty * BUILDING_TILE;
      const size = BUILDING_TILE;

      ctx.save();
      ctx.globalAlpha = isAlternate ? 0.3 : 0.55;
      ctx.strokeStyle = valid ? '#aaaaaa' : '#ef4444';
      ctx.lineWidth = lineWidth;
      ctx.strokeRect(caX + 0.5, caY + 0.5, size - 1, size - 1);

      // Direction arrow for each preview segment
      const dir = computeSegmentDirection(route, i);
      this.drawDirectionArrow(ctx, caX, caY, size, dir, valid ? '#64748b' : '#ef4444');

      ctx.restore();
    }

    // Start and end socket indicators: bright dots at route endpoints
    if (!isAlternate && route.length > 0) {
      this.drawRouteEndpoint(ctx, route[0], '#22c55e', zoom); // green start
      this.drawRouteEndpoint(ctx, route[route.length - 1], '#f59e0b', zoom); // amber end
    }
  }

  private drawRouteEndpoint(
    ctx: CanvasRenderingContext2D,
    tile: TilePos,
    color: string,
    zoom: number
  ) {
    const cx = (tile.tx + 0.5) * BUILDING_TILE;
    const cy = (tile.ty + 0.5) * BUILDING_TILE;
    const radius = Math.max(1.2, 2.5 / Math.sqrt(zoom));

    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawDirectionArrow(
    ctx: CanvasRenderingContext2D,
    caX: number,
    caY: number,
    size: number,
    direction: PipeDirection,
    color: string
  ) {
    ctx.fillStyle = color;
    ctx.beginPath();
    const cx = caX + size * 0.5;
    const cy = caY + size * 0.5;
    const arrowRadius = 2.0;

    switch (direction) {
      case 'UP':
        ctx.moveTo(cx, cy - arrowRadius);
        ctx.lineTo(cx - arrowRadius, cy + arrowRadius);
        ctx.lineTo(cx + arrowRadius, cy + arrowRadius);
        break;
      case 'DOWN':
        ctx.moveTo(cx, cy + arrowRadius);
        ctx.lineTo(cx - arrowRadius, cy - arrowRadius);
        ctx.lineTo(cx + arrowRadius, cy - arrowRadius);
        break;
      case 'LEFT':
        ctx.moveTo(cx - arrowRadius, cy);
        ctx.lineTo(cx + arrowRadius, cy - arrowRadius);
        ctx.lineTo(cx + arrowRadius, cy + arrowRadius);
        break;
      case 'RIGHT':
        ctx.moveTo(cx + arrowRadius, cy);
        ctx.lineTo(cx - arrowRadius, cy - arrowRadius);
        ctx.lineTo(cx - arrowRadius, cy + arrowRadius);
        break;
    }
    ctx.closePath();
    ctx.fill();
  }

  private renderBuildings(
    ctx: CanvasRenderingContext2D,
    buildingMgr: BuildingManager,
    options: RenderOptions
  ) {
    const zoom = options.zoom;
    const selectedId = options.selectedBuildingId;
    const anySelected = Boolean(selectedId);

    for (const b of buildingMgr.buildings) {
      const isSelected = selectedId === b.id.toString();
      const def = {
        id: b.buildingId,
        category: b.category,
        tileW: b.tileW,
        tileH: b.tileH,
        shortLabel: b.buildingId.toUpperCase().slice(0, 7),
      };

      ctx.save();

      // Opacity: 100% if selected or no building selected; 80% for others if one is selected
      ctx.globalAlpha = anySelected && !isSelected ? 0.8 : 1.0;

      const caX = b.tileX * BUILDING_TILE;
      const caY = b.tileY * BUILDING_TILE;
      const w = b.tileW * BUILDING_TILE;
      const h = b.tileH * BUILDING_TILE;

      const frameColor = FRAME_COLORS[b.buildingId] || '#ffffff';

      // Emissive glow for Plasma Forge & Catalyst Chamber
      if (b.buildingId === 'processor_plasma_forge' || b.buildingId === 'processor_catalyst_chamber') {
        ctx.shadowBlur = 8;
        ctx.shadowColor = frameColor;
      }

      // Selected building white outer glow
      if (isSelected) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ffffff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(2, 3 / zoom);
        ctx.strokeRect(caX, caY, w, h);
      }

      // Building Outline Frame (Transparent interior)
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = Math.max(1.5, 2 / zoom);
      ctx.strokeRect(caX + 0.5, caY + 0.5, w - 1, h - 1);
      ctx.shadowBlur = 0; // reset shadow

      // Corner brackets for Collectors
      if (b.category === BuildingCategory.COLLECTOR) {
        this.drawCornerBrackets(ctx, caX, caY, w, h, Math.min(4, w * 0.25));
      }

      // Short Label in top-left corner
      if (options.showBuildingLabels) {
        ctx.fillStyle = frameColor;
        ctx.font = `bold ${Math.max(2.5, 7 / zoom)}px monospace`;
        ctx.fillText(def.shortLabel, caX + 2, caY + Math.max(4, 9 / zoom));
      }

      // Render Sockets on perimeter
      this.renderSockets(ctx, b, zoom);

      ctx.restore();
    }
  }

  private drawCornerBrackets(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    len: number
  ) {
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(x, y + len);
    ctx.lineTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(x + w - len, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + len);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(x, y + h - len);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + len, y + h);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(x + w - len, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - len);
    ctx.stroke();

    ctx.restore();
  }

  private renderSockets(
    ctx: CanvasRenderingContext2D,
    b: BuildingInstance,
    zoom: number
  ) {
    const socketSize = Math.max(2.0, 5 / zoom);

    for (const socket of b.sockets) {
      // Calculate center position in CA coordinates
      let sockX = b.x + socket.dtx * BUILDING_TILE;
      let sockY = b.y + socket.dty * BUILDING_TILE;

      const isConnected = Boolean(b.connected[socket.id]);
      const primaryState = socket.acceptedStates[0] || 'solid';
      const stateColor = SOCKET_STATE_COLORS[primaryState] || '#7ab8d4';

      ctx.save();

      // Unconnected: 60% opacity; Connected: 100% opacity + 2px white border
      ctx.globalAlpha = isConnected ? 1.0 : 0.6;
      ctx.fillStyle = stateColor;

      const drawX = sockX - socketSize * 0.5;
      const drawY = sockY - socketSize * 0.5;

      ctx.fillRect(drawX, drawY, socketSize, socketSize);

      if (isConnected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, 2 / zoom);
        ctx.strokeRect(drawX, drawY, socketSize, socketSize);
      }

      // Check if filter has denied any compatible material for this socket
      const allowedSet = b.filter.allowed[socket.id];
      const isFiltered = allowedSet && allowedSet.size < 4; // some materials denied

      if (isFiltered) {
        // Red dot overlay on socket
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(sockX, sockY, socketSize * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderPlacementPreview(
    ctx: CanvasRenderingContext2D,
    grid: CellularGrid,
    buildingMgr: BuildingManager,
    options: RenderOptions
  ): { valid: boolean; reason?: string } | null {
    const { hoverCell, selectedDef, pipeDirection, brushMaterial, brushSize, structuralSolidAvailable, freeBuild, zoom } =
      options;
    if (!hoverCell) return null;

    const { x, y } = hoverCell;

    if (brushMaterial !== null && brushMaterial !== undefined) {
      // Paint brush preview
      const radius = brushSize || 1;
      const def = MATERIAL_DEFS[brushMaterial];
      ctx.fillStyle = def ? def.color : '#ffffff';
      ctx.globalAlpha = 0.4;
      for (let dy = -radius + 1; dy < radius; dy++) {
        for (let dx = -radius + 1; dx < radius; dx++) {
          if (dx * dx + dy * dy < radius * radius) {
            ctx.fillRect(x + dx, y + dy, 1, 1);
          }
        }
      }
      ctx.globalAlpha = 1.0;
      return null;
    }

    if (selectedDef) {
      const def = selectedDef;
      // Snap to tile grid boundaries
      const snapTx = Math.max(0, Math.min(TILES_X - def.tileW, Math.floor(x / BUILDING_TILE)));
      const snapTy = Math.max(0, Math.min(TILES_Y - def.tileH, Math.floor(y / BUILDING_TILE)));

      const caX = snapTx * BUILDING_TILE;
      const caY = snapTy * BUILDING_TILE;
      const caW = def.tileW * BUILDING_TILE;
      const caH = def.tileH * BUILDING_TILE;

      const placementCheck = buildingMgr.canPlaceBuilding(grid, def, snapTx, snapTy);
      let valid = placementCheck.valid;
      let reason = placementCheck.reason;

      // Resource cost check
      if (valid && !freeBuild && (structuralSolidAvailable ?? 0) < def.cost) {
        valid = false;
        reason = `Need ${def.cost} Structural Solid`;
      }

      ctx.save();

      if (valid) {
        // Valid Placement: transparent interior, 50% opacity green outline border + socket markers
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = Math.max(1.5, 2 / zoom);
        ctx.strokeRect(caX + 0.5, caY + 0.5, caW - 1, caH - 1);

        // Render Sockets on ghost preview
        for (const socket of def.sockets) {
          const sockX = caX + socket.dtx * BUILDING_TILE;
          const sockY = caY + socket.dty * BUILDING_TILE;
          const stateColor = SOCKET_STATE_COLORS[socket.acceptedStates[0] || 'solid'] || '#7ab8d4';
          const socketSize = Math.max(2.0, 5 / zoom);

          ctx.fillStyle = stateColor;
          ctx.fillRect(sockX - socketSize * 0.5, sockY - socketSize * 0.5, socketSize, socketSize);
        }

        // Pipe preview arrow
        if (def.category === BuildingCategory.PIPE) {
          const dir = pipeDirection || 'DOWN';
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          const cx = caX + caW * 0.5;
          const cy = caY + caH * 0.5;
          const arrowRadius = 2.0;
          switch (dir) {
            case 'UP':
              ctx.moveTo(cx, cy - arrowRadius);
              ctx.lineTo(cx - arrowRadius, cy + arrowRadius);
              ctx.lineTo(cx + arrowRadius, cy + arrowRadius);
              break;
            case 'DOWN':
              ctx.moveTo(cx, cy + arrowRadius);
              ctx.lineTo(cx - arrowRadius, cy - arrowRadius);
              ctx.lineTo(cx + arrowRadius, cy - arrowRadius);
              break;
            case 'LEFT':
              ctx.moveTo(cx - arrowRadius, cy);
              ctx.lineTo(cx + arrowRadius, cy - arrowRadius);
              ctx.lineTo(cx + arrowRadius, cy + arrowRadius);
              break;
            case 'RIGHT':
              ctx.moveTo(cx + arrowRadius, cy);
              ctx.lineTo(cx - arrowRadius, cy - arrowRadius);
              ctx.lineTo(cx - arrowRadius, cy + arrowRadius);
              break;
          }
          ctx.closePath();
          ctx.fill();
        }
      } else {
        // Invalid Placement: 30% red fill with red border
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(caX, caY, caW, caH);

        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = Math.max(1.5, 2 / zoom);
        ctx.strokeRect(caX + 0.5, caY + 0.5, caW - 1, caH - 1);
      }

      ctx.restore();
      return { valid, reason };
    } else {
      // Cell crosshair
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1 / zoom;
      ctx.strokeRect(x, y, 1, 1);
      return null;
    }
  }

  private renderScreenTooltip(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    text: string,
    canvasWidth: number,
    canvasHeight: number
  ) {
    ctx.save();
    ctx.font = '11px sans-serif';
    const textMetrics = ctx.measureText(text);
    const paddingX = 8;
    const paddingY = 4;
    const boxW = textMetrics.width + paddingX * 2 + 16;
    const boxH = 22;

    let drawX = Math.min(x, canvasWidth - boxW - 10);
    let drawY = Math.min(Math.max(y, 10), canvasHeight - boxH - 10);

    ctx.fillStyle = 'rgba(24, 10, 15, 0.92)';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.roundRect(drawX, drawY, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(drawX + 10, drawY + boxH / 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fecaca';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, drawX + 18, drawY + boxH / 2 + 0.5);

    ctx.restore();
  }
}
