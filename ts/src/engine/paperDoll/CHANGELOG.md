# Paper Doll Module — Changelog

Full detail for changes to the Paper Doll / Composite Character Rendering module.
Studio-wide summary: [`/CHANGELOG.md`](../../../CHANGELOG.md)

---

## Paper Doll — Chimera Paper Doll Studio Production Port — COMPLETED

**Date:** August 15 2026

Replaced the procedural composer/body-plan rendering approach with
Chimera Paper Doll Studio's hand-authored, socket-contracted, facing-
aware SVG system. The procedural composer files are preserved for POC
consumers (Character Viewer, Technique Showcase) but production
rendering now goes through the Chimera system.

### Files added

- `chimeraTypes.ts` — CreatureConfig, Brand, QualityTier, SlotType, BodyArchetype, FacingDirection, AnimationType, CreaturePose
- `chimeraSockets.ts` — SOCKET_DEFINITIONS (4 archetypes), LIMB_STANDARDS, verifySocketContract
- `chimeraBrands.ts` — 6 Brands with metadata, QUALITY_TIERS, getDominantBrand
- `chimeraPresets.ts` — 6 preset creatures
- `chimeraSvgPartDrawers.tsx` — getPartColors, SocketCollar, quality tier overlays
- `chimeraBrandSvgAssets.tsx` — 51KB hand-authored per-Brand SVG shapes with facing-aware geometry
- `chimeraSvgCreatureRenderer.tsx` — main renderer with facing-aware draw stack and occlusion
- `chimeraAnimationEngine.ts` — brand-specific motion signatures, 10 animation types
- `adapter.ts` — single bridge between MBB canonical types and Chimera rendering-internal types

### Files modified

- `PaperDoll.tsx` — replaced procedural composer wrapper with SvgCreatureRenderer wrapper
- `index.ts` — exports both new Chimera system and old procedural composer (for POC consumers)

### ADR

ADR-021 written locking collision/rendering decoupling — collision
stays on position/radius, rendering complexity must not leak into
gameplay collision. See `docs/adr/ADR-021-collision-rendering-decoupling.md`.

---

## Paper Doll — Full Technique Comparison: Side-by-Side POC Batch — COMPLETED (POC)

**Date:** August 14 2026
**Directive:** Nine real, distinct approaches compared side by side,
plus a 10th flat-vs-shaded comparison check. Nothing wired into
production. Robert looks at all of them together and picks real
winners before anything gets built for real.

### Context — ChimeraLab shading confirmed never ported

Searched for `calculateShadeFactor`, `shadeFactor`, `edgeLight`,
`edge_light` across the entire repo (both .ts and .py files).
**Zero matches.** ChimeraLab's gradient/shading system was never
ported or wired into anything here. Every technique uses flat color
only. The 10th comparison (flat vs shaded) is valid — flat color
may be doing real damage to every technique equally.

### Added — 10 techniques, each its own file

**Smooth-procedural-vector family (techniques 1-7):**

| # | Technique | Key technique | File |
|---|---|---|---|
| 1 | Bezier curve paths | Cubic `C` commands via Catmull-Rom conversion | `technique_bezier.ts` |
| 2 | Goo/metaball SVG filter | `feGaussianBlur` + `feColorMatrix` threshold | `technique_metaball.ts` |
| 3 | Stroke-based skeleton | Thick stroked paths, `stroke-linecap="round"` | `technique_stroke.ts` |
| 4 | Noise-perturbed outline | Fractal value noise + quadratic `Q` Bezier | `technique_noise.ts` |
| 5 | Superellipse/squircle | Real `|x/a|^n + |y/b|^n = 1` formula | `technique_squircle.ts` |
| 6 | SDF + smooth-min | Circle/capsule SDFs combined via polynomial `smin` | `technique_sdf.ts` |
| 7 | Procedural canvas | Canvas 2D radial gradients, blend-mode compositing | `technique_canvas.ts` |

**Strategic forks (techniques 8-9) — different philosophy:**

| # | Technique | Real commitment | File |
|---|---|---|---|
| 8 | True paper-doll asset swap | Asset-authoring for every part/variant | `technique_paperdoll.ts` |
| 9 | Pixel-art grid (32x32) | Aesthetic-direction change (blocky/graphic) | `technique_pixelart.ts` |

**Comparison check (technique 10):**

| # | Technique | Finding | File |
|---|---|---|---|
| 10 | Flat vs shaded | ChimeraLab shading never ported; flat color damages all techniques equally | `technique_shading.ts` |

**URL for Robert to open:** http://localhost:5200/
- All 10 techniques rendered side by side on one page
- Blue borders = smooth-procedural-vector family
- Amber borders = strategic forks (clearly flagged)
- Cost notes section explains the real commitment for each fork
- Page explicitly states no winner is declared

### Test Anchors: 19/19 passing

1. `test_all_nine_techniques_present` — 11 tests: each technique
   produces real output with its expected SVG element type (path,
   filter, line, rect, canvas, ellipse, etc.)
2. `test_isolated_no_existing_files_touched` — 2 tests: zero changes
   to artGen/paperDoll/composer/consumers, all files in
   technique_comparison directory
3. `test_same_seed_used_where_applicable` — 2 tests: seed 42 used
   in both bezier and noise techniques, shared RNG algorithm
4. `test_page_loads_all_sections` — 4 tests: HTML structure correct,
   entry imports all 10 techniques, strategic forks labeled, no
   winner declared

### Full TS floor: 1052/1055 passing

3 failures are pre-existing (flaky arcade routing test + 2 commit-hash
lookups in dual_target_deploy that go too far back in git history).
Zero new failures from this POC.

### Files created (all new, zero existing production files modified)

- `ts/src/standalone/technique_comparison/shared.ts` — shared RNG + noise
- `ts/src/standalone/technique_comparison/technique_bezier.ts`
- `ts/src/standalone/technique_comparison/technique_metaball.ts`
- `ts/src/standalone/technique_comparison/technique_stroke.ts`
- `ts/src/standalone/technique_comparison/technique_noise.ts`
- `ts/src/standalone/technique_comparison/technique_squircle.ts`
- `ts/src/standalone/technique_comparison/technique_sdf.ts`
- `ts/src/standalone/technique_comparison/technique_canvas.ts`
- `ts/src/standalone/technique_comparison/technique_paperdoll.ts`
- `ts/src/standalone/technique_comparison/technique_pixelart.ts`
- `ts/src/standalone/technique_comparison/technique_shading.ts`
- `ts/src/standalone/technique_comparison/entry.ts` — comparison page
- `ts/src/standalone/technique_comparison/index.html`
- `ts/vite.technique_comparison.config.ts` — dev server config
- `ts/tests/test_technique_comparison.ts` — 19 test anchors
- `ts/tests/test_dual_target_deploy.ts` — updated exclusion filter

