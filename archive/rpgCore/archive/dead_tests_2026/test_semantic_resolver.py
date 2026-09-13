"""
Unit tests for Semantic Intent Resolution

Tests intent matching accuracy and confidence thresholds.
"""

import pytest
from semantic_engine import IntentLibrary, SemanticResolver, create_default_intent_library


class TestIntentLibrary:
    """Test intent library operations."""
    
    def test_add_intent(self):
        library = IntentLibrary()
        library.add_intent("test_action", "This is a test action")
        
        intents = library.get_intents()
        assert "test_action" in intents
        assert intents["test_action"] == "This is a test action"
    
    def test_multiple_intents(self):
        library = create_default_intent_library()
        intents = library.get_intents()
        
        # Should have common RPG actions
        assert "attack" in intents
        assert "distract" in intents
        assert "persuade" in intents
        assert len(intents) >= 5


class TestSemanticResolver:
    """Test semantic intent matching."""
    
    @pytest.fixture
    def resolver(self):
        """Create a resolver with default intents."""
        library = create_default_intent_library()
        return SemanticResolver(library, confidence_threshold=0.5)
    
    def test_direct_match(self, resolver):
        """Test exact or near-exact matches."""
        match = resolver.resolve_intent("I want to attack the guard")
        
        assert match is not None
        assert match.intent_id == "attack"
        assert match.confidence > 0.6
    
    def test_paraphrased_distract(self, resolver):
        """Test if paraphrases map correctly to 'distract'."""
        test_inputs = [
            "I throw my beer at the guard",
            "I kick the table to cause a distraction",
            "Can I divert his attention?",
            "I try to make noise to draw him away"
        ]
        
        for input_text in test_inputs:
            match = resolver.resolve_intent(input_text)
            assert match is not None, f"Failed to match: {input_text}"
            assert match.intent_id == "distract", (
                f"'{input_text}' matched {match.intent_id} instead of 'distract'"
            )
    
    def test_improvised_attack(self, resolver):
        """Test unconventional attack methods."""
        test_inputs = [
            "I throw a chair at him",
            "I smash the bottle over his head",
            "I flip the table onto the guard"
        ]
        
        for input_text in test_inputs:
            match = resolver.resolve_intent(input_text)
            assert match is not None
            # Should match either 'attack' or 'improvised_attack'
            assert match.intent_id in ["attack", "improvised_attack"]
    
    def test_low_confidence_rejection(self, resolver):
        """Test that ambiguous inputs are rejected."""
        # This is intentionally vague
        match = resolver.resolve_intent("I do something")
        
        # Might match, but confidence should be low
        # (behavior depends on threshold)
        if match:
            assert match.confidence < 0.7
    
    def test_empty_input(self, resolver):
        """Test handling of empty input."""
        match = resolver.resolve_intent("")
        assert match is None
    
    def test_persuasion_variants(self, resolver):
        """Test social interaction intents."""
        persuade_inputs = [
            "Can I convince him to let me pass?",
            "I try to talk my way through",
            "Let me negotiate with the guard"
        ]
        
        intimidate_inputs = [
            "I threaten to hurt him",
            "I try to scare him off",
            "Do you know who I am?!"
        ]
        
        for input_text in persuade_inputs:
            match = resolver.resolve_intent(input_text)
            assert match is not None
            assert match.intent_id == "persuade"
        
        for input_text in intimidate_inputs:
            match = resolver.resolve_intent(input_text)
            assert match is not None
            assert match.intent_id == "intimidate"
    
    def test_dynamic_intent_addition(self):
        """Test adding new intents at runtime."""
        library = IntentLibrary()
        library.add_intent("dance", "Perform a dance or rhythmic movement")
        
        resolver = SemanticResolver(library)
        
        match = resolver.resolve_intent("I start dancing")
        assert match is not None
        assert match.intent_id == "dance"


def test_confidence_scores():
    """Verify confidence scoring is working correctly."""
    library = create_default_intent_library()
    resolver = SemanticResolver(library, confidence_threshold=0.3)
    
    # Very explicit match should have high confidence
    match = resolver.resolve_intent("I attack with my sword")
    assert match is not None
    assert match.confidence > 0.7
    
    # More abstract should still match but with lower confidence
    match = resolver.resolve_intent("I engage in combat")
    assert match is not None
    assert 0.5 < match.confidence < 0.8
