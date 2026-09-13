# Phase E Implementation Roadmap

**Document Status**: FINAL - Ready for Implementation
**Version**: 1.0
**Date**: 2026-02-14
**Classification**: Implementation Planning & Architecture

---

## Executive Overview

### Phase Status
- **Phase D**: ✅ COMPLETE (100% - 86/86 tests passing)
- **Phase E**: ⏳ READY FOR IMPLEMENTATION (This phase)
- **Next Phases**: F-J (Deferred until Phase E complete)

### Phase E Objective
Implement asset management and configuration infrastructure to support game entities, systems, and game-specific data loading.

**Duration**: 2-3 weeks
**Estimated Effort**: 40-50 hours
**Team Size**: 1 full-time developer
**Priority**: HIGH (required for Phases F-G)

---

## Phase E Scope & Deliverables

### 1. AssetRegistry System

**Purpose**: Centralized asset discovery, loading, and caching

**Components**:

#### 1.1 AssetRegistry Base Class
```
File: src/game_engine/foundation/asset_registry.py
Purpose: Core asset management interface

Classes:
- AssetRegistry: Central registry (singleton)
  - register_asset(asset_id, asset_data, metadata)
  - get_asset(asset_id) -> Asset
  - list_assets(asset_type) -> List[Asset]
  - clear_cache()
  - validate_assets()

- Asset: Data container
  - id: str (unique identifier)
  - type: str (sprite, sound, config, entity_template)
  - data: Any (actual asset content)
  - metadata: Dict (tags, dependencies, version)
  - timestamp: float (load time)

- AssetType: Enum
  - SPRITE
  - SOUND
  - TEXTURE
  - CONFIG
  - ENTITY_TEMPLATE
  - SHADER
  - ANIMATION
  - CUSTOM

Tests: 8-10 test cases
Effort: 1 day
```

#### 1.2 Asset Loader Interfaces
```
File: src/game_engine/foundation/asset_loaders.py
Purpose: Pluggable asset loading strategies

Base Classes:
- AbstractAssetLoader(ABC):
  - load(path: str) -> Asset
  - validate(asset: Asset) -> Result[Asset]
  - supports_type(asset_type: AssetType) -> bool

Implementations:
- SpriteAssetLoader
  - Loads PNG/JPG from assets/sprites/
  - Returns sprite data structure

- ConfigAssetLoader
  - Loads YAML/JSON from assets/configs/
  - Parses and validates with Pydantic

- EntityTemplateLoader
  - Loads entity definitions
  - Returns entity template factory

- CustomAssetLoader
  - User-extensible loader

Tests: 12-15 test cases
Effort: 1.5 days
```

#### 1.3 Asset Caching System
```
File: src/game_engine/foundation/asset_cache.py
Purpose: Performance optimization through intelligent caching

Features:
- LRU cache (configurable max size)
- Cache invalidation strategies
- Asset dependency tracking
- Lazy loading support
- Memory profiling

Classes:
- AssetCache:
  - get(asset_id) -> Asset (with cache check)
  - put(asset_id, asset) -> None
  - invalidate(asset_id) -> None
  - clear() -> None
  - get_stats() -> Dict (hit rate, memory usage)

Tests: 8 test cases
Effort: 1 day
```

---

### 2. ConfigManager System

**Purpose**: Centralized configuration and game settings management

**Components**:

#### 2.1 ConfigManager Base Class
```
File: src/game_engine/foundation/config_manager.py
Purpose: Application configuration authority

Classes:
- ConfigManager (singleton):
  - load_config(path: str, format: str) -> Result[Config]
  - get(key: str, default: Any = None) -> Any
  - set(key: str, value: Any) -> Result[None]
  - validate_config() -> Result[ValidationError]
  - get_environment() -> str (dev, staging, prod)
  - reload() -> Result[None]

- Config:
  - game_title: str
  - target_fps: int
  - resolution: Tuple[int, int]
  - physics_substeps: int
  - particle_pool_size: int
  - entity_pool_sizes: Dict[str, int]
  - audio_volume: float
  - custom_settings: Dict[str, Any]

- ConfigFormat: Enum
  - YAML
  - JSON
  - TOML
  - ENVIRONMENT

Tests: 12 test cases
Effort: 1.5 days
```

