# RFDGameStudio — Genre Tracker
*Last updated: August 16, 2026. Update this file when a game ships, a new demo is added, or a genre gap is filled.*

---

## Studio Identity

**Production model:** Turn-based, agent-friendly, no real-time input required. Systems-not-content — mechanics generate the experience, not hand-authored art or writing. Solo builder on weekends using Director/Pipeline/Agent workflow (Claude designs and verifies, Devin/AI Studio executes).

**Intentional gaps:** First-person shooters, third-person shooters, platformers, and real-time skill genres are deliberately avoided. Content-heavy genres (Farming Sim, City Builder) are low-priority due to the studio's systems-first production model.

---

## Game Registry

| # | Game | Primary Genre | Secondary Genre | Status | Renderer | Notes |
|---|---|---|---|---|---|---|
| 1 | Shoal | Ecosystem Sim | Emergent Sandbox | STABLE | Lua/Python | Boids-based reef — fish, sharks, algae pressure |
| 2 | Derby Sim | Management Sim | Breeding / Sports | STABLE | PyGame | Race, breed, bet. Win/Place/Show, career tracking |
| 3 | Brewfield | Roguelike | Emergent Sandbox | STABLE | Lua/Python | Element × Component, Wa-Tor trophic chemistry |
| 4 | Snake Roguelike | Arcade Roguelite | Card / Synergy | BETA | PyGame | Steal segments, 9 evolution cards |
| 5 | Mutant Battle Ball | Tactics / Auto Battler | Sports Sim | DEV | React/TS | Assemble mutants, 2v2, Anatomy Module shared infra |
| 6 | SlimeCoin | Arcade / Casual | Economy | DEV | React/TS | Real-time coin pusher, 15 rounds, 12 chip cards |
| 7 | Chimera Wilds | Tactics RPG | Roguelike | DEV | React/TS | Single D20 encounter vs random 6-part enemy |
| 8 | ScrapCrawl | Dungeon Crawler | Roguelike | DEV | React/TS | 5 rooms, scrap economy, D20 combat |
| 9 | Ledger | Trading Sim | Economy | EXTERNAL | React/Tailwind | Dutch auction, compounding debt, soft lockout |
| 10 | Trinity Siege | Wargame | Turn-Based Strategy | EXTERNAL | React/Tailwind | Three-faction siege — LEAST VERIFIED, known logic issues |
| 11 | VoidRift | Ecosystem Sim | Idle / Incremental | EXTERNAL | Rust/Bevy | Autonomous drone mining, no win condition. itch.io |
| 12 | SlimeBreeder | Breeding Sim | Creature Collector | EXTERNAL | React/Tailwind | Multi-tank breeding, SlimeGarden core loop |
| 13 | CorpWorld | 4X Strategy | Territory Control | EXTERNAL | React/Tailwind | Voronoi territory, fog-of-war, Circle/Square/Triangle combat |
| 14 | SlimeGarden | Breeding Sim | Creature Collector | EXTERNAL | React/Tailwind | Standalone TypeScript breeding sandbox |
| 15 | Gladiator Arena | Management Sim | Tactics RPG | VERIFIED | React/TS | Manager-not-fighter, scored utility AI, Anatomy Module |
| 16 | VoidDrift Redux | Idle / Incremental | Sci-Fi Sim | VERIFIED | React/TS | TS reimagining of VoidDrift — signal loop, faction upgrades |
| 17 | Succession | Social Deduction | Narrative Adventure | EXTERNAL | React/TS | Clue-style 5×5×5 triad, rival AI, 3 origins, 89 tests. Live on itch.io |
| 18 | House of Kings Collab | Collaborative Faction Strategy | Idle / Incremental | LIVE/BROKEN | React/TS | Mafia Wars × Kingdom Houses. Firebase backend live. UI busted |
| 19 | AntSim Redux | Ecosystem Sim | Colony Sim | ACTIVE | Python | Two colonies, pheromones, Lanchester combat, infiltration |
| 20 | Planet of Greed | 4X Strategy | Territory Control | ACTIVE | React/TS | Culture stat asymmetry, 60-game AI balance harness |
| 21 | Early Learning Buddy | Educational | Casual | UNLISTED | React/TS | Voice-detection child learning. Personal project, not public |
| 22 | Wire & Rust | Deck Builder | Roguelike | DEV | React/TS | Turn-based scrapyard exploration and scrap chemistry synergies |

---

## Genre Coverage Map

### Covered (at least one game)

