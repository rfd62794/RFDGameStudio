import type { AuditResult, AuditedSymbol } from './audit.js';

export function generateManifest(result: AuditResult): string {
  const timestamp = new Date().toISOString().slice(0, 10);

  let out = `# SlimeGarden Recovery Manifest\n\n`;
  out += `*Generated: ${timestamp}*\n\n`;
  out += `Cross-reference of all top-level exports in \`gameLogic.ts\` against\n`;
  out += `SlimeWorld's Lua (\`logic.lua\`), data (\`data.yaml\`), and TypeScript\n`;
  out += `(\`ts/src/games/slimeworld/\`) implementations.\n\n`;

  out += `## Status Definitions\n\n`;
  out += `- **RECOVERED**: Symbol found by direct name match AND called somewhere.\n`;
  out += `- **DEFINED_NOT_CALLED**: Symbol found by direct name match but never called.\n`;
  out += `- **NEEDS_HUMAN_REVIEW**: No direct name match — could be renamed, inline, or deliberately not ported.\n\n`;

  const breakdown = result.statusBreakdown;
  out += `## Summary\n\n`;
  out += `| Status | Count |\n|---|---|\n`;
  out += `| RECOVERED | ${breakdown.RECOVERED} |\n`;
  out += `| DEFINED_NOT_CALLED | ${breakdown.DEFINED_NOT_CALLED} |\n`;
  out += `| NEEDS_HUMAN_REVIEW | ${breakdown.NEEDS_HUMAN_REVIEW} |\n`;
  out += `| **Total** | **${result.symbols.length}** |\n\n`;

  out += `## Full Manifest\n\n`;
  out += `| Symbol | Kind | Status | Notes | Last Checked |\n`;
  out += `|---|---|---|---|---|\n`;
  for (const s of result.symbols) {
    out += `| ${s.name} | ${s.kind} | ${s.status} | ${s.notes} | ${timestamp} |\n`;
  }

  return out;
}

export function generateManifestSection(symbols: AuditedSymbol[], timestamp: string): string {
  let out = `| Symbol | Kind | Status | Notes | Last Checked |\n`;
  out += `|---|---|---|---|---|\n`;
  for (const s of symbols) {
    out += `| ${s.name} | ${s.kind} | ${s.status} | ${s.notes} | ${timestamp} |\n`;
  }
  return out;
}
