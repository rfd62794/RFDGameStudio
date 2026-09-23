import pygame
import sys
from typing import Callable

class LegacySceneAdapter:
    """
    Wraps a standalone demo main() function as a Scene-compatible callable.
    Allows MainMenuScene to launch legacy apps without converting them
    to full Scene subclasses.
    
    Usage:
        adapter = LegacySceneAdapter(run_space_trader.main)
        adapter.launch()
    
    Contract:
        - Calls main() in the current process
        - On return, restores pygame display state for SceneManager
        - Does not crash if main() raises SystemExit (normal pygame quit)
    """
    
    def __init__(self, entry_func: Callable):
        self.entry_func = entry_func

    def launch(self) -> None:
        outer_surface = pygame.display.get_surface()
        if not outer_surface:
            try:
                self.entry_func()
            except SystemExit:
                pass
            return
            
        caption = pygame.display.get_caption()
        
        original_quit = pygame.quit
        original_display_quit = pygame.display.quit
        original_set_mode = getattr(pygame.display, 'set_mode')
        
        def mock_quit():
            pass
            
        def mock_set_mode(*args, **kwargs):
            return outer_surface
            
        pygame.quit = mock_quit
        pygame.display.quit = mock_quit
        setattr(pygame.display, 'set_mode', mock_set_mode)
            
        try:
            self.entry_func()
        except SystemExit:
            pass
        except Exception as e:
            print(f"Legacy app crashed: {e}")
        finally:
            pygame.quit = original_quit
            pygame.display.quit = original_display_quit
            setattr(pygame.display, 'set_mode', original_set_mode)
            
            outer_surface.fill((0, 0, 0))
            pygame.display.flip()
            if caption[0]:
                pygame.display.set_caption(caption[0])
