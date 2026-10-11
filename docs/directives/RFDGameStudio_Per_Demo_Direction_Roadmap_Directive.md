# RFDGameStudio per-demo direction and roadmap

**Read first:** `docs/superpowers/specs/2026-09-22-child-projects-design.md`, `AGENTS.md`, `studio/demos.py`, `docs/children.json`, `docs/DIRECTION.md`, `docs/ROADMAP.md`, and a few representative `docs/demos/<id>/DIRECTION.md` files (e.g. `shoal`, `dissonance`, `factory_idle`).

## 1. Why this exists

AgentFlow is gaining the ability to address each demo as `RFDGameStudio/<demo>` and to resolve per-child direction and roadmaps. Today the studio has 38 demos in `docs/children.json` and a prose `docs/demos/<id>/DIRECTION.md` for most of them, but none of those files contain a machine-readable `yaml direction` block and none have a `docs/demos/<id>/ROADMAP.md`. This directive fills that gap so the swarm can propel per-demo work.

## 2. Scope

1. `studio/demos.py`:
   - Add `docs_path: str | None` to the `Demo` dataclass.
   - Set `docs_path = f"docs/demos/{id}"` when that folder exists.
   - Update `render_children_index()` to emit `docs_path` in the JSON; deterministic, sorted, two-space indent.
2. Regenerate `docs/children.json`.
3. `tests/test_demos.py`:
   - Assert that demos with a `docs/demos/<id>/` folder have a non-null `docs_path`.
   - Assert that `render_children_index()` includes `docs_path` where present.
   - Keep the existing byte-stability test.
4. For every demo in `docs/children.json`:
   - If `docs/demos/<id>/DIRECTION.md` exists and has no `yaml direction` block, append one at the end preserving prose and line endings.
   - Create `docs/demos/<id>/ROADMAP.md` with a `yaml roadmap` block.
5. Derivation rules for the direction block:
   - `version: 1`
   - `answered`: "2026-10-11 robert" (only a human actor may answer; this directive drafts the block for Robert's approval/override).
   - `purpose`: one sentence from the first paragraph or verdict of the existing prose direction.
   - `done_when`: 1-3 bullets from the existing "Definition of done", "Replan", "First three directives", or "Next steps" sections.
   - `do_not`: from the existing "Do not do" list or risks.
   - `audience`: `players` (inherited from parent unless prose says otherwise).
   - `hours_per_week`: `1-3` (inherited from parent unless prose says otherwise).
   - `stakes`: `medium` (inherited from parent unless prose says otherwise).
6. Derivation rules for the roadmap block:
   - `status: draft` until Robert approves.
   - `milestones`: 1-3 items.
     - M0: current shippable state / keep-alive gate.
     - M1: next playable slice or Tier A close item from the prose direction.
     - M2 (optional): later item from "First three directives" or "Replan".
   - Each milestone has at least one exit entry (`file`, `test`, or `grep`) and at least one step.
   - Steps are `kind: docs|tests|refactor|fix` and `size: S|M` where derivable.

## 3. The work

- Run `uv run python -m studio.demos index` after modifying `studio/demos.py` to regenerate `docs/children.json`.
- Use the existing `direction.py` writer pattern from AgentFlow if available, or append the block by hand with `\n` line endings (RFDGameStudio files use LF).
- Preserve all existing prose in `DIRECTION.md`; only append a new fenced block.
- Do not guess purpose/done_when/do_not from code; derive only from the existing prose direction note. If a demo's prose is too thin to derive three fields, leave them empty in the block and note it in the report.

## 4. What NOT to do

- Do not change any game code, data, balance, or art.
- Do not edit `ts/src/games/registry.ts`, `ts/src/games/arcade-manifest.json`, or `ts/src/games/game-metadata.json`.
- Do not run builds, servers, deploys, or `npm run build:*`.
- Do not delete or retire any demo.
- Do not merge to `main`.

## 5. Verification

- `uv run pytest -q -m "not slow and not e2e"` passes with no fewer tests.
- `cd ts && npx vitest run` unchanged.
- `uv run python -m studio.demos index` regenerates `docs/children.json` with `docs_path` and a second run produces no diff.
- At least one demo (e.g. `shoal`) has a `yaml direction` block and a `yaml roadmap` block in `docs/demos/shoal/`.

## 6. Rules for this run

- Non-interactive; no confirmations, installs, fetches, or network calls.
- Standard library + repo dependencies only.
- Commit only to this directive branch.

## 7. Completion criteria

- [ ] `studio/demos.py` emits `docs_path` and `docs/children.json` is regenerated.
- [ ] `tests/test_demos.py` covers `docs_path`.
- [ ] Every demo in `docs/children.json` has a `yaml direction` block in its `docs/demos/<id>/DIRECTION.md`.
- [ ] Every demo in `docs/children.json` has a `docs/demos/<id>/ROADMAP.md` with a `yaml roadmap` block.
- [ ] Python and TS suites pass.
- [ ] Branch pushed.

## 8. Report

Demo count, how many direction blocks were appended vs. already present, how many roadmaps were created, the derivation rules used, and any demos whose prose was too thin to derive fields.
