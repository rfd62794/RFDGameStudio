# Demo audit Wave 0, batch 1 of 2 (2026-10-03)

Read-only audit of the live site with real Playwright page loads. Batch 1 = alphabetical ids 1..17 of 34 registered non-retired demos (`ts/src/games/registry.ts`, origin/main ede74aa5). Batch 2 covers the other 17.

Method per demo: `browser_navigate`, 3 s wait, `browser_console_messages`, `browser_network_requests` (non-static requests, analytics and Cloudflare RUM excluded; failed static requests would also show), 1280x720 screenshot, 390x844 screenshot, then a click on the shell's labelled "Start game" button, console re-read, an in-frame control inventory (`browser_evaluate` over the same-origin iframe), and a third "started" phone screenshot. Nothing else was clicked. No dialog, login, purchase or download was triggered.

Screenshots (not committed): `C:\Users\cheat\AppData\Local\Temp\claude\C--Github\38fc1e3f-7384-4284-8bdc-25fccb048775\scratchpad\audit-shots\<id>-desktop.png`, `<id>-phone.png`, `<id>-phone-started.png` (plus `character_viewer-phone-studio.png`).

## URL pattern finding

The spec's `/games/<id>/` with underscores is wrong. The real pattern is `/games/<id-with-hyphens>/` (Hugo page, shell with a "Start game" button that mounts an iframe). `https://games.rfditservices.com/games/7_days_to_fry/` returns 404 (console: `Failed to load resource: 404`). The iframe `src` is either `/arcade/<id_underscore>/` (externals and imported demos) or `/arcade/rfdgamestudio/?game=<id>&embed=1` (TS-native). The site index lists no `/games/` page for four of the 17: `character-viewer` (tool, reachable only via `/arcade/rfdgamestudio/?game=character_viewer` from /studio/), `dissonance-prototype`, `factory-idle`, `filipino-bpo-simulator`. All four return 404 at `/games/<hyphen-id>/` (and `/arcade/<id>/` also 404s for the last three).

## Totals

- Demos audited: 17 (13 live at `/games/`, 4 not published there).
- Console errors at load: 4 total, all the document 404 on the four unpublished pages (`Failed to load resource: the server responded with a status of 404`). The 13 live pages: 0 errors, 0 warnings at load.
- Failed network requests: 4 total, the same four 404 documents. The 13 live pages: 0.
- After clicking Start: 0 errors on all 13; 1 warning on each (`Allow attribute will take precedence over 'allowfullscreen'. @ /js/cabinet.js:54`, a site shell issue, same on every demo). facility_escape also logs 5 `[LOG]` lines from its own bundle (a "DEAD ZONE REJECTION TEST" running in production).
- Page-level horizontal scroll at 390 px: none on the 13 live pages (scrollWidth 375 vs 390). The iframe is only about 374x210 px on phone, so every game is cramped there.

## Table

Legend: status is the registry value. Console columns are "at load / after Start". A1 = zero console errors and zero failed requests (load and Start). A2 = launch from the shell and return: not exercised (no card click done); the shell has a "← All games" link and a Start button on every live page. A3 = visible Start and visible Restart/New Game (presence only, Restart was not clicked). A4 = no clipped control or horizontal scroll at 1280x720 and 390x844, judged from page and in-frame scrollWidth plus screenshots. A5 = blurb is 60 words or fewer with no placeholder text (manifest screenshot not checked; the manifest is generated at build time and is not in the repo). A8 = external only: iframe loads and fits the frame. Blurb label honesty on the arcade card was not checked.

