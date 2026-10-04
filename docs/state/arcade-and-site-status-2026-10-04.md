# Arcade, studio and website: where it stands (2026-10-04)

Read-only audit; facts only, no design proposed. Recorded notes were treated as claims and re-checked
against code, git and live HTTP. Studio read at origin/main `250ea4e7` (main has since moved); site repo at
local main `6d3116d` (clean, in sync with origin/main).

## 1. Studio roadmap, as written vs true
Two roadmaps: prose `ROADMAP.md` (295 lines, Now/Next/Later) and `docs/ROADMAP.md` (464 lines, swarm
`yaml roadmap` block, M1-M7). Only the second has milestones.

| Milestone (docs/ROADMAP.md) | Written | Verified |
|---|---|---|
| M1 GameShell in gladiator_arena, house_of_kings_collab, voiddrift_redux | done | TRUE: `grep -c GameShell` = 7 / 5 / 5 in the three `ts/src/games/*/App.tsx`; commit `1327c37a` records it |
| M2 global build compiles | done | Merge `9fc8992e` (3 tsc fixes). `npm run build` NOT re-run |
| M3 five status_unconfirmed rows | pending | not checked beyond the file |
| M4 collectibles, hooks, creature content | active | M4.1 TRUE (`docs/children.json` has 38 children). M4.2 pending and TRUE: no "collectible" in `ts/src` or `ts/tools`; `arcade-manifest.json` is gitignored. M4.3 blocked on the site's M5.1 decision. M4.4: `docs/CREATURE_PIPELINE.md` absent |
| M5 creature system doc | pending | TRUE: `docs/CREATURE_SYSTEM.md` absent |
| M6 graphics boundary, M7 owner docs | pending | not checked |

Demo importer (plan `docs/superpowers/plans/2026-09-19-demo-importer.md`, Tasks 1-8):
- Branch `feature/demo-importer` is NOT merged (`git merge-base --is-ancestor` fails; 11 commits ahead of main).
- Tasks 1-5 content is on main by other routes: `studio_mcp/demos/{naming,register,registry,result}.py`;
  commit `0a4077a4` (Task 5) is an ancestor of origin/main; `studio_mcp/game_metadata.py` no longer has
  `_EXTERNAL_REPOS`/`GAME_PATHS` (Task 4 done); `ts/src/arcade-manifest/registryExport.ts` exists (Task 1).
- Tasks 6-8 (vendor/adopt/merge, build+verify, `check_arcade --only` + `stage.py`): no `stage.py` found; not on main.
- The plan file's checkboxes for Tasks 4+ are still unchecked: the file is stale against the code.
- `docs/RFDGameStudio_DemoPortingRoadmap.md` is v0.2, header dated August 2026; its Legacy/Origin section says
  done. Its tiered backlog was not re-checked against the 38 registered demos.

