"""
Integration tests for Theater Architecture components.
Tests the SRP-compliant separation of Playbook, StageManager, and TheaterDirector.
"""

import pytest
from typing import Tuple, Optional

from src.logic.playbook import Playbook, Act, SceneType, PlaybookFactory
from src.core.stage_manager import StageManager, CueType, StageManagerFactory
from src.core.theater_director import TheaterDirector, DirectorState, TheaterDirectorFactory


class TestPlaybook:
    """Test the Playbook component (The Script)."""
    
    def test_playbook_creation(self):
        """Test playbook creation with Tavern Voyage script."""
        playbook = Playbook()
        
        assert len(playbook.acts) == 5
        assert playbook.current_act_index == 0
        assert not playbook.is_performance_complete
        
        # Check first act
        first_act = playbook.get_current_act()
        assert first_act is not None
        assert first_act.act_number == 1
        assert first_act.scene_type == SceneType.FOREST_EDGE
        assert first_act.target_position == (10, 25)
    
    def test_playbook_act_progression(self):
        """Test act progression through the script."""
        playbook = Playbook()
        
        # Initially on first act
        current_act = playbook.get_current_act()
        assert current_act.act_number == 1
        
        # Mark complete and advance
        playbook.mark_current_act_complete()
        success = playbook.advance_to_next_act()
        
        assert success
        assert playbook.current_act_index == 1
        
        # Should be on second act now
        current_act = playbook.get_current_act()
        assert current_act.act_number == 2
        assert current_act.scene_type == SceneType.TOWN_GATE
    
    def test_playbook_completion(self):
        """Test playbook completion flow."""
        playbook = Playbook()
        
        # Advance through all acts
        for i in range(len(playbook.acts)):
            playbook.mark_current_act_complete()
            if i < len(playbook.acts) - 1:  # Don't advance after last act
                success = playbook.advance_to_next_act()
                # The last advance_to_next_act() call will return False but set is_performance_complete
                if i == len(playbook.acts) - 2:  # Second to last act
                    assert success == True  # Should succeed
                elif i == len(playbook.acts) - 1:  # Last act - don't advance
                    break
        
        # Manually advance the last act to trigger completion
        if not playbook.is_performance_complete:
            playbook.advance_to_next_act()
        
        # Should be complete now
        assert playbook.is_performance_complete
        assert playbook.get_current_act() is None
        assert playbook.get_next_act() is None
    
    def test_playbook_reset(self):
        """Test playbook reset functionality."""
        playbook = Playbook()
        
        # Progress through some acts
        playbook.mark_current_act_complete()
        playbook.advance_to_next_act()
        playbook.mark_current_act_complete()
        
        # Reset
        playbook.reset_performance()
        
        # Should be back to start
        assert playbook.current_act_index == 0
        assert not playbook.is_performance_complete
        assert not playbook.acts[0].is_complete
    
    def test_playbook_factory(self):
        """Test playbook factory methods."""
        # Test tavern voyage creation
        tavern_playbook = PlaybookFactory.create_tavern_voyage()
        assert len(tavern_playbook.acts) == 5
        assert tavern_playbook.acts[0].scene_type == SceneType.FOREST_EDGE
        
        # Test empty playbook creation
        empty_playbook = PlaybookFactory.create_empty_playbook()
        assert len(empty_playbook.acts) == 0


