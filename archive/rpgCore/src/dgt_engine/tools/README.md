# DGT Studio Suite 🎮🛠️

The complete development environment for the DGT Autonomous Movie System. This suite provides professional-grade tools for world building, narrative design, and system monitoring with a 1990s development workstation aesthetic.

## 🏗️ Architecture Overview

The DGT Studio Suite follows the KISS principle with a hybrid approach:
- **Tkinter + PIL**: Visual PPU rendering (160x144 Game Boy parity)
- **Rich + Terminal**: Professional data visualization and command interface
- **Direct Engine Integration**: 100% parity with game engine

## 🛠️ Tools Overview

### 🗺️ Cartographer - Visual World Editor
A Tkinter-based visual editor that wraps the PPU for WYSIWYG world editing.

**Features:**
- 160x144 PPU display with 4x scaling for visibility
- Click-to-paint tile editing
- Real-time world state synchronization
- Grid overlay and coordinate display
- Delta save system integration
- Keyboard shortcuts for efficiency

**Usage:**
```bash
python src/tools/cartographer.py
# Or via launcher:
python src/tools/studio_launcher.py --tool cartographer
```

**Controls:**
- **Left Click**: Paint tile
- **Right Click**: Sample tile
- **G**: Toggle grid
- **C**: Toggle coordinates
- **S**: Save prefab
- **L**: Load prefab

### 🎭 Weaver - Narrative Dashboard
A Rich-based terminal dashboard for managing Chronos (Quest) and Persona (NPC) pillars.

**Features:**
- Live quest tracking with progress indicators
- NPC persona inspector with faction standing
- Real-time narrative event logging
- Faction relationship visualization
- Professional terminal UI design

**Usage:**
```bash
python src/tools/weaver.py
# Or via launcher:
python src/tools/studio_launcher.py --tool weaver
```

**Display Panels:**
- Quest tracking table
- Persona inspection table
- Narrative event log
- Faction relationship matrix
- Control panel

### 🖥️ Developer Console - Command Center
Enhanced terminal interface with auto-completion and command history.

**Features:**
- Tab completion for commands and arguments
- Command history with readline support
- Real-time performance monitoring
- Circuit breaker status tracking
- Paint commands for tile manipulation
- Cartographer integration

**Usage:**
```bash
python src/tools/developer_console.py
# Or via launcher:
python src/tools/studio_launcher.py --tool console
```

**Key Commands:**
```bash
# Painting commands
/paint tile x y TILE_TYPE
/paint area x1 y1 x2 y2 TILE_TYPE
/paint fill x y
/paint pattern checkerboard x y size

# Cartographer integration
/cartographer launch
/cartographer save PREFAB_NAME
/cartographer load PREFAB_NAME

# Performance monitoring
/performance stats
/circuits status
```

## 🚀 Quick Start

### 1. Launch Complete Studio Suite
```bash
python src/tools/studio_launcher.py
```
This launches all tools: Cartographer (visual), Weaver (narrative), and Console (commands).

### 2. Launch Individual Tools
```bash
# Visual world editing
python src/tools/studio_launcher.py --tool cartographer

# Narrative dashboard
python src/tools/studio_launcher.py --tool weaver

# Command center
python src/tools/studio_launcher.py --tool console
```

### 3. Basic Workflow
1. **Launch Cartographer** for visual world building
2. **Use Console** `/paint` commands for precise tile placement
3. **Launch Weaver** to manage quests and NPCs
4. **Save prefabs** using `/cartographer save` or Cartographer UI
5. **Monitor performance** with `/performance stats`

## 📁 File Structure

