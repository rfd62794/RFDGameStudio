import { useState, useRef, useEffect } from 'react';
import { call } from '../../engine/runtime';
import { useGameLoop } from '../../hooks';
import { GameShell } from '../../components';
import { Button, MoreGamesByMe } from '../../ui/components';
import { navigateTo } from '../../arcade/routing';
import { STANDALONE_BUILD_GAMES } from '../../games/registry';
import type { GameRendererProps } from '../../engine/types';
import type { RenderState, Stats, ToolMode, FleshChunk, ShoalCreature } from './types';
import { MECHANICS_COPY } from './mechanicsCopy';
import TitleScreen from './components/TitleScreen';
import type { StartConfig } from './components/TitleScreen';
import {
  canvasTeardropFinPath,
  canvasRadialBurstPath,
  canvasIrregularFragmentPath,
} from '../../engine/artGen/shapes';
import {
  buildTeardropFinSpec,
  buildAlgaeSpec,
  buildFleshChunkSpec,
  buildTeardropFinSpecWithHunger,
  ageStageFromCreature,
  getBatchColor,
  FISH_MAX_HUNGER,
  SHARK_MAX_HUNGER,
} from './art/shoal.config';
import {
  getCachedCreaturePath,
  getCachedAlgaePath,
  getCachedFleshChunkPath,
  hungerToBand,
  HUNGER_BANDS,
  getCacheStats,
  resetCacheStats,
  clearCache,
} from './art/pathCache';
import './styles.css';


let backgroundCache: HTMLCanvasElement | null = null;

function drawDepthTicks(ctx: CanvasRenderingContext2D, floorDepth: number, dims: { w: number; h: number }) {
  const tickIntervalM = 100;
  const scale = dims.h / floorDepth;
  ctx.font = '12px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let depth = 0; depth <= floorDepth; depth += tickIntervalM) {
    const y = depth * scale;
    const feet = Math.round((depth * 3.28084) / 10) * 10;
    const label = `${depth}m / ${feet}ft`;
    ctx.textAlign = 'left';
    ctx.fillText(label, 4, y);
    ctx.textAlign = 'right';
    ctx.fillText(label, dims.w - 4, y);
  }
}

function getBackgroundCache(world: { width: number; height: number }): HTMLCanvasElement {
  if (backgroundCache) return backgroundCache;
  const bg = document.createElement('canvas');
  bg.width = world.width;
  bg.height = world.height;
  const bgCtx = bg.getContext('2d')!;

  const grad = bgCtx.createLinearGradient(0, 0, 0, world.height);
  grad.addColorStop(0, '#7dd3fc');
  grad.addColorStop(0.15, '#38bdf8');
  grad.addColorStop(0.35, '#0ea5e9');
  grad.addColorStop(0.6, '#0369a1');
  grad.addColorStop(1, '#0c4a6e');
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(0, 0, world.width, world.height);

  bgCtx.strokeStyle = 'rgba(255,255,255,0.6)';
  bgCtx.lineWidth = 2;
  bgCtx.beginPath();
  bgCtx.moveTo(0, 0);
  bgCtx.lineTo(world.width, 0);
  bgCtx.stroke();

  backgroundCache = bg;
  return backgroundCache;
}

const TOOLS: ToolMode[] = ['fish', 'shark', 'algae', 'cull'];

const TOOL_LABELS: Record<ToolMode, string> = {
  fish: 'Spawn Fish',
  shark: 'Spawn Shark',
  algae: 'Spawn Algae',
  cull: 'Cull',
};

function initGame(session: GameRendererProps['session']): RenderState {
  const data = session.files.data as Record<string, unknown>;
  return call(session, 'init_game', data)[0] as RenderState;
}

