"""Deterministic Race Engine for Slimes.
Adapted from TurboShells.
"""

import time
import math
from typing import List, Optional
from src.shared.genetics.genome import SlimeGenome, calculate_race_stats
from src.shared.teams.roster import RosterSlime
from src.shared.teams.stat_calculator import calculate_speed
from .race_track import get_terrain_at, get_terrain_speed_modifier
from .movement_type import classify_movement, MovementType
from .movement_profiles import MOVEMENT_PROFILES

from src.shared.simulation.base_engine import BaseParticipant, BaseEngine

class RaceParticipant(BaseParticipant):
    def __init__(self, slime: RosterSlime):
        super().__init__(slime)
        self.slime = slime
        self.distance = 0.0
        self.velocity = 0.0
        self.finished = False
        self.rank = 0
        self.base_speed = calculate_speed(slime.genome, slime.level)
        
        # Lap tracking
        self.laps_complete = 0
        self.finish_position = 0
        
        # Calculate race stats from genome
        race_stats = calculate_race_stats(slime.genome)
        self.mass = race_stats["mass"]
        self.heft_power = race_stats["heft_power"]
        self.strength = race_stats["strength"]
        
        # Movement type classification
        self.movement_type = classify_movement(slime.genome)
        self.profile = MOVEMENT_PROFILES[self.movement_type]
        
        # Jump state
        self.jump_phase = 0.0      # 0.0 = grounded, 0-1 = in jump arc
        self.jump_height = 0.0     # current visual height
        self.is_jumping = False
        self.jump_cooldown = 0.0   # recovery time after landing
        
        # Jump stats from race stats, overridden by movement profile
        self.max_jump_height = self.profile["jump_height_max"]
        self.jump_distance = race_stats["jump_distance"]
        self.jump_speed = 0.8 + slime.genome.energy * 0.4  # Still use energy for rhythm
        self.jump_recovery = self.profile["jump_cooldown"]
        
        # Movement-specific state
        self.ground_time = 0.0
        self.momentum = 0.0  # For rollers
        self.rotation_angle = 0.0  # For rollers
        
        # Physics constants
        self.acceleration_base = self.base_speed * 15.0  # Scales with stats
        self.drag_coefficient = 0.95                    # Simple air/ground resistance
        
    def update(self, dt: float, terrain: str = "grass"):
        if self.finished:
            self.velocity *= 0.9 # Slow down after finish
            return
            
        # Jump physics update
        self._update_jump(dt)
        
        # Base terrain modifier
        terrain_mod = get_terrain_speed_modifier(terrain, self.slime.genome.cultural_base.value)
        
        # Apply movement profile terrain modifiers
        from .race_track import TerrainType
        t_type = TerrainType(terrain)
        if t_type in self.profile["terrain_mods"]:
            terrain_mod *= self.profile["terrain_mods"][t_type]
        
        # Additional terrain modifiers based on mass
        if terrain == "water":
            # Heavy slimes sink more in water
            water_penalty = self.mass * 0.3  # Heavy slimes get extra penalty
            terrain_mod = max(0.3, terrain_mod - water_penalty)
        elif terrain == "rock":
            # Heavy slimes carry momentum through rock
            if self.mass > 0.7:  # Heavy slimes
                terrain_mod = min(1.2, terrain_mod + 0.2)  # Bonus for heavy mass
            else:  # Light slimes bounce off
                terrain_mod = max(0.4, terrain_mod - 0.3)
        elif terrain == "mud":
            # Heavy slimes get stuck in mud
            mud_penalty = self.mass * 0.4
            terrain_mod = max(0.2, terrain_mod - mud_penalty)
        
        # Apply movement profile speed modifier
        speed_modifier = self.profile["speed_modifier"]
        
        # Roller momentum buildup
        if self.movement_type == MovementType.roller:
            self.momentum += self.profile["momentum_buildup"] * dt
            speed_modifier = min(1.4, speed_modifier + self.momentum)
        
        # Distance gained during jump (affected by terrain and movement type)
        distance_gained = 0.0
        if self.is_jumping:
            # Jumping OVER terrain: reduced penalty
            jump_terrain_mod = min(1.0, terrain_mod + 0.3)  # 30% less penalty when jumping
            distance_gained = self.jump_distance * jump_terrain_mod * speed_modifier * dt
        elif self.ground_time > 0:
            # Ground time for scooters
            self.ground_time -= dt
            distance_gained = self.jump_distance * 0.1 * terrain_mod * speed_modifier * dt
        else:
            # Auto-jump or continuous movement
            if self.movement_type == MovementType.roller:
                # Continuous rolling
                distance_gained = self.jump_distance * terrain_mod * speed_modifier * dt
            else:
                # Auto-jump: normal movement
                distance_gained = self.jump_distance * terrain_mod * speed_modifier * dt
        
        self.distance += distance_gained
        
        # Update velocity for compatibility (distance gained per second)
        self.velocity = distance_gained / dt if dt > 0 else 0.0
    
    def _update_jump(self, dt: float):
        """Update jump physics."""
        if self.is_jumping:
            self.jump_phase += self.jump_speed * dt
            
            # Arc: sin curve for smooth up/down
            # Use calculated jump height from race stats
            self.jump_height = math.sin(self.jump_phase * math.pi) * self.max_jump_height
            
            # Land when arc complete
            if self.jump_phase >= 1.0:
                self.is_jumping = False
                self.jump_phase = 0.0
                self.jump_height = 0.0
                self.jump_cooldown = self.jump_recovery
                
                # Start ground time for scooters
                if self.movement_type == MovementType.scooter:
                    self.ground_time = self.profile["ground_time"]
        
        elif self.jump_cooldown > 0:
            # Recovery — brief pause on ground
            self.jump_cooldown -= dt
        
        elif self.ground_time > 0:
            # Ground time for scooters
            self.ground_time -= dt
        
        else:
            # Auto-jump: slimes jump continuously
            if self.movement_type == MovementType.roller:
                # Rollers never jump - continuous movement
                self.is_jumping = False
                self.jump_phase = 0.0
                self.jump_height = 0.0
            else:
                # Auto-jump: normal movement
                self.is_jumping = True
                self.jump_phase = 0.0

class RaceEngine(BaseEngine):
    def __init__(self, participants: List[RosterSlime], track: List[str], length: int = 1500):
        parts = [RaceParticipant(p) for p in participants]
        super().__init__(parts, track)
        self.length = length
        self.total_laps = 3
        self.lap_distance = length / self.total_laps
        self._finish_order = []
        
    def _update_participant(self, p: RaceParticipant, dt: float):
        terrain = get_terrain_at(self.track, p.distance)
        p.update(dt, terrain)
        
        # Lap crossing check (Odometer logic: distance never resets)
        if p.distance >= self.lap_distance * (p.laps_complete + 1):
            p.laps_complete += 1
            
            # Check if race finished
            if p.laps_complete >= self.total_laps:
                p.finished = True
                p.finish_position = len(self._finish_order) + 1
                self._finish_order.append(p)
                p.rank = p.finish_position
            
        # Also check if reached final distance (backup)
        elif p.distance >= self.length * self.total_laps:
            p.distance = self.length * self.total_laps
            if not p.finished:
                p.finished = True
                p.laps_complete = self.total_laps
                p.finish_position = len(self._finish_order) + 1
                self._finish_order.append(p)
                p.rank = p.finish_position
