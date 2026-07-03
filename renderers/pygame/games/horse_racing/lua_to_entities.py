"""
Per-game translation layer: horse_racing state → layers_dict for PyGameRenderer.

Reads the renderer's working state (funds, horses, current_race, bets, etc.)
and the resolved layout bounds, emits a layers_dict with the four valid
layer keys (background, midground, foreground, hud) containing typed
primitive dicts that render_layered_entities() knows how to draw.

This is genuinely new code — not ported from rpgCore. rpgCore's translation
layer converts from its ECS/Creature model, which doesn't apply here.
"""
from __future__ import annotations

from typing import Any, Dict, List

VALID_LAYERS = ("background", "midground", "foreground", "hud")


def _color(key: str, colors: dict) -> tuple:
    """Look up a color from the COLORS dict, default to white."""
    return colors.get(key, (255, 255, 255))


def state_to_layers(
    state: Any,
    bounds: dict,
    colors: dict,
    data: dict,
    lua_call: Any | None = None,
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Translate horse_racing renderer state into a layers_dict.

    Args:
        state: HorseRacingState-like object with attributes:
               funds, horses, current_race, race_participants, bets,
               active_tab, selected_horse_idx, bet_type, bet_target_idx,
               bet_amount, race_results, race_history, last_bet_results,
               last_net_payout, foal, foal_cost, sire_idx, dam_idx,
               confirm_mode, confirm_action, message, message_timer,
               unlocked_slots
        bounds: dict of layout Bounds objects (header, tab_nav, content, footer)
        colors: COLORS dict from renderers.pygame.colors
        data: parsed data.yaml dict
        lua_call: optional callable for Lua function invocations
                  (e.g. lua_call('calculate_horse_price', horse))

    Returns:
        dict with keys from VALID_LAYERS, each a list of entity dicts.
    """
    layers: Dict[str, List[Dict[str, Any]]] = {
        layer: [] for layer in VALID_LAYERS
    }

    _render_header(layers, state, bounds, colors)
    _render_tab_nav(layers, state, bounds, colors)
    _render_content(layers, state, bounds, colors, data, lua_call)
    _render_footer(layers, state, bounds, colors)
    _render_confirm_overlay(layers, state, bounds, colors)

    return layers


def _render_header(
    layers: dict, state: Any, bounds: dict, colors: dict
) -> None:
    if 'header' not in bounds:
        return
    b = bounds['header']
    bg = _color('surface', colors)
    border = _color('border', colors)
    text_c = _color('text', colors)
    muted = _color('muted', colors)
    green = _color('green', colors)

    # Header background
    layers['background'].append({
        "type": "rect", "x": b.x, "y": b.y, "w": b.w, "h": b.h,
        "color": bg, "line_width": 0,
    })
    layers['background'].append({
        "type": "rect", "x": b.x, "y": b.y, "w": b.w, "h": b.h,
        "color": border, "line_width": 1,
    })

    # Title
    layers['hud'].append({
        "type": "text", "text": "DERBY SIM",
        "x": b.x + 20, "y": b.y + b.h // 2 - 10,
        "color": text_c, "size": 18, "bold": True,
    })

    # Funds
    layers['hud'].append({
        "type": "text", "text": "STABLE BANK",
        "x": b.x + b.w - 160, "y": b.y + 8,
        "color": muted, "size": 10,
    })
    layers['hud'].append({
        "type": "text", "text": f"${state.funds:,}",
        "x": b.x + b.w - 160, "y": b.y + 22,
        "color": green, "size": 15, "bold": True,
    })

    # Message
    if getattr(state, 'message', ''):
        layers['hud'].append({
            "type": "text", "text": state.message,
            "x": b.x + 250, "y": b.y + b.h // 2 - 7,
            "color": muted, "size": 11,
        })


def _render_tab_nav(
    layers: dict, state: Any, bounds: dict, colors: dict
) -> None:
    if 'tab_nav' not in bounds:
        return
    b = bounds['tab_nav']
    tabs = [('1 Stable', 'stable'), ('2 Betting', 'betting'),
            ('3 Breed', 'breed'), ('4 History', 'history')]
    tw = b.w // len(tabs)
    accent = _color('accent', colors)
    muted = _color('muted', colors)
    surface = _color('surface', colors)
    surface2 = _color('surface2', colors)
    border = _color('border', colors)

    for i, (lbl, tid) in enumerate(tabs):
        tx = b.x + i * tw
        active = state.active_tab == tid
        fill = surface2 if active else surface
        bord = accent if active else border
        layers['background'].append({
            "type": "rect", "x": tx, "y": b.y, "w": tw, "h": b.h,
            "color": fill, "line_width": 0,
        })
        layers['background'].append({
            "type": "rect", "x": tx, "y": b.y, "w": tw, "h": b.h,
            "color": bord, "line_width": 1,
        })
        layers['hud'].append({
            "type": "text", "text": lbl,
            "x": tx + 10, "y": b.y + b.h // 2 - 7,
            "color": accent if active else muted, "size": 12,
            "bold": active,
        })


def _render_content(
    layers: dict, state: Any, bounds: dict, colors: dict,
    data: dict, lua_call: Any | None,
) -> None:
    if 'content' not in bounds:
        return
    b = bounds['content']
    bg = _color('bg', colors)
    layers['background'].append({
        "type": "rect", "x": b.x, "y": b.y, "w": b.w, "h": b.h,
        "color": bg, "line_width": 0,
    })

    tab = state.active_tab
    if tab == 'stable':
        _render_stable(layers, state, b, colors, lua_call)
    elif tab == 'betting':
        _render_betting(layers, state, b, colors)
    elif tab == 'breed':
        _render_breed(layers, state, b, colors, data)
    elif tab == 'history':
        _render_history(layers, state, b, colors)


def _render_stable(
    layers: dict, state: Any, b: Any, colors: dict,
    lua_call: Any | None
) -> None:
    import time
    LEFT_SPLIT = 0.55
    PAD = 12
    lw = int(b.w * LEFT_SPLIT)
    rw = b.w - lw

    surface = _color('surface', colors)
    surface2 = _color('surface2', colors)
    border = _color('border', colors)
    accent = _color('accent', colors)
    muted = _color('muted', colors)
    text_c = _color('text', colors)
    green = _color('green', colors)
    amber = _color('amber', colors)
    yellow = _color('yellow', colors)

    now_ms = int(time.time() * 1000)
    card_h, pad = 70, 8

    for i, horse in enumerate(state.horses):
        cy = b.y + pad + i * (card_h + pad)
        if cy + card_h > b.y + b.h - 30:
            break
        is_sel = (i == state.selected_horse_idx)
        bord = accent if is_sel else border
        layers['midground'].append({
            "type": "rect", "x": b.x + pad, "y": cy,
            "w": lw - pad * 2, "h": card_h,
            "color": surface, "line_width": 0,
        })
        layers['midground'].append({
            "type": "rect", "x": b.x + pad, "y": cy,
            "w": lw - pad * 2, "h": card_h,
            "color": bord, "line_width": 1,
        })
        name = horse.get('name', 'Unknown')
        gen = horse.get('generation', 1)
        gender = horse.get('gender', '')[:1]
        layers['hud'].append({
            "type": "text", "text": name,
            "x": b.x + pad + 10, "y": cy + 8,
            "color": text_c, "size": 13, "bold": True,
        })
        layers['hud'].append({
            "type": "text", "text": f"G{gen} {gender}",
            "x": b.x + pad + 10, "y": cy + 26,
            "color": muted, "size": 11,
        })
        resting = int(horse.get('cooldown_until', 0)) > now_ms
        if resting:
            ms_left = int(horse.get('cooldown_until', 0)) - now_ms
            secs = ms_left // 1000
            layers['hud'].append({
                "type": "text", "text": f"Resting {secs}s",
                "x": b.x + lw - 120, "y": cy + 10,
                "color": amber, "size": 11,
            })
        else:
            layers['hud'].append({
                "type": "text", "text": "Ready",
                "x": b.x + lw - 90, "y": cy + 10,
                "color": green, "size": 11,
            })

    # Controls hint
    layers['hud'].append({
        "type": "text", "text": "↑↓ Navigate  X Sell  U Unlock  M Buy",
        "x": b.x + pad, "y": b.y + b.h - 18,
        "color": muted, "size": 10,
    })

    # Right panel: detail
    rx = b.x + lw
    layers['midground'].append({
        "type": "rect", "x": rx, "y": b.y, "w": rw, "h": b.h,
        "color": surface, "line_width": 0,
    })
    layers['midground'].append({
        "type": "rect", "x": rx, "y": b.y, "w": rw, "h": b.h,
        "color": border, "line_width": 1,
    })

    if not state.horses:
        return

    idx = min(state.selected_horse_idx, len(state.horses) - 1)
    h = state.horses[idx]
    dx, dy = rx + PAD, b.y + PAD

    layers['hud'].append({
        "type": "text", "text": h.get('name', '?'),
        "x": dx, "y": dy, "color": text_c, "size": 15, "bold": True,
    })
    dy += 22
    gen_str = f"Gen {h.get('generation', 1)}  {h.get('gender', '')}"
    layers['hud'].append({
        "type": "text", "text": gen_str,
        "x": dx, "y": dy, "color": muted, "size": 11,
    })
    dy += 22

    for lbl, key, color in [
        ('Speed', 'speed', accent),
        ('Stamina', 'stamina', green),
        ('Accel', 'acceleration', yellow),
        ('Temp', 'temperament', amber),
    ]:
        val = float(h.get(key, 0))
        layers['hud'].append({
            "type": "text", "text": lbl,
            "x": dx, "y": dy, "color": muted, "size": 11,
        })
        # Stat bar background
        bar_w = rw - PAD * 2 - 55
        layers['midground'].append({
            "type": "rect", "x": dx + 55, "y": dy + 1, "w": bar_w, "h": 10,
            "color": surface2, "line_width": 0,
        })
        layers['midground'].append({
            "type": "rect", "x": dx + 55, "y": dy + 1, "w": bar_w, "h": 10,
            "color": border, "line_width": 1,
        })
        fill_w = int((val / max(1, 100)) * (bar_w - 2))
        if fill_w > 0:
            layers['midground'].append({
                "type": "rect", "x": dx + 56, "y": dy + 2, "w": fill_w, "h": 8,
                "color": color, "line_width": 0,
            })
        layers['hud'].append({
            "type": "text", "text": str(int(val)),
            "x": dx + rw - PAD * 2 - 35, "y": dy,
            "color": text_c, "size": 11,
        })
        dy += 18

    dy += 6
    layers['hud'].append({
        "type": "text", "text": "CAREER",
        "x": dx, "y": dy, "color": muted, "size": 10,
    })
    dy += 14
    career = (f"Runs:{h.get('runs', 0)}  Wins:{h.get('wins', 0)}  "
              f"P:{h.get('places', 0)}  S:{h.get('thirds', 0)}")
    layers['hud'].append({
        "type": "text", "text": career,
        "x": dx, "y": dy, "color": text_c, "size": 11,
    })
    dy += 16
    layers['hud'].append({
        "type": "text", "text": f"Earnings: ${h.get('earnings', 0):,}",
        "x": dx, "y": dy, "color": green, "size": 11,
    })
    dy += 16
    price = 0
    if lua_call:
        try:
            price = lua_call('calculate_horse_price', h) or 0
        except Exception:
            pass
    layers['hud'].append({
        "type": "text", "text": f"Sale value: ${int(price):,}",
        "x": dx, "y": dy, "color": muted, "size": 11,
    })


def _render_betting(
    layers: dict, state: Any, b: Any, colors: dict
) -> None:
    PAD = 12
    LEFT_SPLIT = 0.55
    lw = int(b.w * LEFT_SPLIT)
    rw = b.w - lw

    surface = _color('surface', colors)
    border = _color('border', colors)
    accent = _color('accent', colors)
    muted = _color('muted', colors)
    text_c = _color('text', colors)
    green = _color('green', colors)
    yellow = _color('yellow', colors)
    amber = _color('amber', colors)
    red = _color('red', colors)

    lx, ly = b.x + PAD, b.y + PAD
    layers['hud'].append({
        "type": "text", "text": "BETTING OFFICE",
        "x": lx, "y": ly, "color": text_c, "size": 14, "bold": True,
    })
    ly += 22

    if not state.current_race:
        layers['hud'].append({
            "type": "text", "text": "No race scheduled.",
            "x": lx, "y": ly, "color": muted, "size": 12,
        })
        layers['hud'].append({
            "type": "text", "text": "Press N for new race.",
            "x": lx, "y": ly + 18, "color": muted, "size": 11,
        })
    else:
        race = state.current_race
        layers['hud'].append({
            "type": "text", "text": race.get('name', 'Race'),
            "x": lx, "y": ly, "color": accent, "size": 13, "bold": True,
        })
        ly += 18
        layers['hud'].append({
            "type": "text",
            "text": f"{race.get('distance', 0)}m · Prize ${race.get('prize_pool', 0):,}",
            "x": lx, "y": ly, "color": muted, "size": 11,
        })
        ly += 20

        layers['hud'].append({
            "type": "text", "text": "#  Horse                  Odds",
            "x": lx, "y": ly, "color": muted, "size": 10,
        })
        ly += 14
        parts = race.get('participants', [])
        for i, p in enumerate(parts):
            h = p.get('horse', p)
            is_sel = (i == state.bet_target_idx)
            row_color = accent if is_sel else text_c
            prefix = '▶ ' if is_sel else '  '
            name = h.get('name', 'Horse')[:20]
            odds = float(p.get('odds', 0))
            row = f"{prefix}{i+1:<3}{name:<22}{odds:.2f}"
            layers['hud'].append({
                "type": "text", "text": row,
                "x": lx, "y": ly, "color": row_color, "size": 11,
            })
            ly += 16

        ly += 4
        layers['hud'].append({
            "type": "text",
            "text": "←→ Select horse  W/P/S Bet type  +/- Amount",
            "x": lx, "y": ly, "color": muted, "size": 10,
        })
        ly += 14
        layers['hud'].append({
            "type": "text",
            "text": "ENTER Place bet  R Run race  C Clear  N New race",
            "x": lx, "y": ly, "color": muted, "size": 10,
        })

    # Right panel
    rx, ry = b.x + lw + PAD, b.y + PAD
    layers['midground'].append({
        "type": "rect", "x": b.x + lw, "y": b.y, "w": rw, "h": b.h,
        "color": surface, "line_width": 0,
    })
    layers['midground'].append({
        "type": "rect", "x": b.x + lw, "y": b.y, "w": rw, "h": b.h,
        "color": border, "line_width": 1,
    })

    layers['hud'].append({
        "type": "text", "text": "BET SLIP",
        "x": rx, "y": ry, "color": text_c, "size": 13, "bold": True,
    })
    ry += 20

    for btype, color in [('Win', green), ('Place', yellow), ('Show', amber)]:
        sel = '●' if state.bet_type == btype else '○'
        tc = color if state.bet_type == btype else muted
        layers['hud'].append({
            "type": "text", "text": f'{sel} {btype}',
            "x": rx, "y": ry, "color": tc, "size": 12,
        })
        ry += 16

    ry += 4
    layers['hud'].append({
        "type": "text", "text": f'Amount: ${state.bet_amount}',
        "x": rx, "y": ry, "color": text_c, "size": 12, "bold": True,
    })
    ry += 20

    if state.bets:
        layers['hud'].append({
            "type": "text", "text": "Placed bets:",
            "x": rx, "y": ry, "color": muted, "size": 10,
        })
        ry += 14
        for bet in state.bets:
            line = f'${bet.amount} {bet.bet_type} · {bet.horse_name[:16]}'
            layers['hud'].append({
                "type": "text", "text": line,
                "x": rx, "y": ry, "color": text_c, "size": 11,
            })
            layers['hud'].append({
                "type": "text", "text": f'@ {bet.payout_odds:.2f}',
                "x": rx + rw - 80, "y": ry, "color": accent, "size": 11,
            })
            ry += 15

    if state.last_bet_results:
        ry += 8
        layers['hud'].append({
            "type": "text", "text": "── Race Results ──",
            "x": rx, "y": ry, "color": muted, "size": 10,
        })
        ry += 14
        for br in state.last_bet_results:
            won_color = green if br.won else red
            mark = '✓' if br.won else '✗'
            line = f'{mark} {br.bet_type} {br.horse_name[:14]}'
            layers['hud'].append({
                "type": "text", "text": line,
                "x": rx, "y": ry, "color": won_color, "size": 11,
            })
            pout = f'+${br.payout}' if br.won else '-$' + str(br.amount)
            layers['hud'].append({
                "type": "text", "text": pout,
                "x": rx + rw - 70, "y": ry,
                "color": won_color, "size": 11, "bold": True,
            })
            ry += 15

        net = state.last_net_payout
        net_color = green if net >= 0 else red
        layers['hud'].append({
            "type": "text",
            "text": f"Net: {'+' if net >= 0 else ''}${net}",
            "x": rx, "y": ry + 4, "color": net_color, "size": 13, "bold": True,
        })

    if state.race_results:
        ry_s = b.y + b.h - 90
        layers['hud'].append({
            "type": "text", "text": "Final standings:",
            "x": rx, "y": ry_s, "color": muted, "size": 10,
        })
        ry_s += 14
        for r in state.race_results[:3]:
            layers['hud'].append({
                "type": "text",
                "text": f"#{r.get('rank', 0)} {r.get('horse_name', '?')[:20]}",
                "x": rx, "y": ry_s, "color": text_c, "size": 11,
            })
            ry_s += 15


def _render_breed(
    layers: dict, state: Any, b: Any, colors: dict, data: dict
) -> None:
    PAD = 12
    sires = ([h for h in state.horses if h.get('gender') == 'Stallion'] +
             [h for h in data.get('public_studs', []) if h.get('gender') == 'Stallion'])
    dams = ([h for h in state.horses if h.get('gender') == 'Mare'] +
            [h for h in data.get('public_studs', []) if h.get('gender') == 'Mare'])

    lw = b.w // 2
    lx, rx = b.x + PAD, b.x + lw + PAD
    cy = b.y + PAD
    accent = _color('accent', colors)
    text_c = _color('text', colors)
    muted = _color('muted', colors)
    green = _color('green', colors)

    layers['hud'].append({
        "type": "text", "text": "SIRES  (↑↓)",
        "x": lx, "y": cy, "color": text_c, "size": 12, "bold": True,
    })
    layers['hud'].append({
        "type": "text", "text": "DAMS   (←→)",
        "x": rx, "y": cy, "color": text_c, "size": 12, "bold": True,
    })
    cy += 20

    for i, sire in enumerate(sires[:8]):
        is_sel = (i == state.sire_idx)
        color = accent if is_sel else text_c
        owned = sire.get('player_owned', True)
        prefix = '▶ ' if is_sel else '  '
        tag = '' if owned else f' [${sire.get("price", 0) // 4}]'
        layers['hud'].append({
            "type": "text",
            "text": f'{prefix}{sire.get("name", "?")[:22]}{tag}',
            "x": lx, "y": cy + i * 18, "color": color, "size": 12,
        })

    for i, dam in enumerate(dams[:8]):
        is_sel = (i == state.dam_idx)
        color = accent if is_sel else text_c
        owned = dam.get('player_owned', True)
        prefix = '▶ ' if is_sel else '  '
        tag = '' if owned else f' [${dam.get("price", 0) // 4}]'
        layers['hud'].append({
            "type": "text",
            "text": f'{prefix}{dam.get("name", "?")[:22]}{tag}',
            "x": rx, "y": cy + i * 18, "color": color, "size": 12,
        })

    footer_y = b.y + b.h - 50
    if state.foal:
        layers['hud'].append({
            "type": "text",
            "text": f'Foal ready: {state.foal.get("name", "?")}',
            "x": b.x + PAD, "y": footer_y, "color": green, "size": 13, "bold": True,
        })
        layers['hud'].append({
            "type": "text", "text": "K = Claim  ESC = Discard",
            "x": b.x + PAD, "y": footer_y + 18, "color": muted, "size": 11,
        })
    else:
        layers['hud'].append({
            "type": "text", "text": "B = Breed selected pair",
            "x": b.x + PAD, "y": footer_y, "color": muted, "size": 11,
        })


def _render_history(
    layers: dict, state: Any, b: Any, colors: dict
) -> None:
    PAD = 10
    surface = _color('surface', colors)
    border = _color('border', colors)
    muted = _color('muted', colors)
    text_c = _color('text', colors)
    yellow = _color('yellow', colors)
    amber = _color('amber', colors)

    if not state.race_history:
        layers['hud'].append({
            "type": "text", "text": "No races completed yet.",
            "x": b.x + PAD, "y": b.y + PAD, "color": muted, "size": 14,
        })
        return

    card_h = 90
    for i, entry in enumerate(reversed(state.race_history[-6:])):
        cy = b.y + PAD + i * (card_h + PAD)
        if cy + card_h > b.y + b.h:
            break
        layers['midground'].append({
            "type": "rect", "x": b.x + PAD, "y": cy,
            "w": b.w - PAD * 2, "h": card_h,
            "color": surface, "line_width": 0,
        })
        layers['midground'].append({
            "type": "rect", "x": b.x + PAD, "y": cy,
            "w": b.w - PAD * 2, "h": card_h,
            "color": border, "line_width": 1,
        })
        name = entry.get('name', 'Race')
        dist = entry.get('distance', 0)
        prize = entry.get('prize_pool', 0)
        layers['hud'].append({
            "type": "text", "text": name,
            "x": b.x + PAD + 10, "y": cy + 8,
            "color": text_c, "size": 13, "bold": True,
        })
        layers['hud'].append({
            "type": "text", "text": f'{dist}m · Prize ${prize:,}',
            "x": b.x + PAD + 10, "y": cy + 24,
            "color": muted, "size": 11,
        })
        for j, r in enumerate(entry.get('results', [])[:3]):
            rank = r.get('rank', j + 1)
            hname = r.get('horse_name', '?')[:24]
            rank_colors = {1: yellow, 2: muted, 3: amber}
            rc = rank_colors.get(rank, muted)
            layers['hud'].append({
                "type": "text", "text": f'#{rank}  {hname}',
                "x": b.x + PAD + 10, "y": cy + 42 + j * 14,
                "color": rc, "size": 11,
            })


def _render_footer(
    layers: dict, state: Any, bounds: dict, colors: dict
) -> None:
    if 'footer' not in bounds:
        return
    b = bounds['footer']
    surface = _color('surface', colors)
    border = _color('border', colors)
    muted = _color('muted', colors)

    layers['background'].append({
        "type": "rect", "x": b.x, "y": b.y, "w": b.w, "h": b.h,
        "color": surface, "line_width": 0,
    })
    layers['background'].append({
        "type": "rect", "x": b.x, "y": b.y, "w": b.w, "h": b.h,
        "color": border, "line_width": 1,
    })
    layers['hud'].append({
        "type": "text",
        "text": "© 2026 DERBY SIM — RFD IT Services  |  PyGame Port",
        "x": b.x + 20, "y": b.y + b.h // 2 - 7,
        "color": muted, "size": 10,
    })


def _render_confirm_overlay(
    layers: dict, state: Any, bounds: dict, colors: dict
) -> None:
    if not getattr(state, 'confirm_mode', False):
        return
    # Use the full screen dimensions from bounds if available,
    # otherwise fall back to a reasonable default
    if 'header' in bounds and 'footer' in bounds:
        width = bounds['header'].w
        height = bounds['footer'].y + bounds['footer'].h
    else:
        width, height = 1024, 768

    ow, oh = 400, 100
    ox = (width - ow) // 2
    oy = (height - oh) // 2
    surface2 = _color('surface2', colors)
    accent = _color('accent', colors)
    text_c = _color('text', colors)

    layers['foreground'].append({
        "type": "rect", "x": ox, "y": oy, "w": ow, "h": oh,
        "color": surface2, "line_width": 0,
    })
    layers['foreground'].append({
        "type": "rect", "x": ox, "y": oy, "w": ow, "h": oh,
        "color": accent, "line_width": 1,
    })
    layers['foreground'].append({
        "type": "text",
        "text": "Are you sure? (Y to confirm, any other key cancels)",
        "x": ox + 10, "y": oy + 30,
        "color": text_c, "size": 12,
    })