class TestStageManager:
    """Test the StageManager component (The Stagehand)."""
    
    def test_stage_manager_creation(self):
        """Test stage manager creation."""
        stage_manager = StageManager()
        
        assert stage_manager.simulator is None
        assert stage_manager.world_map is None
        assert stage_manager.navigation_system is None
        assert len(stage_manager.active_effects) == 0
        
        # Check cue handlers are registered
        assert len(stage_manager.cue_handlers) == 5
        assert CueType.FOREST_TO_GATE in stage_manager.cue_handlers
    
    def test_cue_execution_validation(self):
        """Test cue execution with position validation."""
        stage_manager = StageManager()
        
        # Test valid cue at wrong position
        success = stage_manager.execute_cue("cue_forest_to_gate", (0, 0))
        assert not success  # Should fail - wrong position
        
        # Test unknown cue
        success = stage_manager.execute_cue("unknown_cue", (10, 25))
        assert not success  # Should fail - unknown cue
    
    def test_cue_execution_at_correct_positions(self):
        """Test cue execution at correct positions."""
        stage_manager = StageManager()
        
        # Test forest to gate at correct position
        success = stage_manager.execute_cue("cue_forest_to_gate", (10, 25))
        assert success  # Should succeed - correct position
        
        # Test gate to square at correct position
        success = stage_manager.execute_cue("cue_gate_to_square", (10, 20))
        assert success  # Should succeed - correct position
        
        # Test tavern entrance at correct position
        success = stage_manager.execute_cue("cue_tavern_entrance", (20, 10))
        assert success  # Should succeed - correct position
    
    def test_stage_effects(self):
        """Test stage effects management."""
        stage_manager = StageManager()
        
        # Add effects
        stage_manager._add_effect("test_effect", 5.0, {"param": "value"})
        stage_manager._add_effect("another_effect", 2.0, {"param": "value2"})
        
        assert len(stage_manager.active_effects) == 2
        
        # Update effects (simulate time passing)
        stage_manager.update_effects(3.0)  # 3 seconds pass
        
        # One effect should have expired
        assert len(stage_manager.active_effects) == 1
        assert stage_manager.active_effects[0].effect_type == "test_effect"
        
        # Clear all effects
        stage_manager.clear_all_effects()
        assert len(stage_manager.active_effects) == 0
    
    def test_stage_manager_factory(self):
        """Test stage manager factory methods."""
        # Test standard creation
        stage_manager = StageManagerFactory.create_stage_manager()
        assert isinstance(stage_manager, StageManager)
        
        # Test minimal creation
        minimal_manager = StageManagerFactory.create_minimal_stage_manager()
        assert isinstance(minimal_manager, StageManager)
        assert minimal_manager.simulator is None


class TestTheaterDirector:
    """Test the TheaterDirector component (The Director)."""
    
    def test_director_creation(self):
        """Test theater director creation."""
        playbook = Playbook()
        stage_manager = StageManager()
        director = TheaterDirector(playbook, stage_manager)
        
        assert director.playbook == playbook
        assert director.stage_manager == stage_manager
        assert director.current_state == DirectorState.WAITING_FOR_ACTOR
        assert director.current_act is None
    
    def test_performance_begin(self):
        """Test beginning a performance."""
        playbook = Playbook()
        stage_manager = StageManager()
        director = TheaterDirector(playbook, stage_manager)
        
        success = director.begin_performance()
        
        assert success
        assert director.current_state == DirectorState.WAITING_FOR_ACTOR
        assert director.current_act is not None
        assert director.current_act.act_number == 1
        assert director.performance_start_time is not None
    
    def test_actor_observation(self):
        """Test actor position observation."""
        playbook = Playbook()
        stage_manager = StageManager()
        director = TheaterDirector(playbook, stage_manager)
        
        director.begin_performance()
        
        # Observe actor at wrong position
        status = director.observe_actor_position((0, 0))
        assert status.current_state == DirectorState.WAITING_FOR_ACTOR
        assert status.distance_to_target > 0
        
        # Observe actor at target position - this should trigger cue execution and advance to next act
        target = director.get_current_target()
        assert target is not None
        
        status = director.observe_actor_position(target)
        # After executing cue, director advances to next act and returns to waiting state
        assert status.current_state in [DirectorState.ACTOR_AT_MARK, DirectorState.WAITING_FOR_ACTOR]
        assert status.last_cue_executed is not None  # Cue should have been executed
    
    def test_complete_performance_flow(self):
        """Test complete performance flow through all acts."""
        # Create complete production
        director, playbook, stage_manager = TheaterDirectorFactory.create_tavern_voyage_director()
        
        # Begin performance
        success = director.begin_performance()
        assert success
        
        # Walk through all acts
        positions = [(10, 25), (10, 20), (10, 10), (20, 10), (25, 30)]
        
        for position in positions:
            status = director.observe_actor_position(position)
            # After observation, director should be in one of these states:
            # - WAITING_FOR_ACTOR (normal after cue execution)
            # - EXECUTING_CUE (during cue execution)
            # - PERFORMANCE_COMPLETE (when finished)
            assert status.current_state in [DirectorState.WAITING_FOR_ACTOR, DirectorState.EXECUTING_CUE, DirectorState.PERFORMANCE_COMPLETE]
        
        # Should be complete now
        final_status = director.observe_actor_position((25, 30))
        assert final_status.current_state == DirectorState.PERFORMANCE_COMPLETE
        assert playbook.is_performance_complete
    
    def test_director_factory(self):
        """Test theater director factory methods."""
        # Test complete production creation
        director, playbook, stage_manager = TheaterDirectorFactory.create_tavern_voyage_director()
        
        assert isinstance(director, TheaterDirector)
        assert isinstance(playbook, Playbook)
        assert isinstance(stage_manager, StageManager)
        assert len(playbook.acts) == 5


