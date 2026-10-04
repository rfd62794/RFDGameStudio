# trinity_siege direction (2026-10-04)
## What it tried to be
Two ideas share this id. The board row implies a three-faction siege on a Rust/Bevy-or-egui chassis (never built here) and still reads "Bevy vs. egui architecture question left unresolved", status `status_unconfirmed` (`ts/src/status/board.data.ts:120-123`, last updated 2026-08-15, and `docs/DIRECTION.md:52`). What actually exists is an AI Studio hex-ring wave defense: shape counters, race leans, persistent fortifications, 5 waves, 15 lives (`examples/trinity-siege/metadata.json`; `src/types.ts`). It was embedded as a same-origin iframe on 2026-07-10 (`e40954be`) and its source tracked 07-11 (`6b7c2b09`). Intent drifted from a Rust faction-combat chassis to a small browser tower-defense; the board row never caught up.
## Where it is now
- Embed at `/arcade/trinity_siege/`; status `external`; 2,285 lines of ts/tsx (App 687, HexRingBoard 429, combat 353).
- Tier A landed in `d6b3fb98`: player-facing blurb (no more "LEAST-VERIFIED ... fabricated combat logic"; guarded by `test_trinity_siege_blurb.ts`) and phone overflow fix. Overflow not re-measured (was 370 vs 358 px).
- Plays end to end: FORECAST phase then resolve, won/lost states, a restart that resets gold, lives and wave (`App.tsx:35,72`).
- Combat is a shape-matrix lookup, `SHAPE_MATRIX[def.shape][attackerShape]` (`combat.ts:17-27`): a rock-paper-scissors table with race modifiers. The "fabricated logic" worry is unverified; nobody has tested `combat.ts`.
- No unit tests for the sim; the README is the generic AI Studio one.
- Overlaps choke_point (both are wave defense) but differs in kind: hex ring and counters vs grid and intent previews.
## Player experience today vs the target
First 60 s: a hex board, a forecast of incoming shapes, place counters, resolve. Best moment: the forecast phase, where reading the incoming wave and choosing the right counter is the game. Biggest turn-off: five waves of a lookup table (a short session) give no sense of why a counter beat a shape; the board row's "unconfirmed" state means nobody has vouched for it. Progress: wave counter only. Way back: shell control and Force Reset.
## Verdict
**POLISH.**
1. The forecast-then-counter loop is a clear, finished idea at the right size for a shelf toy.
2. The one real risk is an unvouched combat table; a unit test closes it cheaply.
3. It does not earn REDESIGN: it is an embed, and settled rules cap embeds at small edits.
## Replan
1. Vouch for it (S). ADD: unit tests for `selectBestDefender` and battle resolution (matrix symmetry, race lean bounds, a winnable wave 5). CUT: the stale board row text, replace with the real status (board.data.ts, one line, reason: it describes a different, unbuilt game). Verify: `cd ts && npx vitest run tests/test_trinity_siege_*`.
2. Explain the result (S-M). ADD: after each resolve, one line saying why the counter won ("shape A countered shape B, x multiplier"); a 3-line first-wave hint. CUT: nothing else. Verify: screenshot of the resolve log; phone 390x844 no overflow.
3. Frame (S). ADD: cover screenshot and "embed" label. Verify: A5, A8 smoke.
## First three directives
1. trinity_siege: combat unit tests plus correct its status-board row. S. Depends: none.
2. trinity_siege: "why it won" line per resolve and first-wave hint, in `examples/trinity-siege/src`. S. Depends: 1.
3. trinity_siege: phone re-measure and cover screenshot. S. Depends: none.
## Open question for Robert
None. Default: the Rust three-faction chassis stays Far Future (the board's own note); only the TS embed is maintained.
