# Test Suite Classification — Python + TypeScript

*August 2026 | Motivated by a real incident: running the TypeScript suite
from the wrong working directory silently produced a smaller, plausible
result (49 tests, 8 failures) instead of the real one (251 tests, all
passing) — no error, just a quietly wrong answer. This doc is the full,
real audit of every test file in both stacks, each assigned exactly one
bucket (a specific game, or `shared`), with every ambiguous case reasoned
through explicitly rather than guessed.*

**The governing principle (per this project's own ADR-005 revision on
shared Lua modules):** a change to something shared has to invalidate
every real dependent; a change isolated to one game only needs to
re-verify that game. `scripts/test_scope.py` never runs a game's tests in
isolation from `shared` — always `game or shared`, never `game` alone.

---

## Real pre-flight floor confirmed this session

- Python (from repo root): **553 passed**
- TypeScript (from `ts/`): **251 passed**

---

## Part 1 — Python (`tests/*.py`)

39 real test files (excluding `__init__.py`). Tooling: `conftest.py`
(repo root, new) auto-marks every collected test via
`pytest_collection_modifyitems`, keyed off filename. Markers registered in
`pyproject.toml`'s existing `[tool.pytest.ini_options]` block (see
deviation note below — a fresh `pytest.ini` was NOT created).

### Game-specific files (prefix-matched)

| File | Bucket |
|---|---|
| `test_brewfield.py` | `brewfield` |
| `test_chimera_wilds.py` | `chimera_wilds` |
| `test_dissonance_anchors.py` | `dissonance` |
| `test_dissonance_run_state.py` | `dissonance` |
| `test_scrapcrawl.py` | `scrapcrawl` |
| `test_shoal.py` | `shoal` |
| `test_slither_rogue.py` | `slither_rogue` |
| `test_slimeworld.py` | `slimeworld` |
| `test_slimeworld_breeding_cost.py` | `slimeworld` |
| `test_slimeworld_color_codex.py` | `slimeworld` |
| `test_slimeworld_dispatch_resolution.py` | `slimeworld` |
| `test_slimeworld_exploration_resolution.py` | `slimeworld` |
| `test_slimeworld_file_split.py` | `slimeworld` |
| `test_slimeworld_mediation_resolution.py` | `slimeworld` |
| `test_slimeworld_petition_spawning.py` | `slimeworld` |
| `test_slimeworld_shape_codex.py` | `slimeworld` |
| `test_slimeworld_shape_naming.py` | `slimeworld` |
| `test_slimeworld_stats.py` | `slimeworld` |
| `test_slimeworld_stray_default_role.py` | `slimeworld` |
| `test_slimeworld_tier_economics.py` | `slimeworld` |
| `test_slimeworld_wanderer_petitions.py` | `slimeworld` |
| `test_slimeworld_worker_income_cycle.py` | `slimeworld` |

### Shared files (exact filename match)

| File | Reasoning |
|---|---|
| `test_executor.py` | Tests `studio.executor` directly against `tests/fixtures/`, never real games |
| `test_loader.py` | Tests `studio.loader`/`studio.validator` against `tests/fixtures/`, never real games |
| `test_runtime.py` | Tests the `studio.runtime` public API against `tests/fixtures/`, never real games |
| `test_shared_lua_primitives.py` | **The literal ADR-005 pattern** — tests `engine/primitives/*.lua` and verifies real pinned consumers (`horse_racing`, `slime_coin`, `slither_rogue` logic files) |
| `test_multi_return_detector.py` | Tests `tools/detect_multi_return/scan_lua.py`, a studio-wide static analysis tool |
| `test_intake.py` | `studio_mcp.intake` pipeline, game-agnostic |
| `test_scaffold.py` | `studio_mcp.scaffold` (ADR-012), game-agnostic |
| `test_studio_promote.py` | `studio_mcp.tools` promote-to-examples + registry generation, game-agnostic |
| `test_verify.py` | `studio_mcp.verify` deploy-verification pipeline (Playwright), game-agnostic |
| `test_ui_interpreter.py` | Generic `ui.yaml` interpreter (`renderers/pygame/shared/ui_interpreter.py`) |
| `test_ui_manager.py` | `pygame_gui` `UIManager` wrapper, generic |
| `test_ui_reconciler.py` | Generic `UIReconciler` change-tracking pattern |
| `test_ui_resolver.py` | Generic layout resolver (`engine/ui/resolver.py`) |

