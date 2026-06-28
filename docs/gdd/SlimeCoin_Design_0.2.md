# SlimeCoin — Design.md
*June 2026 | RFDGameStudio target. Engine-agnostic. Raccoin is the reference implementation.*

---

## Vision

The player aims a coin shooter at a shelf full of slime blobs, fires, watches the pusher
sweep coins off the edge, and the pile on the floor below grows — triggering chip synergies
that chain-convert blobs into higher-value variants. The deckbuilder layer is the game.
The coin pusher is the delivery mechanism.

**World framing:** A SlimeGarden harvest machine viewed in 3D perspective. The upper shelf
holds ripe slimes waiting to be pushed off. The lower floor is the collection vat where
harvested slimes accumulate and interact. The player shoots new slimes onto the shelf from
a launcher at the bottom.

---

## Core Loop

**Active:** Aim shooter (left/right) → fire slime coin onto upper shelf → pusher sweeps
shelf coins forward → coins fall from shelf to lower floor → floor coins trigger chip
synergies → Score Rate increases with combos → round ends when player runs out of shots.

**Between rounds:** Choose one of three chip cards. Score Rate carries into next round.
Run = 15 rounds. Each round has a target score. Clearing the target advances the run arc.

**Idle variant:** None. SlimeCoin is active — every shot is a placement decision.

---

## Design Pillars

**Shooter Placement** — The player aims left/right to place coins at specific shelf
positions. Landing a coin next to a specific slime type triggers different chain reactions.
Aim is the primary skill expression.

**Synergy Chains** — Chip cards give slime types on the floor special abilities. A Zombie
Slime converts adjacent coins into Zombie Slimes (up to 20 times per round). A Crystal
Slime multiplies the value of everything it touches. Chains can cascade wildly — or do
nothing if the board isn't set up for it.

**Score Rate** — Combos don't just add points — they increase the Score Rate multiplier.
A high Score Rate early in a round compounds everything that follows. Managing when combos
trigger is the meta-skill.

**Run Identity** — Each run has a unique deck of chip cards drawn from the available pool.
A Zombie build plays completely differently from a Crystal build. The player doesn't just
accumulate — they discover a strategy mid-run.

---

## World

**Space:** The harvest machine — a 3D coin pusher cabinet viewed in isometric/angled
perspective. Two visible levels: the upper shelf (raised platform where the pusher
operates) and the lower floor (where coins accumulate after falling from the shelf).

**What the player sees:** Upper shelf at the back with the pusher behind it. Lower floor
in the foreground filling with slimes. The shooter is at the bottom — the player's
position. Score, round, target, Score Rate, and Hand In count are always visible in HUD.

**What is permanently off-screen:** The SlimeGarden itself. This machine exists within
that world.

**Player relationship:** Operator. The player runs the machine. The slimes are the crop.

---

## Entities

### Slime Coins
- **Role:** The physical slimes on the board. They land on the shelf, get pushed to the
  floor, and interact via chip synergies.
- **Player relationship:** The player shoots them onto the shelf. Once on the board,
  they behave according to their chip properties.
- **Visual signature:** Circular slime blobs with species-specific markings. Visible
  at a glance by color and pattern.
- **Progression:** New slime types unlock as run milestones are crossed.

**Slime variants (MVP — 6 types):**

| ID | Name | Mass | Radius | Value | Behavior |
|---|---|---|---|---|---|
| `basic` | Green Slime | 1.0 | 14 | 1 | Standard. No special behavior. |
| `heavy` | Rock Slime | 2.2 | 16 | 3 | High mass. Pushes adjacent coins on landing. |
| `light` | Bubble Slime | 0.8 | 13 | 5 | Low mass. Bounces on landing. |
| `sticky` | Tar Slime | 1.5 | 15 | 10 | Clusters with adjacent slimes on floor contact. |
| `dense` | Iron Slime | 3.5 | 18 | 15 | Very heavy. Clears a path through the pile. |
| `rare` | Crystal Slime | 1.8 | 17 | 25 | Triggers chip synergy bonuses. Glows. |

**Bad Slimes:** Some rounds introduce Bad Slimes — slimes that reduce Score Rate or
block synergies when they land on the floor. Round modifiers control when bad slimes
appear. "No Bad Coins" is a positive round modifier (same as Raccoin).

---

