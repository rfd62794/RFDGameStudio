# Asteroids Demo - C# Rendering Port (SOLID-Compliant)

**Document Status**: PLANNING - Ready for Implementation
**Version**: 1.0
**Date**: 2026-02-14
**Objective**: Port Asteroids demo to C# rendering system as POC before Phase E/4a decision

---

## Executive Summary

This document outlines a strategic plan to port the Asteroids demo to a C# rendering system while maintaining the Python game logic core. This serves as a **proof-of-concept** that validates:

1. ✅ Python core can run independently (no rendering dependency)
2. ✅ C# can consume Python game state via JSON
3. ✅ SOLID principles enable clean architecture
4. ✅ Multiple rendering backends work seamlessly

**Estimated Effort**: 2-3 weeks
**Team Size**: 1 developer
**Success Metric**: Playable Asteroids game running on C# renderer with identical mechanics

---

## Part 1: Architecture Design (SOLID Principles)

### 1.1 SOLID Principles Applied

#### Single Responsibility Principle (SRP)

Each class has ONE reason to change:

```
✓ GameFacade         → Orchestrates game flow only
✓ PhysicsSimulator   → Updates physics only
✓ CollisionDetector  → Detects collisions only
✓ EntityRenderer     → Renders entities only
✓ InputHandler       → Processes input only
✓ GameStateSerializer → Serializes state only
✓ IRenderer          → Abstracts rendering backend
```

#### Open/Closed Principle (OCP)

Systems are open for extension, closed for modification:

```
✓ IRenderer interface → Can add GoddotRenderer, CanvasRenderer, ConsoleRenderer
✓ EntityDTO base → Can extend for specific entity types
✓ RenderCommand base → Can add new command types (polygon, text, etc.)
✓ GameStateProvider interface → Can implement Python, MockData, etc.
```

#### Liskov Substitution Principle (LSP)

All implementations are interchangeable:

```
✓ IRenderer implementations → GoddotRenderer, PixelRenderer, CanvasRenderer all work identically
✓ IGameStateProvider implementations → PythonProvider, MockProvider, RecordedProvider
✓ IInputHandler implementations → GoddotInputHandler, ConsoleInputHandler, NetworkInputHandler
✓ IPhysicsEngine implementations → PythonPhysicsEngine, CSharpPhysicsEngine (future)
```

#### Interface Segregation Principle (ISP)

Clients depend only on what they use:

```
✓ IRenderer → Only has Render(frameData) and Clear()
✓ IGameStateProvider → Only has GetGameState() and UpdateState(input)
✓ IInputHandler → Only has GetPendingInputs() and ClearQueue()
✓ IPhysicsEngine → Only has UpdatePhysics(dt) and GetEntities()
```

No fat interfaces forcing unused methods on clients.

#### Dependency Inversion Principle (DIP)

High-level modules don't depend on low-level modules:

```
✓ AsteroidsGame depends on IRenderer, not GoddotRenderer
✓ AsteroidsGame depends on IGameStateProvider, not PythonAsteroidsProvider
✓ AsteroidsGame depends on IInputHandler, not GoddotInputHandler
```

All dependencies injected via constructor.

### 1.2 Layered Architecture

```
┌─────────────────────────────────────────────────────┐
│ LAYER 4: Application (Godot Main Scene)             │
│ ├─ AsteroidsGame.cs (MonoBehaviour)                 │
│ ├─ Input capture + forwarding                       │
│ └─ Frame rendering loop                             │
└─────────────────────────────────────────────────────┘
          ↓ (IRenderer, IInputHandler)
┌─────────────────────────────────────────────────────┐
│ LAYER 3: Presentation/Rendering (Rendering System)  │
│ ├─ IRenderer interface                              │
│ ├─ GoddotRenderer implementation (Godot Canvas2D)   │
│ ├─ EntityRenderer (transforms DTO to visuals)       │
│ ├─ RenderCommand hierarchy                          │
│ └─ HUDRenderer                                       │
└─────────────────────────────────────────────────────┘
          ↓ (IGameStateProvider)
┌─────────────────────────────────────────────────────┐
│ LAYER 2: Game Logic Bridge (Data Transfer)          │
│ ├─ IGameStateProvider interface                     │
│ ├─ PythonAsteroidsProvider (JSON-based IPC)         │
│ ├─ EntityDTO, GameStateDTO                          │
│ ├─ GameStateSerializer/Deserializer                 │
│ └─ InputCommandDTO                                  │
└─────────────────────────────────────────────────────┘
          ↓ (JSON over IPC)
┌─────────────────────────────────────────────────────┐
│ LAYER 1: Core Game Logic (Python - UNCHANGED)      │
│ ├─ asteroids_clone_sdk.py (main loop)               │
│ ├─ SpaceEntity physics                              │
│ ├─ CollisionSystem                                  │
│ ├─ WaveSpawner                                      │
│ ├─ ProjectileSystem                                 │
│ └─ GameState tracking                               │
└─────────────────────────────────────────────────────┘
```

