# RFDGameStudio — Play Loop P1 Directive: Live apply for tuning knobs

*November 2026 | Read fully before executing anything.*

**Read first:** `ts/src/engine/tuning/store.ts`, `ts/src/engine/tuning/types.ts`, `ts/src/components/TuningPanel.tsx`, `ts/tests/test_tuning_panel.tsx` (for how the panel is rendered under `?dev=1` in jsdom), `ts/src/games/scrapcrawl/knobs.ts`, `ts/src/games/scrapcrawl/utils/runEnd.ts`, `docs/superpowers/specs/2026-10-04-tuning-tools.md` §b2–b3.

---

> ⛔ **STOP:** From `ts/`, run
> `npx vitest run test_tuning_store.ts test_tuning_panel.tsx test_tuning_export.ts test_tuning_sweep.ts test_tuning_targets.ts test_scrapcrawl_tuning.ts test_scrapcrawl_run_end.ts test_playtest_contract.ts test_playtest_scrapcrawl.ts test_chimera_wilds_tuning.ts`
> before touching any file. Must report `Test Files 10 passed (10)` and `Tests 73 passed (73)`, 0 failing, 0 skipped. If the count differs, stop and report — do not proceed.

---

## 1. Why this exists

Measured 2026-11-09 at `82907284`: the panel's `apply()` writes overrides to localStorage and then calls `window.location.reload()`. The reload destroys the run Robert was judging. The store does not need it: `tuned(key)` calls `getOverrides()`, which re-reads localStorage on every call, and `applyFight` in `runEnd.ts` calls `tuned('scrapcrawl.loss_damage')` at each fight. The reload is the only thing between a slider and a live game.

Not every knob can be live. YAML-data knobs (chimera_wilds) are applied once in `loadGame`. `scrapcrawl.player_max_hp` is read in `newRun()`. So each knob must say when it applies.

**Not in scope (deferred):** live re-application of YAML-data knobs; any change to how games read knobs; play notes (P2); proposals (P3).

## 2. Scope

| File | Status | Action |
|---|---|---|
| `ts/src/engine/tuning/types.ts` | Modify | Add `ApplyMode` and optional `applies` on `KnobDef` |
| `ts/src/engine/tuning/applyMode.ts` | New | Pure helpers |
| `ts/src/engine/tuning/index.ts` | Modify | Re-export `applyMode` |
| `ts/src/components/TuningPanel.tsx` | Modify | Reload only when required; status line; injectable reload |
| `ts/src/components/TuningPanel.css` | Modify | Style for the status line and the per-knob mode hint only |
| `ts/src/games/scrapcrawl/knobs.ts` | Modify | Add `applies` to the two knobs |
| `ts/tests/test_tuning_apply_mode.ts` | New | Pure tests |
| `ts/tests/test_tuning_panel_live.tsx` | New | Panel behaviour tests |

**Read-only — do not touch:** `ts/src/engine/tuning/store.ts`, `applyData.ts`, `sweep.ts`, `exportFormat.ts`, `ts/src/games/scrapcrawl/utils/runEnd.ts`, `ts/src/games/chimera_wilds/**`, `ts/src/components/GameShell.tsx`, every existing test file. Report before fixing any bug found in a read-only file.

## 3. The work

### `types.ts`

```ts
export type ApplyMode = 'live' | 'next-run' | 'reload';
// on KnobDef:
applies?: ApplyMode; // when a changed value takes effect; absent = 'reload' (the behaviour before this directive)
```

> ⚠️ RULE: `applies` is optional and absent means `'reload'`. No existing knob definition may need editing for the build to pass.

### `applyMode.ts` (pure, no DOM)

```ts
export function knobApplyMode(knob: KnobDef): ApplyMode;                       // knob.applies ?? 'reload'
export function changedKeys(before: Overrides, after: Overrides): string[];    // keys whose value differs, including keys present on one side only
export function requiredApplyMode(keys: string[], knobs: KnobDef[]): ApplyMode | null;
// null when keys is empty; otherwise the strongest mode among the changed knobs: reload > next-run > live.
// A key with no matching KnobDef counts as 'reload'.
```

> ⚠️ RULE: This file imports types only. No `window`, no storage, no React.

### `TuningPanel.tsx`

- New optional prop `reload?: () => void`, default `() => window.location.reload()`.
- `apply()`: read the currently stored overrides with `getOverrides(gameId)`, compute `changedKeys(stored, changedOnly)`, call `writeDevOverrides`, then `requiredApplyMode`. Call `reload()` only when the mode is `'reload'`. Otherwise set a status line: `Applied live.` for `'live'`, `Saved. Takes effect on the next run.` for `'next-run'`, and nothing for `null`.
- `reset()`: same rule, with `after = {}`.
- Each knob row shows its mode in the hint area in plain words: `live`, `next run`, or `needs reload`. Use a `data-tuning-apply` attribute carrying the mode.
- The status line is an element with `data-tuning-status` and `role="status"`.

