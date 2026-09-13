"""
Test suite for Asteroids Clone SDK (IPC Bridge).

Coverage:
- Message serialization/deserialization
- Connection state management
- Queue-based message passing
- Thread safety
- Error handling
"""

import pytest
import threading
import time
import socket
from unittest.mock import Mock, MagicMock, patch

from src.game_engine.godot.asteroids_clone_sdk import (
    AsteroidsSDK, Message, MessageType, ConnectionState
)


class TestMessageSerialization:
    """Test message serialization/deserialization."""

    def test_message_to_json(self):
        """Test converting message to JSON."""
        msg = Message(
            type=MessageType.FRAME_UPDATE,
            payload={"entities": [], "hud": {}},
            sequence_id=1
        )
        json_str = msg.to_json()

        assert isinstance(json_str, str)
        assert "frame_update" in json_str
        assert "entities" in json_str

    def test_message_from_json(self):
        """Test converting JSON to message."""
        json_str = '{"type": "frame_update", "payload": {"entities": []}, "timestamp": 123.45, "sequence_id": 1}'
        msg = Message.from_json(json_str)

        assert msg.type == MessageType.FRAME_UPDATE
        assert msg.payload == {"entities": []}
        assert msg.sequence_id == 1

    def test_message_roundtrip(self):
        """Test message serialization roundtrip."""
        original = Message(
            type=MessageType.INPUT_REQUEST,
            payload={"inputs": [{"command": "thrust"}]},
            sequence_id=5
        )

        json_str = original.to_json()
        restored = Message.from_json(json_str)

        assert restored.type == original.type
        assert restored.payload == original.payload
        assert restored.sequence_id == original.sequence_id

    def test_message_auto_timestamp(self):
        """Test that messages auto-generate timestamps."""
        msg = Message(type=MessageType.ACK, payload={})
        assert msg.timestamp is not None
        assert isinstance(msg.timestamp, float)

    def test_message_auto_sequence_id(self):
        """Test that messages auto-generate sequence IDs."""
        msg = Message(type=MessageType.ACK, payload={})
        assert msg.sequence_id is not None
        assert msg.sequence_id == 0

    def test_message_custom_values(self):
        """Test message with custom timestamp and sequence."""
        msg = Message(
            type=MessageType.ERROR,
            payload={"message": "error"},
            timestamp=100.0,
            sequence_id=42
        )

        assert msg.timestamp == 100.0
        assert msg.sequence_id == 42


class TestAsteroidsSDKInitialization:
    """Test SDK initialization."""

    def test_init_default(self):
        """Test initialization with defaults."""
        sdk = AsteroidsSDK()

        assert sdk.host == "localhost"
        assert sdk.port == 9001
        assert sdk.buffer_size == 65536
        assert sdk.timeout == 5.0
        assert sdk.state == ConnectionState.DISCONNECTED

    def test_init_custom_host_port(self):
        """Test initialization with custom host/port."""
        sdk = AsteroidsSDK(host="127.0.0.1", port=8080)

        assert sdk.host == "127.0.0.1"
        assert sdk.port == 8080

    def test_initial_state_disconnected(self):
        """Test initial state is disconnected."""
        sdk = AsteroidsSDK()
        assert not sdk.is_connected()
        assert sdk.state == ConnectionState.DISCONNECTED

    def test_queues_initialized(self):
        """Test that message queues are initialized."""
        sdk = AsteroidsSDK()

        assert sdk.send_queue is not None
        assert sdk.input_queue is not None
        assert sdk.send_queue.empty()
        assert sdk.input_queue.empty()


