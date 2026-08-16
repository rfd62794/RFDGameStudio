# RFDGameStudio — Game Design Reference
*Compiled August 16, 2026. Maps external research to studio context.*
*Source doc: game_design_concepts_genres_features.md*

---

## Studio Identity Filter

Before applying any external research, everything passes through this filter:

**What RFDGameStudio is:** Turn-based or automated systems. Mechanics generate the experience — content doesn't. Solo builder on weekends using Director/Pipeline/Agent workflow. No real-time input required. Systems-first production model.

**What it intentionally isn't:** First/third-person shooters. Platformers. Real-time skill games. Content-heavy genres (Farming Sim, City Builder) that require hand-authored art and writing at scale.

This filter is not a limitation — it's a position. The studio has built 21 games from it. Everything below is evaluated through this lens.

---

## The MDA Framework Applied to the Studio

The MDA framework (Mechanics → Dynamics → Aesthetics) maps cleanly onto how Robert builds:

**Robert's natural mode is mechanics-first.** He builds a breeding system, a Voronoi territory engine, a Lanchester combat model. The mechanics are real. The dynamics that emerge from them — and the aesthetics those dynamics produce — are often discovered rather than designed upfront.

This is why SlimeWorld went wrong: the mechanics (breeding, color traits, stat computation) were built in isolation. The aesthetic target — Pokédex-filling satisfaction, the feeling of discovering a rare combination — was never locked first. The MDA framework diagnosis: the mechanics were built without first deciding what aesthetic they were supposed to produce.

**The corrective discipline for future games:** Before writing a directive, name the target aesthetic in one word. Then check that the mechanics being built are the most direct path to that feeling.

| Studio Game | Target Aesthetic (named) | Mechanics Path |
|---|---|---|
| Shoal | Wonder | Emergent ecosystem behavior |
| Brewfield | Discovery | Procedural combination space |
| Derby Sim | Mastery | Genetic optimization toward a performance goal |
| Succession | Tension | Information asymmetry + rival interference |
| Gladiator Arena | Agency | Manager decision → visible fight outcome |
| SlimeWorld (intended) | Collection | Breeding → catalog completion |
| SlimeWorld (built) | ? | Breeding + conquest with no clear aesthetic target |

The games with the clearest aesthetic targets are the most complete. This is not a coincidence.

---

## Core Loop Analysis

The research defines a strong core loop as: **Challenge → Action → Reward**, operating on nested time scales simultaneously.

**Which studio games have a working nested loop:**

- **Derby Sim:** Breed (day scale) → Race (session scale) → Career tracking (campaign scale). Three layers, all wired.
- **Shoal:** Observe (moment) → Adjust conditions (session) → Watch ecosystem shift (long-term). Working.
- **AntSim Redux:** Scout (moment) → Colony directive (session) → Territory expansion (campaign). Working.
- **Succession:** Move (turn) → Favor shift (segment) → Verdict (campaign). Working.

**Which games are missing a layer:**

- **SlimeBreeder / SlimeGarden:** Breed (session) → Catalog fill (campaign). Missing the moment-to-moment layer — nothing to do *inside* a breeding session that creates tension.
- **Chimera Wilds:** One D20 roll. Entirely moment-to-minute. No session or campaign layer.
- **ScrapCrawl:** 5 rooms with D20 combat. Session loop exists. No campaign layer — each run is self-contained with no meta-progression pulling the player back.
- **CorpWorld / Planet of Greed:** Week/Epoch loop is the session. Campaign (Rank 1 end condition) exists. Missing moment-to-moment — sector decisions are weighty but there's no quick feedback within the planning phase.

**The pattern:** The games missing a layer are the games that feel incomplete. Adding meta-progression to ScrapCrawl (permanent unlocks between runs) is a smaller lift than building an entirely new game and would make it itch-worthy.

---

## Genre Gap Analysis: Market Data Applied

The research provides market data that validates and prioritizes the genre gaps from the GENRE_TRACKER.

### Deck Builder — HIGH PRIORITY (validated by market data)

The research calls roguelike deckbuilders "one of the most active hybrid genres of the last several years" and specifically notes a current renaissance following Slay the Spire (2019) and Balatro (2024). The genre is in active experimentation — grid-based combat, merging mechanics, blackjack and domino variants.

