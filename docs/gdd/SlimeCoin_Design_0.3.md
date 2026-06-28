# SlimeCoin — Design.md v0.3
*June 2026 | RFDGameStudio target. Engine-agnostic.*
*v0.1: initial concept. v0.2: physics MVP (current code). v0.3: economy + pool expansion (this document).*

---

## Vision

The player shoots slime coins onto a shelf, watches the pusher compact them toward the
edge, and the pile cascades onto the floor below — where slime synergies chain-react and
coins flow toward the vat. The vat fills with tokens. Tokens buy more shots and better
cards. Cards expand the slime pool. The pool makes each shot a decision because you can
see what's coming next.

**World framing:** A SlimeGarden harvest machine. Three physical layers: the shelf where
slimes are loaded and pushed, the floor where they accumulate and react, and the vat
where collected slimes become currency. The player is the operator. Slimes are the crop.

---

## Core Loop

```
Shot Queue → Shoot (left or right shooter) → Shelf
                                               ↓ (pusher compacts)
                                             Floor
                                               ↓ (slimes drift forward)
                                              Vat  ←── Score + Tokens earned here
                                               ↓
                         ┌─────────────────────┴──────────────────────┐
                   Mid-round Exchange                           End of round Shop
               (tokens → more shots)                    (tokens → cards, pocket coins)
                                                                       ↓
                                                              Card adds slime to pool
                                                                       ↓
                                                           Shot Queue now includes it
```

**Floor persists between rounds.** Slimes already on the floor carry into the next round.
Setting up the floor before closing a round is a strategic option.

**Run end:** 15 rounds. No hard fail on missing a target — target is the arc indicator.
Run ends when the player runs out of shots AND tokens to exchange for more.

---

## Design Pillars

**Queue Awareness** — The shot queue shows the next 3-5 slimes in order. The player
knows what's coming and places accordingly. Left shooter or right shooter is a positioning
decision, not a random fire.

**Pool Expansion** — Cards don't just give passive bonuses. Each card adds a new slime
type to the pool, which starts appearing in the queue. Early rounds are mostly basic
slimes. By round 8, the queue mixes 4-6 types and every shot has a purpose.

**Pairwise Synergies** — Two specific slime types landing adjacent on the floor trigger
a combined effect neither produces alone. Crystal + Bubble = crystal value floats back
to the shelf. Iron + Zombie = zombie conversions produce iron slimes instead of basic.
Synergies are shown on the card when you pick it — discovery is informed, not random.

**Token Tension** — Tokens are the survival resource and the upgrade resource. Spending
on exchanges keeps you alive this round. Spending at the shop builds your next round.
The run lives or dies on this tension.

**Score Rate** — Combos build the multiplier. Score Rate compounds all subsequent
scoring. Managing when combos fire is the meta-skill.

---

## World

**Three physical layers:**

| Layer | What happens here |
|---|---|
| **Shelf** | Slimes are shot here. Pusher compacts them forward. Pegs and obstacles deflect. |
| **Floor** | Slimes fall from shelf. Pile accumulates. Synergies trigger on coin contact. Slimes drift forward toward the vat lip. |
| **Vat** | Slimes fall off the floor front edge. Score event fires. Token earned. Vat fills visually. |

**Shooter:** Two launchers at the top of the shelf — left edge and right edge. Left arrow
fires from the right shooter traveling left. Right arrow fires from the left shooter
traveling right. The Shot Queue is visible next to the shooter indicator.

**Vat visual:** A tray below the floor front edge. Slimes visually accumulate here.
The vat fill level is a secondary indicator of run health — a full vat means tokens to
spend. An empty vat means survival pressure.

---

## Entities

### Shot Queue
- **Role:** The ordered list of slime types the player will fire, shown as a visible
  queue (Tetris-style next-up).
- **Size:** 5 slimes visible at once. The next shot is always known.
- **Source:** Randomly drawn from the current slime pool. Pool composition changes as
  cards are picked.
- **Player relationship:** Informs placement decisions. The player adjusts left/right
  based on what type is next and where it needs to land.
- **Early run:** Queue is mostly basic slimes with occasional heavy/light.
- **Late run:** Queue mixes all pool types. Every shot is a decision.

---

### Slime Pool
- **Role:** The set of slime types that appear in the Shot Queue. Starts small, expands
  via card picks.
- **Starting pool (round 1):** basic (×5 weight), heavy (×2), light (×2).
- **Card expansion:** Each card pick adds one new slime type to the pool at a specified
  weight. Picking the Zombie card adds zombie slimes to the queue at low weight initially.
- **Pool visibility:** Shown as an icon strip during the card select modal — player can
  see exactly what their pool will contain after picking.

---

### Slime Coins
- **Role:** Physical slimes on the board — shelf and floor. Carry slime identity through
  all three layers.