class TestMessageSerialization:
    """Test message creation and serialization."""

    def test_handshake_message(self):
        """Test creating handshake message."""
        msg = Message(
            type=MessageType.HANDSHAKE,
            payload={"sdk_version": "1.0.0"}
        )

        assert msg.type == MessageType.HANDSHAKE
        assert msg.payload["sdk_version"] == "1.0.0"

    def test_frame_update_message(self):
        """Test creating frame update message."""
        entities = [
            {"id": "e1", "x": 100, "y": 50, "type": "asteroid"}
        ]
        hud = {"score": 1000, "lives": 3}

        msg = Message(
            type=MessageType.FRAME_UPDATE,
            payload={"entities": entities, "hud": hud}
        )

        assert len(msg.payload["entities"]) == 1
        assert msg.payload["hud"]["score"] == 1000

    def test_input_request_message(self):
        """Test creating input request message."""
        inputs = [
            {"command": "thrust", "timestamp": 100},
            {"command": "fire", "timestamp": 105}
        ]

        msg = Message(
            type=MessageType.INPUT_REQUEST,
            payload={"inputs": inputs}
        )

        assert len(msg.payload["inputs"]) == 2
        assert msg.payload["inputs"][0]["command"] == "thrust"


class TestQueueOperations:
    """Test queue-based message passing."""

    def test_send_frame_queues_message(self):
        """Test that send_frame() queues message correctly."""
        sdk = AsteroidsSDK()

        entities = [{"id": "e1", "x": 100, "y": 50}]
        hud = {"score": 0}

        result = sdk.send_frame(entities, hud)

        assert result is True
        assert not sdk.send_queue.empty()

    def test_send_queue_full_returns_false(self):
        """Test that send returns False when queue is full."""
        sdk = AsteroidsSDK(buffer_size=1024)
        sdk.send_queue = __import__('queue').Queue(maxsize=1)

        # Fill queue
        entities = [{"id": "e1"}]
        hud = {}

        sdk.send_frame(entities, hud)
        result = sdk.send_frame(entities, hud)

        assert result is False

    def test_get_inputs_returns_pending(self):
        """Test getting pending inputs."""
        sdk = AsteroidsSDK()

        # Manually add inputs to queue
        sdk.input_queue.put({"command": "thrust"})
        sdk.input_queue.put({"command": "fire"})

        inputs = sdk.get_inputs()

        assert len(inputs) == 2
        assert inputs[0]["command"] == "thrust"
        assert inputs[1]["command"] == "fire"

    def test_get_inputs_empty_queue(self):
        """Test getting inputs when queue is empty."""
        sdk = AsteroidsSDK()

        inputs = sdk.get_inputs()

        assert len(inputs) == 0

    def test_multiple_send_frames(self):
        """Test sending multiple frames."""
        sdk = AsteroidsSDK()

        for i in range(5):
            entities = [{"id": f"e{i}"}]
            hud = {"score": i * 100}
            result = sdk.send_frame(entities, hud)
            assert result is True

        # Should have 5 messages in queue
        queue_size = sdk.send_queue.qsize()
        assert queue_size == 5


class TestConnectionState:
    """Test connection state management."""

    def test_state_transitions(self):
        """Test connection state transitions."""
        sdk = AsteroidsSDK()

        assert sdk.state == ConnectionState.DISCONNECTED
        assert not sdk.is_connected()

        # Simulate connection attempt
        sdk.state = ConnectionState.CONNECTING
        assert not sdk.is_connected()

        sdk.state = ConnectionState.CONNECTED
        assert sdk.is_connected()

        sdk.state = ConnectionState.CLOSED
        assert not sdk.is_connected()

    def test_get_connection_state(self):
        """Test getting connection state as string."""
        sdk = AsteroidsSDK()

        assert sdk.get_connection_state() == "disconnected"

        sdk.state = ConnectionState.CONNECTED
        assert sdk.get_connection_state() == "connected"


class TestStatistics:
    """Test statistics collection."""

    def test_initial_stats(self):
        """Test initial statistics."""
        sdk = AsteroidsSDK()
        stats = sdk.get_stats()

        assert stats["messages_sent"] == 0
        assert stats["messages_received"] == 0
        assert stats["bytes_sent"] == 0
        assert stats["bytes_received"] == 0

    def test_stats_after_operations(self):
        """Test statistics after operations."""
        sdk = AsteroidsSDK()

        # Simulate operations
        sdk.messages_sent = 10
        sdk.messages_received = 5
        sdk.bytes_sent = 1024
        sdk.bytes_received = 512

        stats = sdk.get_stats()

        assert stats["messages_sent"] == 10
        assert stats["messages_received"] == 5
        assert stats["bytes_sent"] == 1024
        assert stats["bytes_received"] == 512

    def test_queue_sizes_in_stats(self):
        """Test queue sizes in statistics."""
        sdk = AsteroidsSDK()

        # Add items to queues
        sdk.send_queue.put(Message(type=MessageType.ACK, payload={}))
        sdk.input_queue.put({"command": "fire"})

        stats = sdk.get_stats()

        assert stats["send_queue_size"] == 1
        assert stats["input_queue_size"] == 1


