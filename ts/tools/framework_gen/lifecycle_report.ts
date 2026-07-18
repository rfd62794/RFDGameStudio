import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { DetectionResult, LifecycleFinding } from './lifecycle_detector.js';

export interface ManifestEntry {
  name: string;
  status: string;
  notes: string;
}

export interface LifecycleReportOptions {
  detection: DetectionResult;
  manifestPath: string;
  sourcePath: string;
}

export interface CrossReferenceResult {
  fieldName: string;
  manifestEntry: ManifestEntry | null;
  sourceLocation: string | null;
  status: 'MATCHED' | 'NO_MATCHING_MANIFEST_ENTRY';
}

export function crossReferenceManifest(
  finding: LifecycleFinding,
  manifestText: string,
  sourceText: string,
): CrossReferenceResult {
  // Derive likely source function name: active_dispatch → resolveDispatch
  const baseName = finding.fieldName.replace('active_', '');
  const capitalized = baseName.charAt(0).toUpperCase() + baseName.slice(1);
  const candidates = [
    `resolve${capitalized}`,
    `retrieve${capitalized}`,
  ];

  const manifestEntries = parseManifest(manifestText);

  for (const candidate of candidates) {
    const entry = manifestEntries.find(e => e.name === candidate);
    if (entry) {
      // Find source location
      const sourceLocation = findSourceLocation(sourceText, candidate);
      return {
        fieldName: finding.fieldName,
        manifestEntry: entry,
        sourceLocation,
        status: 'MATCHED',
      };
    }
  }

  return {
    fieldName: finding.fieldName,
    manifestEntry: null,
    sourceLocation: null,
    status: 'NO_MATCHING_MANIFEST_ENTRY',
  };
}

export function generateLifecycleReport(opts: LifecycleReportOptions): string {
  const manifestText = readFileSync(resolve(opts.manifestPath), 'utf8');
  const sourceText = readFileSync(resolve(opts.sourcePath), 'utf8');
  const timestamp = new Date().toISOString().slice(0, 10);

  const flagged = opts.detection.findings.filter(f => f.status === 'POTENTIALLY_UNRESOLVED_LIFECYCLE');
  const resolved = opts.detection.findings.filter(f => f.status === 'RESOLVED');

  let out = `# Lifecycle Completeness Report — ${timestamp}\n\n`;
  out += `*Generated from: ${opts.detection.luaPath}*\n\n`;
  out += `## Summary\n\n`;
  out += `| Status | Count |\n|---|---|\n`;
  out += `| RESOLVED | ${resolved.length} |\n`;
  out += `| POTENTIALLY_UNRESOLVED_LIFECYCLE | ${flagged.length} |\n`;
  out += `| **Total detected** | **${opts.detection.findings.length}** |\n\n`;

  if (flagged.length > 0) {
    out += `## Flagged: Potentially Unresolved Lifecycles (${flagged.length} found)\n\n`;
    for (const finding of flagged) {
      out += formatFinding(finding, manifestText, sourceText);
    }
  } else {
    out += `## Flagged: Potentially Unresolved Lifecycles\n\n`;
    out += `None found — all detected launch patterns have matching completion writes.\n\n`;
  }

  if (resolved.length > 0) {
    out += `## Confirmed Resolved (${resolved.length} found)\n\n`;
    for (const finding of resolved) {
      out += `### ${finding.fieldName}\n`;
      out += `- Launch site: ${opts.detection.luaPath}:${finding.launchSite.lineNumber} (${finding.launchSite.functionName})\n`;
      out += `- Initial status: "${finding.launchSite.initialStatus}"\n`;
      for (const comp of finding.completions) {
        out += `- Completion (${comp.pattern}): line ${comp.lineNumber} — \`${comp.lineText}\`\n`;
      }
      out += '\n';
    }
  }

  return out;
}

function formatFinding(finding: LifecycleFinding, manifestText: string, sourceText: string): string {
  const xref = crossReferenceManifest(finding, manifestText, sourceText);

  let out = `### ${finding.fieldName}\n`;
  out += `- Launch site: ${finding.launchSite.lineNumber} (${finding.launchSite.functionName})\n`;
  out += `- Initial status: "${finding.launchSite.initialStatus}"\n`;
  out += `- Neither a clearing write nor a status-transition write found elsewhere in the file\n`;

  if (xref.status === 'MATCHED' && xref.manifestEntry) {
    out += `- Matching manifest entry: ${xref.manifestEntry.name}`;
    if (xref.sourceLocation) {
      out += ` (${xref.sourceLocation})`;
    }
    out += ` — manifest status: ${xref.manifestEntry.status}\n`;
  } else {
    out += `- Matching manifest entry: NO_MATCHING_MANIFEST_ENTRY — manual search required\n`;
  }

  if (finding.nearMisses.length > 0) {
    out += `- Near-miss references (lines that mention the field but don't clear or transition it):\n`;
    for (const miss of finding.nearMisses) {
      out += `  - ${miss}\n`;
    }
  }

  out += '\n';
  return out;
}

function parseManifest(manifestText: string): ManifestEntry[] {
  const entries: ManifestEntry[] = [];
  const lines = manifestText.split('\n');
  const tableRowPattern = /^\|\s+(\S+)\s+\|\s+(\w+)\s+\|\s+(\w+)\s+\|/;

  for (const line of lines) {
    const match = line.match(tableRowPattern);
    if (match && match[3] !== 'Status' && match[1] !== 'Symbol') {
      entries.push({
        name: match[1],
        status: match[3],
        notes: line,
      });
    }
  }

  return entries;
}

function findSourceLocation(sourceText: string, functionName: string): string | null {
  const lines = sourceText.split('\n');
  const pattern = new RegExp(`export\\s+function\\s+${escapeRegex(functionName)}\\s*\\(`);
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      return `line ${i + 1}`;
    }
  }
  return null;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