class TestTheaterArchitectureIntegration:
    """Test integration of all Theater Architecture components."""
    
    def test_complete_tavern_voyage_performance(self):
        """Test complete Tavern Voyage performance from start to finish."""
        # Create production
        director, playbook, stage_manager = TheaterDirectorFactory.create_tavern_voyage_director()
        
        # Verify initial state
        assert not playbook.is_performance_complete
        assert director.current_state == DirectorState.WAITING_FOR_ACTOR
        
        # Begin performance
        success = director.begin_performance()
        assert success
        
        # Track performance progress
        acts_completed = 0
        positions = [(10, 25), (10, 20), (10, 10), (20, 10), (25, 30)]
        
        for position in positions:
            # Observe actor at position
            status = director.observe_actor_position(position)
            
            # Check if act was completed - cue execution means act completed
            if status.last_cue_executed:
                acts_completed += 1
            
            # Verify progress
            summary = director.get_performance_summary()
            assert summary['playbook']['completed_acts'] == acts_completed
        
        # Final verification
        assert playbook.is_performance_complete
        assert director.current_state == DirectorState.PERFORMANCE_COMPLETE
        
        final_summary = director.get_performance_summary()
        assert final_summary['playbook']['progress_percentage'] == 100.0
    
    def test_performance_summary(self):
        """Test performance summary generation."""
        director, playbook, stage_manager = TheaterDirectorFactory.create_tavern_voyage_director()
        
        director.begin_performance()
        
        # Get initial summary
        summary = director.get_performance_summary()
        
        assert 'playbook' in summary
        assert 'director' in summary
        assert 'current_target' in summary
        assert 'active_effects' in summary
        
        assert summary['playbook']['total_acts'] == 5
        assert summary['playbook']['completed_acts'] == 0
        assert summary['director']['state'] == DirectorState.WAITING_FOR_ACTOR.value
    
    def test_performance_reset(self):
        """Test performance reset functionality."""
        director, playbook, stage_manager = TheaterDirectorFactory.create_tavern_voyage_director()
        
        # Run partial performance
        director.begin_performance()
        director.observe_actor_position((10, 25))  # Complete first act
        
        # Reset
        director.reset_performance()
        
        # Verify reset state
        assert not playbook.is_performance_complete
        assert director.current_state == DirectorState.WAITING_FOR_ACTOR
        assert director.current_act is None
        assert director.last_known_position is None
        assert director.last_cue_executed is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
