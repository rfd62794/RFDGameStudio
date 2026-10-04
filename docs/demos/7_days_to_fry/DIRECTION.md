# 7_days_to_fry direction (2026-10-04)

## What it tried to be
"The Line": a kitchen where a crew of autonomous workers runs a burger joint and you set policy, over seven escalating days where each night's shop unlock IS the tutorial (examples/7-days-to-fry/docs/Design.md v4: Vision, "The Real Week" table). Day 1 burgers only; Day 2 Fries; Days 3-4 numeric upgrades; Day 5 coffee for customers; Days 6-7 Soda; Day 7 survived = Week Survived, then an uncapped Tier 2. Intake manifests 2026-08-04 (cb5e5366), source tracked 2026-08-30 (c203df7e). The registry blurb ("a cooking survival game", config.ts:7) comes from the AI Studio title and has never matched the design: a taxonomy-gap comment in config.ts shows the genre was left empty (d17e85fa, 2026-08-23).

## Where it is now
- Sim core is the deepest in the group: sessionLoop.ts 705 lines, steering 522, utility scoring 314; 10,726 ts/tsx lines; tests/lineSimulation.test.ts 4,899 lines, 241/241 per docs/state/current.md (claim, not re-run; Design.md header says 130/130).
- Phases exist: intro, night shop, game over, victory (App.tsx:175; sessionLoop.ts:252-267 sets `victory` after Day 7).
- Design gap, verified by grep: `nightShop.ts` has only buffer, stock, day-duration, brand-recovery and fries purchases; `grep -i soda` over src returns nothing, and there is no customer-coffee unlock. Days 5-7 promise unlocks that do not exist, while IntroScreen.tsx says "New equipment and menu options unlock in the shop as the week goes on".
- No persistence (no localStorage in src); a dead-run restart exists only on game-over/victory (App.tsx:172,176).
- Embed only; tests live under examples/ so `cd ts && npm test` does not run them.
- Card copy is wrong and has no genre; audit flags A3 at the start screen (batch1:27).

## Player experience today vs the target
First 60 s: an intro screen with a "Continue to Night Setup" button, then Day 1 with burgers only: one pipeline, no overload. That is the design's best idea: a built-in tutorial that teaches by what unlocks. Best moment: the Day 2 Fries reveal, a structural purchase after your first shift. Biggest turn-off: the week stops teaching after Day 2 (no Coffee or Soda) so Days 5-7 are the same game turned up, and the card says "survival".

## Verdict
POLISH. 1) Strongest design and sim in the group; the week structure is already the onboarding. 2) The gaps are narrow and named (two unlocks, honest card, save). 3) It is the best candidate here for a Tier B pass, so it should not be spent on a rewrite.

## Replan
1. Honest card and Restart. CUT: "cooking survival" copy and the empty-genre comment hack. ADD: kitchen-sim blurb, genre decision (management-sim), in-frame Restart/New Week on the intro screen. Size S. Verify: `cd ts && npx vitest run tests/test_registry_export.ts` and a blurb test.
2. Finish the week. CUT: nothing. ADD: purchaseCoffeeForCustomers (Day 5) and purchaseSodaUnlock (Day 6-7) in nightShop.ts, order generation rules, tests. Size M. Verify: `cd examples/7-days-to-fry && npx vitest run` shows 241 plus new tests green (controller runs if install blocked).
3. Keep your week. ADD: autosave day/money/unlocks, "Reset save". Size S. Verify: pure-helper test.
4. Phone check of KitchenCanvas (400 lines) at 390x844. Size S, controller step.

## First three directives
1. 7 Days to Fry Tier A: honest blurb, genre, start-screen restart. S. depends-on: none.
2. 7 Days to Fry: Coffee and Soda night-shop unlocks per Design.md. M. depends-on: none.
3. 7 Days to Fry autosave and reset save. S. depends-on: 2.

## Open question for Robert
Embed or TS-native port? SCOPE called a rewrite a Wave 2 candidate (polish spec section 4) and the roadmap notes the `aiBehavior` adapter fit. Recommended default: stay an embed through directive 3; revisit the port only after the tests can run under `cd ts && npm test`.
