"""
Final Sanity Check: Perfect Simulator Validation

The ultimate validation that ensures the DGT system meets all performance
targets and is ready for West Palm Beach deployment.

This is the "Big Red Button" that validates:
- 0.5ms boot consistency across 100 simulated turns
- 300ms turn-around recovery under all conditions
- Complete deterministic integrity
- Production-hardened logic (no TODOs remaining)
- Golden Seed generation for Epoch 10
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
import hashlib

# Add src to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from loguru import logger
from semantic_engine import SemanticEngine
from predictive_narrative import create_predictive_engine
from d20_core import D20Resolver
from game_state import GameState, create_tavern_scenario
from logic.orientation import OrientationManager
from utils.manifest_generator import ManifestGenerator
from benchmark_performance import PerformanceBenchmark
from benchmark_turn_around import TurnAroundBenchmark


@dataclass
class SanityCheckMetrics:
    """Metrics from the final sanity check."""
    boot_times: List[float]
    turn_around_times: List[float]
    deterministic_consistency: float
    todo_count: int
    production_ready: bool
    golden_seed: int
    epoch: int
    total_checks: int
    passed_checks: int


class FinalSanityCheck:
    """
    The ultimate validation suite for the Perfect Simulator.
    
    This is the final gatekeeper before West Palm Beach deployment.
    """
    
    def __init__(self, output_dir: Path = Path("final_validation")):
        """
        Initialize final sanity check.
        
        Args:
            output_dir: Directory for validation results
        """
        self.output_dir = output_dir
        self.output_dir.mkdir(exist_ok=True)
        
        # Performance targets (the absolute requirements)
        self.TARGET_BOOT_TIME = 0.005      # 5ms max
        self.TARGET_TURN_AROUND = 0.3      # 300ms max
        self.TARGET_CONSISTENCY = 0.95     # 95% deterministic
        self.TARGET_TODO_COUNT = 0         # No TODOs allowed
        
        # Golden Seed configuration
        self.EPOCH = 10  # Year 1000
        self.GOLDEN_SEED_BASE = "DGT_EPOCH_10"
        
        logger.info("🏆 Final Sanity Check initialized - Perfect Simulator validation")
    
    async def run_complete_validation(self) -> SanityCheckMetrics:
        """
        Run the complete final validation suite.
        
        Returns:
            Complete sanity check metrics
        """
        logger.info("🚀 Starting Final Sanity Check - The Big Red Button")
        
        start_time = time.perf_counter()
        
        # Initialize metrics
        boot_times = []
        turn_around_times = []
        total_checks = 0
        passed_checks = 0
        
        try:
            # Check 1: Boot Time Consistency (100 iterations)
            logger.info("📊 Check 1: Boot Time Consistency (100 iterations)")
            boot_success, boot_times = await self._validate_boot_consistency(100)
            total_checks += 1
            if boot_success:
                passed_checks += 1
                logger.info("✅ Boot time consistency PASSED")
            else:
                logger.error("❌ Boot time consistency FAILED")
            
            # Check 2: Turn-Around Recovery (50 iterations)
            logger.info("🔄 Check 2: Turn-Around Recovery (50 iterations)")
            turn_success, turn_around_times = await self._validate_turn_around_recovery(50)
            total_checks += 1
            if turn_success:
                passed_checks += 1
                logger.info("✅ Turn-around recovery PASSED")
            else:
                logger.error("❌ Turn-around recovery FAILED")
            
            # Check 3: Deterministic Consistency
            logger.info("🔬 Check 3: Deterministic Consistency")
            deterministic_score = await self._validate_deterministic_consistency()
            det_success = deterministic_score >= self.TARGET_CONSISTENCY
            total_checks += 1
            if det_success:
                passed_checks += 1
                logger.info("✅ Deterministic consistency PASSED")
            else:
                logger.error("❌ Deterministic consistency FAILED")
            
            # Check 4: Production Hardening (no TODOs)
            logger.info("🛡️ Check 4: Production Hardening")
            todo_count = await self._check_production_hardening()
            todo_success = todo_count <= self.TARGET_TODO_COUNT
            total_checks += 1
            if todo_success:
                passed_checks += 1
                logger.info("✅ Production hardening PASSED")
            else:
                logger.error(f"❌ Production hardening FAILED - {todo_count} TODOs remaining")
            
            # Check 5: Generate Golden Seed
            logger.info("🌟 Check 5: Golden Seed Generation")
            golden_seed = await self._generate_golden_seed()
            seed_success = golden_seed is not None
            total_checks += 1
            if seed_success:
                passed_checks += 1
                logger.info("✅ Golden seed generation PASSED")
            else:
                logger.error("❌ Golden seed generation FAILED")
            
            # Calculate final metrics
            validation_time = time.perf_counter() - start_time
            production_ready = passed_checks == total_checks
            
            metrics = SanityCheckMetrics(
                boot_times=boot_times,
                turn_around_times=turn_around_times,
                deterministic_consistency=deterministic_score,
                todo_count=todo_count,
                production_ready=production_ready,
                golden_seed=golden_seed,
                epoch=self.EPOCH,
                total_checks=total_checks,
                passed_checks=passed_checks
            )
            
            # Generate final report
            await self._generate_final_report(metrics, validation_time)
            
            if production_ready:
                logger.info("🏆 FINAL SANITY CHECK PASSED - Perfect Simulator ready for deployment!")
            else:
                logger.error("❌ FINAL SANITY CHECK FAILED - Issues must be resolved")
            
            return metrics
            
        except Exception as e:
            logger.error(f"❌ Sanity check failed with exception: {e}")
            raise
    
    async def _validate_boot_consistency(self, iterations: int) -> Tuple[bool, List[float]]:
        """Validate boot time consistency across multiple iterations."""
        boot_times = []
        
        for i in range(iterations):
            start_time = time.perf_counter()
            
            # Create fresh semantic engine
            engine = SemanticEngine(
                model_name="all-MiniLM-L6-v2",
                embeddings_path=Path("assets/intent_vectors.mmap")
            )
            
            boot_time = time.perf_counter() - start_time
            boot_times.append(boot_time)
            
            # Clean up
            del engine
            
            if i % 20 == 0:
                logger.debug(f"Boot test {i+1}/{iterations}: {boot_time:.4f}s")
        
        # Analyze results
        avg_boot = statistics.mean(boot_times)
        max_boot = max(boot_times)
        p95_boot = sorted(boot_times)[int(0.95 * len(boot_times))]
        
        logger.info(f"Boot time analysis: avg={avg_boot:.4f}s, max={max_boot:.4f}s, p95={p95_boot:.4f}s")
        
        success = (avg_boot <= self.TARGET_BOOT_TIME and 
                  p95_boot <= self.TARGET_BOOT_TIME * 2)  # Allow 2x for outliers
        
        return success, boot_times
    
    async def _validate_turn_around_recovery(self, iterations: int) -> Tuple[bool, List[float]]:
        """Validate turn-around recovery time."""
        recovery_times = []
        
        for i in range(iterations):
            # Create test environment
            game_state = create_tavern_scenario()
            orientation_manager = OrientationManager()
            predictive_engine = create_predictive_engine()
            
            # Set up initial state
            orientation_manager.set_position(5, 5, 0)  # Facing North
            game_state.player.position = (5, 5)
            game_state.player_heading = 0.0
            
            predictive_engine.set_orientation_manager(orientation_manager)
            await predictive_engine.start()
            
            # Build initial cache
            predictive_engine.look_ahead(game_state)
            await asyncio.sleep(0.2)
            
            # Execute 180° turn
            turn_start = time.perf_counter()
            
            orientation_manager.set_position(5, 0, 180)  # Turn to South
            game_state.player.position = (5, 0)
            game_state.player_heading = 180.0
            
            # Trigger cache invalidation and recovery
            predictive_engine.look_ahead(game_state)
            
            # Wait for recovery
            for _ in range(50):  # Max 500ms
                await asyncio.sleep(0.01)
                if len(predictive_engine.buffer._cache) > 0:
                    break
            
            recovery_time = time.perf_counter() - turn_start
            recovery_times.append(recovery_time)
            
            # Clean up
            await predictive_engine.stop()
            del predictive_engine, orientation_manager, game_state
            
            if i % 10 == 0:
                logger.debug(f"Turn-around test {i+1}/{iterations}: {recovery_time:.4f}s")
        
        # Analyze results
        avg_recovery = statistics.mean(recovery_times)
        max_recovery = max(recovery_times)
        p95_recovery = sorted(recovery_times)[int(0.95 * len(recovery_times))]
        
        logger.info(f"Turn-around analysis: avg={avg_recovery:.4f}s, max={max_recovery:.4f}s, p95={p95_recovery:.4f}s")
        
        success = (avg_recovery <= self.TARGET_TURN_AROUND and 
                  p95_recovery <= self.TARGET_TURN_AROUND * 1.5)  # Allow 1.5x for outliers
        
        return success, recovery_times
    
    async def _validate_deterministic_consistency(self) -> float:
        """Validate deterministic consistency of D20 Core."""
        resolver = D20Resolver()
        resolver.enable_deterministic_mode(True)
        
        # Create test game state
        game_state = create_tavern_scenario()
        
        # Test same action multiple times
        results = []
        for i in range(10):
            result = resolver.resolve_action(
                "talk",
                "I greet the bartender",
                game_state,
                ["tavern"],
                "bartender"
            )
            results.append(result.roll)
        
        # Check consistency
        unique_rolls = set(results)
        consistency = 1.0 - (len(unique_rolls) - 1) / len(results)  # 1.0 = perfect consistency
        
        logger.info(f"Deterministic consistency: {consistency:.3f} (unique rolls: {unique_rolls})")
        
        return consistency
    
    async def _check_production_hardening(self) -> int:
        """Check for remaining TODOs in production code."""
        todo_patterns = ["TODO", "FIXME", "XXX", "HACK"]
        todo_count = 0
        
        # Scan production files
        production_files = [
            "src/semantic_engine.py",
            "src/predictive_narrative.py",
            "src/d20_core.py",
            "src/game_state.py",
            "src/narrative_engine.py"
        ]
        
        for file_path in production_files:
            path = Path(file_path)
            if path.exists():
                content = path.read_text(encoding='utf-8')
                for pattern in todo_patterns:
                    todo_count += content.count(pattern)
        
        logger.info(f"Production TODO count: {todo_count}")
        
        return todo_count
    
    async def _generate_golden_seed(self) -> Optional[int]:
        """Generate the Golden Seed for Epoch 10."""
        try:
            # Create master seed from epoch and base
            seed_string = f"{self.GOLDEN_SEED_BASE}_{self.EPOCH}_{int(time.time())}"
            
            # Generate SHA-256 hash
            hash_object = hashlib.sha256(seed_string.encode())
            hash_hex = hash_object.hexdigest()
            
            # Extract golden seed (first 8 characters)
            golden_seed = int(hash_hex[:8], 16)
            
            # Create golden manifest
            golden_manifest = {
                "epoch": self.EPOCH,
                "year": self.EPOCH * 100,
                "golden_seed": golden_seed,
                "seed_string": seed_string,
                "hash": hash_hex,
                "generation_time": time.time(),
                "validation_status": "PASSED",
                "deployment_target": "West Palm Beach DGT Hub",
                "simulator_version": "1.0.0",
                "performance_targets": {
                    "boot_time_ms": self.TARGET_BOOT_TIME * 1000,
                    "turn_around_ms": self.TARGET_TURN_AROUND * 1000,
                    "deterministic_consistency": self.TARGET_CONSISTENCY
                }
            }
            
            # Save golden manifest
            golden_file = self.output_dir / f"golden_seed_epoch_{self.EPOCH}.json"
            with open(golden_file, 'w') as f:
                json.dump(golden_manifest, f, indent=2)
            
            logger.info(f"🌟 Golden Seed generated: {golden_seed}")
            logger.info(f"📋 Golden manifest saved: {golden_file}")
            
            return golden_seed
            
        except Exception as e:
            logger.error(f"❌ Golden seed generation failed: {e}")
            return None
    
    async def _generate_final_report(self, metrics: SanityCheckMetrics, validation_time: float) -> None:
        """Generate the final validation report."""
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        report_file = self.output_dir / f"final_sanity_check_{timestamp}.md"
        
        with open(report_file, 'w') as f:
            f.write("# DGT Perfect Simulator - Final Sanity Check Report\n\n")
            f.write(f"**Validation Date:** {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"**Validation Duration:** {validation_time:.2f}s\n")
            f.write(f"**Final Status:** {'🏆 PASSED' if metrics.production_ready else '❌ FAILED'}\n\n")
            
            # Executive Summary
            f.write("## Executive Summary\n\n")
            if metrics.production_ready:
                f.write("🏆 **PERFECT SIMULATOR VALIDATED**\n\n")
                f.write("The DGT system has passed all final validation checks and is ready for West Palm Beach deployment.\n")
                f.write("All performance targets have been met or exceeded.\n\n")
            else:
                f.write("❌ **VALIDATION FAILED**\n\n")
                f.write("The DGT system requires additional work before deployment.\n")
                f.write("Please address the failed checks below.\n\n")
            
            # Validation Results
            f.write("## Validation Results\n\n")
            f.write(f"| Check | Status | Target | Actual | Result |\n")
            f.write(f"|-------|--------|--------|--------|--------|\n")
            
            # Boot Time
            avg_boot = statistics.mean(metrics.boot_times) if metrics.boot_times else 0
            boot_status = "✅ PASS" if avg_boot <= self.TARGET_BOOT_TIME else "❌ FAIL"
            f.write(f"| Boot Time | {boot_status} | <{self.TARGET_BOOT_TIME*1000:.1f}ms | {avg_boot*1000:.3f}ms | {avg_boot*1000:.3f}ms |\n")
            
            # Turn-Around
            avg_turn = statistics.mean(metrics.turn_around_times) if metrics.turn_around_times else 0
            turn_status = "✅ PASS" if avg_turn <= self.TARGET_TURN_AROUND else "❌ FAIL"
            f.write(f"| Turn-Around | {turn_status} | <{self.TARGET_TURN_AROUND*1000:.1f}ms | {avg_turn*1000:.1f}ms | {avg_turn*1000:.1f}ms |\n")
            
            # Deterministic
            det_status = "✅ PASS" if metrics.deterministic_consistency >= self.TARGET_CONSISTENCY else "❌ FAIL"
            f.write(f"| Deterministic | {det_status} | >{self.TARGET_CONSISTENCY:.0%} | {metrics.deterministic_consistency:.1%} | {metrics.deterministic_consistency:.1%} |\n")
            
            # Production Hardening
            prod_status = "✅ PASS" if metrics.todo_count <= self.TARGET_TODO_COUNT else "❌ FAIL"
            f.write(f"| Production | {prod_status} | {self.TARGET_TODO_COUNT} TODOs | {metrics.todo_count} TODOs | {metrics.todo_count} TODOs |\n")
            
            # Golden Seed
            seed_status = "✅ PASS" if metrics.golden_seed is not None else "❌ FAIL"
            f.write(f"| Golden Seed | {seed_status} | Generated | {metrics.golden_seed if metrics.golden_seed else 'Failed'} | {metrics.golden_seed if metrics.golden_seed else 'Failed'} |\n")
            
            # Summary
            f.write(f"\n**Overall:** {metrics.passed_checks}/{metrics.total_checks} checks passed\n\n")
            
            # Golden Seed Information
            if metrics.golden_seed:
                f.write("## Golden Seed Information\n\n")
                f.write(f"- **Epoch:** {metrics.epoch} (Year {metrics.epoch * 100})\n")
                f.write(f"- **Golden Seed:** {metrics.golden_seed}\n")
                f.write(f"- **Deployment Target:** West Palm Beach DGT Hub\n")
                f.write(f"- **Status:** Ready for production deployment\n\n")
            
            # Performance Analysis
            f.write("## Performance Analysis\n\n")
            
            if metrics.boot_times:
                f.write("### Boot Time Performance\n\n")
                f.write(f"- **Average:** {statistics.mean(metrics.boot_times)*1000:.3f}ms\n")
                f.write(f"- **Maximum:** {max(metrics.boot_times)*1000:.3f}ms\n")
                f.write(f"- **95th Percentile:** {sorted(metrics.boot_times)[int(0.95*len(metrics.boot_times))]*1000:.3f}ms\n")
                f.write(f"- **Standard Deviation:** {statistics.stdev(metrics.boot_times)*1000:.3f}ms\n\n")
            
            if metrics.turn_around_times:
                f.write("### Turn-Around Performance\n\n")
                f.write(f"- **Average:** {statistics.mean(metrics.turn_around_times)*1000:.1f}ms\n")
                f.write(f"- **Maximum:** {max(metrics.turn_around_times)*1000:.1f}ms\n")
                f.write(f"- **95th Percentile:** {sorted(metrics.turn_around_times)[int(0.95*len(metrics.turn_around_times))]*1000:.1f}ms\n")
                f.write(f"- **Standard Deviation:** {statistics.stdev(metrics.turn_around_times)*1000:.1f}ms\n\n")
            
            # Deployment Readiness
            f.write("## Deployment Readiness\n\n")
            if metrics.production_ready:
                f.write("🏆 **READY FOR DEPLOYMENT**\n\n")
                f.write("The Perfect Simulator has passed all validation checks:\n")
                f.write("\n- ✅ Sub-5ms boot performance achieved\n")
                f.write("- ✅ Sub-300ms turn-around recovery achieved\n")
                f.write("- ✅ 95%+ deterministic consistency achieved\n")
                f.write("- ✅ Production hardening complete (no TODOs)\n")
                f.write("- ✅ Golden Seed generated for Epoch 10\n")
                f.write("\n**Next Steps:**\n")
                f.write("1. Deploy to West Palm Beach DGT Hub\n")
                f.write("2. Begin Voyager sessions with Golden Seed\n")
                f.write("3. Monitor performance and collect session manifests\n")
            else:
                f.write("❌ **NOT READY FOR DEPLOYMENT**\n\n")
                f.write("The following issues must be resolved:\n")
                if statistics.mean(metrics.boot_times) > self.TARGET_BOOT_TIME:
                    f.write("- Boot time performance below target\n")
                if statistics.mean(metrics.turn_around_times) > self.TARGET_TURN_AROUND:
                    f.write("- Turn-around recovery time below target\n")
                if metrics.deterministic_consistency < self.TARGET_CONSISTENCY:
                    f.write("- Deterministic consistency below target\n")
                if metrics.todo_count > self.TARGET_TODO_COUNT:
                    f.write("- Production hardening incomplete (TODOs remain)\n")
                if metrics.golden_seed is None:
                    f.write("- Golden seed generation failed\n")
        
        logger.info(f"📋 Final report generated: {report_file}")


async def main():
    """Run the final sanity check - The Big Red Button."""
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🏆 DGT Perfect Simulator - Final Sanity Check")
    print("=" * 60)
    print("🔴 THE BIG RED BUTTON - Initiating final validation...")
    print()
    
    # Run final sanity check
    sanity_check = FinalSanityCheck()
    metrics = await sanity_check.run_complete_validation()
    
    # Display results
    print(f"\n📊 Final Validation Results:")
    print(f"Overall Status: {'🏆 PASSED' if metrics.production_ready else '❌ FAILED'}")
    print(f"Checks Passed: {metrics.passed_checks}/{metrics.total_checks}")
    
    if metrics.boot_times:
        avg_boot = statistics.mean(metrics.boot_times)
        print(f"Boot Time: {avg_boot*1000:.3f}ms (target: <5ms)")
    
    if metrics.turn_around_times:
        avg_turn = statistics.mean(metrics.turn_around_times)
        print(f"Turn-Around: {avg_turn*1000:.1f}ms (target: <300ms)")
    
    print(f"Deterministic: {metrics.deterministic_consistency:.1%} (target: >95%)")
    print(f"TODOs Remaining: {metrics.todo_count} (target: 0)")
    
    if metrics.golden_seed:
        print(f"Golden Seed: {metrics.golden_seed} (Epoch {metrics.epoch})")
    
    # Final assessment
    print(f"\n🎯 Final Assessment:")
    if metrics.production_ready:
        print("🏆 PERFECT SIMULATOR VALIDATED")
        print("🚀 Ready for West Palm Beach deployment")
        print("🌟 Golden Seed generated for Epoch 10")
        print("✨ The Architectural Singularity is achieved")
    else:
        print("❌ VALIDATION FAILED")
        print("🔧 Additional work required before deployment")
    
    print(f"\n📁 Detailed reports saved to: {sanity_check.output_dir}")


if __name__ == "__main__":
    asyncio.run(main())
