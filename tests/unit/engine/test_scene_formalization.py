"""
Tests for Scene Formalization Infrastructure
"""

import pytest
import pygame
from src.shared.engine.scene_context import SceneContext
from src.shared.engine.render_pipeline import RenderPipeline, RenderLayer
from src.shared.engine.input_router import InputRouter, InputPriority


class TestSceneContext:
    
    def test_scene_context_creation(self):
        """Test SceneContext can be created with all optional fields"""
        # Mock load_roster to avoid loading from file during test
        import unittest.mock
        with unittest.mock.patch('src.shared.teams.roster_save.load_roster', return_value=None):
            context = SceneContext()
            assert context.entity_registry is None
            assert context.game_session is None
            assert context.dispatch_system is None
            assert context.roster is None
            assert context.theme is None
    
    def test_scene_context_with_values(self):
        """Test SceneContext with actual values"""
        # Mock objects for testing
        mock_registry = type('MockRegistry', (), {})()
        mock_session = type('MockSession', (), {'resources': {}})()
        mock_dispatch = type('MockDispatch', (), {})()
        mock_roster = type('MockRoster', (), {})()
        mock_theme = type('MockTheme', (), {})()
        
        context = SceneContext(
            entity_registry=mock_registry,
            game_session=mock_session,
            dispatch_system=mock_dispatch,
            roster=mock_roster,
            theme=mock_theme
        )
        
        assert context.entity_registry == mock_registry
        assert context.game_session == mock_session
        assert context.dispatch_system == mock_dispatch
        assert context.roster == mock_roster
        assert context.theme == mock_theme
    
    def test_get_team_with_registry(self):
        """Test get_team method with entity registry"""
        mock_registry = type('MockRegistry', (), {
            'get_team': lambda self, role: [f'slime_{i}' for i in range(3)]
        })()
        
        context = SceneContext(entity_registry=mock_registry)
        team = context.get_team('dungeon')
        
        assert len(team) == 3
        assert team[0] == 'slime_0'
    
    def test_get_team_with_roster_fallback(self):
        """Test get_team method falls back to roster"""
        mock_team = type('MockTeam', (), {'members': ['slime_a', 'slime_b']})()
        mock_roster = type('MockRoster', (), {
            'get_dungeon_team': lambda self: mock_team
        })()
        
        context = SceneContext(roster=mock_roster)
        team = context.get_team('dungeon')
        
        assert len(team) == 2
        assert 'slime_a' in team
    
    def test_get_entity(self):
        """Test get_entity method"""
        mock_entity = type('MockEntity', (), {})()
        mock_registry = type('MockRegistry', (), {
            'get': lambda self, entity_id: mock_entity if entity_id == 'test_id' else None
        })()
        
        context = SceneContext(entity_registry=mock_registry)
        
        # Test existing entity
        entity = context.get_entity('test_id')
        assert entity == mock_entity
        
        # Test non-existing entity
        entity = context.get_entity('nonexistent')
        assert entity is None
    
    def test_add_resource(self):
        """Test add_resource method"""
        mock_session = type('MockSession', (), {'resources': {}})()
        context = SceneContext(game_session=mock_session)
        
        # Add new resource
        result = context.add_resource('gold', 100)
        assert result is True
        assert mock_session.resources['gold'] == 100
        
        # Add to existing resource
        result = context.add_resource('gold', 50)
        assert result is True
        assert mock_session.resources['gold'] == 150
    
    def test_get_resource(self):
        """Test get_resource method"""
        mock_session = type('MockSession', (), {'resources': {'gold': 200}})()
        context = SceneContext(game_session=mock_session)
        
        # Test existing resource
        amount = context.get_resource('gold')
        assert amount == 200
        
        # Test non-existing resource
        amount = context.get_resource('food')
        assert amount == 0


