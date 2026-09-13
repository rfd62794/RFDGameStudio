"""
Space Engine Dependency Injection Setup

Phase 1: Interface Definition & Hardening

Dependency injection configuration for the space engine components,
ensuring proper separation of concerns and testability.
"""

from typing import Dict, Any, Optional
from pathlib import Path
import sys

# Add src to path for absolute imports
src_path = Path(__file__).parent.parent.parent
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

from di.container import DIContainer, LifetimeScope
from di.exceptions import DIError
from foundation.interfaces.protocols import (
    PhysicsProtocol, SpaceEntityProtocol, ScrapProtocol,
    TerminalHandshakeProtocol, Result
)
from engines.space.physics_body import PhysicsBody
from engines.space.space_entity import SpaceEntity, EntityType
from engines.space.scrap_entity import ScrapEntity, ScrapLocker, ScrapType
from engines.space.terminal_handshake import TerminalHandshake
from engines.space.asteroids_strategy import AsteroidsStrategy


class SpaceEngineContainer:
    """Dependency injection container for space engine components"""
    
    def __init__(self):
        self.container = DIContainer()
        self._initialized = False
    
    def configure(self) -> Result[None]:
        """Configure all space engine dependencies"""
        try:
            # Register core components as singletons
            self.container.register_singleton(
                PhysicsProtocol, 
                PhysicsBody
            )
            
            self.container.register_singleton(
                ScrapProtocol,
                ScrapEntity
            )
            
            self.container.register_singleton(
                TerminalHandshakeProtocol,
                TerminalHandshake
            )
            
            # Register factory functions for entities
            self.container.register_factory(
                SpaceEntityProtocol,
                self._create_space_entity
            )
            
            # Register configuration
            self.container.register_instance(
                dict,
                self._get_space_config()
            )
            
            self._initialized = True
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to configure space DI: {str(e)}")
    
    def _create_space_entity(self, entity_type: str, position: tuple, velocity: tuple, heading: float) -> SpaceEntity:
        """Factory function for creating space entities"""
        entity_enum = EntityType(entity_type)
        pos_vector = self._tuple_to_vector(position)
        vel_vector = self._tuple_to_vector(velocity)
        
        return SpaceEntity(entity_enum, pos_vector, vel_vector, heading)
    
    def _tuple_to_vector(self, coord_tuple: tuple) -> 'Vector2':
        """Convert tuple to Vector2 (simplified for DI)"""
        # Import here to avoid circular dependency
        from foundation.vector import Vector2
        return Vector2(coord_tuple[0], coord_tuple[1])
    
    def _get_space_config(self) -> Dict[str, Any]:
        """Get space engine configuration"""
        return {
            'sovereign_width': 160,
            'sovereign_height': 144,
            'scrap_spawn_chance': 0.05,
            'max_scrap_lifetime': 60.0,
            'physics_update_rate': 60.0,
            'collision_margin': 1.0
        }
    
    def get_physics_engine(self) -> Result[PhysicsProtocol]:
        """Get configured physics engine"""
        if not self._initialized:
            return Result.failure_result("Container not initialized")
        
        return self.container.resolve(PhysicsProtocol)
    
    def get_scrap_system(self) -> Result[ScrapProtocol]:
        """Get configured scrap system"""
        if not self._initialized:
            return Result.failure_result("Container not initialized")
        
        return self.container.resolve(ScrapProtocol)
    
    def get_terminal_handshake(self) -> Result[TerminalHandshakeProtocol]:
        """Get configured terminal handshake"""
        if not self._initialized:
            return Result.failure_result("Container not initialized")
        
        return self.container.resolve(TerminalHandshakeProtocol)
    
    def create_entity(self, entity_type: str, position: tuple, velocity: tuple, heading: float) -> Result[SpaceEntityProtocol]:
        """Create a new space entity"""
        if not self._initialized:
            return Result.failure_result("Container not initialized")
        
        try:
            entity = self._create_space_entity(entity_type, position, velocity, heading)
            return Result.success_result(entity)
        except Exception as e:
            return Result.failure_result(f"Failed to create entity: {str(e)}")
    
    def initialize_all(self) -> Result[None]:
        """Initialize all registered dependencies"""
        if not self._initialized:
            return Result.failure_result("Container not configured")
        
        return self.container.initialize_all()
    
    def shutdown(self) -> Result[None]:
        """Shutdown container and cleanup resources"""
        try:
            # Dispose all singleton instances
            for interface, registration in self.container._registrations.items():
                if registration.lifetime == LifetimeScope.SINGLETON and registration.instance:
                    if hasattr(registration.instance, 'shutdown'):
                        shutdown_result = registration.instance.shutdown()
                        if not shutdown_result.success:
                            # Log error but continue shutdown
                            pass
            
            self._initialized = False
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to shutdown container: {str(e)}")


# Global container instance
_space_container = Optional[SpaceEngineContainer]


def get_space_container() -> SpaceEngineContainer:
    """Get or create global space engine container"""
    global _space_container
    if _space_container is None:
        _space_container = SpaceEngineContainer()
    return _space_container


def initialize_space_engine() -> Result[None]:
    """Initialize the space engine with all dependencies"""
    container = get_space_container()
    config_result = container.configure()
    if not config_result.success:
        return config_result
    
    return container.initialize_all()


def shutdown_space_engine() -> Result[None]:
    """Shutdown the space engine and cleanup resources"""
    container = get_space_container()
    return container.shutdown()
