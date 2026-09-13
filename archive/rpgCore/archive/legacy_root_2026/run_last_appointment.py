#!/usr/bin/env python3
"""
Launcher for Last Appointment
-----------------------------
Execute from the repository root: uv run python run_last_appointment.py
"""

from loguru import logger

if __name__ == "__main__":
    logger.info("🚀 Launching Last Appointment...")
    from src.apps.last_appointment.app import create_app
    app = create_app()
    app.run("appointment_scene")
