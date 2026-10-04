# house_of_kings_collab scope analysis (2026-10-03, Sonnet scope agent, registry status: dev)
Direction: server-authoritative collaborative kingdom management on Firebase: duration-based task tiers, exponential economy, house festivals, real-time Firestore sync, zero-trust client (ts/src/games/house_of_kings_collab/config.ts:6-10; ARCHITECTURE.md:7). Points at an architecture showcase and a multiplayer product, not a quick arcade game.
Working:
- Real backend: Express routes and Firestore rules (server/routes/houseRoutes.ts, taskRoutes.ts; firestore.rules); security rules written down (SECURITY.md:1-25).
- A server test and a regression script exist (ts/tests/test_house_of_kings_server_prod.ts; server/scripts/regression-test.ts); build script exists (ts/package.json:19).
- Live: 0 console errors (docs/state/demo-audit-batch1-2026-10-03.md:40).
Rough:
- Login-gated: the only in-frame control is "Sign In with Google" (not clicked), so no Start/Restart is visible and the public cannot play it (batch1:40, A3 fail; lib/firebase.ts:2,17).
- Blurb is 29 words of jargon ("zero-trust", "Admin SDK writes") for a card (batch1:40).
- 10,792 lines of TS with a 1,937-line VerificationPanel.tsx; Cloud Run/Firebase project dependency (ARCHITECTURE.md:7; SECURITY.md:5-12).
Class: refine - Tier A only; whether to offer a no-login preview is a product call, not a polish item.
Top 3 changes, in order: 1. Make the sign-in screen self-explanatory (what this is, why Google sign-in, what is stored). 2. Rewrite the blurb in plain words. 3. Record A3 as "sign-in gated" in the scorecard if no preview is wanted.
Out of scope: guest/demo mode, new Firebase rules or IAM changes, new game features, moving off Firebase, anything touching real user data.
Dependencies / risks: live Firebase project and GCP IAM (SECURITY.md:5-12); sign-in copy must not imply data practices that were not verified; Firebase config files are in the tree (firebase-applet-config.json) and were not audited.
Effort: S
Open question for Robert: should the public arcade offer this at all without a no-login preview? Evidence shows only a Google sign-in wall (batch1:40); nothing past Tier A is proposed until answered.
