from typing import List, Optional
from src.launcher.manifest import DemoManifest

class DemoRegistry:
    def __init__(self, manifests: List[DemoManifest]):
        self._manifests = manifests
        self._by_id = {m.id: m for m in manifests}

    def all(self) -> List[DemoManifest]:
        return self._manifests

    def playable(self) -> List[DemoManifest]:
        return [m for m in self._manifests if m.is_playable()]

    def get(self, demo_id: str) -> Optional[DemoManifest]:
        return self._by_id.get(demo_id)

    def list_formatted(self) -> str:
        lines = []
        for d in self._manifests:
            marker = "" if d.is_playable() else " [WIP]"
            lines.append(f"{d.name}{marker} ({d.id}) - {d.description}")
        return "\n".join(lines)
