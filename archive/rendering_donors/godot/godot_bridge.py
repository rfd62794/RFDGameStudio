"""
GodotBridge - Generic IPC Bridge for C# Godot Rendering.

SOLID Principle: Single Responsibility
- Only responsible for IPC communication with Godot renderer
- Decoupled from specific game logic

Architecture:
- Socket-based client for connecting to Godot server
- JSON serialization for cross-language communication
- Message queue for buffering game state updates
- Thread-safe operation
"""

import socket
import json
import threading
import time
import queue
from typing import Dict, Any, Optional, List, Callable,  Union
from dataclasses import dataclass, field
from enum import Enum
from loguru import logger

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
class BridgeMessage:
    """IPC message structure."""
    type: str
    payload: Dict[str, Any]
    timestamp: float = field(default_factory=time.time)
    sequence_id: int = 0

    def to_json(self) -> str:
        """Serialize message to JSON."""
        return json.dumps({
            "type": self.type,
            "payload": self.payload,
            "timestamp": self.timestamp,
            "sequence_id": self.sequence_id
        })

    @staticmethod
    def from_json(json_str: str) -> "BridgeMessage":
        """Deserialize message from JSON."""
        data = json.loads(json_str)
        return BridgeMessage(
            type=data["type"],
            payload=data["payload"],
            timestamp=data.get("timestamp", time.time()),
            sequence_id=data.get("sequence_id", 0)
        )

