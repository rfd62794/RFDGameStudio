> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# D&D Essentials Framework: Domain-Driven Design Refactoring

## Overview

This document describes the refactoring of the Semantic RPG from a God Class architecture to a clean Domain-Driven Design (DDD) framework following the "Iron Frame" deconstruction plan.

## The Problem: God Class Anti-Pattern

The original `GameREPL.process_action()` method violated the Single Responsibility Principle by handling:
- Semantic intent resolution
- Deterministic game logic
- Dice rolling and math
- State updates
- Social consequence calculations
- Goal completion checking
- Narrative generation
- Room transitions
- Loot generation

This made the code difficult to test, maintain, and extend.

## The Solution: Domain-Driven Design

We've decomposed the system into five specialized modules following SOLID principles:

### 1. The Orchestrator: `src/engine.py`
**Responsibility**: Thin coordination only
- Moves data between specialized modules
- Handles async orchestration
- Manages game flow (Sense → Resolve → Act → Narrate)

```python
# Clean orchestration - no game logic
async def process_action(self, player_input: str) -> bool:
    intent = self.semantic_resolver.resolve_intent(player_input)
    d20_result = self.d20_resolver.resolve_action(...)
    self._apply_d20_result(d20_result, ...)
    await self._narrate_outcome(...)
    return self._check_game_over()
```

### 2. The Heart: `src/d20_core.py`
**Responsibility**: Pure deterministic D&D rules
- Dice rolling (d20 + modifiers)
- HP calculations
- Reputation changes
- Relationship state transitions
- Goal completion verification
- **No LLMs allowed here**

```python
# Pure game mechanics - no creative output
def resolve_action(self, intent_id: str, ...) -> D20Result:
    dc = self._calculate_difficulty_class(intent_id, room_tags)
    roll = random.randint(1, 20)
    total = roll + attribute_bonus + item_bonus
    success = total >= dc
    return D20Result(success, roll, total, dc, ...)
```

### 3. The DM: `src/narrator.py`
**Responsibility**: Creative narrative only
- Translates D20 results into cinematic stories
- **Only module that uses LLMs**
- No game logic or state changes

```python
# Pure creative output - no game mechanics
async def narrate_stream(self, player_input: str, d20_result: D20Result, ...):
    # Convert deterministic results into compelling narrative
    async for token in self.chronicler.narrate_stream(...):
        yield token
```

### 4. The Set: `src/world_factory.py`
**Responsibility**: Location and scenario management
- Location templates (Urban, Dungeon, Wilderness)
- Scenario loading (Heist, Diplomacy arcs)
- Social Graph persistence between transitions

### 5. The Actor: `src/character_factory.py`
**Responsibility**: Character archetype generation
- Stat array generation (10/18/12/16/12/10 pattern)
- Skill proficiency assignment
- Personality-based archetype creation

## Architecture Benefits

### 1. **Single Responsibility Principle**
Each module has one clear purpose and no overlap.

### 2. **Testability**
- `D20Resolver` can be unit tested with deterministic math
- `Narrator` can be tested with mock LLM responses
- `WorldFactory` and `CharacterFactory` are pure data transformations

### 3. **Maintainability**
- Bug fixes are isolated to specific domains
- New features can be added without touching other modules
- Clear interfaces between components

### 4. **Performance**
- Deterministic logic runs instantly (no LLM calls)
- LLM usage is isolated to narrative generation only
- Better memory usage with focused responsibilities

## Data Flow: Sense → Resolve → Act → Narrate

```
Player Input
    ↓
SemanticResolver (Sense)
    ↓
D20Resolver (Resolve) → D20Result (pure data)
    ↓
GameEngine (Act) → State changes
    ↓
Narrator (Narrate) → Creative story
```

## Key Design Decisions

### 1. **Immutable Data Transfer**
`D20Result` is a pure dataclass - no methods, just state. This prevents logic leakage between modules.

### 2. **Async Boundaries**
Only the `Narrator` and `Engine` deal with async. Core game logic (`D20Resolver`) is synchronous and deterministic.

### 3. **LLM Isolation**
The `Narrator` is the ONLY module that touches LLMs. This contains:
- API costs
- Latency issues
- Model versioning problems
- Hallucination risks

### 4. **State Management**
`GameState` remains the single source of truth, but mutations happen through well-defined interfaces.

## Migration Guide

### From Old God Class:
```python
# OLD: Everything in one method
def process_action(self, player_input: str):
    intent = self.resolver.resolve_intent(player_input)
    arbiter_result = self.arbiter.resolve_action(...)
    outcome = self.quartermaster.calculate_outcome(...)
    # ... 200 lines of varied concerns
    narrative = self.chronicler.narrate(...)
```

### To New DDD Framework:
```python
# NEW: Clean orchestration
async def process_action(self, player_input: str) -> bool:
    intent = self.semantic_resolver.resolve_intent(player_input)
    d20_result = self.d20_resolver.resolve_action(...)
    self._apply_d20_result(d20_result, ...)
    await self._narrate_outcome(...)
    return self._check_game_over()
```

## Testing Strategy

### Unit Tests
- `D20Resolver`: Test deterministic math with seeded random
- `WorldFactory`: Test template generation
- `CharacterFactory`: Test archetype balance
- `Narrator`: Test with mocked LLM responses

### Integration Tests
- `GameEngine`: Test orchestration flow
- End-to-end: Test complete action pipeline

## Performance Improvements

### Before Refactoring
- Every action: 3 LLM calls (Arbiter + Chronicler + Voyager)
- Varied sync/async causing complexity
- Hard to profile due to varied concerns

### After Refactoring
- Every action: 1 LLM call (Narrator only)
- Deterministic logic runs instantly
- Clear async boundaries
- Easy to profile each module

## Future Extensibility

### Adding New Game Mechanics
1. Add logic to `D20Resolver` (deterministic)
2. Add narrative seeds to `Narrator`
3. No changes needed to other modules

### Adding New Locations
1. Add templates to `WorldFactory`
2. No changes needed to game logic

### Adding New Character Types
1. Add archetypes to `CharacterFactory`
2. No changes needed to combat resolution

## Conclusion

The Domain-Driven Design refactoring successfully eliminates the God Class anti-pattern while maintaining all existing functionality. The new architecture is:

- **More maintainable** (clear separation of concerns)
- **More testable** (isolated, deterministic modules)
- **More performant** (reduced LLM usage)
- **More extensible** (clean interfaces between domains)

The "Iron Frame" provides a solid foundation for future RPG features while keeping the codebase clean and manageable.
