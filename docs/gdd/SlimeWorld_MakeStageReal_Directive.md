# SlimeWorld -- Directive: Make Stage Real (Corrective Work, Not New Scope)

*August 2026 | Read fully before executing anything. This directive
implements the recommended first slice from SlimeWorld_Design_Rev2.md --
see that document for the full converged design context. This phase is
scoped narrowly on purpose: fixing existing dead code, not building the new
systems (Loyalty, Legacy retirement, Fealty, Favors) that depend on it.*

---

> STOP: Confirm the real, current test floor (Python + TypeScript) before
> touching anything -- do not trust any number from a prior session, confirm
> it live.
>
> SECOND STOP, load-bearing: This project has an established, hard-won
> lesson, already documented: "A Lua-only test proves the formula is right.
> It does not prove the feature works in the live game." Every real anchor
> in this directive must go through the actual, full TS->Lua->TS round trip
> (stateToLua/slimeToLua -> executor -> luaSlimeToTs), not a Lua-only unit
> test constructing state directly. This exact gap already shipped one real
> bug in this project's history (the mission-serialization bug) -- do not
> repeat it here.

---

## Section 0 -- Context

Confirmed via direct source read this session, not assumed: `stage` (type
LifeStage: Hatchling | Juvenile | Young | Prime | Veteran | Elder) is
declared in games/slimeworld/data.yaml (with an honest comment admitting
it is meant to be "computed dynamically in the source"), typed in
ts/src/games/slimeworld/types.ts, and wired both directions through the Lua
bridge (SLIME_EXPLICIT_LUA_FIELDS includes it, luaSlimeToTs reads
raw['stage'], slimeToLua writes slime.stage back out). Nothing anywhere
computes or assigns it. Confirmed via grep across all six real .lua files
(breeding.lua, codex.lua, economy.lua, logic.lua, missions.lua,
territory.lua) and all ts/src/games/slimeworld/*.ts files -- zero hits
beyond the type declaration and pass-through plumbing. This field will
always read undefined in the live game today.

Already locked, from SlimeWorld_Design.md Revision 1 -- use these numbers,
do not re-derive them: Elder carries a breeding tax of 0.85x. Elder is the
only stage eligible to retire into the Legacy system (Legacy retirement
itself is separate, larger, unbuilt work -- explicitly out of scope here,
see Section 1).

Real field already available for this, confirmed in slimeToLua:
created_at: slime.createdAt -- already passed through the bridge. Combined
with state.cycle (the game's own real per-cycle counter, already in
LabState), Stage should be computed as a function of cycles-in-service
(state.cycle - slime.createdAt), NOT from level/xp. This is the one
property that actually matters: if Stage were derived from Level instead,
it would just be Level relabeled into six bands, and the entire reason this
system exists -- aging as a clock independent of how hard a slime has been
worked -- would collapse.

Not in scope, deferred to their own future directives:
- Loyalty -- a real, separate new system, not corrective work. Depends on
  Stage existing but is not part of making Stage real.
- Legacy retirement -- "fully specified, zero code" per Rev 1. Making
  Elder detection real is this directive's job; building what Legacy
  retirement actually does is not.
- Fealty / Culture Favors -- explicitly sequenced second in Rev 2, after
  this directive, not alongside it.

---

## Section 1 -- Scope Statement

| File | Status | Action |
|---|---|---|
| One of the six real .lua files (locate the correct one -- see rule below) | Modify | Add real Stage computation, called from advance_cycle per-slime, per real cycle tick |
| Same file, or wherever the real breeding resolution function lives | Modify | Apply the locked 0.85x breeding tax when either parent is Elder-stage |
| Test file(s) matching the real, current test file naming/location convention for this project | Modify | New test anchors, see Section 3 |

RULE: Do not assume which of the six split .lua files is the correct home
for Stage computation. Read the real current contents of breeding.lua,
logic.lua, and missions.lua first -- Stage is a per-slime lifecycle
property, not obviously owned by any one of the existing domain splits
(breeding/territory/missions/economy/codex). Report which file you chose
and why, do not silently pick one.

Read-only -- do not touch: Anything related to Loyalty, Legacy retirement's
actual mechanic, Fealty, or Culture Favors -- none of that exists yet and
none of it belongs in this phase.

---

## Section 2 -- Implementation

### Stage computation

```lua
-- Placeholder thresholds -- NOT derived from real playtesting data,
-- explicitly flagged as first-pass per this project's own standing
-- discipline for un-validated numbers. Report these back for Robert's
-- confirmation rather than treating them as locked.
local STAGE_THRESHOLDS = {
    {stage = "Hatchling", min_cycles = 0},
    {stage = "Juvenile",  min_cycles = 5},
    {stage = "Young",     min_cycles = 15},
    {stage = "Prime",     min_cycles = 30},
    {stage = "Veteran",   min_cycles = 60},
    {stage = "Elder",     min_cycles = 100},
}

function compute_stage(current_cycle, created_at)
    local cycles_alive = current_cycle - created_at
    local result = "Hatchling"
    for _, entry in ipairs(STAGE_THRESHOLDS) do
        if cycles_alive >= entry.min_cycles then
            result = entry.stage
        end
    end
    return result
end
```

RULE: These six threshold numbers are a genuine placeholder, not a
confident design decision -- flag them explicitly in your completion report
as needing Robert's review, the same way this project already flags every
other un-validated number (Boon pricing, enemy HP bands, Balance Checker
windows all went through this same "first pass, pending real data"
treatment elsewhere in the studio's history). Do not present these as
settled.

RULE: Call compute_stage for every roster slime inside advance_cycle (or
wherever the real per-cycle slime update loop already lives -- confirm the
actual location via source read, do not guess), so stage updates live as
cycles pass, not just at creation time.

### Elder breeding tax

Locate the real breeding resolution function (likely in breeding.lua,
confirm via source read). Apply the locked 0.85x multiplier to the relevant
output value when either parent's stage == "Elder".

RULE: 0.85x is already a locked number from Rev 1 -- do not invent a
different value, do not treat it as a placeholder the way the six stage
thresholds above are. Confirm via direct read of the current breeding
function what value it should actually multiply (offspring stat total? a
specific yield number? Rev 1's own text just says "breeding tax" without
specifying the exact target) -- report which value you applied it to and
why, since Rev 1 did not fully specify this and you will need to make a
reasonable, explicitly-flagged judgment call here too.

---

## Section 3 -- Test Anchors

| Test name | Behaviour |
|---|---|
| test_compute_stage_hatchling_at_zero_cycles | cycles_alive = 0 -> "Hatchling" |
| test_compute_stage_boundary_transitions | Test at exactly each threshold value and one cycle below it -- confirms boundaries are inclusive/exclusive correctly, not off-by-one |
| test_compute_stage_elder_at_max | Well past the Elder threshold still returns "Elder", does not error or overflow past the last defined stage |
| test_stage_updates_live_through_real_bridge | Real, mandatory, matches this project's own hard-won lesson: construct real LabState with a slime at a known created_at, advance state.cycle through the real stateToLua->executor->luaSlimeToTs round trip (not a Lua-only test), confirm slime.stage reflects the correct value on the TS side after a real bridge call -- not just correct inside Lua |
| test_elder_breeding_tax_applies_only_at_elder | Breeding with a non-Elder parent produces the untaxed value; breeding with an Elder parent produces the value scaled by 0.85 |
| test_elder_breeding_tax_real_bridge | Same real-bridge-not-Lua-only standard as above, for the tax specifically |

Target: report the real final count -- do not assume a specific number in
advance, confirm the real pre-flight floor first per the top-of-directive
stop rule, then report the true delta.

---

## Section 4 -- Completion Criteria

- [ ] Real pre-flight floor confirmed and reported before any change
- [ ] Correct .lua file identified via source read, reported with reasoning
- [ ] Stage computation wired into the real per-cycle update path, confirmed
      via source read of where it was actually called from
- [ ] All six threshold numbers reported explicitly as first-pass/pending
      Robert's review -- not presented as final
- [ ] Elder breeding tax wired using the real, already-locked 0.85x, target
      value chosen and justified (Rev 1 did not fully specify what it
      multiplies)
- [ ] All real-bridge test anchors (not Lua-only) confirmed passing
- [ ] git diff --stat confirms only the files named in Section 1 touched --
      no drift into Loyalty, Legacy retirement, Fealty, or Favors
- [ ] Real, final test floor reported
- [ ] SlimeWorld_Design_Rev2.md's own "Recommended Build Order" section
      updated to mark this phase complete, with the real threshold numbers
      and breeding-tax target value recorded for the next session

---

## Section 5 -- Quick Reference

| Fact | Value |
|---|---|
| The bug | stage fully declared and bridge-wired, never computed anywhere |
| Confirmed via | Direct grep across all 6 real .lua files + all TS files this session |
| Drives Stage | Cycles in service (state.cycle - slime.created_at) -- NOT Level |
| Locked number, use as-is | Elder breeding tax 0.85x |
| Placeholder numbers, flag do not lock | The six stage cycle thresholds |
| Explicitly deferred | Loyalty, Legacy retirement mechanic, Fealty, Culture Favors |
| Verification standard | Real TS->Lua->TS bridge tests, not Lua-only -- this project's own documented lesson |
| Next directive after this | Fealty + Culture Favors, per Rev 2's build order |
