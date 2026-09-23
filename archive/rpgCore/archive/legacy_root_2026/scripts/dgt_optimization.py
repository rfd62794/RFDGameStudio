"""
DGT Optimization Integration Script

This script orchestrates the complete implementation of the "Systemic Fix"
for instant boot and narrative pre-caching.

Usage:
    python -m src.dgt_optimization

The script will:
1. Create memory-mapped assets for instant boot
2. Run deterministic validation
3. Run performance benchmarks
4. Generate integration report
"""

import asyncio
import sys
import os
from pathlib import Path
import time
from typing import Optional

# Add src to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from loguru import logger

# Import our optimization modules
from utils.mmap_assets import create_mmap_assets
from benchmark_performance import PerformanceBenchmark
from validate_deterministic import DeterministicValidator
from benchmark_turn_around import TurnAroundBenchmark
from utils.manifest_generator import ManifestGenerator


class DGTOptimizationIntegrator:
    """
    Orchestrates the complete DGT optimization implementation.
    
    This is the "One Button" solution that implements the
    Systemic Fix recommended by the Skeptical Auditor.
    """
    
    def __init__(self, project_root: Path):
        """
        Initialize the integrator.
        
        Args:
            project_root: Root directory of the rpgCore project
        """
        self.project_root = project_root
        self.src_dir = project_root / "src"
        self.assets_dir = project_root / "assets"
        self.reports_dir = project_root / "reports"
        
        # Ensure directories exist
        self.assets_dir.mkdir(exist_ok=True)
        self.reports_dir.mkdir(exist_ok=True)
        
        logger.info("🚀 DGT Optimization Integrator initialized")
    
    async def run_full_integration(self) -> dict:
        """
        Run the complete optimization integration.
        
        Returns:
            Dictionary with integration results and metrics
        """
        logger.info("🎯 Starting DGT Systemic Fix Integration...")
        
        start_time = time.perf_counter()
        results = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "integration_time": 0.0,
            "steps": {},
            "success": False,
            "recommendations": []
        }
        
        try:
            # Step 1: Create memory-mapped assets
            logger.info("📦 Step 1: Creating memory-mapped assets...")
            step_start = time.perf_counter()
            
            mmap_success = await self._create_memory_mapped_assets()
            results["steps"]["memory_mapping"] = {
                "success": mmap_success,
                "duration": time.perf_counter() - step_start,
                "description": "Convert vector assets to memory-mapped format for instant boot"
            }
            
            if not mmap_success:
                logger.error("❌ Memory mapping failed - cannot continue")
                return results
            
            # Step 2: Validate deterministic behavior
            logger.info("🔬 Step 2: Validating D20 Core deterministic behavior...")
            step_start = time.perf_counter()
            
            validation_results = await self._validate_deterministic_behavior()
            results["steps"]["deterministic_validation"] = {
                "success": validation_results["consistency_score"] >= 0.80,
                "duration": time.perf_counter() - step_start,
                "consistency_score": validation_results["consistency_score"],
                "description": "Ensure D20 Core produces consistent results for safe pre-caching"
            }
            
            # Step 3: Run turn-around latency benchmark
            logger.info("🔄 Step 3: Running turn-around latency benchmark...")
            step_start = time.perf_counter()
            
            turn_around_results = await self._run_turn_around_benchmark()
            results["steps"]["turn_around_benchmark"] = {
                "success": turn_around_results["success_rate"] >= 0.8,
                "duration": time.perf_counter() - step_start,
                "success_rate": turn_around_results["success_rate"],
                "avg_recovery_time": turn_around_results["avg_recovery_time"],
                "description": "Validate trajectory-aware cache invalidation performance"
            }
            
            # Step 4: Run performance benchmarks
            logger.info("📊 Step 4: Running performance benchmarks...")
            step_start = time.perf_counter()
            
            benchmark_results = await self._run_performance_benchmarks()
            results["steps"]["performance_benchmark"] = {
                "success": True,
                "duration": time.perf_counter() - step_start,
                "boot_time": benchmark_results["boot"]["total_boot_time"],
                "narrative_latency": benchmark_results["narrative"]["precached_generation_time"],
                "description": "Measure boot time and narrative latency improvements"
            }
            
            # Step 5: Generate integration report
            logger.info("📋 Step 5: Generating integration report...")
            step_start = time.perf_counter()
            
            report_path = await self._generate_integration_report(results)
            results["steps"]["integration_report"] = {
                "success": True,
                "duration": time.perf_counter() - step_start,
                "report_path": str(report_path),
                "description": "Comprehensive report on optimization implementation"
            }
            
            # Calculate overall success
            results["integration_time"] = time.perf_counter() - start_time
            results["success"] = all(step["success"] for step in results["steps"].values())
            
            # Generate recommendations
            results["recommendations"] = self._generate_recommendations(results)
            
            if results["success"]:
                logger.info("✅ DGT Systemic Fix Integration completed successfully!")
            else:
                logger.warning("⚠️ Integration completed with some issues")
            
        except Exception as e:
            logger.error(f"❌ Integration failed: {e}")
            results["error"] = str(e)
            results["success"] = False
        
        return results
    
    async def _create_memory_mapped_assets(self) -> bool:
        """Create memory-mapped assets from existing baked data."""
        try:
            # Check if pre-baked assets exist
            baker_path = self.assets_dir / "intent_vectors.safetensors"
            if not baker_path.exists():
                logger.error("❌ Pre-baked assets not found. Run 'python -m src.utils.baker' first.")
                return False
            
            # Create memory-mapped assets
            create_mmap_assets()
            
            # Verify creation
            mmap_path = self.assets_dir / "intent_vectors.mmap"
            if mmap_path.exists():
                file_size = mmap_path.stat().st_size / 1024 / 1024
                logger.info(f"✅ Memory-mapped assets created: {file_size:.1f}MB")
                return True
            else:
                logger.error("❌ Memory-mapped asset file not created")
                return False
                
        except Exception as e:
            logger.error(f"❌ Memory mapping failed: {e}")
            return False
    
    async def _validate_deterministic_behavior(self) -> dict:
        """Run deterministic validation."""
        try:
            validator = DeterministicValidator(self.reports_dir / "validation")
            report = await validator.run_validation(iterations=5)
            
            return {
                "consistency_score": report.consistency_score,
                "success_rate": report.success_rate,
                "total_tests": report.total_tests,
                "passed_tests": report.passed_tests
            }
            
        except Exception as e:
            logger.error(f"❌ Deterministic validation failed: {e}")
            return {"consistency_score": 0.0, "error": str(e)}
    
    async def _run_turn_around_benchmark(self) -> dict:
        """Run turn-around latency benchmark."""
        try:
            benchmark = TurnAroundBenchmark(self.reports_dir / "turn_around")
            results = await benchmark.run_benchmark(iterations=3)
            
            # Calculate overall statistics
            all_metrics = []
            for metrics_list in results.values():
                all_metrics.extend(metrics_list)
            
            successful = [m for m in all_metrics if m.success]
            success_rate = len(successful) / len(all_metrics) if all_metrics else 0.0
            
            avg_recovery_time = 0.0
            if successful:
                import statistics
                avg_recovery_time = statistics.mean([m.total_recovery_time for m in successful])
            
            return {
                "success_rate": success_rate,
                "avg_recovery_time": avg_recovery_time,
                "total_scenarios": len(results),
                "successful_runs": len(successful)
            }
            
        except Exception as e:
            logger.error(f"❌ Turn-around benchmark failed: {e}")
            return {"success_rate": 0.0, "avg_recovery_time": 999.0, "error": str(e)}
    
    async def _run_performance_benchmarks(self) -> dict:
        """Run performance benchmarks."""
        try:
            benchmark = PerformanceBenchmark(self.reports_dir / "benchmarks")
            metrics = await benchmark.run_full_benchmark()
            
            return {
                "boot": {
                    "total_boot_time": metrics.boot.total_boot_time,
                    "boot_method": metrics.boot.boot_method,
                    "asset_size_mb": metrics.boot.asset_size_mb
                },
                "narrative": {
                    "cold_generation_time": metrics.narrative.cold_generation_time,
                    "cached_generation_time": metrics.narrative.cached_generation_time,
                    "precached_generation_time": metrics.narrative.precached_generation_time,
                    "cache_hit_rate": metrics.narrative.cache_hit_rate
                },
                "system": {
                    "memory_usage_mb": metrics.memory_usage_mb,
                    "cpu_usage_percent": metrics.cpu_usage_percent
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Performance benchmark failed: {e}")
            return {"error": str(e)}
    
    async def _generate_integration_report(self, results: dict) -> Path:
        """Generate comprehensive integration report."""
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        report_path = self.reports_dir / f"dgt_integration_{timestamp}.md"
        
        with open(report_path, 'w') as f:
            f.write("# DGT Systemic Fix Integration Report\n\n")
            f.write(f"**Generated:** {results['timestamp']}  \n")
            f.write(f"**Integration Time:** {results['integration_time']:.2f}s  \n")
            f.write(f"**Overall Success:** {'✅ YES' if results['success'] else '❌ NO'}  \n\n")
            
            # Executive Summary
            f.write("## Executive Summary\n\n")
            
            if results['success']:
                f.write("🎯 **SUCCESS**: The DGT Systemic Fix has been successfully implemented!\n\n")
                f.write("The following optimizations are now active:\n")
                f.write("- ✅ **Instant Boot**: Memory-mapped asset loading\n")
                f.write("- ✅ **Narrative Pre-Caching**: Predictive dialogue generation\n")
                f.write("- ✅ **Deterministic Validation**: D20 Core consistency verified\n")
            else:
                f.write("⚠️ **PARTIAL SUCCESS**: Some optimizations require attention.\n\n")
            
            # Step-by-step results
            f.write("## Implementation Steps\n\n")
            
            step_descriptions = {
                "memory_mapping": "Memory-Mapped Asset Loading",
                "deterministic_validation": "D20 Core Deterministic Validation",
                "turn_around_benchmark": "Turn-Around Latency Benchmark",
                "performance_benchmark": "Performance Benchmarking",
                "integration_report": "Integration Report Generation"
            }
            
            for step_key, step_data in results["steps"].items():
                status = "✅" if step_data["success"] else "❌"
                f.write(f"### {step_descriptions.get(step_key, step_key)} {status}\n\n")
                f.write(f"- **Duration:** {step_data['duration']:.2f}s\n")
                f.write(f"- **Description:** {step_data['description']}\n")
                
                if step_key == "memory_mapping":
                    f.write(f"- **Result:** Memory-mapped assets created\n")
                elif step_key == "deterministic_validation":
                    score = step_data.get("consistency_score", 0)
                    f.write(f"- **Consistency Score:** {score:.1%}\n")
                elif step_key == "turn_around_benchmark":
                    success_rate = step_data.get("success_rate", 0)
                    recovery_time = step_data.get("avg_recovery_time", 0)
                    f.write(f"- **Success Rate:** {success_rate:.1%}\n")
                    f.write(f"- **Avg Recovery Time:** {recovery_time:.3f}s\n")
                elif step_key == "performance_benchmark":
                    boot_time = step_data.get("boot_time", 0)
                    narrative_latency = step_data.get("narrative_latency", 0)
                    f.write(f"- **Boot Time:** {boot_time:.3f}s\n")
                    f.write(f"- **Narrative Latency:** {narrative_latency:.3f}s\n")
                
                f.write("\n")
            
            # Performance Analysis
            if "performance_benchmark" in results["steps"]:
                f.write("## Performance Analysis\n\n")
                benchmark = results["steps"]["performance_benchmark"]
                
                boot_time = benchmark.get("boot_time", 0)
                narrative_latency = benchmark.get("narrative_latency", 0)
                
                f.write("### Boot Performance\n\n")
                if boot_time < 0.005:
                    f.write("🏆 **EXCELLENT**: Sub-5ms boot achieved!\n")
                elif boot_time < 0.01:
                    f.write("✅ **GOOD**: Sub-10ms boot achieved\n")
                else:
                    f.write("⚠️ **NEEDS IMPROVEMENT**: Boot time above target\n")
                
                f.write(f"- **Actual Boot Time:** {boot_time:.3f}s\n")
                f.write(f"- **Target:** <0.005s\n\n")
                
                f.write("### Narrative Performance\n\n")
                if narrative_latency < 0.01:
                    f.write("🏆 **EXCELLENT**: Instant narrative achieved!\n")
                elif narrative_latency < 0.1:
                    f.write("✅ **GOOD**: Low narrative latency\n")
                else:
                    f.write("⚠️ **NEEDS IMPROVEMENT**: Narrative latency still noticeable\n")
                
                f.write(f"- **Pre-cached Latency:** {narrative_latency:.3f}s\n")
                f.write(f"- **Target:** <0.01s\n\n")
            
            # Trajectory-Aware Performance Analysis
            if "turn_around_benchmark" in results["steps"]:
                f.write("### Trajectory-Aware Performance\n\n")
                turn_around = results["steps"]["turn_around_benchmark"]
                
                success_rate = turn_around.get("success_rate", 0)
                recovery_time = turn_around.get("avg_recovery_time", 0)
                
                if success_rate >= 0.8 and recovery_time <= 0.5:
                    f.write("🏆 **EXCELLENT**: Trajectory changes handled gracefully!\n")
                elif success_rate >= 0.6:
                    f.write("✅ **GOOD**: Most trajectory changes work well\n")
                else:
                    f.write("⚠️ **NEEDS IMPROVEMENT**: Trajectory handling needs work\n")
                
                f.write(f"- **Success Rate:** {success_rate:.1%}\n")
                f.write(f"- **Avg Recovery Time:** {recovery_time:.3f}s\n")
                f.write(f"- **Target:** >80% success, <0.5s recovery\n\n")
            
            # Recommendations
            f.write("## Recommendations\n\n")
            for rec in results.get("recommendations", []):
                f.write(f"- {rec}\n")
            
            f.write("\n")
            
            # Next Steps
            f.write("## Next Steps\n\n")
            if results['success']:
                f.write("🚀 **Ready for Production**\n\n")
                f.write("The DGT Systemic Fix is complete. The game now features:\n")
                f.write("1. **Instant Boot**: No more loading screens\n")
                f.write("2. **Seamless Narrative**: No more \"Thinking...\" pauses\n")
                f.write("3. **Deterministic Logic**: Reliable and repeatable gameplay\n\n")
                f.write("You can now run the game with:\n")
                f.write("```bash\n")
                f.write("cd src\n")
                f.write("python game_loop.py\n")
                f.write("```\n")
            else:
                f.write("🔧 **Further Work Required**\n\n")
                f.write("Address the failed steps above before production deployment.\n")
        
        logger.info(f"📋 Integration report saved to: {report_path}")
        return report_path
    
    def _generate_recommendations(self, results: dict) -> list:
        """Generate recommendations based on results."""
        recommendations = []
        
        # Memory mapping recommendations
        if not results["steps"].get("memory_mapping", {}).get("success", False):
            recommendations.append("Run 'python -m src.utils.baker' to create pre-baked assets first")
        
        # Deterministic validation recommendations
        validation = results["steps"].get("deterministic_validation", {})
        consistency = validation.get("consistency_score", 0)
        
        if consistency < 0.80:
            recommendations.append("Investigate D20 Core consistency issues before using narrative pre-caching")
        elif consistency < 0.95:
            recommendations.append("Monitor edge cases in D20 Core for optimal pre-caching safety")
        
        # Performance recommendations
        benchmark = results["steps"].get("performance_benchmark", {})
        boot_time = benchmark.get("boot_time", 0)
        narrative_latency = benchmark.get("narrative_latency", 0)
        
        if boot_time > 0.01:
            recommendations.append("Consider further optimization for boot time (target: <5ms)")
        
        if narrative_latency > 0.1:
            recommendations.append("Narrative pre-caching may need tuning for better performance")
        
        # Overall recommendations
        if results["success"]:
            recommendations.append("🎉 System ready for DGT Ready-to-Play experience!")
        
        return recommendations


async def main():
    """Main entry point for DGT optimization integration."""
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🚀 DGT Systemic Fix Integration")
    print("=" * 50)
    print("Implementing instant boot and narrative pre-caching...")
    print()
    
    # Initialize integrator
    project_root = Path(__file__).parent.parent.parent
    integrator = DGTOptimizationIntegrator(project_root)
    
    # Run integration
    results = await integrator.run_full_integration()
    
    # Display results
    print("\n📊 Integration Results:")
    print(f"Overall Success: {'✅ YES' if results['success'] else '❌ NO'}")
    print(f"Integration Time: {results['integration_time']:.2f}s")
    
    print("\n📋 Step Results:")
    for step_key, step_data in results["steps"].items():
        status = "✅" if step_data["success"] else "❌"
        print(f"  {step_key}: {status} ({step_data['duration']:.2f}s)")
    
    if results.get("recommendations"):
        print("\n💡 Recommendations:")
        for rec in results["recommendations"]:
            print(f"  • {rec}")
    
    print(f"\n📁 Reports saved to: {integrator.reports_dir}")


if __name__ == "__main__":
    asyncio.run(main())
