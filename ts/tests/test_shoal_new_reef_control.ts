// new: ts/tests/test_shoal_new_reef_control.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { clientToCanvas, clientToWorld } from '../src/games/shoal/utils/pointerWorld';

/**
 * test_shoal_new_reef_control
 *
 * Covers Shoal Tier A polish (Polish_Shoal_TierA_Directive): an in-play
 * "New Reef" control beside Mechanics wired to the existing handleReplay,
 * and canvas input on pointer events (mouse + touch + pen) through the
 * pure pointerWorld helpers. Component/wiring assertions are source-level
 * per suite convention (test_shoal_chrome_polish); the helpers get real
 * unit tests.
 */

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/shoal/App.tsx'),
  'utf8'
);
const controlSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/shoal/components/NewReefControl.tsx'),
  'utf8'
);
const cssSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/shoal/styles.css'),
  'utf8'
);

describe('Shoal Tier A — pointerWorld helpers', () => {
  it('clientToCanvas subtracts the rect origin', () => {
    expect(clientToCanvas({ x: 110, y: 70 }, { left: 10, top: 20 })).toEqual({
      x: 100,
      y: 50,
    });
    expect(clientToCanvas({ x: 0, y: 0 }, { left: 0, top: 0 })).toEqual({ x: 0, y: 0 });
  });

  it('clientToWorld scales canvas coords into world coords', () => {
    const world = clientToWorld(
      { x: 110, y: 70 },
      { left: 10, top: 20 },
      { w: 400, h: 300 },
      { width: 1200, height: 900 }
    );
    expect(world).toEqual({ x: 300, y: 150 });
  });

  it('clientToWorld at a 1:1 scale matches clientToCanvas', () => {
    const client = { x: 55, y: 25 };
    const rect = { left: 5, top: 15 };
    expect(
      clientToWorld(client, rect, { w: 200, h: 100 }, { width: 200, height: 100 })
    ).toEqual(clientToCanvas(client, rect));
  });
});

describe('Shoal Tier A — in-play New Reef control', () => {
  it('renders NewReefControl in the toolbar wired to handleReplay', () => {
    expect(appSource).toContain('NewReefControl');
    expect(appSource).toContain('onNewReef={handleReplay}');
  });

  it('is the shared neutral sm Button labelled New Reef', () => {
    expect(controlSource).toContain("from '../../../ui/components'");
    expect(controlSource).toContain('id="shoal-new-reef"');
    expect(controlSource).toContain('label="New Reef"');
    expect(controlSource).toContain('variant="neutral"');
    expect(controlSource).toContain('size="sm"');
  });
});

describe('Shoal Tier A — pointer input and mobile CSS', () => {
  it('canvas input uses pointer events, not mouse events', () => {
    expect(appSource).toContain('pointerdown');
    expect(appSource).toContain('pointermove');
    expect(appSource).not.toContain('mousedown');
    expect(appSource).not.toContain('mousemove');
  });

  it('toolbar wraps and the canvas swallows touch scrolling', () => {
    expect(cssSource).toContain('flex-wrap: wrap');
    expect(cssSource).toContain('touch-action: none');
  });
});
