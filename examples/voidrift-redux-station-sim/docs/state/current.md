# Project State: VoidRift Redux

```yaml
phase: 'Phase 2 — Material Behavior & Visual Identity'
certified_floor: 62/0/0
what_is_next: 'Phase 3 — Reaction Visibility & Ambient Station Life'
```

## Phase 2 Deliverables Completed

- **Material Identity Data Layer (`data/materialColors.ts`)**: Defined visual profiles (primary/secondary colors, emissive flags, state, particle behavior) for all 9 compounds and dust.
- **Particle System Core (`services/particles.ts`)**: Pure simulation functions for particle spawning, physics ticks (gas drift, liquid settle, solid pulse, dust float), lifecycle culling, budget governance, and dynamic event scattering.
- **Material Canvas Engine (`components/MaterialCanvas.tsx`)**: Read-only `requestAnimationFrame` canvas overlay with zero React re-render overhead, dynamic synthesis flow lines, and 60-frame rolling FPS governor.
- **Station Integration (`StationView.tsx`, `App.tsx`, `index.css`)**: Mounted non-blocking canvas overlay above station grid with DOM-aligned card tracking and `gameStateRef` state synchronization.
- **Unit Test Anchors (`tests/test_voidrift_redux_particles.ts`)**: 18 new pure function test anchors bringing the certified test floor to 62 passing, 0 failing, 0 skipped.

