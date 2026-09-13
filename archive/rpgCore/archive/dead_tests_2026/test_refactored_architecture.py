"""
Test Suite for Refactored Domain-Driven Design Architecture

Tests the clean separation of concerns and verifies that:
1. D20 Core handles only deterministic logic
2. Engine is just an orchestrator
3. Narrator only handles creative output
4. World Factory manages locations
5. Character Factory creates archetypes
"""

import pytest
from unittest.mock import Mock, patch

from d20_core import D20Resolver, D20Result
from engine import GameEngine
from narrator import Narrator
from world_factory import WorldFactory
from character_factory import CharacterFactory
from game_state import GameState, PlayerStats, Room, NPC


class TestD20Core:
    """Test the deterministic D20 rules engine."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.resolver = D20Resolver()
        self.game_state = GameState()
        self.game_state.player.attributes = {"strength": 14, "dexterity": 12, "intelligence": 10, "charisma": 8}
    
    def test_resolve_action_success(self):
        """Test successful action resolution."""
        room_tags = ["Dimly Lit"]
        
        with patch('random.randint', return_value=15):  # Force good roll
            result = self.resolver.resolve_action(
                intent_id="investigate",
                player_input="I search the room",
                game_state=self.game_state,
                room_tags=room_tags
            )
        
        assert isinstance(result, D20Result)
        assert result.roll == 15
        assert result.total_score == 25  # 15 roll + 10 int bonus
        assert result.success is True
        assert result.hp_delta == 0
        assert "investigate" in result.narrative_context.lower()
    
    def test_resolve_action_failure(self):
        """Test failed action resolution."""
        room_tags = ["Dimly Lit"]
        
        with patch('random.randint', return_value=3):  # Force bad roll
            result = self.resolver.resolve_action(
                intent_id="investigate",
                player_input="I search the room",
                game_state=self.game_state,
                room_tags=room_tags
            )
        
        assert result.success is False
        assert result.hp_delta < 0  # Should take damage on failure
        assert result.roll == 3
    
    def test_reputation_changes(self):
        """Test reputation delta calculations."""
        result = self.resolver.resolve_action(
            intent_id="combat",
            player_input="I attack the guard",
            game_state=self.game_state,
            room_tags=[],
            target_npc="Guard"
        )
        
        assert "law" in result.reputation_deltas
        assert result.reputation_deltas["law"] < 0  # Combat hurts law reputation
    
    def test_relationship_changes(self):
        """Test NPC relationship changes."""
        result = self.resolver.resolve_action(
            intent_id="charm",
            player_input="I persuade the bartender",
            game_state=self.game_state,
            room_tags=[],
            target_npc="Bartender"
        )
        
        assert "Bartender" in result.relationship_changes
        assert result.relationship_changes["Bartender"]["disposition"] > 0


class TestGameEngine:
    """Test the thin orchestrator engine."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.engine = GameEngine(personality="curious")
    
    @patch('engine.Narrator')
    @patch('engine.D20Resolver')
    @patch('engine.SemanticResolver')
    def test_engine_orchestration(self, mock_semantic, mock_d20, mock_narrator):
        """Test that engine just orchestrates between modules."""
        # Mock the dependencies
        mock_semantic.return_value.resolve_intent.return_value = Mock(
            intent_id="investigate",
            confidence=0.8
        )
        mock_d20.return_value.resolve_action.return_value = D20Result(
            success=True,
            roll=15,
            total_score=25,
            difficulty_class=20,
            hp_delta=0,
            reputation_deltas={},
            relationship_changes={},
            npc_state_changes={},
            goals_completed=[],
            narrative_context="Success!"
        )
        
        # Test orchestration - create a mock async function
        async def mock_process():
            return await self.engine.process_action("I search the room")
        
        # Run the async test
        import asyncio
        result = asyncio.run(mock_process())
        
        assert result is True  # Should continue game
        mock_semantic.return_value.resolve_intent.assert_called_once()
        mock_d20.return_value.resolve_action.assert_called_once()


class TestWorldFactory:
    """Test the world location factory."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.factory = WorldFactory()
    
    def test_get_location(self):
        """Test getting a location from template."""
        room = self.factory.get_location("tavern")
        
        assert isinstance(room, Room)
        assert room.name == "The Rusty Flagon"
        assert "Sticky Floors" in room.tags
        assert len(room.npcs) > 0
        assert "Bartender" in [npc.name for npc in room.npcs]
    
    def test_load_scenario(self):
        """Test loading a scenario blueprint."""
        game_state = GameState()
        self.factory.load_scenario("heist", game_state)
        
        assert len(game_state.rooms) > 0
        assert "tavern" in game_state.rooms
        assert len(game_state.goal_stack) > 0
        assert game_state.current_room == "tavern"


class TestCharacterFactory:
    """Test the character archetype factory."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.factory = CharacterFactory()
    
    def test_create_character(self):
        """Test creating a character from archetype."""
        player = self.factory.create("cunning")
        
        assert isinstance(player, PlayerStats)
        assert player.attributes["dexterity"] == 18  # Cunning has high dex
        assert player.attributes["strength"] == 10
        assert len(player.inventory) > 0
        assert "lockpicks" in [item.name for item in player.inventory]
    
    def test_archetype_balance(self):
        """Test that archetypes have balanced stat arrays."""
        for archetype_name in self.factory.list_archetypes():
            archetype = self.factory.get_archetype_info(archetype_name)
            
            # Check that stats are reasonable
            total_stats = sum(archetype.stat_array.values())
            assert 40 <= total_stats <= 80  # Reasonable point buy range
            
            # Check that each stat is in valid range
            for stat_value in archetype.stat_array.values():
                assert 8 <= stat_value <= 18  # Standard D&D range
    
    def test_skill_proficiencies(self):
        """Test that archetypes have appropriate skills."""
        cunning = self.factory.get_archetype_info("cunning")
        assert "stealth" in cunning.skill_proficiencies
        assert "finesse" in cunning.skill_proficiencies
        
        diplomatic = self.factory.get_archetype_info("diplomatic")
        assert "charm" in diplomatic.skill_proficiencies
        assert "persuade" in diplomatic.skill_proficiencies


class TestNarrator:
    """Test the narrative engine."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.narrator = Narrator()
    
    @patch('sync_engines.ChroniclerEngine')
    def test_narrative_generation(self, mock_chronicler):
        """Test that narrator translates D20 results to narrative."""
        # Mock the chronicler
        mock_chronicler.return_value.narrate_stream.return_value = iter([
            "You", " search", " the", " room", " carefully", "..."
        ])
        
        # Create test D20 result
        d20_result = D20Result(
            success=True,
            roll=15,
            total_score=25,
            difficulty_class=20,
            hp_delta=0,
            reputation_deltas={},
            relationship_changes={},
            npc_state_changes={},
            goals_completed=[],
            narrative_context="Roll: 15, Intelligence: +10, vs DC 20"
        )
        
        # Test narrative generation
        async def test_narrative():
            narrative_tokens = []
            async for token in self.narrator.narrate_stream(
                player_input="I search the room",
                intent_id="investigate",
                d20_result=d20_result,
                context="You are in a tavern."
            ):
                narrative_tokens.append(token)
            
            narrative = "".join(narrative_tokens)
            return narrative, narrative_tokens
        
        # Run the async test
        import asyncio
        narrative, narrative_tokens = asyncio.run(test_narrative())
        
        assert len(narrative) > 0
        assert len(narrative_tokens) > 0
        mock_chronicler.return_value.narrate_stream.assert_called_once()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
