# Shoal: Evolve foundation — shared core, separate sequel entry

**Read first:** `AGENTS.md`, `docs/demos/shoal/DIRECTION.md`, `docs/demos/shoal_evolve/DIRECTION.md`, `docs/demos/shoal_evolve/ROADMAP.md`, `ts/src/games/shoal/`, `ts/tests/test_shoal_headless.ts`, `studio/demos.py`, and `ts/src/games/registry.ts`.

## 1. Why this exists

Robert settled the product boundary on 2026-10-11: Shoal remains the ambient Aquarium, while **Shoal: Evolve** is a separately addressable sequel and arcade entry. They share the existing Shoal simulation core. The first playable slice must let a player steer one ordinary fish, compete with AI fish for algae, grow visibly by one stage, and receive a gentle setback when eaten—without changing the original Shoal experience.

This supersedes only the earlier "one page, two modes" delivery decision. It preserves the earlier gameplay intent and the "one engine" decision.

## 2. Scope

1. Register a new `shoal_evolve` child and arcade entry with its own:
   - `docs_path: docs/demos/shoal_evolve`
   - thin application/config entry
   - label **Shoal: Evolve**
   - local-storage namespace
2. Reuse `ts/src/games/shoal/simulation/shoalSimulation.ts` directly. Do not copy or fork it.
3. Add small sequel modules under `ts/src/games/shoal_evolve/` (or a comparably narrow sequel-owned folder):
   - `playerFishController.ts` — pointer/touch target in, steering force out; pure and deterministic.
   - `growthStages.ts` — cumulative-graze thresholds, one visible growth transition, and one-stage setback; pure data/functions. Do not use `Fish.fed` as durable progress because breeding resets it.
   - `modeState.ts` — selected fish id, cumulative feeding progress, stage, respawn/setback state, and rebinding after respawn; pure.
4. Extend `InputState` additively with an optional steering command shaped as `{ fishId, fx, fy }`. The sequel computes force; the simulation only applies it to the matching live fish before the existing movement clamps. `tickGame(dt, null)` and all uncontrolled fish must retain current behavior.
5. Use the public `createShoalSimulation().getState()` seam for `Fish.fed`, radius, speed, and alive state; do not add redundant fields to `RenderState` solely for sequel orchestration. Use public `tickGame`, not the exported test helper `tickGameInternal`, which currently ignores input.
6. Implement the first playable slice:
   - initialize the existing living reef,
   - select or assign one ordinary fish,
   - steer it with pointer/touch,
   - eat algae while AI fish compete for the same food,
   - cross one feeding threshold and visibly change size/speed,
   - when eaten, respawn with a one-stage setback rather than permanent death.
7. Keep the sequel UI thin. Existing Shoal `App.tsx` must not gain sequel-specific responsibilities.
8. Regenerate child metadata through `uv run python -m studio.demos index`; do not hand-edit generated JSON if the generator owns it.

## 3. Engineering constraints

- **SOLID / SoC:** player control, growth rules, mode state, UI wiring, and simulation orchestration remain separate.
- **KISS:** one growth transition only; no generic trait framework in this slice.
- **Safe shared core:** extract a new shared API only where the sequel proves a second use. Do not move or rename the whole simulation.
- **Behavior first:** tests assert outcomes and invariants, not source text.
- **Compatibility:** any modified shared simulation path must pass the original Shoal headless suite and the new sequel suite.
- **Reversibility:** keep commits small enough that registration, control seam, and growth slice can be reviewed independently.

## 4. What NOT to do

- Do not fork, duplicate, or rewrite `shoalSimulation.ts`.
- Do not change the original Shoal product into a mode selector.
- Do not add trait trees, cosmetic branching, glow/camouflage, multiplayer, leaderboards, accounts, cross-title progression, new habitats, whales/orcas, a camera rewrite, publishing, or deployment.
- Do not broadly refactor Shoal `App.tsx` or simulation internals.
- Do not change AI fish behavior except where required to preserve competition for the same algae.
- Do not add paid assets or external dependencies.

## 5. Forbidden Actions

- No deployment, publishing, force-push, history rewrite, or direct change to `main`.
- No deletion or retirement of Shoal or any existing game.
- No modification outside RFDGameStudio.

## 6. Required from User

None. Robert approved the shared-core/two-entry product boundary, ecological competition, and one-growth-stage first slice on 2026-10-11.

## 7. Verification

Add `ts/tests/test_shoal_evolve_foundation.ts` (or focused files with equivalent coverage) proving:

1. The sequel initializes and ticks the existing Shoal simulation contract.
2. A deterministic control target changes only the selected fish's steering.
3. Positive grazing deltas accumulate across the existing breeding reset and reach exactly one growth threshold.
4. Size/speed change at the threshold without NaN or negative state.
5. AI fish continue consuming algae and competing in the same simulation.
6. Predation applies a one-stage setback and respawn, not permanent death; sequel state rebinds to the newly spawned fish id.
7. A stale/dead steering id is a safe no-op.
8. Original Shoal remains unchanged under its existing headless scenarios.

Run:

```text
uv run python -m studio.demos index
uv run pytest -q -m "not slow and not e2e"
cd ts && npx vitest run tests/test_shoal_headless.ts tests/test_shoal_evolve_foundation.ts
cd ts && npx vitest run
cd ts && npm run build
```

If the known `test_dual_target_deploy.ts` race appears in the full Vitest run, rerun that file in isolation and report both outputs; do not silently dismiss new failures.

## 8. Rules for this run

- Work only on the directive branch/worktree; never edit the live checkout.
- Use existing dependencies and shared utilities.
- Preserve comments unless a changed line requires correction.
- Do not deploy or publish.
- Do not merge to `main`.
- If `RFDGameStudio_Per_Demo_Direction_Roadmap_Directive.md` is still unmerged, preserve its `docs_path` schema and rebase onto its Review branch or latest `main` before final verification; do not create a competing children schema.

## 9. Completion criteria

- [ ] `shoal_evolve` is a generated child with `docs_path: docs/demos/shoal_evolve`.
- [ ] Shoal: Evolve is a separate arcade entry over the existing simulation core.
- [ ] Player control, growth stages, and sequel mode state live in small dedicated modules.
- [ ] The first playable slice supports control, ecological competition, one growth stage, and predation setback.
- [ ] Original Shoal behavior and headless tests remain green.
- [ ] New behavior tests cover the shared-core seam and foundation slice.
- [ ] Python, targeted Vitest, full Vitest, and global TypeScript build results are reported.
- [ ] Branch is committed and pushed for Review.

## 10. Report

Files changed; module boundaries chosen; the exact shared-simulation seam added; child/registry metadata; targeted and full test counts; build result; original Shoal compatibility evidence; known baseline failures separated from new failures; and explicit follow-ups for traits/persistence that were not included.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Draft |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-11 · Repo Manager · created as Draft after Robert approved the product direction; implementation waits for this planning branch to land on main
<!-- queue:end -->
