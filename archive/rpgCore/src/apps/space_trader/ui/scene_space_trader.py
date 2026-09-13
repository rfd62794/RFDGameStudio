import sys
import pygame
from src.shared.engine.scene_manager import Scene
from src.shared.ui.panel import Panel
from src.shared.ui.label import Label
from src.shared.ui.button import Button
from src.shared.ui.scroll_list import ScrollList

from src.apps.space_trader.session import SpaceTraderSession
from src.apps.space_trader.ui.hud import SpaceTraderHUD

from src.shared.ui.spec import UISpec

class SpaceTraderScene(Scene):
    """Main UI scene orchestrating the visual Space Trader loop."""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        from src.shared.ui.spec import SPEC_720
        self.spec = SPEC_720
        self.session = kwargs.get('session')
        
        self.width = self.spec.screen_width
        self.height = self.spec.screen_height
        
        self.hud = SpaceTraderHUD(session, self.width)
        
        # Core Colors
        self.bg_color = (10, 12, 16)
        self.panel_bg = (20, 25, 35)
        self.text_color = (220, 230, 240)
        
        # Message Log / Event feedback
        self.last_message = "Welcome to the frontier."
        
        self._build_ui()

    def on_enter(self, **kwargs) -> None:
        pass

    def on_exit(self) -> None:
        pass

    def _build_ui(self):
        """Constructs the panels and buttons based on current state."""
        self.panels = []
        self.buttons = []
        
        y_offset = self.hud.height + 20
        
        # 1. Location Panel (Top Left)
        loc_panel = Panel(pygame.Rect(20, y_offset, 400, 150), bg_color=self.panel_bg)
        loc = self.session.graph.get(self.session.ship.location_id)
        loc_panel.add_child(Label(pygame.Rect(20 + 15, y_offset + 15, 370, 20), text=f"Location: {loc.name}", font_size=20, color=self.text_color))
        loc_panel.add_child(Label(pygame.Rect(20 + 15, y_offset + 40, 370, 40), text=f"Desc: {loc.description}", font_size=18, color=self.text_color))
        loc_panel.add_child(Label(pygame.Rect(20 + 15, y_offset + 90, 370, 40), text=f"Msg: {self.last_message}", font_size=18, color=(255, 200, 100)))
        self.panels.append(loc_panel)
        
        # 2. Ship Inventory (Top Right)
        inv_panel = Panel(pygame.Rect(self.width - 320, y_offset, 300, 300), bg_color=self.panel_bg)
        inv_panel.add_child(Label(pygame.Rect(self.width - 320 + 15, y_offset + 15, 270, 20), text="Cargo Manifest:", font_size=20, color=self.text_color))
        cy = y_offset + 45
        for item, qty in self.session.ship.cargo.contents.items():
            inv_panel.add_child(Label(pygame.Rect(self.width - 320 + 25, cy, 250, 25), text=f"- {qty}x {item.title()}", font_size=18, color=self.text_color))
            cy += 30
        self.panels.append(inv_panel)
        
        # 3. Market List (Center Left)
        market_rect = pygame.Rect(20, y_offset + 170, 600, 300)
        self.market_list = ScrollList(market_rect, bg_color=self.panel_bg)
        
        self.current_listings = self.session.market.get_listings(self.session.ship.location_id)
        display_items = []
        for l in self.current_listings:
            good = l['good']
            row_text = f"{good.title():<15} | Buy: {l['buy_price']:<5} | Sell: {l['sell_price']:<5}"
            display_items.append(row_text)
            
        self.market_list.load_items(display_items)
            
        # Buy/Sell buttons for market
        bx = 640
        by = y_offset + 170
        btn_buy = Button(pygame.Rect(bx, by, 100, 40), text="Buy 1", on_click=self._handle_buy)
        btn_sell = Button(pygame.Rect(bx, by + 50, 100, 40), text="Sell 1", on_click=self._handle_sell)
        self.buttons.extend([btn_buy, btn_sell])
        
        # 4. Navigation Panel (Bottom)
        nav_y = self.height - 150
        nav_panel = Panel(pygame.Rect(20, nav_y, self.width - 40, 130), bg_color=self.panel_bg)
        nav_panel.add_child(Label(pygame.Rect(20 + 15, nav_y + 15, self.width - 70, 20), text="Navigation Computer - Select Destination:", font_size=20, color=self.text_color))
        self.panels.append(nav_panel)
        
        neighbors = self.session.graph.neighbors(self.session.ship.location_id)
        nx = 40
        for n in neighbors:
            risk = self.session.get_risk_level(n.id)
            btn_text = f"{n.name} [{risk}]"
            btn = Button(pygame.Rect(nx, nav_y + 50, 240, 50), text=btn_text, on_click=lambda tgt=n.id: self._handle_travel(tgt))
            self.buttons.append(btn)
            nx += 260

    def _handle_buy(self):
        idx = self.market_list.selected_index
        if 0 <= idx < len(self.current_listings):
            selected = self.current_listings[idx]['good']
            res = self.session.market.buy(self.session.ship.location_id, selected, 1, self.session.ship.cargo, self.session.ship.credits)
            self.session.ship.credits = res["credits"]
            self.last_message = res["message"]
            self._build_ui()

    def _handle_sell(self):
        idx = self.market_list.selected_index
        if 0 <= idx < len(self.current_listings):
            selected = self.current_listings[idx]['good']
            res = self.session.market.sell(self.session.ship.location_id, selected, 1, self.session.ship.cargo, self.session.ship.credits)
            self.session.ship.credits = res["credits"]
            self.last_message = res["message"]
            self._build_ui()

    def _handle_travel(self, target_id: str):
        res = self.session.ship.travel(target_id, self.session.graph, self.session.encounter_system)
        self.last_message = res["message"]
        if res.get("encounter"):
            self.last_message = "ALERT: " + res["encounter"]["message"]
            
        self.session.price_model.update_daily()
        self._build_ui()

    def handle_event(self, event: pygame.event.Event) -> None:
        if event.type == pygame.QUIT:
            self.request_quit()
            
        self.market_list.handle_event(event)
        for btn in self.buttons:
            btn.handle_event(event)

    def tick(self, dt_ms: float) -> None:
        pass

    def render(self, surface: pygame.Surface) -> None:
        surface.fill(self.bg_color)
        
        self.hud.draw(surface)
        
        for p in self.panels:
            p.render(surface)
            
        self.market_list.render(surface)
        
        for btn in self.buttons:
            btn.render(surface)
