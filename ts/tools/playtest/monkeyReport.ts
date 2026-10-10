// new: ts/tools/playtest/monkeyReport.ts
import { severityOf, type MonkeyFinding } from './detectors';
import type { MonkeyAction } from './monkey';

export interface MonkeyDemoResult {
  demo: string;
  seed: number;
  seconds: number;
  actionCount: number;
  findings: MonkeyFinding[];
  longTasks: number;
  logPath: string;
  repro: string;
}

type Verdict = 'CLEAN' | 'NEEDS-LOOK' | 'UNSAFE';

function verdictOf(findings: MonkeyFinding[]): Verdict {
  if (findings.some((f) => severityOf(f.check) === 'hard')) return 'UNSAFE';
  if (findings.length > 0) return 'NEEDS-LOOK';
  return 'CLEAN';
}

function compactAction(a: MonkeyAction): string {
  switch (a.kind) {
    case 'tap':
      return `#${a.i} tap(${a.x},${a.y})`;
    case 'key':
      return `#${a.i} key ${a.key}`;
    case 'drag':
      return `#${a.i} drag(${a.x},${a.y}->${a.x2},${a.y2})`;
    case 'scroll':
      return `#${a.i} scroll(${a.dy})`;
  }
}

export function renderMonkeyReport(date: string, results: MonkeyDemoResult[]): string {
  const withVerdict = results.map((r) => ({ r, verdict: verdictOf(r.findings) }));
  const counts: Record<Verdict, number> = { CLEAN: 0, 'NEEDS-LOOK': 0, UNSAFE: 0 };
  for (const { verdict } of withVerdict) counts[verdict] += 1;
  const lines: string[] = [
    `# Playtest monkey ${date}`,
    `CLEAN ${counts.CLEAN} | NEEDS-LOOK ${counts['NEEDS-LOOK']} | UNSAFE ${counts.UNSAFE}`,
  ];
  const nonClean = (v: Verdict): MonkeyDemoResult[] =>
    withVerdict
      .filter((x) => x.verdict === v)
      .map((x) => x.r)
      .sort((a, b) => a.demo.localeCompare(b.demo));
  for (const r of [...nonClean('UNSAFE'), ...nonClean('NEEDS-LOOK')]) {
    const v = verdictOf(r.findings);
    lines.push(
      `## ${r.demo}: ${v} (seed ${r.seed}, ${r.actionCount} actions, ${r.longTasks} long tasks)`,
    );
    for (const f of r.findings) {
      lines.push(`- ${f.check} at action ${f.actionIndex}: ${f.message}`);
    }
    const first = r.findings[0];
    if (first && first.lastActions.length > 0) {
      lines.push(`last actions: ${first.lastActions.map(compactAction).join(', ')}`);
    }
    lines.push(`log: ${r.logPath}`);
    lines.push(`repro: ${r.repro}`);
  }
  const clean = withVerdict
    .filter((x) => x.verdict === 'CLEAN')
    .map((x) => x.r.demo)
    .sort((a, b) => a.localeCompare(b));
  lines.push(clean.length > 0 ? `CLEAN: ${clean.join(', ')}` : 'CLEAN: none');
  return lines.join('\n');
}
