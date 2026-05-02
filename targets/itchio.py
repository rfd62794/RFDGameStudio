import subprocess
import yaml
import os


def check_butler() -> bool:
    """Verify butler is installed. Returns True if found."""
    try:
        result = subprocess.run(
            ["butler", "--version"],
            capture_output=True,
            text=True
        )
        return result.returncode == 0
    except FileNotFoundError:
        return False


def load_game_config(game_name: str) -> dict:
    """
    Load game entry from config/games.yaml.
    Raises KeyError if game_name not found.
    """
    config_path = os.path.join(os.path.dirname(__file__), "..", "config", "games.yaml")
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)
    
    if game_name not in config["games"]:
        raise KeyError(f"Game not found: {game_name}")
    
    return config["games"][game_name]


def push(game_name: str, dry_run: bool = False) -> bool:
    """
    Push build to itch.io via Butler.
    
    Args:
        game_name: Key from games.yaml
        dry_run: If True, print command without executing
    
    Returns:
        True on success, False on failure
    """
    try:
        game_config = load_game_config(game_name)
    except KeyError as e:
        print(f"Error: {e}")
        return False
    
    build_dir = game_config["build_dir"]
    itchio_slug = game_config["itchio_slug"]
    channel = game_config["channel"]
    
    command = ["butler", "push", build_dir, f"{itchio_slug}:{channel}"]
    
    if dry_run:
        print(f"Would execute: {' '.join(command)}")
        return True
    
    try:
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"Successfully pushed {game_name} to itch.io")
            return True
        else:
            print(f"Failed to push {game_name}: {result.stderr}")
            return False
    except FileNotFoundError:
        print("Error: butler not found. Install from https://itch.io/docs/butler/")
        return False
