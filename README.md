# rpgCore

**One developer. One engine. Four distinct games.**

rpgCore is not a framework or a tutorial project—it is a working, production-grade game engine built to simultaneously power multiple distinct game experiences from a single, unified codebase. It embraces the "Orange Box" concept: shared core systems natively driving completely different genres of games without repetition.

## Quick Start
```bash
git clone https://github.com/your-username/rpgCore.get
cd rpgCore
pip install -r requirements.txt
python game.py
```
One command to see the engine running.

## The Demos
rpgCore currently ships with four built-in games testing the limits and flexibility of the shared engine architecture.

**Slime Clan**
*Genre: Turn-based faction strategy*
*Status: Playable*
Build your clan, wage war, and claim territory in this strategic simulation. Proves out the engine's grid simulation, node-based overworlds, and automated battle resolution systems.

**Last Appointment**
*Genre: Narrative dialogue*
*Status: Playable*
You are Death. Your client has questions. A highly atmospheric, narrative-driven experience focusing on dialogue trees, dynamic UI card layouts, and complex state management across conversational nodes.

**TurboShells**
*Genre: Management simulation*
*Status: In Development*
A deep simulation focusing on turtle breeding, racing, genetics, training, and legacy management. Stresses the engine's data-heavy simulation and time progression mechanics.

**Asteroids Roguelike**
*Genre: Action roguelike*
*Status: In Development*
Survive the belt, where every run changes you. A real-time action testbed for the engine's high-performance rendering, collision, and physics capabilities.

## Engine Architecture

rpgCore strictly adheres to a domain-driven architectural separation:
- `src/shared/`: The canonical engine layer. Pure systems, utilities, renderers, and foundation logic.
- `src/apps/`: Self-contained demo applications that consume the shared systems.
- `src/launcher/`: Handles the manifest-driven demo registry (`demos.json`) and the single CLI entry point.

**Constitution Law:** Nothing is built twice, and demos never reimplement shared engine systems.

## Built With
- **Python 3.12+**
- **Pygame** (Rendering and Window Management)
- **pytest** (Test Suite)
*(Future performance layers are planned in Rust)*

## Testing
rpgCore maintains a strictly protected baseline of **296 passing tests**.
```bash
uv run pytest
```
