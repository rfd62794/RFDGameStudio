/**
 * @file src/components/canvas/renderWorkers.ts
 * Worker rendering logic: circles, faces, stamina bars, thought bubbles, meal icons.
 */

import {
  MEAL_PORTION_SIZE,
  SHADOW_BLUR,
  SHADOW_COLOR,
  SHADOW_OFFSET_X,
  SHADOW_OFFSET_Y,
  WARM_OUTLINE_COLOR,
  WORKER_RADIUS,
} from '../../data';
import { KitchenState, Worker } from '../../types';
import { getWorkerFacialExpression } from '../../scoring/facialExpressions';

export function renderWorker(ctx: CanvasRenderingContext2D, w: Worker, kState?: KitchenState): void {
  const speed = Math.sqrt(w.vx * w.vx + w.vy * w.vy);

  // Worker Body Circle
  ctx.save();
  ctx.shadowColor = SHADOW_COLOR;
  ctx.shadowOffsetX = SHADOW_OFFSET_X;
  ctx.shadowOffsetY = SHADOW_OFFSET_Y;
  ctx.shadowBlur = SHADOW_BLUR;

  ctx.fillStyle = w.color;
  ctx.beginPath();
  ctx.arc(w.x, w.y, WORKER_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = WARM_OUTLINE_COLOR;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Direction Pointer
  if (speed > 5) {
    const angle = Math.atan2(w.vy, w.vx);
    const px = w.x + Math.cos(angle) * (WORKER_RADIUS + 4);
    const py = w.y + Math.sin(angle) * (WORKER_RADIUS + 4);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Worker Facial Expression
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(getWorkerFacialExpression(w), w.x, w.y);

  // Personal Meal Icon
  if (w.currentMeal && w.currentMeal.unitsRemaining > 0) {
    const portionRatio = Math.max(0, Math.min(1, w.currentMeal.unitsRemaining / MEAL_PORTION_SIZE));
    const mealX = w.x + 18;
    const mealY = w.y - 18;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(mealX, mealY, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(mealX, mealY, 8 * portionRatio, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍲', mealX, mealY);
    ctx.restore();
  }

  // Worker Name Tag
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText(w.name, w.x, w.y + WORKER_RADIUS + 12);

  // Stamina Bar
  const barW = 28;
  const barH = 4;
  const barX = w.x - barW / 2;
  const barY = w.y + WORKER_RADIUS + 18;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(barX, barY, barW, barH);

  const stamColor = w.stamina > 0.5 ? '#10b981' : w.stamina > 0.25 ? '#f59e0b' : '#ef4444';
  ctx.fillStyle = stamColor;
  ctx.fillRect(barX, barY, barW * w.stamina, barH);

  // Task Progress Ring
  if (w.taskProgress > 0 && w.currentStation) {
    ctx.strokeStyle = w.currentTask === 'corner_cut' ? '#f59e0b' : '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      w.x,
      w.y,
      WORKER_RADIUS + 4,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * w.taskProgress
    );
    ctx.stroke();
  }

  // Thought Bubble / Task Badge
  const bubbleY = w.y - WORKER_RADIUS - 16;
  ctx.font = 'bold 10px sans-serif';

  let bubbleText = 'Protocol';
  let bubbleBg = '#3b82f6';
  let textColor = '#ffffff';

  if (w.currentTask === 'corner_cut') {
    bubbleText = '⚡ Corner-Cut';
    bubbleBg = '#f59e0b';
    textColor = '#0f172a';
  } else if (w.currentTask === 'rest') {
    bubbleText = '☕ Rest';
    bubbleBg = '#8b5cf6';
    textColor = '#ffffff';
  } else if (w.currentTask === 'eat_meal') {
    bubbleText = '🍲 Staff Meal';
    bubbleBg = '#10b981';
    textColor = '#ffffff';
  } else {
    bubbleText = '✓ Protocol';
  }

  const textMetrics = ctx.measureText(bubbleText);
  const bubbleW = textMetrics.width + 12;
  const bubbleH = 16;

  ctx.fillStyle = bubbleBg;
  ctx.beginPath();
  ctx.roundRect(w.x - bubbleW / 2, bubbleY - bubbleH / 2, bubbleW, bubbleH, 8);
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(bubbleText, w.x, bubbleY);

  // Caution Icon Badge for Corner-Cutting Workers
  if (w.currentTask === 'corner_cut') {
    const cautionY = bubbleY - 18;
    ctx.font = 'bold 9px sans-serif';
    const cautionText = '👋 Check In';
    const cMetrics = ctx.measureText(cautionText);
    const cW = cMetrics.width + 10;
    const cH = 14;

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(w.x - cW / 2, cautionY - cH / 2, cW, cH, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cautionText, w.x, cautionY);

    if (kState && !kState.hasSeenCautionHint) {
      // Real, subtle pulse/glow — additive to existing rendering, not a replacement
      ctx.save();
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8 + Math.sin(kState.elapsedSeconds * 4) * 4; // real, gentle pulse
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(w.x - cW / 2 - 2, cautionY - cH / 2 - 2, cW + 4, cH + 4, 8);
      ctx.stroke();
      ctx.restore();
    }
  }
}

export function renderWorkers(ctx: CanvasRenderingContext2D, workers: Worker[], kState?: KitchenState): void {
  for (const w of workers) {
    renderWorker(ctx, w, kState);
  }
}
