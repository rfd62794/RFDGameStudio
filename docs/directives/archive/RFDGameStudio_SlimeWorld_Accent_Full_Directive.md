# RFDGameStudio — SlimeWorld Accents: Full Taxonomy + Implementation Directive

*July 15 2026 (night) | Vehicle: Windsurf/Devin | Retires the old discrete Pattern ladder AND the deferred multi-locus rewrite; replaces both with a Turing-grounded, Shape-and-Color-dependent system*

---

> ⛔ **STOP:** This directive REVERSES two prior decisions, on purpose,
> stated explicitly so neither gets silently lost:
> 1. "Pattern is deliberately parallel and non-cross-referencing,
>    same as Color and Shape" — no longer true. Accent explicitly
>    reads both other systems now.
> 2. The multi-locus Pattern rewrite (Base/Density, Distribution,
>    Intensity loci + Metallic epistatic tier, designed earlier this
>    session, zero code written) — retired in favor of the two-axis
>    Turing model below, for the same reason the April Shape Tree was
>    retired: continuous, real-math-grounded beats discrete-bucketed,
>    and it's the model that actually makes Accent structurally
>    consistent with Color and Shape instead of a third, different
>    kind of system.

**Read-only — do not touch:** `breed_slimes`, `breed_shape`,
`snap_to_faction`, all claim resolvers. Accent reads their OUTPUT,
never their internals.

---

## §0 Real grounding — what's research, what's judgment

**Real, independently verifiable:**
- Turing's 1952 reaction-diffusion model is the accepted biological
  explanation for animal coat patterns (zebrafish stripes, mammal
  coat spots, fingerprint ridges) — genuinely genetic, genuinely
  mathematical, the same dual grounding Color and Shape both have.
- A single two-parameter system (activator strength, inhibitor
  diffusion ratio) produces a REAL, ORDERED sequence of named regimes
  as the diffusion ratio increases: homogeneous/uniform (below
  threshold) → spots → mixture of spots and stripes → stripes →
  labyrinthine stripes (via a real, named further instability, the
  Eckhaus instability) → spiral/hexagonal regimes at further extremes.
  Confirmed across multiple independent sources, including recent
  (2025-2026) published work.
- Surface geometry genuinely biases which pattern emerges in the real
  biology — narrow/elongated surfaces bias toward stripes, wide/round
  surfaces bias toward spots. This is the real justification for
  Shape being an input, not an arbitrary design choice.
- Pattern amplitude is a real, separate parameter in these systems,
  independent of pattern type — and it genuinely decays toward zero
  (pattern becomes invisible, reverts to uniform) as the system
  approaches instability boundaries. Real grounding for Accent's
  second axis (intensity/visibility) and for why breeding very
  different parents can produce a washed-out result, not just a
  differently-shaped one.
- Real color theory: complementary hues (180° opposite on the wheel)
  is the standard mechanism for maximum visual contrast — real
  grounding for how Accent derives its rendered color from the base
  Slime's Color.
- Multistability — the same real parameters producing different
  stable outcomes depending on subtle initial conditions — is a
  documented, named phenomenon in real Turing research. Real
  grounding for keeping Metallic as a genuine rare/unpredictable
  epistatic endpoint, carried forward from the retired multi-locus
  design rather than invented fresh.

**Design judgment, stated as such:**
- The exact numeric zone boundaries below (which diffusion-ratio range
  is "Stripe" vs "Nebula") are a reasonable placement along the real
  ordered sequence, not independently researched thresholds.
- Dropping "Crown" from the old 8-name ladder — it doesn't map cleanly
  onto a real Turing regime the way the other seven do, and dropping
  it conveniently resolves a real naming collision with Shape's own
  "Crown" target (Great Enneagram, {9/4}) — worth flagging that this
  is a genuine two-birds fix, not a coincidence I'm papering over.
- The specific formula coefficients (blend weights, spike strength)
  are tunable guesses, same category as every other constant shipped
  tonight.

---

## §1 The Full Taxonomy

**Axis 1 — Diffusion Ratio (0–100, continuous): determines pattern TYPE.**

| Range | Name | Real regime |
|---|---|---|
| 0–10 | **Solid** | Below Turing threshold — homogeneous, no pattern |
| 10–30 | **Polka** | Spots |
| 30–45 | *(unnamed transitional zone)* | Mixture of spots and stripes |
| 45–65 | **Stripe** | Stripes |
| 65–85 | **Nebula** | Labyrinthine stripes (Eckhaus instability) |
| 85–100 | **Ringed** | Spiral regime |

