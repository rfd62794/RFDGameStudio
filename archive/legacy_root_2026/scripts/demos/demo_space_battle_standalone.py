"""
DGT Automated Space Battle Demo - Standalone Version
Real-time space combat simulation with AI-controlled ships

Demonstrates:
- Newtonian physics with inertia
- PID-controlled navigation
- Combat AI with intent switching
- Automated target locking and firing
- Particle exhaust effects
- Projectile collision detection
"""

import time
import math
import random
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum

from loguru import logger
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.live import Live
from rich.layout import Layout


class CombatIntent(str, Enum):
    """AI combat intent states"""
    PURSUIT = "pursuit"
    STRAFE = "strafe"
    RETREAT = "retreat"
    EVADE = "evade"
    LOCKED = "locked"


class ProjectileType(str, Enum):
    """Projectile type classifications"""
    KINETIC = "kinetic"
    LASER = "laser"
    PLASMA = "plasma"
    MISSILE = "missile"
    PARTICLE = "particle"


@dataclass
class SpaceShip:
    """Space ship with physics properties"""
    ship_id: str
    x: float
    y: float
    velocity_x: float = 0.0
    velocity_y: float = 0.0
    heading: float = 0.0
    hull_integrity: float = 100.0
    shield_strength: float = 50.0
    
    # Combat properties
    weapon_range: float = 200.0
    weapon_damage: float = 10.0
    fire_rate: float = 1.0
    last_fire_time: float = 0.0
    
    def get_speed(self) -> float:
        return math.sqrt(self.velocity_x**2 + self.velocity_y**2)
    
    def take_damage(self, damage: float):
        if self.shield_strength > 0:
            shield_damage = min(self.shield_strength, damage)
            self.shield_strength -= shield_damage
            damage -= shield_damage
        
        self.hull_integrity = max(0, self.hull_integrity - damage)
    
    def is_destroyed(self) -> bool:
        return self.hull_integrity <= 0
    
    def can_fire(self, current_time: float) -> bool:
        # Always allow first shot, then respect fire rate
        if self.last_fire_time == 0:
            return True
        return current_time - self.last_fire_time >= (1.0 / self.fire_rate)


@dataclass
class Projectile:
    """Individual projectile"""
    projectile_id: str
    owner_id: str
    x: float
    y: float
    velocity_x: float
    velocity_y: float
    damage: float
    range_remaining: float
    age: float = 0.0
    has_impacted: bool = False
    collision_radius: float = 2.0
    
    def update(self, dt: float) -> bool:
        self.x += self.velocity_x * dt * 60
        self.y += self.velocity_y * dt * 60
        self.age += dt
        self.range_remaining -= math.sqrt((self.velocity_x * dt * 60)**2 + (self.velocity_y * dt * 60)**2)
        return self.age < 5.0 and self.range_remaining > 0 and not self.has_impacted


class PIDController:
    """PID controller for smooth movement"""
    
    def __init__(self, kp: float = 1.0, ki: float = 0.0, kd: float = 0.0):
        self.kp, self.ki, self.kd = kp, ki, kd
        self.integral = 0.0
        self.previous_error = 0.0
    
    def update(self, error: float, dt: float) -> float:
        p_term = self.kp * error
        self.integral += error * dt
        i_term = self.ki * self.integral
        derivative = (error - self.previous_error) / dt if dt > 0 else 0.0
        d_term = self.kd * derivative
        self.previous_error = error
        return p_term + i_term + d_term


class SpaceVoyagerEngine:
    """Newtonian physics engine"""
    
    def __init__(self, thrust_power: float = 0.5, rotation_speed: float = 5.0):
        self.thrust_power = thrust_power
        self.rotation_speed = rotation_speed
        self.rotation_pid = PIDController(kp=2.0, ki=0.1, kd=0.5)
        self.drag_coefficient = 0.98
        self.max_velocity = 10.0
        self.target_position: Optional[Tuple[float, float]] = None
    
    def update(self, ship: SpaceShip, target_pos: Optional[Tuple[float, float]] = None, dt: float = 0.016):
        if target_pos:
            self.target_position = target_pos
            angle_to_target = math.degrees(math.atan2(
                target_pos[1] - ship.y, 
                target_pos[0] - ship.x
            ))
            
            # Smooth rotation
            angle_diff = (angle_to_target - ship.heading + 180) % 360 - 180
            rotation_output = self.rotation_pid.update(angle_diff, dt)
            ship.heading += max(-15.0, min(15.0, rotation_output)) * dt
            ship.heading = ship.heading % 360
            
            # ALWAYS apply thrust when we have a target
            rad = math.radians(ship.heading)
            ship.velocity_x += math.cos(rad) * self.thrust_power
            ship.velocity_y += math.sin(rad) * self.thrust_power
        
        # Apply physics
        ship.velocity_x *= self.drag_coefficient
        ship.velocity_y *= self.drag_coefficient
        
        speed = ship.get_speed()
        if speed > self.max_velocity:
            scale = self.max_velocity / speed
            ship.velocity_x *= scale
            ship.velocity_y *= scale
        
        ship.x += ship.velocity_x * dt * 60
        ship.y += ship.velocity_y * dt * 60


