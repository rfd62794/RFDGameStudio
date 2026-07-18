import ts from 'typescript';
import { extractValue, type ClassifiedDeclaration } from './classify';

export function camelToSnake(key: string): string {
  return key.replace(/([A-Z])/g, '_$1').toLowerCase();
}

export function convertKeysToSnake(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(convertKeysToSnake);
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[camelToSnake(key)] = convertKeysToSnake(value);
    }
    return result;
  }
  return obj;
}

export function declarationToYaml(decl: ClassifiedDeclaration): string {
  const value = extractValue(decl.node.initializer);
  const snakeValue = convertKeysToSnake(value);
  const key = camelToSnake(decl.name);
  return yamlSerialize(key, snakeValue);
}

function yamlSerialize(key: string, value: unknown, indent: number = 0): string {
  const pad = '  '.repeat(indent);

  if (Array.isArray(value)) {
    if (value.length === 0) return `${key}: []\n`;
    let out = `${key}:\n`;
    for (const item of value) {
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        const entries = Object.entries(item as Record<string, unknown>);
        if (entries.length === 0) {
          out += `${pad}  - {}\n`;
        } else {
          const [firstKey, firstVal] = entries[0];
          out += `${pad}  - ${yamlInline(firstKey, firstVal)}`;
          for (let i = 1; i < entries.length; i++) {
            const [k, v] = entries[i];
            out += `, ${yamlInline(k, v)}`;
          }
          out += '\n';
        }
      } else if (Array.isArray(item)) {
        out += `${pad}  - [${item.map(yamlScalar).join(', ')}]\n`;
      } else {
        out += `${pad}  - ${yamlScalar(item)}\n`;
      }
    }
    return out;
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return `${key}: {}\n`;
    let out = `${key}:\n`;
    for (const [k, v] of entries) {
      if (v !== null && typeof v === 'object') {
        out += yamlSerialize(k, v, indent + 1);
      } else {
        out += `${pad}  ${k}: ${yamlScalar(v)}\n`;
      }
    }
    return out;
  }

  return `${key}: ${yamlScalar(value)}\n`;
}

function yamlInline(key: string, value: unknown): string {
  if (Array.isArray(value)) {
    return `${key}: [${value.map(yamlScalar).join(', ')}]`;
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    return `${key}: {${entries.map(([k, v]) => yamlInline(k, v)).join(', ')}}`;
  }
  return `${key}: ${yamlScalar(value)}`;
}

export function yamlScalar(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') {
    if (/[:#\[\]{}&*!|>'"%@`]/.test(value) || value.includes(', ')) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return String(value);
}
