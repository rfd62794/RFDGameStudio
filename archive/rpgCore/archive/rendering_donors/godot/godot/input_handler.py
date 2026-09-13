"""
Input Handler - Processes input commands from Godot renderer.

SOLID Principle: Single Responsibility
- Only responsible for input command processing
- Does not handle rendering (Godot's job)
- Does not handle game logic (delegated to game loop)

Architecture:
- Command-based input system (not raw key events)
- Input buffering and deduplication
- Timestamp tracking for frame synchronization
- Support for multiple input types (movement, firing, special)
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Callable
from enum import Enum
from datetime import datetime


class InputCommandType(str, Enum):
    """Types of input commands."""
    THRUST = "thrust"
    ROTATE_LEFT = "rotate_left"
    ROTATE_RIGHT = "rotate_right"
    FIRE = "fire"
    SPECIAL = "special"
    PAUSE = "pause"
    RESUME = "resume"
    QUIT = "quit"


@dataclass
class InputCommand:
    """Single input command from player."""

    command_type: str
    timestamp: float
    duration: float = 0.0  # How long command is active (for held keys)
    intensity: float = 1.0  # For analog input (0.0 to 1.0)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def is_pressed(self) -> bool:
        """Check if command is currently active."""
        return self.duration > 0 or self.intensity > 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "command_type": self.command_type,
            "timestamp": self.timestamp,
            "duration": self.duration,
            "intensity": self.intensity,
            "metadata": self.metadata
        }

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "InputCommand":
        """Create from dictionary."""
        return InputCommand(
            command_type=data.get("command_type", ""),
            timestamp=data.get("timestamp", 0.0),
            duration=data.get("duration", 0.0),
            intensity=data.get("intensity", 1.0),
            metadata=data.get("metadata", {})
        )

    def __repr__(self) -> str:
        return (
            f"InputCommand({self.command_type}, "
            f"intensity={self.intensity:.1f}, "
            f"duration={self.duration:.2f}s)"
        )


class InputHandler:
    """
    Processes input commands from Godot renderer.

    Responsibilities:
    - Buffer input commands from renderer
    - Deduplicate simultaneous inputs
    - Track input history for replay/debugging
    - Provide query interface for game logic

    Does NOT handle:
    - Raw keyboard/mouse events (Godot's job)
    - Game logic execution (game loop's job)
    - Rendering (Godot's job)
    """

    def __init__(self, buffer_size: int = 100):
        """
        Initialize input handler.

        Args:
            buffer_size: Maximum buffered input commands
        """
        self.buffer_size = buffer_size
        self._input_buffer: List[InputCommand] = []
        self._processed_count = 0
        self._current_inputs: Dict[str, InputCommand] = {}  # Currently active inputs
        self._input_history: List[InputCommand] = []
        self._callbacks: Dict[str, List[Callable]] = {}

    def process_inputs(self, raw_inputs: List[Dict[str, Any]]) -> None:
        """
        Process raw input commands from Godot.

        Args:
            raw_inputs: List of input dictionaries from renderer
        """
        for raw_input in raw_inputs:
            try:
                command = InputCommand.from_dict(raw_input)
                self._add_command(command)
            except Exception as e:
                self._trigger_callback("error", str(e))

    def _add_command(self, command: InputCommand) -> None:
        """Add command to buffer."""
        if len(self._input_buffer) >= self.buffer_size:
            # Buffer full - remove oldest
            self._input_buffer.pop(0)

        self._input_buffer.append(command)
        self._current_inputs[command.command_type] = command
        self._input_history.append(command)

        # Trigger registered callbacks
        self._trigger_callback(command.command_type, command)

    def get_pending_inputs(self) -> List[InputCommand]:
        """
        Get all pending input commands.

        Returns:
            List of InputCommand objects
        """
        return self._input_buffer.copy()

    def get_active_inputs(self) -> List[InputCommand]:
        """
        Get currently active input commands.

        Returns:
            List of active InputCommand objects
        """
        return list(self._current_inputs.values())

    def is_input_active(self, command_type: str) -> bool:
        """
        Check if a specific input is currently active.

        Args:
            command_type: Type of input to check

        Returns:
            True if input is active
        """
        if command_type not in self._current_inputs:
            return False

        cmd = self._current_inputs[command_type]
        return cmd.is_pressed()

    def get_input_intensity(self, command_type: str) -> float:
        """
        Get intensity of input (for analog inputs).

        Args:
            command_type: Type of input

        Returns:
            Intensity 0.0 to 1.0, or 0.0 if not active
        """
        if command_type not in self._current_inputs:
            return 0.0

        cmd = self._current_inputs[command_type]
        return cmd.intensity if cmd.is_pressed() else 0.0

    def clear_buffer(self) -> None:
        """Clear input buffer (call after processing each frame)."""
        self._input_buffer.clear()
        self._processed_count += 1

    def clear_active_inputs(self, command_type: Optional[str] = None) -> None:
        """
        Clear active inputs.

        Args:
            command_type: Specific input to clear, or None for all
        """
        if command_type:
            self._current_inputs.pop(command_type, None)
        else:
            self._current_inputs.clear()

    def register_callback(
        self,
        command_type: str,
        callback: Callable[[InputCommand], None]
    ) -> None:
        """
        Register callback for input command.

        Args:
            command_type: Type of input to listen for
            callback: Function to call when input received
        """
        if command_type not in self._callbacks:
            self._callbacks[command_type] = []

        self._callbacks[command_type].append(callback)

    def _trigger_callback(self, command_type: str, data: Any) -> None:
        """Trigger registered callbacks for input type."""
        if command_type in self._callbacks:
            for callback in self._callbacks[command_type]:
                try:
                    callback(data)
                except Exception as e:
                    # Don't let callback errors break input handling
                    pass

    def get_stats(self) -> Dict[str, Any]:
        """Get input handler statistics."""
        return {
            "pending_inputs": len(self._input_buffer),
            "active_inputs": len(self._current_inputs),
            "processed_count": self._processed_count,
            "history_size": len(self._input_history),
            "active_command_types": list(self._current_inputs.keys())
        }

    def __repr__(self) -> str:
        return (
            f"InputHandler(pending={len(self._input_buffer)}, "
            f"active={len(self._current_inputs)}, "
            f"processed={self._processed_count})"
        )
