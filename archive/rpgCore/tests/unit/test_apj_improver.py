"""
tests/unit/test_apj_improver.py — Unit tests for the Improver agent.

All tests are offline — no OpenRouter or Ollama required. File I/O uses tmp_path.
Target: 5 tests, bringing total from 457 to 462.
"""

import pytest
from pathlib import Path
from unittest.mock import patch


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_stub_suggestion(agent_name: str = "archivist") -> "ImprovementSuggestion":
    """Build a minimal ImprovementSuggestion for testing apply()."""
    from src.tools.apj.agents.improver import ImprovementSuggestion
    return ImprovementSuggestion(
        agent_name=agent_name,
        prompt_file=f"{agent_name}_system.md",
        weaknesses=["Ambiguous output format instruction"],
        rewritten_prompt="REWRITTEN: You are the ARCHIVIST. Return only JSON.",
        changes_annotated=["Moved JSON constraint to top [CHANGE: clarity]"],
        confidence="high",
    )


# ---------------------------------------------------------------------------
# 1. Improver raises if Director not enabled
# ---------------------------------------------------------------------------

def test_improver_requires_director():
    """Improver.__init__ raises RuntimeError when is_director_enabled() is False."""
    with patch(
        "src.tools.apj.agents.openrouter_client.is_director_enabled",
        return_value=False,
    ):
        with pytest.raises(RuntimeError, match="Director not configured"):
            from src.tools.apj.agents.improver import Improver
            # Force re-init even if cached
            import importlib
            import src.tools.apj.agents.improver as imp_mod
            importlib.reload(imp_mod)
            imp_mod.Improver()


# ---------------------------------------------------------------------------
# 2. _sanitize strips project names
# ---------------------------------------------------------------------------

def test_improver_sanitize_strips_project_names():
    """'rpgCore' is replaced with '[GAME_PROJECT]'."""
    with patch("src.tools.apj.agents.openrouter_client.is_director_enabled", return_value=True):
        with patch("os.getenv", side_effect=lambda k, d="": "fake_key" if k == "OPENROUTER_API_KEY" else d):
            from src.tools.apj.agents.improver import Improver
            improver = Improver.__new__(Improver)
            improver.api_key = "fake_key"
            improver.model_name = "deepseek/deepseek-r1"

    result = improver._sanitize("The rpgCore project has many features.")
    assert "PyGame_Engine" in result
    assert "rpgCore" not in result


# ---------------------------------------------------------------------------
# 3. _sanitize strips demo names
# ---------------------------------------------------------------------------

def test_improver_sanitize_strips_demo_names():
    """'Slime Breeder' is replaced with '[DEMO_NAME]'."""
    with patch("src.tools.apj.agents.openrouter_client.is_director_enabled", return_value=True):
        with patch("os.getenv", side_effect=lambda k, d="": "fake_key" if k == "OPENROUTER_API_KEY" else d):
            from src.tools.apj.agents.improver import Improver
            improver = Improver.__new__(Improver)
            improver.api_key = "fake_key"
            improver.model_name = "deepseek/deepseek-r1"

    result = improver._sanitize("The Slime Breeder demo uses genetics.")
    assert "GenericDemo" in result
    assert "Slime Breeder" not in result


# ---------------------------------------------------------------------------
# 4. apply() creates a versioned backup before overwriting
# ---------------------------------------------------------------------------

def test_improver_apply_creates_backup(tmp_path, monkeypatch):
    """apply() writes backup file before overwriting the system prompt."""
    import src.tools.apj.agents.improver as imp_mod
    monkeypatch.setattr(imp_mod, "_PROMPTS_DIR", tmp_path)
    monkeypatch.setattr(imp_mod, "_QUALITY_LOG", tmp_path / "quality_log.md")

    # Create a current prompt file
    prompt_file = tmp_path / "archivist_system.md"
    prompt_file.write_text("ORIGINAL PROMPT CONTENT", encoding="utf-8")

    improver = imp_mod.Improver.__new__(imp_mod.Improver)
    improver.api_key = "fake_key"
    improver.model_name = "deepseek/deepseek-r1"

    suggestion = _make_stub_suggestion("archivist")
    improver.apply(suggestion)

    # Backup must exist
    backup = tmp_path / "archivist_system_v1.md"
    assert backup.exists()
    assert backup.read_text(encoding="utf-8") == "ORIGINAL PROMPT CONTENT"

    # Prompt file must have been updated
    updated = prompt_file.read_text(encoding="utf-8")
    assert "REWRITTEN" in updated


# ---------------------------------------------------------------------------
# 5. apply() appends to quality_log.md
# ---------------------------------------------------------------------------

def test_improver_apply_writes_quality_log(tmp_path, monkeypatch):
    """apply() appends an entry to quality_log.md after each improvement."""
    import src.tools.apj.agents.improver as imp_mod
    monkeypatch.setattr(imp_mod, "_PROMPTS_DIR", tmp_path)
    monkeypatch.setattr(imp_mod, "_QUALITY_LOG", tmp_path / "quality_log.md")

    # Create a current prompt file so backup works
    (tmp_path / "archivist_system.md").write_text("ORIGINAL", encoding="utf-8")

    improver = imp_mod.Improver.__new__(imp_mod.Improver)
    improver.api_key = "fake_key"
    improver.model_name = "deepseek/deepseek-r1"

    suggestion = _make_stub_suggestion("archivist")
    improver.apply(suggestion)

    quality_log = tmp_path / "quality_log.md"
    assert quality_log.exists()
    content = quality_log.read_text(encoding="utf-8")
    assert "archivist" in content
    assert "Ambiguous output format instruction" in content
