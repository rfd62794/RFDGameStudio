import os
import pytest
from src.apps.last_appointment.scenes.appointment_scene import AppointmentScene
from src.shared.engine.scene_manager import SceneManager
from src.shared.ui.spec import SPEC_720

class DummyManager:
    width = 800
    height = 600

@pytest.fixture
def scene():
    # Make sure we don't try to initialize pygame displays in tests
    os.environ["PYTEST_CURRENT_TEST"] = "1"
    os.environ["SDL_VIDEODRIVER"] = "dummy"
    manager = DummyManager()
    return AppointmentScene(manager, SPEC_720)

def test_graph_loading(scene):
    scene.on_enter()
    assert scene.current_node is not None
    assert scene.current_node.node_id == "beat_1"
    # Beat 1 should have 5 responses
    assert len(scene.available_edges) == 5
    assert len(scene.graph.nodes) == 21

def test_stance_tracking_and_advancement(scene):
    scene.on_enter()
    
    # We shouldn't need a real pygame object, just mock the choices.
    # We can invoke make_choice directly on the graph or simulate the keys if we want.
    # It's easier to simulate the choice directly on the graph or call handle_events with a mock event
    class MockEvent:
        def __init__(self, key):
            import pygame
            self.type = pygame.KEYDOWN
            self.key = key
            
    import pygame
    
    # CardLayout needs to finish fading in before it accepts input conceptually, 
    # but keyboard input in the scene currently bypasses that check:
    # "if pygame.K_1 <= event.key <= pygame.K_5: ... self._handle_choice_selection(idx)"
    # Wait, _handle_choice_selection checks `not self.card_layout.is_fading_in`.
    # Let's cleanly skip animations.
    scene.text_window.skip_reveal()
    scene.update(16) # state machine step to trigger load_edges
    scene.card_layout.skip_animations()
    
    # Press '1', which corresponds to K_1 and "PROFESSIONAL"
    events = [MockEvent(pygame.K_1)]
    scene.handle_events(events)
    
    # Should flag the stance and move to NPC_RESPONSE phase
    assert scene.state_tracker.get_flag("current_stance", "") == "PROFESSIONAL"
    
    # Needs to fade out before switching phase now
    assert scene.card_layout.is_fading_out == True
    
    # Finish fade out
    scene.card_layout.skip_animations()
    scene.update(16) # Let state machine process the clear
        
    assert scene.phase == "NPC_RESPONSE"
    
    # Simulate text reveal finishing
    scene.text_window.skip_reveal()
    scene.update(16) # Give state machine a tick to detect text is finished
    
    # Press any key to advance
    # The event handler uses left click 
    class MockMouseEvent:
        def __init__(self, button):
            import pygame
            self.type = pygame.MOUSEBUTTONDOWN
            self.button = button
            
    scene.handle_events([MockMouseEvent(1)])
    
    # No cards to fade during NPC_RESPONSE, so no fade out happens.
    # Should advance to beat_2_pro immediately.
    assert scene.current_node.node_id == "beat_2_pro"
    assert scene.phase == "PROMPT"
    
    # Next prompt loads immediately. Wait for text to finish, then cards.
    scene.text_window.skip_reveal()
    scene.update(16) # load cards
    scene.card_layout.skip_animations()
    
    # beat_2_pro has 5 options. Let's pick 1 again (PROFESSIONAL), which leads to beat_3_pro
    events = [MockEvent(pygame.K_1)]
    scene.handle_events(events)
    
    # Beat 2's options do NOT have npc_response in the current JSON.
    # It will trigger fade out first.
    assert scene.card_layout.is_fading_out == True
    scene.card_layout.skip_animations()
    scene.update(16) # state machine clears cards and advances
    
    # It advances immediately
    assert scene.current_node.node_id == "beat_3_pro"
    assert scene.phase == "PROMPT"

def test_invalid_key_does_not_advance(scene):
    scene.on_enter()
    scene.text_window.skip_reveal()
    scene.update(16)  # load cards 
    scene.card_layout.skip_animations()
    
    class MockEvent:
        def __init__(self, key):
            import pygame
            self.type = pygame.KEYDOWN
            self.key = key
            
    import pygame
    
    # Press an invalid key like '9'
    events = [MockEvent(pygame.K_9)]
    scene.handle_events(events)
    
    # Should remain on beat_1
    assert scene.current_node.node_id == "beat_1"