**Why this fits the studio perfectly:**
- Turn-based, no real-time input required
- Mechanics-generate-content: a good deck engine produces thousands of distinct runs from a small card set
- Procedural generation handles replayability without content budget
- Fits directly onto the existing roguelike chassis (Brewfield, ScrapCrawl, Chimera Wilds)

**The fastest path:** Brewfield already has Element × Component combination logic. A deck builder that uses Brewfield's combination engine as the card resolution system is a mechanic port, not a new design. The skin changes. The system stays.

### Merchant / Trading Sim — HIGH PRIORITY

Ledger exists but is shallow. The research notes trading sims reward sustained post-launch content cadence — exactly the studio's production model. Ledger's Dutch auction and compounding debt mechanics are a real foundation. A second pass that adds inventory management, reputation with trading partners, and multi-session persistence would fill this slot properly.

### Tower Defense — MEDIUM (into-the-breach variant)

The research notes strategy games are expanding specifically on PC's long tail because they reward sustained content cadence over big launch spikes. A turn-based (Into the Breach-style, not real-time) tower defense fits the studio filter and is a genuine genre gap. Moderate design risk — the Into the Breach model is well-understood but the execution bar is high.

### Puzzle — MEDIUM (lowest lift)

Zero instances in the catalog. Logic or spatial puzzles are maximally agent-friendly to build — pure rules, no art, no animation required. The research confirms puzzle is one of the strongest and most consistent mobile/browser categories. A puzzle game built on an existing system (the Voronoi map from CorpWorld as a spatial puzzle generator, for instance) is a small-scope build with real discoverability upside.

### Farming Sim / City Builder — LOW (confirmed low)

The research confirms these are content-heavy genres that require hand-authored art at scale. The studio filter correctly identified these as low priority. The market data doesn't change this.

---

## Mechanics the Studio Is Missing

Cross-referencing the research's mechanics list against what's actually in the catalog:

| Mechanic | In Catalog? | Notes |
|---|---|---|
| Procedural generation | ✅ Partial | Shoal (boids), Brewfield (combinations), Chimera Wilds (assembly). None with full level/world gen. |
| Permadeath | ✅ Partial | Implied in roguelikes but not explicitly implemented with run-state loss |
| **Meta-progression** | ❌ Missing | The biggest gap. No game has permanent unlocks between runs. ScrapCrawl needs this most urgently. |
| Crafting / resource gathering | ✅ ScrapCrawl | Only one game. Under-explored. |
| **Deck / card-based strategy** | ❌ Missing | Genre gap confirmed. Highest priority add. |
| Co-op / multiplayer | ✅ House of Kings Collab | One game. UI still broken. |
| Idle / incremental | ✅ VoidDrift, VoidDrift Redux | Present but not a primary loop in any stable game |
| Extraction mechanics | ❌ Missing | High-tension, session-scoped. Adjacent to ScrapCrawl's scrap economy. |

**The single most impactful addition across the existing catalog:** Meta-progression on ScrapCrawl. Permanent unlocks between runs (new craftable recipes, starting gear, room modifiers) transforms a complete-but-shallow dungeon crawler into a game with a reason to return. This is a directive, not a redesign.

---

## Player Motivation (Bartle) Applied to the Catalog

The Bartle taxonomy maps which player types each game serves:

| Game | Achiever (♦) | Explorer (♠) | Socializer (♥) | Killer (♣) |
|---|---|---|---|---|
| Derby Sim | ✅ Career tracking | ✅ Genetics discovery | ❌ | ❌ |
| Shoal | ❌ | ✅ Ecosystem observation | ❌ | ❌ |
| Succession | ✅ 3 Seals goal | ✅ Deduction | ✅ Rival AI interaction | ✅ Slander/rivalry |
| AntSim Redux | ✅ Territory | ✅ Colony emergence | ❌ | ✅ Inter-colony combat |
| CorpWorld / Planet of Greed | ✅ Rank 1 goal | ✅ Map discovery | ❌ | ✅ Combat/territory |
| ScrapCrawl | ✅ Win the run | ❌ | ❌ | ❌ |
| House of Kings Collab | ✅ | ✅ | ✅ | ✅ |

