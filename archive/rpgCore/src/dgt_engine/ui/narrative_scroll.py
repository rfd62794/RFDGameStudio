"""
Narrative Scroll HUD System - ADR 106: Storytelling Interface
High-contrast narrative display with message priority and fading
"""

import tkinter as tk
import time
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
from loguru import logger


class MessagePriority(Enum):
    """Message priority levels"""
    BACKGROUND = 1    # Ambient descriptions
    NORMAL = 2       # Standard actions
    IMPORTANT = 3    # Key events
    CRITICAL = 4     # Major plot points


class MessageType(Enum):
    """Types of narrative messages"""
    MOVEMENT = "movement"
    INTERACTION = "interaction"
    DISCOVERY = "discovery"
    COMBAT = "combat"
    SYSTEM = "system"
    STORY = "story"


@dataclass
class NarrativeMessage:
    """Individual narrative message"""
    text: str
    message_type: MessageType
    priority: MessagePriority
    timestamp: float
    duration: float = 5.0  # Display duration in seconds
    color: str = "#ffffff"
    fade_in: float = 0.2
    fade_out: float = 0.5


class NarrativeScroll:
    """
    Narrative scroll system for displaying game events and story
    
    Features:
    - Priority-based message queuing
    - Color-coded message types
    - Smooth fade in/out transitions
    - Message history tracking
    - Auto-scrolling for long messages
    """
    
    def __init__(self, canvas: tk.Canvas, position: Tuple[int, int], size: Tuple[int, int]):
        self.canvas = canvas
        self.position = position
        self.size = size
        
        # Message management
        self.active_messages: List[NarrativeMessage] = []
        self.message_history: List[NarrativeMessage] = []
        self.max_active_messages = 8
        self.max_history = 50
        
        # Display configuration
        self.font_family = "Courier"
        self.font_size = 9
        self.line_height = 12
        self.padding = 10
        
        # Color scheme
        self.bg_color = "#0a0a0a"
        self.border_color = "#444444"
        self.title_color = "#00ff00"
        
        # Message type colors
        self.message_colors = {
            MessageType.MOVEMENT: "#888888",
            MessageType.INTERACTION: "#00ff00",
            MessageType.DISCOVERY: "#ffd700",
            MessageType.COMBAT: "#ff4444",
            MessageType.SYSTEM: "#00ffff",
            MessageType.STORY: "#ff69b4"
        }
        
        # Animation state
        self.last_update_time = time.time()
        self.canvas_items: Dict[str, int] = {}
        
        # Initialize display
        self._setup_scroll_display()
        
        logger.info("📜 Narrative scroll system initialized")
    
    def _setup_scroll_display(self) -> None:
        """Setup the visual scroll display"""
        x, y = self.position
        width, height = self.size
        
        # Background
        self.canvas_items["background"] = self.canvas.create_rectangle(
            x, y, x + width, y + height,
            fill=self.bg_color,
            outline=self.border_color,
            width=1,
            tags="narrative_scroll"
        )
        
        # Title area
        title_y = y + 5
        self.canvas_items["title"] = self.canvas.create_text(
            x + width // 2, title_y,
            text="📜 The Voyager's Chronicle",
            font=(self.font_family, self.font_size, "bold"),
            fill=self.title_color,
            tags="narrative_scroll"
        )
        
        # Message area start position
        self.message_start_y = title_y + 15
        
        logger.debug("🖼️ Narrative scroll display setup complete")
    
    def add_message(self, text: str, message_type: MessageType = MessageType.STORY, 
                   priority: MessagePriority = MessagePriority.NORMAL, 
                   duration: float = 5.0) -> None:
        """Add a new narrative message"""
        # Determine message color
        color = self.message_colors.get(message_type, "#ffffff")
        
        # Create message
        message = NarrativeMessage(
            text=text,
            message_type=message_type,
            priority=priority,
            timestamp=time.time(),
            duration=duration,
            color=color
        )
        
        # Add to active messages
        self.active_messages.append(message)
        
        # Insert based on priority (higher priority first)
        self.active_messages.sort(key=lambda m: m.priority.value, reverse=True)
        
        # Limit active messages
        if len(self.active_messages) > self.max_active_messages:
            # Remove oldest lower priority messages
            removed = self.active_messages[self.max_active_messages:]
            self.active_messages = self.active_messages[:self.max_active_messages]
            
            # Move removed to history
            self.message_history.extend(removed)
        
        # Update display
        self._update_display()
        
        logger.debug(f"📜 Added message: {text[:50]}...")
    
    def _update_display(self) -> None:
        """Update the narrative display"""
        # Clear previous message text
        self.canvas.delete("narrative_text")
        
        current_time = time.time()
        
        # Display active messages
        y_offset = self.message_start_y
        displayed_count = 0
        
        for message in self.active_messages:
            # Check if message should still be displayed
            age = current_time - message.timestamp
            if age > message.duration:
                continue
            
            # Calculate fade
            alpha = self._calculate_fade(message, age)
            
            if alpha > 0.1:  # Only display if visible enough
                # Apply fade to color (simplified approach)
                display_color = self._apply_fade_to_color(message.color, alpha)
                
                # Display message
                self.canvas.create_text(
                    self.position[0] + self.padding,
                    y_offset,
                    text=message.text,
                    font=(self.font_family, self.font_size),
                    fill=display_color,
                    anchor="w",
                    tags="narrative_text"
                )
                
                y_offset += self.line_height
                displayed_count += 1
                
                if displayed_count >= self.max_active_messages:
                    break
        
        # Clean up expired messages
        self._cleanup_expired_messages()
    
    def _calculate_fade(self, message: NarrativeMessage, age: float) -> float:
        """Calculate fade alpha for message"""
        if age < message.fade_in:
            # Fade in
            return age / message.fade_in
        elif age > message.duration - message.fade_out:
            # Fade out
            fade_out_start = message.duration - message.fade_out
            return 1.0 - ((age - fade_out_start) / message.fade_out)
        else:
            # Full visibility
            return 1.0
    
    def _apply_fade_to_color(self, color: str, alpha: float) -> str:
        """Apply fade to a color (simplified approach)"""
        # For simplicity, we'll just return the original color
        # In a more advanced implementation, we would blend with background
        return color
    
    def _cleanup_expired_messages(self) -> None:
        """Remove expired messages from active list"""
        current_time = time.time()
        
        # Find expired messages
        expired = []
        remaining = []
        
        for message in self.active_messages:
            age = current_time - message.timestamp
            if age > message.duration:
                expired.append(message)
            else:
                remaining.append(message)
        
        # Move expired to history
        if expired:
            self.message_history.extend(expired)
            self.active_messages = remaining
            
            # Limit history size
            if len(self.message_history) > self.max_history:
                self.message_history = self.message_history[-self.max_history:]
    
    def add_movement_message(self, description: str) -> None:
        """Add movement-related message"""
        self.add_message(
            f"🚶 {description}",
            MessageType.MOVEMENT,
            MessagePriority.BACKGROUND,
            duration=3.0
        )
    
    def add_interaction_message(self, description: str, success: bool = True) -> None:
        """Add interaction-related message"""
        priority = MessagePriority.IMPORTANT if success else MessagePriority.NORMAL
        self.add_message(
            f"🎯 {description}",
            MessageType.INTERACTION,
            priority,
            duration=4.0
        )
    
    def add_discovery_message(self, description: str) -> None:
        """Add discovery-related message"""
        self.add_message(
            f"✨ {description}",
            MessageType.DISCOVERY,
            MessagePriority.IMPORTANT,
            duration=6.0
        )
    
    def add_combat_message(self, description: str) -> None:
        """Add combat-related message"""
        self.add_message(
            f"⚔️ {description}",
            MessageType.COMBAT,
            MessagePriority.IMPORTANT,
            duration=5.0
        )
    
    def add_system_message(self, description: str) -> None:
        """Add system-related message"""
        self.add_message(
            f"⚙️ {description}",
            MessageType.SYSTEM,
            MessagePriority.NORMAL,
            duration=3.0
        )
    
    def add_story_message(self, description: str, critical: bool = False) -> None:
        """Add story-related message"""
        priority = MessagePriority.CRITICAL if critical else MessagePriority.IMPORTANT
        duration = 8.0 if critical else 6.0
        
        self.add_message(
            f"📖 {description}",
            MessageType.STORY,
            priority,
            duration=duration
        )
    
    def clear_messages(self) -> None:
        """Clear all active messages"""
        self.active_messages.clear()
        self._update_display()
        logger.debug("🧹 Narrative scroll cleared")
    
    def get_message_stats(self) -> Dict[str, int]:
        """Get message statistics"""
        type_counts = {}
        priority_counts = {}
        
        for message in self.active_messages:
            # Count by type
            type_name = message.message_type.value
            type_counts[type_name] = type_counts.get(type_name, 0) + 1
            
            # Count by priority
            priority_name = message.priority.name
            priority_counts[priority_name] = priority_counts.get(priority_name, 0) + 1
        
        return {
            'active_messages': len(self.active_messages),
            'history_messages': len(self.message_history),
            'by_type': type_counts,
            'by_priority': priority_counts
        }
    
    def get_recent_history(self, count: int = 10) -> List[str]:
        """Get recent message history"""
        recent = self.message_history[-count:]
        return [msg.text for msg in recent]