## 2. What the polish program already satisfies
- Standard `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (draft for Robert); 38
  `docs/demos/*/SCOPE.md`; 66 merge commits since 2026-10-03. Polish_*_TierA PRs merged on main: #84 #85 #86 #89
  #90 #92 #93 #95 #96 #97 #99 #100 #112 (13). Diffs not opened, so "merged" is not "A1-A8 met".
- Vision items touched: way back to the arcade (M1), honest labels (`external` / "(Origin)"), per-demo tiers,
  phone checks. Not touched: collectibles, saves, leaderboards, ratings, player layer.
- Wave 0 live audit (`docs/state/demo-audit-batch1-2026-10-03.md`, `-batch2-`): batch 1 had 13 of 17 live at
  `/games/<slug>/`, 4 with 404 (dissonance_prototype, factory_idle, filipino_bpo_simulator, character_viewer);
  batch 2 adds planetforge 404. 0 console errors at load on live pages; one shared `cabinet.js:54` warning.

## 3. Live site (curl GET, 2026-10-04)
| URL | HTTP | Title |
|---|---|---|
| https://rfditservices.com/ | 200 | Robert Floyd Dugger - Automation Engineer, Contact Center Systems |
| https://rfditservices.com/games/ | 301 to games.rfditservices.com/games/ | (redirect) |
| https://games.rfditservices.com/ | 200 | RFD Studio - Games by Robert Dugger |
| https://games.rfditservices.com/games/ | 200 | The Arcade (RFD Studio) |
| /arcade/shoal/, /arcade/chimera_wilds/ | 200, 200 | Shoal, Chimera Wilds |
| /arcade/succession/ | 404 (its `/games/succession/` page is 200) | 404 Not Found |
| /games/shoal/ | 200 | Shoal (RFD Studio) |
| /arcade-return.js | 200 | |
- Games index links 27 distinct `/games/<slug>/` pages (matches `data/arcade.json`, 27 games).
- `/arcade-return.js` is referenced in `/arcade/shoal/` (1 hit); not in `/games/` or `/games/shoal/` (the shell pages).
- Main site `content/`: about, archives, contact, incoming, philosophy, projects (26 case studies), resume, writing.
  `hugo.toml`: theme `rfd`, `site_role=main`, `transition=false` (comment "Transition complete 2026-09-20");
  `[params.arcade] player = "anonymous"` (stores nothing). `hugo.studio.toml` is the games build.

## 4. Site repo (C:\GitHub\RFD_IT_Services_Site)
- Branch main; `git status -sb` clean; `git log origin/main..` empty. Last commit 2026-09-28.
- `docs/state/current.md` (2026-09-24): "Games transition complete; arcade redesign landed except its media half";
  lists README.md, deploy/ROLLOUT.md, scripts/README.md as known stale.
- Plans: 2026-09-13 site-redesign, 2026-09-13 site-reorganization, 2026-09-18 arcade-reorganization, 2026-09-20
  arcade-redesign (each has a spec). The arcade-redesign plan has 0 checked / 33 unchecked boxes though
  `current.md` says most of it is committed: checkboxes are not maintained.
- `docs/ROADMAP.md` (site): M1 active, M2-M5 pending, M6 blocked.
- `data/arcade_health.json`: checked_at 2026-09-20T01:43Z; 21 builds, 21 ok, 0 failing. Games now number 27, so the
  file predates 6 games; not re-run (read-only).
- Covers: `data/arcade.json` 27 games, 19 with `cover`, 8 without: succession, slither-rogue, horse-racing,
  voiddrift, wire-rust, choke-point, voiddrift-redux, gladiator-arena (matches the "8 missing covers" note).
- Stale copy: `content/projects/rfd-game-studio.md:9` and `:62` say "34 games" and "adding a game means editing
  its config and nothing else" (contradicted by section 5 item 1). `devlogTag` not found in hugo.toml, data/, layouts/.

## 5. What a studio redesign would actually address
1. Add-a-demo sprawl. Hand-named occurrences of `kingmaker_squads` outside its dir and docs/directives: `registry.ts`,
   `status/board.data.ts`, `tests/test_registry_export.ts` (SOURCES map, line 5), `tests/test_arcade_registry_directive.ts`,
   `tests/test_arcade_lineage.tsx`, `tests/test_character_viewer_arcade_entry.ts`, `docs/children.json`,
   `tests/fixtures/demo_lists_snapshot.json`, plus the `.gitignore` exception. 9 places. studio_mcp lists are now derived.
2. gitignored `examples/*` trap: `.gitignore:193` ignores all of `examples/`, with 13 exceptions (lines 194-206).
   `examples/` holds 30 dirs; 535 tracked files. A new demo is silently untracked unless added there.
3. Deploy overwrite bug (PR #75, `docs/directives/Slimeworld_Deploy_Source_Fix_Directive.md`): the example-demo loop
   overwrote the build already placed in `static/arcade/slimeworld`. Fixed.
4. Embed targets that 404 live: `/arcade/succession/`; audit also found factory_idle, filipino_bpo_simulator and
   planetforge unpublished (batch 1 and 2).
5. Build scripts: `ts/package.json` has 12 `build:<id>` scripts (plus `build:shoal:y8`) against 36 config imports in
   `registry.ts` (34 non-retired demos per the audit); Tier A item A7 requires one per demo.
6. Tests tied to fixtures or live state: `tests/test_demos_registry_parity.py` pins `demo_lists_snapshot.json`;
   zip-verify tests needed hermetic fixes (PR #83, #94). A note claims main's suite was not green on 09-19; I did not
   run any suite today.
7. Generated, gitignored files absent from a fresh worktree: `ts/src/games/arcade-manifest.json`, `registry-export.json`,
   `game-metadata.json`; `ts/tools/export-arcade-manifest.ts` must run first.
8. Phone width: audit measured the game iframe at about 374x210 px at 390 px ("every game is cramped");
   antsim_redux content 394 px in a 374 px frame; character_viewer overflows horizontally. No page-level scroll on
   13 live pages.
9. Two roadmaps (`ROADMAP.md`, `docs/ROADMAP.md`) plus an unmaintained plan checklist and an August porting roadmap.
10. Counts disagree: site copy "34 games"; 27 published cards; 36 registry imports; 38 `docs/demos` and children.

Already fine: registry markers and invariant tests (Task 2) with derived demo lists; GameShell on the three
no-exit games; 0 console errors at load on live pages; `/games/` 301 and subdomain split working; site repo clean
and pushed; `check_arcade.py` exists; covers on 19 of 27; TS-native decision untouched.

## 6. Open questions for Robert
1. Is "redesign the studio" about the add-a-demo workflow, the code layout, or how it looks to players?
2. Report-versus-grant (site roadmap M5.1) blocks M4.3 and the daily loop: decide, or park it?
3. Should the unpublished demos (4 with 404 pages) be published, hidden or retired?
4. Are the 8 missing covers still your manual task, and does the featured gallery wait on them?
5. Which of the two studio roadmaps is the one of record?
6. Is the player layer (GCP + itch saves, leaderboards) still wanted, given the day job?

## Could not verify
Did not run `npm run build`, vitest, pytest or `check_arcade.py`; did not open Polish PR diffs; fetched only the
URLs in section 3; no GCP or itch state; M3, M6, M7 contents not checked; no browser rendering (phone numbers
come from the 2026-10-03 audit docs).
