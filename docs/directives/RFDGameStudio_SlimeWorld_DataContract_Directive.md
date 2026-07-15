# RFDGameStudio — SlimeWorld Port: Data Contract Genesis
*July 15 2026 (night) | Handoff target: Windsurf/Devin (RFDGameStudio's actual toolchain, NOT Google AI Studio) | First of a multi-phase port, data layer only*

---

> ⛔ **STOP:** This is Phase 1 of a real, multi-phase port — NOT a full
> game port in one directive. RFDGameStudio's own proven precedent
> (`horse_racing`, confirmed via direct source read: `data.yaml`'s
> header literally states "extracted from types.ts. Renderer-agnostic.
> TypeScript, Python, Rust all read this.") shows this exact migration —
> TypeScript source of truth → renderer-agnostic `data.yaml` — has
> already been done once successfully in this codebase. This directive
> repeats that proven process for SlimeGarden's `types.ts`, and ONLY
> that. It does not port breeding logic, claim mechanics, the Planet
> map, or any Lua/rendering work. Game name is `slimeworld` — confirmed
> distinct from the existing `slime_coin` game (a card/match game,
> unrelated, already live in `games/slime_coin/`) to avoid any naming
> confusion in the studio.

---

## §0 Context

**What RFDGameStudio actually requires, confirmed via `rfd-studio` tooling and direct source read:** every game is exactly 4 files — `data.yaml`, `logic.lua`, `systems.yaml`, `ui.yaml` — validated as a set via `studio_validate_game`. `systems.yaml` enforces a real architectural rule per ADR-006: every function declared in `logic.lua` must appear in exactly one system's `functions` list in `systems.yaml`. This is not a loose convention — `studio_validate_game` checks it.

**The proven precedent, confirmed by direct read of `horse_racing`:** `data.yaml`'s schema (stable config, horse fields including a `colors` block currently stored as flat `hex` strings) was extracted from an earlier TypeScript source. SlimeGarden IS that earlier TypeScript source for a NEW game in this pattern — `slimeworld`. This directive does the equivalent extraction: SlimeGarden's `types.ts` → a new `games/slimeworld/data.yaml`.

**A real, confirmed schema gap to resolve, not gloss over:** `horse_racing`'s color fields are flat `hex` strings (`body: hex`, `mane: hex`, etc.) — a simpler, already-resolved color representation. SlimeGarden's shipped genetics use continuous `hue: number` (0-360) + `saturation: number` (0-100) — NOT hex. This directive must decide and document which representation `slimeworld`'s `data.yaml` schema uses for slime color: continuous hue/saturation (more faithful to what was actually built and verified tonight) or converted-to-hex (matching `horse_racing`'s existing convention, simpler for a first Lua renderer to consume). Recommendation: keep hue/saturation as the stored schema (it's the real genetic data), and let the Lua/rendering layer (a LATER phase, not this directive) compute hex for display — do not lossy-convert the source data down to hex at the schema level.

**What this directive delivers:** `games/slimeworld/data.yaml` only. A complete, faithful, renderer-agnostic YAML extraction of SlimeGarden's real data shapes — `Slime` (including `hue`, `saturation`, `vertexCount`, `irregularity` fields, even though Shape's breeding logic isn't wired yet in the TS source — the SCHEMA exists and should port), `PlanetNode`, the 6 culture/faction definitions, `COLOR_TARGETS` (the 17 Color Codex entries), and core config values (roster caps, starting resources) — matching `horse_racing`'s `data.yaml` structure and comment conventions exactly.

**What is NOT in scope, explicitly, for this directive:**
- `logic.lua` — no breeding math, no claim resolution, no simulation logic ported yet. That's Phase 2, a separate directive, after this data contract is validated.
- `systems.yaml` — cannot be written correctly until `logic.lua`'s real function list exists (Phase 2 dependency).
- `ui.yaml` — cannot be written correctly until the actual gameplay loop is proven in Lua (Phase 3+ dependency, per the exact sequencing problem RFDGameStudio hit today with `horse_racing`'s own UI layer being built before its Lua logic stabilized — do not repeat that mistake here).
- Any rendering code (PyGame, SVG, or otherwise)
- Porting `breedColors`/`breedSlimes`/the Claim Mechanic's actual algorithms — those get translated to Lua in Phase 2, not defined here
- The Shape genetics breeding math specifically — confirmed incomplete in the TS source itself (API quota interruption mid-build, `breedShape` and `SHAPE_TARGETS` never landed) — port the SCHEMA fields (`vertexCount`, `irregularity` exist on `Slime`) but do not invent breeding logic that doesn't exist yet in the source to port from

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `games/slimeworld/data.yaml` | Create | Full data-layer extraction from SlimeGarden's `types.ts`, following `horse_racing/data.yaml`'s structure/comment conventions exactly |

**Read-only reference sources (SlimeGarden TypeScript project, NOT part of RFDGameStudio, read for extraction only):**
`types.ts` (the real source of truth for this directive), `gameLogic.ts` (read to confirm real default values, e.g. `COLOR_TARGETS`'s actual center-Hue/tolerance numbers, `COLOR_SPECS`'s real base stats per culture — do not invent numbers, extract the real ones).

**Read-only within RFDGameStudio — do not touch:**
Any existing game's files (`horse_racing`, `slime_coin`, or any other), `engine/`, `renderers/`, `studio/`, `studio_mcp/` — this directive creates exactly one new file in a new `games/slimeworld/` directory and touches nothing else in the studio.

If a bug or inconsistency is found in SlimeGarden's TypeScript source during extraction (e.g., the Shape system's incomplete state), report it — do not silently invent missing logic to fill the gap.

---

## §2 Implementation

### §2.0 Pre-read

1. Read `horse_racing/data.yaml` in FULL (not just the header already reviewed) — confirm its complete structure, comment style, and section organization to match exactly.
2. Read SlimeGarden's `types.ts` in full — this is the real source of truth for `slimeworld/data.yaml`'s schema.
3. Read SlimeGarden's `gameLogic.ts` for the real constant values: `COLOR_SPECS` (6 cultures' real base stats and RGB values), `COLOR_TARGETS` (all 17 real Color Codex entries with their actual `centerHues`/`tolerance`/`saturationMin`/`saturationMax` values, already verified correct in a prior session), `WHEEL_ORDER`, `BASE_K` and other real tuned constants from the Color genetics rewrite.
4. Confirm `studio_validate_game`'s exact requirements (already partially known: 4 files, YAML parses, Lua loads, declared functions present, `layout_tree` declared in `ui.yaml`) — since only `data.yaml` is being created in this phase, confirm whether `studio_validate_game` can be meaningfully run against a game with only 1 of 4 files present, or whether validation is deferred until Phase 2/3 land. Report the finding — do not assume.

Report before implementing: confirmed `horse_racing/data.yaml`'s full structure, confirmed real extracted values (not invented) for `COLOR_SPECS`/`COLOR_TARGETS`/`WHEEL_ORDER`/`BASE_K`, confirmed whether partial-file validation is possible.

---

### §2.1 Extract the data contract

Structure `games/slimeworld/data.yaml` to mirror `horse_racing/data.yaml`'s conventions:

```yaml
# RFDGameStudio — SlimeWorld
# Data Layer — extracted from SlimeGarden's types.ts (July 2026 build)
# Renderer-agnostic. TypeScript, Python, Rust all read this.

game:
  id: slimeworld
  name: SlimeWorld
  version: "0.1"
  studio: RFDGameStudio

# --- LAB / ROSTER ---
lab:
  starting_roster_cap: [real value from types.ts/gameLogic.ts, do not guess]
  # ... starting_credits, breeding cooldowns, etc — extract real values

# --- SLIME SCHEMA ---
slime:
  fields:
    id: string
    name: string
    color: string  # legacy discrete SlimeColor, kept for backward reference per faction-snap logic
    hue: {min: 0, max: 360, description: "Continuous genetic hue angle"}
    saturation: {min: 0, max: 100, description: "Genetic color purity"}
    vertexCount: {min: 3, max: 22, description: "Shape genetics — schema only, breeding logic not yet ported (source incomplete)"}
    irregularity: {min: 0, max: 100, description: "Shape genetics — schema only, breeding logic not yet ported (source incomplete)"}
    pattern: [Solid, Stripe, Polka, Glow, Crown, Ringed, Nebula, Obsidian]
    level: integer
    generation: integer
    # ... rest of real fields from types.ts

# --- SIX CULTURES ---
cultures:
  # real extracted values from COLOR_SPECS — 6 entries, real base stats, real hue anchors
  ember: {hue: 0, base_stats: {...}}
  marsh: {hue: 60, base_stats: {...}}
  # ... etc, all 6, real values

# --- COLOR CODEX TARGETS ---
color_targets:
  # all 17 real entries from COLOR_TARGETS, extracted exactly, not re-derived
  - {id: guild_ember_marsh, tier: guild, name: Thornward, center_hues: [30], tolerance: 15, saturation_min: 65, saturation_max: 100}
  # ... all 17

# --- PLANET NODE SCHEMA ---
planet_node:
  fields:
    id: string
    name: string
    owner_color: [Ember, Marsh, Gale, Tundra, Crystal, Tide, Gray, null]
    strength: {min: 0, max: 1}
    is_capitol: boolean
    discovered: boolean
    # ... rest of real fields
```

> ⚠️ RULE: Every numeric constant in this file must be a REAL value extracted from `gameLogic.ts`, not invented or approximated. Where a value genuinely doesn't exist yet in the TS source (Shape breeding constants, since that system never finished building), mark the field with a comment noting it's schema-only, per the illustrative example above — do not invent a plausible-looking number to fill the gap.

> ⚠️ RULE: Do not port the Ring 1 "splotch map" generation logic, the capital re-centering correction, or the three-act onboarding state machine in this directive — none of that exists as real TypeScript code yet (all still design-only per Design.md Rev 3), so there is nothing to extract. This directive extracts what's REAL and BUILT, not what's designed.

---

## §3 Verification

- [ ] `games/slimeworld/data.yaml` created, follows `horse_racing/data.yaml`'s exact structural conventions
- [ ] Every numeric/constant value traced back to a real line in SlimeGarden's `gameLogic.ts`/`types.ts` — report the source line for the 17 Color Codex entries and the 6 culture base-stat blocks specifically, as a spot-check
- [ ] Shape genetics fields present in schema, explicitly marked as schema-only/incomplete, not fabricated with invented breeding logic
- [ ] Confirm zero other files in RFDGameStudio touched — `git diff` shows only the new `games/slimeworld/` directory with one file
- [ ] Report whether `studio_validate_game('slimeworld')` can run meaningfully against this single-file state, or whether it correctly reports missing `logic.lua`/`systems.yaml`/`ui.yaml` as expected/acceptable at this phase

---

## §4 Completion Criteria

- [ ] `games/slimeworld/data.yaml` exists, complete, real-values-only
- [ ] Structure matches `horse_racing/data.yaml` conventions
- [ ] All 17 Color Codex targets present and verified against source
- [ ] All 6 cultures' real base stats present and verified against source
- [ ] Shape schema fields present, honestly marked incomplete
- [ ] Zero other RFDGameStudio files touched
- [ ] Zero Lua, systems manifest, or UI work attempted in this directive

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| Game ID | `slimeworld` — distinct from existing `slime_coin` |
| This phase | Data contract only — `data.yaml`, nothing else |
| Proven precedent | `horse_racing/data.yaml` — same TS-source-of-truth extraction pattern, already done once in this codebase |
| Real architectural rule | ADR-006: every `logic.lua` function must appear in exactly one `systems.yaml` system — relevant for Phase 2, not this one |
| Color schema decision | Keep hue/saturation as stored genetic data — do not lossy-convert to hex at the schema level |
| Shape genetics | Schema fields ported; breeding LOGIC not ported — doesn't exist yet in the TS source to extract from |
| Not in scope | Lua, systems.yaml, ui.yaml, any rendering, any design-only (not-yet-coded) mechanics from Rev 3 |
| Next phase | `logic.lua` translation of real, shipped algorithms (Color breeding, Claim Mechanic) — separate directive, after this data contract is verified |

---

*RFDGameStudio — SlimeWorld Genesis | RFD IT Services Ltd. | July 15 2026 (night)*
*horse_racing proved this pattern works. This directive runs it again, honestly — porting what's real, marking what isn't.*