### The Coin Shooter
- **Role:** The player's primary input device. Aims and fires slime coins onto the upper
  shelf.
- **Player relationship:** Direct control. Left/right aim, fire when ready.
- **Visual signature:** A launcher at the bottom-center of the screen. A trajectory
  indicator shows the arc before firing.
- **Mechanics:**
  - Aim: Left/right axis (keyboard arrows or LT/RT equivalent)
  - Fire: Shoots the next slime in the Hand queue in an arc onto the shelf
  - Special coins get launched with distinct trajectories (higher arc, bouncier landing)
- **Hand In:** The count of slimes queued to fire this round. When Hand reaches 0,
  the round ends.

---

### The Pusher
- **Role:** Platform behind the upper shelf that sweeps coins forward off the shelf edge
  down to the lower floor.
- **Player relationship:** Automatic. The pusher runs continuously. Its speed increases
  on later rounds.
- **Visual signature:** A flat platform visible at the back of the shelf area. Sweeps
  forward and retracts in a sinusoidal cycle.
- **Progression:** Pusher speed increases with round number within the run.

---

### Chip Cards
- **Role:** The deckbuilder layer. Chosen between rounds. Give slime types on the floor
  special abilities that trigger during the round.
- **Player relationship:** Three cards offered at the end of each round. Player picks one.
  Permanent for the run.
- **Visual signature:** Card modal with slime illustration, name, rarity, and one-sentence
  effect. Rarities: Common / Rare / Epic.
