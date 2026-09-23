# RFDGameStudio — URGENT: Fix Mediation Resolution (Never Resolves)

*July 18 2026 | Read fully before executing. Same real bug class as this
morning's Exploration bug, found via a systematic audit of the fresh
export. `active_mediation` appears exactly once in the whole file — only
in `launch_mediation`'s setup. Nothing ever resolves it. Slimes assigned
to a mediation are likely soft-locked with no path back. This is more
urgent than this morning's equivalent bug — it doesn't just skip a
reward, it may trap real player resources indefinitely.*

---

> ⛔ **STOP:** Run `.venv\Scripts\python.exe -m pytest -q --tb=no`. Must
> report **422 passed, 8 warnings**.

---

## §0 Context

**Real, confirmed root cause:** `launch_mediation` sets
`state.active_mediation = {..., cycles_remaining=1, status="active"}` and
returns. Confirmed via direct grep — `active_mediation` never appears
anywhere else in `logic.lua`. No resolution, no cleanup, no role release
for assigned slimes.

**Real, complete source formula, verified directly from
`resolveMediation` in `intake/slimegarden/extracted/src/gameLogic.ts`
(~line 898) — port exactly:**

- Party power = sum of `chm` across all party members
- Target power = `40 + (node.strength > 0 ? round((1-node.strength)*60) : 35)`
- Success chance: same shape as Exploration's formula — `ratio > 1 →
  0.85 + (ratio-1)*0.1`, else `0.2 + ratio*0.6`, clamped `[0.15, 0.98]`
- **On success:** `stabilityChange = floor(15 + totalChm/6 + random()*8)`
  — node's `strength` increases by this amount
- **On failure — real, important difference from Exploration:**
  `stabilityChange = floor(5 + random()*5)` — still a real, positive
  increase, just smaller. Mediation never produces zero progress, unlike
  Exploration's clean binary success/fail.
- Real, empty-party guard: if the party is empty, mediation aborts
  immediately with no stability change at all — a real, distinct third
  outcome from success/failure.

**NOT in scope, deferred explicitly:**
- Any change to the actual formula constants — port exactly, tuning is
  a future playtesting pass
- Any UI changes beyond what's needed to confirm resolution is visible —
  real UI polish for mediation is separate

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `games/slimeworld/logic.lua` | Modify | Add real mediation-resolution block to `advance_cycle`, mirroring the real formula above |
| `tests/test_slimeworld_mediation_resolution.py` | New | Anchors below — **required in this directive, not deferred to a follow-up** |

**Read-only — do not touch:** `launch_mediation` itself (the bug is in
what happens after, not the launch), Exploration's resolution logic
(reference pattern only), Dispatch's resolution logic.

---

## §2 Implementation

Add a real resolution block to `advance_cycle`, placed alongside the
existing Exploration-resolution block (same real lifecycle-management
area, not scattered):

```lua
if state.active_mediation ~= nil then
  local mediation = state.active_mediation
  local node = find_by_id(state.planet_region and state.planet_region.nodes, mediation.target_node_id)
  local party = select_slimes(state.slimes, mediation.slime_ids)

  if #party == 0 then
    -- real, distinct third outcome: abort, no stability change
  elseif node ~= nil then
    local total_chm = 0
    for _, slime in ipairs(party) do total_chm = total_chm + (slime.stats and slime.stats.chm or 0) end
    local target_power = 40 + (node.strength > 0 and math.floor((1 - node.strength) * 60 + 0.5) or 35)
    local ratio = target_power > 0 and (total_chm / target_power) or 0
    local chance
    if ratio > 1 then chance = 0.85 + (ratio - 1) * 0.1
    else chance = 0.2 + ratio * 0.6 end
    chance = math.min(0.98, math.max(0.15, chance))

    local success = math.random() <= chance
    local stability_change
    if success then
      stability_change = math.floor(15 + total_chm / 6 + math.random() * 8)
    else
      stability_change = math.floor(5 + math.random() * 5)
    end
    node.strength = math.min(1, (node.strength or 0) + stability_change / 100)
  end

  -- return party slimes to idle, regardless of outcome
  for _, slime in ipairs(party) do slime.locked_role = nil end
  state.active_mediation = nil
end
```

> ⚠️ RULE: verify the real, current unit convention for `node.strength`
> (0-1 scale, per the existing code) versus `stabilityChange`'s real
> percentage-point scale (15-23ish) from the source — confirm the
> `/100` conversion above is correct against how `strength` is actually
> used elsewhere in this file, don't assume it's right without checking.

> ⚠️ RULE: same discipline as this morning — slimes return to idle
> (or whatever the real "not locked" state is, confirmed against how
> Exploration/Dispatch release their own parties) regardless of success,
> failure, or the empty-party abort case. No outcome should leave a
> slime permanently stuck.

---

## §3 Test Anchors — required in this directive, not deferred

| Test | Target |
|---|---|
| `test_mediation_party_power_sums_chm` | Real party, hand-computed sum |
| `test_mediation_success_chance_above_ratio_one` | Real formula match |
| `test_mediation_success_chance_below_ratio_one` | Real formula match |
| `test_mediation_chance_clamped_to_bounds` | Extreme ratios stay within [0.15, 0.98] |
| `test_mediation_success_increases_node_strength` | Real, seeded-RNG forced-success case |
| `test_mediation_failure_still_increases_strength` | **The real, distinct behavior from Exploration** — failure still produces a positive change, never zero |
| `test_mediation_empty_party_aborts_no_change` | Real, distinct third outcome |
| `test_mediation_slimes_always_released` | All three outcomes (success/failure/empty-abort) confirmed releasing the party |
| `test_mediation_state_cleared_after_resolution` | `active_mediation` is nil after `advance_cycle` |
| `test_full_mediation_lifecycle` | Launch → resolve → confirm real, end-to-end state change |

**Target: report the real number.**

---

## §4 Completion Criteria

- [ ] Real pre-flight floor confirmed (422)
- [ ] Real formula ported exactly, including the failure-still-progresses distinction from Exploration
- [ ] Node `strength` unit conversion verified correct, not assumed
- [ ] All three outcomes (success/failure/empty-party) confirmed to always release the party
- [ ] `.venv\Scripts\python.exe -m pytest -q` → raw output pasted, real final floor reported
- [ ] `docs/state/current.md` updated: this bug and fix noted, explicitly flagged as the same bug class as this morning's Exploration issue, found via a systematic manifest-style audit

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| Real bug | `active_mediation` set once, never resolved, anywhere |
| Real risk | Assigned slimes likely soft-locked indefinitely |
| Real source | `resolveMediation`, `intake/slimegarden/extracted/src/gameLogic.ts` ~line 898 |
| Key difference from Exploration | Failure still produces positive progress, never a clean zero outcome |
| Pre-flight floor | 422 / 0 |

---

*Director: Claude | Urgent fix for a real, potentially player-blocking bug found via systematic audit, 2026-07-18*
