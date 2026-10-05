// new: ts/tools/tune-sweep.ts
// Headless tuning sweep. Usage (from ts/):
//   npx vite-node tools/tune-sweep.ts -- --game <id> [--knob <key> --from <n> --to <n> --step <n>] [--runs <n>] [--check] [--report]
// All logic lives in src/engine/tuning/sweep.ts and report.ts; this file is glue only.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getTuning } from '../src/games/tuning-registry';
import {
  parseArgs,
  sweepValues,
  runRows,
  checkTargets,
  renderTable,
} from '../src/engine/tuning/sweep';
import { renderReport } from '../src/engine/tuning/report';

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const tuning = getTuning(args.game);
  if (!tuning) {
    console.error(`no tuning declared for ${args.game}`);
    process.exit(2);
  }
  const knob = args.knob ?? null;
  const values = knob === null ? [] : sweepValues(args.from!, args.to!, args.step!);
  const rows = runRows(tuning, knob, values, args.runs);
  if (args.check && knob !== null) rows.push(...runRows(tuning, null, [], args.runs));
  const metricNames = [...new Set(rows.flatMap(r => Object.keys(r.metrics)))];
  console.log(renderTable(rows, metricNames));
  const results = args.check ? checkTargets(tuning, rows) : [];
  for (const r of results) {
    const measured = r.value === undefined ? 'n/a' : r.value.toFixed(3);
    console.log(
      `${r.pass ? 'PASS' : 'FAIL'} ${r.target.id} ${r.target.metric} ${r.target.min}..${r.target.max} measured ${measured}`
    );
  }
  if (results.some(r => !r.pass)) process.exitCode = 1;
  if (args.report) {
    const dateISO = new Date().toISOString().slice(0, 10);
    const dir = resolve(import.meta.dirname, '../../docs/state');
    mkdirSync(dir, { recursive: true });
    const file = resolve(dir, `balance-${args.game}-${dateISO}.md`);
    writeFileSync(file, renderReport(tuning, rows, results, knob, dateISO), 'utf-8');
    console.log(`wrote ${file}`);
  }
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(2);
}
