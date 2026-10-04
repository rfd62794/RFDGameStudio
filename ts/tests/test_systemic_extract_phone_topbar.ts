// new: ts/tests/test_systemic_extract_phone_topbar.ts
/**
 * Source-text guard for the systemic_extract raid HUD top bar on phones.
 *
 * At 390x844 the NEW RUN button sat at x=571..637, clipped by an
 * overflow-hidden ancestor (document scrollWidth stayed 390, so a plain
 * overflow check missed it). The fix stacks the top bar into rows below
 * the sm breakpoint and leaves >= 640px unchanged (nowrap, no gap).
 * The example's React 19 build cannot render under the studio's React 18
 * vitest, so the responsive classes are pinned by reading the source.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const hud = readFileSync(
  resolve(import.meta.dirname, '../../examples/systemic-extract/src/components/raid/RaidHUD.tsx'),
  'utf8',
);

function classOf(marker: string): string {
  const at = hud.indexOf(marker);
  expect(at).toBeGreaterThan(-1);
  const m = /className="([^"]*)"/.exec(hud.slice(at));
  expect(m).not.toBeNull();
  return m![1];
}

describe('RaidHUD top bar phone layout', () => {
  it('bar wraps on phones and is nowrap from sm up', () => {
    const cls = classOf('id="raid-hud-top"');
    expect(cls).toContain('flex-wrap');
    expect(cls).toContain('sm:flex-nowrap');
    expect(cls).toContain('gap-2');
    expect(cls).toContain('sm:gap-0');
  });

  it('operative panel wraps inside the viewport on phones', () => {
    const cls = classOf('{/* Operative HP & Loadout */}');
    expect(cls).toContain('flex-wrap');
    expect(cls).toContain('sm:flex-nowrap');
    expect(cls).toContain('max-w-full');
  });

  it('controls group wraps and right-aligns on its own row', () => {
    const cls = classOf('{/* TOP RIGHT CONTROLS */}');
    expect(cls).toContain('flex-wrap');
    expect(cls).toContain('justify-end');
    expect(cls).toContain('ml-auto');
    expect(cls).toContain('sm:ml-0');
  });
});