# Factory function
def create_narrative_scroll(canvas: tk.Canvas, position: Tuple[int, int], 
                          size: Tuple[int, int]) -> NarrativeScroll:
    """Create narrative scroll system"""
    return NarrativeScroll(canvas, position, size)


# Test implementation
if __name__ == "__main__":
    import tkinter as tk
    import random
    
    # Test narrative scroll
    root = tk.Tk()
    root.title("Narrative Scroll Test")
    root.geometry("800x400")
    root.configure(bg='#1a1a1a')
    
    canvas = tk.Canvas(root, width=800, height=400, bg='#1a1a1a')
    canvas.pack(pady=20)
    
    # Create narrative scroll
    scroll = create_narrative_scroll(canvas, (10, 50), (780, 300))
    
    # Add initial message
    scroll.add_story_message("🌟 Welcome to the Glade of Trials!", critical=True)
    
    # Test controls
    control_frame = tk.Frame(root, bg='#1a1a1a')
    control_frame.pack()
    
    def test_movement():
        actions = ["moved north", "moved east", "examined the area", "waited patiently"]
        scroll.add_movement_message(random.choice(actions))
    
    def test_interaction():
        outcomes = [
            ("successfully opened the lockbox", True),
            ("failed to pick the lock", False),
            ("found a hidden compartment", True),
            ("the mechanism resisted", False)
        ]
        desc, success = random.choice(outcomes)
        scroll.add_interaction_message(desc, success)
    
    def test_discovery():
        discoveries = [
            "found a rare mushroom",
            "discovered ancient runes",
            "uncovered a hidden path",
            "noticed a strange pattern"
        ]
        scroll.add_discovery_message(random.choice(discoveries))
    
    def test_combat():
        events = [
            "landed a critical hit",
            "dodged the attack",
            "used a special ability",
            "took damage from the enemy"
        ]
        scroll.add_combat_message(random.choice(events))
    
    def test_system():
        messages = [
            "game saved",
            "inventory updated",
            "quest progress updated",
            "area loaded"
        ]
        scroll.add_system_message(random.choice(messages))
    
    def test_story():
        stories = [
            "The ancient trees seem to whisper secrets",
            "A mysterious fog rolls across the glade",
            "The void patch pulses with otherworldly energy",
            "Time seems to move differently here"
        ]
        scroll.add_story_message(random.choice(stories), random.random() < 0.3)
    
    def test_clear():
        scroll.clear_messages()
    
    def test_stats():
        stats = scroll.get_message_stats()
        print(f"📊 Narrative Stats: {stats}")
    
    # Add test buttons
    buttons = [
        ("Movement", test_movement),
        ("Interaction", test_interaction),
        ("Discovery", test_discovery),
        ("Combat", test_combat),
        ("System", test_system),
        ("Story", test_story),
        ("Clear", test_clear),
        ("Stats", test_stats)
    ]
    
    for text, command in buttons:
        tk.Button(control_frame, text=text, command=command).pack(side=tk.LEFT, padx=2)
    
    # Auto-update loop
    def update_loop():
        scroll._update_display()
        root.after(100, update_loop)  # 10 FPS for smooth fading
    
    update_loop()
    
    # Add some initial messages
    scroll.add_system_message("Narrative scroll system initialized")
    scroll.add_movement_message("entered the glade")
    
    print("📜 Narrative Scroll Test running - Close window to exit")
    root.mainloop()