### 1.3 Dependency Injection Pattern

```csharp
// Composition Root (Main.cs or Startup.cs)
public static class ServiceContainer {
    public static AsteroidsGame Create() {
        var renderer = new GoddotRenderer();
        var inputHandler = new GoddotInputHandler();
        var gameStateProvider = new PythonAsteroidsProvider(pythonSocket);
        var physicsSimulator = new PythonPhysicsSimulator(gameStateProvider);

        return new AsteroidsGame(
            renderer,
            gameStateProvider,
            inputHandler,
            physicsSimulator
        );
    }
}

// Usage
AsteroidsGame game = ServiceContainer.Create();
game.Initialize();
game.Run();
```

---

## Part 2: C# Architecture Design

### 2.1 Core Interfaces (Abstraction Layer)

```csharp
// File: src/game_engine/godot/Interfaces/IRenderer.cs
namespace DgtEngine.Godot.Rendering {
    public interface IRenderer {
        void Clear(Color backgroundColor);
        void RenderFrame(FrameDataDTO frameData);
        void Present();
        Vector2 GetScreenDimensions();
    }
}

// File: src/game_engine/godot/Interfaces/IGameStateProvider.cs
namespace DgtEngine.Godot.GameLogic {
    public interface IGameStateProvider {
        GameStateDTO GetCurrentState();
        Result<GameStateDTO> UpdateState(InputCommandDTO input);
        Result<bool> Initialize();
        Result<bool> Shutdown();
    }
}

// File: src/game_engine/godot/Interfaces/IInputHandler.cs
namespace DgtEngine.Godot.Input {
    public interface IInputHandler {
        Queue<InputCommandDTO> GetPendingInputs();
        void ClearInputQueue();
    }
}

// File: src/game_engine/godot/Interfaces/IPhysicsEngine.cs
namespace DgtEngine.Godot.Physics {
    public interface IPhysicsEngine {
        void UpdatePhysics(float deltaTime);
        List<EntityDTO> GetActiveEntities();
        Result<CollisionDTO> GetCollisions();
    }
}
```

### 2.2 Data Transfer Objects (DTOs)

