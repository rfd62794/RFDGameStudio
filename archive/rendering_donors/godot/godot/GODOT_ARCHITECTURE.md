# rpgCore Godot Integration - Generalized Architecture

## Overview

The Godot/C# layer is designed as a **generalized, type-agnostic renderer and input handler** for the Python game engine. It supports multiple game types (Space, RPG, Tycoon) through pluggable rendering strategies and configurable message handling.

**Key Design Principle**: Python owns game logic; Godot owns visuals.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    GODOT APPLICATION                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Main.cs (Scene Orchestrator)                      │  │
│  │ - Coordinates server, renderer, input             │  │
│  │ - Lifecycle management                            │  │
│  └─────────────────────┬───────────────────────────┘  │
│                        ↕                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │ GameServer.cs (IPC Layer)                         │  │
│  │ - TCP socket communication                        │  │
│  │ - Message routing (frame updates, game state)     │  │
│  │ - Input command queuing                           │  │
│  └─────────────────────┬───────────────────────────┘  │
│                        ↕                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │ GameEntityRenderer.cs (Rendering Layer)           │  │
│  │ - Canvas2D drawing                                │  │
│  │ - Entity type → renderer strategy mapping         │  │
│  │ - HUD rendering                                   │  │
│  │                                                   │  │
│  │ Renderers:                                        │  │
│  │ - SpaceEntityRenderer (circles)                   │  │
│  │ - ShipRenderer (rotated triangles)                │  │
│  │ - AsteroidRenderer (textured circles)             │  │
│  │ - ProjectileRenderer (trails)                     │  │
│  │ (Extensible for RPG, Tycoon renderers)           │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
        ↕ JSON/TCP IPC (Port 9001)

┌─────────────────────────────────────────────────────────┐
│              PYTHON GAME ENGINE (Logic)                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │ EntityManager + Physics + AI Systems              │  │
│  │ - Game logic owner                                │  │
│  │ - Physics calculations                            │  │
│  │ - AI/NEAT control                                 │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Component Overview

### 1. Main.cs (Scene Orchestrator)

**Responsibility**: Coordinate scene lifecycle and high-level orchestration.

**Key Methods**:
- `_Ready()`: Initialize renderer and server
- `_Process()`: Poll server for messages, handle input
- `HandleFrameUpdate()`: Receive entity state from Python
- `HandleInput()`: Capture player input, send to Python

**Game Type Configuration**:
```csharp
private string _gameType = "space"; // Can be "space", "rpg", "tycoon"
```

**Input Mapping**:
```
ui_up       → Thrust
ui_left     → Rotate Left
ui_right    → Rotate Right
ui_select   → Fire
ui_cancel   → Pause/Resume
ui_focus_next → Quit
```

---

### 2. GameServer.cs (IPC Communication Layer)

**Responsibility**: Handle TCP socket communication with Python engine.

**Key Features**:
- Background thread for accepting connections
- Receive loop: Parse incoming JSON messages
- Send loop: Queue outgoing messages
- Message routing: Dispatch to appropriate handlers

**Message Types**:
```
frame_update    → Entity positions, particles, HUD (from Python)
game_state      → State changes (paused, game_over, etc)
handshake       → Initial connection verification
ack             → Acknowledgment
input_command   → Player input (to Python)
```

**Thread Safety**:
- `_sendQueue`: Thread-safe queue for outgoing messages
- `_receiveQueue`: Thread-safe queue for incoming messages
- Locks: `_sendLock`, `_receiveLock`

**Events**:
```csharp
public event Action<FrameUpdateMessage>? OnFrameUpdate;
public event Action<GameStateDTO>? OnGameStateChange;
public event Action<bool>? OnConnectionStateChanged;
```

---

### 3. GameEntityRenderer.cs (Rendering Layer)

**Responsibility**: Render entities to Godot Canvas2D with game-type-specific strategies.

**Renderer Strategy Pattern**:
```csharp
Dictionary<string, EntityRenderer> _entityRenderers = new()
{
    ["space_entity"] = new SpaceEntityRenderer(),
    ["ship"] = new ShipRenderer(),
    ["asteroid"] = new AsteroidRenderer(),
    ["projectile"] = new ProjectileRenderer(),
    // Add more as needed: ["character"] = new CharacterRenderer()
};
```

**Rendering Flow**:
```
RenderFrame()
  ├─ RenderEntity() for each entity
  │   └─ Route to strategy based on entity.Type
  ├─ RenderParticles() for each particle emitter
  └─ RenderHUD() for score, lives, wave
```

**Color Palette** (Space game):
```
1 = Phosphor Green   (Ships)
2 = Yellow           (Asteroids)
3 = Magenta          (Projectiles)
4 = Cyan
5 = Red
```

**Extensibility**: Add new entity types by creating subclass of `EntityRenderer`:
```csharp
public class CharacterRenderer : EntityRenderer
{
    public override void Render(CanvasItem canvas, EntityDTO entity, Vector2 worldScale)
    {
        // Custom rendering logic for RPG characters
    }
}

// Register in SetupRenderStrategies()
_entityRenderers["character"] = new CharacterRenderer();
```

---

## Message Protocol

