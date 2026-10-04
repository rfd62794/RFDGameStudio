# house_of_kings_collab scope analysis (2026-10-03, Sonnet scope agent, registry status: dev)
Direction: multiplayer, server-authoritative kingdom game on Firebase Auth + Firestore with a Cloud Run backend (config.ts:7; ARCHITECTURE.md:1-9; SECURITY.md). Google sign-in gates everything (App.tsx:293-294); a Game Master tab keys off an admin email (App.tsx:181).
Working:
- Real server design: visit-triggered daily evaluation, Admin SDK writes, firestore.rules, server/Dockerfile and server/functions/ (ARCHITECTURE.md:11-37).
- `build:house_of_kings_collab` exists (ts/package.json:19); server test ts/tests/test_house_of_kings_server_prod.ts; M2.1 TS-errors directive Done.
- Audit batch1:40: shell loads, 0 errors, only "Sign In with Google" visible.
Rough:
- Backend-dependent: client calls `${API_BASE}/api/...` where API_BASE is VITE_HOK_API_BASE or '' (services/api.ts:5-7,71); on the static arcade '' hits the same origin. Whether a Cloud Run service is deployed was not checked (not readable from the repo).
- Audit A3 fails at the gate (batch1:40,74); nothing past login has been tested by anyone without an account.
- Admin fallback is the owner's personal email in client code (App.tsx:181); the blurb is 29 words of jargon ("zero-trust", "Admin SDK", config.ts:7; audit batch1:60).
Class: rework - a hosted multiplayer service needs hosting, auth and moderation that a solo owner may not want to run; keep, gate or retire is not decidable from the repo.
Top 3 changes, in order (baseline Tier A only): 1. Player-facing blurb that says "sign-in required" (A5). 2. Admin email from env only, no hardcoded fallback (App.tsx:181, .env.example). 3. A signed-out info/Start screen ahead of AuthModal (A3).
Out of scope: anything past Tier A: backend deploy, new economy/features, scaling, moderation, replacing Firebase.
Dependencies / risks: Firebase project and Cloud Run costs/quotas (lib/sparkLimits.ts exists); personal Google account; support burden of a public multiplayer game.
Effort: S (Tier A only)
Open question for Robert: Should this be a hosted public multiplayer game (Cloud Run + Firestore, sign-in, you as Game Master), a showcase of the architecture only, or retired from the arcade? Nothing past Tier A is proposed until you answer.
Decision 2026-10-04 (Robert approved the PARK verdict in docs/demos/house_of_kings_collab/DIRECTION.md): architecture showcase, no public hosting, no further polish.
Tier B, Tier C, phone-layout and first-60-seconds checks: N/A (parked showcase). Only Tier A honesty items apply; the URL stays.