- **Identity:** Type, mass, radius, base value, synergy flags.
- **Scoring:** When a slime enters the vat: Score += value × Score Rate. Token += 1
  (base, modified by slime type and cards).

**Slime types (v0.2 base — 6 types):**

| ID | Name | Mass | Radius | Value | Token yield | Behavior |
|---|---|---|---|---|---|---|
| `basic` | Green Slime | 1.0 | 14 | 1 | 1 | Standard. |
| `heavy` | Rock Slime | 2.2 | 16 | 3 | 2 | Pushes adjacent on landing. |
| `light` | Bubble Slime | 0.8 | 13 | 5 | 3 | Bounces on landing. |
| `sticky` | Tar Slime | 1.5 | 15 | 10 | 4 | Clusters on floor contact. |
| `dense` | Iron Slime | 3.5 | 18 | 15 | 5 | Clears path on landing. |
| `rare` | Crystal Slime | 1.8 | 17 | 25 | 8 | Synergy trigger. Glows. |

**Slime types added via cards (v0.3 — examples):**

| ID | Name | Added by card | Synergy partner | Combined effect |
|---|---|---|---|---|
| `zombie` | Zombie Slime | Zombie card | `basic` | Converts adjacent basic → zombie on floor contact |
| `mirror` | Mirror Slime | Mirror card | `rare` | Adjacent crystal values echo to mirror, double tokens |
| `void` | Void Slime | Void card | `dense` | Iron + void contact clears a 5-radius area of floor |
| `spark` | Spark Slime | Spark card | `light` | Bubble + spark contact launches both back to shelf |

**Bad Slimes:** Reduce Score Rate or block synergies. Appear on round modifiers.

---

### Slime Tokens
- **Role:** The primary currency. Earned when slimes fall into the vat.
- **Uses:**
  - **Exchange** — spend tokens for more shots mid-round
  - **Shop** — spend tokens on cards and pocket coins between rounds
- **Earn rate:** Base 1 token per slime collected. Rare slimes yield more. Synergy
  chains can yield bonus tokens.
- **No carry-over decay** — tokens accumulate across rounds. Spending is the player's
  choice, not forced.

---

### Exchange (mid-round)
- **Role:** Survival mechanic. Spend tokens for more shots when Hand reaches 0.
- **Cost:** Round 1 = 5 tokens for +5 shots. Cost increases each exchange within the
  same round. Cost resets at round start.
- **Limit:** 3 exchanges per round max.
- **Run end condition:** Hand = 0 AND no tokens to exchange AND no exchanges remaining.

---

### Shop (between rounds)
- **Role:** Upgrade mechanic. Spend tokens on cards and items after each round.
- **Offers:**
  - **Slime Cards** (3 offered, pick 1 free) — adds slime type to pool, may add synergy
  - **Pocket Coins** (purchasable) — blast, magnet, echo, giga
  - **Hand Upgrade** (purchasable) — increase base Hand count by +2

---

### Cards
- **Role:** The deckbuilder layer. Each card does two things: adds a slime type to the
  pool AND grants a passive synergy rule for that type.
- **Pick timing:** 1 free card offered after each round (from shop). Additional cards
  purchasable.
- **Card structure:**
  - Name + slime type added to pool
  - Pool weight (how often it appears in queue)
  - Synergy partner (which other type it reacts with)
  - Combined effect (what happens when they land adjacent on floor)
  - Rarity: Common / Rare / Epic

**Cards show synergy partner explicitly.** If you pick Zombie card, you see: "pairs with
Green Slime." If you already have Green in your pool, the synergy is immediately active.
If not, the synergy waits until you add Green (which is always in the starting pool).

---

### Pairwise Synergies
- **Trigger:** Two compatible slime types land adjacent on the floor (within combined
  radius + 5px).
- **Resolution:** One-time effect per contact event. Does not repeat on same pair.
- **Display:** Floating text on the floor showing synergy name and bonus.
- **Player knowledge:** All active synergies shown in a compact list in the HUD sidebar.

---

### The Pusher
- **Role:** Automatic platform sweeping the shelf. Compacts slimes toward the front edge.
- **Speed:** Increases each round.
- **v0.3 addition — Expand/Collapse:** The pusher depth can expand (deeper shelf, more
  coins loaded) or collapse (shallower, faster turnover). Deferred — planned for v0.4.

---

### Pocket Coins
Four types unchanged from v0.2: Blast, Magnet, Echo, Giant.
Purchasable from shop with tokens in v0.3.

---

### Vat
- **Role:** Third physical layer. Collection tray at the front edge of the floor.
- **Physics:** Slimes that cross the floor front edge fall into the vat. Score and token
  events fire at this moment. Slimes do not bounce back — vat is terminal.
