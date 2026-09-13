from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
from .schemas import SymbolMap, FileRecord, ClassRecord, FunctionRecord
from .cache import load_cache, save_cache
from ..inventory.scanner import ASTScanner

@dataclass
class ContextSlice:
    """Minimal relevant codebase context for a Herald directive."""
    intent: str                          # what we're building
    relevant_files: list[FileRecord]     # files Herald should reference
    key_classes: list[ClassRecord]       # classes to extend or use
    key_functions: list[FunctionRecord]  # functions to call or mirror
    missing_docstrings: list[str]        # symbols lacking docstrings
    
    def to_prompt_text(self) -> str:
        """Render as text block for injection into Herald prompt."""
        lines = [
            "CODEBASE CONTEXT (real paths — do not invent new ones):",
            "",
        ]
        
        if self.key_classes:
            lines.append("Key classes:")
            for c in self.key_classes:
                doc = f' — "{c.docstring}"' if c.docstring else " — no docstring"
                lines.append(f"  {c.name}({', '.join(c.bases)}) in {c.file}:{c.line_start}{doc}")
                if c.methods:
                    lines.append(f"    methods: {', '.join(c.methods[:8])}")
        
        if self.relevant_files:
            lines.append("")
            lines.append("Relevant files:")
            for f in self.relevant_files:
                classes = [c.name for c in f.classes]
                lines.append(f"  {f.path} — {classes}")
        
        if self.missing_docstrings:
            lines.append("")
            lines.append("Missing docstrings (run apj docstring sweep after this session):")
            for s in self.missing_docstrings[:5]:
                lines.append(f"  {s}")
        
        return "\n".join(lines)


class ContextBuilder:
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self._symbol_map: SymbolMap | None = None
    
    def _get_symbol_map(self) -> SymbolMap:
        if self._symbol_map is None:
            self._symbol_map = load_cache(self.project_root)
        if self._symbol_map is None:
            scanner = ASTScanner(self.project_root)
            self._symbol_map = scanner.scan()
            save_cache(self.project_root, self._symbol_map)
        return self._symbol_map
    
    def build(self, intent: str) -> ContextSlice:
        """
        Build a minimal context slice for a given build intent.
        
        Args:
            intent: Natural language description of what to build.
                    e.g. "mini-map and door system for dungeon crawler"
        
        Returns:
            ContextSlice with relevant files, classes, and missing docstrings.
        """
        symbol_map = self._get_symbol_map()
        keywords = self._extract_keywords(intent)
        
        relevant_files: list[FileRecord] = []
        seen_paths: set[str] = set()
        
        for keyword in keywords:
            for f in symbol_map.find_by_keyword(keyword):
                if f.path not in seen_paths:
                    relevant_files.append(f)
                    seen_paths.add(f.path)
        
        # always include scene base — every demo needs it
        for f in symbol_map.find_by_keyword("scene_base"):
            if f.path not in seen_paths:
                relevant_files.append(f)
                seen_paths.add(f.path)
        
        # collect key classes from relevant files
        key_classes: list[ClassRecord] = []
        for f in relevant_files:
            key_classes.extend(f.classes)
        
        # collect key functions (top-level only, not methods)
        key_functions: list[FunctionRecord] = []
        for f in relevant_files:
            key_functions.extend(
                fn for fn in f.functions if not fn.is_method
            )
        
        # find missing docstrings in relevant symbols
        missing: list[str] = []
        for c in key_classes:
            if not c.docstring:
                missing.append(f"{c.name} in {c.file}")
        
        # cap to keep Herald context manageable
        return ContextSlice(
            intent=intent,
            relevant_files=relevant_files[:12],
            key_classes=key_classes[:15],
            key_functions=key_functions[:10],
            missing_docstrings=missing[:10],
        )
    
    def _extract_keywords(self, intent: str) -> list[str]:
        """
        Extract search keywords from intent string.
        Removes stop words, returns meaningful terms.
        """
        stop_words = {
            "and", "or", "for", "the", "a", "an", "in",
            "to", "of", "with", "add", "build", "create",
            "implement", "fix", "update", "make", "system",
        }
        words = intent.lower().replace("-", " ").split()
        return [w for w in words if w not in stop_words and len(w) > 2]
