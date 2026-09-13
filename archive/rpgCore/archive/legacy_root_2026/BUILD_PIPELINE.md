# Godot C# Build Pipeline

## Current Status

✅ **Godot window displays** (grey screen)
❌ **C# compilation fails** - Multiple namespace/import issues
🔧 **Work in progress** - 42 compilation errors remaining

## Issues to Fix

The C# codebase copied from `src/game_engine/godot/` has compatibility issues:

1. **Python docstrings** (`"""`) need conversion to C# comments (`/* */`)
2. **Namespace mismatch**: `DgtEngine.Godot.*` → `rpgCore.Godot.*`
3. **Missing `partial` keyword** for Godot 4.6 classes
4. **Incomplete DTOs** - Missing `ParticleEmitterDTO`, `FrameUpdateMessage`
5. **Import issues** - Interfaces need `using rpgCore.Godot.Models;`

## Quick Build Commands

```bash
cd godot_project

# Check for errors
dotnet build rpgCore.Godot.csproj

# Build via Godot (preferred)
"C:\Godot\4.6_NET\Godot_v4.6-stable_mono_win64.exe" --headless --build-solutions --quit

# Run after successful build
cd ..
./build_and_run.bat
```

## Manual Fix Checklist

- [ ] Replace all `"""` with `/*` and `*/` in .cs files
- [ ] Replace `namespace DgtEngine` with `namespace rpgCore`
- [ ] Add `partial` to `Main` and `GameEntityRenderer` classes
- [ ] Add `using rpgCore.Godot.Models;` to all Interface files
- [ ] Verify all DTOs exist in Models/DTOs.cs
- [ ] Check Godot 4.6 API compatibility (OS.GetTicksMsec → Time.GetTicksMsec)

## Recommended Next Steps

### Option A: Use Simpler Demo (Python Only)
Run the Python terminal demo without Godot:
```bash
python src/game_engine/godot/asteroids_game.py
```

### Option B: Fix C# Build (Estimated: 1-2 hours)
1. Create clean C# files from scratch for Godot 4.6
2. Reference Godot 4.6 C# API docs: https://docs.godotengine.org/en/4.6/
3. Test incrementally (build after each file)

### Option C: Alternative Renderer
Use MonoGame, Raylib, or pure Python rendering instead

## Files Created

- `godot_project/build.bat` - Manual build script
- `godot_project/fix_cs_files.py` - Automated Python docstring fixer
- `build_and_run.bat` - Build + run launcher
- `BUILD_PIPELINE.md` - This file

## Current Error Summary

```
40+ errors related to:
- Missing type definitions (EntityDTO properties mismatch)
- Godot 4.6 API changes (OS.GetTicksMsec removed)
- Namespace resolution issues
```

## Success Criteria

When the build succeeds, you'll see:
```
Build succeeded.
    0 Warning(s)
    0 Error(s)
```

Then run `build_and_run.bat` and the grey Godot window will show green triangles (AI pilots), yellow circles (asteroids), and white dots (projectiles) with the NEAT AI learning in real-time!