- **Visual:** Fills visually as slimes collect. Shows approximate token count.
- **Between rounds:** Vat drains (slimes processed). Token count shown in HUD persists.

---

## Resource Economy

```
Shot Queue → Shoot → Shelf → Floor → Vat
                                      ↓
                               Score Event (value × Score Rate)
                               Token Event (+N tokens)
                                      ↓
                    ┌─────────────────┴─────────────────┐
              Exchange (mid-round)               Shop (end of round)
          5→8→12 tokens per exchange          Cards / Pocket Coins / Hand+
              +5 shots, max 3×                  Free card pick + purchases
```

**Score Rate:** Starts at ×1.0. Builds via combos. Resets at round start.
Synergy chains count as combos — a 5-chain synergy can spike Score Rate mid-round.

**Token pressure:** Late rounds cost more to exchange. The shop competes with survival.
This is the core tension.

---

## Session Design

| Session | What the player produces |
|---|---|
| 2 min | First round. Shot queue understood. First vat collection. Token count visible. |
| 5 min | First exchange used. First card picked. New slime type appears in queue. |
| 15 min | First synergy fires. Build identity clear. Token management is the active decision. |
| 30 min | Mid-run. 2-3 synergies active. Floor is a reactive system. Shop decisions compound. |

---

## UI Architecture

**Primary view (board):**
- Shelf (back), Floor (front), Vat (bottom strip)
- Shot Queue visible at shooter position — next 3 slimes shown as icons
- HUD: Round/Total, Score/Target, Score Rate, Hand count, Token count

**HUD sidebar:**
- Active synergies list (name + icon pairs)
- Token count (large)
- Exchange cost indicator (updates per exchange used)

**Card Select (modal — after each round):**
- 3 cards shown
- Each card: slime type added, pool weight, synergy partner, combined effect, rarity
- Pool preview: icon strip showing what queue will contain after picking

**Shop (modal — same trigger as card select, integrated):**
- Free card pick section (top)
- Purchasable items section (bottom): pocket coins, hand upgrade, additional cards

**Exchange (inline — mid-round):**
- Button visible when Hand = 0
- Shows cost and exchanges remaining
- Fires immediately on confirm

---

## Version Scope

### v0.2 (current code)
- Three-layer board (shelf, floor, vat pending)
- Coin shooter (left/right, two top shooters)
- Sinusoidal pusher
- 6 slime types
- 4 pocket coin types
- 4 board obstacles
- Score Rate + combo
- 15-round run
- Card select modal (passive bonuses only)
- No economy

### v0.3 (this document — next implementation target)
- **Vat** as scoring + collection layer (floor front edge = drop into vat)
- **Slime Tokens** earned at vat
- **Shot Queue** visible (next 3-5 slimes shown)
- **Slime Pool** starts small, expands via cards
- **Cards** add slime types to pool + pairwise synergy rule
- **Pairwise Synergies** — floor contact between two types triggers combined effect
- **Exchange** — mid-round token spend for more shots
- **Shop** — end-of-round token spend
- **Floor persists between rounds**

### Explicitly Deferred (v0.4+)
- Pusher Expand/Collapse mechanic
- Spin wheel
- Bad Coin round modifiers (enemy slimes)
- Meta-progression across runs
- PyGame renderer
- Additional board themes
- Character selection (Raccoin-style different starting builds)
- More than 4 slime types added via cards (start with 4, expand by content update)

---

## Technical Notes

**Port-Engine pattern:** Real-time. `tick_game(dt, input)` every frame. Lua owns
GAME_STATE. TypeScript renders from flat arrays.

**v0.3 additions to GAME_STATE:**
- `vat_coins` — list of coins in vat (for visual fill)
- `tokens` — integer, current token count
- `slime_pool` — table of {type_id, weight} entries
- `shot_queue` — ordered list of next N slime type_ids
- `exchanges_used` — integer, resets per round
- `active_synergies` — list of {type_a, type_b, effect_id} pairs (from owned cards)
- `floor_coins` persists across `start_round` (not cleared)

**v0.3 additions to input:**
- No new input fields — exchange and shop are modal events, not tick inputs

**Synergy detection:** On every floor coin-to-coin contact, check if the pair
(coin1.type_id, coin2.type_id) matches any entry in `active_synergies`. If yes,
trigger the effect once and flag the pair as triggered for this contact event.

**Shot queue generation:** On `init_game` and after each `fire_coin`, draw next slime
type from pool using weighted random. Maintain a buffer of 5 pre-drawn types.
Return `shot_queue` in tick render state so TypeScript can display next-up icons.

**Collect pattern mandatory:** All Lua functions receiving Python list proxies via lupa
must use `collect()` before `#` or index access.

**Reference game:** Raccoin (Playstack, 96% positive).
**Reference code:** `C:\Github\RFDGameStudio\examples\coin-pusher-arcade`
