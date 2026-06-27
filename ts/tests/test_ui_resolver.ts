import { describe, it, expect } from 'vitest';
import { resolveViewport, buildBoundsMap } from '../src/engine/ui_resolver';

const SIMPLE_TREE = {
  direction: 'column' as const,
  children: [
    { id: 'header', height: 0.10 },
    { id: 'content', flex: 1 },
    { id: 'footer', height: 0.05 },
  ]
};

describe('UI Resolver', () => {
  it('test_ts_resolver_header_height', () => {
    const resolved = resolveViewport(SIMPLE_TREE, 800, 600);
    const map = buildBoundsMap(resolved);
    expect(Math.abs(map['header'].h - 60)).toBeLessThan(0.01);
  });

  it('test_ts_resolver_flex_fills_remaining', () => {
    const resolved = resolveViewport(SIMPLE_TREE, 800, 600);
    const map = buildBoundsMap(resolved);
    // remaining = 600 - 60 - 30 = 510
    expect(Math.abs(map['content'].h - 510)).toBeLessThan(0.01);
  });
});
