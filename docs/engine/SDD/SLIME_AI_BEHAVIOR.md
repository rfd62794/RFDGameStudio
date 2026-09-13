# Slime AI Behavior Specification
**Date**: 2026-03-03
**Status**: DRAFT (Pre-implementation)

This document outlines the state machine, prediction loop, and personality mapping for AI combatants in the Sumo module, extracted directly from the `slime_soccer` demo.

## Trajectory Prediction Loop

The AI determines its actions by simulating the projectile's trajectory up to N ticks into the future. It iterates over the exact physics constants to map out potential intercept points.

```python
def predict_ball(ball, ticks=100):
    tx, ty = ball.x, ball.y
    tvx, tvy = ball.vx, ball.vy
    predictions = []
    for t in range(ticks):
        tvy += GRAVITY
        tvx *= BALL_DAMPING
        tx += tvx
        ty += tvy
        
        # Simulated wall bounces
        if tx < BALL_RADIUS:
            tx = BALL_RADIUS
            tvx *= -BALL_BOUNCE_DAMPING
        if tx > WIDTH - BALL_RADIUS:
            tx = WIDTH - BALL_RADIUS
            tvx *= -BALL_BOUNCE_DAMPING
            
        predictions.append((tx, ty, tvx, tvy, t))
        
        # Simulated ground impact
        if ty > GROUND_Y - BALL_RADIUS:
            ty = GROUND_Y - BALL_RADIUS
            tvy *= -BALL_BOUNCE_DAMPING
            break
            
    return predictions
```

*Engine Routing:* This identical loop acts as the foundation for Dispatch outcome predictions and general projectile arc calculations.

## Phase-Based State Machine

The AI runs a three-phase state machine that evaluates every frame based on the layout of the field.

| Phase | Entry Criteria | Behavior |
| :--- | :--- | :--- |
| **OFFENSIVE** | Ball X > 40% of field AND not moving toward friendly goal. | Aggressively chases the ball and attempts to time a direct offensive jump. |
| **DEFENSIVE** | Ball X < 60% of field OR moving toward friendly goal. | Intercepts predicted trajectory early; provides emergency goal line cover. |
| **MIDFIELD** | Neither of the above. | Scans the prediction array for an earliest-intercept lookahead and positions below it. |

### Decision Execution Pattern

Within each active state, the AI independently computes two values:
1. `target_x`
2. `should_jump`

It executes horizontal movement as a simple sign comparison:
```python
slime.vx = math.copysign(1, target_x - slime.x) * speed
```

### Boundary Independence (Design Decision)

The AI code places **no field boundary restrictions** on the agent; it roams the full width of the arena during the demo. This is an intentional design decision. Engine physics test pure strategy without hard-coded artificial constraints. Any movement constraints must emerge from actual game rules and physical walls, rather than AI-level clamps.

## PersonalityComponent Mapping

The logic blocks above map directly into the RPG `PersonalityComponent` to allow diverse opponent behaviors. The thresholds that dictate phase transitions serve as the personality parameters:

- **`aggressive_threshold`**: Adjusts the field percentage the ball must cross before switching into OFFENSIVE.
- **`defensive_threshold`**: Adjusts the distance required to trigger emergency DEFENSIVE retreats.
- **`intercept_lookahead`**: The number of ticks the agent simulates. Smarter AI uses a longer, more complete arc projection.
- **`jump_timing_window`**: The vertical height range of the ball that triggers an intercept jump. Controls physical accuracy.
