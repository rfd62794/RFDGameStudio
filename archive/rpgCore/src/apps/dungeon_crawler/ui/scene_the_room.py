import pygame
from src.shared.engine.scene_manager import Scene
from src.shared.ui.panel import Panel
from src.shared.ui.label import Label
from src.shared.ui.button import Button
from src.shared.ui.spec import UISpec
from src.apps.dungeon_crawler.ui.dungeon_session import DungeonSession
from src.shared.teams.roster import TeamRole

class TheRoomScene(Scene):
    """
    The Hub scene — The Room.
    A dark bedroom with interactive elements.
    """
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        from src.shared.ui.spec import SPEC_720
        self.spec = SPEC_720
        self.session = kwargs.get("session")
        if not self.session:
            from src.apps.dungeon_crawler.ui.dungeon_session import DungeonSession
            self.session = DungeonSession()
        
        # Initialize session if not provided
        if not self.session.hero:
            self.session.start_run("fighter")
        
        # Aesthetic colors
        self.bg_color = (15, 12, 12) # Dark reddish black
        self.panel_bg = (25, 20, 20)
        self.torch_accent = (200, 100, 40)
        self.text_color = (220, 210, 200)

        self.panels = []
        self.buttons = []
        
        self._build_ui()

    def on_enter(self, **kwargs) -> None:
        pass

    def handle_event(self, event: pygame.event.Event) -> None:
        """Process pygame events."""
        for button in self.buttons:
            if hasattr(button, 'handle_event') and button.handle_event(event):
                return

    def tick(self, dt: float) -> None:
        """Update scene state."""
        for button in self.buttons:
            if hasattr(button, 'update'):
                button.update(int(dt * 1000))

    def render(self, surface: pygame.Surface) -> None:
        """Render the scene."""
        surface.fill(self.bg_color)
        
        # Render panels
        for panel in self.panels:
            if hasattr(panel, 'render'):
                panel.render(surface)
        
        # Render buttons
        for button in self.buttons:
            if hasattr(button, 'render'):
                button.render(surface)

    def on_exit(self) -> None:
        pass

    def _build_ui(self):
        self.panels = []
        self.buttons = []
        
        w, h = self.manager.width, self.manager.height

        # Main Panels
        main_panel = Panel(pygame.Rect(20, 20, w - 40, h - 160), self.spec, variant="surface")
        self.panels.append(main_panel)

        # Flavor Text
        flavor_panel = Panel(pygame.Rect(20, h - 130, w - 40, 110), self.spec, variant="surface")
        flavor_text = "A worn bedroom. Peeling wallpaper. A chest in the corner. A ladder descends into darkness beneath a frayed rug."
        flavor_panel.add_child(Label(flavor_text, (35, h - 115), self.spec, size="md", color=self.text_color))
        self.panels.append(flavor_panel)

        # Hall of Ancestors (Right side of main panel)
        ancestor_x = w - 240
        main_panel.add_child(Label("Hall of Ancestors", (ancestor_x, 40), self.spec, size="lg", color=self.torch_accent))
        
        ancestors = self.session.get_ancestor_list()
        ay = 75
        for ancestor_str in ancestors[-10:]: # Show last 10
            main_panel.add_child(Label(ancestor_str, (ancestor_x, ay), self.spec, size="sm", color=(160, 150, 140)))
            ay += 25

        # Buttons
        # Chest (Top Left)
        btn_chest = Button("Open Chest", pygame.Rect(40, 40, 120, 40), self._handle_chest, self.spec)
        self.buttons.append(btn_chest)

        # Ladder Down (Center)
        btn_ladder = Button("Go Down", pygame.Rect(w // 2 - 80, h // 2 - 60, 160, 50), self._handle_descend, self.spec)
        self.buttons.append(btn_ladder)

        # Escape Rope (Bottom Right of main panel) - grayed out/inactive in hub usually
        btn_rope = Button("Escape Rope", pygame.Rect(w - 180, h - 200, 140, 40), None, self.spec) # Grayed out by lack of on_click if logic allows
        self.buttons.append(btn_rope)

    def _handle_chest(self):
        from src.apps.dungeon_crawler.ui.scene_inventory import InventoryScene
        kwargs = self.context.resources.copy()
        kwargs["session"] = self.session
        self.context.manager.switch_to(InventoryScene(**kwargs))

    def _handle_descend(self):
        if not self.session.hero:
            self.session.start_run("fighter") # Default to fighter for now
        else:
            self.session.descend()
        
        # Get roster and team from main save system
        from shared.persistence.save_manager import SaveManager
        save_result = SaveManager.load()
        if save_result:
            roster_data, session_data = save_result
            from shared.teams.roster import Roster
            roster = Roster.from_dict(roster_data)
        else:
            from shared.teams.roster_save import load_roster
            roster = load_roster()
        
        team = roster.get_dungeon_team() if roster else None
        
        print(f"[DEBUG] TheRoom - roster: {roster}")
        print(f"[DEBUG] TheRoom - team: {team}")
        if roster:
            print(f"[DEBUG] TheRoom - dungeon team members: {len(roster.get_dungeon_team().members)}")
        
        from src.apps.dungeon_crawler.ui.scene_dungeon_room import DungeonRoomScene
        kwargs = self.context.resources.copy()
        kwargs["session"] = self.session
        kwargs["roster"] = roster
        kwargs["team"] = team
        self.context.manager.switch_to(DungeonRoomScene(**kwargs))


    def handle_events(self, events: list[pygame.event.Event]) -> None:
        for event in events:
            if event.type == pygame.QUIT:
                self.request_quit()
            
            for btn in self.buttons:
                btn.handle_event(event)

    def render(self, surface: pygame.Surface) -> None:
        surface.fill(self.bg_color)
        
        for p in self.panels:
            p.render(surface)
            
        for btn in self.buttons:
            btn.render(surface)
