# facility_escape: say "stealth puzzle", not "prototype validation" (S)

**Depends on:** none.
**Read first** (everything this run needs is pasted below; these are the files to open):
`examples/facility-escape/src/App.tsx`, `ts/tests/test_facility_escape_blurb.ts` (the sibling test for the registry blurb), `docs/demos/facility_escape/DIRECTION.md` (verdict POLISH, Replan step 1).

## 1. Why this exists

Facility Escape is a solver-validated stealth-puzzle generator shipped as an honest embed. Tier A already fixed the registry blurb and the import-time self-test; the page a player sees still talks like a lab report ("tells players they are testing, not playing").
Measured on origin/main `889dd21e` (2026-10-04) by Grep on `examples/facility-escape/src/App.tsx`: the header badge `MECHANICS PROTOTYPE` (line 543), the subtitle `Turn-Based Property Rule Simulator v1.0.2`, the start-screen text `A system test of emergent physical behaviors and telecasted sightlines.`, the heading `Mission Briefing & Core Objectives` with the line `to validate the escape mechanisms`, the bullets `The Core Turn Loop` / `The Property System` / `No Hardcoded Lookups`, the in-run button `RESET PROTOTYPE ATTEMPT`, the win card stats `TOTAL CONTAINMENTS CLEARED`, `TOTAL TURNS ELAPSED`, `SURVIVING OPERATIVE INTEGRITY`, the win text `PROTOTYPE VALIDATION SUCCESSFUL` with its paragraph, the button `REPLAY VALIDATION EXPERIMENT`, and the footer `Facility Escape Security Sandbox. Built for Google AI Studio Build.`
Already fine, do not change: the room counter (`Room {gameState.roomNumber}/{MAX_ROOMS}` at about line 577) and the win card already show room and turn counts. (The direction note that they are missing is stale.)

## 2. Scope

1. `examples/facility-escape/src/App.tsx`: the 17 string replacements below, nothing else.
2. New test `<!-- new: ts/tests/test_facility_escape_player_copy.ts -->`.

## 3. The work

`App.tsx` uses CRLF; keep it. Replace each string exactly (each occurs once; the Edit tool will tell you if not):

| Find | Replace with |
|---|---|
| `MECHANICS PROTOTYPE` | `STEALTH` |
| `Turn-Based Property Rule Simulator v1.0.2` | `Turn-based stealth puzzle` |
| `A system test of emergent physical behaviors and telecasted sightlines.` | `Read the guards' sightlines, then slip past.` |
| `Mission Briefing & Core Objectives` | `HOW TO PLAY` |
| `to validate the escape mechanisms.` | `to reach the exit of each room and escape.` |
| `The Core Turn Loop` | `Guards show their move first` |
| `The Property System` | `Items and hazards` |
| `No Hardcoded Lookups` | `One rule, many uses` |
| `RESET PROTOTYPE ATTEMPT` | `START OVER` |
| `TOTAL CONTAINMENTS CLEARED:` | `ROOMS CLEARED:` |
| `TOTAL TURNS ELAPSED:` | `TURNS TAKEN:` |
| `SURVIVING OPERATIVE INTEGRITY:` | `HEARTS LEFT:` |
| `PROTOTYPE VALIDATION SUCCESSFUL` | `Nice work, you got out` |
| `The five universal interaction rules (Flammable, Conductive, Loud, Reflective, Adhesive) have successfully enabled emergent, non-memorized puzzle solutions across procedural rooms!` | `You read every guard and used each room's items to escape. Try again for a different set of rooms.` |
| `REPLAY VALIDATION EXPERIMENT` | `PLAY AGAIN` |
| `Remember to utilize telecasted sightlines and the property-based physics system. Place mirrors` | `Tip: watch the guards' sightlines. Place mirrors` |
| `© 2026 Facility Escape Security Sandbox. Built for Google AI Studio Build.` | `Facility Escape` |

Do not change any code, comment, variable name, class name or any other string. (Comments such as `Active Sandbox Gameplay Screen` are not player-visible; the test ignores comments.)

**Test `ts/tests/test_facility_escape_player_copy.ts`.** Create it with exactly this content:

