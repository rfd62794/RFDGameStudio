"""
DGT PPU Input Service - ADR 135 Implementation
Mouse Interaction Bridge for Tactical Commander

Captures mouse clicks and broadcasts tactical commands
to the server for real-time fleet control.
"""

from typing import Dict, List, Optional, Callable, Tuple
from dataclasses import dataclass
from enum import Enum
import time

from loguru import logger


class TacticalCommand(Enum):
    """Tactical commands from commander input"""
    SET_PRIORITY = "set_priority"
    SET_RALLY_POINT = "set_rally_point"
    SET_FORMATION = "set_formation"
    EMERGENCY_STOP = "emergency_stop"


@dataclass
class TacticalNudge:
    """Tactical nudge packet sent from client to server"""
    command: TacticalCommand
    target_x: Optional[float] = None
    target_y: Optional[float] = None
    target_id: Optional[str] = None
    timestamp: float = 0.0
    
    def __post_init__(self):
        if self.timestamp == 0.0:
            self.timestamp = time.time()


class PPUInputService:
    """Mouse input service for tactical commander interface"""
    
    def __init__(self, canvas_width: int = 1000, canvas_height: int = 700):
        self.canvas_width = canvas_width
        self.canvas_height = canvas_height
        
        # Input callbacks
        self.on_tactical_nudge: Optional[Callable[[TacticalNudge], None]] = None
        
        # Input state
        self.last_click_time = 0.0
        self.click_cooldown = 0.1  # 100ms between clicks
        self.right_click_time = 0.0
        self.right_click_cooldown = 0.2
        
        # Tactical state
        self.priority_target: Optional[str] = None
        self.rally_point: Optional[Tuple[float, float]] = None
        
        logger.info(f"🖱️ PPU Input Service initialized: {canvas_width}x{canvas_height}")
    
    def bind_canvas(self, canvas, commander_service):
        """Bind input handlers to tkinter canvas"""
        try:
            # Left click - Set priority target
            canvas.bind("<Button-1>", 
                        lambda e: self._handle_left_click(e, commander_service))
            
            # Right click - Set rally point
            canvas.bind("<Button-3>", 
                        lambda e: self._handle_right_click(e, commander_service))
            
            # Mouse move - Update cursor position
            canvas.bind("<Motion>", self._handle_mouse_move)
            
            # Keyboard shortcuts
            canvas.bind("<space>", lambda e: self._handle_emergency_stop())
            canvas.bind("<f>", lambda e: self._handle_formation_command())
            
            logger.info("🖱️ Canvas input handlers bound")
            
        except Exception as e:
            logger.error(f"❌ Failed to bind canvas handlers: {e}")
    
    def _handle_left_click(self, event, commander_service):
        """Handle left click - set priority target"""
        current_time = time.time()
        if current_time - self.last_click_time < self.click_cooldown:
            return  # Cooldown not met
        
        self.last_click_time = current_time
        
        # Find ship at click position
        clicked_ship = self._find_ship_at_position(event.x, event.y)
        
        if clicked_ship:
            # Set priority target
            self.priority_target = clicked_ship
            nudge = TacticalNudge(
                command=TacticalCommand.SET_PRIORITY,
                target_id=clicked_ship,
                timestamp=current_time
            )
            
            # Send to server
            if self.on_tactical_nudge:
                self.on_tactical_nudge(nudge)
            
            logger.info(f"🎯 Priority target set: {clicked_ship}")
        else:
            # No ship clicked - clear priority
            self._clear_priority()
    
    def _handle_right_click(self, event, commander_service):
        """Handle right click - set rally point"""
        current_time = time.time()
        if current_time - self.right_click_time < self.right_click_cooldown:
            return  # Cooldown not met
        
        self.right_click_time = current_time
        
        # Set rally point
        self.rally_point = (event.x, event.y)
        nudge = TacticalNudge(
            command=TacticalCommand.SET_RALLY_POINT,
            target_x=event.x,
            target_y=event.y,
            timestamp=current_time
        )
        
        # Send to server
        if self.on_tactical_nudge:
            self.on_tactical_nudge(nudge)
        
        logger.info(f"📍 Rally point set: ({event.x}, {event.y})")
    
    def _handle_mouse_move(self, event):
        """Handle mouse movement for cursor updates"""
        # Could be used for hover effects or cursor changes
        pass
    
    def _handle_emergency_stop(self):
        """Handle emergency stop command"""
        nudge = TacticalNudge(
            command=TacticalCommand.EMERGENCY_STOP,
            timestamp=time.time()
        )
        
        if self.on_tactical_nudge:
            self.on_tactical_nudge(nudge)
        
        logger.info("🚨 Emergency stop command issued")
    
    def _handle_formation_command(self):
        """Handle formation command"""
        nudge = TacticalNudge(
            command=TacticalCommand.SET_FORMATION,
            timestamp=time.time()
        )
        
        if self.on_tactical_nudge:
            self.on_tactical_nudge(nudge)
        
        logger.info("📐 Formation command issued")
    
    def _find_ship_at_position(self, x: float, y: float) -> Optional[str]:
        """Find ship at given position (simplified)"""
        # This would need access to current ship positions
        # For now, return None - would be implemented with ship registry
        return None
    
    def _clear_priority(self):
        """Clear priority target"""
        self.priority_target = None
        logger.info("🎯 Priority target cleared")
    
    def set_tactical_nudge_callback(self, callback: Callable[[TacticalNudge], None]):
        """Set callback for tactical nudges"""
        self.on_tactical_nudge = callback
    
    def get_input_state(self) -> Dict[str, any]:
        """Get current input state"""
        return {
            'priority_target': self.priority_target,
            'rally_point': self.rally_point,
            'last_click_time': self.last_click_time,
            'right_click_time': self.right_click_time
        }


# Global PPU input service instance
ppu_input_service = None

def initialize_ppu_input(canvas_width: int = 1000, canvas_height: int = 700) -> PPUInputService:
    """Initialize global PPU input service"""
    global ppu_input_service
    ppu_input_service = PPUInputService(canvas_width, canvas_height)
    logger.info("🖱️ Global PPU Input Service initialized")
    return ppu_input_service

def get_ppu_input_service() -> Optional[PPUInputService]:
    """Get global PPU input service instance"""
    return ppu_input_service
