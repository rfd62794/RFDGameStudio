import pytest
from pathlib import Path
from src.tools.apj.inventory.context_builder import ContextBuilder, ContextSlice
from src.tools.apj.inventory.schemas import SymbolMap, FileRecord, ClassRecord

def test_context_builder_extract_keywords():
    builder = ContextBuilder(Path("."))
    keywords = builder._extract_keywords("build a mini-map and door system")
    # should remove stop words like 'a', 'and', 'system'
    assert "mini" in keywords
    assert "map" in keywords
    assert "door" in keywords
    assert "build" not in keywords
    assert "and" not in keywords

def test_context_builder_always_includes_scene_base():
    symbol_map = SymbolMap()
    scene_base_file = FileRecord(path="src/shared/ui/scene_base.py", module_path="src.shared.ui.scene_base")
    scene_base_file.classes.append(ClassRecord(name="SceneBase", file="src/shared/ui/scene_base.py", line_start=1, line_end=10, bases=[], methods=[], docstring=None))
    symbol_map.files["src/shared/ui/scene_base.py"] = scene_base_file
    
    builder = ContextBuilder(Path("."))
    builder._symbol_map = symbol_map
    
    slice = builder.build("combat system")
    assert any(f.path == "src/shared/ui/scene_base.py" for f in slice.relevant_files)

def test_context_builder_to_prompt_text_no_invented_paths():
    slice = ContextSlice(
        intent="test",
        relevant_files=[FileRecord(path="real/path.py", module_path="real.path")],
        key_classes=[ClassRecord(name="RealClass", file="real/path.py", line_start=1, line_end=5, bases=[], methods=[], docstring="Docs")],
        key_functions=[],
        missing_docstrings=[]
    )
    text = slice.to_prompt_text()
    assert "real/path.py" in text
    assert "RealClass" in text
    assert "CODEBASE CONTEXT" in text

def test_context_slice_caps_results():
    symbol_map = SymbolMap()
    # Create 20 files
    for i in range(20):
        path = f"file_{i}.py"
        f = FileRecord(path=path, module_path=f"file_{i}")
        f.classes.append(ClassRecord(name=f"Class{i}", file=path, line_start=1, line_end=2, bases=[], methods=[], docstring=None))
        symbol_map.files[path] = f
    
    builder = ContextBuilder(Path("."))
    builder._symbol_map = symbol_map
    
    # Keyword that matches everything (not really, but we'll mock keywords)
    builder._extract_keywords = lambda x: ["file"] # match all 'file_i.py'
    
    slice = builder.build("anything")
    assert len(slice.relevant_files) <= 12
    assert len(slice.key_classes) <= 15
