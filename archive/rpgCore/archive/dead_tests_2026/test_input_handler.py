"""
Test suite for Input Handler.

Coverage:
- Input command creation and serialization
- Input buffer management
- Active input tracking
- Callback system
"""

import pytest
from unittest.mock import Mock
from src.game_engine.godot.input_handler import (
    InputHandler, InputCommand, InputCommandType
)


@pytest.fixture
def input_handler():
    """Create input handler fixture."""
    return InputHandler(buffer_size=100)


@pytest.fixture
def sample_command():
    """Create sample input command."""
    return InputCommand(
        command_type=InputCommandType.THRUST,
        timestamp=0.0,
        intensity=0.8
    )


class TestInputCommandCreation:
    """Test input command creation."""

    def test_create_command(self, sample_command):
        """Test creating input command."""
        assert sample_command.command_type == InputCommandType.THRUST
        assert sample_command.intensity == 0.8
        assert sample_command.timestamp == 0.0

    def test_command_is_pressed(self):
        """Test command is_pressed check."""
        cmd_pressed = InputCommand(
            command_type=InputCommandType.FIRE,
            timestamp=0.0,
            duration=0.1
        )
        assert cmd_pressed.is_pressed()

        cmd_not_pressed = InputCommand(
            command_type=InputCommandType.FIRE,
            timestamp=0.0,
            duration=0.0,
            intensity=0.0
        )
        assert not cmd_not_pressed.is_pressed()

    def test_command_repr(self, sample_command):
        """Test command string representation."""
        repr_str = repr(sample_command)
        assert "THRUST" in repr_str or "thrust" in repr_str
        assert "0.8" in repr_str


class TestInputCommandSerialization:
    """Test input command serialization."""

    def test_to_dict(self, sample_command):
        """Test converting command to dict."""
        data = sample_command.to_dict()

        assert data["command_type"] == InputCommandType.THRUST
        assert data["intensity"] == 0.8
        assert data["timestamp"] == 0.0

    def test_from_dict(self):
        """Test creating command from dict."""
        data = {
            "command_type": InputCommandType.FIRE,
            "timestamp": 1.5,
            "duration": 0.05,
            "intensity": 1.0,
            "metadata": {"key": "value"}
        }

        cmd = InputCommand.from_dict(data)

        assert cmd.command_type == InputCommandType.FIRE
        assert cmd.timestamp == 1.5
        assert cmd.duration == 0.05
        assert cmd.metadata["key"] == "value"

    def test_dict_roundtrip(self, sample_command):
        """Test dict conversion roundtrip."""
        data = sample_command.to_dict()
        restored = InputCommand.from_dict(data)

        assert restored.command_type == sample_command.command_type
        assert restored.intensity == sample_command.intensity
        assert restored.timestamp == sample_command.timestamp


class TestInputHandlerBuffering:
    """Test input buffer management."""

    def test_add_command_to_buffer(self, input_handler, sample_command):
        """Test adding command to buffer."""
        input_handler.process_inputs([sample_command.to_dict()])

        pending = input_handler.get_pending_inputs()
        assert len(pending) == 1
        assert pending[0].command_type == InputCommandType.THRUST

    def test_buffer_overflow(self):
        """Test buffer respects max size."""
        handler = InputHandler(buffer_size=5)

        # Add more than buffer size
        for i in range(10):
            cmd = InputCommand(
                command_type=InputCommandType.FIRE,
                timestamp=float(i)
            )
            handler.process_inputs([cmd.to_dict()])

        pending = handler.get_pending_inputs()
        assert len(pending) <= 5

    def test_clear_buffer(self, input_handler, sample_command):
        """Test clearing buffer."""
        input_handler.process_inputs([sample_command.to_dict()])
        assert len(input_handler.get_pending_inputs()) > 0

        input_handler.clear_buffer()
        assert len(input_handler.get_pending_inputs()) == 0

    def test_multiple_commands(self, input_handler):
        """Test processing multiple commands."""
        commands = [
            InputCommand(InputCommandType.THRUST, 0.0),
            InputCommand(InputCommandType.ROTATE_LEFT, 0.0),
            InputCommand(InputCommandType.FIRE, 0.0)
        ]

        cmd_dicts = [c.to_dict() for c in commands]
        input_handler.process_inputs(cmd_dicts)

        pending = input_handler.get_pending_inputs()
        assert len(pending) == 3


