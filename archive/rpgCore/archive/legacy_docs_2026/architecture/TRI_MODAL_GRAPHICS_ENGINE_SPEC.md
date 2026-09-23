> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# Tri-Modal Graphics Engine Formal Specification
## ADR 120: Tri-Modal Rendering Bridge - Production Architecture

### Executive Summary

The Tri-Modal Graphics Engine is a unified rendering architecture that provides three distinct display modes optimized for different deployment scenarios. This specification documents the complete inventory of graphics components and their integration into a cohesive formal engine.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                Tri-Modal Graphics Engine                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   TERMINAL  │  │   COCKPIT   │  │     PPU     │         │
│  │   Body      │  │   Body      │  │    Body     │         │
│  │             │  │             │  │             │         │
│  │ • Rich CLI  │  │ • Dashboard │  │ • Game Boy  │         │
│  │ • 10Hz      │  │ • 30Hz      │  │ • 60Hz      │         │
│  │ • Low OH    │  │ • Grid UI   │  │ • Dithered  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────▼───────┐
                    │ Display       │
                    │ Dispatcher    │
                    │               │
                    │ • Mode Switch │
                    │ • Packet Route│
                    │ • Performance │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │ Tri-Modal     │
                    │ Engine        │
                    │               │
                    │ • Unified API │
                    │ • Legacy      │
                    │   Adapter     │
                    │ • Universal   │
                    │   Packets     │
                    └───────────────┘
```

### Component Inventory

#### 1. Core Engine Components

**TriModalEngine** (`src/engines/body/tri_modal_engine.py`)
- **Purpose**: Unified engine with legacy compatibility
- **Key Features**:
  - Backward compatibility with GraphicsEngine API
  - Universal packet enforcement (ADR 122)
  - Performance monitoring and resource management
  - Seamless migration path

**DisplayDispatcher** (`src/body/discriptor.py`)
- **Purpose**: Routes render packets to appropriate display body
- **Key Features**:
  - Dynamic mode switching
  - Packet history tracking
  - Performance statistics
  - State-to-packet conversion

#### 2. Display Bodies

**TerminalBody** (`src/body/terminal.py`)
- **Display Mode**: Console/CLI
- **Target**: 10Hz update rate, low overhead
- **Technology**: Rich library for beautiful console output
- **Use Cases**: Headless monitoring, data logs, CI/CD

**CockpitBody** (`src/body/cockpit.py`)
- **Display Mode**: Glass/Grid modular dashboard
- **Target**: 30Hz update rate, instrument panels
- **Technology**: Tkinter grid layout with meters/labels
- **Use Cases**: IT Management, complex sim stats, dev tools

**PPUBody** (`src/body/ppu.py`)
- **Display Mode**: Near-Game Boy 60Hz dithered rendering
- **Target**: 60Hz update rate, retro aesthetics
- **Technology**: Tkinter + dithering engine
- **Use Cases**: Games, retro displays, embedded deployment

#### 3. SimplePPU Integration

**SimplePPU** (`src/body/simple_ppu.py`)
- **Purpose**: Direct-Line rendering protocol for Miyoo Mini
- **Key Features**:
  - Zero circular dependencies
  - 160x144 logical grid with scaling
  - Newtonian screen wrap with ghosting
  - WASD input handling
  - Energy-based color coding

#### 4. Legacy Graphics Engine

**GraphicsEngine** (`src/dgt_core/engines/body/graphics_engine.py`)
- **Purpose**: 160x144 PPU rendering with Game Boy parity
- **Key Features**:
  - Layer composition (Background, Terrain, Entities, Effects, UI, Subtitles)
  - Viewport management
  - Tile banks for different environments
  - Async rendering pipeline
  - PIL integration for scaling

#### 5. Legacy Adapter

**LegacyGraphicsEngineAdapter** (`src/dgt_core/view/graphics/legacy_adapter.py`)
- **Purpose**: Bridge between universal packets and legacy GraphicsEngine
- **Key Features**:
  - Packet-to-frame conversion
  - Backward compatibility
  - Performance monitoring

### Data Flow Architecture

#### Universal Render Packet (URP)

```python
@dataclass
class RenderPacket:
    mode: DisplayMode
    layers: List[RenderLayer]
    hud: HUDData
    timestamp: float
    metadata: Dict[str, Any]
