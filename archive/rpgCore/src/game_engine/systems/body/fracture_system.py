"""
Fracture System - Object Destruction with Debris Generation

Manages destruction of entities with fragment generation, genetic inheritance tracking,
and configurable fracture patterns. Supports arcade-style asteroid splitting and
genetic evolution of fragments.

Features:
- Object pooling for efficient fragment management
- Size-based fracture configurations
- Genetic inheritance and trait tracking
- Cascading wave progression
- Customizable scatter patterns
"""

import math
import random
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum

from src.game_engine.foundation import BaseSystem, SystemConfig, SystemStatus, Result
from src.game_engine.systems.body.entity_manager import Entity, SpaceEntity


@dataclass
class GeneticTraits:
    """Genetic traits for inherited fragments"""
    speed_modifier: float = 1.0
    size_modifier: float = 1.0
    mass_modifier: float = 1.0
    color_shift: int = 0  # 0-360 hue shift
    generation: int = 0


@dataclass
class AsteroidFragment:
    """Fragment data for tracking"""
    entity: SpaceEntity
    size: int  # 1=small, 2=medium, 3=large
    health: float
    radius: float
    color: Tuple[int, int, int]
    point_value: int
    genetic_traits: Optional[GeneticTraits] = None
    genetic_id: str = ""

    def take_damage(self, damage: float) -> bool:
        """Apply damage, return True if destroyed"""
        self.health -= damage
        return self.health <= 0

    def get_genetic_info(self) -> Dict[str, Any]:
        """Get genetic information"""
        if self.genetic_traits:
            return {
                'genetic_id': self.genetic_id,
                'generation': self.genetic_traits.generation,
                'modifiers': {
                    'speed': self.genetic_traits.speed_modifier,
                    'size': self.genetic_traits.size_modifier,
                    'mass': self.genetic_traits.mass_modifier
                }
            }
        return {'genetic_id': self.genetic_id, 'generation': 0}


