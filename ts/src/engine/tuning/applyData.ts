// new: ts/src/engine/tuning/applyData.ts
import type { Overrides } from './types';

function child(node: unknown, segment: string): unknown {
  if (Array.isArray(node)) {
    if (segment === '') return undefined;
    const index = Number(segment);
    if (!Number.isInteger(index) || index < 0 || index >= node.length) return undefined;
    return node[index];
  }
  if (typeof node === 'object' && node !== null) {
    return (node as Record<string, unknown>)[segment];
  }
  return undefined;
}

export function applyDataOverrides(
  data: Record<string, unknown>,
  gameId: string,
  overrides: Overrides
): string[] {
  const applied: string[] = [];
  const prefix = `${gameId}.`;
  for (const [key, value] of Object.entries(overrides)) {
    if (!key.startsWith(prefix) || !Number.isFinite(value)) continue;
    const segments = key.slice(prefix.length).split('.');
    let node: unknown = data;
    for (let i = 0; i < segments.length - 1 && node !== undefined; i += 1) {
      node = child(node, segments[i]);
    }
    if (node === undefined) continue;
    const leafSegment = segments[segments.length - 1];
    const leaf = child(node, leafSegment);
    if (typeof leaf === 'number' && Number.isFinite(leaf)) {
      if (Array.isArray(node)) {
        node[Number(leafSegment)] = value;
      } else {
        (node as Record<string, unknown>)[leafSegment] = value;
      }
      applied.push(key);
    }
  }
  return applied;
}
