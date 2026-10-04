# Docs: record the 2026-10-04 decisions and stale findings in seven SCOPE.md files (Size S)

**Depends on:** none. **Why now:** Robert's 2026-10-04 "I approve all recommendations" settled the plans in each demo's `DIRECTION.md`; the matching `SCOPE.md` files (written 2026-10-03) still carry findings that are now stale, and none has the new `Phone layout:` line the redesign spec asks for (`docs/superpowers/specs/2026-10-04-studio-redesign.md`, section c3). This is a pure documentation run: it also holds the PARK decision for `coin_pusher_arcade` and the FOLD decision for `dissonance_prototype` (a note, no code is deleted and no tile is hidden in this run).

**Read first** (everything this run needs is pasted below): the seven `docs/demos/<id>/SCOPE.md` files, ids `shoal`, `succession`, `dissonance`, `dissonance_prototype`, `slime_coin`, `coin_pusher_arcade`, `ledger`.

## 1. Why this exists

`docs/demos/*/SCOPE.md` is read by every later directive ("Scope and Out of scope are copied from the analysis", polish standard section 3). A stale line there sends a run after a problem that is already fixed (for example Shoal's "no in-play New Reef control", fixed in commit 13c01455) or treats a parked game as unported. Each file ends with the line `Open question for Robert: ...` (CRLF line endings).

## 2. Scope

Seven files, each gets exactly two appended lines at the very end. Nothing else in any file changes.

## 3. The work

Append the added lines below to the end of each file (the Edit tool keeps CRLF; each added line ends with a line break; do not reflow them, do not touch earlier lines). This diff is the exact result, verified on the prototype:

```diff
diff --git a/docs/demos/coin_pusher_arcade/SCOPE.md b/docs/demos/coin_pusher_arcade/SCOPE.md
index 4253bdec..23d6cefe 100644
--- a/docs/demos/coin_pusher_arcade/SCOPE.md
+++ b/docs/demos/coin_pusher_arcade/SCOPE.md
@@ -14,3 +14,5 @@ Out of scope: balance/art changes, new coins or levels, Gemini features (metadat
 Dependencies / risks: behaviour drift while splitting 1,446 lines of physics (highest risk, only light tests); overlap with slime_coin is limited (slime_coin is real-time shooter plus two-layer board, ts/src/games/slime_coin/config.ts); registry.ts edit conflicts with other demo ports at the demos:end marker.
 Effort: M
 Open question for Robert: none
+Decision 2026-10-04 (Robert approved all recommendations): PARK. The port is done and registered (commits 7a1fd77f and cd21e099), so "NOT registered" above is stale. Status stays dev, the game stays out of "Start here" and featured picks, and no further work (title screen, build script) happens until a 10-minute side-by-side playtest against SlimeCoin decides keep or fold.
+Phone layout: N/A while parked. Tier B and C: N/A while parked.
diff --git a/docs/demos/dissonance/SCOPE.md b/docs/demos/dissonance/SCOPE.md
index e6b19311..30ff028d 100644
--- a/docs/demos/dissonance/SCOPE.md
+++ b/docs/demos/dissonance/SCOPE.md
@@ -14,3 +14,5 @@ Out of scope: new cards, cultures, floors or Brewfield features; moving logic in
 Dependencies / risks: shared Lua runtime hooks (useLuaCall); any Lua change needs ts/tests/test_dissonance_zero_regression.ts green.
 Effort: M
 Open question for Robert: none
+Update 2026-10-04: run-end New Run and two-click Abandon landed (PR #86, commit 17b68b14), so the "Return to Title only" finding above is stale. Queued: Lua_Executor_Stack_Reserve_Directive, Dissonance_Bot_Run_Test_Directive, Dissonance_First_Fight_Hint_And_Plain_Captions_Directive, Dissonance_Mute_And_Sound_Effects_Directive.
+Phone layout: not yet measured; framed until the first 390x844 pass.
diff --git a/docs/demos/dissonance_prototype/SCOPE.md b/docs/demos/dissonance_prototype/SCOPE.md
index 0d3382ed..7c6e3e37 100644
--- a/docs/demos/dissonance_prototype/SCOPE.md
+++ b/docs/demos/dissonance_prototype/SCOPE.md
@@ -14,3 +14,5 @@ Out of scope: gameplay changes or bug fixes, merging with Dissonance Depths, un-
 Dependencies / risks: why the site export omitted this embed is unknown (I did not read the site pipeline); how other Origin embeds (corpworld) are built is unverified; blurb word count is 27 (audit batch1:54).
 Effort: S
 Open question for Robert: none
+Decision 2026-10-04 (Robert approved all recommendations): FOLD-INTO dissonance. The registry entry stays (external, supersededBy) as a labelled Origin exhibit, and Dissonance's title links to it ("Where Dissonance began"). The home-grid treatment (hide the card, or keep the labelled card as Slimebreeder does) is decided in the site repo.
+Phone layout: framed (an AI Studio export with a fixed layout).
diff --git a/docs/demos/ledger/SCOPE.md b/docs/demos/ledger/SCOPE.md
index 812f3618..2e2626bd 100644
--- a/docs/demos/ledger/SCOPE.md
+++ b/docs/demos/ledger/SCOPE.md
@@ -14,3 +14,5 @@ Out of scope: new goods/categories, more than 10 days, Gemini/AI features (metad
 Dependencies / risks: AI Studio origin (examples/ledger/README.md); embed path /arcade/ledger/ is already live.
 Effort: S
 Open question for Robert: none
+Update 2026-10-04: Tier A closed (restart control, phone dialog fit, logic test; commits 70f772ad and be78ef89), so the "no restart" and "intro cropped" findings above are stale. The defeat dialog already shows why the run was lost.
+Phone layout: framed (an AI Studio export with a fixed layout), to be confirmed by the first 390x844 pass.
diff --git a/docs/demos/shoal/SCOPE.md b/docs/demos/shoal/SCOPE.md
index f807418d..1f6ab681 100644
--- a/docs/demos/shoal/SCOPE.md
+++ b/docs/demos/shoal/SCOPE.md
@@ -14,3 +14,5 @@ Out of scope: new habitats, orca/whale mechanic, typed arrays, layered canvas, s
 Dependencies / risks: shared persistence/GameShell (ADR-014); same source ships to itch and Y8 (CHANGELOG.md), so changes reach all three targets; any status change is Robert's call.
 Effort: S
 Open question for Robert: none
+Update 2026-10-04: Tier A closed (in-play New Reef control and pointer input, commit 13c01455), so the "no restart" finding above is stale.
+Phone layout: rotate-hint (the reef canvas needs width; the 2026-10-04 redesign spec, section c3, names Shoal). To be confirmed on the first 390x844 pass.
diff --git a/docs/demos/slime_coin/SCOPE.md b/docs/demos/slime_coin/SCOPE.md
index 6ae01d30..71a0a7cb 100644
--- a/docs/demos/slime_coin/SCOPE.md
+++ b/docs/demos/slime_coin/SCOPE.md
@@ -14,3 +14,5 @@ Out of scope: new chip cards/coin types, balance changes, cross-run meta-progres
 Dependencies / risks: Lua modular layer and shared components (GameShell, EndStateScreen); sound.ts duplication is the subject of docs/directives/Polish_Shared_Sfx_Directive.md (not read in full).
 Effort: S
 Open question for Robert: none
+Update 2026-10-04: the math.pow Exchange bug is fixed and bridge tests plus a persisted best score landed. Queued: Slime_Coin_Lua_Entry_Point_Sweep_Directive, Slime_Coin_Blurb_Directive, Slime_Coin_Shop_Purchase_Fix_Directive. Not queued: the round recap panel (its "which chips fired" half needs a Lua addition, so decide that first).
+Phone layout: not yet measured; framed until the first 390x844 pass.
diff --git a/docs/demos/succession/SCOPE.md b/docs/demos/succession/SCOPE.md
index 25b5744d..e11db6b3 100644
--- a/docs/demos/succession/SCOPE.md
+++ b/docs/demos/succession/SCOPE.md
@@ -14,3 +14,5 @@ Out of scope: anything the Review directive shipped (ADR-007 locked methods, Cou
 Dependencies / risks: the Review directive's branch must merge first (same folder, App.tsx conflicts); balance harness must stay green (ts/tests/test_succession_balance_sim.ts).
 Effort: M
 Open question for Robert: none (direction documented; change 3 waits on his answers to the four open items)
+Update 2026-10-04: Revamp_Succession_Continue is merged (PR #59). In-play restart and per-segment save are queued as Succession_Run_Controls_Directive and Succession_Run_Save_Continue_Directive.
+Phone layout: framed until a 390x844 pass says otherwise (the figure cards are dense; DIRECTION.md replan 3 proposes stacking them on narrow widths). The live /arcade/succession/ 404 and the missing cover are controller and site tasks (redesign D2).
```

## 4. What NOT to do

- Do not edit any `DIRECTION.md`, any other demo's files, the roadmap (`docs/ROADMAP.md`, `docs/RFDGameStudio_DemoPortingRoadmap.md`), the registry or any code.
- Do not change a game's status, hide a tile, or delete anything: PARK and FOLD here mean a recorded decision only.
- Do not run `uv run python -m studio.demos index` (the sandbox refuses it; `docs/children.json` does not change in this run).
- No deploys, no protected repos.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

```
uv run pytest -q tests/test_demos.py
```
Real tail on the prototype with the seven edits applied (docs-only, so before and after are the same): `8 passed in 5.88s`.

Then `git diff --stat` (paste it). Expected: seven files changed, `2 insertions(+)` each, 14 insertions in total and no deletions.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>` (several bare filenames may follow one `vitest run`) and `cd ts && npx tsc --noEmit`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Do NOT run `npm run build:*`, `vite-node`, `agentflow` commands or `uv run python -m studio.demos index` (the sandbox refuses them; the controller runs builds and exporters after merge).
- Do not run `git merge origin/main`.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Files marked CRLF keep CRLF (the Edit tool preserves it). New files may use either; use CRLF to match.
- New logic goes in small new modules; no file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] The seven files carry exactly the added lines above and nothing else changed (`git diff --stat` pasted: 7 files, 14 insertions, 0 deletions).
- [ ] `uv run pytest -q tests/test_demos.py` passes (real tail pasted).
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the seven files touched. Evidence second: the `git diff --stat` and the pytest tail. Open items for Robert: (1) Coin Pusher Arcade stays parked until a 10-minute playtest against SlimeCoin; (2) the Origin card for the Dissonance prototype is a site-repo decision. Recommended action: review, merge.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 13:40 · robert-claude-laptop · none → Queued
<!-- queue:end -->
