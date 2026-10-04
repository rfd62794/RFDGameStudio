// components/render.ts — canvas drawing for the coin pusher board.
//
// Ported 1:1 from the example's render block; takes a 2D context plus the
// plain BoardState the logic module maintains.

import type { BoardTheme, LevelSettings } from '../types';
import type { BoardState } from '../logic/physics';
import { FALL_LINE_Y, PUSHER_MIN_Y } from '../logic/physics';

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  state: BoardState,
  level: LevelSettings,
  theme: BoardTheme,
  mouseHoverX: number | null
): void {
  ctx.save();

  // Screenshake
  if (state.screenshake > 0) {
    const dx = (Math.random() - 0.5) * state.screenshake;
    const dy = (Math.random() - 0.5) * state.screenshake;
    ctx.translate(dx, dy);
  }

  // Background
  ctx.fillStyle = theme.bgColor;
  ctx.fillRect(0, 0, level.boardWidth, 500);

  // Depth grid: converging verticals + horizontal guides
  ctx.strokeStyle = `${theme.accentColor}18`;
  ctx.lineWidth = 1;
  const cols = 10;
  for (let i = 0; i <= cols; i++) {
    const ratio = i / cols;
    const topX = level.gutterWidth + ratio * (level.boardWidth - level.gutterWidth * 2);
    const bottomX = ratio * level.boardWidth;
    ctx.beginPath();
    ctx.moveTo(topX, 10);
    ctx.lineTo(bottomX, 460);
    ctx.stroke();
  }
  const rows = 8;
  for (let i = 0; i <= rows; i++) {
    const y = 10 + (450 / rows) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(level.boardWidth, y);
    ctx.stroke();
  }

  // Gutter lanes + caution stripes
  const leftGutterX = level.gutterWidth;
  const rightGutterX = level.boardWidth - level.gutterWidth;

  ctx.save();
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(0, 0, leftGutterX, 460);
  ctx.fillRect(rightGutterX, 0, level.boardWidth - rightGutterX, 460);

  ctx.strokeStyle = '#e11d4822';
  ctx.lineWidth = 12;
  ctx.setLineDash([10, 15]);
  ctx.beginPath();
  ctx.moveTo(leftGutterX / 2, 0);
  ctx.lineTo(leftGutterX / 2, 460);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(rightGutterX + (level.boardWidth - rightGutterX) / 2, 0);
  ctx.lineTo(rightGutterX + (level.boardWidth - rightGutterX) / 2, 460);
  ctx.stroke();
  ctx.restore();

  // Active gutter shields
  if (state.gutterShieldTimer > 0) {
    ctx.save();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 8;
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.moveTo(leftGutterX, 10);
    ctx.lineTo(leftGutterX, 458);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightGutterX, 10);
    ctx.lineTo(rightGutterX, 458);
    ctx.stroke();
    ctx.restore();
  }

  // Pusher shadow + plate + lip
  const shadowHeight = Math.max(5, (state.pusherY - PUSHER_MIN_Y) * 0.35);
  const gradientShadow = ctx.createLinearGradient(0, state.pusherY, 0, state.pusherY + shadowHeight);
  gradientShadow.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  gradientShadow.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = gradientShadow;
  ctx.fillRect(level.gutterWidth, state.pusherY, level.boardWidth - level.gutterWidth * 2, shadowHeight);

  const gradPusher = ctx.createLinearGradient(0, 0, 0, state.pusherY);
  gradPusher.addColorStop(0, '#1f2937');
  gradPusher.addColorStop(0.7, theme.pusherColor);
  gradPusher.addColorStop(1, '#374151');
  ctx.fillStyle = gradPusher;
  ctx.fillRect(level.gutterWidth, 0, level.boardWidth - level.gutterWidth * 2, state.pusherY);

  ctx.fillStyle = theme.accentColor;
  ctx.shadowColor = theme.accentColor;
  ctx.shadowBlur = 8;
  ctx.fillRect(level.gutterWidth, state.pusherY - 3, level.boardWidth - level.gutterWidth * 2, 3);
  ctx.shadowBlur = 0;

  // Board objects
  for (const obj of state.objects) {
    ctx.save();
    const pulse = obj.pulseTimer ? 1.0 + (obj.pulseTimer / 10) * 0.3 : 1.0;
    const currentRadius = obj.radius * pulse;

    if (obj.type === 'bumper') {
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(obj.x, obj.y, currentRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fdf2f8';
      ctx.beginPath();
      ctx.arc(obj.x, obj.y, currentRadius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (obj.type === 'multiplier') {
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(obj.x, obj.y, currentRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(obj.x, obj.y, currentRadius * 0.75, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#eab308';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('2x', obj.x, obj.y);
    } else if (obj.type === 'tower') {
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(obj.x, obj.y, currentRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fff7ed';
      ctx.lineWidth = 2;
      const h = obj.health || 1;
      for (let l = 0; l < h; l++) {
        ctx.beginPath();
        ctx.arc(obj.x, obj.y - l * 5, currentRadius - 2, 0, Math.PI * 2);
        ctx.fillStyle = l === h - 1 ? '#ffedd5' : '#fed7aa';
        ctx.fill();
        ctx.stroke();
      }

      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`♥${h}`, obj.x, obj.y - h * 5);
    } else {
      // Regular peg
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(obj.x - 1.5, obj.y - 1.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Active coins
  for (const c of state.coins) {
    ctx.save();
    const r = c.radius * (c.scale ?? 1.0);
    const opacity = c.alpha ?? 1.0;

    ctx.globalAlpha = opacity;

    if (c.glow) {
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 12;
    }

    // Metallic bezel
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.fillStyle = c.borderColor;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Inner core
    ctx.beginPath();
    ctx.arc(c.x, c.y, r * 0.75, 0, Math.PI * 2);
    ctx.fillStyle = c.color;
    ctx.fill();

    // 3D shine arcs
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(c.x, c.y, r * 0.55, Math.PI * 1.1, Math.PI * 1.6);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.arc(c.x, c.y, r * 0.55, Math.PI * 0.1, Math.PI * 0.6);
    ctx.stroke();

    // Per-type glyph
    ctx.fillStyle = c.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (c.typeId === 'tnt') {
      ctx.font = 'bold 10px monospace';
      ctx.fillText('💣', c.x, c.y + 0.5);
    } else if (c.typeId === 'magnet') {
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('🧲', c.x, c.y + 0.5);
    } else if (c.typeId === 'double_drop') {
      ctx.font = 'bold 9px monospace';
      ctx.fillText('+D', c.x, c.y + 0.5);
    } else if (c.typeId === 'giga_gold') {
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('🌟', c.x, c.y + 1);
    } else if (c.typeId === 'steel') {
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('S', c.x, c.y + 0.5);
    } else if (c.typeId === 'emerald') {
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('🍀', c.x, c.y + 0.5);
    } else if (c.typeId === 'ruby') {
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('♦', c.x, c.y + 0.5);
    } else if (c.typeId === 'cosmic') {
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('🌌', c.x, c.y + 0.5);
    } else {
      ctx.font = '9px monospace';
      ctx.fillText('★', c.x, c.y + 0.5);
    }

    ctx.restore();
  }

  // Particles
  for (const p of state.particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.beginPath();
    ctx.moveTo(0, -p.size);
    ctx.lineTo(p.size, 0);
    ctx.lineTo(0, p.size);
    ctx.lineTo(-p.size, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Coin bird
  if (state.birdActive) {
    ctx.save();
    ctx.shadowColor = '#0ea5e9';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#0ea5e9';

    ctx.beginPath();
    ctx.arc(state.birdX, state.birdY, 15, 0, Math.PI * 2);
    ctx.fill();

    const flap = Math.sin(state.time * 8) * 12;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(state.birdX - 5, state.birdY, 8, Math.abs(flap), 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(state.birdX + 5, state.birdY - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(state.birdX + 13, state.birdY);
    ctx.lineTo(state.birdX + 18, state.birdY + 3);
    ctx.lineTo(state.birdX + 13, state.birdY + 6);
    ctx.fill();

    ctx.restore();
  }

  // Floating texts
  for (const t of state.floatingTexts) {
    ctx.save();
    ctx.globalAlpha = t.alpha;
    ctx.fillStyle = t.color;
    ctx.font = `bold ${t.size}px monospace`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
  }

  // Drop placement hover guide
  if (mouseHoverX !== null) {
    ctx.save();
    const dropPadding = level.gutterWidth + 15;
    const validRange = mouseHoverX >= dropPadding && mouseHoverX <= level.boardWidth - dropPadding;

    if (validRange) {
      ctx.strokeStyle = `${theme.accentColor}33`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 8]);
      ctx.beginPath();
      ctx.moveTo(mouseHoverX, 10);
      ctx.lineTo(mouseHoverX, 450);
      ctx.stroke();

      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.arc(mouseHoverX, 15, 14, 0, Math.PI * 2);
      ctx.fillStyle = theme.accentColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  // Front ledge rim
  ctx.save();
  ctx.fillStyle = theme.accentColor;
  ctx.shadowColor = theme.accentColor;
  ctx.shadowBlur = 12;
  ctx.fillRect(level.gutterWidth, FALL_LINE_Y, level.boardWidth - level.gutterWidth * 2, 4);
  ctx.restore();

  ctx.restore(); // screenshake translate
}