### Frame Update Message (Python → Godot)
```json
{
  "type": "frame_update",
  "timestamp": 0.5,
  "frame_number": 30,
  "entities": [
    {
      "id": "ship_0",
      "type": "ship",
      "x": 80.0,
      "y": 72.0,
      "vx": 2.5,
      "vy": -1.2,
      "angle": 1.57,
      "radius": 5.0,
      "color": 1,
      "active": true
    }
  ],
  "particles": [
    {
      "emitter_id": "fx_1",
      "particle_type": "explosion",
      "x": 100.0,
      "y": 200.0,
      "intensity": 0.8
    }
  ],
  "hud": {
    "score": "1000",
    "lives": "3",
    "wave": "2",
    "status": "WAVE 2"
  }
}
```

### Input Command Message (Godot → Python)
```json
{
  "type": "input_command",
  "command_type": "thrust",
  "timestamp": 0.5,
  "duration": 0.016,
  "intensity": 0.8
}
```

### Game State Message (Python → Godot)
```json
{
  "type": "game_state",
  "state": "paused",
  "score": 1500,
  "lives": 2,
  "wave": 3
}
```

---

## Data Flow

### Rendering Pipeline
```
Python EntityManager
  ↓
Serialize to JSON (entities, particles, HUD)
  ↓
Send via TCP socket
  ↓
GameServer receives
  ↓
FrameUpdateMessage created
  ↓
OnFrameUpdate event triggered
  ↓
Main.HandleFrameUpdate() called
  ↓
GameEntityRenderer.RenderFrame() called
  ↓
Entity type → renderer strategy lookup
  ↓
Custom renderer draws entity
  ↓
Canvas.QueueRedraw()
  ↓
_Draw() called, entities appear on screen
```

### Input Pipeline
```
Player presses key (e.g., arrow up)
  ↓
Main._Process() detects via Input.IsActionPressed()
  ↓
InputCommandDTO created (command_type="thrust", intensity=1.0)
  ↓
GameServer.SendInputCommand()
  ↓
Message queued to _sendQueue
  ↓
SendLoop picks up message
  ↓
JSON serialized and sent via TCP socket
  ↓
Python AsteroidsSDK receives
  ↓
InputHandler processes command
  ↓
Game logic updates entity state
```

---

## Configuration Points

### Game Type
```csharp
private string _gameType = "space";
// Options: "space", "rpg", "tycoon"
```

### Server Connection
```csharp
private string _pythonHost = "localhost";
private int _pythonPort = 9001;
```

### Viewport/Scaling
```csharp
_gameRenderer.SetViewport(160, 144);     // Game world bounds
_gameRenderer.SetWorldScale(4, 4);       // 4x upscaling
```

---

## Extension Points

### Adding New Entity Type

1. Create renderer subclass:
```csharp
public class NewEntityRenderer : EntityRenderer
{
    public override void Render(CanvasItem canvas, EntityDTO entity, Vector2 worldScale)
    {
        var screenPos = WorldToScreen(entity.X, entity.Y, worldScale);
        // Custom rendering logic
    }
}
```

2. Register in `SetupRenderStrategies()`:
```csharp
_entityRenderers["new_entity_type"] = new NewEntityRenderer();
```

3. Send entity from Python with matching type:
```python
entity = {
    "id": "entity_1",
    "type": "new_entity_type",  # Must match registered key
    "x": 100.0,
    "y": 200.0,
    ...
}
```

### Adding New Game Type

1. Update configuration in `Main.cs`:
```csharp
private string _gameType = "rpg";
```

2. Register game-type-specific renderers:
```csharp
if (_gameType == "rpg")
{
    _entityRenderers["character"] = new CharacterRenderer();
    _entityRenderers["npc"] = new NPCRenderer();
    _entityRenderers["loot"] = new LootRenderer();
}
```

3. Configure color palette and rendering styles

---

## Testing & Debugging

### Console Output
All major events logged to Godot console:
- Server startup/shutdown
- Connection state changes
- Message processing errors
- Frame updates

### Performance
- Frame rate: 60 FPS target
- Network: 9001 default port (configurable)
- Message queue sizes monitored in real-time

### Debugging Features
- Entity IDs drawn on screen
- HUD status messages
- Connection state indicator
- Color-coded output (errors in red, info in white)

---

## File Structure
```
src/game_engine/godot/
├── project.godot           # Godot project configuration
├── rpgCore.Godot.csproj    # C# project file
├── GODOT_ARCHITECTURE.md   # This file
│
├── scenes/
│   ├── Main.tscn           # Main game scene
│   └── Main.cs             # Scene orchestrator
│
├── Server/
│   └── GameServer.cs       # IPC layer (TCP socket)
│
├── Rendering/
│   ├── GoddotRenderer.cs   # Original Asteroids-specific renderer
│   └── GameEntityRenderer.cs  # Generalized renderer
│
├── Models/
│   └── DTOs.cs             # Data transfer objects
│
├── Interfaces/
│   ├── IRenderer.cs
│   ├── IGameStateProvider.cs
│   └── IInputHandler.cs
│
└── Utils/
    └── Result.cs           # Error handling utility
```

---

## Summary

The Godot integration is designed as a **thin, flexible rendering and input layer** that:

1. ✅ **Decouples rendering from logic** (Python owns logic)
2. ✅ **Supports multiple game types** (extensible renderer strategies)
3. ✅ **Handles IPC cleanly** (JSON messages, background threads)
4. ✅ **Maintains SOLID principles** (single responsibility, open/closed)
5. ✅ **Scales to complex games** (particle effects, HUD, entity types)

The architecture is production-ready for any game type that can serialize state to JSON.
