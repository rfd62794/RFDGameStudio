/**
 * Devlog parsers for the arcade manifest. Each turns one studio source file
 * into dated entries. An entry whose date can't be parsed is reported in
 * `skipped`, never given an invented date.
 */
export type DevlogSource = 'changelog' | 'patch-notes' | 'intake' | 'status';

export interface DevlogEntry {
  date: string; // YYYY-MM-DD
  title: string;
  source: DevlogSource;
}

export interface ParseResult {
  entries: DevlogEntry[];
  skipped: string[];
}

const MONTHS: Record<string, string> = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
};

/** "August 14 2026" or "August 23, 2026" → "2026-08-14"; null when unparseable. */
export function parseLongDate(text: string): string | null {
  const m = /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/.exec(text.trim());
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  return month ? `${m[3]}-${month}-${m[2].padStart(2, '0')}` : null;
}

/** One entry per `## heading`, dated by the first `**Date:**` line under it. */
export function parseChangelog(text: string): ParseResult {
  const entries: DevlogEntry[] = [];
  const skipped: string[] = [];
  let title: string | null = null;
  let date: string | null = null;
  const flush = () => {
    if (title === null) return;
    if (date) entries.push({ date, title, source: 'changelog' });
    else skipped.push(title);
  };
  for (const line of text.split(/\r?\n/)) {
    const heading = /^## (.+?)\s*$/.exec(line);
    if (heading) {
      flush();
      title = heading[1].replace(/\s+—\s+COMPLETED.*$/i, '').trim();
      date = null;
      continue;
    }
    const dateLine = /^\*\*Date:\*\*\s*(.+?)\s*$/.exec(line);
    if (dateLine && title !== null && date === null) date = parseLongDate(dateLine[1]);
  }
  flush();
  return { entries, skipped };
}

/** One entry per patch-notes file: version from the file name, date from a `**Month D, YYYY**` line. */
export function parsePatchNotes(text: string, fileName: string): ParseResult {
  const version = /v(\d+\.\d+\.\d+)/.exec(fileName)?.[1];
  const title = version ? `Patch notes v${version}` : 'Patch notes';
  const m = /^\*\*([A-Za-z]+\s+\d{1,2},?\s+\d{4})\*\*\s*$/m.exec(text);
  const date = m ? parseLongDate(m[1]) : null;
  return date
    ? { entries: [{ date, title, source: 'patch-notes' }], skipped: [] }
    : { entries: [], skipped: [title] };
}

/** One entry per `### <version> <sep> <ISO timestamp>` block, titled with its `- Note:`. */
export function parseIntakeManifest(text: string): ParseResult {
  const entries: DevlogEntry[] = [];
  const skipped: string[] = [];
  for (const block of text.split(/^### /m).slice(1)) {
    const [head, ...rest] = block.split(/\r?\n/);
    const m = /^(\S+)\s+\S+\s+(\d{4}-\d{2}-\d{2})T/.exec(head);
    if (!m) {
      skipped.push(head.trim());
      continue;
    }
    const note = rest.map(l => /^\s*-\s*Note:\s*(.+?)\s*$/.exec(l)?.[1]).find(Boolean);
    const short = note ? (note.length > 90 ? `${note.slice(0, 87).trimEnd()}…` : note) : 'New build';
    entries.push({ date: m[2], title: `v${m[1]} — ${short}`, source: 'intake' });
  }
  return { entries, skipped };
}