#### 2.2 Pydantic Validation Schemas
```
File: src/game_engine/foundation/config_schemas.py
Purpose: Type-safe configuration validation

Schemas:
- PhysicsConfig(BaseModel)
  - collision_check_frequency: int (Hz)
  - particle_pool_size: int (200-5000)
  - collision_detection_type: str

- GraphicsConfig(BaseModel)
  - target_fps: int (30-144)
  - renderer_type: str
  - resolution: Tuple[int, int]

- GameTypeConfig(BaseModel)
  - game_type: str (space, tycoon, rpg)
  - entities: Dict[str, EntityConfig]
  - systems: Dict[str, SystemConfig]

- EntityConfig(BaseModel)
  - entity_type: str
  - pool_size: int
  - components: List[str]
  - initial_properties: Dict[str, Any]

- SystemConfig(BaseModel)
  - system_name: str
  - enabled: bool
  - config: Dict[str, Any]

Tests: 15 test cases
Effort: 1.5 days
```

#### 2.3 Configuration File Support
```
Files: assets/configs/*.yaml, assets/configs/*.json

Supported Formats:
- YAML: assets/configs/game_config.yaml
- JSON: assets/configs/game_config.json
- Environment: Environment variables (overrides file)

Example Structure:
  assets/configs/
  ├── game_config.yaml (main config)
  ├── physics.yaml (physics settings)
  ├── graphics.yaml (rendering settings)
  ├── entities/
  │   ├── space_entities.yaml
  │   ├── rpg_entities.yaml
  │   └── tycoon_entities.yaml
  └── systems/
      ├── collision.yaml
      ├── effects.yaml
      └── ai.yaml

Tests: Configuration loading/parsing tests
Effort: 0.5 day (files creation)
```

---

### 3. Entity Template System

**Purpose**: Reusable entity definitions and spawning factories

**Components**:

#### 3.1 EntityTemplate Class
```
File: src/game_engine/systems/body/entity_template.py
Purpose: Template-based entity creation

Classes:
- EntityTemplate:
  - template_id: str
  - entity_type: str
  - base_properties: Dict[str, Any]
  - components: List[str]
  - metadata: Dict
  - create_entity(**kwargs) -> Entity

- EntityTemplateRegistry:
  - register_template(template_id, template) -> None
  - get_template(template_id) -> EntityTemplate
  - list_templates(entity_type) -> List[EntityTemplate]
  - validate_templates() -> Result[List[ValidationError]]

Tests: 12 test cases
Effort: 1.5 days
```

#### 3.2 Template Factory Methods
```
File: src/game_engine/systems/body/entity_factories.py
Purpose: Factory functions for common entity types

Functions:
- create_space_asteroid(size: str) -> EntityTemplate
- create_space_enemy(ai_type: str) -> EntityTemplate
- create_space_projectile(weapon_type: str) -> EntityTemplate

- create_rpg_creature(species: str, level: int) -> EntityTemplate
- create_rpg_npc(role: str) -> EntityTemplate

- create_tycoon_animal(species: str, genetics: Dict) -> EntityTemplate
- create_tycoon_facility(facility_type: str) -> EntityTemplate

Each factory includes:
- Default properties
- Component list
- Behavior configuration
- Customization hooks

Tests: 20+ test cases
Effort: 2 days
```

#### 3.3 Template Configuration Files
```
Files: assets/entities/*.yaml

Example: assets/entities/space_entities.yaml
templates:
  asteroid_small:
    entity_type: "space_entity"
    properties:
      radius: 2.0
      mass: 100
      health: 10
    components:
      - "collision"
      - "velocity"
    metadata:
      sprite_id: "asteroid_small"
      loot_table: "asteroids"

  asteroid_large:
    entity_type: "space_entity"
    properties:
      radius: 5.0
      mass: 500
      health: 50
    components:
      - "collision"
      - "velocity"
      - "fracture"
    metadata:
      sprite_id: "asteroid_large"
      split_into: ["asteroid_small", "asteroid_small"]

Tests: YAML parsing/validation tests
Effort: 0.5 day (files creation)
```

---

### 4. Game-Type-Specific Asset Loaders

