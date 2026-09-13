"""
Status reporter - aggregates inventory data for reporting
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional
from .scanner import SymbolMap
from .classifier import FileClassification


@dataclass
class InventoryStatus:
    """Complete inventory status snapshot"""
    timestamp: str
    total_files: int
    classified_files: int
    demos: Dict[str, Dict]  # demo_name -> {files, coverage, status}
    systems: Dict[str, Dict]  # system_name -> {files, coverage, status}
    docstrings: Dict  # coverage stats
    files: Dict  # files stats


class StatusReporter:
    """Generate inventory status reports"""
    
    def __init__(self, symbol_map: SymbolMap, classifications: Dict[str, FileClassification]):
        self.symbol_map = symbol_map
        self.classifications = classifications
    
    def get_status(self) -> InventoryStatus:
        """Generate complete status snapshot"""
        return InventoryStatus(
            timestamp=datetime.now().isoformat(),
            total_files=len(self.symbol_map.files),
            classified_files=len(self.classifications),
            demos=self._get_demo_status(),
            systems=self._get_system_status(),
            docstrings=self._get_docstring_status(),
            files=self._get_file_status()
        )
    
    def _get_demo_status(self) -> Dict[str, Dict]:
        """Status of each demo"""
        demos = {}
        
        # Get all unique demo names
        demo_names = set(c.demo for c in self.classifications.values() if c.demo)
        
        for demo_name in sorted(demo_names):
            files = [path for path, c in self.classifications.items() 
                     if c.demo == demo_name]
            coverage = self._calc_coverage(files)
            
            demos[demo_name] = {
                "files": len(files),
                "docstring_coverage": coverage,
                "status": "✅ Complete" if coverage >= 90 else "🔄 In Progress" if coverage >= 50 else "❌ Incomplete"
            }
        
        return demos
    
    def _get_system_status(self) -> Dict[str, Dict]:
        """Status of each system"""
        systems = {}
        
        # Get all unique system names
        system_names = set(c.system for c in self.classifications.values() if c.system)
        
        for system_name in sorted(system_names):
            files = [path for path, c in self.classifications.items() 
                     if c.system == system_name]
            coverage = self._calc_coverage(files)
            
            systems[system_name] = {
                "files": len(files),
                "docstring_coverage": coverage,
                "status": "✅ Complete" if coverage >= 90 else "🔄 In Progress" if coverage >= 50 else "❌ Incomplete"
            }
        
        return systems
    
    def _get_file_status(self) -> Dict:
        """Overall file status"""
        return {
            "total_files": len(self.symbol_map.files),
            "classified_files": len(self.classifications),
            "unclassified_files": len(self.symbol_map.files) - len(self.classifications),
            "unique_demos": len(set(c.demo for c in self.classifications.values() if c.demo)),
            "unique_systems": len(set(c.system for c in self.classifications.values() if c.system))
        }
    
    def _get_docstring_status(self) -> Dict:
        """Docstring coverage statistics"""
        total_classes = sum(len(f.classes) for f in self.symbol_map.files.values())
        total_functions = sum(len(f.functions) for f in self.symbol_map.files.values())
        total_symbols = total_classes + total_functions
        
        with_docstrings = 0
        for f in self.symbol_map.files.values():
            with_docstrings += sum(1 for c in f.classes if c.docstring)
            with_docstrings += sum(1 for fn in f.functions if fn.docstring)
        
        coverage_percent = (with_docstrings / total_symbols * 100) if total_symbols > 0 else 0
        
        return {
            "total_symbols": total_symbols,
            "total_classes": total_classes,
            "total_functions": total_functions,
            "with_docstrings": with_docstrings,
            "coverage_percent": round(coverage_percent, 1),
            "missing_docstrings": total_symbols - with_docstrings
        }
    
    def _calc_coverage(self, files: List[str]) -> float:
        """Calculate docstring coverage for specific files"""
        if not files:
            return 0
        
        total = 0
        with_docs = 0
        
        for file_path in files:
            if file_path in self.symbol_map.files:
                f = self.symbol_map.files[file_path]
                total += len(f.classes) + len(f.functions)
                with_docs += sum(1 for c in f.classes if c.docstring)
                with_docs += sum(1 for fn in f.functions if fn.docstring)
        
        if total == 0:
            return 0
        
        return round((with_docs / total * 100), 1)
    
    def get_missing_docstrings(self, limit: int = 20) -> List[Dict]:
        """Get list of symbols missing docstrings"""
        missing = []
        
        for file_path, f in self.symbol_map.files.items():
            for cls in f.classes:
                if not cls.docstring:
                    missing.append({
                        "symbol": cls.name,
                        "type": "class",
                        "file": file_path,
                        "line": cls.line_start
                    })
            
            for fn in f.functions:
                if not fn.docstring:
                    missing.append({
                        "symbol": fn.name,
                        "type": "function",
                        "file": file_path,
                        "line": fn.line_start
                    })
        
        return sorted(missing, key=lambda x: (x['file'], x['line']))[:limit]
