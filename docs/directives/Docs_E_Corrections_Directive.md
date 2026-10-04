# Group E demo docs: corrections found while writing the directives, and the systemic_extract decision page (S)

**Depends on:** none (docs only; it names the other group E directives but does not need them merged).
**Read first** (everything this run needs is pasted below; these are the files to open): `docs/demos/<demo>/DIRECTION.md` and `SCOPE.md` for the nine demos below, `ROADMAP.md` (the `### Mutant Battle Ball` section).

## 1. Why this exists

Turning each DIRECTION.md "First three directives" into real directives meant measuring the code, and several direction claims turned out stale or wrong (the choke_point waves never spawned, slither_rogue has no death, mbb's stats are already normalized, facility_escape already has its room counter, and so on). A stale direction doc sends the next reader to rebuild what exists. This directive records the corrections in the docs, adds the systemic_extract decision page Robert needs, and adds one SCOPE note for the PARK verdict. Docs only, no code.

## 2. Scope

1. Append a `## Corrections (2026-10-04, ...)` section to nine `docs/demos/<demo>/DIRECTION.md` files (text below, verbatim).
2. `docs/demos/systemic_extract/SCOPE.md`: one appended line.
3. New file `<!-- new: docs/demos/systemic_extract/HIDEOUT_DECISION.md -->`.
4. `ROADMAP.md`: one appended sentence in the Mutant Battle Ball bullet.

## 3. The work

The existing docs use CRLF line endings; keep them for appended text. Append each block exactly as written; do not edit any existing text.

**`docs/demos/facility_escape/DIRECTION.md`** (append at the very end, after a blank line):

```
## Corrections (2026-10-04, measured while writing the directives)
- The room counter (`Room n/8`, about line 577 of `examples/facility-escape/src/App.tsx`) and a final result card (rooms cleared, turns taken, hearts left, about lines 790 to 805) already exist. Replan step 2 therefore shrinks to the three-line turn-one hint (`Facility_Escape_First_Turn_Hint_Directive`).
- The wording cleanup is `Facility_Escape_Player_Wording_Directive`. The 390x844 phone check and the screenshots need a browser and stay controller steps.
```

**`docs/demos/scrapcrawl/DIRECTION.md`** (append at the very end, after a blank line):

```
## Corrections (2026-10-04, measured while writing the directives)
- The crawl has FOUR fight rooms (difficulty 8, 12, 15, 18) plus Home Base, not five rooms with three difficulties, and the HUD already shows `Cleared n/4`; the separate `Room 2 of 5` cue in directive 3 is not needed and was dropped.
- Run odds, measured through the real Lua over 200 seeded runs: no crafting wins 35.0 percent, buying a Beat Stick when affordable wins 75.0 percent. The placeholder numbers (10 HP, 2 per lost fight) are kept and pinned by `Scrapcrawl_Sim_Runs_Directive`. The carry-over work is `Scrapcrawl_Carry_Over_Directive`.
```

**`docs/demos/slither_rogue/DIRECTION.md`** (append at the very end, after a blank line):

```
## Corrections (2026-10-04, measured while writing the directives)
- Run logic is not untested: `tests/test_slither_rogue.py` already runs the real Lua headless (14 tests). Replan step 2 became whole-run checks (`Slither_Rogue_Run_Tests_Directive`).
- There are no 'pre-existing TS errors': `tsc --noEmit` reports nothing in any `slither_rogue` file and a prototype `vite build:slither_rogue` succeeded (661.89 kB JS). The build script is `Slither_Rogue_Hygiene_Build_Directive`.
- Nobody dies in this game: the only `game_over` is the timer, and rivals steal tail segments (a Shield card blocks it). Replan step 3's 'cause of death' became a 'try this next' tip on the end card (`Slither_Rogue_Run_Tip_Directive`).
```

**`docs/demos/mutant_battle_ball/DIRECTION.md`** (append at the very end, after a blank line):

```
## Corrections (2026-10-04, measured while writing the directives)
- Combat stats are already normalized: `ts/src/games/mutant_battle_ball/statsMapper.ts` divides power, endurance, cyber armor and aggression by 6 before the combat system sees them. Replan step 2 became only seeding the symmetry test file (`Mbb_Seed_Symmetry_Tests_Directive`); speed and the disposal skills are passed un-normalized by design.
- The starter roster has exactly TWO mutants (`starter_mutants` in `games/mutant_battle_ball/data.yaml`) and nothing adds a third, so squad selection has nothing to choose between. Replan step 3 became persistence only (`Mbb_Save_Progress_Directive`); squad pick returns when the roster can grow.
- Of the two 'flaky' tests the pipeline audit named, `test_symmetric_opportunity_post_fix` was already seeded; the whole `test_mbb_match_rendering_point_cap_symmetry.ts` file was not and is seeded by the directive above. The Infirmary stub is hidden by `Mbb_Hide_Infirmary_Tab_Directive`.
```

**`docs/demos/choke_point/DIRECTION.md`** (append at the very end, after a blank line):

```
## Corrections (2026-10-04, measured while writing the directives)
- A headless play-through found that the first wave's second crawler and every later wave never spawned (state numbers return from JavaScript as floats, so the string-keyed wave table lookup missed), and that an enemy outside the core's row walked off the board forever. The real game was 'kill one crawler'. Both are fixed by `Choke_Point_Wave_Solvability_Directive`; content then follows in `Choke_Point_Waves_3_To_6_Directive` and `Choke_Point_Wave_Counter_Stars_Directive`.
```

**`docs/demos/trinity_siege/DIRECTION.md`** (append at the very end, after a blank line):

```
## Corrections (2026-10-04, measured while writing the directives)
- All 12 unit tests of `combat.ts` pass on current code, so the 'fabricated combat logic' worry is closed (`Trinity_Siege_Combat_Tests_Directive`). The 'why it won' line is `Trinity_Siege_Why_It_Won_Directive`; a how-to-play manual already exists, so no separate first-wave hint is added. Phone re-measure and cover screenshot stay controller steps.
```

**`docs/demos/antsim_redux/DIRECTION.md`** (append at the very end, after a blank line):

```
## Corrections (2026-10-04, measured while writing the directives)
- Directive 1 is `Antsim_Redux_Player_Copy_Directive` (it also rewords the `Core Directive` banner and points the README at the state doc). Directives 2 and 3 (phone re-measure, A5 screenshot, `embed` label) need a browser and stay controller steps after the embed is rebuilt.
```

**`docs/demos/early_learning_buddy/DIRECTION.md`** (append at the very end, after a blank line):

```
## Corrections (2026-10-04, measured while writing the directives)
- PARK is recorded by `Early_Learning_Buddy_Park_Directive`. The board has no `parked` status today; that directive adds one.
```

**`docs/demos/systemic_extract/DIRECTION.md`** (append at the very end, after a blank line):

```
## Corrections (2026-10-04, measured while writing the directives)
- Directive 1 is `Systemic_Extract_Honest_Blurb_Directive` (blurb, tags and a favicon; the cover screenshot is a browser step). Directive 2, the hideout decision page, is `docs/demos/systemic_extract/HIDEOUT_DECISION.md` (created by `Docs_E_Corrections_Directive`). Directive 3 waits for Robert's answer.
```

**`docs/demos/systemic_extract/SCOPE.md`** (append a new final line):

```
Tier: A only, hideout loop parked (2026-10-04, Robert's approval of the PARK verdict): no Tier B/C work until the hideout decision in HIDEOUT_DECISION.md is answered.
```

**`ROADMAP.md`**: in the `### Mutant Battle Ball` section, after the bullet's last line `Balanced-Speed Zero-Score Investigation)`, append two lines at the same indentation:

```
  2026-10-04 note: `ts/src/games/mutant_battle_ball/statsMapper.ts` already divides power, endurance, cyber armor and
  aggression by 6 before combat; see `docs/demos/mutant_battle_ball/DIRECTION.md` (Corrections).
```

**New file `docs/demos/systemic_extract/HIDEOUT_DECISION.md`**: create it with exactly this content:

``````
# systemic_extract: what to do with the orphaned hideout (decision page)

Date: 2026-10-04. For Robert. Status: waiting on one answer. Nothing here is built.

## The question

Systemic Extract's raid loop plays and restarts (NEW RUN landed, PR #119). The second loop, the hideout where salvage is spent, is unreachable: after the 200x200 megamap rewrite (ADR 011) nothing imports it, so a successful run ends with scrap that cannot be spent. How should salvage be spent, if at all?

## What exists today (measured on origin/main 889dd21e)

- `examples/systemic-extract/src/components/HideoutView.tsx` (194 lines) and `src/hooks/useHideoutState.ts` (307 lines) are imported only by each other.
- Seven panels sit under `src/components/hideout/`: DeploymentBayPanel 487, ResearchBenchPanel 277, DeconstructorPanel 228, HideoutHeader 164, FabricatorPanel 136, FaradayShieldBanner 89, HideoutFooter 41 (1,422 lines).
- `src/backend/hideout-service.ts` (856 lines) is NOT orphaned: the raid already calls `hideoutBackend.postRaidExtract` (`src/hooks/useRaidSimulation.ts` line 570) and `EcsInspector.tsx` reads `hideoutBackend`. Only `postHideoutDeconstruct`, `postResearchBrainstorm` and `postHideoutCraft` are never called.
- The example is a 13,610-line AI Studio app; edits there are overwritten by an AI Studio re-promotion (its README, "Improvement workflow").

## Option A: wire it in, smallest version (recommended if it should ship as a game)

One "Stash and upgrade" modal opened from the sanctuary, reusing `HideoutView` and `useHideoutState` as they are. No megamap corner buildings, no new art.
- Files touched: the sanctuary view that renders the Deploy button (`src/components/RaidView.tsx`, Deploy buttons near lines 175 to 193 and 250 to 272) plus one new small modal wrapper; no change to `hideout-service.ts`.
- Size: M (one directive, one Devin run), plus a browser check that salvage collected in a raid shows in the modal.
- Risk: the hideout panels were built for a different root view; expect layout work at phone width.

## Option B: cut it (smallest spend)

Delete `HideoutView.tsx`, `hooks/useHideoutState.ts` and `components/hideout/*` (1,923 lines in all). Keep `hideout-service.ts` (the raid uses it). Reword the "Inert Scrap Matter ... for Faraday deconstruction" text so salvage reads as a score, not a currency.
- Size: S. Verify afterwards: a Grep for `HideoutView` under `examples/systemic-extract/src` finds nothing, and the example still builds.
- Cost: the research and crafting design is gone from the tree (it stays in git history).

## Option C: leave it parked (the default today)

Keep the honest embed (the card already says the hideout is not open yet) and spend nothing. Nothing changes for players.

## Recommendation

Keep it parked (Option C). If you want it shipped as a game, choose Option A, not the megamap corner buildings. Pick B only if you are sure you will never want the hideout.

## Open question for Robert

A, B or C? (A directive for A or B is written only after you answer.)
``````

## 4. What NOT to do

- Do not edit any code, test, config or registry file. Do not change any existing sentence in any DIRECTION.md or SCOPE.md (append only). Do not touch other demos' docs.
- Do not answer the hideout question: the page asks Robert. Do not write directives for Option A or B.
- No deploys, no protected repos, no player-layer or cloud-save work.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x`. Verified on this machine: `Python 3.12.12`.

Docs only; checks are Grep calls (one call each), run after editing:
- Grep for `## Corrections (2026-10-04` under `docs/demos` (files_with_matches): exactly nine files (antsim_redux, choke_point, early_learning_buddy, facility_escape, mutant_battle_ball, scrapcrawl, slither_rogue, systemic_extract, trinity_siege).
- Grep for `Tier: A only, hideout loop parked` in `docs/demos/systemic_extract/SCOPE.md`: one match.
- Grep for `2026-10-04 note` in `ROADMAP.md`: one match.
- `docs/demos/systemic_extract/HIDEOUT_DECISION.md` exists and its headings include `## Option A`, `## Option B`, `## Option C` and `## Open question for Robert` (Grep `^## ` on the file shows them).
Baseline on origin/main `889dd21e` (2026-10-04): the first Grep finds zero files.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>.ts`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Do not run `agentflow lint` or any agentflow command. Do NOT run `npm run build:*`, `vite-node` or
  `uv run python -m studio.demos index` (the sandbox refuses them; the controller runs builds and exporters after merge, see Controller finish).
  Do not use `npx tsc` as a check: in a fresh worktree it reports unrelated errors about the gitignored `game-metadata.json`.
- Do not run `git merge origin/main`. If you need to know whether main moved, use `git fetch origin` then `git rev-list --count HEAD..origin/main`.
- Files you edit use CRLF line endings; keep them (the Edit tool preserves them). New files may use either; use CRLF to match.
- New behaviour goes in small new modules (SRP/KISS); no file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] Nine DIRECTION.md files carry the Corrections section exactly as written.
- [ ] The SCOPE.md line, the ROADMAP.md note and `HIDEOUT_DECISION.md` exist as specified.
- [ ] The four Grep checks above pass (results pasted).
- [ ] No file outside the twelve in Scope changed (nine DIRECTION.md files, one SCOPE.md, `ROADMAP.md` and the one new page).
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: the nine corrections applied and the new decision page. Evidence second: the Grep results. Recommended action: review and merge; Robert answers A, B or C on the decision page when convenient (no rush; parked is the default).

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`; adding Lua code or changing the engine; any player-layer or save-to-cloud work.

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
- 2026-10-04 13:25 · robert-claude-laptop · none → Queued
<!-- queue:end -->