class GodotBridge:
    """
    Generic Bridge for communicating with Godot renderer.
    """

    _instance: Optional['GodotBridge'] = None
    _lock: threading.Lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
        return cls._instance

    def __init__(
        self,
        host: str = "localhost",
        port: int = 9001,
        buffer_size: int = 65536,
        timeout: float = 5.0
    ):
        if getattr(self, '_initialized', False):
            return

        self.host = host
        self.port = port
        self.buffer_size = buffer_size
        self.timeout = timeout

        self.socket: Optional[socket.socket] = None
        self.state = ConnectionState.DISCONNECTED

        # Message queues
        self.send_queue: queue.Queue = queue.Queue(maxsize=200)
        self.input_queue: queue.Queue = queue.Queue(maxsize=100)

        # Threading
        self.send_thread: Optional[threading.Thread] = None
        self.receive_thread: Optional[threading.Thread] = None
        self._running = False
        self._shutdown_event = threading.Event()

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
        self._connect_time = 0.0

        self._initialized = True
        logger.info(f"GodotBridge initialized (Target: {host}:{port})")

    def connect(self) -> bool:
        """Connect to Godot server."""
        if self.state == ConnectionState.CONNECTED:
            return True

        try:
            self.state = ConnectionState.CONNECTING
            logger.info("Connecting to Godot server...")

            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.settimeout(self.timeout)
            self.socket.connect((self.host, self.port))
            
            self.state = ConnectionState.CONNECTED
            self._running = True
            self._shutdown_event.clear()
            self._connect_time = time.time()

            # Send handshake
            handshake = BridgeMessage(
                type=MessageType.HANDSHAKE,
                payload={
                    "sdk_version": "2.0.0",
                    "protocol_version": "1.0",
                    "client": "GodotBridge"
                }
            )
            self._send_message_raw(handshake)

            # Start threads
            self.send_thread = threading.Thread(target=self._send_worker, daemon=True, name="GodotBridge-Send")
            self.receive_thread = threading.Thread(target=self._receive_worker, daemon=True, name="GodotBridge-Receive")

            self.send_thread.start()
            self.receive_thread.start()

            logger.info("Connected to Godot server")
            if self.on_connected:
                self.on_connected()

            return True

        except Exception as e:
            self.state = ConnectionState.ERROR
            logger.error(f"Godot connection failed: {e}")
            if self.on_error:
                self.on_error(f"Connection failed: {str(e)}")
            return False

    def disconnect(self) -> None:
        """Disconnect from Godot server."""
        if not self._running:
            return

        try:
            self._running = False
            self._shutdown_event.set()

            if self.socket:
                try:
                    shutdown_msg = BridgeMessage(
                        type=MessageType.SHUTDOWN,
                        payload={"reason": "client_disconnect"}
                    )
                    self._send_message_raw(shutdown_msg)
                except:
                    pass
                
                self.socket.close()

            self.state = ConnectionState.CLOSED
            logger.info("Disconnected from Godot server")

            if self.on_disconnected:
                self.on_disconnected()

        except Exception as e:
            logger.error(f"Godot disconnect error: {e}")

    def send_frame(self, entities: List[Dict[str, Any]], hud: Dict[str, Any], particles: Optional[List[Dict[str, Any]]] = None) -> bool:
        """
        Send frame update to Godot renderer.
        """
        if not self.is_connected():
            return False

        try:
            frame_data = {
                "entities": entities,
                "particles": particles or [],
                "hud": hud,
                "frame_number": self.messages_sent
            }

            message = BridgeMessage(
                type=MessageType.FRAME_UPDATE,
                payload=frame_data
            )

            self.send_queue.put_nowait(message)
            return True

        except queue.Full:
            logger.warning("GodotBridge send queue full - dropping frame")
            return False

    def get_inputs(self) -> List[Dict[str, Any]]:
        """Get pending input commands from renderer."""
        inputs = []
        try:
            while True:
                inputs.append(self.input_queue.get_nowait())
        except queue.Empty:
            pass
        return inputs

    def is_connected(self) -> bool:
        return self.state == ConnectionState.CONNECTED and self._running

    def _send_worker(self) -> None:
        """Background thread for sending messages."""
        while self._running:
            try:
                # Wait for message with short timeout to check running state
                try:
                    message = self.send_queue.get(timeout=0.1)
                except queue.Empty:
                    continue

                self._send_message_raw(message)

            except Exception as e:
                logger.error(f"GodotBridge send worker error: {e}")
                self.state = ConnectionState.ERROR
                break

    def _receive_worker(self) -> None:
        """Background thread for receiving messages."""
        buffer = ""
        while self._running:
            try:
                if not self.socket:
                    break

                try:
                    data = self.socket.recv(self.buffer_size)
                except socket.timeout:
                    continue
                except ConnectionResetError:
                    logger.warning("Godot server reset connection")
                    self.disconnect()
                    break

                if not data:
                    logger.info("Godot server closed connection")
                    self.disconnect()
                    break

                self.bytes_received += len(data)
                buffer += data.decode('utf-8')

                while '\n' in buffer:
                    line, buffer = buffer.split('\n', 1)
                    if line.strip():
                        self._process_message(line)

            except Exception as e:
                if self._running:
                    logger.error(f"GodotBridge receive worker error: {e}")
                    self.state = ConnectionState.ERROR
                break

    def _send_message_raw(self, message: BridgeMessage) -> None:
        """Send message through socket with length prefix."""
        if not self.socket:
            return

        try:
            json_data = message.to_json()
            encoded_data = json_data.encode('utf-8')
            
            # Send 4-byte length prefix (Network Byte Order / Big Endian)
            length_prefix = len(encoded_data).to_bytes(4, byteorder='big')
            
            self.socket.sendall(length_prefix + encoded_data)
            
            self.messages_sent += 1
            self.bytes_sent += len(length_prefix) + len(encoded_data)
        except Exception as e:
            logger.error(f"GodotBridge raw send error: {e}")
            raise

    def _process_message(self, json_str: str) -> None:
        """Process received message from Godot."""
        try:
            message = BridgeMessage.from_json(json_str)
            self.messages_received += 1

            if message.type == MessageType.INPUT_REQUEST:
                inputs = message.payload.get("inputs", [])
                for input_cmd in inputs:
                    try:
                        self.input_queue.put_nowait(input_cmd)
                    except queue.Full:
                        pass
                if self.on_input_received:
                    self.on_input_received(inputs)

            elif message.type == MessageType.ERROR:
                error_msg = message.payload.get("message", "Unknown error")
                logger.error(f"Godot reported error: {error_msg}")
                if self.on_error:
                    self.on_error(error_msg)

        except Exception as e:
            logger.error(f"Failed to process Godot message: {e}")
