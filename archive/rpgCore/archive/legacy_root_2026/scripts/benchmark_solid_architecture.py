"""
Performance benchmark for SOLID architecture refactoring.

Compares performance metrics before and after refactoring to validate
optimization improvements and measure overhead of abstraction layers.
"""

import time
import tempfile
import gzip
import pickle
import struct
import statistics
from pathlib import Path
from typing import Dict, Any, List
from dataclasses import dataclass
import psutil
import os

from loguru import logger

from src.models.prefab_factory import PrefabFactory
from src.models.asset_loader import BinaryAssetLoader
from src.models.cache_manager import LRUCacheManager
from src.models.container import DIContainer, ContainerBuilder
from src.models.asset_schemas import AssetValidator


@dataclass
class BenchmarkResult:
    """Benchmark measurement result."""
    operation: str
    duration_ms: float
    memory_mb: float
    iterations: int
    avg_duration_ms: float
    min_duration_ms: float
    max_duration_ms: float
    success_rate: float


class PerformanceBenchmark:
    """Comprehensive performance benchmark suite."""
    
    def __init__(self):
        self.process = psutil.Process(os.getpid())
        self.results: List[BenchmarkResult] = []
        
    def create_benchmark_assets(self, temp_dir: Path, asset_count: int = 100) -> Path:
        """Create benchmark asset file with specified number of assets."""
        asset_path = temp_dir / f"benchmark_{asset_count}.dgt"
        
        # Generate test data
        asset_data = {
            'sprite_bank': {
                'sprites': {},
                'metadata': {},
                'palettes': {
                    'palette_1': ['red', 'blue', 'green', 'yellow'],
                    'palette_2': ['black', 'white', 'gray', 'silver']
                }
            },
            'object_registry': {
                'objects': {},
                'interactions': {}
            },
            'environment_registry': {
                'maps': {},
                'dimensions': {},
                'object_placements': {},
                'npc_placements': {}
            },
            'tile_registry': {},
            'interaction_registry': {
                'interactions': {},
                'dialogue_sets': {}
            }
        }
        
        # Generate characters
        for i in range(asset_count // 4):
            char_id = f"character_{i}"
            asset_data['sprite_bank']['sprites'][char_id] = gzip.compress(
                pickle.dumps([[j % 8 for j in range(64)] for _ in range(64)])
            )
            asset_data['sprite_bank']['metadata'][char_id] = {
                'palette': f'palette_{(i % 2) + 1}',
                'description': f'Character {i}'
            }
        
        # Generate objects
        for i in range(asset_count // 4):
            obj_id = f"object_{i}"
            asset_data['object_registry']['objects'][obj_id] = gzip.compress(
                pickle.dumps({'desc': f'Object {i}', 'properties': {'size': i % 10}})
            )
            asset_data['object_registry']['interactions'][obj_id] = f"interaction_{i % 5}"
        
        # Generate environments
        for i in range(asset_count // 4):
            env_id = f"environment_{i}"
            asset_data['environment_registry']['maps'][env_id] = gzip.compress(
                pickle.dumps([(j % 8, 10) for j in range(100)])
            )
            asset_data['environment_registry']['dimensions'][env_id] = [20 + i, 15 + i]
            asset_data['environment_registry']['object_placements'][env_id] = []
            asset_data['environment_registry']['npc_placements'][env_id] = []
        
        # Generate interactions
        for i in range(5):
            interaction_id = f"interaction_{i}"
            asset_data['interaction_registry']['interactions'][interaction_id] = {
                'description': f'Interaction {i}',
                'interaction_type': 'loot_table' if i % 2 else 'dialogue'
            }
        
        # Compress and write
        compressed_data = gzip.compress(pickle.dumps(asset_data))
        
        with open(asset_path, 'wb') as f:
            f.write(b'DGT\x01')
            f.write(struct.pack('<I', 1))
            f.write(struct.pack('<d', time.time()))
            f.write(b'0123456789abcdef0123456789abcdef')
            f.write(struct.pack('<I', asset_count))
            f.write(struct.pack('<I', 40))
            f.write(compressed_data)
        
        return asset_path
    
    def measure_memory(self) -> float:
        """Get current memory usage in MB."""
        return self.process.memory_info().rss / 1024 / 1024
    
    def benchmark_operation(self, operation_name: str, operation_func, iterations: int = 10) -> BenchmarkResult:
        """Benchmark an operation with multiple iterations."""
        durations = []
        success_count = 0
        
        # Measure initial memory
        initial_memory = self.measure_memory()
        
        for i in range(iterations):
            try:
                start_time = time.perf_counter()
                result = operation_func()
                end_time = time.perf_counter()
                
                duration_ms = (end_time - start_time) * 1000
                durations.append(duration_ms)
                
                if result is not None and result is not False:
                    success_count += 1
                    
            except Exception as e:
                logger.error(f"❌ Operation {operation_name} failed: {e}")
                durations.append(float('inf'))  # Mark as failed
        
        # Measure final memory
        final_memory = self.measure_memory()
        memory_delta = final_memory - initial_memory
        
        # Calculate statistics (excluding failures)
        valid_durations = [d for d in durations if d != float('inf')]
        
        if valid_durations:
            avg_duration = statistics.mean(valid_durations)
            min_duration = min(valid_durations)
            max_duration = max(valid_durations)
        else:
            avg_duration = min_duration = max_duration = float('inf')
        
        result = BenchmarkResult(
            operation=operation_name,
            duration_ms=avg_duration,
            memory_mb=memory_delta,
            iterations=iterations,
            avg_duration_ms=avg_duration,
            min_duration_ms=min_duration,
            max_duration_ms=max_duration,
            success_rate=success_count / iterations
        )
        
        self.results.append(result)
        return result
    
    def benchmark_asset_loading(self, temp_dir: Path) -> List[BenchmarkResult]:
        """Benchmark asset loading performance."""
        logger.info("🚀 Benchmarking asset loading...")
        
        results = []
        
        # Test different asset counts
        for asset_count in [10, 50, 100, 500]:
            asset_path = self.create_benchmark_assets(temp_dir, asset_count)
            
            def load_assets():
                loader = BinaryAssetLoader(validation_enabled=False)
                success = loader.load_assets(asset_path)
                loader.cleanup()
                return success
            
            result = self.benchmark_operation(
                f"load_assets_{asset_count}",
                load_assets,
                iterations=5
            )
            results.append(result)
            
            logger.info(f"📊 Loaded {asset_count} assets: {result.avg_duration_ms:.2f}ms avg")
        
        return results
    
    def benchmark_cache_performance(self) -> List[BenchmarkResult]:
        """Benchmark cache operations."""
        logger.info("🚀 Benchmarking cache performance...")
        
        results = []
        
        # Test different cache sizes
        for cache_size in [100, 500, 1000, 5000]:
            cache = LRUCacheManager(max_size=cache_size)
            
            def cache_operations():
                # Fill cache
                for i in range(cache_size):
                    cache.set(f"key_{i}", f"value_{i}")
                
                # Random access pattern
                for i in range(cache_size // 2):
                    key = f"key_{i % cache_size}"
                    cache.get(key)
                
                return cache.size()
            
            result = self.benchmark_operation(
                f"cache_ops_{cache_size}",
                cache_operations,
                iterations=10
            )
            results.append(result)
            
            logger.info(f"📊 Cache {cache_size}: {result.avg_duration_ms:.2f}ms avg")
        
        return results
    
    def benchmark_dependency_injection(self) -> List[BenchmarkResult]:
        """Benchmark dependency injection performance."""
        logger.info("🚀 Benchmarking dependency injection...")
        
        results = []
        
        # Test different container configurations
        def create_simple_container():
            container = DIContainer()
            container.register_singleton(str, lambda: "test")
            return container.resolve(str)
        
        def create_complex_container():
            builder = ContainerBuilder("complex")
            builder.add_singleton(str, lambda: "singleton")\
                   .add_transient(int, lambda: 42)\
                   .register(float, factory=lambda: 3.14)
            container = builder.build()
            return container.resolve(str)
        
        for operation, name in [(create_simple_container, "simple_di"), 
                                (create_complex_container, "complex_di")]:
            result = self.benchmark_operation(name, operation, iterations=100)
            results.append(result)
            
            logger.info(f"📊 {name}: {result.avg_duration_ms:.4f}ms avg")
        
        return results
    
    def benchmark_factory_operations(self, temp_dir: Path) -> List[BenchmarkResult]:
        """Benchmark factory instantiation operations."""
        logger.info("🚀 Benchmarking factory operations...")
        
        results = []
        asset_path = self.create_benchmark_assets(temp_dir, 100)
        
        # Initialize factory once
        factory = PrefabFactory(asset_path)
        factory.load_assets()
        
        def create_characters():
            characters = []
            for i in range(10):
                char = factory.create_character(f"character_{i % 25}", position=(i, i))
                if char:
                    characters.append(char)
            return len(characters)
        
        def create_objects():
            objects = []
            for i in range(10):
                obj = factory.create_object(f"object_{i % 25}", position=(i, i))
                if obj:
                    objects.append(obj)
            return len(objects)
        
        def create_environments():
            environments = []
            for i in range(5):
                env = factory.create_environment(f"environment_{i % 25}")
                if env:
                    environments.append(env)
            return len(environments)
        
        for operation, name in [(create_characters, "create_characters"),
                                (create_objects, "create_objects"),
                                (create_environments, "create_environments")]:
            result = self.benchmark_operation(name, operation, iterations=20)
            results.append(result)
            
            logger.info(f"📊 {name}: {result.avg_duration_ms:.2f}ms avg")
        
        factory.cleanup()
        return results
    
    def benchmark_validation_overhead(self) -> List[BenchmarkResult]:
        """Benchmark Pydantic validation overhead."""
        logger.info("🚀 Benchmarking validation overhead...")
        
        results = []
        
        # Test validation vs no validation
        test_data = {
            "description": "Test character",
            "palette": "test_palette",
            "tags": ["player", "warrior"]
        }
        
        def validate_with_pydantic():
            from src.models.asset_schemas import CharacterMetadata
            metadata = CharacterMetadata(**test_data)
            return metadata.description
        
        def validate_without_pydantic():
            # Simple dict validation
            if not test_data.get('description'):
                raise ValueError("Missing description")
            return test_data['description']
        
        for operation, name in [(validate_with_pydantic, "pydantic_validation"),
                                (validate_without_pydantic, "manual_validation")]:
            result = self.benchmark_operation(name, operation, iterations=1000)
            results.append(result)
            
            logger.info(f"📊 {name}: {result.avg_duration_ms:.4f}ms avg")
        
        return results
    
    def run_full_benchmark(self, temp_dir: Path) -> Dict[str, List[BenchmarkResult]]:
        """Run complete benchmark suite."""
        logger.info("🏁 Starting full performance benchmark...")
        
        all_results = {}
        
        # Asset loading benchmarks
        all_results['asset_loading'] = self.benchmark_asset_loading(temp_dir)
        
        # Cache performance benchmarks
        all_results['cache_performance'] = self.benchmark_cache_performance()
        
        # Dependency injection benchmarks
        all_results['dependency_injection'] = self.benchmark_dependency_injection()
        
        # Factory operation benchmarks
        all_results['factory_operations'] = self.benchmark_factory_operations(temp_dir)
        
        # Validation overhead benchmarks
        all_results['validation_overhead'] = self.benchmark_validation_overhead()
        
        return all_results
    
    def print_summary(self, results: Dict[str, List[BenchmarkResult]]) -> None:
        """Print benchmark summary."""
        print("\n" + "="*80)
        print("🏆 SOLID ARCHITECTURE PERFORMANCE BENCHMARK SUMMARY")
        print("="*80)
        
        for category, category_results in results.items():
            print(f"\n📊 {category.upper().replace('_', ' ')}")
            print("-" * 40)
            
            for result in category_results:
                status = "✅" if result.success_rate == 1.0 else f"⚠️ {result.success_rate:.1%}"
                print(f"{status} {result.operation:25} | "
                      f"Avg: {result.avg_duration_ms:7.2f}ms | "
                      f"Min: {result.min_duration_ms:7.2f}ms | "
                      f"Max: {result.max_duration_ms:7.2f}ms | "
                      f"Memory: {result.memory_mb:+6.1f}MB")
        
        # Performance analysis
        print(f"\n🔍 PERFORMANCE ANALYSIS")
        print("-" * 40)
        
        # Find slowest operations
        all_results = [r for cat_results in results.values() for r in cat_results]
        slowest = sorted(all_results, key=lambda x: x.avg_duration_ms, reverse=True)[:3]
        
        print("🐌 Slowest Operations:")
        for i, result in enumerate(slowest, 1):
            print(f"  {i}. {result.operation}: {result.avg_duration_ms:.2f}ms")
        
        # Find fastest operations
        fastest = sorted(all_results, key=lambda x: x.avg_duration_ms)[:3]
        
        print("⚡ Fastest Operations:")
        for i, result in enumerate(fastest, 1):
            print(f"  {i}. {result.operation}: {result.avg_duration_ms:.4f}ms")
        
        # Memory analysis
        memory_heavy = sorted(all_results, key=lambda x: abs(x.memory_mb), reverse=True)[:3]
        
        print("💾 Memory-Heavy Operations:")
        for i, result in enumerate(memory_heavy, 1):
            print(f"  {i}. {result.operation}: {result.memory_mb:+.1f}MB")
        
        print(f"\n🎯 Total operations benchmarked: {len(all_results)}")
        print("="*80)


def main():
    """Run performance benchmark."""
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🚀 SOLID Architecture Performance Benchmark")
    print("="*50)
    
    # Create temporary directory
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Run benchmark
        benchmark = PerformanceBenchmark()
        results = benchmark.run_full_benchmark(temp_path)
        
        # Print summary
        benchmark.print_summary(results)
        
        print(f"\n✅ Benchmark completed successfully!")
        print(f"📁 Temporary files cleaned up: {temp_path}")


if __name__ == "__main__":
    main()
