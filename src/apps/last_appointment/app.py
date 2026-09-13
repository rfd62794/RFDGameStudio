"""
Last Appointment App — Thin Launcher
"""
from src.shared.engine.scene_manager import SceneManager
from src.apps.last_appointment.scenes.appointment_scene import AppointmentScene

def create_app() -> SceneManager:
    """Create and configure the Last Appointment app."""
    manager = SceneManager(
        width=800,
        height=600,
        title="rpgCore — Last Appointment",
        fps=60,
    )
    manager.register("appointment_scene", AppointmentScene)
    return manager
