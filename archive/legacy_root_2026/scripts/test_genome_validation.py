#!/usr/bin/env python3
"""
Genome Validation Test Script
Tests 100 wild turtles for genetic and statistical validation
"""

import sys
import statistics
from pathlib import Path

# Add src to path
src_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(src_path))

from foundation.genetics.genome_engine import TurboGenome, generate_wild_turtle, validate_genome
from engines.body.systems.race_translator import create_race_translator, translate_wild_turtle_stats


def test_genome_validation():
    """Test 100 wild turtles for validation"""
    print("🧬 Testing 100 Wild Turtles - Genome Validation")
    print("=" * 50)
    
    translator = create_race_translator()
    genomes = []
    stats_list = []
    validation_errors = []
    
    # Generate 100 wild turtles
    for i in range(100):
        try:
            genome = generate_wild_turtle()
            validate_genome(genome)
            
            # Translate to stats
            stats_result = translator.translate_genome_to_stats(genome)
            if not stats_result.success:
                validation_errors.append(f"Turtle {i}: Stats translation failed - {stats_result.error}")
                continue
            
            genomes.append(genome)
            stats_list.append(stats_result.value)
            
        except Exception as e:
            validation_errors.append(f"Turtle {i}: {e}")
    
    # Report results
    print(f"✅ Successfully generated: {len(genomes)}/100 turtles")
    print(f"❌ Validation errors: {len(validation_errors)}")
    
    if validation_errors:
        print("\nValidation Errors:")
        for error in validation_errors[:5]:  # Show first 5 errors
            print(f"  - {error}")
        if len(validation_errors) > 5:
            print(f"  ... and {len(validation_errors) - 5} more")
    
    # Statistical analysis
    if stats_list:
        speeds = [s.speed for s in stats_list]
        energies = [s.max_energy for s in stats_list]
        
        print(f"\n📊 Statistical Analysis:")
        print(f"  Average Speed: {statistics.mean(speeds):.2f} (range: {min(speeds):.1f}-{max(speeds):.1f})")
        print(f"  Average Energy: {statistics.mean(energies):.1f} (range: {min(energies):.1f}-{max(energies):.1f})")
        
        # Trait distribution
        limb_shapes = {}
        for genome in genomes:
            shape = genome.limb_shape.value
            limb_shapes[shape] = limb_shapes.get(shape, 0) + 1
        
        print(f"\n🦿 Limb Shape Distribution:")
        for shape, count in limb_shapes.items():
            print(f"  {shape}: {count}%")
    
    return len(genomes) == 100


if __name__ == "__main__":
    success = test_genome_validation()
    sys.exit(0 if success else 1)
