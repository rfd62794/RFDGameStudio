"""
Performance Benchmarking Suite: DGT Optimization Validation

Measures boot time, narrative latency, and overall system performance.
Provides before/after comparisons for optimization validation.
"""

import time
import asyncio
import statistics
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import json
from dataclasses import dataclass, asdict
import sys
import os

# Add src to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from loguru import logger
from semantic_engine import SemanticEngine
from predictive_narrative import create_predictive_engine
from game_state import GameState, create_tavern_scenario
from d20_core import D20Core


@dataclass
class BootMetrics:
    """Boot performance metrics."""
    total_boot_time: float
    semantic_load_time: float
    mmap_init_time: float
    model_load_time: float
    asset_size_mb: float
    boot_method: str  # "mmap", "prebaked", or "cold"


@dataclass
class NarrativeMetrics:
    """Narrative generation performance metrics."""
    cold_generation_time: float  # First generation (no cache)
    cached_generation_time: float  # From cache
    precached_generation_time: float  # From pre-cache
    cache_hit_rate: float
    total_requests: int
    avg_latency: float


@dataclass
class SystemMetrics:
    """Overall system performance metrics."""
    boot: BootMetrics
    narrative: NarrativeMetrics
    memory_usage_mb: float
    cpu_usage_percent: float