| demo | status | url | load ok | console err (load / start) | console warn (load / start) | failed requests | start/restart found | iframe src | build script | tests exist | blurb words | A1 | A2 | A3 | A4 | A5 | A8 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 7_days_to_fry | external | /games/7-days-to-fry/ | yes | 0 / 0 | 0 / 1 | 0 | Start: "▶ Start game"; in frame "Start Shift"; Restart not found | /arcade/7_days_to_fry/ | none | none dedicated | 9 | pass | n/t | fail | pass | pass | pass |
| antsim_redux | external | /games/antsim-redux/ | yes | 0 / 0 | 0 / 1 | 0 | Start: "▶ Start game"; in frame "Reset", "Pause", speed 1x/2x/5x | /arcade/antsim_redux/ | none | none dedicated | 14 | pass | n/t | pass (Reset) | fail (frame content 394 px wide in 374 px frame) | pass | fail |
| character_viewer | tool | /games/character-viewer/ 404; studio route /arcade/rfdgamestudio/?game=character_viewer | no (404); studio route yes | 1 / n/a (studio route 0) | 0 / n/a | 1 (the 404 document) | not found (no Start, no Restart; buttons Left, Right, Humanoid, Chimera, Show Export) | none (studio route is the page itself) | none | yes: test_character_viewer.ts, test_character_viewer_arcade_entry.ts | 21 | fail | fail | fail | fail (studio route page 487 px wide at 390 px) | pass | n/a |
| chimera_wilds | dev | /games/chimera-wilds/ | yes | 0 / 0 | 0 / 1 | 0 | Start: "▶ Start game"; in frame "New Game", "← Arcade" | /arcade/chimera_wilds/ | `build:chimera_wilds` | partial: test_chimera_paper_doll_port.ts (paper-doll port only) | 11 | pass | n/t | pass | pass | pass | n/a |
| choke_point | dev | /games/choke-point/ | yes | 0 / 0 | 0 / 1 | 0 | Start: "▶ Start game"; in frame "Establish Connection"; Restart not found | /arcade/rfdgamestudio/?game=choke_point&embed=1 | none | yes: test_choke_point_ui.ts | 13 | pass | n/t | fail | pass | pass | n/a |
| corpworld | external (Origin of planetofgreed) | /games/corpworld/ | yes | 0 / 0 | 0 / 1 | 0 | Start: "▶ Start game"; in frame "RESET", "AUTHORIZE PLANNING PHASE" | /arcade/corpworld/ | none | none dedicated | 39 | pass | n/t | pass (RESET) | pass | pass | pass |
| dissonance | dev | /games/dissonance/ | yes | 0 / 0 | 0 / 1 | 0 | Start: "▶ Start game"; in frame "New Run", "← Arcade" | /arcade/dissonance/ | `build:dissonance` | yes: test_dissonance_shared_ui.tsx, test_dissonance_zero_regression.ts, test_dissonance_recovery_manifest.ts, test_artgen_dissonance_equiv.ts and others | 21 | pass | n/t | pass | pass | pass | n/a |
| dissonance_prototype | external (Origin of dissonance) | /games/dissonance-prototype/ | NO (404) | 1 / n/a | 0 / n/a | 1 (the 404 document) | not found (page does not exist) | n/a | none | none dedicated | 27 | fail | fail | fail | fail | pass | fail |
| facility_escape | external | /games/facility-escape/ | yes | 0 / 0 | 0 / 1 (+5 LOG) | 0 | Start: "▶ Start game"; in frame "INITIATE INFILTRATION"; Restart not found | /arcade/facility_escape/ | none | none dedicated | 13 | pass (but test LOGs in prod) | n/t | fail | pass | pass | pass |
| factory_idle | external | /games/factory-idle/ | NO (404) | 1 / n/a | 0 / n/a | 1 (the 404 document) | not found (page does not exist) | n/a (registry embedUrl /arcade/factory_idle/ also 404) | none | none dedicated | 21 | fail | fail | fail | fail | pass | fail |
| filipino_bpo_simulator | dev | /games/filipino-bpo-simulator/ | NO (404) | 1 / n/a | 0 / n/a | 1 (the 404 document) | not found (page does not exist) | n/a (registry embedUrl /arcade/filipino_bpo_simulator/ also 404) | none (listed in STANDALONE_BUILD_GAMES in registry.ts but no package.json script) | none | 15 (card uses shortDescription, 11 words) | fail | fail | fail | fail | pass | n/a |
| gladiator_arena | dev | /games/gladiator-arena/ | yes | 0 / 0 | 0 / 1 | 0 | Start: "▶ Start game"; in frame tabs "Frames", "The Forge", "Medbay Clinic", "Arena Bouts", "Balance Lab"; no Restart/New Game | /arcade/rfdgamestudio/?game=gladiator_arena&embed=1 | none | yes: test_gladiator_shell_opening.ts | 26 | pass | n/t | fail | pass (tab bar scrolls inside a 210 px frame) | pass | n/a |
| horse_racing | stable (registry; spec says only shoal is stable) | /games/horse-racing/ | yes | 0 / 0 | 0 / 1 | 0 | Start: "▶ Start game"; in frame "New Game" | /arcade/rfdgamestudio/?game=horse_racing&embed=1 | none | yes: test_horse_racing_polish.ts | 12 | pass | n/t | pass | pass | pass | n/a |
| house_of_kings_collab | dev | /games/house-of-kings-collab/ | yes | 0 / 0 | 0 / 1 | 0 | Start: "▶ Start game"; in frame only "Sign In with Google" (login-gated, not clicked); Restart not found | /arcade/house_of_kings_collab/ | `build:house_of_kings_collab` | yes: test_house_of_kings_server_prod.ts, server/scripts/regression-test.ts | 29 | pass | n/t | fail (gated) | pass | pass | n/a |
| kingmaker_squads | external (Origin of planetofgreed) | /games/kingmaker-squads/ | yes | 0 / 0 | 0 / 1 | 0 | Start: "▶ Start game"; in frame "Start New Campaign"; Restart not found | /arcade/kingmaker_squads/ | none | none dedicated | 23 | pass | n/t | fail | pass | pass | pass |
| ledger | external | /games/ledger/ | yes | 0 / 0 | 0 / 1 | 0 | Start: "▶ Start game"; in frame "OPEN SHOP & TRADE", "END DAY"; Restart not found | /arcade/ledger/ | none | none dedicated | 20 | pass | n/t | fail | pass (intro guide is cropped in the 210 px phone frame) | pass | pass |
| mutant_battle_ball | dev | /games/mutant-battle-ball/ | yes | 0 / 0 | 0 / 1 | 0 | Start: "▶ Start game"; in frame "New Game", "← Arcade" | /arcade/mutant_battle_ball/ | `build:mutant_battle_ball` | none dedicated (mentioned in test_arcade.ts, test_arcade_routing.ts) | 15 | pass | n/t | pass | pass | pass | n/a |