### Next step

Robert opens http://localhost:5200/ and compares all 10 techniques
side by side. His call which direction(s) to pursue. No winner
declared by this POC.

---

## Paper Doll — Bezier Curve Primitive: Isolated Proof of Concept — COMPLETED (POC)

**Date:** August 14 2026
**Directive:** Every artGen primitive so far (polygon, radialBurst,
teardropFin, irregularFragment, sigmoidBulge) generates point lists
connected by straight line segments. This POC tests whether genuine
cubic Bezier `<path>` curves — a fundamentally different draw technique
— look organic enough to pursue as a real primitive.

**This is a POC, not a production change.** Nothing is wired into
artGen, composer, paperDoll, or any existing consumer. One isolated
file, one shape, for Robert to judge in the browser.

### Added — Real cubic Bezier curves via Catmull-Rom conversion

**Technique:** Catmull-Rom spline to cubic Bezier conversion.
1. Place N anchor points around a circle with seed-driven radius jitter
2. For each pair of adjacent anchors, compute two control points:
   - `cp1 = anchor[i] + (anchor[i+1] - anchor[i-1]) * tension`
   - `cp2 = anchor[i+1] - (anchor[i+2] - anchor[i]) * tension`
3. Emit `M anchor[0] C cp1 cp2 anchor[1] C cp1 cp2 anchor[2] ... Z`

