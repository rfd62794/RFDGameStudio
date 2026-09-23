/**
 * @file src/components/canvas/renderCustomers.ts
 * Customer rendering logic: queue lines, quality-reactive faces, entrance/exit markers.
 */

import { ENTRANCE_POS, EXIT_POS, SHADOW_BLUR, SHADOW_COLOR, SHADOW_OFFSET_X, SHADOW_OFFSET_Y, WARM_OUTLINE_COLOR } from '../../data';
import { getCustomerFacialExpression } from '../../scoring/facialExpressions';
import { KitchenState, Order } from '../../types';

export function renderCustomers(ctx: CanvasRenderingContext2D, state: KitchenState): void {
  // Entrance / Exit markers
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🚪 ENTRANCE', ENTRANCE_POS.x, ENTRANCE_POS.y + 18);
  ctx.fillText('🚪 EXIT', EXIT_POS.x, EXIT_POS.y + 18);

  if (state.customers && state.customers.length > 0) {
    state.customers.forEach((c) => {
      ctx.save();
      ctx.shadowColor = SHADOW_COLOR;
      ctx.shadowOffsetX = SHADOW_OFFSET_X;
      ctx.shadowOffsetY = SHADOW_OFFSET_Y;
      ctx.shadowBlur = SHADOW_BLUR;

      ctx.fillStyle = c.state === 'leaving' ? '#475569' : c.state === 'receiving' ? '#0284c7' : '#64748b';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = WARM_OUTLINE_COLOR;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Customer face reaction based on paired order quality
      let order: Order | undefined;
      if (c.orderId) {
        for (const s of state.stations) {
          order = s.orders.find((o) => o.id === c.orderId);
          if (order) break;
        }
      }
      const effectiveOrder: Order = order ?? ({ quality: c.orderQuality ?? 1.0 } as Order);
      const customerFace = getCustomerFacialExpression(effectiveOrder);

      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(customerFace, c.x, c.y);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      if (c.state === 'waiting') {
        const waitingIdx = state.customers.filter((other) => other.state === 'waiting').findIndex((o) => o.id === c.id);
        ctx.fillText(`Wait #${waitingIdx + 1}`, c.x, c.y + 16);
      } else if (c.state === 'receiving') {
        ctx.fillText('Receiving', c.x, c.y + 16);
      } else {
        ctx.fillText('Leaving', c.x, c.y + 16);
      }
    });
  }
}
