# Preserved Rendering Donors

These rendering systems have been preserved from the `game_engine` and `dgt_engine` donor archives. They represent alternate rendering approaches that are not currently part of the canonical `src/shared/rendering/` layer but hold intrinsic value for future work.

## `godot/`
- **What it is:** A complete Godot 4.x C# bridge acting as an IPC client. It listens for entities and game state sent from a Python server and renders them using Godot's built-in nodes and canvas layer.
- **Why it was kept:** If `rpgCore` ever migrates away from Python/PyGame to a dedicated production engine, this bridge serves as the blueprint for how a Python core can drive a Godot frontend.

## `terminal/`
- **What it is:** Abstract rendering adapters that use the `rich` library to print grids, entities, and UI elements directly to standard output.
- **Why it was kept:** Terminal rendering is an extremely powerful tool for running headless servers, debugging entity state, and writing command-line tools. It provides a purely text-based representation of the game world.

## `pygame_shim/`
- **What it is:** A proxy wrapper around `pygame.draw` calls that intercepts drawing commands and serializes them into `RenderPackets`.
- **Why it was kept:** The pattern of intercepting and serializing draw calls is valuable if the rendering ever needs to be executed over a network (e.g., separating the game simulation loop from the renderer loop via websockets or shared memory).