```csharp
// File: src/game_engine/godot/Models/EntityDTO.cs
namespace DgtEngine.Godot.Models {
    [Serializable]
    public class EntityDTO {
        public string Id { get; set; }
        public string Type { get; set; }  // "ship", "asteroid", "bullet"
        public Vector2 Position { get; set; }
        public Vector2 Velocity { get; set; }
        public float Heading { get; set; }  // Radians
        public float Radius { get; set; }
        public int Color { get; set; }
        public float[] Vertices { get; set; }  // Ship only
        public bool Active { get; set; }
        public float Age { get; set; }
        public float Lifetime { get; set; }  // Bullets only
    }
}

// File: src/game_engine/godot/Models/GameStateDTO.cs
namespace DgtEngine.Godot.Models {
    [Serializable]
    public class GameStateDTO {
        public float GameTime { get; set; }
        public EntityDTO[] Entities { get; set; }
        public int Score { get; set; }
        public int Lives { get; set; }
        public int Wave { get; set; }
        public bool GameOver { get; set; }
        public int AsteroidsRemaining { get; set; }
        public HUDStateDTO Hud { get; set; }
    }

    [Serializable]
    public class HUDStateDTO {
        public int Score { get; set; }
        public int Lives { get; set; }
        public int Wave { get; set; }
        public int AsteroidsRemaining { get; set; }
    }
}

// File: src/game_engine/godot/Models/InputCommandDTO.cs
namespace DgtEngine.Godot.Models {
    [Serializable]
    public class InputCommandDTO {
        public string Action { get; set; }  // "thrust", "rotate", "fire", "menu"
        public float Value { get; set; }    // -1.0 to 1.0
        public float Timestamp { get; set; }
    }
}

// File: src/game_engine/godot/Models/FrameDataDTO.cs
namespace DgtEngine.Godot.Models {
    [Serializable]
    public class FrameDataDTO {
        public int Width { get; set; }      // 160
        public int Height { get; set; }     // 144
        public EntityDTO[] Entities { get; set; }
        public HUDStateDTO Hud { get; set; }
        public float Timestamp { get; set; }
        public RenderCommand[] Commands { get; set; }
    }
}

// File: src/game_engine/godot/Models/RenderCommand.cs
namespace DgtEngine.Godot.Models {
    [Serializable]
    public abstract class RenderCommand {
        public string Type { get; set; }  // "circle", "polygon", "text"
    }

    [Serializable]
    public class CircleCommand : RenderCommand {
        public Vector2 Position { get; set; }
        public float Radius { get; set; }
        public Color Color { get; set; }
        public bool Fill { get; set; }
        public float StrokeWidth { get; set; }
    }

    [Serializable]
    public class PolygonCommand : RenderCommand {
        public Vector2[] Vertices { get; set; }
        public Color FillColor { get; set; }
        public Color StrokeColor { get; set; }
        public float StrokeWidth { get; set; }
    }

    [Serializable]
    public class TextCommand : RenderCommand {
        public Vector2 Position { get; set; }
        public string Text { get; set; }
        public Color Color { get; set; }
        public int FontSize { get; set; }
    }
}
```

### 2.3 Renderer Implementation (Godot-Specific)

```csharp
// File: src/game_engine/godot/Rendering/GoddotRenderer.cs
namespace DgtEngine.Godot.Rendering {
    public class GoddotRenderer : IRenderer {
        private CanvasItem canvas;
        private Vector2 screenDimensions;
        private float scale = 4.0f;  // Scale from 160x144 to 640x576

        public GoddotRenderer(CanvasItem canvasItem) {
            canvas = canvasItem;
            screenDimensions = new Vector2(160, 144);
        }

        public void Clear(Color backgroundColor) {
            canvas.GetTree().Root.Modulate = backgroundColor;
        }

        public void RenderFrame(FrameDataDTO frameData) {
            // Draw all entities
            foreach (var entity in frameData.Entities) {
                RenderEntity(entity);
            }

            // Draw HUD
            RenderHUD(frameData.Hud);
        }

        private void RenderEntity(EntityDTO entity) {
            switch (entity.Type) {
                case "ship":
                    DrawShip(entity);
                    break;
                case "asteroid":
                case "large_asteroid":
                case "medium_asteroid":
                case "small_asteroid":
                    DrawAsteroid(entity);
                    break;
                case "bullet":
                    DrawBullet(entity);
                    break;
            }
        }

        private void DrawAsteroid(EntityDTO asteroid) {
            var pos = asteroid.Position * scale;
            var radius = asteroid.Radius * scale;

            // Filled circle with outline
            canvas.DrawCircle(pos, radius, AsteroidsColorPalette.GetColor(asteroid.Color));
            canvas.DrawCircle(pos, radius, Colors.White, false, 1.0f);
        }

        private void DrawShip(EntityDTO ship) {
            var pos = ship.Position * scale;
            var heading = ship.Heading;

            // Transform vertices by heading and scale
            var scaledVertices = new Vector2[3];
            for (int i = 0; i < 3; i++) {
                var v = new Vector2(ship.Vertices[i * 2], ship.Vertices[i * 2 + 1]);
                v = v.Rotated(heading) * scale;
                scaledVertices[i] = pos + v;
            }

            canvas.DrawPolygon(scaledVertices, new Color[] { Colors.Green });
            canvas.DrawPolygon(scaledVertices, new Color[] { Colors.White }, null, Colors.White, 1.0f);
        }

        private void DrawBullet(EntityDTO bullet) {
            var pos = bullet.Position * scale;
            var radius = 2.0f;
            canvas.DrawCircle(pos, radius, Colors.White);
        }

        private void RenderHUD(HUDStateDTO hud) {
            var font = ThemeDB.FallbackFont;
            var color = new Color(0, 1, 0);  // Green
            var pos = new Vector2(10, 10);

            canvas.DrawString(font, pos, $"SCORE: {hud.Score}", HorizontalAlignment.Left, -1, 12, color);
            canvas.DrawString(font, pos + new Vector2(0, 20), $"LIVES: {hud.Lives}", HorizontalAlignment.Left, -1, 12, color);
            canvas.DrawString(font, pos + new Vector2(0, 40), $"WAVE: {hud.Wave}", HorizontalAlignment.Left, -1, 12, color);
        }

        public void Present() {
            canvas.QueueRedraw();
        }

        public Vector2 GetScreenDimensions() {
            return screenDimensions;
        }
    }
}
```

