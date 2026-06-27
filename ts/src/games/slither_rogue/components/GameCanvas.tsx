import { useRef, useEffect } from 'react';
import type { GameSession } from '../../../engine/types';
import { call } from '../../../engine/runtime';

interface PlayerRender {
  segs_x: number[]; segs_y: number[]; segs_a: number[];
  angle: number; color: string; head_color: string; radius: number;
  shield_charges: number; ghost_tail_count: number;
  magnetism_radius: number; fruit_sense_range: number;
}
interface NpcRender {
  id: string; name: string; color: string; head_color: string;
  angle: number; radius: number; hunting: boolean;
  segs_x: number[]; segs_y: number[]; segs_a: number[];
}
interface FruitRender {
  x: number; y: number; color: string; points: number;
  is_golden: boolean; pulse_phase: number;
}
interface AcidRender { x: number; y: number; radius: number; timer: number; }
interface GameEvent {
  type: string; is_golden?: boolean; score?: number;
  current_length?: number; peak_length?: number; charges?: number;
}
interface RenderState {
  player: PlayerRender; npcs: NpcRender[]; fruits: FruitRender[];
  acid_drops: AcidRender[]; time_left: number; score: number;
  peak_length: number; events: GameEvent[];
}

interface GameCanvasProps {
  session: GameSession;
  controlType: 'mouse' | 'keyboard';
  isPaused: boolean;
  activeEvolutions: Record<string, number>;
  onFruitEaten: () => void;
  onUpdateMetrics: (m: { currentLength: number; peakLength: number; score: number }) => void;
  onGameOver: () => void;
  onTick: (timeLeft: number) => void;
  onShieldConsumed: () => void;
}

const MAP_W = 2600, MAP_H = 2600;

