from pydantic import BaseModel
from src.tools.apj.agents.archivist import CoherenceReport
from src.tools.apj.agents.strategist import SessionPlan
from src.tools.apj.agents.herald import HeraldDirective
from src.tools.apj.agents.scribe import ScribeDraft
from src.tools.apj.agents.docstring_agent import DocstringResult

SCHEMA_REGISTRY: dict[str, type[BaseModel]] = {
    "CoherenceReport":  CoherenceReport,
    "SessionPlan":      SessionPlan,
    "HeraldDirective":  HeraldDirective,
    "ScribeDraft":      ScribeDraft,
    "DocstringResult":  DocstringResult,
}

class SchemaRegistry:
    @staticmethod
    def get(name: str) -> type[BaseModel]:
        if name not in SCHEMA_REGISTRY:
            raise ValueError(f"Unknown schema: {name}")
        return SCHEMA_REGISTRY[name]
    
    @staticmethod
    def register(name: str, schema: type[BaseModel]) -> None:
        SCHEMA_REGISTRY[name] = schema
