"""
D20 Core Deterministic Validation Suite

Validates that the D20 Core produces consistent, repeatable results
critical for the pre-cached narrative system to function correctly.

The "Deterministic Arbiter" ensures that identical inputs always
produce identical outputs, making narrative pre-caching safe.
"""

import random
import time
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from pathlib import Path
import json
import hashlib
import sys
import os

# Add src to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from loguru import logger
from d20_core import D20Resolver, D20Result
from game_state import GameState, create_tavern_scenario


@dataclass
class DeterministicTestCase:
    """A test case for deterministic validation."""
    test_id: str
    intent_id: str
    player_input: str
    game_state_seed: int
    expected_result_hash: Optional[str] = None
    actual_results: List[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.actual_results is None:
            self.actual_results = []


@dataclass
class ValidationReport:
    """Report on deterministic validation results."""
    total_tests: int
    passed_tests: int
    failed_tests: int
    consistency_score: float  # 0.0 to 1.0
    test_cases: List[Dict[str, Any]]
    validation_time: float
    timestamp: str
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate as percentage."""
        if self.total_tests == 0:
            return 0.0
        return (self.passed_tests / self.total_tests) * 100.0


class DeterministicValidator:
    """
    Validates deterministic behavior of the D20 Core.
    
    Critical for ensuring that pre-cached narratives remain valid
    across different game sessions and system states.
    """
    
    def __init__(self, output_dir: Path = Path("validation")):
        """
        Initialize deterministic validator.
        
        Args:
            output_dir: Directory for validation reports
        """
        self.output_dir = output_dir
        self.output_dir.mkdir(exist_ok=True)
        
        # Test scenarios
        self.test_scenarios = self._generate_test_scenarios()
        
        logger.info("🔬 Deterministic Validator initialized")
    
    def _generate_test_scenarios(self) -> List[DeterministicTestCase]:
        """Generate comprehensive test scenarios."""
        scenarios = [
            # Basic intent tests
            DeterministicTestCase(
                test_id="basic_talk",
                intent_id="talk",
                player_input="I greet the bartender",
                game_state_seed=42
            ),
            DeterministicTestCase(
                test_id="basic_attack",
                intent_id="attack",
                player_input="I punch the guard",
                game_state_seed=42
            ),
            DeterministicTestCase(
                test_id="basic_distract",
                intent_id="distract",
                player_input="I throw a mug at the wall",
                game_state_seed=42
            ),
            
            # Edge case tests
            DeterministicTestCase(
                test_id="critical_hit",
                intent_id="attack",
                player_input="I attack with all my might",
                game_state_seed=20  # Seed that might produce natural 20
            ),
            DeterministicTestCase(
                test_id="critical_fumble",
                intent_id="attack",
                player_input="I attack clumsily",
                game_state_seed=1  # Seed that might produce natural 1
            ),
            
            # State variation tests
            DeterministicTestCase(
                test_id="low_hp_talk",
                intent_id="talk",
                player_input="I need help",
                game_state_seed=42
            ),
            DeterministicTestCase(
                test_id="high_reputation_trade",
                intent_id="trade",
                player_input="I want to buy something",
                game_state_seed=42
            ),
            
            # Consistency tests (same input, different seeds)
            DeterministicTestCase(
                test_id="consistency_talk_1",
                intent_id="talk",
                player_input="Hello there",
                game_state_seed=100
            ),
            DeterministicTestCase(
                test_id="consistency_talk_2",
                intent_id="talk",
                player_input="Hello there",
                game_state_seed=200
            ),
            DeterministicTestCase(
                test_id="consistency_talk_3",
                intent_id="talk",
                player_input="Hello there",
                game_state_seed=300
            ),
        ]
        
        return scenarios
    
    async def run_validation(self, iterations: int = 10) -> ValidationReport:
        """
        Run comprehensive deterministic validation.
        
        Args:
            iterations: Number of times to run each test case
            
        Returns:
            Validation report with results
        """
        logger.info(f"🚀 Starting deterministic validation ({iterations} iterations per test)...")
        
        start_time = time.perf_counter()
        
        # Run all test cases
        for test_case in self.test_scenarios:
            await self._run_test_case(test_case, iterations)
        
        # Analyze results
        passed_tests = 0
        failed_tests = 0
        
        for test_case in self.test_scenarios:
            if self._is_test_consistent(test_case):
                passed_tests += 1
            else:
                failed_tests += 1
        
        validation_time = time.perf_counter() - start_time
        consistency_score = passed_tests / len(self.test_scenarios)
        
        # Create report
        report = ValidationReport(
            total_tests=len(self.test_scenarios),
            passed_tests=passed_tests,
            failed_tests=failed_tests,
            consistency_score=consistency_score,
            test_cases=[self._serialize_test_case(tc) for tc in self.test_scenarios],
            validation_time=validation_time,
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S")
        )
        
        # Save report
        self._save_report(report)
        
        logger.info(f"✅ Validation completed: {passed_tests}/{len(self.test_scenarios)} passed ({consistency_score:.1%})")
        return report
    
    async def _run_test_case(self, test_case: DeterministicTestCase, iterations: int) -> None:
        """Run a single test case multiple times."""
        logger.debug(f"Running test case: {test_case.test_id}")
        
        for i in range(iterations):
            try:
                # Create deterministic game state
                game_state = self._create_deterministic_game_state(test_case.game_state_seed)
                
                # Create D20 resolver
                resolver = D20Resolver()
                
                # Resolve action
                result = resolver.resolve_action(
                    intent_id=test_case.intent_id,
                    player_input=test_case.player_input,
                    game_state=game_state,
                    room_tags=["tavern"],
                    target_npc=None
                )
                
                # Serialize result
                result_dict = self._serialize_d20_result(result)
                test_case.actual_results.append(result_dict)
                
            except Exception as e:
                logger.error(f"Test case {test_case.test_id} iteration {i} failed: {e}")
                # Add error result
                test_case.actual_results.append({
                    "error": str(e),
                    "iteration": i,
                    "timestamp": time.time()
                })
    
    def _create_deterministic_game_state(self, seed: int) -> GameState:
        """Create a deterministic game state for testing."""
        # Set random seed for reproducible state
        random.seed(seed)
        
        # Create base scenario
        game_state = create_tavern_scenario()
        
        # Apply deterministic modifications based on seed
        if seed == 20:  # Critical hit scenario
            game_state.player.hp = 100
            game_state.player.strength = 18
        elif seed == 1:  # Critical fumble scenario
            game_state.player.hp = 10
            game_state.player.strength = 8
        elif seed == 100:  # Consistency test 1
            game_state.player.hp = 75
            game_state.player.gold = 50
        elif seed == 200:  # Consistency test 2
            game_state.player.hp = 75
            game_state.player.gold = 50
        elif seed == 300:  # Consistency test 3
            game_state.player.hp = 75
            game_state.player.gold = 50
        
        return game_state
    
    def _serialize_d20_result(self, result: D20Result) -> Dict[str, Any]:
        """Serialize D20Result for comparison."""
        return {
            "success": result.success,
            "roll": result.roll,
            "total_score": result.total_score,
            "difficulty_class": result.difficulty_class,
            "hp_delta": result.hp_delta,
            "reputation_deltas": result.reputation_deltas,
            "relationship_changes": result.relationship_changes,
            "npc_state_changes": result.npc_state_changes,
            "goals_completed": result.goals_completed,
            "advantage_type": result.advantage_type,
            "raw_rolls": result.raw_rolls
        }
    
    def _is_test_consistent(self, test_case: DeterministicTestCase) -> bool:
        """Check if a test case produces consistent results."""
        if not test_case.actual_results:
            return False
        
        # Check for errors
        for result in test_case.actual_results:
            if "error" in result:
                logger.warning(f"Test case {test_case.test_id} had errors")
                return False
        
        # All results should be identical (except for timing-dependent fields)
        first_result = test_case.actual_results[0]
        
        for i, result in enumerate(test_case.actual_results[1:], 1):
            if not self._results_equal(first_result, result):
                logger.debug(f"Inconsistency in test case {test_case.test_id} at iteration {i}")
                return False
        
        return True
    
    def _results_equal(self, result1: Dict[str, Any], result2: Dict[str, Any]) -> bool:
        """Compare two D20 results for equality."""
        # Fields that should always be identical
        core_fields = [
            "success", "roll", "total_score", "difficulty_class",
            "hp_delta", "reputation_deltas", "relationship_changes",
            "npc_state_changes", "goals_completed", "advantage_type", "raw_rolls"
        ]
        
        for field in core_fields:
            if result1.get(field) != result2.get(field):
                logger.debug(f"Field {field} differs: {result1.get(field)} vs {result2.get(field)}")
                return False
        
        return True
    
    def _serialize_test_case(self, test_case: DeterministicTestCase) -> Dict[str, Any]:
        """Serialize test case for report."""
        return {
            "test_id": test_case.test_id,
            "intent_id": test_case.intent_id,
            "player_input": test_case.player_input,
            "game_state_seed": test_case.game_state_seed,
            "consistent": self._is_test_consistent(test_case),
            "result_count": len(test_case.actual_results),
            "sample_result": test_case.actual_results[0] if test_case.actual_results else None
        }
    
    def _save_report(self, report: ValidationReport) -> None:
        """Save validation report to file."""
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        report_file = self.output_dir / f"deterministic_validation_{timestamp}.json"
        
        # Convert to serializable format
        report_dict = asdict(report)
        
        with open(report_file, 'w') as f:
            json.dump(report_dict, f, indent=2)
        
        logger.info(f"📊 Validation report saved to: {report_file}")
        
        # Also save a summary
        self._save_summary(report, timestamp)
    
    def _save_summary(self, report: ValidationReport, timestamp: str) -> None:
        """Save a human-readable summary."""
        summary_file = self.output_dir / f"validation_summary_{timestamp}.txt"
        
        with open(summary_file, 'w') as f:
            f.write("D20 Core Deterministic Validation Summary\n")
            f.write("=" * 50 + "\n\n")
            
            f.write(f"Validation Date: {report.timestamp}\n")
            f.write(f"Total Tests: {report.total_tests}\n")
            f.write(f"Passed Tests: {report.passed_tests}\n")
            f.write(f"Failed Tests: {report.failed_tests}\n")
            f.write(f"Success Rate: {report.success_rate:.1f}%\n")
            f.write(f"Consistency Score: {report.consistency_score:.1%}\n")
            f.write(f"Validation Time: {report.validation_time:.2f}s\n\n")
            
            # Test case details
            f.write("Test Case Results:\n")
            f.write("-" * 30 + "\n")
            
            for test_case in report.test_cases:
                status = "✅ PASS" if test_case["consistent"] else "❌ FAIL"
                f.write(f"{test_case['test_id']}: {status}\n")
                f.write(f"  Intent: {test_case['intent_id']}\n")
                f.write(f"  Input: {test_case['player_input']}\n")
                f.write(f"  Seed: {test_case['game_state_seed']}\n")
                f.write(f"  Results: {test_case['result_count']}\n")
                
                if not test_case["consistent"]:
                    f.write(f"  ⚠️ INCONSISTENT RESULTS DETECTED\n")
                
                f.write("\n")
            
            # Overall assessment
            f.write("Overall Assessment:\n")
            f.write("-" * 20 + "\n")
            
            if report.consistency_score >= 0.95:
                f.write("✅ EXCELLENT: D20 Core is highly deterministic\n")
                f.write("   Safe for narrative pre-caching implementation\n")
            elif report.consistency_score >= 0.80:
                f.write("⚠️ GOOD: D20 Core is mostly deterministic\n")
                f.write("   Minor issues may need investigation\n")
            else:
                f.write("❌ POOR: D20 Core has consistency issues\n")
                f.write("   Narrative pre-caching may be unsafe\n")
        
        logger.info(f"📋 Summary saved to: {summary_file}")


async def main():
    """Run deterministic validation and display results."""
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🔬 D20 Core Deterministic Validation Suite")
    print("=" * 50)
    
    # Run validation
    validator = DeterministicValidator()
    report = await validator.run_validation(iterations=5)
    
    # Display results
    print(f"\n📊 Validation Results:")
    print(f"Total Tests: {report.total_tests}")
    print(f"Passed Tests: {report.passed_tests}")
    print(f"Failed Tests: {report.failed_tests}")
    print(f"Success Rate: {report.success_rate:.1f}%")
    print(f"Consistency Score: {report.consistency_score:.1%}")
    print(f"Validation Time: {report.validation_time:.2f}s")
    
    # Assessment
    print(f"\n🎯 Deterministic Assessment:")
    if report.consistency_score >= 0.95:
        print("✅ EXCELLENT: Safe for narrative pre-caching")
    elif report.consistency_score >= 0.80:
        print("⚠️ GOOD: Mostly safe, monitor edge cases")
    else:
        print("❌ POOR: Fix consistency issues before pre-caching")
    
    print(f"\n📁 Detailed reports saved to: {validator.output_dir}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
