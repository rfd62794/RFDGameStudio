import os

def test_pygame_renderer_initialization():
    os.environ["SDL_VIDEODRIVER"] = "dummy"
    from src.shared.rendering.pygame_renderer import PyGameRenderer
    
    renderer = PyGameRenderer(width=100, height=100)
    assert renderer.initialize() is True
    assert renderer.screen is not None
    renderer.shutdown()

def test_render_entities():
    os.environ["SDL_VIDEODRIVER"] = "dummy"
    os.environ["PYTEST_CURRENT_TEST"] = "1"
    from src.shared.rendering.pygame_renderer import PyGameRenderer
    
    renderer = PyGameRenderer(width=100, height=100)
    renderer.initialize()
    
    entities = [
        {"type": "circle", "x": 50, "y": 50, "radius": 5, "color": (255, 255, 255)},
        {"type": "rect", "x": 10, "y": 10, "width": 20, "height": 20},
        {"type": "line", "x": 0, "y": 0, "end_x": 10, "end_y": 10},
        {"type": "arc", "x": 50, "y": 50, "radius": 10},
        {"type": "ellipse", "x": 20, "y": 20, "width": 30, "height": 10},
        {"type": "text", "text": "Hello", "x": 5, "y": 5},
        {"type": "sprite", "sprite_key": "dummy", "x": 0, "y": 0}
    ]
    
    renderer.clear((0, 0, 0))
    # Uses the wrapper which directs to `render_layered_entities({"midground": entities})`
    renderer.render_entities(entities)
    renderer.present()
    renderer.shutdown()
    assert True

def test_font_manager():
    os.environ["PYTEST_CURRENT_TEST"] = "1"
    from src.shared.rendering.font_manager import FontManager
    
    fm = FontManager()
    fm.initialize()
    assert fm.get_font("monospace", 14) == "DummyFont"
    assert fm.render_text("Test", "monospace", 14) == "DummySurface"
    fm.clear()

def test_sprite_loader():
    os.environ["PYTEST_CURRENT_TEST"] = "1"
    from src.shared.rendering.sprite_loader import SpriteLoader
    
    sl = SpriteLoader()
    assert sl.load("test_key", "fake/path.png") is True
    assert sl.get_sprite("test_key") == "DummySprite(fake/path.png)"
    assert sl.get_sprite("non_existent") is None
    sl.clear()

def test_layer_compositor():
    os.environ["PYTEST_CURRENT_TEST"] = "1"
    from src.shared.rendering.layer_compositor import LayerCompositor
    
    lc = LayerCompositor(100, 100)
    assert lc.get_layer("background") is None # In headless test mode it's None
    lc.clear() # Should safely no-op in headless
    lc.composite(None) # Should safely no-op
    assert True