def test_beat_4_loading_and_wildcard_routing(scene):
    """Verify that Beat 4 loads correctly and wildcards route effectively"""
    scene.on_enter()
    
    # Check that Beat 4 nodes exist
    stances = ["pro", "weary", "curious", "reluctant", "moved"]
    for stance in stances:
        node_id = f"beat_4_{stance}"
        assert node_id in scene.graph.nodes
        node = scene.graph.nodes[node_id]
        
        # Verify prompt
        assert node.text == 'The Client states: "You\'ve been doing this alone for a very long time."'
        
        # Verify 5 responses exist
        assert len(node.edges) == 5
        
    # Verify Wildcard routing across rivers (Index 4 is the Wildcard)
    # Professional wildcard -> Curious closing
    assert scene.graph.nodes["beat_4_pro"].edges[4].target_node == "end_curious"
    
    # Weary wildcard -> Moved closing
    assert scene.graph.nodes["beat_4_weary"].edges[4].target_node == "end_moved"
    
    # Curious wildcard -> Moved closing
    assert scene.graph.nodes["beat_4_curious"].edges[4].target_node == "end_moved"
    
    # Reluctant wildcard -> Moved closing
    assert scene.graph.nodes["beat_4_reluctant"].edges[4].target_node == "end_moved"
    
    # Moved wildcard -> Moved closing
    assert scene.graph.nodes["beat_4_moved"].edges[4].target_node == "end_moved"

def test_dialogue_card_state():
    import pygame
    from src.apps.last_appointment.ui.dialogue_card import DialogueCard
    pygame.font.init() # Ensure font is initialized for mock
    rect = pygame.Rect(10, 10, 100, 40)
    card = DialogueCard(1, "Test text", "WEARY", rect)
    
    assert card.hover_state == False
    assert card.selected_state == False
    
    # Test Hover
    is_hovered = card.handle_hover((20, 20))
    assert is_hovered == True
    assert card.hover_state == True
    assert card.visual_rect.y == 7 # 3px shift
    
    # Test Un-hover
    is_hovered = card.handle_hover((200, 200))
    assert is_hovered == False
    assert card.hover_state == False
    assert card.visual_rect.y == 10
    
    # Test Select
    card.select()
    assert card.selected_state == True

def test_card_layout_hover():
    import pygame
    from src.apps.last_appointment.ui.card_layout import CardLayout
    from src.shared.narrative.conversation_graph import Edge
    
    layout = CardLayout(800, 600)
    edges = [Edge("target_1", "Response 1"), Edge("target_2", "Response 2")]
    layout.load_edges(edges)
    
    assert len(layout.cards) == 2
    
    layout.skip_animations()
    assert not layout.is_fading_in
    
    # Card 1 rect will be around margin_x (60), y starts at int(600 * 0.55) = 330
    hover_pos = (70, 340)
    layout.handle_hover(hover_pos)
    
    assert layout.cards[0].hover_state == True
    assert layout.cards[1].hover_state == False
    
    # Click card 0
    idx = layout.handle_click(hover_pos)
    assert idx == 0
    assert layout.cards[0].selected_state == True

def test_fade_sequencing():
    from src.apps.last_appointment.ui.card_layout import CardLayout
    from src.shared.narrative.conversation_graph import Edge
    
    layout = CardLayout(800, 600)
    edges = [Edge(f"target_{i}", f"Response {i}") for i in range(5)]
    layout.load_edges(edges)
    
    # Initial state
    assert layout.is_fading_in == True
    assert all(c.fade_alpha == 0 for c in layout.cards)
    
    # Advance to just after card 0 starts, but before card 1 starts
    layout.update(100) # 0.1s
    assert layout.cards[0].fade_alpha > 0 
    assert layout.cards[1].fade_alpha == 0
    
    # Advance to card 1 appearing
    layout.update(100) # 0.2s total (card 1 starts at 0.15s)
    assert layout.cards[0].fade_alpha > 0
    assert layout.cards[1].fade_alpha > 0
    assert layout.cards[2].fade_alpha == 0
    
    # Fully settle
    layout.skip_animations()
    assert not layout.is_fading_in
    assert all(c.fade_alpha == 255 for c in layout.cards)

def test_numpad_keys_map_to_actions(scene):
    scene.on_enter()
    scene.text_window.skip_reveal()
    scene.update(16)
    scene.card_layout.skip_animations()
    
    import pygame
    class MockEvent:
        def __init__(self, key):
            self.type = pygame.KEYDOWN
            self.key = key
            
    # Press KP_1 (NumPad 1)
    scene.handle_events([MockEvent(pygame.K_KP1)])
    
    # Should trigger choice 1 (PROFESSIONAL)
    assert scene.state_tracker.get_flag("current_stance", "") == "PROFESSIONAL"
    assert scene.card_layout.is_fading_out == True

def test_card_text_wraps_at_max_width():
    import pygame
    from src.apps.last_appointment.ui.dialogue_card import DialogueCard
    pygame.font.init()
    
    # Large enough width but very long text
    rect = pygame.Rect(0, 0, 200, 44)
    long_text = "This is a very long text that should definitely wrap into multiple lines when rendered in a card with limited width."
    card = DialogueCard(1, long_text, "PROFESSIONAL", rect)
    
    # The number of lines should be greater than 1
    assert len(card.text_sur_lines) > 1
    
    # Height should be greater than the default 44
    assert card.get_required_height() > 44
