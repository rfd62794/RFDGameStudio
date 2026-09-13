> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# Slime Clan — Milestones

*The north star document. A living roadmap of top-down vision and bottom-up playtesting discoveries.*

---

## Milestone 1 — Playable Demo ✅ COMPLETE
Three-tier war loop, faction simulation, Day/Action economy, Survivor ending, 119+ tests passing.

---

## Milestone 2 — Living World 🔄 IN PROGRESS
*The world should feel like it existed before you arrived and continues without you.*

✅ Colony system with named persistent units
✅ Sympathy and defection system
✅ Unbound hiding — no soft-locks
⬜ **Session 033** — Tribe specialization (Ashfen produces STAFF units, Rootward produces SHIELD units). Makes recruitment a meaningful choice between military capabilities.
⬜ **Session 034** — Quick Fixes: WASD controls for squad movement, Player identity renders as White slime, auto-positioning squad at home node to start.
⬜ **Session 035+** — Bigger map: 12-15 nodes minimum. Distinct Red heartland, Blue heartland, contested middle, scattered Unbound territory, isolated Ship Parts caches.
⬜ **Session 035+** — Faction AI differentiation: Red prioritizes attacking Blue and player nodes. Blue prioritizes reinforcing borders.
⬜ **Session 035+** — Resource balance pass: Food consumption, scrap generation, crystal deposits need tuning to create genuine scarcity pressure.
⬜ **Session 035+** — Day/Action tuning: Scale actions per day based on map size.

---

## Milestone 3 — The Roster (FFT Pillar)
*A real squad management system where choices carry permanent weight.*

⬜ **Squad Management Screen**: Pre-battle UI showing all owned units, names, shapes, hats, stats, sympathy, and XP. Select 3-5 for deployment.
⬜ **Hat Assignment**: Unbound recruits with `Hat.NONE` can be assigned a role on the management screen (costs resources/knowledge).
⬜ **Shape Rendering**: Square slimes (stocky/wide) and Triangle slimes (thin/pointed) rendered distinctly. Improves unit readability.
⬜ **Experience System**: Surviving battles grants XP. At thresholds, base stats increase. Incentivizes attachment to veteran units.
⬜ **Permanent Death**: Units reaching 0 HP in battle are gone permanently. Adds weight to squad management decisions.
⬜ **Upkeep Constraints**: Each unit costs 1 food per day. Forces strategic decisions on roster size and retention.

---

## Milestone 4 — Three Paths
*The paths need mechanical triggers and hidden scores, shifting between them based on playstyle.*

⬜ **Path Detection** (Hidden Scores): Track Conquest, Unity, and Survival scores. Shift between paths naturally until the final 20% of the game.
⬜ **Conqueror Ending**: 
  - *Trigger*: Control 80% of map by force. 
  - *Mechanics*: High combat stats, low sympathy, high resources. Hoard knowledge, use defectors as tools.
  - *Ending*: Planet conquered, ship repaired from tribute. Unbound in permanent hiding. *"You leave a conquered world behind. Nobody waves goodbye."*
⬜ **Unifier Ending**: 
  - *Trigger*: Broker ceasefire between Red/Blue (new diplomatic action). 
  - *Mechanics*: Moderate combat, high trust, high knowledge spent. Share knowledge, build in allied colonies. Crystals freely offered.
  - *Ending*: War ends, new society building, ship repaired as a gift. *"Some of them are standing at the launchpad."*
⬜ **Survivor Ending** (✅ Rough Implementation): 
  - *Trigger*: Scavenge 5 parts, avoid entanglements.
  - *Mechanics*: Low combat, moderate resources, quiet scavenging.
  - *Ending*: *"The ship shudders to life. You don't look back."*

---

## Milestone 5 — Juice
*Atmosphere, texture, and making the combat feel alive.*

⬜ **Floating Combat Symbols**: ⚔️ for slash, ✨ for heal, 💥 for crit. 400ms fade-out animation.
⬜ **Battle Queue Strip**: Dynamic visual bar showing the next 5 units to act, reacting to speed/stuns.
⬜ **Screen Shake**: 200ms shake on critical hits and unit death.
⬜ **Sound Effects**: Hit sound, heal chime, death thud. No music yet.
⬜ **Colony Flavor Events**: Random non-mechanical End Day logs (e.g., "Distant smoke rises from the Eastern Front").
⬜ **Weather / Time of Day**: Purely visual day/night cycle on the overworld.

---

## Milestone 6 — Engine Full Integration
*Migrating the prototype shell into a robust, persistent application.*

⬜ **Save/Load Persistence**: SQLite backing for colony state, roster, day count, faction relations. Game becomes a continuous campaign.
⬜ **Larger World Generation**: Procedural generation via `location_factory.py` for colony names and phenotypes.
⬜ **Unique Colony Maps**: Battlefield terrain seeded from a colony's `map_seed`. Persistent battle scars/obstacles.
⬜ **rpgCore Rendering Pipeline**: Replace manual pygame draw calls with `pygame_bridge` entity rendering.
⬜ **PygBag Web Target**: Async game loop adapter for browser deployment.
