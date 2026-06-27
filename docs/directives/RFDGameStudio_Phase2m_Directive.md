# RFDGameStudio — Phase 2m Directive: Layout Resolver + UI Interpreter

*June 2026 | Read fully before executing anything.*
*Cross-portability proof: same resolver runs in Lua → Python → TypeScript → eventually Rust.*

---

> ⛔ **STOP:** Run both test suites before touching any file.
> Python: `uv run pytest -v` → must report 42 passed, 0 failed, 0 skipped.
> TypeScript: `cd ts && npx vitest run` → must report 19 passed, 0 failed, 0 skipped.
> Report both before proceeding.

---

## §0 Context

**The problem:**

`ui.yaml` currently describes *what* is in each region — tab names, component types,
data sources. It doesn't describe *where* or *how big*. The existing App.tsx files
hardcode every panel dimension with CSS.

**The solution:**

Add a `layout_tree` section to each ui.yaml that describes dimensional structure
using flex ratios and 0.0–1.0 percentages of the parent. The resolver computes
absolute pixel bounds from this tree given a viewport size. Each renderer reads
the bounds and draws its components there.

**The algorithm (Yoga/Flutter's model, ~50 lines of math):**

1. Walk the tree top-down, passing parent bounds at each level
2. Fixed nodes: `height: 0.10` → `h = parent.h * 0.10`
3. After fixed nodes are measured, distribute remaining space to flex nodes proportionally
4. `flex: 2` gets twice the remaining space as `flex: 1`
5. Position each child sequentially (column = top-to-bottom, row = left-to-right)
6. Recurse for each child's children
7. Output: flat array of `{id, x, y, w, h}` in pixels

**This is exactly what Meta's Yoga engine does**, with bindings for Java, C#,
Swift, and C. Our implementation lives in Lua so it runs identically in
Python (lupa), TypeScript (fengari), and Rust (mlua).

**What works immediately in the TS demos:**

- Structural scaffold (header proportions, tab bar, content area, footer) — ✅
- Simple data bindings (`value_from: game_state.funds`) — ✅
- Base components (Panel, StatBar, Badge, TabBar) positioned by resolver — ✅
- Custom slots (race_track, canvas) — interpreter identifies them, returns bounds
  to the game, game fills the rect — ✅ works, just requires one extra step

**What doesn't replace handwritten code yet:**

- Complex custom components (SVGRacer physics, GameCanvas 60fps loop) — stay as-is
- Animations (framer-motion, CSS transitions) — still in game components

---

## §1 Scope

| File | Action |
|---|---|
| `games/horse_racing/ui.yaml` | Add `layout_tree` section |
| `games/slither_rogue/ui.yaml` | Add `layout_tree` section |
| `engine/ui/resolver.lua` | New — flex layout resolver |
| `engine/ui/resolver.py` | New — Python port (cross-portability proof) |
| `ts/src/engine/ui_resolver.ts` | New — TypeScript wrapper calling Lua resolver |
| `ts/src/engine/ui_interpreter.tsx` | New — component type → React element mapping |
| `ts/src/games/horse_racing/App.tsx` | Wire interpreter for structural scaffold |
| `tests/test_ui_resolver.py` | New — 4 Python tests |
| `ts/tests/test_ui_resolver.ts` | New — 2 TypeScript tests |

**Read-only — do not touch:**
`studio/`, `studio_mcp/`, all existing game Lua files,
all existing TypeScript components.

---

## §2 ui.yaml Schema Extension

### §2.1 New `layout_tree` section (added to BOTH ui.yaml files)

The `layout_tree` is the dimensional declaration. It is separate from the existing
content declarations, which remain unchanged.

**Schema rules:**
- `direction`: `"column"` (top-to-bottom) or `"row"` (left-to-right)
- `height` / `width`: float 0.0–1.0 = fraction of parent's dimension. Omit for flex.
- `flex`: positive integer. Nodes with `flex` share remaining space proportionally.
- `id`: string — must match a key in `regions:` for the interpreter to render it.
- `children`: array of child nodes. Recurse.
- Exactly one of (`height`/`width`) or `flex` must be present per node in
  its primary axis. Both may be absent only for leaf nodes with no children.

### §2.2 New `regions` section

Maps each `layout_tree` node `id` to its component type and data bindings.
The interpreter reads this after the resolver computes bounds.

**Component types (from ADR-008 shared vocabulary):**
`app_header`, `tab_bar`, `tab_content`, `app_footer`, `hud`, `canvas`,
`menu_screen`, `gameover_screen`, `modal`

**Slot types** (interpreter returns bounds to game, game renders):
`canvas`, `race_track`, `custom`

### §2.3 Updated horse_racing/ui.yaml (add these sections, keep all existing content)

```yaml
# Add at top of file — dimensional layout for resolver
layout_tree:
  direction: column
  children:
    - id: header
      height: 0.10
    - id: tab_nav
      height: 0.06
    - id: content
      flex: 1
    - id: footer
      height: 0.05

# Component type mapping for interpreter
regions:
  header:
    component: app_header
    bindings:
      title: "DERBY SIM v1.2"
      bank: game_state.funds
  tab_nav:
    component: tab_bar
    tabs_from: layout.tabs
  content:
    component: tab_content   # rendered by game's existing tab system
  footer:
    component: app_footer
    text: "© 2026 DERBY SIMULATOR. ALL RIGHTS RESERVED."
```

### §2.4 Updated slither_rogue/ui.yaml (add these sections, keep all existing content)

```yaml
layout_tree:
  direction: column
  children:
    - id: hud
      height: 0.14          # taller HUD for snake game stats
    - id: game_area
      flex: 1               # canvas fills all remaining
    
screens_layout:
  menu:
    direction: column
    children:
      - id: title
        height: 0.25
      - id: config
        flex: 1
      - id: start_btn
        height: 0.12

regions:
  hud:
    component: hud
    bindings:
      score: game_state.score
      time_left: game_state.time_left
      peak_length: game_state.peak_length
  game_area:
    component: canvas       # slot — game renders canvas here
```

---

## §3 engine/ui/resolver.lua

Create `engine/ui/` directory. Create `engine/ui/resolver.lua`:

```lua
-- RFDGameStudio — Layout Resolver
-- Implements the Yoga/Flutter flex layout algorithm.
-- Input:  layout_tree node + parent bounds {x, y, w, h}
-- Output: flat array of {id, x, y, w, h} in absolute pixels
--
-- Algorithm: "constraints go down, sizes go up" (Flutter terminology)
--   1. Walk tree top-down
--   2. Fixed nodes: height/width as fraction of parent
--   3. Flex nodes: share remaining space proportionally
--   4. Position children sequentially along direction axis
--   5. Recurse into children with their computed bounds
--   6. Return flat list of all resolved nodes

-- Resolve a layout tree node given its parent's absolute pixel bounds.
-- node: table with id, direction?, height?, width?, flex?, children?
-- parent: {x, y, w, h} in pixels
-- results: flat array to accumulate into (pass {} at root call)
-- Returns: results (same reference, for convenience)
function resolve_layout(node, parent, results)
  results = results or {}
  parent  = parent or { x=0, y=0, w=800, h=600 }

  local direction = node.direction or "column"
  local is_column = (direction == "column")
  local children  = node.children or {}

  -- Step 1: Compute this node's own bounds from parent
  local x = parent.x
  local y = parent.y
  local w = node.width  and (node.width  * parent.w) or parent.w
  local h = node.height and (node.height * parent.h) or parent.h

  -- Root node: override with parent bounds
  if not node.width  then w = parent.w end
  if not node.height then h = parent.h end

  -- Record this node if it has an id
  if node.id then
    table.insert(results, { id=node.id, x=x, y=y, w=w, h=h })
  end

  if #children == 0 then
    return results
  end

  -- Step 2: Separate fixed children from flex children
  local fixed_total = 0   -- total fixed size along main axis
  local total_flex  = 0   -- sum of flex factors

  for _, child in ipairs(children) do
    if is_column then
      if child.height then
        fixed_total = fixed_total + child.height * h
      elseif child.flex then
        total_flex = total_flex + child.flex
      end
    else
      if child.width then
        fixed_total = fixed_total + child.width * w
      elseif child.flex then
        total_flex = total_flex + child.flex
      end
    end
  end

  -- Step 3: Remaining space for flex children
  local main_size    = is_column and h or w
  local remaining    = math.max(0, main_size - fixed_total)
  local flex_unit    = (total_flex > 0) and (remaining / total_flex) or 0

  -- Step 4: Position each child sequentially
  local cursor = 0  -- current offset along main axis

  for _, child in ipairs(children) do
    local child_main  -- size along main axis
    local child_cross -- size along cross axis

    if is_column then
      child_cross = w
      if child.height then
        child_main = child.height * h
      elseif child.flex then
        child_main = flex_unit * child.flex
      else
        child_main = 0
      end
    else
      child_cross = h
      if child.width then
        child_main = child.width * w
      elseif child.flex then
        child_main = flex_unit * child.flex
      else
        child_main = 0
      end
    end

    -- Build child bounds
    local child_bounds
    if is_column then
      child_bounds = { x=x, y=y+cursor, w=child_cross, h=child_main }
    else
      child_bounds = { x=x+cursor, y=y, w=child_main, h=child_cross }
    end

    -- Recurse
    resolve_layout(child, child_bounds, results)
    cursor = cursor + child_main
  end

  return results
end

-- Convenience: resolve from a viewport size directly.
-- tree: the layout_tree table from ui.yaml
-- viewport_w, viewport_h: canvas/window dimensions in pixels
-- Returns: flat array of {id, x, y, w, h}
function resolve_viewport(tree, viewport_w, viewport_h)
  return resolve_layout(tree, { x=0, y=0, w=viewport_w, h=viewport_h }, {})
end
```

> ⚠️ NOTE: Create `engine/ui/` as a new subdirectory. The loader does NOT
> auto-load from `engine/ui/` — this file is loaded explicitly by the Python
> test and by the TypeScript `ui_resolver.ts`. It is NOT part of the game
> Lua source loaded by `load_engine_source()`.

---

## §4 engine/ui/resolver.py — Python Port

Create `engine/ui/resolver.py`. This is a direct Python port of the Lua resolver.
**Do not introduce Python idioms that diverge from the Lua logic.**
The point is that both implementations are the same algorithm.

```python
"""
RFDGameStudio — Layout Resolver (Python port)
Identical algorithm to engine/ui/resolver.lua.
Used by the PyGame renderer and Python tests.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Any


@dataclass
class Bounds:
    id: str
    x: float
    y: float
    w: float
    h: float


def resolve_layout(
    node: dict[str, Any],
    parent: dict[str, float],
    results: list[Bounds] | None = None,
) -> list[Bounds]:
    """
    Resolve a layout tree node given its parent's pixel bounds.
    Mirrors resolve_layout() in resolver.lua exactly.
    """
    if results is None:
        results = []
    if parent is None:
        parent = {"x": 0, "y": 0, "w": 800, "h": 600}

    direction = node.get("direction", "column")
    is_column = direction == "column"
    children = node.get("children", [])

    x = parent["x"]
    y = parent["y"]
    w = parent["w"]
    h = parent["h"]

    if node.get("id"):
        results.append(Bounds(id=node["id"], x=x, y=y, w=w, h=h))

    if not children:
        return results

    # Separate fixed from flex
    fixed_total = 0.0
    total_flex = 0.0

    for child in children:
        if is_column:
            if "height" in child:
                fixed_total += child["height"] * h
            elif "flex" in child:
                total_flex += child["flex"]
        else:
            if "width" in child:
                fixed_total += child["width"] * w
            elif "flex" in child:
                total_flex += child["flex"]

    main_size = h if is_column else w
    remaining = max(0.0, main_size - fixed_total)
    flex_unit = (remaining / total_flex) if total_flex > 0 else 0.0

    cursor = 0.0

    for child in children:
        if is_column:
            child_cross = w
            if "height" in child:
                child_main = child["height"] * h
            elif "flex" in child:
                child_main = flex_unit * child["flex"]
            else:
                child_main = 0.0
            child_bounds = {"x": x, "y": y + cursor, "w": child_cross, "h": child_main}
        else:
            child_cross = h
            if "width" in child:
                child_main = child["width"] * w
            elif "flex" in child:
                child_main = flex_unit * child["flex"]
            else:
                child_main = 0.0
            child_bounds = {"x": x + cursor, "y": y, "w": child_main, "h": child_cross}

        resolve_layout(child, child_bounds, results)
        cursor += child_main

    return results


def resolve_viewport(
    tree: dict[str, Any], viewport_w: float, viewport_h: float
) -> list[Bounds]:
    """Resolve from a viewport size. Mirrors resolve_viewport() in resolver.lua."""
    return resolve_layout(tree, {"x": 0, "y": 0, "w": viewport_w, "h": viewport_h})
```

---

## §5 ts/src/engine/ui_resolver.ts

TypeScript wrapper. Calls the Python/Lua resolver logic directly in TypeScript
(no Lua bridge needed — the resolver is pure math, safe to port directly).

```typescript
/**
 * RFDGameStudio — Layout Resolver (TypeScript)
 * Same algorithm as engine/ui/resolver.lua and engine/ui/resolver.py.
 * Runs in the browser without a Lua bridge — pure math.
 */

export interface LayoutNode {
  id?: string;
  direction?: 'column' | 'row';
  height?: number;   // fraction of parent height (0.0-1.0)
  width?: number;    // fraction of parent width  (0.0-1.0)
  flex?: number;     // proportional share of remaining space
  children?: LayoutNode[];
}

export interface ResolvedBounds {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Viewport {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function resolveLayout(
  node: LayoutNode,
  parent: Viewport,
  results: ResolvedBounds[] = []
): ResolvedBounds[] {
  const isColumn = (node.direction ?? 'column') === 'column';
  const children = node.children ?? [];

  const x = parent.x;
  const y = parent.y;
  const w = parent.w;
  const h = parent.h;

  if (node.id) {
    results.push({ id: node.id, x, y, w, h });
  }

  if (children.length === 0) return results;

  // Measure fixed and flex children
  let fixedTotal = 0;
  let totalFlex = 0;

  for (const child of children) {
    if (isColumn) {
      if (child.height !== undefined) fixedTotal += child.height * h;
      else if (child.flex !== undefined) totalFlex += child.flex;
    } else {
      if (child.width !== undefined) fixedTotal += child.width * w;
      else if (child.flex !== undefined) totalFlex += child.flex;
    }
  }

  const mainSize = isColumn ? h : w;
  const remaining = Math.max(0, mainSize - fixedTotal);
  const flexUnit = totalFlex > 0 ? remaining / totalFlex : 0;

  let cursor = 0;

  for (const child of children) {
    let childMain: number;
    let childCross: number;
    let childBounds: Viewport;

    if (isColumn) {
      childCross = w;
      if (child.height !== undefined) childMain = child.height * h;
      else if (child.flex !== undefined) childMain = flexUnit * child.flex;
      else childMain = 0;
      childBounds = { x, y: y + cursor, w: childCross, h: childMain };
    } else {
      childCross = h;
      if (child.width !== undefined) childMain = child.width * w;
      else if (child.flex !== undefined) childMain = flexUnit * child.flex;
      else childMain = 0;
      childBounds = { x: x + cursor, y, w: childMain, h: childCross };
    }

    resolveLayout(child, childBounds, results);
    cursor += childMain;
  }

  return results;
}

export function resolveViewport(
  tree: LayoutNode,
  viewportW: number,
  viewportH: number
): ResolvedBounds[] {
  return resolveLayout(tree, { x: 0, y: 0, w: viewportW, h: viewportH });
}

/**
 * Build a bounds lookup map from a resolved array.
 * Usage: const bounds = buildBoundsMap(resolved); bounds['header'] → {x,y,w,h}
 */
export function buildBoundsMap(
  resolved: ResolvedBounds[]
): Record<string, ResolvedBounds> {
  return Object.fromEntries(resolved.map(b => [b.id, b]));
}
```

> ⚠️ NOTE: The TypeScript resolver runs in the browser directly — no Lua
> bridge call needed. The algorithm is identical to the Lua and Python versions.
> This is intentional: pure math resolvers don't need the Lua VM overhead.
> The Lua version is used by Python/PyGame and by any future Rust renderer.

---

## §6 ts/src/engine/ui_interpreter.tsx

Component type → React element mapping. Takes resolved bounds + a region
declaration + game state and returns the appropriate component.

```typescript
import React from 'react';
import { ResolvedBounds } from './ui_resolver';
import { Panel, StatBar, TabBar, EmptyState, ErrorBox } from '../ui/components';

export interface RegionDeclaration {
  component: string;
  bindings?: Record<string, string>;  // binding_key → dot.path in game state
  tabs_from?: string;                  // path to tabs array in ui.yaml
  text?: string;                       // literal text value
}

export interface RegionsMap {
  [id: string]: RegionDeclaration;
}

/** Resolve a dot-path like "game_state.funds" against a state object */
function getBinding(state: unknown, path: string): unknown {
  if (!path || !state) return undefined;
  return path.split('.').reduce(
    (obj: unknown, key: string) =>
      obj != null && typeof obj === 'object' ? (obj as Record<string, unknown>)[key] : undefined,
    state
  );
}

export interface InterpretedSlot {
  id: string;
  bounds: ResolvedBounds;
  isSlot: true;  // game must render this region itself
}

export type InterpretedResult = React.ReactElement | InterpretedSlot | null;

/**
 * Render a single region at its resolved bounds.
 * Returns a React element for known components.
 * Returns an InterpretedSlot for game-specific slots (canvas, race_track, custom).
 */
export function interpretRegion(
  id: string,
  bounds: ResolvedBounds,
  region: RegionDeclaration,
  gameState: unknown,
  uiState: unknown
): InterpretedResult {
  const { x, y, w, h } = bounds;
  const style: React.CSSProperties = {
    position: 'absolute',
    left: x, top: y, width: w, height: h,
    overflow: 'hidden',
  };

  switch (region.component) {
    case 'app_header': {
      const title = region.bindings?.title
        ?? String(getBinding(gameState, region.bindings?.title_from ?? '') ?? '');
      const bank = getBinding(gameState, region.bindings?.bank ?? '') as number | undefined;
      return (
        <div key={id} style={style} className="ui-region ui-header">
          <span className="ui-header-title">{region.bindings?.title ?? title}</span>
          {bank !== undefined && (
            <span className="ui-header-bank">${bank.toLocaleString()}</span>
          )}
        </div>
      );
    }

    case 'tab_bar': {
      const activeTab = getBinding(uiState, 'activeTab') as string | undefined;
      // tabs_from resolves to the ui.yaml tabs array — passed via uiState
      const tabs = getBinding(uiState, 'tabs') as Array<{id: string; label: string}> | undefined;
      const onSelect = getBinding(uiState, 'onSelectTab') as ((id: string) => void) | undefined;
      if (!tabs) return null;
      return (
        <div key={id} style={style} className="ui-region ui-tab-bar">
          <TabBar tabs={tabs} active={activeTab ?? ''} onSelect={onSelect ?? (() => {})} />
        </div>
      );
    }

    case 'app_footer': {
      return (
        <div key={id} style={style} className="ui-region ui-footer">
          <span>{region.text ?? ''}</span>
        </div>
      );
    }

    case 'hud': {
      // HUD is a slot — game renders its own HUD component at these bounds
      return { id, bounds, isSlot: true };
    }

    // Slot types — game fills these
    case 'canvas':
    case 'race_track':
    case 'tab_content':
    case 'custom':
      return { id, bounds, isSlot: true };

    default:
      return (
        <div key={id} style={{ ...style, background: 'rgba(255,0,0,0.1)' }}>
          <ErrorBox message={`Unknown component: ${region.component}`} />
        </div>
      );
  }
}

/**
 * Interpret all regions in a bounds map.
 * Returns a mix of React elements (rendered) and InterpretedSlots (for game to fill).
 */
export function interpretLayout(
  boundsMap: Record<string, ResolvedBounds>,
  regions: RegionsMap,
  gameState: unknown,
  uiState: unknown
): { elements: React.ReactElement[]; slots: Record<string, InterpretedSlot> } {
  const elements: React.ReactElement[] = [];
  const slots: Record<string, InterpretedSlot> = {};

  for (const [id, region] of Object.entries(regions)) {
    const bounds = boundsMap[id];
    if (!bounds) continue;

    const result = interpretRegion(id, bounds, region, gameState, uiState);
    if (!result) continue;

    if ('isSlot' in result) {
      slots[id] = result;
    } else {
      elements.push(result);
    }
  }

  return { elements, slots };
}
```

---

## §7 Wire into horse_racing App.tsx

In `ts/src/games/horse_racing/App.tsx`, after existing state setup:

```typescript
import { resolveViewport, buildBoundsMap } from '../../engine/ui_resolver';
import { interpretLayout } from '../../engine/ui_interpreter';

// Inside the render, before the return:
const ui = session.files.ui as Record<string, unknown>;
const layoutTree = ui['layout_tree'] as LayoutNode | undefined;
const regions = ui['regions'] as RegionsMap | undefined;

// Resolve on every render (fast — pure math, no side effects)
const resolved = layoutTree
  ? resolveViewport(layoutTree, window.innerWidth, window.innerHeight)
  : [];
const boundsMap = buildBoundsMap(resolved);

const { elements: uiElements, slots } = regions
  ? interpretLayout(boundsMap, regions, gameState, {
      activeTab,
      tabs: tabs.map(t => ({ id: t['id'] as string, label: t['label'] as string })),
      onSelectTab: setActiveTab,
    })
  : { elements: [], slots: {} };

// In the JSX return, wrap with position:relative container:
return (
  <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
    {/* Interpreter renders structural scaffold */}
    {uiElements}

    {/* Game renders its own content in slot bounds */}
    {slots['content'] && (
      <div style={{
        position: 'absolute',
        left: slots['content'].bounds.x,
        top: slots['content'].bounds.y,
        width: slots['content'].bounds.w,
        height: slots['content'].bounds.h,
      }}>
        {/* existing tab content here */}
      </div>
    )}
  </div>
);
```

> ⚠️ RULE: The interpreter is additive. If `layout_tree` or `regions` is
> absent from ui.yaml, the game renders as before. Do NOT remove existing
> render logic — wire the interpreter alongside it for now.

---

## §8 Python Tests

Create `tests/test_ui_resolver.py`. Target: **42 → 46 passed**

```python
"""Tests for the Python layout resolver (engine/ui/resolver.py)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "engine" / "ui"))
from resolver import resolve_viewport, Bounds

SIMPLE_TREE = {
    "direction": "column",
    "children": [
        {"id": "header", "height": 0.10},
        {"id": "content", "flex": 1},
        {"id": "footer", "height": 0.05},
    ]
}

def test_resolver_produces_three_nodes() -> None:
    result = resolve_viewport(SIMPLE_TREE, 800, 600)
    ids = [b.id for b in result]
    assert "header" in ids
    assert "content" in ids
    assert "footer" in ids
    assert len(result) == 3

def test_resolver_fixed_height_correct() -> None:
    result = resolve_viewport(SIMPLE_TREE, 800, 600)
    header = next(b for b in result if b.id == "header")
    assert abs(header.h - 60.0) < 0.01   # 10% of 600

def test_resolver_flex_fills_remaining() -> None:
    result = resolve_viewport(SIMPLE_TREE, 800, 600)
    content = next(b for b in result if b.id == "content")
    # remaining = 600 - 60 - 30 = 510
    assert abs(content.h - 510.0) < 0.01

def test_resolver_row_direction() -> None:
    tree = {
        "direction": "row",
        "children": [
            {"id": "sidebar", "width": 0.25},
            {"id": "main", "flex": 1},
        ]
    }
    result = resolve_viewport(tree, 800, 600)
    sidebar = next(b for b in result if b.id == "sidebar")
    main = next(b for b in result if b.id == "main")
    assert abs(sidebar.w - 200.0) < 0.01   # 25% of 800
    assert abs(main.w - 600.0) < 0.01      # remaining 75%
    assert abs(sidebar.x - 0.0) < 0.01
    assert abs(main.x - 200.0) < 0.01
```

---

## §9 TypeScript Tests

Add to `ts/tests/test_ui_resolver.ts`. Target: **19 → 21 passed**

```typescript
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
```

---

## §10 Completion Criteria

- [ ] `uv run pytest -v` → **46 passed, 0 failed, 0 skipped**
- [ ] `cd ts && npx vitest run` → **21 passed, 0 failed, 0 skipped**
- [ ] `cd ts && npx vite build` → exits 0
- [ ] `engine/ui/resolver.lua` exists and passes: `resolve_viewport({direction='column', children=[{id='test', height=0.5}]}, 800, 600)` returns `{id='test', x=0, y=0, w=800, h=300}`
- [ ] `engine/ui/resolver.py` exists and passes the same assertion
- [ ] `ts/src/engine/ui_resolver.ts` exists
- [ ] `ts/src/engine/ui_interpreter.tsx` exists
- [ ] Both ui.yaml files have `layout_tree` and `regions` sections
- [ ] Browser: horse_racing header shows correct bank balance from ui.yaml binding
- [ ] Browser: structural scaffold proportions match declared percentages
- [ ] `docs/state/current.md` updated to Phase 2m certified

**Proof of cross-portability:**

Run the same assertion in Python and compare with TypeScript:
```python
# Python
result = resolve_viewport({'direction': 'column', 'children': [
  {'id': 'header', 'height': 0.10},
  {'id': 'content', 'flex': 1},
]}, 800, 600)
# header.h == 60.0, content.h == 540.0, content.y == 60.0
```
```typescript
// TypeScript — must produce identical values
const resolved = resolveViewport({direction: 'column', children: [
  {id: 'header', height: 0.10},
  {id: 'content', flex: 1},
]}, 800, 600);
// header.h === 60, content.h === 540, content.y === 60
```

Same numbers. That's the cross-portability proof.

---

## §11 Quick Reference

| Item | Value |
|---|---|
| Python floor | 42 → 46 / 0 / 0 |
| TypeScript floor | 19 → 21 / 0 / 0 |
| Algorithm | Yoga/Flutter flex — "constraints go down, sizes go up" |
| Unit | 0.0–1.0 fraction of parent, or flex integer |
| Slot types | `canvas`, `race_track`, `tab_content`, `custom` |
| Non-slot types | `app_header`, `tab_bar`, `app_footer`, `hud` |
| Interpreter output | `elements[]` (React) + `slots{}` (game fills) |
| Lua resolver | NOT auto-loaded — used by Python tests + future PyGame |
| TS resolver | Pure TypeScript math — no Lua bridge needed |
| Rust path | RAUI or mlua — Lua resolver runs unchanged |

---

*RFDGameStudio Phase 2m | June 2026 | RFD IT Services Ltd.*
*Same algorithm. Three languages. One schema.*
*Percentages and ratios all the way down.*
