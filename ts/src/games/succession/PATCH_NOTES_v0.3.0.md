# Succession — Patch Notes v0.3.0

**September 29, 2026**

One increment, verified against the real deterministic balance harness
(7 strategies × 3 origins, 21 runs per measurement) and the real game
source — not assumed from design intent.

## Figure-Locked Persuasion Methods (ADR-007)

The design doc's named "natural next phase" is landed: each councilor
now uniquely respects one persuasion method, and every other method
still works at reduced value — never zero, never disabled.

### Who respects what

| Councilor | Favored approach | Effective gain |
|---|---|---|
| Chancellor Vane | Archival Evidence | +60 per evidence presented |
| Archbishop Valerius | Whispered Claims | +40 per whisper |
| General Brand | Formal Appeal | +16 per appeal |

### What it costs to go off-script

Non-favored methods pay a quarter of base value, floored at +1 —
never zero:

| Method | At a non-favored figure |
|---|---|
| Whispered Claims | +5 |
| Formal Appeal | +2 |
| Archival Evidence | +7 |

Origin modifiers compound with the lock in both directions. The
Disgraced Knight's Commander appeal pays +20 (his +10 override ×2),
while his Archbishop appeal pays +1 — a genuinely worse path, not a
wall.

### Why the favored lane pays double

Measured, not tuned by feel: with a flat locked value and the ¼
fallback, scripted play lost every one of 18 runs — rivals still earn
+15 per segment, so a "favored" lane that pays base value is not a
lane at all. At 1.5× the Commander's own favored appeal still paid
+12. At 2× every favored lane out-earns a rival whisper, and the
harness's method-aware strategy (`LockedLanes`) wins at least once for
every origin — a regression test now enforces that no origin has a
hopeless lane.

Rival AI is unchanged: rivals have no method choice, so nothing is
locked for them — contradiction risk stays symmetric.

### What you'll see

- Each councilor's chamber card and dossier names their favored
  approach ("Respects: Formal Appeal").
- Every favor number in the audience panels is now the real effective
  value, labeled "Favored Approach" vs "Cool Reception".
- Fixed a stale number that had been lying since v0.2: the Appeal card
  claimed a +50% / +12 Knight perk — the real value after the ADR-004
  rebalance is +25% / +10 (now +20 under the lock).
- First-use tips updated to the real locked values.

## First-Run Court Primer

Succession now greets a new player once — a single Court Primer card
on the first council visit covering the five things new players get
wrong: favored approaches, contradiction risk, scout-then-present
evidence, the murder-inquiry triad, and the verdict race.

It uses the shared `OnboardingGate` mechanism standard across the
arcade, and remembers itself via shared persistence — it never
re-fires on replays. The contextual first-use tips from v0.2 remain;
the primer orients up front, the tips reinforce at first real use.
