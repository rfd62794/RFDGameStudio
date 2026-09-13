"""
Conversation Graph - Nodes, edges, player choices, stance tracking.
"""
from typing import Dict, List, Optional
from dataclasses import dataclass, field

from .state_tracker import StateTracker
from .keyword_registry import KeywordRegistry

@dataclass
class Edge:
    target_node: str
    text: str
    required_flags: Dict[str, bool] = field(default_factory=dict)
    required_keywords: List[str] = field(default_factory=list)

@dataclass
class Node:
    node_id: str
    text: str
    edges: List[Edge] = field(default_factory=list)
    set_flags_on_enter: Dict[str, bool] = field(default_factory=dict)
    learn_keywords_on_enter: List[str] = field(default_factory=list)

class ConversationGraph:
    def __init__(self, state_tracker: StateTracker, keyword_registry: KeywordRegistry):
        self.nodes: Dict[str, Node] = {}
        self.state_tracker = state_tracker
        self.keyword_registry = keyword_registry
        self.current_node_id: Optional[str] = None

    def add_node(self, node: Node) -> None:
        self.nodes[node.node_id] = node

    def start(self, start_node_id: str) -> Optional[Node]:
        if start_node_id in self.nodes:
            self.current_node_id = start_node_id
            self._process_node_entry(self.nodes[start_node_id])
            return self.nodes[start_node_id]
        return None

    def get_available_choices(self) -> List[Edge]:
        if not self.current_node_id or self.current_node_id not in self.nodes:
            return []
        
        node = self.nodes[self.current_node_id]
        available_edges = []
        for edge in node.edges:
            # Check flag requirements
            flags_met = all(
                self.state_tracker.get_flag(k, False) == v 
                for k, v in edge.required_flags.items()
            )
            # Check keyword requirements
            keywords_met = all(
                self.keyword_registry.knows_keyword(k)
                for k in edge.required_keywords
            )
            if flags_met and keywords_met:
                available_edges.append(edge)
        return available_edges

    def make_choice(self, edge: Edge) -> Optional[Node]:
        if edge.target_node in self.nodes:
            self.current_node_id = edge.target_node
            node = self.nodes[edge.target_node]
            self._process_node_entry(node)
            return node
        return None

    def _process_node_entry(self, node: Node) -> None:
        """Handle state modifications upon entering a node."""
        for k, v in node.set_flags_on_enter.items():
            self.state_tracker.set_flag(k, v)
        for keyword in node.learn_keywords_on_enter:
            self.keyword_registry.learn_keyword(keyword)
