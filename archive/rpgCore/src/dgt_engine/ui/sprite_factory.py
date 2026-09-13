"""
Sprite Factory - Multi-Layered Sprite Assembler

ADR 034: Procedural Silhouette Baker
Creates composite sprites from HEAD, BODY, and HELD_ITEM layers for iconic readability.
"""

from typing import Dict, List, Tuple, Optional, Any, Union
from dataclasses import dataclass
from enum import Enum

from loguru import logger

from ui.pixel_renderer import Pixel, ColorPalette


class SpriteLayer(Enum):
    """Types of sprite layers for composite assembly."""
    HEAD = "head"
    BODY = "body"
    FEET = "feet"
    HELD_ITEM = "held_item"
    ACCESSORY = "accessory"


class ShadingPattern(Enum):
    """Shading patterns for anti-aliasing and depth."""
    SOLID = "solid"
    LIGHT = "light"      # ░
    MEDIUM = "medium"    # ▒
    DARK = "dark"        # ▓
    DITHERED = "dithered" # ░▒▓ pattern


class CharacterClass(Enum):
    """Character classes with distinct shape language."""
    VOYAGER = "voyager"      # Triangle - lean forward
    WARRIOR = "warrior"      # Square - wide shoulders
    ROGUE = "rogue"          # Triangle - stealth stance
    MAGE = "mage"            # Circle - balanced
    CLERIC = "cleric"        # Square - defensive
    RANGER = "ranger"        # Triangle - hunter stance


@dataclass
class SpriteLayerTemplate:
    """Template for a single sprite layer."""
    layer_type: SpriteLayer
    width: int
    height: int
    pixels: List[List[Optional[Pixel]]]
    anchor_x: int = 0  # Anchor point for layer positioning
    anchor_y: int = 0
    shading: ShadingPattern = ShadingPattern.SOLID


@dataclass
class CompositeSpriteConfig:
    """Configuration for composite sprite assembly."""
    character_class: CharacterClass
    head_type: str = "default"
    body_type: str = "default"
    feet_type: str = "default"
    held_item: str = "none"
    accessory: str = "none"
    stance: str = "neutral"  # neutral, combat, stealth, casting
    shading_enabled: bool = True
    breathing_enabled: bool = True


