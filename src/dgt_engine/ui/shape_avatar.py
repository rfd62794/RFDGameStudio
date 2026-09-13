"""
Shape Language Avatar System

Phase 9: Procedural Avatar Visualization
Uses geometric primitives to communicate character personality and role at a glance.

ADR 026: Shape Language Character Visualization
"""

from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum
import math

from loguru import logger


class ShapeType(Enum):
    """Fundamental geometric shapes with psychological meaning."""
    CIRCLE = "circle"      # Friendly, approachable, soft
    SQUARE = "square"      # Strong, stable, reliable
    TRIANGLE = "triangle"  # Sharp, aggressive, cunning
    DIAMOND = "diamond"    # Precious, valuable, rare
    CROSS = "cross"        # Spiritual, magical, divine
    STAR = "star"          # Heroic, special, important


class ShapeMeaning:
    """Psychological meaning of shapes in character design."""
    
    MEANINGS = {
        ShapeType.CIRCLE: {
            "personality": ["friendly", "approachable", "soft", "nurturing", "social"],
            "role": ["healer", "diplomat", "merchant", "guide"],
            "emotion": ["calm", "welcoming", "gentle"]
        },
        ShapeType.SQUARE: {
            "personality": ["strong", "stable", "reliable", "honest", "dependable"],
            "role": ["warrior", "guard", "tank", "protector"],
            "emotion": ["steadfast", "unmovable", "resolute"]
        },
        ShapeType.TRIANGLE: {
            "personality": ["sharp", "aggressive", "cunning", "ambitious", "dynamic"],
            "role": ["rogue", "assassin", "hunter", "scout"],
            "emotion": ["dangerous", "alert", "ready"]
        },
        ShapeType.DIAMOND: {
            "personality": ["valuable", "rare", "precious", "unique", "special"],
            "role": ["artifact", "treasure", "key_item", "legendary"],
            "emotion": ["important", "desired", "mysterious"]
        },
        ShapeType.CROSS: {
            "personality": ["spiritual", "magical", "divine", "holy", "sacred"],
            "role": ["cleric", "priest", "paladin", "mystic"],
            "emotion": ["blessed", "sacred", "transcendent"]
        },
        ShapeType.STAR: {
            "personality": ["heroic", "special", "important", "legendary", "chosen"],
            "role": ["protagonist", "hero", "champion", "leader"],
            "emotion": ["inspiring", "hopeful", "destined"]
        }
    }


@dataclass
class ShapeProfile:
    """A character's shape profile based on their stats and role."""
    primary_shape: ShapeType
    secondary_shape: ShapeType
    personality_traits: List[str]
    role_suggestions: List[str]
    emotional_tone: str
    complexity: float  # 0.0 to 1.0, affects detail level


