# Phase 3 System Specifications

## 1. ECS Rendering System

### Components
- `RenderComponent`: Which sprite to display, z-order, scale
- `AnimationComponent`: Animation state, frame timing, loop behavior

### System
- `RenderingSystem`: Iterates entities with both components, renders to screen

### Integration
- Used by: Towers, Enemies, Creatures
- Performance: Must render 100+ entities at 60 FPS

## 2. Tower Defense Grid

### Components
- `GridPositionComponent`: (x, y, grid_width, grid_height)
- `TowerComponent`: Tower type, level, target priority
- `HealthComponent`: Current health, max health

### Systems
- `GridSystem`: Validates placement, prevents overlaps
- `TowerDefenseBehaviorSystem`: Targets enemies, calculates damage

### Integration
- Towers are just ECS entities with these components
- Same entity system as creatures

## 3. Wave System

### Components
- `WaveComponent`: Current wave, enemies remaining, wave strength

### Systems
- `WaveSystem`: Spawns enemies, manages wave progression
- `EnemySpawnerSystem`: Creates enemy entities per wave

### Integration
- Enemies are ECS entities (same as creatures)
- Can reuse creature AI systems

## 4. Genetics → Tower Appearance

### Rules
- Tower range = genetics trait "range" × base value
- Tower damage = genetics trait "attack" × base value
- Tower appearance = visual phenotype from traits

### Implementation
- Genetics system already works (from breeding demo)
- Just map traits to tower stats
- RenderComponent determines visual

## 5. Creature Feedback Loop

### Flow
1. Player selects creature for tower
2. Tower is destroyed/survives
3. Send result back to breeding system
4. Update creature stats (experience, level)

### Integration
- Uses existing breeding/genetics UI
- Adds "Tower Defense Results" to creature history
