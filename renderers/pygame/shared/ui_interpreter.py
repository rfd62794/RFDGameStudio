"""
ui_interpreter.py — Generic PyGame interpreter for ui.yaml component specs.

Reads the `header`, `footer`, and simple component types from a game's ui.yaml
and produces a layers_dict (same shape as lua_to_entities output) plus a list
of hit targets for click routing.

Composite widget types (horse_card_grid, race_track, betting_panel, etc.) are
explicitly skipped — they remain owned by the game's existing state_to_layers().
"""
from __future__ import annotations

from typing import Any, Dict, List, Tuple

from .ui_hit_targets import HitTarget

# Component types this interpreter handles
SIMPLE_TYPES = frozenset({
    'label', 'stat_display', 'stat_bar', 'stat_row',
    'badge', 'section', 'action_button', 'timestamp', 'link',
})

# Composite types explicitly out of scope — skipped, not crashed on
COMPOSITE_TYPES = frozenset({
    'horse_card_grid', 'race_track', 'betting_panel', 'breed_selector',
    'breed_preview', 'race_history_list', 'results_table', 'race_info_card',
    'tab_content', 'tab_bar', 'app_header', 'app_footer',
})

# Style → color mapping (uses keys from colors.py)
_STYLE_COLORS: Dict[str, str] = {
    'title': 'text',
    'subtitle': 'muted',
    'section_title': 'text',
    'description': 'muted',
    'card_title': 'text',
    'footer': 'muted',
    'danger': 'red',
}

_STYLE_SIZES: Dict[str, int] = {
    'title': 18,
    'subtitle': 11,
    'section_title': 14,
    'description': 11,
    'card_title': 13,
    'footer': 10,
}

_STYLE_BOLD: Dict[str, bool] = {
    'title': True,
    'section_title': True,
    'card_title': True,
}


def resolve_binding(field_path: str, context: Any) -> Any:
    """
    Resolve a dotted field path against a data context.

    Supports both dict key lookup and object attribute access.
    Raises KeyError if any segment doesn't resolve — loud, not silent.
    """
    if field_path is None:
        return None

    parts = field_path.split('.')
    current: Any = context

    for part in parts:
        if isinstance(current, dict):
            if part not in current:
                raise KeyError(
                    f"Binding path segment '{part}' not found in path '{field_path}'"
                )
            current = current[part]
        elif hasattr(current, part):
            current = getattr(current, part)
        else:
            raise KeyError(
                f"Binding path segment '{part}' not found in path '{field_path}' "
                f"on object of type {type(current).__name__}"
            )

    return current


def _format_value(value: Any, fmt: str | None) -> str:
    """Apply a format string to a value."""
    if fmt is None:
        return str(value)
    if fmt == 'currency':
        try:
            return f"${int(value):,}"
        except (TypeError, ValueError):
            return f"${value}"
    if '{value}' in fmt or '{max}' in fmt:
        return fmt.replace('{value}', str(value)).replace('{max}', str(value))
    return fmt


def _resolve_text(node: dict, context: Any) -> str:
    """Resolve text content from a node — either literal text or field binding."""
    if 'text' in node:
        return str(node['text'])
    if 'field' in node:
        return str(resolve_binding(node['field'], context))
    if 'format' in node:
        # Format strings like "SIRE: {horse.parents.sire_name}"
        fmt = node['format']
        # Extract {path} tokens and resolve them
        import re
        tokens = re.findall(r'\{([^}]+)\}', fmt)
        result = fmt
        for token in tokens:
            try:
                val = resolve_binding(token, context)
                result = result.replace(f'{{{token}}}', str(val))
            except KeyError:
                # Leave unresolved tokens as-is for composite contexts
                pass
        return result
    return ''


def _style_color(node: dict, colors: dict, default_key: str = 'text') -> tuple:
    """Get color tuple for a node based on its style."""
    style = node.get('style', '')
    color_key = _STYLE_COLORS.get(style, default_key)
    return colors.get(color_key, (255, 255, 255))


def _style_size(node: dict, default: int = 12) -> int:
    """Get font size for a node based on its style."""
    style = node.get('style', '')
    return _STYLE_SIZES.get(style, default)


def _style_bold(node: dict) -> bool:
    """Get bold flag for a node based on its style."""
    style = node.get('style', '')
    return _STYLE_BOLD.get(style, False)