### Ambiguous cases — reasoned explicitly, not guessed

| File | Bucket chosen | Why it's ambiguous |
|---|---|---|
| `test_studio_mcp.py` | `shared` | Every test uses `studio_load_game("horse_racing")` as its example fixture, but the tests exercise the generic MCP tool layer (`studio_call`, `studio_get_schema`, `studio_run_headless`, etc.) — not horse_racing's own game logic. Same pattern as picking one example game to drive a generic-tool test. |
| `test_pygame_renderer.py` | `shared` | Every test instantiates `PyGameEngine('horse_racing', ...)`, but asserts on the generic engine (`session`, `bounds`, layout proportions) — horse_racing is the fixture, not the subject. |
| `test_generic_renderer.py` | `shared` | Mostly genuinely shared (`RenderAdapter`, `PyGameRenderer`, `LayerCompositor`, `FontManager`, `SpriteLoader`) — but it also directly imports and tests `renderers.pygame.games.horse_racing.lua_to_entities.state_to_layers`, which **is** horse_racing-specific business logic embedded in the same file. Classified `shared` because that's the dominant content and the file's own name, but flagged here since a horse_racing-only test run would silently miss this file's horse_racing-specific coverage (horse_racing has no dedicated marker at all — see note below). |
| `test_integration.py` | `shared` | Genuinely multi-game in one file: `test_horse_racing_*`, `test_slither_rogue_*`, `test_mbb_*` (mutant_battle_ball), `test_slime_coin_*`. Since one marker applies per-file, and no single game owns it, `shared` is the only bucket that doesn't misrepresent it as belonging to one game it doesn't exclusively cover. |

### Real gap, not silently fixed: three games have no marker at all

`horse_racing`, `mutant_battle_ball`, and `slime_coin` exist in `games/`
but have **no test file exclusively theirs** — their only coverage lives
inside the multi-game shared-bucketed files above (`test_integration.py`,
`test_studio_mcp.py`, `test_pygame_renderer.py`,
`test_shared_lua_primitives.py`, `test_generic_renderer.py`). Running
`scripts/test_scope.py horse_racing` today only runs the `shared` suite
(harmless — nothing is skipped that would otherwise run — but it means
there's no way to run horse_racing's coverage *in isolation* the way
`slimeworld` or `brewfield` can be). Flagged for a future session rather
than inventing per-game files that don't exist.

---

## Part 2 — TypeScript (`ts/tests/*.{ts,tsx}`)

