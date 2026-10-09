// new: ts/src/engine/tuning/report.ts
import type { GameTuning } from './types';
import { renderTable, type Row, type TargetResult } from './sweep';

export function renderReport(
  tuning: GameTuning,
  rows: Row[],
  results: TargetResult[],
  knob: string | null,
  dateISO: string
): string {
  const lines: string[] = [`# Balance report: ${tuning.gameId} (${dateISO})`, '', '## Targets', ''];
  lines.push('| id | scenario | band | measured | result | note |');
  lines.push('|---|---|---|---|---|---|');
  for (const r of results) {
    const measured = r.value === undefined ? 'n/a' : r.value.toFixed(3);
    lines.push(
      `| ${r.target.id} | ${r.target.scenario ?? 'default'} | ${r.target.min}..${r.target.max} | ${measured} | ${r.pass ? 'PASS' : 'FAIL'} | ${r.target.note} |`
    );
  }
  lines.push('');
  if (knob !== null) {
    const def = tuning.knobs.find(k => k.key === knob);
    const metricNames = [...new Set(rows.flatMap(r => Object.keys(r.metrics)))];
    lines.push('## Sweep', '');
    if (def) lines.push(`\`${knob}\` (default ${def.default}): ${def.affects}`, '');
    lines.push('```', renderTable(rows, metricNames), '```', '');
  }
  const runs = rows[0]?.runs ?? 0;
  lines.push(`Seeds 5000..${5000 + runs - 1}; bot strategy, not human play.`);
  return lines.join('\n') + '\n';
}