Blurb text (quoted from each `config.ts` `description`; `shortDescription` where noted):

1. 7_days_to_fry: "7 Days to Fry - a cooking survival game" (9 words)
2. antsim_redux: "Top-down ant colony simulation with pheromone signaling, direct food sensing, and emergent population dynamics." (14)
3. character_viewer: "Assemble and preview creature designs — live shape controls, side-by-side comparison, and exportable configs. A sandbox tool, not a competitive game." (21)
4. chimera_wilds: "Face a single randomly-assembled six-part enemy in a one-roll D20 encounter" (11)
5. choke_point: "Turn-based tactical grid defense. Preview enemy movement and attacks, and deploy perfect blockers." (13)
6. corpworld: "Origin project — Planet of Greed's fork ancestor, superseded by the current, live Planet of Greed (ts/src/games/planetofgreed/). A cold-corporate land-grab on a newly-discovered planet — Voronoi-tessellated territory, symmetric fog-of-war, deterministic Circle/Square/Triangle combat, multi-action weekly orders, and per-sector Civic Directives." (39). Note: the blurb leaks a repo path.
7. dissonance: "A turn-based deckbuilding roguelike — Culture-based card combinations, gated Build Archetype synergies, and a 5-floor descent through a fracturing station AI." (21)
8. dissonance_prototype: "Origin project — the original AI Studio (Gemini API) core-loop prototype that became the live Dissonance Depths (ts/src/games/dissonance/). Tested turn-based combat, relation-based combination mechanics, and Locked/Hinted/Discovered stabilization." (27). Leaks a repo path.
9. facility_escape: "A turn-based puzzle prototype testing property-based physical interaction rules and telecasted guard sightlines." (13)
10. factory_idle: "An in-depth Factory Idle inspired manufacturing automation simulation with conveyors, splitters, underground tunnels, crossings, power grids, research labs, and market logistics." (21)
11. filipino_bpo_simulator: description "Run a Filipino BPO floor: manage lead lists, dialer pacing, agent quotas, and day-end planning." (15); shortDescription "BPO management sim with list health, dialer pacing, and daily quotas." (11)
12. gladiator_arena: "Assemble cyber-organic gladiator frames. Manage your roster across a 5-tier champion ladder. Turn-based tactical combat with continuous anatomy damage, Blood Bowl recoil, and agent-driven decision AI." (26)
13. horse_racing: "Race, breed, and bet on horses. Win/Place/Show betting, genetics system, career tracking." (12)
14. house_of_kings_collab: "A server-authoritative collaborative kingdom management game with Firebase backend — duration-based task tiers, exponential economy, house festivals, and real-time Firestore sync. Zero-trust client security with server-side Admin SDK writes." (29)
15. kingmaker_squads: "Origin project — Planet of Greed's wheel/culture-identity design source, superseded by the current, live Planet of Greed (ts/src/games/planetofgreed/). A tactical squad strategy game." (23). Leaks a repo path.
16. ledger: "A Dutch-auction trading and appraisal simulator — compounding debt, a volatile resale market, and soft lockout consequences for missed payments." (20)
17. mutant_battle_ball: "Assemble mutants from parts. Field a 2v2 squad. Reach the end zone. Salvage the fallen." (15)

