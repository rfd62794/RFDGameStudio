# ADR 0003: Procedural City Generation & Four-Layer Architecture

## Context
Replacing static hand-crafted territory cells with a procedural city generator that generates irregular, non-overlapping districts (wards) with variable building density and plot subdivisions, while maintaining fixed capital placement and strict licensing compliance.

## Decisions

### 1. GPL-3.0 Licensing Boundary (Concepts Only, Reimplemented in Original TypeScript)
- Concepts inspired by TownGeneratorOS (ward taxonomy, connectivity density falloff, plot subdivision chaos) are implemented strictly as original TypeScript code.
- No source code from TownGeneratorOS or any GPL repository was copied or imported.

### 2. Four-Layer Separation of Concerns Architecture
The procedural city generator (`src/utils/cityGeneration/`) is strictly structured into four unidirectional layers:
- **Layer 1: Patch Generation (`patchGenerator.ts`)**: Voronoi tessellation + Sutherland-Hodgman polygon clipping against map bounds. Fixed Capital anchor point (`capitalAnchor`).
- **Layer 2: Ward Assignment (`wardAssignment.ts`)**: Assigns `WardSubType` taxonomy ('slum', 'patriciate', 'merchant', 'craftsmen', 'military', 'administration', 'common') and maps to `CellType` and starting Allegiance (`publicOpinion`).
- **Layer 3: Density Model (`densityModel.ts`)**: Distance-based density falloff from Capital core, modulated by Defense Force broken/zero-loyalty state (`isForceBroken`).
- **Layer 3b: Plot Subdivision (`plotSubdivision.ts`)**: Chaos-tunable plot carving (`gridChaos`, `sizeChaos`, `minPlotSize`) based on ward subtype.
- **Layer 4: Assembly & Rendering (`cityGenerator.ts` / `IsometricBuildingLayer.tsx`)**: Assembles `TerritoryCell[]` and renders isometric building sub-grids.

### 3. State-Driven Density Consequences
- A district whose Defense Force collapses due to zero loyalty suffers a 0.4x building density penalty.
- The density reduction deterministically thins building presence on subsequent renders, providing direct visual feedback for strategic territory unrest.
