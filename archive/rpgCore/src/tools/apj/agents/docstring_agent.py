from __future__ import annotations
from pydantic import BaseModel
from pathlib import Path
import ast
import logging

logger = logging.getLogger(__name__)

from src.tools.apj.agents.base_agent import BaseAgent, AgentConfig

class DocstringRequest(BaseModel):
    symbol_name: str
    symbol_type: str        # "class" / "function" / "method"
    source_code: str        # full source of the symbol
    file_path: str
    existing_docstring: str | None = None

class DocstringResult(BaseModel):
    symbol_name: str
    file_path: str
    line_number: int
    docstring: str          # ready to insert, Google style
    confidence: str         # "high" / "medium" / "low"
    reasoning: str

class DocstringAgent(BaseAgent):
    """
    Generates Google-style docstrings for Python classes and functions.
    Now inherits from BaseAgent to leverage ModelRouter (remote access).
    """

    def __init__(self, config: AgentConfig):
        super().__init__(config)
        logger.info(f"DocstringAgent initialized (model={self.model_name})")

    def generate(self, request: DocstringRequest) -> DocstringResult:
        """Generate a docstring for a single symbol using ModelRouter."""
        task = (
            f"Generate a Google-style docstring for this {request.symbol_type}:\n\n"
            f"File: {request.file_path}\n"
            f"Symbol: {request.symbol_name}\n\n"
            f"Source code:\n```python\n{request.source_code}\n```"
        )
        
        try:
            result = super().run(task)
            if not isinstance(result, DocstringResult):
                result = DocstringResult.model_validate(result.model_dump())
            return result
        except Exception as e:
            logger.warning(f"DocstringAgent: generation failed — {e}")
            return DocstringResult(
                symbol_name=request.symbol_name,
                file_path=request.file_path,
                line_number=0,
                docstring=f'"""{request.symbol_name}."""',
                confidence="low",
                reasoning="Fallback — agent failed to generate.",
            )
    
    def insert(self, result: DocstringResult, project_root: Path) -> bool:
        """
        Insert approved docstring into source file.
        
        Args:
            result: Approved DocstringResult to insert.
            project_root: Project root for resolving file path.
        
        Returns:
            True if insertion succeeded, False otherwise.
        """
        file_path = project_root / result.file_path
        if not file_path.exists():
            logger.error(f"DocstringAgent: file not found — {file_path}")
            return False
        
        source = file_path.read_text(encoding="utf-8")
        lines = source.splitlines(keepends=True)
        
        # find the def/class line
        target_line = result.line_number - 1  # 0-indexed
        if target_line < 0 or target_line >= len(lines):
            logger.error(f"DocstringAgent: line {result.line_number} out of range")
            return False
        
        # find insertion point — line after def/class signature ends
        insert_at = self._find_insert_point(lines, target_line)
        if insert_at is None:
            logger.error(f"DocstringAgent: could not find insertion point")
            return False
        
        # determine indentation from head
        indent = self._get_body_indent(lines, target_line)
        
        # format docstring with correct indentation
        docstring_lines = self._format_docstring(result.docstring, indent)
        
        # insert
        for i, dl in enumerate(docstring_lines):
            lines.insert(insert_at + i, dl)
        
        file_path.write_text("".join(lines), encoding="utf-8")
        logger.info(f"DocstringAgent: inserted docstring for {result.symbol_name} in {result.file_path}")
        return True
    
    def _find_insert_point(self, lines: list[str], def_line: int) -> int | None:
        """Find the line index to insert docstring after def/class."""
        for i in range(def_line, min(def_line + 10, len(lines))):
            if lines[i].rstrip().endswith(":"):
                return i + 1
        return None
    
    def _get_body_indent(self, lines: list[str], def_line: int) -> str:
        """Determine indentation for docstring body."""
        def_line_str = lines[def_line]
        def_indent = len(def_line_str) - len(def_line_str.lstrip())
        return " " * (def_indent + 4)
    
    def _format_docstring(self, docstring: str, indent: str) -> list[str]:
        """Format docstring with correct indentation as line list."""
        doc_lines = docstring.strip().splitlines()
        if not doc_lines:
            return []
        
        result_lines = [f'{indent}"""{doc_lines[0]}\n']
        if len(doc_lines) > 1:
            for line in doc_lines[1:]:
                result_lines.append(f"{indent}{line}\n" if line.strip() else f"\n")
            result_lines.append(f'{indent}"""\n')
        else:
            # Single line docstring - if it's really short, use single line format
            if len(doc_lines[0]) < 60:
                result_lines = [f'{indent}"""{doc_lines[0]}"""\n']
            else:
                result_lines.append(f'{indent}"""\n')
                
        return result_lines
    
    def _extract_json(self, raw: str) -> str:
        """Extract JSON using brace-depth tracking."""
        depth = 0
        start = None
        for i, ch in enumerate(raw):
            if ch == "{":
                if depth == 0:
                    start = i
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0 and start is not None:
                    return raw[start:i+1]
        raise ValueError("No valid JSON found in response")
