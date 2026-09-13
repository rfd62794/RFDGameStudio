"""
Asteroids Strategy - Lean Orchestrator
Refactored to use component-based architecture with EntityManager, Spawner, and Collision systems
"""

from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import math

from dgt_engine.foundation.interfaces.protocols import RenderProtocol
from dgt_engine.foundation.types import Result
from dgt_engine.foundation.base import BasePPU
from dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT, SOVEREIGN_PIXELS
from dgt_engine.systems.body.animation import SpriteAnimator, NewtonianGhostRenderer
from dgt_engine.systems.kernel.controller import BaseController, ControlInput, ControllerManager
from dgt_engine.systems.body.systems.entity_manager import EntityManager, ShipEntity, AsteroidEntity, BulletEntity
from dgt_engine.systems.body.systems.spawner import EntitySpawner, create_asteroid_spawn_config, create_wave_configs
from dgt_engine.systems.body.systems.collision import CollisionSystem, create_asteroids_collision_groups, setup_asteroids_collision_handlers
from dgt_engine.systems.body.systems.status_manager import StatusManager, setup_asteroids_status_manager
from .physics_body import PhysicsBody, PhysicsState
from .entities.space_entity import SpaceEntity, EntityType
from dgt_engine.foundation.vector import Vector2
from .scrap_entity import ScrapEntity


