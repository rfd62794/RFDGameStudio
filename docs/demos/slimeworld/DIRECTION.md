# slimeworld direction (2026-10-05, supersedes the 2026-10-04 POLISH direction)
Status of this file: DRAFT for Robert. Everything marked PROPOSED is a recommendation, not a decision. Robert's 2026-10-05 decisions are stated as decisions.

## What it tried to be
The 2026-10-04 version of this file said "merge of SlimeGarden's breeding/dispatch/territory loop and SlimeBreeder's codex, TS-native on a Lua rules layer." That is accurate history (`games/slimeworld` starts 2026-07-14, `4182ccc1`; 142+ commits) and it is also the diagnosis: the loop grew into breed + dispatch + territory + belief/culture/fealty/favors/petitions, a territory-conquest game wearing a slime skin (docs/gdd/SlimeWorld_Design_Rev3.md; games/slimeworld/territory.lua, regionlock.lua, favors.lua, missions.lua). It collapsed under its own scope.

Decisions (Robert, 2026-10-05):
- SlimeBreeder is RETIRED in favor of SlimeWorld.
- World Conquest was inside SlimeWorld and is SPLIT OUT as its own separate game (territory-map strategy). Pointer only: this file does not design it. A later, optional bridge where bred slimes appear in Conquest is a LATER idea only.
- SlimeWorld is a Slime Rancher-style ranch game: forage -> lure/catch -> feed -> collect plorts -> sell -> upgrade -> unlock. A HUB plus 4 ZONES on a zone map. Tap/drag-based, 360 px wide, short sessions, no combat, no multiplayer, no servers, no timers, no paywalls, localStorage save.
- Robert worries it will not be interesting by itself: every zone must add its own twist, not a re-skin.
- Mixing slimes (Largo-style recipes) is the breeding layer. Traits are a small inherited set (color, size, one elemental affinity). Feeding a zone's food raises mutation chance toward that zone's element (the zone modifier).
- Plorts are the single currency and the gate key (a zone gate = deliver N plorts of type X). Collection grid with silhouettes.
- Robert's reaction to the 2026-10-05 gameplay walkthrough: each zone has fruit TREES with limited fruit; fruit plus items brought from the Hub lure wild slimes. This is the zone core loop (see Design).

One sentence to test everything against (PROPOSED): "Pick the right fruit for the right slime, then decide whether to spend it now or carry it home."

