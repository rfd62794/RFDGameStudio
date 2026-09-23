# Godot Setup & Live Demo Guide

## Quick Start: Running the Live NEAT Demo

This guide walks through setting up Godot and running a live demo of AI pilots learning Asteroids.

### Prerequisites

- **Godot 4.4+** (free download from godotengine.org)
- **.NET 6.0 SDK** installed
- **Python 3.14** (already installed for rpgCore)
- **Godot C# support** (install via Project → Project Settings → Plugins)

---

## Step 1: Setup Godot Project (30 minutes)

### 1.1 Open Godot Editor

```bash
# Navigate to Godot project directory
cd src/game_engine/godot

# Launch Godot 4.4+
godot --path .
```

### 1.2 Import C# Project

When Godot opens, it will detect `rpgCore.Godot.csproj`:

1. Click **Import** when prompted
2. Allow Godot to build the C# project
3. Wait for compilation to complete
4. You should see no errors in the console

### 1.3 Verify Project Structure

In the FileSystem panel (left side), you should see:
```
res://
├── project.godot
├── scenes/
│   └── Main.tscn
├── Server/
│   └── GameServer.cs
├── Rendering/
│   ├── GoddotRenderer.cs
│   └── GameEntityRenderer.cs
├── Models/
│   └── DTOs.cs
├── Interfaces/
├── Utils/
└── icon.svg
```

### 1.4 Configure Project Settings

1. Go to **Project → Project Settings**
2. Under **General → Physics → 2D**:
   - Set `Default Gravity` to `0.0` (space game has no gravity)
3. Under **General → Window**:
   - Set `Viewport Width` to `640`
   - Set `Viewport Height` to `576`
4. Click **Close**

---

## Step 2: Create/Open Main Scene

The `Main.tscn` scene should already exist. If not:

### 2.1 Create Main Scene

1. Right-click in FileSystem panel → New Scene
2. Save as `Main.tscn` in `res://scenes/`
3. Attach script: `Main.cs` to root node

### 2.2 Verify Scene Structure

The scene should have:
```
Main (Node) - uses Main.cs script
├── GameCanvas (CanvasLayer)
│   └── GameRenderer (CanvasItem)
└── Control (Control)
```

---

## Step 3: Start Python Game Engine

### 3.1 Terminal 1: Start NEAT Game

```bash
# From rpgCore root directory
cd src/game_engine/godot

# Run NEAT game (headless, sends to Godot)
python -m asteroids_neat_game
```

Expected output:
```
🧠 Initializing NEAT Asteroids Game...
✅ Connected to Godot
🚀 Spawned 5 pilots for generation 0
Frame     0 | Generation 0 | Active Pilots: 5/5
```

### 3.2 Verify Socket Server Started

The Python engine should be listening on:
- **Host**: `localhost`
- **Port**: `9001`

---

## Step 4: Run Godot Project

### 4.1 Play Scene

In Godot Editor:
1. Click the **Play** button (or press F5)
2. Wait for scene to initialize

Expected output in Godot Console:
```
=== rpgCore Godot Engine Starting ===
Game Type: space
[Main] Entity renderer initialized
[Main] Game server started successfully
[GameServer] Listening on localhost:9001
[GameServer] Python engine connected
```

### 4.2 Verify Connection

You should see in the Godot viewport:
- Black background (160×144 game world, scaled 4x to 640×576)
- Entity positions will appear as Godot connects

And in Python console:
```
[GameServer] Python engine connected
[Main] Connected to Python engine
```

---

## Step 5: Watch AI Learn

Once connected:

1. **You'll see 5 AI pilots** (green triangles) spawning in the game world
2. **Yellow circles** are asteroids to destroy
3. **Small white dots** are projectiles
4. **Top HUD** shows:
   - SCORE: 0 (cumulative)
   - LIVES: 3 (default)
   - WAVE: GEN 0 (generation number)
   - Status: "Pilots: 5/5" (active pilots)

### 5.1 Pilot Behavior

The AI pilots use neural networks to decide:
- When to thrust toward/away from asteroids
- When to rotate to face targets
- When to fire

Decisions are based on 8-ray spatial scan of the world.

### 5.2 Gameplay

- Asteroids move around the world
- Pilots try to destroy asteroids
- When a pilot's neural network outputs are high enough:
  - **Thrust > 0.3**: Apply acceleration
  - **Rotation > 0.3**: Turn
  - **Fire > 0.5**: Shoot projectile

### 5.3 Generations

After ~30 seconds per generation:
1. Generation ends
2. Fitness scores calculated
3. Print to Python console:
   ```
   📊 Generation 0 Complete
     Pilot 0: Fitness=125.3
     Pilot 1: Fitness=87.2
     ...
   ```
4. New generation spawns (same population, slightly mutated)

---

## Step 6: Control & Interaction (Optional)

You can manually control one pilot while others learn:

| Key | Action |
|-----|--------|
| ↑ | Thrust |
| ← | Rotate Left |
| → | Rotate Right |
| Space | Fire |
| Esc | Pause/Resume |
| Tab | Quit |

---

## Troubleshooting

### "Connection Refused" Error

**Problem**: Godot can't connect to Python engine
```
[GameServer] Failed to start server: Address already in use
```

