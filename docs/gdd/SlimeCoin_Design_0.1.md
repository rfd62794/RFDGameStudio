# SlimeCoin — Design.md
*June 2026 | RFDGameStudio target. Engine-agnostic. Raccoin is the reference implementation.*

---

## Vision

The player drops a slime blob onto a shelf full of other slimes, watches the cascade, and
feels the payoff when a pile of slimes oozes off the front edge into the collection vat.
Between drops, they choose a chip card that changes how the next drop behaves.

**World framing:** A SlimeGarden harvest machine. Ripe slimes accumulate on the pusher
shelf. The platform sweeps them forward. Slimes that reach the front lip fall into
collection jars below. Falling in is the point — not an accident.

---

## Core Loop

**Active:** Drop slime → land on shelf → pusher sweeps → slimes cascade off edge → collect
value → choose chip card → repeat.

**Idle variant:** The pusher sweeps automatically whether the player drops or not. Dropping
is the player's control surface — timing and position, not speed.

**Run arc:** The loop runs until the player fills their collection jar (run cleared) or
empties their drop queue without enough slimes falling (run failed). Each run produces a
score. Runs are short — 5 to 15 minutes.

---

## Design Pillars

**Cascade Satisfaction** — Every drop causes a visible chain reaction. Slimes have distinct
mass profiles so the behavior is unpredictable but always readable. A heavy slime pushes
others. A light slime bounces across the pile. The player reads the board and places accordingly.

**Chip Synergy** — The deckbuilder layer gives each run a unique identity. Cards interact
in ways the player discovers mid-run, not in tutorials. A card that seems weak alone becomes
a centerpiece when paired with the right slime type.

**Slime Character** — Each slime variant behaves differently because of its physics, not
its label. Mass, radius, bounciness, and special trigger behaviors are the personality.
No two runs feel the same because the board is never the same.

**Run Closure** — Every run has a clear start, arc, and end. The player always knows where
they are in the run. No infinite loops, no maintenance obligations.

---

## World

**Space:** The harvest machine — a coin pusher cabinet skinned as a SlimeGarden harvesting
device. The board is the primary view at all times.

**What the player sees:** A pusher shelf at the top (slimes pile up here), a lower field
(slimes accumulate and stack), a front edge (the collection lip), and vat indicators at the
bottom showing what has been harvested.

**What is permanently off-screen:** The SlimeGarden itself. The machine is a device within
that world. Narrative context is ambient — not tutorial, not cutscene.

**Player relationship:** Operator. The player runs the machine. The slimes are the crop.

---

## Entities

### Slime Coins
- **Role:** The physical coins on the board. They fall, pile, and cascade.
- **Player relationship:** The player drops them from the top. They own the drop, not the slime.
- **Visual signature:** Circular slime blobs with a jiggle. Different species have distinct
  colors, sizes, and markings recognizable at a glance.
- **Progression:** New slime types unlock as coins collected milestone thresholds are crossed.
  Later slimes have higher mass, value, or special trigger behaviors.

**Slime variants (MVP — 6 types):**

| ID | Name | Mass | Radius | Value | Behavior |
|---|---|---|---|---|---|
| `basic` | Green Slime | 1.0 | 14 | 1 | Standard. Starting slime. |
| `heavy` | Rock Slime | 2.2 | 16 | 3 | High mass. Pushes others on landing. |
| `light` | Bubble Slime | 0.8 | 13 | 5 | Low mass. Bounces across the pile. |
| `sticky` | Tar Slime | 1.5 | 15 | 10 | High value. Clusters with adjacents. Glows. |
| `dense` | Iron Slime | 3.5 | 18 | 15 | Very heavy. Steamrolls everything in path. |
| `rare` | Crystal Slime | 1.8 | 17 | 25 | Rare drop. High value. Triggers chip bonuses. Glows. |

---

### Chip Cards
- **Role:** The deckbuilder layer. Chosen between intervals. Modify how slimes behave,
  what triggers fire, and what bonuses activate.
- **Player relationship:** The player chooses one of three offered cards. Each choice is
  permanent for the run.
- **Visual signature:** Cards appear in a modal with a slime illustration, name, and
  one-sentence effect description.
- **Progression:** The card pool expands as run milestones are reached. Rare cards only
  appear after a certain number of runs.

