# RFD_IT_Publishing

Private deployment pipeline for RFD IT Services projects.

## Prerequisites
- Python 3.10+
- Butler (itch.io CLI): https://itch.io/docs/butler/

## Setup
1. Clone repo (private)
2. pip install -r requirements.txt
3. butler login  (authenticates with itch.io — stored locally by Butler)
4. Edit config/games.yaml with your game slugs

## Usage
python publisher.py list
python publisher.py deploy antsim --target itchio
python publisher.py deploy antsim --target itchio --dry-run

## Adding a Game
Add an entry to config/games.yaml:
  your_game:
    itchio_slug: your-username/your-game
    channel: html5
    build_dir: path/to/build

## Phase Roadmap
- Phase 1: itch.io via Butler ← current
- Phase 2: PyPI via Twine
- Phase 3: Play Store via Google CLI
- Phase 4: rfditservices.com via SFTP
