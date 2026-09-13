import sys
import importlib
from typing import Optional
from src.launcher.renderer_base import LauncherRenderer
from src.launcher.manifest import DemoManifest

class CLILauncher(LauncherRenderer):
    def print_menu(self) -> None:
        print("\n=== rpgCore Demos ===")
        for i, demo in enumerate(self.registry.all(), start=1):
            marker = "" if demo.is_playable() else " [WIP]"
            print(f"{i}. {demo.name}{marker}")
        print("0. Exit")
        print("=====================")

    def print_list(self) -> None:
        print(self.registry.list_formatted())

    def print_info(self, demo_id: str) -> None:
        demo = self.registry.get(demo_id)
        if not demo:
            print(f"Error: Unknown demo '{demo_id}'")
            sys.exit(1)
        
        marker = "" if demo.is_playable() else " [WIP]"
        print(f"\n{demo.name}{marker}")
        print(f"Genre: {demo.genre}")
        print(f"Description: {demo.description}")
        print(f"Module: {demo.module}.{demo.entry}")

    def prompt_selection(self) -> Optional[str]:
        demos = self.registry.all()
        while True:
            try:
                choice = input("\nSelect a demo (number): ").strip()
                if not choice:
                    continue
                num = int(choice)
                if num == 0:
                    return None
                if 1 <= num <= len(demos):
                    return demos[num - 1].id
                print(f"Please enter a number between 0 and {len(demos)}")
            except ValueError:
                print("Invalid input. Please enter a number.")
            except (KeyboardInterrupt, EOFError):
                return None

    def show_menu(self) -> None:
        self.print_menu()

    def get_selection(self) -> Optional[str]:
        return self.prompt_selection()

    def launch(self, demo: DemoManifest) -> None:
        print(f"\nLaunching {demo.name}...")
        try:
            module = importlib.import_module(demo.module)
            entry_func = getattr(module, demo.entry)
            entry_func()
        except ImportError as e:
            print(f"Failed to import module {demo.module}: {e}")
            sys.exit(1)
        except AttributeError as e:
            print(f"Failed to find entry '{demo.entry}' in {demo.module}: {e}")
            sys.exit(1)
        except Exception as e:
            print(f"Error while running {demo.name}: {e}")
            raise
