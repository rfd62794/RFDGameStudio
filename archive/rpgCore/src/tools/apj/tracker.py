import os
import re
from datetime import datetime
from typing import List, Tuple, Optional

class MarkdownListTracker:
    """Manages parsing and mutating markdown checkbox lists organized by section tiers."""
    
    def __init__(self, file_path: str):
        self.file_path = file_path

    def load(self) -> str:
        """Reads and returns full content of the file."""
        if not os.path.exists(self.file_path):
            return ""
        with open(self.file_path, "r", encoding="utf-8") as f:
            return f.read()

    def get_section(self, name: str) -> str:
        """Extracts a named ## Section and its content."""
        content = self.load()
        pattern = rf"## {name}\n(.*?)(?=\n## |\Z)"
        match = re.search(pattern, content, re.DOTALL)
        if match:
            return match.group(1).strip()
        return ""

    def update_section(self, name: str, new_content: str):
        """Replaces a section's content in the file."""
        content = self.load()
        pattern = rf"## {name}\n(.*?)(?=\n## |\Z)"
        
        if re.search(pattern, content, re.DOTALL):
            new_section = rf"## {name}\n{new_content.strip()}\n"
            updated_content = re.sub(pattern, new_section, content, flags=re.DOTALL)
        else:
            updated_content = content.rstrip() + f"\n\n## {name}\n{new_content.strip()}\n"
            
        with open(self.file_path, "w", encoding="utf-8") as f:
            f.write(updated_content)

    def extract_metadata(self, line: str) -> Tuple[str, List[str]]:
        """Extracts text and metadata block. E.g. '(Goals: G1, G4)'"""
        match = re.search(r"\((.+?)\)$", line.strip())
        if match:
            text = line[:match.start()].strip()
            meta = match.group(1).strip()
            if ":" in meta:
                key, val = meta.split(":", 1)
                return text, [v.strip() for v in val.split(",")]
            return text, [meta]
        return line, []

    def get_top_items(self, section: str, n: int = -1, strip_boxes: bool = True) -> List[str]:
        """Returns the top items from a specific list tier."""
        content = self.get_section(section)
        if not content:
            return []
        
        lines = []
        for line in content.split("\n"):
            line = line.strip()
            if not line.startswith("-"):
                continue
            
            if strip_boxes:
                if line.startswith("- [ ] "):
                    lines.append(line[6:].strip())
                elif line.startswith("- [x] "):
                    lines.append(line[6:].strip())
                elif line.startswith("- "):
                    lines.append(line[2:].strip())
            else:
                lines.append(line)
                
        if n > 0:
            return lines[:n]
        return lines

    def append_item(self, section: str, text: str):
        """Appends a new item to the section."""
        current = self.get_section(section)
        new_content = current + f"\n- {text}" if current else f"- {text}"
        self.update_section(section, new_content)

    def mark_completed(self, pattern: str, from_sections: List[str], to_section: str = "Completed") -> bool:
        """Moves a matched item to the Completed section and checks it."""
        content = self.load()
        lines = content.split("\n")
        
        task_line = None
        new_lines = []
        
        in_target_section = False
        capturing_task = False
        
        for line in lines:
            if line.startswith("## "):
                in_target_section = any(s.lower() in line.lower() for s in from_sections)
                capturing_task = False
                new_lines.append(line)
                continue
                
            if in_target_section:
                if line.strip().startswith("- [ ]") or (line.strip().startswith("-") and not line.strip().startswith("- [x]")):
                    if pattern.lower() in line.lower() and task_line is None:
                        task_line = line
                        capturing_task = True
                        continue
                    else:
                        capturing_task = False
                elif capturing_task and line.strip() and not line.startswith("-"):
                    continue # Skip criteria/metadata attached to the task
            
            new_lines.append(line)
            
        if task_line:
            with open(self.file_path, "w", encoding="utf-8") as f:
                f.write("\n".join(new_lines))
                
            date_str = datetime.now().strftime("%Y-%m-%d")
            
            # Check the line
            if task_line.strip().startswith("- [ ]"):
                checked_line = task_line.replace("- [ ]", "- [x]", 1)
            elif task_line.strip().startswith("- "):
                checked_line = task_line.replace("- ", "- [x] ", 1)
            else:
                checked_line = f"- [x] {task_line.strip()}"
                
            completed_entry = f"{checked_line.strip()} ({date_str})"
            
            completed = self.get_section(to_section)
            new_completed = completed + f"\n{completed_entry}" if completed else completed_entry
            self.update_section(to_section, new_completed)
            return True
        return False