**Axis 2 — Amplitude (0–100, continuous): determines pattern INTENSITY, independent of type.**

| Range | Name |
|---|---|
| 0–35 | **Glow** (faint, low-contrast) |
| 35–70 | *(unnamed standard zone)* |
| 70–100 | **Obsidian** (stark, maximum contrast) |

**Metallic — rare epistatic endpoint, both axes near simultaneous transition boundaries:**
`diffusion_ratio` in 43–47 AND `amplitude` in 68–72 — a narrow, genuinely rare intersection near two real instability thresholds at once, matching real multistability behavior and the original design intent (not reachable through either axis alone).

**Dropped from the old ladder:** Crown (naming collision with Shape, no clean Turing-regime mapping).

---

## §2 Data Layer: `data.yaml`

```yaml
# --- ACCENT GENETICS ---
# Real grounding: Turing reaction-diffusion morphogenesis (1952).
# Diffusion Ratio determines pattern TYPE (real ordered regime sequence).
# Amplitude determines pattern INTENSITY (real, independent parameter).
# Shape (vertex_count/irregularity) biases Diffusion Ratio — real
# surface-geometry effect on pattern formation. Color determines the
# rendered accent hue via true complementary-color contrast.
accent_genetics:
  diffusion_ratio_min: 0
  diffusion_ratio_max: 100
  amplitude_min: 0
  amplitude_max: 100
  shape_bias_strength: 0.3
  distance_spike_coefficient: 0.4
  target_nudge_strength: 0.6

accent_targets:
  - {id: accent_solid, name: Solid, diffusion_min: 0, diffusion_max: 10}
  - {id: accent_polka, name: Polka, diffusion_min: 10, diffusion_max: 30}
  - {id: accent_stripe, name: Stripe, diffusion_min: 45, diffusion_max: 65}
  - {id: accent_nebula, name: Nebula, diffusion_min: 65, diffusion_max: 85}
  - {id: accent_ringed, name: Ringed, diffusion_min: 85, diffusion_max: 100}
  - {id: accent_glow, name: Glow, amplitude_min: 0, amplitude_max: 35}
  - {id: accent_obsidian, name: Obsidian, amplitude_min: 70, amplitude_max: 100}
  - {id: accent_metallic, name: Metallic, diffusion_min: 43, diffusion_max: 47, amplitude_min: 68, amplitude_max: 72}
```

> ⚠️ RULE: `accent_targets` mixes two different kinds of entries —
> type-zone (diffusion only), intensity-zone (amplitude only), and the
> rare Metallic (both simultaneously). Don't force these into one
> uniform schema shape if it makes the data less honest — a
> `find_accent_type` and a separate `find_accent_intensity` lookup,
> plus a dedicated Metallic check, is cleaner than one lookup pretending
> all three are the same kind of thing.

---

## §3 Logic Layer: `breed_accent`

```lua
function breed_accent(parent_a, parent_b, offspring_vertex_count, offspring_irregularity, offspring_hue)
  local diffusion_a = parent_a.diffusion_ratio or 20
  local diffusion_b = parent_b.diffusion_ratio or 20
  local amplitude_a = parent_a.amplitude or 40
  local amplitude_b = parent_b.amplitude or 40

  local offspring_diffusion = (diffusion_a + diffusion_b) / 2
  local offspring_amplitude = (amplitude_a + amplitude_b) / 2

  -- Shape bias: real surface-geometry effect. Elongated/complex shape
  -- (high vertex_count, high irregularity) biases toward higher
  -- diffusion ratio (stripe/labyrinth/spiral end).
  local shape_complexity = ((offspring_vertex_count - 3) / 19) * 0.5 + (offspring_irregularity / 100) * 0.5
  offspring_diffusion = clamp(
    offspring_diffusion + (shape_complexity * 100 - offspring_diffusion) * 0.3,
    0, 100
  )

  -- Distance-driven amplitude decay: breeding very different diffusion
  -- ratios destabilizes the pattern, same "distance drives instability"
  -- principle as Color and Shape, applied as decay here (real: pattern
  -- amplitude decays near instability transitions).
  local diffusion_distance = math.abs(diffusion_a - diffusion_b) / 100
  offspring_amplitude = clamp(offspring_amplitude - diffusion_distance * 0.4 * 100, 0, 100)

  -- Accent hue: true complementary contrast against the offspring's
  -- own resolved Color hue, scaled by amplitude — at amplitude 0 the
  -- accent is invisible (matches base hue exactly); at amplitude 100
  -- it's a full 180-degree complement.
  local accent_hue = (offspring_hue + 180 * (offspring_amplitude / 100)) % 360

  return {
    diffusion_ratio = offspring_diffusion,
    amplitude = offspring_amplitude,
    accent_hue = accent_hue,
  }
end
```

