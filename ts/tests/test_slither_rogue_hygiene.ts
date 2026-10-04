import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ts = (rel: string) => resolve(import.meta.dirname, '..', rel);

describe('slither_rogue hygiene', () => {
  it('the dead phase-2g canvas is gone', () => {
    expect(existsSync(ts('src/games/slither_rogue/components/GameCanvas.phase2g.tsx'))).toBe(false);
  });
  it('the in-run Restart button shows a text label, not only an icon', () => {
    const hud = readFileSync(ts('src/games/slither_rogue/components/GameHUD.tsx'), 'utf8');
    expect(hud).toMatch(/title="Restart this run">\s*<RotateCcw[^>]*\/> Restart\s*<\/button>/);
  });
  it('has a standalone build script, config and entry', () => {
    const pkg = JSON.parse(readFileSync(ts('package.json'), 'utf8')) as { scripts: Record<string, string> };
    expect(pkg.scripts['build:slither_rogue']).toBe('vite build --config vite.slither_rogue.config.ts');
    expect(readFileSync(ts('vite.slither_rogue.config.ts'), 'utf8')).toContain("makeStandaloneConfig('slither_rogue')");
    expect(existsSync(ts('src/standalone/slither_rogue/entry.tsx'))).toBe(true);
    expect(existsSync(ts('src/standalone/slither_rogue/index.html'))).toBe(true);
  });
});
