# 0004. Six-House Faction Identity & Simulation Refactor

## Status
Accepted

## Context
In early revisions of KingMaker Squads (Revision 1), the AI simulation operated on four placeholder factions (`obsidian`, `iron_covenant`, `ash_crown`, `blood_oath`).
When Revision 12 introduced the Six-House wheel (`Ember`, `Marsh`, `Gale`, `Tundra`, `Crystal`, `Tide`), the procedural city generation assigned territory to the six Houses, but the simulation layer was left running on the legacy factions.
As a result, the four AI factions owned zero territory across every generated map, leaving the AI unable to perform target scoring or actions.

## Decision
1. **Narrowed `FactionId` Type**: Restricted `FactionId` strictly to 6 values: `'player' | 'marsh' | 'gale' | 'tundra' | 'crystal' | 'tide'`. Removed the legacy four factions from all TypeScript type definitions.
2. **Single Source of Truth (`src/data/factions.ts`)**: Consolidated faction metadata, default turn orders (`DEFAULT_TURN_ORDER`), House relations, and target scoring weights (`FACTION_HOSTILITY`, `hostilityWeight`) into `src/data/factions.ts`.
3. **Simulation Layer Alignment**: Updated AI target scoring, coronation logic, loyalty erosion, and map rendering to use the 6 Houses and reference `src/data/factions.ts`.
4. **Ward SubTypes & District Names**: Expanded `WardSubType` to include `'fortress'` and `'outpost'`, and expanded `DISTRICT_NAMES` pool to ensure unique district naming across all 36 districts.

## Consequences
- AI factions now own territory on generated maps and execute declarations/responses correctly.
- Legacy faction identifiers (`obsidian`, `iron_covenant`, `ash_crown`, `blood_oath`) are completely eliminated from `src/`.
- Turn order and AI target selection are deterministic and driven by House relationship hostility weights.
