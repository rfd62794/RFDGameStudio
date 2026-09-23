import math
import random
from typing import Tuple, Optional
from src.shared.genetics import SlimeGenome
from src.shared.physics import Kinematics, Vector2

class Slime:
    def __init__(self, name: str, genome: SlimeGenome, position: Tuple[float, float], level: int = 1):
        self.name = name
        self.genome = genome
        self.level = level
        self.age = 0  # ticks lived
        self.team = None  # Team assignment: None, 'dungeon', 'racing', 'garden'
        
        # Physics
        self.kinematics = Kinematics(
            position=Vector2(*position),
            velocity=Vector2(0, 0)
        )
        self.max_speed = 50.0 + (self.genome.energy * 150.0) # Energy affects speed
        
        self.mood = "happy"
        self._target_pos: Optional[Vector2] = None
        self._wander_timer = 0.0

    def update(self, dt: float, cursor_pos: Optional[Tuple[float, float]] = None):
        """Update slime behavior and physics"""
        self.age += 1
        self._wander_timer -= dt
        
        target_force = Vector2(0, 0)
        
        # 1. Shyness: Retreat from cursor if too close
        if cursor_pos:
            cursor_vec = Vector2(*cursor_pos)
            dist_to_cursor = (cursor_vec - self.kinematics.position).magnitude()
            
            if dist_to_cursor < 80:  # Shyness radius
                shy_force = (self.kinematics.position - cursor_vec).normalize()
                shy_force *= (80 - dist_to_cursor) / 80  # Stronger when closer
                shy_force *= self.genome.shyness * 100  # Scale by shyness
                target_force += shy_force
        
        # 2. Affection: Follow cursor if not too shy
        if cursor_pos and self.genome.shyness < 0.5:
            cursor_vec = Vector2(*cursor_pos)
            dist_to_cursor = (cursor_vec - self.kinematics.position).magnitude()
            
            if 80 < dist_to_cursor < 200:  # Affection sweet spot
                affection_force = (cursor_vec - self.kinematics.position).normalize()
                affection_force *= self.genome.affection * 50  # Scale by affection
                target_force += affection_force
        
        # 3. Zone-based idle behavior
        if self._wander_timer <= 0:
            # Check if slime should use zone-based targeting
            zone_target = self._get_zone_target()
            if zone_target:
                self._target_pos = Vector2(*zone_target)
            else:
                # Fallback to original wandering logic
                self._wander_timer = random.uniform(1.0, 3.0) / (0.5 + self.genome.energy)
                
                if self.genome.curiosity > 0.7:
                    # Target points near edges or random
                    if random.random() < 0.5:
                        self._target_pos = Vector2(random.choice([30, 770]), random.uniform(30, 570))
                    else:
                        self._target_pos = Vector2(random.uniform(50, 750), random.uniform(50, 550))
                elif self.genome.energy > 0.3:
                    # Random drift point
                    self._target_pos = self.kinematics.position + Vector2(random.uniform(-100, 100), random.uniform(-100, 100))
                else:
                    self._target_pos = None # Slow/Sleepy

        if self._target_pos:
            diff = self._target_pos - self.kinematics.position
            if diff.magnitude() > 10.0:
                dir_to_target = diff.normalize()
                # Energy affects force
                force_mag = 20.0 + (self.genome.energy * 80.0)
                target_force += dir_to_target * force_mag
            else:
                self._target_pos = None

        # Apply friction (Energy affects how "slippery" they are)
        friction = 0.92 + (self.genome.energy * 0.05)
        self.kinematics.velocity *= min(0.98, friction)
        
        # Apply force to velocity (simplistic integration)
        self.kinematics.velocity += target_force * dt
        
        # Clamp speed
        speed = self.kinematics.velocity.magnitude()
        if speed > self.max_speed:
            self.kinematics.velocity = self.kinematics.velocity.normalize() * self.max_speed
        
        # Update position
        self.kinematics.update(dt)
        
        # Keep in bounds
        # Assume 1024x768 context but garden area is roughly 784x688
        # We'll use 800x600 as a safe logic zone for now
        self._handle_bounds(800, 600)
        self._update_mood()

    def _get_zone_target(self) -> Optional[Tuple[float, float]]:
        """Get zone-based target position for idle behavior"""
        try:
            # Try to get garden renderer from scene
            # This is a bit of a hack - in a real implementation, 
            # this would be passed in or accessed through a proper interface
            from src.shared.rendering.garden_renderer import GardenRenderer
            
            # For now, we'll implement a simple zone targeting system
            # based on garden dimensions (800x600)
            
            # Read personality axes from genome
            axes = getattr(self.genome, 'personality_axes', {})
            patience = axes.get('patience', 0.3)
            curiosity = axes.get('curiosity', 0.3)
            aggression = axes.get('aggression', 0.3)
            sociability = axes.get('sociability', 0.3)
            
            # Zone selection logic
            if patience > 0.5 and curiosity < 0.3:
                # Nursery: center 25% (400x300 -> center 100x75)
                zone_center = (400, 300)
                zone_size = (100, 75)
            elif aggression > 0.5:
                # Training: center 60% (400x300 -> center 240x180)
                zone_center = (400, 300)
                zone_size = (240, 180)
            elif curiosity > 0.5:
                # Foraging: outer ring (edges)
                # Pick a random edge
                edge = random.choice(['top', 'bottom', 'left', 'right'])
                if edge == 'top':
                    x = random.uniform(100, 700)
                    y = random.uniform(50, 100)
                elif edge == 'bottom':
                    x = random.uniform(100, 700)
                    y = random.uniform(500, 550)
                elif edge == 'left':
                    x = random.uniform(50, 100)
                    y = random.uniform(100, 500)
                else:  # right
                    x = random.uniform(700, 750)
                    y = random.uniform(100, 500)
                return (x, y)
            else:
                # Training: center 60%
                zone_center = (400, 300)
                zone_size = (240, 180)
            
            # Generate random point within zone (20px inset from boundaries)
            if 'zone_size' in locals():
                inset = 20
                x = random.uniform(
                    zone_center[0] - zone_size[0] // 2 + inset,
                    zone_center[0] + zone_size[0] // 2 - inset
                )
                y = random.uniform(
                    zone_center[1] - zone_size[1] // 2 + inset,
                    zone_center[1] + zone_size[1] // 2 - inset
                )
                return (x, y)
            
        except Exception as e:
            # Fallback to no zone targeting
            return None

    def _handle_bounds(self, width: int, height: int):
        margin = 30
        if self.kinematics.position.x < margin:
            self.kinematics.position.x = margin
            self.kinematics.velocity.x *= -0.5
            self._target_pos = None
        elif self.kinematics.position.x > width - margin:
            self.kinematics.position.x = width - margin
            self.kinematics.velocity.x *= -0.5
            self._target_pos = None
            
        if self.kinematics.position.y < margin:
            self.kinematics.position.y = margin
            self.kinematics.velocity.y *= -0.5
            self._target_pos = None
        elif self.kinematics.position.y > height - margin:
            self.kinematics.position.y = height - margin
            self.kinematics.velocity.y *= -0.5
            self._target_pos = None

        self._update_mood()

    def _update_mood(self) -> None:
        if self.genome.energy < 0.3:
            self.mood = "Sleepy"
        elif self.genome.shyness > 0.7:
            self.mood = "Shy"
        elif self.genome.affection > 0.7:
            self.mood = "Playful"
        elif self.genome.curiosity > 0.7:
            self.mood = "Curious"
        else:
            self.mood = "Happy"

    def get_mood(self) -> str:
        return self.mood
