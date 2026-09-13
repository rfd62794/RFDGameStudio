import json
import hashlib
from pathlib import Path
from dataclasses import asdict
from .schemas import SymbolMap, FileRecord, ClassRecord, FunctionRecord, ImportRecord

CACHE_PATH = Path("docs/agents/inventory/symbol_map_cache.json")

def _hash_src(project_root: Path) -> str:
    h = hashlib.md5()
    # Using the same SCAN_ROOTS as scanner.py
    for root in ["src/apps", "src/shared", "src/game_engine", "src/dgt_engine"]:
        p = project_root / root
        if not p.exists():
            continue
        for f in sorted(p.rglob("*.py")):
            # Simple hash based on file modification times
            h.update(str(f.stat().st_mtime).encode())
    return h.hexdigest()

def load_cache(project_root: Path) -> SymbolMap | None:
    cache_file = project_root / CACHE_PATH
    hash_file = project_root / (str(CACHE_PATH) + ".hash")
    
    if not cache_file.exists() or not hash_file.exists():
        return None
    
    current_hash = _hash_src(project_root)
    stored_hash = hash_file.read_text().strip()
    
    if current_hash != stored_hash:
        return None  # stale — rescan
    
    # load and reconstruct SymbolMap from JSON
    try:
        data = json.loads(cache_file.read_text())
        symbol_map = SymbolMap()
        for path, file_data in data.items():
            # reconstruct FileRecord from dict
            fr = FileRecord(
                path=file_data["path"],
                module_path=file_data["module_path"],
                line_count=file_data["line_count"],
            )
            for c in file_data.get("classes", []):
                fr.classes.append(ClassRecord(**c))
            for fn in file_data.get("functions", []):
                fr.functions.append(FunctionRecord(**fn))
            for imp in file_data.get("imports", []):
                fr.imports.append(ImportRecord(**imp))
            symbol_map.files[path] = fr
        return symbol_map
    except Exception:
        return None

def save_cache(project_root: Path, symbol_map: SymbolMap) -> None:
    cache_file = project_root / CACHE_PATH
    hash_file = project_root / (str(CACHE_PATH) + ".hash")
    cache_file.parent.mkdir(parents=True, exist_ok=True)
    
    data = {}
    for path, fr in symbol_map.files.items():
        data[path] = asdict(fr)
    
    cache_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
    hash_file.write_text(_hash_src(project_root), encoding="utf-8")