**Purpose**: Specialized loading for space, tycoon, and RPG game types

#### 4.1 SpaceAssetLoader
```
File: src/game_engine/apps/space/asset_loader.py
Purpose: Load space game assets

Loads:
- Entity templates (asteroids, enemies, projectiles)
- Sprite definitions
- Physics configurations
- AI behaviors
- Weapon definitions

Example:
- assets/scenarios/space_scenario_1.yaml
- assets/entities/space_entities.yaml
- assets/configs/space_physics.yaml

Tests: 8 test cases
Effort: 1 day
```

#### 4.2 TycoonAssetLoader
```
File: src/game_engine/apps/tycoon/asset_loader.py
Purpose: Load tycoon game assets

Loads:
- Animal templates (genetics data)
- Facility blueprints
- Economic parameters
- Breeding behaviors
- Trait definitions

Tests: 8 test cases
Effort: 1 day
```

#### 4.3 RPGAssetLoader
```
File: src/game_engine/apps/rpg/asset_loader.py
Purpose: Load RPG game assets

Loads:
- Character templates
- Monster definitions
- Spell/ability database
- NPC configurations
- Dialog/narrative data

Tests: 8 test cases
Effort: 1 day
```

---

### 5. Integration with EntityManager

**Purpose**: Connect asset system to entity creation

#### 5.1 Enhanced EntityManager
```
File: src/game_engine/systems/body/entity_manager.py (Modified)
Purpose: Add template-based spawning

New Methods:
- spawn_from_template(template_id: str, **kwargs) -> Result[Entity]
- spawn_from_config(config_dict: Dict) -> Result[Entity]
- batch_spawn_from_template(template_id: str, count: int) -> List[Entity]

Integration:
- Uses EntityTemplateRegistry
- Uses AssetRegistry for sprite/config data
- Uses ConfigManager for default properties
- Returns Result<Entity> for error handling

Tests: 15 test cases (new methods)
Effort: 1 day
```

---

## Phase E Implementation Schedule

### Week 1: Foundation & AssetRegistry

**Days 1-2: AssetRegistry Core**
- [ ] Create AssetRegistry class
- [ ] Implement asset storage/retrieval
- [ ] Create Asset data container
- [ ] Write basic tests (8 tests)
- **Deliverable**: Basic asset loading working

**Days 3-4: Asset Loaders**
- [ ] Create AbstractAssetLoader interface
- [ ] Implement SpriteAssetLoader
- [ ] Implement ConfigAssetLoader
- [ ] Write loader tests (12 tests)
- **Deliverable**: Multiple asset types loadable

**Day 5: Asset Caching**
- [ ] Create AssetCache with LRU eviction
- [ ] Add cache statistics
- [ ] Integrate with AssetRegistry
- [ ] Write cache tests (8 tests)
- **Deliverable**: Performant asset retrieval

**Week 1 Total**:
- Tests: 28 passing
- Code: ~800 lines
- Status: AssetRegistry complete

---

### Week 2: Configuration Management

**Days 1-2: ConfigManager**
- [ ] Create ConfigManager class
- [ ] Implement YAML/JSON loading
- [ ] Create Config data container
- [ ] Write ConfigManager tests (12 tests)
- **Deliverable**: Configuration loading working

**Days 3-4: Validation Schemas**
- [ ] Create Pydantic schemas
- [ ] Implement validation logic
- [ ] Add error handling
- [ ] Write schema tests (15 tests)
- **Deliverable**: Type-safe configuration

**Day 5: Configuration Files**
- [ ] Create assets/configs/ directory structure
- [ ] Write example config files
- [ ] Document configuration options
- [ ] Create config templates
- **Deliverable**: Documented configuration system

**Week 2 Total**:
- Tests: 27 passing
- Code: ~600 lines
- Status: ConfigManager complete

---

### Week 3: Entity Templates & Integration

**Days 1-2: Entity Templates**
- [ ] Create EntityTemplate class
- [ ] Create EntityTemplateRegistry
- [ ] Implement template validation
- [ ] Write template tests (12 tests)
- **Deliverable**: Template system working

**Days 3-4: Factory Methods**
- [ ] Implement game-type factories
- [ ] Create factory test suite (20+ tests)
- [ ] Document factory patterns
- **Deliverable**: 3+ game types with templates

