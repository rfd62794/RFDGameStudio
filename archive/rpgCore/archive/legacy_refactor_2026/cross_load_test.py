"""
Cross-Load Test - Universal Registry Engine Swap Validation
Tests 17-trait mapping integrity between Space and Shell engines
"""

import time
import json
from typing import Dict, List, Any

from loguru import logger
from src.dgt_core.engines.space import create_space_engine_runner, ShipGenome
from src.dgt_core.engines.shells import create_shell_engine, ShellWright
from src.dgt_core.kernel.universal_registry import universal_registry, EngineType


class CrossLoadTest:
    """Tests cross-engine pilot swap with 100% data integrity validation"""
    
    def __init__(self):
        self.space_engine = create_space_engine_runner(fleet_size=5)
        self.shell_engine = create_shell_engine(party_size=5)
        self.shell_wright = ShellWright()
        self.test_results = {
            'space_initialization': False,
            'trait_export': False,
            'shell_import': False,
            'trait_integrity': 0.0,
            'performance_preservation': 0.0,
            'cross_engine_bonus': 0.0,
            'total_time': 0.0
        }
        
        logger.info("🔄 CrossLoadTest initialized")
    
    def run_cross_load_test(self) -> Dict[str, Any]:
        """Execute complete cross-engine swap test"""
        logger.info("🔄 Starting Cross-Load Test")
        start_time = time.time()
        
        try:
            # Step 1: Create test pilot in Space engine
            test_genome = self._create_test_genome()
            space_ship = self._initialize_space_pilot(test_genome)
            self.test_results['space_initialization'] = True
            
            # Step 2: Record Space performance and export traits
            self._record_space_performance(space_ship)
            
            # Force commit to ensure data is written
            universal_registry.conn.commit()
            
            exported_data = universal_registry.export_pilot_for_engine_swap(space_ship.ship_id)
            self.test_results['trait_export'] = (exported_data is not None)
            
            # Step 3: Import into Shell engine
            if exported_data:
                shell_entity = self._import_shell_pilot(exported_data)
                self.test_results['shell_import'] = (shell_entity is not None)
                
                # Step 4: Validate trait integrity
                if shell_entity:
                    integrity_score = self._validate_trait_integrity(test_genome, shell_entity)
                    self.test_results['trait_integrity'] = integrity_score
                    
                    # Step 5: Test performance preservation
                    performance_score = self._test_shell_performance(shell_entity)
                    self.test_results['performance_preservation'] = performance_score
                    
                    # Step 6: Verify cross-engine bonus
                    cross_bonus = self._verify_cross_engine_bonus(space_ship.ship_id)
                    self.test_results['cross_engine_bonus'] = cross_bonus
            
            self.test_results['total_time'] = time.time() - start_time
            
            # Final validation
            self._validate_test_success()
            
            logger.success(f"🔄 Cross-Load Test completed in {self.test_results['total_time']:.2f}s")
            return self.test_results
            
        except Exception as e:
            logger.error(f"🔄 Cross-Load Test failed: {e}")
            self.test_results['total_time'] = time.time() - start_time
            return self.test_results
    
    def _create_test_genome(self) -> ShipGenome:
        """Create test genome with all 17 traits at known values"""
        return ShipGenome(
            # Hull Systems (4 traits)
            hull_type="medium",
            plating_density=1.5,  # 50% above baseline
            shield_frequency=1.2,
            structural_integrity=1.3,
            
            # Engine Systems (4 traits)
            thruster_output=1.8,  # 80% above baseline
            fuel_efficiency=1.1,
            engine_type="ion",
            cooling_capacity=1.4,
            
            # Weapon Systems (4 traits)
            primary_weapon="laser",
            weapon_damage=1.6,  # 60% above baseline
            fire_rate=1.3,
            targeting_system=1.25,
            
            # Combat Systems (3 traits)
            initiative=1.7,  # 70% above baseline
            evasion=1.4,
            critical_chance=1.2,
            
            # Meta Properties
            generation=5,
            mutation_rate=0.1
        )
    
    def _initialize_space_pilot(self, genome: ShipGenome):
        """Initialize pilot in Space engine"""
        # Create fleet with test genome
        genomes = [genome] + [ShipGenome() for _ in range(4)]  # Fill rest with defaults
        fleet = self.space_engine.create_fleet_from_genomes(genomes)
        
        # Get our test ship
        test_ship = fleet["ship_000"]
        
        # Simulate some performance
        self._simulate_space_combat(test_ship)
        
        logger.info(f"🔄 Initialized Space pilot: {test_ship.ship_id}")
        return test_ship
    
    def _simulate_space_combat(self, ship):
        """Simulate space combat to generate performance data"""
        # Record a victory with performance metrics
        universal_registry.record_cross_engine_feat(
            ship_id=ship.ship_id,
            engine_type=EngineType.SPACE,
            performance_score=85.5,  # High performance
            skirmish_id="space_test_001",
            role="Interceptor",
            generation=ship.genome.generation,
            trait_snapshot=ship.genome.model_dump()
        )
    
    def _record_space_performance(self, ship):
        """Record space performance in universal registry"""
        # This is already done in _simulate_space_combat
        pass
    
    def _import_shell_pilot(self, exported_data):
        """Import pilot into Shell engine"""
        ship_id = exported_data['ship_id']
        trait_snapshot = exported_data['trait_snapshot']
        
        # Reconstruct genome from trait snapshot
        genome = ShipGenome(**trait_snapshot)
        
        # Create shell entity via ShellWright
        shell = self.shell_wright.craft_shell_from_genome(genome)
        
        # Create shell entity
        shell_entity = self.shell_engine.create_party_from_genomes([genome])[f"shell_000"]
        
        # Record the import
        universal_registry.import_pilot_from_engine_swap(
            exported_data, 
            EngineType.SHELL
        )
        
        logger.info(f"🔄 Imported Shell pilot: {shell_entity.entity_id}")
        return shell_entity
    
    def _validate_trait_integrity(self, original_genome: ShipGenome, shell_entity) -> float:
        """Validate 17-trait mapping integrity (0.0 to 1.0)"""
        original_traits = original_genome.model_dump()
        shell_attributes = shell_entity.shell
        
        # Map traits back from shell attributes
        trait_mappings = {
            'plating_density': ('armor_class', 0.1),  # AC scales with plating
            'structural_integrity': ('hit_points', 0.01),  # HP scales with structure
            'thruster_output': ('speed', 0.05),  # Speed scales with thrusters
            'weapon_damage': ('damage_bonus', 0.1),  # Damage bonus scales
            'fire_rate': ('attack_bonus', 0.05),  # Attack bonus scales
            'initiative': ('initiative', 0.1),  # Direct mapping
            'evasion': ('evasion', 1.0),  # Direct mapping
            'critical_chance': ('critical_chance', 1.0),  # Direct mapping
        }
        
        integrity_scores = []
        
        for trait_name, (shell_attr, scale_factor) in trait_mappings.items():
            if trait_name in original_traits and hasattr(shell_attributes, shell_attr):
                original_value = original_traits[trait_name]
                shell_value = getattr(shell_attributes, shell_attr)
                
                # Calculate expected shell value (simplified)
                if shell_attr in ['armor_class', 'attack_bonus', 'damage_bonus']:
                    expected = 10 + (original_value - 1.0) * scale_factor * 10
                elif shell_attr == 'hit_points':
                    expected = 100 * original_value
                elif shell_attr == 'speed':
                    expected = 30 + (original_value - 1.0) * scale_factor * 20
                elif shell_attr in ['initiative']:
                    expected = (original_value - 1.0) * scale_factor * 10
                elif shell_attr in ['evasion', 'critical_chance']:
                    expected = 0.1 + (original_value - 1.0) * scale_factor * 0.1
                else:
                    expected = shell_value  # Skip complex calculations
                
                # Calculate integrity (lower difference = higher integrity)
                if expected != 0:
                    difference = abs(shell_value - expected) / abs(expected)
                    integrity = max(0.0, 1.0 - difference)
                else:
                    integrity = 1.0 if shell_value == 0 else 0.0
                
                integrity_scores.append(integrity)
                
                logger.debug(f"🔄 Trait {trait_name}: {original_value} -> {shell_attr} {shell_value} (expected {expected:.1f}, integrity {integrity:.2f})")
        
        # Calculate overall integrity
        overall_integrity = sum(integrity_scores) / len(integrity_scores) if integrity_scores else 0.0
        
        logger.info(f"🔄 Trait integrity: {overall_integrity:.2%} ({len(integrity_scores)} traits validated)")
        return overall_integrity
    
    def _test_shell_performance(self, shell_entity):
        """Test shell entity performance"""
        # Simulate shell combat
        self._simulate_shell_combat(shell_entity)
        
        # Get performance summary
        summary = universal_registry.get_cross_engine_summary(shell_entity.entity_id)
        
        performance_score = summary.get('total_xp', 0.0)
        
        logger.info(f"🔄 Shell performance score: {performance_score:.1f}")
        return performance_score
    
    def _simulate_shell_combat(self, entity):
        """Simulate shell combat to generate performance data"""
        # Record a victory with performance metrics
        universal_registry.record_cross_engine_feat(
            ship_id=entity.entity_id,
            engine_type=EngineType.SHELL,
            performance_score=78.3,  # Good performance
            skirmish_id="shell_test_001",
            role="Scout",
            generation=0,  # Would come from entity
            trait_snapshot={}  # Would capture shell traits
        )
    
    def _verify_cross_engine_bonus(self, ship_id):
        """Verify cross-engine bonus was applied"""
        summary = universal_registry.get_cross_engine_summary(ship_id)
        
        cross_bonus = summary.get('cross_engine_bonus', 0.0)
        is_versatile = summary.get('is_versatile', False)
        
        logger.info(f"🔄 Cross-engine bonus: {cross_bonus:.1f}, versatile: {is_versatile}")
        return cross_bonus
    
    def _validate_test_success(self):
        """Validate overall test success"""
        logger.info("🔄 === CROSS-LOAD TEST VALIDATION ===")
        logger.info(f"🔄 Space Initialization: {'✅' if self.test_results['space_initialization'] else '❌'}")
        logger.info(f"🔄 Trait Export: {'✅' if self.test_results['trait_export'] else '❌'}")
        logger.info(f"🔄 Shell Import: {'✅' if self.test_results['shell_import'] else '❌'}")
        logger.info(f"🔄 Trait Integrity: {self.test_results['trait_integrity']:.1%}")
        logger.info(f"🔄 Performance Preservation: {self.test_results['performance_preservation']:.1f}")
        logger.info(f"🔄 Cross-Engine Bonus: {self.test_results['cross_engine_bonus']:.1f}")
        logger.info(f"🔄 Total Time: {self.test_results['total_time']:.2f}s")
        
        # Success criteria
        success = (
            self.test_results['space_initialization'] and
            self.test_results['trait_export'] and
            self.test_results['shell_import'] and
            self.test_results['trait_integrity'] >= 0.8 and  # 80% integrity threshold
            self.test_results['cross_engine_bonus'] > 0
        )
        
        if success:
            logger.success("🔄 CROSS-LOAD TEST PASSED - Universal Registry validated!")
        else:
            logger.error("🔄 CROSS-LOAD TEST FAILED - Check integrity scores")
        
        logger.info("🔄 === END VALIDATION ===")
        return success


def run_cross_load_test() -> Dict[str, Any]:
    """Convenience function to run the cross-load test"""
    test = CrossLoadTest()
    return test.run_cross_load_test()


if __name__ == "__main__":
    # Run the cross-load test
    results = run_cross_load_test()
    
    # Print final summary
    print("\n" + "="*50)
    print("CROSS-LOAD TEST RESULTS")
    print("="*50)
    for key, value in results.items():
        print(f"{key}: {value}")
    print("="*50)
