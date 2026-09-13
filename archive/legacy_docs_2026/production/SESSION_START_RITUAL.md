> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# Windsurf Agent - Session Start Ritual

## 🏆 Pre-Frontal Cortex Activation

This ritual establishes the Agent's "reasoning" framework and ensures architectural guardrails are active before any development work begins.

---

## 📋 Mandatory Session Start Checklist

### Step 1: Refresh Prime Directives
```bash
# Read the Immutable Kernel
cat .windsurfrules
```

**Validation Points:**
- ✅ Three-Tier Architecture understood
- ✅ Interface First Policy confirmed
- ✅ Sovereign Rule Hierarchy internalized
- ✅ Skeptical Auditor mode activated

### Step 2: Align with Current State
```bash
# Read Long-Term Memory
cat docs/production/MANIFEST.md
```

**Critical Information to Extract:**
- 🎯 **Current Phase**: Phase 1 Complete → Phase 2 Initiated
- 📊 **Debt Count**: 576 TODO markers (target: <50)
- 🏆 **Completed P0s**: Protocols, DI Container, Exception Hierarchy
- 🚧 **Active Blockers**: Component migration to protocols
- 📋 **Next Priority**: PPU Consolidation

### Step 3: Architectural Compliance Check
**Before ANY code modification:**

1. **Tier Validation**: 
   - Will this change violate Three-Tier Architecture?
   - Am I importing from wrong tier?

2. **Interface Compliance**:
   - Does this component have a Protocol definition?
   - Am I implementing the correct Protocol?

3. **Dependency Injection**:
   - Are dependencies injected through constructor?
   - Am I creating hard-coded imports?

4. **Error Handling**:
   - Am I using Result[T] pattern?
   - Am I throwing raw exceptions?

---

## 🎯 Phase 2: PPU Consolidation Mission

### Current Objective
**Target**: Unify 5 PPU variants under single `PPUProtocol`

### Assets to Inventory
```python
# Use DIContainer to identify all PPU instances
from src.di.container import DIContainer
from src.interfaces.protocols import PPUProtocol

container = DIContainer()
# TODO: Register all PPU variants for inventory
```

### PPU Variants to Consolidate
1. **SimplePPU** - Miyoo Mini logic (direct-line protocol)
2. **Phosphor Terminal** - CRT effects and energy coupling
3. **Virtual PPU** - Game Boy parity rendering
4. **Enhanced PPU** - Dual-layer rendering
5. **Hardware Burn PPU** - Retro effects

### Consolidation Strategy
1. **Create UnifiedPPU** implementing `PPUProtocol`
2. **Strategy Pattern** for different rendering modes
3. **Factory Pattern** for PPU creation
4. **Performance optimization** for each use case

---

## 🧬 Debt-to-Asset Conversion Protocol

### ADR 191: Active Strategy
**Rule**: Every file modified MUST resolve ≥1 TODO marker

### Implementation Checklist
- [ ] Count TODOs in target files before modification
- [ ] Resolve at least 1 TODO during modification
- [ ] Update MANIFEST.md debt count
- [ ] Track reduction percentage

### Target Files for PPU Consolidation
- `src/graphics/ppu.py`
- `src/body/simple_ppu.py`
- `src/ui/phosphor_terminal.py`
- `src/graphics/virtual_ppu.py`
- `src/graphics/enhanced_ppu_dual_layer.py`

---

## 🔧 Technical Execution Framework

### UnifiedPPU Architecture
```python
class UnifiedPPU(BasePPU):
    """Unified PPU implementing PPUProtocol with strategy pattern"""
    
    def __init__(self, config: PPUConfig):
        self.rendering_strategies = {
            'miyoo': MiyooStrategy(),
            'phosphor': PhosphorStrategy(),
            'gameboy': GameBoyStrategy(),
            'enhanced': EnhancedStrategy()
        }
        self.current_strategy = self.rendering_strategies[config.mode]
```

### Performance Requirements
- **60Hz Radar**: Real-time rendering for space combat
- **30Hz Phosphor**: CRT effects for terminal interface
- **Battery Optimization**: Low-power mode for Miyoo Mini
- **Memory Efficiency**: <100MB total usage

### Integration Points
- **DI Container**: Register as singleton PPU implementation
- **Configuration**: Mode selection via config system
- **Font Manager**: Energy-based font switching
- **Terminal Protocol**: CRT effects integration

---

## 📟 Session Success Metrics

### Completion Criteria
- [ ] UnifiedPPU created and implements PPUProtocol
- [ ] All 5 PPU variants consolidated
- [ ] Performance benchmarks maintained
- [ ] ≥5 TODO markers resolved
- [ ] MANIFEST.md updated with progress

### Quality Gates
- [ ] No architectural violations
- [ ] 100% type hint coverage
- [ ] Result[T] pattern used throughout
- [ ] Circular dependency check passes
- [ ] All tests pass

---

## 🌌 Sovereign Trust Protocol

### High-Trust State Achievement
The framework now maintains architectural integrity across session resets:

1. **Immutable Rules**: `.windsurfrules` prevents drift
2. **Long-Term Memory**: `MANIFEST.md` provides continuity
3. **Self-Correction**: Protocol-first approach prevents errors
4. **Debt Reduction**: Systematic TODO elimination

### Session Continuity Guarantee
- **Day 1**: Agent reads rules, understands current state
- **Day 3**: Agent returns, aligns with MANIFEST, continues work
- **Day 7**: Agent maintains architectural guardrails automatically

---

## 🏁 Session Activation

**Agent Acknowledgment Required:**
- I have read `.windsurfrules` and understand the Prime Directives
- I have read `MANIFEST.md` and aligned with current Phase 2 objectives
- I will validate all changes against Three-Tier Architecture
- I will resolve ≥1 TODO per modified file
- I will use Result[T] pattern for all error handling
- I will maintain Skeptical Auditor standards

**Mission**: PPU Consolidation under PPUProtocol  
**Status**: Ready to begin Phase 2 execution  
**Trust Level**: HIGH (Sovereign Guardrails Active)

---

**Last Updated**: 2026-02-08 21:45 UTC  
**Phase**: 2 (Component Consolidation)  
**Architectural Integrity**: GUARDED 🛡️
