import { BuildingInstance, PipeDirection, TilePos } from '../types';
import { BUILDING_TILE, SOCKET_STATE_COLORS } from './buildingDefs';
import { computeSegmentDirection } from './routing';

export function drawDirectionArrow(
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

export function drawRouteEndpoint(
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

export function drawCornerBrackets(
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

export function renderRoutePreview(
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
    drawDirectionArrow(ctx, caX, caY, size, dir, valid ? '#64748b' : '#ef4444');

    ctx.restore();
  }

  // Start and end socket indicators: bright dots at route endpoints
  if (!isAlternate && route.length > 0) {
    drawRouteEndpoint(ctx, route[0], '#22c55e', zoom); // green start
    drawRouteEndpoint(ctx, route[route.length - 1], '#f59e0b', zoom); // amber end
  }
}

export function renderSockets(
  ctx: CanvasRenderingContext2D,
  b: BuildingInstance,
  zoom: number
) {
  const socketSize = Math.max(2.0, 5 / zoom);

  for (const socket of b.sockets) {
    // Calculate center position in CA coordinates
    const sockX = b.x + socket.dtx * BUILDING_TILE;
    const sockY = b.y + socket.dty * BUILDING_TILE;

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

export function renderScreenTooltip(
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
  const boxW = textMetrics.width + paddingX * 2 + 16;
  const boxH = 22;

  const drawX = Math.min(x, canvasWidth - boxW - 10);
  const drawY = Math.min(Math.max(y, 10), canvasHeight - boxH - 10);

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
