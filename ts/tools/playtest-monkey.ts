// new: ts/tools/playtest-monkey.ts
/**
 * Monkey fuzz runner (Layer 3). Controller-run: it needs the plain
 * `playwright` library, which is NOT in package.json yet, so the import is
 * dynamic and the script exits 3 with the install hint when it is absent.
 *
 * Usage (from ts/):
 *   cd ts && npx vite-node tools/playtest-monkey.ts -- --demos scrapcrawl --seconds 60 --seed 4242
 *   cd ts && npx vite-node tools/playtest-monkey.ts -- --demos scrapcrawl --replay <the .jsonl file the first run wrote under docs/state/playtest-monkey>
 */
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createStallTracker, formatFinding } from '../src/engine/playtest';
import { mulberry32 } from '../src/engine/shared/seededRandom';
import { SMOKE_ENTRIES } from './playtest/entries';
import { urlFor, type SmokeEntry } from './playtest/manifest';
import {
  blankStreak,
  canvasSignature,
  findBadText,
  isHang,
  lowFps,
  makeFinding,
  shouldStop,
  type MonkeyCheck,
  type MonkeyFinding,
} from './playtest/detectors';
import {
  formatLogLine,
  nextAction,
  parseLog,
  type MonkeyAction,
  type Rect,
} from './playtest/monkey';
import { parseMonkeyArgs, type MonkeyArgs } from './playtest/monkeyArgs';
import {
  installFrameProbes,
  readState,
  readTargets,
} from './playtest/monkeyProbes';
import {
  renderMonkeyReport,
  type MonkeyDemoResult,
} from './playtest/monkeyReport';
import { isAllowedConsole } from './playtest/verdict';

const VP: Record<'phone' | 'desktop', { w: number; h: number }> = {
  phone: { w: 390, h: 844 },
  desktop: { w: 1280, h: 720 },
};

const errText = (e: unknown): string => (e instanceof Error ? e.message : String(e));

const timeout = (ms: number): Promise<never> =>
  new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`action timed out after ${ms} ms`)), ms);
  });

async function runDemo(
  browser: any,
  entry: SmokeEntry,
  args: MonkeyArgs,
  seed: number,
  replay: MonkeyAction[] | null,
  logPath: string,
  shotDir: string,
): Promise<MonkeyDemoResult> {
  const vp = VP[args.viewport];
  const context = await browser.newContext(
    args.viewport === 'phone'
      ? {
          viewport: { width: vp.w, height: vp.h },
          isMobile: true,
          hasTouch: true,
          deviceScaleFactor: 2,
        }
      : { viewport: { width: vp.w, height: vp.h } },
  );
  await context.addInitScript(installFrameProbes);
  const baseOrigin = new URL(args.base).origin;
  await context.route('**/*', (route: any) => {
    const req = route.request();
    const url: string = req.url();
    let ok = url.startsWith('data:') || url.startsWith('blob:');
    if (!ok) {
      try {
        ok = new URL(url).origin === baseOrigin;
      } catch {
        ok = false;
      }
    }
    if (ok && args.readonly) {
      const method = req.method();
      ok = method === 'GET' || method === 'HEAD';
    }
    if (ok) route.continue();
    else route.abort();
  });
  context.on('page', (p: any) => {
    p.close().catch(() => undefined);
  });
  const page = await context.newPage();
  const findings: MonkeyFinding[] = [];
  const seen = new Set<MonkeyCheck>();
  const actionsDone: MonkeyAction[] = [];
  let ended = false;
  const add = (check: MonkeyCheck, message: string, actionIndex: number): void => {
    if (seen.has(check)) return;
    seen.add(check);
    findings.push(makeFinding(check, message, seed, actionIndex, actionsDone));
  };
  page.on('pageerror', (err: unknown) => add('exception', errText(err), actionsDone.length));
  page.on('console', (msg: any) => {
    if (msg.type() === 'error' && !isAllowedConsole('error', msg.text())) {
      add('console-error', msg.text(), actionsDone.length);
    }
  });
  page.on('crash', () => {
    if (!ended) add('crash', 'page crashed', actionsDone.length);
  });
  page.on('close', () => {
    if (!ended) add('crash', 'page closed', actionsDone.length);
  });
  const stalled = createStallTracker(40);
  const signatures: ('blank' | 'varied')[] = [];
  const rng = mulberry32(seed);
  let targets: Rect[] = [];
  let longTasks = 0;
  const t0 = Date.now();
  try {
    await page.goto(urlFor(entry, args.target, args.base), { waitUntil: 'load' });
  } catch (e) {
    add('exception', `goto failed: ${errText(e)}`, 0);
  }
  let i = 0;
  while (
    !seen.has('crash') &&
    Date.now() - t0 < args.seconds * 1000 &&
    !shouldStop(findings)
  ) {
    if (i % 10 === 0) {
      try {
        targets = await page.evaluate(readTargets);
      } catch {
        targets = [];
      }
    }
    const a = replay !== null ? replay[i] : nextAction(rng, i, vp, targets);
    if (a === undefined) break;
    appendFileSync(logPath, `${formatLogLine(a)}\n`);
    const action = (async () => {
      switch (a.kind) {
        case 'tap':
          if (args.viewport === 'phone') await page.touchscreen.tap(a.x ?? 0, a.y ?? 0);
          else await page.mouse.click(a.x ?? 0, a.y ?? 0);
          break;
        case 'key':
          await page.keyboard.press(a.key ?? 'Space');
          break;
        case 'drag': {
          const x2 = a.x2 ?? 0;
          const y2 = a.y2 ?? 0;
          await page.mouse.move(a.x ?? 0, a.y ?? 0);
          await page.mouse.down();
          for (let s = 1; s <= 5; s++) {
            await page.mouse.move(
              (a.x ?? 0) + ((x2 - (a.x ?? 0)) * s) / 5,
              (a.y ?? 0) + ((y2 - (a.y ?? 0)) * s) / 5,
            );
          }
          await page.mouse.up();
          break;
        }
        case 'scroll':
          await page.mouse.wheel(0, a.dy ?? 0);
          break;
      }
    })();
    try {
      await Promise.race([action, timeout(10000)]);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('action timed out')) {
        add('hang', `action ${i} (${a.kind}) pending over 10 s`, i);
      } else {
        add('exception', `action ${i} (${a.kind}) threw: ${errText(e)}`, i);
      }
    }
    actionsDone.push(a);
    i += 1;
    let state = {
      text: '',
      frameAge: 0,
      frameTimes: [] as number[],
      longTasks,
      canvasSample: [] as number[],
    };
    try {
      state = await page.evaluate(readState);
    } catch {
      /* page unreachable; the crash hook already reports it */
    }
    longTasks = state.longTasks;
    const bad = findBadText(state.text);
    if (bad !== null) add('bad-text', `page text shows '${bad}'`, i - 1);
    const sig = canvasSignature(state.canvasSample);
    if (state.canvasSample.length > 0 && i % 10 === 0) {
      signatures.push(sig);
      if (signatures.length >= 3 && blankStreak(signatures)) {
        add('blank-canvas', 'canvas stayed one colour across 3 samples', i - 1);
      }
    }
    if (isHang(state.frameAge, 0)) {
      add('hang', `no frame for ${Math.round(state.frameAge)} ms`, i - 1);
    }
    if (lowFps(state.frameTimes)) add('low-fps', 'average fps under 20', i - 1);
    if (stalled(`${state.text}|${sig}`)) {
      add('stall', 'page text and canvas unchanged for 40 actions', i - 1);
    }
    try {
      await page.waitForTimeout(args.throttleMs);
    } catch {
      /* throttle is best-effort once the page is gone */
    }
  }
  ended = true;
  try {
    await page.screenshot({ path: join(shotDir, `monkey-${entry.id}-${seed}.png`) });
  } catch {
    /* screenshot is best-effort */
  }
  await context.close().catch(() => undefined);
  const repro =
    'cd ts && npx vite-node tools/playtest-monkey.ts -- ' +
    `--demos ${entry.id} --replay ${logPath}`;
  return {
    demo: entry.id,
    seed,
    seconds: args.seconds,
    actionCount: actionsDone.length,
    findings,
    longTasks,
    logPath,
    repro,
  };
}

