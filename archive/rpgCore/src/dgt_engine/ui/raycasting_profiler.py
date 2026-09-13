"""
Performance Profiling for Raycasting System

Provides profiling and optimization analysis for the raycasting engine.
Identifies bottlenecks and suggests performance improvements.
"""

import time
import cProfile
import pstats
import io
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from contextlib import contextmanager

from loguru import logger

from .raycasting_engine import RayCaster
from .character_renderer import CharacterRenderer
from .raycasting_types import Ray3D, HitResult


@dataclass
class ProfileResult:
    """Result of a performance profiling session."""
    name: str
    total_time: float
    call_count: int
    avg_time: float
    min_time: float
    max_time: float
    details: Dict[str, Any]


class RaycastingProfiler:
    """
    Performance profiler for raycasting operations.
    
    Provides detailed timing analysis and bottleneck identification.
    """

    def __init__(self):
        """Initialize the profiler."""
        self.results: List[ProfileResult] = []
        self.current_session: Optional[str] = None
        self.session_times: Dict[str, List[float]] = {}
        
        logger.debug("RaycastingProfiler initialized")

    @contextmanager
    def profile_session(self, session_name: str):
        """
        Context manager for profiling a session.
        
        Args:
            session_name: Name of the profiling session
        """
        start_time = time.perf_counter()
        self.current_session = session_name
        
        if session_name not in self.session_times:
            self.session_times[session_name] = []
        
        try:
            yield
        finally:
            end_time = time.perf_counter()
            duration = end_time - start_time
            self.session_times[session_name].append(duration)
            self.current_session = None
            
            logger.debug(f"Profile session '{session_name}' completed in {duration:.4f}s")

    def profile_raycasting_performance(
        self, 
        ray_caster: RayCaster,
        character_renderer: CharacterRenderer,
        num_rays: int = 1000,
        max_distance: float = 20.0
    ) -> Dict[str, ProfileResult]:
        """
        Profile complete raycasting performance.
        
        Args:
            ray_caster: The RayCaster instance to profile
            character_renderer: The CharacterRenderer instance to profile
            num_rays: Number of rays to cast for testing
            max_distance: Maximum ray distance
            
        Returns:
            Dictionary of profile results
        """
        logger.info(f"Starting raycasting performance profile with {num_rays} rays")
        
        results = {}
        
        # Profile ray casting
        with self.profile_session("ray_casting"):
            for i in range(num_rays):
                angle = (i / num_rays) * 360  # Full circle
                ray = Ray3D(0, 0, angle, max_distance)
                # Note: This would need a mock game state in real usage
                # ray_caster.cast_ray(ray, mock_game_state)
        
        # Profile character rendering
        with self.profile_session("character_rendering"):
            for i in range(num_rays):
                # Create mock hit result
                from .raycasting_types import HitResult, Coordinate
                hit = HitResult(
                    hit=True,
                    distance=float(i % max_distance),
                    height=1.0,
                    content="wall",
                    coordinate=Coordinate(i % 10, i % 10, 0),
                    entity_id=None
                )
                character_renderer.get_character(hit)
        
        # Compile results
        for session_name, times in self.session_times.items():
            if times:
                results[session_name] = ProfileResult(
                    name=session_name,
                    total_time=sum(times),
                    call_count=len(times),
                    avg_time=sum(times) / len(times),
                    min_time=min(times),
                    max_time=max(times),
                    details={
                        "rays_per_second": num_rays / sum(times) if sum(times) > 0 else 0,
                        "total_rays": num_rays
                    }
                )
        
        return results

    def profile_with_cprofile(
        self, 
        func, 
        *args, 
        **kwargs
    ) -> Dict[str, Any]:
        """
        Profile a function using cProfile for detailed analysis.
        
        Args:
            func: Function to profile
            *args: Function arguments
            **kwargs: Function keyword arguments
            
        Returns:
            Detailed profiling results
        """
        profiler = cProfile.Profile()
        profiler.enable()
        
        try:
            result = func(*args, **kwargs)
        finally:
            profiler.disable()
        
        # Create stats object
        s = io.StringIO()
        ps = pstats.Stats(profiler, stream=s).sort_stats('cumulative')
        ps.print_stats()
        
        # Parse results
        stats_text = s.getvalue()
        lines = stats_text.split('\n')
        
        # Extract key metrics
        total_calls = 0
        total_time = 0.0
        
        for line in lines:
            if 'function calls' in line.lower():
                try:
                    parts = line.split()
                    if len(parts) >= 4:
                        total_calls = int(parts[0].replace(',', ''))
                        total_time = float(parts[5])
                except (ValueError, IndexError):
                    pass
                break
        
        return {
            'result': result,
            'total_calls': total_calls,
            'total_time': total_time,
            'stats_text': stats_text
        }

    def analyze_bottlenecks(self, results: Dict[str, ProfileResult]) -> Dict[str, Any]:
        """
        Analyze profiling results to identify bottlenecks.
        
        Args:
            results: Profile results to analyze
            
        Returns:
            Bottleneck analysis and recommendations
        """
        if not results:
            return {"analysis": "No results to analyze", "recommendations": []}
        
        # Find slowest operations
        sorted_results = sorted(results.values(), key=lambda x: x.total_time, reverse=True)
        slowest = sorted_results[0] if sorted_results else None
        
        # Calculate total time
        total_time = sum(r.total_time for r in results.values())
        
        # Generate recommendations
        recommendations = []
        
        for result in results.values():
            percentage = (result.total_time / total_time) * 100 if total_time > 0 else 0
            
            if percentage > 50:
                recommendations.append(
                    f"{result.name} takes {percentage:.1f}% of total time - consider optimization"
                )
            
            if result.avg_time > 0.001:  # 1ms threshold
                recommendations.append(
                    f"{result.name} has high average time ({result.avg_time:.4f}s) - investigate algorithm"
                )
            
            if result.max_time > result.avg_time * 5:
                recommendations.append(
                    f"{result.name} has high variance (max: {result.max_time:.4f}s, avg: {result.avg_time:.4f}s) - check for edge cases"
                )
        
        return {
            "analysis": {
                "total_time": total_time,
                "slowest_operation": slowest.name if slowest else None,
                "operation_count": len(results)
            },
            "recommendations": recommendations,
            "detailed_results": results
        }

    def benchmark_raycasting_algorithms(
        self, 
        ray_caster: RayCaster,
        test_scenarios: List[Dict[str, Any]]
    ) -> Dict[str, ProfileResult]:
        """
        Benchmark different raycasting scenarios.
        
        Args:
            ray_caster: RayCaster instance to test
            test_scenarios: List of test scenarios with different parameters
            
        Returns:
            Benchmark results for each scenario
        """
        benchmark_results = {}
        
        for i, scenario in enumerate(test_scenarios):
            scenario_name = scenario.get('name', f'scenario_{i}')
            num_rays = scenario.get('num_rays', 100)
            max_distance = scenario.get('max_distance', 20.0)
            
            logger.info(f"Benchmarking scenario: {scenario_name}")
            
            with self.profile_session(f"benchmark_{scenario_name}"):
                for j in range(num_rays):
                    angle = (j / num_rays) * 360
                    ray = Ray3D(0, 0, angle, max_distance)
                    # Note: Would need mock game state in real usage
                    # ray_caster.cast_ray(ray, mock_game_state)
            
            # Get the timing result
            times = self.session_times.get(f"benchmark_{scenario_name}", [])
            if times:
                benchmark_results[scenario_name] = ProfileResult(
                    name=scenario_name,
                    total_time=sum(times),
                    call_count=len(times),
                    avg_time=sum(times) / len(times),
                    min_time=min(times),
                    max_time=max(times),
                    details=scenario
                )
        
        return benchmark_results

    def generate_performance_report(self, results: Dict[str, ProfileResult]) -> str:
        """
        Generate a human-readable performance report.
        
        Args:
            results: Profile results to report on
            
        Returns:
            Formatted performance report
        """
        if not results:
            return "No performance data available."
        
        report = []
        report.append("=== RAYCASTING PERFORMANCE REPORT ===\n")
        
        # Summary
        total_time = sum(r.total_time for r in results.values())
        total_calls = sum(r.call_count for r in results.values())
        
        report.append(f"Total execution time: {total_time:.4f}s")
        report.append(f"Total operations: {total_calls:,}")
        report.append(f"Overall average: {total_time / total_calls:.6f}s per operation\n")
        
        # Detailed results
        report.append("=== DETAILED RESULTS ===")
        sorted_results = sorted(results.values(), key=lambda x: x.total_time, reverse=True)
        
        for result in sorted_results:
            percentage = (result.total_time / total_time) * 100 if total_time > 0 else 0
            report.append(f"\n{result.name}:")
            report.append(f"  Total time: {result.total_time:.4f}s ({percentage:.1f}%)")
            report.append(f"  Calls: {result.call_count:,}")
            report.append(f"  Average: {result.avg_time:.6f}s")
            report.append(f"  Range: {result.min_time:.6f}s - {result.max_time:.6f}s")
            
            # Add specific details if available
            if 'rays_per_second' in result.details:
                report.append(f"  Rays/sec: {result.details['rays_per_second']:.0f}")
        
        # Recommendations
        analysis = self.analyze_bottlenecks(results)
        if analysis['recommendations']:
            report.append("\n=== OPTIMIZATION RECOMMENDATIONS ===")
            for rec in analysis['recommendations']:
                report.append(f"• {rec}")
        
        return '\n'.join(report)

    def clear_results(self) -> None:
        """Clear all profiling results."""
        self.results.clear()
        self.session_times.clear()
        logger.debug("Profiling results cleared")

    def export_results(self, filename: str) -> None:
        """
        Export profiling results to a file.
        
        Args:
            filename: File to export results to
        """
        try:
            with open(filename, 'w') as f:
                report = self.generate_performance_report(dict(
                    (r.name, r) for r in self.results
                ))
                f.write(report)
            logger.info(f"Profiling results exported to {filename}")
        except Exception as e:
            logger.error(f"Failed to export results: {e}")


# Convenience function for quick profiling
def quick_profile_raycasting(
    ray_caster: RayCaster,
    character_renderer: CharacterRenderer,
    num_rays: int = 1000
) -> str:
    """
    Quick profiling function for raycasting performance.
    
    Args:
        ray_caster: RayCaster to profile
        character_renderer: CharacterRenderer to profile
        num_rays: Number of rays to test
        
    Returns:
        Performance report as string
    """
    profiler = RaycastingProfiler()
    results = profiler.profile_raycasting_performance(
        ray_caster, character_renderer, num_rays
    )
    return profiler.generate_performance_report(results)


# Export for use by other modules
__all__ = [
    "RaycastingProfiler", 
    "ProfileResult", 
    "quick_profile_raycasting"
]
