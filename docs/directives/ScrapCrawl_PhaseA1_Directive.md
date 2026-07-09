# ScrapCrawl (RFDGameStudio) — Phase A.1: Combat Gating Fix + UI Design Pass

*July 2026 | Read fully before executing anything.*

---

> ⛔ **STOP:** Verify baseline before touching anything. Confirmed this
> session: `188 passed` (Python), `49 passed` (TypeScript), both exit 0.
> Re-run yourself first.

---

## §0 Context

**What this delivers:** Two things, in order, because the first is a bug and
the second is design work that shouldn't be planned on top of broken combat.

**Part 1 — a real, confirmed bug found by actually playing the game, not by
review.** `App.tsx`'s Fight button has zero gate against `currentRoom`'s
allowed interactions, and `resolve_fight` in `logic.lua` has zero validation
that the room passed to it is fight-capable. Home Base has no `difficulty`
field, so `room.difficulty or 0` silently resolves to `0` — mathematically
unloseable, since the minimum possible score (roll 1, unarmed baseline 2 ×
floor growth factor 0.8 = 1.6) is always above 0. The result, screenshotted
live: nine consecutive free wins at Home Base, Proficiency climbing to 135
from a loop that was never supposed to exist. 213 passing tests never caught
this because nothing tested "attempt Fight while standing in a non-fight
room" — that's a real anchor gap, not just a UI oversight, and it gets
closed with a test, not just a fix.

**Part 2 — the UI is genuinely thinner than the original, confirmed by
direct comparison, not a matter of taste.** `scrapcrawl/styles.css` doesn't
reference the shared token system (`ui/tokens.css`) at all — it hardcodes
its own disconnected palette. The original `examples/scrapcrawl` established
a real identity worth actually matching: near-black background, glowing
status indicators, durability bars that shift color under a threshold, a
terminal-style combat trace. This phase brings the port up to that,
correctly, using the shared tokens rather than reinventing a third palette.

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `games/scrapcrawl/logic.lua` | Modify | Add room-type validation to `resolve_fight` |
| `ts/src/games/scrapcrawl/App.tsx` | Modify | Gate Fight button on room interaction type; add equipment/proficiency visualization |
| `ts/src/games/scrapcrawl/styles.css` | Modify | Full rewrite using shared tokens, matching original's identity |
| `tests/test_scrapcrawl.py` | Modify | New anchor for the room-gating fix |
| `ts/tests/test_arcade.ts` | Modify | New anchor confirming Fight is absent/disabled outside fight rooms |
| `ts/src/ui/tokens.css` | Read-only | Consume these values, do not add game-specific colors here |
| `games/mutant_battle_ball/**`, `examples/**`, `games/chimera_wilds/**` | Read-only | Unrelated to this phase |

---

## §2 Implementation

### Part 1 — Combat gating

**`logic.lua`:**
```lua
function resolve_fight(data, player, room, roll, scrap_reward)
  local interaction_types = room.interaction_types or room.interactionTypes or {}
  local can_fight = false
  for _, t in ipairs(interaction_types) do
    if t == "fight" then can_fight = true end
  end
  if not can_fight then
    error('Cannot fight in room "' .. tostring(room.id) .. '" — not a fight-capable room.')
  end
  -- ... existing logic unchanged below this point
```

> ⚠️ RULE: This is a defensive backend guard, not the primary fix. It exists
> so that even if a future renderer forgets the frontend gate, the backend
> cannot be walked into resolving a fight that shouldn't exist. Both layers
> get fixed — neither one alone is sufficient, and "the UI already prevents
> it" is not an acceptable reason to skip this.

**`App.tsx`:**
```typescript
const canFight = state.currentRoom.interaction_types?.includes('fight') ?? false;
// ...
<button className="sc-button" onClick={handleFight} disabled={!canFight}>Fight</button>
```

> ⚠️ RULE: Disabled, not hidden. A visible-but-disabled Fight button at Home
> Base communicates the room's nature; making it vanish entirely is a worse
> UX than showing the player what they can't do here and why.

### Part 2 — Design plan, grounded in the original's actual identity

**This is not a new aesthetic — it's fidelity to what already existed and
worked.** Don't invent a third direction. Reference `examples/scrapcrawl`'s
established look directly (near-black canvas, glowing status indicators,
threshold-based durability coloring, terminal-style trace) and re-implement
it correctly, through the shared token layer this time instead of a
disconnected hardcoded palette.

