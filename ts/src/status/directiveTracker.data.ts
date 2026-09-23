import type { DirectiveEntry } from './directiveTypes';

/**
 * Real directive history — backfilled from tonight's session (Aug 16 2026).
 *
 * Each entry records the real rounds a directive went through, including
 * fabricated completions, wrong hypotheses, and partial fixes. This is
 * not a status board — it's a record of what went wrong and how it was
 * caught, so the same anti-patterns are visible after the session ends.
 *
 * Update trigger: whenever a submission is verified (or found to need
 * another round). This is not a new process step — it's writing down
 * something that's already happening.
 */
export const DIRECTIVE_TRACKER: DirectiveEntry[] = [
  {
    name: 'Early Learning Buddy — voice/speech recognition fix',
    project: 'Early Learning Buddy',
    state: 'verified',
    lastUpdated: '2026-08-16',
    rounds: [
      {
        roundNumber: 1,
        outcome: 'fabricated',
        note: 'Reported completion with zero actual code changes — caught by diff inspection, no files modified.',
      },
      {
        roundNumber: 2,
        outcome: 'fabricated',
        note: 'Second completion report, again zero diff — claimed speech API wiring but no new imports or function calls added.',
      },
      {
        roundNumber: 3,
        outcome: 'correct',
        note: 'Real fix landed: actual Web Speech API integration in utils/audio.ts, microphone permission flow, fallback text input for unsupported browsers.',
      },
    ],
  },
  {
    name: 'MBB — corner-stuck rendering bug',
    project: 'Mutant Battle Ball',
    state: 'verified',
    lastUpdated: '2026-08-16',
    rounds: [
      {
        roundNumber: 1,
        outcome: 'wrong-hypothesis',
        note: 'Wrong root cause: hypothesized NaN propagation / CSS fallback issue. Real cause was a type-mismatch asymmetry between player and opponent roster resolution — opponent roster used different part-slot indexing than player side.',
      },
      {
        roundNumber: 2,
        outcome: 'correct',
        note: 'Fixed the actual type-mismatch: unified player and opponent roster resolution to use the same PartSlot indexing path. Corner-stuck rendering eliminated.',
      },
    ],
  },
  {
    name: 'Planet of Greed — culture stat asymmetry + balance harness',
    project: 'Planet of Greed',
    state: 'verified',
    lastUpdated: '2026-08-16',
    rounds: [
      {
        roundNumber: 1,
        outcome: 'partial',
        note: 'Initial stat values implemented (houseStats.ts) and wired into all mechanics. Balance harness (60-game simulation) showed Ember and Tundra dominating — Ember too aggressive, Tundra too passive.',
      },
      {
        roundNumber: 2,
        outcome: 'partial',
        note: 'Tuning round: reduced Ember fort max to 2, removed Tundra expand cost penalty and added income bonus, reduced Tide transit penalty. Harness re-run showed improved spread but Tide still underperforming.',
      },
      {
        roundNumber: 3,
        outcome: 'correct',
        note: 'Final tuning: boosted Tundra (cheaper fortify 10k, income 12k, opinion 55) and Tide (income 14k). 60-game harness confirmed no House dominates — win-rate spread within acceptable bounds. Mirror-pair test updated to match.',
      },
    ],
  },
  {
    name: 'House of Kings Collab — security remediation',
    project: 'House of Kings: Collab',
    state: 'closed',
    lastUpdated: '2026-08-16',
    rounds: [
      {
        roundNumber: 1,
        outcome: 'partial',
        note: 'Initial Firestore rules audit — identified client-side write paths bypassing auth checks. Rules tightened but missed collection-level read exposure.',
      },
      {
        roundNumber: 2,
        outcome: 'wrong-hypothesis',
        note: 'Attempted fix by adding blanket read rules — overcorrected, exposed user data across tenants. Caught by security review before deploy.',
      },
      {
        roundNumber: 3,
        outcome: 'partial',
        note: 'Reverted to per-document auth checks. Fixed tenant isolation but left server-side validation gap in bundle.js.',
      },
      {
        roundNumber: 4,
        outcome: 'partial',
        note: 'Server-side validation added. ARCHITECTURE.md and SECURITY.md written. Final penetration check found one remaining XSS vector in request handling.',
      },
      {
        roundNumber: 5,
        outcome: 'correct',
        note: 'XSS vector patched, input sanitization hardened across all server endpoints. Full security remediation arc closed.',
      },
    ],
  },
  {
    name: 'StatusBoard expansion — stale entries + capability columns + OnboardingGate',
    project: 'Studio-Wide',
    state: 'verified',
    lastUpdated: '2026-08-16',
    rounds: [
      {
        roundNumber: 1,
        outcome: 'correct',
        note: 'Single-pass build: refreshed 15+ stale entries, added 7 missing games (Gladiator Arena, Early Learning Buddy, Chimera Wilds, ScrapCrawl, Slime Coin, Horse Racing, Slither Rogue), added 4 capability columns with grep-confirmed audits, built OnboardingGate.tsx, refactored Planet of Greed to consume it, updated all 33 shell opening tests. Clean compile, 1403/1406 tests pass (3 pre-existing failures).',
      },
    ],
  },
  {
    name: 'VoidDrift Redux — fragment drift correction',
    project: 'VoidDrift Redux (web)',
    state: 'verified',
    lastUpdated: '2026-08-16',
    rounds: [
      {
        roundNumber: 1,
        outcome: 'correct',
        note: 'FRAGMENT_DRIFT_RATE (18 px/sec gravitational pull toward center) implemented in engine.ts:268. Untargeted fragments now drift inward and convert to Ring 1 asteroids on crossing the boundary. Auto-dispatch FSM with manual toggle confirmed working.',
      },
    ],
  },
];
