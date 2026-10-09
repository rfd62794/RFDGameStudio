// NEW: tests for the diagnostics ring buffer and report, see docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md
import { describe, it, expect, beforeEach } from 'vitest';
import { createRingBuffer } from '../src/engine/diagnostics/ringBuffer';
import {
  recordDiagnostic,
  installGlobalDiagnostics,
  formatDiagnostics,
  clearDiagnostics,
} from '../src/engine/diagnostics/diagnostics';

describe('createRingBuffer', () => {
  it('returns entries oldest first', () => {
    const buf = createRingBuffer<number>(3);
    buf.push(1);
    buf.push(2);
    buf.push(3);
    expect(buf.snapshot()).toEqual([1, 2, 3]);
  });

  it('drops the oldest entries once over capacity', () => {
    const buf = createRingBuffer<number>(3);
    for (const n of [1, 2, 3, 4, 5]) buf.push(n);
    expect(buf.snapshot()).toEqual([3, 4, 5]);
  });

  it('clear() empties the buffer', () => {
    const buf = createRingBuffer<number>(2);
    buf.push(1);
    buf.clear();
    expect(buf.snapshot()).toEqual([]);
  });
});

describe('diagnostics', () => {
  beforeEach(() => clearDiagnostics());

  it('truncates message and stack to 500 chars', () => {
    recordDiagnostic({ kind: 'error', message: 'x'.repeat(600), stack: 's'.repeat(600) });
    const report = formatDiagnostics('testgame', 1728000000000);
    expect(report).toContain('x'.repeat(500));
    expect(report).not.toContain('x'.repeat(501));
    expect(report).toContain('s'.repeat(500));
    expect(report).not.toContain('s'.repeat(501));
  });

  it('formatDiagnostics reports the page path with no query string', () => {
    window.history.replaceState({}, '', '/arcade/rfdgamestudio/?game=shoal&secret=abc123');
    recordDiagnostic({ kind: 'error', message: 'boom', t: 1728000000000 });
    const report = formatDiagnostics('shoal', 1728000000000);
    expect(report).toContain('shoal');
    expect(report).toContain('/arcade/rfdgamestudio/');
    expect(report).not.toContain('secret=abc123');
    expect(report).not.toContain('?');
    window.history.replaceState({}, '', '/');
  });

  it('installGlobalDiagnostics is idempotent and its uninstall removes the listeners', () => {
    const un1 = installGlobalDiagnostics(window);
    const un2 = installGlobalDiagnostics(window);
    window.dispatchEvent(new ErrorEvent('error', { message: 'diag-test-error' }));
    const matches = formatDiagnostics('g', 1728000000000).match(/diag-test-error/g);
    expect(matches?.length).toBe(1);
    un1();
    un2();
    window.dispatchEvent(new ErrorEvent('error', { message: 'diag-after-uninstall' }));
    expect(formatDiagnostics('g', 1728000000000)).not.toContain('diag-after-uninstall');
  });
});