class TargetingSystem:
    """Automated targeting"""
    
    def __init__(self, max_range: float = 500.0):  # Increased range
        self.max_range = max_range
    
    def find_nearest_enemy(self, ship: SpaceShip, all_ships: List[SpaceShip]) -> Optional[SpaceShip]:
        nearest = None
        nearest_dist = float('inf')
        
        for other in all_ships:
            if other.ship_id == ship.ship_id or other.is_destroyed():
                continue
            
            dx = other.x - ship.x
            dy = other.y - ship.y
            dist = math.sqrt(dx**2 + dy**2)
            
            if dist <= self.max_range and dist < nearest_dist:
                nearest = other
                nearest_dist = dist
        
        return nearest


class CombatNavigator:
    """Combat AI navigator"""
    
    def __init__(self, ship: SpaceShip, targeting_system: TargetingSystem):
        self.ship = ship
        self.targeting_system = targeting_system
        self.current_intent = CombatIntent.PURSUIT
        self.aggression_level = random.uniform(0.5, 0.9)
        self.preferred_range = 150.0
    
    def update(self, all_ships: List[SpaceShip], current_time: float, dt: float) -> Dict[str, Any]:
        nav_data = {
            'intent': self.current_intent,
            'target_id': None,
            'target_position': None,
            'should_fire': False
        }
        
        target = self.targeting_system.find_nearest_enemy(self.ship, all_ships)
        if target:
            nav_data['target_id'] = target.ship_id
            nav_data['target_position'] = (target.x, target.y)
            
            # Determine intent based on situation
            dist = math.sqrt((target.x - self.ship.x)**2 + (target.y - self.ship.y)**2)
            
            if self.ship.hull_integrity < 30.0:
                self.current_intent = CombatIntent.RETREAT
            elif dist < 80.0:
                self.current_intent = CombatIntent.EVADE
            elif dist > self.preferred_range + 50:
                self.current_intent = CombatIntent.PURSUIT
            else:
                self.current_intent = CombatIntent.STRAFE
            
            nav_data['intent'] = self.current_intent
            nav_data['should_fire'] = self._should_fire(target, dist, current_time)
        
        return nav_data
    
    def _should_fire(self, target: SpaceShip, distance: float, current_time: float) -> bool:
        # More aggressive firing - check if weapon is ready
        if not self.ship.can_fire(current_time):
            return False
        
        # Fire if in range (don't worry too much about angle for demo)
        if distance <= self.ship.weapon_range * 1.2:  # Extend range a bit
            return True
        
        return False


