"""
Engines Layer (Tier 2) - Core Game Engines

The main orchestration engines that drive game simulation:
- SyntheticRealityEngine: Cinematic orchestrator integrating all systems
- ChronosEngine: Time-based world evolution and progression
- D20Resolver: Deterministic D&D mechanics and rules
- SemanticResolver: Intent matching and semantic parsing
- NarrativeEngine: LLM-driven narration and storytelling
- PhysicsEngine: Physics simulation (2D/3D)
- RenderingEngine: Multi-modal rendering orchestration

Each engine can be used independently or composed together.

Depends on: game_engine.core, game_engine.foundation
"""

from src.game_engine.engines.base_engine import BaseEngine
from src.game_engine.engines.d20_core import D20Resolver, D20Result, DifficultyClass
from src.game_engine.engines.chronos import ChronosEngine, WorldEvent
from src.game_engine.engines.semantic_engine import SemanticResolver
from src.game_engine.engines.narrative_engine import NarrativeEngine
from src.game_engine.engines.synthetic_reality import SyntheticRealityEngine

__all__ = [
    # Base
    "BaseEngine",
    # D20 Rules
    "D20Resolver",
    "D20Result",
    "DifficultyClass",
    # Time Management
    "ChronosEngine",
    "WorldEvent",
    # Intent Parsing
    "SemanticResolver",
    # Narrative
    "NarrativeEngine",
    # Master Orchestrator
    "SyntheticRealityEngine",
]
