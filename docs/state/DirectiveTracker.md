<!-- GENERATED FILE — edit ts/src/status/directiveTracker.data.ts, then run ts/tools/generate-directive-tracker.ts -->

# RFD Game Studio — Directive Tracker

*August 16, 2026 | RFD IT Services Ltd. | Generated from `ts/src/status/directiveTracker.data.ts`.*

> **What this tracks:** the real round history of each directive — how many
> rounds it took, what each round caught (fabricated completions, wrong
> hypotheses, partial fixes), and where it ended up. Not a status board
> (see [StatusBoard.md](./StatusBoard.md) for that) — a record of what goes
> wrong and how it gets caught, so the same anti-patterns are visible after
> the session ends.

> **Update trigger:** whenever a submission is verified or found to need
> another round. This is not a new process step — it is writing down
> something that is already happening.

---

## Summary

| Directive | Project | State | Rounds | Fabricated | Wrong Hypothesis | Partial | Correct | Last Updated |
|---|---|---|---|---|---|---|---|---|
| **Early Learning Buddy — voice/speech recognition fix** | Early Learning Buddy | Verified | 3 | 2 | 0 | 0 | 1 | 2026-08-16 |
| **MBB — corner-stuck rendering bug** | Mutant Battle Ball | Verified | 2 | 0 | 1 | 0 | 1 | 2026-08-16 |
| **Planet of Greed — culture stat asymmetry + balance harness** | Planet of Greed | Verified | 3 | 0 | 0 | 2 | 1 | 2026-08-16 |
| **House of Kings Collab — security remediation** | House of Kings: Collab | Closed | 5 | 0 | 1 | 3 | 1 | 2026-08-16 |
| **StatusBoard expansion — stale entries + capability columns + OnboardingGate** | Studio-Wide | Verified | 1 | 0 | 0 | 0 | 1 | 2026-08-16 |
| **VoidDrift Redux — fragment drift correction** | VoidDrift Redux (web) | Verified | 1 | 0 | 0 | 0 | 1 | 2026-08-16 |

---

## Round History

### Early Learning Buddy — voice/speech recognition fix

- **Project:** Early Learning Buddy
- **State:** Verified
- **Total rounds:** 3

| Round | Outcome | Note |
|---|---|---|
| R1 | ✗ Fabricated | Reported completion with zero actual code changes — caught by diff inspection, no files modified. |
| R2 | ✗ Fabricated | Second completion report, again zero diff — claimed speech API wiring but no new imports or function calls added. |
| R3 | ✓ Correct | Real fix landed: actual Web Speech API integration in utils/audio.ts, microphone permission flow, fallback text input for unsupported browsers. |

### MBB — corner-stuck rendering bug

- **Project:** Mutant Battle Ball
- **State:** Verified
- **Total rounds:** 2

| Round | Outcome | Note |
|---|---|---|
| R1 | ✗ Wrong Hypothesis | Wrong root cause: hypothesized NaN propagation / CSS fallback issue. Real cause was a type-mismatch asymmetry between player and opponent roster resolution — opponent roster used different part-slot indexing than player side. |
| R2 | ✓ Correct | Fixed the actual type-mismatch: unified player and opponent roster resolution to use the same PartSlot indexing path. Corner-stuck rendering eliminated. |

### Planet of Greed — culture stat asymmetry + balance harness

- **Project:** Planet of Greed
- **State:** Verified
- **Total rounds:** 3

| Round | Outcome | Note |
|---|---|---|
| R1 | ◐ Partial | Initial stat values implemented (houseStats.ts) and wired into all mechanics. Balance harness (60-game simulation) showed Ember and Tundra dominating — Ember too aggressive, Tundra too passive. |
| R2 | ◐ Partial | Tuning round: reduced Ember fort max to 2, removed Tundra expand cost penalty and added income bonus, reduced Tide transit penalty. Harness re-run showed improved spread but Tide still underperforming. |
| R3 | ✓ Correct | Final tuning: boosted Tundra (cheaper fortify 10k, income 12k, opinion 55) and Tide (income 14k). 60-game harness confirmed no House dominates — win-rate spread within acceptable bounds. Mirror-pair test updated to match. |

### House of Kings Collab — security remediation

- **Project:** House of Kings: Collab
- **State:** Closed
- **Total rounds:** 5

| Round | Outcome | Note |
|---|---|---|
| R1 | ◐ Partial | Initial Firestore rules audit — identified client-side write paths bypassing auth checks. Rules tightened but missed collection-level read exposure. |
| R2 | ✗ Wrong Hypothesis | Attempted fix by adding blanket read rules — overcorrected, exposed user data across tenants. Caught by security review before deploy. |
| R3 | ◐ Partial | Reverted to per-document auth checks. Fixed tenant isolation but left server-side validation gap in bundle.js. |
| R4 | ◐ Partial | Server-side validation added. ARCHITECTURE.md and SECURITY.md written. Final penetration check found one remaining XSS vector in request handling. |
| R5 | ✓ Correct | XSS vector patched, input sanitization hardened across all server endpoints. Full security remediation arc closed. |

### StatusBoard expansion — stale entries + capability columns + OnboardingGate

- **Project:** Studio-Wide
- **State:** Verified
- **Total rounds:** 1

| Round | Outcome | Note |
|---|---|---|
| R1 | ✓ Correct | Single-pass build: refreshed 15+ stale entries, added 7 missing games (Gladiator Arena, Early Learning Buddy, Chimera Wilds, ScrapCrawl, Slime Coin, Horse Racing, Slither Rogue), added 4 capability columns with grep-confirmed audits, built OnboardingGate.tsx, refactored Planet of Greed to consume it, updated all 33 shell opening tests. Clean compile, 1403/1406 tests pass (3 pre-existing failures). |

### VoidDrift Redux — fragment drift correction

- **Project:** VoidDrift Redux (web)
- **State:** Verified
- **Total rounds:** 1

| Round | Outcome | Note |
|---|---|---|
| R1 | ✓ Correct | FRAGMENT_DRIFT_RATE (18 px/sec gravitational pull toward center) implemented in engine.ts:268. Untargeted fragments now drift inward and convert to Ring 1 asteroids on crossing the boundary. Auto-dispatch FSM with manual toggle confirmed working. |

---

*Legend: ✓ Correct · ✗ Fabricated / Wrong Hypothesis · ◐ Partial*