class TestActiveInputTracking:
    """Test tracking currently active inputs."""

    def test_get_active_inputs(self, input_handler):
        """Test getting active inputs."""
        cmd = InputCommand(
            command_type=InputCommandType.THRUST,
            timestamp=0.0,
            intensity=0.8
        )

        input_handler.process_inputs([cmd.to_dict()])
        active = input_handler.get_active_inputs()

        assert len(active) == 1
        assert active[0].command_type == InputCommandType.THRUST

    def test_is_input_active(self, input_handler):
        """Test checking if input is active."""
        cmd = InputCommand(
            command_type=InputCommandType.FIRE,
            timestamp=0.0,
            duration=0.1
        )

        input_handler.process_inputs([cmd.to_dict()])

        assert input_handler.is_input_active(InputCommandType.FIRE)
        assert not input_handler.is_input_active(InputCommandType.THRUST)

    def test_get_input_intensity(self, input_handler):
        """Test getting input intensity."""
        cmd = InputCommand(
            command_type=InputCommandType.THRUST,
            timestamp=0.0,
            intensity=0.7
        )

        input_handler.process_inputs([cmd.to_dict()])

        intensity = input_handler.get_input_intensity(InputCommandType.THRUST)
        assert intensity == 0.7

    def test_get_input_intensity_inactive(self, input_handler):
        """Test intensity for inactive input."""
        intensity = input_handler.get_input_intensity("nonexistent")
        assert intensity == 0.0

    def test_clear_active_inputs_all(self, input_handler):
        """Test clearing all active inputs."""
        cmds = [
            InputCommand(InputCommandType.THRUST, 0.0),
            InputCommand(InputCommandType.FIRE, 0.0)
        ]

        cmd_dicts = [c.to_dict() for c in cmds]
        input_handler.process_inputs(cmd_dicts)

        assert len(input_handler.get_active_inputs()) > 0

        input_handler.clear_active_inputs()

        assert len(input_handler.get_active_inputs()) == 0

    def test_clear_active_inputs_specific(self, input_handler):
        """Test clearing specific active input."""
        cmds = [
            InputCommand(InputCommandType.THRUST, 0.0),
            InputCommand(InputCommandType.FIRE, 0.0)
        ]

        cmd_dicts = [c.to_dict() for c in cmds]
        input_handler.process_inputs(cmd_dicts)

        input_handler.clear_active_inputs(InputCommandType.THRUST)

        active = input_handler.get_active_inputs()
        assert len(active) == 1
        assert active[0].command_type == InputCommandType.FIRE


class TestCallbackSystem:
    """Test input callback registration."""

    def test_register_and_trigger_callback(self, input_handler):
        """Test registering and triggering callback."""
        callback = Mock()
        input_handler.register_callback(InputCommandType.FIRE, callback)

        cmd = InputCommand(InputCommandType.FIRE, 0.0)
        input_handler.process_inputs([cmd.to_dict()])

        callback.assert_called_once()

    def test_multiple_callbacks(self, input_handler):
        """Test multiple callbacks for same input."""
        callback1 = Mock()
        callback2 = Mock()

        input_handler.register_callback(InputCommandType.FIRE, callback1)
        input_handler.register_callback(InputCommandType.FIRE, callback2)

        cmd = InputCommand(InputCommandType.FIRE, 0.0)
        input_handler.process_inputs([cmd.to_dict()])

        callback1.assert_called_once()
        callback2.assert_called_once()

    def test_callback_different_inputs(self, input_handler):
        """Test callbacks for different input types."""
        fire_callback = Mock()
        thrust_callback = Mock()

        input_handler.register_callback(InputCommandType.FIRE, fire_callback)
        input_handler.register_callback(InputCommandType.THRUST, thrust_callback)

        cmds = [
            InputCommand(InputCommandType.FIRE, 0.0),
            InputCommand(InputCommandType.THRUST, 0.0)
        ]

        cmd_dicts = [c.to_dict() for c in cmds]
        input_handler.process_inputs(cmd_dicts)

        fire_callback.assert_called_once()
        thrust_callback.assert_called_once()


class TestStatistics:
    """Test input handler statistics."""

    def test_get_stats(self, input_handler):
        """Test getting statistics."""
        cmd = InputCommand(InputCommandType.FIRE, 0.0)
        input_handler.process_inputs([cmd.to_dict()])

        stats = input_handler.get_stats()

        assert "pending_inputs" in stats
        assert "active_inputs" in stats
        assert "processed_count" in stats
        assert stats["pending_inputs"] == 1

    def test_stats_after_clear(self, input_handler, sample_command):
        """Test stats after clearing buffer."""
        input_handler.process_inputs([sample_command.to_dict()])
        input_handler.clear_buffer()

        stats = input_handler.get_stats()
        assert stats["processed_count"] == 1


class TestInputHandlerRepresentation:
    """Test input handler representation."""

    def test_repr(self, input_handler):
        """Test string representation."""
        repr_str = repr(input_handler)
        assert "InputHandler" in repr_str
        assert "pending" in repr_str


class TestInputCommandTypes:
    """Test input command type enum."""

    def test_all_command_types(self):
        """Test all command type values."""
        types = [
            InputCommandType.THRUST,
            InputCommandType.ROTATE_LEFT,
            InputCommandType.ROTATE_RIGHT,
            InputCommandType.FIRE,
            InputCommandType.SPECIAL,
            InputCommandType.PAUSE,
            InputCommandType.RESUME,
            InputCommandType.QUIT
        ]

        assert len(types) >= 8

    def test_command_type_values(self):
        """Test command type string values."""
        assert InputCommandType.THRUST.value == "thrust"
        assert InputCommandType.FIRE.value == "fire"
        assert InputCommandType.PAUSE.value == "pause"


class TestErrorHandling:
    """Test error handling."""

    def test_invalid_command_dict(self, input_handler):
        """Test handling invalid command dict."""
        invalid_dict = {"invalid": "data"}

        # Should not raise, just silently handle
        input_handler.process_inputs([invalid_dict])

    def test_callback_error_doesnt_break_handler(self, input_handler):
        """Test callback error doesn't break handler."""
        def failing_callback(cmd):
            raise ValueError("Callback error")

        input_handler.register_callback(InputCommandType.FIRE, failing_callback)

        cmd = InputCommand(InputCommandType.FIRE, 0.0)

        # Should not raise
        input_handler.process_inputs([cmd.to_dict()])