**Correction to directive's stated context:** `ts/vite.config.ts` *does*
already contain a `test:` block (`globals: true, environment: 'jsdom',
include: ['tests/**/*.{ts,tsx}', ...]`) that fully configures Vitest —
there's no separate `vitest.config.ts` file, but Vitest config is not
actually missing; it just lives inside `vite.config.ts` as is standard
practice. The `.bak` file (`test_slimeworld_tab_extraction.tsx.bak`) is
correctly excluded by this include glob already (doesn't match `.tsx`).

41 real test files (42 found, minus the `.bak`). **No conftest-equivalent
tooling was built for TypeScript this session** — per directive scope,
this side was investigation-only (`--changed`), not new marker
infrastructure. Real, complete classification below for future reference.

### SlimeWorld-specific

`test_slime_stage.tsx`, `test_dispatch_resolution.tsx`,
`test_mediation_launch.tsx`, `test_mission_serialization.tsx`,
`test_starter_slime_stats.tsx`, `test_slime_visual_geometry.tsx`,
`test_splicing_and_dex.tsx`, `test_lua_slime_field_safety.tsx`,
`test_slimeworld_codex_wiring.tsx`, `test_slimeworld_labtab.tsx`,
`test_slimeworld_petition_wiring.tsx`, `test_slimeworld_planet_region.tsx`,
`test_slimeworld_tab_extraction.tsx`

**Real, confirmed naming inconsistency:** unlike Python's clean
`test_slimeworld*` prefix convention, only 5 of these 13 files actually
start with `test_slimeworld`; the other 8 are named descriptively
(`test_slime_stage.tsx`, `test_dispatch_resolution.tsx`, etc.) with no
shared prefix. **A simple filename-prefix rule (the Python approach)
would NOT work for TypeScript** — any future TS scoping tool needs an
explicit per-file allowlist, not a prefix match.

### Brewfield-specific
`test_brewfield_shared_ui.tsx`

### Dissonance-specific
`test_dissonance_shared_ui.tsx` — dissonance's actual UI components (`TitlePhase`, `RewardPhase`).

`test_dissonance_recovery_manifest.ts` — **ambiguous, resolved as
dissonance-specific**: uses the shared `tools/framework_gen/audit` +
`manifest_report` tooling, but its assertions are about dissonance's own
real, completed migration (`games/dissonance/data.yaml`, its real Lua
source) — a per-game *application* of a shared tool, not a test of the
tool itself.

### Shared / engine / tooling

| File | Reasoning |
|---|---|
| `test_arcade.ts` | Multi-game (chimera_wilds, scrapcrawl, brewfield) exercising `GameSelector`/routing — no single owner |
| `test_arcade_loader.ts` | `GameLoader` shell, mocked engine |
| `test_arcade_registry_directive.ts` | `GAME_REGISTRY` structure itself |
| `test_arcade_routing.ts` | `arcade/routing`, generic |
| `test_button.tsx` | `src/ui/components` shared `Button` |
| `test_executor.ts` | `src/engine/executor` (`LuaExecutor`) |
| `test_framework_gen_classify.ts` | `tools/framework_gen/classify` |
| `test_gameshell.tsx` | Shared `GameShell` component + routing |
| `test_generate_standalone_entry.ts` | Multi-game (`shoal`, `brewfield`) build-tool test |
| `test_interpreter.ts` | `engine/ui_interpreter` + `engine/ui_resolver` |
| `test_lifecycle_detector.ts` | `tools/framework_gen/lifecycle_detector` — uses `games/slimeworld` as its one real example, but tests the generic detector tool, not SlimeWorld gameplay |
| `test_loader.ts` | `src/engine/loader`, mocks `brewfield` fixtures only as mock data |
| `test_more_games_by_me.tsx` | Shared `MoreGamesByMe` UI component |
| `test_multi_return_bridge.ts` | `LuaExecutor`, scans across ALL real games' `.lua` files |
| `test_multi_return_proof.ts` | `LuaExecutor` stack arithmetic, game-agnostic |
| `test_per_game_builds.ts` | Checks `dist-<game>` output across multiple games |
| `test_phase2_shared_ui.ts` | Shared UI source audit |
| `test_recovery_manifest.ts` | **Ambiguous, resolved as shared** (unlike the dissonance equivalent): audits `intake/slimegarden/extracted/src/gameLogic.ts` using the shared `framework_gen` tooling, but `slimegarden` has no real `games/slimegarden/` Lua backend (it's a stub/external-embed entry in the arcade, not a completed engine migration) — this is a generic tool test using one real intake example, not a completed per-game integration the way dissonance is |
| `test_runtime.ts` | `src/engine/runtime`, mocks `horse_racing` fixtures only as mock data |
| `test_shared.ts` | Literally named `shared`; tests the hooks module |
| `test_shared_data_layer.tsx` | `getStaticList` on `src/engine/runtime` — uses `slimeworld` only as its loaded fixture to exercise a generic runtime capability |
| `test_standalone_factory.ts` | `vite.standalone.factory`, build tooling |
| `test_ui_audit_report.ts` | Docs audit (`docs/analysis/ui-component-audit.md`) |
| `test_ui_resolver.ts` | `src/engine/ui_resolver`, pure math |
| `test_ui_shared_templates.tsx` | Shared `TitleScreen`/`EndStateScreen`/`ProgressIndicator` |

---

## Part 3 — `vitest --changed` investigation (real installed version: 2.1.9)

Confirmed real syntax from Vitest's own current docs: `--changed` (no
value) diffs uncommitted changes (staged + unstaged); `--changed HEAD~1`,
a commit hash, or a branch name are also accepted. It builds a real
reverse dependency graph and only re-runs tests whose import graph
actually touches the changed file(s) — exactly the intended behavior.

**Live demonstration performed, real output:** made a trivial, reversible
one-line comment addition to `ts/src/games/slimeworld/types.ts` (a file
imported by essentially every SlimeWorld test), then ran:

```
npx vitest run --changed
```

**Result: it does NOT work cleanly for this project's structure.** It
fails during dependency-graph construction with:

```
Error: Failed to parse source for import analysis because the content
contains invalid JS syntax. ... 63 |  end ...
```

**Root cause, confirmed via source read:** `ts/src/engine/loader.ts` uses
`import.meta.glob('../../../games/**/*.lua', { query: '?raw', import:
'default', eager: true })` to load every game's Lua source as raw text.
Vitest's `--changed` dependency-graph builder attempts to statically parse
every module reachable through that glob — including the raw `.lua` files
themselves — as JavaScript, and fails on real Lua syntax (`end`, etc.).
This is a genuine structural mismatch between `--changed`'s analysis
pathway and this project's `import.meta.glob(..., { query: '?raw' })`
pattern for loading non-JS game logic; it is not a flag-syntax mistake and
not something a quick config tweak fixes. The demo edit was reverted
immediately after (`git status --porcelain` confirmed clean).

**Fallback, demonstrated working:** Vitest's positional CLI argument
already does substring/filename filtering against the configured
`include` glob, with none of `--changed`'s dependency-graph analysis:

```
npx vitest run test_slime_stage
```
```
✓ tests/test_slime_stage.tsx (7 tests) 17ms
Test Files  1 passed (1)
     Tests  7 passed (7)
```

This works today, requires no new tooling, and — combined with the real
per-file classification table above — is the practical fallback: for a
SlimeWorld-focused session, run
`npx vitest run test_slime test_dispatch test_mediation test_mission test_starter test_splicing test_lua_slime test_slimeworld`
(the real, current file list from the SlimeWorld-specific section above),
not a single prefix. A future session building real TS tooling around
this should use an explicit per-file allowlist (mirroring
`SHARED_TEST_FILES` in `conftest.py`), not a prefix rule — the naming
inconsistency documented above makes a prefix rule silently wrong.

---

## Deviations from the directive's literal file scope, and why

- **No `pytest.ini` was created.** The project already has
  `[tool.pytest.ini_options]` in `pyproject.toml` with a real, in-use
  `slow` marker (`test_verify.py`) and `testpaths = ["tests"]`. Pytest
  treats `pytest.ini` as higher-priority than `pyproject.toml` when both
  exist — creating one would have silently discarded the existing config
  rather than extending it. Markers were added to the existing
  `pyproject.toml` section instead.
- **`scripts/test_scope.py` invokes `[sys.executable, "-m", "pytest"]`,
  not a bare `"pytest"` string.** A bare `"pytest"` resolves via `PATH`,
  which on this machine pointed to a *different* Python installation
  (3.12, missing `playwright`) than the one running this script (3.14) —
  this was caught live during the required two-game verification (see
  below) and is the exact "wrong environment, silently different result"
  failure mode this whole directive exists to prevent.

---

## Verified working — real terminal output, two different games

**`python scripts/test_scope.py brewfield`:** `210 passed, 343 deselected`
(confirmed as 17 brewfield-only + 193 shared, verified by running each
marker in isolation and summing).

**`python scripts/test_scope.py slimeworld`:** `325 passed, 228 deselected`
(confirmed as 132 slimeworld-only + 193 shared, same verification method).

**Full unfiltered `pytest` (repo root, no marker filter):** `553 passed` —
unchanged from the pre-flight floor. Classification is purely additive.
