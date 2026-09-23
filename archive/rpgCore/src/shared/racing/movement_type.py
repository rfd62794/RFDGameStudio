"""Movement type classification for slimes based on genome traits."""

from enum import Enum
from src.shared.genetics.genome import SlimeGenome

class MovementType(Enum):
    JUMPER = "jumper"
    scooter = "scooter"
    roller = "roller"

def classify_movement(genome: SlimeGenome) -> MovementType:
    """Classify slime movement type based on genome traits."""
    # Get body roundness from genome (assuming it exists)
    roundness = getattr(genome, 'body_roundness', 0.5)  # Default middle value
    energy = genome.energy  # Use energy instead of wobble_frequency
    size = 0.7  # Default medium size mapping
    
    # Convert size string to numeric
    size_values = {
        "tiny": 0.3, "small": 0.5, "medium": 0.7, 
        "large": 0.9, "massive": 1.0
    }
    size = size_values.get(genome.size, 0.7)
    
    # Roller: very round + large
    if roundness > 0.7 and size > 0.6:
        return MovementType.roller
    
    # Scooter: low energy + small
    if energy < 0.5 and size < 0.6:
        return MovementType.scooter
    
    # Default: jumper
    return MovementType.JUMPER
