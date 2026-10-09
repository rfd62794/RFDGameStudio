// new: ts/tools/playtest-smoke.ts
/**
 * Browser smoke runner (Layer 2). Controller-run: it needs the plain
 * `playwright` library, which is NOT in package.json yet, so the import is
 * dynamic and the script exits 3 with the install hint when it is absent.
 *
 * Usage (from ts/):
 *   cd ts && npx vite-node tools/playtest-smoke.ts -- --base http://127.0.0.1:5199 --demos all
 *   cd ts && npx vite-node tools/playtest-smoke.ts -- --target live --base https://games.rfditservices.com --demos shoal
 */
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { formatFinding } from '../src/engine/playtest';
import { parseArgs, type Args } from './playtest/args';
import { SMOKE_ENTRIES } from './playtest/entries';
import {
  urlFor,
  validateEntries,
  type Locator,
  type SmokeEntry,
  type SmokeStep,
} from './playtest/manifest';
import { collectClipChain, readPageFacts } from './playtest/pageProbes';
import { renderSmokeReport, type SmokeDemoResult } from './playtest/smokeReport';
import {
  classifyVerdict,
  isAllowedConsole,
  isClipped,
  tapTargetOk,
  type ChainLink,
  type Severity,
  type SmokeFinding,
} from './playtest/verdict';

const VP: Record<'desktop' | 'phone', { label: string; w: number; h: number; mobile: boolean }> = {
  desktop: { label: '1280x720', w: 1280, h: 720, mobile: false },
  phone: { label: '390x844', w: 390, h: 844, mobile: true },
};

const errText = (e: unknown): string => (e instanceof Error ? e.message : String(e));

function locate(page: any, target: Locator): any {
  return 'text' in target
    ? page.getByText(target.text, { exact: false }).first()
    : page.getByRole(target.role, { name: target.name });
}

function describeStep(step: SmokeStep): string {
  switch (step.do) {
    case 'click':
      return 'text' in step.target
        ? `click '${step.target.text}'`
        : `click role=${step.target.role} name='${step.target.name}'`;
    case 'key':
      return `key ${step.key}`;
    case 'wait':
      return `wait ${step.ms}ms`;
    case 'see':
      return `see ${step.text.join(', ')}`;
  }
}

function reproFor(entry: SmokeEntry, args: Args): string {
  const live = args.target === 'live' ? ' --target live' : '';
  return `cd ts && npx vite-node tools/playtest-smoke.ts -- --base ${args.base} --demos ${entry.id}${live}`;
}

interface ViewportResult {
  findings: SmokeFinding[];
  firstActionMs: number | null;
  screenshots: string[];
}