class ShapeAvatarGenerator:
    """
    Generates procedural ASCII avatars based on character stats using shape language.
    
    Creates meaningful visual representations that communicate personality and role.
    """
    
    def __init__(self):
        """Initialize the shape avatar generator."""
        # Shape templates for different sizes
        self.shape_templates = {
            ShapeType.CIRCLE: {
                "small": [" ○ ", " ○○○ ", " ○○○○○ ", " ○○○○○○○ "],
                "medium": ["  ○○  ", " ○○○○○ ", " ○○○○○○○ ", " ○○○○○○○○○ "],
                "large": ["   ○○○   ", " ○○○○○○○○ ", " ○○○○○○○○○○○ ", " ○○○○○○○○○○○○○○ "]
            },
            ShapeType.SQUARE: {
                "small": [" ■ ", " ■■■ ", " ■■■■■ ", " ■■■■■■■ "],
                "medium": ["  ■■  ", " ■■■■ ", " ■■■■■■ ", " ■■■■■■■■ "],
                "large": ["   ■■■   ", " ■■■■■■ ", " ■■■■■■■■ ", " ■■■■■■■■■■ "]
            },
            ShapeType.TRIANGLE: {
                "small": [" ▲ ", " ▲▲▲ ", " ▲▲▲▲▲ ", " ▲▲▲▲▲▲▲ "],
                "medium": ["  ▲▲  ", " ▲▲▲▲ ", " ▲▲▲▲▲▲ ", " ▲▲▲▲▲▲▲▲ "],
                "large": ["   ▲▲▲   ", " ▲▲▲▲▲▲ ", " ▲▲▲▲▲▲▲▲ ", " ▲▲▲▲▲▲▲▲▲▲ "]
            },
            ShapeType.DIAMOND: {
                "small": [" ◊ ", " ◊◊◊ ", " ◊◊◊◊◊ ", " ◊◊◊◊◊◊◊ "],
                "medium": ["  ◊◊  ", " ◊◊◊◊ ", " ◊◊◊◊◊◊ ", " ◊◊◊◊◊◊◊◊ "],
                "large": ["   ◊◊◊   ", " ◊◊◊◊◊ ", " ◊◊◊◊◊◊◊ ", " ◊◊◊◊◊◊◊◊◊ "]
            },
            ShapeType.CROSS: {
                "small": [" ✚ ", " ✚✚✚ ", " ✚✚✚✚✚ ", " ✚✚✚✚✚✚✚ "],
                "medium": ["  ✚✚  ", " ✚✚✚✚ ", " ✚✚✚✚✚✚ ", " ✚✚✚✚✚✚✚✚ "],
                "large": ["   ✚✚✚   ", " ✚✚✚✚✚ ", " ✚✚✚✚✚✚✚ ", " ✚✚✚✚✚✚✚✚✚ "]
            },
            ShapeType.STAR: {
                "small": [" ✦ ", " ✦✦✦ ", " ✦✦✦✦✦ ", " ✦✦✦✦✦✦✦ "],
                "medium": ["  ✦✦  ", " ✦✦✦✦ ", " ✦✦✦✦✦✦ ", " ✦✦✦✦✦✦✦✦ "],
                "large": ["   ✦✦✦   ", " ✦✦✦✦✦ ", " ✦✦✦✦✦✦✦ ", " ✦✦✦✦✦✦✦✦✦ "]
            }
        }
        
        # Composite shape combinations
        self.composite_templates = {
            (ShapeType.CIRCLE, ShapeType.SQUARE): {
                "small": [" ○■ ", " ○■■○ ", " ○■■■○ ", " ○■■■■○ "],
                "medium": ["  ○■○  ", " ○■■■○ ", " ○■■■■■○ ", " ○■■■■■■○ "],
                "large": ["   ○■○   ", " ○■■■■○ ", " ○■■■■■■○ ", " ○■■■■■■■○ "]
            },
            (ShapeType.TRIANGLE, ShapeType.CIRCLE): {
                "small": [" ▲○ ", " ▲▲○○ ", " ▲▲▲○○○ ", " ▲▲▲▲○○○○ "],
                "medium": ["  ▲▲○  ", " ▲▲▲○○ ", " ▲▲▲▲○○○ ", " ▲▲▲▲▲○○○○ "],
                "large": ["   ▲▲○   ", " ▲▲▲▲○○ ", " ▲▲▲▲▲○○○ ", " ▲▲▲▲▲▲○○○○ "]
            },
            (ShapeType.SQUARE, ShapeType.SQUARE): {
                "small": [" ■■ ", " ■■■■ ", " ■■■■■■ ", " ■■■■■■■■ "],
                "medium": ["  ■■  ", " ■■■■ ", " ■■■■■■ ", " ■■■■■■■■ "],
                "large": ["   ■■   ", " ■■■■ ", " ■■■■■■ ", " ■■■■■■■■ "]
            },
            (ShapeType.CIRCLE, ShapeType.CIRCLE): {
                "small": [" ○○ ", " ○○○○ ", " ○○○○○○ ", " ○○○○○○○○ "],
                "medium": ["  ○○  ", " ○○○○ ", " ○○○○○○ ", " ○○○○○○○○ "],
                "large": ["   ○○   ", " ○○○○ ", " ○○○○○○ ", " ○○○○○○○○ "]
            }
        }
        
        logger.info("Shape Avatar Generator initialized with shape language system")
    
    def analyze_character_stats(self, stats: Dict[str, int]) -> ShapeProfile:
        """
        Analyze character stats to determine shape profile.
        
        Args:
            stats: Character stats dictionary
            
        Returns:
            ShapeProfile with primary/secondary shapes and traits
        """
        # Extract key stats
        strength = stats.get("strength", 10)
        dexterity = stats.get("dexterity", 10)
        constitution = stats.get("constitution", 10)
        intelligence = stats.get("intelligence", 10)
        wisdom = stats.get("wisdom", 10)
        charisma = stats.get("charisma", 10)
        
        # Determine primary and secondary stats
        stat_list = [
            ("strength", strength),
            ("dexterity", dexterity),
            ("constitution", constitution),
            ("intelligence", intelligence),
            ("wisdom", wisdom),
            ("charisma", charisma)
        ]
        
        # Sort by value (descending)
        stat_list.sort(key=lambda x: x[1], reverse=True)
        
        primary_stat, primary_value = stat_list[0]
        secondary_stat, secondary_value = stat_list[1]
        
        # Map stats to shapes
        primary_shape = self._stat_to_shape(primary_stat, primary_value)
        secondary_shape = self._stat_to_shape(secondary_stat, secondary_value)
        
        # Calculate complexity based on stat distribution
        stat_variance = max(stat_list, key=lambda x: x[1])[1] - min(stat_list, key=lambda x: x[1])[1]
        complexity = min(1.0, stat_variance / 20.0)  # Normalize to 0-1
        
        # Get personality traits
        primary_traits = ShapeMeaning.MEANINGS[primary_shape]["personality"]
        secondary_traits = ShapeMeaning.MEANINGS[secondary_shape]["personality"]
        personality_traits = list(set(primary_traits[:2] + secondary_traits[:1]))
        
        # Get role suggestions
        primary_roles = ShapeMeaning.MEANINGS[primary_shape]["role"]
        secondary_roles = ShapeMeaning.MEANINGS[secondary_shape]["role"]
        role_suggestions = list(set(primary_roles[:2] + secondary_roles[:1]))
        
        # Determine emotional tone
        primary_emotions = ShapeMeaning.MEANINGS[primary_shape]["emotion"]
        secondary_emotions = ShapeMeaning.MEANINGS[secondary_shape]["emotion"]
        emotional_tone = primary_emotions[0] if primary_emotions else "neutral"
        
        return ShapeProfile(
            primary_shape=primary_shape,
            secondary_shape=secondary_shape,
            personality_traits=personality_traits,
            role_suggestions=role_suggestions,
            emotional_tone=emotional_tone,
            complexity=complexity
        )
    
    def _stat_to_shape(self, stat_name: str, stat_value: int) -> ShapeType:
        """Map a stat to a shape based on its nature and value."""
        stat_mappings = {
            "strength": ShapeType.SQUARE,      # Physical power, stability
            "dexterity": ShapeType.TRIANGLE,   # Agility, sharpness
            "constitution": ShapeType.SQUARE,  # Endurance, stability
            "intelligence": ShapeType.CIRCLE,   # Knowledge, adaptability
            "wisdom": ShapeType.CIRCLE,        # Insight, understanding
            "charisma": ShapeType.CIRCLE       # Social, approachable
        }
        
        base_shape = stat_mappings.get(stat_name, ShapeType.CIRCLE)
        
        # High values can upgrade to special shapes
        if stat_value >= 16:
            if stat_name in ["wisdom", "intelligence"]:
                return ShapeType.STAR
            elif stat_name == "charisma":
                return ShapeType.DIAMOND
            elif stat_name in ["strength", "constitution"]:
                return ShapeType.SQUARE  # Keep as square but more prominent
            elif stat_name == "dexterity":
                return ShapeType.TRIANGLE  # Keep as triangle but sharper
        
        return base_shape
    
    def generate_avatar(self, stats: Dict[str, int], size: str = "medium", distance: str = "near") -> str:
        """
        Generate an ASCII avatar based on character stats.
        
        Args:
            stats: Character stats dictionary
            size: Size of avatar ("small", "medium", "large")
            distance: Distance level ("near", "mid", "far")
            
        Returns:
            ASCII string representation of the avatar
        """
        # Analyze character stats
        profile = self.analyze_character_stats(stats)
        
        # Generate based on distance
        if distance == "far":
            # Far distance: single primitive shape
            return self._generate_primitive_avatar(profile.primary_shape, size)
        elif distance == "mid":
            # Mid distance: blurred composite
            return self._generate_blurred_avatar(profile, size)
        else:
            # Near distance: detailed composite shape
            return self._generate_detailed_avatar(profile, size)
    
    def _generate_primitive_avatar(self, shape: ShapeType, size: str) -> str:
        """Generate a simple primitive shape for far distance."""
        primitive_chars = {
            ShapeType.CIRCLE: "○",
            ShapeType.SQUARE: "■",
            ShapeType.TRIANGLE: "▲",
            ShapeType.DIAMOND: "◊",
            ShapeType.CROSS: "✚",
            ShapeType.STAR: "✦"
        }
        
        char = primitive_chars.get(shape, "?")
        
        if size == "small":
            return char
        elif size == "medium":
            return f" {char} "
        else:  # large
            return f"  {char}  "
    
    def _generate_blurred_avatar(self, profile: ShapeProfile, size: str) -> str:
        """Generate a blurred composite shape for mid distance."""
        # Use primary shape with some secondary influence
        primary_char = {
            ShapeType.CIRCLE: "○",
            ShapeType.SQUARE: "■",
            ShapeType.TRIANGLE: "▲",
            ShapeType.DIAMOND: "◊",
            ShapeType.CROSS: "✚",
            ShapeType.STAR: "✦"
        }.get(profile.primary_shape, "?")
        
        # Add secondary influence as modifier
        if profile.secondary_shape != profile.primary_shape:
            secondary_modifiers = {
                ShapeType.CIRCLE: "~",  # Soft blur
                ShapeType.SQUARE: "#",  # Hard blur
                ShapeType.TRIANGLE: "/",  # Sharp blur
                ShapeType.DIAMOND: "*",  # Sparkle blur
                ShapeType.CROSS: "+",  # Cross blur
                ShapeType.STAR: "."   # Star blur
            }
            modifier = secondary_modifiers.get(profile.secondary_shape, "")
            
            if size == "small":
                return f"{primary_char}{modifier}"
            elif size == "medium":
                return f" {primary_char}{modifier} "
            else:  # large
                return f"  {primary_char}{modifier}  "
        else:
            return self._generate_primitive_avatar(profile.primary_shape, size)
    
    def _generate_detailed_avatar(self, profile: ShapeProfile, size: str) -> str:
        """Generate detailed composite shape for near distance."""
        # Use composite templates if available
        composite_key = (profile.primary_shape, profile.secondary_shape)
        
        if composite_key in self.composite_templates:
            template = self.composite_templates[composite_key][size]
            # Add complexity-based detail
            if profile.complexity > 0.7:
                # Add more detail for complex characters
                return self._add_detail_to_template(template, profile)
            else:
                return template[2] if len(template) > 2 else template[0]
        else:
            # Fallback to primary shape template
            return self.shape_templates[profile.primary_shape][size][2] if len(self.shape_templates[profile.primary_shape][size]) > 2 else self.shape_templates[profile.primary_shape][size][0]
    
    def _add_detail_to_template(self, template: List[str], profile: ShapeProfile) -> str:
        """Add detail to a template based on character complexity."""
        if not template or len(template) < 3:
            return template[0] if template else "?"
        
        base_template = template[2]  # Use medium size as base
        
        # Add complexity-based modifications
        if profile.complexity > 0.8:
            # High complexity: add special markers
            special_markers = {
                ShapeType.STAR: "✦",
                ShapeType.DIAMOND: "◊",
                ShapeType.CROSS: "✚"
            }
            
            if profile.primary_shape in special_markers:
                marker = special_markers[profile.primary_shape]
                # Replace center with special marker
                lines = base_template.split('\n') if '\n' in base_template else [base_template]
                if lines:
                    center_line = len(lines) // 2
                    if center_line < len(lines):
                        line = lines[center_line]
                        center_pos = len(line) // 2
                        if center_pos < len(line):
                            line = line[:center_pos] + marker + line[center_pos+1:]
                            lines[center_line] = line
                return '\n'.join(lines)
        
        return base_template
    
    def generate_shape_legend(self) -> str:
        """Generate a legend explaining the shape language system."""
        legend = "🎨 SHAPE LANGUAGE LEGEND\n"
        legend += "=" * 40 + "\n\n"
        
        for shape in ShapeType:
            meanings = ShapeMeaning.MEANINGS[shape]
            legend += f"{shape.value.upper()}:\n"
            legend += f"  Personality: {', '.join(meanings['personality'][:3])}\n"
            legend += f"  Roles: {', '.join(meanings['role'][:2])}\n"
            legend += f"  Emotion: {meanings['emotion'][0] if meanings['emotion'] else 'neutral'}\n\n"
        
        legend += "COMPOSITE EXAMPLES:\n"
        legend += "○ + ■ = Diplomat (Friendly but reliable)\n"
        legend += "▲ + ○ = Rogue (Dangerous but charming)\n"
        legend += "■ + ■ = Tank (Unmovable and strong)\n"
        legend += "○ + ○ = Healer (Gentle and nurturing)\n"
        
        return legend
    
    def get_character_description(self, stats: Dict[str, int]) -> str:
        """Generate a character description based on shape analysis."""
        profile = self.analyze_character_stats(stats)
        
        description = f"Shape Profile: {profile.primary_shape.value} + {profile.secondary_shape.value}\n"
        description += f"Personality: {', '.join(profile.personality_traits)}\n"
        description += f"Role: {', '.join(profile.role_suggestions)}\n"
        description += f"Emotional Tone: {profile.emotional_tone}\n"
        description += f"Complexity: {profile.complexity:.1f}/1.0"
        
        return description


# Export for use by other modules
__all__ = ["ShapeAvatarGenerator", "ShapeProfile", "ShapeType", "ShapeMeaning"]
