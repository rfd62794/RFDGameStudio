import type { ClassificationResult } from './classify';

export function generateReport(result: ClassificationResult, sourceFilePath: string): string {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const converted = result.declarations.filter(d => d.isPureData);
  const notConverted = result.declarations.filter(d => !d.isPureData);

  let out = `# Framework Generation Report — ${sourceFilePath}, ${timestamp}\n\n`;

  out += `## Converted (${converted.length} declarations)\n`;
  if (converted.length === 0) {
    out += '- (none)\n';
  } else {
    for (const d of converted) {
      const yamlFile = camelToSnakeFile(d.name);
      const countStr = d.entryCount !== undefined ? ` (${d.entryCount} entries)` : '';
      out += `- ${d.name}${countStr} → ${yamlFile}\n`;
    }
  }

  out += `\n## Not Converted — Real Reasons Given (${notConverted.length} declarations)\n`;
  if (notConverted.length === 0) {
    out += '- (none)\n';
  } else {
    for (const d of notConverted) {
      out += `- ${d.name}: ${d.reason ?? 'unknown reason'}\n`;
    }
  }

  return out;
}

function camelToSnakeFile(name: string): string {
  return name.replace(/([A-Z])/g, '_$1').toLowerCase() + '.yaml';
}
