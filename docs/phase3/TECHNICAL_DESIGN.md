# Phase 3 Technical Design

## Architecture Decisions

### 1. Why ECS for Towers?
- Towers are just creatures with tower-specific components
- Reuses all ECS infrastructure
- Makes them behave like other game entities

### 2. Grid System Design
- Separate `GridPositionComponent` from creature system
- Grid is logical, not visual (rendering is separate)
- Allows tower placement without creature size constraints

### 3. Genetics Integration
- Creatures already have genetic traits
- Map trait values directly to tower stats
- No new genetics system needed

### 4. Rendering Stack
- Need `RenderComponent` (what to draw)
- Need `AnimationComponent` (how to animate it)
- `RenderingSystem` is new
- Integrates with existing pygame renderer

## Performance Targets

- Grid render: <5ms
- Entity update: <10ms
- Spawn 10 enemies: <2ms
- 100 entities on screen: 60 FPS solid

## Database/Persistence

- Tower state lives in ECS
- Creature stats live in genetics system
- Save/load handled by existing persistence

## Quality Gates

- 90%+ unit test coverage on new systems
- All docstrings present
- No TODO comments
- Code reviewed for ECS patterns