def interpret_component(
    node: dict,
    x: float,
    y: float,
    w: float,
    colors: dict,
    context: Any = None,
    hit_targets: list[HitTarget] | None = None,
) -> Tuple[List[Dict[str, Any]], float]:
    """
    Interpret a single component node into entity dicts.

    Returns (entities, cursor_advance) where cursor_advance is the vertical
    space consumed by this component (for sequential layout).
    """
    entities: List[Dict[str, Any]] = []
    ctype = node.get('type', '')
    cursor = 0.0

    if ctype not in SIMPLE_TYPES:
        # Composite types: skip explicitly, do not crash
        return entities, 0.0

    if ctype == 'label':
        text = _resolve_text(node, context)
        entities.append({
            "type": "text", "text": text,
            "x": x, "y": y,
            "color": _style_color(node, colors),
            "size": _style_size(node),
            "bold": _style_bold(node),
        })
        cursor = _style_size(node) + 4

    elif ctype == 'stat_display':
        label = node.get('label', '')
        field = node.get('field')
        fmt = node.get('format')
        try:
            value = resolve_binding(field, context) if field else ''
        except KeyError:
            value = '?'
        display = _format_value(value, fmt) if fmt else str(value)

        # Label line
        entities.append({
            "type": "text", "text": str(label),
            "x": x, "y": y,
            "color": colors.get('muted', (138, 143, 168)),
            "size": 10,
        })
        # Value line
        entities.append({
            "type": "text", "text": display,
            "x": x, "y": y + 14,
            "color": colors.get('text', (232, 234, 240)),
            "size": 14,
            "bold": True,
        })
        cursor = 32

    elif ctype == 'stat_bar':
        label = node.get('label', '')
        field = node.get('field', '')
        max_val = node.get('max', 100)
        try:
            value = float(resolve_binding(field, context))
        except (KeyError, TypeError, ValueError):
            value = 0.0

        bar_w = w - 60
        fill_w = int((value / max(1, max_val)) * bar_w) if bar_w > 0 else 0

        # Label
        entities.append({
            "type": "text", "text": str(label),
            "x": x, "y": y,
            "color": colors.get('muted', (138, 143, 168)),
            "size": 11,
        })
        # Bar background
        entities.append({
            "type": "rect", "x": x + 55, "y": y + 1,
            "w": bar_w, "h": 10,
            "color": colors.get('surface2', (34, 38, 58)),
            "line_width": 0,
        })
        # Bar border
        entities.append({
            "type": "rect", "x": x + 55, "y": y + 1,
            "w": bar_w, "h": 10,
            "color": colors.get('border', (46, 51, 80)),
            "line_width": 1,
        })
        # Bar fill
        if fill_w > 0:
            entities.append({
                "type": "rect", "x": x + 56, "y": y + 2,
                "w": fill_w, "h": 8,
                "color": colors.get('accent', (108, 142, 247)),
                "line_width": 0,
            })
        # Value text
        entities.append({
            "type": "text", "text": str(int(value)),
            "x": x + w - 35, "y": y,
            "color": colors.get('text', (232, 234, 240)),
            "size": 11,
        })
        cursor = 18

    elif ctype == 'stat_row':
        stats = node.get('stats', [])
        col_w = w / max(1, len(stats))
        for i, stat in enumerate(stats):
            label = stat.get('label', '')
            field = stat.get('field', '')
            fmt = stat.get('format')
            try:
                value = resolve_binding(field, context)
            except KeyError:
                value = '?'
            display = _format_value(value, fmt) if fmt else str(value)

            entities.append({
                "type": "text", "text": str(label),
                "x": x + i * col_w, "y": y,
                "color": colors.get('muted', (138, 143, 168)),
                "size": 10,
            })
            entities.append({
                "type": "text", "text": display,
                "x": x + i * col_w, "y": y + 12,
                "color": colors.get('text', (232, 234, 240)),
                "size": 11,
            })
        cursor = 26

    elif ctype == 'badge':
        field = node.get('field', '')
        values_map = node.get('values', {})
        fmt = node.get('format')

        try:
            value = resolve_binding(field, context)
        except KeyError:
            value = ''

        if values_map and str(value) in values_map:
            display = values_map[str(value)]
        elif fmt:
            display = _format_value(value, fmt)
        else:
            display = str(value)

        badge_w = len(display) * 8 + 16
        badge_color = colors.get('accent_dim', (61, 79, 153))

        entities.append({
            "type": "rect", "x": x, "y": y,
            "w": badge_w, "h": 18,
            "color": badge_color, "line_width": 0,
        })
        entities.append({
            "type": "text", "text": display,
            "x": x + 8, "y": y + 2,
            "color": colors.get('text', (232, 234, 240)),
            "size": 10,
        })
        cursor = 22

    elif ctype == 'section':
        # Structural only — no drawable primitives unless it has a label
        label = node.get('label', '')
        if label:
            entities.append({
                "type": "text", "text": str(label),
                "x": x, "y": y,
                "color": colors.get('muted', (138, 143, 168)),
                "size": 10,
            })
            cursor = 14
        children = node.get('children', [])
        child_y = y + cursor
        for child in children:
            child_entities, child_cursor = interpret_component(
                child, x, child_y, w, colors, context, hit_targets
            )
            entities.extend(child_entities)
            child_y += child_cursor
        cursor = child_y - y

    elif ctype == 'action_button':
        label = node.get('label', '')
        event = node.get('event', '')
        data_field = node.get('data')
        requires = node.get('requires', [])
        style = node.get('style', '')

        btn_w = min(len(label) * 10 + 24, w)
        btn_h = 28
        color_key = 'red' if style == 'danger' else 'accent'
        btn_color = colors.get(color_key, (108, 142, 247))

        entities.append({
            "type": "rect", "x": x, "y": y,
            "w": btn_w, "h": btn_h,
            "color": btn_color, "line_width": 0,
        })
        entities.append({
            "type": "text", "text": str(label),
            "x": x + 12, "y": y + 6,
            "color": colors.get('text', (232, 234, 240)),
            "size": 12, "bold": True,
        })

        # Register hit target
        if hit_targets is not None and event:
            resolved_data = None
            if data_field:
                try:
                    resolved_data = resolve_binding(data_field, context)
                except KeyError:
                    resolved_data = data_field  # pass literal if path doesn't resolve
            import pygame
            hit_targets.append(HitTarget(
                rect=pygame.Rect(int(x), int(y), int(btn_w), int(btn_h)),
                event=event,
                data=resolved_data,
                requires=list(requires),
            ))
        cursor = btn_h + 6

    elif ctype == 'timestamp':
        field = node.get('field', '')
        try:
            value = resolve_binding(field, context)
        except KeyError:
            value = ''
        # Format as date if it looks like a timestamp
        if isinstance(value, (int, float)):
            import time as _time
            display = _time.strftime('%Y-%m-%d %H:%M', _time.localtime(value))
        else:
            display = str(value)
        entities.append({
            "type": "text", "text": display,
            "x": x, "y": y,
            "color": colors.get('muted', (138, 143, 168)),
            "size": 10,
        })
        cursor = 14

    elif ctype == 'link':
        label = node.get('label', '')
        event = node.get('event', '')
        entities.append({
            "type": "text", "text": str(label),
            "x": x, "y": y,
            "color": colors.get('accent', (108, 142, 247)),
            "size": 11, "bold": True,
        })
        # Links also register hit targets
        if hit_targets is not None and event:
            import pygame
            link_w = len(label) * 8
            hit_targets.append(HitTarget(
                rect=pygame.Rect(int(x), int(y), int(link_w), 16),
                event=event,
                data=None,
                requires=[],
            ))
        cursor = 18

    return entities, cursor


def interpret_region(
    components: list[dict],
    bounds: Any,
    colors: dict,
    context: Any = None,
    hit_targets: list[HitTarget] | None = None,
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Interpret a list of component nodes within a region's bounds.

    Returns a layers_dict with 'background', 'midground', 'foreground', 'hud' keys.
    """
    layers: Dict[str, List[Dict[str, Any]]] = {
        'background': [], 'midground': [], 'foreground': [], 'hud': [],
    }

    x = getattr(bounds, 'x', 0)
    y = getattr(bounds, 'y', 0)
    w = getattr(bounds, 'w', 1024)
    h = getattr(bounds, 'h', 100)

    cursor = 0.0
    for node in components:
        entities, advance = interpret_component(
            node, x + 12, y + cursor, w - 24, colors, context, hit_targets
        )
        layers['hud'].extend(entities)
        cursor += advance

    return layers


def is_composite_type(ctype: str) -> bool:
    """Check if a component type is a composite type (out of scope this pass)."""
    return ctype in COMPOSITE_TYPES
