"""
LOD (Level of Detail) Manager - Resolution-Adaptive UI Rendering
Implements The Lead's Review: LOD Rule for sub-200px resolutions
"""

from typing import Dict, Any, List, Optional, Tuple
import logging
from dataclasses import dataclass
from enum import Enum


class LODLevel(Enum):
    """Level of Detail levels for adaptive rendering"""
    FULL = "full"           # Full UI with all text and details
    COMPACT = "compact"     # Reduced text, essential info only
    MINIMAL = "minimal"     # Icons and essential visuals only
    ICON_ONLY = "icon_only" # Just icons/sprites, no text


@dataclass
class LODConfig:
    """Configuration for LOD levels"""
    level: LODLevel
    min_width: int
    show_stats: bool
    show_names: bool
    show_descriptions: bool
    font_size_multiplier: float
    card_spacing_multiplier: float
    icon_size_multiplier: float


class LODManager:
    """
    Level of Detail manager for adaptive UI rendering.
    Implements The Lead's Review: Auto-drop stats text for sub-200px resolutions.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # LOD configurations based on resolution thresholds
        self.lod_configs = [
            LODConfig(
                level=LODLevel.FULL,
                min_width=800,
                show_stats=True,
                show_names=True,
                show_descriptions=True,
                font_size_multiplier=1.0,
                card_spacing_multiplier=1.0,
                icon_size_multiplier=1.0
            ),
            LODConfig(
                level=LODLevel.COMPACT,
                min_width=400,
                show_stats=True,
                show_names=True,
                show_descriptions=False,
                font_size_multiplier=0.8,
                card_spacing_multiplier=0.9,
                icon_size_multiplier=0.9
            ),
            LODConfig(
                level=LODLevel.MINIMAL,
                min_width=200,
                show_stats=False,  # The Lead's Review: Auto-drop stats text
                show_names=True,
                show_descriptions=False,
                font_size_multiplier=0.6,
                card_spacing_multiplier=0.8,
                icon_size_multiplier=0.8
            ),
            LODConfig(
                level=LODLevel.ICON_ONLY,
                min_width=0,
                show_stats=False,
                show_names=False,
                show_descriptions=False,
                font_size_multiplier=0.4,
                card_spacing_multiplier=0.7,
                icon_size_multiplier=0.7
            )
        ]
        
        self.current_config = None
        self.current_resolution = (0, 0)
        
        self.logger.info("LODManager initialized with adaptive rendering rules")
    
    def update_resolution(self, resolution: Tuple[int, int]) -> LODConfig:
        """
        Update LOD configuration based on resolution.
        
        Args:
            resolution: Current window resolution (width, height)
            
        Returns:
            Active LOD configuration
        """
        self.current_resolution = resolution
        width, height = resolution
        
        # Find appropriate LOD level
        for config in reversed(self.lod_configs):  # Start from highest requirements
            if width >= config.min_width:
                self.current_config = config
                break
        else:
            # Fallback to minimal
            self.current_config = self.lod_configs[-1]
        
        self.logger.info(f"LOD updated to {self.current_config.level.value} for resolution {width}x{height}")
        return self.current_config
    
    def should_show_stats(self) -> bool:
        """Check if stats should be displayed (The Lead's Review rule)"""
        return self.current_config.show_stats if self.current_config else True
    
    def should_show_names(self) -> bool:
        """Check if names should be displayed"""
        return self.current_config.show_names if self.current_config else True
    
    def should_show_descriptions(self) -> bool:
        """Check if descriptions should be displayed"""
        return self.current_config.show_descriptions if self.current_config else True
    
    def get_font_size(self, base_size: int) -> int:
        """Get adjusted font size based on LOD level"""
        if not self.current_config:
            return base_size
        
        adjusted_size = int(base_size * self.current_config.font_size_multiplier)
        return max(6, adjusted_size)  # Minimum readable size
    
    def get_card_spacing(self, base_spacing: int) -> int:
        """Get adjusted card spacing based on LOD level"""
        if not self.current_config:
            return base_spacing
        
        return int(base_spacing * self.current_config.card_spacing_multiplier)
    
    def get_icon_size(self, base_size: int) -> int:
        """Get adjusted icon size based on LOD level"""
        if not self.current_config:
            return base_size
        
        return int(base_size * self.current_config.icon_size_multiplier)
    
    def get_lod_summary(self) -> Dict[str, Any]:
        """Get summary of current LOD settings"""
        if not self.current_config:
            return {"error": "No LOD configuration set"}
        
        return {
            "resolution": self.current_resolution,
            "lod_level": self.current_config.level.value,
            "min_width_threshold": self.current_config.min_width,
            "show_stats": self.current_config.show_stats,
            "show_names": self.current_config.show_names,
            "show_descriptions": self.current_config.show_descriptions,
            "font_multiplier": self.current_config.font_size_multiplier,
            "card_spacing_multiplier": self.current_config.card_spacing_multiplier,
            "icon_multiplier": self.current_config.icon_size_multiplier
        }
    
    def apply_lod_to_turtle_card(self, card_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Apply LOD rules to turtle card rendering data.
        
        Args:
            card_data: Original card data
            
        Returns:
            LOD-adjusted card data
        """
        if not self.current_config:
            return card_data
        
        adjusted_data = card_data.copy()
        
        # Apply LOD rules
        if not self.should_show_stats():
            # The Lead's Review: Auto-drop stats text for sub-200px resolutions
            adjusted_data['show_stats'] = False
            adjusted_data['stats_text'] = ""
        
        if not self.should_show_names():
            adjusted_data['show_name'] = False
            adjusted_data['name_text'] = ""
        
        if not self.should_show_descriptions():
            adjusted_data['show_description'] = False
            adjusted_data['description_text'] = ""
        
        # Adjust font sizes
        if 'font_sizes' in adjusted_data:
            for font_key, base_size in adjusted_data['font_sizes'].items():
                adjusted_data['font_sizes'][font_key] = self.get_font_size(base_size)
        
        # Adjust icon sizes
        if 'icon_size' in adjusted_data:
            adjusted_data['icon_size'] = self.get_icon_size(adjusted_data['icon_size'])
        
        return adjusted_data
    
    def apply_lod_to_market_item(self, item_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Apply LOD rules to market item rendering data.
        
        Args:
            item_data: Original item data
            
        Returns:
            LOD-adjusted item data
        """
        if not self.current_config:
            return item_data
        
        adjusted_data = item_data.copy()
        
        # Apply LOD rules
        if not self.should_show_descriptions():
            adjusted_data['show_description'] = False
            adjusted_data['description_text'] = ""
        
        # Adjust price display for minimal LOD
        if self.current_config.level == LODLevel.MINIMAL:
            # Show only price icon, not full text
            adjusted_data['compact_price'] = True
            adjusted_data['price_text'] = f"${adjusted_data.get('price', 0)}"
        
        if self.current_config.level == LODLevel.ICON_ONLY:
            # Show only icon and price indicator
            adjusted_data['icon_only'] = True
            adjusted_data['price_text'] = ""
            adjusted_data['name_text'] = ""
        
        return adjusted_data
    
    def apply_lod_to_breeding_panel(self, panel_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Apply LOD rules to breeding panel rendering data.
        
        Args:
            panel_data: Original panel data
            
        Returns:
            LOD-adjusted panel data
        """
        if not self.current_config:
            return panel_data
        
        adjusted_data = panel_data.copy()
        
        # Apply LOD rules
        if not self.should_show_descriptions():
            adjusted_data['show_info_label'] = False
            adjusted_data['info_text'] = ""
        
        # Adjust button sizes for minimal LOD
        if self.current_config.level in [LODLevel.MINIMAL, LODLevel.ICON_ONLY]:
            adjusted_data['compact_buttons'] = True
            adjusted_data['button_text'] = ""  # Use icons only
        
        # Adjust parent slot display
        if not self.should_show_stats():
            for slot in adjusted_data.get('parent_slots', []):
                slot['show_stats'] = False
                slot['stats_text'] = ""
        
        return adjusted_data
    
    def get_rendering_hints(self) -> Dict[str, Any]:
        """
        Get rendering hints for the current LOD level.
        
        Returns:
            Rendering hints dictionary
        """
        if not self.current_config:
            return {}
        
        hints = {
            "use_compact_layouts": self.current_config.level in [LODLevel.COMPACT, LODLevel.MINIMAL, LODLevel.ICON_ONLY],
            "prefer_icons_over_text": self.current_config.level in [LODLevel.MINIMAL, LODLevel.ICON_ONLY],
            "reduce_visual_clutter": self.current_config.level != LODLevel.FULL,
            "optimize_for_touch": self.current_resolution[0] < 400,
            "enable_scroll_indicators": self.current_resolution[1] < 300
        }
        
        # Add specific hints based on resolution
        width, height = self.current_resolution
        
        if width < 200:
            # The Lead's Review: Sub-200px resolutions
            hints.update({
                "hide_all_optional_text": True,
                "use_symbolic_icons": True,
                "maximize_touch_targets": True,
                "simplify_color_scheme": True
            })
        elif width < 400:
            hints.update({
                "compact_text_layout": True,
                "reduce_whitespace": True,
                "use_abbreviated_labels": True
            })
        
        return hints
    
    def validate_lod_transition(self, old_resolution: Tuple[int, int], new_resolution: Tuple[int, int]) -> bool:
        """
        Validate LOD transition between resolutions.
        
        Args:
            old_resolution: Previous resolution
            new_resolution: New resolution
            
        Returns:
            True if transition is valid
        """
        old_config = None
        new_config = None
        
        # Find configs for resolutions
        for config in self.lod_configs:
            if old_resolution[0] >= config.min_width:
                old_config = config
                break
        
        for config in self.lod_configs:
            if new_resolution[0] >= config.min_width:
                new_config = config
                break
        
        # Check if transition makes sense
        if old_config and new_config:
            # Allow any transition, but log significant changes
            if old_config.level != new_config.level:
                self.logger.info(f"LOD transition: {old_config.level.value} → {new_config.level.value}")
                return True
        
        return True
    
    def get_lod_statistics(self) -> Dict[str, Any]:
        """Get LOD usage statistics"""
        return {
            "current_resolution": self.current_resolution,
            "current_lod_level": self.current_config.level.value if self.current_config else "unknown",
            "available_levels": [config.level.value for config in self.lod_configs],
            "resolution_thresholds": {
                config.level.value: config.min_width for config in self.lod_configs
            },
            "sub_200px_active": self.current_resolution[0] < 200 if self.current_resolution else False,
            "stats_hidden": not self.should_show_stats(),
            "names_hidden": not self.should_show_names(),
            "descriptions_hidden": not self.should_show_descriptions()
        }
