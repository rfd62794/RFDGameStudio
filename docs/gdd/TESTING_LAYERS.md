# RFDGameStudio Testing Layer Framework

*Formalized August 2026. This document describes the real, current
testing infrastructure — what exists today, what each layer covers, and
what is deliberately deferred.*

---

## Overview

The test suite is organized into five conceptual layers, from fast unit
checks to live deploy verification. Not all layers have equal depth
today — some are mature, others are deliberately narrow. This document
is the canonical reference for what's real.

---

## L1 — Data & Bridge Invariants

**Status: Real, mature.**

Unit tests that verify Lua game logic returns correct values through
the TS runtime bridge. These are the backbone of the test suite: fast,
deterministic, no browser required.

| Aspect | Detail |
|---|---|
| Runtime | Vitest (TS), pytest (Python) |
| Count | ~313 TS tests, ~562 Python tests |
| Location | `ts/tests/test_*.{ts,tsx}`, `tests/test_*.py` |
| Speed | Full suite: ~18s (TS), ~30s (Python) |
| What they prove | Lua function return values, TS type conversions, camelCase/snake_case bridge mapping, game state invariants |

**Shared fixtures** (formalized in `ts/tests/_shared/`):
- `createStarter(session, color, id, name)` — creates a valid starter slime via Lua
- `createStarterPair(session, color)` — creates a matched pair for breeding tests
- `expectBridgeField(obj, field, expected)` — asserts Lua-to-TS bridge field values

---

## L2 — Component Wiring

**Status: Real, mature.**

React component tests using jsdom. Verify that components render
correctly, respond to user interactions, and wire up to the right
state/callbacks.

| Aspect | Detail |
|---|---|
| Runtime | Vitest + jsdom |
| Location | `ts/tests/test_*.tsx` (component-focused files) |
| What they prove | Component rendering, button wiring, tab visibility, shared UI compliance |

**Shared fixture**: `renderComponent(element)` — the formalized version
of the inline `render()` helper previously duplicated across 4+ test files.
Returns `{ container, root }` for querySelector-based assertions.

---

## L3 — Headless Playthrough Smoke Tests (E2E)

**Status: Real, deliberately narrow (2 games).**

Full-flow E2E tests using Playwright against the real Vite dev server.
These launch a headless Chromium browser, navigate through the actual
game UI, and assert on real DOM state.

| Aspect | Detail |
|---|---|
| Runtime | pytest + Playwright (sync API) |
| Location | `tests/e2e/` |
| Markers | `e2e` + `slow` (always both) |
| Speed | ~30-60s per test (real browser + dev server startup) |

### Current E2E coverage

| Test | Game | Flow |
|---|---|---|
| `test_slimeworld_first_breed_to_missions_unlock` | SlimeWorld | Begin -> SPLICING tab -> pick two starters -> Hatch -> verify MISSIONS/ECONOMY tabs appear |
| `test_dissonance_new_run_to_map` | Dissonance | Title -> New Run -> Opening Pack (flip all) -> Continue -> Map phase visible |

### Why exactly these two games

**SlimeWorld** was chosen because it has the real, already-validated
first-breed-to-region-unlock flow — the E2E test formalizes what was
previously an ad-hoc Playwright check.

**Dissonance Depths** was chosen as the second game because its core
loop is **structurally different** from SlimeWorld:
- SlimeWorld: persistent tab-based management sim with breed-and-unlock
  progression (state persists across sessions)
- Dissonance: phase-based card combat roguelike with linear phase
  transitions (title -> opening -> deck build -> map -> combat -> reward)

This proves the E2E pattern generalizes across genuinely different game
architectures, not just copy-pasted onto something structurally identical.

### `data-testid` attributes added (complete list)

**SlimeWorld:**
- `sw-tab-{id}` — primary tab bar buttons (roster, missions, economy, lab)
- `sw-roster-sub-{id}` — roster sub-tab buttons (collection, breeding, slimedex)
- `sw-breed-candidate-{slimeId}` — idle candidate slimes in breeding pool
- `sw-hatch-btn` — the "Hatch Spliced Specimen" button

