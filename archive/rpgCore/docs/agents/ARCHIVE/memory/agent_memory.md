# Agent Memory

## Architectural Decisions
- SceneBase is in src/shared/ui/scene_base.py (not BaseScene)
- D20Resolver is stable — do not refactor without explicit request
- Mathematical renderer — slimes are drawn not sprited
- All demos must inherit shared infrastructure from src/shared/
- Herald routes to remote (execution department)
- Archivist and Strategist now route to remote (Ollama unstable)

## Patterns That Work
- Two-pass Herald with ContextBuilder produces real file paths
- Remote routing via DeepSeek R1 produces complete valid JSON
- Brace-depth extraction handles partial model output
- YAML configs per agent — schema and prompt in same config

## Patterns That Failed
- :free suffix on OpenRouter models returns 404 — never use
- Strategist on 1b truncates at ~512 tokens — always use 3b or remote
- Herald example absorption — copies example verbatim on 1b
- Herald with invented file paths — ContextBuilder fixes this
- model_name kwarg on Herald.__init__ — removed, use AgentConfig

## Constitutional Rules
- Test floor: 494 passing
- All new features require tests
- src/shared/ is shared infrastructure — never app-specific
- Demos in src/apps/ — shared systems in src/shared/

## Never Do
- Do not invent file paths not in SymbolMap
- Do not use :free suffix on OpenRouter model names
- Do not skip risk field in SessionPlan alternatives
- Do not refactor existing agents mid-session
- Do not recommend non-vision-aligned work when VISION.md exists

## Simulation Engine — Future Architecture

The racing headless engine is the prototype for a unified Simulation Engine. All autonomous activities share:
- **Tick-based progression**: Fixed-step simulation logic.
- **Participant stats**: Derived from genome, influencing velocity/acceleration.
- **Environment zones**: Segments with modifiers (Water/Fire/Mud).
- **Checkpoint/progress tracking**: Measuring journey through a space.
- **Result generation**: Deterministic success/fail reports.

### Applications:
- **Racing**: First to finish wins.
- **Dungeon Dispatch**: Survive N floors/checkpoints.
- **Missions**: Complete specific objectives via path progress.
- **Battle**: Reduce enemy HP to 0 using similar physics-based impact math.

### Shared Systems to Extract:
- `src/shared/simulation/base_engine.py` (Headless tick logic)
- `src/shared/simulation/participant.py` (Velocity/Stat mapping)
- `src/shared/simulation/environment.py` (Zone/Segment mapping)
- `src/shared/camera/` (Momentum-based follow and dynamic zoom)

> [!NOTE]
> The racing system is not a minigame; it is the **proof of concept** for the entire autonomous world simulation.
