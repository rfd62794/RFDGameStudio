"""Unified Dispatch System for all zone types"""

import random
from typing import List, Dict, Optional, Any
from dataclasses import dataclass

from .zone_types import ZoneType, ZoneConfig, get_zone_config
from .dispatch_record import DispatchRecord

@dataclass
class DispatchResult:
    """Result of dispatch resolution"""
    resource_gains: Dict[str, float]
    stat_deltas: Dict[str, float]
    losses: List[str]  # Slime IDs that were permanently lost
    success: bool
    message: str

class DispatchSystem:
    """Unified dispatch system handling all zone types"""
    
    def __init__(self):
        self.active_dispatches: List[DispatchRecord] = []
        self.completed_dispatches: List[DispatchRecord] = []
        self.current_tick: int = 0
    
    def create_dispatch(self, slimes: List[Any], zone_type: ZoneType, current_tick: int) -> DispatchRecord:
        """Create a new dispatch"""
        # Validate slimes are dispatch-eligible
        for slime in slimes:
            if not hasattr(slime, 'can_dispatch') or not slime.can_dispatch:
                raise ValueError(f"Slime {slime.slime_id if hasattr(slime, 'slime_id') else 'unknown'} cannot dispatch")
        
        # Get zone configuration
        zone_config = get_zone_config(zone_type)
        
        # Validate stage requirements
        for slime in slimes:
            if hasattr(slime, 'stage'):
                stage_order = {'Hatchling': 0, 'Juvenile': 1, 'Young': 2, 'Prime': 3, 'Veteran': 4, 'Elder': 5}
                slime_stage_order = stage_order.get(slime.stage, 0)
                min_stage_order = stage_order.get(zone_config.min_stage, 0)
                if slime_stage_order < min_stage_order:
                    raise ValueError(f"Slime stage {slime.stage} below minimum {zone_config.min_stage} for {zone_type.value}")
        
        # Create dispatch record
        dispatch = DispatchRecord(
            slime_ids=[slime.slime_id for slime in slimes if hasattr(slime, 'slime_id')],
            zone_type=zone_type,
            zone_config=zone_config
        )
        
        # Mark as active
        dispatch.mark_active(current_tick)
        
        # Add to active list
        self.active_dispatches.append(dispatch)
        
        return dispatch
    
    def update(self, current_tick: int) -> List[DispatchRecord]:
        """Update dispatch system and return completed dispatches"""
        self.current_tick = current_tick
        completed = []
        
        # Check active dispatches for completion
        for dispatch in self.active_dispatches[:]:  # Copy list to allow modification
            if current_tick >= dispatch.return_tick:
                # Move to completed
                self.active_dispatches.remove(dispatch)
                self.completed_dispatches.append(dispatch)
                # Mark as completed (not resolved yet)
                dispatch.status = "complete"  # Direct status update for completion
                completed.append(dispatch)
        
        return completed
    
    def resolve_dispatch(self, dispatch: DispatchRecord, slimes: List[Any]) -> Dict[str, Any]:
        """Resolve a completed dispatch and calculate outcomes"""
        if dispatch.zone_type == ZoneType.RACING:
            # Defer to RaceEngine integration
            return {
                'zone_type': 'racing',
                'status': 'deferred_to_simulation',
                'resource_gains': {},
                'stat_deltas': {},
                'losses': []
            }
        
        # Statistical resolution for other zones
        return self._resolve_statistical(dispatch, slimes)
    
    def _resolve_statistical(self, dispatch: DispatchRecord, slimes: List[Any]) -> Dict[str, Any]:
        """Resolve dispatch using statistical calculations"""
        zone_config = dispatch.zone_config
        if not zone_config:
            return {'error': 'No zone configuration found'}
        
        # Calculate squad power
        squad_power = self._calculate_squad_power(slimes)
        
        # Calculate success probability based on risk level
        risk_success_rates = {
            'none': 1.0,
            'low': 0.9,
            'standard': 0.7,
            'high': 0.5,
            'critical': 0.3
        }
        base_success_rate = risk_success_rates.get(zone_config.risk_level, 0.7)
        
        # Modify by squad power (0.5 to 1.5 multiplier)
        success_rate = base_success_rate * (0.5 + squad_power)
        success_rate = max(0.1, min(0.95, success_rate))  # Clamp between 10% and 95%
        
        # Determine success
        success = random.random() < success_rate
        
        # Calculate resource gains
        resource_gains = {}
        for resource, base_weight in zone_config.resource_returns.items():
            if base_weight > 0:
                # Scale by success and squad size
                gain = base_weight * len(slimes) * (1.5 if success else 0.5)
                # Add randomness
                gain *= random.uniform(0.7, 1.3)
                resource_gains[resource] = round(gain, 2)
        
        # Calculate stat deltas
        stat_deltas = {}
        for stat, growth_rate in zone_config.stat_growth.items():
            if growth_rate > 0:
                # Scale by success and individual slime growth
                delta = growth_rate * (1.2 if success else 0.8)
                delta *= random.uniform(0.8, 1.2)
                stat_deltas[stat] = round(delta, 3)
        
        # Calculate losses for high-risk zones
        losses = []
        if zone_config.risk_level in ['high', 'critical'] and not success:
            # Permanent loss probability
            loss_probability = 0.1 if zone_config.risk_level == 'high' else 0.2
            for slime in slimes:
                if hasattr(slime, 'dispatch_risk'):
                    # Higher risk slimes more likely to be lost
                    risk_multiplier = {'low': 0.5, 'standard': 1.0, 'high': 1.5, 'critical': 2.0}
                    slime_loss_prob = loss_probability * risk_multiplier.get(slime.dispatch_risk, 1.0)
                    if random.random() < slime_loss_prob:
                        losses.append(slime.slime_id if hasattr(slime, 'slime_id') else 'unknown')
        
        return {
            'zone_type': dispatch.zone_type.value,
            'status': 'success' if success else 'failed',
            'resource_gains': resource_gains,
            'stat_deltas': stat_deltas,
            'losses': losses,
            'success_rate': success_rate,
            'squad_power': squad_power
        }
    
    def _calculate_squad_power(self, slimes: List[Any]) -> float:
        """Calculate squad power based on slime stats and level"""
        if not slimes:
            return 0.0
        
        total_power = 0.0
        for slime in slimes:
            power = 0.0
            
            # Base power from level
            if hasattr(slime, 'level'):
                power += slime.level * 0.1
            
            # Power from stats (if available)
            if hasattr(slime, 'stat_block') and slime.stat_block:
                # Use computed stats from stat_block when available
                try:
                    power += slime.stat_block.atk * 0.02
                    power += slime.stat_block.hp * 0.01
                    power += slime.stat_block.spd * 0.02
                except (TypeError, AttributeError):
                    # Handle Mock objects or missing stat_block properties
                    # Fall back to genome-based calculation
                    if hasattr(slime, 'genome'):
                        genome = slime.genome
                        if hasattr(genome, 'base_atk'):
                            power += genome.base_atk * 0.02
                        if hasattr(genome, 'base_hp'):
                            power += genome.base_hp * 0.01
                        if hasattr(genome, 'base_spd'):
                            power += genome.base_spd * 0.02
            elif hasattr(slime, 'genome'):
                # TODO Phase 5B: pass RosterSlime here to use stat_block
                genome = slime.genome
                if hasattr(genome, 'base_atk'):
                    power += genome.base_atk * 0.02
                if hasattr(genome, 'base_hp'):
                    power += genome.base_hp * 0.01
                if hasattr(genome, 'base_spd'):
                    power += genome.base_spd * 0.02
            
            # Power from tier
            if hasattr(slime, 'genome'):
                genome = slime.genome
                if hasattr(genome, 'tier'):
                    power += genome.tier * 0.05
            
            total_power += power
        
        # Normalize to 0-1 range (assuming max power per slime is ~1.0)
        return min(1.0, total_power / len(slimes))
    
    def get_active_dispatches(self) -> List[DispatchRecord]:
        """Get all active dispatches"""
        return self.active_dispatches.copy()
    
    def get_completed_dispatches(self) -> List[DispatchRecord]:
        """Get all completed dispatches"""
        return self.completed_dispatches.copy()
    
    def get_dispatch_by_id(self, dispatch_id: str) -> Optional[DispatchRecord]:
        """Get dispatch by ID"""
        for dispatch in self.active_dispatches + self.completed_dispatches:
            if dispatch.dispatch_id == dispatch_id:
                return dispatch
        return None
    
    def cancel_dispatch(self, dispatch_id: str) -> bool:
        """Cancel an active dispatch"""
        for dispatch in self.active_dispatches[:]:
            if dispatch.dispatch_id == dispatch_id:
                self.active_dispatches.remove(dispatch)
                dispatch.mark_failed("Cancelled by player")
                self.completed_dispatches.append(dispatch)
                return True
        return False
    
    def get_system_stats(self) -> Dict[str, Any]:
        """Get system statistics"""
        return {
            'active_dispatches': len(self.active_dispatches),
            'completed_dispatches': len(self.completed_dispatches),
            'current_tick': self.current_tick,
            'total_dispatches': len(self.active_dispatches) + len(self.completed_dispatches)
        }
