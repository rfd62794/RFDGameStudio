"""
Short-Term Memory - In-Session Plasticity for AI Pilot
Real-time adaptation based on recent experiences
"""

import math
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from collections import deque
from loguru import logger


@dataclass
class MemoryFrame:
    """Single frame of experience for memory"""
    timestamp: float
    ship_velocity: Tuple[float, float]
    ship_position: Tuple[float, float]
    ship_angle: float
    target_distance: float
    target_angle: float
    control_inputs: Dict[str, float]
    threat_distance: float
    stress_level: float


class ShortTermMemory:
    """Short-term memory buffer for in-session learning"""
    
    def __init__(self, memory_duration: float = 3.0, max_frames: int = 180):
        self.memory_duration = memory_duration  # 3 seconds of memory
        self.max_frames = max_frames  # 60fps * 3s = 180 frames
        self.memory_buffer: deque = deque(maxlen=max_frames)
        
        # Learning parameters
        self.near_miss_threshold = 5.0  # 5px near miss distance
        self.stress_decay_rate = 0.95  # Stress decays over time
        self.adaptation_rate = 0.1  # How quickly to adapt weights
        
        # Current stress level
        self.current_stress = 0.0
        self.stress_history: List[float] = []
        
        # Learning state
        self.last_collision_time = 0.0
        self.near_misses: List[Dict[str, Any]] = []
        
        logger.info("🧠 ShortTermMemory initialized for in-session learning")
    
    def add_frame(self, timestamp: float, ship_velocity: Tuple[float, float], 
                  ship_position: Tuple[float, float], ship_angle: float,
                  target_distance: float, target_angle: float,
                  control_inputs: Dict[str, float], threat_distance: float) -> None:
        """Add a new frame to memory"""
        # Calculate stress based on threat proximity
        stress = self._calculate_stress(threat_distance, target_distance)
        
        frame = MemoryFrame(
            timestamp=timestamp,
            ship_velocity=ship_velocity,
            ship_position=ship_position,
            ship_angle=ship_angle,
            target_distance=target_distance,
            target_angle=target_angle,
            control_inputs=control_inputs.copy(),
            threat_distance=threat_distance,
            stress_level=stress
        )
        
        self.memory_buffer.append(frame)
        self.current_stress = stress
        self.stress_history.append(stress)
        
        # Keep stress history manageable
        if len(self.stress_history) > 1000:
            self.stress_history = self.stress_history[-500:]
        
        # Check for near misses
        if threat_distance < self.near_miss_threshold and threat_distance > 0:
            self._record_near_miss(frame)
    
    def _calculate_stress(self, threat_distance: float, target_distance: float) -> float:
        """Calculate stress level based on threats and targets"""
        stress = 0.0
        
        # Threat stress (higher when closer)
        if threat_distance > 0 and threat_distance < 50.0:
            threat_stress = 1.0 - (threat_distance / 50.0)
            stress += threat_stress * 0.7
        
        # Target stress (lower when closer to target)
        if target_distance > 0 and target_distance < 100.0:
            target_stress = 1.0 - (target_distance / 100.0)
            stress += target_stress * 0.3
        
        return min(1.0, stress)
    
    def _record_near_miss(self, frame: MemoryFrame) -> None:
        """Record a near-miss event for learning"""
        near_miss = {
            'timestamp': frame.timestamp,
            'velocity': frame.ship_velocity,
            'position': frame.ship_position,
            'angle': frame.ship_angle,
            'threat_distance': frame.threat_distance,
            'control_inputs': frame.control_inputs.copy()
        }
        
        self.near_misses.append(near_miss)
        
        # Keep near miss history manageable
        if len(self.near_misses) > 50:
            self.near_misses = self.near_misses[-25:]
        
        logger.debug(f"⚡ Near miss recorded: distance={frame.threat_distance:.1f}px")
    
    def record_collision(self, timestamp: float) -> None:
        """Record a collision event"""
        self.last_collision_time = timestamp
        
        # Analyze the frames leading to collision
        collision_frames = self._get_collision_frames(timestamp)
        
        if collision_frames:
            self._learn_from_collision(collision_frames)
        
        logger.info(f"💥 Collision recorded at {timestamp:.2f}s")
    
    def _get_collision_frames(self, collision_time: float) -> List[MemoryFrame]:
        """Get frames leading up to collision"""
        collision_frames = []
        
        for frame in self.memory_buffer:
            if collision_time - frame.timestamp <= 1.0:  # Last 1 second
                collision_frames.append(frame)
        
        return collision_frames
    
    def _learn_from_collision(self, collision_frames: List[MemoryFrame]) -> None:
        """Learn from collision by analyzing preceding frames"""
        if len(collision_frames) < 10:
            return
        
        # Analyze the dangerous pattern
        avg_velocity = self._calculate_average_velocity(collision_frames)
        avg_threat_distance = self._calculate_average_threat_distance(collision_frames)
        avg_control_inputs = self._calculate_average_controls(collision_frames)
        
        # Create avoidance pattern
        avoidance_pattern = {
            'dangerous_velocity': avg_velocity,
            'dangerous_distance': avg_threat_distance,
            'dangerous_controls': avg_control_inputs,
            'learned_at': collision_frames[-1].timestamp
        }
        
        logger.debug(f"🧠 Learned from collision: velocity={avg_velocity}, distance={avg_threat_distance:.1f}")
        
        return avoidance_pattern
    
    def _calculate_average_velocity(self, frames: List[MemoryFrame]) -> Tuple[float, float]:
        """Calculate average velocity from frames"""
        if not frames:
            return (0.0, 0.0)
        
        avg_vx = sum(frame.ship_velocity[0] for frame in frames) / len(frames)
        avg_vy = sum(frame.ship_velocity[1] for frame in frames) / len(frames)
        
        return (avg_vx, avg_vy)
    
    def _calculate_average_threat_distance(self, frames: List[MemoryFrame]) -> float:
        """Calculate average threat distance from frames"""
        if not frames:
            return float('inf')
        
        distances = [frame.threat_distance for frame in frames if frame.threat_distance > 0]
        
        if not distances:
            return float('inf')
        
        return sum(distances) / len(distances)
    
    def _calculate_average_controls(self, frames: List[MemoryFrame]) -> Dict[str, float]:
        """Calculate average control inputs from frames"""
        if not frames:
            return {'thrust': 0.0, 'rotation': 0.0, 'fire_weapon': 0.0}
        
        avg_thrust = sum(frame.control_inputs.get('thrust', 0) for frame in frames) / len(frames)
        avg_rotation = sum(frame.control_inputs.get('rotation', 0) for frame in frames) / len(frames)
        avg_fire = sum(1.0 for frame in frames if frame.control_inputs.get('fire_weapon', False)) / len(frames)
        
        return {
            'thrust': avg_thrust,
            'rotation': avg_rotation,
            'fire_weapon': avg_fire
        }
    
    def get_adaptive_bias(self, current_velocity: Tuple[float, float], 
                          current_threat_distance: float) -> Dict[str, float]:
        """Get adaptive bias based on recent experiences"""
        bias = {'thrust': 0.0, 'rotation': 0.0, 'fire_weapon': 0.0}
        
        # Check recent near misses
        recent_near_misses = [
            nm for nm in self.near_misses 
            if self.memory_buffer and nm['timestamp'] > self.memory_buffer[-1].timestamp - 2.0
        ]
        
        if not recent_near_misses:
            return bias
        
        # Analyze near miss patterns
        avg_threat_distance = sum(nm['threat_distance'] for nm in recent_near_misses) / len(recent_near_misses)
        
        # If current threat is similar to near-miss threats, apply avoidance bias
        if current_threat_distance > 0 and current_threat_distance < avg_threat_distance * 1.5:
            # Calculate avoidance direction (perpendicular to threat approach)
            for near_miss in recent_near_misses[-3:]:  # Last 3 near misses
                nm_velocity = near_miss['velocity']
                nm_angle = math.atan2(nm_velocity[1], nm_velocity[0])
                
                # Apply bias to turn away from dangerous approach
                cross_product = current_velocity[0] * math.sin(nm_angle) - current_velocity[1] * math.cos(nm_angle)
                
                if cross_product > 0:  # Turn right
                    bias['rotation'] += self.adaptation_rate
                else:  # Turn left
                    bias['rotation'] -= self.adaptation_rate
                
                # Reduce thrust when approaching danger
                if current_threat_distance < 20.0:
                    bias['thrust'] -= self.adaptation_rate * 0.5
        
        return bias
    
    def get_stress_level(self) -> float:
        """Get current stress level"""
        return self.current_stress
    
    def get_memory_summary(self) -> Dict[str, Any]:
        """Get summary of memory state"""
        if not self.memory_buffer:
            return {
                'frames_count': 0,
                'current_stress': 0.0,
                'near_misses_count': 0,
                'last_collision_time': 0.0
            }
        
        recent_frames = list(self.memory_buffer)[-60:]  # Last 1 second
        
        return {
            'frames_count': len(self.memory_buffer),
            'current_stress': self.current_stress,
            'avg_stress': sum(frame.stress_level for frame in recent_frames) / len(recent_frames) if recent_frames else 0.0,
            'near_misses_count': len(self.near_misses),
            'last_collision_time': self.last_collision_time,
            'time_since_collision': self.memory_buffer[-1].timestamp - self.last_collision_time if self.memory_buffer else 0.0
        }
    
    def decay_stress(self, dt: float) -> None:
        """Apply stress decay over time"""
        self.current_stress *= (self.stress_decay_rate ** dt)
    
    def clear_old_frames(self, current_time: float) -> None:
        """Clear frames older than memory duration"""
        while (self.memory_buffer and 
               current_time - self.memory_buffer[0].timestamp > self.memory_duration):
            self.memory_buffer.popleft()
    
    def reset(self) -> None:
        """Reset memory for new session"""
        self.memory_buffer.clear()
        self.stress_history.clear()
        self.near_misses.clear()
        self.current_stress = 0.0
        self.last_collision_time = 0.0
        
        logger.info("🧠 ShortTermMemory reset")


# Factory function
def create_short_term_memory(memory_duration: float = 3.0, max_frames: int = 180) -> ShortTermMemory:
    """Create short-term memory system"""
    return ShortTermMemory(memory_duration, max_frames)
