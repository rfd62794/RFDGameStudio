# house_of_kings_collab direction (2026-10-04)

## What it tried to be
A shared, server-authoritative kingdom builder: Firebase Auth + Firestore, Cloud Run, visit-triggered daily evaluation, house festivals, a Game Master tab (ARCHITECTURE.md:1-37). It grew from 2026-08-15 (767b8ca1 backend deps) through a month of server plumbing: CORS, Express 5 routes, cache-bust Dockerfile, a 355k-line production bundle (5072f96d), Google-only sign-in (a177db10), GameShell adoption (882c3d6b), TS-error cleanup (9535c6d3). Intent drifted from "a game" to "a reference architecture": ARCHITECTURE.md calls itself a "Reusable Pattern Reference & Engineering Handbook". The last commits (9fa49399, 2026-10-04) made it an honest showcase with a fail-closed admin gate (lib/adminGate.ts).

## Where it is now
- Signed-out players see `LandingPage.tsx` (203 lines, via AuthModal) with Google sign-in only; the SCOPE.md suggestion of a signed-out info screen already exists. Nothing past the gate is reachable without an account and a backend; whether Cloud Run is deployed is unverifiable from the repo.
- Real server: 6 route files, 2 evaluators, firestore.rules, Dockerfile, tests (test_house_of_kings_server_prod.ts, _admin_gate.ts, _blurb.ts). Size: 10,802 ts/tsx lines excluding the bundle.
- `server/bundle.js` is 250,795 lines / about 12 MB committed, copied by the Dockerfile (Dockerfile:6); a generated artifact in source control.
- Player-visible dev-speak: footer "House of Kings: Collab - Phase 1 First Real Content (August 2026)" (App.tsx footer, line 288).
- Card blurb is honest: "may only see the sign-in screen" (config.ts), status `dev`, genre `cooperative`.
- Audit: A1 pass, A3 fails at the gate (batch1:40).

## Player experience today vs the target
First 60 s: a themed landing page and a "Sign in with Google" button, then nothing a visitor can do. Best moment: the landing page itself, which at least tells you what the game is. Biggest turn-off: the only action is a login to a service that may not exist, on a card in a game arcade; it fails the "first action in 60 s" test by design.

## Verdict
PARK. 1) The settled decision (architecture showcase, no public hosting) means it will never be a playable game, so a game card is the wrong container. 2) A multiplayer game needs hosting, moderation and a Game Master: not solo scale. 3) Its value is the architecture, which is better served by a write-up than by a dead login.

## Replan
1. Park cleanly. CUT: the 12 MB generated bundle from git (reason: artifact; rebuild in the Dockerfile via a script) and the dev footer. ADD: `.gitattributes` generated marker if the bundle stays. Size S. Verify: `git ls-files ts/src/games/house_of_kings_collab | grep bundle` empty, or the marker present; `cd ts && npx vitest run tests/test_house_of_kings_*` green.
2. Make the landing page the exhibit. ADD: a static "How it works" section on LandingPage rendering the visit-triggered evaluation diagram from ARCHITECTURE.md plus a link to the write-up; no backend needed. Size S. Verify: screenshot signed-out at 1280 and 390; blurb test passes.
3. Classify it. ADD: a `showcase` marker so it is excluded from "N games" and "Start here" (redesign counts block). URL stays. Size S. Verify: counts test.
Not proposed: hosting, Cloud Run, moderation, a signed-out demo mode with fake data (that would be a rewrite).

## First three directives
1. HoK Collab: untrack or mark the generated bundle, drop the dev footer. S. depends-on: none.
2. HoK Collab: "How it works" exhibit on the landing page from ARCHITECTURE.md. S. depends-on: none.
3. Showcase marker excluded from published count. S. depends-on: studio-redesign D0.3.

## Open question for Robert
None; this follows your settled showcase decision. One line: the card still sits in the game grid as `dev`, which sits oddly with "no public hosting"; the replan moves it out of the game counts, not off the URL.
