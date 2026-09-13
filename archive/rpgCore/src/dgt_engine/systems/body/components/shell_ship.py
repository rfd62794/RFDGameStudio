"""
Shell-Ship Component - Genetic Ship Selection with KineticBody Injection
SRP: Manages ship archetypes and applies genetic traits to player ship
"""

from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass
from foundation.types import Result
from engines.body.components.kinetic_body import KineticBody
from engines.body.components.genetic_component import GeneticComponent, GeneticTraits, GeneticCode


@dataclass
class ShipArchetype:
    """Ship archetype configuration"""
    name: str
    description: str
    base_color: Tuple[int, int, int]
    genetic_component: GeneticComponent
    
    def get_display_info(self) -> Dict[str, Any]:
        """Get information for UI display"""
        return {
            'name': self.name,
            'description': self.description,
            'color': self.base_color,
            'genetic_info': self.genetic_component.get_genetic_info()
        }


class ShellShipManager:
    """
    Manages ship selection and applies genetic traits to KineticBody.
    Uses injection pattern - modifies existing KineticBody without rewriting it.
    """
    
    def __init__(self):
        """Initialize shell ship manager with archetypes"""
        self.archetypes: Dict[str, ShipArchetype] = {}
        self.current_archetype: Optional[ShipArchetype] = None
        self.current_kinetic_body: Optional[KineticBody] = None
        
        # Create ship archetypes
        self._create_archetypes()
        
    def _create_archetypes(self) -> None:
        """Create predefined ship archetypes"""
        # Heavy Shell - Tank-like
        heavy_genetics = GeneticComponent(
            genetic_code=GeneticCode(
                genetic_id="heavy_shell_v1",
                traits=GeneticTraits(
                    speed_modifier=0.7,
                    mass_modifier=1.5,
                    thrust_efficiency=0.8,
                    rotation_speed=0.6,
                    friction_modifier=1.2,
                    color_shift=(50, 50, 50),  # Darker grey
                    size_modifier=1.2,
                    aggression=0.3,
                    curiosity=0.2,
                    herd_mentality=0.4
                ),
                generation=1
            )
        )
        
        self.archetypes['heavy'] = ShipArchetype(
            name="Heavy Shell",
            description="Armored tank - Slow but durable",
            base_color=(100, 100, 100),
            genetic_component=heavy_genetics
        )
        
        # Scout Shell - Fast and agile
        scout_genetics = GeneticComponent(
            genetic_code=GeneticCode(
                genetic_id="scout_shell_v1",
                traits=GeneticTraits(
                    speed_modifier=1.5,
                    mass_modifier=0.7,
                    thrust_efficiency=1.2,
                    rotation_speed=1.3,
                    friction_modifier=0.8,
                    color_shift=(-30, -30, 50),  # Blueish tint
                    size_modifier=0.8,
                    aggression=0.6,
                    curiosity=0.8,
                    herd_mentality=0.1
                ),
                generation=1
            )
        )
        
        self.archetypes['scout'] = ShipArchetype(
            name="Scout Shell",
            description="Fast explorer - Quick but fragile",
            base_color=(100, 150, 255),
            genetic_component=scout_genetics
        )
        
        # Balanced Shell - All-purpose
        balanced_genetics = GeneticComponent(
            genetic_code=GeneticCode(
                genetic_id="balanced_shell_v1",
                traits=GeneticTraits(
                    speed_modifier=1.0,
                    mass_modifier=1.0,
                    thrust_efficiency=1.0,
                    rotation_speed=1.0,
                    friction_modifier=1.0,
                    color_shift=(0, 0, 0),  # No color shift
                    size_modifier=1.0,
                    aggression=0.5,
                    curiosity=0.5,
                    herd_mentality=0.3
                ),
                generation=1
            )
        )
        
        self.archetypes['balanced'] = ShipArchetype(
            name="Balanced Shell",
            description="All-purpose - Jack of all trades",
            base_color=(0, 255, 0),
            genetic_component=balanced_genetics
        )
        
        # Experimental Shell - High risk/reward
        experimental_genetics = GeneticComponent(
            genetic_code=GeneticCode(
                genetic_id="experimental_shell_v1",
                traits=GeneticTraits(
                    speed_modifier=2.0,
                    mass_modifier=0.5,
                    thrust_efficiency=1.5,
                    rotation_speed=2.0,
                    friction_modifier=0.6,
                    color_shift=(100, -50, -50),  # Reddish tint
                    size_modifier=0.7,
                    aggression=0.9,
                    curiosity=1.0,
                    herd_mentality=0.0
                ),
                generation=1
            )
        )
        
        self.archetypes['experimental'] = ShipArchetype(
            name="Experimental Shell",
            description="High performance - Unstable but powerful",
            base_color=(255, 100, 100),
            genetic_component=experimental_genetics
        )
    
    def get_available_archetypes(self) -> Dict[str, ShipArchetype]:
        """Get all available ship archetypes"""
        return self.archetypes.copy()
    
    def select_archetype(self, archetype_name: str, kinetic_body: KineticBody) -> Result[ShipArchetype]:
        """
        Select a ship archetype and apply its traits to kinetic body
        
        Args:
            archetype_name: Name of archetype to select
            kinetic_body: KineticBody to apply traits to
            
        Returns:
            Result containing selected archetype
        """
        if archetype_name not in self.archetypes:
            return Result(success=False, error=f"Archetype '{archetype_name}' not found")
        
        archetype = self.archetypes[archetype_name]
        
        # Apply genetic traits to kinetic body
        apply_result = archetype.genetic_component.apply_to_kinetic_body(kinetic_body)
        
        if not apply_result.success:
            return Result(success=False, error=f"Failed to apply archetype traits: {apply_result.error}")
        
        # Store current selections
        self.current_archetype = archetype
        self.current_kinetic_body = kinetic_body
        
        return Result(success=True, value=archetype)
    
    def get_current_archetype(self) -> Optional[ShipArchetype]:
        """Get currently selected archetype"""
        return self.current_archetype
    
    def get_ship_color(self) -> Tuple[int, int, int]:
        """Get the color for current ship"""
        if self.current_archetype:
            return self.current_archetype.base_color
        return (0, 255, 0)  # Default green
    
    def reset_ship(self, kinetic_body: KineticBody) -> Result[bool]:
        """
        Reset ship to default state (remove genetic modifications)
        
        Args:
            kinetic_body: KineticBody to reset
            
        Returns:
            Result containing success status
        """
        try:
            # Reset to default KineticBody parameters
            kinetic_body.thrust_power = 50.0
            kinetic_body.rotation_speed = 3.0
            kinetic_body.velocity_damping = 0.99
            kinetic_body.angular_damping = 0.95
            kinetic_body.max_velocity = 200.0
            
            # Clear current archetype
            self.current_archetype = None
            self.current_kinetic_body = None
            
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to reset ship: {e}")
    
    def get_ship_stats(self) -> Dict[str, Any]:
        """Get current ship statistics for display"""
        if not self.current_archetype or not self.current_kinetic_body:
            return {
                'archetype': 'None',
                'color': (0, 255, 0),
                'stats': {
                    'thrust_power': 50.0,
                    'rotation_speed': 3.0,
                    'max_velocity': 200.0,
                    'damping': 0.99
                }
            }
        
        traits = self.current_archetype.genetic_component.traits
        
        return {
            'archetype': self.current_archetype.name,
            'description': self.current_archetype.description,
            'color': self.current_archetype.base_color,
            'genetic_id': self.current_archetype.genetic_component.genetic_code.genetic_id,
            'stats': {
                'thrust_power': self.current_kinetic_body.thrust_power,
                'rotation_speed': self.current_kinetic_body.rotation_speed,
                'max_velocity': self.current_kinetic_body.max_velocity,
                'velocity_damping': self.current_kinetic_body.velocity_damping,
                'angular_damping': self.current_kinetic_body.angular_damping
            },
            'traits': {
                'speed': f"{traits.speed_modifier:.2f}x",
                'mass': f"{traits.mass_modifier:.2f}x",
                'thrust_efficiency': f"{traits.thrust_efficiency:.2f}x",
                'rotation': f"{traits.rotation_speed:.2f}x",
                'friction': f"{traits.friction_modifier:.2f}x",
                'aggression': f"{traits.aggression:.2f}",
                'curiosity': f"{traits.curiosity:.2f}",
                'herd': f"{traits.herd_mentality:.2f}"
            }
        }
    
    def evolve_current_ship(self) -> Result[ShipArchetype]:
        """
        Evolve the current ship archetype
        
        Returns:
            Result containing evolved archetype
        """
        if not self.current_archetype or not self.current_kinetic_body:
            return Result(success=False, error="No current ship to evolve")
        
        # Create evolved genetic component
        evolved_genetic = self.current_archetype.genetic_component.evolve()
        
        # Create new archetype
        evolved_archetype = ShipArchetype(
            name=f"Evolved {self.current_archetype.name}",
            description=f"Evolved version of {self.current_archetype.description}",
            base_color=evolved_genetic.get_modified_color(self.current_archetype.base_color),
            genetic_component=evolved_genetic
        )
        
        # Apply evolved traits
        apply_result = evolved_genetic.apply_to_kinetic_body(self.current_kinetic_body)
        
        if not apply_result.success:
            return Result(success=False, error=f"Failed to apply evolved traits: {apply_result.error}")
        
        # Update current archetype
        self.current_archetype = evolved_archetype
        
        return Result(success=True, value=evolved_archetype)


# Factory function
def create_shell_ship_manager() -> ShellShipManager:
    """Create a shell ship manager"""
    return ShellShipManager()
