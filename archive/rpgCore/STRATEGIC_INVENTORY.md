# RPG Core Strategic Inventory
## ECS + Persistence Architecture Assessment

### 1. Slime Garden Structure

**Current Data Model:**
- **Location**: `src/apps/slime_breeder/garden/garden_state.py`
- **Core Container**: `GardenState` class with `slimes: List[Slime]`
- **Persistence**: Manual JSON serialization in `save()`/`load()` methods
- **State Stored**: Name, position, full genome data (shape, size, colors, traits, stats)

**Key Findings:**
- Garden has its own persistence separate from Roster system
- Slime entities in garden are NOT the same objects as RosterSlime
- Manual genome serialization - no automatic persistence
- Position data stored but physics state (velocity, etc.) lost on save

### 2. Component & System Patterns

**Existing Component-like Structures:**

✅ **Already Component-Compatible:**
- `SlimeGenome` (`src/shared/genetics/genome.py`) - Pure data, no behavior
- `Kinematics` (`src/shared/physics/kinematics.py`) - Physics state
- `Vector2` (`src/shared/physics/kinematics.py`) - Math primitive

🔄 **Partial Components (varied data/behavior):**
- `Slime` (`src/apps/slime_breeder/entities/slime.py`) - Contains genome + kinematics + behavior logic
- `RosterSlime` (`src/shared/teams/roster.py`) - Genome + progression + team state

❌ **Monolithic Systems:**
- `GardenState` - Container + update logic + persistence
- Individual scene classes - UI + game logic + state management

**Demo Integration Analysis:**

**Racing Demo** (`src/apps/slime_breeder/scenes/race_scene.py`):
- Pulls from Roster (not Garden)
- Uses `RaceEngine` with separate track generation
- No feedback to Garden/Roster
- Creates its own slime instances for racing

**Dungeon Demo** (`src/apps/slime_breeder/scenes/scene_dungeon_path.py`):
- Pulls from Roster via `DungeonSession`
- Uses unified session state (recently fixed)
- Combat results feed back to Roster (HP changes, death)
- Track/squad data stored in session (not persisted)

**Breeding Demo** (`src/apps/slime_breeder/scenes/breeding_scene.py`):
- Pulls from Roster
- Creates new offspring via `breed()` function
- Adds new slimes to Roster
- No integration with Garden

### 3. Demo Integration Points

**Data Flow Patterns:**
```
Garden ←→ (isolated)
Roster ←→ Racing (read-only)
Roster ←→ Dungeon (read/write, HP changes)
Roster ←→ Breeding (write/add new)
```

**Critical Impedance Mismatches:**
1. **Dual Entity Systems**: Garden has `Slime` objects, Roster has `RosterSlime` objects
2. **Inconsistent Persistence**: Garden saves to its own format, Roster saves separately
3. **State Synchronization**: No mechanism to sync Garden ↔ Roster
4. **Demo Isolation**: Each demo creates its own instances rather than sharing references

### 4. Persistence Gaps

**What Currently Survives Shutdown:**
- Roster state via `roster_save.py` (JSON at `saves/roster.json`)
- Garden state via manual save (if called)
- Dungeon session state (lost on shutdown)

**What's Lost:**
- Active dungeon runs
- Garden physics state (velocity, forces)
- In-progress breeding operations
- Demo-specific session data

**Manual Serialization Patterns:**
- Garden: Manual dict conversion in `save()` method
- Roster: `to_dict()`/`from_dict()` pattern
- No automatic persistence framework
- No versioning or migration support

### 5. Systemic Synergies Identified

**Immediate ROI Opportunities:**

1. **Unified Entity Model** (High Impact):
   - Merge Garden Slime ↔ RosterSlime into single entity type
   - Eliminate dual object systems
   - Single source of truth for creature state

2. **Component Extraction** (Medium Impact):
   - Extract behavior from `Slime.update()` into separate systems
   - Create `BehaviorComponent` for personality-driven movement
   - Separate rendering from game logic

3. **Session Persistence** (High Impact):
   - Extend existing `DungeonSession` pattern to all demos
   - Auto-save session state on demo transitions
   - Resume capability for interrupted runs

4. **Event Bus Foundation** (Medium Impact):
   - Replace direct demo-to-demo calls with events
   - Enable cross-demo effects (dungeon XP → garden mutations)
   - Foundation for future ECS migration

### 6. Tower Defense Integration Readiness

**Current State**: No Tower Defense demo found in codebase

**Integration Points Needed**:
- Grid-based positioning system (current physics is continuous)
- Tower placement logic
- Wave spawning system
- Resource management (gold, upgrades)

**ECS Benefits for Tower Defense**:
- Natural fit for entity-component pattern
- Towers, enemies, projectiles as entities
- Grid position component
- Attack/defense components

### 7. Migration Priorities

**Phase 1 - Foundation (Immediate)**:
1. Unify Garden ↔ Roster entity systems
2. Implement session auto-save
3. Create base component interfaces

**Phase 2 - Gradual ECS**:
1. Extract behavior systems from Slime class
2. Implement component registry
3. Convert one demo (likely Dungeon) to ECS pattern

**Phase 3 - Full Integration**:
1. Convert remaining demos
2. Implement event bus
3. Add Tower Defense demo using ECS from start

### 8. Technical Constraints

**Locked Decisions:**
- Python + pygame framework
- JSON-based file persistence
- Dataclass-based state management
- Scene-based demo architecture

**Flexibility Points**:
- ECS implementation approach (gradual vs. big bang)
- Persistence format evolution
- Event system design
- Component granularity

---

## Architectural Assessment Summary

**Strengths:**
- Clean separation of concerns in some areas (Genome, Physics)
- Working persistence patterns exist
- Recent session unification shows architectural momentum
- Component-like structures already present

**Critical Issues:**
- Dual entity systems causing data duplication
- Inconsistent persistence across demos
- Varied data/behavior in monolithic classes
- No unified state management

**Recommended Approach:**
Start with unification of entity systems and session persistence, then gradually extract components. The existing codebase shows good architectural patterns that can be evolved rather than replaced.