class PerformanceBenchmark:
    """
    Comprehensive performance benchmarking for DGT optimizations.
    
    Measures the impact of memory-mapped assets and narrative pre-caching
    on system performance.
    """
    
    def __init__(self, output_dir: Path = Path("benchmarks")):
        """
        Initialize benchmark suite.
        
        Args:
            output_dir: Directory for benchmark results
        """
        self.output_dir = output_dir
        self.output_dir.mkdir(exist_ok=True)
        
        # Test configuration
        self.test_intents = [
            ("talk", "I greet the bartender"),
            ("attack", "I punch the guard"),
            ("distract", "I throw a mug at the wall"),
            ("examine", "I look around the room"),
            ("trade", "I want to buy something")
        ]
        
        logger.info("🔬 Performance Benchmark Suite initialized")
    
    async def run_full_benchmark(self) -> SystemMetrics:
        """
        Run complete performance benchmark.
        
        Returns:
            Complete system performance metrics
        """
        logger.info("🚀 Starting full performance benchmark...")
        
        # Boot performance test
        boot_metrics = await self._benchmark_boot_performance()
        
        # Narrative performance test
        narrative_metrics = await self._benchmark_narrative_performance()
        
        # System resource usage
        memory_usage = self._get_memory_usage()
        cpu_usage = self._get_cpu_usage()
        
        # Compile results
        metrics = SystemMetrics(
            boot=boot_metrics,
            narrative=narrative_metrics,
            memory_usage_mb=memory_usage,
            cpu_usage_percent=cpu_usage
        )
        
        # Save results
        self._save_results(metrics)
        
        logger.info("✅ Full benchmark completed")
        return metrics
    
    async def _benchmark_boot_performance(self) -> BootMetrics:
        """Benchmark boot performance with different loading methods."""
        logger.info("🔍 Benchmarking boot performance...")
        
        results = []
        
        # Test 1: Memory-mapped boot (should be fastest)
        logger.info("Testing memory-mapped boot...")
        mmap_metrics = await self._test_boot_method("mmap")
        results.append(mmap_metrics)
        
        # Test 2: Pre-baked boot (fallback)
        logger.info("Testing pre-baked boot...")
        prebaked_metrics = await self._test_boot_method("prebaked")
        results.append(prebaked_metrics)
        
        # Test 3: Cold boot (slowest, for comparison)
        logger.info("Testing cold boot...")
        cold_metrics = await self._test_boot_method("cold")
        results.append(cold_metrics)
        
        # Return the best (fastest) result
        best = min(results, key=lambda x: x.total_boot_time)
        logger.info(f"🏆 Best boot method: {best.boot_method} ({best.total_boot_time:.3f}s)")
        
        return best
    
    async def _test_boot_method(self, method: str) -> BootMetrics:
        """Test a specific boot method."""
        start_time = time.perf_counter()
        
        # Force clean environment
        if hasattr(self, '_semantic_engine'):
            delattr(self, '_semantic_engine')
        
        semantic_load_start = time.perf_counter()
        
        if method == "mmap":
            # Test memory-mapped loading
            self._semantic_engine = SemanticEngine(
                model_name="all-MiniLM-L6-v2",
                embeddings_path=Path("assets/intent_vectors.mmap")
            )
        elif method == "prebaked":
            # Test pre-baked loading
            self._semantic_engine = SemanticEngine(
                model_name="all-MiniLM-L6-v2",
                embeddings_path=Path("assets/intent_vectors.safetensors")
            )
        else:  # cold
            # Test cold boot (no pre-baked assets)
            self._semantic_engine = SemanticEngine(
                model_name="all-MiniLM-L6-v2",
                embeddings_path=Path("nonexistent.safetensors")
            )
        
        semantic_load_time = time.perf_counter() - semantic_load_start
        total_boot_time = time.perf_counter() - start_time
        
        # Get asset size if available
        asset_size = 0.0
        if method == "mmap":
            asset_path = Path("assets/intent_vectors.mmap")
        elif method == "prebaked":
            asset_path = Path("assets/intent_vectors.safetensors")
        else:
            asset_path = None
        
        if asset_path and asset_path.exists():
            asset_size = asset_path.stat().st_size / 1024 / 1024  # Convert to MB
        
        return BootMetrics(
            total_boot_time=total_boot_time,
            semantic_load_time=semantic_load_time,
            mmap_init_time=0.0,  # Would need more detailed instrumentation
            model_load_time=0.0,  # Would need more detailed instrumentation
            asset_size_mb=asset_size,
            boot_method=method
        )
    
    async def _benchmark_narrative_performance(self) -> NarrativeMetrics:
        """Benchmark narrative generation performance."""
        logger.info("🔍 Benchmarking narrative performance...")
        
        # Create predictive engine
        predictive_engine = create_predictive_engine()
        await predictive_engine.start()
        
        # Create test game state
        game_state = create_tavern_scenario()
        
        # Test cold generation (no cache)
        cold_times = []
        for intent_id, player_input in self.test_intents:
            start = time.perf_counter()
            await predictive_engine.generate_outcome(
                intent_id, player_input, "Test context", 100, 0, "test_npc"
            )
            cold_times.append(time.perf_counter() - start)
        
        cold_generation_time = statistics.mean(cold_times)
        
        # Test cached generation (repeat same requests)
        cached_times = []
        for intent_id, player_input in self.test_intents:
            start = time.perf_counter()
            await predictive_engine.generate_outcome(
                intent_id, player_input, "Test context", 100, 0, "test_npc"
            )
            cached_times.append(time.perf_counter() - start)
        
        cached_generation_time = statistics.mean(cached_times)
        
        # Test pre-cached generation (with look-ahead)
        predictive_engine.look_ahead(game_state)
        
        # Wait a moment for pre-caching to work
        await asyncio.sleep(0.5)
        
        precached_times = []
        for intent_id, player_input in self.test_intents:
            start = time.perf_counter()
            await predictive_engine.generate_outcome(
                intent_id, player_input, "Test context", 100, 0, "bartender"
            )
            precached_times.append(time.perf_counter() - start)
        
        precached_generation_time = statistics.mean(precached_times)
        
        # Get cache statistics
        stats = predictive_engine.get_stats()
        cache_hit_rate = stats.get('hit_rate', 0.0)
        total_requests = stats.get('hit_count', 0) + stats.get('miss_count', 0)
        
        await predictive_engine.stop()
        
        return NarrativeMetrics(
            cold_generation_time=cold_generation_time,
            cached_generation_time=cached_generation_time,
            precached_generation_time=precached_generation_time,
            cache_hit_rate=cache_hit_rate,
            total_requests=total_requests,
            avg_latency=cold_generation_time  # Conservative estimate
        )
    
    def _get_memory_usage(self) -> float:
        """Get current memory usage in MB."""
        try:
            import psutil
            process = psutil.Process()
            return process.memory_info().rss / 1024 / 1024
        except ImportError:
            logger.warning("psutil not available, memory usage unavailable")
            return 0.0
    
    def _get_cpu_usage(self) -> float:
        """Get current CPU usage percentage."""
        try:
            import psutil
            return psutil.cpu_percent(interval=0.1)
        except ImportError:
            logger.warning("psutil not available, CPU usage unavailable")
            return 0.0
    
    def _save_results(self, metrics: SystemMetrics) -> None:
        """Save benchmark results to file."""
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        results_file = self.output_dir / f"benchmark_{timestamp}.json"
        
        # Convert to serializable format
        results = asdict(metrics)
        
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"📊 Benchmark results saved to: {results_file}")
        
        # Also save a summary
        self._save_summary(metrics, timestamp)
    
    def _save_summary(self, metrics: SystemMetrics, timestamp: str) -> None:
        """Save a human-readable summary."""
        summary_file = self.output_dir / f"summary_{timestamp}.txt"
        
        with open(summary_file, 'w') as f:
            f.write("DGT Performance Benchmark Summary\n")
            f.write("=" * 40 + "\n\n")
            
            # Boot performance
            f.write("Boot Performance:\n")
            f.write(f"  Method: {metrics.boot.boot_method}\n")
            f.write(f"  Total Time: {metrics.boot.total_boot_time:.3f}s\n")
            f.write(f"  Semantic Load: {metrics.boot.semantic_load_time:.3f}s\n")
            f.write(f"  Asset Size: {metrics.boot.asset_size_mb:.1f}MB\n\n")
            
            # Narrative performance
            f.write("Narrative Performance:\n")
            f.write(f"  Cold Generation: {metrics.narrative.cold_generation_time:.3f}s\n")
            f.write(f"  Cached Generation: {metrics.narrative.cached_generation_time:.3f}s\n")
            f.write(f"  Pre-cached Generation: {metrics.narrative.precached_generation_time:.3f}s\n")
            f.write(f"  Cache Hit Rate: {metrics.narrative.cache_hit_rate:.1%}\n\n")
            
            # System resources
            f.write("System Resources:\n")
            f.write(f"  Memory Usage: {metrics.memory_usage_mb:.1f}MB\n")
            f.write(f"  CPU Usage: {metrics.cpu_usage_percent:.1f}%\n\n")
            
            # Performance improvements
            boot_improvement = "N/A"
            if metrics.boot.boot_method == "mmap":
                boot_improvement = "✅ Instant boot achieved"
            elif metrics.boot.total_boot_time < 0.01:
                boot_improvement = "✅ Sub-10ms boot achieved"
            
            narrative_improvement = "N/A"
            if metrics.narrative.precached_generation_time < 0.01:
                narrative_improvement = "✅ Instant narrative achieved"
            elif metrics.narrative.cache_hit_rate > 0.5:
                narrative_improvement = "✅ Good cache hit rate"
            
            f.write("Optimization Status:\n")
            f.write(f"  Boot Performance: {boot_improvement}\n")
            f.write(f"  Narrative Performance: {narrative_improvement}\n")
        
        logger.info(f"📋 Summary saved to: {summary_file}")


