# ADJ System - Top-Level Governance CLI

## Overview

The ADJ (Agent, Projects, Journey) System is the primary governance interface for DGT Engine development. It provides a simple CLI for both Robert (Director) and the Coding Agent to track progress, manage priorities, and coordinate development.

## Quick Start

```bash
# Check current status
python adj.py status

# See Phase 3 details
python adj.py phase 3

# See current priorities
python adj.py priorities

# See next actions
python adj.py next

# Approve Phase 3 (Director only)
python adj.py approve phase3
```

## Commands

### `python adj.py status`
Shows complete DGT Engine status including:
- Test floor vs protected minimum
- Phase status (1, 2, 3)
- Active milestone
- Current blockers
- Top priorities

### `python adj.py phase <number>`
Shows detailed status for a specific phase:
- Phase 1: Entity Unification ✅
- Phase 2: ECS Foundation ✅
- Phase 3: Tower Defense 🔄

### `python adj.py priorities`
Lists current priorities in order:
1. Fix any remaining test failures
2. Director approval for Phase 3
3. Begin Phase 3 implementation

### `python adj.py blockers`
Shows current blockers and fix times:
- Test failures
- Documentation gaps
- Missing approvals

### `python adj.py next`
Shows immediate and short-term next actions:
- What to do this session
- What to do next session
- Commands to use

### `python adj.py approve <target>`
Director approval interface:
- `python adj.py approve phase3` - Approve Phase 3 specification
- Records approval timestamp and decision
- Updates governance state

### `python adj.py update`
Updates dashboard with current state:
- Refreshes test count
- Updates timestamp
- Syncs with current reality

## Current State

### Test Floor: 685 / 462 (protected minimum)
- ✅ All tests passing
- ✅ Above protected minimum
- ✅ Ready for Phase 3

### Phase Status
- **Phase 1**: Entity Unification ✅ Complete (545 tests)
- **Phase 2**: ECS Foundation ✅ Complete (583 tests)
- **Phase 3**: Tower Defense 🔄 In Planning (Target 785 tests)

### Active Milestone: M_PHASE3
- Tower Defense Integration
- Modular sprite-driven engine
- Multi-tenant architecture

### Current Blockers: None
- ✅ RosterEntry.alive fixed
- ✅ ADJ_DASHBOARD.md created
- ✅ Phase 3 documented

### Top Priorities
1. ✅ Fix any remaining test failures (Complete)
2. 🔄 Director approval for Phase 3 (Awaiting Robert)
3. 🔄 Begin Phase 3 implementation (Pending approval)

## Phase 3 Architecture

### Vision Locked
- Modular sprite-driven living world engine
- Primary Tenant: Slime Garden (pixel-gen towers)
- Secondary Tenant: Fantasy RPG (sprite proof-of-concept)

### 8 Critical Decisions ✅
1. RenderComponent: Add NOW (Phase 3.0)
2. RenderingSystem: FULL ECS pipeline
3. Enemy Sprites: FREE (OpenGameArt/itch.io)
4. Animation: FULL Framework
5. Multi-Tenant Config: Implement NOW
6. Projectiles: Simple (procedural)
7. Tower Selection: Existing highlight
8. Turbo Shells: KEEP alive

### Implementation Phases
- **3.0**: ECS Rendering Refactor (690+ tests)
- **3.1**: Grid System & Components (710+ tests)
- **3.2**: Tower Defense Systems (730+ tests)
- **3.3**: TD Session & Persistence (745+ tests)
- **3.4**: TD Scene & Integration (755+ tests)
- **3.5**: Fantasy RPG Tenant (770+ tests)
- **3.6**: Archive & Documentation (785+ tests)

## Usage Patterns

### For Robert (Director)
```bash
# Daily check-in
python adj.py status

# Review Phase 3
python adj.py phase 3

# Approve when ready
python adj.py approve phase3
```

### For Coding Agent
```bash
# Start session
python adj.py status

# Check priorities
python adj.py priorities

# See next actions
python adj.py next

# Update after work
python adj.py update
```

## Integration with Existing Systems

The ADJ CLI integrates with:
- `docs/ADJ_DASHBOARD.md` - Single source of truth
- `docs/MILESTONES.md` - Phase tracking
- `docs/TASKS.md` - Task breakdown
- `src/tools/apj/` - Underlying agent system

## Files

- `adj.py` - Top-level CLI interface
- `docs/ADJ_DASHBOARD.md` - Governance dashboard
- `docs/ADJ_README.md` - This documentation
- `docs/approvals.json` - Director approval records

## Next Steps

1. **Robert**: Review Phase 3 details with `python adj.py phase 3`
2. **Robert**: Approve Phase 3 with `python adj.py approve phase3`
3. **PyPro Architect**: Create Phase 3 specification
4. **Coding Agent**: Begin Phase 3.0 implementation

---

**Status**: 🔄 **READY FOR DIRECTOR APPROVAL** - ADJ system operational, Phase 3 pending approval.
