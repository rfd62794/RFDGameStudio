from __future__ import annotations
from dataclasses import dataclass, field
from pathlib import Path

@dataclass
class ImportRecord:
    module: str           # "src.shared.engine.combat"
    names: list[str]      # ["CombatResult", "CombatAction"]
    is_from_import: bool  # True = "from x import y"

@dataclass
class FunctionRecord:
    name: str
    file: str             # relative to PROJECT_ROOT
    line_start: int
    line_end: int
    args: list[str]
    docstring: str | None
    calls: list[str]      # function names called inside
    is_method: bool       # True if inside a class
    parent_class: str | None

@dataclass
class ClassRecord:
    name: str
    file: str
    line_start: int
    line_end: int
    bases: list[str]      # parent class names
    methods: list[str]    # method names only
    docstring: str | None

@dataclass
class FileRecord:
    path: str             # relative to PROJECT_ROOT
    module_path: str      # "src.apps.dungeon.scene"
    classes: list[ClassRecord] = field(default_factory=list)
    functions: list[FunctionRecord] = field(default_factory=list)
    imports: list[ImportRecord] = field(default_factory=list)
    line_count: int = 0
    
    # NEW FIELDS - OPTIONAL, BACKWARD COMPATIBLE
    file_purpose: str | None = None      # "system:ecs", "demo:racing", "ui", etc
    demo_name: str | None = None         # "racing", "dungeon", "tower_defense", etc
    system_name: str | None = None       # "ecs", "genetics", "physics", etc
    content_summary: str | None = None   # One-line summary of what file does
    dependencies: list[str] | None = None # Other files this depends on

@dataclass
class SymbolMap:
    files: dict[str, FileRecord] = field(default_factory=dict)
    # key = relative file path e.g. "src/apps/dungeon/scene.py"
    
    def find_class(self, name: str) -> list[ClassRecord]:
        results = []
        for f in self.files.values():
            for c in f.classes:
                if c.name == name:
                    results.append(c)
        return results
    
    def find_function(self, name: str) -> list[FunctionRecord]:
        results = []
        for f in self.files.values():
            for fn in f.functions:
                if fn.name == name:
                    results.append(fn)
        return results
    
    def find_by_keyword(self, keyword: str) -> list[FileRecord]:
        keyword_lower = keyword.lower()
        results = []
        for path, f in self.files.items():
            if keyword_lower in path.lower():
                results.append(f)
                continue
            if any(keyword_lower in c.name.lower() for c in f.classes):
                results.append(f)
                continue
            if any(keyword_lower in fn.name.lower() for fn in f.functions):
                results.append(f)
        return results
    
    def find_subclasses(self, base_name: str) -> list[ClassRecord]:
        results = []
        for f in self.files.values():
            for c in f.classes:
                if base_name in c.bases:
                    results.append(c)
        return results
    
    def summary(self) -> str:
        total_classes = sum(len(f.classes) for f in self.files.values())
        total_functions = sum(len(f.functions) for f in self.files.values())
        return (
            f"SymbolMap: {len(self.files)} files, "
            f"{total_classes} classes, "
            f"{total_functions} functions"
        )
