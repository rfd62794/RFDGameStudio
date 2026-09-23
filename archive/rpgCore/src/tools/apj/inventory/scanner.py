import ast
import logging
from pathlib import Path
from .schemas import (
    FileRecord, ClassRecord, FunctionRecord,
    ImportRecord, SymbolMap
)

logger = logging.getLogger(__name__)

# Directories to skip entirely
SKIP_DIRS = {
    ".git", "__pycache__", ".venv", "venv",
    "node_modules", ".uv", "dist", "build",
    ".pytest_cache", ".mypy_cache",
}

# Only scan these — avoid scanning APJ tooling itself
# scanning its own prompts/logs
SCAN_ROOTS = [
    "src/apps",
    "src/shared",
    "src/game_engine",
    "src/dgt_engine",
]

class ASTScanner:
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
    
    def scan(self) -> SymbolMap:
        symbol_map = SymbolMap()
        scanned = 0
        errors = 0
        
        for root_rel in SCAN_ROOTS:
            root_abs = self.project_root / root_rel
            if not root_abs.exists():
                continue
            for py_file in root_abs.rglob("*.py"):
                if any(skip in py_file.parts for skip in SKIP_DIRS):
                    continue
                try:
                    record = self._scan_file(py_file)
                    if record:
                        rel = str(py_file.relative_to(self.project_root))
                        symbol_map.files[rel] = record
                        scanned += 1
                except Exception as e:
                    logger.warning(f"Scanner: failed to parse {py_file}: {e}")
                    errors += 1
        
        logger.info(
            f"Scanner: {scanned} files scanned, "
            f"{errors} errors — {symbol_map.summary()}"
        )
        return symbol_map
    
    def _scan_file(self, path: Path) -> FileRecord | None:
        source = path.read_text(encoding="utf-8", errors="replace")
        if not source.strip():
            return None
        
        try:
            tree = ast.parse(source, filename=str(path))
        except SyntaxError as e:
            logger.warning(f"Scanner: syntax error in {path}: {e}")
            return None
        
        rel_path = str(path.relative_to(self.project_root)).replace("\\", "/")
        module_path = rel_path.replace("/", ".").removesuffix(".py")
        
        record = FileRecord(
            path=rel_path,
            module_path=module_path,
            line_count=len(source.splitlines()),
        )
        
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                record.classes.append(self._extract_class(node, rel_path))
            elif isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef):
                # top-level functions only (not methods — methods captured in class)
                if self._is_top_level(tree, node):
                    record.functions.append(
                        self._extract_function(node, rel_path, is_method=False)
                    )
            elif isinstance(node, ast.Import):
                for alias in node.names:
                    record.imports.append(ImportRecord(
                        module=alias.name,
                        names=[alias.asname or alias.name],
                        is_from_import=False,
                    ))
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    record.imports.append(ImportRecord(
                        module=node.module,
                        names=[a.name for a in node.names],
                        is_from_import=True,
                    ))
        
        return record
    
    def _extract_class(self, node: ast.ClassDef, file: str) -> ClassRecord:
        bases = []
        for base in node.bases:
            if isinstance(base, ast.Name):
                bases.append(base.id)
            elif isinstance(base, ast.Attribute):
                # Handle cases like 'models.BaseModel'
                if isinstance(base.value, ast.Name):
                    bases.append(f"{base.value.id}.{base.attr}")
                else:
                    bases.append(base.attr)
        
        methods = [
            n.name for n in ast.walk(node)
            if isinstance(n, ast.FunctionDef | ast.AsyncFunctionDef)
            and n.col_offset > node.col_offset
        ]
        
        docstring = ast.get_docstring(node)
        
        return ClassRecord(
            name=node.name,
            file=file,
            line_start=node.lineno,
            line_end=getattr(node, 'end_lineno', node.lineno),
            bases=bases,
            methods=methods,
            docstring=docstring,
        )
    
    def _extract_function(
        self,
        node: ast.FunctionDef | ast.AsyncFunctionDef,
        file: str,
        is_method: bool,
        parent_class: str | None = None,
    ) -> FunctionRecord:
        args = [
            a.arg for a in node.args.args
            if a.arg != "self" and a.arg != "cls"
        ]
        
        calls = []
        for child in ast.walk(node):
            if isinstance(child, ast.Call):
                if isinstance(child.func, ast.Name):
                    calls.append(child.func.id)
                elif isinstance(child.func, ast.Attribute):
                    calls.append(child.func.attr)
        
        return FunctionRecord(
            name=node.name,
            file=file,
            line_start=node.lineno,
            line_end=getattr(node, 'end_lineno', node.lineno),
            args=args,
            docstring=ast.get_docstring(node),
            calls=list(set(calls)),
            is_method=is_method,
            parent_class=parent_class,
        )
    
    def _is_top_level(
        self,
        tree: ast.Module,
        node: ast.FunctionDef | ast.AsyncFunctionDef
    ) -> bool:
        for child in ast.iter_child_nodes(tree):
            if child is node:
                return True
        return False
