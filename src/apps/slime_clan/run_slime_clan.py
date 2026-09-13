from loguru import logger
from src.apps.slime_clan.app import create_app

def main():
    logger.info("🚀 Launching Slime Clan...")
    app = create_app()
    app.run("overworld")

if __name__ == "__main__":
    main()
