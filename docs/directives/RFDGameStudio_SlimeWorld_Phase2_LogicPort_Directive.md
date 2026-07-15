# RFDGameStudio — SlimeWorld Phase 2: Logic Port (2a) + Shape Breeding (2b)

*July 14/15 2026 (night) | Vehicle: Windsurf/Devin, direct in RFDGameStudio repo | Follows verified Phase 1 (data.yaml)*

---

> ⛔ **STOP:** This directive has two tracks with DIFFERENT verification
> standards. Track 2a is a faithful port of code that already runs in
> the live TS build — verify by matching known behavior. Track 2b is a
> FIRST IMPLEMENTATION of logic that has never executed anywhere —
> verify by hand-computed test cases, the same discipline that caught
> the wrong "2 generations" claim on Color genetics earlier this arc.
> Do not apply 2a's lighter verification standard to 2b's output.

**Read-only — do not touch:** `examples/slimeworld/` (the TS source
of truth — read from it, never write to it), `games/horse_racing/`
(reference precedent only), any other existing native game under
`games/`.

---

## §0 Prerequisite — Phase 1b: Starter Count Correction

Before any logic gets written, `games/slimeworld/data.yaml` needs one
correction: it currently reflects the CURRENT `App.tsx` state (2
starters), not the Design.md Rev 3 canon locked later the same night
(3 starters — one Red, one Yellow, one Blue, given not bred). The
data.yaml is not wrong — it faithfully extracted what existed at the
time — but Phase 2 logic must be built against the current design, not
the stale extraction.

```yaml
# BEFORE (current file):
lab:
  starting_roster_count: 2
  starter_slimes:
    - name: Specimen-Cinder-Alpha
      color: Red
      pattern: Solid
    - name: Specimen-Abyssal-Beta
      color: Blue
      pattern: Solid

# AFTER (required):
lab:
  starting_roster_count: 3
  starter_slimes:
    - name: Specimen-Cinder-Alpha
      color: Red
      pattern: Solid
    - name: Specimen-Sulphur-Beta
      color: Yellow
      pattern: Solid
    - name: Specimen-Abyssal-Gamma
      color: Blue
      pattern: Solid
```

Naming the third starter is a placeholder — keep it consistent with
the existing `Specimen-{Strain}-{Letter}` pattern, source the strain
name from the matching culture's `specialty` field in `cultures.gale`
(Sulphur Strain).

> ⚠️ RULE: this is a single, isolated edit to `data.yaml`. Do not use
> this as an opportunity to touch anything else in that file — Phase 1
> is otherwise verified and closed.

---

## §1 Track 2a — Verified Port (existing, observed-working TS logic)

### Scope

Port to `games/slimeworld/logic.lua` + `games/slimeworld/systems.yaml`:

- Color genetics: `breedSlimes`, `circularHueMidpoint`, distance-based
  desaturation, repetition penalty, Gray threshold check, Target
  Regent post-processing step
- Claim resolution: `resolveForceClaim`, `resolveBribeClaim`,
  `resolveConvertClaim` — **all three must hardcode owner color to
  Gray**, matching the real bug-fix already verified in the TS source.
  Do not reintroduce the player-editable target-color dropdown that
  caused the original security bug.
- The nine action hooks: `useBreedingActions`, `useClaimActions`,
  `useCycleActions`, `useDispatchActions`, `useEconomyActions`,
  `useExplorationActions`, `useGarrisonActions`, `useMediationActions`,
  `useUpgradeActions` — each becomes one or more Lua functions,
  organized into `systems.yaml` systems following `horse_racing`'s
  precedent (`genetics`, `breeding`, `market`, etc. as the system
  categories — choose category names that make sense for SlimeWorld's
  actual domains, don't force horse_racing's exact category names).

> ⚠️ RULE: per ADR-006, every function in `logic.lua` must appear in
> exactly one system's functions list in `systems.yaml`. This is
> enforced by `studio_validate_game`, not just convention — check this
> explicitly before claiming the phase done.

### Verification (2a)

- [ ] Pick 3 known breeding pairs from the TS source's own behavior
      (or hand-computed via the documented formula: `BASE_K = 0.12` /
      `base_saturation_loss_coefficient`, repetition penalty floor
      0.15, streak penalty 0.12, Gray threshold saturation < 15).
      Paste the Lua output for each against the hand-computed expected
      value.
- [ ] Confirm all three claim functions produce `owner_color: Gray`
      regardless of input — paste a test call for each claim type
      showing this explicitly, not just a code read-through.
