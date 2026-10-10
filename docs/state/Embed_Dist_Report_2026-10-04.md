# Embed dist report — 2026-10-04

Phase 1, D1.5 — report only. This run built nothing, deployed nothing and
changed no code; this file is its only output. Studio-side columns use the
controller-captured `build-demo --all --check` output from 2026-10-09 (36
result lines: 19 standalone, 13 embed, 4 none; 2 PROBLEMS), which is newer
than and authoritative over the 2026-10-04 pasted facts.

## Answer

All 13 example embeds have no dist in this worktree — a fresh worktree has no
`ts/dist-*/` and no `examples/*/dist/` (verified by glob here); the
controller's checkout is what matters for the real deploy. Four embeds are
broken in the hub: `bpo_sim` (renamed from `filipino_bpo_simulator`),
`factory_idle`, `planetforge` and `dissonance_prototype` — each declares an
`embedUrl` of `/arcade/<id>/` with no `static/arcade/<id>/` folder on the
site, so `GameLoader` renders a 404 frame. The deploy prechecks every example
demo before copying anything and errors on the first one without a dist, so
one unbuilt embed blocks the deploy of everything.

## Broken embeds (4)

| game | what config says | what exists | cause | action |
|---|---|---|---|---|
| `planetforge` | `embedUrl /arcade/planetforge/`; `source: examples/planetforge` | example source tracked; no dist; no site folder | source linked, never built or deployed | controller runs `cd ts && npm run build:demo -- planetforge` on the laptop, then the deploy loop; Robert approves any deploy |
| `bpo_sim` (was `filipino_bpo_simulator`) | `embedUrl /arcade/bpo_sim/`; `source: examples/bpo-sim` | `examples/bpo-sim` tracked; no dist; no site folder | renamed and source linked since 10-04; never built or deployed | same as `planetforge` |
| `factory_idle` | `embedUrl /arcade/factory_idle/`; `source: examples/factory-idle-precision-armory-phase2` | `phase1` and `phase2` example folders tracked; no dist; no site folder | source linked since 10-04; never built or deployed | same as `planetforge` |
| `dissonance_prototype` | `embedUrl /arcade/dissonance_prototype/`; no `source` field | `examples/dissonance-prototype/` exists on disk but is unlinked; plan `none` → PROBLEMS | config points at a URL nothing builds | Robert's call (spec §f q2): publish by adding `source: { kind: 'example', slug: 'dissonance-prototype' }` and building, or hide it by removing `embedUrl` |

The causes above differ from the directive's prescribed rows, which were
written against the 10-04 facts: `filipino_bpo_simulator` and `factory_idle`
had no linked example source then, but the 10-09 check shows both do now, so
only `dissonance_prototype` still needs a config decision (spec default:
"publish the 3 with a game loop, hide tools and origin embeds"). Glob-verified
in this worktree: `examples/bpo-sim`, `examples/dissonance-prototype`,
`examples/factory-idle-precision-armory-phase1` and `…-phase2` all exist;
`examples/filipino-bpo-simulator` does not.

## Embeds that need a build before the deploy loop can run

The 13 games whose plan is `embed` per the 10-09 check; each builds on the
laptop with `cd ts && npm run build:demo -- <id>` (needs npm + network; a
sandbox can only `--check`). Site folder per the pasted site facts:

| embed | site `static/arcade/<id>/` folder? |
|---|---|
| `ledger` | yes — rebuild refreshes it |
| `trinity_siege` | yes |
| `7_days_to_fry` | yes |
| `antsim_redux` | yes |
| `facility_escape` | yes |
| `systemic_extract` | yes |
| `slimegarden` | yes |
| `corpworld` | yes |
| `kingmaker_squads` | yes |
| `bpo_sim` | no — new folder |
| `factory_idle` | no — new folder |
| `planetforge` | no — new folder |
| `coin_pusher_arcade` | no — no site card either |

All 13 must be built or the deploy stops at the first missing dist — only
`bpo_sim`, `factory_idle` and `planetforge` have an `embedUrl`, but the deploy
loop iterates every example demo regardless of `embedUrl` or site card.

Composition drift vs the 10-04 list (authority is the 10-09 check): in —
`bpo_sim` (renamed from `filipino_bpo_simulator`), `factory_idle`; out —
`voiddrift_redux` and `grainworks` (renamed from `voidrift_particle_sandbox`),
both now `standalone`. Plan-kind drift elsewhere: `horse_racing`,
`slither_rogue` and `wire_rust` went `none` → `standalone`; `voiddrift` and
`role_symbol_viewer` stay `none` (warn only); `dissonance_prototype` and
`slimebreeder` stay `none` but report PROBLEMS.

Two adjacent requirements the deploy enforces beyond the 13: `voiddrift_redux`
and `grainworks` still carry `source.kind: 'example'`, so `_example_demos()`
includes them — each is satisfied by its own `ts/dist-<id>/` standalone build
(or an `examples/<slug>/dist/`); `slimebreeder` (`source.kind: 'sibling'`)
needs the `SlimeBreeder` repo's own `dist/`, built in that repo.

## Games with a plan but no site folder that need none

All 7 hub-card games play inside the hub at `/arcade/rfdgamestudio/?game=<id>`
and need no folder of their own: `succession`, `slither_rogue`,
`horse_racing`, `wire_rust`, `choke_point`, `voiddrift_redux`,
`gladiator_arena` (the last four listed by the directive; the other three
were plan `none` on 10-04 and are `standalone` now — same conclusion).
`character_viewer`, `technique_showcase`, `grainworks` and
`coin_pusher_arcade` have no site card, so no folder is needed unless Robert
wants them published (`coin_pusher_arcade` still needs a build for the deploy
loop — see above).

## How the deploy finds dists

Measured from `studio_mcp/tools.py` in this worktree (line numbers real):

- Standalone discovery: scans `ts/` for `dist-<gameId>/` dirs containing
  `index.html` (762-775: `ts_root` 762, scan 764-767) and copies each to the
  site's `static/arcade/<gameId>/` (825-829). `build:demo` writes exactly
  there, for embed plans too (`ts/tools/buildDemo/plan.ts:23`).
- Example-dist precheck: every demo `_example_demos()` returns — all games
  with `source.kind` `example` or `sibling` (`studio_mcp/demos/registry.py:41-51`) —
  that lacks `ts/dist-<id>` must have `<source root>/dist/`, else the deploy
  returns `"demo '<slug>' has neither ts/dist-<id>/index.html nor <path> /
  dist/. Build it first."` (785-792; skip-if-standalone filter 691-699). One
  unbuilt embed blocks everything.
- Staleness: a `ts/dist-<id>/` older than `ts/src/games/<id>/` is refused
  (768-774; `_is_dist_stale` at 675-688).
- After copying, `_prepare_site_arcade` (def 702, called 863) runs the site
  repo's manifest export, return-pill injection and `check_arcade` steps
  (716-721), which refresh `arcade_health.json`.

## Not verified

No live HTTP was done; `arcade_health.json` `checked_at` is
`2026-09-20T01:43:56+00:00` (14 days old on 10-04 — D0.5 owns freshness); the
site-side lists are pasted claims from site commit `6d3116d`, not re-checked;
no real embed build has been run on any machine by this report; the
`--all --check` output is the controller's paste, not re-run here (vite-node
is refused in this sandbox).
