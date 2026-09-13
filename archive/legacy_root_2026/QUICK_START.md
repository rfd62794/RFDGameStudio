# Quick Start Guide - NEAT Asteroids Visual Demo

## The Problem
The automated launcher has a timing issue. Here's the **correct manual sequence**:

## Step-by-Step (2 Terminals Required)

### Terminal 1: Start Godot FIRST
```bash
cd C:\Github\rpgCore\godot_project
"C:\Godot\4.6_NET\Godot_v4.6-stable_mono_win64.exe" --path .
```

**Wait for:**
1. Godot editor to open
2. Project to import (first time only - takes 30-60 seconds)
3. C# build to complete
4. Console shows: `[GameServer] Listening on localhost:9001`

### Terminal 2: Start Python Engine
```bash
cd C:\Github\rpgCore
python run_demo.py
```

**You should see:**
```
[Initializing NEAT Asteroids Game...]
[OK] Connected to Godot
[Spawned 5 pilots for generation 0]
```

### Terminal 1: Run the Game
In Godot editor, press **F5** (or click Play button)

## What You'll See

**Godot Window (640x576):**
- Green triangles = AI pilots
- Yellow circles = Asteroids
- White dots = Projectiles
- HUD showing generation, pilot count

**Python Console:**
```
Frame    60 | Generation 0 | Active Pilots: 5/5
Frame   120 | Generation 0 | Active Pilots: 4/5
...
[Generation 0 Complete]
  Pilot 0: Fitness=125.3
  Pilot 1: Fitness=87.2
```

## Troubleshooting

**"Failed to connect to Godot"**
→ Godot not started yet. Start Godot FIRST in Terminal 1

**"Build required" in Godot**
→ Click Build → Build Project, then press F5

**No window appears**
→ Check you're using Godot .NET (mono) version, not standard

**C# errors in Godot**
→ Run `test_build.bat` in godot_project/ to see errors

## Automated Launcher (Once Working)

After confirming it works manually, use:
```bash
run_demo_simple.bat
```

But for first-time setup, always use the manual 2-terminal method above.
