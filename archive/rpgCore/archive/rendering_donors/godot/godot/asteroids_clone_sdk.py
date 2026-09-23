"""
Asteroids Clone SDK - Python IPC Bridge for C# Godot Rendering.

SOLID Principle: Single Responsibility
- Only responsible for IPC communication with Godot renderer
- Does not handle game logic (that's in asteroids_game.py)
- Does not handle rendering (that's Godot's job)

Architecture:
- Socket-based client for connecting to Godot server
- JSON serialization for cross-language communication
- Message queue for buffering game state updates
- Type-safe DTO conversion between Python and C#
- Async support for non-blocking communication
"""

import socket
import json
import threading
import time
import queue
from typing import Dict, Any, Optional, List, Callable
from dataclasses import dataclass, asdict
from enum import Enum
from datetime import datetime


class MessageType(str, Enum):
    """IPC message types for Godot communication."""
    FRAME_UPDATE = "frame_update"
    INPUT_REQUEST = "input_request"
    COMMAND = "command"
    HANDSHAKE = "handshake"
    ACK = "ack"
    ERROR = "error"
    SHUTDOWN = "shutdown"


class ConnectionState(str, Enum):
    """Connection states."""
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    ERROR = "error"
    CLOSED = "closed"


@dataclass
class Message:
    """IPC message structure."""
    type: str
    payload: Dict[str, Any]
    timestamp: float = None
    sequence_id: int = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()
        if self.sequence_id is None:
            self.sequence_id = 0

    def to_json(self) -> str:
        """Serialize message to JSON."""
        return json.dumps({
            "type": self.type,
            "payload": self.payload,
            "timestamp": self.timestamp,
            "sequence_id": self.sequence_id
        })

    @staticmethod
    def from_json(json_str: str) -> "Message":
        """Deserialize message from JSON."""
        data = json.loads(json_str)
        return Message(
            type=data["type"],
            payload=data["payload"],
            timestamp=data.get("timestamp"),
            sequence_id=data.get("sequence_id")
        )


