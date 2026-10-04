# House of Kings: Collab Tier A polish: architecture-showcase blurb and fail-closed admin gate

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/house_of_kings_collab/SCOPE.md`, `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (Tier A, items A1-A8),
`ts/src/games/house_of_kings_collab/config.ts`, `ts/src/games/house_of_kings_collab/App.tsx` (lines 1-20 and 178-185 only),
`ts/src/games/house_of_kings_collab/components/Header.tsx` (lines 1-25 only), `ts/tests/test_trinity_siege_blurb.ts` (pattern for the blurb test).

## 1. Why this exists

House of Kings: Collab is a server-authoritative multiplayer kingdom game on Firebase Auth, Firestore and a Cloud Run backend; Google sign-in
gates everything. Robert's decision (2026-10-04): it is an ARCHITECTURE SHOWCASE, not a hosted public game. No public-hosting work. Two Tier A
gaps from `docs/demos/house_of_kings_collab/SCOPE.md`:
- The blurb (`description` in `ts/src/games/house_of_kings_collab/config.ts`, line 7) is 29 words of jargon ("zero-trust", "Admin SDK") and
  never says sign-in is required (A5).
- The client has a hard-coded admin fallback that is the owner's personal email address. It is in two client files, the same pattern in both:
  - `ts/src/games/house_of_kings_collab/App.tsx` line 181: `const adminEmail = env.VITE_ADMIN_EMAIL || '<the personal email literal>';`
  - `ts/src/games/house_of_kings_collab/components/Header.tsx` line 20: `const adminEmail = (import.meta as any).env?.VITE_ADMIN_EMAIL || '<the personal email literal>';`

  (The address is deliberately not copied into this directive. Read lines 181 and 20 yourself. The quoted lines above show their shape; the
  literal in the file is a real address, shown here as a placeholder.) Each is followed by a line that gates the Game Master tab:
  `const showAdminTab = !!user?.email && user.email.toLowerCase() === adminEmail.toLowerCase();` (App.tsx line 182, Header.tsx line 21).
  Today an unset `VITE_ADMIN_EMAIL` silently falls back to the owner's address: it should fail closed.

## 2. Scope

Copied from `docs/demos/house_of_kings_collab/SCOPE.md`.

Top 3 changes, in order (baseline Tier A only): 1. Player-facing blurb that says "sign-in required" (A5). 2. Admin email from env only, no hardcoded fallback (App.tsx:181, .env.example). 3. A signed-out info/Start screen ahead of AuthModal (A3).

Out of scope: anything past Tier A: backend deploy, new economy/features, scaling, moderation, replacing Firebase.

Narrowed to Robert's decision (showcase only):
1. A plain player-facing blurb that says Google sign-in is required (A5).
2. Remove the personal-email fallback in the two client files above; the admin-gated UI fails closed when no admin email is configured.
3. NOT in this run: the signed-out info screen (A3), any public-hosting or backend work, and the server/example files listed in section 4.

## 3. The work

Files edited use CRLF line endings; keep them (the Edit tool preserves them). Do not convert.

**Step 1: new small module** `<!-- new: ts/src/games/house_of_kings_collab/lib/adminGate.ts -->` (under 30 lines, no imports):
```
export function isAdminUser(
  userEmail: string | null | undefined,
  configuredAdminEmail: string | undefined,
): boolean {
  const admin = (configuredAdminEmail ?? '').trim().toLowerCase();
  if (!admin) return false; // no admin configured: fail closed
  const user = (userEmail ?? '').trim().toLowerCase();
  return user !== '' && user === admin;
}
```

**Step 2: App.tsx.** Add `import { isAdminUser } from './lib/adminGate';` directly after line 11 (`import { AdminPanel } from './components/AdminPanel';`).
Then replace the two lines (181-182 before the import shifts them by one) `const adminEmail = ...` and `const showAdminTab = ...` with the single line:
```
  const showAdminTab = isAdminUser(user?.email, env.VITE_ADMIN_EMAIL);
```
`env` is already defined at line 16 of the file (`const env = import.meta.env as Record<string, string | undefined>;`). `adminEmail` is not used anywhere else in the file (confirmed by grep).

**Step 3: components/Header.tsx.** Add `import { isAdminUser } from '../lib/adminGate';` after the line `import { User as FirebaseUser } from 'firebase/auth';` (line 3). Replace the two lines `const adminEmail = ...` and `const showAdminTab = ...` (lines 20-21 before the import shifts them) with:
```
  const showAdminTab = isAdminUser(user?.email, (import.meta as any).env?.VITE_ADMIN_EMAIL);
```
`adminEmail` is not used elsewhere in that file.

**Step 4: blurb.** In `config.ts` replace ONLY the `description` value (line 7) with:
```
  description: 'Architecture showcase, not a hosted game: a server-authoritative kingdom builder on Firebase, with daily server-side evaluation and festivals. Google sign-in is required to play, and it needs its own backend, so you may only see the sign-in screen.',
```
Leave `label`, `status: 'dev'`, `genre`, `tags` and `component` unchanged.

**Step 5: tests.** Create `<!-- new: ts/tests/test_house_of_kings_admin_gate.ts -->` importing `isAdminUser` from `../src/games/house_of_kings_collab/lib/adminGate`
(a pure module; do not import `App.tsx`). Use ONLY the placeholder `admin@example.com` and `player@example.com`. Tests (name the cases):
- returns false when the configured admin email is `undefined`, even for a signed-in user.
- returns false when the configured admin email is `''`, and when it is `'   '`.
- returns true when the user email equals the configured one, ignoring case and surrounding spaces.
- returns false for a different user email, for `null` and for `undefined` user email.

