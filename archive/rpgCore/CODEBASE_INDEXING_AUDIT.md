# Codebase Indexing Audit
## DGT Engine - Existing Symbol Maps and Code Navigation Systems
**Date**: 2025-02-28  
**Scope**: Audit of existing codebase indexing, symbol maps, and navigation systems

---

## **1. EXISTING CODEBASE INDEXING SYSTEMS**

### **1.1 SymbolMap Cache** ✅
- **Location**: `docs/agents/inventory/symbol_map_cache.json`
- **Purpose**: Persistent cache of codebase symbol information
- **Current Function**: JSON-based storage of SymbolMap data
- **Status**: ✅ Operational

#### **Cache Statistics**
- **File Size**: 1.48MB (1,482,558 bytes)
- **Files Indexed**: 552 Python files
- **Classes Indexed**: 1,396 classes
- **Functions Indexed**: 449 functions
- **Hash Validation**: MD5-based hash for cache invalidation

#### **Cache Structure**
```json
{
  "src\\apps\\dgt_launcher.py": {
    "path": "src/apps/dgt_launcher.py",
    "module_path": "src.apps.dgt_launcher",
    "classes": [
      {
        "name": "ApplicationMode",
        "file": "src/apps/dgt_launcher.py",
        "line_start": 28,
        "line_end": 37,
        "bases": ["Enum"],
        "methods": [],
        "docstring": "Available application modes"
      }
    ],
    "functions": [],
    "imports": []
  }
}
```

### **1.2 ASTScanner** ✅
- **Location**: `src/tools/apj/inventory/scanner.py`
- **Purpose**: AST-based code scanning and symbol extraction
- **Current Function**: Parses Python files for symbols
- **Status**: ✅ Operational

#### **Scanning Process**
```python
class ASTScanner:
    def scan(self) -> SymbolMap:
        # Scan SCAN_ROOTS = ["src/apps", "src/shared", "src/game_engine", "src/dgt_engine"]
        # Parse AST for classes, functions, imports
        # Extract docstrings, line numbers, relationships
        # Return SymbolMap with all discovered symbols
```

#### **Extraction Capabilities**
- **Classes**: Name, file, line range, bases, methods, docstring
- **Functions**: Name, file, line range, args, docstring, calls
- **Imports**: Module, names, import type (from/import)
- **Relationships**: Class inheritance, function calls

### **1.3 ContextBuilder** ✅
- **Location**: `src/tools/apj/inventory/context_builder.py`
- **Purpose**: Builds relevant codebase context for agent directives
- **Current Function**: Keyword-based file selection and context assembly
- **Status**: ✅ Operational

#### **Context Building Process**
```python
class ContextBuilder:
    def build(self, intent: str) -> ContextSlice:
        # Extract keywords from intent
        # Find relevant files via SymbolMap
        # Always include scene_base
        # Build ContextSlice for Herald directive
```

#### **Context Features**
- **Keyword Extraction**: Extract keywords from task descriptions
- **File Relevance**: Select files relevant to current task
- **Context Assembly**: Build ContextSlice for agent use
- **Missing Docstrings**: Identify symbols lacking docstrings

### **1.4 Cache Management** ✅
- **Location**: `src/tools/apj/inventory/cache.py`
- **Purpose**: Persistent caching and hash validation
- **Current Function**: JSON-based cache with automatic invalidation
- **Status**: ✅ Operational

#### **Cache Features**
```python
# Cache location: docs/agents/inventory/symbol_map_cache.json
# Hash validation: Based on file modification times
# SCAN_ROOTS: ["src/apps", "src/shared", "src/game_engine", "src/dgt_engine"]
# Automatic invalidation: When source files change
```

---

## **2. CURRENT INDEXING CAPABILITIES**

### **2.1 Symbol Discovery** ✅
- **Classes**: 1,396 classes indexed with full metadata
- **Functions**: 449 functions indexed with signatures
- **Imports**: Module imports tracked and categorized
- **Docstrings**: Presence/absence detected for all symbols

### **2.2 Search Capabilities** ✅
- **Keyword Search**: Find files by keyword in symbol names
- **Class Search**: Find specific class locations and inheritance
- **Function Search**: Find specific function locations and signatures
- **Import Tracking**: Track module dependencies

### **2.3 Context Building** ✅
- **Intent Analysis**: Extract keywords from task descriptions
- **File Relevance**: Select files relevant to current task
- **Context Assembly**: Build ContextSlice for agent use
- **Integration**: Works with Herald agent for grounded directives

### **2.4 Navigation Support** ✅
- **File Paths**: Real file paths for all indexed symbols
- **Line Numbers**: Precise line start/end for all symbols
- **Module Paths**: Python module paths for all files
- **Relationships**: Class inheritance and function calls tracked

---

## **3. INTEGRATION POINTS**

### **3.1 APJ Agent System** ✅
- **Herald Agent**: Uses ContextBuilder for grounded directives
- **Strategist Agent**: Uses SymbolMap for planning decisions
- **Archivist Agent**: Uses SymbolMap for constitutional compliance
- **Scribe Agent**: Uses SymbolMap for change documentation

#### **Herald Integration**
```python
# In Herald.run()
builder = ContextBuilder(_PROJECT_ROOT)
context_slice = builder.build(intent)
context_text = context_slice.to_prompt_text()
# Inject context into agent prompt
```