```

#### Render Layer Specification

```python
@dataclass
class RenderLayer:
    depth: int
    type: str  # "baked", "dynamic", "effect"
    id: str
    x: Optional[int]
    y: Optional[int]
    effect: Optional[str]
    metadata: Dict[str, Any]
```

### Display Mode Characteristics

| Mode | Resolution | FPS | Technology | Use Case |
|------|------------|-----|------------|----------|
| TERMINAL | Variable | 10 | Rich | CLI monitoring |
| COCKPIT | Scalable | 30 | Tkinter | Dashboards |
| PPU | 160x144 | 60 | Tkinter | Games/retro |

### Integration Points

#### 1. SimplePPU Integration
- **Entry Point**: `RenderDTO` from survival game
- **Conversion**: DTO → RenderPacket via dispatcher
- **Rendering**: Direct-Line protocol with zero circular dependencies

#### 2. Legacy Engine Integration
- **Entry Point**: Universal packets from TriModalEngine
- **Conversion**: Packet → RenderFrame via adapter
- **Rendering**: Async pipeline with layer composition

#### 3. Miyoo Mini Deployment
- **Target**: 1x scale (160x144 native)
- **Optimization**: 30 FPS for battery life
- **Display**: SimplePPU with Direct-Line protocol

### Performance Specifications

#### Rendering Targets
- **Terminal**: 10Hz (100ms intervals)
- **Cockpit**: 30Hz (33ms intervals)
- **PPU**: 60Hz (16ms intervals)

#### Memory Management
- **Packet History**: 100 packets max
- **Frame Buffers**: 160x144x3 numpy arrays
- **Sprite Caching**: Reference management for Tkinter

#### CPU Optimization
- **Rate Limiting**: Per-mode update intervals
- **Lazy Loading**: Component initialization on demand
- **Async Pipeline**: Non-blocking rendering where possible

### Configuration Management

#### Engine Configuration
```python
@dataclass
class EngineConfig:
    default_mode: Optional[DisplayMode] = DisplayMode.TERMINAL
    enable_legacy: bool = True
    auto_register_bodies: bool = True
    performance_tracking: bool = True
    universal_packet_enforcement: bool = True
```

#### Body-Specific Configuration
- **Terminal**: Console width, update interval
- **Cockpit**: Grid dimensions, meter configurations
- **PPU**: Display scale, dithering patterns

### Migration Strategy

#### Phase 1: Unification
- Consolidate duplicate components
- Standardize packet format
- Implement universal adapter

#### Phase 2: Optimization
- Performance tuning per mode
- Memory usage optimization
- Async pipeline completion

#### Phase 3: Production
- CI/CD integration
- Deployment automation
- Monitoring and observability

### Testing Strategy

#### Unit Tests
- Component isolation testing
- Packet validation
- Mode switching verification

#### Integration Tests
- End-to-end rendering pipelines
- Legacy adapter compatibility
- Performance benchmarking

#### System Tests
- Multi-mode operation
- Resource exhaustion handling
- Deployment scenario validation

### Deployment Scenarios

#### Development
- Default: Terminal mode for fast iteration
- Debug: Cockpit mode for instrument monitoring
- Testing: PPU mode for game validation

#### Production
- Embedded: PPU mode (Miyoo Mini)
- Server: Terminal mode (headless)
- Management: Cockpit mode (dashboards)

### Future Enhancements

#### Additional Display Modes
- Web: Browser-based rendering
- Mobile: Touch-optimized interfaces
- VR: Immersive visualization

#### Advanced Features
- Shader support for PPU mode
- Real-time collaboration for cockpit
- AI-assisted terminal commands

---

**Specification Version**: 1.0
**Last Updated**: 2026-02-08
**Next Review**: 2026-03-01
