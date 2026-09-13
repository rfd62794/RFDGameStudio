"""
Physics Body - Newtonian Physics Controller

ADR 195: The Newtonian Vector Core

Central physics controller implementing the four pillars of
"Ur-Asteroids" within the sovereign 160x144 resolution grid.

Core Physics Laws:
1. Momentum: Zero-friction physics with velocity accumulation
2. Rotation: Fixed-pivot turning independent of movement
3. Toroidal Wrap: Screen wrapping with Newtonian ghosting
4. Entity Splitting: Recursive spawning with divergent vectors

Optimized for 60Hz update cycles with deterministic behavior.
"""

# Add missing imports
import random

from typing import List, Optional, Dict, Any, Tuple
from dataclasses import dataclass
import math
import time

from .entities.space_entity import SpaceEntity, EntityType
from dgt_engine.foundation.vector import Vector2
from .scrap_entity import ScrapEntity, ScrapLocker
from dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
from dgt_engine.foundation.types import Result


@dataclass
class PhysicsState:
    """Complete physics state for a single frame"""
    entities: List[SpaceEntity]
    ship_entity: Optional[SpaceEntity]
    score: int = 0
    energy: float = 100.0
    game_time: float = 0.0
    frame_count: int = 0


class PhysicsBody:
    """Newtonian physics controller for space entities"""
    
    def __init__(self):
        self.entities: List[SpaceEntity] = []
        self.ship_entity: Optional[SpaceEntity] = None
        self.physics_state = PhysicsState(entities=[], ship_entity=None)
        
        # Position and velocity for direct control
        self.position = Vector2(SOVEREIGN_WIDTH / 2, SOVEREIGN_HEIGHT / 2)
        self.velocity = Vector2(0, 0)
        self.angle = 0.0
        self.mass = 10.0
        self.energy = 100.0
        
        # Physics constants (60Hz baseline)
        self.dt = 1.0 / 60.0  # 60 FPS physics timestep
        self.max_ship_speed = 200.0  # Maximum ship velocity
        self.bullet_speed = 300.0  # Bullet velocity
        self.thrust_cost = 5.0  # Energy cost per second of thrust
        
        # Scrap system (ADR 196)
        self.scrap_locker = ScrapLocker()
        self.scrap_spawn_chance = 0.05  # 5% chance
        
        # Input state
        self.thrust_active = False
        self.rotation_input = 0.0  # -1 for left, 1 for right, 0 for none
        self.fire_cooldown = 0.0
        
        # Game state
        self.game_active = False
        self.game_start_time = 0.0
        
        # Performance tracking
        self.last_update_time = 0.0
        self.frame_times: List[float] = []
        
        # Initialize game entities
        self._initialize_game()
    
    def _initialize_game(self) -> None:
        """Initialize the "Ur-Asteroids" game state"""
        # Create player ship at center
        self.ship_entity = SpaceEntity(
            entity_type=EntityType.SHIP,
            position=Vector2(SOVEREIGN_WIDTH / 2, SOVEREIGN_HEIGHT / 2),
            velocity=Vector2.zero(),
            heading=0.0,  # Pointing right initially
            radius=4.0   # Ship radius
        )
        
        # Create initial asteroids (3 large rocks)
        self.entities = [self.ship_entity]
        
        # Add 3 large asteroids at random positions
        import random
        for i in range(3):
            # Random position away from ship
            while True:
                x = random.uniform(20, SOVEREIGN_WIDTH - 20)
                y = random.uniform(20, SOVEREIGN_HEIGHT - 20)
                pos = Vector2(x, y)
                
                # Ensure asteroid is not too close to ship
                if pos.distance_to(self.ship_entity.position) > 50:
                    break
            
            asteroid = SpaceEntity(
                entity_type=EntityType.LARGE_ASTEROID,
                position=pos,
                velocity=Vector2.zero(),
                heading=0.0,
                radius=12.0  # Large asteroid radius
            )
            self.entities.append(asteroid)
        
        # Update physics state
        self._update_physics_state()
        
        # Start game
        self.game_active = True
        self.game_start_time = time.time()
    
    def update(self, dt: float) -> None:
        """Simple update for controller-based physics with strict boundary enforcement"""
        # Update position based on velocity
        self.position.x += self.velocity.x * dt
        self.position.y += self.velocity.y * dt
        
        # Strict toroidal wrapping at engine level
        if self.position.x < 0:
            self.position.x = SOVEREIGN_WIDTH
        elif self.position.x >= SOVEREIGN_WIDTH:
            self.position.x = 0
        
        if self.position.y < 0:
            self.position.y = SOVEREIGN_HEIGHT
        elif self.position.y >= SOVEREIGN_HEIGHT:
            self.position.y = 0
        
        # Apply drag (minimal for space)
        self.velocity.x *= 0.999
        self.velocity.y *= 0.999
    
    def apply_force(self, force_x: float, force_y: float) -> None:
        """Apply force to the physics body"""
        # F = ma, so a = F/m
        accel_x = force_x / self.mass
        accel_y = force_y / self.mass
        
        # Update velocity
        self.velocity.x += accel_x * self.dt
        self.velocity.y += accel_y * self.dt
        
        # Limit maximum speed
        speed = math.sqrt(self.velocity.x ** 2 + self.velocity.y ** 2)
        if speed > self.max_ship_speed:
            scale = self.max_ship_speed / speed
            self.velocity.x *= scale
            self.velocity.y *= scale
    
    def update(self, current_time: float) -> Result[PhysicsState]:
        """Main physics update loop (60Hz)"""
        try:
            # Calculate delta time
            if self.last_update_time == 0.0:
                self.last_update_time = current_time
            
            actual_dt = current_time - self.last_update_time
            self.last_update_time = current_time
            
            # Track frame time for performance monitoring
            self.frame_times.append(actual_dt)
            if len(self.frame_times) > 60:  # Keep last 60 frames
                self.frame_times.pop(0)
            
            # Use fixed timestep for deterministic physics
            dt = self.dt
            
            # Update game time
            self.physics_state.game_time += dt
            self.physics_state.frame_count += 1
            
            # Process input
            self._process_input(dt)
            
            # Update all entities
            self._update_entities(dt)
            
            # Check collisions
            self._check_collisions()
            
            # Update energy
            self._update_energy(dt)
            
            # Cleanup inactive entities
            self._cleanup_entities()
            
            # Update physics state
            self._update_physics_state()
            
            return Result.success_result(self.physics_state)
            
        except Exception as e:
            return Result.failure_result(f"Physics update failed: {str(e)}")
    
    def _process_input(self, dt: float) -> None:
        """Process player input for ship control"""
        if not self.ship_entity or not self.ship_entity.active:
            return
        
        # Handle rotation
        if self.rotation_input != 0.0:
            rotation_speed = 3.0  # radians per second
            self.ship_entity.rotate(self.rotation_input * rotation_speed)
        
        # Handle thrust
        if self.thrust_active:
            self.ship_entity.apply_thrust(150.0)  # Thrust force
            
            # Clamp ship velocity to maximum
            if self.ship_entity.velocity.magnitude() > self.max_ship_speed:
                self.ship_entity.velocity = self.ship_entity.velocity.normalize() * self.max_ship_speed
        else:
            self.ship_entity.apply_thrust(0.0)
        
        # Update fire cooldown
        if self.fire_cooldown > 0.0:
            self.fire_cooldown -= dt
    
    def _update_entities(self, dt: float) -> None:
        """Update all entities with Newtonian physics"""
        for entity in self.entities:
            entity.update(dt)
    
    def _check_collisions(self) -> None:
        """Check and resolve collisions between entities"""
        # Check bullet-asteroid collisions
        for bullet in [e for e in self.entities if e.entity_type == EntityType.BULLET and e.active]:
            for asteroid in [e for e in self.entities if e.entity_type in [EntityType.LARGE_ASTEROID, EntityType.MEDIUM_ASTEROID, EntityType.SMALL_ASTEROID] and e.active]:
                if bullet.check_collision(asteroid):
                    # Deactivate bullet and asteroid
                    bullet.active = False
                    asteroid.active = False
                    
                    # Record asteroid destruction
                    self.scrap_locker.record_asteroid_destroyed(asteroid.entity_type.value)
                    
                    # Check for scrap spawn (ADR 196 - 5% chance)
                    if random.random() < self.scrap_spawn_chance:
                        scrap_entity = self._spawn_scrap(asteroid.position)
                        if scrap_entity:
                            self.entities.append(scrap_entity)
                    
                    # Split asteroid if applicable
                    new_asteroids = asteroid.split_asteroid()
                    self.entities.extend(new_asteroids)
                    
                    # Update score
                    if asteroid.entity_type == EntityType.LARGE_ASTEROID:
                        self.physics_state.score += 20
                    elif asteroid.entity_type == EntityType.MEDIUM_ASTEROID:
                        self.physics_state.score += 50
                    elif asteroid.entity_type == EntityType.SMALL_ASTEROID:
                        self.physics_state.score += 100
                    
                    break
        
        # Check ship-asteroid collisions
        if self.ship_entity and self.ship_entity.active:
            for asteroid in [e for e in self.entities if e.entity_type in [EntityType.LARGE_ASTEROID, EntityType.MEDIUM_ASTEROID, EntityType.SMALL_ASTEROID] and e.active]:
                if self.ship_entity.check_collision(asteroid):
                    # Ship collision - game over
                    self.ship_entity.active = False
                    self.game_active = False
                    break
        
        # Check ship-scrap collisions (collection trigger)
        if self.ship_entity and self.ship_entity.active:
            for scrap in [e for e in self.entities if e.entity_type == EntityType.SCRAP and e.active]:
                if self.ship_entity.check_collision(scrap):
                    # Collect scrap
                    collection_data = scrap.collect()
                    if collection_data:
                        # Update locker
                        notification = self.scrap_locker.add_scrap(
                            collection_data['scrap_type'], 
                            collection_data['scrap_value']
                        )
                        
                        # Store notification for terminal handshake
                        if not hasattr(self, 'pending_notifications'):
                            self.pending_notifications = []
                        self.pending_notifications.append(notification)
    
    def _spawn_scrap(self, position: Vector2) -> Optional[ScrapEntity]:
        """Spawn scrap entity at given position"""
        try:
            # Add small random offset to prevent overlap
            offset_x = random.uniform(-5, 5)
            offset_y = random.uniform(-5, 5)
            scrap_position = position + Vector2(offset_x, offset_y)
            
            # Create scrap entity
            scrap = ScrapEntity(scrap_position)
            
            # Add small random velocity for visual interest
            drift_angle = random.uniform(0, 2 * math.pi)
            drift_speed = random.uniform(5, 15)
            scrap.velocity = Vector2.from_angle(drift_angle, drift_speed)
            
            return scrap
            
        except Exception as e:
            print(f"⚠️ Failed to spawn scrap: {e}")
            return None
    
    def _update_energy(self, dt: float) -> None:
        """Update energy based on thrust usage"""
        if self.thrust_active and self.ship_entity and self.ship_entity.active:
            energy_cost = self.thrust_cost * dt
            self.physics_state.energy = max(0.0, self.physics_state.energy - energy_cost)
        
        # Slowly regenerate energy when not thrusting
        elif not self.thrust_active and self.physics_state.energy < 100.0:
            self.physics_state.energy = min(100.0, self.physics_state.energy + (2.0 * dt))
    
    def _cleanup_entities(self) -> None:
        """Remove inactive entities from the simulation"""
        self.entities = [e for e in self.entities if e.active]
    
    def _update_physics_state(self) -> None:
        """Update the physics state snapshot"""
        self.physics_state.entities = self.entities.copy()
        self.physics_state.ship_entity = self.ship_entity
    
    def fire_bullet(self) -> Result[None]:
        """Fire a bullet from the ship"""
        try:
            if not self.ship_entity or not self.ship_entity.active:
                return Result.failure_result("Ship not active")
            
            if self.fire_cooldown > 0.0:
                return Result.failure_result("Weapon on cooldown")
            
            # Create bullet at ship position
            bullet = SpaceEntity(
                entity_type=EntityType.BULLET,
                position=self.ship_entity.position + Vector2.from_angle(self.ship_entity.heading, 5),
                velocity=Vector2.zero(),
                heading=self.ship_entity.heading,
                radius=1.0  # Bullet radius
            )
            
            self.entities.append(bullet)
            self.fire_cooldown = 0.25  # 0.25 second cooldown
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to fire bullet: {str(e)}")
    
    def set_thrust(self, active: bool) -> None:
        """Set thrust state for ship"""
        self.thrust_active = active
    
    def set_rotation(self, direction: float) -> None:
        """Set rotation direction (-1, 0, 1)"""
        self.rotation_input = max(-1.0, min(1.0, direction))
    
    def reset_game(self) -> Result[None]:
        """Reset the game to initial state"""
        try:
            self._initialize_game()
            return Result.success_result(None)
        except Exception as e:
            return Result.failure_result(f"Failed to reset game: {str(e)}")
    
    def get_performance_stats(self) -> Dict[str, float]:
        """Get physics performance statistics"""
        if not self.frame_times:
            return {
                'avg_frame_time': 0.0,
                'min_frame_time': 0.0,
                'max_frame_time': 0.0,
                'fps': 0.0
            }
        
        avg_time = sum(self.frame_times) / len(self.frame_times)
        min_time = min(self.frame_times)
        max_time = max(self.frame_times)
        fps = 1.0 / avg_time if avg_time > 0 else 0.0
        
        return {
            'avg_frame_time': avg_time,
            'min_frame_time': min_time,
            'max_frame_time': max_time,
            'fps': fps
        }
    
    def get_entity_count(self) -> Dict[str, int]:
        """Get count of entities by type"""
        counts = {}
        for entity_type in EntityType:
            counts[entity_type.value] = 0
        
        for entity in self.entities:
            if entity.active:
                counts[entity.entity_type.value] += 1
        
        return counts
    
    def get_debug_info(self) -> Dict[str, Any]:
        """Get debug information for the physics system"""
        if self.ship_entity:
            ship_info = {
                'position': self.ship_entity.position.to_tuple(),
                'velocity': self.ship_entity.velocity.to_tuple(),
                'heading': self.ship_entity.heading,
                'speed': self.ship_entity.velocity.magnitude(),
                'active': self.ship_entity.active
            }
        else:
            ship_info = {}
        
        # Get scrap debug info
        scrap_entities = [e for e in self.entities if e.entity_type == EntityType.SCRAP and e.active]
        scrap_info = {
            'active_scrap_count': len(scrap_entities),
            'scrap_positions': [s.position.to_tuple() for s in scrap_entities[:5]]  # First 5 for debug
        }
        
        return {
            'game_active': self.game_active,
            'game_time': self.physics_state.game_time,
            'frame_count': self.physics_state.frame_count,
            'score': self.physics_state.score,
            'energy': self.physics_state.energy,
            'entity_count': len(self.entities),
            'ship': ship_info,
            'scrap': scrap_info,
            'scrap_locker': self.scrap_locker.get_locker_summary(),
            'performance': self.get_performance_stats(),
            'entity_counts': self.get_entity_count(),
            'pending_notifications': getattr(self, 'pending_notifications', [])
        }
    
    def get_pending_notifications(self) -> List[Dict[str, Any]]:
        """Get and clear pending notifications for terminal handshake"""
        notifications = getattr(self, 'pending_notifications', [])
        self.pending_notifications = []
        return notifications
    
    def get_scrap_locker(self) -> ScrapLocker:
        """Get scrap locker instance for external access"""
        return self.scrap_locker
