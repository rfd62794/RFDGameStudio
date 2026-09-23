# SlimeWorld -- URGENT Directive: Fix the Unwinnable First-Breed Trap

*August 5 2026 | Read fully before executing anything. Confirmed via
Robert's own live play: a new player can breed indefinitely and never
unlock their first region -- permanently stuck on Roster+Lab only, per
this morning's Gate Tabs directive. The "guided first breed" guarantee
this whole onboarding redesign was building toward was never actually
built. The page is still in Draft (not yet Published) -- real urgency,
not yet public-facing emergency.*

---

> STOP: Confirm the real, current test floor. Confirm the game actually
> runs (per the Missing-Lua-Files fix, already verified) before
> investigating this -- you need a genuinely playable build to reproduce
> and verify against.

---

## Section 0 -- Context: real, confirmed facts, and one leading (not certain) hypothesis

The real composite lock, confirmed via direct read of data.yaml: every
Ring-1 "Frontier" node -- the first reachable node for every starting
color -- requires all three: the matching color, shape_tier: 1, and an
accent matching accent_solid (diffusion 0-10) or accent_polka (diffusion
10-30).

Confirmed NOT the problem: color and shape. A Red starter's genetics
(vertexCount: 3, irregularity: 10, confirmed in App.tsx) correctly snap
to "Triangle" via snap_to_shape_name's nearest-anchor matching -- and
Triangle is confirmed shape_tier: 1 in breeding.lua's SHAPE_TIERS table.
This matches Robert's own description exactly ("stuck only able to breed
red triangles") -- the player IS correctly producing color+shape-matching
offspring. That's not the block.

Leading hypothesis, NOT yet confirmed with certainty -- verify this for
real before assuming it's the whole answer: check_accent_match in
regionlock.lua reads slime.diffusion_ratio (snake_case). The TS side
(App.tsx) sets diffusionRatio (camelCase) on both starters and bred
offspring. If the TS->Lua bridge doesn't correctly translate this field
name when converting a slime for a lock check, the Lua side would read
nil, falling back to local diffusion = slime.diffusion_ratio or 0. Note
that 0 would actually still satisfy accent_solid (0-10) -- so a pure
field-naming miss alone may not fully explain a permanent block. This
needs real bridge testing to confirm, not just a code read -- the real
cause could be this field mismatch, could be breeding-inheritance
variance drifting offspring diffusion values outside the narrow 0-30
band across generations, or could be something else entirely. Find the
real cause with real evidence before fixing anything.

Why this matters beyond just this one bug: this is exactly the gap
already named in project memory as genuinely unfinished -- the
"guaranteed first breed" mechanism was discussed at length during this
week's onboarding redesign but never got its own directive. The Random
Starting Color Foundation directive built the starting STATE (random
color, matching starters, matching zone visible) correctly and was
independently verified clean -- but nothing was ever built to guarantee
that a new player's actual breeding attempts can succeed at the one
thing the whole onboarding sequence depends on.

Not in scope, explicitly deferred:
- Any change to the composite lock system itself for later-game nodes
  (Ring 2/Rival, Ring 3/Arc, Convergence) -- this directive is about
  making the FIRST node reliably reachable, not redesigning the lock
  system broadly.
- World-building/narrative content -- still separately deferred, as it
  has been all week.
- Envoy/Garrison, Shape-focus-as-discovery-axis, breeding cost, purchase
  restrictions -- all real, separate, already-identified threads, not
  this directive's job.

---

## Section 1 -- Scope Statement

