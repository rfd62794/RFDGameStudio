import pytest
from pathlib import Path
from src.tools.apj.inventory.scanner import ASTScanner
from src.tools.apj.inventory.schemas import SymbolMap, FileRecord, ClassRecord, FunctionRecord

def test_scanner_finds_class(tmp_path):
    py_file = tmp_path / "test_module.py"
    py_file.write_text("""
class Base:
    def method(self):
        pass

class Sub(Base):
    def another(x, y):
        return x + y
""", encoding="utf-8")
    
    scanner = ASTScanner(tmp_path)
    # Mock SCAN_ROOTS for testing purposes if needed, 
    # but here we can just point scanner to tmp_path and 
    # since we want it to find the file we should add it to 
    # a mocked SCAN_ROOTS or just test the _scan_file method directly.
    
    record = scanner._scan_file(py_file)
    assert record is not None
    assert len(record.classes) == 2
    
    base_class = next(c for c in record.classes if c.name == "Base")
    assert base_class.bases == []
    assert "method" in base_class.methods
    
    sub_class = next(c for c in record.classes if c.name == "Sub")
    assert sub_class.bases == ["Base"]
    assert "another" in sub_class.methods

def test_scanner_finds_function(tmp_path):
    py_file = tmp_path / "funcs.py"
    py_file.write_text("""
def top_level(a, b=None):
    \"\"\"Docstring here.\"\"\"
    return a
""", encoding="utf-8")
    
    scanner = ASTScanner(tmp_path)
    record = scanner._scan_file(py_file)
    
    assert record is not None
    assert len(record.functions) == 1
    fn = record.functions[0]
    assert fn.name == "top_level"
    assert fn.args == ["a", "b"]
    assert fn.docstring == "Docstring here."
    assert fn.is_method is False

def test_scanner_finds_imports(tmp_path):
    py_file = tmp_path / "imports.py"
    py_file.write_text("""
import os
from pathlib import Path
from typing import List, Optional as Opt
""", encoding="utf-8")
    
    scanner = ASTScanner(tmp_path)
    record = scanner._scan_file(py_file)
    
    assert record is not None
    assert len(record.imports) == 3
    
    mod_imports = [i for i in record.imports if not i.is_from_import]
    assert any(i.module == "os" for i in mod_imports)
    
    from_imports = [i for i in record.imports if i.is_from_import]
    assert any(i.module == "pathlib" and "Path" in i.names for i in from_imports)
    assert any(i.module == "typing" and "List" in i.names for i in from_imports)

def test_scanner_skips_syntax_errors(tmp_path):
    py_file = tmp_path / "bad.py"
    py_file.write_text("class 123: pass", encoding="utf-8")
    
    scanner = ASTScanner(tmp_path)
    record = scanner._scan_file(py_file)
    assert record is None

def test_scanner_skips_empty_files(tmp_path):
    py_file = tmp_path / "empty.py"
    py_file.write_text("   \n\t ", encoding="utf-8")
    
    scanner = ASTScanner(tmp_path)
    record = scanner._scan_file(py_file)
    assert record is None

def test_symbol_map_find_by_keyword():
    symbol_map = SymbolMap()
    f1 = FileRecord(path="src/combat.py", module_path="src.combat")
    f1.classes.append(ClassRecord(name="CombatEngine", file="src/combat.py", line_start=1, line_end=10, bases=[], methods=[], docstring=None))
    
    f2 = FileRecord(path="src/utils.py", module_path="src.utils")
    f2.functions.append(FunctionRecord(name="calculate_damage", file="src/utils.py", line_start=1, line_end=5, args=[], docstring=None, calls=[], is_method=False, parent_class=None))
    
    symbol_map.files["src/combat.py"] = f1
    symbol_map.files["src/utils.py"] = f2
    
    # Keyword in path
    assert len(symbol_map.find_by_keyword("combat")) == 1
    # Keyword in class name
    assert len(symbol_map.find_by_keyword("Engine")) == 1
    # Keyword in function name
    assert len(symbol_map.find_by_keyword("damage")) == 1
    # No match
    assert len(symbol_map.find_by_keyword("notfound")) == 0

def test_symbol_map_find_subclasses():
    symbol_map = SymbolMap()
    f = FileRecord(path="test.py", module_path="test")
    f.classes.append(ClassRecord(name="A", file="test.py", line_start=1, line_end=2, bases=["Base"], methods=[], docstring=None))
    f.classes.append(ClassRecord(name="B", file="test.py", line_start=3, line_end=4, bases=["Other"], methods=[], docstring=None))
    symbol_map.files["test.py"] = f
    
    results = symbol_map.find_subclasses("Base")
    assert len(results) == 1
    assert results[0].name == "A"

def test_cache_roundtrip(tmp_path):
    from src.tools.apj.inventory.cache import save_cache, load_cache, CACHE_PATH
    
    # Setup scan roots in temp dir to avoid hashing real src
    (tmp_path / "src/apps").mkdir(parents=True)
    f_test = tmp_path / "src/apps/test.py"
    f_test.write_text("class Test: pass")
    
    symbol_map = SymbolMap()
    fr = FileRecord(path="src/apps/test.py", module_path="src.apps.test", line_count=1)
    fr.classes.append(ClassRecord(name="Test", file="src/apps/test.py", line_start=1, line_end=1, bases=[], methods=[], docstring=None))
    symbol_map.files["src/apps/test.py"] = fr
    
    # Mock SCAN_ROOTS or just let _hash_src look at the temp project_root
    save_cache(tmp_path, symbol_map)
    
    loaded = load_cache(tmp_path)
    assert loaded is not None
    assert "src/apps/test.py" in loaded.files
    loaded_fr = loaded.files["src/apps/test.py"]
    assert loaded_fr.module_path == "src.apps.test"
    assert len(loaded_fr.classes) == 1
    assert loaded_fr.classes[0].name == "Test"