**Days 5-6: EntityManager Integration**
- [ ] Add template spawning to EntityManager
- [ ] Create template configuration files
- [ ] Write integration tests (15 tests)
- [ ] End-to-end testing
- **Deliverable**: Templates spawn entities correctly

**Day 7: Documentation & Polish**
- [ ] API documentation
- [ ] Usage examples
- [ ] Migration guide
- [ ] Final tests & validation
- **Deliverable**: Phase E complete & documented

**Week 3 Total**:
- Tests: 47 passing
- Code: ~800 lines
- Status: Phase E complete

---

## Phase E Testing Strategy

### Test Categories

| Category | Count | Coverage | Status |
|----------|-------|----------|--------|
| AssetRegistry | 8 | Loading, retrieval, validation | Planned |
| Asset Loaders | 12 | Each loader type tested | Planned |
| Asset Caching | 8 | LRU, invalidation, statistics | Planned |
| ConfigManager | 12 | Load, validate, environment | Planned |
| Config Schemas | 15 | Pydantic validation rules | Planned |
| Entity Templates | 12 | Template creation, validation | Planned |
| Entity Factories | 20 | Factory methods per game type | Planned |
| EntityManager Integration | 15 | Template spawning, batch ops | Planned |
| End-to-End | 10 | Full asset→config→entity pipeline | Planned |
| **TOTAL** | **112** | **Comprehensive** | **Planned** |

### Test Execution
- **Unit Tests**: Each component isolated (80 tests)
- **Integration Tests**: Asset→Config→Entity pipeline (22 tests)
- **End-to-End Tests**: Real-world scenarios (10 tests)
- **Performance Tests**: Asset loading benchmarks (5 tests)

**Target**: 100% Phase E test pass rate

---

## Phase E Deliverables Checklist

### Code Deliverables
- [ ] `src/game_engine/foundation/asset_registry.py` (100+ lines)
- [ ] `src/game_engine/foundation/asset_loaders.py` (200+ lines)
- [ ] `src/game_engine/foundation/asset_cache.py` (150+ lines)
- [ ] `src/game_engine/foundation/config_manager.py` (200+ lines)
- [ ] `src/game_engine/foundation/config_schemas.py` (250+ lines)
- [ ] `src/game_engine/systems/body/entity_template.py` (150+ lines)
- [ ] `src/game_engine/systems/body/entity_factories.py` (300+ lines)
- [ ] Enhanced `entity_manager.py` with template methods (50+ lines)
- [ ] Game-type loaders: `space/`, `tycoon/`, `rpg/` (200+ lines combined)

**Total New Code**: ~1,600 lines

### Configuration Deliverables
- [ ] `assets/configs/game_config.yaml`
- [ ] `assets/configs/game_config.json` (reference)
- [ ] `assets/configs/physics.yaml`
- [ ] `assets/configs/graphics.yaml`
- [ ] `assets/entities/space_entities.yaml`
- [ ] `assets/entities/tycoon_entities.yaml`
- [ ] `assets/entities/rpg_entities.yaml`
- [ ] `assets/scenarios/` (sample scenarios)

**Total Config Files**: ~10 files

### Test Deliverables
- [ ] `tests/unit/asset_registry_test.py` (50+ lines)
- [ ] `tests/unit/asset_loaders_test.py` (100+ lines)
- [ ] `tests/unit/asset_cache_test.py` (60+ lines)
- [ ] `tests/unit/config_manager_test.py` (100+ lines)
- [ ] `tests/unit/config_schemas_test.py` (150+ lines)
- [ ] `tests/unit/entity_template_test.py` (100+ lines)
- [ ] `tests/unit/entity_factories_test.py` (200+ lines)
- [ ] `tests/integration/asset_config_entity_test.py` (150+ lines)

**Total Test Code**: ~900 lines

### Documentation Deliverables
- [ ] `docs/PHASE_E_IMPLEMENTATION_ROADMAP.md` (this file)
- [ ] `docs/ASSET_SYSTEM_GUIDE.md` (API + examples)
- [ ] `docs/CONFIG_MANAGEMENT_GUIDE.md` (Configuration reference)
- [ ] `docs/ENTITY_TEMPLATE_GUIDE.md` (Template syntax + examples)
- [ ] Code inline documentation (docstrings)
- [ ] Configuration file examples and templates