### 2.4 Game State Provider (Python Bridge)

```csharp
// File: src/game_engine/godot/GameLogic/PythonAsteroidsProvider.cs
namespace DgtEngine.Godot.GameLogic {
    public class PythonAsteroidsProvider : IGameStateProvider {
        private Socket socket;
        private string pythonEndpoint = "127.0.0.1:5555";
        private GameStateDTO currentState;

        public PythonAsteroidsProvider(string endpoint = null) {
            if (endpoint != null) pythonEndpoint = endpoint;
        }

        public Result<bool> Initialize() {
            try {
                socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
                socket.Connect(pythonEndpoint);

                // Send initialization command
                SendCommand(new InputCommandDTO { Action = "init" });

                // Receive initial state
                currentState = ReceiveGameState();

                return Result<bool>.Success(true);
            } catch (Exception ex) {
                return Result<bool>.Failure(ex.Message);
            }
        }

        public GameStateDTO GetCurrentState() {
            return currentState;
        }

        public Result<GameStateDTO> UpdateState(InputCommandDTO input) {
            try {
                SendCommand(input);
                currentState = ReceiveGameState();
                return Result<GameStateDTO>.Success(currentState);
            } catch (Exception ex) {
                return Result<GameStateDTO>.Failure(ex.Message);
            }
        }

        private void SendCommand(InputCommandDTO cmd) {
            var json = JsonConvert.SerializeObject(cmd);
            var data = Encoding.UTF8.GetBytes(json);
            socket.Send(data);
        }

        private GameStateDTO ReceiveGameState() {
            var buffer = new byte[65536];
            var bytesReceived = socket.Receive(buffer);
            var json = Encoding.UTF8.GetString(buffer, 0, bytesReceived);
            return JsonConvert.DeserializeObject<GameStateDTO>(json);
        }

        public Result<bool> Shutdown() {
            try {
                socket?.Close();
                socket?.Dispose();
                return Result<bool>.Success(true);
            } catch (Exception ex) {
                return Result<bool>.Failure(ex.Message);
            }
        }
    }
}
```

### 2.5 Input Handler (Godot-Specific)

```csharp
// File: src/game_engine/godot/Input/GoddotInputHandler.cs
namespace DgtEngine.Godot.Input {
    public class GoddotInputHandler : Node, IInputHandler {
        private Queue<InputCommandDTO> inputQueue = new Queue<InputCommandDTO>();

        public override void _Ready() {
            // Subscribe to input events
        }

        public override void _Input(InputEvent @event) {
            if (@event is InputEventKey keyEvent && keyEvent.Pressed) {
                switch (keyEvent.Keycode) {
                    case Key.W:
                    case Key.Up:
                        inputQueue.Enqueue(new InputCommandDTO {
                            Action = "thrust",
                            Value = 1.0f,
                            Timestamp = (float)GetTree().GetPhysicsFrameCount() / 60.0f
                        });
                        break;
                    case Key.A:
                    case Key.Left:
                        inputQueue.Enqueue(new InputCommandDTO {
                            Action = "rotate",
                            Value = -1.0f,
                            Timestamp = (float)GetTree().GetPhysicsFrameCount() / 60.0f
                        });
                        break;
                    case Key.D:
                    case Key.Right:
                        inputQueue.Enqueue(new InputCommandDTO {
                            Action = "rotate",
                            Value = 1.0f,
                            Timestamp = (float)GetTree().GetPhysicsFrameCount() / 60.0f
                        });
                        break;
                    case Key.Space:
                        inputQueue.Enqueue(new InputCommandDTO {
                            Action = "fire",
                            Value = 1.0f,
                            Timestamp = (float)GetTree().GetPhysicsFrameCount() / 60.0f
                        });
                        break;
                }
            }
            GetTree().Root.SetInputAsHandled();
        }

        public Queue<InputCommandDTO> GetPendingInputs() {
            return inputQueue;
        }

        public void ClearInputQueue() {
            inputQueue.Clear();
        }
    }
}
```

