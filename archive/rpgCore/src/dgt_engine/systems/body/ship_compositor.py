"""
DGT Ship Compositor - ADR 129 Implementation
Modular ship assembly system for component-based rendering

Creates ship sprites from 3 layered Tiny Farm assets (frame, engine, weapons)
Supports genetic-driven component selection and real-time compositing
"""

import math
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass

from loguru import logger
from ..base import RenderEngine
from ...simulation.ship_genetics import ShipGenome, ShipComponent


@dataclass
class ShipLayer:
    """Individual ship rendering layer"""
    layer_type: str  # "frame", "engine", "weapon"
    asset_name: str
    position: Tuple[int, int]  # Relative to ship center
    color_tint: Tuple[int, int, int]
    scale: float = 1.0
    rotation: float = 0.0
    alpha: float = 255
    
    def get_render_params(self) -> Dict[str, Any]:
        """Get rendering parameters"""
        return {
            'asset': self.asset_name,
            'x': self.position[0],
            'y': self.position[1],
            'color': self.color_tint,
            'scale': self.scale,
            'rotation': self.rotation,
            'alpha': self.alpha
        }


class ShipCompositor:
    """Modular ship sprite compositor"""
    
    def __init__(self, asset_manager):
        self.asset_manager = asset_manager
        self.component_cache = {}
        
        # Component positioning templates
        self.layer_templates = {
            'frame': {'position': (0, 0), 'scale': 1.0, 'rotation': 0.0},
            'engine': {'position': (0, 15), 'scale': 0.8, 'rotation': 0.0},
            'weapon': {'position': (0, -10), 'scale': 0.6, 'rotation': 0.0}
        }
        
        # Asset mapping from ship genetics to Tiny Farm assets
        self.asset_mappings = {
            'frame': {
                'light': 'ship_frame_light',
                'medium': 'ship_frame_medium', 
                'heavy': 'ship_frame_heavy',
                'stealth': 'ship_frame_stealth'
            },
            'engine': {
                'ion': 'engine_ion',
                'fusion': 'engine_fusion',
                'antimatter': 'engine_antimatter',
                'solar': 'engine_solar',
                'warp': 'engine_warp'
            },
            'weapon': {
                'laser': 'weapon_laser',
                'plasma': 'weapon_plasma',
                'missile': 'weapon_missile',
                'railgun': 'weapon_railgun',
                'particle': 'weapon_particle'
            }
        }
        
        logger.info("🚀 Ship Compositor initialized")
    
    def compose_ship(self, genome: ShipGenome, position: Tuple[int, int] = (0, 0)) -> Dict[str, Any]:
        """Compose ship sprite from genetic blueprint"""
        components = genome.get_components()
        layers = []
        
        # Create layers for each component
        for component in components:
            layer = self._create_layer_from_component(component, position)
            if layer:
                layers.append(layer)
        
        # Sort layers by render order (frame first, then engine, then weapons)
        layer_order = {'frame': 0, 'engine': 1, 'weapon': 2}
        layers.sort(key=lambda l: layer_order.get(l.layer_type, 999))
        
        return {
            'ship_id': genome.ship_signature,
            'position': position,
            'layers': layers,
            'stats': genome.calculate_combat_stats(),
            'genome': genome.model_dump()
        }
    
    def _create_layer_from_component(self, component: ShipComponent, ship_position: Tuple[int, int]) -> Optional[ShipLayer]:
        """Create rendering layer from ship component"""
        layer_type = component.component_type
        
        # Get asset name from genetic mapping
        if layer_type == 'frame':
            asset_key = component.sprite_asset.replace('hull_', '')
            asset_name = self.asset_mappings['frame'].get(asset_key, 'ship_frame_medium')
        elif layer_type == 'engine':
            asset_key = component.sprite_asset.replace('engine_', '')
            asset_name = self.asset_mappings['engine'].get(asset_key, 'engine_ion')
        elif layer_type == 'weapon':
            asset_key = component.sprite_asset.replace('weapon_', '')
            asset_name = self.asset_mappings['weapon'].get(asset_key, 'weapon_laser')
        else:
            logger.warning(f"🚀 Unknown component type: {layer_type}")
            return None
        
        # Get template for this layer type
        template = self.layer_templates.get(layer_type, {'position': (0, 0), 'scale': 1.0, 'rotation': 0.0})
        
        # Calculate layer position relative to ship center
        layer_x = ship_position[0] + template['position'][0]
        layer_y = ship_position[1] + template['position'][1]
        
        # Apply genetic modifications
        scale = template['scale'] * self._get_scale_modifier(component)
        rotation = template['rotation'] + self._get_rotation_modifier(component)
        alpha = self._get_alpha_modifier(component)
        
        return ShipLayer(
            layer_type=layer_type,
            asset_name=asset_name,
            position=(layer_x, layer_y),
            color_tint=component.color_tint,
            scale=scale,
            rotation=rotation,
            alpha=alpha
        )
    
    def _get_scale_modifier(self, component: ShipComponent) -> float:
        """Get scale modifier from component stats"""
        if component.component_type == 'frame':
            # Scale based on structural integrity
            return 0.8 + component.get_effective_stat('durability') * 0.2
        elif component.component_type == 'engine':
            # Scale based on thruster output
            return 0.7 + component.get_effective_stat('thrust') * 0.3
        elif component.component_type == 'weapon':
            # Scale based on weapon damage
            return 0.6 + component.get_effective_stat('damage') * 0.4
        return 1.0
    
    def _get_rotation_modifier(self, component: ShipComponent) -> float:
        """Get rotation modifier from component stats"""
        if component.component_type == 'engine':
            # Engines can have slight rotation variation
            return (component.get_effective_stat('thrust') - 1.0) * 10.0
        elif component.component_type == 'weapon':
            # Weapons can have aiming variation
            return (component.get_effective_stat('accuracy') - 1.0) * 5.0
        return 0.0
    
    def _get_alpha_modifier(self, component: ShipComponent) -> int:
        """Get alpha modifier from component durability"""
        durability_ratio = component.durability / 100.0
        return int(255 * durability_ratio)
    
    def update_ship_damage(self, ship_data: Dict[str, Any], damage: float) -> Dict[str, Any]:
        """Update ship visual based on damage taken"""
        # Reduce component durability based on damage
        updated_layers = []
        
        for layer in ship_data['layers']:
            updated_layer = ShipLayer(
                layer_type=layer.layer_type,
                asset_name=layer.asset_name,
                position=layer.position,
                color_tint=layer.color_tint,
                scale=layer.scale,
                rotation=layer.rotation,
                alpha=max(50, layer.alpha - int(damage * 2))  # Reduce alpha based on damage
            )
            updated_layers.append(updated_layer)
        
        ship_data['layers'] = updated_layers
        return ship_data
    
    def create_vfx_layer(self, vfx_type: str, position: Tuple[int, int], target: Optional[Tuple[int, int]] = None) -> ShipLayer:
        """Create visual effects layer for combat"""
        if vfx_type == 'laser':
            # Laser beam effect
            if target:
                # Calculate rotation towards target
                dx = target[0] - position[0]
                dy = target[1] - position[1]
                rotation = math.degrees(math.atan2(dy, dx))
                
                return ShipLayer(
                    layer_type='vfx',
                    asset_name='vfx_laser_beam',
                    position=position,
                    color_tint=(255, 100, 100),
                    scale=1.0,
                    rotation=rotation,
                    alpha=200
                )
            else:
                return ShipLayer(
                    layer_type='vfx',
                    asset_name='vfx_laser_flash',
                    position=position,
                    color_tint=(255, 200, 200),
                    scale=0.5,
                    rotation=0.0,
                    alpha=255
                )
        
        elif vfx_type == 'explosion':
            return ShipLayer(
                layer_type='vfx',
                asset_name='vfx_explosion',
                position=position,
                color_tint=(255, 150, 50),
                scale=1.5,
                rotation=0.0,
                alpha=255
            )
        
        elif vfx_type == 'shield':
            return ShipLayer(
                layer_type='vfx',
                asset_name='vfx_shield_bubble',
                position=position,
                color_tint=(100, 200, 255),
                scale=1.2,
                rotation=0.0,
                alpha=100
            )
        
        elif vfx_type == 'repair':
            return ShipLayer(
                layer_type='vfx',
                asset_name='vfx_repair_spark',
                position=position,
                color_tint=(100, 255, 100),
                scale=0.3,
                rotation=0.0,
                alpha=200
            )
        
        # Default effect
        return ShipLayer(
            layer_type='vfx',
            asset_name='vfx_default',
            position=position,
            color_tint=(255, 255, 255),
            scale=1.0,
            rotation=0.0,
            alpha=255
        )
    
    def get_render_instructions(self, ship_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get rendering instructions for PPU"""
        instructions = []
        
        for layer in ship_data['layers']:
            instruction = {
                'type': 'component',
                'asset': layer.asset_name,
                'x': layer.position[0],
                'y': layer.position[1],
                'color': layer.color_tint,
                'scale': layer.scale,
                'rotation': layer.rotation,
                'alpha': layer.alpha,
                'layer_order': {'frame': 0, 'engine': 1, 'weapon': 2, 'vfx': 3}.get(layer.layer_type, 999)
            }
            instructions.append(instruction)
        
        return instructions
    
    def preload_assets(self) -> bool:
        """Preload required ship assets"""
        required_assets = []
        
        # Collect all required assets
        for category in self.asset_mappings.values():
            required_assets.extend(category.values())
        
        # Add VFX assets
        vfx_assets = [
            'vfx_laser_beam', 'vfx_laser_flash', 'vfx_explosion',
            'vfx_shield_bubble', 'vfx_repair_spark', 'vfx_default'
        ]
        required_assets.extend(vfx_assets)
        
        # Check if assets exist
        missing_assets = []
        for asset in required_assets:
            if not self.asset_manager.has_asset(asset):
                missing_assets.append(asset)
        
        if missing_assets:
            logger.warning(f"🚀 Missing ship assets: {missing_assets}")
            return False
        
        logger.info(f"🚀 Preloaded {len(required_assets)} ship assets")
        return True
    
    def get_asset_requirements(self) -> Dict[str, List[str]]:
        """Get required assets for ship compositing"""
        return {
            'frames': list(self.asset_mappings['frame'].values()),
            'engines': list(self.asset_mappings['engine'].values()),
            'weapons': list(self.asset_mappings['weapon'].values()),
            'vfx': [
                'vfx_laser_beam', 'vfx_laser_flash', 'vfx_explosion',
                'vfx_shield_bubble', 'vfx_repair_spark', 'vfx_default'
            ]
        }


# Global ship compositor instance
ship_compositor = None

def initialize_ship_compositor(asset_manager):
    """Initialize global ship compositor"""
    global ship_compositor
    ship_compositor = ShipCompositor(asset_manager)
    return ship_compositor