```
src/tools/
├── cartographer.py          # Visual world editor
├── weaver.py               # Narrative dashboard
├── developer_console.py    # Enhanced command center
├── studio_launcher.py      # Suite launcher
└── README.md              # This file

src/utils/
├── delta_save.py          # Prefab delta save system
├── performance_monitor.py # Performance tracking
├── config_manager.py      # Configuration management
└── circuit_breaker.py     # Fault tolerance

assets/prefabs/             # Saved world prefabs
├── tavern_room.dgt.gz     # Compressed prefab
├── forest_area.dgt        # Uncompressed prefab
└── autosave.dgt          # Auto-save state

config/
└── system.yaml            # System configuration
```

## 🎨 Painting Patterns

The console supports various painting patterns:

```bash
# Checkerboard pattern
/paint pattern checkerboard 25 25 5

# Cross pattern
/paint pattern cross 25 25 3

# Diamond pattern
/paint pattern diamond 25 25 4

# Spiral pattern
/paint pattern spiral 25 25 6
```

## 📦 Prefab System

The delta save system enables efficient prefab management:

### Creating Prefabs
```bash
# Via console
/cartographer save my_room

# Via Cartographer UI
Click "Save Prefab" button
```

### Loading Prefabs
```bash
# Via console
/cartographer load my_room

# Via Cartographer UI
Click "Load Prefab" button
```

### Prefab Format
Prefabs are saved in `.dgt` (JSON) or `.dgt.gz` (compressed) format:
- **Metadata**: Creation info, version, checksum
- **Base State**: Complete world state (optional)
- **Delta Changes**: Incremental changes list

## 🔧 Configuration

The system uses `config/system.yaml` for configuration:

```yaml
# Core System Settings
mode: "autonomous"
scene: "tavern"
seed: "TAVERN_SEED"

# Performance Settings
target_fps: 60
enable_performance_monitoring: true

# Graphics Settings
enable_graphics: true
graphics_width: 1024
graphics_height: 768

# Tool Settings
enable_console: true
enable_debug_mode: false
```

## 📊 Performance Monitoring

Real-time performance tracking:

```bash
# View performance stats
/performance stats

# Export performance data
/performance export

# Circuit breaker status
/circuits status
```

## 🏛️ System Integration

The Studio Suite integrates with all 6 DGT pillars:

1. **World Engine**: Tile manipulation, world state
2. **Mind Engine**: Movement validation, rule processing
3. **Body Engine**: PPU rendering, visual output
4. **Persona Engine**: NPC management, faction systems
5. **Chronos Engine**: Quest tracking, narrative events
6. **State Engine**: Game state, tag management

## 🎯 Development Philosophy

### KISS Principle
- **Zero Dependencies**: Tkinter and Rich are built-in
- **Direct Integration**: No abstraction layers
- **WYSIWYG**: What you see is what you get
- **Professional Tools**: 1990s workstation aesthetic

### SOLID Architecture
- **Single Responsibility**: Each tool has one purpose
- **Open/Closed**: Extensible without modification
- **Liskov Substitution**: Interfaces are interchangeable
- **Interface Segregation**: Minimal, focused interfaces
- **Dependency Inversion**: Depend on abstractions

## 🚨 Troubleshooting

### Common Issues

**Tkinter not available on Linux:**
```bash
sudo apt-get install python3-tk
```

**PIL not available:**
```bash
pip install Pillow
```

**Rich not available:**
```bash
pip install rich
```

### Performance Issues

**Low FPS:**
- Check `/performance stats`
- Disable grid overlay in Cartographer
- Reduce update frequency in Weaver

**Memory Usage:**
- Clear console history: `/history clear`
- Reset performance metrics: `/performance reset`
- Restart tools if needed

## 🤝 Contributing

The DGT Studio Suite follows the established patterns:

1. **Code Style**: Follow existing conventions
2. **Documentation**: Update README and help text
3. **Testing**: Test with all tools running
4. **Performance**: Maintain 60 FPS target
5. **Compatibility**: Ensure 100% engine parity

## 📜 License

Part of the DGT Autonomous Movie System project.

---

**Built with passion for game development and the 1990s development spirit.** 🎮✨
