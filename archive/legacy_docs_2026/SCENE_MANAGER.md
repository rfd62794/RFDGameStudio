> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# Scene Manager — Architecture Reference

## Overview

The Scene Manager provides a single-window state machine for the Slime Clan application. Instead of spawning separate pygame processes per game tier, all scenes share one `pygame.display` surface and transition via `request_scene()`.

## Scene Interface Contract

Every scene must implement these methods (orchestrated by the `BaseSystem` lifecycle):

```python
class MyScene(Scene):
    def initialize(self) -> bool:
        """Formal engine initialization. Calls on_enter() by default."""
        return super().initialize()

    def tick(self, delta_time: float) -> None:
        """Formal engine update. Calls update(dt_ms) by default."""
        super().tick(delta_time)

    def shutdown(self) -> None:
        """Formal engine cleanup. Calls on_exit() by default."""
        super().shutdown()

    # --- Legacy/Wrapped interface ---
    def on_enter(self, **kwargs) -> None:
        """Initialize state. Receive data via kwargs."""

    def update(self, dt_ms: float) -> None:
        """Advance game logic. dt_ms = milliseconds."""

    def render(self, surface: pygame.Surface) -> None:
        """Draw to the shared surface."""

    def on_exit(self) -> None:
        """Clean up resources."""
```

## Scene Transitions

| Method | Effect |
|---|---|
| `self.request_scene("name", **kwargs)` | Transition to another scene after this frame |
| `self.request_quit()` | Exit the application after this frame |

Data flows between scenes via `kwargs`. For example, returning from a battle:
```python
self.request_scene("overworld", nodes=self.nodes, game_over=None)
```

## Registered Scenes

| Name | Class | Status | Purpose |
|---|---|---|---|
| `overworld` | `OverworldScene` | ✅ Migrated (019A) | Strategic node map, battle launches |
| `battle_field` | `BattleFieldScene` | ✅ Migrated (019B) | Tactical grid movement, squad collision |
| `auto_battle` | `AutoBattleScene` | ✅ Migrated (019B) | Turn-based combat resolution |

## Future Scenes

| Name | Purpose | Session |
|---|---|---|
| `squad_loadout` | Pre-battle composition selection | 020 |
| `recruitment` | Slime recruitment / roster management | Future |
| `ship_status` | Ship repair progress / departure readiness | Future |

## Source Files

- **Scene Manager:** `src/shared/engine/scene_manager.py`
- **Application:** `src/apps/slime_clan/app.py`
- **Launcher:** `run_overworld.py`
