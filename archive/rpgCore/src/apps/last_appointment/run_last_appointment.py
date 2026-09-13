from src.apps.last_appointment.app import create_app

def main():
    app = create_app()
    app.run("appointment_scene")

if __name__ == "__main__":
    main()
