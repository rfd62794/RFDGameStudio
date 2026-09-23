from abc import ABC, abstractmethod
from typing import Optional
from src.launcher.manifest import DemoManifest
from src.launcher.registry import DemoRegistry

class LauncherRenderer(ABC):
    def __init__(self, registry: DemoRegistry):
        self.registry = registry

    @abstractmethod
    def show_menu(self) -> None:
        pass

    @abstractmethod
    def get_selection(self) -> Optional[str]:
        pass

    @abstractmethod
    def launch(self, demo: DemoManifest) -> None:
        pass
