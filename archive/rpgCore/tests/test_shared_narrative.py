def test_state_tracker():
    from src.shared.narrative.state_tracker import StateTracker
    tracker = StateTracker()
    tracker.set_flag("met_king", True)
    assert tracker.get_flag("met_king") is True
    assert tracker.get_flag("unknown", False) is False

def test_keyword_registry():
    from src.shared.narrative.keyword_registry import KeywordRegistry
    registry = KeywordRegistry()
    registry.learn_keyword("amulet")
    assert registry.knows_keyword("amulet") is True
    assert registry.knows_keyword("sword") is False

def test_conversation_graph():
    from src.shared.narrative.state_tracker import StateTracker
    from src.shared.narrative.keyword_registry import KeywordRegistry
    from src.shared.narrative.conversation_graph import ConversationGraph, Node, Edge

    st = StateTracker()
    kr = KeywordRegistry()
    graph = ConversationGraph(st, kr)

    node_start = Node(
        node_id="start", 
        text="Hello.",
        edges=[Edge(target_node="end", text="Goodbye")]
    )
    node_end = Node(node_id="end", text="See ya.", set_flags_on_enter={"left": True})

    graph.add_node(node_start)
    graph.add_node(node_end)

    graph.start("start")
    choices = graph.get_available_choices()
    assert len(choices) == 1
    assert choices[0].text == "Goodbye"

    graph.make_choice(choices[0])
    assert st.get_flag("left") is True