class AsteroidsStrategy:
    """Lean orchestrator for asteroids game using component systems"""
    
    def __init__(self):
        # Core systems
        self.entity_manager = EntityManager()
        self.spawner = EntitySpawner(self.entity_manager)
        self.collision_system = CollisionSystem()
        self.status_manager = setup_asteroids_status_manager()
        
        # Controller system
        self.controller_manager = ControllerManager()
        
        # Rendering (legacy support)
        self.frame_buffer: Optional[bytearray] = None
        self.width = SOVEREIGN_WIDTH
        self.height = SOVEREIGN_HEIGHT
        
        # Animation systems (legacy)
        self.sprite_animator = SpriteAnimator()
        self.ghost_renderer = NewtonianGhostRenderer(self.width, self.height)
        
        # Game state
        self.game_over = False
        self.game_time = 0.0
        
        # Rendering properties
        self.clear_color = 0  # Black background
        self.ship_color = 1   # White ship
        self.asteroid_color = 2  # Gray asteroids
        
        # Initialize systems
        self._initialize_systems()
        
        logger.info("🎮 AsteroidsStrategy initialized with component systems")
    
    def _initialize_systems(self) -> None:
        """Initialize all component systems"""
        # Register entity types
        self.entity_manager.register_entity_type("ship", ShipEntity, pool_size=1)
        self.entity_manager.register_entity_type("asteroid", AsteroidEntity, pool_size=20)
        self.entity_manager.register_entity_type("bullet", BulletEntity, pool_size=30)
        
        # Setup spawn configurations
        asteroid_config = create_asteroid_spawn_config()
        self.spawner.register_spawn_type("asteroids", asteroid_config)
        
        wave_configs = create_wave_configs()
        self.spawner.register_wave_config("asteroids", wave_configs["asteroid"])
        
        # Setup collision system
        collision_groups = create_asteroids_collision_groups()
        for group in collision_groups.values():
            self.collision_system.register_collision_group(group)
        
        setup_asteroids_collision_handlers(self.collision_system)
        
        # Spawn initial asteroids
        self.spawner.spawn_wave("asteroids", wave_number=1)
        
        logger.info("☄️ Initial asteroids spawned")
    
    def render_state(self, game_state: Any) -> Result[bytes]:
        """Render a complete frame from physics state"""
        try:
            # Update physics
            current_time = 0.0  # Would use actual time in production
            physics_result = self.physics_body.update(current_time)
            if not physics_result.success:
                return Result.failure_result(f"Physics update failed: {physics_result.error}")
            
            physics_state = physics_result.value
            
            # Update energy level from physics state
            self.energy_level = physics_state.energy
            
            # Clear frame buffer
            self._clear_frame_buffer()
            
            # Render all entities
            self._render_entities(physics_state.entities)
            
            # Apply energy-based effects
            self._apply_energy_effects()
            
            # Return frame buffer
            return Result.success_result(bytes(self.frame_buffer))
            
        except Exception as e:
            return Result.failure_result(f"Render failed: {str(e)}")
    
    def _clear_frame_buffer(self) -> None:
        """Clear the frame buffer to background color"""
        if self.frame_buffer:
            self.frame_buffer[:] = bytes([self.clear_color]) * len(self.frame_buffer)
    
    def set_controller(self, controller: BaseController) -> Result[bool]:
        """Set the active controller for the game"""
        try:
            register_result = self.controller_manager.register_controller(controller)
            if not register_result.success:
                return register_result
            
            set_result = self.controller_manager.set_active_controller(controller.controller_id)
            
            # Verify controller is actually active
            if set_result.success:
                active = self.controller_manager.get_active_controller()
                if active and active.controller_id == controller.controller_id:
                    logger.info(f"✅ Controller '{controller.controller_id}' is now active")
                    return Result(success=True, value=True)
                else:
                    return Result(success=False, error="Controller registration succeeded but activation failed")
            
            return set_result
            
        except Exception as e:
            return Result(success=False, error=f"Failed to set controller: {e}")
    
    def update_game_state(self, dt: float, world_data: Dict[str, Any]) -> Result[Dict[str, Any]]:
        """Update game state with controller input"""
        try:
            if self.game_over:
                return Result(success=True, value={'game_over': True, 'lives': self.lives, 'score': self.score})
            
            # Get controller input
            entity_state = {
                'x': self.physics_body.position.x,
                'y': self.physics_body.position.y,
                'vx': self.physics_body.velocity.x,
                'vy': self.physics_body.velocity.y,
                'angle': self.physics_body.angle,
                'energy': self.energy_level,
                'invulnerable': self.invulnerable_time > 0
            }
            
            control_result = self.controller_manager.update_active_controller(dt, entity_state, world_data)
            if not control_result.success:
                return Result(success=False, error=f"Controller update failed: {control_result.error}")
            
            control_input = control_result.value
            
            # Apply control input to physics
            self._apply_control_input(control_input, dt)
            
            # Update invulnerability
            if self.invulnerable_time > 0:
                self.invulnerable_time -= dt
            
            # Update physics
            self.physics_body.update(dt)
            
            # Check collisions
            collision_result = self._check_collisions(world_data)
            
            # Return game state
            game_state = {
                'position': {'x': self.physics_body.position.x, 'y': self.physics_body.position.y},
                'velocity': {'x': self.physics_body.velocity.x, 'y': self.physics_body.velocity.y},
                'angle': self.physics_body.angle,
                'lives': self.lives,
                'score': self.score,
                'energy': self.energy_level,
                'invulnerable': self.invulnerable_time > 0,
                'game_over': self.game_over,
                'controller_info': self.controller_manager.get_controller_status()
            }
            
            return Result(success=True, value=game_state)
            
        except Exception as e:
            return Result(success=False, error=f"Game state update failed: {e}")
    
    def _apply_control_input(self, control_input: ControlInput, dt: float) -> None:
        """Apply controller input to physics body"""
        # Apply thrust
        if control_input.thrust != 0:
            thrust_magnitude = control_input.thrust * 50.0  # Max thrust of 50 units
            thrust_x = thrust_magnitude * math.cos(self.physics_body.angle)
            thrust_y = thrust_magnitude * math.sin(self.physics_body.angle)
            
            self.physics_body.apply_force(thrust_x, thrust_y)
            
            # Drain energy for thrust
            self.energy_level = max(0, self.energy_level - abs(control_input.thrust) * dt * 10)
        
        # Apply rotation
        if control_input.rotation != 0:
            rotation_speed = control_input.rotation * 3.0  # Max 3 radians per second
            self.physics_body.angle += rotation_speed * dt
            self.physics_body.angle = self.physics_body.angle % (2 * math.pi)
        
        # Handle weapon fire
        if control_input.fire_weapon:
            self._fire_weapon()
    
    def _fire_weapon(self) -> None:
        """Fire weapon (create bullet)"""
        if self.energy_level >= 5:  # Cost 5 energy per shot
            self.energy_level -= 5
            # Bullet creation would be handled by the game manager
            # For now, just deduct energy
    
    def _check_collisions(self, world_data: Dict[str, Any]) -> Result[Dict[str, Any]]:
        """Check for collisions with asteroids and handle game logic"""
        try:
            asteroids = world_data.get('asteroids', [])
            
            for asteroid in asteroids:
                asteroid_pos = Vector2(asteroid['x'], asteroid['y'])
                distance = self.physics_body.position.distance_to(asteroid_pos)
                
                # Check collision (ship radius ~5, asteroid radius varies)
                collision_distance = 5.0 + asteroid.get('radius', 10.0)
                
                if distance < collision_distance:
                    if self.invulnerable_time <= 0:
                        # Ship hit!
                        self.lives -= 1
                        self.invulnerable_time = 3.0  # 3 seconds of invulnerability
                        
                        if self.lives <= 0:
                            self.game_over = True
                        
                        return Result(success=True, value={
                            'collision': True,
                            'lives_remaining': self.lives,
                            'invulnerable': True
                        })
            
            return Result(success=True, value={'collision': False})
            
        except Exception as e:
            return Result(success=False, error=f"Collision check failed: {e}")
    
    def get_hud_data(self) -> Dict[str, Any]:
        """Get HUD data for display"""
        return {
            'lives': self.lives,
            'score': self.score,
            'energy': self.energy_level,
            'invulnerable': self.invulnerable_time > 0,
            'position': {'x': self.physics_body.position.x, 'y': self.physics_body.position.y},
            'velocity': math.sqrt(self.physics_body.velocity.x ** 2 + self.physics_body.velocity.y ** 2)
        }
    
    def _render_entities(self, entities: List[SpaceEntity]) -> None:
        """Render all entities with Newtonian ghosting"""
        for entity in entities:
            if not entity.active:
                continue
            
            if entity.entity_type == EntityType.SHIP:
                self._render_ship(entity)
            elif entity.entity_type == EntityType.BULLET:
                self._render_bullet(entity)
            elif entity.entity_type in [EntityType.LARGE_ASTEROID, EntityType.MEDIUM_ASTEROID, EntityType.SMALL_ASTEROID]:
                self._render_asteroid(entity)
            elif entity.entity_type == EntityType.SCRAP:
                self._render_scrap(entity)
    
    def _render_ship(self, ship: SpaceEntity) -> None:
        """Render the player ship as a triangle"""
        # Get world vertices
        vertices = ship.get_world_vertices()
        
        # Render main ship
        self._render_triangle(vertices, self.ship_color)
        
        # Render Newtonian ghosts if near boundaries
        ghost_positions = ship.get_wrapped_positions()
        for ghost_pos in ghost_positions[1:]:  # Skip the main position
            ghost_vertices = []
            for vertex in vertices:
                # Calculate ghost vertex position
                offset = ghost_pos - ship.position
                ghost_vertex = vertex + offset
                ghost_vertices.append(ghost_vertex)
            
            # Render ghost with reduced intensity
            self._render_triangle(ghost_vertices, self.ship_color, alpha=0.5)
    
    def _render_triangle(self, vertices: List[Vector2], color: int, alpha: float = 1.0) -> None:
        """Render a triangle using scanline algorithm"""
        if len(vertices) != 3 or not self.frame_buffer:
            return
        
        # Convert vertices to integer coordinates
        points = [(int(v.x), int(v.y)) for v in vertices]
        
        # Simple triangle rendering using line drawing
        # Draw triangle outline
        self._draw_line(points[0], points[1], color, alpha)
        self._draw_line(points[1], points[2], color, alpha)
        self._draw_line(points[2], points[0], color, alpha)
        
        # Fill triangle (simple flood fill approach)
        # For now, just outline - can be enhanced later
    
    def _render_asteroid(self, asteroid: SpaceEntity) -> None:
        """Render an asteroid as a circle"""
        # Render main asteroid
        self._render_circle(asteroid.position, asteroid.radius, self.asteroid_color)
        
        # Render Newtonian ghosts if near boundaries
        ghost_positions = asteroid.get_wrapped_positions()
        for ghost_pos in ghost_positions[1:]:  # Skip the main position
            # Render ghost with reduced intensity
            self._render_circle(ghost_pos, asteroid.radius, self.asteroid_color, alpha=0.5)
    
    def _render_circle(self, center: Vector2, radius: float, color: int, alpha: float = 1.0) -> None:
        """Render a circle using midpoint algorithm"""
        if not self.frame_buffer:
            return
        
        cx, cy = int(center.x), int(center.y)
        r = int(radius)
        
        # Midpoint circle algorithm
        x = 0
        y = r
        d = 1 - r
        
        self._draw_circle_points(cx, cy, x, y, color, alpha)
        
        while x < y:
            x += 1
            if d < 0:
                d += 2 * x + 1
            else:
                y -= 1
                d += 2 * (x - y) + 1
            
            self._draw_circle_points(cx, cy, x, y, color, alpha)
    
    def _draw_circle_points(self, cx: int, cy: int, x: int, y: int, color: int, alpha: float) -> None:
        """Draw 8 symmetric points of a circle"""
        points = [
            (cx + x, cy + y), (cx - x, cy + y),
            (cx + x, cy - y), (cx - x, cy - y),
            (cx + y, cy + x), (cx - y, cy + x),
            (cx + y, cy - x), (cx - y, cy - x)
        ]
        
        for px, py in points:
            self._set_pixel(px, py, color, alpha)
    
    def _render_bullet(self, bullet: SpaceEntity) -> None:
        """Render a bullet as a small circle"""
        # Render main bullet
        self._render_circle(bullet.position, bullet.radius, self.bullet_color)
        
        # Render Newtonian ghosts if near boundaries
        ghost_positions = bullet.get_wrapped_positions()
        for ghost_pos in ghost_positions[1:]:  # Skip the main position
            # Render ghost with reduced intensity
            self._render_circle(ghost_pos, bullet.radius, self.bullet_color, alpha=0.5)
    
    def _draw_line(self, p1: Tuple[int, int], p2: Tuple[int, int], color: int, alpha: float) -> None:
        """Draw a line using Bresenham's algorithm"""
        x1, y1 = p1
        x2, y2 = p2
        
        dx = abs(x2 - x1)
        dy = abs(y2 - y1)
        
        sx = 1 if x1 < x2 else -1
        sy = 1 if y1 < y2 else -1
        
        err = dx - dy
        
        while True:
            self._set_pixel(x1, y1, color, alpha)
            
            if x1 == x2 and y1 == y2:
                break
            
            e2 = 2 * err
            
            if e2 > -dy:
                err -= dy
                x1 += sx
            
            if e2 < dx:
                err += dx
                y1 += sy
    
    def _set_pixel(self, x: int, y: int, color: int, alpha: float) -> None:
        """Set a pixel with alpha blending"""
        if not self.frame_buffer:
            return
        
        # Check bounds
        if x < 0 or x >= self.width or y < 0 or y >= self.height:
            return
        
        # Calculate buffer index
        index = y * self.width + x
        
        # Apply alpha blending (simple approach)
        if alpha >= 1.0:
            self.frame_buffer[index] = color
        elif alpha > 0.0:
            # Blend with background
            current = self.frame_buffer[index]
            blended = int(current * (1 - alpha) + color * alpha)
            self.frame_buffer[index] = blended
    
    def _apply_energy_effects(self) -> None:
        """Apply energy-based visual effects"""
        if not self.frame_buffer:
            return
        
        # Apply energy-based dimming
        energy_factor = self.energy_level / 100.0
        
        if energy_factor < 1.0:
            # Dim the entire frame based on energy level
            for i in range(len(self.frame_buffer)):
                if self.frame_buffer[i] > 0:  # Don't dim background
                    self.frame_buffer[i] = int(self.frame_buffer[i] * energy_factor)
    
    def set_thrust(self, active: bool) -> None:
        """Set thrust state for physics"""
        self.physics_body.set_thrust(active)
    
    def set_rotation(self, direction: float) -> None:
        """Set rotation direction for physics"""
        self.physics_body.set_rotation(direction)
    
    def fire_bullet(self) -> Result[None]:
        """Fire a bullet"""
        return self.physics_body.fire_bullet()
    
    def reset_game(self) -> Result[None]:
        """Reset the game"""
        return self.physics_body.reset_game()
    
    def _render_scrap(self, scrap: ScrapEntity) -> None:
        """Render scrap entity with pulsing glow effect"""
        # Get render data from scrap entity
        render_data = scrap.get_render_data()
        
        if not render_data['active']:
            return
        
        # Render main scrap
        self._render_scrap_pixel(render_data)
        
        # Render Newtonian ghosts if near boundaries
        ghost_positions = scrap.get_wrapped_positions()
        for ghost_pos in ghost_positions[1:]:  # Skip the main position
            # Create ghost render data
            ghost_render_data = render_data.copy()
            ghost_render_data['position'] = ghost_pos
            ghost_render_data['glow_intensity'] *= 0.5  # Reduce ghost intensity
            self._render_scrap_pixel(ghost_render_data)
    
    def _render_scrap_pixel(self, render_data: Dict[str, Any]) -> None:
        """Render scrap as pixel(s) with glow effect"""
        if not self.frame_buffer:
            return
        
        position = render_data['position']
        size = render_data['size']
        color = render_data['color']
        intensity = render_data['glow_intensity']
        
        # Apply intensity to color (simple approach)
        if intensity < 1.0:
            color = int(color * intensity)
        
        # Render based on size
        if size == 1:
            # 1x1 pixel
            self._set_pixel(int(position.x), int(position.y), color)
        elif size == 2:
            # 2x2 pixel block
            for dx in range(2):
                for dy in range(2):
                    self._set_pixel(int(position.x + dx), int(position.y + dy), color)
    
    def get_physics_debug_info(self) -> Dict[str, Any]:
        """Get debug information from physics system"""
        return self.physics_body.get_debug_info()
    
    def get_pending_notifications(self) -> List[Dict[str, Any]]:
        """Get pending notifications for terminal handshake"""
        return self.physics_body.get_pending_notifications()
    
    def get_scrap_locker_summary(self) -> Dict[str, Any]:
        """Get scrap locker summary"""
        return self.physics_body.get_scrap_locker().get_locker_summary()
    
    def get_render_stats(self) -> Dict[str, Any]:
        """Get rendering statistics"""
        return {
            'render_count': self.render_count,
            'frame_buffer_size': len(self.frame_buffer) if self.frame_buffer else 0,
            'resolution': f"{self.width}x{self.height}",
            'energy_level': self.energy_level
        }
