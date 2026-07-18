import ts from 'typescript';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';
import { camelToSnake } from './emit_yaml.js';

export type SymbolKind = 'function' | 'const';
export type SymbolStatus = 'RECOVERED' | 'DEFINED_NOT_CALLED' | 'NEEDS_HUMAN_REVIEW';

export interface AuditedSymbol {
  name: string;
  kind: SymbolKind;
  snakeName: string;
  status: SymbolStatus;
  notes: string;
  isPureData: boolean;
}

export interface AuditResult {
  sourceFile: string;
  symbols: AuditedSymbol[];
  statusBreakdown: Record<SymbolStatus, number>;
}

export interface AuditOptions {
  sourcePath: string;
  luaPath: string;
  dataYamlPath: string;
  tsSlimeworldDir: string;
}

export function auditExports(opts: AuditOptions): AuditResult {
  const sourceText = readFileSync(resolve(opts.sourcePath), 'utf8');
  const sourceFile = ts.createSourceFile('gameLogic.ts', sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  const luaText = readFileSync(resolve(opts.luaPath), 'utf8');
  const yamlText = readFileSync(resolve(opts.dataYamlPath), 'utf8');
  const tsFiles = collectTsFiles(opts.tsSlimeworldDir);
  const tsFileContents: Record<string, string> = {};
  for (const f of tsFiles) {
    tsFileContents[f] = readFileSync(f, 'utf8');
  }

  const symbols: AuditedSymbol[] = [];

  for (const stmt of sourceFile.statements) {
    // export function
    if (ts.isFunctionDeclaration(stmt) && hasExportModifier(stmt)) {
      const name = stmt.name?.text;
      if (!name) continue;
      symbols.push(auditSymbol(name, 'function', luaText, yamlText, tsFileContents));
      continue;
    }

    // export const
    if (ts.isVariableStatement(stmt) && hasExportModifier(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        const name = decl.name.getText(sourceFile);
        const isPureData = classifyConstPurity(decl, sourceFile);
        symbols.push(auditSymbol(name, 'const', luaText, yamlText, tsFileContents, isPureData));
      }
    }
  }

  const statusBreakdown: Record<SymbolStatus, number> = {
    RECOVERED: 0,
    DEFINED_NOT_CALLED: 0,
    NEEDS_HUMAN_REVIEW: 0,
  };
  for (const s of symbols) {
    statusBreakdown[s.status]++;
  }

  return { sourceFile: opts.sourcePath, symbols, statusBreakdown };
}

function auditSymbol(
  name: string,
  kind: SymbolKind,
  luaText: string,
  yamlText: string,
  tsFileContents: Record<string, string>,
  isPureData: boolean = false,
): AuditedSymbol {
  const snakeName = camelToSnake(name);

  // 1. Direct name match: search for function definition in Lua
  const luaFuncPattern = new RegExp(`function\\s+${escapeRegex(snakeName)}\\s*\\(`);
  const luaFuncFound = luaFuncPattern.test(luaText);

  // Also check data.yaml for the key (for consts)
  const yamlKeyPattern = new RegExp(`^${escapeRegex(snakeName)}:\\s`, 'm');
  const yamlKeyFound = yamlKeyPattern.test(yamlText);

  const definedSomewhere = luaFuncFound || yamlKeyFound;

  if (!definedSomewhere) {
    return {
      name,
      kind,
      snakeName,
      status: 'NEEDS_HUMAN_REVIEW',
      notes: 'No direct name match — likely renamed, inline, or deliberately not ported. Confirm.',
      isPureData,
    };
  }

  // 2. Check if it's called/used (not just defined)
  // For functions: look for snakeName( — a function call
  // For consts: also look for snakeName[ or snakeName. — bracket/dot access
  // These are separate patterns by kind to avoid false positives
  // (e.g. a function name in a comment followed by a period at end of sentence)
  const luaCallPattern = new RegExp(`[^a-zA-Z_]${escapeRegex(snakeName)}\\s*\\(`);
  // Remove the definition line to avoid false positive
  const luaWithoutDef = luaText.replace(luaFuncPattern, '');
  const luaCalled = luaCallPattern.test(luaWithoutDef);

  // Separate const-usage check: bracket or dot access (e.g. SEED_SHAPE_DEFAULTS[color])
  // Check both snake_case and original name — SCREAMING_SNAKE_CASE consts may keep
  // their original casing in Lua (e.g. local SEED_SHAPE_DEFAULTS = {...})
  let luaConstUsed = false;
  if (kind === 'const') {
    const snakeUsagePattern = new RegExp(`\\b${escapeRegex(snakeName)}\\s*[\\[\\.]`);
    const originalUsagePattern = new RegExp(`\\b${escapeRegex(name)}\\s*[\\[\\.]`);
    // Also remove any Lua local/const definition lines to avoid false positives
    const luaWithoutConstDef = luaWithoutDef
      .replace(new RegExp(`local\\s+${escapeRegex(name)}\\s*=`), '')
      .replace(new RegExp(`local\\s+${escapeRegex(snakeName)}\\s*=`), '');
    luaConstUsed = snakeUsagePattern.test(luaWithoutConstDef) || originalUsagePattern.test(luaWithoutConstDef);
  }

  const luaUsed = luaCalled || luaConstUsed;

  // Search in TS files for any reference to the name
  let tsCalled = false;
  for (const [, content] of Object.entries(tsFileContents)) {
    const tsCallPattern = new RegExp(`\\b${escapeRegex(name)}\\b`);
    if (tsCallPattern.test(content)) {
      tsCalled = true;
      break;
    }
  }

  if (luaUsed || tsCalled) {
    const where: string[] = [];
    if (luaUsed) where.push('logic.lua');
    if (tsCalled) where.push('TS');
    return {
      name,
      kind,
      snakeName,
      status: 'RECOVERED',
      notes: `${snakeName}, called in ${where.join(' + ')}`,
      isPureData,
    };
  }

  return {
    name,
    kind,
    snakeName,
    status: 'DEFINED_NOT_CALLED',
    notes: `${snakeName} found but never called — confirm whether wiring is missing or deliberately omitted`,
    isPureData,
  };
}

function hasExportModifier(stmt: ts.Statement): boolean {
  const modifiers = (stmt as ts.FunctionDeclaration | ts.VariableStatement).modifiers;
  return modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
}

function classifyConstPurity(decl: ts.VariableDeclaration, sourceFile: ts.SourceFile): boolean {
  const init = decl.initializer;
  if (!init) return false;
  if (ts.isArrayLiteralExpression(init) || ts.isObjectLiteralExpression(init)) {
    return checkLiteralPurity(init, sourceFile);
  }
  return false;
}

function checkLiteralPurity(node: ts.Expression, sourceFile: ts.SourceFile): boolean {
  if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return true;
  if (node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword) return true;
  if (node.kind === ts.SyntaxKind.NullKeyword || node.kind === ts.SyntaxKind.UndefinedKeyword) return true;
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.every(e => checkLiteralPurity(e, sourceFile));
  }
  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.every(prop => {
      if (ts.isPropertyAssignment(prop)) return checkLiteralPurity(prop.initializer, sourceFile);
      return false;
    });
  }
  return false;
}

function collectTsFiles(dir: string): string[] {
  const resolved = resolve(dir);
  const entries = readdirSync(resolved, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(resolved, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
    } else if (extname(entry.name) === '.ts' || extname(entry.name) === '.tsx') {
      files.push(fullPath);
    }
  }
  return files;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
