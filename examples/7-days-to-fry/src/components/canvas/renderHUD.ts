/**
 * @file src/components/canvas/renderHUD.ts
 * Canvas HUD overlay rendering: Demand Tier and Shift Timer panels.
 * Policy Dial panel is omitted per directive §0 (relocated to NightScreen).
 */

import { HUD_RECTS, STOCK_UNITS_CAPACITY } from '../../data';
import { getAvailableAttention } from '../../scoring/taskSelection';
import { KitchenState } from '../../types';

export function renderHUD(ctx: CanvasRenderingContext2D, kState: KitchenState): void {
  ctx.save();

  // 1. Demand Tier & Timer Panel
  const dtRect = HUD_RECTS.demandTimer;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(dtRect.x, dtRect.y, dtRect.width, dtRect.height, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  const curDemand = (kState.demandTier || 1).toFixed(1);
  ctx.fillText(`Demand Tier ${curDemand}`, dtRect.x + 10, dtRect.y + 18);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '10px monospace';
  ctx.fillText(`Store Tier ${kState.storeTier || 1}`, dtRect.x + 10, dtRect.y + 32);

  // 2. Shift Timer Panel
  const dayRect = HUD_RECTS.dayTimer;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(dayRect.x, dayRect.y, dayRect.width, dayRect.height, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Shift Timer', dayRect.x + 10, dayRect.y + 18);

  const remainingSec = Math.max(0, Math.ceil(kState.dayDurationSeconds - kState.dayElapsedSeconds));
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '10px monospace';
  ctx.fillText(`Day: ${remainingSec}s`, dayRect.x + 10, dayRect.y + 32);

  // 3. Stock Units Badge
  const stockX = 456;
  const stockY = 12;
  const stockWidth = 135;
  const stockHeight = 42;

  const currentStock = kState.stockUnits ?? STOCK_UNITS_CAPACITY;
  let stockColor = '#10b981';
  if (currentStock <= 0) stockColor = '#ef4444';
  else if (currentStock <= 2) stockColor = '#f59e0b';

  ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
  ctx.strokeStyle = stockColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(stockX, stockY, stockWidth, stockHeight, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = stockColor;
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Stock Units', stockX + 10, stockY + 18);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 12px monospace';
  const totalStockCap = STOCK_UNITS_CAPACITY + (kState.stockCapacityBonus || 0);
  ctx.fillText(`${currentStock} / ${totalStockCap}`, stockX + 10, stockY + 32);

  // 4. Attention Readout Panel
  const attX = 601;
  const attY = 12;
  const attWidth = 110;
  const attHeight = 42;

  const attention = getAvailableAttention(kState.manager);
  let attColor = '#3b82f6';
  if (attention === 3) attColor = '#10b981';
  else if (attention === 2) attColor = '#3b82f6';
  else if (attention === 1) attColor = '#f59e0b';
  else attColor = '#ef4444';

  ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
  ctx.strokeStyle = attColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(attX, attY, attWidth, attHeight, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = attColor;
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Attention', attX + 10, attY + 18);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(`${attention} / 3`, attX + 10, attY + 32);

  // 4. Out of Stock Banner when stockUnits <= 0
  if (currentStock <= 0) {
    ctx.fillStyle = 'rgba(220, 38, 38, 0.95)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(180, 215, 440, 45, 10);
    ctx.fill();
    ctx.stroke();

    const remainingSec = Math.max(0, Math.ceil(4 - (kState.stockDepletedSeconds || 0)));
    const bannerMsg = remainingSec > 0
      ? `⚠️ OUT OF STOCK — Auto-restocking in ${remainingSec}s...`
      : `⚠️ OUT OF STOCK — Unloading Truck...`;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bannerMsg, 400, 237);
  }

  ctx.restore();
}
