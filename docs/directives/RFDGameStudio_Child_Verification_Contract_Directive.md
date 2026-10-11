# RFDGameStudio child verification and lifecycle contract

**Read first:** `AGENTS.md`, `studio/demos.py`, `tests/test_demos.py`, `tests/test_demos_registry_invariants.py`, `docs/children.json`, `docs/status.md`, `docs/state/StatusBoard.md`, and `ts/src/games/registry.ts`.

## 1. Why this exists

The studio can discover 38 children, but metadata currently records only id, path, label, and docs path. It does not distinguish in-repo games, external exhibits, tools, paused work, or retired origins; it does not store a verification contract; and status prose has drifted from the actual registry. Child propulsion needs explicit, deterministic metadata rather than inference from stale prose.

Verified 2026-10-11:

- All 38 child code paths exist.
- Four docs-only planned projects are intentionally outside the child list.
- The registry globs 36 configs and excludes only `brewfield` and `early_learning_buddy`; `docs/status.md` still says 32 entries.
- CorpWorld, KingMaker Squads, SlimeBreeder, and SlimeGarden remain registered ADR-023 origin exhibits despite prose saying they were removed.
- `uv run python -m studio.demos problems` reports missing-test/index gaps that should become explicit metadata or resolved findings.

## 2. Scope

1. Extend the generated child model and `docs/children.json` entries with:
   - `kind`: `in-repo | external | tool`
   - `lifecycle`: `active | shipped | paused | retired | blocked | unknown`
   - `verify`: the existing demo-scoped verification command, but only when it resolves to at least one real test file
   - `registered`: whether the config is included by the live registry contract
   - optional `superseded_by`
2. Derive values from existing config/status/source evidence through one deterministic function. Keep overrides in a small explicit mapping only where source evidence cannot express a deliberate exception.
3. Preserve the distinction between:
   - a child project,
   - a registered arcade entry,
   - an external origin exhibit,
   - a docs-only planned project.
4. Correct stale `docs/status.md` and generated Status Board language so registered origin exhibits are described as retired games preserved as exhibits, not removed registry entries.
5. Add tests enforcing metadata/path/docs/registry/verification consistency.

## 3. The work

- Extend `Demo` and `render_children_index()` without changing child ids or existing paths.
- Reuse `_test_files()`/`demo_check()` to emit `verify` only when a real test file is resolved; a fallback filter that can match nothing is not a verification contract.
- Add deterministic lifecycle/kind derivation with explicit tests for at least:
  - Shoal: shipped or active in-repo game
  - Character Viewer: tool
  - Early Learning Buddy: active but intentionally unregistered
  - Brewfield: retired and unregistered, superseded by Dissonance
  - CorpWorld: retired origin exhibit but registered
  - AntSim Redux: paused external entry
- Add a test that every child path and docs path exists and every child roadmap/direction block validates.
- Add a test that generated `children.json` is byte-stable.
- Keep docs-only planned ids in `DOCS_ONLY`; do not silently promote them to children.

## 4. What NOT to do

- Do not change game behavior, balance, art, registry inclusion, or publishing state.
- Do not retire or activate a project by inference where status is genuinely unknown.
- Do not make a fallback Vitest name filter count as verified when it resolves to no files.
- Do not rename `voiddrift`/`voidrift` projects in this directive.
- Do not delete external source exhibits.

## 5. Forbidden Actions

- No deployment, publishing, file deletion, force-push, history rewrite, or direct `main` edit.
- No changes outside RFDGameStudio.

## 6. Required from User

None. Unknown lifecycle values remain `unknown`; the directive must not invent product decisions.

## 7. Verification

```text
uv run python -m studio.demos index
uv run python -m studio.demos index
uv run python -m studio.demos problems
uv run pytest -q tests/test_demos.py tests/test_demos_registry_invariants.py
uv run pytest -q -m "not slow and not e2e"
cd ts && npx vitest run tests/test_arcade_registry_directive.ts
```

The two index runs must produce no diff. Report unresolved `problems` findings explicitly.

## 8. Rules for this run

- Work on the directive branch only.
- Use existing parsers and dependencies.
- Preserve generated-file ownership: modify generators, then regenerate outputs.
- If lifecycle evidence conflicts, record `unknown` and report the conflict.
- Do not merge.

## 9. Completion criteria

- [ ] Every child has deterministic `kind`, `lifecycle`, `registered`, and docs metadata.
- [ ] Every emitted `verify` command resolves to at least one real test file.
- [ ] Registered origin exhibits and unregistered active projects are represented correctly.
- [ ] Status prose no longer contradicts the live registry.
- [ ] Metadata, validation, registry, and byte-stability tests pass.
- [ ] Branch is committed and pushed for Review.

## 10. Report

Final schema; derivation and override rules; lifecycle counts; children without verification commands; corrected status claims; remaining unknowns; generator hashes; Python and TypeScript test results.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Draft |
| Assigned to | devin |
| Branch | - |
| Base branch | directive/rfdgamestudio-per-demo-direction-roadmap |

**Status log**
- 2026-10-11 · Repo Manager · created from verified child-readiness audit; waits for per-demo metadata PR #279
<!-- queue:end -->
