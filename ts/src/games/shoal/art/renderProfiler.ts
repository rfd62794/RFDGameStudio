/**
 * Shoal — render profiling overlay.
 *
 * Reusable debug overlay for canvas-based games. Toggle via import.meta.env
 * DEV flag or at runtime via setProfilingEnabled(). Draws FPS, frame timing
 * (tick/draw), entity counts, and arbitrary custom stats onto the canvas.
 *
 * Usage:
 *   import { RenderProfiler, setProfilingEnabled } from './art/renderProfiler';
 *   const profiler = new RenderProfiler();
 *
 *   // In your game loop:
 *   profiler.beginTick();
 *   const rs = call(session, 'tick_game', dt, input)[0];
 *   profiler.endTick();
 *
 *   profiler.beginDraw();
 *   drawGame(canvas, rs, dims, data);
 *   profiler.endDraw();
 *
 *   // At end of draw, overlay the stats:
 *   profiler.drawOverlay(ctx, {
 *     entities: { fish: rs.fish.length, sharks: rs.sharks.length, ... },
 *     custom: { 'Cache hits': cacheStats.hits, ... },
 *   });
 *
 *   // Toggle at runtime (e.g. via a debug key or env):
 *   setProfilingEnabled(false); // hide overlay
 */

// Enabled by default in dev, disabled in production builds.
// Toggle at runtime via '?' key (wired in App.tsx) or setProfilingEnabled().
let _enabled = import.meta.env?.DEV ?? false;

/**
 * Enable or disable the profiling overlay globally.
 * When disabled, drawOverlay() is a no-op and timing calls are skipped.
 */
export function setProfilingEnabled(enabled: boolean): void {
  _enabled = enabled;
}

export function isProfilingEnabled(): boolean {
  return _enabled;
}

export interface EntityCounts {
  [name: string]: number;
}

export interface OverlayOptions {
  /** Named entity counts displayed on the second line. */
  entities?: EntityCounts;
  /** Arbitrary custom key-value stats displayed after the standard lines. */
  custom?: Record<string, string | number>;
  /** Overlay position. Default: top-left. */
  position?: { x: number; y: number };
  /** Max width for the background box. Default: 420. */
  maxWidth?: number;
}

export class RenderProfiler {
  private frameCount = 0;
  private lastFpsTime = performance.now();
  private currentFps = 0;
  private lastTickTime = 0;
  private lastDrawTime = 0;
  private tickStart = 0;
  private drawStart = 0;

  /** Call at the start of the simulation tick. */
  beginTick(): void {
    if (!_enabled) return;
    this.tickStart = performance.now();
  }

  /** Call at the end of the simulation tick. */
  endTick(): void {
    if (!_enabled) return;
    this.lastTickTime = performance.now() - this.tickStart;
  }

  /** Call at the start of the draw phase. */
  beginDraw(): void {
    if (!_enabled) return;
    this.drawStart = performance.now();
  }

  /** Call at the end of the draw phase (before drawOverlay). */
  endDraw(): void {
    if (!_enabled) return;
    this.lastDrawTime = performance.now() - this.drawStart;
  }

  /**
   * Draw the profiling overlay onto the canvas. Call this last in the
   * render loop, after endDraw(). Uses setTransform(1,0,0,1,0,0) to
   * draw in screen space regardless of any transforms applied by the game.
   */
  drawOverlay(ctx: CanvasRenderingContext2D, options: OverlayOptions = {}): void {
    if (!_enabled) return;

    // Update FPS counter
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    const { entities, custom, position = { x: 5, y: 5 }, maxWidth = 420 } = options;

    // Build lines
    const lines: string[] = [];
    lines.push(`FPS: ${this.currentFps}`);

    if (entities) {
      const parts = Object.entries(entities).map(([k, v]) => `${k}: ${v}`);
      lines.push(parts.join('  '));
    }

    lines.push(`Tick: ${this.lastTickTime.toFixed(1)}ms  Draw: ${this.lastDrawTime.toFixed(1)}ms`);

    if (custom) {
      for (const [key, value] of Object.entries(custom)) {
        lines.push(`${key}: ${value}`);
      }
    }

    // Draw background + text
    const lineHeight = 20;
    const padding = 5;
    const boxWidth = maxWidth;
    const boxHeight = lines.length * lineHeight + padding * 2;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = '14px monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(position.x, position.y, boxWidth, boxHeight);
    ctx.fillStyle = '#0f0';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], position.x + padding, position.y + padding + (i + 1) * lineHeight - 4);
    }
    ctx.restore();
  }

  /** Current FPS reading (updated once per second). */
  get fps(): number {
    return this.currentFps;
  }

  /** Last tick duration in ms. */
  get tickMs(): number {
    return this.lastTickTime;
  }

  /** Last draw duration in ms. */
  get drawMs(): number {
    return this.lastDrawTime;
  }
}