**Token usage — extend `tokens.css` only if a genuinely new value is needed,
and justify it. Prefer what's already there:**
```
--bg (#0f1117), --surface (#1a1d27), --border (#2e3350), --text (#e8eaf0),
--accent (#6c8ef7) for structural/interactive elements,
--green/--yellow/--red for durability and proficiency thresholds
```
The original used a warmer amber accent for its ScrapCrawl-specific
identity — if that's worth preserving as this game's signature color against
the studio's cooler blue `--accent`, that's a legitimate per-game override
via `styles.css` (ADR-008 explicitly allows this: `.horse-card { --card-accent:
var(--color-yellow); }` is the documented pattern) — but it must be a
deliberate token override, not a hardcoded hex value disconnected from the
system entirely, which is the actual problem being fixed here.

**Concrete elements to add, not just restyle:**
- **Durability bars** — `stat_bar`-equivalent visualization per equipped
  item, color-shifting via `--red` below a life threshold (roughly life/maxLife
  < 0.2, matching the original's "below 2/10" behavior), not just a plain
  number
- **Equipment display as cards**, not a single collapsed text line —
  slot, tier, life/maxLife, using the same visual language as the
  durability bars above them
- **Proficiency as a bar with the growth-factor curve implied visually**
  (e.g., fill percentage against the 500 XP ceiling), not a bare number
- **Room connections as cards showing destination + whether it's a fight
  room**, not plain unstyled buttons — this doubles as reinforcing the Part 1
  fix, since a player should be able to see which rooms fight is even
  possible in before clicking Move
- **Combat log restyled as a terminal trace** — monospace, bracketed tags
  (`[WIN]`/`[LOSS]`), matching the original's console-trace aesthetic
  directly, not a plain bulleted list

**Signature element:** the durability-bar-goes-red-under-threshold moment is
the one thing worth making genuinely satisfying to watch — it's the visual
expression of the entire "disposable equipment, no repair" design thesis
this whole game is built around. Spend the design attention there; keep
everything else disciplined and quiet around it.

> ⚠️ RULE: Responsive down to mobile, visible keyboard focus states, and
> respect `prefers-reduced-motion` if any animation gets added for the
> durability-bar transition. Build to this floor without being asked to
> justify it separately.

---

## §3 Test Anchors

Target: **188 + 3 = 191 Python**, **49 + 2 = 51 TypeScript**, both 0 failed.

| Test name | Suite | Behaviour |
|---|---|---|
| `test_resolve_fight_rejects_non_fight_room` | Python | Calling `resolve_fight` against Home Base throws, doesn't silently resolve |
| `test_resolve_fight_still_works_in_real_fight_rooms` | Python | Regression guard — the four real fight rooms are unaffected |
| `test_data_yaml_home_base_has_no_difficulty` | Python | Confirms the room shape itself, not just the gate, matches intent |
| `test_fight_button_disabled_at_home_base` | TypeScript | Rendered but `disabled` when `currentRoom` lacks `fight` |
| `test_fight_button_enabled_in_fight_room` | TypeScript | Regression guard for the real fight rooms |

---

## §4 Completion Criteria

- [ ] `191 passed, 0 failed` (Python) — raw output
- [ ] `51 passed, 0 failed` (TypeScript) — raw output
- [ ] Manual proof: screenshot or trace showing Fight disabled at Home Base,
      and a real fight still resolving correctly in `scrap_pit`
- [ ] Manual proof: screenshot of the redesigned UI, durability bar visibly
      shifting color at low life — not just code, an actual rendered result
- [ ] `npx tsc --noEmit` — zero new errors attributable to `scrapcrawl`
- [ ] Confirm no hardcoded hex colors remain in `scrapcrawl/styles.css`
      outside a deliberate, commented token override — `grep -E "#[0-9a-fA-F]{3,6}"`
      should only match documented overrides, not stray values
- [ ] `docs/state/current.md` updated, headed CERTIFIED when done

---

## §5 Quick Reference

| Item | Value |
|---|---|
| Root cause | `resolve_fight` + Fight button both lack room-type validation |
| Fix | Backend guard + frontend disabled state, both layers |
| Design direction | Fidelity to `examples/scrapcrawl`'s established identity, via shared tokens |
| Signature element | Durability bar threshold-color shift |
| Explicitly not in scope | New game mechanics, roster/breeding (Phase B), LLM content (Phase C) |

---

*ScrapCrawl (RFDGameStudio) — Phase A.1 Directive*
*RFD IT Services Ltd. | July 2026*
*Playing it found a real bug in one screenshot. Fix that before making it prettier.*
