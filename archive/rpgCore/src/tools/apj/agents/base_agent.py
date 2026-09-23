import json
import re
import yaml
from datetime import datetime
from pathlib import Path
from typing import Any, Optional, Union
from loguru import logger
from pydantic import BaseModel, Field, ConfigDict

from src.tools.apj.agents.ollama_client import warm_model_sync, resolve_model

# Resolution: src/tools/apj/agents/base_agent.py -> parents[4] is rpgCore
PROJECT_ROOT = Path(__file__).resolve().parents[4]

class PromptConfig(BaseModel):
    system: str   # path relative to PROJECT_ROOT
    fewshot: str  # path relative to PROJECT_ROOT

class AgentConfig(BaseModel):
    name: str
    role: str
    department: str        # analysis/planning/execution/memory/persona
    model_preference: str  # "local" or "remote"
    backend_override: Optional[str] = None  # specific model string or null
    prompts: PromptConfig
    schema_name: str = Field(alias="schema") # 'schema' is a reserved keyword in some contexts
    fallback: dict
    save_output: bool = True
    log_quality: bool = True

    model_config = ConfigDict(populate_by_name=True)

class BaseAgent:
    def __init__(self, config: AgentConfig):
        self.config = config
        from src.tools.apj.agents.registry import SchemaRegistry
        self.schema = SchemaRegistry.get(config.schema_name)
        self.model_name = self._warm_model()
        self._agent = None # lazy-loaded or routed
    
    @classmethod
    def from_config(cls, name: str) -> "BaseAgent":
        path = PROJECT_ROOT / "docs" / "agents" / "configs" / f"{name}.yaml"
        if not path.exists():
            raise FileNotFoundError(f"Agent config not found: {path}")
        
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        
        config = AgentConfig.model_validate(data)
        return cls(config)
    
    def run(self, task_input: Any) -> BaseModel:
        """Execute the agent loop: serialize -> prompt -> call -> extract -> validate -> save."""
        task = self._serialize_input(task_input)
        prompt = self._build_prompt(task)
        
        # Route to ModelRouter (Implementation in Part 2)
        from src.tools.apj.agents.model_router import ModelRouter
        raw = ModelRouter.route(self.config, prompt)
        
        json_str = self._extract_json(raw)
        result = self._validate(json_str)
        
        if self.config.save_output:
            self._save(result)
            
        return result
    
    def _build_prompt(self, task: str) -> str:
        system = self._load_prompt(self.config.prompts.system)
        fewshot = self._load_prompt(self.config.prompts.fewshot)
        return "\n\n".join([
            f"ROLE: {self.config.role}",
            system,
            fewshot,
            f"TASK:\n{task}",
        ])
    
    def _extract_json(self, raw: str) -> str:
        """Enhanced JSON extraction with better error handling"""
        logger.debug(f"Raw LLM response: {raw[:200]}...")
        
        # First try to find JSON in markdown code blocks
        fenced = re.search(r"```(?:json)?\s*({.*?})\s*```", raw, re.DOTALL)
        if fenced:
            json_str = fenced.group(1)
            logger.debug(f"Found fenced JSON: {json_str[:200]}...")
            return json_str
        
        # Try to find JSON between first { and last }
        start = raw.find("{")
        if start == -1:
            logger.debug("No JSON found in response")
            return raw.strip()
        
        # Find the matching closing brace
        brace_count = 0
        for i, char in enumerate(raw[start:], start):
            if char == "{":
                brace_count += 1
            elif char == "}":
                brace_count -= 1
                if brace_count == 0:
                    json_str = raw[start:i + 1]
                    logger.debug(f"Extracted JSON: {json_str[:200]}...")
                    
                    # Validate JSON structure before returning
                    if self._is_valid_json_structure(json_str):
                        return json_str
                    else:
                        logger.debug("JSON structure invalid, attempting repair")
                        return self._repair_json(json_str)
        
        logger.debug("No complete JSON found")
        return raw[start:].strip()
    
    def _is_valid_json_structure(self, json_str: str) -> bool:
        """Check if JSON has basic valid structure"""
        try:
            data = json.loads(json_str)
            # Check if it's a dict with expected keys
            if isinstance(data, dict):
                return True
            return False
        except:
            return False
    
    def _repair_json(self, json_str: str) -> str:
        """Attempt to repair common JSON issues"""
        try:
            # Remove trailing commas
            json_str = re.sub(r',\s*}', '}', json_str)
            json_str = re.sub(r',\s*]', ']', json_str)
            
            # Add missing commas between objects
            json_str = re.sub(r'}\s*{', '},{', json_str)
            
            # Try to parse the repaired JSON
            json.loads(json_str)
            return json_str
        except:
            return json_str
    
    def _validate(self, json_str: str) -> BaseModel:
        max_retries = 3
        for attempt in range(max_retries):
            try:
                logger.debug(f"Attempting to validate JSON (attempt {attempt + 1}): {json_str}")
                
                # First try loading as JSON to catch basic syntax errors
                data = json.loads(json_str)
                logger.debug(f"JSON parsed successfully: {type(data)}")
                
                # Check if it matches the expected schema structure
                if hasattr(self.schema, 'model_fields'):
                    logger.debug(f"Expected fields: {list(self.schema.model_fields.keys())}")
                
                result = self.schema.model_validate(data)
                logger.debug(f"Schema validation successful: {type(result)}")
                return result
                
            except json.JSONDecodeError as e:
                logger.warning(f"JSON decode error (attempt {attempt + 1}): {e}")
                if attempt < max_retries - 1:
                    # Try to repair JSON
                    json_str = self._repair_json(json_str)
                    continue
                else:
                    logger.warning(f"JSON decode error after {max_retries} attempts: {e}")
                    logger.warning(f"JSON content was: {json_str}")
                    logger.warning(f"Using fallback due to JSON decode error")
                    return self.schema.model_validate(self.config.fallback)
            except Exception as e:
                logger.warning(f"Agent {self.config.name} validation failed (attempt {attempt + 1}): {e}")
                if attempt < max_retries - 1:
                    continue
                else:
                    logger.warning(f"Agent {self.config.name} validation failed after {max_retries} attempts: {e}")
                    logger.warning(f"JSON content was: {json_str}")
                    logger.warning(f"Using fallback due to validation error")
                    return self.schema.model_validate(self.config.fallback)
    
    def _serialize_input(self, task_input: Any) -> str:
        if isinstance(task_input, str):
            return task_input
        if isinstance(task_input, BaseModel):
            return task_input.model_dump_json(indent=2)
        return str(task_input)
    
    def _load_prompt(self, relative_path: str) -> str:
        path = PROJECT_ROOT / relative_path
        if path.exists():
            return path.read_text(encoding="utf-8")
        logger.warning(f"Prompt file missing: {relative_path}")
        return ""
    
    def _warm_model(self) -> str:
        """Ensure a local model is ready if preference is local."""
        if self.config.model_preference == "local":
            resolved = resolve_model()
            return warm_model_sync(resolved)
        return "remote"
    
    def _save(self, result: BaseModel) -> None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_dir = PROJECT_ROOT / "docs" / "session_logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        path = log_dir / f"{timestamp}_{self.config.name}.md"
        
        content = [
            f"# {self.config.name.upper()} OUTPUT — {timestamp}\n",
            result.model_dump_json(indent=2)
        ]
        path.write_text("\n".join(content), encoding="utf-8")
        logger.info(f"Agent {self.config.name} output saved: {path.name}")
