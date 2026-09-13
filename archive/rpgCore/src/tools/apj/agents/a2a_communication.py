"""
Agent-to-Agent Communication System
Enables direct communication between agents with message routing and protocols
"""

import logging
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass
from enum import Enum
import uuid
from datetime import datetime
import json

from .agent_registry import AGENT_REGISTRY
from .child_agent import CHILD_AGENT_MANAGER

logger = logging.getLogger(__name__)

class MessageType(Enum):
    """Message types for A2A communication"""
    REQUEST = "request"
    RESPONSE = "response"
    NOTIFICATION = "notification"
    BROADCAST = "broadcast"
    TASK = "task"
    RESULT = "result"

class MessagePriority(Enum):
    """Message priority levels"""
    LOW = 1
    NORMAL = 2
    HIGH = 3
    URGENT = 4

@dataclass
class A2AMessage:
    """Agent-to-Agent message"""
    id: str
    sender: str
    recipient: str
    message_type: MessageType
    priority: MessagePriority
    content: Dict[str, Any]
    timestamp: datetime
    reply_to: Optional[str] = None
    expires_at: Optional[datetime] = None
    metadata: Dict[str, Any] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert message to dictionary"""
        return {
            "id": self.id,
            "sender": self.sender,
            "recipient": self.recipient,
            "message_type": self.message_type.value,
            "priority": self.priority.value,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "reply_to": self.reply_to,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "metadata": self.metadata or {}
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "A2AMessage":
        """Create message from dictionary"""
        return cls(
            id=data["id"],
            sender=data["sender"],
            recipient=data["recipient"],
            message_type=MessageType(data["message_type"]),
            priority=MessagePriority(data["priority"]),
            content=data["content"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
            reply_to=data.get("reply_to"),
            expires_at=datetime.fromisoformat(data["expires_at"]) if data.get("expires_at") else None,
            metadata=data.get("metadata", {})
        )

class MessageHandler:
    """Base class for message handlers"""
    
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.handlers: Dict[MessageType, Callable] = {}
    
    def register_handler(self, message_type: MessageType, handler: Callable):
        """Register a message handler"""
        self.handlers[message_type] = handler
    
    def handle_message(self, message: A2AMessage) -> Optional[A2AMessage]:
        """Handle incoming message"""
        handler = self.handlers.get(message.message_type)
        if handler:
            try:
                return handler(message)
            except Exception as e:
                # Create error response
                return A2AMessage(
                    id=str(uuid.uuid4()),
                    sender=self.agent_name,
                    recipient=message.sender,
                    message_type=MessageType.RESPONSE,
                    priority=MessagePriority.NORMAL,
                    content={"error": str(e), "original_message_id": message.id},
                    timestamp=datetime.now(),
                    reply_to=message.id
                )
        return None

class A2ACommunicationManager:
    """Manages agent-to-agent communication"""
    
    def __init__(self):
        self._message_handlers: Dict[str, MessageHandler] = {}
        self._message_queue: List[A2AMessage] = []
        self._sent_messages: Dict[str, A2AMessage] = {}
        self._max_queue_size = 1000
    
    def register_agent(self, agent_name: str, handler: MessageHandler):
        """Register an agent for A2A communication"""
        
        # Check if agent supports A2A communication
        if hasattr(handler, 'supports_a2a') and not handler.supports_a2a:
            handler.supports_a2a = True
        
        self._message_handlers[agent_name] = handler
        logger.info(f"🔗 Registered {agent_name} for A2A communication")
        if AGENT_REGISTRY.supports_a2a(agent_name) or agent_name in self._message_handlers:
            self._message_handlers[agent_name] = handler
    
    def send_message(self, sender: str, recipient: str, message_type: MessageType,
                    content: Dict[str, Any], priority: MessagePriority = MessagePriority.NORMAL,
                    reply_to: Optional[str] = None, expires_in_minutes: Optional[int] = None) -> str:
        """Send a message from one agent to another"""
        
        # Check if both agents support A2A or are registered
        sender_supports_a2a = AGENT_REGISTRY.supports_a2a(sender) or sender in self._message_handlers
        recipient_supports_a2a = AGENT_REGISTRY.supports_a2a(recipient) or recipient in self._message_handlers
        
        if not sender_supports_a2a:
            raise ValueError(f"Sender {sender} does not support A2A communication")
        
        if not recipient_supports_a2a:
            raise ValueError(f"Recipient {recipient} does not support A2A communication")
        
        # Create message
        message = A2AMessage(
            id=str(uuid.uuid4()),
            sender=sender,
            recipient=recipient,
            message_type=message_type,
            priority=priority,
            content=content,
            timestamp=datetime.now(),
            reply_to=reply_to,
            expires_at=datetime.now() + datetime.timedelta(minutes=expires_in_minutes) if expires_in_minutes else None
        )
        
        # Add to queue
        self._add_to_queue(message)
        
        # Store sent message
        self._sent_messages[message.id] = message
        
        return message.id
    
    def broadcast_message(self, sender: str, content: Dict[str, Any],
                        priority: MessagePriority = MessagePriority.NORMAL) -> str:
        """Broadcast message to all A2A-capable agents"""
        
        message_id = str(uuid.uuid4())
        recipients = [name for name in AGENT_REGISTRY.get_all_agents() 
                     if name != sender and AGENT_REGISTRY.supports_a2a(name)]
        
        for recipient in recipients:
            message = A2AMessage(
                id=message_id,
                sender=sender,
                recipient=recipient,
                message_type=MessageType.BROADCAST,
                priority=priority,
                content=content,
                timestamp=datetime.now()
            )
            self._add_to_queue(message)
        
        return message_id
    
    def _add_to_queue(self, message: A2AMessage):
        """Add message to queue with priority ordering"""
        if len(self._message_queue) >= self._max_queue_size:
            # Remove oldest lowest priority message
            self._message_queue.sort(key=lambda m: (m.priority.value, m.timestamp))
            self._message_queue.pop(0)
        
        self._message_queue.append(message)
        # Sort by priority (highest first) and timestamp
        self._message_queue.sort(key=lambda m: (-m.priority.value, m.timestamp))
    
    def process_messages(self) -> List[A2AMessage]:
        """Process all messages in queue"""
        processed = []
        
        while self._message_queue:
            message = self._message_queue.pop(0)
            
            # Check if message expired
            if message.expires_at and datetime.now() > message.expires_at:
                continue
            
            # Get recipient handler
            handler = self._message_handlers.get(message.recipient)
            if not handler:
                continue
            
            # Handle message
            response = handler.handle_message(message)
            if response:
                self._add_to_queue(response)
                processed.append(response)
            
            processed.append(message)
        
        return processed
    
    def get_message_history(self, agent_name: str) -> List[A2AMessage]:
        """Get message history for an agent"""
        messages = []
        
        # Get sent messages
        for message in self._sent_messages.values():
            if message.sender == agent_name or message.recipient == agent_name:
                messages.append(message)
        
        # Sort by timestamp
        messages.sort(key=lambda m: m.timestamp)
        return messages
    
    def get_pending_messages(self, agent_name: str) -> List[A2AMessage]:
        """Get pending messages for an agent"""
        return [m for m in self._message_queue if m.recipient == agent_name]
    
    def clear_expired_messages(self) -> int:
        """Clear expired messages"""
        now = datetime.now()
        expired_count = 0
        
        # Remove expired messages from queue
        self._message_queue = [m for m in self._message_queue 
                              if not (m.expires_at and now > m.expires_at)]
        
        # Remove expired sent messages
        expired_ids = [msg_id for msg_id, msg in self._sent_messages.items()
                      if msg.expires_at and now > msg.expires_at]
        
        for msg_id in expired_ids:
            del self._sent_messages[msg_id]
            expired_count += 1
        
        return expired_count

# Global A2A communication manager
A2A_MANAGER = A2ACommunicationManager()
