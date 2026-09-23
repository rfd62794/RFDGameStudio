> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# DGT Tri-Modal Display Suite

## Overview

The DGT Display Suite implements ADR 120: Tri-Modal Rendering Bridge, providing a unified interface for displaying simulation data through three distinct "lenses" based on environmental pressure and use case requirements.

## Architecture

### Three Display Lenses

1. **Terminal** (`Console/CLI`) - High-speed, low-overhead data logs and headless monitoring
2. **Cockpit** (`Glass/Grid`) - Modular, framed dashboards for IT Management or complex Sim stats  
3. **PPU** (`Near-Gameboy`) - 60Hz dithered "Sonic Field" for visual immersion

### Stateless Rendering Engine

The render engine is completely stateless - it only processes Universal Render Packets regardless of the underlying data type:

```json
{
  "mode": "PPU",
  "layers": [
    {"depth": 0, "type": "baked", "id": "glade_bg"},
    {"depth": 1, "type": "dynamic", "id": "voyager", "x": 10, "y": 12, "effect": "sway"}
  ],
  "hud": {"line_1": "D20: 18", "line_2": "Success!"}
}
```

## Quick Start

### Installation

```bash
# Install dependencies
pip install -r requirements_solid.txt

# Optional: Install Rich for enhanced terminal display
pip install rich

# Optional: Build Rust components for PPU
python build_rust.py
```

### Basic Usage

```python
from src.body import DisplayDispatcher, DisplayMode, create_ppu_packet

# Create dispatcher
dispatcher = DisplayDispatcher(default_mode=DisplayMode.TERMINAL)

# Register display bodies (factory functions handle initialization)
from src.body.terminal import create_terminal_body
from src.body.cockpit import create_cockpit_body  
from src.body.ppu import create_ppu_body

dispatcher.register_body(DisplayMode.TERMINAL, create_terminal_body())
dispatcher.register_body(DisplayMode.COCKPIT, create_cockpit_body())
dispatcher.register_body(DisplayMode.PPU, create_ppu_body())

# Render data
packet = create_ppu_packet([
    {'id': 'player', 'x': 10, 'y': 10, 'type': 'dynamic'},
    {'id': 'background', 'x': 0, 'y': 0, 'type': 'baked'}
], ["Health: 100%", "Score: 1500"])

dispatcher.render(packet)
```

## Display Bodies

### Terminal Body

**Use Case**: Headless monitoring, server logs, CI/CD pipelines

**Features**:
- Rich-based tables and panels
- 10Hz update rate (rate-limited for console)
- Live display with structured layouts
- Performance metrics sidebar

```python
from src.body.terminal import create_terminal_body

terminal = create_terminal_body()
terminal.render_table("System Stats", {
    'FPS': 60.0,
    'Entities': 25,
    'Memory': '67.8MB'
})
```

### Cockpit Body

**Use Case**: IT dashboards, simulation monitoring, development tools

**Features**:
- Tkinter grid layout with configurable cells
- Real-time meters and progress bars
- 30Hz update rate
- Modular instrument placement

```python
from src.body.cockpit import create_cockpit_body

cockpit = create_cockpit_body()
cockpit.update_meter('cpu', 45.2)
cockpit.update_label('status', 'System Running')
```

### PPU Body

**Use Case**: Game visualization, retro computing, artistic rendering

**Features**:
- 160x144 Game Boy parity resolution
- 60Hz dithered rendering with Rust blitter
- Layer composition with effects (sway, pulse, flicker)
- HUD overlay with 4 text lines

```python
from src.body.ppu import create_ppu_body

ppu = create_ppu_body()
ppu.update_entity_position('player', 15, 8)
```

## Universal Render Packet

### Structure

```python
from src.body.dispatcher import RenderPacket, RenderLayer, HUDData

packet = RenderPacket(
    mode=DisplayMode.PPU,
    layers=[
        RenderLayer(
            depth=0,
            type="dynamic",  # "baked", "dynamic", "effect"
            id="sprite_id",
            x=10, y=12,
            effect="sway",  # "sway", "pulse", "flicker"
            metadata={'custom': 'data'}
        )
    ],
    hud=HUDData(
        line_1="Primary status",
        line_2="Secondary status",
        line_3="Tertiary status", 
        line_4="Quaternary status"
    )
)
```

### Layer Types

- **baked**: Static background elements, tiles, environment
- **dynamic**: Moving entities, actors, interactive objects
- **effect**: Visual effects, particles, animations

### Effects

- **sway**: Organic movement for grass, trees, water
- **pulse**: Rhythmic brightness changes for magical items
- **flicker**: Random on/off for fire, lights, electricity

## Display Dispatcher

### Mode Switching

```python
# Switch display mode
dispatcher.set_mode(DisplayMode.TERMINAL)
dispatcher.set_mode(DisplayMode.COCKPIT) 
dispatcher.set_mode(DisplayMode.PPU)

# Automatic mode switching via packet
packet.mode = DisplayMode.COCKPIT
dispatcher.render(packet)  # Automatically switches to Cockpit
```

### State-to-Packet Conversion

```python
# Convert raw state to render packet
state_data = {
    'entities': [
        {'id': 'player', 'x': 10, 'y': 10, 'effect': 'sway'},
        {'id': 'enemy', 'x': 15, 'y': 8}
    ],
    'background': {'id': 'grass_bg'},
    'hud': {'line_1': 'Health: 100%', 'line_2': 'Score: 1500'}
}

dispatcher.render_state(state_data, DisplayMode.PPU)
```