| File | Status | Action |
|---|---|---|
| TS->Lua bridge (exact location TBD -- likely types.ts's slime conversion functions, confirm via source read) | Investigate first, fix if confirmed | Verify whether diffusionRatio<->diffusion_ratio actually translates correctly across the bridge for both starters and bred offspring |
| ts/src/games/slimeworld/App.tsx (starter/breeding genetics) | Modify, once real cause confirmed | Tune whatever is actually found broken so a Tier-1/Solid-or-Polka match is reliably reachable for a new player |
| Possibly games/slimeworld/breeding.lua (inheritance logic) | Investigate, modify if confirmed real cause | If the real problem is inheritance variance drifting diffusion values, this is where it would need addressing |

Read-only -- do not touch: the composite lock definitions in data.yaml
themselves, unless real evidence shows the locks are unreasonable rather
than the genetics being wrong -- confirm which side of this is actually
broken before changing either.

---

## Section 2 -- Implementation

RULE: Do not fix anything until the real cause is confirmed via actual
bridge testing -- construct a real starter slime through the genuine
stateToLua->executor->luaSlimeToTs path, breed it against itself or a
matching second starter, and inspect what diffusion_ratio the Lua side
actually sees at the moment check_accent_match runs. This is exactly the
class of bug this project's own standard already requires real-bridge
verification for, not Lua-only or TS-only reasoning.

RULE: Once the real cause is confirmed, the fix should make success
RELIABLE for a new player, not just theoretically possible. If the issue
is field-naming, fix the bridge translation. If it's inheritance
variance, consider whether starter-generation offspring (the player's
very first breed specifically) should have reduced variance or a
deliberate bias toward the target range -- this is a real design choice,
flag it explicitly rather than silently picking a specific variance
value without justifying it.

RULE: Test against all three real starting colors (Red, Blue, Yellow),
not just Red -- confirm the fix works for whichever color a new player
is randomly assigned, matching the Random Starting Color Foundation
directive's own three-color scope.

---

## Section 3 -- Test Anchors

| Test name | Behaviour |
|---|---|
| test_diffusion_ratio_field_survives_ts_to_lua_bridge | Real bridge test: confirm whatever the TS side sets for diffusion is what the Lua side actually reads, for both starters and bred offspring |
| test_starter_pair_breeding_can_satisfy_first_region_lock | Real, mandatory: for each of the three starting colors, breed the two starters together (or however the real first-breed flow works) enough times to confirm a Tier-1/Solid-or-Polka match is genuinely reachable, not just theoretically possible |
| test_first_breed_success_rate_is_reasonable | Given this is meant to be a GUIDED, near-guaranteed early win -- confirm the real success rate is high enough to not feel like a trap. Exact threshold is a real judgment call; report what you found and used, don't silently pick a number without justifying it |
| test_region_unlock_fires_and_reveals_tabs | Full integration: confirm a successful matching breed actually sets regionUnlocks, which correctly reveals Missions/Economy per this morning's Gate Tabs directive -- proving the whole chain works end to end, not just the lock check in isolation |

---

## Section 4 -- Completion Criteria

- [ ] Real pre-flight and final floor reported
- [ ] Real cause confirmed via actual bridge testing, not assumed from
      the leading hypothesis alone
- [ ] Fix verified working for all three real starting colors
- [ ] Full chain confirmed end-to-end: breed -> lock satisfied ->
      regionUnlocks set -> Missions/Economy tabs actually appear
- [ ] Real, reasonable success-rate reported and justified -- this was
      supposed to be a guided, reliable first win, not a lottery
- [ ] git diff --stat confirms only real, necessary files touched
- [ ] Report explicitly: is a new player now actually able to progress
      past their first breed, demonstrated via a real playthrough, not
      assumed from the fix alone

---

## Section 5 -- Quick Reference

| Fact | Value |
|---|---|
| Real, confirmed problem | New players can breed indefinitely and never unlock their first region |
| Confirmed NOT the cause | Color and shape -- both correctly match for a Red starter |
| Leading hypothesis, unconfirmed | diffusionRatio/diffusion_ratio bridge mismatch -- verify, don't assume |
| Real composite lock | Color + shape_tier: 1 + accent in Solid (0-10) or Polka (10-30) diffusion range |
| Why this matters | This is the exact "guaranteed first breed" mechanism the whole onboarding redesign depended on, never actually built |
| Current deploy status | Still Draft, not Published -- real urgency, not yet public |