- **Example effects (referencing Raccoin's Zombie card):**
  - *Zombie Slime* — Converts coins it touches into Zombie Slimes. Up to 20 times per round. (Epic)
  - *Crystal Burst* — Crystal Slimes multiply the value of adjacent coins on contact. (Rare)
  - *Heavy Impact* — Rock Slimes trigger a shockwave on landing that moves 3 adjacent coins. (Common)
  - *Bubble Chain* — Bubble Slimes link into chains — if 5+ are adjacent, all pop for bonus score. (Rare)

---

### Pocket Coins (Special Launches)
- **Role:** One-use special slimes launched from the shooter with distinct effects.
  Selected from the player's pocket before firing.
- **Types (MVP — 4):**

| ID | Name | Effect |
|---|---|---|
| `boom` | Blast Slime | Explodes on shelf contact — launches adjacent coins forward off the edge |
| `pull` | Magnet Slime | Pulls all floor coins toward a center point on landing |
| `echo` | Echo Slime | Adds +5 to Hand In count (more shots this round) |
| `giga` | Giant Slime | 3× size, 10× mass — steamrolls everything in its path on the shelf |

---

### Board Obstacles
- **Role:** Objects on the shelf that deflect coins into unpredictable positions.
- **Types (MVP):**
  - **Peg** — Standard deflector. Slight bounce on contact.
  - **Bumper** — High-bounce peg. Unlocked via wheel reward.
  - **Multiplier Pad** — Doubles score value of any coin that passes over it.
  - **Slime Tower** — Collapses after 3 hits, scattering coins across the shelf.

---

## Resource Economy

```
Hand In (shots queued)
      ↓
  Coin Shooter → Upper Shelf → Pusher sweeps → Falls to Lower Floor
                                                       ↓
                                              Chip Synergies fire
                                                       ↓
                                              Score Rate × coin value = Round Score
                                                       ↓
                                        Round Score vs. Target → Run progress
                                                       ↓
                                              Choose Chip Card
                                                       ↓
                                              Next Round (×15)
```

**Score Rate:** Starts at 1 per round. Increases with combos (multiple coins scoring in
rapid succession). A Combo 190 = Score Rate +95, as shown in Raccoin (Image 4). Score Rate
is the primary lever — building it early in a round compounds every subsequent coin scored.

**No gutter.** Coins do not fall off the sides. All coins stay in play on the lower floor
until end of round. The lower floor is not a loss state — it is where synergies happen.

**Round end:** When Hand In reaches 0. Score vs. target determines round outcome. Run
continues to next round regardless — target is an arc indicator, not a hard fail state
(confirm against Raccoin behavior).

---

## Session Design

| Session Length | What the player produces |
|---|---|
| 2 minutes | First round played. Shooter feel established. First chip card chosen. |
| 5 minutes | Two to three rounds played. First synergy chain fires. Score Rate behavior understood. |
| 15 minutes | Run arc visible — half the rounds completed. Build identity established. |

---

## UI Architecture

**Primary view:** 3D perspective board. Upper shelf in background. Lower floor in
foreground. Shooter at bottom. This view is active for all 15 rounds.

**HUD (always visible):**
- Round N/15 (top center)
- Current Score / Target (top center)
- Score Rate multiplier (left)
- Hand In count (how many shots remain this round)
- Bad Coin status (round modifier indicator, top)
- Spin wheel (left — reward mechanic, same as Raccoin)

**Card Select (modal — between rounds):** Three chip cards. Player picks one. Dismisses.

**Pocket Coin Picker (modal):** Accessible mid-round. Shows available pocket coins.
Selecting one replaces the next shot with that special coin.

**Run End (modal):** Final score, round-by-round breakdown, new unlocks if applicable.
Start new run or return to menu.

**Exchange panel (right side):** Coin type management — same as Raccoin's exchange
system. Swap coin types in the Hand queue. Deferred if complex — confirm scope.

---

## MVP Scope

### Included
- 3D perspective board renderer (upper shelf + lower floor)
- Coin shooter with left/right aim and arc trajectory indicator
- Sinusoidal pusher sweep (back-of-shelf to front)
- 6 slime coin types
- 4 pocket coin types
- 4 board obstacle types (Peg, Bumper, Multiplier Pad, Slime Tower)
- Chip card system — 12 cards minimum, 3 offered per round end, one pick
- Score Rate mechanic — builds via combos, multiplies all scoring
- Bad Coin round modifier (some rounds introduce bad slimes)
- Hand In queue (shots per round)
- 15-round run structure
- Spin wheel reward mechanic (left side — Raccoin reference)
- No gutter system

### Explicitly Deferred
- Exchange panel (coin type swapping mid-run) — confirm scope after MVP
- Meta-progression across runs — MVP runs are ephemeral
- Additional board themes / visual skins — one SlimeGarden theme ships
- More than 12 chip cards — expand post-launch
- Multiplayer / leaderboard
- PyGame renderer — TypeScript web renderer first; PyGame follows after TypeScript certified

---

## Platform Targets
- Primary: RFDGameStudio TypeScript renderer (in-browser via RFDArcadeServe)
- Secondary: PyGame renderer (follows slither_rogue real-time port pattern)
- Build: Vite → dist/ → served via RFDArcadeDev :5173

---

## Technical Notes

**Port-Engine pattern:** Real-time. `tick_game(dt, input)` called every frame.
Lua owns GAME_STATE. TypeScript renders from flat arrays returned by `tick_game`.

**Input payload per tick:**
- `aim_x`: normalized -1.0 to 1.0 (shooter direction)
- `fire`: bool (fire this frame)
- `pocket_coin_type_id`: string or nil (special coin override for next shot)

**Physics in Lua:**
- Coin arc trajectory (shooter angle → velocity vector on spawn)
- Coin-to-coin elastic collision (upper shelf and lower floor separately)
- Pusher sweep (sinusoidal, same pattern as example code)
- Coin fall detection (coin crosses shelf front edge → moves to floor layer)
- Chip synergy triggers (floor coin-to-coin contact detection)

**Two-layer physics:** Upper shelf coins and lower floor coins are separate physics
contexts. A coin transitions from shelf to floor when it crosses the shelf front edge.
Shelf coins use pusher physics. Floor coins use synergy physics (no pusher interaction).

**Collect pattern mandatory:** All Lua functions receiving Python list proxies via lupa
must use `collect()` before `#` or index access. Reference: `games/horse_racing/logic.lua`.

**Reference code:** `C:\Github\RFDGameStudio\examples\coin-pusher-arcade\src\components\CoinPusherGame.tsx`
Physics reference. Port elastic collision and pusher sweep to Lua. Ignore gutter system
(not present in Raccoin). Adapt drop mechanic → shooter arc mechanic.

**Reference game:** Raccoin (publisher: Playstack, 96% positive, 500K+ owners).
Screenshots confirm: no gutters, coin shooter with LT/RT aim, 3D perspective board,
Score Rate multiplier, 15-round run structure, Hand In queue, Bad Coin modifiers,
chip card synergies (Zombie, etc.), spin wheel.
