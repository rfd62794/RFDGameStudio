# Report which embeds have no dist, and why the deploy would stop (Phase 1, D1.5, report only)

**Depends on:** D1.4 (`Studio_Build_Demo_D1_4_Directive.md`) merged: this run runs its `--all --check` and reads its output. D1.1 must be merged too (D1.4 depends on it).
**Queue-neutral:** this file carries no Queue block; the controller queues it.
**This directive builds nothing, deploys nothing and changes no code.** Its only output is one new report file. The controller then builds the missing embeds on the laptop and Robert approves any deploy.

**Read first** (everything this run needs is pasted below; these are the files to open):
`studio_mcp/tools.py` (lines 655-700 and 732-860: `_demo_source_path`, `_demos_needing_example_copy`, `studio_deploy_arcade`), `ts/tools/build-demo.ts` (whole file, from D1.4),
`docs/superpowers/specs/2026-10-04-studio-redesign.md` (section c2, the "Embeds" bullet, and section f question 2).

## 1. Why this exists

The redesign spec (section c2) says the 404 embeds are "fixed by that build plus a deploy step Robert approves" and that Phase 1 directive 4 reads how the deploy discovers dists before changing anything. D1.4 gave every demo one build command and a `--check`;
this run turns the result into one page Robert can decide from. The site repo (`RFD_IT_Services_Site`) is outside this worktree and this sandbox cannot read it, so the site-side facts are pasted below (measured by the controller on 2026-10-04 from
`static/arcade/`, the site's `arcade` and `arcade_health` JSON data files at site commit `6d3116d`). They are claims, not live checks: no HTTP was done. If the dispatch happens on a later day, the controller re-pastes section 3 first.

Measured by reading the deploy tool (`studio_deploy_arcade`, `studio_mcp/tools.py`), do not take it from memory:

- It discovers standalone builds by scanning `ts/` for folders named `dist-<gameId>/` that contain `index.html` (lines 762-775) and copies each to the site's `static/arcade/<gameId>/` (lines 826-829). That is exactly where `build:demo` (D1.4) writes.
- Every demo returned by `example_demos` (the 13 example embeds plus the sibling-repo `slimebreeder`, 14 in all) that has no `ts/dist-<gameId>/` must have `<source root>/dist/` (`examples/<slug>/dist/`; the sibling repo's own `dist/`) (lines 785-792), otherwise the whole deploy returns an error: "demo '<slug>' has neither ts/dist-<id>/index.html nor <path> / dist/. Build it first." One unbuilt embed blocks the deploy of everything.
- A `ts/dist-<id>/` older than `ts/src/games/<id>/` is refused as stale (lines 769-775).
- After copying, `_prepare_site_arcade` (defined at line 702, called at line 863) exports the arcade manifest, injects return pills and refreshes `arcade_health.json` through the site repo's scripts.

## 2. Scope

1. New report `<!-- new: docs/state/Embed_Dist_Report_2026-10-04.md -->`. No other file is created or changed.

## 3. The facts pasted for this run (site repo, 2026-10-04, site commit `6d3116d`)

`static/arcade/` holds 21 folders: `7_days_to_fry antsim_redux brewfield chimera_wilds corpworld dissonance facility_escape house_of_kings_collab kingmaker_squads ledger mutant_battle_ball planetofgreed rfdgamestudio scrapcrawl shoal slime_coin slimebreeder slimegarden slimeworld systemic_extract trinity_siege`.

The site's arcade health data: `checked_at` is `2026-09-20T01:43:56+00:00` (14 days old on 2026-10-04) and all 22 builds in it are `ok`.

The site's arcade data has 27 cards: 19 play from their own folder (every one of those 19 folders exists in `static/arcade/`: slimeworld, shoal, mutant_battle_ball, planetofgreed, slime_coin, chimera_wilds, scrapcrawl, house_of_kings_collab, dissonance, systemic_extract,
antsim_redux, 7_days_to_fry, facility_escape, ledger, trinity_siege, slimegarden, slimebreeder, corpworld, kingmaker_squads); 7 play inside the hub app at `/arcade/rfdgamestudio/?game=<id>` and need no folder of their own
(succession, slither_rogue, horse_racing, wire_rust, choke_point, voiddrift_redux, gladiator_arena); 1 is an itch frame (voiddrift). The cards do not include `filipino_bpo_simulator`, `factory_idle`, `planetforge`, `dissonance_prototype`,
`coin_pusher_arcade`, `voidrift_particle_sandbox`, `character_viewer`, `technique_showcase`, `role_symbol_viewer`.

Studio side, the output of `ts/tools/build-demo.ts --all --check` (via `npx vite-node`, run from the `ts` directory) run on D1.1 (2026-10-04), one line per game as `id | plan kind | has /arcade/ embedUrl | site static folder | site card`:

```
dissonance | standalone | - | dist | card
slimeworld | standalone | - | dist | card
shoal | standalone | - | dist | card
voiddrift | none | - | NO-dist | card
horse_racing | none | - | NO-dist | card
slither_rogue | none | - | NO-dist | card
mutant_battle_ball | standalone | - | dist | card
slime_coin | standalone | - | dist | card
chimera_wilds | standalone | - | dist | card
scrapcrawl | standalone | - | dist | card
wire_rust | none | - | NO-dist | card
choke_point | standalone | - | NO-dist | card
filipino_bpo_simulator | none | embedUrl | NO-dist | no-card
ledger | embed | embedUrl | dist | card
trinity_siege | embed | embedUrl | dist | card
7_days_to_fry | embed | embedUrl | dist | card
antsim_redux | embed | embedUrl | dist | card
facility_escape | embed | embedUrl | dist | card
systemic_extract | embed | embedUrl | dist | card
coin_pusher_arcade | embed | - | NO-dist | no-card
factory_idle | none | embedUrl | NO-dist | no-card
planetofgreed | standalone | - | dist | card
planetforge | embed | embedUrl | NO-dist | no-card
gladiator_arena | standalone | - | NO-dist | card
voiddrift_redux | embed | - | NO-dist | card
voidrift_particle_sandbox | embed | - | NO-dist | no-card
succession | standalone | - | NO-dist | card
house_of_kings_collab | standalone | - | dist | card
character_viewer | standalone | - | NO-dist | no-card
technique_showcase | standalone | - | NO-dist | no-card
role_symbol_viewer | none | - | NO-dist | no-card
dissonance_prototype | none | embedUrl | NO-dist | no-card
slimegarden | embed | embedUrl | dist | card
slimebreeder | none | embedUrl | dist | card
corpworld | embed | embedUrl | dist | card
kingmaker_squads | embed | embedUrl | dist | card
```

The four `embedUrl` games with no site folder (`filipino_bpo_simulator`, `factory_idle`, `planetforge`, `dissonance_prototype`) are the broken embeds: the studio hub app's `GameLoader` renders `embedUrl` in a frame, so each shows a 404 inside the hub (the site cards do not list them).
`slimebreeder` has a site folder but its plan is `none`: its source is the sibling repo `SlimeBreeder`, built there, not from this repo.

## Step 1 input (captured by the controller 2026-10-09)

The controller ran `ts/tools/build-demo.ts --all --check` (via `npx vite-node`, from the `ts` directory) in the live checkout on 2026-10-09 (read-only `--check`; exit code 1 because of the two PROBLEMS lines). Full output, 36 result lines (19 standalone, 13 embed, 4 none) and 2 PROBLEMS:

```text
dissonance: standalone (vite.dissonance.config.ts): ok
slimeworld: standalone (vite.slimeworld.config.ts): ok
shoal: standalone (vite.shoal.config.ts): ok
voiddrift: none: ok
  warn: no standalone entry and no example source
horse_racing: standalone (vite.horse_racing.config.ts): ok
slither_rogue: standalone (vite.slither_rogue.config.ts): ok
mutant_battle_ball: standalone (vite.mutant_battle_ball.config.ts): ok
slime_coin: standalone (vite.slime_coin.config.ts): ok
chimera_wilds: standalone (vite.chimera_wilds.config.ts): ok
scrapcrawl: standalone (vite.scrapcrawl.config.ts): ok
wire_rust: standalone (vite.wire_rust.config.ts): ok
choke_point: standalone (vite.choke_point.config.ts): ok
bpo_sim: embed (examples/bpo-sim): ok
ledger: embed (examples/ledger): ok
trinity_siege: embed (examples/trinity-siege): ok
7_days_to_fry: embed (examples/7-days-to-fry): ok
antsim_redux: embed (examples/antsim-redux): ok
facility_escape: embed (examples/facility-escape): ok
systemic_extract: embed (examples/systemic-extract): ok
coin_pusher_arcade: embed (examples/coin-pusher-arcade): ok
  warn: config has no embedUrl (the embed is not served at /arcade/<id>/)
factory_idle: embed (examples/factory-idle-precision-armory-phase2): ok
planetofgreed: standalone (vite.planetofgreed.config.ts): ok
planetforge: embed (examples/planetforge): ok
gladiator_arena: standalone (vite.gladiator_arena.config.ts): ok
voiddrift_redux: standalone (vite.voiddrift_redux.config.ts): ok
grainworks: standalone (vite.grainworks.config.ts): ok
succession: standalone (vite.succession.config.ts): ok
house_of_kings_collab: standalone (vite.house_of_kings_collab.config.ts): ok
character_viewer: standalone (vite.character_viewer.config.ts): ok
technique_showcase: standalone (vite.demo.config.ts): ok
role_symbol_viewer: none: ok
  warn: no standalone entry and no example source
dissonance_prototype: none: PROBLEMS
  problem: config has embedUrl /arcade/dissonance_prototype/ but nothing builds it: no standalone entry and no example source
slimegarden: embed (examples/slimegarden): ok
slimebreeder: none: PROBLEMS
  problem: config has embedUrl /arcade/slimebreeder/ but nothing builds it: source {"kind":"sibling","repo":"SlimeBreeder"} has no examples/<slug>/package.json
corpworld: embed (examples/corpworld): ok
kingmaker_squads: embed (examples/kingmaker-squads): ok
```

## 4. The work

**Step 1.** Do not run the tool (vite-node is refused in this sandbox). Read the captured output in the "Step 1 input" section above and check that its 36 result lines match the studio-side columns in section 3 (plan kind and embedUrl). The captured output is newer than section 3 and is the authority for the studio-side columns. Where it differs, say which games differ in the report (known drift: `filipino_bpo_simulator` is now `bpo_sim`, `voidrift_particle_sandbox` is now `grainworks`, `factory_idle` now builds, only `dissonance_prototype` and `slimebreeder` report PROBLEMS); do not change anything.

**Step 2.** Read the deploy tool lines named in section 1 and confirm the four bullets there are still accurate against the file (line numbers can drift; report the real ones).

**Step 3.** Write `docs/state/Embed_Dist_Report_2026-10-04.md` with exactly these sections, in this order. Findings first, then evidence:

1. `## Answer`: three sentences. How many of the 13 example embeds have no dist in `ts/dist-*` or `examples/*/dist` in this worktree (all 13, a fresh worktree has none; say so and that the controller's checkout is what matters), which four embeds are broken in the hub, and that one unbuilt embed blocks the whole deploy.
2. `## Broken embeds (4)`: a table `game | what config says | what exists | cause | action`. Fixed causes and actions, one row each:
   - `planetforge`: embed source exists (`examples/planetforge`), never built or deployed. Action: controller runs `cd ts && npm run build:demo -- planetforge` on the laptop, then the deploy loop, with Robert's approval for the deploy.
   - `filipino_bpo_simulator`, `factory_idle`, `dissonance_prototype`: config says `/arcade/<id>/`, no standalone entry and no example source linked (note: `examples/filipino-bpo-simulator`, `examples/factory-idle-precision-armory-phase1` and `examples/factory-idle-precision-armory-phase2`,
     `examples/dissonance-prototype` folders exist on disk, unlinked: check with the Glob tool and report which exist in this worktree). Action: Robert's call, spec question 2 (default: publish the three with a game loop by adding `source: { kind: 'example', slug }` and building; hide tools and origin
     embeds by removing `embedUrl`). Do not pick for him: list the options.
3. `## Embeds that need a build before the deploy loop can run`: the 13 example embeds from section 3 (plan `embed`), each with the command `cd ts && npm run build:demo -- <id>` and whether the site already has its folder: 9 do (`ledger`, `trinity_siege`, `7_days_to_fry`, `antsim_redux`, `facility_escape`, `systemic_extract`, `slimegarden`, `corpworld`, `kingmaker_squads`: rebuilding refreshes them) and 4 do not
   (`planetforge`, `coin_pusher_arcade`, `voiddrift_redux`, `voidrift_particle_sandbox`; only `planetforge` has an `embedUrl`, but the deploy loop iterates every example demo, so all 4 must be built too or the deploy stops; say this plainly).
4. `## Games with a plan but no site folder that need none`: `choke_point`, `gladiator_arena`, `succession`, `voiddrift_redux` play inside the hub (7 hub cards in section 3); say so, and that `character_viewer`, `technique_showcase`, `coin_pusher_arcade`, `voidrift_particle_sandbox`
   have no site card, so no folder is needed unless Robert wants them published.
5. `## How the deploy finds dists`: the four bullets from section 1 with the real line numbers you read.
6. `## Not verified`: no live HTTP was done, `arcade_health.json` is 14 days old (D0.5 owns freshness), the site-side lists are pasted claims, and the real embed builds have not been run on any machine by this report.

The report is plain prose and tables, no code changes, under 120 lines.

## 5. What NOT to do

- Do not build, install, deploy, fetch or run `npm run build:demo` without `--check`. Do not edit any file except creating the report.
- Do not read the site repo (outside the worktree) and do not guess its state: use only section 3.
- Do not touch `studio_mcp/tools.py` or any code; do not regenerate `docs/children.json`; do not run `uv run python -m studio.demos index` or `python -c`.
- Do not touch protected repos, `archive/`, or `docs/state/` files other than the new report.

## 6. Verification

```
uv run python --version
```
Expected: `Python 3.12.x`. Verified on this machine: `Python 3.12.12`.
The `--all --check` tool is not run by this directive; its output is captured in the "Step 1 input" section. Expected there (2026-10-09): 36 result lines (19 standalone, 13 embed, 4 none) and exactly two `PROBLEMS` lines (`dissonance_prototype`, `slimebreeder`).

Source checks (Grep tool, one call each): the report contains the headings `## Answer`, `## Broken embeds (4)`, `## How the deploy finds dists`, `## Not verified`, and each of `planetforge`, `filipino_bpo_simulator`, `factory_idle`, `dissonance_prototype`;
`git status` shows only the new report file.

## 7. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with no exceptions. Do not run `vite-node` at all. Do not use `ls`, `Get-ChildItem` or `cat`: use Read, Glob and Grep. No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every path and fact you need is above or in the files named in Read first. If a path is missing or a quoted fact differs from the file, say so in the report; if
  `ts/tools/build-demo.ts` does not exist, STOP (D1.4 has not merged) and write that in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo (deleting is denied in this sandbox); use `.devin-scratch/` if you need one and leave it.
- No absolute paths inside this repo's checkout in the report; use repo-relative paths.
- Do not run `agentflow lint` or any agentflow command.
- Status row meanings: when every Completion criteria box is checked and the verification output is in the log line, set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 8. Completion criteria

- [ ] `docs/state/Embed_Dist_Report_2026-10-04.md` exists with the six sections in Step 3, under 120 lines.
- [ ] Step 1's `--all --check` was run and its result (match or the differences) is stated in the report (real tail pasted in the log line).
- [ ] Step 2's deploy-tool line numbers are the real ones.
- [ ] No file other than the report was created or changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## Report

Findings first: the four broken embeds and the single-blocker fact. Evidence second: the real `--all --check` summary and the deploy-tool line numbers. Then say plainly what was not verified (section 6 of the report). Recommended action: the controller builds the
13 embeds on the laptop (`npm run build:demo -- <id>`) and asks Robert about the three source-less embeds (spec question 2) before any deploy.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json`, any code or config file, or `studio_mcp/tools.py`; running a real (non `--check`) build.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-studio-embed-dist-report-d1-5-directive |
| Base branch | - |
| Base commit | 012afc783cfc8cf8ae0739916413daf15fd04c29 |

**Status log**
- 2026-10-04 11:22 · agentflow-tick · none → Queued — suggested by heartbeat: Report-only, fully specified; dispatch only after D1.4 (and D1.1) merge, since build-demo.ts doesn't exist yet
- 2026-10-06 19:26 · robert-claude-laptop · Queued → Approved
- 2026-10-06 19:26 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-studio-embed-dist-report-d1-5-directive; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-06 19:27 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-studio-embed-dist-report-d1-5-directive; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
- 2026-10-06 19:29 · devin-overseer (delegated) · In progress → Blocked — Step 1 cannot run: all forms refused - `cd ts && npx vite-node tools/build-demo.ts --all --check`, `npm run build:demo -- --all --check`, `npx vite-node tools/build-demo.ts --all --check` (vite-node not in allowed commands). Step 2 verified OK: real deploy-tool lines are 762-775 (standalone dist-*/index.html discovery + staleness 768-774), 785-792 (example dist precheck), 826-829 (copy to static/arcade/<id>), 702/863 (_prepare_site_arcade). Report not written - needs the real --all --check tail.; under delegate.envelope
- 2026-10-09 23:47 · robert-claude-laptop · Blocked → Queued — Rewritten in PR #258 (merged): Step 1 now reads the controller-captured build-demo --all --check output embedded in the directive; no vite-node in the run. Line refs refreshed against main.
- 2026-10-09 23:56 · robert-claude-laptop · Queued → Approved
- 2026-10-10 00:16 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-studio-embed-dist-report-d1-5-directive; lane=default; model=swe-2-high; persona=steady-builder; agent_id=01M4J0DPM1WYCST8PAV6EGD1KB
<!-- queue:end -->
