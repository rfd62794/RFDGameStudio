// new: ts/tools/playtest/monkeyProbes.ts
// Functions in this file are serialised into the page by Playwright: they
// must stay self-contained (no imports, no outer variables).

interface MkState {
  frames: number;
  lastFrame: number;
  frameTimes: number[];
  longTasks: number;
}

export function installFrameProbes(): void {
  const mk: MkState = {
    frames: 0,
    lastFrame: performance.now(),
    frameTimes: [],
    longTasks: 0,
  };
  (window as unknown as { __mk: MkState }).__mk = mk;
  let prev = performance.now();
  const loop = (t: number): void => {
    mk.frames += 1;
    mk.lastFrame = t;
    mk.frameTimes.push(t - prev);
    if (mk.frameTimes.length > 120) mk.frameTimes.shift();
    prev = t;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  try {
    const observer = new PerformanceObserver((list) => {
      mk.longTasks += list.getEntries().length;
    });
    observer.observe({ type: 'longtask', buffered: true });
  } catch {
    /* longtask is not available in every browser */
  }
}

export function readTargets(): { x: number; y: number; w: number; h: number }[] {
  const out: { x: number; y: number; w: number; h: number }[] = [];
  const els = document.querySelectorAll(
    'button, a[href], [role="button"], input, select, canvas, [onclick]',
  );
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  for (const el of Array.from(els)) {
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    if (r.right < 0 || r.bottom < 0 || r.left > vw || r.top > vh) continue;
    out.push({ x: r.left, y: r.top, w: r.width, h: r.height });
  }
  return out;
}

export function readState(): {
  text: string;
  frameAge: number;
  frameTimes: number[];
  longTasks: number;
  canvasSample: number[];
} {
  const mk = (window as unknown as { __mk?: MkState }).__mk ?? {
    frames: 0,
    lastFrame: performance.now(),
    frameTimes: [] as number[],
    longTasks: 0,
  };
  let canvasSample: number[] = [];
  try {
    let biggest: HTMLCanvasElement | null = null;
    let biggestArea = 0;
    for (const c of Array.from(document.querySelectorAll('canvas'))) {
      const area = c.width * c.height;
      if (area > biggestArea) {
        biggestArea = area;
        biggest = c;
      }
    }
    if (biggest) {
      const ctx = biggest.getContext('2d');
      if (ctx) {
        const sample: number[] = [];
        for (let gy = 0; gy < 8; gy++) {
          for (let gx = 0; gx < 8; gx++) {
            const px = Math.min(
              biggest.width - 1,
              Math.floor(((gx + 0.5) * biggest.width) / 8),
            );
            const py = Math.min(
              biggest.height - 1,
              Math.floor(((gy + 0.5) * biggest.height) / 8),
            );
            const d = ctx.getImageData(px, py, 1, 1).data;
            sample.push(d[0], d[1], d[2], d[3]);
          }
        }
        canvasSample = sample;
      }
    }
  } catch {
    canvasSample = [];
  }
  return {
    text: document.body.innerText,
    frameAge: performance.now() - mk.lastFrame,
    frameTimes: mk.frameTimes.slice(),
    longTasks: mk.longTasks,
    canvasSample,
  };
}
