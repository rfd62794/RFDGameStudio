import pytest
from src.apps.slime_clan.overworld import NodeState, MapNode

def test_map_node_initialization():
    node = MapNode(
        id="test_node",
        name="Test Region",
        x=10,
        y=20,
        state=NodeState.CONTESTED,
        connections=["other_node"]
    )
    assert node.state == NodeState.CONTESTED
    assert node.name == "Test Region"
    assert "other_node" in node.connections
    assert node.x == 10
    assert node.y == 20

def test_node_state_transitions():
    node = MapNode("test", "Test Region", 0, 0, NodeState.RED, [])
    assert node.state == NodeState.RED
    
    # Simulate Battle Win
    node.state = NodeState.BLUE
    assert node.state == NodeState.BLUE

def test_default_connections():
    node = MapNode("test", "Test Default", 0, 0, NodeState.HOME)
    assert node.connections == []
