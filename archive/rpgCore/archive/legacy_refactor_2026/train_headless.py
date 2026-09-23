"""
DGT Headless Training Script - ADR 136 Implementation
Parallel Hyperspeed NEAT Training Pipeline

Usage:
    python train_headless.py --generations 100 --pop_size 50 --cores 8
    python train_headless.py --config custom_config.json
"""

import argparse
import json
import time
from pathlib import Path
from typing import Dict, Any

from loguru import logger

from src.dgt_core.simulation.headless_server import (
    HeadlessSimulationServer, HeadlessConfig, initialize_headless_server
)


def load_config_from_file(config_path: str) -> HeadlessConfig:
    """Load configuration from JSON file"""
    with open(config_path, 'r') as f:
        data = json.load(f)
    
    return HeadlessConfig(**data)


def save_config_template(config_path: str):
    """Save a configuration template"""
    config = HeadlessConfig()
    with open(config_path, 'w') as f:
        json.dump(config.__dict__, f, indent=2)
    
    logger.info(f"📝 Configuration template saved to {config_path}")


def run_headless_training(args):
    """Run headless training session"""
    # Load or create configuration
    if args.config:
        config = load_config_from_file(args.config)
        logger.info(f"📋 Loaded configuration from {args.config}")
    else:
        config = HeadlessConfig(
            pop_size=args.pop_size,
            num_processes=args.cores,
            sim_duration=args.duration,
            fitness_threshold=args.fitness_threshold,
            snapshot_interval=args.snapshot_interval
        )
    
    # Configure logging
    if not config.enable_logging:
        logger.remove()
        logger.add(lambda msg: None)  # Null logger
    
    logger.info("🚀 Starting Headless Neuro-Evolution Training")
    logger.info(f"📊 Configuration: {config.__dict__}")
    
    # Initialize headless server
    server = initialize_headless_server(config)
    
    # Start training
    start_time = time.time()
    
    try:
        elite_pilot = server.run_training_session(max_generations=args.generations)
        
        training_time = time.time() - start_time
        
        logger.info("🏆 Training Complete!")
        logger.info(f"⏱️  Total training time: {training_time:.2f} seconds")
        logger.info(f"🧬 Elite pilot fitness: {elite_pilot.fitness:.2f}")
        logger.info(f"👥 Final generation: {server.current_generation}")
        
        # Save final report
        report = {
            'training_time': training_time,
            'final_generation': server.current_generation,
            'elite_fitness': elite_pilot.fitness,
            'elite_performance': elite_pilot.get_performance_stats(),
            'config': config.__dict__
        }
        
        report_path = Path("src/dgt_core/registry/training_report.json")
        report_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"📄 Training report saved to {report_path}")
        
    except KeyboardInterrupt:
        logger.info("⏹️  Training interrupted by user")
        
        # Save current best
        if server.elite_genomes:
            latest_elite = max(server.elite_genomes, key=lambda g: g.fitness)
            logger.info(f"💾 Saving current best: fitness {latest_elite.fitness:.2f}")
            server._save_elite_genome(elite_pilot, final=True)
    
    except Exception as e:
        logger.error(f"❌ Training failed: {e}")
        raise


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="DGT Headless Neuro-Evolution Training",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic training
  python train_headless.py --generations 50 --pop_size 20
  
  # Use all CPU cores
  python train_headless.py --generations 100 --cores 0
  
  # Custom configuration
  python train_headless.py --config my_config.json
  
  # High fitness threshold
  python train_headless.py --generations 200 --fitness_threshold 500000
  
  # Save configuration template
  python train_headless.py --save-config template.json
        """
    )
    
    # Training parameters
    parser.add_argument('--generations', type=int, default=100,
                       help='Maximum number of generations to train (default: 100)')
    parser.add_argument('--pop-size', type=int, default=50,
                       help='Population size per generation (default: 50)')
    parser.add_argument('--cores', type=int, default=0,
                       help='Number of CPU cores to use (0 = auto-detect, default: 0)')
    parser.add_argument('--duration', type=float, default=30.0,
                       help='Simulation duration per evaluation in seconds (default: 30.0)')
    parser.add_argument('--fitness-threshold', type=float, default=200000.0,
                       help='Auto-stop fitness threshold (default: 200000.0)')
    parser.add_argument('--snapshot-interval', type=int, default=5,
                       help='Save elite genome every N generations (default: 5)')
    
    # Configuration
    parser.add_argument('--config', type=str,
                       help='Load configuration from JSON file')
    parser.add_argument('--save-config', type=str,
                       help='Save configuration template to JSON file')
    
    # Logging
    parser.add_argument('--verbose', action='store_true',
                       help='Enable verbose logging')
    
    args = parser.parse_args()
    
    # Handle configuration template
    if args.save_config:
        save_config_template(args.save_config)
        return
    
    # Override core count
    if args.cores == 0:
        import multiprocessing as mp
        args.cores = mp.cpu_count()
    
    # Configure logging
    if args.verbose:
        logger.add("logs/headless_training.log", rotation="10 MB", level="DEBUG")
    else:
        logger.add("logs/headless_training.log", rotation="10 MB", level="INFO")
    
    # Run training
    run_headless_training(args)


if __name__ == "__main__":
    main()
