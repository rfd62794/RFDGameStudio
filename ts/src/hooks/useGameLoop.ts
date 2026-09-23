import { useEffect, useRef } from 'react';

export interface UseGameLoopOptions {
  /** Pause the loop without unmounting. Default: false. */
  paused?: boolean;
  /**
   * Cap dt to this value in seconds. Prevents spiral-of-death on tab focus.
   * Default: 0.05 (50ms = ~20fps minimum)
   */
  maxDt?: number;
}

/**
 * Drives a requestAnimationFrame loop at native refresh rate.
 * Calls `tickFn(dt)` each frame where dt is seconds since last frame.
 *
 * The tickFn ref is kept fresh — changing the callback does NOT restart the
 * loop, so stable useCallback refs are NOT required.
 *
 * Usage:
 *   useGameLoop((dt) => {
 *     const state = call(session, 'tick_game', dt, input);
 *     setRenderState(state);
 *   }, { paused: isPaused });
 */
export function useGameLoop(
  tickFn: (dt: number) => void,
  options: UseGameLoopOptions = {}
): void {
  const { paused = false, maxDt = 0.05 } = options;
  const tickRef = useRef(tickFn);
  const lastTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  // Keep tickFn ref current without restarting the loop
  useEffect(() => {
    tickRef.current = tickFn;
  });

  useEffect(() => {
    if (paused) {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      return;
    }

    const loop = (time: number) => {
      if (lastTimeRef.current !== null) {
        const dt = Math.min((time - lastTimeRef.current) / 1000, maxDt);
        tickRef.current(dt);
      }
      lastTimeRef.current = time;
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
  }, [paused, maxDt]);
}
