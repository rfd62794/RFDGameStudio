import os
import pytest

def test_sovereign_surface_init():
    os.environ["PYTEST_CURRENT_TEST"] = "1"
    from src.shared.rendering.sovereign_surface import SovereignSurface
    
    ss = SovereignSurface(320, 240)
    assert ss.virtual_width == 320
    assert ss.virtual_height == 240
    # In headless test mode, self.surface is None to avoid pygame display init
    assert ss.surface is None

def test_sovereign_surface_clear_and_present():
    os.environ["PYTEST_CURRENT_TEST"] = "1"
    from src.shared.rendering.sovereign_surface import SovereignSurface
    
    ss = SovereignSurface(320, 240)
    
    # Should safely no-op in headless tests
    ss.clear((255, 0, 0))
    ss.present(None)
    assert True