| Genre | Games |
|---|---|
| Deck Builder | Wire & Rust |
| Ecosystem Sim | Shoal, VoidRift, AntSim Redux |
| Emergent Sandbox | Shoal, Brewfield |
| Roguelike / Roguelite | Brewfield, Snake Roguelike, Chimera Wilds, ScrapCrawl |
| Management Sim | Derby Sim, Gladiator Arena |
| Breeding / Creature Collector | Derby Sim, SlimeBreeder, SlimeGarden |
| Sports Sim | Derby Sim, Mutant Battle Ball |
| Tactics / Auto Battler | Mutant Battle Ball, Chimera Wilds |
| Dungeon Crawler | ScrapCrawl |
| Arcade / Casual | Snake Roguelike, SlimeCoin |
| Trading Sim / Economy | Ledger, SlimeCoin, Derby Sim |
| Wargame | Trinity Siege |
| Turn-Based Strategy | CorpWorld, Trinity Siege, Planet of Greed |
| 4X Strategy | CorpWorld, Planet of Greed |
| Territory Control | CorpWorld, Trinity Siege, Planet of Greed |
| Idle / Incremental | VoidRift, VoidDrift Redux, House of Kings Collab |
| Colony Sim | AntSim Redux |
| Collaborative / Social Strategy | House of Kings Collab |
| Social Deduction | Succession |
| Narrative Adventure | Succession |
| Card / Synergy | Snake Roguelike, SlimeCoin, Wire & Rust |
| Sci-Fi Sim | VoidDrift Redux |
| Educational | Early Learning Buddy |

---

### Gap Analysis

| Genre | Priority | Notes |
|---|---|---|
| **Deck Builder** | COVERED | Filled by Wire & Rust prototype |
| **Merchant / Trading Sim (deep)** | HIGH | Ledger is shallow — a deeper trading sim is Ledger's natural next phase, not a new build |
| **Puzzle** | MEDIUM | Logic or spatial. Zero instances. Agent-friendly to build |
| **Tower Defense** | MEDIUM | Into the Breach-style (turn-based) fits the studio. Real design risk/reward |
| **Dungeon Crawler (deep)** | MEDIUM | ScrapCrawl exists but is minimal. A deeper pass is a backlog item, not a new game |
| **Idle / Incremental (standalone)** | LOW | VoidDrift already embodies this philosophy. Low novelty |
| **Farming Sim** | LOW | Content/art-heavy. Fights the systems-not-content production model |
| **City Builder** | LOW | Same constraint as Farming Sim |
| **Reputation / Social System** | N/A | Infrastructure (like GeneticsSystem/StatSystem), not a genre slot |
| **Platformer** | SKIP | Intentional. Real-time skill input, not the studio |
| **Shooter (any)** | SKIP | Intentional |

---

## Itch.io Publishing Status

| Game | Itch-Ready | Published | Notes |
|---|---|---|---|
| VoidRift | ✅ | ✅ | Live |
| Shoal | ✅ | ✅ | Live (build pipeline proven) |
| Planet of Greed | ✅ | ✅ | Live |
| VoidDrift Redux | ✅ | ❌ | Verified, pipeline ready, not yet published |
| Succession | ✅ | ✅ | Live — August 16 2026 |
| Gladiator Arena | ✅ | ❌ | Verified, pipeline ready, not yet published |
| Derby Sim | 🟡 | ❌ | STABLE but needs packaging assessment |
| Brewfield | 🟡 | ❌ | STABLE but needs packaging assessment |
| All others | ❌ | ❌ | DEV/EXTERNAL — not itch-ready |

---

## Open Infrastructure Items (studio-wide)
*Not game-specific — affects the whole catalog*

- [ ] **Directive Lifecycle Tracker** — round-history schema, not just final state. Directive written, not yet executed
- [ ] **Responsive Sizing** — `100svh` pass complete (Aug 16). Planet of Greed overflow fixed via `mainClassName="game-shell-main--scrollable"` on GameShell + `items-start` grid + `justify-start` center column. Right column capped with `max-h-[calc(100svh-60px)]`
- [ ] **Shared Onboarding Gate (Pattern 2)** — GuidedWalkthrough. Single instance, watching for second consumer before extracting
- [ ] **Now/Next/Later triage** — actual backlog triage into `ROADMAP.md` not yet done
- [ ] **House of Kings Collab UI** — busted, undiagnosed. IAM currently `allUsers`/public — confirm state before touching
- [ ] **MBB Manufacturer Agency** — design doc complete, numeric tuning not yet done
- [ ] **Planet of Greed culture tuning** — 30% vs 6.7% win spread too wide, second pass needed

---

## Changelog
| Date | Change |
|---|---|
| Aug 16 2026 | Initial tracker created. 21 games catalogued. Genre map, gap analysis, itch status |
| Aug 16 2026 | Succession published to itch.io. Status updated to EXTERNAL. |
