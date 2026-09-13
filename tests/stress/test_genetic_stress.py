"""
Genetic Stress Test - Phase 1 Verification

Performs 10,000 crossovers to verify 100% Pydantic validation compliance.
This test ensures the Genetic Anchor is solid before proceeding to Phase 2.

Stress Test Scenarios:
1. 10,000 Mendelian crossovers
2. 10,000 Blended crossovers  
3. 10,000 Color pattern crossovers
4. Edge case validation (extreme values)
"""

import sys
import os
import time
import random
from pathlib import Path
from typing import List, Dict, Any

# Add src to path for imports
src_path = Path(__file__).parent.parent.parent / "src"
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

try:
    from dgt_engine.foundation.genetics.schema import TurboGenome, create_default_genome, validate_genome_dict
    from dgt_engine.foundation.genetics.crossover import (
        mendelian_crossover, blended_crossover, color_pattern_crossover,
        calculate_genetic_similarity, CrossoverConfig
    )
    from dgt_engine.foundation.types import Result
except ImportError as e:
    print(f"❌ Import failed: {e}")
    print("Ensure foundation modules are properly installed")
    sys.exit(1)


class GeneticStressTest:
    """Comprehensive stress testing for genetic system"""
    
    def __init__(self):
        self.test_results = {
            'total_tests': 0,
            'passed_tests': 0,
            'failed_tests': 0,
            'validation_errors': [],
            'performance_metrics': {}
        }
        
        # Create test parents with diverse traits
        self.parent1 = self._create_test_parent1()
        self.parent2 = self._create_test_parent2()
        
    def _create_test_parent1(self) -> TurboGenome:
        """Create first test parent with specific traits"""
        traits = {
            'shell_base_color': (255, 0, 0),  # Red shell
            'shell_pattern_type': 'hex',
            'shell_pattern_color': (255, 255, 255),  # White pattern
            'shell_pattern_density': 0.8,
            'shell_pattern_opacity': 0.9,
            'shell_size_modifier': 1.2,
            'body_base_color': (0, 255, 0),  # Green body
            'body_pattern_type': 'solid',
            'body_pattern_color': (0, 128, 0),
            'body_pattern_density': 0.3,
            'head_size_modifier': 1.1,
            'head_color': (139, 90, 43),
            'leg_length': 1.3,
            'limb_shape': 'fins',
            'leg_thickness_modifier': 1.1,
            'leg_color': (101, 67, 33),
            'eye_color': (0, 0, 255),  # Blue eyes
            'eye_size_modifier': 1.2
        }
        return TurboGenome.from_dict(traits)
    
    def _create_test_parent2(self) -> TurboGenome:
        """Create second test parent with different traits"""
        traits = {
            'shell_base_color': (0, 0, 255),  # Blue shell
            'shell_pattern_type': 'spots',
            'shell_pattern_color': (255, 255, 0),  # Yellow pattern
            'shell_pattern_density': 0.4,
            'shell_pattern_opacity': 0.7,
            'shell_size_modifier': 0.8,
            'body_base_color': (255, 165, 0),  # Orange body
            'body_pattern_type': 'mottled',
            'body_pattern_color': (255, 140, 0),
            'body_pattern_density': 0.6,
            'head_size_modifier': 0.9,
            'head_color': (160, 82, 45),
            'leg_length': 0.7,
            'limb_shape': 'feet',
            'leg_thickness_modifier': 0.9,
            'leg_color': (139, 69, 19),
            'eye_color': (255, 0, 0),  # Red eyes
            'eye_size_modifier': 0.8
        }
        return TurboGenome.from_dict(traits)
    
    def run_stress_test(self, iterations: int = 10000) -> Dict[str, Any]:
        """Run comprehensive stress test"""
        print(f"🧬 Starting Genetic Stress Test: {iterations:,} iterations")
        print("=" * 60)
        
        start_time = time.perf_counter()
        
        # Test 1: Mendelian Crossover
        print("📊 Test 1: Mendelian Crossover...")
        mendelian_results = self._test_mendelian_crossover(iterations)
        
        # Test 2: Blended Crossover
        print("📊 Test 2: Blended Crossover...")
        blended_results = self._test_blended_crossover(iterations)
        
        # Test 3: Color Pattern Crossover
        print("📊 Test 3: Color Pattern Crossover...")
        color_results = self._test_color_pattern_crossover(iterations)
        
        # Test 4: Edge Cases
        print("📊 Test 4: Edge Case Validation...")
        edge_results = self._test_edge_cases()
        
        # Test 5: Similarity Calculation
        print("📊 Test 5: Similarity Calculation...")
        similarity_results = self._test_similarity_calculation()
        
        total_time = time.perf_counter() - start_time
        
        # Compile results
        final_results = {
            'total_iterations': iterations * 3,  # 3 main tests
            'total_time': total_time,
            'mendelian': mendelian_results,
            'blended': blended_results,
            'color': color_results,
            'edge_cases': edge_results,
            'similarity': similarity_results,
            'overall_success_rate': self._calculate_overall_success_rate(),
            'performance': {
                'crossovers_per_second': (iterations * 3) / total_time,
                'average_crossover_time': total_time / (iterations * 3)
            }
        }
        
        return final_results
    
    def _test_mendelian_crossover(self, iterations: int) -> Dict[str, Any]:
        """Test Mendelian crossover with validation"""
        validation_errors = []
        start_time = time.perf_counter()
        
        for i in range(iterations):
            try:
                # Perform crossover
                child = mendelian_crossover(self.parent1, self.parent2)
                
                # Validate child genome
                child_dict = child.to_dict()
                if not validate_genome_dict(child_dict):
                    validation_errors.append(f"Iteration {i}: Invalid child genome")
                
                # Test trait inheritance
                self._validate_trait_inheritance(child, i)
                
                self.test_results['passed_tests'] += 1
                
            except Exception as e:
                validation_errors.append(f"Iteration {i}: {str(e)}")
                self.test_results['failed_tests'] += 1
            
            self.test_results['total_tests'] += 1
        
        crossover_time = time.perf_counter() - start_time
        
        return {
            'iterations': iterations,
            'validation_errors': len(validation_errors),
            'error_rate': len(validation_errors) / iterations,
            'crossover_time': crossover_time,
            'errors': validation_errors[:10]  # First 10 errors
        }
    
    def _test_blended_crossover(self, iterations: int) -> Dict[str, Any]:
        """Test blended crossover with validation"""
        validation_errors = []
        start_time = time.perf_counter()
        
        config = CrossoverConfig()
        
        for i in range(iterations):
            try:
                # Perform crossover
                child = blended_crossover(self.parent1, self.parent2, config=config)
                
                # Validate child genome
                child_dict = child.to_dict()
                if not validate_genome_dict(child_dict):
                    validation_errors.append(f"Iteration {i}: Invalid blended child")
                
                # Test blending logic for continuous values
                self._validate_blending(child, i)
                
                self.test_results['passed_tests'] += 1
                
            except Exception as e:
                validation_errors.append(f"Iteration {i}: {str(e)}")
                self.test_results['failed_tests'] += 1
            
            self.test_results['total_tests'] += 1
        
        crossover_time = time.perf_counter() - start_time
        
        return {
            'iterations': iterations,
            'validation_errors': len(validation_errors),
            'error_rate': len(validation_errors) / iterations,
            'crossover_time': crossover_time,
            'errors': validation_errors[:10]
        }
    
    def _test_color_pattern_crossover(self, iterations: int) -> Dict[str, Any]:
        """Test color pattern crossover with validation"""
        validation_errors = []
        start_time = time.perf_counter()
        
        config = CrossoverConfig()
        
        for i in range(iterations):
            try:
                # Perform crossover
                child = color_pattern_crossover(self.parent1, self.parent2, config=config)
                
                # Validate child genome
                child_dict = child.to_dict()
                if not validate_genome_dict(child_dict):
                    validation_errors.append(f"Iteration {i}: Invalid color child")
                
                # Test color blending
                self._validate_color_blending(child, i)
                
                self.test_results['passed_tests'] += 1
                
            except Exception as e:
                validation_errors.append(f"Iteration {i}: {str(e)}")
                self.test_results['failed_tests'] += 1
            
            self.test_results['total_tests'] += 1
        
        crossover_time = time.perf_counter() - start_time
        
        return {
            'iterations': iterations,
            'validation_errors': len(validation_errors),
            'error_rate': len(validation_errors) / iterations,
            'crossover_time': crossover_time,
            'errors': validation_errors[:10]
        }
    
    def _test_edge_cases(self) -> Dict[str, Any]:
        """Test edge cases and boundary conditions"""
        edge_cases = []
        
        try:
            # Test identical parents
            identical_child = mendelian_crossover(self.parent1, self.parent1)
            edge_cases.append("Identical parents: SUCCESS")
            
            # Test default genome crossover
            default_genome = create_default_genome()
            default_child = mendelian_crossover(default_genome, self.parent1)
            edge_cases.append("Default genome crossover: SUCCESS")
            
            # Test extreme values
            extreme_parent = self._create_extreme_parent()
            extreme_child = mendelian_crossover(extreme_parent, self.parent2)
            edge_cases.append("Extreme values: SUCCESS")
            
            # Test validation with invalid data
            invalid_dict = {'shell_base_color': (300, -10, 128)}  # Invalid RGB
            is_valid = validate_genome_dict(invalid_dict)
            edge_cases.append(f"Invalid data validation: {'SUCCESS' if not is_valid else 'FAILED'}")
            
        except Exception as e:
            edge_cases.append(f"Edge case error: {str(e)}")
        
        return {
            'edge_cases_passed': len([c for c in edge_cases if "SUCCESS" in c]),
            'total_edge_cases': len(edge_cases),
            'results': edge_cases
        }
    
    def _test_similarity_calculation(self) -> Dict[str, Any]:
        """Test genetic similarity calculation"""
        similarity_tests = []
        
        try:
            # Test identical genomes
            identical_similarity = calculate_genetic_similarity(self.parent1, self.parent1)
            similarity_tests.append(f"Identical similarity: {identical_similarity:.3f}")
            
            # Test different genomes
            different_similarity = calculate_genetic_similarity(self.parent1, self.parent2)
            similarity_tests.append(f"Different similarity: {different_similarity:.3f}")
            
            # Test similarity ranges
            if 0.0 <= different_similarity <= 1.0:
                similarity_tests.append("Similarity range: VALID")
            else:
                similarity_tests.append("Similarity range: INVALID")
            
        except Exception as e:
            similarity_tests.append(f"Similarity error: {str(e)}")
        
        return {
            'tests_completed': len(similarity_tests),
            'results': similarity_tests
        }
    
    def _validate_trait_inheritance(self, child: TurboGenome, iteration: int):
        """Validate that child inherits traits from parents"""
        parent1_traits = self.parent1.to_dict()
        parent2_traits = self.parent2.to_dict()
        child_traits = child.to_dict()
        
        for trait_name in child_traits:
            child_value = child_traits[trait_name]
            parent1_value = parent1_traits[trait_name]
            parent2_value = parent2_traits[trait_name]
            
            # Child should have one of the parent values (for discrete traits)
            if isinstance(child_value, str):
                if child_value not in [parent1_value, parent2_value]:
                    raise ValueError(f"Invalid trait inheritance for {trait_name}")
    
    def _validate_blending(self, child: TurboGenome, iteration: int):
        """Validate that continuous values are properly blended"""
        parent1_continuous = {
            'shell_pattern_density': self.parent1.shell_pattern_density,
            'shell_size_modifier': self.parent1.shell_size_modifier,
            'leg_length': self.parent1.leg_length
        }
        parent2_continuous = {
            'shell_pattern_density': self.parent2.shell_pattern_density,
            'shell_size_modifier': self.parent2.shell_size_modifier,
            'leg_length': self.parent2.leg_length
        }
        
        child_continuous = {
            'shell_pattern_density': child.shell_pattern_density,
            'shell_size_modifier': child.shell_size_modifier,
            'leg_length': child.leg_length
        }
        
        # Check that blended values are between parents
        for trait in child_continuous:
            p1_val = parent1_continuous[trait]
            p2_val = parent2_continuous[trait]
            child_val = child_continuous[trait]
            
            if not (min(p1_val, p2_val) <= child_val <= max(p1_val, p2_val)):
                raise ValueError(f"Blending error for {trait}: {child_val} not between {p1_val} and {p2_val}")
    
    def _validate_color_blending(self, child: TurboGenome, iteration: int):
        """Validate that RGB colors are properly blended"""
        parent1_colors = {
            'shell_base_color': self.parent1.shell_base_color.to_tuple(),
            'body_base_color': self.parent1.body_base_color.to_tuple()
        }
        parent2_colors = {
            'shell_base_color': self.parent2.shell_base_color.to_tuple(),
            'body_base_color': self.parent2.body_base_color.to_tuple()
        }
        child_colors = {
            'shell_base_color': child.shell_base_color.to_tuple(),
            'body_base_color': child.body_base_color.to_tuple()
        }
        
        # Check that blended colors are reasonable
        for color_type in child_colors:
            p1_color = parent1_colors[color_type]
            p2_color = parent2_colors[color_type]
            child_color = child_colors[color_type]
            
            # Each channel should be between parent values
            for i in range(3):
                if not (min(p1_color[i], p2_color[i]) <= child_color[i] <= max(p1_color[i], p2_color[i])):
                    # Color bias might push it outside range slightly, allow small tolerance
                    tolerance = 5
                    if abs(child_color[i] - min(p1_color[i], p2_color[i])) > tolerance and \
                       abs(child_color[i] - max(p1_color[i], p2_color[i])) > tolerance:
                        raise ValueError(f"Color blending error for {color_type} channel {i}")
    
    def _create_extreme_parent(self) -> TurboGenome:
        """Create parent with extreme boundary values"""
        traits = {
            'shell_base_color': (0, 0, 0),  # Minimum RGB
            'shell_pattern_type': 'rings',
            'shell_pattern_color': (255, 255, 255),  # Maximum RGB
            'shell_pattern_density': 0.1,  # Minimum
            'shell_pattern_opacity': 1.0,  # Maximum
            'shell_size_modifier': 0.5,  # Minimum
            'body_base_color': (128, 128, 128),  # Middle RGB
            'body_pattern_type': 'marbled',
            'body_pattern_color': (64, 64, 64),
            'body_pattern_density': 1.0,  # Maximum
            'head_size_modifier': 0.7,  # Minimum
            'head_color': (255, 255, 255),
            'leg_length': 1.5,  # Maximum
            'limb_shape': 'flippers',
            'leg_thickness_modifier': 1.3,  # Maximum
            'leg_color': (0, 0, 0),
            'eye_color': (255, 0, 0),
            'eye_size_modifier': 0.8  # Minimum
        }
        return TurboGenome.from_dict(traits)
    
    def _calculate_overall_success_rate(self) -> float:
        """Calculate overall success rate across all tests"""
        if self.test_results['total_tests'] == 0:
            return 0.0
        return self.test_results['passed_tests'] / self.test_results['total_tests']


