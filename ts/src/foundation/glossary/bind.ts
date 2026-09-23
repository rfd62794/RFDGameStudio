const SEGMENT = /^([A-Za-z_][A-Za-z0-9_]*)(?:\[([A-Za-z_][A-Za-z0-9_]*)=([^\]]+)\])?$/;

/**
 * Resolve a glossary bind path against game state.
 * `a.b.c` walks objects; `list[key=value]` picks the first item whose `key`
 * equals `value` (compared as strings). Anything unresolvable is undefined -
 * this never throws, because state legitimately has gaps (no enemy outside combat).
 */
export function resolveBind(state: unknown, path: string): unknown {
  if (!path) return undefined;
  let cur: unknown = state;
  for (const part of path.split('.')) {
    const m = SEGMENT.exec(part);
    if (!m || cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[m[1]];
    if (m[2] !== undefined) {
      if (!Array.isArray(cur)) return undefined;
      const [key, want] = [m[2], m[3]];
      cur = cur.find(item => item !== null && typeof item === 'object'
        && String((item as Record<string, unknown>)[key]) === want);
    }
  }
  return cur;
}
