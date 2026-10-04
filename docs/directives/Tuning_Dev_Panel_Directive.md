# Tuning dev panel behind ?dev=1, with Copy as YAML (M)

**Depends on:** `Tuning_Knob_Store_Directive` and `Tuning_Sweep_Tool_Directive` merged (needs `ts/src/engine/tuning/*` and `ts/src/games/tuning-registry.ts`), and at least one of `Tuning_Adopt_Chimera_Wilds_Directive` or `Tuning_Adopt_Scrapcrawl_Directive` merged so there is a knob to show. If `ts/src/games/tuning-registry.ts` does not exist or is empty, STOP and write that in the Status row.
**Read first:** `docs/superpowers/specs/2026-10-04-tuning-tools.md` (section b3), `ts/src/components/GameShell.tsx`, `ts/src/foundation/glossary/GlossaryPanel.tsx` (the dev-panel precedent), `ts/tests/test_foundation_glossary_panel.tsx` (the render-test pattern), `ts/tests/test_gameshell.tsx`.

## 1. Why this exists

Robert tunes by feel. He needs sliders on the running game and a way to bring the winning numbers back into the source files without retyping. Precedent: `GameShell.tsx` already shows a dev-only glossary panel via a URL flag, and `gladiator_arena` hides its Balance Lab behind `?dev=1` (`ts/src/games/gladiator_arena/App.tsx:52`). Baseline on origin/main `1f52374a`: `cd ts && npx vitest run test_gameshell.tsx` gives `Tests  8 passed (8)`. Players must never see or be affected by this panel.

## 2. Scope

1. New `ts/src/engine/tuning/exportFormat.ts` (pure).
2. New `ts/src/components/TuningPanel.tsx` (default export, lazy-loaded) and `ts/src/components/TuningPanel.css`.
3. Edit `ts/src/components/GameShell.tsx`: mount the panel only when `?dev=1`.
4. New tests `ts/tests/test_tuning_export.ts` and `ts/tests/test_tuning_panel.tsx`.

## 3. The work

First line of each new `.ts` or `.tsx` file: `// new: <path>`.

**`exportFormat.ts`**: `formatYaml(changed: Overrides, knobs: KnobDef[]): string` and `formatPatch(changed: Overrides, knobs: KnobDef[]): string`. Only keys present in `changed` AND whose value differs from `knob.default` are exported; unknown keys are ignored; an empty result returns `'# no changes'`.
- `formatYaml` groups data knobs by `source.file` and prints a header `# <file>` then the nested YAML for each path, merged (so `baseline_player.power` and `baseline_player.endurance` share one `baseline_player:` parent), 2-space indent, numeric segments printed as the key. Const knobs are listed after as comments: `# <file>: <name> = <value>`.
- `formatPatch` prints one line per changed knob: `<file>: <name or path> = <value> (was <default>)`.
Example, input `{'chimera_wilds.baseline_player.power': 80}` with that knob (default 90, file `games/chimera_wilds/data.yaml`) gives exactly:
```
# games/chimera_wilds/data.yaml
baseline_player:
  power: 80
```

**`TuningPanel.tsx`**: `export default function TuningPanel({ gameId }: { gameId: string })`. It looks up `getTuning(gameId)` from `../games/tuning-registry` (return `null` when absent), reads current values with `getOverrides(gameId)`, and renders `<aside className="tuning-panel" aria-label="Tuning (dev)" data-tuning-panel>` with: one section per `knob.group`; per knob a row `data-tuning-knob="<key>"` with the label, a range slider and a number input (both bound to a local draft, `min`/`max`/`step` from the knob), the `affects` text, the default, and a `changed` class when draft differs from default. Buttons: `Apply` (calls `writeDevOverrides(gameId, changedOnly)` then `window.location.reload()`), `Reset` (calls `clearDevOverrides` then reload), `Copy as YAML` and `Copy as patch` (call `navigator.clipboard.writeText(formatYaml(...))` / `formatPatch(...)`, and show a `Copied` note; when the clipboard is unavailable show the text in a `<textarea readOnly>`). The panel shows the line `Dev tuning: only you see this. Copy the changes into the files to keep them.`. It does NOT run any simulation.

**`GameShell.tsx`**: next to the glossary mount add a lazy panel:
```tsx
const TuningPanel = lazy(() => import('./TuningPanel'));
...
{typeof window !== 'undefined' && devTuningEnabled(window.location.search) && (
  <Suspense fallback={null}><TuningPanel gameId={gameId} /></Suspense>
)}
```
(import `lazy`, `Suspense` from `react`, and `devTuningEnabled` from `../engine/tuning`). Nothing else in `GameShell.tsx` changes; with no `?dev=1` the rendered markup is identical to today.

