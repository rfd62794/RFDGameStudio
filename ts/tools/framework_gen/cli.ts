import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { classifySourceFile } from './classify.js';
import { declarationToYaml, camelToSnake } from './emit_yaml.js';
import { generateReport } from './report.js';

export interface CliOptions {
  input: string;
  outputDir?: string;
}

export interface CliResult {
  yamlFiles: string[];
  reportFile: string;
  reportContent: string;
}

export function runCli(opts: CliOptions): CliResult {
  const inputPath = resolve(opts.input);
  const sourceText = readFileSync(inputPath, 'utf8');
  const fileName = basename(inputPath);

  const result = classifySourceFile(sourceText, fileName);

  const outputDir = opts.outputDir ? resolve(opts.outputDir) : join(dirname(inputPath), 'framework_gen_output');
  mkdirSync(outputDir, { recursive: true });

  const yamlFiles: string[] = [];
  for (const decl of result.declarations) {
    if (!decl.isPureData) continue;
    const yamlContent = declarationToYaml(decl);
    const yamlFileName = camelToSnake(decl.name) + '.yaml';
    const yamlPath = join(outputDir, yamlFileName);
    writeFileSync(yamlPath, yamlContent, 'utf8');
    yamlFiles.push(yamlPath);
  }

  const reportContent = generateReport(result, inputPath);
  const reportPath = join(outputDir, 'report.md');
  writeFileSync(reportPath, reportContent, 'utf8');

  return { yamlFiles, reportFile: reportPath, reportContent };
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const inputArg = process.argv[2];
  if (!inputArg) {
    console.error('Usage: tsx cli.ts <input.ts> [output-dir]');
    process.exit(1);
  }
  const outputArg = process.argv[3];
  const result = runCli({ input: inputArg, outputDir: outputArg });
  console.log(`Wrote ${result.yamlFiles.length} YAML file(s) and report to ${result.reportFile}`);
}