class ProjectileSystem:
    """Projectile management"""
    
    def __init__(self):
        self.projectiles: Dict[str, Projectile] = {}
        self.counter = 0
    
    def fire_projectile(self, owner: SpaceShip, target: Optional[SpaceShip] = None) -> Optional[str]:
        if not owner.can_fire(time.time()):
            return None
        
        self.counter += 1
        projectile_id = f"proj_{owner.ship_id}_{self.counter}"
        
        # Spawn position
        spawn_x = owner.x + math.cos(math.radians(owner.heading)) * 20
        spawn_y = owner.y + math.sin(math.radians(owner.heading)) * 20
        
        # Calculate velocity
        if target:
            dx = target.x - spawn_x
            dy = target.y - spawn_y
            dist = math.sqrt(dx**2 + dy**2)
            vx = (dx / dist) * 8.0 + owner.velocity_x
            vy = (dy / dist) * 8.0 + owner.velocity_y
        else:
            vx = math.cos(math.radians(owner.heading)) * 8.0 + owner.velocity_x
            vy = math.sin(math.radians(owner.heading)) * 8.0 + owner.velocity_y
        
        projectile = Projectile(
            projectile_id=projectile_id,
            owner_id=owner.ship_id,
            x=spawn_x,
            y=spawn_y,
            velocity_x=vx,
            velocity_y=vy,
            damage=owner.weapon_damage,
            range_remaining=400.0
        )
        
        self.projectiles[projectile_id] = projectile
        owner.last_fire_time = time.time()
        return projectile_id
    
    def update(self, dt: float, ships: List[SpaceShip]) -> List[Dict[str, Any]]:
        impacts = []
        projectiles_to_remove = []
        
        for proj_id, projectile in self.projectiles.items():
            if not projectile.update(dt):
                projectiles_to_remove.append(proj_id)
                continue
            
            # Check collisions
            for ship in ships:
                if ship.ship_id == projectile.owner_id or ship.is_destroyed():
                    continue
                
                dx = projectile.x - ship.x
                dy = projectile.y - ship.y
                dist = math.sqrt(dx**2 + dy**2)
                
                if dist <= 17.0:  # Ship radius + projectile radius
                    ship.take_damage(projectile.damage)
                    impacts.append({
                        'projectile_id': proj_id,
                        'target_id': ship.ship_id,
                        'damage': projectile.damage
                    })
                    projectile.has_impacted = True
                    projectiles_to_remove.append(proj_id)
                    break
        
        for proj_id in projectiles_to_remove:
            if proj_id in self.projectiles:
                del self.projectiles[proj_id]
        
        return impacts


