import os
import json
import pygame
from loguru import logger
from typing import List

from src.shared.engine.scene_manager import Scene, SceneManager
from src.shared.narrative.conversation_graph import ConversationGraph, Node, Edge
from src.shared.narrative.state_tracker import StateTracker
from src.shared.narrative.keyword_registry import KeywordRegistry
from src.shared.rendering.font_manager import FontManager

from src.apps.last_appointment.ui.text_window import TextWindow
from src.apps.last_appointment.ui.card_layout import CardLayout

STANCE_COLORS = {
    "PROFESSIONAL": (200, 200, 212), # #C8C8D4
    "WEARY": (136, 153, 170),        # #8899AA
    "CURIOUS": (136, 187, 204),      # #88BBCC
    "RELUCTANT": (204, 153, 68),     # #CC9944
    "MOVED": (170, 136, 187)         # #AA88BB
}
NUMBER_COLOR = (102, 102, 128)       # #666680

class AppointmentScene(Scene):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        from src.shared.ui.spec import SPEC_720
        self.spec = SPEC_720
        self.state_tracker = StateTracker()
        self.keyword_registry = KeywordRegistry()
        self.graph = ConversationGraph(self.state_tracker, self.keyword_registry)
        self.current_node = None
        self.available_edges: List[Edge] = []
        
        self.phase = "PROMPT" # PROMPT or NPC_RESPONSE
        self.pending_node = None
        self.npc_response_text = ""
        
        # Initialize UI components
        self.text_window = TextWindow(0, 0, self.spec.screen_width, slow_reveal=True, reveal_speed=40.0)
        self.card_layout = CardLayout(self.spec.screen_width, self.spec.screen_height)
        
        # Room vignette interpolation state
        self.current_brightness = 0.0
        self.target_brightness = 0.0
        
        # Pre-render vignette gradient
        self.vignette_surface = None
        
        # UI rendering needs FontManager
        FontManager().initialize()
        
    def _load_graph(self):
        # Path from src/apps/last_appointment/scenes/ to assets/demos/last_appointment/
        data_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "assets", "demos", "last_appointment", "appointment.json")
        try:
            with open(data_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            for beat in data.get("beats", []):
                edges = []
                for resp in beat.get("responses", []):
                    stance = resp.get("stance", "PROFESSIONAL")
                    npc_res = resp.get("npc_response", "")
                    edge = Edge(
                        target_node=resp["leads_to"],
                        text=resp["text"]
                    )
                    edge.stance = stance
                    edge.npc_response = npc_res
                    edges.append(edge)
                    
                node = Node(
                    node_id=beat["id"],
                    text=beat["prompt"],
                    edges=edges
                )
                node.room_brightness = beat.get("room_brightness", 0)
                node.white_room = beat.get("white_room", False)
                self.graph.add_node(node)
                
            self.current_node = self.graph.start("beat_1")
            if self.current_node:
                self.available_edges = self.graph.get_available_choices()
                self.text_window.set_text(self.current_node.text)
        except Exception as e:
            logger.error(f"Failed to load appointment.json: {e}")

    def on_enter(self, **kwargs) -> None:
        logger.info("Entering AppointmentScene")
        self._load_graph()
        
        # Set initial brightness
        if self.current_node:
            self.current_brightness = float(getattr(self.current_node, "room_brightness", 0))
            self.target_brightness = self.current_brightness
        
        # Create vignette surface
        self._build_vignette()

    def on_exit(self) -> None:
        logger.info("Exiting AppointmentScene")

    def _build_vignette(self) -> None:
        """Builds a radial gradient surface for the vignette effect."""
        w, h = self.spec.screen_width, self.spec.screen_height
        self.vignette_surface = pygame.Surface((w, h), pygame.SRCALPHA)
        center_x, center_y = w // 2, h // 2
        
        # Max distance from center to corner
        max_dist = ((w/2)**2 + (h/2)**2) ** 0.5
        
        # At brightness 0: Pure black vignette at edges.
        # At brightness 50: Golden candlelight, partial vignette.
        # At brightness 100: Morning light, bright warm wash over everything.
        
        for y in range(h):
            for x in range(w):
                dx = x - center_x
                dy = y - center_y
                dist = (dx**2 + dy**2) ** 0.5
                normalized_dist = min(1.0, dist / max_dist)
                
                # Base vignette alpha driven by distance
                # Edges are darker/more opaque vignette
                # Center is clear (alpha 0)
                
                # Vignette color and intensity shifts based on brightness
                if self.current_brightness <= 50:
                    # 0 to 50: Pure black to candlelight
                    factor = self.current_brightness / 50.0
                    # Color shifts from black to a warm orange
                    r = int(0 + (180 - 0) * factor)
                    g = int(0 + (100 - 0) * factor)
                    b = int(0 + (30 - 0) * factor)
                    
                    # Alpha at edge decreases slightly as it brightens
                    edge_alpha = int(255 - (factor * 100))
                else:
                    # 50 to 100: Candlelight to Morning Light
                    factor = (self.current_brightness - 50.0) / 50.0
                    r = int(180 + (255 - 180) * factor)
                    g = int(100 + (240 - 100) * factor)
                    b = int(30 + (200 - 30) * factor)
                    
                    # Alpha becomes a wash rather than a vignette edge
                    # Morning light starts to fill the center too
                    edge_alpha = int(155 - (factor * 155))
                    
                
                # Apply distance to alpha (non-linear for better gradient)
                intensity = normalized_dist ** 1.5
                alpha = int(edge_alpha * intensity)
                
                # At high brightness, add a base wash regardless of distance
                if self.current_brightness > 50:
                    wash_factor = (self.current_brightness - 50.0) / 50.0
                    base_wash = int(40 * wash_factor)
                    alpha = max(base_wash, alpha)
                    
                self.vignette_surface.set_at((x, y), (r, g, b, alpha))

    def handle_event(self, event: pygame.event.Event) -> None:
        pass  # stub — scene not yet active

    def handle_events(self, events: list[pygame.event.Event]) -> None:
        try:
            mouse_pos = pygame.mouse.get_pos()
        except pygame.error:
            # Fallback for headless test environments
            mouse_pos = (0, 0)
            
        self.card_layout.handle_hover(mouse_pos)
        
        for event in events:
            if event.type == pygame.QUIT:
                self.request_quit()
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    self.request_quit()
                
                if self.phase == "PROMPT":
                    # Handling choices 1-5 via keyboard (Top row and NumPad)
                    if pygame.K_1 <= event.key <= pygame.K_5:
                        idx = event.key - pygame.K_1
                        self._handle_choice_selection(idx)
                    elif pygame.K_KP1 <= event.key <= pygame.K_KP5:
                        idx = event.key - pygame.K_KP1
                        self._handle_choice_selection(idx)
                        
                elif self.phase == "NPC_RESPONSE":
                    if self.text_window.is_finished:
                        if self.card_layout.cards:
                            self.card_layout.start_fade_out()
                        else:
                            self.npc_response_text = ""
                            self._advance_to_pending()
                    else:
                        self.text_window.skip_reveal()
                        
            elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                # Left click
                if self.phase == "PROMPT":
                    selected_idx = self.card_layout.handle_click(mouse_pos)
                    if selected_idx is not None:
                        self._handle_choice_selection(selected_idx)
                elif self.phase == "NPC_RESPONSE":
                    if self.text_window.is_finished:
                        if self.card_layout.cards:
                            self.card_layout.start_fade_out()
                        else:
                            self.npc_response_text = ""
                            self._advance_to_pending()
                    else:
                        self.text_window.skip_reveal()

    def _handle_choice_selection(self, idx: int) -> None:
        if idx < len(self.available_edges) and not self.card_layout.is_fading_in and not self.card_layout.is_fading_out:
            selected = self.available_edges[idx]
            stance = getattr(selected, "stance", "PROFESSIONAL")
            npc_response = getattr(selected, "npc_response", "")
            
            self.state_tracker.set_flag("current_stance", stance)
            
            self.pending_node = self.graph.make_choice(selected)
            
            # Start fading the cards out
            self.card_layout.start_fade_out()
            self.npc_response_text = npc_response

    def _advance_to_pending(self):
        self.card_layout.cards.clear()
        self.current_node = self.pending_node
        if self.current_node:
            self.target_brightness = float(getattr(self.current_node, "room_brightness", 0))
            self.available_edges = self.graph.get_available_choices()
            self.text_window.is_finished = False
            self.text_window.set_text(self.current_node.text)
        self.phase = "PROMPT"
        # Delay card loading slightly or wait until text is revealed?
        # Re-evaluating: Prompt text exists on new node immediately, 
        # but responses shouldn't show until the Prompt is finished? 
        # Actually specs says "Cards only appear after NPC response is fully displayed" - we might need to adjust logic
        # if the text_window is the PROMPT or the NPC response...
        # Let's say cards fade in once the current text block (which might be the prompt itself if no NPC response) finishes.

    def tick(self, dt_ms: float) -> None:
        # Interpolate brightness
        if abs(self.current_brightness - self.target_brightness) > 0.5:
            # Shift 20 units per second
            sign = 1 if self.target_brightness > self.current_brightness else -1
            self.current_brightness += sign * 20.0 * (dt_ms / 1000.0)
            if sign == 1 and self.current_brightness > self.target_brightness:
                self.current_brightness = self.target_brightness
            elif sign == -1 and self.current_brightness < self.target_brightness:
                self.current_brightness = self.target_brightness
            self._build_vignette()

        self.text_window.update(dt_ms)
        self.card_layout.update(dt_ms)
        
        # State machine shifts
        if self.phase == "PROMPT":
            # If text finished revealing, load cards if empty
            if self.text_window.is_finished and not self.card_layout.cards:
                # Mock a render to get the height for layout
                dummy_surface = pygame.Surface((1,1))
                text_bottom_y = self.text_window.render(dummy_surface)
                self.card_layout.load_edges(self.available_edges, int(text_bottom_y))
        elif self.phase == "NPC_RESPONSE":
            if not self.card_layout.is_fading_out and not self.card_layout.cards and self.npc_response_text:
                # Text transitioned to NPC response but cards still shown?
                pass
                
        # Handle the transition after fade out
        if not self.card_layout.is_fading_in and not self.card_layout.is_fading_out and self.card_layout.cards and self.card_layout.cards[0].fade_alpha == 0:
            # Fade out finished
            self.card_layout.cards.clear()
            
            if self.phase == "PROMPT" and self.npc_response_text:
                # Moving to NPC Response
                self.phase = "NPC_RESPONSE"
                self.text_window.is_finished = False
                self.text_window.set_text(self.npc_response_text)
            elif self.phase == "PROMPT" and not self.npc_response_text:
                # Moving to next Prompt natively
                self._advance_to_pending()
            elif self.phase == "NPC_RESPONSE":
                # Moving from NPC response to next Prompt
                self.npc_response_text = ""
                self._advance_to_pending()

    def render(self, surface: pygame.Surface) -> None:
        if not self.current_node:
            surface.fill((10, 10, 18))
            text_sur = FontManager().render_text("No conversation loaded.", "Arial", 24, (255, 0, 0))
            surface.blit(text_sur, (50, 50))
            return
            
        brightness = getattr(self.current_node, "room_brightness", 0)
        is_white = getattr(self.current_node, "white_room", False)
        
        if is_white:
            bg_color = (255, 255, 255)
            self.text_window.color = (30, 30, 35) # Make text dark and visible
        else:
            bg_color = (10, 10, 18) # Base dark room
            self.text_window.color = (200, 200, 212) # Default text color
            
        surface.fill(bg_color)
        
        # Draw dynamic vignette over the background
        if not is_white and self.vignette_surface:
            surface.blit(self.vignette_surface, (0, 0))
            
        # Draw subtitle framing
        subtitle_font = FontManager().get_font("Arial", 14)
        if subtitle_font != "DummyFont":
            subtitle_color = (42, 42, 58) # #2A2A3A
            sub_sur = subtitle_font.render("— Last Appointment —", True, subtitle_color)
            surface.blit(sub_sur, (self.text_window.x + self.text_window.padding_x, self.text_window.y + self.text_window.padding_y - 30))
            
        # Draw the main text window (prompt or npc response)
        text_bottom_y = self.text_window.render(surface)
        
        # Draw separator line below text
        separator_color = (42, 42, 58) # #2A2A3A
        line_y = int(text_bottom_y) + 20
        pygame.draw.line(surface, separator_color, (self.text_window.x + self.text_window.padding_x, line_y), (self.spec.screen_width - self.text_window.padding_x, line_y), 1)
        
        # Draw stances (bottom right corner, muted italic style)
        stance = self.state_tracker.get_flag("current_stance", "")
        if stance:
            stance_text = stance.capitalize()
            # Try to get italic, fallback to regular
            stance_font = FontManager().get_font("Arial_Italic", 16)
            if stance_font == "DummyFont":
                 stance_font = FontManager().get_font("Arial", 16)
            
            if stance_font != "DummyFont":
                stance_sur = stance_font.render(stance_text, True, (80, 80, 95))
                sw = stance_sur.get_width()
                sh = stance_sur.get_height()
                surface.blit(stance_sur, (self.spec.screen_width - sw - 20, self.spec.screen_height - sh - 20))
        
        # Render cards if Prompt phase
        if self.phase == "PROMPT" and self.card_layout.cards:
            self.card_layout.render(surface)
            
        elif self.phase == "NPC_RESPONSE":
            if self.text_window.is_finished:
                cont_sur = FontManager().get_font("Arial", 16).render("[Press Any Key to Continue]", True, (100, 100, 100)) if FontManager().get_font("Arial", 16) != "DummyFont" else pygame.Surface((1,1))
                surface.blit(cont_sur, (80, line_y + 40))
        

