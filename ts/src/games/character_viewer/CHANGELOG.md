# Character Viewer — Changelog

Full detail for changes to the Character Viewer.
Studio-wide summary: [`/CHANGELOG.md`](../../../CHANGELOG.md)

---

## Character Viewer — Real Arcade Entry — COMPLETED

**Date:** August 14 2026
**Directive:** Promote the Character Viewer from a dev-only standalone
surface to a real, reachable arcade entry. A deliberate scope change —
the viewer remains fully intact at its original dev-only path, and this
addition is purely about making it reachable through the arcade UI.

### STOP rule satisfied

Read the real, current `registry.ts` schema and routing before adding
anything. Confirmed:
- **`GameConfig`** interface: `gameId`, `label`, `description?`,
  `color?`, `status?: GameStatus`, `component?` (lazy-loaded),
  `externalUrl?`, `embedUrl?`, `embedWidth?`, `embedHeight?`
- **`GameStatus`** was `'stable' | 'beta' | 'dev' | 'external'`
- **VoidRift precedent:** uses `status: 'external'` for an itch.io embed
- **GameLoader routing:** TS-native games with `cfg.component` but no
  yaml files get a stub session and render the component directly
- **GameSelector:** renders all `GAME_REGISTRY` entries as cards

### Category decision — reported honestly

The existing `GameStatus` values do not honestly describe a
non-competitive sandbox tool:

