"""
Asteroids Simulation Physics
SRP: Coordinates toroidal wrap and movement scaling
"""
from src.shared.entities.kinetics import KineticBody, Vector2D
from src.shared.physics import wrap_position

def update_kinetics(body: KineticBody, dt: float, bounds: tuple = (160, 144)):
    """Update body with bounds awareness"""
    body.bounds = bounds
    body.update(dt)
    
    # Redundant but explicit as requested: Ensure wrap matches shared logic
    new_x, new_y = wrap_position(body.state.position.x, body.state.position.y, bounds[0], bounds[1])
    body.state.position.x = new_x
    body.state.position.y = new_y

def set_toroidal_wrap(body: KineticBody, bounds: tuple):
    """Ensure body uses correct wrap bounds"""
    body.bounds = bounds
