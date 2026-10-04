# Project State: KingMaker Squads

## Current Milestone
- **Completed**:
  1. Universal Max Squad Size Enforcer & Squad Selector for Roster Units
  2. Zodiac Synergy System (Revision 6, Track 1)
  3. Combat Visual Personality (Revision 6, Track 3)
  4. Tarot-Inspired Unit Card Redesign (Track 3 Layout Redesign)
  5. Universal Unit Card Extraction (`UnitCard.tsx` shared component across Combat, Forces, and Shop)
  6. 8×8 Combat Board Resize (Design.md Revision 7 §2.3)
  7. Rebellion Theme Reflavor Test Pass (Display-Text & Flavor Reskin)
  8. Display-Name Decoupling & Schema Groundwork Prep (terrainDisplay lookup & publicOpinion/loyalty schema)
  9. Defense Force Loyalty System (`loyaltyLogic.ts`, erosion under threat, restoration on reinforcement, zero-loyalty district collapse)
  10. Allegiance Drives Loyalty (`publicOpinion` modulates Loyalty erosion rate, real starting initial territory allegiance values, UI badges in Forces and Territory screens)
  11. Isometric Building Sub-Grid (`isoGridAnchor`, `isoGridCols`, `isoGridRows`, `isoBuildingLayout` on `TerritoryCell`, `IsometricBuildingLayer.tsx`, hand-placed anchors for all 9 initial cells, bounds check math in `isoMath.ts`, `CREDITS.md` attribution)
  12. Procedural City Generation & Four-Layer Architecture (`src/utils/cityGeneration/`, Voronoi + Sutherland-Hodgman clipping, `WardSubType` taxonomy, distance & zero-loyalty state-driven density falloff, chaos-tunable plot subdivision, ADR 0003)
  13. Permanent World Geography & Outline-Constrained Generation (`src/data/worldGeometry.ts` holding `OLD_WALL_BOUNDARY`, `RIVER_PATH`, `OUTER_CITY_LIMIT`, `CAPITAL_HILL_ANCHOR`, Lloyd relaxation in `patchGenerator.ts`, river crossing adjacency blocks, position-aware ward subtype bias in `wardAssignment.ts`). Note: `docs/state/worldBuildingReference.md` remains the authoritative source for world geography.
  14. Opening Flow & Steward Unification (Revision 9, wiring fix connecting `generateProceduralCity()`, permanent AutoGen leader creation, Hovel naming, steward lifecycle).
  15. The Opening Sequence & Staging (Revision 10, narrative sequence staging, Champion tonal register, iron hand text amendment).
  16. The Kingdom, Populated — District-within-Region & Six-Faction Wheel (Revision 12, Voronoi sub-patching in `districtGenerator.ts`, six-house wheel placement assigning Ember to Hovel, Tundra to Old Wall, Marsh/Gale adjacent to Ember, Crystal/Tide adjacent to Tundra, `HOUSE_WARD_BIAS` table, per-House visual rendering palette in `TerritoryScreen.tsx`).
  17. New Game Screen & Map Navigation (New Game / Continue entry screen in `src/screens/NewGameScreen.tsx`, routing via `App.tsx`, pointer/wheel pan and zoom controls with viewBox bounds clamping and drag-distance click thresholding in `TerritoryScreen.tsx`).
  18. Zoom-Based Level of Detail & Landscape Rendering (Standard cartographic LOD with `LOD_THRESHOLD = 500` rendering Region-level House banners when zoomed out and District subdivisions/building sub-grids when zoomed in, SVG river bed & channel rendering derived from `RIVER_PATH` data in `worldGeometry.ts`, Hovel pirate/sea-faring fortress `wardSubType = fortress` identity and visual `hovel-fortress-marker` badge in `TerritoryScreen.tsx`).
  19. Map Scroll Conflict, Bounds, and Cell Balance (Fixed wheel scroll conflict via non-passive `addEventListener('wheel', ..., { passive: false })` with `e.preventDefault()`, dynamic map & pan bounds computation in `computeMapBounds()` & `computePanBounds()`, fit-to-view initial state and Center button `getFitViewBox()`, Mitchell's Best-Candidate seed sampling and 4 Lloyd relaxation iterations in `patchGenerator.ts` reducing Region area variance).
  20. District Click & Attack Flow Fix (`pointer-events-none` on river and grid layers preventing pointer interception, displacement-based drag detection preserving cell click handlers, direct Action/Attack buttons integrated into Cell Detail Panel).
  21. Streamlined Opening Sequence & Game Flow Entry (Eliminated redundant intermediate button for Inspect Sanctuary by transitioning directly to the Sanctuary view following intro text, added top-bar Skip Intro option allowing direct flow into actual Game Flow).
  22. Six-House Simulation Wiring & Faction Type Refactor (Phase 14 Directive, narrowed `FactionId` to 6 values, established `src/data/factions.ts` as single source of truth for turn order and hostility weights, eliminated legacy factions across simulation, ward assignment, and tests).
  23. Ward Position Bias & 16 Test Anchors Completion (Phase 14 Correction Pass, fixed `HOVEL_NAME` constant single source of truth, added `fortress` inside wall and `outpost` outside wall in `getWardTypeBias`, implemented 16 test anchors verifying tundra fortress reachability, unique district names, single hovel across paths, six-house rotation, hostility weights, and defense force lifecycle).
- **Active Tests**: 149 passed (0 failed, 0 skipped)

## Implemented Features
1. **Universal Max Squad Capacity**:
   - `MAX_SQUAD_SIZE` (4 units per squad) enforced across all player squads including Defense Forces.
   - Assigning units from Roster allows selecting specific non-full squads with capacity indicators.
2. **Zodiac Assignment**:
   - Every unit generated via `createUnit()` receives a random astrological sign (`Zodiac`).
   - `assignRandomZodiac()` is pure and deterministically testable via `Math.random` mocking.
3. **Celestial Alignment Synergy**:
   - `celestial_alignment` added to `SynergyType`.
   - `countOpposingZodiacPairs` detects unique opposing pairs across the standard 6 opposition pairs (Aries/Libra, Taurus/Scorpio, Gemini/Sagittarius, Cancer/Capricorn, Leo/Aquarius, Virgo/Pisces).
   - Enforces single-pair matching per unit with `used` Set.
4. **Combat Visual Personality & Universal Unit Card**:
   - **Extracted Shared Component**: `src/components/UnitCard.tsx` isolates context-independent card design.
   - **Unified Across All Screens**: `CombatPlaybackModal.tsx`, `ForcesScreen.tsx`, and `ShopScreen.tsx` use `UnitCard`.
   - **Elemental Borders**: Outer card border color mapped to Zodiac element.
   - **Floating Damage Numbers**: Transient pop-up indicator displayed above targeted unit cards.
   - **Shortened Unit Names**: `ROOK_NAMES`, `KNIGHT_NAMES`, `BISHOP_NAMES`, `QUEEN_NAMES` shortened.
5. **8×8 Combat Board Resize (Design.md Revision 7 §2.3)**:
   - **Single Source of Truth**: `BOARD_SIZE = 8` defined in `src/constants.ts` and imported universally.
   - **Placement Grid**: `PlacementView.tsx` updated to 64-cell grid (8×8).
   - **Combat Playback Grid & Arrow Math**: Percentage-based arrow math (`100 / BOARD_SIZE = 12.5%`).
6. **Rebellion Theme Reflavor Test Pass**:
   - Display-Text Only Reskin transforming crown fantasy strings into Rebellion theme across UI.
7. **Display-Name Decoupling & Schema Groundwork**:
   - Centralized `TERRAIN_DISPLAY_NAMES` lookup table in `src/data/terrainDisplay.ts`.
8. **Defense Force Loyalty & Allegiance Dynamics**:
   - Unreinforced Defense Forces lose Loyalty; reaching 0 Loyalty breaks the force and collapses the district cell without combat (`BrokenForceBanner.tsx`).
   - Allegiance (`publicOpinion`) modulates erosion rate.
9. **Isometric Building Sub-Grid**:
   - Hybrid geometry: irregular cell polygon shapes kept, 2.5D building tiles rendered on inner sub-grids via `IsometricBuildingLayer.tsx`.
10. **Procedural City Generation & Four-Layer Architecture**:
    - Original re-implementation in `src/utils/cityGeneration/` with Layer 1 Patch Generation, Layer 2 Ward Assignment, Layer 3 Density Model, Layer 3b Plot Subdivision, and Layer 4 Cell Assembly.
11. **Permanent World Geography & Lloyd Relaxation**:
    - Geometry defined in `src/data/worldGeometry.ts` with `CAPITAL_HILL_ANCHOR`, `OLD_WALL_BOUNDARY`, `RIVER_PATH`, `BRIDGE_LOCATIONS`, and `OUTER_CITY_LIMIT`.
    - Layer 1 clips Voronoi patches against `OUTER_CITY_LIMIT` and runs Lloyd relaxation (excluding fixed `CAPITAL_HILL_ANCHOR`).
    - River crossings without nearby bridges block direct patch adjacency.
    - Layer 2 biases ward subtypes depending on whether patch centers fall inside or outside `OLD_WALL_BOUNDARY`.
    - Authoritative world geography documented in `docs/state/worldBuildingReference.md`.

## Next Directives (Sequenced)
1. **Terrain Types on Placement Grid** (Design.md Revision 7 §2.1) — Sequenced as the next separate directive.
2. **Facing & Rear-Attack Mechanic** (Design.md Revision 7 §2.2) — Sequenced after Terrain.
3. **Procedural Territory Map Generation** (Design.md Revision 7 §2.4) — Strategic outer map system.

## Open Questions / Balance Decision Needed
- **Allegiance Evolution Over Time**: How does district Allegiance (`publicOpinion`) change over time?
- **Celestial Alignment Bonus**: What should `celestial_alignment`'s actual mechanical bonus be in combat resolution?
- **MaxTurns Pacing Cap**: 30 turns for 8x8 board size.
