// NEW: local-only diagnostics capture and plain-text report, see docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md
import { createRingBuffer } from './ringBuffer';

export interface DiagnosticEntry {
  t: number;
  kind: 'error' | 'rejection' | 'boundary';
  message: string;
  stack?: string;
}

const MAX_FIELD_LEN = 500;
const BUFFER_CAPACITY = 50;

const buffer = createRingBuffer<DiagnosticEntry>(BUFFER_CAPACITY);
const installed = new WeakMap<Window, () => void>();

function clip(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return value.length > MAX_FIELD_LEN ? value.slice(0, MAX_FIELD_LEN) : value;
}

/** Records one diagnostic entry. Fields are truncated to 500 chars; nothing is persisted or sent anywhere. */
export function recordDiagnostic(entry: Omit<DiagnosticEntry, 't'> & { t?: number }): void {
  buffer.push({
    t: entry.t ?? Date.now(),
    kind: entry.kind,
    message: clip(entry.message) ?? '',
    stack: clip(entry.stack),
  });
}

/** Empties the in-memory buffer (test isolation and manual reset). */
export function clearDiagnostics(): void {
  buffer.clear();
}

/**
 * Adds `error` and `unhandledrejection` listeners to `target` once.
 * Idempotent per target; returns a function that removes the listeners.
 */
export function installGlobalDiagnostics(target: Window): () => void {
  const existing = installed.get(target);
  if (existing) return existing;

  const onError = (event: ErrorEvent) => {
    recordDiagnostic({
      kind: 'error',
      message: event.message || 'unknown error',
      stack: event.error instanceof Error ? event.error.stack : undefined,
    });
  };
  const onRejection = (event: PromiseRejectionEvent) => {
    const reason: unknown = event.reason;
    recordDiagnostic({
      kind: 'rejection',
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  };

  target.addEventListener('error', onError);
  target.addEventListener('unhandledrejection', onRejection);

  const uninstall = () => {
    target.removeEventListener('error', onError);
    target.removeEventListener('unhandledrejection', onRejection);
    installed.delete(target);
  };
  installed.set(target, uninstall);
  return uninstall;
}

/** Plain-text report: game id, timestamp, user agent, page path (no query string), then entries oldest first. */
export function formatDiagnostics(gameId: string, now: number = Date.now()): string {
  const lines: string[] = [
    `Game: ${gameId}`,
    `Time: ${new Date(now).toISOString()}`,
    `User-Agent: ${navigator.userAgent}`,
    `Page: ${window.location.pathname}`,
    '',
    'Diagnostics (oldest first):',
  ];
  const entries = buffer.snapshot();
  if (entries.length === 0) {
    lines.push('(none recorded)');
  } else {
    for (const e of entries) {
      lines.push(`[${new Date(e.t).toISOString()}] ${e.kind}: ${e.message}`);
      if (e.stack) lines.push(e.stack);
    }
  }
  return lines.join('\n');
}