---

## Dependencies & Prerequisites

### Python Dependencies (Already Present)
- Pydantic 2.6+ (validation)
- PyYAML (configuration loading)
- loguru (logging)

### No New External Dependencies Required

### Prerequisites for Phase E
- ✅ Phase D complete (foundation already in place)
- ✅ EntityManager stable (can extend without breaking)
- ✅ DIContainer ready (for registry services)
- ✅ Result<T> error handling available (already implemented)

---

## Risks & Mitigation

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Circular Dependencies** | MEDIUM | Design registry before implementing |
| **Configuration Format Issues** | LOW | Use Pydantic for strict validation |
| **Asset Cache Memory Bloat** | LOW | Implement LRU with size limits |
| **Template Complexity** | MEDIUM | Keep templates simple, docs clear |
| **Breaking EntityManager** | LOW | Extend, don't modify core spawning |
| **Performance Regression** | LOW | Benchmark before/after Phase E |

---

## Performance Targets

| Metric | Target | Expected |
|--------|--------|----------|
| Asset load time (100 assets) | < 100ms | 50-100ms |
| Config validation | < 50ms | 30-50ms |
| Entity spawn from template | < 1ms | 0.5-1ms |
| Cache hit rate | > 95% | > 98% |
| Memory overhead | < 50MB | 20-40MB |

---

## Optional: Parallel Godot/C# Track

If resources permit, can run simultaneously:

**Track A (Primary - Phase E Python)**: Weeks 1-3 (AssetRegistry, ConfigManager, Templates)

**Track B (Optional - Godot/C#)**: Weeks 1-2
- Godot project setup
- EntitySynchronizer.cs
- Graphics wrapper classes
- IPC protocol

**Sync Point**: Week 3-4 (Integration if both tracks complete)

See: `docs/GODOT_CSHARP_COMPATIBILITY_ASSESSMENT.md` for details

---

## Success Criteria

Phase E is complete when:

✅ **Functionality**:
- AssetRegistry loads and caches assets correctly
- ConfigManager validates configurations
- EntityManager spawns from templates
- All 112 tests passing (100% pass rate)

✅ **Performance**:
- Asset operations complete within targets
- No memory leaks detected
- Cache efficiency > 95%

✅ **Code Quality**:
- 100% type hints
- All public methods documented
- Follows project conventions
- Black/isort/mypy compliant

✅ **Documentation**:
- API fully documented
- Configuration guide complete
- Examples provided
- Migration guide written

✅ **Integration**:
- Phases A-E all working together
- No regression in Phase D systems
- Backward compatibility maintained

---

## Next Phase Preview (Phase F)

Once Phase E complete, Phase F (Game Systems) will:
- Implement WorldManager (persistent world state)
- Implement CombatResolver (turn-based combat)
- Implement LootSystem (item generation)
- Implement FactionSystem (relationships)

**Estimated Duration**: 3-4 weeks
**Team Size**: 1 developer
**Prerequisite**: Phase E complete ✓

---

**END DOCUMENT**

---

### Quick Reference: Phase E Roadmap

```
PHASE E: Assets & Configuration

DURATION: 2-3 weeks
EFFORT: 40-50 hours
TEAM: 1 full-time developer

WEEK 1: AssetRegistry
  - Asset storage/retrieval
  - Loader interfaces
  - LRU caching
  - Deliverable: 28 tests passing

WEEK 2: ConfigManager
  - Configuration loading
  - Pydantic validation
  - YAML/JSON support
  - Deliverable: 27 tests passing

WEEK 3: Entity Templates
  - Template system
  - Factory methods
  - EntityManager integration
  - Deliverable: Phase E complete (112 tests)

OPTIONAL PARALLEL:
  - Godot/C# Graphics (Track B)
  - See: GODOT_CSHARP_COMPATIBILITY_ASSESSMENT.md

SUCCESS CRITERIA:
  ✅ 112 tests passing (100%)
  ✅ All systems integrated
  ✅ Performance targets met
  ✅ Full documentation
  ✅ Ready for Phase F
```