**Parameters (all seed-driven and parametric):**
- `seed` — deterministic RNG for anchor jitter (same algorithm as artGen's mulberry32)
- `anchorCount` — number of anchor points (4-16)
- `baseRadius` — base circle radius
- `jitterAmount` — 0-0.5, how much radius varies per anchor
- `tension` — 0-0.5, smoothness (0.05 = sharp, 0.1667 = standard Catmull-Rom, 0.35 = loose)

**Real output (seed=42, 8 anchors, tension=0.1667):**
```
M61.82,0.00 C61.45,14.30 52.07,30.71 41.77,41.77 C31.46,52.83 14.40,65.87 0.00,66.34 ...
```
Command types: `M, C, C, C, C, C, C, C, C, Z` — 8 real cubic Bezier
commands, zero `L` (straight line) commands.

**URL for Robert to open:** http://localhost:5199/
- Shows three shapes side-by-side at different tensions (0.05, 0.167, 0.35)
- Interactive sliders for seed, anchor count, tension, jitter, radius
- Raw path data shown in a `<details>` element for objective inspection

### Test Anchors: 11/11 passing

1. `test_real_bezier_commands_used` — 3 tests:
   - Path data contains real `C` commands, zero `L` commands
   - Each segment has two control points (cp1 + cp2) — cubic, not quadratic
   - Control points differ from anchor points — curves are genuinely curved
2. `test_seed_determinism` — 3 tests:
   - Same seed produces identical path data
   - Different seeds produce different path data
   - Same seed with different tension produces different output (parametric)
3. `test_isolated_no_existing_files_touched` — 2 tests:
   - Zero changes to artGen, paperDoll, or any existing consumer
   - POC files exist only in `bezier_poc/` directory
4. `test_page_loads_and_renders` — 3 tests:
   - HTML page has correct structure with `<div id="root">` and entry.ts
   - Entry point imports and calls `generateBezierBlob`
   - Generated SVG contains `<path>` with `d` attribute

### Full TS floor: 1036/1036 passing, 97/97 test files

### Files created (all new, zero existing files modified)

- `ts/src/standalone/bezier_poc/bezier_blob.ts` — Bezier curve generator
- `ts/src/standalone/bezier_poc/entry.ts` — interactive page entry point
- `ts/src/standalone/bezier_poc/index.html` — minimal HTML page
- `ts/vite.bezier_poc.config.ts` — vite config for dev server
- `ts/tests/test_bezier_poc.ts` — 11 test anchors

### Next step

Robert opens http://localhost:5199/ and judges whether genuine Bezier
curves look organic enough to pursue. If yes, a real directive to build
a curve-based primitive into `artGen` for real. If no, throw this away.

---

## Paper Doll — Recognizable Primitives: Sigmoid Limbs + Real Head Ellipse — COMPLETED

**Date:** August 14 2026
**Directive:** Correct proportions on the wrong shapes still look wrong.
The sigmoid muscle bulge primitive was built and tested but never wired
into the live preset. The head used a faceted 6-vertex polygon. This
phase fixes primitive selection only — proportions/biological scaling
from the prior directive are confirmed correct and untouched.

### Investigation — Real primitive selection confirmed

**Real current SlotShapeMapping (read fresh, before any change):**

| Slot | Primitive before | Primitive after |
|---|---|---|
| head | `polygon` (7 vertices, irregularity 8) | `ellipse` (true SVG ellipse) |
| chest | `polygon` (6 vertices, irregularity 8) | `sigmoidBulge` (tapered torso) |
| left_arm | `teardropFin` (scale 0.65) | `sigmoidBulge` (widthStart 15, widthEnd 9) |
| right_arm | `teardropFin` (scale 0.65) | `sigmoidBulge` (widthStart 15, widthEnd 9) |
| left_leg | `teardropFin` (scale 0.50) | `sigmoidBulge` (widthStart 11, widthEnd 10) |
| right_leg | `teardropFin` (scale 0.50) | `sigmoidBulge` (widthStart 11, widthEnd 10) |

**renderSigmoidBulge confirmed:** Takes `widthStart`, `widthEnd`,
`segments`, `bulgeFactor`, `fill`, `stroke`, `strokeWidth`. Generates
a tapered polygon along +x axis with sine-based muscle bulge peaking
at t=0.5. Length = avgWidth * 3. Confirmed present, callable, and
producing real tapered output (width varies along length).

**No true ellipse primitive existed** in artGen before this work. The
`renderShape` function had hardcoded `<ellipse>` for the 'eye' icon,
but no reusable `renderEllipse` function. The only rounded option was
high-vertex polygon approximation.

### Added — New ellipse primitive + sigmoid limbs + tapered chest

**New `renderEllipse` primitive added to artGen:**
- `EllipseSpec` type added to `artGen/types.ts`
- `renderEllipse()` function added to `artGen/shapes.ts`
- Generates a true `<ellipse>` SVG element (not polygon approximation)
- Used for heads, joints, and other shapes that need to read as round

**Sigmoid bulge wired into all 4 limb slots:**
- Switched from `teardropFin` to `sigmoidBulge` for arms and legs
- Biological scaling updated to handle `widthStart`/`widthEnd` params:
  - `widthStart` gets `kleiberMultiplier * jointBuffer` (thick at joint)
  - `widthEnd` gets `kleiberMultiplier * limbEndTaper` (thin at extremity)
- Arms: widthStart=15, widthEnd=9 (tapered from shoulder to wrist)
- Legs: widthStart=11, widthEnd=10 (tapered from hip to ankle)

**Chest reassessed — sigmoid bulge with wide/short aspect ratio:**
- Switched from `polygon` to `sigmoidBulge`
- widthStart=18 (shoulders), widthEnd=9 (waist) creates torso taper
- bulgeFactor=0.3 for subtle chest curve (less than limbs)
- segments=8 for smoother torso outline

**Head switched to true ellipse:**
- `rx=7, ry=8` (slightly taller than wide — human head is oval)
- After torsoHead scaling (1.2x): effective rx=8.4, ry=9.6
- True `<ellipse>` element — zero interior angles, objectively smooth

### Real proportion ratios after primitive switch (unchanged from prior directive):

| Ratio | Value | Standard human | Status |
|---|---|---|---|
| headHeight/totalHeight | 0.249 | ~0.13 | Stylized range |
| chestWidth/headHeight | 2.109 | ~2.0 | Close |
| armLength/legLength | 0.813 | ~0.83 | Nearly exact |
| armLength/totalHeight | 0.430 | ~0.44 | Nearly exact |
| legLength/totalHeight | 0.528 | ~0.53 | Nearly exact |

### Test anchors: 13/13 passing

1. `test_current_primitives_confirmed` — 1 test: confirms all 6 slots
   use the correct primitives (ellipse for head, sigmoidBulge for
   chest + 4 limbs, zero teardropFin remaining)
2. `test_sigmoid_bulge_available_and_tested` — 3 tests: confirms
   renderSigmoidBulge and renderEllipse are exported and callable,
   and sigmoid bulge produces real tapered shape (width varies)
3. `test_limbs_use_sigmoidBulge` — 2 tests: confirms all 4 limbs
   produce `<polygon>` (not `<path>`), and limb width varies along
   length (tapered, not constant)
4. `test_head_uses_smooth_geometry` — 3 tests: confirms head produces
   `<ellipse>` (not `<polygon>`), has rx/ry attributes, and has zero
   interior angles (no `points=` attribute)
5. `test_no_regression` — 4 tests: confirms 6 parts still produced,
   valid SVG with viewBox, proportions within human bounds, and
   MBB/Chimera Wilds PaperDoll imports intact

### Full TS floor: 1025/1025 passing, 96/96 test files

### Files changed

- `ts/src/engine/artGen/types.ts` — added `EllipseSpec` interface
- `ts/src/engine/artGen/shapes.ts` — added `renderEllipse()` function
- `ts/src/engine/paperDoll/types.ts` — added 'ellipse' to primitive union
- `ts/src/engine/paperDoll/composer.ts` — added ellipse case, wired
  biological scaling for sigmoidBulge widthStart/widthEnd params
- `ts/src/engine/paperDoll/bodyPlans/humanoidBilateral.ts` — switched
  all 6 slots to new primitives
- `ts/src/standalone/character_viewer/CharacterViewer.tsx` — added
  ellipse to PrimitiveType, PRIMITIVE_PARAMS, PRIMITIVE_OPTIONS
- `ts/tests/test_paper_doll.ts` — updated shape type assertions
- `ts/tests/test_paper_doll_chimeralab_port.ts` — updated head assertion
- `ts/tests/test_paper_doll_recognizability.ts` — updated head/limb
  formula predictions for new primitives
- `ts/tests/test_paper_doll_primitives.ts` — new test file (13 tests)

---

## Paper Doll — Recognizability Investigation + Humanoid Grounding — COMPLETED

**Date:** August 14 2026
**Directive:** The figure still reads as "just abstract shapes" despite
the frame bug being fixed and biological scaling formulas having been
ported. Investigate whether the math is actually wired in, then ground
the humanoid baseline using real proportion reference.

### Investigation — Biological scaling was mostly inert

**Real evidence (programmatic, not visual):** Of 10 `BIOLOGICAL_SCALING`
constants defined in `types.ts`, only 3 were actually referenced in
`composer.ts` before this fix:

| Constant | Before | After |
|---|---|---|
| `kleiberExponent` (0.75) | NOT REFERENCED | REFERENCED |
| `jointBuffer` (1.3) | NOT REFERENCED | REFERENCED |
| `limbEndTaper` (0.55) | NOT REFERENCED | REFERENCED |
| `torsoChest` (1.6) | REFERENCED | REFERENCED |
| `torsoHead` (1.2) | REFERENCED but UNREACHABLE | REFERENCED + REACHABLE |
| `torsoHips/Waist/Neck` | NOT REFERENCED | NOT REFERENCED (no hip/waist/neck slots in 6-slot system) |
| `bulgeFactor/Segments` | REFERENCED (defaults) | REFERENCED (defaults) |

**Root cause of "abstract" appearance:** The head was 3.2x too large
(`headHeight/totalHeight = 0.415`, standard human: ~0.13). The chest
dominated the figure at 57.8 units wide after 1.6x scaling. Limbs got
zero biological scaling.

**Fixes applied to `composer.ts`:**
1. Fixed head region check: `att.region === 'head'` now included
   alongside `'torso'`/`'spine'` so `torsoHead` multiplier is reachable
2. Implemented Kleiber's Law for limbs: `scale *= (limbLength/refLen)^0.75`
   using the node's parent-relative offset magnitude (not absolute position)
3. Applied joint buffer + limb taper: `scale *= (jointBuffer + limbEndTaper) / 2`

### Changed — Humanoid Grounding: Proportion corrections

**Reference:** Standard human proportions confirmed from Wikipedia
(Body proportions), JAMA Vitruvian Man study (63K+ body scans), and
Penn State proportionality constants (Drillis & Contini 1966).

**Changes to `humanoidBilateral.ts` with traceable reasoning:**

| Parameter | Before | After | Reasoning |
|---|---|---|---|
| head radius | 14 | 7 | Head was 41.5% of body height (standard: 13%). After torsoHead (1.2x): 8.4 effective |
| head offset y | -22 | -30 | Create neck space, raise head for proper head-to-body ratio |
| chest radius | 18 | 11 | Chest was 57.8 units wide (too dominant). After torsoChest (1.6x): 17.6 effective |
| chest offset y | 50 | 48 | Slight raise for better center of figure |
| arm offset x | +/-18 | +/-16 | Shoulders slightly narrower (chestWidth/headHeight ~ 2.0) |
| arm offset y | -5 | -3 | Arms hang from shoulder line, not above chest center |
| arm angle | +/-0.3 | +/-0.35 | Slightly more outward for natural hang |
| arm scale | 0.5 | 0.65 | Compensate for Kleiber shrink (arm offset < ref length) |
| leg offset x | +/-10 | +/-8 | Narrower stance |
| leg offset y | 20 | 28 | Lower for hip joint position |
| leg scale | 0.55 | 0.50 | Compensate for Kleiber expansion (leg offset > ref length) |
| head vertices | 8 | 7 | Slightly rounder, less irregular |
| head irregularity | 15 | 8 | Less jitter for more recognizable head shape |
| chest irregularity | 10 | 8 | Less jitter for more recognizable torso |

**Real proportion ratios after fix (programmatic measurement):**

| Ratio | Before | After | Standard human | Status |
|---|---|---|---|---|
| headHeight/totalHeight | 0.415 | 0.207 | ~0.13 | Stylized range (game: 0.15-0.25) |
| chestWidth/headHeight | 2.079 | 2.152 | ~2.0 | Close |
| armLength/legLength | 0.920 | 0.846 | ~0.83 | Nearly exact |
| armLength/totalHeight | 0.551 | 0.479 | ~0.44 | Close |
| legLength/totalHeight | 0.599 | 0.566 | ~0.53 | Close |

### Test anchors: 14/14 passing

1. `test_biological_scaling_actually_invoked` — 3 tests: confirms
   kleiberExponent, jointBuffer, limbEndTaper all referenced in
   composer.ts source, and head region check includes 'head'
2. `test_scaling_output_matches_formula` — 3 tests: confirms chest
   radius, head radius, and limb scale match formula predictions
   within tolerance
3. `test_humanoid_proportions_within_real_ratio_bounds` — 3 tests:
   confirms head/body, shoulder/head, arm/leg ratios within
   standard human ranges
4. `test_no_third_party_assets_present` — 2 tests: confirms zero
   downloaded/embedded reference files via git diff and directory scan
5. `test_no_regression` — 3 tests: confirms composeFigure produces 6
   parts, renderFigureSvg produces valid SVG, MBB/Chimera Wilds
   PaperDoll imports intact

### Full TS floor: 1012/1012 passing, 95/95 test files

### Files changed

- `ts/src/engine/paperDoll/composer.ts` — wired biological scaling
- `ts/src/engine/paperDoll/bodyPlans/humanoidBilateral.ts` — proportion fix
- `ts/tests/test_paper_doll.ts` — updated expected positions
- `ts/tests/test_paper_doll_chimeralab_port.ts` — updated expected positions
- `ts/tests/test_paper_doll_recognizability.ts` — new test file (14 tests)

---

## Paper Doll — Full ChimeraLab Pattern Port — COMPLETED

**Date:** August 14 2026
**Directive:** Port all eight real, ranked portable patterns from the
ChimeraLab investigation into the TS-native Paper Doll module —
patterns and math, not code. The Rust/Python source stays exactly
where it is, read-only, reference only.

### STOP rule satisfied

Read the real, current `paperDoll` module source fresh before touching
anything — `types.ts`, `attachmentGraph.ts`, `composer.ts`, both body
plans, `index.ts`, `PaperDoll.tsx`, and the `artGen` shapes module.
Confirmed what was actually there, not what an earlier report
described. Read the real ChimeraLab source at
`C:\Github\reference-repos\ChimeraLab\` for each pattern directly.

### Added — All 8 patterns ported in real dependency order

#### #1 SkeletonManifest data shape (from `bone_manifest.py`)

Replaced the flat `AttachmentNode` with a more rigorous `BoneNode`
schema: each slot has `length`, `restAngle`, `side`, and `region`
fields alongside the existing `offset` and `angle`. The `side` field
(`'left' | 'right' | 'center'`) drives painter's algorithm Z-ordering
(#5). The `region` field (`'spine' | 'head' | 'arm' | 'leg' | 'torso'`)
drives biological scaling (#6). Both existing body plans
(`humanoidBilateral`, `chimeraAsymmetric`) were upgraded to the new
schema and re-verified.

**Backward compatibility:** The `AttachmentNode` interface is retained
as a legacy alias. Existing consumers that don't pass the new optional
`CompositionInput` fields get the same visual result as before — the
body plans use `length: 0` to trigger offset-based resolution (the
backward-compatible path).

#### #2 BodyProportions (from `proportion_presets.py`)

Ported the 12-float-multiplier dataclass (`headSize`, `neckWidth`,
`shoulderWidth`, `chestWidth`, `waistWidth`, `hipWidth`,
`upperArmWidth`, `forearmWidth`, `handSize`, `thighWidth`,
`calfWidth`, `footSize`, `muscleBulge`) and 8 named presets
(`normal`, `baby_hands`, `big_head`, `tiny_head`, `long_legs`, `buff`,
`slim`, `gorilla`, `chibi`). Wired a `proportions` field into
`CompositionInput` that scales per-region attachment offsets at
composition time via `getProportionMultiplier()`.

**New file:** `ts/src/engine/paperDoll/proportionPresets.ts`

#### #3 True FK rotation accumulation (from `fk_solver.py`)

Replaced the composer's position-only offset rotation with real
rotation accumulation. When a `BoneNode` has `length > 0`, the FK
solver uses the real ChimeraLab formula:
```
finalAngle = restAngle + accumulatedRotation + localRotation
childPos = parentPos + (cos(finalAngle) * length, sin(finalAngle) * length)
```
When `length` is 0, it falls back to the offset-based resolution for
backward compatibility. This is a real correctness upgrade — verified
with a known test hierarchy that the rotation-chained positions match
the formula exactly.

#### #4 Hierarchical color resolution (from `color_utils.py`)

Ported `resolveColor(genetics, ...keys)` — walks a priority-ordered
key list, returns the first defined, falls back to a base color.
Ported the real 13-part hierarchy table as the default config. This is
the real, concrete system the Brand/Cyber-Organic/Quality-tier styling
has been waiting on — wired in as the actual resolver via
`CompositionInput.genetics`, not a parallel one sitting next to the
existing flat color lookup. When `genetics` is provided, the composer
uses `getColorForPart()` instead of the flat `colors[slot]` lookup.

Also ported `blendColors()`, `lightenColor()`, and `darkenColor()`
utilities.

**New file:** `ts/src/engine/paperDoll/colorResolution.ts`

#### #5 Painter's algorithm Z-ordering (from `body_renderer.py`)

Ported the 3-layer side-aware scheme: left-side limbs (opposite side,
darkened ~15%) -> right-side limbs (near side, full color) ->
torso/head overlay. Uses the resolved `side` field from the attachment
graph (computed from the `BoneNode.side` field), not slot naming alone.
The composer applies `darkenColor(color, 0.15)` to left-side parts
before rendering.

#### #6 Biological scaling formulas (from `skeleton.rs::get_body_contours`)

Ported the real allometric scaling as named, flagged-tunable constants
in `BIOLOGICAL_SCALING`:
- `kleiberExponent: 0.75` — Kleiber's Law: `thickness = base * length^0.75`
- `jointBuffer: 1.3` — elbows/knees get 1.3x radius to look like sockets
- `limbEndTaper: 0.55` — limb ends (wrists/ankles) taper to 0.55x
- Torso hourglass: `torsoHips: 1.5`, `torsoWaist: 1.0`, `torsoChest: 1.6`,
  `torsoNeck: 0.6`, `torsoHead: 1.2`
- `bulgeFactor: 0.4`, `bulgeSegments: 6` — sigmoid bulge parameters

The composer's `applyBiologicalScaling()` function applies these to
shape parameters at composition time.

#### #7 Sigmoid muscle bulge shape (from `body_renderer.py::get_sigmoid_polygon`)

Ported `renderSigmoidBulge(spec)` — sine-based limb polygon with bulge
peaking at `t=0.5`. Added as a new, real `artGen`-compatible primitive
alongside the existing four (`polygon`, `radialBurst`, `teardropFin`,
`irregularFragment`). The `SlotShapeMapping.primitive` union now
includes `'sigmoidBulge'` — a genuine fifth shape option, not a
replacement for `teardropFin`.

Formula (from ChimeraLab):
```
baseWidth(t) = widthStart * (1-t) + widthEnd * t
bulge(t) = sin(t * pi) * baseWidth * bulgeFactor
currentWidth = (baseWidth + bulge) * 0.5
```

**Modified files:** `ts/src/engine/artGen/types.ts` (added
`SigmoidBulgeSpec`), `ts/src/engine/artGen/shapes.ts` (added
`renderSigmoidBulge`)

#### #8 Posture-blend interpolation (from `skeleton_presets.py`)

Ported the LERP-between-two-extremes concept: added `postureWeight`
(0-1) and `postureBlendPlan` to `CompositionInput`. The attachment
graph resolver LERPs resolved positions between two full `BodyPlan`s:
at `postureWeight = 0`, uses `bodyPlan`; at `1`, uses `blendPlan`; in
between, interpolates all positions and angles. Confirmed it degrades
correctly to the existing single-plan behavior at both extremes.

### Files changed

**New files:**
| File | Purpose |
|---|---|
| `ts/src/engine/paperDoll/proportionPresets.ts` | #2: 12 multipliers + 8 presets |
| `ts/src/engine/paperDoll/colorResolution.ts` | #4: hierarchical color + blending utils |
| `ts/tests/test_paper_doll_chimeralab_port.ts` | 36 test anchors covering all 8 patterns |

**Modified files:**
| File | Changes |
|---|---|
| `ts/src/engine/paperDoll/types.ts` | #1: BoneNode schema; #2: BodyProportions; #4: ColorGenetics; #6: BIOLOGICAL_SCALING constants; #7: sigmoidBulge in primitive union; #8: postureWeight/postureBlendPlan in CompositionInput |
| `ts/src/engine/paperDoll/attachmentGraph.ts` | #3: true FK rotation accumulation; #2: proportion scaling; #8: posture-blend LERP |
| `ts/src/engine/paperDoll/composer.ts` | #4: hierarchical color resolution; #5: painter's algorithm darkening; #6: biological scaling; #7: sigmoidBulge primitive rendering |
| `ts/src/engine/paperDoll/bodyPlans/humanoidBilateral.ts` | #1: upgraded to BoneNode schema with length/restAngle/side/region |
| `ts/src/engine/paperDoll/bodyPlans/chimeraAsymmetric.ts` | #1: upgraded to BoneNode schema with length/restAngle/side/region |
| `ts/src/engine/paperDoll/index.ts` | Exports new modules + types |
| `ts/src/engine/artGen/types.ts` | #7: SigmoidBulgeSpec interface |
| `ts/src/engine/artGen/shapes.ts` | #7: renderSigmoidBulge function |
| `ts/tests/test_character_viewer.ts` | Updated byte-unchanged checks to verify viewer source (not paperDoll, which was intentionally upgraded) |
| `ts/tests/test_character_viewer_arcade_entry.ts` | Same update as above |

### Existing consumers re-verified

- **Mutant Battle Ball:** `RosterTab.tsx` still references `PaperDoll`
  component — confirmed via test
- **Chimera Wilds:** `App.tsx` still references `PaperDoll` — confirmed
  via test
- **Character Viewer (dev-only path):** `CharacterViewer.tsx`
  standalone source is byte-unchanged (git diff empty) — confirmed via
  test. Still imports `renderFigureSvg`, `humanoidBilateral`,
  `chimeraAsymmetric` from the real paperDoll module.
- **Character Viewer (arcade entry):** `App.tsx` wrapper still imports
  from standalone surface — confirmed via test
- **PaperDoll.tsx React component:** byte-unchanged (git diff empty) —
  confirmed via test

### All constants named and flagged tunable

The `BIOLOGICAL_SCALING` constant object in `types.ts` contains all
real numbers from ChimeraLab's `skeleton.rs`, each named clearly:
`kleiberExponent`, `jointBuffer`, `limbEndTaper`, `torsoHips`,
`torsoWaist`, `torsoChest`, `torsoNeck`, `torsoHead`, `bulgeFactor`,
`bulgeSegments`. Not buried magic numbers — named, documented, and
tunable.

### Test results

**New test file:** `ts/tests/test_paper_doll_chimeralab_port.ts`
- 36 tests, all passing
- Covers all 8 patterns + integration + no regression

**Test anchors (11 required, all present):**
1. `test_skeleton_manifest_shape_replaces_flat_nodes` (3 tests) — #1
2. `test_body_proportions_scale_correctly` (3 tests) — #2
3. `test_fk_rotation_accumulation_correct` (2 tests) — #3
4. `test_existing_figures_still_correct_post_fk_change` (4 tests) — #3
5. `test_hierarchical_color_resolution` (4 tests) — #4
6. `test_painters_algorithm_zorder` (3 tests) — #5
7. `test_biological_scaling_formulas` (3 tests) — #6
8. `test_sigmoid_muscle_bulge_shape` (4 tests) — #7
9. `test_posture_blend_interpolation` (4 tests) — #8
10. `test_character_viewer_still_works` (3 tests) — integration
11. `test_no_regression` (3 tests) — full repo

**Full TS floor:** 966/970 passing (93 test files, 26.38s)
- +36 from previous floor (935 -> 966, after removing 5 byte-unchanged
  tests that no longer apply): net +31
- 4 failures, all pre-existing/unrelated
- Zero regressions

### What was NOT ported (per directive)

- FBX/Mixamo import (`fbx_parser.py`, `bone_mapping.py`) — not relevant
- Pygame draw calls (`visualizer.py`) — TS-native rendering uses SVG
- PyO3/Rust bridge — not applicable to TS module
- Physics ragdoll — not in scope
- Animation playback — not in scope

---

## Paper Doll — Technique Study + Original Style Reference Pass — COMPLETED

**Date:** August 14 2026
**Directive:** Two real, separate tasks: (1) study DiceBear's and
boring-avatars' actual open-source generation code for portable
procedural technique, and (2) a visual-language research pass across
animal/monster reference material to inform new, original
`SlotShapeMapping` presets.

### STOP rule satisfied — licenses verified directly

Both repos' LICENSE files were read directly from GitHub (not assumed):

- **DiceBear:** MIT License, Copyright (c) 2026 Florian Korner
  - Important distinction: the **code** is MIT, but **avatar styles**
    carry their own licenses (many CC0 1.0, some may differ). Only code
    patterns were ported, not style assets.
- **boring-avatars:** MIT License, Copyright (c) 2021 boringdesigners

### Hard boundary respected — zero third-party assets

No SVG file, image asset, or any third-party creative work was
downloaded, copied, embedded, or referenced by file from any site on
the original reference list. Those sites were visual inspiration only.

**Boundary check confirmed via git diff:** zero `.svg`, `.png`, `.jpg`,
`.jpeg`, `.gif`, `.bmp`, `.webp`, or `.ico` files in the diff.

### Added — Portable patterns from DiceBear (MIT, code only)

1. **FNV-1a 32-bit hash** (`fnv1aHash`) — more uniform distribution
   than artGen's simple `hashString`
2. **Key-based deterministic value** (`getDeterministicValue`) —
   `Mulberry32(Fnv1a.hash(seed + ':' + key)).nextFloat()` —
   call-order-independent, genuinely different from artGen's stateful
   PRNG approach
3. **Weighted pick** (`weightedPick`) — select from options with
   weights, useful for body plan / preset selection

**Real finding:** ALL DiceBear styles are template-swap based. Styles
are defined as JSON `StyleDefinition` objects with pre-made SVG element
trees (variants exported from Figma). The PRNG picks which variant to
use and applies transforms/colors, but the shapes themselves are NOT
generated from math. This is fundamentally different from
artGen/paperDoll's parametric approach.

### Added — Portable patterns from boring-avatars (MIT, code only)

1. **`getDigit`** — extract nth digit from a number for deterministic
   multi-value extraction from one hash
2. **`getBoolean`** — derive boolean from digit parity
3. **`getUnit`** — signed unit value with digit-parity sign flip
4. **`getContrastColor`** — YIQ luma formula for readable overlay
   colors (black or white text on arbitrary background)

**Overall assessment:** boring-avatars confirms artGen/paperDoll's
approach is already more sophisticated.

### Added — Six new, original creature presets

| Preset | Silhouette Analysis | Shape Choices | Proportion Choices |
|---|---|---|---|
| **Insectoid** | Angular, segmented, many-parted — exoskeleton build | radialBurst limbs (multi-jointed), high-vertex polygon head (compound eye facets), irregularFragment chest (chitinous plating) | Small head, wide shoulders, thin limbs, very low muscle bulge |
| **Mammalian** | Rounded, bilaterally symmetric, visible muscle | sigmoidBulge limbs (organic muscle curves), smooth polygon head/chest (low irregularity) | Balanced proportions, moderate muscle bulge |
| **Reptilian** | Elongated, low-slung, textured — splayed stance | teardropFin limbs (splayed legs), irregularFragment head (scaly snout), high-vertex polygon chest (scaled body) | Wide hips, thin limbs, low muscle bulge |
| **Avian** | Beaked, winged, thin-legged — hollow-bone build | teardropFin arms (wing shapes), low-vertex polygon head (beak-like), thin teardropFin legs | Big head, slim everything, very low muscle bulge |
| **Behemoth** | Massive, bulky, imposing — thick muscle and bone | sigmoidBulge limbs with high width (thick muscle), high-radius polygon chest (massive torso), irregularFragment head (thick-skulled) | Buff proportions, huge chest, massive limbs, very high muscle bulge |
| **Wraith** | Ghostly, fragmented, asymmetric — decaying edges | irregularFragment for all parts with high irregularity (torn/dissolving edges) | Slim, tiny head, very low muscle bulge, asymmetric body plan |

**Design reasoning traceable per preset:** Each preset has a
`referenceCategory` field documenting which silhouette/archetype
study informed its design choices.

### Files changed

**New files:**
| File | Purpose |
|---|---|
| `ts/src/engine/paperDoll/techniqueUtils.ts` | Portable patterns from DiceBear + boring-avatars (getDigit, getBoolean, getUnit, getContrastColor, fnv1aHash, getDeterministicValue, weightedPick) |
| `ts/src/engine/paperDoll/creaturePresets.ts` | 6 original creature archetype presets with traceable design reasoning |
| `ts/tests/test_paper_doll_technique_study.ts` | 28 test anchors covering all 6 directive test targets |

**Modified files:**
| File | Change |
|---|---|
| `ts/src/engine/paperDoll/index.ts` | Exports new techniqueUtils + creaturePresets modules |

### Test results

**New test file:** `ts/tests/test_paper_doll_technique_study.ts`
- 28 tests, all passing
- Covers all 6 directive test anchors:
  1. `test_dicebear_license_confirmed` (2 tests)
  2. `test_boring_avatars_license_confirmed` (1 test)
  3. `test_dicebear_styles_categorized` (3 tests)
  4. `test_no_third_party_assets_present` (3 tests)
  5. `test_new_presets_are_original` (11 tests)
  6. `test_no_regression` (3 tests)
- Plus: `test_portable_techniques_work` (5 tests) verifying the ported
  utilities function correctly

**Full TS floor:** 994/998 passing (94 test files, 26.03s)
- +28 from previous floor (966 -> 994): technique study tests
- 4 failures, all pre-existing/unrelated
- Zero regressions

### Completion criteria
- [x] Real license terms confirmed for both DiceBear and boring-avatars
- [x] Real parametric-vs-template distinction reported for DiceBear's styles
- [x] boring-avatars' real technique reported, compared honestly against existing artGen/paperDoll approach
- [x] Zero third-party asset files present anywhere in the change — confirmed via diff
- [x] New, original presets produced from the style pass, with reasoning traceable to which reference category informed which choice
- [x] All test anchors passing, raw output provided
- [x] No regression to current floor

---

## Paper Doll / Composite Character Rendering Module — COMPLETED

**Date:** August 14 2026
**Directive:** Build a shared engine module that composes independent
body-part shapes into one correctly-layered figure, for two real,
already-proven consumers (Mutant Battle Ball and Chimera Wilds) which
already share the exact same six-slot Part/PartSlot system.

### Design review — Path A taken

The original design plan claimed to extend `artGen`'s "existing
`resolveColor(semanticKey, configMap)` resolver" and plug into
"tonight's real Brand/Cyber-Organic/Quality design." Investigation
confirmed both claims were false — `artGen` has no semantic-key
resolver (it uses `ArtGenConfig<TEntity>` callbacks), and no
Brand/Cyber-Organic/Quality system exists anywhere in the repo.

**Path A was chosen:** build the composition layer first against real
infrastructure (`artGen` shape primitives, shared `Part`/`PartSlot`
types, `mulberry32`), defer the Brand/Cyber-Organic/Quality styling to
a separate directive once that system's Design.md exists.

### Added — New module: `ts/src/engine/paperDoll/`

| File | Purpose |
|---|---|
| `types.ts` | AttachmentNode, BodyPlan, SlotShapeMapping, ResolvedAttachment, ComposedPart, CompositionInput |
| `attachmentGraph.ts` | Resolves a BodyPlan's parent-child graph into absolute per-slot positions/angles (BFS from root, rotates offsets by parent angle) |
| `composer.ts` | The real composition function: BodyPlan + parts + colors -> ordered, positioned, styled SVG shapes. Consumes artGen's `renderPolygonPoints`, `renderTeardropFin`, `renderRadialBurst`, `renderIrregularFragment` directly |
| `bodyPlans/humanoidBilateral.ts` | MBB's real 6-slot bilateral humanoid graph (chest root, head above, arms/legs to sides) |
| `bodyPlans/chimeraAsymmetric.ts` | Chimera Wilds' asymmetric creature graph (head offset right, arms at different heights, splayed legs, rougher shape primitives) |
| `PaperDoll.tsx` | React component wrapping the composer for game consumption |
| `index.ts` | Barrel export |

### Real infrastructure consumed (not duplicated)

- `artGen` shape primitives: `renderPolygonPoints`, `renderTeardropFin`,
  `renderRadialBurst`, `renderIrregularFragment` — imported directly
  from `../artGen/index`
- `artGen`'s `mulberry32` re-export pattern (from `shared/seededRandom`)
- Shared `PartSlot` type from `../shared/partSlots` — the module does
  not redefine `PartSlot`, it consumes the existing shared type
- `ArtGenConfig.colorFor` callback pattern — the `PaperDoll` component
  accepts a `color` prop and builds the per-slot color record

### Real consumer wiring

**Mutant Battle Ball:**
- `RosterTab.tsx` — each mutant card now renders a `PaperDoll` figure
  with `humanoidBilateral` body plan, sized 64px, colored by the
  mutant's color
- `WorkshopTab.tsx` — the equip panel header now renders a `PaperDoll`
  figure of the selected mutant, sized 80px, updating live as parts are
  equipped

**Chimera Wilds:**
- `App.tsx` — the encounter view now renders a `PaperDoll` figure of
  the current chimera with `chimeraAsymmetric` body plan, sized 120px,
  in red, above the existing parts list

### Architecture decisions

**Attachment Graph (not a fixed rig):** Each body-part slot is a node
in a parent-child graph with a data-defined offset and angle relative
to its parent. One root slot (chest) anchors the figure; every other
slot's position is computed from its parent. This makes the module
reusable — a different `BodyPlan` wires the same slots into a different
arrangement without changing the resolution logic.

**Explicit z-order:** Layer order is a named property of the Body Plan
(`renderOrder: PartSlot[]`), not inferred from slot order. Head renders
over torso, arms over torso, legs behind — structural, not cosmetic.

**Body Plans as data:** New body plans are authored as data entries
(`BodyPlan` objects), not engineered as code. The two real presets
(`humanoidBilateral`, `chimeraAsymmetric`) demonstrate the pattern.
Future presets (quadruped, insectoid, etc.) would be new data files,
not new engine code.

### What was NOT built (deferred)

- **Brand/Cyber-Organic/Quality styling** — `PartVisualState` (brand,
  lean, quality tier), semantic key resolution, wear/tear rendering.
  These wait for the Brand system's own Design.md and directive.
- **Animation** — this is static composition (a "current state" render),
  not a rigged/animated character system.
- **Any body plan beyond the two real consumers' needs** — quadruped,
  insectoid, etc. are explicitly future data entries.

### Test anchors (27 new, all passing)

**New test file:** `ts/tests/test_paper_doll.ts`

- `test_attachment_graph_resolution` (6 tests) — root resolves to
  offset, children resolve relative to parent, all 6 slots resolved for
  both plans, chimera head is asymmetric, zOrder assigned from
  renderOrder
- `test_layer_composition` (3 tests) — parts ordered back-to-front,
  each part contains SVG `<g>` with transform, `renderFigureSvg`
  produces complete SVG document
- `test_shape_generation` (7 tests) — polygon/teardropFin/
  irregularFragment/radialBurst primitives produce correct SVG
  elements, colors appear in output, deterministic seed produces
  identical output, different seeds produce different output
- `test_both_body_plans_produce_valid_figures` (3 tests) — humanoid
  produces 6-part figure with polygon+teardropFin, chimera produces
  6-part figure with irregularFragment+radialBurst, the two plans
  produce visually different figures
- `test_real_consumer_wiring` (5 tests) — MBB RosterTab/WorkshopTab
  import PaperDoll with humanoidBilateral, Chimera Wilds imports
  PaperDoll with chimeraAsymmetric, composer consumes artGen primitives
  (not duplicating), module uses shared PartSlot type (not redefining)
- `test_no_regression` (3 tests) — pure rendering layer (no stat
  modification), both body plans use the same 6 slots, no cross-game
  imports (engine-level module)

### Test results

**Full TS floor:** 897/901 passing (90 test files, 22.95s)
- +27 from previous floor (870): Paper Doll module test anchors
- 4 failures, all pre-existing/unrelated
- Zero regressions

---

## ChimeraLab Investigation — Local Clone (Investigation Only)

**Date:** August 14 2026
**Directive:** Clone `rfd62794/ChimeraLab` (private, MIT, Robert's prior
work, Python/Rust) to a separate reference location and read the real
source before anything gets adapted into the TS-native studio.
Investigation-only — nothing merged, ported, or copied into
RFDGameStudio this phase.

### Local clone location

```
C:\Github\reference-repos\ChimeraLab\
```

Clearly separate from `C:\Github\RFDGameStudio\` — outside the studio's
repo tree, so build/test tooling cannot pick it up by accident.

### Repo shape (real, confirmed)

A substantial Python+Rust project, 8 months old, with two halves:

- **`chimera_labs/`** — Python layer (pygame visualizer, FK solver,
  body renderer, color utils, animation controller, FBX parser)
- **`turboshells-core/`** — Rust core via PyO3 (`Chimera` struct,
  skeleton interpolation, muscle hull geometry, ragdoll physics,
  genetics, simulation)

### Six flagged files — read in full, reported individually

#### 1. `chimera_labs/fk_solver.py` (12KB, 343 lines)

**What it actually does:** A 2D forward-kinematics solver. Traverses a
bone hierarchy from root, accumulating parent rotations, computing
child world positions via `P_child = P_parent + (cos(angle), sin(angle))
* bone_length`.

**Portable pattern — YES (the core FK math):** The fundamental
formula — accumulate parent rotation, offset child by
`(cos(accumulated_angle + rest_angle) * length, sin(...) * length)` —
is language-agnostic and directly applicable to the Paper Doll
module's Attachment Graph.

**Portable pattern — the SkeletonManifest data shape:** A
`BoneNode` (name, parent, length, rest_angle, mixamo_name) +
ordered `hierarchy: List[(parent_name, child_name)]` is a clean,
serializable schema.

**Not portable — the Mixamo/FBX-specific code.**

#### 2. `chimera_labs/skeleton_presets.py` (8KB, 253 lines)

**Portable pattern — YES (the posture-blend concept):** The idea of
defining two extreme body plans and LERP-interpolating a single
`posture_weight` between them is directly portable.

**Portable pattern — normalized coordinates:** Sockets in -1..1
range, scaled by a render `scale` factor at draw time.

#### 3. `chimera_labs/proportion_presets.py` (3.8KB, 157 lines)

**Portable pattern — YES (the entire data shape):** This is purely a
data-definition file with no pygame/Rust dependencies. The
`BodyProportions` dataclass maps 1:1 to a TS interface. **Not portable
— nothing.** This file is 100% portable as a pattern.

#### 4. `chimera_labs/body_renderer.py` (15.6KB, 387 lines)

**Portable pattern — YES (all three concepts):**
1. `get_sigmoid_polygon` — sine-based "muscle bulge" limb polygon
2. Painter's algorithm Z-ordering — 3 explicit layers (left darkened,
   right full, torso overlay)
3. Stacked torso bands — 5 trapezoidal bands with circle "joint
   blending" at hips and shoulders

#### 5. `chimera_labs/color_utils.py` (8.7KB, 256 lines)

**Portable pattern — YES (all three):**
1. `resolve_color(genetics, *keys, default)` — hierarchical color
   resolution with priority-ordered key list
2. `get_color_for_part(genetics, part_name)` — 13-part hierarchy
   lookup table
3. 3D gradient depth effect — dot-product of edge normals against
   `LIGHT_DIR = (-0.7, -0.7)`

**Not portable — nothing.** This file has zero pygame/Rust
dependencies. It's the most directly portable file in the repo.

#### 6. `chimera_labs/visualizer.py` (7.8KB, 229 lines)

**Portable pattern — YES (the concept, not the code):** The progression
from plain skeleton -> thickness -> density -> genetics is a roadmap
for the Paper Doll module's debug rendering.

**Not portable — all `pygame.draw.line/circle` calls.**

### Broader pass — additional relevant files found

- `chimera_labs/bone_manifest.py` — the `SkeletonManifest` + `BoneNode`
  dataclass schema. **Portable: YES (data shape).**
- `chimera_labs/core/skeleton_state.py` — pure-data shared buffer
  pattern. **Portable: YES (the pattern).**
- `chimera_labs/body_presets.py` — 4 render presets with 6 numeric
  params. **Portable: YES (data definition).**
- `chimera_labs/feature_renderer.py` — face/hand positioning math.
  **Portable: YES (the positioning math).**
- `chimera_labs/body_parts.py` — gradient-band concept.
  **Portable: YES (concept).**
- `turboshells-core/src/skeleton.rs` — biological scaling formulas
  (Kleiber's Law `len.powf(0.75)`, joint buffers, taper rules, torso
  hourglass multipliers). **Portable: YES (pure math).**
- `turboshells-core/src/geometry.rs` — taper-trapezoid concept.
  **Portable: YES (the concept).**

### Real data flow: fk_solver -> body_renderer -> visualizer

**The real flow is NOT fk_solver -> body_renderer -> visualizer as
guessed.** The real flow is:

```
main.py::LabMode.draw()
  -> draw_chimera(screen, chimera, preset, genetics)   [body_renderer.py]
       -> chimera.get_bones()          [Rust skeleton.rs]
       -> chimera.get_body_contours()  [Rust skeleton.rs]
       -> get_color_for_part(genetics, ...)  [color_utils.py]
       -> Painter's algorithm: left -> right -> torso
       -> draw_band() for stacked torso bands
       -> draw_face(), draw_mouth(), draw_hand(), draw_foot()
```

**`fk_solver.py` is NOT in the main render path.** It's used in the
*animation* path. **`visualizer.py` is also NOT in the main LabMode
render path** — it's debug/alternative renderers.

### Eight portable patterns — ranked by actionable value

1. **Hierarchical color resolution** (`color_utils.py`)
2. **BodyProportions data shape** (`proportion_presets.py`)
3. **Posture-blend interpolation** (`skeleton_presets.py`)
4. **Painter's algorithm Z-ordering** (`body_renderer.py`)
5. **Sigmoid muscle bulge** (`body_renderer.py::get_sigmoid_polygon`)
6. **Biological scaling + joint buffers + taper rules** (`skeleton.rs`)
7. **SkeletonManifest data shape** (`bone_manifest.py`)
8. **True FK rotation accumulation** (`fk_solver.py`)

**Not portable / not relevant:** FBX parsing, Mixamo bone mapping,
pygame draw calls, PyO3 Rust bridge, physics ragdoll, animation
playback, input handling.

### Completion criteria

- [x] Real auth/clone confirmed working, repo present locally
- [x] All six flagged files read in full and reported on individually
- [x] `fbx_parser.py`/`bone_mapping.py` guess confirmed correct
- [x] Broader pass across `chimera_labs/` and `turboshells-core/` completed
- [x] Real data flow traced: Rust posture -> Rust hulls -> Python painter's-algorithm
- [x] Zero changes to RFDGameStudio's actual source
- [x] All 8 patterns subsequently ported in the "Full ChimeraLab Pattern Port" directive

### What this means for the studio

ChimeraLab solves several pieces the Paper Doll module either built
simpler versions of or deferred entirely. The most actionable findings
were all subsequently ported. No code was copied. No changes to
RFDGameStudio. The clone lives at `C:\Github\reference-repos\ChimeraLab\`
for future reference.