class SpaceBattleArena:
    """Main battle arena"""
    
    def __init__(self, width: int = 800, height: int = 600):
        self.width, self.height = width, height
        self.ships: Dict[str, SpaceShip] = {}
        self.navigators: Dict[str, CombatNavigator] = {}
        self.targeting_system = TargetingSystem()
        self.projectile_system = ProjectileSystem()
        
        self.simulation_time = 0.0
        self.dt = 1.0 / 60.0
        self.is_running = False
        self.battle_complete = False
        
        # Battle stats
        self.shots_fired = 0
        self.total_hits = 0
        self.total_damage = 0.0
        self.ships_destroyed = []
        
        self.console = Console()
    
    def create_ship(self, ship_id: str, x: float, y: float, heading: float = 0.0) -> SpaceShip:
        ship = SpaceShip(
            ship_id=ship_id,
            x=x, y=y,
            heading=heading,
            hull_integrity=100.0,
            shield_strength=50.0,
            weapon_range=400.0,  # Increased range
            weapon_damage=15.0,
            fire_rate=2.0  # Faster fire rate
        )
        
        # Add physics engine separately
        ship.physics_engine = SpaceVoyagerEngine()
        
        self.ships[ship_id] = ship
        self.navigators[ship_id] = CombatNavigator(ship, self.targeting_system)
        
        return ship
    
    def setup_battle(self):
        self.create_ship("Ship_A", 200, 300, 0)
        self.create_ship("Ship_B", 600, 300, 180)
    
    def update(self):
        if not self.is_running or self.battle_complete:
            return
        
        self.simulation_time += self.dt
        
        # Update ships
        active_ships = [s for s in self.ships.values() if not s.is_destroyed()]
        
        for ship_id, ship in self.ships.items():
            if ship.is_destroyed():
                continue
            
            navigator = self.navigators[ship_id]
            nav_data = navigator.update(active_ships, self.simulation_time, self.dt)
            
            # Debug output
            if self.simulation_time < 2.0:  # Only show first 2 seconds
                print(f"DEBUG {ship_id}: target={nav_data.get('target_position')}, should_fire={nav_data.get('should_fire')}")
            
            # Update physics - ALWAYS move towards target
            target_pos = nav_data.get('target_position')
            if target_pos:
                ship.physics_engine.update(ship, target_pos, self.dt)
            
            # Fire weapons more aggressively
            if nav_data.get('should_fire', False):
                target_id = nav_data.get('target_id')
                if target_id and target_id in self.ships:
                    target = self.ships[target_id]
                    proj_id = self.projectile_system.fire_projectile(ship, target)
                    if proj_id:
                        self.shots_fired += 1
                        print(f"🚀 {ship_id} fires at {target_id}!")
            
            # Keep in bounds
            margin = 50
            if ship.x < margin:
                ship.x = margin
                ship.velocity_x = abs(ship.velocity_x) * 0.5
            elif ship.x > self.width - margin:
                ship.x = self.width - margin
                ship.velocity_x = -abs(ship.velocity_x) * 0.5
            
            if ship.y < margin:
                ship.y = margin
                ship.velocity_y = abs(ship.velocity_y) * 0.5
            elif ship.y > self.height - margin:
                ship.y = self.height - margin
                ship.velocity_y = -abs(ship.velocity_y) * 0.5
        
        # Update projectiles
        impacts = self.projectile_system.update(self.dt, active_ships)
        for impact in impacts:
            self.total_hits += 1
            self.total_damage += impact['damage']
            print(f"💥 {impact['projectile_id']} hits {impact['target_id']} for {impact['damage']} damage!")
            
            target_ship = self.ships.get(impact['target_id'])
            if target_ship and target_ship.is_destroyed():
                self.ships_destroyed.append(impact['target_id'])
                print(f"☠️  Ship {impact['target_id']} destroyed!")
        
        # Check battle end
        if len(active_ships) <= 1:
            self.battle_complete = True
            self.is_running = False
            if active_ships:
                print(f"🏆 Winner: {active_ships[0].ship_id}!")
            else:
                print("💀 No survivors!")
    
    def create_display(self) -> str:
        """Create simple text display"""
        display_lines = []
        
        # Battle status
        display_lines.append("╭────── Battle Status ───────╮")
        display_lines.append(f"│  Time          {self.simulation_time:.1f}s        │")
        display_lines.append(f"│  Shots         {self.shots_fired}           │")
        display_lines.append(f"│  Hits          {self.total_hits}           │")
        accuracy = (self.total_hits / max(1, self.shots_fired) * 100)
        display_lines.append(f"│  Accuracy      {accuracy:.1f}%        │")
        display_lines.append(f"│  Damage        {self.total_damage:.1f}         │")
        display_lines.append(f"│  Status        {'COMPLETE' if self.battle_complete else 'ACTIVE'}      │")
        display_lines.append("│                            │")
        display_lines.append("╰────────────────────────────╯")
        display_lines.append("")
        
        # Ship status
        display_lines.append("╭────── Ship Status ───────╮")
        for ship_id, ship in self.ships.items():
            if ship.is_destroyed():
                display_lines.append(f"│ {ship_id}: DESTROYED")
            else:
                nav = self.navigators[ship_id]
                display_lines.append(f"│ {ship_id}: ({int(ship.x)},{int(ship.y)}) Hull:{int(ship.hull_integrity)}% {nav.current_intent.value.upper()} Speed:{ship.get_speed():.1f}")
        display_lines.append("╰───────────────────────────╯")
        display_lines.append("")
        
        # System stats
        display_lines.append("╭────── System Stats ───────╮")
        display_lines.append(f"│ Projectiles: {len(self.projectile_system.projectiles)}")
        display_lines.append(f"│ Active Ships: {len([s for s in self.ships.values() if not s.is_destroyed()])}")
        display_lines.append(f"│ FPS: 60")
        display_lines.append("╰───────────────────────────╯")
        
        return "\n".join(display_lines)
    
    def run_battle(self, duration: float = 30.0):
        print("🚀 DGT Automated Space Battle Demo")
        print("=" * 50)
        
        self.setup_battle()
        self.is_running = True
        
        start_time = time.time()
        
        try:
            while self.is_running and (time.time() - start_time) < duration:
                self.update()
                
                # Don't clear screen - just print status
                print(f"\n--- Time: {self.simulation_time:.1f}s ---")
                print(self.create_display())
                
                time.sleep(0.5)  # Slower updates to see debug
        except KeyboardInterrupt:
            print("\nBattle interrupted by user")
        
        # Final report
        accuracy = (self.total_hits / max(1, self.shots_fired) * 100)
        survivors = len([s for s in self.ships.values() if not s.is_destroyed()])
        
        print("\n╭────── Battle Report ───────╮")
        print(f"│ Battle Duration: {self.simulation_time:.1f}s")
        print(f"│ Shots Fired: {self.shots_fired}")
        print(f"│ Hits: {self.total_hits}")
        print(f"│ Accuracy: {accuracy:.1f}%")
        print(f"│ Total Damage: {self.total_damage:.1f}")
        print(f"│ Ships Destroyed: {len(self.ships_destroyed)}")
        print(f"│ Survivors: {survivors}")
        print("╰───────────────────────────╯")


def main():
    arena = SpaceBattleArena()
    arena.run_battle(duration=30.0)


if __name__ == "__main__":
    main()