**Observation:** Succession accidentally serves all four Bartle types. It's the most complete game in the studio from a motivation standpoint. ScrapCrawl only serves Achievers — the narrowest audience of any game in the catalog. Meta-progression would add Explorer motivation (what new craftable recipes exist?) and unlock the Killer motivation (competitive leaderboard for run speed or score).

---

## Industry Trends: What's Directly Actionable

From the GDC 2026 State of the Game Industry report, filtered for solo weekend builders:

**The hybridization pattern is the opportunity.** The trend is not new genres — it's grafting roguelike structure (procedural + permadeath + meta-progression) onto existing genre frames to multiply replay value without multiplying content budget. This is exactly the studio's production constraint. The deck builder gap is the highest-value application of this pattern for the catalog.

**Strategy and adventure genres favor smaller studios.** The research explicitly notes these genres reward sustained post-launch content cadence over marketing-heavy big-launch spikes. Planet of Greed and Succession both fit here. Regular small updates (new culture, new faction, new seal type) extend their lifespan more than a major new game would.

**Live-service fatigue is real — avoid that model.** 52% of industry respondents view generative AI's impact negatively; developer and player fatigue with annualized live-service cycles is rising per GDC 2026. The studio's episodic, standalone model is correctly positioned against this trend. Don't add battle passes or season systems.

**PC is still the priority platform.** 73% of studio executives rank PC top-3. The studio's browser/HTML5 + itch.io model is correct. Steam Deck is now a meaningful target (28% developing for it) — the studio's existing HTML5 builds don't target it, but any future Bevy/Rust game (VoidDrift chassis) could.

---

## The Cyclical Chain Gap

From the Systems Thinking skill: Robert has built linear and branching transformation chains well. The missing archetype is **cyclical** — output feeds back into input, completion resets but strengthens the next run.

The research validates this precisely: meta-progression is now the standard mechanism for cyclical chain design in indie games. Permadeath resets the core loop. Permanent unlocks make the next run start stronger. The cycle is the game.

**The three studio games closest to implementing a cyclical chain:**

1. **ScrapCrawl** — Add permanent craftable unlocks between runs. Smallest lift, highest impact.
2. **Derby Sim** — Add career-spanning genetics legacy. Retire a great horse, its best trait becomes a starting bonus for the next generation. Cyclical by nature.
3. **SlimeWorld (if revived)** — The breeding loop is inherently cyclical. The problem was the absence of a downstream performance context (what the slimes *do*). With a purpose layer, the cyclical chain closes naturally.

---

## Quick Reference: What to Build Next

Ranked by fit to studio identity × market opportunity × lift required:

| Priority | Build | Why | Lift |
|---|---|---|---|
| 1 | Meta-progression on ScrapCrawl | Highest-impact upgrade to existing game. Adds cyclical chain. Serves Explorer + Achiever both. | Low |
| 2 | Deck Builder (Brewfield chassis) | Hottest genre gap. Combination engine already exists. Roguelite structure proven in catalog. | Medium |
| 3 | Push Succession to itch.io | Feature-complete. 89 tests. Serves all 4 Bartle types. Most mechanically distinct game in catalog. | Low |
| 4 | Trading Sim deeper than Ledger | Adjacent to existing Ledger. Strategy genre favors small studios. Sustained content model. | Medium |
| 5 | Puzzle (Voronoi-based) | Zero instances in catalog. Agent-friendly. Strong mobile/browser category. | Low |

---

## What Not to Build

| Avoid | Reason |
|---|---|
| New breeding game before SlimeWorld resolved | Supply problem. Same system, different skin. |
| Live-service mechanics | Fatigue trend confirmed. Contradicts studio model. |
| Farming Sim / City Builder | Content-heavy. Fights the systems-first production model. |
| Third game in the 4X / territory space | CorpWorld and Planet of Greed already cover this. Over-represented. |
| New simulation before AntSim ships | Same pattern as above. |

---

*RFDGameStudio Game Design Reference | August 2026*
*Studio identity filter applied throughout. External research mapped to actual catalog.*
*Update when a new game ships or a significant design decision is made.*
