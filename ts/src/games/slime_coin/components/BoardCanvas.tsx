import { useRef, useEffect } from 'react';
import type { SlimeCoinRenderState, SlimeCoin } from '../types';

interface BoardCanvasProps {
  renderState: SlimeCoinRenderState | null;
}

const SLIME_COLORS: Record<string, string> = {
  basic: '#4ade80',
  heavy: '#78716c',
  light: '#a5f3fc',
  sticky: '#44403c',
  dense: '#94a3b8',
  rare: '#e879f9',
  bad: '#ef4444',
};

const SHELF_TOP = 50;
const SHELF_H = 200;
const FLOOR_TOP = 280;
const FLOOR_H = 150;
const VAT_TOP = 450;
const VAT_H = 40;
const BOARD_X = 50;
const BOARD_W = 400;

export default function BoardCanvas({ renderState }: BoardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !renderState) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw upper shelf (background layer)
    ctx.fillStyle = '#2d2d44';
    ctx.fillRect(BOARD_X, SHELF_TOP, BOARD_W, SHELF_H);

    // Draw shelf edge
    ctx.strokeStyle = '#4a4a6a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(BOARD_X, SHELF_TOP + SHELF_H);
    ctx.lineTo(BOARD_X + BOARD_W, SHELF_TOP + SHELF_H);
    ctx.stroke();

    // Draw lower floor (foreground layer)
    ctx.fillStyle = '#252538';
    ctx.fillRect(BOARD_X, FLOOR_TOP, BOARD_W, FLOOR_H);
    
    // Draw pusher
    const pusherX = 250 + Math.sin(renderState.pusher_phase) * 50;
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(pusherX - 30, 40, 60, 20);
    
    // Draw obstacles
    if (renderState.obstacles) {
      for (const obs of renderState.obstacles) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Draw shelf coins
    if (renderState.shelf_coins) {
      for (const coin of renderState.shelf_coins) {
        drawCoin(ctx, coin, BOARD_X, SHELF_TOP);
      }
    }

    // Draw floor coins
    if (renderState.floor_coins) {
      for (const coin of renderState.floor_coins) {
        drawCoin(ctx, coin, BOARD_X, FLOOR_TOP);
      }
    }

    // Vat background
    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(BOARD_X, VAT_TOP, BOARD_W, VAT_H);

    // Vat label
    ctx.fillStyle = '#4ade80';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('VAT', BOARD_X + 6, VAT_TOP + 14);

    // Vat lip (glowing front edge of floor)
    ctx.fillStyle = '#4ade80';
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 8;
    ctx.fillRect(BOARD_X, FLOOR_TOP + FLOOR_H - 3, BOARD_W, 3);
    ctx.shadowBlur = 0;

    // Vat coins (small filled circles, left to right)
    if (renderState.vat_coins) {
      let vx = BOARD_X + 12;
      for (const coin of renderState.vat_coins) {
        const color = SLIME_COLORS[coin.type_id] || '#4ade80';
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(vx, VAT_TOP + VAT_H / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        vx += 16;
        if (vx > BOARD_X + BOARD_W - 12) break;
      }
    }

    // Draw combo indicator
    if (renderState.combo_count > 0) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`Combo: ${renderState.combo_count}`, 470, 100);
    }

    // Left-side shooter indicator (top-left of shelf, fires RIGHT)
    // Visually positioned at LEFT edge of shelf — player presses RIGHT arrow
    ctx.fillStyle = '#8b5cf6';
    ctx.beginPath();
    ctx.arc(60, 70, 12, 0, Math.PI * 2);
    ctx.fill();
    // Arrow pointing right
    ctx.strokeStyle = '#c4b5fd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(72, 70);
    ctx.lineTo(88, 70);
    ctx.lineTo(83, 65);
    ctx.moveTo(88, 70);
    ctx.lineTo(83, 75);
    ctx.stroke();

    // Right-side shooter indicator (top-right of shelf, fires LEFT)
    // Player presses LEFT arrow
    ctx.fillStyle = '#8b5cf6';
    ctx.beginPath();
    ctx.arc(440, 70, 12, 0, Math.PI * 2);
    ctx.fill();
    // Arrow pointing left
    ctx.strokeStyle = '#c4b5fd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(428, 70);
    ctx.lineTo(412, 70);
    ctx.lineTo(417, 65);
    ctx.moveTo(412, 70);
    ctx.lineTo(417, 75);
    ctx.stroke();

    // Shot queue — centered between shooters
    if (renderState.shot_queue && renderState.shot_queue.length > 0) {
      const queueX = 160;
      const queueY = 70;
      const visible = renderState.shot_queue.slice(0, 5);

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(queueX - 8, queueY - 20, visible.length * 36 + 16, 40);

      visible.forEach((typeId, i) => {
        const color = SLIME_COLORS[typeId] || '#4ade80';
        const cx = queueX + i * 36;
        const r = i === 0 ? 14 : 10;
        ctx.fillStyle = color;
        ctx.globalAlpha = i === 0 ? 1.0 : 0.6;
        ctx.beginPath();
        ctx.arc(cx, queueY, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        if (i === 0) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('NEXT', cx, queueY + 22);
        }
      });
    }

  }, [renderState]);
  
  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={510}
      className="sc-board-canvas"
    />
  );
}

function drawCoin(ctx: CanvasRenderingContext2D, coin: SlimeCoin, offsetX: number, offsetY: number) {
  const color = SLIME_COLORS[coin.type_id] || '#4ade80';
  
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(offsetX + coin.x, offsetY + coin.y, coin.radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.arc(offsetX + coin.x - coin.radius * 0.3, offsetY + coin.y - coin.radius * 0.3, coin.radius * 0.3, 0, Math.PI * 2);
  ctx.fill();
}