export default function App({ session }: GameRendererProps) {
  const env = import.meta.env as Record<string, string | undefined>;
  const mode = env.VITE_STANDALONE === 'true' ? 'standalone' : 'arcade';
  const arcadeBaseUrl = env.VITE_ARCADE_BASE_URL;
  const [screen, setScreen] = useState<'title' | 'game'>('title');
  const [tool, setTool] = useState<ToolMode>('fish');
  const [reefKey, setReefKey] = useState(0);
  const [showMechanics, setShowMechanics] = useState(false);
  const [stats, setStats] = useState<Stats>({
    fish_count: 0,
    shark_count: 0,
    algae_count: 0,
    chunk_count: 0,
    seed: 0,
  });

  const handleStart = (config: StartConfig) => {
    const spawn = (session.files.data as Record<string, Record<string, unknown>>).spawn;
    spawn.initial_fish = config.initial_fish;
    spawn.initial_sharks = config.initial_sharks;
    spawn.initial_algae_hubs = config.initial_algae_hubs;
    spawn.seed = config.seed;
    setReefKey((k) => k + 1);
    setScreen('game');
  };

  if (screen === 'title') {
    return <TitleScreen session={session} onStart={handleStart} />;
  }

  return (
    <GameShell
      gameLabel="SHOAL"
      gameId="shoal"
      phase="2.0"
      mode={mode}
      arcadeBaseUrl={arcadeBaseUrl}
      headerExtra={
        <button className="game-shell-back" onClick={() => setScreen('title')}>
          ← Title
        </button>
      }
      statusArea={
        <div className="shoal-status">
          <span>Fish {stats.fish_count}</span>
          <span>Sharks {stats.shark_count}</span>
          <span>Algae {stats.algae_count}</span>
          <span>Chunks {stats.chunk_count}</span>
          <span>Seed {stats.seed}</span>
        </div>
      }
      footer={
        <MoreGamesByMe
          mode={mode}
          currentGameId="shoal"
          games={STANDALONE_BUILD_GAMES}
          onSelectGame={navigateTo}
          arcadeBaseUrl={arcadeBaseUrl}
        />
      }
    >
      <div className="shoal-app">
        <div className="shoal-toolbar">
          {TOOLS.map((t) => (
            <Button
              key={t}
              id={`shoal-tool-${t}`}
              label={TOOL_LABELS[t]}
              onClick={() => setTool(t)}
              variant={tool === t ? 'primary' : 'neutral'}
              size="sm"
              className={tool === t ? 'shoal-tool active' : 'shoal-tool'}
            />
          ))}
          <Button
            id="shoal-mechanics"
            label="Mechanics"
            onClick={() => setShowMechanics(true)}
            variant="neutral"
            size="sm"
          />
        </div>
        <ShoalCanvas key={reefKey} session={session} tool={tool} onStats={setStats} />
        {showMechanics && (
          <div className="shoal-mechanics-overlay" onClick={() => setShowMechanics(false)}>
            <div className="shoal-mechanics-popup" onClick={(e) => e.stopPropagation()}>
              <div className="shoal-mechanics-header">
                <span className="shoal-mechanics-title">Mechanics</span>
                <button
                  className="shoal-mechanics-close"
                  onClick={() => setShowMechanics(false)}
                >
                  ×
                </button>
              </div>
              <pre className="shoal-mechanics-text">{MECHANICS_COPY}</pre>
            </div>
          </div>
        )}
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

    const rs = call(session, 'tick_game', dt, input)[0] as RenderState;
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
  mature: boolean = true,
  hunger: number = 0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(radius / 25, radius / 25);

  // Use cached Path2D — geometry is only regenerated on state change
  const ageStage = ageStageFromCreature(mature);
  const band = hungerToBand(hunger, FISH_MAX_HUNGER);
  const path = getCachedCreaturePath({ species: 'fish', ageStage, hungerBand: band });
  ctx.fill(path);

  ctx.restore();
}

function drawFishBatched(ctx: CanvasRenderingContext2D, fish: RenderState['fish']) {
  // Batch by hue-banded color (preserves batch grouping with lineage variety)
  const byColor = new Map<string, ShoalCreature[]>();
  for (const f of fish) {
    const batchColor = getBatchColor(f.color);
    const group = byColor.get(batchColor);
    if (group) {
      group.push(f);
    } else {
      byColor.set(batchColor, [f]);
    }
  }
  for (const [color, group] of byColor) {
    ctx.fillStyle = color;
    for (const f of group) {
      drawFish(ctx, f.x, f.depth, f.radius, f.angle, f.mature, f.hunger ?? 0);
    }
  }
}

function drawSharksBatched(ctx: CanvasRenderingContext2D, sharks: RenderState['sharks']) {
  const byColor = new Map<string, ShoalCreature[]>();
  for (const s of sharks) {
    const batchColor = getBatchColor(s.color);
    const group = byColor.get(batchColor);
    if (group) {
      group.push(s);
    } else {
      byColor.set(batchColor, [s]);
    }
  }
  for (const [color, group] of byColor) {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    for (const s of group) {
      ctx.save();
      ctx.translate(s.x, s.depth);
      ctx.rotate(s.angle);
      ctx.scale(s.radius / 25, s.radius / 25);
      const ageStage = ageStageFromCreature(s.mature);
      const band = hungerToBand(s.hunger ?? 0, SHARK_MAX_HUNGER);
      const path = getCachedCreaturePath({ species: 'shark', ageStage, hungerBand: band });
      ctx.fill(path);
      ctx.restore();
    }
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

// Temporary FPS counter for §0 baseline measurement
let _fpsFrameCount = 0;
let _fpsLastTime = performance.now();
let _fpsCurrent = 0;
let _geometryCallCount = 0;

export function drawGame(
  canvas: HTMLCanvasElement,
  rs: RenderState,
  dims: { w: number; h: number },
  data: Record<string, unknown>
) {
  const renderCfg = (data as { render?: Record<string, string> }).render;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // FPS measurement
  _fpsFrameCount++;
  const now = performance.now();
  if (now - _fpsLastTime >= 1000) {
    _fpsCurrent = Math.round((_fpsFrameCount * 1000) / (now - _fpsLastTime));
    _fpsFrameCount = 0;
    _fpsLastTime = now;
  }
  _geometryCallCount = 0;

  const world = rs.world;
  ctx.clearRect(0, 0, dims.w, dims.h);
  ctx.save();

  // Scale to fit world into canvas
  ctx.scale(dims.w / world.width, dims.h / world.height);

  // Depth gradient background + surface line (cached offscreen)
  ctx.drawImage(getBackgroundCache(world), 0, 0);

  // Draw algae cores (batched) — uses cached Path2D
  const algaeCoreColor = renderCfg?.algae_core_color ?? '#eab308';
  const algaeColor = renderCfg?.algae_color ?? '#10b981';
  ctx.fillStyle = algaeCoreColor;
  for (const core of rs.algae) {
    const path = getCachedAlgaePath({ growthStage: 1 }, 8, algaeCoreColor);
    ctx.save();
    ctx.translate(core.x, core.depth);
    ctx.fill(path);
    ctx.restore();
  }

  // Draw algae nodules (batched) — cached Path2D per nodule radius
  ctx.fillStyle = algaeColor;
  for (const core of rs.algae) {
    for (const n of core.nodules) {
      const path = getCachedAlgaePath({ growthStage: 0 }, n.radius, algaeColor);
      ctx.save();
      ctx.translate(n.x, n.depth);
      ctx.fill(path);
      ctx.restore();
    }
  }

  // Draw flesh chunks with decay-based color lerp (batched into decay buckets)
  // Uses cached Path2D
  const chunkColor = renderCfg?.chunk_color ?? '#f43f5e';
  const coreColor = renderCfg?.algae_core_color ?? '#eab308';
  const chunksByBucket = new Map<number, FleshChunk[]>();
  for (const c of rs.chunks) {
    const bucket = Math.round((c.decay_ratio ?? 0) * 5) / 5;
    const group = chunksByBucket.get(bucket);
    if (group) group.push(c); else chunksByBucket.set(bucket, [c]);
  }
  for (const [bucket, group] of chunksByBucket) {
    const color = lerpColor(chunkColor, coreColor, bucket);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    for (const c of group) {
      const decayBucketInt = Math.round(bucket * 5);
      const path = getCachedFleshChunkPath({ decayBucket: decayBucketInt }, c.radius, color);
      ctx.save();
      ctx.translate(c.x, c.depth);
      ctx.fill(path);
      ctx.restore();
    }
  }

  // Draw fish batched by color
  drawFishBatched(ctx, rs.fish);
  _geometryCallCount += rs.fish.length;

  // Draw sharks batched by color
  drawSharksBatched(ctx, rs.sharks);
  _geometryCallCount += rs.sharks.length;

  // Count algae geometry calls
  _geometryCallCount += rs.algae.length; // cores
  for (const core of rs.algae) _geometryCallCount += core.nodules.length; // nodules
  _geometryCallCount += rs.chunks.length; // flesh chunks

  // Draw evenly-spaced depth ticks on both edges (replaces band-range labels)
  const floorDepth = (data as { world?: { floor_depth?: number } }).world?.floor_depth ?? 800;
  drawDepthTicks(ctx, floorDepth, { w: world.width, h: world.height });

  ctx.restore();

  // Temporary FPS + entity count + cache stats overlay
  const cacheStats = getCacheStats();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = '14px monospace';
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(5, 5, 380, 100);
  ctx.fillStyle = '#0f0';
  ctx.fillText(`FPS: ${_fpsCurrent}`, 10, 22);
  ctx.fillText(`Fish: ${rs.fish.length}  Sharks: ${rs.sharks.length}  Algae: ${rs.algae.length}  Chunks: ${rs.chunks.length}`, 10, 42);
  ctx.fillText(`Cache hits: ${cacheStats.hits}  misses: ${cacheStats.misses}`, 10, 62);
  ctx.fillText(`Geometry calls/frame: ${_geometryCallCount} (cached: ${cacheStats.hits > 0 ? 'YES' : 'NO'})`, 10, 82);
  ctx.restore();
}