### 2.6 Main Game Orchestrator (SOLID-compliant)

```csharp
// File: src/game_engine/godot/AsteroidsGame.cs
namespace DgtEngine.Godot {
    public class AsteroidsGame {
        private readonly IRenderer renderer;
        private readonly IGameStateProvider gameStateProvider;
        private readonly IInputHandler inputHandler;
        private GameStateDTO currentState;
        private bool running = false;

        // Dependency injection via constructor
        public AsteroidsGame(
            IRenderer renderer,
            IGameStateProvider gameStateProvider,
            IInputHandler inputHandler) {
            this.renderer = renderer ?? throw new ArgumentNullException(nameof(renderer));
            this.gameStateProvider = gameStateProvider ?? throw new ArgumentNullException(nameof(gameStateProvider));
            this.inputHandler = inputHandler ?? throw new ArgumentNullException(nameof(inputHandler));
        }

        public Result<bool> Initialize() {
            var initResult = gameStateProvider.Initialize();
            if (!initResult.IsSuccess) return Result<bool>.Failure(initResult.Error);

            currentState = gameStateProvider.GetCurrentState();
            running = true;

            return Result<bool>.Success(true);
        }

        public void Update(float deltaTime) {
            if (!running) return;

            // Process input
            var inputs = inputHandler.GetPendingInputs();
            while (inputs.Count > 0) {
                var input = inputs.Dequeue();
                var updateResult = gameStateProvider.UpdateState(input);

                if (updateResult.IsSuccess) {
                    currentState = updateResult.Value;
                } else {
                    GD.PrintErr($"Failed to update game state: {updateResult.Error}");
                }
            }

            // Render current state
            var frameData = new FrameDataDTO {
                Width = 160,
                Height = 144,
                Entities = currentState.Entities,
                Hud = currentState.Hud,
                Timestamp = (float)Time.GetTicksMsec() / 1000.0f
            };

            renderer.Clear(new Color(0, 0, 0));  // Black background
            renderer.RenderFrame(frameData);
            renderer.Present();

            // Check game over
            if (currentState.GameOver) {
                Stop();
            }
        }

        public void Stop() {
            running = false;
        }

        public bool IsRunning => running;
    }
}
```

---

## Part 3: Python-Side Modifications

### 3.1 Add JSON Serialization to Asteroids Demo

**File**: `src/apps/space/asteroids_clone_sdk.py` (Minor modifications)

