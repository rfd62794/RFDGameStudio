"""
Terminal Handshake - Phosphor Terminal Integration

ADR 196: The "Scrap Hub" Entity Manager

Bridge between the physics system and the Phosphor Terminal for
scrap acquisition notifications and game event logging.

This creates the narrative layer that transforms pure arcade gameplay
into the Sovereign Scout's resource acquisition simulation.

Terminal Output Format:
[SCRAP ACQUIRED: +1 COMMON]
[HULL IMPACT: Integrity 88%]
[ASTEROID DESTROYED: Large → 2 Medium]
[ENERGY DRAIN: -2.5% for thrust]
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import time
import json

from .asteroids_strategy import AsteroidsStrategy
from .scrap_entity import ScrapLocker
from foundation.interfaces.protocols import Result


class TerminalHandshake:
    """Phosphor Terminal communication bridge"""
    
    def __init__(self, asteroids_strategy: AsteroidsStrategy):
        self.asteroids_strategy = asteroids_strategy
        self.message_buffer: List[str] = []
        self.max_buffer_size = 100  # Keep last 100 messages
        
        # Terminal formatting
        self.prefix_scrap = "[SCRAP ACQUIRED:"
        self.prefix_impact = "[HULL IMPACT:"
        self.prefix_destroyed = "[ASTEROID DESTROYED:"
        self.prefix_energy = "[ENERGY DRAIN:"
        self.prefix_system = "[SYSTEM:"
        
        # Message statistics
        self.messages_sent = 0
        self.last_message_time = 0.0
        
        # Energy tracking
        self.last_energy_level = 100.0
        self.energy_threshold = 2.0  # Report changes > 2%
    
    def update(self) -> Result[Dict[str, Any]]:
        """Update terminal handshake and process notifications"""
        try:
            # Get pending notifications from physics system
            notifications = self.asteroids_strategy.get_pending_notifications()
            
            # Process each notification
            for notification in notifications:
                self._process_notification(notification)
            
            # Check for energy changes
            self._check_energy_changes()
            
            # Check for game events
            self._check_game_events()
            
            # Update statistics
            self.messages_sent += len(notifications)
            self.last_message_time = time.time()
            
            return Result.success_result({
                'messages_processed': len(notifications),
                'buffer_size': len(self.message_buffer),
                'messages_sent': self.messages_sent
            })
            
        except Exception as e:
            return Result.failure_result(f"Terminal handshake update failed: {str(e)}")
    
    def _process_notification(self, notification: Dict[str, Any]) -> None:
        """Process individual notification from physics system"""
        action = notification.get('action', '')
        
        if action == 'scrap_acquired':
            self._format_scrap_message(notification)
        elif action == 'hull_impact':
            self._format_impact_message(notification)
        elif action == 'asteroid_destroyed':
            self._format_destroyed_message(notification)
        elif action == 'energy_change':
            self._format_energy_message(notification)
        else:
            # Generic system message
            message = notification.get('message', f'[SYSTEM: {action}]')
            self._add_message(message)
    
    def _format_scrap_message(self, notification: Dict[str, Any]) -> None:
        """Format scrap acquisition message"""
        scrap_type = notification.get('scrap_type', 'UNKNOWN').upper()
        amount = notification.get('amount', 1)
        new_total = notification.get('new_total', 0)
        
        message = f"{self.prefix_scrap} +{amount} {scrap_type}] (Total: {new_total})"
        self._add_message(message)
    
    def _format_impact_message(self, notification: Dict[str, Any]) -> None:
        """Format hull impact message"""
        integrity = notification.get('integrity', 100)
        damage_type = notification.get('damage_type', 'UNKNOWN')
        
        message = f"{self.prefix_impact} Integrity {integrity}%] ({damage_type})"
        self._add_message(message)
    
    def _format_destroyed_message(self, notification: Dict[str, Any]) -> None:
        """Format asteroid destruction message"""
        asteroid_type = notification.get('asteroid_type', 'Unknown')
        fragments = notification.get('fragments', 0)
        
        message = f"{self.prefix_destroyed} {asteroid_type.title} → {fragments} Fragment(s)]"
        self._add_message(message)
    
    def _format_energy_message(self, notification: Dict[str, Any]) -> None:
        """Format energy change message"""
        energy_change = notification.get('energy_change', 0)
        current_level = notification.get('current_level', 100)
        
        if energy_change < 0:
            message = f"{self.prefix_energy} {energy_change:+.1f}%] (Current: {current_level:.1f}%)"
        else:
            message = f"{self.prefix_energy} {energy_change:+.1f}%] (Regenerated: {current_level:.1f}%)"
        
        self._add_message(message)
    
    def _check_energy_changes(self) -> None:
        """Check for significant energy level changes"""
        debug_info = self.asteroids_strategy.get_physics_debug_info()
        current_energy = debug_info.get('energy', 100.0)
        
        # Calculate percentage change
        energy_change = current_energy - self.last_energy_level
        
        # Report if change exceeds threshold
        if abs(energy_change) >= self.energy_threshold:
            notification = {
                'action': 'energy_change',
                'energy_change': energy_change,
                'current_level': current_energy
            }
            self._format_energy_message(notification)
            self.last_energy_level = current_energy
    
    def _check_game_events(self) -> None:
        """Check for significant game events"""
        debug_info = self.asteroids_strategy.get_physics_debug_info()
        
        # Check for game over
        if not debug_info.get('game_active', True):
            if not hasattr(self, 'game_over_reported'):
                self._add_message(f"{self.prefix_system} GAME OVER - Ship Destroyed]")
                self.game_over_reported = True
        
        # Check for score milestones
        score = debug_info.get('score', 0)
        if hasattr(self, 'last_score'):
            score_diff = score - self.last_score
            if score_diff >= 100:  # Report every 100 points
                self._add_message(f"{self.prefix_system} Score Milestone: {score} points]")
                self.last_score = score
        else:
            self.last_score = score
    
    def _add_message(self, message: str) -> None:
        """Add message to buffer with timestamp"""
        timestamp = time.strftime("%H:%M:%S")
        formatted_message = f"{timestamp} {message}"
        
        self.message_buffer.append(formatted_message)
        
        # Maintain buffer size
        if len(self.message_buffer) > self.max_buffer_size:
            self.message_buffer.pop(0)
    
    def get_recent_messages(self, count: int = 10) -> List[str]:
        """Get recent messages from buffer"""
        return self.message_buffer[-count:] if count > 0 else self.message_buffer.copy()
    
    def get_all_messages(self) -> List[str]:
        """Get all messages from buffer"""
        return self.message_buffer.copy()
    
    def clear_buffer(self) -> None:
        """Clear the message buffer"""
        self.message_buffer.clear()
    
    def get_scrap_summary(self) -> str:
        """Get formatted scrap summary for terminal display"""
        scrap_info = self.asteroids_strategy.get_scrap_locker_summary()
        scrap_counts = scrap_info.get('scrap_counts', {})
        total_scrap = scrap_info.get('total_scrap', 0)
        
        summary_lines = [
            f"{self.prefix_system} SCRAP INVENTORY]",
            f"  Common: {scrap_counts.get('common', 0)}",
            f"  Rare: {scrap_counts.get('rare', 0)}",
            f"  Epic: {scrap_counts.get('epic', 0)}",
            f"  Total: {total_scrap}"
        ]
        
        return '\n'.join(summary_lines)
    
    def get_system_status(self) -> str:
        """Get formatted system status for terminal display"""
        debug_info = self.asteroids_strategy.get_physics_debug_info()
        
        status_lines = [
            f"{self.prefix_system} STATUS REPORT]",
            f"  Game Active: {debug_info.get('game_active', 'Unknown')}",
            f"  Score: {debug_info.get('score', 0)}",
            f"  Energy: {debug_info.get('energy', 0):.1f}%",
            f"  Entities: {debug_info.get('entity_count', 0)}",
            f"  Active Scrap: {debug_info.get('scrap', {}).get('active_scrap_count', 0)}"
        ]
        
        return '\n'.join(status_lines)
    
    def export_log(self, file_path: str) -> Result[None]:
        """Export message log to file"""
        try:
            log_data = {
                'export_time': time.time(),
                'messages_sent': self.messages_sent,
                'buffer_size': len(self.message_buffer),
                'messages': self.message_buffer
            }
            
            with open(file_path, 'w') as f:
                json.dump(log_data, f, indent=2)
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to export log: {str(e)}")
    
    def get_handshake_stats(self) -> Dict[str, Any]:
        """Get handshake statistics"""
        return {
            'messages_sent': self.messages_sent,
            'buffer_size': len(self.message_buffer),
            'last_message_time': self.last_message_time,
            'max_buffer_size': self.max_buffer_size,
            'energy_threshold': self.energy_threshold
        }
