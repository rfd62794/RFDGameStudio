import { useState, useRef, useEffect } from 'react';
import { call } from '../../engine/runtime';
import { useGameLoop } from '../../hooks';
import { GameShell } from '../../components';
import type { GameRendererProps } from '../../engine/types';
import type { RenderState, Stats, ToolMode } from './types';
import './styles.css';

const TOOLS: ToolMode[] = ['fish', 'shark', 'algae', 'cull'];

const TOOL_LABELS: Record<ToolMode, string> = {
  fish: 'Spawn Fish',
  shark: 'Spawn Shark',
  algae: 'Spawn Algae',
  cull: 'Cull',
};

function initGame(session: GameRendererProps['session']): RenderState {
  const data = session.files.data as Record<string, unknown>;
  return call(session, 'init_game', data) as RenderState;
}

export default function App({ session }: GameRendererProps) {
  const [tool, setTool] = useState<ToolMode>('fish');
  const [stats, setStats] = useState<Stats>({
    fish_count: 0,
    shark_count: 0,
    algae_count: 0,
    chunk_count: 0,
  });

  return (
    <GameShell
      gameLabel="SHOAL"
      gameId="shoal"
      phase="2.0"
      statusArea={
        <div className="shoal-status">
          <span>Fish {stats.fish_count}</span>
          <span>Sharks {stats.shark_count}</span>
          <span>Algae {stats.algae_count}</span>
          <span>Chunks {stats.chunk_count}</span>
        </div>
      }
    >
      <div className="shoal-app">
        <div className="shoal-toolbar">
          {TOOLS.map((t) => (
            <button
              key={t}
              type="button"
              className={tool === t ? 'shoal-tool active' : 'shoal-tool'}
              onClick={() => setTool(t)}
              aria-label={TOOL_LABELS[t]}
            >
              {TOOL_LABELS[t]}
            </button>
          ))}
        </div>
        <ShoalCanvas session={session} tool={tool} onStats={setStats} />
      </div>
    </GameShell>
  );
}

function ShoalCanvas({
  session,
  tool,
  onStats,
}: {
  session: GameRendererProps['session'];
  tool: ToolMode;
  onStats: (stats: Stats) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    dims: { w: 800, h: 600 },
    mouse: { x: 0, y: 0 },
    click: null as { x: number; y: number } | null,
    initialized: false,
  });
  const renderStateRef = useRef<RenderState | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvasRef.current.width = rect.width * dpr;
      canvasRef.current.height = rect.height * dpr;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      stateRef.current.dims = { w: rect.width, h: rect.height };
      const rs = renderStateRef.current;
      if (rs) drawGame(canvasRef.current, rs, stateRef.current.dims, session.files.data);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Initialize Lua game
    renderStateRef.current = initGame(session);
    stateRef.current.initialized = true;
    onStats(renderStateRef.current.stats);
    if (canvasRef.current) {
      drawGame(canvasRef.current, renderStateRef.current, stateRef.current.dims, session.files.data);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [session, onStats]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const r = canvasRef.current.getBoundingClientRect();
      stateRef.current.mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onDown = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const r = canvasRef.current.getBoundingClientRect();
      const dims = stateRef.current.dims;
      const world = renderStateRef.current?.world;
      if (!world) return;
      const x = (e.clientX - r.left) * (world.width / dims.w);
      const y = (e.clientY - r.top) * (world.height / dims.h);
      stateRef.current.click = { x, y };
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
    };
  }, []);

  useGameLoop((dt) => {
    const s = stateRef.current;
    if (!s.initialized || !canvasRef.current) return;

    const click = s.click;
    s.click = null;

    const input: Record<string, unknown> = { tool };
    if (click) {
      input.x = click.x;
      input.y = click.y;
      input.clicked = true;
    }

    const rs = call(session, 'tick_game', dt, input) as RenderState;
    renderStateRef.current = rs;
    onStats(rs.stats);
    drawGame(canvasRef.current, rs, s.dims, session.files.data);
  }, {});

  return (
    <div ref={containerRef} className="shoal-canvas-wrap">
      <canvas ref={canvasRef} className="shoal-canvas" />
    </div>
  );
}

function drawFish(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  angle: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;

  // Diamond body
  ctx.beginPath();
  ctx.moveTo(radius * 1.2, 0);
  ctx.lineTo(0, radius * 0.7);
  ctx.lineTo(-radius * 0.5, 0);
  ctx.lineTo(0, -radius * 0.7);
  ctx.closePath();
  ctx.fill();

  // Tail triangle, attached at the diamond's back point
  ctx.beginPath();
  ctx.moveTo(-radius * 0.5, 0);
  ctx.lineTo(-radius * 1.6, radius * 0.6);
  ctx.lineTo(-radius * 1.6, -radius * 0.6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawGame(
  canvas: HTMLCanvasElement,
  rs: RenderState,
  dims: { w: number; h: number },
  data: Record<string, unknown>
) {
  const renderCfg = (data as { render?: Record<string, string> }).render;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const world = rs.world;
  ctx.clearRect(0, 0, dims.w, dims.h);
  ctx.save();

  // Scale to fit world into canvas
  ctx.scale(dims.w / world.width, dims.h / world.height);

  // Depth gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, world.height);
  grad.addColorStop(0, '#7dd3fc');
  grad.addColorStop(0.15, '#38bdf8');
  grad.addColorStop(0.35, '#0ea5e9');
  grad.addColorStop(0.6, '#0369a1');
  grad.addColorStop(1, '#0c4a6e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, world.width, world.height);

  // Surface line
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(world.width, 0);
  ctx.stroke();

  // Draw algae cores
  ctx.fillStyle = renderCfg?.algae_core_color ?? '#eab308';
  for (const core of rs.algae) {
    ctx.beginPath();
    ctx.arc(core.x, core.depth, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw algae nodules
  ctx.fillStyle = renderCfg?.algae_color ?? '#10b981';
  for (const core of rs.algae) {
    for (const n of core.nodules) {
      ctx.beginPath();
      ctx.arc(n.x, n.depth, n.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw flesh chunks
  ctx.fillStyle = renderCfg?.chunk_color ?? '#f43f5e';
  for (const c of rs.chunks) {
    ctx.beginPath();
    ctx.arc(c.x, c.depth, c.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw fish
  for (const f of rs.fish) {
    drawFish(ctx, f.x, f.depth, f.radius, f.angle, f.color);
  }

  // Draw sharks
  for (const s of rs.sharks) {
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.depth, s.radius, 0, Math.PI * 2);
    ctx.fill();
    const tx = s.x - Math.cos(s.angle) * s.radius * 2.5;
    const ty = s.depth - Math.sin(s.angle) * s.radius * 2.5;
    ctx.beginPath();
    ctx.moveTo(s.x, s.depth);
    ctx.lineTo(tx, ty);
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.radius;
    ctx.stroke();
  }

  ctx.restore();
}
