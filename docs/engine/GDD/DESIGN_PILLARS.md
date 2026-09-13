# Design Pillars

## Goal G3: Multi-Genre Support

### Pillar 1: Universal Creature
- Any creature type works in any game genre
- Creature definition is independent of game rules
- Games can't break creature model

### Pillar 2: Visual ≠ Mechanical
- Visual appearance (genetics) is separate from mechanics
- Same creature can fight (Dungeon), race (Racing), work tower (Tower Defense)
- Appearance is emergent from genetics, not game-specific

### Pillar 3: ECS as Foundation
- All game logic lives in ECS systems
- No game-specific hard-coded creature behavior
- Behavior is just component composition

### Pillar 4: Economy is Scoped
- Each game has its own economy
- Gold, breeding, upgrades are game-specific
- Creature state (health, level, genes) is universal

## Goal G4: Monetizable Platform

### Pillar 1: Multi-Tenant Ready
- Engine supports multiple game variants
- Each game can have different rules, UI, economy
- Shared engine, different games

### Pillar 2: Asset-Driven
- Visual appeal drives engagement
- Sprites, animations, effects are moddable
- Engine is a canvas for creativity

### Pillar 3: Progression Systems
- Players invest in creatures
- Genetic traits matter
- Breeding creates sense of ownership

## Goal G5: Production Infrastructure

### Pillar 1: No Technical Debt
- Code is modular and testable
- Clear separation of concerns
- Systems can be extended without breaking

### Pillar 2: Documentation Complete
- Every system has a spec
- Every feature has acceptance criteria
- New developers can understand quickly

### Pillar 3: Performance Standards
- 60 FPS on target platforms
- Grid render in <16ms
- Creature spawning is instant
