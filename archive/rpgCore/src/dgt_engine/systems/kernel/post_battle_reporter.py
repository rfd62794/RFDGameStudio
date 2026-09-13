"""
Post-Battle Reporter - MVP Identification & Performance Analysis
Analyzes 5v5 skirmish results to identify MVP and generate performance metrics
"""

import json
import time
import threading
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
from concurrent.futures import ThreadPoolExecutor, as_completed

from loguru import logger
from .persistence import legendary_registry, ShipPerformance
from .batch_processor import batch_processor, create_batch_update_data


class SkirmishOutcome(Enum):
    """Possible outcomes of a 5v5 skirmish"""
    VICTORY = "victory"
    DEFEAT = "defeat"
    DRAW = "draw"


@dataclass
class BattleMetrics:
    """Comprehensive metrics for a single skirmish"""
    skirmish_id: str
    timestamp: float
    fleet_id: str
    outcome: SkirmishOutcome
    duration_seconds: float
    total_damage_dealt: float
    total_damage_taken: float
    ship_performances: Dict[str, Dict[str, Any]]
    commander_signals: List[str]
    mvp_candidate: Optional[str] = None
    
    def calculate_team_efficiency(self) -> float:
        """Calculate overall team efficiency (0.0 - 1.0)"""
        if self.total_damage_dealt == 0:
            return 0.0
        
        # Efficiency based on damage ratio and survival
        damage_efficiency = min(self.total_damage_dealt / (self.total_damage_taken + 1), 1.0)
        survival_bonus = 0.1 if self.outcome == SkirmishOutcome.VICTORY else 0.0
        
        return min(damage_efficiency + survival_bonus, 1.0)