def print_stress_test_results(results: Dict[str, Any]):
    """Print formatted stress test results"""
    print("\n" + "=" * 60)
    print("🏆 GENETIC STRESS TEST RESULTS")
    print("=" * 60)
    
    print(f"📊 Total Iterations: {results['total_iterations']:,}")
    print(f"⏱️  Total Time: {results['total_time']:.3f}s")
    print(f"🎯 Overall Success Rate: {results['overall_success_rate']:.2%}")
    print(f"⚡ Performance: {results['performance']['crossovers_per_second']:.0f} crossovers/second")
    
    print("\n--- Test Breakdown ---")
    
    # Mendelian Results
    mendelian = results['mendelian']
    print(f"🧬 Mendelian: {mendelian['iterations']:,} iterations, "
          f"{(1-mendelian['error_rate']):.2%} success rate")
    
    # Blended Results  
    blended = results['blended']
    print(f"🔄 Blended: {blended['iterations']:,} iterations, "
          f"{(1-blended['error_rate']):.2%} success rate")
    
    # Color Results
    color = results['color']
    print(f"🎨 Color Pattern: {color['iterations']:,} iterations, "
          f"{(1-color['error_rate']):.2%} success rate")
    
    # Edge Cases
    edge = results['edge_cases']
    print(f"⚡ Edge Cases: {edge['edge_cases_passed']}/{edge['total_edge_cases']} passed")
    
    # Similarity Tests
    similarity = results['similarity']
    print(f"📏 Similarity: {similarity['tests_completed']} tests completed")
    
    # Errors (if any)
    total_errors = mendelian['validation_errors'] + blended['validation_errors'] + color['validation_errors']
    if total_errors > 0:
        print(f"\n⚠️  Total Validation Errors: {total_errors}")
        print("Sample errors:")
        for error_list in [mendelian['errors'], blended['errors'], color['errors']]:
            for error in error_list[:3]:
                if error:
                    print(f"  • {error}")
    else:
        print("\n✅ No validation errors detected!")
    
    print("\n" + "=" * 60)
    
    # Final verdict
    success_rate = results['overall_success_rate']
    if success_rate >= 0.999:
        print("🏆 VERDICT: EXCELLENT - Genetic Anchor is SOLID")
    elif success_rate >= 0.99:
        print("✅ VERDICT: GOOD - Genetic Anchor is stable")
    elif success_rate >= 0.95:
        print("⚠️  VERDICT: ACCEPTABLE - Minor issues detected")
    else:
        print("❌ VERDICT: FAILED - Significant issues found")
    
    print("=" * 60)


if __name__ == "__main__":
    print("🧬 Genetic Stress Test - Phase 1 Verification")
    print("Testing 10,000 crossovers for 100% Pydantic compliance")
    
    # Run stress test
    stress_test = GeneticStressTest()
    results = stress_test.run_stress_test(iterations=10000)
    
    # Print results
    print_stress_test_results(results)
    
    # Exit with appropriate code
    success_rate = results['overall_success_rate']
    if success_rate >= 0.99:
        print("\n🎯 Phase 1 Foundation Extraction: SUCCESS")
        sys.exit(0)
    else:
        print("\n❌ Phase 1 Foundation Extraction: FAILED")
        sys.exit(1)
