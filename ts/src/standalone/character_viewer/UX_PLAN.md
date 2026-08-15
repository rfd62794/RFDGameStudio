# Character Viewer — UX/Flow Planning Document

**August 2026 | Produced as part of the Frame Fix + UX Flow Planning directive**

This is a real planning document, not implemented speculative features.
It answers the four real questions from §2 of the directive with actual
decisions, and documents the minimal layout restructuring that was
implemented alongside the frame fix.

---

## §1 Primary View Hierarchy

**Decision: Render area dominates. Controls are secondary.**

The Character Viewer is a visual tool — its primary purpose is to see
shapes. The side-by-side comparison panels are the hero of the screen,
and the controls exist to serve that comparison. The current layout
(comparison on top, controls below) is the right hierarchy — the user
sees the shapes first, then adjusts.

The render panels are sized to fill the available width (up to 480px
each, responsive), with the SVG inside them set to `width: 100%` so
the figure fills the panel. This makes the shapes the largest visual
element on screen, which is correct for a shape iteration tool.

The controls section is a single panel below the comparison, clearly
delineated by a border. It's accessible but doesn't compete for
attention with the render area.

## §2 Real Workflow, Start to Finish

**The actual path a user takes through the tool:**

1. **Land on the tool** → see the side-by-side comparison with default
   presets (Bionicle on the left, Frankenstein on the right). Both
   panels render immediately — no loading step, no blank state.

2. **Pick a starting point** → click one of the three preset buttons
   (Bionicle / Giger / Frankenstein). The preset loads into the
   currently active panel (highlighted with a blue border). The user
   can also switch body plans (humanoid_bilateral / chimera_asymmetric)
   or change the seed for different procedural variations.

3. **Adjust** → expand the per-slot controls. Each of the 6 slots
   (head, chest, left_arm, right_arm, left_leg, right_leg) has:
   - A primitive selector (polygon / radialBurst / teardropFin /
     irregularFragment / sigmoidBulge)
   - Parameter sliders specific to the selected primitive
   - A color picker + 12 preset color swatches

   Changes apply live to the active panel — no "apply" button, no
   render delay. The user sees the shape change as they drag the
   slider.

4. **Compare** → click the other panel to make it active, then adjust
   it independently. The side-by-side view shows both figures
   simultaneously, so the user can compare different approaches in
   real time.

5. **Export** → click "Show Export" to reveal the JSON config
   (SlotShapeMapping set + colors + seed). Click "Copy to clipboard"
   to copy it for pasting into a game's body plan definition.

**Gaps identified (not fixed in this phase — documented for future):**

- **No "blank" starting point.** The user always starts from a preset.
  A "blank" option (all default shapes, no overrides) would be useful
  for starting from scratch. **Not blocking** — any preset can be
  modified to become anything.

- **No way to load an existing in-game mutant/chimera.** The viewer
  uses dummy parts, not real game data. This is by design — the tool
  is for iterating on shape *parameters*, not for inspecting specific
  game entities. **Not blocking** — the shape parameters are what
  matter, not the part IDs.

- **No "reset to preset" button.** Once a user modifies a preset,
  they can re-load it by clicking the preset button again. This works
  but isn't obvious. **Minor UX gap, not blocking.**

## §3 Side-by-Side's Real Purpose

**Decision: Comparing two different configurations, not before/after.**

The side-by-side view serves the "compare different approaches" use
case — the user configures the left panel with one set of shapes/
colors/parameters and the right panel with a different set, then
compares them visually. This is the correct purpose for a shape
iteration tool.

A "before/after" comparison (showing the same panel before and after
an adjustment) would require snapshotting the previous state and
displaying it alongside the current state. This is a different feature
with different UX — it would need a "snapshot" button and a way to
overlay or toggle between states. **Not implemented, not needed for
the current workflow** — the user can simply use the two panels as
"version A" and "version B" and adjust them independently.

The active panel (highlighted with a blue border) is the one being
edited. Clicking a panel makes it active. This is clear and works
well — the user always knows which panel their adjustments will
affect.

## §4 Real Screen-Real-Estate Budget

**Decision: Minimum 1024×600. Designed for 1200×800 comfortable use.**

The tool's layout breaks down as follows:

- **Header:** ~60px tall (title + subtitle)
- **Comparison panels:** ~450px tall (up to 400px SVG + label + padding)
  - Two panels side by side, each up to 480px wide
  - Total width: up to 960px + gap + padding ≈ 1000px
- **Controls section:** variable height, starts below comparison
  - Preset/body plan/seed controls: ~120px
  - Per-slot grid: 2 rows × 3 columns (at 1024px width) ≈ 300px
  - Export (when shown): ~200px

**At 1024×600:** The comparison panels fit side by side (each ~480px).
The controls require scrolling to see all 6 slot controls. This is
acceptable — the comparison is the primary view, and the controls are
secondary.

**At 1200×800:** Everything fits without scrolling (comparison + all
controls visible). This is the comfortable working size.

**At 720×400 (narrow):** The comparison panels stack vertically (CSS
media query at 720px breakpoint). The controls wrap to fewer columns.
The tool remains usable but requires more scrolling.

**Changes made to fit this budget:**
- Reduced max-width from 1400px → 1200px (prevents over-stretching
  on wide screens)
- Changed figure panels from `flex: 0 0 320px` (fixed) to
  `flex: 1 1 0` with `max-width: 480px` (responsive)
- Made SVG `width: 100%; height: auto` (fills panel, not fixed pixels)
- Reduced per-slot grid min-width from 280px → 240px (fits 3 columns
  at 1024px)
- Added `@media (max-width: 720px)` breakpoint to stack panels
  vertically on narrow screens

---

## Summary of Layout Restructuring Implemented

| Change | Why |
|---|---|
| SVG viewBox computed from content bounds | Fixes "nothing fits in frame" — content fills the SVG regardless of display size |
| SVG `width: 100%; height: auto` in CSS | SVG fills the panel responsively, not fixed 300px that overflowed the 296px inner width |
| Figure panels `flex: 1 1 0` instead of `flex: 0 0 320px` | Panels share available width equally, adapt to viewport |
| Max-width 1200px instead of 1400px | Prevents over-stretching on wide screens, keeps content readable |
| Per-slot grid min-width 240px instead of 280px | Fits 3 columns at 1024px viewport |
| Media query at 720px for vertical stacking | Tool remains usable on narrow screens |
| Added sigmoidBulge to primitive options | 5th primitive was missing from the viewer |
