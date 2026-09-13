import pytest
from pathlib import Path
from unittest.mock import MagicMock, patch
from pydantic import BaseModel

from src.tools.apj.agents.base_agent import BaseAgent, AgentConfig, PROJECT_ROOT
from src.tools.apj.agents.registry import SchemaRegistry
from src.tools.apj.agents.archivist import CoherenceReport
from src.tools.apj.agents.herald import HeraldDirective

def test_base_agent_from_config_loads_archivist():
    agent = BaseAgent.from_config("archivist")
    assert agent.config.name == "archivist"
    assert agent.config.department == "analysis"
    assert agent.schema == CoherenceReport

def test_base_agent_from_config_loads_herald():
    agent = BaseAgent.from_config("herald")
    assert agent.config.name == "herald"
    assert agent.config.model_preference == "remote"
    assert agent.schema == HeraldDirective

def test_schema_registry_get_known_schema():
    assert SchemaRegistry.get("CoherenceReport") == CoherenceReport
    assert SchemaRegistry.get("HeraldDirective") == HeraldDirective

def test_schema_registry_get_unknown_raises():
    with pytest.raises(ValueError, match="Unknown schema"):
        SchemaRegistry.get("UnknownModel")

def test_agent_config_fallback_validates_against_schema():
    """Each config fallback dict must validate against its own schema."""
    for name in ["archivist", "strategist", "scribe", "herald"]:
        agent = BaseAgent.from_config(name)
        # Should not raise
        assert agent.schema.model_validate(agent.config.fallback)

@patch("src.tools.apj.agents.model_router.ModelRouter.route")
def test_base_agent_run_success(mock_route):
    mock_route.return_value = '{"session_primer": "Test", "open_risks": [], "queued_focus": "None", "constitutional_flags": [], "corpus_hash": ""}'
    agent = BaseAgent.from_config("archivist")
    result = agent.run("test input")
    
    assert isinstance(result, CoherenceReport)
    assert result.session_primer == "Test"
    mock_route.assert_called_once()
