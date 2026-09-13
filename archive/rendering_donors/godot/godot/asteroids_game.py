"""
Asteroids Game - Main game loop orchestrator for POC.

SOLID Principle: Single Responsibility
- Only responsible for orchestrating game loop
- Delegates to specialized systems (SDK, input handler, logic, rendering)

Architecture:
- Main game loop with fixed timestep
- State machine for game phases (menu, playing, paused, game_over)
- Integration of all subsystems: IPC, input, config, logic
- Frame-based timing for deterministic updates
"""

import time
from enum import Enum
from typing import Optional, Dict, Any, List, Callable
from dataclasses import dataclass

from .asteroids_clone_sdk import AsteroidsSDK
from .input_handler import InputHandler, InputCommandType


class GameState(str, Enum):
    """Game state machine."""
    INITIALIZING = "initializing"
    PLAYING = "playing"
    PAUSED = "paused"
    GAME_OVER = "game_over"
    SHUTDOWN = "shutdown"


@dataclass
class GameStats:
    """Game statistics."""
    score: int = 0
    lives: int = 3
    wave: int = 1
    asteroids_destroyed: int = 0
    total_frames: int = 0
    time_elapsed: float = 0.0


class AsteroidsGame:
    """
    Main Asteroids game loop orchestrator.

    Coordinates:
    - IPC communication via AsteroidsSDK
    - Input processing via InputHandler
    - Game state management
    - Frame timing and synchronization
    """

    def __init__(
        self,
        target_fps: int = 60,
        godot_host: str = "localhost",
        godot_port: int = 9001
    ):
        """
        Initialize Asteroids game.

        Args:
            target_fps: Target frames per second
            godot_host: Godot server hostname
            godot_port: Godot server port
        """
        self.target_fps = target_fps
        self.frame_time = 1.0 / target_fps

        # Subsystems
        self.sdk = AsteroidsSDK(host=godot_host, port=godot_port)
        self.input_handler = InputHandler()

        # State
        self.state = GameState.INITIALIZING
        self.stats = GameStats()

        # Timing
        self.current_time = 0.0
        self.frame_count = 0
        self.fps_counter = 0
        self.last_fps_time = time.time()

        # Game entities (simplified for POC)
        self.entities: List[Dict[str, Any]] = []

        # Callbacks for custom game logic
        self.on_state_changed: Optional[Callable] = None
        self.on_frame: Optional[Callable] = None

    def initialize(self) -> bool:
        """
        Initialize game and connect to Godot.

        Returns:
            True if initialization successful
        """
        print("🎮 Initializing Asteroids Game...")

        # Connect to Godot
        if not self.sdk.connect():
            print("❌ Failed to connect to Godot renderer")
            self.state = GameState.SHUTDOWN
            return False

        print("✅ Connected to Godot renderer")

        # Set up input callbacks
        self.input_handler.register_callback(
            InputCommandType.FIRE,
            self._on_fire_input
        )
        self.input_handler.register_callback(
            InputCommandType.PAUSE,
            self._on_pause_input
        )

        # Spawn initial entities (placeholder)
        self._spawn_initial_entities()

        self.state = GameState.PLAYING
        self.current_time = 0.0
        print("✅ Game initialized successfully")

        return True

    def run(self) -> None:
        """
        Run main game loop.

        Blocks until game exits.
        """
        if not self.initialize():
            return

        loop_start = time.time()

        try:
            while self.state != GameState.SHUTDOWN:
                frame_start = time.time()

                # Process frame
                self._update_frame()

                # Timing adjustment
                frame_duration = time.time() - frame_start
                sleep_time = self.frame_time - frame_duration

                if sleep_time > 0:
                    time.sleep(sleep_time)

                self.frame_count += 1

                # Update stats
                self.current_time = time.time() - loop_start
                self.stats.time_elapsed = self.current_time
                self.stats.total_frames = self.frame_count

        except KeyboardInterrupt:
            print("\n⏹️  Game interrupted by user")
        except Exception as e:
            print(f"❌ Game error: {e}")
        finally:
            self.shutdown()

    def _update_frame(self) -> None:
        """Update single game frame."""
        # Get input from Godot
        inputs = self.sdk.get_inputs()
        if inputs:
            self.input_handler.process_inputs(inputs)

        # Process game logic based on state
        if self.state == GameState.PLAYING:
            self._update_playing()
        elif self.state == GameState.PAUSED:
            self._update_paused()

        # Send frame to Godot
        self._send_frame_to_renderer()

        # Callback for custom logic
        if self.on_frame:
            self.on_frame()

        # Update FPS counter
        self._update_fps_counter()

    def _update_playing(self) -> None:
        """Update game while playing."""
        # Get active inputs
        active_inputs = self.input_handler.get_active_inputs()

        # Process each active input
        for input_cmd in active_inputs:
            if input_cmd.command_type == InputCommandType.THRUST:
                self._apply_thrust(input_cmd.intensity)
            elif input_cmd.command_type == InputCommandType.ROTATE_LEFT:
                self._apply_rotation(-input_cmd.intensity)
            elif input_cmd.command_type == InputCommandType.ROTATE_RIGHT:
                self._apply_rotation(input_cmd.intensity)

        # Update entity physics (placeholder)
        self._update_entities()

        # Clear processed inputs
        self.input_handler.clear_buffer()

    def _update_paused(self) -> None:
        """Update game while paused."""
        # Still accept resume input
        if self.input_handler.is_input_active(InputCommandType.RESUME):
            self._set_state(GameState.PLAYING)

        self.input_handler.clear_buffer()

    def _send_frame_to_renderer(self) -> None:
        """Send current game state to Godot renderer."""
        hud_data = {
            "score": self.stats.score,
            "lives": self.stats.lives,
            "wave": self.stats.wave,
            "asteroids_remaining": len([e for e in self.entities if e.get("type") == "asteroid"])
        }

        self.sdk.send_frame(self.entities, hud_data)

    def _spawn_initial_entities(self) -> None:
        """Spawn initial game entities."""
        # Player ship
        self.entities.append({
            "id": "ship_player",
            "type": "ship",
            "x": 80.0,
            "y": 72.0,
            "vx": 0.0,
            "vy": 0.0,
            "heading": 0.0,
            "radius": 5.0,
            "active": True
        })

        # Initial asteroids
        import random
        for i in range(3):
            self.entities.append({
                "id": f"asteroid_{i}",
                "type": "asteroid",
                "x": random.uniform(20, 140),
                "y": random.uniform(20, 124),
                "vx": random.uniform(-2, 2),
                "vy": random.uniform(-2, 2),
                "radius": 10.0,
                "active": True
            })

    def _update_entities(self) -> None:
        """Update entity physics (simplified)."""
        for entity in self.entities:
            if not entity.get("active"):
                continue

            # Update position
            entity["x"] += entity.get("vx", 0.0) * self.frame_time
            entity["y"] += entity.get("vy", 0.0) * self.frame_time

            # Wrap around screen
            if entity["x"] < 0:
                entity["x"] = 160
            elif entity["x"] > 160:
                entity["x"] = 0

            if entity["y"] < 0:
                entity["y"] = 144
            elif entity["y"] > 144:
                entity["y"] = 0

    def _apply_thrust(self, intensity: float) -> None:
        """Apply thrust to player ship."""
        ship = next((e for e in self.entities if e.get("type") == "ship"), None)
        if not ship:
            return

        # Simple thrust: accelerate in heading direction
        heading = ship.get("heading", 0.0)
        import math
        accel = 100.0 * intensity  # pixels per second squared
        ship["vx"] += math.cos(heading) * accel * self.frame_time
        ship["vy"] += math.sin(heading) * accel * self.frame_time

        # Clamp velocity
        max_vel = 200.0
        vel_magnitude = (ship["vx"] ** 2 + ship["vy"] ** 2) ** 0.5
        if vel_magnitude > max_vel:
            ship["vx"] = (ship["vx"] / vel_magnitude) * max_vel
            ship["vy"] = (ship["vy"] / vel_magnitude) * max_vel

    def _apply_rotation(self, direction: float) -> None:
        """Rotate player ship."""
        ship = next((e for e in self.entities if e.get("type") == "ship"), None)
        if not ship:
            return

        rotation_speed = 3.0  # radians per second
        ship["heading"] = (ship.get("heading", 0.0) + direction * rotation_speed * self.frame_time) % (2 * 3.14159)

    def _on_fire_input(self, command) -> None:
        """Handle fire input."""
        ship = next((e for e in self.entities if e.get("type") == "ship"), None)
        if not ship:
            return

        # Spawn projectile
        import math
        heading = ship.get("heading", 0.0)
        projectile = {
            "id": f"proj_{self.frame_count}",
            "type": "projectile",
            "x": ship["x"] + math.cos(heading) * ship["radius"],
            "y": ship["y"] + math.sin(heading) * ship["radius"],
            "vx": ship.get("vx", 0.0) + math.cos(heading) * 300.0,
            "vy": ship.get("vy", 0.0) + math.sin(heading) * 300.0,
            "radius": 1.0,
            "lifetime": 1.0,
            "active": True
        }
        self.entities.append(projectile)

    def _on_pause_input(self, command) -> None:
        """Handle pause input."""
        if self.state == GameState.PLAYING:
            self._set_state(GameState.PAUSED)

    def _set_state(self, new_state: GameState) -> None:
        """Set game state."""
        if new_state != self.state:
            self.state = new_state
            if self.on_state_changed:
                self.on_state_changed(self.state)

    def _update_fps_counter(self) -> None:
        """Update FPS counter."""
        self.fps_counter += 1
        current_time = time.time()

        if current_time - self.last_fps_time >= 1.0:
            actual_fps = self.fps_counter / (current_time - self.last_fps_time)
            if self.frame_count % 60 == 0:  # Print every 1 second
                print(f"Frame {self.frame_count:5d} | FPS: {actual_fps:.1f} | Entities: {len(self.entities):3d}")

            self.fps_counter = 0
            self.last_fps_time = current_time

    def shutdown(self) -> None:
        """Shut down game and cleanup."""
        print("🛑 Shutting down game...")

        self.state = GameState.SHUTDOWN
        self.sdk.disconnect()

        print(f"📊 Final Stats:")
        print(f"  Frames: {self.stats.total_frames}")
        print(f"  Time: {self.stats.time_elapsed:.1f}s")
        print(f"  Score: {self.stats.score}")
        print(f"✅ Shutdown complete")

    def get_stats(self) -> Dict[str, Any]:
        """Get game statistics."""
        return {
            "state": self.state.value,
            "frames": self.stats.total_frames,
            "time": self.stats.time_elapsed,
            "score": self.stats.score,
            "lives": self.stats.lives,
            "wave": self.stats.wave,
            "entities": len(self.entities),
            "fps": self.frame_count / self.stats.time_elapsed if self.stats.time_elapsed > 0 else 0
        }

    def __repr__(self) -> str:
        return (
            f"AsteroidsGame(state={self.state.value}, "
            f"fps={self.target_fps}, "
            f"entities={len(self.entities)})"
        )


if __name__ == "__main__":
    game = AsteroidsGame(target_fps=60)
    game.run()
