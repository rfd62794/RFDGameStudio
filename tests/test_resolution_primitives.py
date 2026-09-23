from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from studio.executor import Executor

ROOT = Path(__file__).parent.parent
ACTION_SOURCE = (ROOT / "engine" / "primitives" / "action.lua").read_text(encoding="utf-8")
RESOLUTION_SOURCE = (ROOT / "engine" / "primitives" / "resolution.lua").read_text(encoding="utf-8")

def test_weighted_choice() -> None:
    # We combine action.lua and resolution.lua
    executor = Executor(RESOLUTION_SOURCE, engine_source=ACTION_SOURCE)
    
    options = ["apple", "banana", "cherry"]
    weights = [10, 0, 0]  # Should always select apple
    
    for _ in range(10):
        assert executor.call("weighted_choice", options, weights) == "apple"
        
    weights2 = [0, 50, 0]  # Should always select banana
    for _ in range(10):
        assert executor.call("weighted_choice", options, weights2) == "banana"

def test_resolve_contest() -> None:
    executor = Executor(RESOLUTION_SOURCE, engine_source=ACTION_SOURCE)
    
    participants = ["A", "B", "C"]
    weights = [0, 0, 100]  # C should always win, index is 3
    
    for _ in range(10):
        assert executor.call("resolve_contest", participants, weights) == 3

def test_resolve_check() -> None:
    executor = Executor(RESOLUTION_SOURCE, engine_source=ACTION_SOURCE)
    
    # If value=10, difficulty=15, variance=20 (D20-style, roll in [1, 20])
    # roll must be >= 5 to win, which is prob 16/20 = 80%
    # If value=0, difficulty=100, variance=20, it should be impossible to win (0%)
    assert executor.call("resolve_check", 0, 100, 20) is False
    
    # If value=100, difficulty=5, variance=20, it should always win (100%)
    assert executor.call("resolve_check", 100, 5, 20) is True
