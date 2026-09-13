"""
Intent Engine Module
ADR 084: Actor-Intent Decoupling

Decision Logic Component - evaluates Object DNA → Outputs Actions.
This is where the "Auto-Battler" logic lives.
Completely separate from movement.
"""

import asyncio
from typing import List, Tuple, Optional, Dict, Any
from loguru import logger
from dataclasses import dataclass
from core.state import InteractionIntent, IntentType

@dataclass
class IntentEngine:
    """Decision Logic Component - evaluates Object DNA and outputs actions"""
    
    def __init__(self, object_registry):
        self.object_registry = object_registry
        self.interaction_priorities = {
            'high_value': ['crystal', 'iron_chest'],
            'medium_value': ['tree', 'bush'],
            'low_value': ['animated_flower', 'water_puddle']
        }
    
    async def evaluate_intent(self, actor_position: Tuple[int, int], available_objects: List[Tuple[int, int]]) -> Optional[InteractionIntent]:
        """Evaluate nearby objects and generate interaction intent"""
        try:
            # Find best interaction target
            best_target = self._find_best_interaction(actor_position, available_objects)
            
            if best_target:
                obj = self.object_registry.get_object_at(best_target)
                if obj and hasattr(obj, 'characteristics'):
                    return InteractionIntent(
                        intent_type=IntentType.INTERACTION,
                        target_position=best_target,
                        interaction_type="examine",
                        confidence=0.8,
                        timestamp=0.0
                    )
            
            return None
        except Exception as e:
            logger.error(f"💥 Intent evaluation failed: {e}")
            return None
    
    def _find_best_interaction(self, actor_position: Tuple[int, int], available_objects: List[Tuple[int, int]]) -> Optional[Tuple[int, int]]:
        """Find the best interaction target based on object value and distance"""
        best_target = None
        best_score = -1
        
        for obj_pos in available_objects:
            obj = self.object_registry.get_object_at(obj_pos)
            if obj and hasattr(obj, 'characteristics'):
                # Calculate score based on object value and distance
                distance = abs(actor_position[0] - obj_pos[0]) + abs(actor_position[1] - obj_pos[1])
                value_score = self._calculate_object_value(obj.characteristics)
                
                # Closer is better, higher value is better
                score = (100 - distance) * value_score
                
                if score > best_score:
                    best_score = score
                    best_target = obj_pos
        
        return best_target
    
    def _calculate_object_value(self, characteristics) -> float:
        """Calculate object value based on characteristics"""
        value = 0.5  # Base value
        
        # Material-based value
        material_values = {
            'crystal': 0.9,
            'iron': 0.8,
            'wood': 0.6,
            'organic': 0.4,
            'water': 0.3
        }
        
        material = getattr(characteristics, 'material', 'unknown')
        value += material_values.get(material, 0.1)
        
        # Tag-based value
        valuable_tags = ['magical', 'ancient', 'rare']
        tags = getattr(characteristics, 'tags', [])
        for tag in valuable_tags:
            if tag in tags:
                value += 0.2
        
        return min(value, 1.0)