```python
# Add at top of file
import json
from dataclasses import asdict

# Add method to export game state as JSON
def get_game_state_json(self) -> str:
    """Export current game state as JSON for C# consumption"""
    state_dict = {
        "game_time": self.time_elapsed,
        "entities": [
            {
                "id": asteroid.id,
                "type": "large_asteroid",  # or based on asteroid.size
                "position": [asteroid.position.x, asteroid.position.y],
                "velocity": [asteroid.velocity.x, asteroid.velocity.y],
                "heading": 0.0,
                "radius": asteroid.radius,
                "color": 2,  # Gray
                "vertices": [],
                "active": asteroid.active,
                "age": asteroid.age,
                "lifetime": -1
            }
            for asteroid in self.wave_spawner.get_active_asteroids()
        ] + [
            {
                "id": "player",
                "type": "ship",
                "position": [player_pos[0], player_pos[1]],
                "velocity": [self.kinetic_body.state.velocity.x, self.kinetic_body.state.velocity.y],
                "heading": self.kinetic_body.state.angle,
                "radius": 4.0,
                "color": 1,  # Green
                "vertices": [6, 0, -3, 3, -3, -3],  # Triangle vertices
                "active": self.player_alive,
                "age": self.time_elapsed,
                "lifetime": -1
            }
        ] + [
            {
                "id": f"bullet_{i}",
                "type": "bullet",
                "position": [proj_pos[0], proj_pos[1]],
                "velocity": [0, 0],
                "heading": 0.0,
                "radius": 1.0,
                "color": 3,  # White
                "vertices": [],
                "active": True,
                "age": 0.0,
                "lifetime": 1.0
            }
            for i, proj_pos in enumerate(self.projectile_system.get_active_positions())
        ],
        "score": self.game_state.score,
        "lives": self.game_state.lives,
        "wave": self.game_state.wave,
        "game_over": self.game_state.game_over,
        "asteroids_remaining": len(list(self.wave_spawner.get_active_asteroids())),
        "hud": {
            "score": self.game_state.score,
            "lives": self.game_state.lives,
            "wave": self.game_state.wave,
            "asteroids_remaining": len(list(self.wave_spawner.get_active_asteroids()))
        }
    }
    return json.dumps(state_dict)

# Add socket server to handle C# requests
def run_asteroids_with_c_bridge(port=5555):
    """Run Asteroids with C# bridge"""
    import socket

    game = AsteroidsCloneSDK()
    game.initialize()

    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind(('127.0.0.1', port))
    server.listen(1)

    client, addr = server.accept()
    print(f"C# client connected from {addr}")

    while game.running:
        # Receive input command from C#
        data = client.recv(1024).decode('utf-8')
        input_cmd = json.loads(data)

        # Process input
        if input_cmd['action'] == 'thrust':
            game.kinetic_body.apply_thrust(input_cmd['value'])
        elif input_cmd['action'] == 'rotate':
            game.kinetic_body.apply_rotation(input_cmd['value'])
        elif input_cmd['action'] == 'fire':
            game.player_fire()

        # Update game
        game.update(1/60.0)

        # Send state to C#
        state_json = game.get_game_state_json()
        client.send(state_json.encode('utf-8'))
```

---

## Part 4: Implementation Roadmap

### Phase 1: Foundation (Days 1-2)

**Goals**: Setup, DTOs, interfaces

- [ ] Create Godot C# project structure
  - Namespace: `DgtEngine.Godot`
  - Folders: `Interfaces/`, `Models/`, `Rendering/`, `GameLogic/`, `Input/`

- [ ] Implement all DTOs
  - EntityDTO, GameStateDTO, HUDStateDTO
  - InputCommandDTO, FrameDataDTO
  - RenderCommand hierarchy

- [ ] Define interfaces
  - IRenderer, IGameStateProvider, IInputHandler, IPhysicsEngine
  - Factory interfaces if needed

**Deliverables**:
- 8 interface files
- 12 DTO files
- 0 functional code (structure only)
- Tests: Basic serialization tests (5-10)

---

### Phase 2: Rendering (Days 3-4)

**Goals**: Godot renderer working

- [ ] Implement GoddotRenderer
  - Canvas2D drawing
  - Color palette mapping
  - Coordinate scaling (160x144 → 640x576)

- [ ] Implement entity rendering
  - DrawAsteroid (circles)
  - DrawShip (polygon transformation)
  - DrawBullet (small circles)

- [ ] Implement HUD rendering
  - Score, lives, wave display
  - Font rendering

**Deliverables**:
- GoddotRenderer.cs (400+ lines)
- EntityRenderer.cs (150+ lines)
- HUDRenderer.cs (100+ lines)
- Tests: Rendering unit tests (10+)

---

### Phase 3: IPC & State Management (Days 5-6)

**Goals**: Python ↔ C# communication

- [ ] Implement PythonAsteroidsProvider
  - Socket communication
  - JSON serialization/deserialization
  - Error handling & reconnection

- [ ] Create service container
  - Dependency injection setup
  - Factory methods

- [ ] Add Python bridge code
  - JSON export method
  - Socket server
  - Input handling

**Deliverables**:
- PythonAsteroidsProvider.cs (250+ lines)
- ServiceContainer.cs (80+ lines)
- asteroids_clone_sdk.py modifications (150+ lines)
- Tests: Integration tests (10+)

---

### Phase 4: Input & Game Loop (Days 7-8)

**Goals**: Input handling and main game loop

- [ ] Implement GoddotInputHandler
  - Keyboard input capture
  - Input queue management

- [ ] Implement AsteroidsGame orchestrator
  - Game loop (60Hz)
  - State updates
  - Frame rendering

- [ ] Godot main scene
  - Canvas2D setup
  - AsteroidsGame instantiation
  - `_Process()` callback

