# DGT Platform - Architectural Singularity Manifest
**Version**: 1.0.0  
**Date**: 2026-02-07  
**Status**: Operational Hard-Freeze  

## 🎖️ The Architectural Singularity Achieved

The DGT Platform has evolved from a collection of scripts into a **living ecosystem** where technical decisions have emotional consequences. This document captures the "Golden State" of the platform as of the final refactoring masterclass.

---

## 🏗️ The Trinity of Separation

### Kernel (`dgt_core/kernel/`) - The Immutable Source of Truth
- **Purpose**: Central state management and data contracts
- **Technology**: Pydantic v2 models ensure type-safe communication
- **Components**:
  - `models.py` - Pydantic data contracts (MaterialAsset, EntityBlueprint, StoryFragment)
  - `state.py` - Core physics and game state
  - `persistence.py` - Thread-safe SQLite operations
  - `universal_registry.py` - Cross-engine pilot tracking with graveyard support
  - `batch_processor.py` - Concurrent database updates

### Engines (`dgt_core/engines/`) - Plug-and-Play Physics
- **Purpose**: Consumes Kernel state, produces physics updates
- **Design Principle**: Engines are consumers, not masters of the Kernel
- **Components**:
  - `space/` - 60 FPS Newtonian vector physics (Star-Fleet)
  - `shells/` - Turn-based D20 RPG mechanics (TurboShells)
    - `d20/` - Core probability and death save logic
  - `body/` - Legacy rendering components

### View (`dgt_core/view/`) - The Parallel Sense Layer
- **Purpose**: Renders state without modifying it
- **Key Innovation**: Thread-safe parallel rendering
- **Components**:
  - `cli/` - Rich-powered administrative interface
    - `dashboard.py` - Real-time fleet monitoring
    - `resource_dashboard.py` - Hardware burn visual feedback
    - `logger_config.py` - Unified logging infrastructure
  - `graphics/` - High-fidelity rendering
    - `ppu/` - Pixel Processing Unit with hardware burn effects
  - `terminal/` - Debug and inspection utilities
  - `view_coordinator.py` - Thread-safe view management

---

## ⚰️ The Mechanics of Mortality

### DeathArbiter (`dgt_core/tactics/death_arbiter.py`)
**Bridge Between Game Mechanics and Data Persistence**
- Connects D20 death saves to UniversalRegistry
- Generates funeral rites for fallen pilots
- Ensures fair but deadly outcomes

### Graveyard (`dgt_core/tactics/graveyard_manager.py`)
**The Systemic Fix for Developer's Guilt**
- Archives pilot genetics and history
- Preserves architectural work while creating meaningful loss
- Provides resurrection mechanics (premium feature)

### StakesManager (`dgt_core/tactics/stakes_manager.py`)
**Resource Depletion and Hardware Burn**
- 3 chassis slots create strategic scarcity
- Fuel/thermal/hull resource tracking
- Visual feedback integration with PPU

---

## 🔧 Technical Specifications

### Performance Profile
- **Python Version**: 3.14.0 (Latest stable)
- **Target FPS**: 60 FPS maintained even with PPU shader effects
- **Concurrency**: Thread-safe operations via ThreadPoolExecutor
- **Database**: SQLite with WAL mode for concurrent access

### Resilience Features
- **Batch Processing**: Mitigates SQLite locking errors
- **Type Safety**: Pydantic v2 models prevent data corruption
- **Error Handling**: Comprehensive logging with Rich formatting
- **Graceful Shutdown**: Clean thread termination

### Visual Effects ("Juice")
- **Hardware Burn**: Red/Yellow flickering based on resource levels
- **Screen Shake**: Hull integrity below 10% triggers camera shake
- **Static Overlay**: Digital noise for critical damage states
- **Color Shifts**: Dynamic thermal overload visualization

---

## 📁 Project Structure