- `stable`/`beta`/`dev` imply competitive games in progress
- `external` is for itch.io embeds (VoidRift's precedent)

**A new `'tool'` status was added** to `GameStatus` for non-competitive
sandbox/design tools. This closes the real gap the directive identified
rather than forcing Character Viewer into a "game" shape it doesn't fit.
The CSS badge style (`.arcade-status--tool`) was added to `base.css`
(yellow, same as beta — visually distinct from stable/green, dev/muted,
external/accent).

### What was built

**New files:**

| File | Purpose |
|---|---|
| `ts/src/games/character_viewer/config.ts` | Registry config — `characterViewerConfig` with `status: 'tool'` |
| `ts/src/games/character_viewer/App.tsx` | Thin wrapper — imports real `CharacterViewer` from standalone surface, bridges `GameRendererProps` contract |

**Modified files:**

| File | Change |
|---|---|
| `ts/src/engine/types.ts` | Added `'tool'` to `GameStatus` union |
| `ts/src/games/registry.ts` | Imported + registered `characterViewerConfig` |
| `ts/src/ui/base.css` | Added `.arcade-status--tool` badge style |
| `ts/src/arcade/GameSelector.tsx` | Added `status === 'tool'` detail string ("Sandbox tool - TS-native") |
| `ts/tests/test_arcade_registry_directive.ts` | Added `character_viewer` to `EXPECTED_ORDER` |

### Honest, non-competitive presentation

- **Label:** "Character Viewer"
- **Description:** "Assemble and preview creature designs — live
  shape controls, side-by-side comparison, and exportable configs. A
  sandbox tool, not a competitive game."
- **Status badge:** `TOOL` (yellow)
- **Detail string:** "Sandbox tool - TS-native"
- **No `externalUrl` or `embedUrl`** — it's a real TS-native component

### Routing confirmed

GameLoader's existing TS-native path works: `findGame('character_viewer')`
-> `cfg.component` is the lazy-loaded wrapper -> stub session created ->
`<CharacterViewerApp session={...} />` rendered -> wrapper renders
`<CharacterViewer />` from the standalone surface. No new routing code needed.

### Original dev-only path confirmed still working

The standalone surface at `ts/src/standalone/character_viewer/` is
untouched — `index.html`, `entry.tsx`, `CharacterViewer.tsx`, and
`styles.css` are all byte-unchanged. Both paths reach the same real tool:
- **Arcade:** click "Character Viewer" card in the arcade grid
- **Dev-only:** `http://localhost:5173/src/standalone/character_viewer/index.html`

### paperDoll module confirmed unmodified

Git diff confirmed empty for all five production source files:
- `composer.ts` — byte-unchanged
- `attachmentGraph.ts` — byte-unchanged
- `bodyPlans/humanoidBilateral.ts` — byte-unchanged
- `bodyPlans/chimeraAsymmetric.ts` — byte-unchanged
- `PaperDoll.tsx` — byte-unchanged

### Test anchors (22 new, all passing)

**New test file:** `ts/tests/test_character_viewer_arcade_entry.ts`

- `test_registry_schema_confirmed` (3 tests) — GameStatus type includes
  `tool`, category decision is distinct from all existing statuses, CSS
  badge style exists
- `test_character_viewer_registered` (5 tests) — config file exists,
  entry present in GAME_REGISTRY, has real component, description is
  honest/non-competitive, no externalUrl/embedUrl
- `test_arcade_click_loads_viewer` (4 tests) — GameLoader can route via
  findGame, App.tsx imports real CharacterViewer from standalone,
  GameSelector has tool-status detail string, registry imports/exports
  the config
- `test_dev_only_path_still_works` (2 tests) — standalone surface files
  untouched and present, still imports from real paperDoll
- `test_paperDoll_module_unmodified` (5 tests) — all five paperDoll
  source files confirmed byte-unchanged via git diff
- `test_no_regression` (3 tests) — all 16 pre-existing entries still
  present, existing game statuses unaffected, MBB and Chimera Wilds
  still reference PaperDoll

**Full TS floor:** 935/939 passing (92 test files). +22 from previous
floor. 4 failures all pre-existing/unrelated. Zero regressions.

---

## Character Viewer — Page Scroll Fix (Bug 2) — COMPLETED

**Date:** August 14 2026
**Directive:** Character Viewer content extended past the viewport with
no scrollbar when loaded via the arcade route (`?game=character_viewer`).

### Fixed — Page-level scroll

**Root cause:** The arcade's `GameLoader` wraps all games in
`.arcade-game-wrap { height: 100vh }` > `.arcade-game-content { overflow:
hidden; flex: 1 }`. The `overflow: hidden` clips all content past the
viewport with no scrollbar.

**Fix:** Added overrides in `styles.css` (only loaded for the character
viewer page):
- `.arcade-game-wrap { height: auto; min-height: 100vh }`
- `.arcade-game-content { overflow: visible }`
- `html { overflow-y: auto }` (belt-and-suspenders for embedded environments)

Also added `import '../../standalone/character_viewer/styles.css'` to
`App.tsx` — the arcade route goes through `App.tsx`, not `entry.tsx`, so
the styles weren't being applied at the arcade route before.

### Objective measurements (Playwright page.evaluate)

| Viewport | scrollHeight | innerHeight | canScroll | html.overflow-y | figRender.height |
|---|---|---|---|---|---|
| 1280x800 | 963px | 800px | True | auto | 220px |
| 1366x768 | 963px | 768px | True | auto | 220px |
| 1280x600 | 963px | 600px | True | auto | 220px |

### Test anchors (5/5 passing)

1. `test_page_scrollheight_exceeds_viewport_when_content_tall` — PASS
2. `test_overflow_y_permits_scroll` — PASS
3. `test_figure_render_box_still_220px` — PASS (Bug 1 regression check)
4. `test_screenshot_artifacts_saved` — PASS
5. `test_no_regression` — PASS

**Full TS floor:** 998/998 passing, 94/94 test files.

---

## Character Viewer (Paper Doll Shape Iteration Tool) — COMPLETED

**Date:** August 14 2026
**Directive:** Build a dev-only tool for iterating on the Paper Doll
module's actual shapes at real size, side by side, with live controls.

### STOP rule satisfied

Read the real, current `paperDoll` module API fresh before building any
UI against it — `types.ts`, `composer.ts`, `index.ts`, and both body plan
files. Confirmed the real public API: `renderFigureSvg` takes a
`CompositionInput` (bodyPlan + parts + colors + seed) and returns an SVG
string. The viewer consumes this exact API — no forked logic.

### Studio dev-tool convention confirmed

No existing `dev/` directory. The studio's established convention for
standalone surfaces is `ts/src/standalone/{name}/` with `entry.tsx` +
`index.html` (9 existing standalone game surfaces). The character viewer
follows this pattern at `ts/src/standalone/character_viewer/`.

### What was built

**New standalone surface:** `ts/src/standalone/character_viewer/`

| File | Purpose |
|---|---|
| `index.html` | HTML entry point |
| `entry.tsx` | React root — mounts CharacterViewer |
| `CharacterViewer.tsx` | The viewer itself — live controls, side-by-side, export, presets |
| `styles.css` | Viewer-specific styles |

### Real controls (not a static gallery)

- **Body Plan selector** — switch between `humanoidBilateral` and
  `chimeraAsymmetric` live, no reload
- **Per-slot shape override** — for each of the six real slots, a live
  dropdown to swap the primitive (`polygon`/`radialBurst`/`teardropFin`/
  `irregularFragment`) and range sliders to adjust each primitive's
  real params (vertexCount, irregularity, radius, scale, angularity,
  armCount)
- **Color/Brand swatch controls** — per-slot color picker + 12 preset
  color swatches, so per-element silhouette work can start now without
  waiting on the full Brand styling system
- **Side-by-side comparison** — two configurations rendered
  simultaneously at 300px each (not the 64-120px production sizes),
  with click-to-select which panel is active for editing
- **Seed control** — range slider 0-999 for deterministic shape jitter
- **Export/save** — the current active config is exportable as a real
  JSON `SlotShapeMapping` set, copyable to clipboard, usable as a real
  Body Plan or Brand preset later

### Three reference-informed presets

1. **Bionicle (Brand/silhouette)** — clean polygons, distinct
   silhouette, uniform blue. `humanoidBilateral` body plan, low
   irregularity, teardropFin limbs with moderate angularity.
2. **Giger (Cyber/Organic)** — organic/mechanical blending, dark
   metallic palette. `humanoidBilateral` body plan, high angularity
   teardropFin (mechanical) + irregularFragment (organic) parts, dark
   grey/charcoal colors.
3. **Frankenstein (Quality/asymmetry)** — deliberate asymmetry,
   visible mismatch. `chimeraAsymmetric` body plan, mixed primitives
   (radialBurst arm + teardropFin arm, different leg primitives),
   high irregularity, mismatched earth-tone colors.

### Production paperDoll module confirmed unmodified

Git diff confirmed empty for all four production source files:
- `composer.ts` — byte-unchanged
- `attachmentGraph.ts` — byte-unchanged
- `bodyPlans/humanoidBilateral.ts` — byte-unchanged
- `bodyPlans/chimeraAsymmetric.ts` — byte-unchanged

### Test anchors (16 new, all passing)

**New test file:** `ts/tests/test_character_viewer.ts`

- `test_viewer_consumes_real_module` (2 tests) — viewer source imports
  from real paperDoll module (not forked), renders via real
  `renderFigureSvg` producing valid SVG
- `test_body_plan_switch_live` (1 test) — switching body plan produces
  different render without reload
- `test_per_slot_override_live` (2 tests) — changing a slot's primitive
  updates the render, changing a slot's params updates the render
- `test_side_by_side_renders_distinct_configs` (2 tests) — two configs
  render simultaneously at 300px and are different, viewer source has
  two figure panels
- `test_export_produces_valid_config` (2 tests) — exported config is a
  valid SlotShapeMapping set usable to build a real BodyPlan and render,
  viewer source has export functionality
- `test_no_production_code_modified` (4 tests) — composer.ts,
  attachmentGraph.ts, humanoidBilateral.ts, chimeraAsymmetric.ts all
  confirmed byte-unchanged via git diff
- `test_no_regression` (3 tests) — three reference presets exist in
  viewer source, viewer is standalone (not imported by any game),
  PaperDoll React component still works in MBB and Chimera Wilds

**Full TS floor:** 913/917 passing (91 test files). +16 from previous
floor. 4 failures all pre-existing/unrelated. Zero regressions.

### Access paths

Both paths reach the same real tool:
1. **Arcade (new):** Click "Character Viewer" card in the arcade grid
2. **Dev-only (unchanged):**
   `http://localhost:5173/src/standalone/character_viewer/index.html`