> ⚠️ RULE: `breed_accent` must be called AFTER both `breed_shape` and
> `breed_slimes` have produced their outputs — it needs the
> offspring's OWN resolved vertex_count, irregularity, and hue, not
> the parents' values, per the pipeline-order decision locked earlier
> tonight. Wire this as the THIRD step in `initiate_breeding`, additive
> merge onto the same child object, same pattern as Shape's integration.

---

## §4 Systems Manifest

Add `breed_accent` to the existing `genetics` system in `systems.yaml`
— third function alongside `breed_slimes` and `breed_shape`, same
system, since all three are conceptually the same domain even though
Accent is now the one system that reads the other two.

---

## §5 Verification — mandatory hand-computed-first, same standard as Color and Shape

- [ ] **Three hand-computed breeding pairs, worked out BEFORE running the code:**
  - Pair 1: diffusion 20/amplitude 40 + diffusion 20/amplitude 40 (identical parents), offspring vertex_count=5, irregularity=17.76, hue=60.
    Expected: offspring_diffusion pre-bias=20, shape_complexity=((5-3)/19)*0.5+(17.76/100)*0.5=0.0526+0.0888=0.1414→14.14, biased diffusion=20+(14.14-20)*0.3=20-1.758=18.24. diffusion_distance=0, amplitude=40 unchanged. accent_hue=(60+180*0.4)%360=(60+72)%360=132.
  - Pair 2: diffusion 10/amplitude 30 + diffusion 90/amplitude 30 (maximally different diffusion), same shape/hue inputs as Pair 1.
    Expected: offspring_diffusion pre-bias=50, biased=50+(14.14-50)*0.3=50-10.758=39.24. diffusion_distance=|10-90|/100=0.8, amplitude=30-0.8*40=30-32=clamped to 0. accent_hue=(60+180*0)%360=60 (fully invisible accent, matches base hue exactly — verify this is the intended behavior, not a bug).
  - Pair 3: same as Pair 1, confirm Metallic does NOT trigger (18.24 diffusion is outside the 43-47 band) — negative test, confirming the rare state doesn't fire accidentally.
  - Paste actual Lua output next to each. Any mismatch is a real bug.
- [ ] Confirm `initiate_breeding` calls `breed_accent` third, after
      `breed_shape`, using the child's own resolved values — paste the
      actual call site.
- [ ] Confirm ADR-006 function count increased by at least 1 (`breed_accent`,
      plus any lookup helpers actually written) — paste new total.
- [ ] `studio_validate_game("slimeworld")` — still expected to report
      only missing `ui.yaml`.
- [ ] Deliberately construct a Metallic-triggering case (diffusion ~45,
      amplitude ~70) and confirm the target lookup correctly identifies
      it — paste the actual match.

> ⛔ Per standing instruction: hand-computed-first, compare-after,
> mandatory. This is the third system built entirely fresh tonight —
> same bar as Shape, no exceptions for being the last one.

---

## §6 Completion Criteria

- [ ] `accent_targets` (8 entries) added to `data.yaml`, matching §1 exactly
- [ ] "Crown" confirmed absent from the new Accent taxonomy
- [ ] `breed_accent` implemented, verified against 3 hand-computed cases
- [ ] Wired as the third step in `initiate_breeding`, reading offspring's
      own resolved Shape and Color output, not parent values
- [ ] `systems.yaml` updated, ADR-006 reconfirmed
- [ ] `breed_slimes`, `breed_shape`, `snap_to_faction`, all claim
      resolvers — confirmed unmodified via diff

---

## §7 Quick Reference

| Item | Status |
|---|---|
| Old 8-tier Pattern ladder | Retired |
| Multi-locus Pattern rewrite (Density/Distribution/Intensity) | Retired — superseded by this |
| "Pattern" as a name | Retired — "Accent" going forward |
| "Parallel, non-cross-referencing" architecture | Reversed for Accent specifically — reads Shape AND Color |
| Crown (old Pattern name) | Dropped — resolves Shape naming collision |
| Metallic | Carried forward as real rare endpoint, now Turing-multistability-grounded |
| Pipeline order | breed_slimes → breed_shape → breed_accent (reads both prior outputs) |