export default function GameCanvas({
  session, controlType, isPaused, activeEvolutions,
  onFruitEaten, onUpdateMetrics, onGameOver, onTick, onShieldConsumed,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const stateRef     = useRef({
    mouseX: 0, mouseY: 0, keys: {} as Record<string, boolean>,
    lastTime: 0, dims: { w: 800, h: 600 }, initialized: false,
  });

  useEffect(() => {
    const data = session.files.data as Record<string, unknown>;
    call(session, 'init_game', {
      arena:             data['arena'],
      fruit:             data['fruit'],
      player_stats:      data['player_stats'],
      player_preset:     (data['player_presets'] as unknown[])[0],
      npc_profiles:      data['npc_profiles'],
      npc_stats:         data['npc_stats'],
      evolution_cards:   data['evolution_cards'],
      active_evolutions: activeEvolutions,
      game_duration:     300,
    });
    stateRef.current.initialized = true;
  }, []);

  useEffect(() => {
    if (!stateRef.current.initialized) return;
    call(session, 'update_evolution_effects', activeEvolutions);
  }, [activeEvolutions]);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr  = window.devicePixelRatio || 1;
      canvasRef.current.width  = rect.width  * dpr;
      canvasRef.current.height = rect.height * dpr;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      stateRef.current.dims = { w: rect.width, h: rect.height };
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const r = canvasRef.current.getBoundingClientRect();
      stateRef.current.mouseX = e.clientX - r.left - stateRef.current.dims.w / 2;
      stateRef.current.mouseY = e.clientY - r.top  - stateRef.current.dims.h / 2;
    };
    const onDown = (e: KeyboardEvent) => { stateRef.current.keys[e.key.toLowerCase()] = true; };
    const onUp   = (e: KeyboardEvent) => { stateRef.current.keys[e.key.toLowerCase()] = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  useEffect(() => {
    let animId: number;
    const loop = (ts: number) => {
      const s  = stateRef.current;
      const dt = Math.min((ts - (s.lastTime || ts)) / 1000, 0.1);
      s.lastTime = ts;

      if (!isPaused && s.initialized && canvasRef.current) {
        const rs = call(session, 'tick_game', dt, {
          control_type: controlType,
          mouse_x: s.mouseX,
          mouse_y: s.mouseY,
          keys: {
            w: !!s.keys['w'], s: !!s.keys['s'], a: !!s.keys['a'], d: !!s.keys['d'],
            arrowup:    !!s.keys['arrowup'],   arrowdown:  !!s.keys['arrowdown'],
            arrowleft:  !!s.keys['arrowleft'], arrowright: !!s.keys['arrowright'],
          },
        }) as RenderState;

        for (const ev of (rs.events || [])) {
          if (ev.type === 'fruit_eaten') {
            onFruitEaten();
            onUpdateMetrics({
              currentLength: ev.current_length ?? 0,
              peakLength:    ev.peak_length ?? 0,
              score:         ev.score ?? 0,
            });
          } else if (ev.type === 'metrics_update') {
            onUpdateMetrics({
              currentLength: ev.current_length ?? 0,
              peakLength:    ev.peak_length ?? 0,
              score:         rs.score,
            });
          } else if (ev.type === 'shield_consumed') {
            onShieldConsumed();
          } else if (ev.type === 'game_over') {
            onGameOver();
          }
        }

        onTick(rs.time_left);
        drawGame(canvasRef.current, rs, s.dims);
      }

      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, controlType]);

  return (
    <div ref={containerRef} className="sr-canvas-wrap">
      <canvas ref={canvasRef} className="sr-canvas" />
    </div>
  );
}

function drawGame(canvas: HTMLCanvasElement, rs: RenderState, dims: { w: number; h: number }) {
  const ctx = canvas.getContext('2d');
  if (!ctx || !rs.player) return;

  const px = rs.player.segs_x, py = rs.player.segs_y;
  if (!px || px.length === 0) return;

  const headX = px[0], headY = py[0];
  const camX  = dims.w / 2 - headX;
  const camY  = dims.h / 2 - headY;

  ctx.clearRect(0, 0, dims.w, dims.h);
  ctx.save();
  ctx.translate(camX, camY);

  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, MAP_W, MAP_H);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let x = 0; x <= MAP_W; x += 100) { ctx.moveTo(x, 0); ctx.lineTo(x, MAP_H); }
  for (let y = 0; y <= MAP_H; y += 100) { ctx.moveTo(0, y); ctx.lineTo(MAP_W, y); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(16,185,129,0.4)';
  ctx.lineWidth = 6;
  ctx.shadowColor = '#10b981'; ctx.shadowBlur = 15;
  ctx.strokeRect(0, 0, MAP_W, MAP_H);
  ctx.shadowBlur = 0;

  for (const d of (rs.acid_drops || [])) {
    ctx.fillStyle = 'rgba(249,115,22,0.22)';
    ctx.beginPath(); ctx.arc(d.x, d.y, d.radius + 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(249,115,22,0.7)';
    ctx.beginPath(); ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2); ctx.fill();
  }

  const now = Date.now();
  for (const f of (rs.fruits || [])) {
    const pulse = 1 + Math.sin(now * 0.006 + (f.pulse_phase || 0)) * 0.12;
    const r = (f.is_golden ? 12 : 8) * pulse;
    ctx.save();
    ctx.shadowColor = f.color; ctx.shadowBlur = f.is_golden ? 18 : 10;
    ctx.fillStyle = f.color;
    ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (f.is_golden) {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(f.x, f.y, r * 0.4, 0, Math.PI * 2); ctx.fill();
    }
  }

  for (const npc of (rs.npcs || [])) {
    const sx = npc.segs_x, sy = npc.segs_y;
    if (!sx || sx.length === 0) continue;
    ctx.strokeStyle = npc.color; ctx.lineWidth = npc.radius;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < sx.length; i++) {
      i === 0 ? ctx.moveTo(sx[i], sy[i]) : ctx.lineTo(sx[i], sy[i]);
    }
    ctx.stroke();
    ctx.fillStyle = npc.head_color;
    ctx.beginPath(); ctx.arc(sx[0], sy[0], npc.radius * 1.3, 0, Math.PI * 2); ctx.fill();
    _drawEyes(ctx, sx[0], sy[0], npc.angle, npc.radius, false);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
    ctx.fillText(npc.name, sx[0], sy[0] - npc.radius * 2);
  }

  const p = rs.player;
  const r = p.radius;
  ctx.strokeStyle = p.color; ctx.lineWidth = r * 1.2;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < px.length; i++) {
    i === 0 ? ctx.moveTo(px[i], py[i]) : ctx.lineTo(px[i], py[i]);
  }
  ctx.stroke();

  for (let i = 1; i < px.length; i++) {
    const ghost = (p.ghost_tail_count || 0) > 0 && i >= px.length - p.ghost_tail_count;
    ctx.save();
    if (ghost) ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#0b0f19';
    ctx.strokeStyle = ghost ? '#6366f1' : p.color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(px[i], py[i], r * 0.9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = ghost ? '#818cf8' : '#fff';
    ctx.beginPath(); ctx.arc(px[i], py[i], r * 0.3, 0, Math.PI * 2); ctx.fill();
    if ((p.shield_charges || 0) > 0 && !ghost && i % 2 === 1) {
      ctx.strokeStyle = 'rgba(52,211,153,0.55)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(px[i], py[i], r * 1.4, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  ctx.fillStyle = p.head_color;
  ctx.beginPath(); ctx.arc(headX, headY, r * 1.45, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(headX, headY, r * 1.45, 0, Math.PI * 2); ctx.stroke();
  _drawEyes(ctx, headX, headY, p.angle, r, true);

  if ((p.magnetism_radius || 0) > 0) {
    ctx.strokeStyle = 'rgba(14,165,233,0.12)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(headX, headY, p.magnetism_radius, 0, Math.PI * 2); ctx.stroke();
  }

  ctx.restore();

  if ((p.fruit_sense_range || 0) > 0) {
    for (const f of (rs.fruits || [])) {
      const dx = f.x - headX, dy = f.y - headY;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d > 300 && d <= p.fruit_sense_range) {
        const ang = Math.atan2(dy, dx);
        const pr  = Math.min(dims.w, dims.h) / 2 - 35;
        const ax  = dims.w / 2 + Math.cos(ang) * pr;
        const ay  = dims.h / 2 + Math.sin(ang) * pr;
        ctx.save();
        ctx.translate(ax, ay); ctx.rotate(ang);
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.moveTo(8, 0); ctx.lineTo(-6, -6); ctx.lineTo(-2, 0); ctx.lineTo(-6, 6);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
  }
}

function _drawEyes(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, angle: number, r: number, isPlayer: boolean
) {
  const off = 0.52, dist = r * 0.85;
  const lx = x + Math.cos(angle - off) * dist, ly = y + Math.sin(angle - off) * dist;
  const rx = x + Math.cos(angle + off) * dist, ry = y + Math.sin(angle + off) * dist;
  const er = isPlayer ? 4.2 : 3.5;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(lx, ly, er, 0, Math.PI * 2); ctx.arc(rx, ry, er, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = isPlayer ? '#0f172a' : '#ef4444';
  const pr = isPlayer ? 2.0 : 1.5;
  ctx.beginPath();
  ctx.arc(lx + Math.cos(angle) * 1.5, ly + Math.sin(angle) * 1.5, pr, 0, Math.PI * 2);
  ctx.arc(rx + Math.cos(angle) * 1.5, ry + Math.sin(angle) * 1.5, pr, 0, Math.PI * 2);
  ctx.fill();
}