Create `<!-- new: ts/tests/test_house_of_kings_blurb.ts -->`, modelled on `ts/tests/test_trinity_siege_blurb.ts` (import `config` from `../src/games/house_of_kings_collab/config`):
`gameId` is `house_of_kings_collab`; description is 60 words or fewer; no markers `LEAST-VERIFIED`, `fabricated`, `TODO`, `TBD`; description contains `sign-in is required`;
description does NOT contain `zero-trust` or `Admin SDK` (case-insensitive). Do not write any real email address into any test or file.

## 4. What NOT to do

- Do NOT write the personal email address into this directive's output, any file, any commit message, any test, or the Status row. Refer to it as "the personal email literal at App.tsx:181".
- Do not touch these other places that also carry that address: `ts/src/games/house_of_kings_collab/.env.example` (lines 12-13), `ts/src/games/house_of_kings_collab/server/middleware/verifyAuth.ts` (line 47, the server-side fallback) and `ts/src/games/house_of_kings_collab/server/bundle.js` (generated). They are the controller's follow-up: list them by path (never the value) in your report.
- Do not do hosting, deploy, Firebase or Cloud Run work; do not edit `firestore.rules`, `server/`, `firebase-*.json` or `ts/vite.house_of_kings_collab.config.ts`.
- Do not add a signed-out Start screen, new features, economy changes, or rewrite `AuthModal`.
- Do not edit `docs/children.json` or the parity snapshot (no registry source changes here).
- Do not rebuild or deploy: that is Robert's. Do not touch protected repos.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified on this machine: `Python 3.12.12`).

Tests (the single sanctioned compound line, from the worktree root):
```
cd ts && npx vitest run test_house_of_kings_admin_gate.ts test_house_of_kings_blurb.ts
```
Expected: 2 files passed. For reference, the same command form on `test_arcade_manifest.ts test_voiddrift_redux_chrome.ts` gave
`Test Files  2 passed (2)`, `Tests  14 passed (14)`.

Regression sanity (same form): `cd ts && npx vitest run test_registry_export.ts test_arcade_manifest.ts`. Expected: all passed.

Source checks (Grep tool, one call each, no shell):
- Pattern `gmail` over `ts/src/games/house_of_kings_collab/App.tsx` and `ts/src/games/house_of_kings_collab/components/Header.tsx`: no matches.
- Pattern `isAdminUser` appears in `App.tsx` (import + one use) and `ts/src/games/house_of_kings_collab/components/Header.tsx` (import + one use).
- Pattern `adminEmail` over those two files: no matches.

Not runnable in this run: a browser check of the signed-out screen, Firebase.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line `cd ts && npx vitest run <bare-filename>.ts [<bare-filename>.ts]`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use bare test filenames as filters (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file (apart from the redacted literal), STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Do not run `agentflow lint` or any agentflow command. Do NOT run `uv run python -m studio.demos index`.
- New logic goes in small new modules (SRP/KISS): `ts/src/games/house_of_kings_collab/lib/adminGate.ts` is the only new module. No file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] `ts/src/games/house_of_kings_collab/lib/adminGate.ts` exists and fails closed when no admin email is configured.
- [ ] `App.tsx` and `ts/src/games/house_of_kings_collab/components/Header.tsx` use `isAdminUser`; the `gmail` grep over both files finds nothing; `adminEmail` is gone from both.
- [ ] `config.ts` description is the new blurb (says sign-in is required; no jargon); nothing else in that file changed.
- [ ] Both new test files exist and `cd ts && npx vitest run test_house_of_kings_admin_gate.ts test_house_of_kings_blurb.ts` passes (real tail pasted).
- [ ] No file outside those named above changed; no email address written anywhere.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: what changed per file, whether any quoted line differed from the file. Evidence second: real tails of `uv run python --version`,
the vitest commands and the `gmail` grep. Then list, by path only (never the value), the remaining places that carry the personal email
(`.env.example`, `ts/src/games/house_of_kings_collab/server/middleware/verifyAuth.ts` server-side fallback, `ts/src/games/house_of_kings_collab/server/bundle.js`) as controller follow-ups. State what was not run
(browser, Firebase) and that rebuilding and deploying the embed is Robert's.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; writing the personal email into any file; editing `server/`, `.env.example`, `firestore.rules` or `docs/children.json`.

## Required from User

none. Deploying and rebuilding the embed is Robert's, after review.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-polish-house-of-kings-collab-tier-f00032 |
| Base branch | - |
| Base commit | a05b6267054158d7a3c9dd9b57dfcf8cfefd3020 |

**Status log**
- 2026-10-04 · claude · none → Queued — wave 2a Tier A directive from docs/demos/house_of_kings_collab/SCOPE.md (Robert 2026-10-04: architecture showcase)
- 2026-10-04 08:34 · robert-claude-laptop · Queued → Approved — lint override: errors are files the run creates (lib/adminGate.ts and two tests), marked new; author's dispatch lint gave 0 errors; this queue MCP process may still run pre-fix lint
- 2026-10-04 08:50 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-polish-house-of-kings-collab-tier-f00032; lane=default; model=swe-2-high; persona=steady-builder
<!-- queue:end -->
