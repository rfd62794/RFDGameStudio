import React, { useRef, useEffect } from 'react';
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
    ctx.fillRect(50, 50, 400, 200);
    
    // Draw shelf edge
    ctx.strokeStyle = '#4a4a6a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, 250);
    ctx.lineTo(450, 250);
    ctx.stroke();
    
    // Draw lower floor (foreground layer)
    ctx.fillStyle = '#252538';
    ctx.fillRect(50, 280, 400, 150);
    
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
        drawCoin(ctx, coin, 50, 50);
      }
    }
    
    // Draw floor coins
    if (renderState.floor_coins) {
      for (const coin of renderState.floor_coins) {
        drawCoin(ctx, coin, 50, 280);
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

  }, [renderState]);
  
  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={500}
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