class SpriteFactory:
    """
    Multi-Layered Sprite Assembler.
    
    Creates composite sprites from individual layers, allowing for
    dynamic equipment changes and state-driven modifications.
    """
    
    def __init__(self):
        """Initialize the sprite factory."""
        self.layer_templates: Dict[str, SpriteLayerTemplate] = {}
        self.shading_blocks = {
            ShadingPattern.SOLID: "█",
            ShadingPattern.LIGHT: "░",
            ShadingPattern.MEDIUM: "▒",
            ShadingPattern.DARK: "▓",
            ShadingPattern.DITHERED: "░▒▓"
        }
        
        self._initialize_layer_templates()
        logger.info("SpriteFactory initialized with composite layering system")
    
    def _initialize_layer_templates(self) -> None:
        """Initialize the layer templates for all character classes."""
        
        # Head templates (3x3)
        self._add_head_template("default", [
            [None, None, None],
            [None, Pixel(255, 255, 255, 1.0), None],
            [None, None, None]
        ])
        
        self._add_head_template("helmet", [
            [Pixel(100, 100, 100, 1.0), Pixel(100, 100, 100, 1.0), Pixel(100, 100, 100, 1.0)],
            [Pixel(150, 150, 150, 1.0), Pixel(255, 255, 255, 1.0), Pixel(150, 150, 150, 1.0)],
            [None, Pixel(150, 150, 150, 1.0), None]
        ])
        
        self._add_head_template("hood", [
            [Pixel(80, 60, 40, 1.0), Pixel(80, 60, 40, 1.0), Pixel(80, 60, 40, 1.0)],
            [Pixel(100, 80, 60, 1.0), Pixel(120, 100, 80, 1.0), Pixel(100, 80, 60, 1.0)],
            [None, Pixel(100, 80, 60, 1.0), None]
        ])
        
        # Body templates (5x3)
        self._add_body_template("default", [
            [None, Pixel(200, 150, 100, 1.0), None],
            [Pixel(200, 150, 100, 1.0), Pixel(255, 200, 150, 1.0), Pixel(200, 150, 100, 1.0)],
            [Pixel(200, 150, 100, 1.0), Pixel(255, 200, 150, 1.0), Pixel(200, 150, 100, 1.0)],
            [None, Pixel(200, 150, 100, 1.0), None],
            [None, None, None]
        ])
        
        self._add_body_template("armor", [
            [Pixel(150, 150, 150, 1.0), Pixel(200, 200, 200, 1.0), Pixel(150, 150, 150, 1.0)],
            [Pixel(180, 180, 180, 1.0), Pixel(220, 220, 220, 1.0), Pixel(180, 180, 180, 1.0)],
            [Pixel(180, 180, 180, 1.0), Pixel(220, 220, 220, 1.0), Pixel(180, 180, 180, 1.0)],
            [Pixel(150, 150, 150, 1.0), Pixel(200, 200, 200, 1.0), Pixel(150, 150, 150, 1.0)],
            [None, Pixel(150, 150, 150, 1.0), None]
        ])
        
        self._add_body_template("robe", [
            [Pixel(100, 80, 60, 1.0), Pixel(120, 100, 80, 1.0), Pixel(100, 80, 60, 1.0)],
            [Pixel(120, 100, 80, 1.0), Pixel(140, 120, 100, 1.0), Pixel(120, 100, 80, 1.0)],
            [Pixel(120, 100, 80, 1.0), Pixel(140, 120, 100, 1.0), Pixel(120, 100, 80, 1.0)],
            [Pixel(100, 80, 60, 1.0), Pixel(120, 100, 80, 1.0), Pixel(100, 80, 60, 1.0)],
            [None, Pixel(100, 80, 60, 1.0), None]
        ])
        
        # Feet templates (3x2)
        self._add_feet_template("default", [
            [Pixel(200, 150, 100, 1.0), None, Pixel(200, 150, 100, 1.0)],
            [Pixel(200, 150, 100, 1.0), None, Pixel(200, 150, 100, 1.0)]
        ])
        
        self._add_feet_template("boots", [
            [Pixel(180, 180, 180, 1.0), None, Pixel(180, 180, 180, 1.0)],
            [Pixel(180, 180, 180, 1.0), None, Pixel(180, 180, 180, 1.0)]
        ])
        
        # Held item templates
        self._add_held_item_template("none", [])
        self._add_held_item_template("sword", [
            [None, None, Pixel(200, 200, 200, 1.0), None, None],
            [None, None, Pixel(220, 220, 220, 1.0), None, None],
            [None, None, Pixel(240, 240, 240, 1.0), None, None]
        ])
        
        self._add_held_item_template("staff", [
            [None, None, Pixel(150, 150, 200, 1.0), None, None],
            [None, None, Pixel(170, 170, 220, 1.0), None, None],
            [None, None, Pixel(190, 190, 240, 1.0), None, None]
        ])
        
        self._add_held_item_template("bow", [
            [None, Pixel(200, 150, 100, 1.0), None, None, None],
            [None, Pixel(220, 170, 120, 1.0), None, None, None],
            [None, Pixel(240, 190, 140, 1.0), None, None, None]
        ])
    
    def _add_head_template(self, name: str, pixels: List[List[Optional[Pixel]]]) -> None:
        """Add a head template."""
        template = SpriteLayerTemplate(
            layer_type=SpriteLayer.HEAD,
            width=3,
            height=3,
            pixels=pixels,
            anchor_x=1,
            anchor_y=1
        )
        self.layer_templates[f"head_{name}"] = template
    
    def _add_body_template(self, name: str, pixels: List[List[Optional[Pixel]]]) -> None:
        """Add a body template."""
        template = SpriteLayerTemplate(
            layer_type=SpriteLayer.BODY,
            width=3,
            height=5,
            pixels=pixels,
            anchor_x=1,
            anchor_y=2
        )
        self.layer_templates[f"body_{name}"] = template
    
    def _add_feet_template(self, name: str, pixels: List[List[Optional[Pixel]]]) -> None:
        """Add a feet template."""
        template = SpriteLayerTemplate(
            layer_type=SpriteLayer.FEET,
            width=3,
            height=2,
            pixels=pixels,
            anchor_x=1,
            anchor_y=0
        )
        self.layer_templates[f"feet_{name}"] = template
    
    def _add_held_item_template(self, name: str, pixels: List[List[Optional[Pixel]]]) -> None:
        """Add a held item template."""
        template = SpriteLayerTemplate(
            layer_type=SpriteLayer.HELD_ITEM,
            width=5,
            height=3,
            pixels=pixels,
            anchor_x=2,
            anchor_y=1
        )
        self.layer_templates[f"held_{name}"] = template
    
    def create_composite_sprite(self, config: CompositeSpriteConfig) -> List[List[Optional[Pixel]]]:
        """
        Create a composite sprite from the given configuration.
        
        Args:
            config: Sprite configuration
            
        Returns:
            Composite sprite pixel array
        """
        # Get layer templates
        head_template = self.layer_templates.get(f"head_{config.head_type}")
        body_template = self.layer_templates.get(f"body_{config.body_type}")
        feet_template = self.layer_templates.get(f"feet_{config.feet_type}")
        held_template = self.layer_templates.get(f"held_{config.held_item}")
        
        # Calculate composite dimensions
        max_width = max(
            head_template.width if head_template else 0,
            body_template.width if body_template else 0,
            feet_template.width if feet_template else 0,
            held_template.width if held_template else 0
        )
        
        max_height = (
            (head_template.height if head_template else 0) +
            (body_template.height if body_template else 0) +
            (feet_template.height if feet_template else 0)
        )
        
        # Create composite buffer
        composite = [[None for _ in range(max_width)] for _ in range(max_height)]
        
        # Apply character class modifications
        self._apply_class_modifications(config, head_template, body_template, feet_template)
        
        # Layer the sprites
        current_y = 0
        
        # Add head layer
        if head_template:
            self._layer_sprite(composite, head_template, 0, current_y, config)
            current_y += head_template.height
        
        # Add body layer
        if body_template:
            self._layer_sprite(composite, body_template, 0, current_y, config)
            current_y += body_template.height
        
        # Add feet layer
        if feet_template:
            self._layer_sprite(composite, feet_template, 0, current_y, config)
        
        # Add held item (overlays body)
        if held_template and config.held_item != "none":
            held_y = current_y - feet_template.height - 1  # Position near body
            self._layer_sprite(composite, held_template, 0, held_y, config)
        
        # Apply shading and effects
        if config.shading_enabled:
            self._apply_shading(composite, config)
        
        # Apply asymmetric stance
        self._apply_asymmetric_stance(composite, config)
        
        return composite
    
    def _layer_sprite(self, composite: List[List[Optional[Pixel]]], 
                      template: SpriteLayerTemplate, offset_x: int, offset_y: int,
                      config: CompositeSpriteConfig) -> None:
        """Layer a sprite template onto the composite buffer."""
        for y, row in enumerate(template.pixels):
            for x, pixel in enumerate(row):
                if pixel is not None:
                    target_y = offset_y + y
                    target_x = offset_x + x
                    
                    if (0 <= target_y < len(composite) and 
                        0 <= target_x < len(composite[0])):
                        composite[target_y][target_x] = pixel
    
    def _apply_class_modifications(self, config: CompositeSpriteConfig,
                                 head_template: Optional[SpriteLayerTemplate],
                                 body_template: Optional[SpriteLayerTemplate],
                                 feet_template: Optional[SpriteLayerTemplate]) -> None:
        """Apply character class-specific modifications."""
        if config.character_class == CharacterClass.ROGUE:
            # Rogue: lean forward (offset head)
            if head_template:
                head_template.anchor_x = 2  # Lean right
        
        elif config.character_class == CharacterClass.WARRIOR:
            # Warrior: wide shoulders
            if body_template:
                # Add shoulder blocks
                if len(body_template.pixels) >= 3:
                    body_template.pixels[1][0] = Pixel(200, 150, 100, 1.0)  # Left shoulder
                    body_template.pixels[1][2] = Pixel(200, 150, 100, 1.0)  # Right shoulder
        
        elif config.character_class == CharacterClass.MAGE:
            # Mage: balanced stance
            pass  # Default is balanced
        
        elif config.character_class == CharacterClass.VOYAGER:
            # Voyager: triangular lean
            if head_template:
                head_template.anchor_x = 2  # Lean forward
    
    def _apply_shading(self, composite: List[List[Optional[Pixel]]], 
                        config: CompositeSpriteConfig) -> None:
        """Apply shading and anti-aliasing effects."""
        # Add drop shadow (bottom-right)
        for y in range(len(composite)):
            for x in range(len(composite[0])):
                if composite[y][x] is not None:
                    # Add shadow to bottom-right
                    shadow_y = y + 1
                    shadow_x = x + 1
                    
                    if (shadow_y < len(composite) and 
                        shadow_x < len(composite[0]) and
                        composite[shadow_y][shadow_x] is None):
                        
                        shadow_pixel = Pixel(50, 50, 50, 0.3)  # Dark shadow
                        composite[shadow_y][shadow_x] = shadow_pixel
        
        # Apply dithering for stealth state
        if config.stance == "stealth":
            self._apply_dithering(composite)
    
    def _apply_dithering(self, composite: List[List[Optional[Pixel]]]) -> None:
        """Apply dithering pattern for stealth state."""
        dither_pattern = [
            [1, 0, 1],
            [0, 1, 0],
            [1, 0, 1]
        ]
        
        for y in range(len(composite)):
            for x in range(len(composite[0])):
                if composite[y][x] is not None:
                    pattern_x = x % 3
                    pattern_y = y % 3
                    
                    if dither_pattern[pattern_y][pattern_x] == 0:
                        # Reduce intensity for dithering
                        pixel = composite[y][x]
                        pixel.intensity *= 0.7
                        composite[y][x] = pixel
    
    def _apply_asymmetric_stance(self, composite: List[List[Optional[Pixel]]], 
                               config: CompositeSpriteConfig) -> None:
        """Apply asymmetric stance modifications."""
        if config.stance == "combat":
            # Combat stance: wider, more aggressive
            for y in range(len(composite)):
                for x in range(len(composite[0])):
                    if composite[y][x] is not None:
                        # Extend silhouette slightly
                        if x > 0 and composite[y][x-1] is None:
                            composite[y][x-1] = Pixel(200, 150, 100, 0.5)
        
        elif config.stance == "stealth":
            # Stealth stance: compressed, lower profile
            for y in range(len(composite)):
                for x in range(len(composite[0])):
                    if composite[y][x] is not None:
                        # Reduce vertical profile
                        if y > 0 and composite[y-1][x] is None:
                            composite[y-1][x] = None
        
        elif config.stance == "casting":
            # Casting stance: raised arms
            # Add arm extensions
            for y in range(len(composite)):
                if y == len(composite) // 2:  # Middle row
                    for x in range(len(composite[0])):
                        if composite[y][x] is not None:
                            # Extend arms horizontally
                            if x > 0 and x < len(composite[0]) - 1:
                                composite[y][x-1] = Pixel(150, 150, 200, 0.7)  # Left arm
                                composite[y][x+1] = Pixel(150, 150, 200, 0.7)  # Right arm
                            break
    
    def create_breathing_animation_frames(self, config: CompositeSpriteConfig, 
                                         frames: int = 2) -> List[List[List[Optional[Pixel]]]]:
        """
        Create breathing animation frames.
        
        Args:
            config: Sprite configuration
            frames: Number of animation frames
            
        Returns:
            List of animation frames
        """
        base_sprite = self.create_composite_sprite(config)
        animation_frames = []
        
        for frame in range(frames):
            frame_sprite = [row[:] for row in base_sprite]  # Deep copy
            
            # Shift top pixels down by 1 half-block
            shift_amount = 1 if frame % 2 == 1 else 0
            
            if shift_amount > 0:
                # Shift top 3 rows down
                for y in range(min(3, len(frame_sprite))):
                    for x in range(len(frame_sprite[0])):
                        if frame_sprite[y][x] is not None:
                            target_y = min(y + shift_amount, len(frame_sprite) - 1)
                            if frame_sprite[target_y][x] is None:
                                frame_sprite[target_y][x] = frame_sprite[y][x]
                                frame_sprite[y][x] = None
            
            animation_frames.append(frame_sprite)
        
        return animation_frames
    
    def get_layer_info(self) -> Dict[str, Any]:
        """Get information about available layers."""
        layers = {}
        for name, template in self.layer_templates.items():
            layer_type, layer_name = name.split('_', 1)
            if layer_type not in layers:
                layers[layer_type] = []
            layers[layer_type].append(layer_name)
        
        return {
            "total_layers": len(self.layer_templates),
            "layer_types": layers,
            "shading_patterns": list(ShadingPattern),
            "character_classes": list(CharacterClass)
        }


# Export for use by other modules
__all__ = [
    "SpriteFactory", "SpriteLayer", "ShadingPattern", "CharacterClass",
    "CompositeSpriteConfig", "SpriteLayerTemplate"
]
