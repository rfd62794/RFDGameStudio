"""
Assets Layer (Tier 2C) - Asset Management

Asset loading, parsing, registry, and fabrication infrastructure:
- loader: Generic asset loader interface
- registry: Asset catalog and lookup
- parser: Asset format parsing (JSON, YAML, etc.)
- fabricator: Asset generation and synthesis
- loaders: Concrete implementations (TinyFarm, SpaceCombat, Generic)

Depends on: game_engine.core, game_engine.foundation, game_engine.config
"""

__all__ = []
