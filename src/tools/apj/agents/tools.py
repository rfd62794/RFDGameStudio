"""
Agent Tools System - Provides tools that agents can use
Includes file operations, code analysis, testing, and more
"""

from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass
from enum import Enum
import subprocess
import os
from pathlib import Path
import json

class ToolType(Enum):
    """Tool categories"""
    FILE = "file"
    CODE = "code"
    TEST = "test"
    SYSTEM = "system"
    ANALYSIS = "analysis"
    COMMUNICATION = "communication"

@dataclass
class ToolResult:
    """Result from tool execution"""
    success: bool
    data: Any
    error: Optional[str] = None
    metadata: Dict[str, Any] = None

class BaseTool:
    """Base class for all agent tools"""
    
    def __init__(self, name: str, description: str, tool_type: ToolType):
        self.name = name
        self.description = description
        self.tool_type = tool_type
    
    def execute(self, *args, **kwargs) -> ToolResult:
        """Execute the tool"""
        raise NotImplementedError

class FileTool(BaseTool):
    """File manipulation tools"""
    
    def __init__(self):
        super().__init__("file_ops", "File operations", ToolType.FILE)
    
    def read_file(self, file_path: str) -> ToolResult:
        """Read file content"""
        try:
            path = Path(file_path)
            if not path.exists():
                return ToolResult(False, None, f"File not found: {file_path}")
            
            content = path.read_text(encoding="utf-8")
            return ToolResult(True, content, metadata={"size": len(content), "lines": len(content.splitlines())})
        except Exception as e:
            return ToolResult(False, None, str(e))
    
    def write_file(self, file_path: str, content: str) -> ToolResult:
        """Write content to file"""
        try:
            path = Path(file_path)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
            return ToolResult(True, f"Written {len(content)} characters to {file_path}")
        except Exception as e:
            return ToolResult(False, None, str(e))
    
    def list_files(self, directory: str, pattern: str = "*") -> ToolResult:
        """List files in directory"""
        try:
            path = Path(directory)
            if not path.exists():
                return ToolResult(False, None, f"Directory not found: {directory}")
            
            files = list(path.glob(pattern))
            file_info = []
            for file in files:
                file_info.append({
                    "name": file.name,
                    "path": str(file),
                    "is_dir": file.is_dir(),
                    "size": file.stat().st_size if file.is_file() else 0
                })
            
            return ToolResult(True, file_info, metadata={"count": len(file_info)})
        except Exception as e:
            return ToolResult(False, None, str(e))

class CodeTool(BaseTool):
    """Code analysis and manipulation tools"""
    
    def __init__(self):
        super().__init__("code_ops", "Code operations", ToolType.CODE)
    
    def analyze_code(self, file_path: str) -> ToolResult:
        """Analyze Python code file"""
        try:
            file_tool = FileTool()
            result = file_tool.read_file(file_path)
            if not result.success:
                return result
            
            content = result.data
            lines = content.splitlines()
            
            # Basic analysis
            analysis = {
                "total_lines": len(lines),
                "code_lines": len([l for l in lines if l.strip() and not l.strip().startswith("#")]),
                "comment_lines": len([l for l in lines if l.strip().startswith("#")]),
                "empty_lines": len([l for l in lines if not l.strip()]),
                "imports": self._extract_imports(content),
                "functions": self._extract_functions(content),
                "classes": self._extract_classes(content)
            }
            
            return ToolResult(True, analysis)
        except Exception as e:
            return ToolResult(False, None, str(e))
    
    def _extract_imports(self, content: str) -> List[str]:
        """Extract import statements"""
        imports = []
        for line in content.splitlines():
            line = line.strip()
            if line.startswith("import ") or line.startswith("from "):
                imports.append(line)
        return imports
    
    def _extract_functions(self, content: str) -> List[str]:
        """Extract function definitions"""
        import re
        pattern = r"def\s+(\w+)\s*\("
        return re.findall(pattern, content)
    
    def _extract_classes(self, content: str) -> List[str]:
        """Extract class definitions"""
        import re
        pattern = r"class\s+(\w+)"
        return re.findall(pattern, content)

class TestTool(BaseTool):
    """Testing tools"""
    
    def __init__(self):
        super().__init__("test_ops", "Testing operations", ToolType.TEST)
    
    def run_tests(self, test_path: str = None) -> ToolResult:
        """Run pytest tests"""
        try:
            cmd = ["python", "-m", "pytest"]
            if test_path:
                cmd.append(test_path)
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=".")
            
            return ToolResult(
                success=result.returncode == 0,
                data={
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                    "returncode": result.returncode
                }
            )
        except Exception as e:
            return ToolResult(False, None, str(e))
    
    def get_test_coverage(self) -> ToolResult:
        """Get test coverage report"""
        try:
            cmd = ["python", "-m", "pytest", "--cov=.", "--cov-report=json"]
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=".")
            
            if result.returncode == 0:
                # Try to read coverage.json
                try:
                    with open("coverage.json", "r") as f:
                        coverage_data = json.load(f)
                    return ToolResult(True, coverage_data)
                except:
                    pass
            
            return ToolResult(False, None, "Coverage report generation failed")
        except Exception as e:
            return ToolResult(False, None, str(e))

class SystemTool(BaseTool):
    """System operation tools"""
    
    def __init__(self):
        super().__init__("system_ops", "System operations", ToolType.SYSTEM)
    
    def run_command(self, command: str, cwd: str = ".") -> ToolResult:
        """Run system command"""
        try:
            result = subprocess.run(
                command, 
                shell=True, 
                capture_output=True, 
                text=True, 
                cwd=cwd
            )
            
            return ToolResult(
                success=result.returncode == 0,
                data={
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                    "returncode": result.returncode
                }
            )
        except Exception as e:
            return ToolResult(False, None, str(e))
    
    def get_git_status(self) -> ToolResult:
        """Get git repository status"""
        return self.run_command("git status --porcelain")

class ToolRegistry:
    """Registry for all available tools"""
    
    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}
        self._register_default_tools()
    
    def _register_default_tools(self):
        """Register default tools"""
        self.register_tool(FileTool())
        self.register_tool(CodeTool())
        self.register_tool(TestTool())
        self.register_tool(SystemTool())
    
    def register_tool(self, tool: BaseTool):
        """Register a tool"""
        self._tools[tool.name] = tool
    
    def get_tool(self, name: str) -> Optional[BaseTool]:
        """Get tool by name"""
        return self._tools.get(name)
    
    def get_all_tools(self) -> Dict[str, BaseTool]:
        """Get all tools"""
        return self._tools.copy()
    
    def execute_tool(self, tool_name: str, method: str, *args, **kwargs) -> ToolResult:
        """Execute a tool method"""
        tool = self.get_tool(tool_name)
        if not tool:
            return ToolResult(False, None, f"Tool not found: {tool_name}")
        
        if not hasattr(tool, method):
            return ToolResult(False, None, f"Method not found: {method}")
        
        try:
            return getattr(tool, method)(*args, **kwargs)
        except Exception as e:
            return ToolResult(False, None, str(e))

# Global tool registry
TOOL_REGISTRY = ToolRegistry()