> ⚠️ RULE: Do not add caching, subscriptions or events to the store to make this work. The store is already live; this directive only stops the panel from reloading.

> ⚠️ RULE: The existing "Copy as YAML" and "Copy as patch" behaviour is unchanged.

### `scrapcrawl/knobs.ts`

`scrapcrawl.loss_damage` gets `applies: 'live'`. `scrapcrawl.player_max_hp` gets `applies: 'next-run'`.

## 4. Test anchors

| Test | File | Behaviour |
|---|---|---|
| absent applies is reload | `test_tuning_apply_mode.ts` | `knobApplyMode` of a knob without `applies` returns `'reload'` |
| changed keys both directions | same | detects changed, added and removed keys; equal maps give `[]` |
| empty change is null | same | `requiredApplyMode([], knobs)` is `null` |
| strongest mode wins | same | live+next-run → `next-run`; live+reload → `reload` |
| unknown key is reload | same | a key with no `KnobDef` → `reload` |
| live knob does not reload | `test_tuning_panel_live.tsx` | scrapcrawl panel, change `loss_damage`, Apply: the `reload` spy is not called and `tuned('scrapcrawl.loss_damage')` returns the new value |
| next-run knob does not reload | same | change `player_max_hp`, Apply: no reload; status text mentions the next run |
| reload knob still reloads | same | chimera_wilds panel, change a knob, Apply: `reload` spy called once |
| reset follows the same rule | same | after a live-only override, Reset does not reload and `tuned` returns the default |
| mode hint rendered | same | each scrapcrawl knob row carries the right `data-tuning-apply` |

Target: the 73 existing tests plus the 10 anchors above, 0 failing, 0 skipped. Report the real number. No network. Follow `test_tuning_panel.tsx` for the jsdom `?dev=1` setup; do not modify that file.

## 5. What NOT to do

- Do not edit `runEnd.ts` or any game logic. Do not make `player_max_hp` live.
- Do not touch chimera_wilds.
- No new dependencies. No build or vite-node commands.

## 6. Verification

- `cd ts && npx vitest run test_tuning_apply_mode.ts test_tuning_panel_live.tsx` — all pass.
- The pre-flight command again — still 73 passed.
- `cd ts && npx tsc --noEmit` — exit 0.
- `git status` shows only the 8 files in the scope table.

Controller finish (not Devin): open `http://localhost:5173/arcade/rfdgamestudio/?game=scrapcrawl&dev=1`, start a run, set `loss_damage` to 4, Apply, lose a fight, and screenshot the HP dropping by 4 with no reload.

## 7. Rules for this run

Repo standard: non-interactive; install, download or fetch nothing; no scratch files; never commit to main, never push; branch `directive/play-loop-p1-live-apply`; Robert merges. Do not hand-write a Queue block.

## 8. Completion criteria

- [ ] Pre-flight floor reported as 73/0/0 before any edit
- [ ] 10 anchors pass; existing 73 still pass
- [ ] `tsc --noEmit` exit 0
- [ ] Only scope-table files changed
- [ ] Status row carries the pasted vitest tail
- [ ] `docs/status.md` test-floor note updated by the controller after merge

## 9. Quick reference

| Fact | Value |
|---|---|
| Baseline commit | `82907284` |
| Pre-flight floor | 10 files, 73 passed |
| Default apply mode | `reload` |
| Mode strength | reload > next-run > live |
| scrapcrawl.loss_damage | live |
| scrapcrawl.player_max_hp | next-run |
| Branch | `directive/play-loop-p1-live-apply` |

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-playloop-p1-live-apply-directive |
| Base branch | - |
| Base commit | 8ebbe4b67edbfc303d86b54594c710752f0f9d2b |

**Status log**
- 2026-11-09 21:30 · robert-claude-laptop · none → Queued — Play loop live apply for tuning knobs. Baseline proof run by author 2026-11-09 21:15 ET at 82907284: 10 files, 73 passed. Robert 2026-11-09: approved the play-loop plan and all recommendations.
- 2026-11-09 21:31 · robert-claude-laptop · Queued → Approved — lint override: The three flagged paths (applyMode.ts and two new test files) are files this directive creates; all are marked New in its scope table. Author ran the baseline proof 2026-11-09 21:15 ET at 82907284 (10 files, 73 passed). Robert 2026-11-09 21:21 ET: 'I permanently approve all of your recommendations'.
- 2026-11-09 21:53 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-playloop-p1-live-apply-directive; lane=default; model=swe-2-high; perm=accept-edits; persona=steady-builder; agent_id=01M71NZZ4Z2B5CYE0JA315K1JP
<!-- queue:end -->
