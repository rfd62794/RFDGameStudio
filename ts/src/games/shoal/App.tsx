import { useState, useRef, useEffect, useCallback } from 'react';
import { useGameLoop } from '../../hooks';
import { GameShell } from '../../components';
import { Button, EndStateScreen, MoreGamesByMe, useOnboardingGate } from '../../ui/components';
import { Volume2, VolumeX } from 'lucide-react';
import { navigateTo } from '../../arcade/routing';
import { STANDALONE_BUILD_GAMES } from '../../games/registry';
import { loadSave, writeSave } from '../../engine/shared/persistence';
import type { GameRendererProps } from '../../engine/types';
import type { RenderState, Stats, ToolMode, FleshChunk, ShoalCreature } from './types';
import { MECHANICS_COPY } from './mechanicsCopy';
import TitleScreen from './components/TitleScreen';
import type { StartConfig } from './components/TitleScreen';
import ReefPrimer from './components/ReefPrimer';
import { sound } from './utils/sound';
import { detectReefEvents } from './utils/reefEvents';
import { createShoalSimulation } from './simulation/shoalSimulation';
import {
  ageStageFromCreature,
  applyAgeSaturation,
  parseHueFromColor,
  hueToBand,
  bandToHue,
  FISH_MAX_HUNGER,
  SHARK_MAX_HUNGER,
} from './art/shoal.config';
import {
  getCachedCreaturePath,
  getCachedAlgaePath,
  getCachedFleshChunkPath,
  hungerToBand,
  getCacheStats,
} from './art/pathCache';
import { RenderProfiler, setProfilingEnabled, isProfilingEnabled } from './art/renderProfiler';
import { notifyGameplayStart, notifyGameplayStop } from '../../engine/shared/portalAdapter/interface';
import { initY8 } from '../../engine/shared/portalAdapter/adapters/y8';
import { detectPortalEnvironment } from '../../engine/shared/portalAdapter/detection';
import { SHOAL_Y8_CONFIG } from './y8Config';
import './styles.css';

// Age-aware batch color: quantizes hue to a band AND applies age saturation,
// so young creatures render paler than mature ones within the same hue family.
// Extends getBatchColor with the age-saturation curve from shoal.config.ts.
function getAgeAwareBatchColor(lineageColor: string, mature: boolean): string {
  const hue = parseHueFromColor(lineageColor);
  if (hue === null) return lineageColor;
  const band = hueToBand(hue);
  const bandHue = bandToHue(band);
  const ageStage = ageStageFromCreature(mature);
  return applyAgeSaturation(bandHue, 0.7, ageStage, 0.55);
}


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

// TS-native simulation — replaces the fengari Lua executor call path.
// The Lua source files remain in games/shoal/*.lua as reference.
const shoalSim = createShoalSimulation();

// Scenario config chosen on the title screen — set by handleStart, read
// once by ShoalCanvas on mount. Module-level like the sim singleton.
let pendingStartConfig: StartConfig | null = null;

const TUTORIAL_SEEN_KEY = 'shoal_tutorial_seen';

