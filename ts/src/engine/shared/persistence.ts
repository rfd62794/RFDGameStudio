/**
 * Shared localStorage persistence — the canonical home for the
 * try/catch + JSON save/load pattern the games used to re-roll
 * per-site (ADR-014 extraction; see
 * docs/superpowers/specs/2026-09-23-engine-shared-modules.md).
 *
 * Callers keep their own storage keys — no namespacing here, so
 * existing saves keep working. Unversioned saves store the raw JSON
 * value exactly as the hand-rolled code did; versioned saves store a
 * { v: number, data: T } envelope. Reads never throw: a missing key,
 * malformed JSON, or a dropped/mismatched version all surface as null.
 */

export interface SaveOptions<T> {
  /** Bump when the shape changes; stale versions are migrated or dropped. */
  version?: number;
  /** (old: unknown, fromVersion: number) => current shape. Absent + stale => null. */
  migrate?: (old: unknown, fromVersion: number) => T | null;
}

interface SaveEnvelope {
  v: number;
  data: unknown;
}

function isSaveEnvelope(value: unknown): value is SaveEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as SaveEnvelope).v === 'number' &&
    'data' in value
  );
}

export function loadSave<T>(key: string, opts?: SaveOptions<T>): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (opts?.version === undefined) return parsed as T;
    if (!isSaveEnvelope(parsed)) return null;
    if (parsed.v === opts.version) return parsed.data as T;
    return opts.migrate ? opts.migrate(parsed.data, parsed.v) : null;
  } catch {
    return null;
  }
}

export function writeSave<T>(key: string, value: T, opts?: { version?: number }): void {
  try {
    const payload = opts?.version === undefined ? value : { v: opts.version, data: value };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {}
}

export function clearSave(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}
