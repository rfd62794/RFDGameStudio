# ADR-007: Figure-Locked Persuasion Methods and First-Run Court Primer

**Date:** September 29, 2026
**Status:** Accepted — implements the design doc's own named "natural
next phase" (cast-building and locked method assignment), verified
against the real deterministic balance harness, not assumed from design
intent.

## Context

The design document (`docs/Succession_Design_and_Identity.md`, v0.3)
locked two principles before any code was written:

1. Each of the three figures values one persuasion method uniquely —
   and "locked" means *most effective*, never the only option that
   works. Non-locked methods must remain functional at real,
   meaningfully reduced value — never zero, never disabled (Time
   Served's proven "No Mathematical Dead End" pillar, applied directly).
2. Once implemented, no origin × figure-method-lock combination may
   produce a structurally hopeless lane — and this needs real harness
   verification, not assumption.

The document's open question — *which* method locks to *which* figure —
was explicitly tied to the cast-building pass, which this directive
executes.

Independently, the status board recorded `Tutorial=N` — the game had
ADR-005's contextual first-use tips but no first-run tutorial through
the shared `OnboardingGate` (`ts/src/ui/components/OnboardingGate.tsx`),
the mechanism now standard across scrapcrawl, slither_rogue,
planetofgreed, gladiator_arena, horse_racing, and chimera_wilds.

## Decision

### Thematic assignment — one unique lock per figure

| Councilor | Locked method | Reasoning |
|---|---|---|
| Chancellor Vane | **Archival Evidence** | A man of ledgers and seals — moved by irrefutable documentary proof, not flattery or pleading. |
| Archbishop Valerius | **Whispered Claims** | A keeper of confessions and secret rites — responds to truths spoken privately, in the confessional register he knows best. |
| General Brand | **Formal Appeal** | A soldier who distrusts whispers and parchment alike — respects an open, honorable appeal made plainly before the Council. |

The assignment is a thematic bijection: every figure has exactly one
lock, every method is locked by exactly one figure. `courtFigures.ts`
gains `lockedMethod` and `methodAffinity` fields; the latter carries
the dossier flavor the UI surfaces.

### The value model — two knobs, both derived from real evidence

`engine/methodLock.ts` exports `persuasionMethodGain(figureId, method,
baseGain)`:

- **Locked method:** `floor(base × 2)` — the design doc's own fallback
  knob, required by direct harness evidence, not chosen on taste. At
  flat base value with a 0.25 off-rate, every scripted strategy lost
  every origin run (0/18 player wins) because rivals still earn
  `RIVAL_WHISPER_FAVOR_GAIN` (15) per segment — a mathematically
  hopeless lane, the exact outcome the design doc forbids. At 1.5×, the
  appeal-locked commander's own favored method still paid 12 < 15 —
  structurally hopeless by the design's own test. At 2×, every favored
  lane out-earns a rival whisper: whisper 40, appeal 16, evidence 60.
- **Non-locked methods:** `max(1, floor(base × 0.25))` — the largest
  uniform ratio at which the locked method remains strictly the most
  effective option at every figure given real base values (at the
  appeal-locked commander, evidence must stay below the appeal value,
  so non-locked gains cannot exceed ~26% of base). The 0.25 scale
  deliberately matches the `REPEAT_DECAY_FLOOR_RATIO` precedent in
  `engine/favor.ts`. The floor of 1 is the "never zero, never disabled"
  rule — including the Disgraced Knight's Archbishop appeal, which now
  compounds ADR-004's friction with the non-locked rate to a
  still-functional +1.

The lock applies to the three player-facing favor moves only —
`whisperTo`, `appealTo`, `presentEvidenceTo` in
`utils/gameOrchestration.ts`. Rival whispers are deliberately
unaffected: rivals have no method choice (whisper is their only
persuasion move), so there is no meaningful lock to apply, and the
symmetry that matters — contradiction *risk* via `applyWhisper` —
is already claimant-agnostic since ADR-001.

Ordering inside `appealTo`: the origin override picks the base value
first (`appealFavorGainOverride?.[figureId] ?? APPEAL_FAVOR_GAIN`), then
the method lock scales it. This makes the Disgraced Knight's commander
appeal pay 10 × 2 = 20 and his archbishop appeal pay 4 × 0.25 = 1 —
origin economics compound with the lock in both directions, which is
exactly what the design's "genuinely worse path, not a wall" requires.

### Surface — the lock is visible everywhere the player decides

- `FigureCard` gains a "Respects: <method>" badge in the chamber dossier.
- `AudienceStage` gains a "Respects" row in the standing box and a
  fourth dossier cell, "Favored Approach", carrying `methodAffinity`.
- `WhisperPanel`, the inline Appeal card, and `EvidencePanel` now
  compute their badge/body/button favor numbers through
  `persuasionMethodGain` — every "+N" the player sees is the real
  effective value, labeled "Favored Approach" vs "Cool Reception".
- ADR-005's first-use tip copy was updated to the real locked values —
  the tips cite exact numbers, so leaving +20/+8/+30 would have been
  active misinformation.

**A real stale-UI bug was fixed in passing:** the Appeal card
hardcoded "+50% Knight Perk / +12 favor" from before ADR-004 reduced
that bonus to +25%/+10 — the card had been lying to players since
August. The dynamic computation removes the class of bug rather than
patching the number.

### First-run tutorial — shared OnboardingGate, not a new mechanism

New `components/CourtPrimer.tsx`: a single first-run card covering the
five mechanical commitments new players get wrong (favored approaches,
contradiction risk, scout-then-present, the murder triad, the verdict
race). `App.tsx` wires it the exact scrapcrawl/slither_rogue way:

- `useOnboardingGate({ mode: 'boolean', initialShow: false })` — the
  shared hook owns the display flag for the session.
- `loadSave<boolean>('succession_tutorial_seen')` — the shared
  `engine/shared/persistence` helpers own the once-ever flag.
- `triggerPrimer()` inside `handleBegin` only when `!hasOnboarded`;
  the primer renders as an overlay on the first playing view only.
- `handlePrimerComplete` writes the save, marks onboarded, and calls
  `completePrimer()` — never re-fires on later visits or replays.

ADR-005's five contextual first-use tips are unchanged and still fire —
the primer is the up-front orientation; the tips remain the in-context
reinforcement at first real use. They answer different questions and
the directive explicitly calls for the shared gate *in addition to*
existing behavior, not as a replacement.

## Testing

**New suites (17 tests):**

- `tests/test_succession_methodLock.ts` (10): the thematic bijection;
  exact premium/non-locked/floor values; the locked method strictly
  out-pays both alternatives at every figure; orchestration applies the
  lock through all three moves; origin overrides compound in both
  directions; repeat decay stacks on the locked value; rival whispers
  unaffected.
- `tests/test_succession_courtPrimer.ts` (7): structural checks against
  real `App.tsx`/`CourtPrimer.tsx` source in the established
  gameshell_and_disclosure style — shared-gate import, shared
  persistence, once-ever storage key, gated trigger, completion write,
  conditional render, stable test ids, ADR-005 tips still wired.

**Updated suites:** 16 assertions moved to real effective values across
`test_succession_gameOrchestration.ts`, `test_succession_origins.ts`,
`test_succession_zeroSumRipple.ts`. Two slander tests were re-anchored
on the archbishop's locked whisper — a non-locked whisper (+5) no
longer crosses the 16-point slander threshold, which is itself a real,
intended consequence of the lock (slander pressure now concentrates on
favored lanes).

### Harness verification — the named safeguard, measured

A flat locked value + 0.25 off-rate produced **0/18 player wins** —
every scripted strategy lost every origin run. This is direct evidence
that the locked-method *premium* knob the design doc prescribes is
load-bearing, not decorative: rivals earning 15/segment means the
player's favored lane must pay above 15 to be a real lane.

A 7th strategy, `LockedLanes`, was added to the harness (7 strategies ×
3 origins = 21 runs): it plays each councilor's favored approach —
scout once for the chancellor's evidence, whisper the archbishop,
appeal the commander — and pays the knight's archbishop-appeal gate
cost first, exactly as a dossier-reading player would. The six
pre-existing method-blind strategies were left unchanged; that they now
lose more often is the mechanic working — the dossier is supposed to
matter.

**Final results under the shipped constants:** `LockedLanes` wins at
least once for **every** origin — the no-hopeless-lane bar now has a
dedicated regression test in `test_succession_balance_sim.ts`
(`method-aware play keeps every origin viable`), so a future rebalance
that re-breaks a lane fails CI rather than passing silently.

## Consequences

### What changed

- `engine/methodLock.ts` — new: `PersuasionMethod`-aware gain model,
  `lockedMethodFor`, `isLockedMethod`, `PERSUASION_METHOD_LABELS`,
  `NON_LOCKED_METHOD_RATIO` (0.25), `LOCKED_METHOD_BONUS_RATIO` (2),
  `MIN_NON_LOCKED_METHOD_GAIN` (1)
- `engine/types.ts` — new `PersuasionMethod` union (whisper | appeal |
  evidence; indictment is the inquiry resolution, not a persuasion
  method)
- `data/courtFigures.ts` — `lockedMethod` + `methodAffinity` per figure
- `utils/gameOrchestration.ts` — all three favor moves route through
  `persuasionMethodGain`
- `components/FigureCard.tsx`, `AudienceStage.tsx`,
  `WhisperPanel.tsx`, `EvidencePanel.tsx` — real effective values +
  favored-approach surfacing
- `components/CourtPrimer.tsx` — new first-run tutorial surface
- `App.tsx` — shared `useOnboardingGate` + shared `loadSave`/`writeSave`
  wiring, primer overlay
- `content/onboardingTips.ts` — tip numbers updated to locked values
- `tools/succession-balance-sim.ts` — 7th strategy `LockedLanes`, 21 runs
- `tests/test_succession_methodLock.ts`,
  `tests/test_succession_courtPrimer.ts` — new
- 4 existing test files updated to effective values;
  `tests/test_succession_balance_sim.ts` run-count constants (18→21)
  plus the new no-hopeless-lane bar

### What did NOT change

- Base favor constants (`WHISPER_FAVOR_GAIN`, `APPEAL_FAVOR_GAIN`,
  `EVIDENCE_FAVOR_GAIN`) — the lock multiplies them; the base economy
  stays the shared reference.
- Rival AI (`engine/rivalAI.ts`) — rivals gain no method lock; their
  whisper value, slander, and contradiction risk are unchanged.
- Verdict, deduction, gossip, epilogues — untouched.
- Sound — no `engine/shared/sfx/` module exists in the repository, so
  no sound implementation was invented; the board's Sound capability
  remains `N`.

### Shared-code audit (ADR-014)

No extraction was made. `persuasionMethodGain` is Succession-specific
(it reads `COURT_FIGURES` and its constants come from Succession's own
economy), `LockedLanes` lives in Succession's own harness, and
`CourtPrimer` is Succession copy over the *already-shared* gate. The
real second consumer for each candidate would be another persuasion
game — none exists; extracting now would be the speculative
genericization ADR-014 still rules out. The shared
`useOnboardingGate`/`persistence` modules were *consumed*, which is the
posture's actual point.

### Open design items unchanged

The remaining open questions are untouched: hint count/cadence for
ambient clues, wrong-accusation consequences, whether removing a
figure's value changes verdict math, and deterministic murderer
seeding — all real follow-up work, none blocked by this ADR.
