/**
 * @file src/components/canvas/renderManager.ts
 * Manager rendering logic: supervision area glow, circle avatar, facial expressions.
 */

import { MANAGER_SUPERVISION_RADIUS } from '../../data';
import { getManagerFacialExpression } from '../../scoring/facialExpressions';
import { KitchenState } from '../../types';

export function renderManager(ctx: CanvasRenderingContext2D, state: KitchenState): void {
  const mx = state.manager.x;
  const my = state.manager.y;

  // Supervision Radius Area Glow
  const grad = ctx.createRadialGradient(mx, my, 10, mx, my, MANAGER_SUPERVISION_RADIUS);
  grad.addColorStop(0, 'rgba(59, 130, 246, 0.18)');
  grad.addColorStop(0.7, 'rgba(59, 130, 246, 0.06)');
  grad.addColorStop(1, 'rgba(59, 130, 246, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(mx, my, MANAGER_SUPERVISION_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(mx, my, MANAGER_SUPERVISION_RADIUS, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Manager Circle Avatar
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.arc(mx, my, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Facial expression
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(getManagerFacialExpression(state.manager, state), mx, my);
}
