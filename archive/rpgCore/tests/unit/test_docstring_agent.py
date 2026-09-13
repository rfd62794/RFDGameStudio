import pytest
from src.tools.apj.agents.docstring_agent import DocstringAgent, DocstringResult
from src.tools.apj.agents.base_agent import AgentConfig

@pytest.fixture
def mock_config():
    return AgentConfig.model_validate({
        "name": "docstring",
        "role": "tester",
        "department": "execution",
        "model_preference": "local",
        "prompts": {"system": "docs/agents/prompts/docstring_system.md", "fewshot": "docs/agents/prompts/docstring_fewshot.md"},
        "schema": "DocstringResult",
        "fallback": {
            "symbol_name": "unknown",
            "file_path": "unknown",
            "line_number": 0,
            "docstring": '"""fallback"""',
            "confidence": "low",
            "reasoning": "r"
        },
        "save_output": False,
        "log_quality": False
    })

def test_docstring_agent_extract_json(mock_config):
    agent = DocstringAgent(mock_config)
    raw = "Here is the result: {\"symbol_name\": \"test\", \"file_path\": \"p.py\", \"line_number\": 1, \"docstring\": \"docs\", \"confidence\": \"high\", \"reasoning\": \"r\"} and some extra text."
    json_str = agent._extract_json(raw)
    assert json_str == "{\"symbol_name\": \"test\", \"file_path\": \"p.py\", \"line_number\": 1, \"docstring\": \"docs\", \"confidence\": \"high\", \"reasoning\": \"r\"}"

def test_docstring_agent_format_docstring_single_line(mock_config):
    agent = DocstringAgent(mock_config)
    doc = "A simple docstring."
    formatted = agent._format_docstring(doc, "    ")
    assert formatted == ["    \"\"\"A simple docstring.\"\"\"\n"]

def test_docstring_agent_format_docstring_multiline(mock_config):
    agent = DocstringAgent(mock_config)
    doc = "Summary line.\n\nArgs:\n    x: Input."
    formatted = agent._format_docstring(doc, "    ")
    assert formatted[0] == "    \"\"\"Summary line.\n"
    assert "    Args:\n" in formatted
    assert "    \"\"\"\n" in formatted[-1]

def test_docstring_agent_find_insert_point(mock_config):
    agent = DocstringAgent(mock_config)
    lines = [
        "class MyClass:\n",
        "    def __init__(self):\n",
        "        pass\n"
    ]
    # Insert after class def
    idx = agent._find_insert_point(lines, 0)
    assert idx == 1
    
    # Insert after method def
    idx = agent._find_insert_point(lines, 1)
    assert idx == 2

def test_docstring_agent_insertion(tmp_path, mock_config):
    file_path = tmp_path / "test_insert.py"
    file_path.write_text("def my_func(a, b):\n    return a + b\n", encoding="utf-8")
    
    agent = DocstringAgent(mock_config)
    result = DocstringResult(
        symbol_name="my_func",
        file_path="test_insert.py",
        line_number=1,
        docstring="Adds two numbers.",
        confidence="high",
        reasoning="Simple."
    )
    
    success = agent.insert(result, tmp_path)
    assert success is True
    
    new_content = file_path.read_text(encoding="utf-8")
    assert '"""Adds two numbers."""' in new_content
    # Check indentation - should be 4 spaces
    assert "    \"\"\"Adds two numbers.\"\"\"\n" in new_content
