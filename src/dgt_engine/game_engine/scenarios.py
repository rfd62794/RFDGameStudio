"""
Emerald City Scenario

A second location to test the Social Graph with persistent NPC knowledge.
The Janitor knows the sewer secret and should reveal it when asked properly.
"""

from game_state import GameState, Room, NPC, Relationship


def create_emerald_city_scenario(state: GameState | None = None) -> GameState:
    """
    Create Emerald City with Janitor who knows sewer secret.
    
    Tests:
    - Social graph with location isolation
    - Tag-based knowledge ("knows_sewer_secret")
    - Multi-location persistence
    """
    if state is None:
        state = GameState()
    
    # Build Emerald City room
    emerald_city = Room(
        name="Emerald City Plaza",
        description=(
            "A gleaming plaza paved with green marble. Fountains sparkle in the sunlight, "
            "and well-dressed citizens hurry past. The air smells of perfume and fresh bread."
        ),
        npcs=[
            NPC(
                name="Janitor",
                state="neutral",
                hp=40,
                description="An elderly man with a mop, quietly cleaning the fountain"
            ),
            NPC(
                name="Merchant",
                state="neutral",
                hp=50,
                description="A portly woman selling silk scarves from a cart"
            )
        ],
        items=["fountain", "silk cart", "marble bench"],
        exits={"south": "tavern", "down": "sewers"}  # "down" locked initially
    )
    
    state.rooms["emerald_city"] = emerald_city
    
    # Initialize social graph for Emerald City
    state.social_graph["emerald_city"] = {
        "Janitor": Relationship(
            disposition=0,
            tags=["knows_sewer_secret", "weary_old_timer"],
            last_interaction_turn=0
        ),
        "Merchant": Relationship(
            disposition=10,  # Friendly by default
            tags=["overpriced_goods"],
            last_interaction_turn=0
        )
    }
    
    return state


def create_multi_location_scenario() -> GameState:
    """
    Create full world with Tavern + Emerald City.
    
    Tests cross-location social graph isolation.
    """
    # Start with tavern
    from game_state import create_tavern_scenario
    state = create_tavern_scenario()
    
    # Add Emerald City
    state = create_emerald_city_scenario(state)
    
    # Add social graph for tavern NPCs (with grudge example)
    state.social_graph["tavern"] = {
        "Bartender": Relationship(
            disposition=-30,
            tags=["has_it_out_for_me", "owes_money"],
            last_interaction_turn=0
        ),
        "Guard": Relationship(
            disposition=0,
            tags=["strict_but_fair"],
            last_interaction_turn=0
        )
    }
    
    # Link tavern north exit to Emerald City
    if "tavern" in state.rooms:
        state.rooms["tavern"].exits["north"] = "emerald_city"
    
    return state
