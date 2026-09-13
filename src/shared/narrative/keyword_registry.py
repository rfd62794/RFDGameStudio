"""
Keyword Registry - Vocabulary system, keyword gating, keyword triggers.
"""
from typing import Set, Dict, List

class KeywordRegistry:
    def __init__(self):
        self._known_keywords: Set[str] = set()
        self._keyword_triggers: Dict[str, List[str]] = {}

    def learn_keyword(self, keyword: str) -> bool:
        """Learn a new keyword. Returns True if it was newly learned."""
        if keyword not in self._known_keywords:
            self._known_keywords.add(keyword)
            return True
        return False

    def knows_keyword(self, keyword: str) -> bool:
        return keyword in self._known_keywords

    def register_trigger(self, keyword: str, node_id: str) -> None:
        """Register a conversation node to trigger when a keyword is used."""
        if keyword not in self._keyword_triggers:
            self._keyword_triggers[keyword] = []
        if node_id not in self._keyword_triggers[keyword]:
            self._keyword_triggers[keyword].append(node_id)

    def get_triggers(self, keyword: str) -> List[str]:
        return self._keyword_triggers.get(keyword, [])

    def clear(self) -> None:
        self._known_keywords.clear()
        self._keyword_triggers.clear()
