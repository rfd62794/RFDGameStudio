"""
NEAT - NeuroEvolution of Augmenting Topologies
Self-learning neural network system for AI pilot evolution
"""

from .neat_engine import NEATEngine, NeuralNetwork, Genome
from .fitness import FitnessCalculator

__all__ = [
    "NEATEngine",
    "NeuralNetwork", 
    "Genome",
    "FitnessCalculator"
]
