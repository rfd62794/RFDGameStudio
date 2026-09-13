"""
Turn-Around Latency Benchmark: Trajectory Drift Performance Testing

Measures system performance when the Voyager suddenly changes direction,
testing the cache invalidation and re-pre-caching mechanisms.

Critical for ensuring that a sudden 180° turn still resolves within
the 200-500ms narrative path window.
"""

import asyncio
import time
import statistics
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
import json
import sys
import os

# Add src to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from loguru import logger
from predictive_narrative import PredictiveNarrativeEngine, create_predictive_engine
from game_state import GameState, create_tavern_scenario
from logic.orientation import OrientationManager
from d20_core import D20Resolver


@dataclass
class TurnAroundScenario:
    """A specific turn-around test scenario."""
    scenario_id: str
    initial_heading: float  # Starting angle in degrees
    target_heading: float   # Target angle in degrees
    initial_position: Tuple[int, int]
    target_position: Tuple[int, int]
    npc_positions: List[Tuple[int, int]]
    description: str


@dataclass
class TurnAroundMetrics:
    """Metrics for a turn-around scenario."""
    scenario_id: str
    angle_change: float
    cache_invalidation_time: float  # Time to detect and invalidate cache
    re_precache_time: float         # Time to re-populate cache
    first_narrative_time: float     # Time to first narrative after turn
    total_recovery_time: float      # Total time to full recovery
    cache_entries_invalidated: int
    cache_entries_repopulated: int
    success: bool


