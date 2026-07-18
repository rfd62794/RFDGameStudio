# RFDGameStudio — Directive: Real Slime Shape Rendering (Phase 1: Geometry)

*July 18 2026 | Read fully before executing. Real, confirmed gap:
`SlimeVisual.tsx` renders every slime as the same CSS teardrop/circle,
completely ignoring `vertexCount`/`irregularity` — data this session's
own Shape Codex work made mechanically meaningful (stat modifiers,
Codex discovery) but which has never once been visually expressed.
Confirmed this is not a regression — the original intake source has the
same flat rendering. Deliberately phased: this directive builds the
real, testable, objective geometry (polygon silhouette from real vertex
count and irregularity). The Accent/color-overlay layer and any broader
CRT/atmosphere visual pass are real, separate, explicitly deferred —
those involve aesthetic judgment calls this directive shouldn't guess at
alone.*

---

> ⛔ **STOP:** Run `cd ts && npx vitest run`. Report the real current
> floor.

---

## §0 Context

**Real, confirmed data already meaningful, never rendered:**
`vertexCount` (3–22, real range confirmed via `SEED_SHAPE_DEFAULTS` —
Red=3, Yellow=6, Purple=4, etc., each color genuinely distinct) and
`irregularity` (0–100) already drive real stat modifiers and real Shape
Codex target matching (both built and verified earlier tonight) — but
`SlimeVisual.tsx` never reads either field for rendering. A Red slime and
a Yellow slime look visually identical today despite having genuinely
different underlying shape data.

**NOT in scope, deferred explicitly, real separate future work:**
- Accent (`diffusionRatio`/`amplitude`/`accentHue`) as a secondary
  visual layer — real, separate, needs its own design pass
- The CRT scanline / per-color glow / distinctive font system found
  earlier tonight in the fresh export — real, separate, already flagged,
  still unbuilt, not bundled in here
- Any animation/transition polish — real, separate, cosmetic-only once
  the base geometry exists

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `ts/src/games/slimeworld/components/SlimeVisual.tsx` | Modify | Replace the flat CSS body with a real SVG polygon generated from `vertexCount`/`irregularity` |
| `ts/tests/test_slime_visual_geometry.tsx` | New | Anchors below |

**Read-only — do not touch:** the underlying shape-genetics data/formulas
(`get_shape_stat_modifiers`, `match_shape_target` — untouched, this is
pure rendering), the existing pattern/color CSS overlay logic (kept as
the base fill, polygon shape wraps around it).

---

## §2 Implementation

### Real, testable polygon generation

```tsx
function generateSlimePolygonPoints(vertexCount: number, irregularity: number, seed: number, radius = 40, center = 50): string {
  const points: string[] = [];
  const angleStep = (2 * Math.PI) / vertexCount;
  // Deterministic per-slime pseudo-randomness — same slime always
  // renders identically, not re-randomized every render
  const rng = mulberry32(seed);
  for (let i = 0; i < vertexCount; i++) {
    const baseAngle = i * angleStep;
    const angleJitter = (rng() - 0.5) * (irregularity / 100) * angleStep * 0.5;
    const radiusJitter = 1 + (rng() - 0.5) * (irregularity / 100) * 0.6;
    const angle = baseAngle + angleJitter;
    const r = radius * radiusJitter;
    points.push(`${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`);
  }
  return points.join(' ');
}
```

> ⚠️ RULE: `seed` must be real and deterministic per-slime (derived from
> the slime's real `id`, e.g. a simple string hash) — not
> `Math.random()`. A slime's silhouette must stay visually stable across
> re-renders; a shape that re-randomizes on every render would look
> broken, not organic.

> ⚠️ RULE: `mulberry32` (or an equivalent small, real, seeded PRNG) needs
> a real, correct implementation — don't invent ad-hoc "randomness" from
> `Math.sin(seed) * 10000 % 1`-style tricks, which have real, well-known
> distribution problems. Use a genuine, standard small PRNG.

> ⚠️ RULE: `irregularity=0` must produce a real, clean regular polygon —
> no jitter at all. This is a real, directly verifiable geometric
> property, not a subjective call — test it exactly.

Render via a real `<svg><polygon points={...} /></svg>`, replacing the
current CSS-shaped body while keeping the existing pattern/color overlay
(stripes, polka, glow, etc.) as a fill/pattern applied to the same
polygon, not discarded.

---

## §3 Test Anchors

| Test | Target |
|---|---|
| `test_zero_irregularity_produces_regular_polygon` | Real, exact geometric check — all vertices equidistant from center, evenly spaced angularly |
| `test_higher_irregularity_produces_more_vertex_deviation` | Real, measurable — average deviation from a regular polygon increases monotonically with the irregularity input |
| `test_same_slime_id_produces_identical_polygon_across_calls` | **The real, load-bearing stability test** — same seed, same output, every time, not re-randomized per render |
| `test_different_vertex_counts_produce_different_point_counts` | Real, direct — a 3-vertex slime has 3 points, a 12-vertex slime has 12 |
| `test_red_and_yellow_starter_slimes_render_visually_distinct_shapes` | Real, end-to-end — using the actual `SEED_SHAPE_DEFAULTS` values (Red=3, Yellow=6), confirm the two real starter colors produce genuinely different point counts |
| `test_pattern_overlay_still_applies_to_new_polygon_shape` | Real regression check — existing color/pattern rendering isn't lost in the swap |

**Target: report the real number.**

---

## §4 Completion Criteria

- [ ] Real pre-flight floor confirmed
- [ ] Zero-irregularity regular-polygon property confirmed via a real geometric test, not eyeballed
- [ ] Per-slime shape stability confirmed real and deterministic
- [ ] Real, live screenshot comparison: a Red (3-vertex) and Yellow (6-vertex) starter slime shown side by side, genuinely visually distinct
- [ ] `cd ts && npx vitest run` → raw output pasted, real final floor reported
- [ ] `docs/state/current.md` updated: this phase noted, Accent-layer and atmosphere work explicitly named as the real, separate, still-open next phases

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| Real gap | Shape genetics data exists and is mechanically meaningful, never once rendered |
| Real scope here | Polygon silhouette geometry only — objective, testable |
| Explicitly deferred | Accent color-overlay layer, CRT/font atmosphere pass |
| The property that must hold exactly | `irregularity=0` → perfect regular polygon |
| The property that must hold for UX | Same slime → same shape, every render |

---

*Director: Claude | The real geometry first — deliberately not guessing at aesthetic polish alone, 2026-07-18*