**Deliverables**:
- GoddotInputHandler.cs (150+ lines)
- AsteroidsGame.cs (200+ lines)
- Main.tscn + Main.cs scene script (100+ lines)
- Tests: Game loop tests (8+)

---

### Phase 5: Integration & Polish (Days 9-10)

**Goals**: Full playable demo

- [ ] End-to-end testing
  - Launch Python server
  - Launch Godot game
  - Play through complete game

- [ ] Bug fixes & optimization
  - Performance profiling
  - Memory leaks check
  - Input responsiveness

- [ ] Documentation
  - Architecture diagram
  - Usage instructions
  - Troubleshooting guide

**Deliverables**:
- Fully playable Asteroids game
- Complete documentation
- Performance metrics
- Integration test suite (20+)

---

## Part 5: Testing Strategy

### Unit Tests (Layer-by-Layer)

```csharp
// Test DTO serialization
[Test]
public void EntityDTO_Serializes_Correctly() {
    var entity = new EntityDTO {
        Id = "test",
        Type = "asteroid",
        Position = new Vector2(100, 50),
        Velocity = new Vector2(10, 5)
    };
    var json = JsonConvert.SerializeObject(entity);
    var deserialized = JsonConvert.DeserializeObject<EntityDTO>(json);

    Assert.AreEqual(entity.Id, deserialized.Id);
    Assert.AreEqual(entity.Position, deserialized.Position);
}

// Test IRenderer implementation
[Test]
public void GoddotRenderer_Renders_Without_Error() {
    var mockCanvas = Mock.Of<CanvasItem>();
    var renderer = new GoddotRenderer(mockCanvas);
    var frameData = CreateTestFrameData();

    renderer.Clear(Colors.Black);
    renderer.RenderFrame(frameData);
    renderer.Present();

    // Verify no exceptions
}

// Test IGameStateProvider
[Test]
public void PythonAsteroidsProvider_Receives_State() {
    var provider = new PythonAsteroidsProvider("127.0.0.1:5555");
    var result = provider.Initialize();

    Assert.IsTrue(result.IsSuccess);
    Assert.IsNotNull(provider.GetCurrentState());
}
```

### Integration Tests

```csharp
// Test Python ↔ C# communication
[Test]
public void AsteroidsGame_Receives_Input_Updates_State() {
    var provider = new PythonAsteroidsProvider();
    var game = new AsteroidsGame(
        Mock.Of<IRenderer>(),
        provider,
        Mock.Of<IInputHandler>()
    );

    var input = new InputCommandDTO { Action = "thrust", Value = 1.0f };
    var result = provider.UpdateState(input);

    Assert.IsTrue(result.IsSuccess);
    Assert.IsNotNull(result.Value);
}

// Test full game loop
[Test]
public void AsteroidsGame_RunsComplete_GameLoop() {
    var game = SetupFullGame();
    game.Initialize();

    for (int i = 0; i < 3600; i++) {  // 60 seconds at 60Hz
        game.Update(1.0f / 60.0f);
    }

    Assert.IsTrue(game.IsRunning || game.currentState.GameOver);
}
```

### Test Coverage Goals

| Component | Coverage | Tests |
|-----------|----------|-------|
| DTOs | 100% | 15 |
| IRenderer | 90% | 12 |
| IGameStateProvider | 85% | 10 |
| IInputHandler | 85% | 8 |
| AsteroidsGame | 80% | 15 |
| Integration | Full path | 20 |
| **Total** | | **80+** |

---

## Part 6: Success Criteria

### Functional Requirements
- ✅ Asteroids render correctly at 60 FPS
- ✅ Player ship responds to WASD input
- ✅ Projectiles fire and collide with asteroids
- ✅ Asteroids split and spawn children
- ✅ Score increases on asteroid destruction
- ✅ Lives decrease on ship collision
- ✅ Waves advance automatically
- ✅ Game ends when all lives lost

### Non-Functional Requirements
- ✅ Render latency < 16.7ms (60 FPS)
- ✅ Input latency < 100ms
- ✅ Memory usage < 200MB
- ✅ No memory leaks after 1-hour runtime
- ✅ 100% identical mechanics to original

### Code Quality Requirements
- ✅ All SOLID principles applied
- ✅ 80+ unit tests passing
- ✅ 0 Code Analysis warnings
- ✅ 100% of public APIs documented
- ✅ All dependencies injected