## Where it is now (evidence, read 2026-10-05 from origin/main 75d2c14c)
This describes the code that exists today, which is the OLD territory game, not the ranch design below. Nothing of the ranch design is implemented (no foraging, trees, plorts, lures, Hub, zone map, phrase generator: unverified by exhaustive search, but none appear in ts/src/games/slimeworld file names or in games/slimeworld/*.lua names).
- Old loop: breed (color/shape/accent genetics), dispatch to planet regions, unlock regions by composite locks; Missions/Economy tabs gated until first unlock (ts/src/games/slimeworld/App.tsx:578; tutorial.ts:3-22).
- Size: ts/src/games/slimeworld is ~7,000 TS/TSX lines (App.tsx 679, MissionsTab.tsx 2,117, SlimeDexTab.tsx 953, EconomyTab.tsx 782, RosterTab.tsx 770, SlimeVisual.tsx 315, planetRegion.ts 347); games/slimeworld holds ~5,400 lines (Lua rules breeding/codex/economy/territory/regionlock/favors, logic_original.lua 2,063 lines, data.yaml, systems.yaml, ui.yaml, CHANGELOG.md 373).
- Tests: 25 test_slimeworld_* files in ts/tests plus Python test_slimeworld* (counts from the 2026-10-04 file; not recounted today). `build:slimeworld` and ts/vite.slimeworld.config.ts exist.
- Reusable pieces (unverified for reuse, worth a spike): SlimeVisual.tsx (seeded-RNG slime drawing), the persistence path `writeSave('slimeworld_save')` (App.tsx:110-120), the Options hard reset (OptionsMenu.tsx), Lua/YAML economy ideas (data.yaml flood-decay pricing, tier values). Whether the Lua layer should carry the ranch rules is an open architecture question (see Open questions).
- Registry: ts/src/games/slimeworld/config.ts says status `beta`, genre creature-collector, tags territory-control/genetics, description "Breed, dispatch, and conquer planet nodes." The 2026-10-04 file said `stable`; that is already stale (changed to beta), and the description and tags are now wrong for the ranch design.
- SlimeBreeder: ts/src/games/slimebreeder/config.ts is an external "frozen origin exhibit" (`supersededBy: 'slimeworld'`, embedUrl /arcade/slimebreeder/, source sibling repo SlimeBreeder); archive/slimebreeder holds a ~3,059-line copy; docs/demos/slimebreeder/DIRECTION.md prescribes "frozen exhibit, Tier A only".
- Live state of /arcade/slimeworld/: unknown (deploy-source fix `d9f45518` exists; the live page was not re-checked).
- Phone layout (360 px) of any of this: unmeasured.
- Dead weight: components/.bak/ (5 stale tab copies), games/slimeworld/logic_original.lua, tracked examples/slimeworld duplicate (see slimegarden DIRECTION).

## Conflicts with existing docs (to resolve, not silently overwrite)
1. docs/demos/slimeworld/DIRECTION.md (10-04) and SCOPE.md (10-03): POLISH verdict for the territory game with "features stay frozen." Superseded by this file; SCOPE.md left as history.
2. docs/gdd/SlimeWorld_Design_Rev3.md (and Rev2, the Fealty/Culture/Identity/RegionLockDown/WireFealty directives): the "Unification of Beliefs" thesis is the conquest/fealty game. It describes World Conquest's lineage, not the ranch. PROPOSED: mark them "Conquest lineage, not SlimeWorld ranch" rather than delete.
3. bible/games/slimeworld/gdd.md (v0.2, 2026-10-04): says core loop is breed -> dispatch -> unlock regions. Wrong for the ranch; needs rewrite when M0 starts.
4. docs/demos/slimebreeder/DIRECTION.md: says "frozen origin exhibit; sibling ROADMAP marked frozen." Robert's word is now RETIRED, which is stronger (see Retire list).
5. Queue directives aimed at the old game: Slimeworld_Headless_Balance_Test, Slimeworld_New_Campaign_Button, Slimeworld_Deploy_Source_Fix, Slimeworld_Horse_Racing_Status_Beta, SlimeWorld_Port1-4 (SlimeBreeder ports: regents, petition decline, tier pricing, worker income). Their statuses were not re-read today (unknown). The balance test and New Campaign button would polish code that is leaving; recommend Robert hold/redirect them (a hold decision is Robert's, not made here). The Ports are SlimeBreeder features pulled into the old game and should not be extended.
6. config.ts description/tags and the 10-04 "Regents/Legacy Slimes/roster caps are frozen" wording: ROADMAP.md:177-196 lists Legacy Slimes, Regent design, Tier 3-4 color names under SlimeWorld. These are old-game backlog; Legacy/lifespans/bloodlines re-enter only via the Later list below.

## What happens to the existing code (PROPOSED, Robert decides)
Recommended: do not delete. The territory/dispatch/fealty code is the natural seed for World Conquest. Sequence: (a) Robert decides the name and home of World Conquest; (b) a mechanical rename/move directive (pure move, no behavior change) relocates the current ts/src/games/slimeworld + games/slimeworld to the Conquest id; (c) SlimeWorld ranch is built as new small modules under the `slimeworld` id. Until (b) lands, M0 work goes in a NEW directory (e.g. ts/src/games/slimeworld/ranch/ or a temporary `slimeranch` id) so nothing in the old tree is edited. The registry entry for the ranch stays unregistered/`beta` until it has a playable M0.

## Retire / archive list for SlimeBreeder (PROPOSED)
- Mark the sibling SlimeBreeder repo DIRECTION.md and ROADMAP.md "RETIRED: superseded by SlimeWorld (RFDGameStudio docs/demos/slimeworld/DIRECTION.md)", including the economy roadmap M1-M3. Sibling repo: Claude/Robert, not a worktree-only run.
- ts/src/games/slimebreeder/config.ts: keep as a labelled retired exhibit only if Robert wants the history online; otherwise remove from the arcade manifest. Change the wording from "frozen exhibit" to "retired" and drop the repo-path leak in the description of the blurb. Robert decides keep vs remove.
- Cancel the pending Polish_Slimebreeder_TierA_Directive (Reset + blurb) if the exhibit is removed; keep it if the exhibit stays.
- archive/slimebreeder/src (3,059 lines) already archived; no further action.
- docs/analysis/slimebreeder-absorption.md: keep as history. What carries into the ranch is ideas, not code: codex/collection grid and wanderer-style market (as Hub selling). Nothing else is ported.
- Update docs/demos/slimebreeder/DIRECTION.md verdict from "POLISH (Tier A, freeze)" to "RETIRE".

## The design (PROPOSED unless marked as a decision)
### Pillars
1. Short and tactile: a session is 3-8 minutes, one forage trip plus one Hub visit. Tap and drag only.
2. Every number is a choice: fruit is limited, the basket is small, the pen is small. The central tension is spend fruit luring now vs carry it home to feed/mix.
3. Each zone plays differently (a rule change, not a palette swap).
4. No clocks. Nothing happens while the player is away; regrowth is counted in player actions.
5. A solo-scale, finite game: it can be finished, and finishing it is the product.

### Core loop
Hub (feed, mix, sell, upgrade) -> Zone Map -> Foraging trip (shake trees for limited fruit, carry a small basket, lure and catch wild slimes) -> back to the Hub with fruit + slimes -> feed slimes to get plorts -> sell/mix/upgrade/deliver gate plorts -> new zone.

### Foraging trip (the zone core loop; Robert's 2026-10-05 addition)
Active, short, tap/drag. This replaces the earlier "drop food near it and it tags along" wording.
- Trees: each zone screen has 3-4 fruit trees. A tree holds a limited number of fruit (e.g. 3-5); tap or drag-shake to drop fruit, tap fruit to put it in the basket. A tree that is empty stays empty for the rest of the trip.
- Regrowth with no real-time timers: trees refill when the player re-enters the zone, PROPOSED with a guard: only after N Hub actions (sell/feed/mix/upgrade) since leaving (N = 3 to start, data-driven), so repeat-entering cannot farm. Fallback if that confuses testers: refill on every entry. Open question for Robert.
- Basket: a small carry capacity (e.g. 6 fruit), upgradable at the Hub (the first upgrade).
- Lures: zone fruit, plus Hub-made bait (e.g. a plort turned into bait at the Hub: type-specific bait pulls that slime family; a generic "lump" bait pulls anything but with a worse catch chance). Bait is carried in the same basket, so it competes with fruit for space.
- Wild slimes (3-5 on screen, drawn from the zone's native table by a seeded RNG stored in the save): each shows a preferred fruit (and an accepted bait) as a small icon after the first sighting; before that, a silhouette hints at family. Drag the right fruit onto a slime to lure it: right fruit = caught; wrong fruit = it sniffs and holds one more try; two wrong fruits = it flees. Fruit is consumed either way. So catching is a small puzzle with a cost.
- The decision loop: fruit used for luring cannot be fed at the Hub (feeding is what makes plorts and what raises mutation chance toward the zone element). Caught slimes ride home free up to pen capacity (pen is a Hub upgrade).
- Trip ends when the player taps Go Home (no failure state; an empty basket just means a short trip).
- Different tree types per zone are where each zone's twist lives (below).

### Slimes, traits, plorts
- Species: a native slime has 1 base species per family per zone (3 natives per zone, 12 total) plus Largo mixes. Mixing two slimes at the Hub follows a hand-authored recipe table (Largo-style: A + B = C). Total grid ~30-40 cells (see Targets); recipes are data, not code (data/slime_species.yaml and recipes.yaml, PROPOSED).
- Traits (small inherited set): color (palette index), size (S/M/L), and one elemental affinity (none, meadow, frost, fire, cave). A mixed slime inherits each trait from one parent at 50/50, except mutation (below).
- Mutation: base chance small (e.g. 5%) per mix; feeding a slime a zone's food in the Hub step before mixing raises the chance that the child's affinity becomes that zone's element (the zone modifier; +20% per fruit, capped, data-driven). Mutation only changes traits, never invents a species outside the recipe table, which keeps the grid finite.
- Plorts: each species produces one plort type when fed (1 plort per fed fruit, instant, no timer). Plorts are the single currency and the gate key: sell for their price; there is no separate coin currency. Pricing may use a soft flood decay (selling many of the same type lowers its price, restored by action count, not time); the old game's data.yaml has flood_decay logic worth reading before reuse (unverified).
- Gates: deliver N plorts of type X (the gate board). A delivered plort is spent (an honest cost, which makes the sell-vs-gate choice real).

### The Hub (what lives there)
One screen with five stations (tabs or tappable props; 360 px, thumb reach):
1. Pen/Feeding: slimes you carry home; feed fruit to get plorts; fruit choice also sets mutation lean.
2. Mixer: pick two slimes, see the recipe result (silhouette if undiscovered; a hint appears after two failed or lucky tries, PROPOSED), confirm. The parents are consumed (PROPOSED; the pen is small, so mixing is a real cost). Open question.
3. Market: sell plorts; the price board shows type prices and the flood state.
4. Collection grid: ~30-40 cells with silhouettes; a cell fills when a species is first owned; tap a cell for its traits seen and its preferred fruit.
5. Gate board + Upgrades: the gate board shows the next zone's requirement (N plorts of X, a progress bar); upgrades (basket size, pen size, bait recipes, a second fruit slot per drag) are bought with plorts. Bait crafting also lives with the Market as a small recipe list.
The Hub also holds the zone map (a node graph, not a scrolling world: Hub in the middle, zones as four nodes with lock icons; tap to travel). Hub actions (sell/feed/mix/upgrade) are the "clock" for tree regrowth.

### Zones (4; M0 ships 2; native slimes, foods, modifier, twist)
Names are working titles.
1. Meadow (start; free). Native slimes: Pip (green), Bloom (yellow), Dew (pale blue). Foods: Sunfruit, Berry, Honeybell (rare, 1 tree). Modifier: lifts meadow affinity (plain, forgiving; tutorial). Twist: Variety teaching: three tree types with different fruit counts, slimes' preferred fruit is shown from the first sighting (no guesswork), and a "Honeybell" tree that only drops after you have shaken the other two (order puzzle). It teaches lure-vs-carry cleanly.
2. Frost (gate: N Meadow plorts of type A). Native slimes: Flurry (white), Sleet (blue), Hoar (teal). Foods: Icepear, Snowberry, Glacier Plum. Modifier: raises frost affinity. Twist: Cold snap. Fruit frosts over in the basket: each lure attempt or each tree shake ages every carried fruit; frosted fruit only works on Hoar or after a Hub warming action. Trips become efficient routes: pick last, lure first. Plorts: slow price rise, so frost is the "careful" zone.
3. Fire (gate: N Frost plorts of type B). PROPOSED data zone. Native slimes: Ember (red), Cinder (orange), Magma (deep red, large). Foods: Pepper Pod, Cinderfig, Sunscorch Melon. Modifier: raises fire affinity. Twist: Push your luck. Every tree shake adds heat; at 3 heat the tree scorches and loses its remaining fruit; blowing on it (a tap) cools one heat. Big tree payouts, real risk of nothing. Needs one new small rule module (tree heat), the rest is data.
4. Glowcaves (gate: N plorts of a mixed Largo type C, forcing the player to use the Mixer). PROPOSED data zone (fourth zone of my choosing). Native slimes: Glim (dark teal), Shade (violet), Crystal (clear). Foods: Glowcap, Moonroot, Geode Nut. Modifier: raises cave affinity. Twist: Lantern. The cave is dark: a lantern circle (tap to move it, a limited number of moves per trip) reveals slimes and trees; shy slimes bolt if lit, so lure them from the edge of the light. Needs one new small rule module (visibility/lantern).
Gate chain: Hub -> Meadow (free) -> Frost (Meadow plorts) -> Fire (Frost plorts) -> Glowcaves (a mixed plort). All four are reachable from the Hub map in any order after unlocking; gates are data.
Cross-zone idea (LATER): a fruit from one zone is the wrong key for another's slimes, which pressures routes. Not M0.

### Monster Rancher phrase generator (PROPOSED milestone 1 feature)
Type a phrase (or a short code) at the Hub; a deterministic hash (e.g. FNV-1a of the normalized phrase) selects a species and traits from the table the player has unlocked, so the same phrase gives the same slime on every device. Shareable without a server (post the phrase). Guardrails: one phrase-slime per N plorts spent (so it cannot skip gates), a phrase result from a locked zone is shown as a locked silhouette and delivered when that zone unlocks (open question), and the hash/normalization and the species table version are frozen once released, because changing them silently changes everyone's slimes.

## Player experience today vs the target
Today: a dense territory/biomass terminal game; first action is guided but vocabulary (Regent, fealty, strain, favors, petitions, Biomass) arrives before the loop is felt. Target: in the first 60 seconds the player stands in the Meadow, shakes a tree, drags a Sunfruit onto a Pip, goes home, feeds it, gets a plort, sells it, and sees one grid cell fill. Best moment (target): the first successful lure of a slime with a rare preferred fruit, and the first Largo mix revealing a silhouette. Way back: shell back control; the save is always written; Reset is a labelled Hub menu entry (not buried).

## Targets (PROPOSED)
- 30-60 minutes to unlock all four zones (everything), with an engaged player.
- ~70% of a ~30-40 cell grid (about 21-28 cells) by that point; the rest require more mixes, mutations or phrase slimes, as the long tail.
- Cell budget: 12 native + ~20 Largo recipes + a few mutation variants = ~34 cells (PROPOSED; total species count is an open question).
- Phone width: every screen usable at 360 px with no horizontal scroll.

## Milestones (PROPOSED)
Each milestone is a playable slice, in the new modules, behind the same save key (new key, e.g. `slimeworld_ranch_save`, so the old save is never read).
- M0: Hub + 2 zones fully playable. Hub with all five stations (the market, feeding, mixer, grid, gate board + upgrades), the zone map, Meadow and Frost, the foraging loop (trees, basket, lure, catch), plorts, one gate (Meadow -> Frost), the grid with silhouettes, save/reset, 360 px layout, and a headless balance test (N simulated trips, no softlock, no negative plorts, Frost unlockable). The zone Twist interface (a small TS interface: tree behavior, basket modifier, visibility) is defined here and used by Meadow (null twist) and Frost (cold snap). Zones 3-4 ride on that interface so they are mostly DATA plus one small rule module each (heat; lantern), marked PROPOSED for M1.
- M1: Fire and Glowcaves (as data plus the two small rule modules), the phrase generator, the remaining recipes toward ~34 cells, tutorial polish, a sound pass if Robert wants sound.
- M2: Balance to the 30-60 minute target with a baseline-strategy headless run; phone and first-minute pass; a cover/screenshot; then a ship decision. World Conquest bridge is not scheduled.
Sizing (rough, honest): M0 is the bulk (~4-6 Devin directives); M1 is ~3-4; M2 is ~2. These are guesses, not a schedule.

## Later list (NOT M0; do not pull forward)
- Lifespans and bloodlines.
- Tarr-style hazard slime.
- Offline catch-up beyond a small cap (and then only as a one-time capped gift on return, never a timer).
- The optional bridge where bred slimes appear in World Conquest.
- Cross-zone fruit as keys; seasons; a second pen; cosmetics.

## Scope-creep guardrail: the explicit NOT list
SlimeWorld (the ranch) does NOT include, now or in M0-M2:
- World Conquest, territory, regions, garrisons, dispatch, missions, petitions, favors, fealty, regents, culture, belief systems, Biomass.
- Combat of any kind, enemies, health bars (a fleeing slime is not combat).
- Multiplayer, accounts, servers, leaderboards, sharing beyond a typed phrase.
- Real-time timers, energy, offline progress beyond the Later cap, notifications, daily rewards.
- Paywalls, ads, in-app purchases, a second currency.
- More than 4 zones, more than ~40 grid cells, more than 3 traits, a slime lifespan system.
- A map larger than a node graph of 5 nodes; free-roam exploration.
- A bespoke engine, a level editor, mod support.
- Vendor-scale commitments: no support promises, SLAs, live-ops cadence, or community management. One person, one day job: ship it finished and leave it.
Rule: a new idea goes onto the Later list or World Conquest's list, not into a milestone, unless Robert swaps something out of that milestone first.

## Engineering approach (SOLID / SRP / KISS, the 2026-10-03 hard rule)
- New behavior goes in small new modules, each with one job and its own tests; no file over ~300 lines, no new god-component (the old MissionsTab at 2,117 lines is the cautionary example).
- PROPOSED module split under ranch/: `data/` (species.yaml, recipes.yaml, zones.yaml, gates.yaml, fruit.yaml); `model/` (types, slime traits, inheritance + mutation, recipes lookup, plort economy, gate check, save schema); `forage/` (tree state, basket, lure resolution, twist interface, per-zone twist modules); `hub/` (feeding, mixer, market, bait crafting, upgrades); `phrase/` (normalize + hash + species pick); `ui/` (one small component per station/screen, a shared 360 px layout). Pure TS functions for all rules, so they run headless.
- Rules in plain TS data + pure functions (KISS) unless the Lua layer proves it earns its keep; the Lua executor was already replaced for speed in other games (see shoal DIRECTION), so do not default back to Lua. Decision pending (open question).
- Deterministic seeded RNG for wild slime spawns and the phrase hash, so tests and shared phrases are reproducible.
- Reuse over rewrite where measured: engine/shared persistence, SlimeVisual's seeded drawing (after a spike), the shared sound/chrome helpers.
- New code is built in a worktree; directives are fully specified and queued for Devin; Claude reviews.

## Review model
TBD, ask Robert. (Candidates: Tier A polish standard plus a headless balance test as the gate, as for other demos, or a stricter Tier B/C showcase review once M0 is playable. Not decided here.)

## Open questions for Robert
1. Existing code: move the current territory game to a World Conquest id (rename directive) and build the ranch fresh, or build the ranch in a temporary new directory first and move later? Recommended: temporary new directory, rename later.
2. Hold/redirect the queued old-game directives (Headless_Balance_Test, New_Campaign_Button, Deploy_Source_Fix, Horse_Racing_Status_Beta, Port1-4)? Which are still wanted for the Conquest side?
3. SlimeBreeder: keep the retired exhibit online or remove it from the arcade manifest?
4. Art style and palette (SlimeVisual's current blobs vs flat/outline/pixel; fixed palette of N colors tied to the color trait).
5. Total species count (PROPOSED ~34; is 30-40 the right band?) and the Largo recipe list: hand-authored by me for review, or by Robert?
6. Trait list: is color + size + one affinity final, and should size affect plort yield or price?
7. Sound: none, a handful of SFX, or music? (There is a shared sfx directive, Polish_Shared_Sfx.)
8. Tutorial: the Meadow as the tutorial (no popups, one pointer hand) vs a short scripted opening.
9. Tree regrowth rule: after N Hub actions (recommended) vs on every re-entry.
10. Mixer: do parents get consumed (recommended) or kept?
11. Phrase slimes: locked-zone results deferred as silhouettes (recommended), or restricted to unlocked zones?
12. Zone 4 choice: Glowcaves (proposed) vs ocean/sky; any new names and the gate chain.
13. Rules in TS or kept in Lua?
14. Registry/status for the ranch while unbuilt (hidden vs `beta`) and the final name of World Conquest.

## First three directives (PROPOSED; none are queued or approved by this file)
1. Slimeworld_Ranch_Data_And_Model: data files (species, recipes, zones, gates, fruit) plus the pure-TS model (traits, inheritance, mutation, plort economy, gate check, save schema), with unit tests; no UI; S-M; blocked on open questions 1, 5, 6, 13.
2. Slimeworld_Ranch_Forage_Loop: trees, basket, lure resolution, twist interface, Meadow screen at 360 px with a headless lure test; M; after 1.
3. Slimeworld_Ranch_Hub: the five Hub stations and zone map, Frost twist, one gate, headless balance test; M; after 2.
