# rpgCore Constitutional Framework
**Spec-Driven Development Constitution v1.0**

---

## 🎯 Prime Directive

This Constitution establishes the sovereign architectural principles for rpgCore development. All specifications, implementations, and decisions must validate against these principles. Violations are architectural violations that halt work.

---

## 🏛️ Three-Tier Architecture Mandate

### Tier 1: Foundation Layer (Shared Infrastructure)
- **Location**: `pyproject.toml`, `src/shared/`, core protocols
- **Sovereign Rule**: CANNOT import from Tier 2 or Tier 3
- **Components**: Type systems, validation, ECS foundation, rendering primitives
- **Purpose**: Universal infrastructure that serves all applications

### Tier 2: Engine Layer (Shared Systems)
- **Location**: `src/dgt_core/`, `src/core/`, shared engines  
- **Sovereign Rule**: CANNOT import from Tier 3 (Application Layer)
- **Components**: Semantic engine, narrative systems, game state management
- **Purpose**: Reusable game systems across multiple demos

### Tier 3: Application Layer (Genre-Specific)
- **Location**: `src/apps/`, `src/engines/`, demo-specific code
- **Sovereign Rule**: CAN import from Tier 1 and Tier 2 only
- **Components**: RPG mechanics, tower defense, specific game logic
- **Purpose**: Demo implementations that may vary per genre

---

## 🧬 Universal Creature Architecture

### Constitutional Principle: Entity-Component-System (ECS) Foundation
- **Rule**: All game entities MUST be ECS-based
- **Components**: Data containers that reference entity state
- **Systems**: Pure functions that operate on component sets
- **Entities**: Unique identifiers with component registries

### Constitutional Principle: Visual ≠ Mechanical Separation
- **Genetics**: Mathematical parameters determining appearance
- **Mechanics**: Game-specific behaviors and stats
- **Rendering**: Visual output derived from genetics, not game logic
- **Validation**: Same creature must work in any genre without modification

### Constitutional Principle: Cultural Neutrality
- **Five Cultures**: Ember, Crystal, Marsh, Tundra, Void (per VISION.md)
- **Cultural Parameters**: Ranges, not locked values
- **Player Agency**: Genetics can override cultural tendencies
- **Emergent Sub-species**: Player-created variations are valid

---

## 🌍 Hexagon World Structure

### Constitutional Geography
```
        Crystal
       /        \
  Tundra          Ember
    |    [GARDEN]    |
  Marsh           Gale
       \        /
        Tide
```

### Constitutional Factions
- **Six Cultures**: Each with elemental affinity, stat bias, resource specialty
- **Void**: Original unified culture, not a playable faction
- **Garden**: Neutral convergence point, cannot be captured
- **Intersection Zones**: Wilderness areas between neighboring cultures

### Constitutional Resources
- **Gold**: Liquid economy (Tide culture)
- **Scrap**: Material economy (Ember culture) 
- **Food**: Living economy (Marsh culture)

---

## 🔧 Technical Sovereignty

### Constitutional Technology Stack
- **Core**: Python 3.12+ with uv for dependency management
- **Data**: Pydantic v2 for validation, JSON for git-friendly persistence
- **Rendering**: Mathematical rendering (genetics → appearance), no sprite bottleneck
- **Performance**: 60 FPS target, <5ms grid render, <100MB memory usage

### Constitutional Development Protocol
- **Spec-First**: No implementation without specification
- **Protocol-First**: No concrete classes without Protocol definition
- **Test-Driven**: All components require contract tests
- **Documentation**: Every system has acceptance criteria

### Constitutional Quality Gates
- **Type Safety**: 100% type hint coverage on public APIs
- **Error Handling**: Result[T] pattern, no raw exceptions
- **Performance**: Boot <5ms, turn-around <300ms
- **Testing**: 95% minimum coverage, property-based tests for core systems

---

## 📋 KISS Constraints

### Constitutional Scope Limits
- **Active Goals**: Maximum 3 active goals at any time
- **Task Management**: Tasks must be spec-driven, not vibe-driven
- **Dependencies**: Minimize import overhead, circular dependency prevention
- **Complexity**: Match complexity to requirements, no over-engineering

### Constitutional Phase Management
- **Phase 1**: Foundation (Constitution + Specification + Plan)
- **Phase 2**: Architectural Mapping (Technical implementation plan)
- **Phase 3**: Implementation (Production-ready code)
- **Phase 4**: Analysis (Skeptical auditor review)

---

## 🎭 Narrative Constitution

### Constitutional Story Principles
- **Player Agency**: Astronaut crash lands, choice to leave or stay
- **Systems Intelligence**: Intelligence through systems, not language models
- **Discovery Rewards**: Gameplay reveals itself as earned progression
- **Emotional Anchor**: Garden as home base, slimes as companions

### Constitutional World Logic
- **Fracture Event**: World in turmoil, astronaut did not cause but may have accelerated
- **Cultural Memory**: Factions remember player choices
- **Elemental Balance**: Six cultures represent elemental spectrum
- **Void Legacy**: Original unified culture, source of all others

---

## ⚖️ Governance Mandate

### Constitutional Compliance
- **Validation**: All changes must validate against this Constitution
- **Enforcement**: Architectural violations halt work until resolved
- **Evolution**: Constitution may be amended, never violated
- **Accountability**: Every decision traceable to constitutional principle

### Constitutional Success Metrics
- **Technical**: 785+ tests passing, zero breaking changes
- **Architectural**: Clean separation of concerns, no technical debt
- **Player**: Browser playable, portfolio-ready demos
- **Business**: Multi-tenant capability proven, monetizable platform

---

**Ratified**: 2026-03-01  
**Version**: 1.0  
**Status**: ACTIVE  
**Amendment Process**: Requires unanimous architect approval