```
src/dgt_core/
├── kernel/                 # The Truth (State/Constants/Models)
│   ├── models.py          # Pydantic data contracts
│   ├── state.py           # Core physics state
│   ├── persistence.py     # Thread-safe database operations
│   ├── universal_registry.py  # Cross-engine tracking
│   └── batch_processor.py # Concurrent updates
├── evolution/            # Brain (NEAT)
├── engines/               # Body (Physics)
│   ├── space/            # Newtonian vectors
│   ├── shells/           # D20 RPG mechanics
│   │   └── d20/          # Core probability logic
│   └── body/             # Legacy components
├── view/                 # Senses (Rendering)
│   ├── cli/              # Rich CLI interface
│   ├── graphics/         # High-fidelity rendering
│   │   └── ppu/          # Pixel Processing Unit
│   └── terminal/         # Debug utilities
├── tactics/              # Stakes (Permadeath)
│   ├── stakes_manager.py # Resource management
│   ├── death_arbiter.py  # Mortality logic
│   └── graveyard_manager.py # Legacy preservation
└── assets/               # Vault (World Data)
    ├── materials/        # Visual properties
    ├── entities/         # Entity blueprints
    └── stories/          # Narrative fragments
```

---

## 🚀 Quick Start Guide

### Installation
```bash
# Clone repository
git clone <repository-url>
cd rpgCore

# Install dependencies
pip install -r requirements.txt

# Run system validation
python dgt_universal_launcher.py --status
```

### Launch Options
```bash
# Space engine with Rich dashboard
python dgt_universal_launcher.py --engine space --view rich

# Shell engine with auto-detection
python dgt_universal_launcher.py --engine shell --view auto

# Hardware stress test
python hardware_stress_test.py

# System benchmark
python dgt_universal_launcher.py --test
```

### Configuration
- **Fleet Size**: Adjust with `--fleet-size` (default: 5)
- **Party Size**: Adjust with `--party-size` (default: 5)
- **Graphics**: Enable with `--graphics` flag
- **Logging**: Set level with `--log-level` (DEBUG/INFO/WARNING/ERROR)

---

## 🎮 Gameplay Features

### Core Mechanics
- **Genetic Evolution**: NEAT-driven pilot development
- **Cross-Engine Compatibility**: Seamless pilot transfer between Space and Shell
- **Resource Management**: Fuel, thermal, and hull integrity tracking
- **Permadeath**: Permanent loss with graveyard preservation

### Visual Feedback
- **Real-time Dashboard**: Rich CLI with fleet status and resource bars
- **Hardware Burn Effects**: Visual indicators for critical states
- **Funeral Rites**: Auto-generated narrative for fallen pilots
- **Graveyard Statistics**: Historical tracking of losses

### Advanced Features
- **D20 Death Saves**: Fair probability-based mortality system
- **Material System**: Visual properties based on genetic traits
- **Narrative Generation**: LLM-ready story fragments
- **Thread-Safe Rendering**: Parallel PPU and CLI operation

---

## 🔒 Operational Hard-Freeze

### What's Fixed
- All core directories are properly namespaced under `dgt_core/`
- Type-safe Pydantic models ensure data integrity
- Thread-safe operations prevent race conditions
- Clean separation of concerns (Kernel/Engines/View)

### What's Preserved
- **Legacy Work**: Graveyard archives all pilot genetics and history
- **Asset Integrity**: Centralized vault with validated contracts
- **Performance**: 60 FPS maintained with visual effects
- **Extensibility**: Plugin-ready architecture for new engines

### What's Next
- **Hardware Deployment**: Ready for Miyoo Mini Plus hardware
- **Live Training**: First operational fleet training session
- **Community**: Open for contributions and extensions
- **Documentation**: Complete API reference and tutorials

---

## 🏆 Achievement Summary

✅ **Architectural Singularity**: Complete integration of Brain, Body, and Senses  
✅ **Permadeath System**: Emotional stakes with legacy preservation  
✅ **Type Safety**: Pydantic v2 contracts prevent data corruption  
✅ **Thread Safety**: Parallel rendering without blocking  
✅ **Visual Excellence**: Hardware burn effects create real tension  
✅ **Mechanical Depth**: D20 system provides fair outcomes  
✅ **Asset Vault**: Centralized, validated world data  

---

## 📞 Support and Community

- **Documentation**: See `docs/` directory for detailed API reference
- **Issues**: Report bugs via GitHub Issues
- **Contributions**: See `CONTRIBUTING.md` for development guidelines
- **Discussions**: Join the community for questions and ideas

---

**The DGT Platform is no longer just code—it's a living world where every decision matters, every loss creates legacy, and every victory is earned.**

*Architectural Singularity achieved. System hardened. Ready for deployment.*
