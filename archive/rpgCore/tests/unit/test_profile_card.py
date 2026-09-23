import pytest
import pygame
from src.shared.ui.profile_card import ProfileCard, get_dominant_trait
from src.shared.ui.theme import DEFAULT_THEME
from src.shared.teams.roster import RosterSlime, TeamRole
from src.shared.genetics.genome import SlimeGenome
from src.shared.ui.spec import SPEC_720

@pytest.fixture
def mock_surface():
    pygame.display.set_mode((1, 1), pygame.HIDDEN)
    return pygame.Surface((400, 400))

@pytest.fixture
def sample_slime():
    genome = SlimeGenome(
        shape="round", size="medium", base_color=(100, 200, 100),
        pattern="spotted", pattern_color=(50, 50, 50), accessory="none",
        curiosity=0.8, energy=0.2, affection=0.1, shyness=0.1
    )
    return RosterSlime(slime_id="test_slime", name="Test Slime", genome=genome)

def test_profile_card_initialization(sample_slime):
    card = ProfileCard(sample_slime, (10, 10), SPEC_720, theme=DEFAULT_THEME)
    assert card.slime == sample_slime
    assert card.position == (10, 10)
    assert card.rect.width == 220
    assert card.rect.height == 140

def test_profile_card_renders_without_crash(mock_surface, sample_slime):
    card = ProfileCard(sample_slime, (10, 10), SPEC_720, theme=DEFAULT_THEME)
    # This just ensures no exceptions during render
    card.render(mock_surface)

def test_get_dominant_trait(sample_slime):
    # Curiosity is 0.8, highest
    assert get_dominant_trait(sample_slime.genome) == "Curious"
    
    sample_slime.genome.energy = 0.9
    assert get_dominant_trait(sample_slime.genome) == "Energetic"

def test_profile_card_team_badge_logic(sample_slime):
    card = ProfileCard(sample_slime, (10, 10), SPEC_720, theme=DEFAULT_THEME)
    # Unassigned state
    assert card.slime.team == TeamRole.UNASSIGNED
    
    # Check that rendering works in different team states
    sample_slime.team = TeamRole.DUNGEON
    card.render(pygame.Surface((400, 400))) 
    
    sample_slime.locked = True
    card.render(pygame.Surface((400, 400)))