function initGame(): RenderState {
  const cfg = pendingStartConfig;
  const seed =
    typeof cfg?.seed === 'number'
      ? cfg.seed
      : cfg?.seed === 'daily'
        ? Math.floor(Date.now() / 86400000)
        : undefined;
  return shoalSim.initGame(
    seed,
    cfg
      ? {
          initialFish: cfg.initial_fish,
          initialSharks: cfg.initial_sharks,
          initialAlgaeHubs: cfg.initial_algae_hubs,
        }
      : undefined
  );
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
  const [reefEnded, setReefEnded] = useState(false);
  const [endSnapshot, setEndSnapshot] = useState<{
    seed: number;
    ticks: number;
    peakFish: number;
    peakSharks: number;
  } | null>(null);
  const [soundMuted, setSoundMuted] = useState(!sound.isSoundEnabled());

  // First-run reef primer: fires only on a genuinely first start, via the
  // shared OnboardingGate (boolean mode) + persisted tutorial-seen flag.
  const { shouldShow: showPrimer, handleComplete: completePrimer, trigger: triggerPrimer } =
    useOnboardingGate({ mode: 'boolean', initialShow: false });

  const lifeSeenRef = useRef(false);
  const peaksRef = useRef({ fish: 0, sharks: 0 });

  const handleStats = useCallback((s: Stats, tickCount: number) => {
    setStats(s);
    if (s.fish_count > peaksRef.current.fish) peaksRef.current.fish = s.fish_count;
    if (s.shark_count > peaksRef.current.sharks) peaksRef.current.sharks = s.shark_count;
    if (s.fish_count + s.shark_count > 0) {
      lifeSeenRef.current = true;
    } else if (lifeSeenRef.current) {
      lifeSeenRef.current = false;
      setEndSnapshot({
        seed: s.seed,
        ticks: tickCount,
        peakFish: peaksRef.current.fish,
        peakSharks: peaksRef.current.sharks,
      });
      setReefEnded(true);
      notifyGameplayStop();
    }
  }, []);

  const resetReefTracking = () => {
    lifeSeenRef.current = false;
    peaksRef.current = { fish: 0, sharks: 0 };
    setReefEnded(false);
    setEndSnapshot(null);
  };

  const handleStart = (config: StartConfig) => {
    sound.unlock();
    sound.playUiConfirm();
    pendingStartConfig = config;
    resetReefTracking();
    setReefKey((k) => k + 1);
    setScreen('game');
    if (!loadSave<boolean>(TUTORIAL_SEEN_KEY)) triggerPrimer();
    // Y8 portal integration — initialize SDK if on Y8, then signal start.
    if (detectPortalEnvironment() === 'y8') {
      initY8(SHOAL_Y8_CONFIG);
    }
    notifyGameplayStart();
  };

  const handlePrimerDone = () => {
    writeSave(TUTORIAL_SEEN_KEY, true);
    sound.playUiConfirm();
    completePrimer();
  };

  const handleReplay = () => {
    sound.playUiConfirm();
    resetReefTracking();
    setReefKey((k) => k + 1);
  };

  const toggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    sound.setEnabled(!next);
  };

  const soundToggle = (
    <button
      type="button"
      className="shoal-sound-toggle"
      onClick={toggleSound}
      aria-label={soundMuted ? 'Unmute sound' : 'Mute sound'}
    >
      {soundMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
    </button>
  );

  const primer = showPrimer ? <ReefPrimer onBegin={handlePrimerDone} /> : null;

  const statusArea = (
    <div className="shoal-status">
      <span>Fish {stats.fish_count}</span>
      <span>Sharks {stats.shark_count}</span>
      <span>Algae {stats.algae_count}</span>
      <span>Chunks {stats.chunk_count}</span>
      <span>Seed {stats.seed}</span>
      {soundToggle}
    </div>
  );

  const footer = (
    <MoreGamesByMe
      mode={mode}
      currentGameId="shoal"
      games={STANDALONE_BUILD_GAMES}
      onSelectGame={navigateTo}
      arcadeBaseUrl={arcadeBaseUrl}
    />
  );

  if (screen === 'title') {
    return (
      <GameShell
        gameLabel="SHOAL"
        gameId="shoal"
        phase="2.0"
        mode={mode}
        arcadeBaseUrl={arcadeBaseUrl}
        statusArea={soundToggle}
      >
        <TitleScreen
          session={session}
          onStart={handleStart}
          onHowToPlay={() => {
            sound.unlock();
            sound.playUiConfirm();
            triggerPrimer();
          }}
        />
        {primer}
      </GameShell>
    );
  }

  if (reefEnded && endSnapshot) {
    return (
      <GameShell
        gameLabel="SHOAL"
        gameId="shoal"
        phase="2.0"
        mode={mode}
        arcadeBaseUrl={arcadeBaseUrl}
        headerExtra={
          <button className="game-shell-back" onClick={() => { notifyGameplayStop(); setScreen('title'); }}>
            ← Title
          </button>
        }
        statusArea={statusArea}
        footer={footer}
      >
        <EndStateScreen
          won={false}
          headline="The Reef Went Silent"
          flavorLine="No fish, no sharks — just empty water and the algae waiting for whatever you seed next."
          stats={[
            { label: 'Ticks Survived', value: endSnapshot.ticks },
            { label: 'Peak Fish', value: endSnapshot.peakFish },
            { label: 'Peak Sharks', value: endSnapshot.peakSharks },
            { label: 'Seed', value: endSnapshot.seed },
          ]}
          onRestart={handleReplay}
          restartLabel="Seed a New Reef"
        />
      </GameShell>
    );
  }

  return (
    <GameShell
      gameLabel="SHOAL"
      gameId="shoal"
      phase="2.0"
      mode={mode}
      arcadeBaseUrl={arcadeBaseUrl}
      headerExtra={
        <button className="game-shell-back" onClick={() => { notifyGameplayStop(); setScreen('title'); }}>
          ← Title
        </button>
      }
      statusArea={statusArea}
      footer={footer}
    >
      <div className="shoal-app">
        <div className="shoal-toolbar">
          {TOOLS.map((t) => (
            <Button
              key={t}
              id={`shoal-tool-${t}`}
              label={TOOL_LABELS[t]}
              onClick={() => { sound.playUiConfirm(); setTool(t); }}
              variant={tool === t ? 'primary' : 'neutral'}
              size="sm"
              className={tool === t ? 'shoal-tool active' : 'shoal-tool'}
            />
          ))}
          <Button
            id="shoal-mechanics"
            label="Mechanics"
            onClick={() => { sound.playUiConfirm(); setShowMechanics(true); }}
            variant="neutral"
            size="sm"
          />
        </div>
        <ShoalCanvas key={reefKey} session={session} tool={tool} onStats={handleStats} />
        {primer}
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
  onStats: (stats: Stats, tickCount: number) => void;
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
  // Per-event sound throttles — a busy reef can produce several events a
  // second; without a floor on the interval the audio becomes noise.
  const sfxAtRef = useRef({ feed: 0, strike: 0, core: 0 });

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

    // Initialize TS-native simulation (replaces Lua executor)
    renderStateRef.current = initGame();
    stateRef.current.initialized = true;
    onStats(renderStateRef.current.stats, renderStateRef.current.tick_count);
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

  const profilerRef = useRef(new RenderProfiler());

  // Toggle profiling overlay via '?' key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '?') {
        setProfilingEnabled(!isProfilingEnabled());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
      sound.playSpawn();
    }

    const profiler = profilerRef.current;
    const prevRs = renderStateRef.current;
    profiler.beginTick();
    const rs = shoalSim.tickGame(dt, input);
    profiler.endTick();

    renderStateRef.current = rs;
    onStats(rs.stats, rs.tick_count);

    // SFX from render-state diffs — the sim owns no event stream.
    if (prevRs) {
      const now = performance.now();
      const sfxAt = sfxAtRef.current;
      for (const ev of detectReefEvents(prevRs, rs)) {
        if (ev === 'feed' && now - sfxAt.feed > 350) {
          sfxAt.feed = now;
          sound.playNibble();
        } else if ((ev === 'strike' || ev === 'shark_loss') && now - sfxAt.strike > 200) {
          sfxAt.strike = now;
          sound.playStrike(ev === 'shark_loss');
        } else if ((ev === 'core_bloom' || ev === 'core_collapse') && now - sfxAt.core > 800) {
          sfxAt.core = now;
          sound.playBoundary(ev === 'core_collapse');
        } else if (ev === 'extinction') {
          sound.playReefEnd();
        }
      }
    }

    profiler.beginDraw();
    drawGame(canvasRef.current, rs, s.dims, session.files.data, profiler);
    profiler.endDraw();
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
  // Batch by hue-banded + age-aware color (preserves batch grouping with lineage variety)
  const byColor = new Map<string, ShoalCreature[]>();
  for (const f of fish) {
    const batchColor = getAgeAwareBatchColor(f.color, f.mature);
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
    const batchColor = getAgeAwareBatchColor(s.color, s.mature);
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

export function drawGame(
  canvas: HTMLCanvasElement,
  rs: RenderState,
  dims: { w: number; h: number },
  data: Record<string, unknown>,
  profiler?: RenderProfiler
) {
  const renderCfg = (data as { render?: Record<string, string> }).render;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

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

  // Draw flesh chunks with 3-stop decay gradient (batched into decay buckets)
  // red (fresh) → orange (mid decay) → gold (decomposed). Uses cached Path2D.
  const chunkColor = renderCfg?.chunk_color ?? '#f43f5e';
  const chunkMidColor = renderCfg?.chunk_decay_mid_color ?? '#f97316';
  const coreColor = renderCfg?.algae_core_color ?? '#eab308';
  const chunksByBucket = new Map<number, FleshChunk[]>();
  for (const c of rs.chunks) {
    const bucket = Math.round((c.decay_ratio ?? 0) * 5) / 5;
    const group = chunksByBucket.get(bucket);
    if (group) group.push(c); else chunksByBucket.set(bucket, [c]);
  }
  for (const [bucket, group] of chunksByBucket) {
    // 3-stop lerp: 0→0.5 goes chunkColor→chunkMidColor, 0.5→1 goes chunkMidColor→coreColor
    const color = bucket <= 0.5
      ? lerpColor(chunkColor, chunkMidColor, bucket * 2)
      : lerpColor(chunkMidColor, coreColor, (bucket - 0.5) * 2);
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

  // Draw sharks batched by color
  drawSharksBatched(ctx, rs.sharks);

  // Draw evenly-spaced depth ticks on both edges (replaces band-range labels)
  const floorDepth = (data as { world?: { floor_depth?: number } }).world?.floor_depth ?? 800;
  drawDepthTicks(ctx, floorDepth, { w: world.width, h: world.height });

  ctx.restore();

  // Profiling overlay (toggle with '?' key)
  if (profiler) {
    const cacheStats = getCacheStats();
    profiler.drawOverlay(ctx, {
      entities: {
        Fish: rs.fish.length,
        Sharks: rs.sharks.length,
        Algae: rs.algae.length,
        Chunks: rs.chunks.length,
      },
      custom: {
        'Cache hits': cacheStats.hits,
        'Cache misses': cacheStats.misses,
      },
    });
  }
}