class TurnAroundBenchmark:
    """
    Benchmarks turn-around latency for trajectory drift scenarios.
    
    Tests the system's ability to handle sudden direction changes
    and maintain narrative performance within acceptable limits.
    """
    
    def __init__(self, output_dir: Path = Path("benchmarks")):
        """
        Initialize turn-around benchmark.
        
        Args:
            output_dir: Directory for benchmark results
        """
        self.output_dir = output_dir
        self.output_dir.mkdir(exist_ok=True)
        
        # Test scenarios covering various turn-around situations
        self.scenarios = self._generate_scenarios()
        
        # Performance targets
        self.target_recovery_time = 0.5  # 500ms max recovery time
        self.target_first_narrative = 0.2  # 200ms max first narrative
        
        logger.info("🔄 Turn-Around Latency Benchmark initialized")
    
    def _generate_scenarios(self) -> List[TurnAroundScenario]:
        """Generate comprehensive turn-around test scenarios."""
        scenarios = [
            # Classic 180° turn
            TurnAroundScenario(
                scenario_id="classic_180",
                initial_heading=0.0,    # Facing North
                target_heading=180.0,    # Facing South
                initial_position=(5, 5),
                target_position=(5, 0),
                npc_positions=[(5, 3), (7, 5), (3, 5)],
                description="Classic 180° turn from North to South"
            ),
            
            # 90° turn right
            TurnAroundScenario(
                scenario_id="turn_right_90",
                initial_heading=0.0,    # Facing North
                target_heading=90.0,     # Facing East
                initial_position=(5, 5),
                target_position=(8, 5),
                npc_positions=[(7, 5), (5, 7), (5, 3)],
                description="90° turn right from North to East"
            ),
            
            # 90° turn left
            TurnAroundScenario(
                scenario_id="turn_left_90",
                initial_heading=0.0,    # Facing North
                target_heading=270.0,    # Facing West
                initial_position=(5, 5),
                target_position=(2, 5),
                npc_positions=[(3, 5), (5, 7), (5, 3)],
                description="90° turn left from North to West"
            ),
            
            # 135° diagonal turn
            TurnAroundScenario(
                scenario_id="diagonal_135",
                initial_heading=45.0,    # Facing Northeast
                target_heading=180.0,     # Facing South
                initial_position=(5, 5),
                target_position=(5, 0),
                npc_positions=[(6, 4), (4, 6), (7, 5)],
                description="135° diagonal turn from Northeast to South"
            ),
            
            # Sharp 270° turn (spin around)
            TurnAroundScenario(
                scenario_id="sharp_270",
                initial_heading=0.0,    # Facing North
                target_heading=270.0,    # Facing West
                initial_position=(5, 5),
                target_position=(2, 5),
                npc_positions=[(3, 5), (5, 7), (5, 3)],
                description="Sharp 270° turn from North to West"
            ),
            
            # Multiple quick turns (stress test)
            TurnAroundScenario(
                scenario_id="multiple_turns",
                initial_heading=0.0,    # Facing North
                target_heading=180.0,    # Facing South
                initial_position=(5, 5),
                target_position=(5, 0),
                npc_positions=[(5, 3), (7, 5), (3, 5), (5, 7)],
                description="Multiple NPCs with 180° turn (stress test)"
            )
        ]
        
        return scenarios
    
    async def run_benchmark(self, iterations: int = 5) -> Dict[str, List[TurnAroundMetrics]]:
        """
        Run complete turn-around benchmark.
        
        Args:
            iterations: Number of times to run each scenario
            
        Returns:
            Dictionary mapping scenario IDs to metrics lists
        """
        logger.info(f"🔄 Starting turn-around benchmark ({iterations} iterations per scenario)...")
        
        results = {}
        
        for scenario in self.scenarios:
            logger.info(f"Testing scenario: {scenario.scenario_id}")
            scenario_results = []
            
            for i in range(iterations):
                try:
                    metrics = await self._run_scenario(scenario)
                    scenario_results.append(metrics)
                    logger.debug(f"  Iteration {i+1}: {metrics.total_recovery_time:.3f}s recovery")
                except Exception as e:
                    logger.error(f"Scenario {scenario.scenario_id} iteration {i+1} failed: {e}")
                    # Add failed metrics
                    failed_metrics = TurnAroundMetrics(
                        scenario_id=scenario.scenario_id,
                        angle_change=scenario.target_heading - scenario.initial_heading,
                        cache_invalidation_time=999.0,
                        re_precache_time=999.0,
                        first_narrative_time=999.0,
                        total_recovery_time=999.0,
                        cache_entries_invalidated=0,
                        cache_entries_repopulated=0,
                        success=False
                    )
                    scenario_results.append(failed_metrics)
            
            results[scenario.scenario_id] = scenario_results
        
        # Save results
        self._save_results(results)
        
        logger.info("✅ Turn-around benchmark completed")
        return results
    
    async def _run_scenario(self, scenario: TurnAroundScenario) -> TurnAroundMetrics:
        """Run a single turn-around scenario."""
        # Create test environment
        game_state = create_tavern_scenario()
        orientation_manager = OrientationManager()
        predictive_engine = create_predictive_engine()
        
        # Set up orientation manager
        orientation_manager.set_position(
            scenario.initial_position[0], 
            scenario.initial_position[1], 
            scenario.initial_heading
        )
        
        # Integrate with predictive engine
        predictive_engine.set_orientation_manager(orientation_manager)
        await predictive_engine.start()
        
        # Set up initial game state
        game_state.player.position = scenario.initial_position
        game_state.player_heading = scenario.initial_heading
        
        # Add NPCs to game state
        for i, npc_pos in enumerate(scenario.npc_positions):
            npc = {
                'id': f'npc_{i}',
                'name': f'NPC {i}',
                'position': npc_pos,
                'state': 'neutral'
            }
            if game_state.current_room:
                game_state.current_room.npcs.append(npc)
        
        # Phase 1: Build initial cache
        start_time = time.perf_counter()
        predictive_engine.look_ahead(game_state)
        
        # Wait for initial pre-caching
        await asyncio.sleep(0.5)
        
        initial_cache_size = len(predictive_engine.buffer._cache)
        
        # Phase 2: Execute turn-around
        turn_start = time.perf_counter()
        
        # Update orientation (this should trigger cache invalidation)
        orientation_manager.set_position(
            scenario.target_position[0],
            scenario.target_position[1],
            scenario.target_heading
        )
        
        # Update game state
        game_state.player.position = scenario.target_position
        game_state.player_heading = scenario.target_heading
        
        # Phase 3: Measure cache invalidation
        invalidation_start = time.perf_counter()
        
        # Trigger look_ahead with new trajectory
        predictive_engine.look_ahead(game_state)
        
        # Wait for cache invalidation to complete
        cache_invalidated = False
        for _ in range(50):  # Max 500ms wait
            await asyncio.sleep(0.01)
            if not predictive_engine.buffer.is_trajectory_valid():
                cache_invalidated = True
                break
        
        invalidation_time = time.perf_counter() - invalidation_start
        
        # Phase 4: Measure re-pre-caching
        re_precache_start = time.perf_counter()
        
        # Wait for cache to repopulate
        cache_repopulated = False
        for _ in range(100):  # Max 1s wait
            await asyncio.sleep(0.01)
            if len(predictive_engine.buffer._cache) >= initial_cache_size * 0.8:  # 80% recovery
                cache_repopulated = True
                break
        
        re_precache_time = time.perf_counter() - re_precache_start
        
        # Phase 5: Measure first narrative generation
        narrative_start = time.perf_counter()
        
        # Try to generate narrative for nearest NPC
        nearest_npc = min(scenario.npc_positions, 
                         key=lambda pos: abs(pos[0] - scenario.target_position[0]) + 
                                       abs(pos[1] - scenario.target_position[1]))
        
        try:
            await predictive_engine.generate_outcome(
                "talk",
                "Hello there",
                "Test context",
                100, 0,
                f'npc_{scenario.npc_positions.index(nearest_npc)}'
            )
            narrative_success = True
        except Exception as e:
            logger.warning(f"Narrative generation failed: {e}")
            narrative_success = False
        
        first_narrative_time = time.perf_counter() - narrative_start
        
        # Calculate total recovery time
        total_recovery_time = time.perf_counter() - turn_start
        
        # Clean up
        await predictive_engine.stop()
        
        # Determine success
        success = (cache_invalidated and cache_repopulated and narrative_success and 
                  total_recovery_time <= self.target_recovery_time and
                  first_narrative_time <= self.target_first_narrative)
        
        return TurnAroundMetrics(
            scenario_id=scenario.scenario_id,
            angle_change=abs(scenario.target_heading - scenario.initial_heading),
            cache_invalidation_time=invalidation_time,
            re_precache_time=re_precache_time,
            first_narrative_time=first_narrative_time,
            total_recovery_time=total_recovery_time,
            cache_entries_invalidated=initial_cache_size,
            cache_entries_repopulated=len(predictive_engine.buffer._cache),
            success=success
        )
    
    def _save_results(self, results: Dict[str, List[TurnAroundMetrics]]) -> None:
        """Save benchmark results to file."""
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        results_file = self.output_dir / f"turn_around_benchmark_{timestamp}.json"
        
        # Convert to serializable format
        serializable_results = {}
        for scenario_id, metrics_list in results.items():
            serializable_results[scenario_id] = [asdict(metrics) for metrics in metrics_list]
        
        with open(results_file, 'w') as f:
            json.dump(serializable_results, f, indent=2)
        
        logger.info(f"📊 Turn-around benchmark results saved to: {results_file}")
        
        # Also save summary
        self._save_summary(results, timestamp)
    
    def _save_summary(self, results: Dict[str, List[TurnAroundMetrics]], timestamp: str) -> None:
        """Save human-readable summary."""
        summary_file = self.output_dir / f"turn_around_summary_{timestamp}.txt"
        
        with open(summary_file, 'w') as f:
            f.write("Turn-Around Latency Benchmark Summary\n")
            f.write("=" * 50 + "\n\n")
            
            # Overall statistics
            all_metrics = []
            for metrics_list in results.values():
                all_metrics.extend(metrics_list)
            
            successful_metrics = [m for m in all_metrics if m.success]
            
            f.write("Overall Performance:\n")
            f.write(f"  Total Scenarios: {len(results)}\n")
            f.write(f"  Total Runs: {len(all_metrics)}\n")
            f.write(f"  Successful Runs: {len(successful_metrics)}\n")
            f.write(f"  Success Rate: {len(successful_metrics)/len(all_metrics):.1%}\n\n")
            
            if successful_metrics:
                f.write("Performance Metrics (Successful Runs):\n")
                f.write(f"  Avg Recovery Time: {statistics.mean([m.total_recovery_time for m in successful_metrics]):.3f}s\n")
                f.write(f"  Avg First Narrative: {statistics.mean([m.first_narrative_time for m in successful_metrics]):.3f}s\n")
                f.write(f"  Avg Cache Invalidation: {statistics.mean([m.cache_invalidation_time for m in successful_metrics]):.3f}s\n")
                f.write(f"  Avg Re-precache Time: {statistics.mean([m.re_precache_time for m in successful_metrics]):.3f}s\n\n")
            
            # Per-scenario breakdown
            f.write("Scenario Breakdown:\n")
            f.write("-" * 30 + "\n")
            
            for scenario_id, metrics_list in results.items():
                scenario = next(s for s in self.scenarios if s.scenario_id == scenario_id)
                successful = [m for m in metrics_list if m.success]
                
                f.write(f"\n{scenario_id}: {scenario.description}\n")
                f.write(f"  Angle Change: {scenario.target_heading - scenario.initial_heading:.1f}°\n")
                f.write(f"  Success Rate: {len(successful)/len(metrics_list):.1%}\n")
                
                if successful:
                    f.write(f"  Avg Recovery Time: {statistics.mean([m.total_recovery_time for m in successful]):.3f}s\n")
                    f.write(f"  Avg First Narrative: {statistics.mean([m.first_narrative_time for m in successful]):.3f}s\n")
                else:
                    f.write("  ❌ No successful runs\n")
                
                # Performance assessment
                if successful:
                    avg_recovery = statistics.mean([m.total_recovery_time for m in successful])
                    avg_narrative = statistics.mean([m.first_narrative_time for m in successful])
                    
                    if avg_recovery <= self.target_recovery_time and avg_narrative <= self.target_first_narrative:
                        f.write("  ✅ MEETS TARGETS\n")
                    else:
                        f.write("  ⚠️ BELOW TARGETS\n")
                else:
                    f.write("  ❌ FAILS TARGETS\n")
            
            # Recommendations
            f.write("\nRecommendations:\n")
            f.write("-" * 20 + "\n")
            
            if len(successful_metrics) / len(all_metrics) >= 0.8:
                f.write("✅ EXCELLENT: Turn-around performance meets targets\n")
                f.write("   System handles trajectory changes gracefully\n")
            elif len(successful_metrics) / len(all_metrics) >= 0.5:
                f.write("⚠️ GOOD: Most scenarios work, some optimization needed\n")
                f.write("   Consider tuning cache invalidation thresholds\n")
            else:
                f.write("❌ POOR: Turn-around performance needs improvement\n")
                f.write("   Significant optimization required\n")
        
        logger.info(f"📋 Summary saved to: {summary_file}")


