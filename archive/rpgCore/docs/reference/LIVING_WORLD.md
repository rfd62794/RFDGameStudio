# The Living World — Master Design Reference

## What This Is

rpgCore is a Game Design Laboratory. Six playable Aspects, each a genre lens
on the same Soul and underlying systems. The Ring connects them.

This is not a game. It is a life simulation engine that expresses itself
through different genres.

## The Soul

Every Aspect is one facet of a Soul's journey through existence.
The Soul is not a character — it is the player's accumulated state across runs,
choices, and deaths. It persists through The Ring.

Death is return, not failure. Each run is a descent. Each descent changes
something.

## The Six Aspects

| Demo | Genre Lens | Primary Reference | Soul Facet |
|------|-----------|-------------------|------------|
| Last Appointment | Narrative consequence | Disco Elysium, Planescape | Witness |
| Asteroids | Pure survival arcade | Galaga, Geometry Wars | Endurance |
| Space Trader | Economy and exploration | Elite, Recettear | Merchant |
| Slime Clan | Empire and population | Dwarf Fortress, Pikmin | Ruler |
| Dungeon Crawler | Descent, loot, death | Diablo, Isaac, Hades | Warrior |
| Slime Breeder | Genetics and nurture | Pokemon, Chao Garden | Creator |

## The Ring

The Ring is not a game — it is a space. The hub that connects all Aspects.

Inspirations: Hades hub, Pokemon home town, Minecraft base, Destiny Nexus

The Ring reflects the Soul's accumulated state. It changes as the player
descends into each Aspect. It is designed last, after the Aspects have
produced something worth connecting.

**What flows through The Ring (future):**
- Slime genetics → Dungeon Crawler enemy trait affixes
- Dungeon loot → Crafting materials in Space Trader / Slime Clan
- Tactical victories (Slime Clan raids) → World population events
- Breeding results → Asteroids wave modifiers
- Narrative choices (Last Appointment) → NPC memory across Aspects

Do not design The Ring until the Aspects produce something to flow through it.

## Shared Systems

Systems that exist in `src/shared/` and are used by multiple Aspects:

| System | Owner | Used By |
|--------|-------|---------|
| Combat engine | shared | Dungeon Crawler, Slime Clan (raids) |
| Genetics | shared | Slime Breeder, Slime Clan, Dungeon Crawler (enemies) |
| Soul state | shared | All six via The Ring |
| Loot / Item | shared (planned) | Dungeon Crawler primary, Space Trader, Asteroids |
| Crafting | shared (planned) | Dungeon Crawler, Space Trader, Slime Clan |

## Cross-Demo Systems Map

### Loot System
- **Primary home:** Dungeon Crawler (Diablo-style drops)
- **Secondary:** Space Trader (cargo as loot, rare goods)
- **Light touch:** Asteroids (wave power-up drops)
- **Future:** Slime Clan (raid yields)

### Crafting System
- **Primary home:** Dungeon Crawler (Horadric Cube style, rest room stations)
- **Secondary:** Space Trader (goods transformation: ore → metal → parts)
- **Secondary:** Slime Clan (production chains)
- **Deep hook:** Slime Breeder crossover — breeding IS crafting

### Genetics System (built)
- **Primary home:** Slime Breeder ✅
- **Empire mechanic:** Slime Clan (population evolves under pressure) ✅
- **Enemy generation:** Dungeon Crawler (enemy trait affixes from genetics)

### Floor / Unlock Structure
- **Primary home:** Dungeon Crawler (floors as unlocks)
- **Equivalent:** Asteroids (waves = floors, escalating difficulty)
- **Equivalent:** Last Appointment (chapters close doors permanently)

## Gaps and Potential 7th Aspect

The six Aspects do not cover:

| Missing Genre | Potential Home | Notes |
|---------------|---------------|-------|
| Tactical grid combat | Slime Clan raids OR 7th demo | FFT, Fire Emblem, Into the Breach |
| Rhythm / music | 7th demo (wildcard) | Crypt of the Necrodancer — most surprising |
| Social sim | Last Appointment extension | Persona, Spiritfarer |
| Builder / automation | Space Trader extension OR 7th | Factorio-lite with slime genetics |
| Puzzle | Inside Dungeon Crawler (puzzle rooms) | Baba Is You, The Witness |

**Rule for adding a 7th Aspect:** Only if it uses existing shared systems in a
genuinely novel combination that cannot be expressed inside an existing demo.

## The Four Constitutional Laws

1. No demo-specific logic in `src/shared/` — shared code must be generic
2. No content gating between demos — each Aspect is standalone
3. New scenes inherit from scene templates — no building from scratch
4. The test floor does not regress — 448 passing minimum

## Design Principles

- Systems that "feel right" over systems that merely function
- Small focused demos that share infrastructure — not monolithic builds
- Each Aspect teaches one genre deeply, not many genres shallowly
- Death and return over failure and punishment
- Genetics as the connective tissue of the Living World
