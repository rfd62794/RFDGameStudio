"""
Test suite for the unified simulator architecture.

Validates that the "Great Pruning" successfully eliminated drift and
created a single source of truth for both Terminal and GUI views.
"""

import pytest
import asyncio
import tempfile
from pathlib import Path
from unittest.mock import Mock, AsyncMock
from typing import List

from loguru import logger

from core.simulator import SimulatorHost, Observer, ActionResult, LLMResponse, ViewMode
from views.terminal_view import TerminalView
from views.gui_view import GUIView
from game_state import GameState


class MockObserver(Observer):
    """Mock observer for testing."""
    
    def __init__(self):
        self.state_changes = []
        self.action_results = []
        self.narratives = []
    
    def on_state_changed(self, state: GameState) -> None:
        self.state_changes.append(state)
    
    def on_action_result(self, result: ActionResult) -> None:
        self.action_results.append(result)
    
    def on_narrative_generated(self, prose: str) -> None:
        self.narratives.append(prose)


class TestIntentTaggingProtocol:
    """Test the Intent-Tagging Protocol bridge."""
    
    def test_valid_intent_parsing(self):
        """Test parsing valid player intents."""
        from core.simulator import IntentTaggingProtocol
        
        protocol = IntentTaggingProtocol()
        
        # Test attack intent
        response = protocol.parse_player_input("I attack the guard")
        assert response.intent == "attack"
        assert response.confidence > 0
        assert response.prose == "You prepare to attack"
        
        # Test talk intent
        response = protocol.parse_player_input("I want to talk to the bartender")
        assert response.intent == "talk"
        assert response.confidence > 0
    
    def test_invalid_intent_handling(self):
        """Test handling of invalid/unrecognized intents."""
        from core.simulator import IntentTaggingProtocol
        
        protocol = IntentTaggingProtocol()
        
        # Test gibberish input
        response = protocol.parse_player_input("asdfghjkl qwerty")
        assert response.intent == "unknown"
        assert response.confidence == 0
        assert "don't understand" in response.prose
    
    def test_intent_validation(self):
        """Test intent validation against allowed set."""
        from core.simulator import IntentTaggingProtocol
        
        protocol = IntentTaggingProtocol()
        
        # Valid intents
        assert protocol.validate_intent("attack") is True
        assert protocol.validate_intent("talk") is True
        assert protocol.validate_intent("investigate") is True
        
        # Invalid intents
        assert protocol.validate_intent("fly") is False
        assert protocol.validate_intent("teleport") is False
        assert protocol.validate_intent("unknown") is False


class TestSimulatorHost:
    """Test the unified SimulatorHost."""
    
    @pytest.fixture
    def temp_save_path(self):
        """Create temporary save file."""
        with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as f:
            yield Path(f.name)
    
    @pytest.fixture
    def simulator(self, temp_save_path):
        """Create simulator instance for testing."""
        simulator = SimulatorHost(save_path=temp_save_path)
        yield simulator
        simulator.stop()
    
    def test_initialization(self, temp_save_path):
        """Test simulator initialization."""
        simulator = SimulatorHost(save_path=temp_save_path)
        
        assert simulator.save_path == temp_save_path
        assert simulator.state is None  # Not initialized yet
        assert len(simulator.observers) == 0
        assert simulator.running is False
        
        simulator.stop()
    
    def test_observer_management(self, simulator):
        """Test adding and removing observers."""
        observer1 = MockObserver()
        observer2 = MockObserver()
        
        # Add observers
        simulator.add_observer(observer1)
        simulator.add_observer(observer2)
        assert len(simulator.observers) == 2
        
        # Remove observer
        simulator.remove_observer(observer1)
        assert len(simulator.observers) == 1
        assert simulator.observers[0] == observer2
    
    def test_initialization_success(self, simulator):
        """Test successful simulator initialization."""
        result = simulator.initialize()
        
        assert result is True
        assert simulator.state is not None
        assert simulator.arbiter is not None
        assert simulator.chronicler is not None
        assert simulator.quartermaster is not None
        assert simulator.loot_system is not None
    
    async def test_action_processing(self, simulator):
        """Test action processing pipeline."""
        # Initialize simulator
        assert simulator.initialize() is True
        
        # Process a simple action
        result = await simulator.process_action("I look around")
        
        assert isinstance(result, ActionResult)
        assert result.intent in simulator.intent_protocol.VALID_INTENTS
        assert result.turn_count >= 0
        assert isinstance(result.success, bool)
        assert isinstance(result.prose, str)
    
    def test_action_queue(self, simulator):
        """Test action queue functionality."""
        # Initialize simulator
        assert simulator.initialize() is True
        
        # Submit actions
        simulator.submit_action("I attack the guard")
        simulator.submit_action("I talk to the bartender")
        
        # Check queue (async, so we can't directly check contents)
        assert simulator.action_queue is not None


