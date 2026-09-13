"""
Three-Tier Production Validation Suite - Wave 3 Hardening
Final validation of the DGT Platform Three-Tier Architecture
Validates all production readiness criteria and performance metrics for Miyoo Mini deployment
"""

import sys
import time
import psutil
import json
import hashlib
from pathlib import Path
from typing import Dict, List, Any
from dataclasses import dataclass

# Add src directory to Python path
src_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(src_path))

from loguru import logger


@dataclass
class ValidationResult:
    """Result of a validation check."""
    check_name: str
    passed: bool
    details: str
    metrics: Dict[str, Any] = None
    timestamp: str = ""


class ThreeTierProductionValidator:
    """
    Three-Tier Architecture production validation suite.
    
    Validates that the DGT Platform meets all production
    readiness criteria for Miyoo Mini deployment.
    """
    
    def __init__(self):
        self.results: List[ValidationResult] = []
        self.process = psutil.Process()
        
    def run_all_validations(self) -> Dict[str, Any]:
        """Run complete Three-Tier production validation suite."""
        logger.info("🔍 Starting Three-Tier Production Validation Suite")
        
        # Three-Tier Architecture validations
        self.validate_three_tier_structure()
        self.validate_import_compliance()
        self.validate_system_clock_performance()
        
        # Performance validations
        self.validate_boot_performance()
        self.validate_memory_footprint()
        self.validate_miyoo_battery_optimization()
        
        # Production readiness
        self.validate_asset_pipeline()
        self.validate_cinematic_engine()
        self.validate_theater_mode()
        
        # Generate final report
        return self.generate_validation_report()
    
    def validate_three_tier_structure(self) -> None:
        """Validate Three-Tier Architecture structure."""
        logger.info("🏛️ Validating Three-Tier Structure")
        
        try:
            # Check Tier 1 Foundation
            foundation_files = [
                "src/dgt_engine/foundation/constants.py",
                "src/dgt_engine/foundation/types.py", 
                "src/dgt_engine/foundation/system_clock.py",
                "src/dgt_engine/foundation/assets/ml/intent_vectors.safetensors"
            ]
            
            foundation_complete = all((src_path.parent / f).exists() for f in foundation_files)
            
            # Check Tier 2 Engines
            engine_files = [
                "src/dgt_engine/systems/body/cinematics/movie_engine.py",
                "src/dgt_engine/systems/body/pipeline/asset_loader.py",
                "src/dgt_engine/systems/mind/neat_config.txt"
            ]
            
            engines_complete = all((src_path.parent / f).exists() for f in engine_files)
            
            # Check Tier 3 Applications
            app_files = [
                "src/apps/space/scenarios/premiere_voyage.json"
            ]
            
            apps_complete = all((src_path.parent / f).exists() for f in app_files)
            
            passed = foundation_complete and engines_complete and apps_complete
            
            self.results.append(ValidationResult(
                check_name="Three-Tier Structure",
                passed=passed,
                details=f"T1: {foundation_complete}, T2: {engines_complete}, T3: {apps_complete}",
                metrics={
                    "tier_1_complete": foundation_complete,
                    "tier_2_complete": engines_complete,
                    "tier_3_complete": apps_complete,
                    "total_tiers_complete": sum([foundation_complete, engines_complete, apps_complete])
                }
            ))
            
        except Exception as e:
            self.results.append(ValidationResult(
                check_name="Three-Tier Structure",
                passed=False,
                details=f"Error: {str(e)}"
            ))
    
    def validate_import_compliance(self) -> None:
        """Validate import compliance across tiers."""
        logger.info("⚖️ Validating Import Compliance")
        
        try:
            import sys
            sys.path.insert(0, str(src_path))
            
            # Test Tier 1 imports (should work independently)
            try:
                from dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
                from dgt_engine.foundation.types import Result, ValidationResult as EngineValidationResult
                from dgt_engine.foundation.system_clock import SystemClock
                
                tier1_imports_work = True
                logger.info("✅ Tier 1 imports working")
            except ImportError as e:
                tier1_imports_work = False
                logger.error(f"❌ Tier 1 import failed: {e}")
            
            # Test Tier 2 imports (can import from Tier 1)
            try:
                from dgt_engine.systems.body.cinematics.movie_engine import MovieEngine
                from dgt_engine.systems.body.pipeline.asset_loader import AssetLoader
                
                tier2_imports_work = True
                logger.info("✅ Tier 2 imports working")
            except ImportError as e:
                tier2_imports_work = False
                logger.error(f"❌ Tier 2 import failed: {e}")
            
            # Test Tier 3 access (can access all tiers)
            try:
                scenario_path = src_path.parent / "src/apps/space/scenarios/premiere_voyage.json"
                tier3_access_works = scenario_path.exists()
                logger.info("✅ Tier 3 scenario accessible" if tier3_access_works else "⚠️ Tier 3 scenario not found")
            except Exception as e:
                tier3_access_works = False
                logger.error(f"❌ Tier 3 access failed: {e}")
            
            passed = tier1_imports_work and tier2_imports_work and tier3_access_works
            
            self.results.append(ValidationResult(
                check_name="Import Compliance",
                passed=passed,
                details=f"T1: {tier1_imports_work}, T2: {tier2_imports_work}, T3: {tier3_access_works}",
                metrics={
                    "tier_1_imports": tier1_imports_work,
                    "tier_2_imports": tier2_imports_work,
                    "tier_3_access": tier3_access_works,
                    "sovereign_constraints": SOVEREIGN_WIDTH == 160 and SOVEREIGN_HEIGHT == 144
                }
            ))
            
        except Exception as e:
            self.results.append(ValidationResult(
                check_name="Import Compliance",
                passed=False,
                details=f"Error: {str(e)}"
            ))
    
    def validate_system_clock_performance(self) -> None:
        """Validate SystemClock performance for Miyoo Mini."""
        logger.info("⏰ Validating SystemClock Performance")
        
        try:
            import sys
            sys.path.insert(0, str(src_path))
            
            from dgt_engine.foundation.system_clock import SystemClock
            
            # Test SystemClock creation and configuration
            clock = SystemClock(target_fps=60.0, max_cpu_usage=80.0)
            
            # Test clock metrics
            metrics = clock.get_metrics()
            
            # Start clock for health check
            clock.set_frame_callback(lambda: None)
            clock.start()
            time.sleep(0.1)  # specific wait to let it establish metrics
            
            # Test health check
            is_healthy = clock.is_healthy()
            
            clock.stop()
            
            # Test battery optimization
            battery_result = clock.adjust_for_battery(0.3)  # 30% battery
            battery_optimized = battery_result.success
            
            passed = (clock.max_cpu_usage == 80.0 and 
                     is_healthy and 
                     battery_optimized)
            
            self.results.append(ValidationResult(
                check_name="SystemClock Performance",
                passed=passed,
                details=f"Target FPS: {clock.target_fps}, Healthy: {is_healthy}, Battery optimized: {battery_optimized}",
                metrics={
                    "target_fps": clock.target_fps,
                    "max_cpu_usage": clock.max_cpu_usage,
                    "actual_fps": metrics.actual_fps,
                    "is_healthy": is_healthy,
                    "battery_optimization_works": battery_optimized
                }
            ))
            
        except Exception as e:
            self.results.append(ValidationResult(
                check_name="SystemClock Performance",
                passed=False,
                details=f"Error: {str(e)}"
            ))
    
    def validate_boot_performance(self) -> None:
        """Validate boot performance targets."""
        logger.info("⚡ Validating Boot Performance")
        
        try:
            # Measure import time for Three-Tier components
            start_time = time.time()
            
            import sys
            sys.path.insert(0, str(src_path))
            
            # Import Tier 1
            from dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
            from dgt_engine.foundation.types import Result
            from dgt_engine.foundation.system_clock import SystemClock
            
            # Import Tier 2
            from dgt_engine.systems.body.cinematics.movie_engine import MovieEngine
            from dgt_engine.systems.body.pipeline.asset_loader import AssetLoader
            
            import_time = (time.time() - start_time) * 1000
            
            # Measure initialization time
            start_time = time.time()
            
            # Initialize components
            clock = SystemClock(target_fps=60.0)
            movie_engine = MovieEngine(seed="BOOT_TEST")
            asset_loader = AssetLoader()
            
            init_time = (time.time() - start_time) * 1000
            
            # Check targets (optimized for Miyoo Mini)
            boot_time_ok = import_time < 5000 and init_time < 1000  # 5s import, 1s init
            
            self.results.append(ValidationResult(
                check_name="Boot Performance",
                passed=boot_time_ok,
                details=f"Import: {import_time:.2f}ms, Init: {init_time:.2f}ms",
                metrics={
                    "import_time_ms": import_time,
                    "init_time_ms": init_time,
                    "total_boot_time_ms": import_time + init_time,
                    "target_import_ms": 5000,
                    "target_init_ms": 1000
                }
            ))
            
        except Exception as e:
            self.results.append(ValidationResult(
                check_name="Boot Performance",
                passed=False,
                details=f"Error: {str(e)}"
            ))
    
    def validate_memory_footprint(self) -> None:
        """Validate memory footprint targets."""
        logger.info("💾 Validating Memory Footprint")
        
        try:
            # Get baseline memory
            baseline_memory = self.process.memory_info().rss / 1024 / 1024  # MB
            
            # Import and initialize Three-Tier components
            import sys
            sys.path.insert(0, str(src_path))
            
            from dgt_engine.foundation.system_clock import SystemClock
            from dgt_engine.systems.body.cinematics.movie_engine import MovieEngine
            from dgt_engine.systems.body.pipeline.asset_loader import AssetLoader
            
            # Initialize components
            clock = SystemClock(target_fps=60.0)
            movie_engine = MovieEngine(seed="MEMORY_TEST")
            asset_loader = AssetLoader()
            
            # Get loaded memory
            loaded_memory = self.process.memory_info().rss / 1024 / 1024  # MB
            memory_increase = loaded_memory - baseline_memory
            
            # Check target (optimized for Miyoo Mini - <100MB)
            memory_ok = memory_increase < 100
            
            self.results.append(ValidationResult(
                check_name="Memory Footprint",
                passed=memory_ok,
                details=f"Memory increase: {memory_increase:.2f}MB",
                metrics={
                    "baseline_memory_mb": baseline_memory,
                    "loaded_memory_mb": loaded_memory,
                    "memory_increase_mb": memory_increase,
                    "target_increase_mb": 100
                }
            ))
            
        except Exception as e:
            self.results.append(ValidationResult(
                check_name="Memory Footprint",
                passed=False,
                details=f"Error: {str(e)}"
            ))
    
    def validate_miyoo_battery_optimization(self) -> None:
        """Validate Miyoo Mini battery optimization features."""
        logger.info("🔋 Validating Miyoo Battery Optimization")
        
        try:
            import sys
            sys.path.insert(0, str(src_path))
            
            from dgt_engine.foundation.system_clock import SystemClock
            from dgt_engine.systems.body.cinematics.movie_engine import MovieEngine
            
            # Test battery optimization at different levels
            clock = SystemClock(target_fps=60.0)
            
            battery_tests = []
            
            # Test at 100% battery
            result_100 = clock.adjust_for_battery(1.0)
            battery_tests.append(("100%", result_100.success, clock.target_fps))
            
            # Test at 50% battery
            result_50 = clock.adjust_for_battery(0.5)
            battery_tests.append(("50%", result_50.success, clock.target_fps))
            
            # Test at 20% battery
            result_20 = clock.adjust_for_battery(0.2)
            battery_tests.append(("20%", result_20.success, clock.target_fps))
            
            # Test at 10% battery
            result_10 = clock.adjust_for_battery(0.1)
            battery_tests.append(("10%", result_10.success, clock.target_fps))
            
            # Check that FPS scales down with battery
            fps_100 = battery_tests[0][2]
            fps_20 = battery_tests[2][2]
            fps_scales_correctly = fps_20 < fps_100
            
            all_tests_passed = all(test[1] for test in battery_tests)
            
            passed = all_tests_passed and fps_scales_correctly
            
            self.results.append(ValidationResult(
                check_name="Miyoo Battery Optimization",
                passed=passed,
                details=f"Battery tests passed: {all_tests_passed}, FPS scaling: {fps_scales_correctly}",
                metrics={
                    "battery_tests": [
                        {"level": level, "passed": passed, "fps": fps}
                        for level, passed, fps in battery_tests
                    ],
                    "fps_scales_correctly": fps_scales_correctly,
                    "all_tests_passed": all_tests_passed
                }
            ))
            
        except Exception as e:
            self.results.append(ValidationResult(
                check_name="Miyoo Battery Optimization",
                passed=False,
                details=f"Error: {str(e)}"
            ))
    
    def validate_asset_pipeline(self) -> None:
        """Validate Asset Pipeline implementation."""
        logger.info("🗂️ Validating Asset Pipeline")
        
        try:
            import sys
            sys.path.insert(0, str(src_path))
            
            from dgt_engine.systems.body.pipeline.asset_loader import AssetLoader
            from dgt_engine.systems.body.pipeline.building_registry import BuildingRegistry
            
            # Test AssetLoader creation
            asset_loader = AssetLoader()
            
            # Test BuildingRegistry creation
            building_registry = BuildingRegistry(asset_loader)
            
            # Test building loading
            load_result = building_registry.load_all_buildings()
            buildings_loaded = load_result.success
            
            # Test statistics
            if buildings_loaded:
                stats = building_registry.get_statistics()
                total_buildings = stats.get('total_buildings', 0)
            else:
                total_buildings = 0
            
            passed = asset_loader is not None and building_registry is not None and buildings_loaded
            
            self.results.append(ValidationResult(
                check_name="Asset Pipeline",
                passed=passed,
                details=f"AssetLoader: ✅, BuildingRegistry: ✅, Buildings loaded: {buildings_loaded}",
                metrics={
                    "asset_loader_created": asset_loader is not None,
                    "building_registry_created": building_registry is not None,
                    "buildings_loaded": buildings_loaded,
                    "total_buildings": total_buildings
                }
            ))
            
        except Exception as e:
            self.results.append(ValidationResult(
                check_name="Asset Pipeline",
                passed=False,
                details=f"Error: {str(e)}"
            ))
    
    def validate_cinematic_engine(self) -> None:
        """Validate Cinematic Engine implementation."""
        logger.info("🎬 Validating Cinematic Engine")
        
        try:
            import sys
            sys.path.insert(0, str(src_path))
            
            from dgt_engine.systems.body.cinematics.movie_engine import MovieEngine
            
            # Test MovieEngine creation with SystemClock
            movie_engine = MovieEngine(seed="CINEMATIC_TEST", target_fps=60.0)
            
            # Test sequence creation
            sequence_result = movie_engine.create_forest_gate_sequence()
            sequence_created = sequence_result.success
            
            # Test sequence start
            if sequence_created:
                start_result = movie_engine.start_sequence(sequence_result.value)
                sequence_started = start_result.success
                
                # Test event processing
                if sequence_started:
                    event_result = movie_engine.advance_to_next_event()
                    event_processed = event_result.success
                    
                    # Stop sequence
                    movie_engine.stop_sequence()
                else:
                    event_processed = False
            else:
                sequence_started = False
                event_processed = False
            
            passed = (movie_engine is not None and 
                     sequence_created and 
                     sequence_started and 
                     event_processed)
            
            self.results.append(ValidationResult(
                check_name="Cinematic Engine",
                passed=passed,
                details=f"Engine: ✅, Sequence: {sequence_created}, Events: {event_processed}",
                metrics={
                    "engine_created": movie_engine is not None,
                    "sequence_created": sequence_created,
                    "sequence_started": sequence_started,
                    "event_processed": event_processed,
                    "system_clock_integrated": movie_engine.system_clock is not None
                }
            ))
            
        except Exception as e:
            self.results.append(ValidationResult(
                check_name="Cinematic Engine",
                passed=False,
                details=f"Error: {str(e)}"
            ))
    
    def validate_theater_mode(self) -> None:
        """Validate Theater Mode integration."""
        logger.info("🎭 Validating Theater Mode")
        
        try:
            # Run the theater mode test script
            test_script_path = src_path.parent / "tests" / "test_theater_mode.py"
            
            if not test_script_path.exists():
                self.results.append(ValidationResult(
                    check_name="Theater Mode",
                    passed=False,
                    details="test_theater_mode.py not found"
                ))
                return
            
            # Execute test script and capture output
            import subprocess
            result = subprocess.run([
                sys.executable, str(test_script_path)
            ], capture_output=True, text=True, cwd=src_path.parent, timeout=30)
            
            # Check if test passed
            test_passed = result.returncode == 0
            
            # Look for success indicators in output
            output_indicators = [
                "All Wave 2 tests passed" in result.stdout,
                "Three-Tier Architecture compliance verified" in result.stdout,
                "Theater Mode Test Complete" in result.stdout
            ]
            
            success_indicators = sum(output_indicators)
            
            passed = test_passed and success_indicators >= 2
            
            self.results.append(ValidationResult(
                check_name="Theater Mode",
                passed=passed,
                details=f"Test passed: {test_passed}, Success indicators: {success_indicators}/3",
                metrics={
                    "test_script_exists": True,
                    "test_return_code": result.returncode,
                    "success_indicators": success_indicators,
                    "output_length": len(result.stdout)
                }
            ))
            
        except subprocess.TimeoutExpired:
            self.results.append(ValidationResult(
                check_name="Theater Mode",
                passed=False,
                details="Test script timed out"
            ))
        except Exception as e:
            self.results.append(ValidationResult(
                check_name="Theater Mode",
                passed=False,
                details=f"Error: {str(e)}"
            ))
    
    def generate_validation_report(self) -> Dict[str, Any]:
        """Generate comprehensive Three-Tier validation report."""
        logger.info("📊 Generating Three-Tier Validation Report")
        
        # Calculate overall status
        total_checks = len(self.results)
        passed_checks = sum(1 for r in self.results if r.passed)
        success_rate = passed_checks / total_checks if total_checks > 0 else 0
        
        # Categorize results
        categories = {
            "architecture": [r for r in self.results if any(keyword in r.check_name for keyword in ["Structure", "Import", "SystemClock"])],
            "performance": [r for r in self.results if any(keyword in r.check_name for keyword in ["Boot", "Memory", "Battery"])],
            "production": [r for r in self.results if any(keyword in r.check_name for keyword in ["Asset", "Cinematic", "Theater"])]
        }
        
        # Generate summary
        summary = {
            "validation_timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "wave": "3_production_hardening",
            "architecture": "three_tier",
            "total_checks": total_checks,
            "passed_checks": passed_checks,
            "failed_checks": total_checks - passed_checks,
            "success_rate": success_rate,
            "production_ready": success_rate >= 0.9,  # 90% pass rate for Three-Tier
            "miyoo_mini_ready": success_rate >= 0.85,  # 85% for Miyoo Mini
            "categories": {
                name: {
                    "total": len(checks),
                    "passed": sum(1 for c in checks if c.passed),
                    "failed": sum(1 for c in checks if not c.passed)
                }
                for name, checks in categories.items()
            },
            "detailed_results": [
                {
                    "check_name": r.check_name,
                    "passed": r.passed,
                    "details": r.details,
                    "metrics": r.metrics
                }
                for r in self.results
            ]
        }
        
        # Save report
        report_path = Path("THREE_TIER_PRODUCTION_VALIDATION_REPORT.json")
        with open(report_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        logger.info(f"📄 Three-Tier validation report saved to {report_path}")
        
        return summary


def main():
    """Main Three-Tier validation execution."""
    # Configure logging
    logger.remove()
    logger.add(
        "three_tier_production_validation.log",
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}",
        rotation="10 MB"
    )
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🔍 DGT Platform - Three-Tier Production Validation")
    print("=" * 60)
    print("Wave 3: Production Hardening for Miyoo Mini deployment")
    print()
    
    try:
        # Run validation
        validator = ThreeTierProductionValidator()
        report = validator.run_all_validations()
        
        # Display results
        print(f"📊 Three-Tier Validation Results:")
        print(f"   Architecture: {report['architecture']}")
        print(f"   Wave: {report['wave']}")
        print(f"   Total checks: {report['total_checks']}")
        print(f"   Passed: {report['passed_checks']}")
        print(f"   Failed: {report['failed_checks']}")
        print(f"   Success rate: {report['success_rate']:.1%}")
        print()
        
        # Category breakdown
        for category, stats in report['categories'].items():
            status = "✅" if stats['failed'] == 0 else "⚠️" if stats['passed'] > stats['failed'] else "❌"
            print(f"{status} {category.title()}: {stats['passed']}/{stats['total']} passed")
        
        print()
        
        # Final verdict
        if report['production_ready']:
            print("🏆 THREE-TIER PRODUCTION READY!")
            print("🚀 System ready for deployment")
            if report['miyoo_mini_ready']:
                print("🎮 Miyoo Mini optimized and ready!")
        else:
            print("⚠️  NOT PRODUCTION READY - Issues found")
            print("🔧 Review failed checks before deployment")
        
        print()
        print("📄 Detailed report saved to: THREE_TIER_PRODUCTION_VALIDATION_REPORT.json")
        
        return 0 if report['production_ready'] else 1
        
    except Exception as e:
        logger.error(f"❌ Three-Tier validation failed: {e}")
        print(f"❌ Error: {e}")
        return 1


if __name__ == "__main__":
    exit(main())