class AsteroidsSDK:
    """
    Python SDK for communicating with Godot Asteroids renderer.

    Responsibilities:
    - Establish socket connection to Godot server
    - Send frame updates (entity states, HUD data)
    - Receive input commands from renderer
    - Handle connection state and error conditions
    - Provide queue-based interface for game loop integration

    Does NOT handle:
    - Game logic (spawning, collision, etc.)
    - Rendering (that's Godot's responsibility)
    - Input processing (just forwards commands)
    """

    def __init__(
        self,
        host: str = "localhost",
        port: int = 9001,
        buffer_size: int = 65536,
        timeout: float = 5.0
    ):
        """
        Initialize the Asteroids SDK.

        Args:
            host: Server hostname (default: localhost)
            port: Server port (default: 9001)
            buffer_size: Socket buffer size in bytes
            timeout: Connection timeout in seconds
        """
        self.host = host
        self.port = port
        self.buffer_size = buffer_size
        self.timeout = timeout

        self.socket: Optional[socket.socket] = None
        self.state = ConnectionState.DISCONNECTED

        # Message queues
        self.send_queue: queue.Queue = queue.Queue(maxsize=100)
        self.input_queue: queue.Queue = queue.Queue(maxsize=100)

        # Threading
        self.send_thread: Optional[threading.Thread] = None
        self.receive_thread: Optional[threading.Thread] = None
        self._running = False

        # Connection callbacks
        self.on_connected: Optional[Callable] = None
        self.on_disconnected: Optional[Callable] = None
        self.on_input_received: Optional[Callable[[List[Dict[str, Any]]], None]] = None
        self.on_error: Optional[Callable[[str], None]] = None

        # Statistics
        self.messages_sent = 0
        self.messages_received = 0
        self.bytes_sent = 0
        self.bytes_received = 0

    def connect(self) -> bool:
        """
        Connect to Godot server.

        Returns:
            True if connection successful, False otherwise
        """
        try:
            self.state = ConnectionState.CONNECTING

            # Create socket
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.settimeout(self.timeout)

            # Connect to server
            self.socket.connect((self.host, self.port))
            self.state = ConnectionState.CONNECTED
            self._running = True

            # Send handshake
            handshake = Message(
                type=MessageType.HANDSHAKE,
                payload={
                    "sdk_version": "1.0.0",
                    "protocol_version": "1.0"
                }
            )
            self._send_message_raw(handshake)

            # Start threads
            self.send_thread = threading.Thread(target=self._send_worker, daemon=True)
            self.receive_thread = threading.Thread(target=self._receive_worker, daemon=True)

            self.send_thread.start()
            self.receive_thread.start()

            if self.on_connected:
                self.on_connected()

            return True

        except Exception as e:
            self.state = ConnectionState.ERROR
            if self.on_error:
                self.on_error(f"Connection failed: {str(e)}")
            return False

    def disconnect(self) -> None:
        """Disconnect from Godot server."""
        try:
            self._running = False

            if self.socket:
                # Send shutdown message
                shutdown_msg = Message(
                    type=MessageType.SHUTDOWN,
                    payload={"reason": "client_disconnect"}
                )
                self._send_message_raw(shutdown_msg)

                self.socket.close()

            self.state = ConnectionState.CLOSED

            if self.on_disconnected:
                self.on_disconnected()

        except Exception as e:
            if self.on_error:
                self.on_error(f"Disconnect error: {str(e)}")

    def send_frame(
        self,
        entities: List[Dict[str, Any]],
        hud: Dict[str, Any]
    ) -> bool:
        """
        Send frame update to Godot renderer.

        Args:
            entities: List of entity DTOs
            hud: HUD state DTO

        Returns:
            True if queued successfully
        """
        try:
            frame_data = {
                "entities": entities,
                "hud": hud,
                "frame_number": self._get_frame_number()
            }

            message = Message(
                type=MessageType.FRAME_UPDATE,
                payload=frame_data
            )

            self.send_queue.put_nowait(message)
            return True

        except queue.Full:
            if self.on_error:
                self.on_error("Send queue full")
            return False

    def get_inputs(self) -> List[Dict[str, Any]]:
        """
        Get pending input commands from renderer.

        Returns:
            List of input command DTOs
        """
        inputs = []
        try:
            while True:
                input_cmd = self.input_queue.get_nowait()
                inputs.append(input_cmd)
        except queue.Empty:
            pass

        return inputs

    def _send_worker(self) -> None:
        """Background thread for sending messages."""
        while self._running:
            try:
                # Get message from queue (with timeout to allow checks)
                message = self.send_queue.get(timeout=0.1)
                self._send_message_raw(message)

            except queue.Empty:
                continue

            except Exception as e:
                self.state = ConnectionState.ERROR
                if self.on_error:
                    self.on_error(f"Send worker error: {str(e)}")
                break

    def _receive_worker(self) -> None:
        """Background thread for receiving messages."""
        buffer = ""

        while self._running:
            try:
                # Receive data from socket
                data = self.socket.recv(self.buffer_size)

                if not data:
                    # Server closed connection
                    self.state = ConnectionState.CLOSED
                    self._running = False
                    if self.on_disconnected:
                        self.on_disconnected()
                    break

                self.bytes_received += len(data)
                buffer += data.decode('utf-8')

                # Process complete messages (delimited by newline)
                while '\n' in buffer:
                    line, buffer = buffer.split('\n', 1)
                    if line.strip():
                        self._process_message(line)

            except socket.timeout:
                # Timeout is OK, just retry
                continue

            except Exception as e:
                self.state = ConnectionState.ERROR
                if self.on_error:
                    self.on_error(f"Receive worker error: {str(e)}")
                break

    def _send_message_raw(self, message: Message) -> None:
        """Send message through socket."""
        if not self.socket or self.state != ConnectionState.CONNECTED:
            return

        try:
            json_data = message.to_json() + '\n'
            self.socket.sendall(json_data.encode('utf-8'))

            self.messages_sent += 1
            self.bytes_sent += len(json_data)

        except Exception as e:
            self.state = ConnectionState.ERROR
            if self.on_error:
                self.on_error(f"Failed to send message: {str(e)}")

    def _process_message(self, json_str: str) -> None:
        """Process received message from Godot."""
        try:
            message = Message.from_json(json_str)
            self.messages_received += 1

            if message.type == MessageType.INPUT_REQUEST:
                # Queue input commands
                inputs = message.payload.get("inputs", [])
                for input_cmd in inputs:
                    try:
                        self.input_queue.put_nowait(input_cmd)
                    except queue.Full:
                        pass

                if self.on_input_received:
                    self.on_input_received(inputs)

            elif message.type == MessageType.ACK:
                # Acknowledge receipt - typically for flow control
                pass

            elif message.type == MessageType.ERROR:
                error_msg = message.payload.get("message", "Unknown error")
                if self.on_error:
                    self.on_error(f"Server error: {error_msg}")

        except Exception as e:
            if self.on_error:
                self.on_error(f"Failed to process message: {str(e)}")

    def get_connection_state(self) -> str:
        """Get current connection state."""
        return self.state.value

    def is_connected(self) -> bool:
        """Check if connected to server."""
        return self.state == ConnectionState.CONNECTED

    def get_stats(self) -> Dict[str, Any]:
        """Get communication statistics."""
        return {
            "state": self.state.value,
            "messages_sent": self.messages_sent,
            "messages_received": self.messages_received,
            "bytes_sent": self.bytes_sent,
            "bytes_received": self.bytes_received,
            "send_queue_size": self.send_queue.qsize(),
            "input_queue_size": self.input_queue.qsize(),
            "connection_uptime": self._get_connection_uptime()
        }

    def _get_frame_number(self) -> int:
        """Get frame number (based on messages sent)."""
        return self.messages_sent

    def _get_connection_uptime(self) -> float:
        """Get connection uptime in seconds."""
        if self.state == ConnectionState.CONNECTED:
            return time.time() - self._connect_time if hasattr(self, '_connect_time') else 0
        return 0

    def __repr__(self) -> str:
        return (
            f"AsteroidsSDK(host={self.host}, port={self.port}, "
            f"state={self.state.value}, sent={self.messages_sent}, "
            f"received={self.messages_received})"
        )

    def __enter__(self):
        """Context manager support."""
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager cleanup."""
        self.disconnect()