### Architecture Validation
- ✅ IRenderer interface swappable (can test with mock)
- ✅ IGameStateProvider swappable (can mock Python responses)
- ✅ IInputHandler swappable (can mock input)
- ✅ No tight coupling between layers
- ✅ Can run C# independently of Python (mock provider)

---

## Part 7: Post-POC Decisions

### What This POC Validates

1. **Python Independence**
   - Python core works without Godot
   - JSON export works reliably
   - State serialization is correct

2. **C# Rendering Works**
   - Godot renderer produces correct output
   - Input handling is responsive
   - Frame rate achieves 60 FPS

3. **IPC Is Viable**
   - Python ↔ C# communication stable
   - JSON protocol works at 60 FPS
   - Latency acceptable for real-time game

4. **SOLID Architecture Holds**
   - Interfaces enable testing
   - Dependencies properly injected
   - No tight coupling issues

5. **Path Forward Is Clear**

### Decision After POC

Based on POC success, choose:

**Option A: Continue with Godot/C# Graphics**
- Proceed to Phase 4a full graphics port
- Expand to full ECS in C#
- Timeline: 2-3 more weeks

**Option B: Return to Phase E (Assets/Config)**
- Use POC as proof of concept
- Proceed with Python-only Phase E
- Graphics port as future optional track
- Timeline: 2-3 weeks

**Option C: Parallel Both**
- Maintain both tracks independently
- Complete POC in 2 weeks
- Phase E + POC in parallel
- Timeline: 3-4 weeks total

### Recommendation

**Proceed with Option C (Parallel)**:
- POC validates architecture (2 weeks)
- Phase E advances independently (2-3 weeks)
- Gives maximum information for final decision
- No wasted effort; both valuable deliverables

---

## Part 8: SOLID Principles Summary

### How This Design Applies SOLID

| Principle | How It's Applied | Benefit |
|-----------|-----------------|---------|
| **SRP** | Each class has one responsibility | Easy to test, modify, reuse |
| **OCP** | Interfaces enable extensions | Can add new renderers without changing existing code |
| **LSP** | Implementations are interchangeable | Can mock for testing |
| **ISP** | Small focused interfaces | Clients don't depend on unused methods |
| **DIP** | High-level code depends on abstractions | Loose coupling, testable |

### Testing Benefits

```
Before (Tightly Coupled):
┌─────────────────────────────────────────┐
│ AsteroidsGame                           │
├─ depends on GoddotRenderer (concrete)   │
├─ depends on PythonAsteroidsProvider     │
├─ depends on GoddotInputHandler          │
└─ CANNOT test without all dependencies   │
```

```
After (Loosely Coupled):
┌─────────────────────────────────────────┐
│ AsteroidsGame                           │
├─ depends on IRenderer (interface)       │
├─ depends on IGameStateProvider          │
├─ depends on IInputHandler               │
└─ CAN test with mocks/stubs              │
```

### Example: Testing with Mock IRenderer

```csharp
[Test]
public void AsteroidsGame_Calls_Render_Each_Frame() {
    var mockRenderer = Mock.Of<IRenderer>();
    var mockProvider = Mock.Of<IGameStateProvider>(
        p => p.GetCurrentState() == CreateTestGameState()
    );
    var mockInput = Mock.Of<IInputHandler>(
        i => i.GetPendingInputs() == new Queue<InputCommandDTO>()
    );

    var game = new AsteroidsGame(mockRenderer, mockProvider, mockInput);
    game.Update(1.0f / 60.0f);

    Mock.Verify(mockRenderer, Mock.Of<IRenderer>(
        r => r.RenderFrame(It.IsAny<FrameDataDTO>())),
        Times.Once
    );
}
```

No Godot, no Python, pure unit test!

---

## Conclusion

This plan delivers:

1. ✅ **Working Asteroids POC** in C# with Godot rendering
2. ✅ **Proof that architecture works** - SOLID principles validated
3. ✅ **Information for Phase E/4a decision** - empirical data
4. ✅ **Production-grade code** - clean, tested, documented
5. ✅ **Platform for future work** - can extend easily

**Status**: READY FOR IMPLEMENTATION

---

**Document Version**: 1.0
**Created**: 2026-02-14
**Status**: FINAL - Approved for Implementation