class TestRenderPipeline:
    
    def test_pipeline_creation(self):
        """Test RenderPipeline creation"""
        pipeline = RenderPipeline()
        assert pipeline.count_commands() == 0
    
    def test_submit_command(self):
        """Test submitting render commands"""
        pipeline = RenderPipeline()
        
        # Submit a command
        def draw_fn(surface):
            surface.fill((255, 0, 0))
        
        pipeline.submit(RenderLayer.BACKGROUND, draw_fn)
        assert pipeline.count_commands() == 1
    
    def test_execute_commands(self):
        """Test executing render commands in order"""
        pipeline = RenderPipeline()
        
        # Create test surface
        surface = pygame.Surface((100, 100))
        original_color = surface.get_at((0, 0))
        
        # Submit commands in wrong order
        pipeline.submit(RenderLayer.ENTITIES, lambda s: s.fill((0, 255, 0)))  # Should execute second
        pipeline.submit(RenderLayer.BACKGROUND, lambda s: s.fill((255, 0, 0)))  # Should execute first
        
        # Execute pipeline
        pipeline.execute(surface)
        
        # Background (layer 0) should be drawn first, then Entities (layer 2)
        # So the final color should be from the Entities layer
        final_color = surface.get_at((0, 0))
        assert final_color == (0, 255, 0)  # Green entities on top
        
        # Pipeline should be cleared after execution
        assert pipeline.count_commands() == 0
    
    def test_z_order_within_layer(self):
        """Test z-ordering within the same layer"""
        pipeline = RenderPipeline()
        
        surface = pygame.Surface((100, 100))
        
        # Submit commands with different z-orders
        pipeline.submit(RenderLayer.UI, lambda s: s.fill((255, 0, 0)), z_order=1)  # Should execute second
        pipeline.submit(RenderLayer.UI, lambda s: s.fill((0, 255, 0)), z_order=2)  # Should execute third
        pipeline.submit(RenderLayer.UI, lambda s: s.fill((0, 0, 255)), z_order=0)  # Should execute first
        
        pipeline.execute(surface)
        
        # Highest z-order should be visible
        final_color = surface.get_at((0, 0))
        assert final_color == (0, 255, 0)  # Green (z_order=2)
    
    def test_clear_pipeline(self):
        """Test clearing pipeline without execution"""
        pipeline = RenderPipeline()
        
        # Add commands
        pipeline.submit(RenderLayer.BACKGROUND, lambda s: None)
        pipeline.submit(RenderLayer.ENTITIES, lambda s: None)
        
        assert pipeline.count_commands() == 2
        
        # Clear pipeline
        pipeline.clear()
        assert pipeline.count_commands() == 0


class TestInputRouter:
    
    def test_router_creation(self):
        """Test InputRouter creation"""
        router = InputRouter()
        assert router.get_handler_count() == 0
    
    def test_register_handler(self):
        """Test registering input handlers"""
        router = InputRouter()
        
        class TestHandler:
            def handle_event(self, event):
                return event.type == pygame.KEYDOWN
        
        handler = TestHandler()
        router.register(handler, priority=10)
        
        assert router.get_handler_count() == 1
        
        # Check handlers by priority
        handlers = router.get_handlers_by_priority(10)
        assert len(handlers) == 1
        assert handlers[0] == handler
    
    def test_priority_ordering(self):
        """Test handlers are ordered by priority"""
        router = InputRouter()
        
        class HighPriorityHandler:
            def handle_event(self, event):
                return True  # Always consumes
        
        class LowPriorityHandler:
            def handle_event(self, event):
                return False  # Never consumes
        
        high_handler = HighPriorityHandler()
        low_handler = LowPriorityHandler()
        
        # Register in wrong order
        router.register(low_handler, priority=1)
        router.register(high_handler, priority=10)
        
        # Should still be ordered by priority
        handlers = router.get_handlers_by_priority(10)
        assert handlers[0] == high_handler
        
        handlers = router.get_handlers_by_priority(1)
        assert handlers[0] == low_handler
    
    def test_route_event_consumed(self):
        """Test event routing when consumed"""
        router = InputRouter()
        
        class ConsumingHandler:
            def handle_event(self, event):
                return True  # Consumes event
        
        class NonConsumingHandler:
            def handle_event(self, event):
                return False  # Doesn't consume
        
        consuming = ConsumingHandler()
        non_consuming = NonConsumingHandler()
        
        # Register with same priority
        router.register(consuming, priority=5)
        router.register(non_consuming, priority=5)
        
        event = pygame.event.Event(pygame.KEYDOWN)
        
        # Event should be consumed by first handler
        result = router.route(event)
        assert result is True
    
    def test_route_event_not_consumed(self):
        """Test event routing when not consumed"""
        router = InputRouter()
        
        class NonConsumingHandler:
            def handle_event(self, event):
                return False  # Doesn't consume
        
        handler = NonConsumingHandler()
        router.register(handler, priority=5)
        
        event = pygame.event.Event(pygame.KEYDOWN)
        
        # Event should not be consumed
        result = router.route(event)
        assert result is False
    
    def test_unregister_handler(self):
        """Test unregistering handlers"""
        router = InputRouter()
        
        class TestHandler:
            def handle_event(self, event):
                return True
        
        handler = TestHandler()
        router.register(handler, priority=5)
        
        assert router.get_handler_count() == 1
        
        router.unregister(handler)
        assert router.get_handler_count() == 0
    
    def test_clear_router(self):
        """Test clearing all handlers"""
        router = InputRouter()
        
        class TestHandler:
            def handle_event(self, event):
                return True
        
        router.register(TestHandler(), priority=5)
        router.register(TestHandler(), priority=10)
        
        assert router.get_handler_count() == 2
        
        router.clear()
        assert router.get_handler_count() == 0


class TestInputPriority:
    
    def test_priority_constants(self):
        """Test InputPriority constants"""
        assert InputPriority.OVERLAY == 100
        assert InputPriority.MODAL == 100
        assert InputPriority.UI_COMPONENTS == 50
        assert InputPriority.ENTITY_SELECTION == 25
        assert InputPriority.SCENE_DEFAULT == 0
        assert InputPriority.DEBUG == -10