- [ ] Paste `studio_validate_game("slimeworld")` actual output —
      still expected to report missing `ui.yaml` at this stage, but
      the Lua-load and systems.yaml-function-matching checks should
      now pass for everything in scope.

---

## §2 Track 2b — Shape Breeding (first implementation, never executed)

### Scope

This is new logic, not a port. Nothing to match against except the
documented design math. Implement in the same `logic.lua`/
`systems.yaml`, but treat every output as unverified until hand-checked.

- `breed_shape(parent_a, parent_b)`: continuous blend on two axes —
  `vertex_count` (3–22+) and `irregularity` (0–100%) — using the same
  `(parent1 + parent2) / 2` blend pattern already proven in
  `color_genetics` and independently cross-confirmed against
  TurboShells' `inherit_blended()`.
- `SHAPE_TARGETS` codex array — named target coordinates on the
  continuous vertexCount/irregularity scale, replacing the old
  discrete Shape Tree lookup table. Source the actual target names/
  coordinates from the design doc (Rev 3 / the original Shape
  Genetics directive in outputs) — do not invent new targets here.
- Wire into the same post-processing step pattern as Color's Target
  Regents, if the design calls for an equivalent Shape nudge item —
  confirm this against the design doc rather than assuming symmetry
  with Color.

> ⚠️ RULE: `Diamond` is confirmed NOT a distinct vertex count — it's
> Square(4) at high Irregularity. Do not create a separate `Diamond`
> entry in `SHAPE_TARGETS`; it should fall out naturally from the
> Square coordinate at a high-irregularity range.

> ⚠️ RULE: Shape and Color are deliberately parallel, NON-cross-
> referencing systems — no combined threshold mechanic. Do not add
> any code path where a Slime's Shape values influence Color outcomes
> or vice versa.

### Verification (2b) — higher bar than 2a, this is load-bearing

- [ ] Hand-compute at least 3 breeding pairs BEFORE running the Lua
      code — pick specific parent vertex_count/irregularity values,
      work out the expected blended child by hand using the documented
      formula, write the expected result down first.
- [ ] Run the actual `breed_shape` Lua function against those same 3
      pairs. Paste the actual output next to the pre-computed expected
      value for each. Any mismatch is a real bug, not a rounding
      quibble — flag and stop, don't average it away.
- [ ] Confirm polygon-constructibility tiers are respected in whatever
      target-assignment logic exists (Tier 1: 3,4,6 through Tier 5:
      11,22) — paste which tier each test-case output landed in.
- [ ] Confirm zero references to Color fields (`hue`, `saturation`)
      anywhere inside `breed_shape` or `SHAPE_TARGETS` logic — grep
      and paste the empty result, proving the non-cross-referencing
      rule held.

> ⛔ Per standing instruction, doubly true here since there's no prior
> working version to fall back on: "implemented and appears to work"
> is not proof. The hand-computed-first, compare-after methodology is
> mandatory for this track, not optional rigor.

---

## §3 Completion Criteria

- [ ] `data.yaml` starter count corrected to 3, confirmed via pasted diff
- [ ] Track 2a: all listed functions ported, `systems.yaml` organized
      per ADR-006, 3 breeding-pair test cases + 3 claim-type test cases
      pasted with actual output
- [ ] Track 2b: `breed_shape` + `SHAPE_TARGETS` implemented, 3
      hand-computed-first test cases pasted with expected-vs-actual
      comparison, Diamond confirmed absent as a separate entry,
      Color/Shape cross-reference grep confirmed empty
- [ ] `studio_validate_game("slimeworld")` actual pasted output —
      expected to still fail only on missing `ui.yaml`
- [ ] `examples/slimeworld/` confirmed untouched — diff or file-list
      comparison, not just a claim
- [ ] `git status` pasted, confirming only the expected files changed

---

## §4 Quick Reference

| Item | Status going in | This phase |
|---|---|---|
| `data.yaml` starter count | 2 (stale) | 3 (corrected to match Rev 3 canon) |
| Color genetics, Claims, 9 action hooks | Verified working in TS | Ported to Lua (2a) |
| Shape breeding | Never executed anywhere | First implementation (2b) |
| Verification standard, 2a | Match known TS behavior | — |
| Verification standard, 2b | Hand-computed-first, then compare | Higher bar, no prior baseline |
| `ui.yaml` | Not in scope | Deferred to Phase 3 |
| `examples/slimeworld` vs `examples/slimegarden` relationship | Unresolved | Still deferred, doesn't block this phase |
| SlimeGarden vs SlimeWorld naming separation | Real, confirmed evolutionary relationship, name currently reused from an unrelated prior concept | Not addressed this phase — future rename candidate |