**Pocket Coins (special drops — same as Raccoin's pocket coin system):**

These are one-use special slimes placed from the player's pocket. They appear on the board
as oversized versions with distinct markings.

| ID | Name | Effect |
|---|---|---|
| `boom` | Blast Slime | Explodes on collection — launches nearby slimes toward the edge |
| `pull` | Magnet Slime | Pulse pulls all slimes toward the front edge on collection |
| `double` | Echo Slime | Adds +5 free drops to the drop queue on collection |
| `giga` | Giant Slime | 3× standard size, 10× mass — steamrolls everything |

---

### The Pusher
- **Role:** The platform that sweeps forward and back, building pressure until slimes cascade.
- **Player relationship:** Automatic. The player does not control speed or position.
  Timing a drop relative to the pusher position is the skill expression.
- **Visual signature:** A flat platform with a glowing lip (SlimeGarden green). The sweep
  is sinusoidal — it accelerates into the push and decelerates on retraction.
- **Progression:** Pusher speed increases on later levels within a run.

---

### Board Obstacles
- **Role:** Objects placed on the board that deflect slimes unpredictably.
- **Types (MVP):**
  - **Peg** — Standard deflector. Small, silver mushroom cap. Slight bounce.
  - **Bumper** — High-bounce obstacle. Glowing toadstool. Unlocked via wheel reward.
  - **Multiplier Pad** — Doubles the value of any slime that passes over it.
  - **Slime Tower** — Stacked slimes that collapse and scatter coins when hit 3 times.
  - **Gutter Guard** — Temporary side barriers that prevent gutter losses (15 seconds).

---

## Resource Economy

```
Drop Queue → Slime Coin on Board → Cascade → Collected Slimes → Run Score
                                                     ↓
                                              Chip Card Draw
                                             (every 25 collected)
                                                     ↓
                                           Deck of 3 choices → Pick 1
```

**Gutter:** Slimes that fall off the side edges (not the front) are lost — no score, no
collection credit. Gutter width increases on harder levels.

**Combo:** 3+ slimes collected within a 2-second window triggers a Combo bonus. Floating
text displays the count. Combo multiplier applies to score only, not to chip card timing.

**Run end conditions:**
- **Clear:** Collected slimes reach the run target. Player receives score grade (S/A/B/C).
- **Fail:** Drop queue empties before target reached. Score still awarded for what was collected.

---

## Session Design

| Session Length | What the player produces |
|---|---|
| 2 minutes | First cascade visible. At least 5-10 slimes collected. First chip card offered. |
| 5 minutes | Two chip card choices made. First synergy fires. Board has a visible "build." |
| 15 minutes | Run arc complete or nearly so. Score grade visible. New slime type may have unlocked. |

---

## UI Architecture

**Game start:** Board fills the primary view. Pusher at top, slime pile in the lower field,
collection vat indicator at the bottom. Drop queue count visible (top right). Score counter
(top left).

**Tab / screen structure:**
- **Board** (primary) — 90% of play time. Click/tap to drop. Board state is always live.
- **Card Select** (modal) — Appears every 25 collected slimes. Three chip cards offered.
  Player picks one. Modal dismisses. Board resumes.
- **Run End** (modal) — Score grade, total collected, best combo, new unlock if applicable.
  "Play Again" or "Return to Menu."
- **Pocket Coin Picker** (modal) — Accessible via pocket icon. Shows available pocket coins.
  Selecting one places it as the next drop.

**Always visible:** Drop queue count, run score, current level name, pusher position indicator.

---

## MVP Scope

### Included
- Core pusher physics — sinusoidal sweep, gravity, elastic coin-to-coin collision, gutter
- 6 slime coin types
- 4 pocket coin types (Blast, Magnet, Echo, Giant)
- 5 board obstacle types (Peg, Bumper, Multiplier, Tower, Gutter Guard)
- Chip card system — 12 cards minimum, 3 offered per draw, one pick
- Wheel reward system (between runs or at run milestone — same as Raccoin)
- 1 run structure (25-collected intervals → card draws → run target)
- 1 board theme (SlimeGarden green / organic aesthetic)
- 4 level difficulty tiers within a run (increasing pusher speed + gutter width)
- Combo detection (3+ in 2 seconds)
- Score grade (S/A/B/C based on speed of run completion)
- RFDGameStudio integration — Lua physics engine, TypeScript renderer

### Explicitly Deferred
- Meta-progression (permanent unlocks across runs) — no cross-run persistence in MVP
- Additional board themes / visual skins — one theme ships
- Multiplayer / leaderboard — single-player only
- More than 12 chip cards — expand post-launch based on play data
- Boss encounters / special run events — run is currently flat difficulty arc
- Mobile / PyGame renderer — TypeScript web renderer first; PyGame follows same pattern
  as horse_racing and slither_rogue after TypeScript certified

---

## Platform Targets
- Primary: RFDGameStudio TypeScript renderer (in-browser via RFDArcadeServe)
- Secondary: PyGame renderer (follow slither_rogue real-time port pattern)
- Build: Vite → dist/ → served via RFDArcadeDev :5173

---

## Technical Notes

**Port-Engine pattern:** Real-time. Same pattern as slither_rogue — `tick_game(dt, input)`
called every frame. Lua owns GAME_STATE. TypeScript renders from flat arrays returned by
`tick_game`.

**Physics in Lua:** Coin-to-coin elastic collision, pusher sweep, gravity, gutter detection.
The existing example (`CoinPusherGame.tsx`) is the physics reference implementation.
Translate sinusoidal pusher, multi-iteration collision resolution, and fall detection
into Lua. TypeScript receives coin positions, board object positions, and event flags.

**Collect pattern mandatory:** All Lua functions receiving Python list proxies via lupa
must use `collect()` before `#` or index access. Reference: `games/horse_racing/logic.lua`.

**Input:** Click/tap X position = drop coordinate. No other input required for MVP.
Pocket coin selection is a UI modal — TypeScript handles selection, passes typeId to Lua
on next tick via input payload.

**Save state:** None in MVP. Run is ephemeral. No localStorage, no persistence.

**Reference code:** `C:\Github\RFDGameStudio\examples\coin-pusher-arcade\src\components\CoinPusherGame.tsx`
This is the physics source of truth. Port to Lua, do not reinvent.
