# voiddrift scope analysis (2026-10-03, Sonnet scope agent, registry status: external, itch embed)
Direction: the native Rust/Bevy VoidDrift shown as an itch.io embed: mining sim at the edge of a black hole, "No win condition. No escape." (ts/src/games/voiddrift/config.ts:6,11-14). A finished shipped product, not a work in progress here; the TS-native sibling is voiddrift_redux (voiddrift_redux/config.ts:6).
Working:
- Loads from https://itch.io/embed-upload/17482080 at 960x1300 (config.ts:12-14); 0 failed requests (docs/state/demo-audit-batch2-2026-10-03.md:29).
- Source of truth lives in C:\Github\VoidDrift (README/docs/DIRECTION.md:7-14 there; premium itch title); nothing to build in this repo.
- Shell page shows a Start button and the embed's own "NEW GAME" is visible in the screenshot (batch2:29).
Rough:
- 1 console error from the embedded page ("Blocked autofocusing on a <input> element in a cross-origin subframe", itch voidrift.js) and 5 warnings (batch2:29): third-party, not fixable here.
- Restart cannot be read across the cross-origin iframe, so A3 is unverifiable by script (batch2:29); no dedicated tests, no build script (batch2:29).
- Phone fit of a 960x1300 embed in a 374x210 frame was not exercised (audit batch1:73 finding 5 describes the frame).
Class: refine - Tier A only for an external embed (polish standard rule 3); the product itself is out of this repo.
Top 3 changes, in order: 1. Record A1/A3 as "third-party embed, verified by eye" in the scorecard instead of failing it. 2. Check the 960x1300 embed at 390x844 and set a sane embed size if it clips. 3. Confirm the card says "embed" (A8).
Out of scope: any change to the Rust/Bevy game, the web renderer, itch store settings or pricing, new builds, replacing the embed with voiddrift_redux.
Dependencies / risks: depends on itch.io hosting and an uploaded build (externalUrl config.ts:11); the shell warning from cabinet.js:54 is shared by every demo.
Effort: S
Open question for Robert: none