class FractureSystem(BaseSystem):
    """
    Manages destruction of entities with fragment generation.
    Supports genetic inheritance and configurable fracture patterns.
    """

    def __init__(self, config: Optional[SystemConfig] = None,
                 enable_genetics: bool = True,
                 max_fragments: int = 200):
        super().__init__(config or SystemConfig(name="FractureSystem"))
        self.enable_genetics = enable_genetics
        self.max_fragments = max_fragments

        # Fracture pool
        self.fragment_pool: List[SpaceEntity] = []
        self.active_fragments: Dict[str, AsteroidFragment] = {}

        # Size configurations: size -> (radius, health, points, color, splits)
        self.size_configs = {
            3: {  # Large
                'radius': 8.0,
                'health': 3,
                'points': 20,
                'color': (170, 170, 170),
                'split_count': 2,
                'split_into_size': 2
            },
            2: {  # Medium
                'radius': 4.0,
                'health': 2,
                'points': 50,
                'color': (192, 192, 192),
                'split_count': 2,
                'split_into_size': 1
            },
            1: {  # Small
                'radius': 2.0,
                'health': 1,
                'points': 100,
                'color': (224, 224, 224),
                'split_count': 0,
                'split_into_size': 0
            }
        }

        # Physics parameters
        self.fragment_speed_range = (15.0, 40.0)
        self.scatter_angle_range = math.pi / 3  # 60 degree cone

        # Genetic tracking
        self.discovered_patterns: Dict[str, GeneticTraits] = {}
        self.genetic_lineage: Dict[str, List[str]] = {}
        self.total_fractured = 0
        self.total_fragments_created = 0

    def initialize(self) -> bool:
        """Initialize the fracture system"""
        self._initialize_pool()
        self.status = SystemStatus.RUNNING
        self._initialized = True
        return True

    def tick(self, delta_time: float) -> None:
        """Update active fragments"""
        if self.status != SystemStatus.RUNNING:
            return

        for fragment_data in self.active_fragments.values():
            entity = fragment_data.entity
            # Update position based on velocity
            if hasattr(entity, 'vx') and hasattr(entity, 'x'):
                entity.x += entity.vx * delta_time
                entity.y += entity.vy * delta_time

    def shutdown(self) -> None:
        """Shutdown the fracture system"""
        self.fragment_pool.clear()
        self.active_fragments.clear()
        self.status = SystemStatus.STOPPED

    def process_intent(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        """Process fracture-related intents"""
        action = intent.get("action", "")

        if action == "fracture":
            fragment_id = intent.get("fragment_id", "")
            impact_angle = intent.get("impact_angle")
            result = self._fracture_by_id(fragment_id, impact_angle)
            if result.success:
                return {
                    "fractured": True,
                    "new_fragments": len(result.value)
                }
            return {"fractured": False, "error": result.error}

        elif action == "get_fragments":
            return {"total_active": len(self.active_fragments)}

        elif action == "get_stats":
            return self.get_status()

        else:
            return {"error": f"Unknown FractureSystem action: {action}"}

    def _initialize_pool(self) -> None:
        """Pre-allocate fragment pool"""
        for _ in range(self.max_fragments):
            entity = SpaceEntity()
            entity.entity_type = "fragment"
            entity.active = False
            self.fragment_pool.append(entity)

    def fracture_entity(self, entity: SpaceEntity, size: int,
                       health: float = 3, impact_angle: Optional[float] = None,
                       genetic_traits: Optional[GeneticTraits] = None) -> Result[List[AsteroidFragment]]:
        """
        Fracture an entity into smaller pieces

        Args:
            entity: Entity to fracture
            size: Current size (1-3)
            health: Current health
            impact_angle: Direction of impact for scatter
            genetic_traits: Genetic traits to inherit

        Returns:
            Result with list of new fragments
        """
        try:
            config = self.size_configs.get(size)
            if not config:
                return Result(success=False, error=f"Unknown size: {size}")

            if config['split_count'] == 0:
                return Result(success=True, value=[])

            fragments = []
            parent_pos = (entity.x, entity.y)
            parent_vel = (
                getattr(entity, 'vx', 0.0),
                getattr(entity, 'vy', 0.0)
            )

            # Determine scatter direction
            if impact_angle is not None:
                base_angle = impact_angle
            else:
                base_angle = random.uniform(0, 2 * math.pi)

            # Generate fragments
            parent_genetic_id = getattr(entity, 'genetic_id', f"entity_{id(entity)}")

            for i in range(config['split_count']):
                if not self.fragment_pool:
                    break

                # Calculate scatter angle
                angle_offset = (i - config['split_count'] / 2) * \
                               (self.scatter_angle_range / config['split_count'])
                scatter_angle = base_angle + angle_offset

                # Calculate velocity
                speed = random.uniform(*self.fragment_speed_range)
                scatter_vx = math.cos(scatter_angle) * speed
                scatter_vy = math.sin(scatter_angle) * speed

                final_vx = parent_vel[0] * 0.5 + scatter_vx
                final_vy = parent_vel[1] * 0.5 + scatter_vy

                # Handle genetic inheritance
                fragment_traits = None
                fragment_genetic_id = f"{parent_genetic_id}_frag{i+1}"

                if self.enable_genetics and genetic_traits:
                    fragment_traits = self._evolve_traits(genetic_traits)
                    fragment_genetic_id = f"gen{fragment_traits.generation}_{id(fragment_traits)}"

                    # Track lineage
                    if parent_genetic_id not in self.genetic_lineage:
                        self.genetic_lineage[parent_genetic_id] = []
                    self.genetic_lineage[parent_genetic_id].append(fragment_genetic_id)
                    self.discovered_patterns[fragment_genetic_id] = fragment_traits

                # Create fragment
                fragment = self._create_fragment(
                    size=config['split_into_size'],
                    x=parent_pos[0],
                    y=parent_pos[1],
                    vx=final_vx,
                    vy=final_vy,
                    genetic_traits=fragment_traits,
                    genetic_id=fragment_genetic_id
                )

                if fragment:
                    fragments.append(fragment)
                    self.total_fragments_created += 1

            self.total_fractured += 1
            return Result(success=True, value=fragments)

        except Exception as e:
            return Result(success=False, error=f"Fracture failed: {e}")

    def _create_fragment(self, size: int, x: float, y: float,
                        vx: float, vy: float,
                        genetic_traits: Optional[GeneticTraits] = None,
                        genetic_id: str = "") -> Optional[AsteroidFragment]:
        """Create a new fragment from pool"""
        if not self.fragment_pool:
            return None

        config = self.size_configs[size]
        entity = self.fragment_pool.pop()
        entity.active = True
        entity.entity_type = "fragment"

        # Add position offset to prevent overlap
        entity.x = x + random.uniform(-2, 2)
        entity.y = y + random.uniform(-2, 2)
        entity.vx = vx
        entity.vy = vy
        entity.radius = config['radius']
        entity.angle = random.uniform(0, 2 * math.pi)
        entity.genetic_id = genetic_id

        # Apply genetic modifications if present
        if genetic_traits:
            entity.radius *= genetic_traits.size_modifier
            color = config['color']
            # Hue shift color if needed
            modified_color = self._apply_hue_shift(color, genetic_traits.color_shift)
        else:
            modified_color = config['color']

        fragment = AsteroidFragment(
            entity=entity,
            size=size,
            health=config['health'],
            radius=entity.radius,
            color=modified_color,
            point_value=config['points'],
            genetic_traits=genetic_traits,
            genetic_id=genetic_id
        )

        self.active_fragments[entity.id] = fragment
        return fragment

    def _fracture_by_id(self, fragment_id: str,
                       impact_angle: Optional[float] = None) -> Result[List[AsteroidFragment]]:
        """Fracture a fragment by ID"""
        if fragment_id not in self.active_fragments:
            return Result(success=False, error="Fragment not found")

        fragment_data = self.active_fragments[fragment_id]
        result = self.fracture_entity(
            fragment_data.entity,
            fragment_data.size,
            fragment_data.health,
            impact_angle,
            fragment_data.genetic_traits
        )

        if result.success:
            # Remove fractured fragment and return to pool
            del self.active_fragments[fragment_id]
            self._return_to_pool(fragment_data.entity)

        return result

    def _return_to_pool(self, entity: SpaceEntity) -> None:
        """Return entity to pool"""
        entity.active = False
        entity.x = 0.0
        entity.y = 0.0
        entity.vx = 0.0
        entity.vy = 0.0
        entity.radius = 0.0
        self.fragment_pool.append(entity)

    def _evolve_traits(self, parent_traits: GeneticTraits) -> GeneticTraits:
        """Evolve genetic traits for offspring"""
        return GeneticTraits(
            speed_modifier=parent_traits.speed_modifier * random.uniform(0.9, 1.1),
            size_modifier=parent_traits.size_modifier * random.uniform(0.95, 1.05),
            mass_modifier=parent_traits.mass_modifier * random.uniform(0.95, 1.05),
            color_shift=(parent_traits.color_shift + random.randint(-5, 5)) % 360,
            generation=parent_traits.generation + 1
        )

    def _apply_hue_shift(self, color: Tuple[int, int, int],
                        hue_shift: int) -> Tuple[int, int, int]:
        """Apply hue shift to RGB color"""
        # Simplified hue rotation (real implementation would use HSV)
        shift_factor = hue_shift / 360.0
        r, g, b = color
        # Apply rotation to emphasize different channels
        adjusted_r = int((r + shift_factor * 50) % 256)
        adjusted_g = int((g - shift_factor * 25) % 256)
        adjusted_b = int((b + shift_factor * 75) % 256)
        return (adjusted_r, adjusted_g, adjusted_b)

    def get_total_points(self) -> int:
        """Calculate total point value"""
        return sum(f.point_value for f in self.active_fragments.values())

    def get_size_distribution(self) -> Dict[int, int]:
        """Get distribution of fragment sizes"""
        distribution = {1: 0, 2: 0, 3: 0}
        for fragment in self.active_fragments.values():
            distribution[fragment.size] += 1
        return distribution

    def calculate_wave_difficulty(self, wave_number: int) -> Dict[str, Any]:
        """Calculate difficulty for a wave"""
        base_asteroids = 4
        asteroids_per_wave = 2
        asteroid_count = min(base_asteroids + (wave_number - 1) * asteroids_per_wave, 12)

        speed_multiplier = 1.0 + (wave_number - 1) * 0.1

        size_weights = [
            [3, 3, 2, 2, 1],      # Wave 1-2
            [3, 2, 2, 1, 1],      # Wave 3-4
            [2, 2, 1, 1, 1],      # Wave 5-6
            [2, 1, 1, 1, 1],      # Wave 7+
        ]

        weight_index = min((wave_number - 1) // 2, len(size_weights) - 1)

        return {
            'asteroid_count': asteroid_count,
            'speed_multiplier': speed_multiplier,
            'size_weights': size_weights[weight_index]
        }

    def get_status(self) -> Dict[str, Any]:
        """Get fracture system status"""
        return {
            'active_fragments': len(self.active_fragments),
            'pool_available': len(self.fragment_pool),
            'max_fragments': self.max_fragments,
            'total_fractured': self.total_fractured,
            'total_created': self.total_fragments_created,
            'genetics_enabled': self.enable_genetics,
            'discovered_patterns': len(self.discovered_patterns),
            'size_distribution': self.get_size_distribution()
        }


# Factory functions

def create_classic_fracture_system() -> FractureSystem:
    """Create classic arcade fracture system (no genetics)"""
    return FractureSystem(enable_genetics=False)


def create_genetic_fracture_system() -> FractureSystem:
    """Create genetic fracture system with evolution"""
    return FractureSystem(enable_genetics=True)


def create_hard_fracture_system() -> FractureSystem:
    """Create harder fracture system with faster fragments"""
    system = FractureSystem(enable_genetics=True)
    system.fragment_speed_range = (25.0, 60.0)
    return system