### **3.2 CLI Interface** ✅
- **Inventory Commands**: Available via `python -m src.tools.apj inventory`
- **Search Commands**: Find classes, functions, keywords
- **Sweep Command**: Identify missing docstrings
- **Cache Management**: Automatic cache invalidation

#### **Available Commands**
```bash
python -m src.tools.apj inventory scan      # Scan and cache all files
python -m src.tools.apj inventory find <keyword>  # Find files by keyword
python -m src.tools.apj inventory classes <name>  # Find class locations
python -m src.tools.apj inventory sweep      # Find missing docstrings
```

### **3.3 Agent Grounding** ✅
- **Real File Paths**: Agents get actual file paths, not invented ones
- **Context Awareness**: Agents understand codebase structure
- **Symbol Knowledge**: Agents know what symbols exist and where
- **Relationship Understanding**: Agents understand inheritance and dependencies

---

## **4. CURRENT INDEXING COVERAGE**

### **4.1 Directory Coverage**
- **Scanned Directories**: 
  - `src/apps` (demonstrations)
  - `src/shared` (shared systems)
  - `src/game_engine` (legacy engine)
  - `src/dgt_engine` (legacy engine)
- **Excluded Directories**: .git, __pycache__, .venv, node_modules, .uv, dist, build
- **File Types**: Python files only (*.py)

### **4.2 Symbol Coverage**
- **Total Files**: 552 Python files indexed
- **Classes**: 1,396 classes indexed
- **Functions**: 449 functions indexed
- **Imports**: Module imports tracked
- **Docstrings**: Presence/absence detected

### **4.3 Relationship Coverage**
- **Inheritance**: Class bases tracked
- **Calls**: Function calls within functions tracked
- **Imports**: Module dependencies tracked
- **Hierarchy**: Class methods and relationships tracked

---

## **5. LIMITATIONS AND GAPS**

### **5.1 Current Limitations** 🔄
- **Python Only**: Only indexes Python files, no other languages
- **Static Analysis**: AST-based, no runtime information
- **Limited Scope**: Only scans specified directories
- **No Content Indexing**: Doesn't index file contents, only structure

### **5.2 Missing Features** ❌
- **File Content Indexing**: No catalog of what's inside files
- **Full Text Search**: No search within file contents
- **Cross-Reference**: No cross-reference between symbols
- **Dependency Graph**: No dependency mapping between files
- **Change Tracking**: No tracking of symbol modifications over time

### **5.3 Integration Gaps** 🔄
- **ADJ System**: Not integrated with new ADJ CLI
- **Dashboard**: No indexing statistics in ADJ_DASHBOARD.md
- **Navigation Tools**: No IDE integration or navigation tools
- **Documentation**: No comprehensive documentation index

---

## **6. RECOMMENDATIONS**

### **6.1 Immediate Extensions** (This Session)
1. **Add Content Indexing**: Index file contents for search
2. **Full Text Search**: Add search within file contents
3. **Cross-Reference**: Track symbol relationships
4. **ADJ Integration**: Add indexing statistics to ADJ_DASHBOARD.md

### **6.2 Medium-term Enhancements** (Next Week)
1. **Dependency Graph**: Build dependency mapping between files
2. **Change Tracking**: Track symbol modifications over time
3. **Navigation Tools**: IDE integration for code navigation
4. **Documentation Index**: Comprehensive documentation catalog

### **6.3 Long-term Vision** (Future)
- **Multi-Language Support**: Extend beyond Python files
- **Runtime Analysis**: Add runtime information to static analysis
- **Intelligent Search**: AI-powered code search and navigation
- **Automated Documentation**: Generate documentation from code structure

---

## **7. NEXT STEPS**

### **7.1 Immediate Actions**
1. **Review Current Schema**: Understand SymbolMap data structure
2. **Add Content Indexing**: Extend schemas to include file contents
3. **Add Search Commands**: Implement full-text search capabilities
4. **Integrate with ADJ**: Add indexing statistics to dashboard

### **7.2 Implementation Planning**
1. **Content Indexing**: Design file content indexing system
2. **Search Engine**: Implement full-text search engine
3. **Cross-Reference**: Build symbol relationship mapping
4. **Navigation Tools**: Create code navigation utilities

### **7.3 Integration Strategy**
1. **ADJ CLI**: Add indexing commands to adj.py
2. **Dashboard**: Show indexing statistics in status
3. **IDE Integration**: Create IDE plugins for navigation
4. **Documentation**: Generate documentation from index data

---

## **8. CONCLUSION**

### **Current State**
- **Comprehensive Indexing**: 552 files, 1,396 classes, 449 functions indexed
- **Fast Search**: Keyword, class, and function search available
- **Agent Grounding**: Agents get real file paths and context
- **Persistent Cache**: Efficient caching with automatic invalidation

### **Key Strengths**
- **Comprehensive**: Extensive symbol and relationship tracking
- **Fast**: Cached lookups, efficient search
- **Accurate**: AST-based parsing ensures accuracy
- **Integrated**: Works with APJ agent system

### **Extension Ready**
- **Schema Extensible**: Easy to add new indexing capabilities
- **Search Extensible**: Easy to add new search types
- **Integration Ready**: Easy to integrate with ADJ system
- **Performance Ready**: Caching system handles growth

---

**Status**: ✅ **AUDIT COMPLETE** - Codebase indexing system is comprehensive and ready for extension.
