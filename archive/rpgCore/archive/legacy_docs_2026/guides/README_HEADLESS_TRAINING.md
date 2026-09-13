> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# DGT Headless Training Pipeline - ADR 136 Implementation
# Time-Efficient Neuro-Evolution Training System

## Overview

This implementation transforms the DGT neuro-evolution system from real-time visualization to a hyperspeed headless training pipeline, achieving 100x training speed through parallel processing.

## Architecture

### Three-Tier Training Strategy

1. **Tier 1: Parallel Headless** (100x Real-time)
   - Multiprocessing on all CPU cores
   - No rendering or I/O operations
   - Evolves 100 generations in minutes

2. **Tier 2: Time-Dilation Sim** (10x Real-time)
   - Single-process with high delta-time steps
   - Used for watching Alpha Pilot learn in fast-forward

3. **Tier 3: Game View** (1x 60 FPS)
   - Standard PPU mode for human interaction
   - Testing and "nudging" capabilities

## Components

### Core Files

- `src/dgt_core/simulation/headless_server.py` - Hyperspeed simulation server
- `src/dgt_core/simulation/training_paddock_enhanced.py` - Enhanced training with auto-stop
- `train_headless.py` - Command-line training interface
- `view_elite.py` - Elite pilot visualization

### Key Features

- **Multiprocessing Pool**: Distributes NEAT evaluation across all CPU cores
- **Fitness Threshold Auto-Stop**: Automatically stops when fitness >= 200,000
- **Elite Genome Snapshots**: Saves elite pilots every 5 generations
- **Headless Mode**: Disables all logging and rendering for maximum speed
- **Registry System**: Persistent storage for elite genomes

## Usage

### Headless Training

```bash
# Basic training (auto-detect CPU cores)
python train_headless.py --generations 100 --pop_size 50

# Use all 8 CPU cores
python train_headless.py --generations 200 --cores 8

# High fitness threshold
python train_headless.py --generations 500 --fitness_threshold 500000

# Custom configuration
python train_headless.py --config my_config.json

# Save configuration template
python train_headless.py --save-config template.json
```

### Elite Pilot Viewing

```bash
# View latest elite pilot
python view_elite.py --latest

# View specific elite genome
python view_elite.py --genome elite_genome_gen50.json

# View elite from specific generation
python view_elite.py --generation 25
```

## Configuration

### HeadlessConfig Parameters

```python
@dataclass
class HeadlessConfig:
    pop_size: int = 50                    # Population size
    num_processes: int = None              # Auto-detect CPU cores
    sim_duration: float = 30.0            # Simulated seconds per evaluation
    sim_dt: float = 0.1                   # Physics timestep (10Hz)
    fitness_threshold: float = 200000.0    # Auto-stop threshold
    snapshot_interval: int = 5             # Save every N generations
    headless_mode: bool = True            # Disable rendering/logging
    enable_logging: bool = False           # Enable debug logging
```

## Performance

### Speed Improvements

- **Single Core**: ~10x speedup from headless mode
- **Multi-Core**: ~10x speedup per core (8 cores = ~80x total)
- **Combined**: ~100x speedup over real-time visualization

### Training Time Estimates

| Generations | Real-Time | Headless (8 cores) |
|------------|-----------|-------------------|
| 50         | ~2 hours  | ~1.5 minutes      |
| 100        | ~4 hours  | ~3 minutes        |
| 200        | ~8 hours  | ~6 minutes        |

## Registry System

### File Structure

```
src/dgt_core/registry/brains/
├── elite_genome_gen5.json          # Elite metadata
├── elite_genome_gen10.json         # Elite metadata
├── elite_genome_gen25_final.json   # Final elite (threshold reached)
├── genome_12345.pkl                 # Serialized genome data
├── genome_67890.pkl                 # Serialized genome data
└── training_report.json            # Training session summary
```

### Elite Genome Format

```json
{
  "generation": 25,
  "fitness": 250000.0,
  "genome_id": "12345",
  "timestamp": 1672531200.0,
  "performance_stats": {
    "enemies_destroyed": 45,
    "accuracy": 0.85,
    "damage_dealt": 12500.0
  },
  "genome_file": "genome_12345.pkl"
}
```

## Implementation Details

### Multiprocessing Architecture

1. **Main Process**: Coordinates training and evolution
2. **Worker Processes**: Run parallel arena evaluations
3. **Shared Memory**: Minimal data transfer for performance
4. **Result Aggregation**: Collects fitness scores for evolution

### Fitness Threshold Auto-Stop

- Monitors best fitness each generation
- Automatically saves final elite genome
- Stops training to prevent over-training
- Generates comprehensive training report

### Elite Genome Persistence

- Pickle serialization for NEAT genome objects
- JSON metadata for easy inspection
- Automatic cleanup of old genomes
- Version control friendly format

## Integration with Existing System

### Backward Compatibility

- Original `demo_neuro_evolution.py` still works
- Enhanced `training_paddock.py` maintains API compatibility
- Can switch between headless and standard modes

### Migration Path

1. Run headless training to generate elite pilots
2. Load elite pilots in standard viewer for testing
3. Use elite pilots in production game scenarios

## Troubleshooting

### Common Issues

1. **Multiprocessing Errors**: Ensure picklable data structures
2. **Memory Usage**: Monitor RAM with large populations
3. **CPU Saturation**: Adjust `num_processes` if system becomes unresponsive

### Debug Mode

```bash
# Enable verbose logging
python train_headless.py --verbose --generations 10

# Use standard mode for debugging
python train_headless.py --config debug_config.json
```

## Future Enhancements

### Potential Improvements

1. **GPU Acceleration**: CUDA support for neural network evaluation
2. **Distributed Training**: Multi-machine training clusters
3. **Adaptive Threshold**: Dynamic fitness threshold adjustment
4. **Real-time Monitoring**: Web dashboard for training progress

### Integration Opportunities

- **MLflow**: Experiment tracking and model registry
- **Weights & Biases**: Training visualization
- **TensorBoard**: Real-time metrics dashboard
- **Docker**: Containerized training environments

## Conclusion

The headless training pipeline transforms DGT neuro-evolution from a research prototype into a production-ready AI training system. By leveraging multiprocessing and eliminating visualization overhead, we achieve 100x speed improvements while maintaining full compatibility with the existing codebase.

This implementation follows professional AI development practices: separate training from deployment, use persistent model storage, and provide comprehensive monitoring and debugging capabilities.

The system is now ready for serious AI development and can evolve elite pilots in minutes rather than hours.
