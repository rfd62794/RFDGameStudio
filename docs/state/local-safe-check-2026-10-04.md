# Local safe check, 2026-10-04

Report only. Base: origin/main f9f76d1d. Each demo was built locally (`npm run build:demo -- <id>`, all 12 built, exit 0; `--all --check` flags only dissonance_prototype and slimebreeder as having an embedUrl but nothing to build, both not in scope), copied to `local-arcade-preview/arcade/<id>/` and served by `vite dev` on 127.0.0.1:5199 (arcade app at `/arcade/rfdgamestudio/`). Browser: Playwright Chromium, 1280x720 and 390x844. No deploy, no queue edits, server stopped.

Console note: every page shows one `favicon.ico` 404 from the dev server root; it is a harness artifact, not an embed error, and is not counted below. No failed network requests on any demo (all assets 200).

## Result table

| demo | loads | console errors | 390 overflow (scrollWidth) | change verified | verdict | note |
|---|---|---|---|---|---|---|
| systemic_extract | yes | none | none (390) | PARTIAL: NEW RUN two-step works (click -> "CONFIRM NEW RUN?", second click resets run to sanctuary, confirm reverts after ~5 s). FAIL at 390: the NEW RUN button sits at x=571..637, off screen (clipped by overflow hidden), so it cannot be reached on a phone | NEEDS-LOOK | Hold this embed until the top bar fits at 390 (right-hand group is pushed out of the 12..378 bar) |
| kingmaker_squads | yes | none | none (375) | yes: Restart -> "Confirm restart?" (no native dialog); header wraps cleanly at 390 | SAFE | Page title is "My Google AI Studio App" (cosmetic) |
| factory_idle | yes | none | none (390) | yes: Phase 2 loads, "Clear Floor" button present, arcade card blurb "Early build, published as-is (Phase 2 of 5)..." | SAFE | |
| facility_escape | yes | none | none (375) | yes: STEALTH badge, HOW TO PLAY, 3-line hint on turn 0 ("Guards show their next move before you act. / Stay out of their sightline. / Reach the exit at the top-right."), gone after first move (turn 1) | SAFE | Page title "My Google AI Studio App" (cosmetic) |
| slither_rogue | yes (menu) | none | none (390) | PARTIAL: Restart button is labelled ("Restart this run"). BUT the run does not play: canvas stays black and the HUD shows "Time NaN" / "NaN:NaN", both in the standalone build and in the arcade app (`?game=slither_rogue`) | UNSAFE | Not on the live site (404), so nothing to regress; do not publish until the Lua game loop is fixed. Cause not found (no console error) |
| gladiator_arena | yes | none | none (375) | yes: no Balance Lab tab by default; Balance Lab present with `?dev=1`; blurb "Build cyber-organic gladiator frames..." | SAFE | |
| slimeworld | yes | none | none (390) | yes: BETA badge on the arcade card; "New Campaign" header button opens two-step ("CONFIRM HARD RESET" / "CANCEL") | SAFE | |
| horse_racing | yes (arcade app `?game=horse_racing`; TS-native, no separate embed) | none | none (390) | yes: BETA badge on the arcade card | SAFE | |
| slimegarden | yes | none | none (385) | yes: no sideways scroll at 390 (385 <= 390) | SAFE | Headless 15 px scrollbar means 385 vs a 375 visible width is a hair over; confirm by eye if it matters |
| choke_point | yes | none | none (390) | yes: wave 2 spawns (turn 7: new Crawler + Blaster appear, core takes damage) | SAFE | |
| chimera_wilds | yes | none | none (390) | yes: winnable, 16 wins - 14 losses over 30 fights | SAFE | |
| scrapcrawl | yes | none | none (390) | PARTIAL: lose path verified in browser (0 HP -> "RUN OVER", Restart button). Win path not reached by a naive bot (best 3/4 rooms cleared); win screen is covered by `tests/test_scrapcrawl_run_end.ts` (6 passed) | SAFE (win path by unit test only) | Worth one human play-through |
| bpo_sim | yes | 6 AudioContext autoplay warnings (benign, needs a user gesture) | none (390) | shows "BPO SIM" and plays; unpublished, report only | SAFE | |

## Arcade home (`/arcade/rfdgamestudio/`)

- 36 game cards. 0 `<img>` elements: this app renders text cards with no covers, so there is no broken cover here (covers live on the Hugo site, not checked).
- Badges on the changed cards: slimeworld BETA, horse_racing BETA, slither_rogue BETA, factory_idle EXTERNAL, facility_escape EXTERNAL, systemic_extract EXTERNAL, kingmaker_squads EXTERNAL, gladiator_arena DEV, scrapcrawl DEV, choke_point DEV, chimera_wilds DEV, bpo_sim DEV. Other counts include STABLE (shoal) and TOOL/EXTERNAL cards.
- scrollWidth at 390: 375.

## Recommendation per demo

- systemic_extract: do not publish yet; fix the 390 top bar so NEW RUN is on screen.
- kingmaker_squads: publish.
- factory_idle: publish.
- facility_escape: publish.
- slither_rogue: do not publish; the run never starts (NaN timer, black canvas).
- gladiator_arena: publish.
- slimeworld: publish.
- horse_racing: publish (ships with the arcade app).
- slimegarden: publish.
- choke_point: publish.
- chimera_wilds: publish.
- scrapcrawl: publish; a human should win one run once.
- bpo_sim: unpublished; loads fine.

## Overall verdict: safe to publish the changed embeds?

Not all of them. Safe now: kingmaker_squads, factory_idle, facility_escape, gladiator_arena, slimeworld, horse_racing, slimegarden, choke_point, chimera_wilds, scrapcrawl. Hold: systemic_extract (NEW RUN unreachable at 390) and slither_rogue (game does not run).

## Screenshots

All under `docs/state/local-safe-check-2026-10-04/` (`<id>-1280.png`, `<id>-390.png`): arcade-home, bpo_sim, chimera_wilds, choke_point, facility_escape, factory_idle, gladiator_arena, horse_racing, kingmaker_squads, scrapcrawl, slimegarden, slimeworld, slither_rogue, systemic_extract. Extras: chimera_wilds-fights-1280, choke_point-play-1280, facility_escape-turn0-1280, gladiator_arena-dev-1280, kingmaker_squads-campaign-1280/390, scrapcrawl-start-1280, slimeworld-newcampaign-1280, slither_rogue-run-1280.
