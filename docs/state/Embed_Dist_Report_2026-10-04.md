# Embed dist report (2026-10-04, D1.5)

## Answer

In a fresh worktree none of the 15 example embeds has a `ts/dist-<id>/` or an `examples/<slug>/dist/` — that is expected; what matters is the controller's checkout, where every example embed must have a dist or the deploy loop stops. Four games carry an `embedUrl` the site has no folder for and so render a 404 inside the hub: `bpo_sim` (renamed from `filipino_bpo_simulator` since this directive was pasted), `factory_idle`, `planetforge` and `dissonance_prototype`. One unbuilt example demo blocks the deploy of everything — the precheck errors before any copy.

`cd ts && npx vite-node tools/build-demo.ts --all --check` on this worktree: exit 1, 36 result lines — but 15 standalone / 15 embed / 6 none, not the pasted 14/13/9. Main moved after the paste and three rows differ:

- `slither_rogue`: `none` -> `standalone` (`vite.slither_rogue.config.ts`).
- `filipino_bpo_simulator` (`none`, embedUrl, PROBLEMS) -> renamed `bpo_sim`, now `embed (examples/bpo-sim): ok`.
- `factory_idle` (`none`, embedUrl, PROBLEMS) -> `embed (examples/factory-idle-precision-armory-phase2): ok`.
- PROBLEMS lines are now two, not four: `dissonance_prototype` (embedUrl, nothing builds it) and `slimebreeder` (sibling source has no `examples/<slug>/package.json` — expected; it builds in the sibling repo).

## Broken embeds (4)

| game | what config says | what exists | cause | action |
|---|---|---|---|---|
| planetforge | `embed`, embedUrl | `examples/planetforge` exists, checks `ok`; no site folder | never built or deployed | controller runs `cd ts && npm run build:demo -- planetforge` on the laptop, then the deploy loop, with Robert's approval for the deploy |
| bpo_sim | `embed`, embedUrl (was `filipino_bpo_simulator`) | `examples/bpo-sim` exists and is now linked; `examples/filipino-bpo-simulator` is gone; no site folder | source linked after the paste, never built or deployed | same build + deploy as planetforge; note the deploy folder is `bpo_sim` — Robert should confirm the id change is intended for the URL |
| factory_idle | `embed`, embedUrl | `examples/factory-idle-precision-armory-phase2` exists and is linked (`-phase1` also on disk, unlinked); no site folder | source linked after the paste, never built or deployed | same build + deploy; Robert should confirm phase2 is the intended published slice |
| dissonance_prototype | embedUrl `/arcade/dissonance_prototype/`, plan `none` | `examples/dissonance-prototype` exists on disk, unlinked; no standalone entry; no site folder | still nothing builds it | Robert's call, spec question 2 — options: publish by adding `source: { kind: 'example', slug: 'dissonance-prototype' }` and building; or hide by removing `embedUrl`. Do not pick for him |

## Embeds that need a build before the deploy loop can run

The deploy loop iterates every demo `example_demos` returns — now 16 (15 example + the `slimebreeder` sibling), not the pasted 14, because `bpo_sim` and `factory_idle` gained example sources. Each runs `cd ts && npm run build:demo -- <id>` on the laptop:

- Site already has the folder (rebuild refreshes): `ledger`, `trinity_siege`, `7_days_to_fry`, `antsim_redux`, `facility_escape`, `systemic_extract`, `slimegarden`, `corpworld`, `kingmaker_squads` (9).
- Site has no folder: `bpo_sim`, `factory_idle`, `planetforge`, `coin_pusher_arcade`, `voiddrift_redux`, `voidrift_particle_sandbox` (6). Only the first three have an `embedUrl`, but the loop iterates every example demo — all 6 must be built or the deploy stops.
- Sibling: `slimebreeder` needs its own `dist/` built in the `SlimeBreeder` repo; its site folder already exists.

## Games with a plan but no site folder that need none

`choke_point`, `gladiator_arena`, `succession`, `voiddrift_redux` and — since the paste — `slither_rogue` have plans but no site folder; all five play inside the hub app at `/arcade/rfdgamestudio/?game=<id>` (7 hub cards in section 3 of the directive), so no folder is needed unless Robert wants a standalone deploy. `character_viewer`, `technique_showcase`, `coin_pusher_arcade`, `voidrift_particle_sandbox` have no site card either, so no folder is needed unless Robert wants them published.

## How the deploy finds dists

Read from `studio_mcp/tools.py` at this commit (spec line numbers drifted slightly):

- Standalone builds are discovered by scanning `ts/` for `dist-<gameId>/` dirs containing `index.html` — scan at lines 762-775 (`iterdir` 764, `dist-` prefix 765, `index.html` 767); each is copied to the site's `static/arcade/<gameId>/` in the loop at 825-840 (`copytree` at 829).
- Every demo from `_example_demos` (649-651; `_demos_needing_example_copy` at 691-699 skips demos whose static name already has a standalone build) without a `ts/dist-<id>/` must have `<source root>/dist/` — resolved by `_demo_source_path` (662-672) — else the precheck at 785-792 returns "demo '<slug>' has neither ts/dist-<id>/index.html nor <path> / dist/. Build it first." (789-790) and nothing is copied.
- A `ts/dist-<id>/` older than `ts/src/games/<id>/` is refused as stale at 768-774 (`_is_dist_stale` at 675-688; call at 769); `ts/dist/` vs `ts/src/` at 795, and example `dist/` vs `src/` at 802-813.
- After copying, `_prepare_site_arcade` (702-…) exports the arcade manifest, injects return pills and refreshes `arcade_health.json`.

## Not verified

No live HTTP was done. `arcade_health.json` is 14+ days old (D0.5 owns freshness). The site-side lists are pasted claims from the directive (site commit `6d3116d`, 2026-10-04). The real embed builds have not been run on any machine by this report — `--all --check` validates plans, not artifacts.