**Solution**:
1. Check if Python is running: `netstat -an | grep 9001`
2. Kill existing process: `taskkill /PID <pid> /F`
3. Restart Python engine
4. Restart Godot

### "Assembly Not Found" Error

**Problem**: C# compilation failed
```
error CS0006: Assembly 'rpgCore.Godot' not found
```

**Solution**:
1. In Godot: **Tools → C# → Build Project**
2. Wait for build to complete
3. Check for compilation errors in the Output panel
4. Fix any C# syntax errors
5. Rebuild

### "No Entities Appear"

**Problem**: Godot running but no game content visible

**Solution**:
1. Check Python console for errors
2. Verify TCP connection: Both consoles should show "connected"
3. Check Godot console for rendering errors
4. Verify viewport size (should be 640×576)
5. Check if GameRenderer is properly initialized

### Frame Rate Issues

**Problem**: Game running slowly

**Solution**:
1. Reduce population size in Python:
   ```python
   game = AsteroidsNEATGame(population_size=2)  # Was 5
   ```
2. Reduce max_episode_time to transition faster:
   ```python
   game = AsteroidsNEATGame(max_episode_time=15.0)  # Was 30
   ```
3. In Godot: **Project → Project Settings → Debug → GDScript** reduce draw calls

---

## Advanced: Customization

### Change Population Size

In `asteroids_neat_game.py`:
```python
game = AsteroidsNEATGame(
    population_size=10,  # Increase to 10 pilots
    target_fps=60,
    max_episode_time=30.0
)
```

### Change Game Type

In `src/game_engine/godot/scenes/Main.cs`:
```csharp
private string _gameType = "rpg";  // Change from "space" to "rpg"
```

Then register RPG-specific renderers in `GameEntityRenderer.cs`:
```csharp
if (_gameType == "rpg")
{
    _entityRenderers["character"] = new CharacterRenderer();
    // Add more RPG renderers
}
```

### Add Custom Renderer

1. Create new renderer class in `GameEntityRenderer.cs`:
```csharp
public class CustomRenderer : EntityRenderer
{
    public override void Render(CanvasItem canvas, EntityDTO entity, Vector2 worldScale)
    {
        // Custom rendering logic
    }
}
```

2. Register in `SetupRenderStrategies()`:
```csharp
_entityRenderers["custom_type"] = new CustomRenderer();
```

3. Send entities from Python with matching type:
```python
entity = {"id": "1", "type": "custom_type", ...}
```

---

## Architecture Overview

```
GODOT RENDERER (Visual Frontend)
   ↕ TCP IPC (JSON messages)
PYTHON GAME ENGINE (Logic Core)
   ├─ AsteroidsNEATGame (Main loop + population)
   ├─ NEATAsteroidPilot (Individual agent)
   ├─ SimpleNeuralNetwork (8→8→3 network)
   └─ Physics/Collision (Game rules)
```

**Data Flow**:
```
Neural Network Decisions
  ↓
Entity Physics Updates
  ↓
Collision Detection
  ↓
Render Coordinates Calculated
  ↓
JSON Serialized
  ↓
Sent via TCP to Godot
  ↓
GameServer Receives
  ↓
FrameUpdateMessage Created
  ↓
GameEntityRenderer Renders
  ↓
Viewport Display Updated
```

---

## Performance Metrics

**Target Performance**:
- **Frame Rate**: 60 FPS (desktop)
- **Population Size**: 5 pilots
- **Message Latency**: < 16ms per frame
- **Python Update**: ~15-30ms per frame
- **Godot Render**: ~10-20ms per frame

**Monitoring**:
- Python console shows FPS every 60 frames
- Godot Editor shows frame time in bottom-right
- Netstat can monitor TCP traffic

---

## Next Steps

Once the demo is running:

1. **Observe AI Learning**: Watch pilot fitness scores improve over generations
2. **Experiment with Parameters**: Change population size, mutation rates, network architecture
3. **Add Observers**: Hook into fitness calculations to track specific skills
4. **Extend Game Types**: Add RPG or Tycoon game support (same architecture)
5. **Production Deployment**: Deploy to servers for distributed evolution

---

## Support & Debugging

### Enable Detailed Logging

In `GameServer.cs`, add logging:
```csharp
GD.Print($"[Message] {messageType}: {message}");
```

### Monitor Network Traffic

```bash
# Monitor TCP 9001 on Windows
netstat -an | find ":9001"

# Or use Wireshark for detailed inspection
wireshark
```

### Python Debug Mode

```python
game = AsteroidsNEATGame(...)
# Add to main loop:
print(f"Frame {game.frame_count}: Pilots={len(game.active_pilots)}, Entities={len(game.entities)}")
```

---

## Summary

You now have a **complete live demo** of:

✅ NEAT neural network evolution (Python core)
✅ AI pilots learning to play Asteroids (decision making)
✅ Real-time visual rendering (Godot frontend)
✅ Cross-language communication (TCP IPC)
✅ Extensible architecture (add new game types, renderers)

**Estimated demo runtime**: 5-10 minutes per session
**Estimated learning progress**: Visible improvements by generation 3-5

Enjoy watching AI learn! 🧠🎮
