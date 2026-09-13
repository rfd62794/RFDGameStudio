import json
from dataclasses import dataclass
from pathlib import Path
from typing import List, Union

@dataclass
class DemoManifest:
    id: str
    name: str
    description: str
    module: str
    entry: str
    status: str
    genre: str

    def is_playable(self) -> bool:
        return self.status == "playable"

    @staticmethod
    def load(path: Union[str, Path]) -> List['DemoManifest']:
        path = Path(path)
        if not path.exists():
            return []
        
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        return [DemoManifest(**demo_data) for demo_data in data.get("demos", [])]