**Dissonance:**
- No new `data-testid` attributes added. Dissonance components already
  had sufficient `id` props on key elements (`new-run`, `opening-flip-next-btn`,
  `opening-continue-btn`, `viewport-map-phase`, `map-enter-node-btn`).
  One fix was made: the `TitleScreen` shared component now forwards the
  menu item `id` to the underlying `Button` component's `id` prop, which
  it previously discarded.

### Running E2E tests

```bash
# Run all E2E tests
pytest -m e2e -v

# Run only SlimeWorld E2E
pytest -m "slimeworld and e2e" -v

# Exclude E2E from a scoped game run (default behavior)
python scripts/test_scope.py slimeworld

# Include E2E in a scoped game run
python scripts/test_scope.py slimeworld --include-e2e
```

### Deliberately deferred

- **Blanket `data-testid` coverage across all games.** The current
  two-game validation (SlimeWorld + Dissonance) proves the pattern
  works. Extending to all games is real, larger, ongoing infrastructure
  cost that hasn't been earned yet by evidence beyond these two cases.
  See the recommendation section below for the honest assessment.

- **CI pipeline wiring.** The `e2e` + `slow` marker taxonomy makes a
  future CI setup straightforward (`pytest -m "not slow"` for fast
  checks, `pytest -m e2e` for a scheduled or pre-deploy E2E gate), but
  the actual CI configuration is separate, real, future work.

---

## L4 — Standalone Build Integrity

**Status: Real, proven on all 7 standalone games. Not modified by this directive.**

Rebuilds every standalone game from source, verifies `dist-{gameId}`
contains all required runtime files, and runs a headless browser smoke
check for console warnings.

| Aspect | Detail |
|---|---|
| Location | `tests/test_standalone_build_integrity.py` |
| Markers | `slow` |
| What it proves | Vite builds succeed, all Lua/YAML files are bundled, no standaloneLoader warnings at runtime |
| Includes | A deliberate regression test (broken entry -> restore -> verify) |

---

## L5 — Deploy Verification

**Status: Real. Not modified by this directive.**

`studio_mcp/verify.py`'s Tier-1 (HTTP reachability) and Tier-2 (content
validation) checks, used successfully for real SlimeWorld and website
deploys.

| Aspect | Detail |
|---|---|
| Location | `studio_mcp/verify.py`, `tests/test_verify.py` |
| What it proves | Deployed assets are HTTP-reachable, correct content, no 404s |

---

## Marker Taxonomy

| Marker | Meaning | Deselect with |
|---|---|---|
| `slow` | Tests that take >5s (builds, browser launches) | `-m "not slow"` |
| `e2e` | L3 headless playthrough tests (always also `slow`) | `-m "not e2e"` |
| `shared` | Engine/tooling tests, always included in scoped runs | — |
| `{game}` | Game-specific marker (e.g., `slimeworld`, `dissonance`) | `-m "not {game}"` |

E2E tests in `tests/e2e/` are automatically marked with both `e2e` and
`slow`, plus the appropriate game marker (derived from filename). This
is handled by `conftest.py`'s `pytest_collection_modifyitems` hook.

---

## Honest Recommendation: Should `data-testid` Roll Out Broadly?

Based on the two-game validation:

**The pattern works.** Both SlimeWorld and Dissonance E2E tests are
straightforward to write, reliable (deterministic Lua-driven state
transitions), and catch real UI-level regressions that L1/L2 tests
cannot (tab visibility gating, phase transitions, button enable/disable
state).

**But the maintenance cost is real.** Each game that gets E2E coverage
needs:
1. Specific `data-testid` or `id` hooks on the exact elements the test
   interacts with
2. A Playwright test that understands the game's specific flow
3. Ongoing maintenance when the game's UI changes

**Recommendation:** Extend E2E coverage incrementally, game by game,
as each game has a real, validated flow worth protecting — not as a
blanket rollout. The next natural candidate would be a game undergoing
active UI changes where a regression is most likely. Canvas-heavy games
(Shoal, SlimeCoin, SlitherRogue) are poor candidates for DOM-based E2E;
they would need screenshot comparison or custom assertions, which is a
different pattern.
