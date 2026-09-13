> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# ADR 058: Delta-Persistence & World Pillar Formalization

## Overview

This ADR formalizes the World Pillar as a deterministic data provider and implements delta-state persistence for the four-pillar D&D Engine architecture.

## Architecture Decision

### The Decision
We will implement Delta-State Persistence with a formal World Pillar. The World Engine generates the base world from Seed_Zero, while the D&D Engine maintains persistent world deltas for state changes.

### Technical Implementation

#### World Pillar (`src/engines/world_engine.py`)
- **Seed_Zero**: Deterministic seed for world generation
- **Permutation Table**: Chaos control via hash-based permutation
- **Tile Provider**: Pure data provider, no circular dependencies
- **Delta Application**: Applies world state changes to base map

#### Delta-State Persistence
- **GameState.world_deltas**: Key-value store for persistent changes
- **Delta Format**: `position → {delta_type, timestamp, metadata}`
- **Persistence Strategy**: Save only changes, not entire tile arrays
- **Recovery**: Base world + deltas = complete world state

## Four-Pillar Architecture Flow

```
1. VOYAGER (Actor)       -> "I want to move to (20,10)."
2. D&D ENGINE (Mind)     -> "WorldEngine, what is at (20,10)?"
3. WORLD ENGINE (World)  -> "Based on Seed_Zero + Deltas, it's an OPEN DOOR."
4. D&D ENGINE (Mind)     -> "Validation: SUCCESS. Updating GameState + Delta."
5. PPU (Body)            -> "GameState updated. Rendering 'Open Door' at (20,10)."
```

## Implementation Details

### World Engine Components

#### PermutationTable
```python
class PermutationTable:
    """Permutation table for deterministic noise generation"""
    
    def __init__(self, seed: str):
        self.seed = seed
        self.permutation = self._generate_permutation()
    
    def get_value(self, x: int, y: int) -> float:
        """Get deterministic value from permutation table"""
        # Hash-based deterministic noise
        combined = (x * 374761393 + y * 668265263) % 256
        return self.permutation[combined] / 255.0
```

#### WorldEngine
```python
class WorldEngine:
    """World Engine - The World Pillar"""
    
    def __init__(self, seed_zero: str = "SEED_ZERO", width: int = 100, height: int = 100):
        self.seed_zero = seed_zero
        self.permutation_table = PermutationTable(seed_zero)
        self.base_map: Dict[Tuple[int, int], TileData] = {}
        self._generate_base_world()
    
    def get_tile_at(self, position: Tuple[int, int]) -> TileData:
        """Get tile data at position"""
        return self.base_map.get(position, self._generate_tile_at_position(*position))
    
    def apply_delta(self, delta: WorldDelta) -> None:
        """Apply a world state change delta"""
        self.base_map[delta.position] = delta.current_tile.copy()
```

### Delta-State Persistence

#### GameState Enhancement
```python
@dataclass
class GameState:
    # ... existing fields ...
    
    # World Deltas (Persistence)
    world_deltas: Dict[Tuple[int, int], Dict[str, Any]] = field(default_factory=dict)
```

#### Delta Recording
```python
def _record_world_delta(self, old_pos: Tuple[int, int], new_pos: Tuple[int, int]) -> None:
    """Record world state change delta"""
    self.state.world_deltas[new_pos] = {
        "delta_type": "position_change",
        "timestamp": time.time(),
        "entity": "player",
        "from_position": old_pos,
        "to_position": new_pos
    }
```

## Validation Criteria

### Success Metrics
- **Deterministic World**: Same seed always produces same base world
- **Delta Persistence**: World changes are recorded and recoverable
- **Clean Separation**: World Engine only provides data, no game logic
- **No Circular Dependencies**: Clear one-way data flow

### Performance Targets
- **World Generation**: <1 second for 100x100 world
- **Delta Recording**: <1ms per state change
- **Tile Queries**: <0.1ms per tile lookup
- **Memory Usage**: <5MB for world + deltas

## KISS Principle Compliance

### Simplicity Achieved
- **No Tile Array Saving**: Only save changes from base seed
- **Deterministic Math**: Permutation table instead of complex noise
- **Clear Data Flow**: World → D&D Engine → Graphics Engine
- **Minimal Dependencies**: World Engine has no game logic dependencies

### Complexity Avoided
- **No Randomness**: All generation is seed-based and deterministic
- **No Circular References**: World Engine is pure data provider
- **No State Management**: World Engine doesn't track game state
- **No Event System**: Simple query/response pattern

## West Palm Beach Deployment

### Production Readiness
- **Seed-Based Worlds**: Consistent world generation across deployments
- **Delta Persistence**: Player progress saved efficiently
- **Memory Efficient**: Only store changes, not entire world state
- **Fast Recovery**: Base world + deltas = instant world restoration

### Test Results
```
🏆 Four-Pillar Architecture: SUCCESS
🌍 World + 🧠 Mind + 🚶 Actor + 🎨 Body = Complete System
🏆 Four-Pillar Heartbeat: WEST PALM BEACH READY
```

## Future Extensibility

### Volume Scaling
- **New Seeds**: Each volume can have unique Seed_Zero
- **Delta Compatibility**: Deltas work across different world seeds
- **World Size**: Configurable world dimensions for different needs
- **Tile Types**: Easy to add new tile classifications

### Content Generation
- **Special Locations**: World Engine can identify points of interest
- **Terrain Features**: Deterministic generation of rivers, mountains, etc.
- **Resource Distribution**: Seed-based placement of resources
- **Environment Zones**: Different biomes with unique characteristics

## Conclusion

**ADR 058**: Successfully implements delta-state persistence with a formal World Pillar, achieving the KISS principle while maintaining deterministic, persistent world generation.

The four-pillar architecture now provides:
- **Deterministic World Generation** via Seed_Zero and permutation tables
- **Efficient Persistence** via delta-state recording
- **Clean Separation** with no circular dependencies
- **Production Readiness** for West Palm Beach deployment

---

**Status**: IMPLEMENTED and VALIDATED ✅
