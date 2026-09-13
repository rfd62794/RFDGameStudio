"""
Tests for SlimeCarousel component
"""

import pytest
import pygame
from src.shared.ui.slime_carousel import SlimeCarousel, CarouselMode, CarouselFilter, CarouselResult
from src.shared.teams.roster import Roster, RosterSlime, TeamRole
from src.shared.genetics.genome import SlimeGenome, CulturalBase
from src.shared.ui.spec import UISpec, SPEC_720
from src.shared.ui.theme import DEFAULT_THEME


class TestSlimeCarousel:
    """Test SlimeCarousel component functionality."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.roster = Roster()
        self.spec = SPEC_720
        self.theme = DEFAULT_THEME
        
        # Create test slimes
        self.slime1 = RosterSlime(
            slime_id="test_slime_1",
            name="TestSlime1",
            genome=SlimeGenome(
                shape="round",
                size="medium",
                base_color=(255, 0, 0),
                pattern="solid",
                pattern_color=(200, 0, 0),
                accessory="none",
                curiosity=0.5,
                energy=0.5,
                affection=0.5,
                shyness=0.5,
                cultural_base=CulturalBase.EMBER,
                base_hp=20.0,
                base_atk=5.0,
                base_spd=5.0
            ),
            level=3
        )
        
        self.slime2 = RosterSlime(
            slime_id="test_slime_2",
            name="TestSlime2",
            genome=SlimeGenome(
                shape="round",
                size="medium",
                base_color=(0, 255, 0),
                pattern="solid",
                pattern_color=(0, 200, 0),
                accessory="none",
                curiosity=0.5,
                energy=0.5,
                affection=0.5,
                shyness=0.5,
                cultural_base=CulturalBase.MARSH,
                base_hp=20.0,
                base_atk=5.0,
                base_spd=5.0
            ),
            level=2
        )
        
        self.slime3 = RosterSlime(
            slime_id="test_slime_3",
            name="TestSlime3",
            genome=SlimeGenome(
                shape="round",
                size="medium",
                base_color=(0, 0, 255),
                pattern="solid",
                pattern_color=(0, 0, 200),
                accessory="none",
                curiosity=0.5,
                energy=0.5,
                affection=0.5,
                shyness=0.5,
                cultural_base=CulturalBase.TIDE,
                base_hp=20.0,
                base_atk=5.0,
                base_spd=5.0
            ),
            level=4
        )
        
        # Add slimes to roster
        self.roster.add_slime(self.slime1)
        self.roster.add_slime(self.slime2)
        self.roster.add_slime(self.slime3)
    
    def test_carousel_initializes_with_roster(self):
        """Test carousel initializes properly with roster."""
        carousel = SlimeCarousel(self.roster, CarouselMode.SINGLE, theme=self.theme, spec=self.spec)
        
        assert carousel.roster == self.roster
        assert carousel.mode == CarouselMode.SINGLE
        assert carousel.theme == self.theme
        assert carousel.spec == self.spec
        assert carousel.filter_type == CarouselFilter.ALL
        assert not carousel.is_complete
        assert carousel.result is None
        assert len(carousel.filtered_slimes) == 3
    
    def test_carousel_single_mode_returns_one(self):
        """Test single mode returns one slime when confirmed."""
        carousel = SlimeCarousel(self.roster, CarouselMode.SINGLE, theme=self.theme, spec=self.spec)
        
        # Navigate to first slime
        carousel.current_index = 0
        
        # Simulate select action
        carousel._select()
        
        # Check result
        assert carousel.is_complete
        assert carousel.result.confirmed
        assert len(carousel.result.selected) == 1
        assert carousel.result.selected[0] == self.slime1
        assert carousel.result.mode == CarouselMode.SINGLE.value
    
    def test_carousel_pair_mode_returns_two(self):
        """Test pair mode returns two slimes when confirmed."""
        carousel = SlimeCarousel(self.roster, CarouselMode.PAIR, theme=self.theme, spec=self.spec)
        
        # Select first slime
        carousel.current_index = 0
        carousel._select()
        assert len(carousel.selected_slimes) == 1
        assert carousel.selected_slimes[0] == self.slime1
        assert not carousel.is_complete
        
        # Select second slime
        carousel.current_index = 1
        carousel._select()
        
        # Check result
        assert carousel.is_complete
        assert carousel.result.confirmed
        assert len(carousel.result.selected) == 2
        assert self.slime1 in carousel.result.selected
        assert self.slime2 in carousel.result.selected
        assert carousel.result.mode == CarouselMode.PAIR.value
    
    def test_carousel_cancel_returns_confirmed_false(self):
        """Test cancel returns confirmed=False."""
        carousel = SlimeCarousel(self.roster, CarouselMode.SINGLE, theme=self.theme, spec=self.spec)
        
        # Cancel selection
        carousel._cancel()
        
        # Check result
        assert carousel.is_complete
        assert not carousel.result.confirmed
        assert len(carousel.result.selected) == 0
        assert carousel.result.mode == CarouselMode.SINGLE.value
    
    def test_carousel_filter_level_3_plus(self):
        """Test LEVEL_3_PLUS filter only shows level 3+ slimes."""
        carousel = SlimeCarousel(self.roster, CarouselMode.SINGLE, theme=self.theme, spec=self.spec)
        
        # Apply filter
        carousel._apply_filter(CarouselFilter.LEVEL_3_PLUS)
        
        # Check filtered results
        assert len(carousel.filtered_slimes) == 2  # slime1 (level 3) and slime3 (level 4)
        assert self.slime1 in carousel.filtered_slimes
        assert self.slime3 in carousel.filtered_slimes
        assert self.slime2 not in carousel.filtered_slimes  # level 2
    
    def test_carousel_filter_free_slimes(self):
        """Test FREE filter only shows unassigned slimes."""
        carousel = SlimeCarousel(self.roster, CarouselMode.SINGLE, theme=self.theme, spec=self.spec)
        
        # Assign one slime to a team
        self.slime1.team = TeamRole.DUNGEON
        
        # Apply filter
        carousel._apply_filter(CarouselFilter.FREE)
        
        # Check filtered results
        assert len(carousel.filtered_slimes) == 2
        assert self.slime1 not in carousel.filtered_slimes  # assigned to dungeon
        assert self.slime2 in carousel.filtered_slimes
        assert self.slime3 in carousel.filtered_slimes
    
    def test_carousel_navigation_wraps(self):
        """Test navigation wraps around at boundaries."""
        carousel = SlimeCarousel(self.roster, CarouselMode.SINGLE, theme=self.theme, spec=self.spec)
        
        # Start at index 0
        assert carousel.current_index == 0
        
        # Go back (should wrap to end)
        carousel._prev_slime()
        assert carousel.current_index == 2  # Last slime
        
        # Go forward (should wrap to start)
        carousel._next_slime()
        assert carousel.current_index == 0  # First slime
        
        # Navigate to end
        carousel._next_slime()
        carousel._next_slime()
        assert carousel.current_index == 2
        
        # Go forward (should wrap to start)
        carousel._next_slime()
        assert carousel.current_index == 0
    
    def test_carousel_empty_roster_handles_gracefully(self):
        """Test empty roster doesn't crash."""
        empty_roster = Roster()
        carousel = SlimeCarousel(empty_roster, CarouselMode.SINGLE, theme=self.theme, spec=self.spec)
        
        # Should not crash
        assert len(carousel.filtered_slimes) == 0
        assert carousel.current_index == 0
        
        # Navigation should not crash
        carousel._next_slime()
        carousel._prev_slime()
        
        # Select should not crash
        carousel._select()
        assert not carousel.is_complete  # No slime to select
    
    def test_carousel_pair_mode_prevents_duplicate_selection(self):
        """Test pair mode prevents selecting same slime twice."""
        carousel = SlimeCarousel(self.roster, CarouselMode.PAIR, theme=self.theme, spec=self.spec)
        
        # Select first slime
        carousel.current_index = 0
        carousel._select()
        assert len(carousel.selected_slimes) == 1
        
        # Try to select same slime again
        carousel._select()
        assert len(carousel.selected_slimes) == 1  # Should not add duplicate
        assert not carousel.is_complete  # Should not complete yet
    
    def test_carousel_browse_mode_no_selection(self):
        """Test browse mode doesn't allow selection."""
        carousel = SlimeCarousel(self.roster, CarouselMode.BROWSE, theme=self.theme, spec=self.spec)
        
        # Try to select
        carousel._select()
        
        # Should not complete or select anything
        assert not carousel.is_complete
        assert len(carousel.selected_slimes) == 0
        # Result is None when not complete
        assert carousel.result is None
    
    def test_carousel_animation_offset(self):
        """Test slide animation offset calculation."""
        carousel = SlimeCarousel(self.roster, CarouselMode.SINGLE, theme=self.theme, spec=self.spec)
        
        # Initial state
        assert carousel.slide_offset == 0.0
        assert carousel.target_offset == 0.0
        
        # Next slide
        carousel._next_slime()
        assert carousel.target_offset == -carousel.panel_rect.width
        
        # Previous slide
        carousel._prev_slime()
        assert carousel.target_offset == carousel.panel_rect.width
    
    def test_carousel_event_handling(self):
        """Test event handling returns result when complete."""
        carousel = SlimeCarousel(self.roster, CarouselMode.SINGLE, theme=self.theme, spec=self.spec)
        
        # Mock select event
        select_event = pygame.event.Event(pygame.KEYDOWN, key=pygame.K_RETURN)
        
        # Should not return result yet (no slime at index 0 in empty roster test)
        result = carousel.handle_event(select_event)
        assert result is None
        
        # Add slime and try again
        carousel.filtered_slimes = [self.slime1]
        carousel.current_index = 0
        
        result = carousel.handle_event(select_event)
        assert result is not None
        assert isinstance(result, CarouselResult)
        assert result.confirmed
    
    def test_carousel_escape_cancels(self):
        """Test ESC key cancels selection."""
        carousel = SlimeCarousel(self.roster, CarouselMode.SINGLE, theme=self.theme, spec=self.spec)
        
        # Mock escape event
        escape_event = pygame.event.Event(pygame.KEYDOWN, key=pygame.K_ESCAPE)
        
        # Handle escape event
        carousel.handle_event(escape_event)
        
        # Check result
        assert carousel.is_complete
        assert not carousel.result.confirmed
