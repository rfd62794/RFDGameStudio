// @vitest-environment node
// new: ts/tests/test_planetforge_trim.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { debugToolsEnabled } from '../../examples/planetforge/src/debugTools';

const read = (rel: string) => readFileSync(new URL(`../../examples/planetforge/src/${rel}`, import.meta.url), 'utf8');

describe('test_planetforge_trim', () => {
  it('developer tools show only with ?debug=1', () => {
    expect(debugToolsEnabled('')).toBe(false);
    expect(debugToolsEnabled('?game=planetforge')).toBe(false);
    expect(debugToolsEnabled('?debug=0')).toBe(false);
    expect(debugToolsEnabled('?debug=1')).toBe(true);
    expect(debugToolsEnabled('?embed=1&debug=1')).toBe(true);
  });

  it('the app gates the Test Runner button and modal on the debug flag', () => {
    const app = read('App.tsx');
    expect(app).toContain('debugToolsEnabled(window.location.search)');
    expect(app).toContain('showTestRunner={showDebugTools}');
    expect(app).toContain('{showDebugTools && (');
    const header = read('components/SimulationHeader.tsx');
    expect(header).toContain('{showTestRunner && (');
    expect(header).toContain('showTestRunner = false');
  });

  it('the reset control carries a visible label', () => {
    expect(read('components/SimulationHeader.tsx')).toContain('Reset world');
  });
});
