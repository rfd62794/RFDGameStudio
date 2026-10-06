# shoal direction (2026-10-04, amended 2026-10-05)

> Amended 2026-10-05 with Robert's settled decisions: Shoal is one engine, one page, two modes. See "Settled decisions 2026-10-05" below; it supersedes the "no win state / watch-only" framing and the "Open question: None" line. Sections from 2026-10-04 are kept as written except where marked STALE.
## What it tried to be
A watch-and-seed reef: fish graze, sharks hunt, algae rises and sinks with grazing pressure, no win state (ts/src/games/shoal/config.ts:7-14). It began as an external static embed (e40954be, 2026-07-10), was rebuilt as "Shoal 2.0" continuous steering in TS+Lua (b592356c, db31a159, 07-11), then the Lua executor was replaced by a TS-native sim for a measured 151.7x speedup (games/shoal/ROADMAP.md, CHANGELOG "Production TS-Native Migration", 2026-08-14). Drift: the intent stayed "ecosystem toy", but 80% of the effort since went into performance and renderer profiling, not into giving a player a reason to return.
## Where it is now
- Playable loop: yes. 4 tools (fish/shark/algae/cull, App.tsx:102), scenario picker on the title, first-run primer, mute, extinction screen "Seed a New Reef" (App.tsx:317).
- Tier A closed on 10-04: in-play New Reef + pointer input (13c01455, ts/tests/test_shoal_new_reef_control.ts); the 10-03 SCOPE.md "no restart" finding is stale.
- Still true: reef state is not saved (only the tutorial flag, App.tsx:206) and nothing says "session-only".
- Size: 2,820 TS lines (App.tsx 716) + 2,024 Lua lines kept as reference; 7 test_shoal_* files; builds for arcade, itch (butler) and Y8 (build:shoal:y8).
- Weak spot: test_shoal_chrome_polish.ts asserts App.tsx source text, not behaviour; no headless "N ticks, no NaN, both outcomes reachable" test (B4). STALE 2026-10-05: ts/tests/test_shoal_headless.ts now exists on main (01f29bc4, 2000 ticks x 4 scenarios, no NaN/negative counts).
- Dead weight: games/shoal/*.lua is no longer executed (ROADMAP: fengari replaced); it is reference/exhibit only.
## Player experience today vs the target
First 60 s: pick a scenario, press Start Reef, drop fish; the primer explains four tools. Feedback is continuous (schooling, hunger colour, lineage hue). Progress: none; there is nothing to aim at. Way back: GameShell back plus "Title".
Best moment: dropping a shark into a thriving school and watching it split and the algae rebound.
Biggest turn-off: no goal or score, so a 30-second visit has no "I did something" receipt, and a reload silently loses the reef.
## Verdict
POLISH (Tier C showcase, settled pick) for Mode A. Mode B 'Evolve' is a new, additive layer on top (see below).
1. The sim and chrome are the strongest in the arcade (only `stable` entry); work is gap-closing, not rework.
2. The missing piece is a receipt for the player (reef report), not new mechanics.
3. Same source ships to arcade, itch and Y8, so cheap, additive changes win.
## Replan
1. Honest state (S): CUT nothing; ADD "session-only" line on title, or persist scenario+seed+tick with a Reset control via engine/shared/persistence. Recommend the label first (cheaper). Verify: Playwright act-reload step, or the text present.
2. Behaviour tests (S): CUT the source-text assertions in test_shoal_chrome_polish.ts (they pass while behaviour breaks); ADD headless 2,000-tick run per scenario, no NaN/negative counts, extinction and survival both reachable. Verify: `cd ts && npx vitest run tests/test_shoal_headless.ts`.
3. Reef report (M): ADD a one-screen summary on Mechanics/extinction (ticks survived, peak population, lineages, algae balance) and one "try this" nudge, no new entities. Verify: screenshot at 1280 and 390.
4. Phone layout (S): apply `rotate-hint` (redesign spec c3, line 62; Shoal named there). Verify: 390x844 screenshot.
Do not do: orca/whale, new habitats, typed arrays, layered canvas (ROADMAP backlog; each costs more than the player sees).
## First three directives
1. Shoal headless balance test and replace source-text polish asserts - S - none.
2. Shoal session-only label + reef report screen - M - D1 not required; touches App.tsx.
3. Shoal phone layout via rotate-hint - S - redesign D2 phone-layout field.
## Open question for Robert
Superseded 2026-10-05: see "Open questions for Robert" at the end.

## Settled decisions 2026-10-05 (Robert)
- ONE engine, ONE page, TWO modes. Same URL, same arcade cabinet entry; Evolve is not a separate title.
- Mode A "Aquarium": ambient, nobody in control, the original visual ocean ecosystem with beautiful colors. This is Milestone 0 and must always stay shippable and playable; no Evolve work may land in a state that breaks it.
- Mode B "Evolve": enter by clicking any fish in the aquarium and becoming it. Core loop: eat, grow, evolve traits (Flow/Spore style). Gentle stakes: no real death; being eaten sets you back one stage. Mood stays calm and pretty.
- Inspirations: Flow and Spore (eat, grow, evolve), plus Everything Is Crab. From Everything Is Crab: evolution is VISUAL and OPTIONAL and leans into PATHS (branching evolutionary routes). Evolution never gates the aquarium experience; the player may ignore it and just enjoy the world; trait choices form visible paths/branches, and skipping them is fine.
- Evolution is cosmetic plus abilities: colors, fin shapes and body patterns for beauty, plus a few abilities such as speed, glow, camouflage.
- Persistence: progress saved in browser local storage only. No accounts, nothing to host or support.
- The world keeps running normally around the player: the player is one creature among many and the ecosystem balances itself around them (no special-casing the sim for the player beyond the controller hook).
- Milestone style: Robert did not choose. Playable-slice milestones are PROPOSED below (each is something a stranger can play in a browser for minutes).
- Review model: TBD, ask Robert (his time per demo varies).
- Scale: solo entrepreneur with a day job. No support, no platform promises, no vendor-scale expectations. Free game like every RFDGameStudio demo.
- SOLID/SRP/KISS (hard rule): new behaviour goes in small new modules under ts/src/games/shoal/ (not into App.tsx at 716 lines or shoalSimulation.ts at 737 lines).
- The 10-04 "do not do" list (orca/whale, new habitats, typed arrays, layered canvas) still stands; Evolve is player agency inside the existing reef, not new content breadth.

## Feasibility of Mode B (verified 2026-10-05 against origin/main 7e79bef4)
Verdict: MODERATE. No sim rewrite; one small seam in the sim is needed.
Evidence:
- Sim is separated from rendering: yes. ts/src/games/shoal/simulation/shoalSimulation.ts has no canvas/DOM references (grep found none); `createShoalSimulation()` exposes initGame/tickGame/getState (lines 693-733), and ts/tests/test_shoal_headless.ts runs it under a node environment for 2000 ticks.
- Entity type: `Fish` (line 141: id, x, depth, vx, vd, age, fed, hunger, radius, maxSpeed, maxForce, lineageColor, mature, alive, fsm). A player fish can be an existing Fish flagged controlled. Per-fish radius/maxSpeed/maxForce already exist, so size and speed traits are data, not new code paths.
- Growth/stat hooks to reuse: `fed` (incremented on grazing in updateDiscreteEvents, ~line 655), `age`/`mature` (~line 657, breed_age), `hunger`, lineage color inheritance (generateInheritedColor, line 127). No stage or trait system exists; that is new.
- Movement is force-based: moveCreature (line 632) takes forces from computeFishForces (line 429), then limitVector/limitTurn. A controller can substitute a steering force toward the pointer target (reuse forceArrive, line 174) for the controlled fish only. Needs one hook at the `c.id.startsWith('fish')` branch; the sim has no externally steered creature today.
- Input: App.tsx has window pointermove/pointerdown (lines 436-453) and keydown (461-466); utils/pointerWorld.ts gives clientToWorld. `InputState` (types.ts:58-65) is tool/x/y/clicked only and handleInput (sim line 593) only spawns/culls, so click-to-pick and a steer target need new fields. Already pointer events; touch UNVERIFIED on a device.
- Camera: none. drawGame scales the whole world to the canvas (App.tsx:631). A follow camera is new; M1 can keep the whole-world view.
- Being eaten: sharks kill fish in updateDiscreteEvents (~line 656; killCreature line 589). The player fish needs a branch that sets back a stage and respawns instead; small.
- Rendering: fish drawn from lineageColor plus a cached Path2D (art/pathCache.ts; App.tsx drawFish ~538-587). Per-fish fin shapes, body patterns and glow need draw variants; cost against the Path2D cache is UNKNOWN (not verified).
- Persistence: only the tutorial flag is saved today (App.tsx:204,213) via the shared loadSave/writeSave; whether it fits an evolved-fish record is UNKNOWN but local storage is the settled target.
- Sound: utils/sound.ts and a mute toggle exist; Evolve cues unplanned.
What a build needs (small new modules, per SRP):
1. `evolve/playerFishController.ts` - pointer target in, steering force out; sim consumes it through one optional hook.
2. `evolve/growthStages.ts` and `evolve/traits.ts` - pure data/functions (stage thresholds from `fed`, trait catalogue split into cosmetic vs ability, trait to Fish stat mapping, ability effects like speed/camouflage); headless-testable.
3. `evolve/modeState.ts` - Aquarium/Evolve switch, selected fish id, setback rules; pure, no canvas.
4. `evolve/evolveSave.ts` - local-storage save/load of the evolved fish, try/catch guarded.
5. Thin UI: click hit-test over RenderState.fish and an Evolve HUD; App.tsx only wires them.
Risk: the id-prefix convention (`c.id.startsWith('fish')`, used in many places) is fragile; add the hook beside it rather than extending it. Camouflage as an ability implies shark targeting must read it (computeSharkForces, line 489), a second small seam.

## Roadmap (PROPOSED milestone style: playable slices)
Robert has not chosen a milestone style; this is a proposal. Mirrored in games/shoal/ROADMAP.md. Each milestone is something a stranger can play in a browser for several minutes.
- M0 Aquarium (exists, keep shippable): ambient reef, beautiful colors, nobody in control. Closes the 10-04 Replan (session-only label, reef report, rotate-hint). Gate for every later milestone: Aquarium still plays and tests/test_shoal_headless.ts still passes.
- M1 Be a fish: click any fish, become it, steer with pointer/touch, eat algae. No death. Headless test of the controller.
- M2 Grow: eat to pass growth stages; size and speed change; being eaten sets back one stage; calm feedback and a stage readout. The world runs normally around you.
- M3 Evolve: at stage thresholds pick traits (cosmetic: color, fin shape, body pattern; abilities: speed, glow, camouflage); visible on the fish; switch back to Aquarium and keep the evolved fish swimming.
- M4 Keepsake: save progress in browser local storage only; one-screen summary; cabinet/itch presentation of both modes. The `build:shoal` and Y8 targets must still build.
Not promised: dates, support, accounts, multiplayer, content updates.

## Review model
TBD, ask Robert. His time per demo varies, so no review cadence is assumed.

## Open questions for Robert
1. Which paths/branches exist (Everything Is Crab style): how many routes, where they split, can paths merge?
2. Exact trait list: which colors, fin shapes, patterns and abilities (speed, glow, camouflage are named); suggest 3 per category to start.
3. Growth stages: how many (suggest 4) and what each looks like.
4. Sound: ambient music and eat/evolve cues, or stay silent beyond the existing mute toggle?
5. Mobile touch controls: drag-to-steer, tap-to-go, or a virtual stick? (Pointer events already used; rotate-hint layout applies.)
6. Cabinet presentation of both modes: one card, two screenshots, genre/tag wording. config.ts currently comments Shoal as "no-player-agency" and tags it `ecosystem-sim`; that text needs updating once Evolve ships.
7. Milestone style (accept the PROPOSED playable slices?) and review model per milestone.