class PostBattleReporter:
    """Analyzes skirmish results and identifies MVP performance"""
    
    def __init__(self):
        self.recent_skirmishes: List[BattleMetrics] = []
        self.max_history = 50  # Keep last 50 skirmishes for analysis
        
    def analyze_skirmish(self, skirmish_data: Dict[str, Any]) -> BattleMetrics:
        """Analyze skirmish data and generate comprehensive metrics"""
        try:
            # Extract basic skirmish info
            skirmish_id = skirmish_data.get("skirmish_id", f"skirmish_{int(time.time())}")
            timestamp = skirmish_data.get("timestamp", time.time())
            fleet_id = skirmish_data.get("fleet_id", "unknown_fleet")
            outcome = SkirmishOutcome(skirmish_data.get("outcome", "draw"))
            duration = skirmish_data.get("duration_seconds", 0.0)
            
            # Process ship performances
            ship_performances = {}
            total_damage_dealt = 0.0
            total_damage_taken = 0.0
            
            for ship_id, ship_data in skirmish_data.get("ships", {}).items():
                damage_dealt = ship_data.get("damage_dealt", 0.0)
                damage_taken = ship_data.get("damage_taken", 0.0)
                accuracy = ship_data.get("accuracy", 0.0)
                survived = ship_data.get("survived", True)
                
                total_damage_dealt += damage_dealt
                total_damage_taken += damage_taken
                
                ship_performances[ship_id] = {
                    "damage_dealt": damage_dealt,
                    "damage_taken": damage_taken,
                    "accuracy": accuracy,
                    "survived": survived,
                    "kills": ship_data.get("kills", 0),
                    "assists": ship_data.get("assists", 0)
                }
            
            # Extract commander signals
            commander_signals = skirmish_data.get("commander_signals", [])
            
            # Create battle metrics
            metrics = BattleMetrics(
                skirmish_id=skirmish_id,
                timestamp=timestamp,
                fleet_id=fleet_id,
                outcome=outcome,
                duration_seconds=duration,
                total_damage_dealt=total_damage_dealt,
                total_damage_taken=total_damage_taken,
                ship_performances=ship_performances,
                commander_signals=commander_signals
            )
            
            # Identify MVP candidate
            metrics.mvp_candidate = self._identify_mvp(metrics)
            
            # Store in history
            self._add_to_history(metrics)
            
            logger.info(f"📊 Skirmish analyzed: {skirmish_id} - MVP: {metrics.mvp_candidate}")
            return metrics
            
        except Exception as e:
            logger.error(f"📊 Skirmish analysis failed: {e}")
            raise
    
    def _identify_mvp(self, metrics: BattleMetrics) -> Optional[str]:
        """Identify MVP ship based on multiple performance factors"""
        if not metrics.ship_performances:
            return None
        
        mvp_scores = {}
        
        for ship_id, performance in metrics.ship_performances.items():
            score = 0.0
            
            # Damage contribution (40% weight)
            damage_score = performance["damage_dealt"] / max(metrics.total_damage_dealt, 1)
            score += damage_score * 0.4
            
            # Accuracy bonus (20% weight)
            score += performance["accuracy"] * 0.2
            
            # Survival bonus (20% weight)
            if performance["survived"]:
                score += 0.2
            
            # Kill/assist contribution (20% weight)
            total_kills = performance.get("kills", 0) + performance.get("assists", 0)
            max_kills = max(
                (p.get("kills", 0) + p.get("assists", 0) 
                 for p in metrics.ship_performances.values()), 
                default=1
            )
            kill_score = total_kills / max_kills if max_kills > 0 else 0
            score += kill_score * 0.2
            
            mvp_scores[ship_id] = score
        
        # Return ship with highest MVP score
        if mvp_scores:
            return max(mvp_scores, key=mvp_scores.get)
        
        return None
    
    def _add_to_history(self, metrics: BattleMetrics):
        """Add skirmish to history with size limit"""
        self.recent_skirmishes.append(metrics)
        
        # Maintain history size limit
        if len(self.recent_skirmishes) > self.max_history:
            self.recent_skirmishes.pop(0)
    
    def record_skirmish_results(self, metrics: BattleMetrics) -> bool:
        """Thread-safe batch recording using dedicated batch processor"""
        try:
            # Convert metrics to batch update format
            batch_data = create_batch_update_data(metrics)
            
            # Submit to batch processor for thread-safe execution
            success = batch_processor.submit_batch_update(batch_data)
            
            if success:
                logger.debug(f"📊 Submitted batch update: {metrics.skirmish_id}")
            else:
                logger.error(f"📊 Failed to submit batch update: {metrics.skirmish_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"📊 Batch submission failed: {e}")
            return False
    
    def _record_skirmish_history(self, metrics: BattleMetrics):
        """Record skirmish in history table for analytics"""
        try:
            legendary_registry.conn.execute("""
                INSERT OR REPLACE INTO skirmish_history 
                (skirmish_id, timestamp, fleet_id, outcome, 
                 total_damage_dealt, total_damage_taken, mvp_ship_id,
                 duration_seconds, commander_signals)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                metrics.skirmish_id,
                metrics.timestamp,
                metrics.fleet_id,
                metrics.outcome.value,
                metrics.total_damage_dealt,
                metrics.total_damage_taken,
                metrics.mvp_candidate,
                metrics.duration_seconds,
                json.dumps(metrics.commander_signals)
            ))
            
            legendary_registry.conn.commit()
            
        except Exception as e:
            logger.error(f"📊 Failed to record skirmish history: {e}")
    
    def generate_mvp_report(self, metrics: BattleMetrics) -> Dict[str, Any]:
        """Generate detailed MVP report for narrative generation"""
        if not metrics.mvp_candidate:
            return {"error": "No MVP identified"}
        
        mvp_performance = metrics.ship_performances.get(metrics.mvp_candidate, {})
        
        report = {
            "mvp_ship": metrics.mvp_candidate,
            "skirmish_id": metrics.skirmish_id,
            "outcome": metrics.outcome.value,
            "team_performance": {
                "total_damage_dealt": metrics.total_damage_dealt,
                "total_damage_taken": metrics.total_damage_taken,
                "efficiency": metrics.calculate_team_efficiency(),
                "duration": metrics.duration_seconds
            },
            "mvp_performance": {
                "damage_dealt": mvp_performance.get("damage_dealt", 0),
                "damage_taken": mvp_performance.get("damage_taken", 0),
                "accuracy": mvp_performance.get("accuracy", 0),
                "survived": mvp_performance.get("survived", False),
                "kills": mvp_performance.get("kills", 0),
                "assists": mvp_performance.get("assists", 0),
                "damage_contribution": (
                    mvp_performance.get("damage_dealt", 0) / max(metrics.total_damage_dealt, 1)
                )
            },
            "command_context": {
                "signals_given": len(metrics.commander_signals),
                "last_signal": metrics.commander_signals[-1] if metrics.commander_signals else None
            }
        }
        
        return report
    
    def get_fleet_performance_trends(self, fleet_id: str, last_n_skirmishes: int = 10) -> Dict[str, Any]:
        """Analyze performance trends for a specific fleet"""
        fleet_skirmishes = [
            s for s in self.recent_skirmishes 
            if s.fleet_id == fleet_id
        ][-last_n_skirmishes:]
        
        if not fleet_skirmishes:
            return {"error": "No skirmish data found for fleet"}
        
        victories = sum(1 for s in fleet_skirmishes if s.outcome == SkirmishOutcome.VICTORY)
        total_damage = sum(s.total_damage_dealt for s in fleet_skirmishes)
        avg_duration = sum(s.duration_seconds for s in fleet_skirmishes) / len(fleet_skirmishes)
        
        # Identify consistent performers
        ship_appearances = {}
        ship_mvp_counts = {}
        
        for skirmish in fleet_skirmishes:
            for ship_id in skirmish.ship_performances:
                ship_appearances[ship_id] = ship_appearances.get(ship_id, 0) + 1
                if skirmish.mvp_candidate == ship_id:
                    ship_mvp_counts[ship_id] = ship_mvp_counts.get(ship_id, 0) + 1
        
        consistent_performers = {
            ship: {"appearances": count, "mvp_rate": ship_mvp_counts.get(ship, 0) / count}
            for ship, count in ship_appearances.items()
            if count >= last_n_skirmishes * 0.7  # Appeared in 70% of skirmishes
        }
        
        return {
            "fleet_id": fleet_id,
            "skirmishes_analyzed": len(fleet_skirmishes),
            "win_rate": victories / len(fleet_skirmishes),
            "total_damage_dealt": total_damage,
            "avg_duration_seconds": avg_duration,
            "consistent_performers": consistent_performers,
            "trend_direction": "improving" if victories > len(fleet_skirmishes) * 0.5 else "declining"
        }


# Global reporter instance
post_battle_reporter = PostBattleReporter()