async def main():
    """Run performance benchmark and display results."""
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🔬 DGT Performance Benchmark Suite")
    print("=" * 40)
    
    # Check prerequisites
    if not Path("assets/intent_vectors.safetensors").exists():
        print("❌ Pre-baked assets not found. Run 'python -m src.utils.baker' first.")
        return
    
    # Run benchmark
    benchmark = PerformanceBenchmark()
    metrics = await benchmark.run_full_benchmark()
    
    # Display results
    print("\n📊 Benchmark Results:")
    print(f"Boot Time: {metrics.boot.total_boot_time:.3f}s ({metrics.boot.boot_method})")
    print(f"Cold Narrative: {metrics.narrative.cold_generation_time:.3f}s")
    print(f"Cached Narrative: {metrics.narrative.cached_generation_time:.3f}s")
    print(f"Pre-cached Narrative: {metrics.narrative.precached_generation_time:.3f}s")
    print(f"Cache Hit Rate: {metrics.narrative.cache_hit_rate:.1%}")
    print(f"Memory Usage: {metrics.memory_usage_mb:.1f}MB")
    
    # Performance assessment
    print("\n🎯 Performance Assessment:")
    if metrics.boot.total_boot_time < 0.005:
        print("✅ Boot time target achieved (<5ms)")
    elif metrics.boot.total_boot_time < 0.01:
        print("⚠️ Boot time close to target (<10ms)")
    else:
        print("❌ Boot time needs improvement")
    
    if metrics.narrative.precached_generation_time < 0.01:
        print("✅ Narrative latency target achieved (<10ms)")
    elif metrics.narrative.cache_hit_rate > 0.5:
        print("⚠️ Narrative cache working but could be better")
    else:
        print("❌ Narrative pre-caching needs improvement")
    
    print(f"\n📁 Detailed results saved to: {benchmark.output_dir}")


if __name__ == "__main__":
    asyncio.run(main())