async def main():
    """Run turn-around benchmark and display results."""
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🔄 Turn-Around Latency Benchmark Suite")
    print("=" * 50)
    print("Testing trajectory drift performance...")
    print()
    
    # Run benchmark
    benchmark = TurnAroundBenchmark()
    results = await benchmark.run_benchmark(iterations=3)
    
    # Display results
    print("\n📊 Turn-Around Benchmark Results:")
    
    # Overall statistics
    all_metrics = []
    for metrics_list in results.values():
        all_metrics.extend(metrics_list)
    
    successful = [m for m in all_metrics if m.success]
    
    print(f"Overall Success Rate: {len(successful)/len(all_metrics):.1%}")
    
    if successful:
        avg_recovery = statistics.mean([m.total_recovery_time for m in successful])
        avg_narrative = statistics.mean([m.first_narrative_time for m in successful])
        
        print(f"Average Recovery Time: {avg_recovery:.3f}s (target: 0.5s)")
        print(f"Average First Narrative: {avg_narrative:.3f}s (target: 0.2s)")
    
    print("\n📋 Scenario Results:")
    for scenario_id, metrics_list in results.items():
        scenario_successful = [m for m in metrics_list if m.success]
        success_rate = len(scenario_successful) / len(metrics_list)
        
        status = "✅" if success_rate >= 0.8 else "⚠️" if success_rate >= 0.5 else "❌"
        print(f"  {scenario_id}: {status} {success_rate:.1%} success")
    
    # Assessment
    print(f"\n🎯 Turn-Around Assessment:")
    if len(successful) / len(all_metrics) >= 0.8:
        print("✅ EXCELLENT: System handles trajectory changes gracefully")
    elif len(successful) / len(all_metrics) >= 0.5:
        print("⚠️ GOOD: Most scenarios work, minor optimization needed")
    else:
        print("❌ POOR: Significant optimization required")
    
    print(f"\n📁 Detailed results saved to: {benchmark.output_dir}")


if __name__ == "__main__":
    asyncio.run(main())