async function runViewport(
  browser: any,
  entry: SmokeEntry,
  vpName: 'desktop' | 'phone',
  args: Args,
  outDir: string,
): Promise<ViewportResult> {
  const vp = VP[vpName];
  const context = await browser.newContext(
    vp.mobile
      ? {
          viewport: { width: vp.w, height: vp.h },
          isMobile: true,
          hasTouch: true,
          deviceScaleFactor: 2,
        }
      : { viewport: { width: vp.w, height: vp.h } },
  );
  const page = await context.newPage();
  const findings: SmokeFinding[] = [];
  const screenshots: string[] = [];
  let stepIndex = 0;
  const add = (check: string, severity: Severity, message: string, step?: number): void => {
    findings.push({
      demo: entry.id,
      viewport: vp.label,
      check,
      severity,
      message,
      step: step ?? stepIndex,
    });
  };
  page.on('console', (msg: any) => {
    const type = msg.type();
    const text = msg.text();
    if (isAllowedConsole(type, text)) return;
    if (type === 'error') add('console-error', 'hard', text);
    else if (type === 'warning') add('console-warning', 'soft', text);
  });
  page.on('pageerror', (err: unknown) => add('uncaught-exception', 'hard', errText(err)));
  page.on('requestfailed', (req: any) => {
    if (req.url().includes('favicon.ico')) return;
    add('failed-request', 'hard', `${req.failure()?.errorText ?? 'failed'} ${req.url()}`);
  });
  page.on('response', (res: any) => {
    if (res.status() >= 400 && !res.url().includes('favicon.ico')) {
      add('failed-request', 'hard', `HTTP ${res.status()} ${res.url()}`);
    }
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const url = urlFor(entry, args.target, args.base);
  const goto = async (): Promise<void> => {
    try {
      await page.goto(url, { waitUntil: 'load' });
    } catch (e) {
      add('load', 'hard', `goto ${url} failed: ${errText(e)}`);
    }
  };
  const t0 = Date.now();
  await goto();
  const loadMs = Date.now() - t0;
  if (loadMs > 5000) add('slow-load', 'soft', `load took ${loadMs} ms`);
  try {
    const p = join(outDir, `${entry.id}-${vp.w}-load.png`);
    await page.screenshot({ path: p });
    screenshots.push(p);
  } catch {
    /* screenshot is best-effort */
  }
  try {
    const facts = await page.evaluate(readPageFacts);
    if (facts.scrollWidth > facts.innerWidth + 1) {
      add(
        'horizontal-overflow',
        'hard',
        `scrollWidth ${facts.scrollWidth} > innerWidth ${facts.innerWidth}`,
      );
    }
    if (/\bNaN\b|\[object Object\]/.test(facts.bodyText)) {
      add('nan-text', 'hard', 'page text contains NaN or [object Object]');
    }
  } catch (e) {
    add('load', 'hard', `page probes failed: ${errText(e)}`);
  }
  const runSteps = async (steps: SmokeStep[], label: string): Promise<void> => {
    for (const step of steps) {
      stepIndex += 1;
      try {
        if (step.do === 'click') {
          await locate(page, step.target).click();
        } else if (step.do === 'key') {
          await page.keyboard.press(step.key);
        } else if (step.do === 'wait') {
          await page.waitForTimeout(step.ms);
        } else {
          for (const t of step.text) {
            await page
              .getByText(t, { exact: false })
              .first()
              .waitFor({ state: 'visible', timeout: 3000 });
          }
        }
      } catch (e) {
        add(
          'step-failed',
          'hard',
          `${label} step ${stepIndex} (${describeStep(step)}): ${errText(e)}`,
          stepIndex,
        );
        continue;
      }
      for (const t of 'expect' in step ? step.expect ?? [] : []) {
        try {
          await page
            .getByText(t, { exact: false })
            .first()
            .waitFor({ state: 'visible', timeout: 3000 });
        } catch {
          add('step-failed', 'hard', `${label} step ${stepIndex}: expected '${t}' not visible`, stepIndex);
        }
      }
      for (const t of 'expectGone' in step ? step.expectGone ?? [] : []) {
        try {
          await page
            .getByText(t, { exact: false })
            .first()
            .waitFor({ state: 'hidden', timeout: 3000 });
        } catch {
          add('step-failed', 'hard', `${label} step ${stepIndex}: '${t}' still visible`, stepIndex);
        }
      }
    }
  };
  await runSteps(entry.firstMinute, 'firstMinute');
  const firstActionMs = entry.firstMinute.length > 0 ? Date.now() - t0 : null;
  if (firstActionMs !== null && firstActionMs > 60000) {
    add('slow-first-action', 'soft', `first action took ${Math.round(firstActionMs / 1000)} s`);
  }
  for (const name of entry.controls) {
    const loc = page.getByText(name, { exact: false }).first();
    let box: { x: number; y: number; width: number; height: number } | null = null;
    try {
      await loc.waitFor({ state: 'visible', timeout: 3000 });
      box = await loc.boundingBox();
    } catch {
      box = null;
    }
    if (!box) {
      add('control-missing', 'hard', `control '${name}' not visible within 3000 ms`);
      continue;
    }
    let chain: ChainLink[] = [];
    try {
      chain = await loc.evaluate(collectClipChain);
    } catch {
      /* unverifiable; skip the clip check */
    }
    if (isClipped(chain, { w: vp.w, h: vp.h })) {
      add('control-clipped', 'hard', `'${name}' at x=${Math.round(box.x)} w=${Math.round(box.width)}`);
    }
    if (
      vpName === 'phone' &&
      !tapTargetOk({ x: box.x, y: box.y, w: box.width, h: box.height })
    ) {
      add(
        'tap-target-small',
        'soft',
        `'${name}' is ${Math.round(box.width)}x${Math.round(box.height)} px`,
      );
    }
  }
  for (let ci = 0; ci < entry.changeChecks.length; ci++) {
    await goto();
    await runSteps(entry.changeChecks[ci], `changeChecks[${ci}]`);
  }
  try {
    const p = join(outDir, `${entry.id}-${vp.w}-after.png`);
    await page.screenshot({ path: p });
    screenshots.push(p);
  } catch {
    /* screenshot is best-effort */
  }
  if (findings.length > 0) {
    await context.tracing.stop({ path: join(outDir, `${entry.id}-${vp.label}.zip`) });
  } else {
    await context.tracing.stop();
  }
  await context.close();
  return { findings, firstActionMs, screenshots };
}

async function main(): Promise<number> {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed.ok) {
    for (const e of parsed.errors) console.error(e);
    return 2;
  }
  const args = parsed.value;
  const problems = validateEntries(SMOKE_ENTRIES);
  if (problems.length > 0) {
    for (const p of problems) console.error(p);
    return 2;
  }
  const wanted = args.demos;
  const selected =
    wanted === 'all' ? SMOKE_ENTRIES : SMOKE_ENTRIES.filter((e) => wanted.includes(e.id));
  const lib = 'playwright';
  const pw: any = await import(lib).catch(() => null);
  if (!pw) {
    console.error(
      'playwright is not installed: run "cd ts && npm install -D playwright" once, then "npx playwright install chromium"',
    );
    return 3;
  }
  const date = new Date().toISOString().slice(0, 10);
  const outDir = join(args.out, `playtest-${date}`);
  mkdirSync(outDir, { recursive: true });
  const browser = await pw.chromium.launch();
  const results: SmokeDemoResult[] = [];
  const findingLines: string[] = [];
  try {
    for (const entry of selected) {
      const findings: SmokeFinding[] = [];
      const screenshots: string[] = [];
      let firstActionMs: number | null = null;
      for (const vpName of args.viewports) {
        const r = await runViewport(browser, entry, vpName, args, outDir);
        findings.push(...r.findings);
        screenshots.push(...r.screenshots);
        if (r.firstActionMs !== null && (firstActionMs === null || r.firstActionMs > firstActionMs)) {
          firstActionMs = r.firstActionMs;
        }
      }
      const repro = reproFor(entry, args);
      results.push({
        demo: entry.id,
        verdict: classifyVerdict(findings),
        findings,
        firstActionMs,
        screenshots,
        repro,
      });
      for (const f of findings) {
        findingLines.push(formatFinding('L2', entry.id, f.check, 'script', f.step, f.message, repro));
      }
    }
  } finally {
    await browser.close();
  }
  const report = renderSmokeReport(date, results);
  writeFileSync(join(args.out, `playtest-${date}.md`), `${report}\n`);
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
