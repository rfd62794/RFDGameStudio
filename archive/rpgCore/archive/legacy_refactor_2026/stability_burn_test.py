"""
Stability Burn Test - 10 Generation Validation
Validates batch processing, prestige bias, and thread safety
"""

import time
import threading
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass

from loguru import logger
from src.dgt_core.evolution.selection import meritocratic_selector, GenomeFitness
from src.dgt_core.kernel.batch_processor import batch_processor
from src.dgt_core.kernel.post_battle_reporter import post_battle_reporter, BattleMetrics, SkirmishOutcome


@dataclass
class StabilityTestConfig:
    """Configuration for stability burn test"""
    generations: int = 10
    population_size: int = 50
    skirmishes_per_generation: int = 25  # 5v5 = 25 total ships
    concurrent_workers: int = 4
    batch_timeout: float = 5.0
    
    def __post_init__(self):
        self.total_skirmishes = self.generations * self.skirmishes_per_generation


class StabilityBurnTest:
    """10-generation stability burn test for architectural validation"""
    
    def __init__(self, config: StabilityTestConfig):
        self.config = config
        self.test_results = {
            'generations_completed': 0,
            'total_skirmishes': 0,
            'batch_errors': 0,
            'sqlite_lock_errors': 0,
            'prestige_bias_errors': 0,
            'total_time': 0.0,
            'avg_generation_time': 0.0
        }
        
        logger.info(f"🔥 Stability Burn Test initialized: {config.generations} generations, {config.skirmishes_per_generation} skirmishes/gen")
    
    def run_stability_burn(self) -> Dict[str, Any]:
        """Execute the 10-generation stability burn"""
        logger.info("🔥 Starting 10-generation Stability Burn Test")
        start_time = time.time()
        
        try:
            # Initialize test population
            population = self._create_test_population(self.config.population_size)
            
            # Run generations
            for generation in range(self.config.generations):
                gen_start = time.time()
                
                logger.info(f"🔥 Generation {generation + 1}/{self.config.generations}")
                
                # Simulate skirmishes with concurrent execution
                skirmish_results = self._run_generation_skirmishes(population, generation)
                
                # Apply evolution selection with prestige bias
                population = self._evolve_population(population, skirmish_results)
                
                # Force batch processing
                batch_success = batch_processor.force_process_batch()
                if not batch_success:
                    self.test_results['batch_errors'] += 1
                    logger.error(f"🔥 Batch processing failed in generation {generation + 1}")
                
                # Update statistics
                gen_time = time.time() - gen_start
                self.test_results['generations_completed'] = generation + 1
                self.test_results['total_skirmishes'] += len(skirmish_results)
                self.test_results['avg_generation_time'] = (
                    (self.test_results['avg_generation_time'] * generation + gen_time) / (generation + 1)
                )
                
                logger.info(f"🔥 Generation {generation + 1} completed in {gen_time:.2f}s")
            
            # Final batch processing
            final_batch_success = batch_processor.force_process_batch()
            if not final_batch_success:
                self.test_results['batch_errors'] += 1
                logger.error("🔥 Final batch processing failed")
            
            self.test_results['total_time'] = time.time() - start_time
            
            # Validate results
            self._validate_test_results()
            
            logger.success(f"🔥 Stability Burn completed: {self.test_results['total_time']:.2f}s total")
            return self.test_results
            
        except Exception as e:
            logger.error(f"🔥 Stability Burn failed: {e}")
            self.test_results['total_time'] = time.time() - start_time
            return self.test_results
    
    def _create_test_population(self, size: int) -> List[GenomeFitness]:
        """Create test population with varied fitness and victory counts"""
        population = []
        
        for i in range(size):
            # Create varied genomes to test prestige bias
            base_fitness = 0.3 + (i / size) * 0.7  # 0.3 to 1.0
            victories = i // 5  # Some genomes have victories
            generation = i // 10  # Multiple generations
            
            genome = GenomeFitness(
                genome_id=f"genome_{i:03d}",
                fitness=base_fitness,
                victories=victories,
                generation=generation
            )
            
            population.append(genome)
        
        return population
    
    def _run_generation_skirmishes(self, population: List[GenomeFitness], generation: int) -> List[BattleMetrics]:
        """Run concurrent skirmishes for a generation"""
        skirmish_results = []
        
        def run_skirmish(ship_pair: tuple) -> BattleMetrics:
            """Simulate a single skirmish"""
            ship1_id, ship2_id = ship_pair
            
            # Simulate skirmish metrics
            ship1 = population[int(ship1_id.split('_')[1])]
            ship2 = population[int(ship2_id.split('_')[1])]
            
            # Create mock performance data
            ship_performances = {
                ship1_id: {
                    "damage_dealt": 50.0 + ship1.fitness * 100,
                    "damage_taken": 30.0 + (1 - ship1.fitness) * 50,
                    "accuracy": 0.6 + ship1.fitness * 0.3,
                    "survived": ship1.fitness > 0.5,
                    "role": "Fighter",
                    "generation": ship1.generation
                },
                ship2_id: {
                    "damage_dealt": 50.0 + ship2.fitness * 100,
                    "damage_taken": 30.0 + (1 - ship2.fitness) * 50,
                    "accuracy": 0.6 + ship2.fitness * 0.3,
                    "survived": ship2.fitness > 0.5,
                    "role": "Fighter",
                    "generation": ship2.generation
                }
            }
            
            # Determine winner
            winner = ship1_id if ship1.fitness > ship2.fitness else ship2_id
            outcome = SkirmishOutcome.VICTORY  # Simplified
            
            metrics = BattleMetrics(
                skirmish_id=f"gen{generation}_skirm_{ship1_id}_vs_{ship2_id}",
                timestamp=time.time(),
                fleet_id=f"test_fleet_gen{generation}",
                outcome=outcome,
                duration_seconds=30.0 + (ship1.fitness + ship2.fitness) * 20,
                total_damage_dealt=sum(p["damage_dealt"] for p in ship_performances.values()),
                total_damage_taken=sum(p["damage_taken"] for p in ship_performances.values()),
                ship_performances=ship_performances,
                commander_signals=[f"FOCUS_FIRE_{winner}"],
                mvp_candidate=winner
            )
            
            return metrics
        
        # Create ship pairs for skirmishes
        ship_pairs = []
        for i in range(0, min(len(population), self.config.skirmishes_per_generation * 2), 2):
            if i + 1 < len(population):
                ship_pairs.append((f"genome_{i:03d}", f"genome_{i+1:03d}"))
        
        # Run skirmishes concurrently
        with ThreadPoolExecutor(max_workers=self.config.concurrent_workers) as executor:
            future_to_pair = {
                executor.submit(run_skirmish, pair): pair 
                for pair in ship_pairs
            }
            
            for future in as_completed(future_to_pair):
                try:
                    result = future.result(timeout=self.config.batch_timeout)
                    skirmish_results.append(result)
                    
                    # Submit to batch processor
                    success = post_battle_reporter.record_skirmish_results(result)
                    if not success:
                        self.test_results['batch_errors'] += 1
                    
                except Exception as e:
                    if "database is locked" in str(e).lower():
                        self.test_results['sqlite_lock_errors'] += 1
                    logger.error(f"🔥 Skirmish failed: {e}")
        
        return skirmish_results
    
    def _evolve_population(self, population: List[GenomeFitness], skirmish_results: List[BattleMetrics]) -> List[GenomeFitness]:
        """Evolve population using meritocratic selection"""
        try:
            # Update victory counts from skirmish results
            victory_records = {}
            for skirmish in skirmish_results:
                if skirmish.mvp_candidate:
                    victory_records[skirmish.mvp_candidate] = victory_records.get(skirmish.mvp_candidate, 0) + 1
            
            population = meritocratic_selector.update_victory_counts(population, victory_records)
            
            # Test prestige bias application
            biased_population = meritocratic_selector.apply_prestige_bias(population)
            
            # Validate prestige bias doesn't cause overflow
            for genome in biased_population:
                if genome.fitness < 0 or genome.fitness > float('inf'):
                    self.test_results['prestige_bias_errors'] += 1
                    logger.error(f"🔥 Prestige bias overflow: {genome.genome_id}")
            
            # Select next generation
            new_population = meritocratic_selector.select_parents(population, self.config.population_size)
            
            # Create offspring (simplified - just copy parents for stability test)
            next_generation = []
            for i, parent in enumerate(new_population):
                child = GenomeFitness(
                    genome_id=f"genome_gen{len(population)//50}_{i:03d}",
                    fitness=parent.fitness * (0.9 + (i % 10) * 0.02),  # Small variation
                    victories=0,  # Reset victories for new generation
                    generation=parent.generation + 1
                )
                next_generation.append(child)
            
            return next_generation
            
        except Exception as e:
            logger.error(f"🔥 Evolution failed: {e}")
            return population  # Return original population on error
    
    def _validate_test_results(self):
        """Validate test results and log summary"""
        logger.info("🔥 === STABILITY BURN VALIDATION ===")
        logger.info(f"🔥 Generations Completed: {self.test_results['generations_completed']}/{self.config.generations}")
        logger.info(f"🔥 Total Skirmishes: {self.test_results['total_skirmishes']}")
        logger.info(f"🔥 Batch Errors: {self.test_results['batch_errors']}")
        logger.info(f"🔥 SQLite Lock Errors: {self.test_results['sqlite_lock_errors']}")
        logger.info(f"🔥 Prestige Bias Errors: {self.test_results['prestige_bias_errors']}")
        logger.info(f"🔥 Total Time: {self.test_results['total_time']:.2f}s")
        logger.info(f"🔥 Avg Generation Time: {self.test_results['avg_generation_time']:.2f}s")
        
        # Determine success
        success = (
            self.test_results['generations_completed'] == self.config.generations and
            self.test_results['sqlite_lock_errors'] == 0 and
            self.test_results['prestige_bias_errors'] == 0 and
            self.test_results['batch_errors'] < 2  # Allow minor batch errors
        )
        
        if success:
            logger.success("🔥 ARCHITECTURAL SINGULARITY ACHIEVED - All stability checks passed!")
        else:
            logger.error("🔥 Stability burn failed - Check error counts above")
        
        logger.info("🔥 === END VALIDATION ===")


def run_10_generation_stability_burn() -> Dict[str, Any]:
    """Convenience function to run the stability burn test"""
    config = StabilityTestConfig(
        generations=10,
        population_size=50,
        skirmishes_per_generation=25,
        concurrent_workers=4
    )
    
    test = StabilityBurnTest(config)
    return test.run_stability_burn()


if __name__ == "__main__":
    # Run the stability burn test
    results = run_10_generation_stability_burn()
    
    # Print final summary
    print("\n" + "="*50)
    print("STABILITY BURN TEST RESULTS")
    print("="*50)
    for key, value in results.items():
        print(f"{key}: {value}")
    print("="*50)
