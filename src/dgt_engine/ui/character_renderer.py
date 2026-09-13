"""
Character Renderer - SOLID Refactor

Single Responsibility: Convert hit results to ASCII characters.
Part of ASCIIDoomRenderer refactoring for better maintainability.
"""

from typing import Dict, Any, Optional
from dataclasses import dataclass

from loguru import logger

from .raycasting_types import HitResult


@dataclass
class RenderConfig:
    """Configuration for character rendering."""
    wall_chars: list
    floor_chars: list
    entity_chars: list
    item_chars: list
    threat_chars: list
    
    def __post_init__(self):
        """Validate character sets."""
        if not all(isinstance(chars, list) and len(chars) > 0 for chars in [
            self.wall_chars, self.floor_chars, self.entity_chars, 
            self.item_chars, self.threat_chars
        ]):
            raise ValueError("All character sets must be non-empty lists")


class CharacterRenderer:
    """
    Handles conversion of hit results to ASCII characters.
    
    Single Responsibility: Determine appropriate characters for rendering.
    """

    def __init__(self, config: Optional[RenderConfig] = None):
        """
        Initialize the character renderer.
        
        Args:
            config: Optional rendering configuration
        """
        self.config = config or self._create_default_config()
        self.threat_mode = False
        
        logger.debug("CharacterRenderer initialized")

    def _create_default_config(self) -> RenderConfig:
        """Create default rendering configuration."""
        return RenderConfig(
            wall_chars=['#', '#', '=', '=', '+', '-', '|', '/', '\\'],
            floor_chars=['.', ',', '-', '_', '~', '^'],
            entity_chars=['@', '&', '%', '*', '!'],
            item_chars=['$', '%', '^', '+', '?'],
            threat_chars=['!', '?', 'X', '@', '#']
        )

    def get_character(self, hit_result: HitResult, distance: float = None) -> str:
        """
        Get appropriate character for a hit result.
        
        Args:
            hit_result: The hit result to render
            distance: Override distance (for special cases)
            
        Returns:
            Character to render
        """
        if not hit_result.hit:
            return ' '
            
        # Use provided distance or hit result distance
        effective_distance = distance if distance is not None else hit_result.distance
        
        # Apply threat indicators if active
        if self.threat_mode and hit_result.is_entity_hit():
            return self._get_threat_character(effective_distance)
        
        # Get character based on content type
        if hit_result.is_wall_hit():
            return self._get_wall_character(effective_distance)
        elif hit_result.is_entity_hit():
            return self._get_entity_character(effective_distance)
        elif hit_result.is_item_hit():
            return self._get_item_character(effective_distance)
        else:
            logger.warning(f"Unknown hit content: {hit_result.content}")
            return '?'

    def set_threat_mode(self, enabled: bool) -> None:
        """
        Enable or disable threat indicator mode.
        
        Args:
            enabled: Whether threat mode should be active
        """
        self.threat_mode = enabled
        logger.info(f"Threat mode {'enabled' if enabled else 'disabled'}")

    def apply_distance_shading(self, char: str, distance: float) -> str:
        """
        Apply distance-based shading to a character.
        
        Args:
            char: Base character
            distance: Distance for shading calculation
            
        Returns:
            Shaded character
        """
        # Darker characters for distant objects
        if distance > 15:
            return '░'
        elif distance > 10:
            return '▒'
        elif distance > 5:
            return '▓'
        else:
            return char

    def _get_wall_character(self, distance: float) -> str:
        """Get wall character based on distance."""
        chars = self.config.wall_chars
        
        if distance < 2:
            return chars[0]  # Closest wall
        elif distance < 5:
            return chars[1]  # Mid-range wall
        elif distance < 10:
            return chars[2]  # Far wall
        else:
            return chars[3]  # Distant wall

    def _get_entity_character(self, distance: float) -> str:
        """Get entity character based on distance."""
        chars = self.config.entity_chars
        
        if distance < 3:
            return chars[0]  # Close entity
        elif distance < 6:
            return chars[1]  # Mid-range entity
        else:
            return chars[2]  # Distant entity

    def _get_item_character(self, distance: float) -> str:
        """Get item character based on distance."""
        chars = self.config.item_chars
        
        if distance < 2:
            return chars[0]  # Close item
        elif distance < 4:
            return chars[1]  # Mid-range item
        else:
            return chars[2]  # Distant item

    def _get_threat_character(self, distance: float) -> str:
        """Get threat indicator character based on distance."""
        chars = self.config.threat_chars
        
        if distance < 3:
            return chars[0]  # ! - immediate threat
        elif distance < 6:
            return chars[1]  # ? - potential threat
        elif distance < 10:
            return chars[2]  # X - distant threat
        elif distance < 15:
            return chars[3]  # @ - warning
        else:
            return chars[4]  # # - distant warning

    def update_config(self, new_config: RenderConfig) -> None:
        """
        Update rendering configuration.
        
        Args:
            new_config: New configuration to apply
        """
        try:
            # Validate new config
            new_config.__post_init__()
            self.config = new_config
            logger.info("CharacterRenderer configuration updated")
        except ValueError as e:
            logger.error(f"Invalid configuration: {e}")
            raise

    def get_config_summary(self) -> Dict[str, Any]:
        """Get summary of current configuration."""
        return {
            "threat_mode": self.threat_mode,
            "wall_chars_count": len(self.config.wall_chars),
            "entity_chars_count": len(self.config.entity_chars),
            "item_chars_count": len(self.config.item_chars),
            "threat_chars_count": len(self.config.threat_chars)
        }


# Export for use by renderer
__all__ = ["CharacterRenderer", "RenderConfig"]