**`TuningPanel.css`**: small dark panel fixed to the bottom, scrollable, max height 45vh, readable on a phone (inputs at least 44 px tall); import it inside `TuningPanel.tsx`.

**Tests.** `test_tuning_export.ts`: the exact example above; two knobs under one parent merge; an unchanged knob is dropped; empty gives `# no changes`; a const knob appears as a comment line; `formatPatch` line shape. `test_tuning_panel.tsx` (render pattern from `test_foundation_glossary_panel.tsx`): (a) `GameShell` for the adopted game id with the URL at `/` renders NO `[data-tuning-panel]` and the shell's text is unchanged; (b) with `window.history.pushState({}, '', '/?dev=1')` the panel mounts (await the lazy import with `await act(async () => {...})` and a short `await new Promise(r => setTimeout(r, 0))`) and shows a knob row; (c) changing a number input then clicking `Apply` writes `localStorage['rfd.tuning.<gameId>']` (stub `window.location.reload` with `vi.spyOn` or by defining a configurable `location.reload`; if jsdom refuses, test through `writeDevOverrides` directly and say so in the Status row); (d) `Reset` removes the key; (e) clicking `Copy as YAML` calls a stubbed `navigator.clipboard.writeText` with a string starting `# `. Reset the URL and storage after each test.

## 4. What NOT to do

- No simulation in the panel, no auto-reload on slider drag, no extra dependency, no change to any game number or to any game's `App.tsx`.
- Do not show the panel, read `localStorage`, or apply overrides unless the URL has `?dev=1`.
- Do not restructure `GameShell.tsx` beyond the lazy mount; no change to its props.

## 5. Verification

`cd ts && npx vitest run test_tuning_export.ts`, `cd ts && npx vitest run test_tuning_panel.tsx`, `cd ts && npx vitest run test_gameshell.tsx` (expects `Tests  8 passed (8)`, unchanged), `cd ts && npx vitest run test_tuning_store.ts`; `cd ts && npx tsc --noEmit` no new errors. Paste the real tails. `git status`: only Scope files.
**Controller finish (after merge, not this run):** open the adopted game with `?dev=1` on desktop and at 390x844, screenshot the panel, and check that without `?dev=1` there is no panel. Those need a browser.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Do NOT run `npm run build:*`, `vite-node`, `vite build` or any `uv run python -m studio...` module (the sandbox refuses them; the controller
  runs the sweep tool and builds). The only commands you run are `cd ts && npx vitest run <bare-filename>`, `cd ts && npx tsc --noEmit`
  (errors that mention only `game-metadata.json` are pre-existing in a fresh worktree: ignore those, fix any other), `git status`, `git diff`, and git add/commit on your branch.
- Do not run `git merge origin/main`. Use `git fetch origin` then `git rev-list --count HEAD..origin/main` to see whether main moved.
- Files you edit keep their existing line endings; new files use CRLF to match.
- New behaviour goes in small new modules (SRP/KISS); no file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.
- Overrides must never reach players: nothing you write may read localStorage or apply an override unless the URL has `?dev=1` (or an in-process `withOverrides` scope in tests and tools).

## 7. Completion criteria

- [ ] The 4 Scope items exist; `GameShell.tsx` changes only the lazy mount and imports.
- [ ] `test_tuning_export.ts`, `test_tuning_panel.tsx` pass; `test_gameshell.tsx` still `Tests  8 passed (8)` (real tails pasted).
- [ ] Without `?dev=1` no `[data-tuning-panel]` is rendered and no localStorage override is read (test (a)).
- [ ] `npx tsc --noEmit` shows no new errors.
- [ ] No file outside Scope changed (`git status`).
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: what the panel shows, the exact `Copy as YAML` output for the chimera example, and any test you had to weaken (clipboard or reload stubs). Say plainly that no browser check was done. Recommended action: review, merge, then the controller screenshots it at `?dev=1`.

## Sandbox needs

none (`cd ts && npx vitest run <bare-filename>`, `cd ts && npx tsc --noEmit`, git status/diff only)

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos (TeleseroAdminSuite2026, DialerListPulse); editing Lua files, `games/*/logic.lua`, `ts/src/engine/executor.ts`; editing `docs/children.json`; changing any shipped game number (defaults must equal today's values); adding a runtime or build dependency.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Approved |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 17:27 · robert-claude-laptop · none → Queued
- 2026-10-04 18:36 · robert-claude-laptop · Queued → Approved — lint override: cited dev panel files are new files this directive creates
<!-- queue:end -->