class TestObserverPattern:
    """Test the Observer pattern implementation."""
    
    @pytest.fixture
    def temp_save_path(self):
        """Create temporary save file."""
        with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as f:
            yield Path(f.name)
    
    @pytest.fixture
    def running_simulator(self, temp_save_path):
        """Create and start simulator for testing."""
        simulator = SimulatorHost(save_path=temp_save_path)
        assert simulator.initialize() is True
        yield simulator
        simulator.stop()
    
    def test_observer_notifications(self, running_simulator):
        """Test that observers receive notifications."""
        observer = MockObserver()
        running_simulator.add_observer(observer)
        
        # Trigger state change notification
        running_simulator.notify_state_changed()
        assert len(observer.state_changes) == 1
        
        # Trigger action result notification
        result = ActionResult(
            success=True,
            prose="Test narrative",
            intent="investigate",
            hp_delta=0,
            gold_delta=0,
            new_npc_state=None,
            target_npc=None,
            turn_count=1,
            narrative_seed="test"
        )
        running_simulator.notify_action_result(result)
        assert len(observer.action_results) == 1
        assert observer.action_results[0].intent == "investigate"
        
        # Trigger narrative notification
        running_simulator.notify_narrative("Test narrative")
        assert len(observer.narratives) == 1
        assert observer.narratives[0] == "Test narrative"


class TestTerminalView:
    """Test the Terminal view implementation."""
    
    @pytest.fixture
    def temp_save_path(self):
        """Create temporary save file."""
        with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as f:
            yield Path(f.name)
    
    @pytest.fixture
    def terminal_view(self, temp_save_path):
        """Create terminal view for testing."""
        simulator = SimulatorHost(save_path=temp_save_path)
        view = TerminalView(simulator)
        yield view
        simulator.stop()
    
    def test_terminal_view_initialization(self, terminal_view):
        """Test terminal view initialization."""
        assert terminal_view.simulator is not None
        assert terminal_view.console is not None
        assert terminal_view.running is False
        assert terminal_view.last_turn_count == 0
    
    def test_terminal_view_observer_interface(self, terminal_view):
        """Test that terminal view implements Observer interface."""
        assert hasattr(terminal_view, 'on_state_changed')
        assert hasattr(terminal_view, 'on_action_result')
        assert hasattr(terminal_view, 'on_narrative_generated')
        
        # Test that methods are callable
        assert callable(getattr(terminal_view, 'on_state_changed'))
        assert callable(getattr(terminal_view, 'on_action_result'))
        assert callable(getattr(terminal_view, 'on_narrative_generated'))


class TestGUIView:
    """Test the GUI view implementation."""
    
    @pytest.fixture
    def temp_save_path(self):
        """Create temporary save file."""
        with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as f:
            yield Path(f.name)
    
    @pytest.fixture
    def gui_view(self, temp_save_path):
        """Create GUI view for testing."""
        simulator = SimulatorHost(save_path=temp_save_path)
        view = GUIView(simulator)
        yield view
        simulator.stop()
    
    def test_gui_view_initialization(self, gui_view):
        """Test GUI view initialization."""
        assert gui_view.simulator is not None
        assert gui_view.root is not None
        assert gui_view.canvas is not None
        assert gui_view.narrative_text is not None
        assert gui_view.stats_frame is not None
        assert gui_view.running is False
    
    def test_gui_view_observer_interface(self, gui_view):
        """Test that GUI view implements Observer interface."""
        assert hasattr(gui_view, 'on_state_changed')
        assert hasattr(gui_view, 'on_action_result')
        assert hasattr(gui_view, 'on_narrative_generated')
        
        # Test that methods are callable
        assert callable(getattr(gui_view, 'on_state_changed'))
        assert callable(getattr(gui_view, 'on_action_result'))
        assert callable(getattr(gui_view, 'on_narrative_generated'))