### Performance Monitoring

```python
# Get performance statistics
stats = dispatcher.get_performance_stats()
print(f"Current mode: {stats['dispatcher']['current_mode']}")
print(f"Packet history: {stats['dispatcher']['packet_history_size']}")

# Per-body statistics
for mode, body_stats in stats['bodies'].items():
    print(f"{mode}: {body_stats['avg_fps']:.1f} FPS")
```

## Demo Application

### Running the Demo

```bash
python demo_tri_modal_dispatcher.py
```

The demo showcases:
- **Simultaneous multi-modal rendering** of the same data
- **Interactive mode switching** with keyboard controls
- **Animated entities** with different effects
- **Real-time performance monitoring**

### Demo Controls

- **T**: Switch to Terminal mode
- **C**: Switch to Cockpit mode  
- **P**: Switch to PPU mode
- **S**: Cycle through all modes automatically
- **Q**: Quit demo

## Testing

### Running Tests

```bash
# Full test suite
python -m pytest tests/test_tri_modal_dispatcher.py -v

# Individual body tests
python -m pytest tests/test_tri_modal_dispatcher.py::TestDisplayBodies -v
```

### Test Coverage

- ✅ Dispatcher initialization and mode switching
- ✅ Packet rendering and validation
- ✅ State-to-packet conversion
- ✅ Performance statistics collection
- ✅ Display body creation and cleanup
- ✅ Convenience functions

## Configuration

### Environment Variables

```bash
# Enable debug logging
export DGT_DEBUG=1

# Set default display mode
export DGT_DEFAULT_MODE=terminal

# Configure update rates
export DGT_TERMINAL_HZ=10
export DGT_COCKPIT_HZ=30
export DGT_PPU_HZ=60
```

### Custom Display Bodies

```python
from src.body.dispatcher import DisplayBody, RenderPacket

class CustomDisplayBody(DisplayBody):
    def __init__(self):
        super().__init__("Custom")
    
    def _setup(self):
        # Custom initialization
        pass
    
    def _render_packet(self, packet: RenderPacket):
        # Custom rendering logic
        pass
    
    def _cleanup(self):
        # Custom cleanup
        pass

# Register with dispatcher
dispatcher.register_body(DisplayMode.CUSTOM, CustomDisplayBody())
```

## Performance Characteristics

| Mode | Update Rate | Memory Usage | CPU Usage | Use Case |
|------|-------------|--------------|-----------|----------|
| Terminal | 10Hz | Low | Minimal | Headless monitoring |
| Cockpit | 30Hz | Medium | Moderate | Dashboard analytics |
| PPU | 60Hz | High | High | Game visualization |

## Integration Examples

### IT Monitoring

```python
# Server metrics dashboard
metrics = {
    'cpu': 45.2, 'memory': 67.8, 'disk': 23.4,
    'network_in': 1024, 'network_out': 2048
}

dispatcher.render_state({
    'meters': metrics,
    'labels': {'status': 'All Systems Operational'}
}, DisplayMode.COCKPIT)
```

### Game Development

```python
# Game state rendering
game_state = {
    'entities': [
        {'id': 'player', 'x': 10, 'y': 10, 'effect': 'sway'},
        {'id': 'monster', 'x': 15, 'y': 8, 'effect': 'pulse'}
    ],
    'background': {'id': 'dungeon_bg'},
    'hud': {
        'line_1': f'HP: {player.health}/100',
        'line_2': f'Gold: {player.gold}'
    }
}

dispatcher.render_state(game_state, DisplayMode.PPU)
```

### Data Science

```python
# Experiment results
results = {
    'accuracy': 0.95, 'precision': 0.92, 'recall': 0.89,
    'loss': 0.023, 'epoch': 42
}

dispatcher.render_state({
    'data': results,
    'title': 'Training Metrics'
}, DisplayMode.TERMINAL)
```

## Architecture Decision Records

- **ADR 120**: Tri-Modal Rendering Bridge - Display dispatcher architecture
- **ADR 075**: Pure Tkinter Implementation - PPU rendering strategy  
- **ADR 078**: Multi-Mode Viewport Protocol - PPU mode switching
- **ADR 088**: Pre-Bake Design Protocol - Dithering engine patterns

## Troubleshooting

### Common Issues

**Rich not available for Terminal mode**
```bash
pip install rich
```

**Tkinter not available for Cockpit/PPU modes**
```bash
# On Ubuntu/Debian
sudo apt-get install python3-tk

# On macOS (usually included with Python)
# On Windows (usually included with Python)
```

**PPU components not available**
```bash
# Build Rust components
python build_rust.py
```

**Performance issues**
- Reduce update rates in display body configuration
- Limit packet history size in dispatcher
- Use appropriate mode for use case (Terminal for headless)

### Debug Mode

```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Enable detailed logging
dispatcher = DisplayDispatcher(default_mode=DisplayMode.TERMINAL)
```

## Contributing

1. Follow SOLID principles for new display bodies
2. Add comprehensive tests for new features
3. Update documentation and examples
4. Ensure backward compatibility

## License

MIT License - See LICENSE file for details.

---

**The Visual Universal Translator**: One data source, three display perspectives. Perfect for office monitoring, development debugging, or immersive gameplay.
