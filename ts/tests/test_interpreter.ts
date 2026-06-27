import { describe, it, expect } from 'vitest';
import { interpretRegion, interpretLayout } from '../src/engine/ui_interpreter';
import { resolveViewport, buildBoundsMap } from '../src/engine/ui_resolver';
import { findGame } from '../src/games/registry';

const MOCK_BOUNDS = { id: 'test', x: 0, y: 0, w: 800, h: 100 };

describe('UI Interpreter', () => {
  it('test_interpreter_canvas_returns_slot', () => {
    const result = interpretRegion(
      'game_area',
      MOCK_BOUNDS,
      { component: 'canvas' },
      {},
      {}
    );
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('isSlot', true);
  });

  it('test_interpreter_tab_content_returns_slot', () => {
    const result = interpretRegion(
      'content',
      MOCK_BOUNDS,
      { component: 'tab_content' },
      {},
      {}
    );
    expect(result).toHaveProperty('isSlot', true);
  });

  it('test_interpreter_app_header_returns_element', () => {
    const result = interpretRegion(
      'header',
      MOCK_BOUNDS,
      { component: 'app_header', bindings: { title: 'TEST' } },
      {},
      {}
    );
    // Should be a React element (object with type property), not a slot
    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty('isSlot');
  });

  it('test_interpret_layout_splits_elements_and_slots', () => {
    const bounds = buildBoundsMap(resolveViewport({
      direction: 'column',
      children: [
        { id: 'header', height: 0.10 },
        { id: 'canvas', flex: 1 },
      ]
    }, 800, 600));

    const regions = {
      header: { component: 'app_header', bindings: { title: 'Test' } },
      canvas: { component: 'canvas' },
    };

    const { elements, slots } = interpretLayout(bounds, regions, {}, {});
    expect(elements.length).toBeGreaterThan(0);
    expect('canvas' in slots).toBe(true);
    expect(slots['canvas'].isSlot).toBe(true);
  });

  it('test_resolver_nested_y_offset_correct', () => {
    const resolved = resolveViewport({
      direction: 'column',
      children: [
        { id: 'header', height: 0.10 },
        {
          id: 'body',
          flex: 1,
          direction: 'row',
          children: [
            { id: 'sidebar', width: 0.25 },
            { id: 'main', flex: 1 },
          ]
        }
      ]
    }, 800, 600);
    const map = buildBoundsMap(resolved);
    // sidebar and main should start at y=60 (below 10% header)
    expect(Math.abs(map['sidebar'].y - 60)).toBeLessThan(0.01);
    expect(Math.abs(map['main'].y - 60)).toBeLessThan(0.01);
    // sidebar should be 25% of 800 = 200px wide
    expect(Math.abs(map['sidebar'].w - 200)).toBeLessThan(0.01);
  });

  it('test_find_game_unknown_returns_undefined', () => {
    const result = findGame('does_not_exist');
    expect(result).toBeUndefined();
  });
});
