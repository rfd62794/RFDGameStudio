// new: ts/tools/playtest/smokeReport.ts
import type { SmokeFinding, Verdict } from './verdict';

export interface SmokeDemoResult {
  demo: string;
  verdict: Verdict;
  findings: SmokeFinding[];
  firstActionMs: number | null;
  screenshots: string[];
  repro: string;
}

export function renderSmokeReport(date: string, results: SmokeDemoResult[]): string {
  const counts: Record<Verdict, number> = { SAFE: 0, 'NEEDS-LOOK': 0, UNSAFE: 0 };
  for (const r of results) counts[r.verdict] += 1;
  const lines: string[] = [
    `# Playtest smoke ${date}`,
    `SAFE ${counts.SAFE} | NEEDS-LOOK ${counts['NEEDS-LOOK']} | UNSAFE ${counts.UNSAFE}`,
  ];
  const nonSafe = (v: Verdict) =>
    results
      .filter((r) => r.verdict === v)
      .sort((a, b) => a.demo.localeCompare(b.demo));
  for (const r of [...nonSafe('UNSAFE'), ...nonSafe('NEEDS-LOOK')]) {
    lines.push(`## ${r.demo}: ${r.verdict}`);
    for (const f of r.findings) {
      lines.push(`- ${f.viewport} ${f.check}: ${f.message}`);
    }
    if (r.firstActionMs !== null) {
      lines.push(`first action ${(r.firstActionMs / 1000).toFixed(1)} s`);
    }
    for (const s of r.screenshots) {
      lines.push(s);
    }
    lines.push(`repro: ${r.repro}`);
  }
  const safe = results
    .filter((r) => r.verdict === 'SAFE')
    .map((r) => r.demo)
    .sort((a, b) => a.localeCompare(b));
  lines.push(safe.length > 0 ? `SAFE: ${safe.join(', ')}` : 'SAFE: none');
  return lines.join('\n');
}
