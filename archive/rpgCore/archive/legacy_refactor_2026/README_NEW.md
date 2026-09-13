# DGT Platform - Zero-Clutter Professional SDK

**Version**: 1.0.0  
**Status**: Operational Hard-Freeze  
**Architecture**: Clean, Namespaced, Type-Safe

---

## 🎯 Quick Start

```bash
# Install in development mode
pip install -e .

# Run Space Engine
python scripts/launch_space.py

# Run RPG Engine  
python scripts/launch_rpg.py

# Run Universal Launcher
python scripts/universal_launcher.py --engine space --view rich

# Run Test Suite
python scripts/run_tests.py

# Hardware Stress Test
python scripts/hardware_stress_test.py
```

---

## 📁 Directory Structure

```
DGT_PLATFORM/
├── src/dgt_core/           # Core Library (Pure SDK)
│   ├── assets/             # World Data Vault
│   │   ├── materials/        # Visual properties
│   │   ├── entities/         # Entity blueprints  
│   │   └── stories/          # Narrative fragments
│   ├── engines/            # Physics Engines
│   │   ├── space/            # Newtonian vectors
│   │   ├── shells/           # D20 RPG mechanics
│   │   │   └── d20/          # Core probability
│   │   └── body/             # Legacy components
│   ├── evolution/          # Genetic Evolution (NEAT)
│   ├── kernel/             # State & Persistence
│   │   ├── models.py        # Pydantic contracts
│   │   ├── state.py         # Core physics state
│   │   ├── persistence.py   # Thread-safe SQLite
│   │   ├── universal_registry.py  # Cross-engine tracking
│   │   └── batch_processor.py     # Concurrent updates
│   ├── tactics/            # Stakes & Permadeath
│   │   ├── stakes_manager.py    # Resource depletion
│   │   ├── death_arbiter.py     # Mortality logic
│   │   └── graveyard_manager.py  # Legacy preservation
│   ├── view/               # Rendering Layer
│   │   ├── cli/              # Rich CLI interface
│   │   ├── graphics/         # High-fidelity rendering
│   │   │   └── ppu/          # Pixel Processing Unit
│   │   └── terminal/         # Debug utilities
│   └── orchestrator.py     # Unified entry point
├── scripts/                # Entry Points & Tools
│   ├── universal_launcher.py  # Master CLI
│   ├── launch_space.py       # Space engine
│   ├── launch_rpg.py         # RPG engine
│   ├── run_tests.py          # Test suite
│   └── hardware_stress_test.py  # Permadeath validation
├── data/                   # Runtime Data (gitignore)
│   ├── roster.db           # SQLite database
│   └── logs/               # Application logs
├── tests/                  # Pytest Suite
├── pyproject.toml          # Modern Python packaging
├── requirements.txt        # Dependency lock file
└── README.md              # This file
```

---

## 🏗️ Architecture Overview

### The Trinity of Separation

**Kernel** (`src/dgt_core/kernel/`) - Immutable Source of Truth
- Pydantic v2 models ensure type-safe communication
- Thread-safe SQLite operations with WAL mode
- Cross-engine pilot tracking with graveyard preservation

**Engines** (`src/dgt_core/engines/`) - Plug-and-Play Physics
- Space: 60 FPS Newtonian vector physics
- Shells: Turn-based D20 RPG mechanics  
- Design Principle: Engines consume Kernel state, never modify it directly

**View** (`src/dgt_core/view/`) - Parallel Sense Layer
- Rich CLI dashboard for real-time monitoring
- PPU high-fidelity rendering with hardware burn effects
- Thread-safe parallel rendering without blocking

---

## ⚰️ Features

### Core Mechanics
- **Genetic Evolution**: NEAT-driven pilot development
- **Cross-Engine Compatibility**: Seamless pilot transfer between engines
- **Resource Management**: Fuel, thermal, and hull integrity tracking
- **Permadeath System**: Permanent loss with legacy preservation

### Visual Excellence
- **Hardware Burn Effects**: Real-time visual feedback for critical states
- **Rich Dashboard**: Fleet monitoring with resource bars
- **Graveyard System**: Historical tracking with funeral rites
- **Thread Safety**: 60 FPS maintained with parallel rendering

### Advanced Systems
- **D20 Death Saves**: Fair probability-based mortality
- **Material System**: Visual properties based on genetic traits
- **Narrative Generation**: LLM-ready story fragments
- **Type Safety**: Pydantic contracts prevent data corruption

---

## 🔧 Development

### Requirements
- Python 3.14.0 (minimum)
- 4GB RAM minimum
- 2GB disk space minimum

### Installation
```bash
# Clone repository
git clone <repository-url>
cd dgt-platform

# Install in development mode
pip install -e .

# Install optional dependencies
pip install -e .[dev]  # Development tools
pip install -e .[ml]   # ML features
pip install -e .[neat] # NEAT evolution
```

### Testing
```bash
# Run all tests
python scripts/run_tests.py

# Run specific test categories
pytest tests/unit/ -v
pytest tests/integration/ -v
python scripts/hardware_stress_test.py
```

### Code Quality
```bash
# Format code
black src/ scripts/
isort src/ scripts/

# Type checking
mypy src/dgt_core/

# Run pre-commit hooks
pre-commit run --all-files
```

---

## 🎮 Usage Examples

### Space Engine with Rich Dashboard
```python
from dgt_core.orchestrator import create_space_orchestrator, ViewType

orchestrator = create_space_orchestrator(
    fleet_size=10,
    view_type=ViewType.RICH
)

orchestrator.start()
```

### RPG Engine with Permadeath
```python
from dgt_core.orchestrator import create_shell_orchestrator, ViewType
from dgt_core.tactics.stakes_manager import create_stakes_manager

orchestrator = create_shell_orchestrator(
    party_size=5,
    view_type=ViewType.RICH
)

stakes_manager = create_stakes_manager(orchestrator.registry)
```

### Cross-Engine Pilot Transfer
```python
from dgt_core.kernel.universal_registry import create_universal_registry

registry = create_universal_registry()

# Export from Space engine
export_data = registry.export_pilot_for_engine_swap("pilot_001")

# Import to Shell engine
registry.import_pilot_from_engine_swap("pilot_001", EngineType.SHELL)
```

---

## 📊 Performance

- **Target FPS**: 60 FPS maintained with PPU effects
- **Concurrency**: ThreadPoolExecutor for thread-safe operations
- **Database**: SQLite with WAL mode for concurrent access
- **Memory**: Optimized batch processing for large fleets

---

## 🔒 Security & Safety

- **Type Safety**: Pydantic v2 models prevent data corruption
- **Thread Safety**: All database operations use proper locking
- **Input Validation**: Comprehensive input sanitization
- **Error Handling**: Graceful degradation with detailed logging

---

## 🤝 Community

- **Documentation**: See `docs/` directory for detailed API reference
- **Contributing**: Follow `CONTRIBUTING.md` for development guidelines
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join community conversations for questions and ideas

---

## 📜 License

MIT License - See LICENSE file for details

---

**The DGT Platform: Where every decision matters, every loss creates legacy, and every victory is earned.**

*Architectural Singularity achieved. System hardened. Ready for deployment.*
