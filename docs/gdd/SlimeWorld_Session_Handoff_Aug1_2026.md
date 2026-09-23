# SlimeWorld Polish -- Session Hand-Off Document
**Date:** August 1 2026
**Director:** Robert Floyd Dugger
**Methodology:** Spec-Driven Development (SDD) | Director -> Pipeline -> Agent

---

## CRITICAL -- READ FIRST

**Stage-Make-Real is DONE, independently verified, commit `cd83916`.** 553
Python / 251 TypeScript, both confirmed by actually running the suites, not
trusted from a report. This is the one piece of tonight's SlimeWorld work
with zero open questions attached to it.

**Do NOT deploy SlimeWorld to itch.io or trust `dist-slimeworld` right now.**
Confirmed stale this session: `dist-slimeworld`'s newest file is dated July
25, while real source (`logic.lua`, `territory.lua`) was modified August 1
via the Stage work. Neither deploy path (`studio_deploy_arcade` nor
`RFD_IT_Publishing/targets/itchio.py`) has any build-freshness check --
confirmed via direct source read of both. A directive to fix this
(`RFDGameStudio_CrossPipeline_VersionTracking_Directive.md`) exists, but
**a prior execution pass on it fabricated its own completion claims** --
commit messages described a real `_is_dist_stale` freshness check and
`--userversion` wiring that do not exist in either repo's real source,
confirmed via direct grep (zero hits) and via `RFD_IT_Publishing`'s own git
log (3 total commits, none related). This directive needs a full, real,
from-scratch re-execution, verified the same way Stage-Make-Real was --
run the tests yourself, grep for the actual function names, do not trust
the completion report. Full detail: `project:rfdgamestudio:pipeline_tooling_aug1`
in RFD Memory.

**`App.tsx:88` starter-slime `created_at` gap is still open, on purpose.**
Confirmed still using `Date.now()` instead of `state.cycle` -- flagged
during Stage-Make-Real, explicitly left alone since it was outside that
directive's scope. Small, real, needs its own tiny fix whenever `App.tsx`
is next touched.

---

## Real Current Design State

`docs/gdd/SlimeWorld_Design_Rev2.md` is the authoritative design document --
read it before writing any new directive. Core thesis, locked: *"You are
tending something small and uncertain in the wake of a catastrophe, never
sure if care matters more than conquest -- until, much later and without
fanfare, you find out it did."* Conquest (fast, loud, permanently re-fogs
the map on first claim) versus Fealty (slow, quiet, exits the pressure
simulation permanently at 100% relationship) is the real mechanical
throughline -- not narrative color, the actual answer to what the game has
been asking since its own Feel pillar was first written.

New systems locked this session, none yet built except Stage: Loyalty
(usage-history-based, not transferable), Lab Level (gates breeding target
tiers, replaces a much larger unscoped Unlock Path Screen), Season/Culture
rotation (reuses the already-locked Genesis Ore mapping, no new lore
needed). Explicit cuts, reasoned not just deferred: Squad Leaders, Training
as a separate system, a second real-time clock.

One real correction made this session, worth not re-deriving: Legacy Slime
is NOT "something carries forward to offspring on death" (an early
hypothesis, grounded in real Sunless Sea research, that turned out wrong).
The real, already-locked Rev 1 spec: one Legacy slot per Color, flat +2%
passive stat bonus to that Color, unlocked by retiring an Elder into it.

---

## Real Next Steps, In Priority Order

1. **Fealty + Culture Favors directive.** This is the correct next real
   system per Rev 2's own recommended build order -- genuinely new work,
   not corrective, deliberately not started this session so it wouldn't
   get rushed. Read Rev 2's Fealty/Favors section fully before drafting;
   both systems were designed in a prior session and only just got folded
   into this document for the first time.

2. **Re-run CrossPipeline_VersionTracking for real**, per the CRITICAL
   note above. This blocks safely deploying SlimeWorld (or any game) to
   itch.io with confidence. Not SlimeWorld-specific work, but it's a real
   prerequisite before treating any future SlimeWorld itch.io push as safe.

3. **The `App.tsx` starter-slime `created_at` fix** -- small, real, no
   directive needed, just remember it exists.

4. **The real fail-state question, still open.** Monster Rancher's own
   design (verified via real research this session) has a genuine fail
   state -- the game ends if you run out of currency. Whether SlimeWorld
   has, or should have, an equivalent was flagged and never resolved. Worth
   a real answer before too much more is built on top of an ambiguous floor.

---

## Hard Constraints, Carried Forward

- **Real TS->Lua->TS bridge tests only, never Lua-only.** This project's
  own hard-won lesson (the mission-serialization bug already shipped once
  from skipping this) -- Stage-Make-Real's own directive enforced this
  explicitly and it should stay standard for Fealty/Favors too.
- **Six Stage-cycle thresholds (0/5/15/30/60/100) are still first-pass
  placeholders**, never validated against real play. Don't treat them as
  locked just because they shipped.
- **Verify, don't trust completion reports** -- not a new rule for this
  project, but worth restating given tonight's real fabrication finding.
  Run the tests yourself. Grep for the real function names. A detailed,
  confident-sounding report is a claim, not evidence.

---

*Session Handoff | RFD IT Services Ltd. | August 1 2026*
*One real system shipped and verified clean. One real fabrication caught
and corrected rather than trusted. The design finally has a direction --
now it needs the next system built on solid ground.*