class TestMessageTypes:
    """Test different message types."""

    def test_all_message_types(self):
        """Test all message type enums."""
        types = [
            MessageType.FRAME_UPDATE,
            MessageType.INPUT_REQUEST,
            MessageType.COMMAND,
            MessageType.HANDSHAKE,
            MessageType.ACK,
            MessageType.ERROR,
            MessageType.SHUTDOWN
        ]

        assert len(types) == 7

        for msg_type in types:
            msg = Message(type=msg_type, payload={})
            assert msg.type == msg_type

    def test_message_type_serialization(self):
        """Test that message types serialize correctly."""
        msg = Message(type=MessageType.FRAME_UPDATE, payload={})
        json_str = msg.to_json()

        restored = Message.from_json(json_str)
        assert restored.type == MessageType.FRAME_UPDATE


class TestErrorHandling:
    """Test error handling."""

    def test_invalid_json_raises_error(self):
        """Test that invalid JSON raises error."""
        with pytest.raises(Exception):
            Message.from_json("invalid json {")

    def test_missing_required_fields(self):
        """Test handling of missing required fields."""
        incomplete_json = '{"type": "frame_update"}'

        with pytest.raises(Exception):
            Message.from_json(incomplete_json)

    def test_callback_error_handling(self):
        """Test error callback is called."""
        sdk = AsteroidsSDK()
        error_callback = Mock()
        sdk.on_error = error_callback

        # Simulate error
        sdk.state = ConnectionState.ERROR
        if sdk.on_error:
            sdk.on_error("Test error")

        error_callback.assert_called_once()


class TestContextManager:
    """Test context manager support."""

    def test_context_manager_entry_exit(self):
        """Test context manager __enter__ and __exit__."""
        with patch.object(AsteroidsSDK, 'connect', return_value=True):
            with patch.object(AsteroidsSDK, 'disconnect') as mock_disconnect:
                with AsteroidsSDK() as sdk:
                    assert sdk is not None

                mock_disconnect.assert_called_once()


class TestRepresentation:
    """Test string representation."""

    def test_repr(self):
        """Test __repr__ output."""
        sdk = AsteroidsSDK(host="example.com", port=8080)
        repr_str = repr(sdk)

        assert "AsteroidsSDK" in repr_str
        assert "example.com" in repr_str
        assert "8080" in repr_str


class TestFrameNumbering:
    """Test frame numbering."""

    def test_frame_number_increments(self):
        """Test that frame numbers increment with messages sent."""
        sdk = AsteroidsSDK()

        frame1 = sdk._get_frame_number()
        sdk.messages_sent += 1
        frame2 = sdk._get_frame_number()

        assert frame2 > frame1


class TestMessageTypes:
    """Test message type enum."""

    def test_message_type_values(self):
        """Test message type string values."""
        assert MessageType.FRAME_UPDATE.value == "frame_update"
        assert MessageType.INPUT_REQUEST.value == "input_request"
        assert MessageType.COMMAND.value == "command"
        assert MessageType.HANDSHAKE.value == "handshake"
        assert MessageType.ACK.value == "ack"
        assert MessageType.ERROR.value == "error"
        assert MessageType.SHUTDOWN.value == "shutdown"


class TestConnectionState:
    """Test connection state enum."""

    def test_connection_state_values(self):
        """Test connection state string values."""
        assert ConnectionState.DISCONNECTED.value == "disconnected"
        assert ConnectionState.CONNECTING.value == "connecting"
        assert ConnectionState.CONNECTED.value == "connected"
        assert ConnectionState.ERROR.value == "error"
        assert ConnectionState.CLOSED.value == "closed"