```ts
// new: ts/tests/test_facility_escape_player_copy.ts
// Source-text guard: the embed's player-visible copy carries no lab language.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Comments are not player-visible: drop JSX comments and whole-line // comments before checking.
const app = readFileSync(
  resolve(import.meta.dirname, '../../examples/facility-escape/src/App.tsx'),
  'utf8',
)
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/^\s*\/\/.*$/gm, '');

describe('facility_escape player-facing copy', () => {
  it('has none of the lab-language terms', () => {
    for (const term of ['prototype', 'validation', 'simulator', 'sandbox', 'telecast', 'property-based', 'hardcoded', 'google ai studio']) {
      expect(app.toLowerCase(), term).not.toContain(term);
    }
  });
  it('uses the plain labels', () => {
    for (const label of ['STEALTH', 'START OVER', 'PLAY AGAIN', 'ROOMS CLEARED', 'HOW TO PLAY']) {
      expect(app, label).toContain(label);
    }
  });
});
```

## 4. What NOT to do

- No change to the solver, room generator, guard AI, physics engine or turn engine (`utils/*.ts`), or to `types.ts`, `components/*`. No new rooms or mechanics, no TS-native port (settled: embed stays an embed).
- No change to `ts/src/games/facility_escape/config.ts` (its blurb is already player-facing and has its own test).
- Do not add the turn-one hint here (next directive). Do not reformat the file.
- No deploys, no protected repos, no player-layer or cloud-save work.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x`. Verified on this machine: `Python 3.12.12`.

Baseline, before editing (the new test against origin/main `889dd21e`, verified 2026-10-04):
```
cd ts && npx vitest run test_facility_escape_player_copy.ts
```
Real tail: `Test Files  1 failed (1)` / `Tests  2 failed (2)` (first assertion error: `prototype: expected ... not to contain 'prototype'`).

After editing, the same command. Real tail from a prototype of exactly this table (2026-10-04): `Test Files  1 passed (1)` / `Tests  2 passed (2)`.
Regression check: `cd ts && npx vitest run test_facility_escape_blurb.ts` gives `Test Files  1 passed (1)` / `Tests  4 passed (4)`.

Source check (Grep tool, one call, case-insensitive): `examples/facility-escape/src/App.tsx` has no match for `PROTOTYPE`.

The example app has no `node_modules` in a fresh worktree, so its own build cannot run here; the test is the gate.

**Controller finish (after merge):** rebuild the embed, then take the win-card screenshot and a 390x844 phone screenshot (A4/A5). Browser steps, not part of this run.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>.ts`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Do not run `agentflow lint` or any agentflow command. Do NOT run `npm run build:*`, `vite-node` or
  `uv run python -m studio.demos index` (the sandbox refuses them; the controller runs builds and exporters after merge, see Controller finish).
  Do not use `npx tsc` as a check: in a fresh worktree it reports unrelated errors about the gitignored `game-metadata.json`.
- Do not run `git merge origin/main`. If you need to know whether main moved, use `git fetch origin` then `git rev-list --count HEAD..origin/main`.
- Files you edit use CRLF line endings; keep them (the Edit tool preserves them). New files may use either; use CRLF to match.
- New behaviour goes in small new modules (SRP/KISS); no file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] All 17 replacements applied; no `PROTOTYPE`, `validation`, `simulator`, `sandbox`, `telecast`, `property-based`, `hardcoded` or `google ai studio` left outside comments.
- [ ] `ts/tests/test_facility_escape_player_copy.ts` exists as above; `cd ts && npx vitest run test_facility_escape_player_copy.ts` shows 2 passed (real tail pasted).
- [ ] `cd ts && npx vitest run test_facility_escape_blurb.ts` still passes (real tail pasted).
- [ ] No file outside the two in Scope changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: the 17 replacements applied (count) and anything that did not match as quoted. Evidence second: real tails. Recommended action: review, merge, then `Facility_Escape_First_Turn_Hint_Directive`.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`; adding Lua code or changing the engine; any player-layer or save-to-cloud work.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Approved |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 13:15 · robert-claude-laptop · none → Queued
- 2026-10-04 14:22 · robert-claude-laptop · Queued → Approved — lint override: lint false positives (verified; fix in AgentFlow PR #534); author ran baseline+after proofs; Robert 2026-10-04 approved all recommendations
<!-- queue:end -->