Raw proof (404 page, `browser_console_messages`, dissonance-prototype): `Total messages: 1 (Errors: 1, Warnings: 0)  [ERROR] Failed to load resource: the server responded with a status of 404 () @ https://games.rfditservices.com/games/dissonance-prototype/:0`. Raw (live page after Start, e.g. ledger): `Total messages: 1 (Errors: 0, Warnings: 1)  [WARNING] Allow attribute will take precedence over 'allowfullscreen'. @ https://games.rfditservices.com/js/cabinet.js:54`.

## Findings (what did not load cleanly, in priority order)

1. dissonance_prototype, factory_idle, filipino_bpo_simulator: registered in `registry.ts` but 404 at `/games/<id>/` (and `/arcade/<id>/`). Either not deployed or excluded by the site export. A1, A3, A4, A8 fail until published or deliberately unregistered.
2. character_viewer (tool): no `/games/` page; works only through `/arcade/rfdgamestudio/?game=character_viewer`, where the page overflows horizontally at 390 px (487 px wide).
3. antsim_redux: in-frame content is 394 px wide in a 374 px frame on phone (horizontal scroll inside the game).
4. facility_escape: production bundle logs a "DEAD ZONE REJECTION TEST" at start (5 `[LOG]` lines).
5. All live demos: `cabinet.js:54` warning after Start (one shared fix), and the phone frame is about 374x210 px, so the A4 "reachable" judgment is generous.
6. A3 (Restart control) fails on 7 live demos at the start screen: 7_days_to_fry, choke_point, facility_escape, gladiator_arena, house_of_kings_collab (Google sign-in gate), kingmaker_squads, ledger. A Restart may exist deeper in play; it was not exercised.
7. Spec drift: horse_racing is `stable` in the registry although the polish standard says only shoal is stable; the standard's `/games/<id>/` URL pattern should read hyphenated slugs.
8. Three Origin blurbs (corpworld, dissonance_prototype, kingmaker_squads) contain a repo path (`ts/src/games/...`).

## Not covered / caveats

A2 (card click and shell back) and Restart-without-reload were not exercised. Manifest screenshot for A5 not verified. "Tests exist" means a dedicated file by name under `ts/tests` or `ts/src/games/<id>`; many tests mention every id incidentally (registry and manifest tests), which is not counted. The browser instance was shared with the batch 2 agent (separate tabs); every result above was checked against the page URL it reported.
