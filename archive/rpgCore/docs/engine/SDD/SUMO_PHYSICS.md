# Sumo Physics Technical Specification
**Date**: 2026-03-03
**Status**: DRAFT (Pre-implementation)

This document specifies the core physics interactions for the Sumo phase, extracted directly from the `slime_soccer` demo application. These constants and algorithms form the foundation of collision resolution and arc behavior in the engine.

## Physics Constants

The following constants produce a satisfying, physical feel. They serve as the baseline starting values for the Sumo engine tuning pass. **Note: These are starting values, not locked — a dedicated Sumo tuning pass is required.**

| Constant | Value | Description |
| :--- | :--- | :--- |
| `GRAVITY` | `0.6` | Applied to the ball's Y velocity per frame. |
| `SLIME_SPEED` | `5` | Horizontal movement velocity for slimes/combatants. |
| `SLIME_JUMP_POWER` | `-12` | Initial Y velocity applied on jump (negative = up). |
| `BALL_DAMPING` | `0.99` | Applied to ball X velocity per frame. Leaves ~55% speed after 60 frames. |
| `BALL_BOUNCE_DAMPING` | `0.8` | Velocity multiplier on wall/ground bounces. Allows 3-4 bounces to rest. |
| `MAX_BALL_SPEED` | `13` | Hard clamp applied after every collision to prevent tunneling. |
| `SLIME_RADIUS` | `40` | Base collision radius for characters. |
| `BALL_RADIUS` | `10` | Base collision radius for the projectile/ball. |

## Collision Mechanics

### Semicircle Collision

Characters act as half-circles for physics interactions. The ball only deflects off the **top** half of the entity. Without this guard, characters can aggressively "scoop" the ball from beneath the floor.

This check forms the core of the Sumo hit mechanic:

```python
dx = ball.x - slime.x
dy = ball.y - slime.y
distance = math.sqrt(dx*dx + dy*dy)

if distance < SLIME_RADIUS + BALL_RADIUS:
    angle = math.atan2(dy, dx)
    # The angle check is the spec: only register hits from above or the direct sides
    if ball.y < slime.y or abs(angle) < math.pi * 0.5:
        # resolve collision
        pass
```

### Velocity Transfer

Upon a valid collision, the ball inherits momentum according to a strict reflection and transfer modifier. A jumping entity will correctly transfer more force via its own velocity.

```python
speed = math.sqrt(ball.vx**2 + ball.vy**2)

# 1.5 reflection multiplier, 0.5 momentum inheritance
ball.vx = math.cos(angle) * speed * 1.5 + slime.vx * 0.5
ball.vy = math.sin(angle) * speed * 1.5 + slime.vy * 0.5
```

*Engine Routing:* The Sumo attack power modifier feeds directly into this exact transfer formula.

### Maximum Velocity Clamping (Contract)

To maintain engine stability and prevent high-velocity tunneling through collision hulls, the ball speed is strictly clamped following *every* hit resolution.

```python
new_speed = math.sqrt(ball.vx**2 + ball.vy**2)
if new_speed > MAX_BALL_SPEED:
    scale = MAX_BALL_SPEED / new_speed
    ball.vx *= scale
    ball.vy *= scale
```

## Environment Boundaries

### Ground Collision and Zone Triggers

The ground is treated as a hard limit rather than a dynamic body. When the ball breaks the vertical floor plane, it triggers a bounce and clamps position. If it intersects with goal regions, it acts as a zone event trigger, hooking into the scoring/match resolution pipeline.
