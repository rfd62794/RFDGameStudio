# voiddrift direction (2026-10-04)
## What it tried to be
The studio's window onto the shipped Rust/Bevy VoidDrift (the paid itch.io release, `VD:docs/roadmap.md:10`; `VD:` = the VoidDrift repo): a no-win idle-mining game, "No win condition. No escape." (`ts/src/games/voiddrift/config.ts:6`). Born as the first external entry: b4cf16e4 (2026-07-10) was a redirect to itch, 840ef227 (same day) swapped it for an inline iframe with an aspect-ratio box and an "Open on itch.io" fallback. It has not drifted; it is the one demo whose real game lives elsewhere, so it is the cabinet's honest bridge to the store.
## Where it is now
- Playable: yes. The Bevy/WASM build loads in the 374 px phone frame (audit batch2, voiddrift row: iframe scrollWidth 374/374).
- Studio code is 16 lines of config (embedUrl `itch.io/embed-upload/17482080`, 960x1300) plus the shared GameLoader embed branch.
- Broken: A1 fails on one third-party console error ("Blocked autofocusing on a <input> in a cross-origin subframe", from itch's voidrift.js). Not our code.
- No studio test, no build script, no cover (redesign spec c4 lists voiddrift among the 8 missing covers).
- Naming: label "VoidRift", gameId/repo "VoidDrift", itch slug "voidrift" (config.ts:5,11).
- History: 6 commits; last real change 2026-08-23 (genre/tags); D1.1 only added `order`.
## Player experience today vs the target
First 60 seconds: a card, an itch loading screen, then the game's own Start. Best moment: drones mining on their own and the first signal-bottle arriving (the game's hook, not ours). Biggest turn-off: a generic grey itch frame with no cover art, so the card does not say "this is a real, sellable game".
## Verdict
POLISH (small, once).
1. It already works and is the studio's proof of shipping.
2. The only gaps are one unfixable third-party error, a missing cover and a spelling.
3. There is nothing to build here; anything bigger belongs to the VoidDrift repo.
## Replan
- Phase 1 (S): classify the cross-origin error as non-failing. CUT: the false A1 FAIL (cannot be fixed from the iframe, GameLoader.tsx:92-97). ADD: an origin filter in the smoke plus one scorecard note. Verify: `cd ts && npm run test` green and the audit row reads PASS.
- Phase 2 (S): identity. CUT: the three spellings. ADD: one display name, a cover from `npm run covers` (spec c4), and a card line "Full game on itch.io". Verify: the hermetic cover-exists test passes; card shows "embed".
- No Phase 3. Do not add studio chrome around the embed; the cabinet's job is the path to itch.
## First three directives
1. Embed smoke ignores third-party frame console errors. S. Depends on: none.
2. Reconcile voiddrift display name and blurb (needs the answer below). S. Depends on: 1 (same scorecard file).
3. Cover and "embed" card text for voiddrift. S. Depends on: the spec's `npm run covers` directive.
## Open question for Robert
VoidDrift or VoidRift? Default: "VoidDrift" for the Rust game and its card (matches repo and README); the itch slug stays unchanged so URLs do not break.
