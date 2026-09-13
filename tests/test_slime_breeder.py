import pytest
import pygame
from src.shared.genetics import SlimeGenome, breed, generate_random
from src.apps.slime_breeder.entities.slime import Slime
from src.apps.slime_breeder.garden.garden_state import GardenState
from src.shared.rendering.slime_renderer import SlimeRenderer
from src.shared.physics import Vector2

def test_genome_generates_valid_traits():
    genome = generate_random()
    assert genome.shape in ["round", "cubic", "elongated", "crystalline", "amorphous"]
    assert genome.size in ["tiny", "small", "medium", "large", "massive"]
    assert len(genome.base_color) == 3
    assert 0.0 <= genome.curiosity <= 1.0

def test_breed_combines_parent_traits():
    parent_a = generate_random()
    parent_b = generate_random()
    child = breed(parent_a, parent_b, mutation_chance=0.0)
    
    # Check categorical (should be from one of parents)
    assert child.shape in [parent_a.shape, parent_b.shape]
    assert child.size in [parent_a.size, parent_b.size]

def test_mutation_occurs_within_bounds():
    # Force mutation
    parent = generate_random()
    # Breed identical parents with high mutation
    child = breed(parent, parent, mutation_chance=1.0)
    # Categoricals usually just pick parent or random (so they just need to be valid)
    assert child.shape in ["round", "cubic", "elongated", "crystalline", "amorphous"]
    # Floats should stay in [0, 1]
    assert 0.0 <= child.curiosity <= 1.0

def test_slime_personality_affects_velocity():
    genome = generate_random()
    genome.energy = 1.0
    genome.curiosity = 1.0
    slime = Slime("Fast", genome, (100, 100))
    slime._wander_timer = 10.0 # Prevent logic from resetting target
    
    # High energy slime should move after update if it has a target
    slime._target_pos = Vector2(200, 200)
    slime.update(0.1)
    assert slime.kinematics.velocity.magnitude() > 0

def test_garden_state_add_remove():
    state = GardenState()
    genome = generate_random()
    slime = Slime("Pip", genome, (100, 100))
    
    state.add_slime(slime)
    assert len(state.slimes) == 1
    assert state.get_slime("Pip") == slime
    
    state.remove_slime("Pip")
    assert len(state.slimes) == 0

def test_slime_renderer_initializes():
    renderer = SlimeRenderer()
    assert renderer.size_map["tiny"] == 8

@pytest.mark.skip(
    reason=(
        "Brittle integration test: depends on "
        "live save file state. Proper fixture "
        "requires SceneContext injection before "
        "initialize(). Tracked for Phase 4A "
        "when SlimeEntityTemplate lands."
    )
)
def test_garden_scene_initializes(monkeypatch):
    # Need pygame for scene init (mostly fonts/surfaces)
    pygame.init()
    surface = pygame.Surface((1024, 768))
    
    from src.apps.slime_breeder.ui.scene_garden import GardenScene
    from src.shared.ui.spec import SPEC_720
    
    # Mock manager
    class MockManager:
        def __init__(self):
            self.width = 1024
            self.height = 768
    
    scene = GardenScene(MockManager(), SPEC_720)
    
    # SceneManager calls initialize which calls on_enter
    scene.initialize()
    # Should have slimes loaded from save file (current save has 6 slimes)
    # This test verifies the scene initializes properly with existing data
    assert len(scene.garden_state.slimes) >= 1  # At least 1 slime
    assert scene.detail_panel is not None
    pygame.quit()
