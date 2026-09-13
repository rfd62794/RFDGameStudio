"""
Ship Genetics Proxy — Re-export from apps/rpg/logic/ship_genetics.py

With lazy __init__.py in apps.rpg, this can now use a clean import
instead of an importlib proxy.
"""

from dgt_engine.game_engine.ship_genetics import (
    HullType,
    WeaponType,
    EngineType,
    ShipComponent,
    ShipGenome,
    ShipGeneticRegistry,
    ship_genetic_registry,
)
