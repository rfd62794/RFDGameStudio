"""
tests/unit/test_apj_prompts.py — Unit tests for prompt file loader.

All tests are offline — no Ollama required. File I/O uses tmp_path.
Target: 5 tests, bringing total from 452 to 457.
"""

import pytest
from pathlib import Path
from unittest.mock import patch


# ---------------------------------------------------------------------------
# Shared: minimal agent stubs via __new__ (no Ollama init)
# ---------------------------------------------------------------------------

def _archivist_stub():
    from src.tools.apj.agents.archivist import Archivist
    a = Archivist.__new__(Archivist)
    a.model_name = "llama3.2:1b"
    a._agent = None
    return a


def _strategist_stub():
    from src.tools.apj.agents.strategist import Strategist
    s = Strategist.__new__(Strategist)
    s.model_name = "llama3.2:1b"
    s._agent = None
    return s


def _scribe_stub():
    from src.tools.apj.agents.scribe import Scribe
    s = Scribe.__new__(Scribe)
    s.model_name = "llama3.2:1b"
    s._agent = None
    return s


def _herald_stub():
    from src.tools.apj.agents.herald import Herald
    h = Herald.__new__(Herald)
    h.model_name = "llama3.2:1b"
    h._agent = None
    return h


# ---------------------------------------------------------------------------
# 1. Archivist _load_prompt returns file contents
# ---------------------------------------------------------------------------

def test_archivist_prompt_loads_from_file(tmp_path, monkeypatch):
    """_load_prompt reads from prompt file and returns its content."""
    from src.tools.apj.agents import archivist as archivist_mod

    prompt_dir = tmp_path / "docs" / "agents" / "prompts"
    prompt_dir.mkdir(parents=True)
    (prompt_dir / "archivist_system.md").write_text(
        "TEST ARCHIVIST SYSTEM CONTENT", encoding="utf-8"
    )

    monkeypatch.setattr(archivist_mod, "_PROJECT_ROOT", tmp_path)
    result = archivist_mod._load_prompt("archivist_system.md")
    assert result == "TEST ARCHIVIST SYSTEM CONTENT"


# ---------------------------------------------------------------------------
# 2. Strategist _load_prompt returns file contents
# ---------------------------------------------------------------------------

def test_strategist_prompt_loads_from_file(tmp_path, monkeypatch):
    """_load_prompt reads from strategist prompt file."""
    from src.tools.apj.agents import strategist as strategist_mod

    prompt_dir = tmp_path / "docs" / "agents" / "prompts"
    prompt_dir.mkdir(parents=True)
    (prompt_dir / "strategist_system.md").write_text(
        "TEST STRATEGIST SYSTEM CONTENT", encoding="utf-8"
    )

    monkeypatch.setattr(strategist_mod, "_PROJECT_ROOT", tmp_path)
    result = strategist_mod._load_prompt("strategist_system.md")
    assert result == "TEST STRATEGIST SYSTEM CONTENT"


# ---------------------------------------------------------------------------
# 3. Scribe _load_prompt returns file contents
# ---------------------------------------------------------------------------

def test_scribe_prompt_loads_from_file(tmp_path, monkeypatch):
    """_load_prompt reads from scribe prompt file."""
    from src.tools.apj.agents import scribe as scribe_mod

    prompt_dir = tmp_path / "docs" / "agents" / "prompts"
    prompt_dir.mkdir(parents=True)
    (prompt_dir / "scribe_system.md").write_text(
        "TEST SCRIBE SYSTEM CONTENT", encoding="utf-8"
    )

    monkeypatch.setattr(scribe_mod, "_PROJECT_ROOT", tmp_path)
    result = scribe_mod._load_prompt("scribe_system.md")
    assert result == "TEST SCRIBE SYSTEM CONTENT"


# ---------------------------------------------------------------------------
# 4. Herald _load_prompt returns file contents
# ---------------------------------------------------------------------------

def test_herald_prompt_loads_from_file(tmp_path, monkeypatch):
    """_load_prompt reads from herald prompt file."""
    from src.tools.apj.agents import herald as herald_mod

    prompt_dir = tmp_path / "docs" / "agents" / "prompts"
    prompt_dir.mkdir(parents=True)
    (prompt_dir / "herald_system.md").write_text(
        "TEST HERALD SYSTEM CONTENT", encoding="utf-8"
    )

    monkeypatch.setattr(herald_mod, "_PROJECT_ROOT", tmp_path)
    result = herald_mod._load_prompt("herald_system.md")
    assert result == "TEST HERALD SYSTEM CONTENT"


# ---------------------------------------------------------------------------
# 5. Missing file returns empty string, logs warning, does not raise
# ---------------------------------------------------------------------------

def test_prompt_loader_missing_file_returns_empty(tmp_path, monkeypatch):
    """_load_prompt returns '' and does not raise if file is missing."""
    from src.tools.apj.agents import archivist as archivist_mod

    # Point to tmp_path — no prompts dir created, so file won't exist
    monkeypatch.setattr(archivist_mod, "_PROJECT_ROOT", tmp_path)

    result = archivist_mod._load_prompt("nonexistent_prompt.md")
    assert result == ""  # does not raise, returns empty string
