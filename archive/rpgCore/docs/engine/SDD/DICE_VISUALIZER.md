# Dice Visualizer System Specification
**Date**: 2026-03-03
**Status**: DRAFT (Pre-implementation)

This document extracts the logic and requirements from the physical `dice_roller_v2.py` prototype to establish the shared engine `Die` component. This visualizer is responsible for translating random number generation into meaningful, suspenseful player feedback across all game modes (combat, event checks, sumo ties).

## Animation State Machine

The `Die` class traverses a linear state machine triggered by `roll()`.

| State | Duration (sec) | Visual Behavior |
| :--- | :--- | :--- |
| **`idle`** | Infinite | Resting on the board, no animation. Responds to mouse hover with an under-glow. |
| **`fast`** | `0.55` | "Blur" phase. Heavy random `shake_x`/`shake_y`, rapid random face cycling, and high-speed spin. Geometry squashes wildly. |
| **`decel`** | `0.30` | "Stutter-settle" phase. The die flashes through a pre-calculated sequence of exactly 4 decoy faces (`STUTTER_FRAMES = 4`), holding each for ~75ms. Spin and shake decay. |
| **`landing`** | `0.28` | The die locks onto the final `result`. Squashes down and bounces back into shape via an `ease_out_bounce` curve. Emits a bright white glow ring. |
| **`settled`** | `1.4` (`SETTLE_GLOW`) | The physical animation stops. The glow ring slowly fades out over the duration. Transits back to `idle` upon completion. |

## Integration API Contract

Consumers of the visualizer (e.g., `SumoScene`, `CombatScene`) must adhere to this interface:
- **Initialization**: `die = Die(sides, cx, cy, radius)`
- **Trigger**: `die.roll()` — Commences the state machine. The final value is instantly available in `die.result`.
- **Game Loop**: Continually call `die.update(dt)` and `die.draw(screen, fonts)`.
- **Read Logic**: UIs should wait until `die.state in ("landing", "settled")` before reacting to `die.result`.

## Pip Layouts and Geometry

To maintain clarity, standard D4 and D6 dice render pips instead of numeric text.
- Pips are defined as points mapped in a normalized `[-1.0, 1.0]` coordinate space.
- They are drawn as circles multiplied by a scale factor (`self.radius`).

Numeric dice (D8, D10, D12, D20, D100) render numeric text.
- Geometries use math sine/cosine functions to draw the polygon face (e.g. Hexagon for D20, Square for D6).
- An explicit underline is drawn for 6 and 9 disambiguation on D10/D100.

## CRIT and FUMBLE Context

Extreme outcomes trigger special UI emphasis to heighten the stakes.
- **Criteria**: Evaluated only when `state` is `settled` or `landing`.
- **CRIT**: Triggers if `display == self.sides`. Renders the number in bright GOLD, scales up the font size, and displays a "CRIT!" text label beneath the die.
- **FUMBLE**: Triggers if `display == 1`. Renders the number in RED, scales up the font size, and displays a "FUMBLE" text label beneath the die.
