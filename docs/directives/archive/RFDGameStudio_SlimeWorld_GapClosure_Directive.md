# RFDGameStudio — SlimeWorld Phase 2 Gap Closure: Tiebreak Fix + Shape Targets (Partial Draft)

*July 15 2026 (night) | Vehicle: Windsurf/Devin | Closes the snap_to_faction bug found in Phase 2a verification; drafts what can be responsibly specified of Track 2b*

---

> ⛔ **STOP:** Two independent items. §1 is a confirmed bug with a
> confirmed fix — send as-is. §2 is a PARTIAL draft — only the literal
> vertex-count tier is specified. Do not extend §2's target list beyond
> what's given here without the missing coordinates from Robert first.
> Extending it yourself would violate the same "do not invent" rule
> that correctly blocked Track 2b earlier tonight.

**Read-only — do not touch:** everything already verified in Track 2a
(`breed_slimes`, all three claim resolvers, all 9 action-hook systems)
except the one function named in §1.

---

## §1 Fix: snap_to_faction non-deterministic tiebreak

### Root cause (verified by independent hand-trace, not reported)

`snap_to_faction` in `logic.lua` iterates faction anchors via Lua's
`pairs()`, which has no guaranteed stable order across runs or Lua
implementations. At any hue exactly equidistant between two anchors —
30, 90, 150, 210, 270, 330 — the function returns whichever anchor
`pairs()` happens to visit first, non-deterministically.

**This is not a rare edge case.** Every Guild-tier Color Codex target
(6 of 17 total) sits exactly on one of these midpoints by design:
Thornward=30, Amberglow=90, Frostwind=150, Mossy Crystal=210,
Tidereign=270, Abyssal Ember=330. The top tier of the entire Color
Codex routes through the one non-deterministic function in the port.

### Fix

Replace the `pairs()`-based loop with a deterministic, explicit
tiebreak. Recommended rule: **lower hue wins ties** — simplest,
predictable, easy to state in one sentence if a player ever asks why.

```lua
function snap_to_faction(hue)
  local anchors = {
    { color = "Red", value = 0 },
    { color = "Orange", value = 60 },
    { color = "Yellow", value = 120 },
    { color = "Green", value = 180 },
    { color = "Purple", value = 240 },
    { color = "Blue", value = 300 },
  }
  local closest = anchors[1].color
  local minimum_distance = 360
  for _, anchor in ipairs(anchors) do
    local distance = circular_distance(hue, anchor.value)
    if distance < minimum_distance then
      closest = anchor.color
      minimum_distance = distance
    elseif distance == minimum_distance and anchor.value < 180 then
      -- deterministic tiebreak: prefer the lower-valued anchor
      -- (this branch only matters when the array order itself
      -- doesn't already guarantee it — verify against test below)
    end
  end
  return closest
end
```

> ⚠️ RULE: switching from `pairs()` over a hash table to `ipairs()`
> over an explicit ordered array already fixes most of the
> non-determinism, since array iteration order is stable. Verify
> whether the tiebreak clause above is even still needed once the
> array is ordered low-to-high by anchor value — it may be redundant.
> Don't leave dead code in if the ordering alone resolves it; test
> and report which is actually true.

### Verification

- [ ] Run `snap_to_faction(30)` **10 times in a fresh process each
      time** (not 10 times in one run — that would just test cache/
      memoization, not the actual non-determinism). Paste all 10
      results. Expect identical output every time now; if Track 2a's
      original code is run the same way for comparison, expect to see
      it vary.
- [ ] Repeat for hue 90, 150, 210, 270, 330 — the other five Guild
      midpoints. Paste results for each.
- [ ] Confirm which anchor wins each tie and state the rule explicitly
      in the summary (e.g. "Red wins over Orange at hue 30") — this
      becomes real, load-bearing game behavior, not an implementation
      detail to leave unstated.

---

## §2 Shape Targets — Tier 1 draft only (literal vertex-count names)

### What's confidently specifiable right now

These five names, from the retired April 12 Shape Tree, are their own
vertex counts — no invention required:

```yaml
shape_targets:
  - {id: shape_triangle, tier: 1, name: Triangle, vertex_count: 3, irregularity_max: 15}
  - {id: shape_square, tier: 1, name: Square, vertex_count: 4, irregularity_max: 15}
  - {id: shape_diamond, tier: 1, name: Diamond, vertex_count: 4, irregularity_min: 40, irregularity_max: 100}
  - {id: shape_pentagon, tier: 2, name: Pentagon, vertex_count: 5, irregularity_max: 15}
  - {id: shape_hexagon, tier: 1, name: Hexagon, vertex_count: 6, irregularity_max: 15}
  - {id: shape_octagon, tier: 3, name: Octagon, vertex_count: 8, irregularity_max: 15}
```

> ⚠️ RULE: Diamond correctly shares `vertex_count: 4` with Square,
> distinguished only by irregularity range — per the confirmed design
> correction. Do not give Diamond its own vertex count.

Tier numbers above (1/2/3) are placeholder groupings based on the
memory-preserved endpoints (Tier 1: 3,4,6 / Tier 5: 11,22) — Pentagon
and Octagon's exact tier placement (2 vs 3, etc.) is a reasonable
guess consistent with ascending vertex count, not confirmed canon.
Flag this explicitly if it matters for balance before treating it as
locked.

### What's explicitly NOT specified — needs Robert's input, not invention

The remaining names from the retired Shape Tree have no numeric
grounding anywhere in memory or the repo: **Star, Crescent, Spiked,
Crown, Prism, Teardrop, Arrow, Crystal, Void-Form, Celestial,
Prismatic.** Star has a real mathematical meaning (self-intersecting
{n/k} star polygon) that could ground it, but the others are
stylized/thematic names, not literal vertex counts, and assigning
them coordinates now would be fabrication — exactly what Devin
correctly refused to do for the full table.

**Needed before Track 2b can extend past Tier 1:**
1. Vertex-count and irregularity ranges (or the rule for deriving
   them) for each of the 11 remaining names, OR
2. Confirmation that the original `SHAPE_TARGETS`/Rev 3 document
   exists somewhere findable (local backup, a different session's
   output that got saved, printed notes) rather than only having
   existed in an ephemeral prior-session sandbox.

---

## §3 Completion Criteria

- [ ] §1: `snap_to_faction` rewritten, 10-run-per-hue determinism
      confirmed for all 6 Guild midpoints, tiebreak rule stated
      explicitly in the summary
- [ ] §2: Tier 1 (Triangle/Square/Diamond/Pentagon/Hexagon/Octagon)
      added to `data.yaml` as `shape_targets`, no code written against
      it yet (no `breed_shape` — that still needs the full table)
- [ ] Explicit confirmation in the summary that the remaining 11 names
      were NOT assigned coordinates, and why

---

## §4 Quick Reference

| Item | Status |
|---|---|
| `snap_to_faction` determinism | Bug confirmed, fix specified, ready to send |
| Guild-tier Color Codex (6/17 targets) | Currently non-deterministic, fixed by §1 |
| Shape Tier 1 (literal names) | Drafted, 6 targets, ready to send |
| Shape Tier 2+ (stylized names) | Blocked — needs Robert's input, not invented |
| `breed_shape` function | Still blocked entirely — needs full table first |
