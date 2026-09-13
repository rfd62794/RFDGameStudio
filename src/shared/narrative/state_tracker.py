"""
State Tracker - Variables that persist across conversation beats.
"""
from typing import Dict, Any

class StateTracker:
    def __init__(self):
        self._state: Dict[str, Any] = {}

    def set_flag(self, key: str, value: Any) -> None:
        self._state[key] = value

    def get_flag(self, key: str, default: Any = None) -> Any:
        return self._state.get(key, default)

    def has_flag(self, key: str) -> bool:
        return key in self._state

    def modify_counter(self, key: str, delta: int) -> int:
        current = self.get_flag(key, 0)
        new_val = current + delta
        self.set_flag(key, new_val)
        return new_val

    def clear(self) -> None:
        self._state.clear()