async function main(): Promise<number> {
  const parsed = parseMonkeyArgs(process.argv.slice(2));
  if (!parsed.ok) {
    for (const e of parsed.errors) console.error(e);
    return 2;
  }
  const args = parsed.value;
  const lib = 'playwright';
  const pw: any = await import(lib).catch(() => null);
  if (!pw) {
    console.error(
      'playwright is not installed: run "cd ts && npm install -D playwright" once, then "npx playwright install chromium"',
    );
    return 3;
  }
  const date = new Date().toISOString().slice(0, 10);
  const seed =
    args.seed === 'random' ? (Date.now() ^ (Math.random() * 2 ** 32)) >>> 0 : args.seed;
  console.log(`seed=${seed}`);
  const wanted = args.demos;
  const selected =
    wanted === 'all' ? SMOKE_ENTRIES : SMOKE_ENTRIES.filter((e) => wanted.includes(e.id));
  if (wanted !== 'all') {
    for (const id of wanted) {
      if (!SMOKE_ENTRIES.some((e) => e.id === id)) {
        console.log(`skipping '${id}': no manifest entry`);
      }
    }
  }
  const monkeyDir = join(args.out, 'playtest-monkey');
  const shotDir = join(args.out, `playtest-${date}`);
  mkdirSync(monkeyDir, { recursive: true });
  mkdirSync(shotDir, { recursive: true });
  let replay: MonkeyAction[] | null = null;
  if (args.replay !== null) {
    replay = parseLog(readFileSync(args.replay, 'utf8')).actions;
  }
  const browser = await pw.chromium.launch();
  const results: MonkeyDemoResult[] = [];
  const findingLines: string[] = [];
  try {
    for (const entry of selected) {
      const logPath = join(monkeyDir, `${entry.id}-${seed}.jsonl`);
      const r = await runDemo(browser, entry, args, seed, replay, logPath, shotDir);
      results.push(r);
      for (const f of r.findings) {
        findingLines.push(
          formatFinding('L3', entry.id, f.check, seed, f.actionIndex, f.message, r.repro),
        );
      }
    }
  } finally {
    await browser.close();
  }
  const report = renderMonkeyReport(date, results);
  writeFileSync(join(args.out, `playtest-monkey-${date}.md`), `${report}\n`);
  if (findingLines.length > 0) {
    appendFileSync(join(args.out, 'playtest-findings.md'), `${findingLines.join('\n')}\n`);
  }
  for (const line of report.split('\n').slice(0, 2)) console.log(line);
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
