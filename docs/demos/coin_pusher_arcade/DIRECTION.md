# coin_pusher_arcade direction (2026-10-04)
## What it tried to be
An AI Studio export of a physics coin pusher: drops, combos, a reward wheel, special pocket coins, named pressure levels (Neon Entryway, Slate Boulevard...) with push targets, and localStorage meta-progression (examples/coin-pusher-arcade/src/data.ts:182; metadata.json). It was tracked in the intake commit 0f5b08d1 (2026-10-03), then ported to TS-native in one commit, 7a1fd77f (2026-10-04, 20 files, +4,142), as `status: 'dev'` per Port_Coin_Pusher_Arcade_Directive; cd21e099 aligned the config and added data tests. The DemoPortingRoadmap listed it as "Archived, not deployed" (line 76). Drift: the 10-03 SCOPE.md still treats it as unported; it is not. It was registered before anyone asked what it adds beside slime_coin.
## Where it is now
- Registered, dev, no cover; imported through the registry (config.ts:5-14, order 200).
- Playable loop: yes in the port. GameShell, How to Play, mute, level badge, EndStateScreen with restart (App.tsx:296-312,429), meta stats via engine/shared/persistence (App.tsx:60-65).
- Size: 2,465 TS lines under ts/src/games/coin_pusher_arcade (App 563, physics.ts 477, BoardCanvas 425); the directive's 600-line split was met.
- Tests: ts/tests/test_coin_pusher_arcade_logic.ts (446 lines) and _registry.ts (177 lines): data integrity and simple physics, not feel.
- Not done: no title or Start screen (none in App.tsx; the source has none); no `build:coin_pusher_arcade` script (not in ts/package.json:9-21); no phone-width check; no screenshot or cover; metadata.json claims a Gemini capability the source never uses.
- Unverified by me: how it plays; I did not run it.
## Player experience today vs the target
First 60 s: lands directly in a level with no title and no stated goal beyond a push target; How to Play is a modal. Feedback: coin physics, combos, wheel. Progress: levels and meta stats. Way back: shell.
Best moment: a wheel spin after a combo, if the physics feels as good as the data suggests (unverified).
Biggest turn-off: it is a second coin pusher in a 27-card arcade, with no first-screen identity to tell it apart from SlimeCoin (pocket coins, wheel and levels appear in both).
## Verdict
PARK.
1. It duplicates slime_coin's genre and ideas (pocket coins, wheel, rising targets); one coin pusher should be the showcase, and slime_coin is further along (build script, 31 tests, best score).
2. The port is done and cheap to keep; deleting yesterday's work would be wasteful, but promoting it past `dev` would add a card that dilutes "Start here".
3. The decision that matters is a short side-by-side playtest, which needs Robert, not more code.
## Replan
1. Hold (S): ADD nothing; keep status dev and keep it out of "Start here"/home picks; CUT no code. Verify: registry status is dev; card not in the featured list.
2. Only if the playtest says it feels better than slime_coin (M): ADD title/Start screen, `build:coin_pusher_arcade` script and 390 px check; CUT the Gemini claim from metadata.json (unused). Verify: `cd ts && npm run build:coin_pusher_arcade`, Playwright load.
3. Otherwise (S): FOLD its levels/wheel ideas into slime_coin's backlog only if wanted, then RETIRE the tile and leave the source.
## First three directives
1. Coin pusher vs SlimeCoin comparison note: 10 minutes each, 5 questions, one-page verdict - S - none (Claude or Robert, not Devin).
2. Coin Pusher Arcade title screen + build script (only on a "keep") - S - directive 1.
3. Hide coin_pusher_arcade from featured picks until decided - S - redesign D1 order/featured field.
## Open question for Robert
Does coin_pusher_arcade stay beside SlimeCoin? Recommended default: PARK at dev now, decide after one 10-minute playtest of each.
