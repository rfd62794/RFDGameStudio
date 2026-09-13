"""
File classification system - identifies file purposes and demo associations
Does NOT modify SymbolMap, only reads it and classifies
"""

from dataclasses import dataclass
from typing import Dict, Optional
from .scanner import SymbolMap, FileRecord


@dataclass
class FileClassification:
    """Classification result for a single file"""
    path: str
    demo: Optional[str] = None         # "racing", "dungeon", "tower_defense", etc
    system: Optional[str] = None       # "ecs", "genetics", "physics", "ui", etc
    purpose: str = "other"             # "system", "demo", "ui", "util", "test"
    content_summary: str = ""          # One-line summary


class FileClassifier:
    """Classify files based on path, content, and structure"""
    
    def classify_all(self, symbol_map: SymbolMap) -> Dict[str, FileClassification]:
        """
        Classify all files in SymbolMap without modifying it
        Returns: {file_path: FileClassification}
        """
        classifications = {}
        
        for file_path, file_record in symbol_map.files.items():
            classification = self._classify_file(file_path, file_record)
            classifications[file_path] = classification
        
        return classifications
    
    def _classify_file(self, path: str, record: FileRecord) -> FileClassification:
        """Classify a single file"""
        demo = self._detect_demo(path)
        system = self._detect_system(path)
        purpose = self._detect_purpose(path, record, demo, system)
        content_summary = self._summarize(path, record)
        
        return FileClassification(
            path=path,
            demo=demo,
            system=system,
            purpose=purpose,
            content_summary=content_summary
        )
    
    def _detect_demo(self, path: str) -> Optional[str]:
        """Detect if file belongs to a demo"""
        path_lower = path.lower()
        
        demos = {
            "racing": ["racing_demo", "race_scene", "race_engine"],
            "dungeon": ["dungeon_crawler", "dungeon_scene", "dungeon_", "combat"],
            "breeding": ["breeding_demo", "breeding_scene", "genetics"],
            "tower_defense": ["tower_defense", "td_", "tower_"],
            "slime_breeder": ["slime_breeder", "scene_garden"],
            "slime_clan": ["slime_clan", "territorial_grid"],
            "exploratory": ["space_", "asteroids", "last_appointment", "turbo_shells"]
        }
        
        for demo_name, keywords in demos.items():
            if any(keyword in path_lower for keyword in keywords):
                return demo_name
        
        return None
    
    def _detect_system(self, path: str) -> Optional[str]:
        """Detect if file belongs to a system"""
        path_lower = path.lower()
        
        systems = {
            "ecs": ["ecs", "components", "systems", "registry"],
            "genetics": ["genetics", "genome", "breeding"],
            "physics": ["physics", "kinematics"],
            "rendering": ["rendering", "renderer", "sprite"],
            "ui": ["ui", "components"],
            "scene": ["scene", "scene_manager"],
            "pathfinding": ["pathfinding", "grid"],
            "persistence": ["session", "save", "load"]
        }
        
        for system_name, keywords in systems.items():
            if any(keyword in path_lower for keyword in keywords):
                return system_name
        
        return None
    
    def _detect_purpose(self, path: str, record: FileRecord, 
                       demo: Optional[str], system: Optional[str]) -> str:
        """Infer purpose from path and content"""
        path_lower = path.lower()
        
        # Classification priority
        if "test_" in path_lower or "_test.py" in path_lower:
            return "test"
        elif demo:
            return "demo"
        elif system:
            return "system"
        elif "ui" in path_lower:
            return "ui"
        elif "util" in path_lower or "helper" in path_lower:
            return "util"
        else:
            return "other"
    
    def _summarize(self, path: str, record: FileRecord) -> str:
        """Generate one-line summary of what file does"""
        # Try to get from docstring of first class/function
        if record.classes:
            first_class = record.classes[0]
            if first_class.docstring:
                # Take first line of docstring
                first_line = first_class.docstring.split('\n')[0].strip()
                return first_line[:80]  # Cap at 80 chars
        
        if record.functions:
            first_fn = record.functions[0]
            if first_fn.docstring:
                first_line = first_fn.docstring.split('\n')[0].strip()
                return first_line[:80]
        
        # Fallback: describe by purpose
        num_classes = len(record.classes)
        num_functions = len(record.functions)
        
        if num_classes > 0 and num_functions == 0:
            return f"Defines {num_classes} class(es)"
        elif num_functions > 0 and num_classes == 0:
            return f"Defines {num_functions} function(s)"
        elif num_classes > 0 and num_functions > 0:
            return f"Defines {num_classes} class(es) and {num_functions} function(s)"
        else:
            return "Utility module"
