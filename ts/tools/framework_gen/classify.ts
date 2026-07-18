import ts from 'typescript';

export interface ClassifiedDeclaration {
  name: string;
  isPureData: boolean;
  kind: 'array' | 'object' | 'other';
  entryCount?: number;
  reason?: string;
  node: ts.VariableDeclaration;
}

export interface ClassificationResult {
  sourceFile: string;
  declarations: ClassifiedDeclaration[];
}

export function classifySourceFile(sourceText: string, fileName: string = 'input.ts'): ClassificationResult {
  const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const declarations: ClassifiedDeclaration[] = [];

  for (const stmt of sourceFile.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    const hasExport = stmt.modifiers?.some((m: ts.Modifier) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
    if (!hasExport) continue;

    for (const decl of stmt.declarationList.declarations) {
      const name = decl.name.getText(sourceFile);
      const result = classifyInitializer(decl.initializer, sourceFile);
      declarations.push({
        name,
        isPureData: result.isPureData,
        kind: result.kind,
        entryCount: result.entryCount,
        reason: result.reason,
        node: decl,
      });
    }
  }

  return { sourceFile: fileName, declarations };
}

interface InitResult {
  isPureData: boolean;
  kind: 'array' | 'object' | 'other';
  entryCount?: number;
  reason?: string;
}

function classifyInitializer(node: ts.Expression | undefined, sourceFile: ts.SourceFile): InitResult {
  if (!node) return { isPureData: false, kind: 'other', reason: 'No initializer' };

  if (ts.isArrayLiteralExpression(node)) {
    const count = node.elements.length;
    for (const elem of node.elements) {
      const r = checkLiteral(elem, sourceFile);
      if (!r.isPure) {
        return { isPureData: false, kind: 'array', entryCount: count, reason: r.reason };
      }
    }
    return { isPureData: true, kind: 'array', entryCount: count };
  }

  if (ts.isObjectLiteralExpression(node)) {
    const count = node.properties.length;
    for (const prop of node.properties) {
      const r = checkObjectProperty(prop, sourceFile);
      if (!r.isPure) {
        return { isPureData: false, kind: 'object', entryCount: count, reason: r.reason };
      }
    }
    return { isPureData: true, kind: 'object', entryCount: count };
  }

  return { isPureData: false, kind: 'other', reason: `Initializer is ${ts.SyntaxKind[node.kind]}, not an array or object literal` };
}

interface LiteralCheck {
  isPure: boolean;
  reason?: string;
}

function checkLiteral(node: ts.Node, sourceFile: ts.SourceFile): LiteralCheck {
  if (node.kind === ts.SyntaxKind.SpreadElement) {
    return { isPure: false, reason: 'Spread element — cannot prove purity' };
  }
  if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return { isPure: true };
  if (node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword) return { isPure: true };
  if (node.kind === ts.SyntaxKind.NullKeyword || node.kind === ts.SyntaxKind.UndefinedKeyword) return { isPure: true };
  if (ts.isArrayLiteralExpression(node)) {
    for (const elem of node.elements) {
      const r = checkLiteral(elem, sourceFile);
      if (!r.isPure) return r;
    }
    return { isPure: true };
  }
  if (ts.isObjectLiteralExpression(node)) {
    for (const prop of node.properties) {
      const r = checkObjectProperty(prop, sourceFile);
      if (!r.isPure) return r;
    }
    return { isPure: true };
  }
  if (ts.isIdentifier(node)) {
    return { isPure: false, reason: `References external identifier "${node.getText(sourceFile)}"` };
  }
  if (ts.isCallExpression(node)) {
    return { isPure: false, reason: `Contains a function call ("${node.expression.getText(sourceFile)}(...)") in an array element` };
  }
  if (ts.isBinaryExpression(node) || ts.isPrefixUnaryExpression(node)) {
    return { isPure: false, reason: 'Contains a computed expression' };
  }
  if (ts.isPropertyAccessExpression(node)) {
    return { isPure: false, reason: `References external property "${node.getText(sourceFile)}"` };
  }
  if (ts.isComputedPropertyName(node)) {
    return { isPure: false, reason: 'Computed property name — cannot prove purity' };
  }
  if (ts.isTemplateExpression(node)) {
    return { isPure: false, reason: 'Template expression with interpolation — not a literal' };
  }

  return { isPure: false, reason: `Disqualified construct: ${ts.SyntaxKind[node.kind]}` };
}

function checkObjectProperty(prop: ts.ObjectLiteralElementLike, sourceFile: ts.SourceFile): LiteralCheck {
  if (ts.isSpreadAssignment(prop)) {
    return { isPure: false, reason: 'Spread assignment — cannot prove purity' };
  }
  if (prop.kind === ts.SyntaxKind.ComputedProperty) {
    return { isPure: false, reason: 'Computed property name — cannot prove purity' };
  }
  if (ts.isShorthandPropertyAssignment(prop)) {
    return { isPure: false, reason: `Shorthand property references identifier "${prop.name.getText(sourceFile)}"` };
  }
  if (ts.isPropertyAssignment(prop)) {
    return checkLiteral(prop.initializer, sourceFile);
  }
  return { isPure: false, reason: `Disallowed property kind: ${ts.SyntaxKind[prop.kind]}` };
}

export function extractValue(node: ts.Expression | undefined): unknown {
  if (!node) return null;
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(extractValue);
  if (ts.isObjectLiteralExpression(node)) {
    const obj: Record<string, unknown> = {};
    for (const prop of node.properties) {
      if (ts.isPropertyAssignment(prop)) {
        const key = prop.name.getText();
        obj[key] = extractValue(prop.initializer);
      }
    }
    return obj;
  }
  return null;
}
