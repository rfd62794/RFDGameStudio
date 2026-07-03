"""
ui_reconciler.py — Reconciles ui.yaml component specs against pygame_gui widgets.

Walks header, footer, and label/action_button nodes from tab content.
Diffs against last-frame widget state — creates on first sight, updates on
change, kills when requires gate fails. Only handles label and action_button
types this pass; all other types are skipped.

Click routing for action_button comes through pygame_gui.UI_BUTTON_PRESSED
events (handled by the caller via ui_manager), not manual rect-collision.
"""
from __future__ import annotations

from typing import Any, Dict, List, Tuple

from .ui_interpreter import resolve_binding

# Only these two component types are handled this pass
HANDLED_TYPES = frozenset({'label', 'action_button'})


class UIReconciler:
    """Tracks widget state between frames and reconciles ui.yaml nodes."""

    def __init__(self, ui_manager: Any) -> None:
        """
        Args:
            ui_manager: UIManager wrapper instance.
        """
        self._manager = ui_manager
        # key → pygame_gui element
        self._widgets: Dict[str, Any] = {}
        # key → last resolved text/value (for change detection)
        self._last_values: Dict[str, str] = {}

    def reconcile(
        self,
        nodes: List[dict],
        x: float,
        y: float,
        w: float,
        context: Any = None,
        requires_context: Dict[str, bool] | None = None,
        key_prefix: str = "",
    ) -> float:
        """Reconcile a list of component nodes sequentially.

        Returns the total vertical cursor advance.
        """
        cursor = 0.0
        for i, node in enumerate(nodes):
            ctype = node.get('type', '')
            if ctype not in HANDLED_TYPES:
                continue

            key = f"{key_prefix}_{ctype}_{i}"
            current_y = y + cursor

            if ctype == 'label':
                cursor += self._reconcile_label(
                    node, key, x, current_y, w, context
                )
            elif ctype == 'action_button':
                cursor += self._reconcile_button(
                    node, key, x, current_y, w, context, requires_context
                )

        return cursor

    def _reconcile_label(
        self,
        node: dict,
        key: str,
        x: float,
        y: float,
        w: float,
        context: Any,
    ) -> float:
        """Reconcile a label node — create or update text."""
        import pygame_gui

        text = self._resolve_text(node, context)
        style = node.get('style', '')

        # Determine size from style
        size_map = {
            'title': 18, 'subtitle': 11, 'section_title': 14,
            'description': 11, 'card_title': 13, 'footer': 10,
        }
        font_size = size_map.get(style, 12)

        if key not in self._widgets:
            # Create new label
            label = pygame_gui.elements.UILabel(
                relative_rect=pygame.Rect(int(x), int(y), int(w), int(font_size + 6)),
                text=str(text),
                manager=self._manager.manager,
            )
            self._widgets[key] = label
            self._last_values[key] = str(text)
        else:
            # Update only if text changed
            if self._last_values.get(key) != str(text):
                self._widgets[key].set_text(str(text))
                self._last_values[key] = str(text)

        return float(font_size + 8)

    def _reconcile_button(
        self,
        node: dict,
        key: str,
        x: float,
        y: float,
        w: float,
        context: Any,
        requires_context: Dict[str, bool] | None,
    ) -> float:
        """Reconcile an action_button node — create, update, or kill."""
        import pygame_gui

        label = node.get('label', '')
        event = node.get('event', '')
        requires = node.get('requires', [])
        style = node.get('style', '')

        # Check requires gate
        gated = False
        if requires and requires_context:
            gated = not all(requires_context.get(r, False) for r in requires)

        if gated:
            # Kill the button if it exists
            if key in self._widgets:
                self._widgets[key].kill()
                del self._widgets[key]
                self._last_values.pop(key, None)
            return 0.0

        # Button should exist
        btn_w = min(len(label) * 10 + 24, w)
        btn_h = 28

        if key not in self._widgets:
            btn = pygame_gui.elements.UIButton(
                relative_rect=pygame.Rect(int(x), int(y), int(btn_w), int(btn_h)),
                text=str(label),
                manager=self._manager.manager,
            )
            # Store event name on the button for click routing
            btn.event_name = event
            btn.event_data = self._resolve_data(node, context)
            self._widgets[key] = btn
            self._last_values[key] = str(label)
        else:
            # Update label if changed
            if self._last_values.get(key) != str(label):
                self._widgets[key].set_text(str(label))
                self._last_values[key] = str(label)

        return float(btn_h + 6)

    def _resolve_text(self, node: dict, context: Any) -> str:
        """Resolve text from literal, field binding, or format string."""
        if 'text' in node:
            return str(node['text'])
        if 'field' in node:
            try:
                return str(resolve_binding(node['field'], context))
            except KeyError:
                return '?'
        if 'format' in node:
            import re
            fmt = node['format']
            tokens = re.findall(r'\{([^}]+)\}', fmt)
            result = fmt
            for token in tokens:
                try:
                    val = resolve_binding(token, context)
                    result = result.replace(f'{{{token}}}', str(val))
                except KeyError:
                    pass
            return result
        return ''

    def _resolve_data(self, node: dict, context: Any) -> Any:
        """Resolve the data field for action_button."""
        data_field = node.get('data')
        if not data_field:
            return None
        try:
            return resolve_binding(data_field, context)
        except KeyError:
            return data_field

    def get_button_events(self) -> List[Tuple[str, Any]]:
        """Return (event_name, event_data) for all currently active buttons."""
        result = []
        for widget in self._widgets.values():
            if hasattr(widget, 'event_name'):
                result.append((widget.event_name, widget.event_data))
        return result

    def find_button_by_element(self, element: Any) -> Tuple[str, Any] | None:
        """Find the (event_name, event_data) for a given UI element."""
        for widget in self._widgets.values():
            if widget is element and hasattr(widget, 'event_name'):
                return (widget.event_name, widget.event_data)
        return None

    def clear(self) -> None:
        """Kill all widgets — used when switching tabs."""
        for widget in self._widgets.values():
            widget.kill()
        self._widgets.clear()
        self._last_values.clear()