class TestUnifiedArchitecture:
    """Test the unified architecture as a whole."""
    
    @pytest.fixture
    def temp_save_path(self):
        """Create temporary save file."""
        with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as f:
            yield Path(f.name)
    
    def test_single_source_of_truth(self, temp_save_path):
        """Test that there's only one source of truth for game state."""
        # Create simulator
        simulator = SimulatorHost(save_path=temp_save_path)
        assert simulator.initialize() is True
        
        # Create views
        terminal_view = TerminalView(simulator)
        gui_view = GUIView(simulator)
        
        # Both views observe the same simulator
        assert terminal_view.simulator is simulator
        assert gui_view.simulator is simulator
        
        # Both views get the same state reference
        terminal_state = terminal_view.simulator.get_state()
        gui_state = gui_view.simulator.get_state()
        assert terminal_state is gui_state  # Same object
        
        simulator.stop()
    
    def test_no_dual_logic_drift(self, temp_save_path):
        """Test that dual logic drift has been eliminated."""
        simulator = SimulatorHost(save_path=temp_save_path)
        assert simulator.initialize() is True
        
        # Create both views
        terminal_view = TerminalView(simulator)
        gui_view = GUIView(simulator)
        
        # Both views should have the same underlying logic
        # They don't have their own engines or state
        assert not hasattr(terminal_view, 'arbiter')
        assert not hasattr(terminal_view, 'chronicler')
        assert not hasattr(gui_view, 'arbiter')
        assert not hasattr(gui_view, 'chronicler')
        
        # They both observe the same simulator
        assert terminal_view.simulator.arbiter is not None
        assert gui_view.simulator.arbiter is not None
        assert terminal_view.simulator.arbiter is gui_view.simulator.arbiter
        
        simulator.stop()
    
    async def test_intent_tagging_bridge(self, temp_save_path):
        """Test that intent tagging properly bridges LLM to D20."""
        simulator = SimulatorHost(save_path=temp_save_path)
        assert simulator.initialize() is True
        
        # Process action through unified pipeline
        result = await simulator.process_action("I attack the guard")
        
        # Verify intent was properly tagged and processed
        assert result.intent == "attack"
        assert result.success is not None  # Deterministic outcome
        
        # Verify LLM never touched game state directly
        # The state should only be modified by the simulator
        assert simulator.state.turn_count > 0
        
        simulator.stop()


class TestPerformanceCharacteristics:
    """Test performance characteristics of the unified architecture."""
    
    @pytest.fixture
    def temp_save_path(self):
        """Create temporary save file."""
        with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as f:
            yield Path(f.name)
    
    async def test_action_processing_latency(self, temp_save_path):
        """Test that action processing latency is acceptable."""
        import time
        
        simulator = SimulatorHost(save_path=temp_save_path)
        assert simulator.initialize() is True
        
        # Measure action processing time
        start_time = time.time()
        result = await simulator.process_action("I look around")
        end_time = time.time()
        
        processing_time = (end_time - start_time) * 1000  # Convert to ms
        
        # Should be under 500ms for simple actions
        assert processing_time < 500, f"Action took {processing_time:.2f}ms"
        
        simulator.stop()
    
    def test_memory_usage_single_state(self, temp_save_path):
        """Test that only one game state instance exists."""
        import psutil
        import os
        
        simulator = SimulatorHost(save_path=temp_save_path)
        assert simulator.initialize() is True
        
        # Get memory usage
        process = psutil.Process(os.getpid())
        memory_before = process.memory_info().rss
        
        # Create multiple views (should not duplicate state)
        terminal_view = TerminalView(simulator)
        gui_view = GUIView(simulator)
        
        memory_after = process.memory_info().rss
        memory_increase = (memory_after - memory_before) / 1024 / 1024  # MB
        
        # Memory increase should be minimal (views are lightweight)
        assert memory_increase < 50, f"Memory increased by {memory_increase:.2f}MB"
        
        # Verify only one state instance
        assert simulator.state is not None
        assert id(simulator.state) == id(terminal_view.simulator.get_state())
        assert id(simulator.state) == id(gui_view.simulator.get_state())
        
        simulator.stop()


if __name__ == "__main__":
    # Configure logging for tests
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="DEBUG",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    # Run tests
    pytest.main([__file__, "-v"])
