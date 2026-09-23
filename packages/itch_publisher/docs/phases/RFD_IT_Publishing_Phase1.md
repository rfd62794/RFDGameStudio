# RFD_IT_Publishing — Phase 1 Directive: itch.io via Butler

*May 2026 | Read fully before executing anything.*

---

> ⛔ **STOP:** This is a new repo. No existing test floor. 
> Create the repo structure first. Report it before writing any code.

---

## §0 Context

RFD_IT_Publishing is a private deployment pipeline for RFD IT Services projects.
It provides a single CLI entry point for publishing games and tools to multiple
targets. Phase 1 scope is itch.io only, using Butler as the upload mechanism.

Future phases will add PyPI, Play Store, and website deployment. Do not implement
those now. Do not scaffold for them beyond what's listed in §1.

---

## §1 Repo Structure

Create exactly this structure. Nothing else.

```
RFD_IT_Publishing/
├── publisher.py              # Main CLI entry point
├── targets/
│   ├── __init__.py
│   └── itchio.py             # Butler wrapper
├── config/
│   └── games.yaml            # Game registry
├── tests/
│   └── test_itchio.py        # Phase 1 tests
├── .env.example              # Public secrets template
├── .gitignore                # Must include .env
├── requirements.txt          # python-dotenv, pyyaml, click
└── README.md                 # Setup and usage
```

**.gitignore must include:**
```
.env
*.key
*.json.key
__pycache__/
*.pyc
dist/
build/
```

---

## §2 Implementation

### 2.1 `config/games.yaml`

Public game registry. No secrets. Example entries only — Robert will
populate with real slugs after setup.

```yaml
games:
  antsim:
    itchio_slug: rfd62794/antsim
    channel: html5
    build_dir: build/web

  voidrift:
    itchio_slug: rfd62794/voidrift
    channel: android
    build_dir: build/android

  greengap:
    itchio_slug: rfd62794/greengap
    channel: html5
    build_dir: public/
```

### 2.2 `.env.example`

Public template. Values empty. Never populate this file with real values.

```
# itch.io — Butler stores credentials locally via `butler login`
# No API key needed in .env for itch.io — Butler handles auth natively
# Future phases will add:
# PYPI_TOKEN=
# SFTP_PASSWORD=
# GOOGLE_PLAY_KEY_PATH=
```

Note: Butler authenticates via `butler login` which stores credentials
in Butler's own secure local store. No itch.io secrets needed in .env.

### 2.3 `targets/itchio.py`

Butler wrapper. Responsibilities:
- Verify Butler is installed and accessible
- Load game config from games.yaml
- Run butler push command
- Report success or failure with exit code

```python
# Signatures

def check_butler() -> bool:
    """Verify butler is installed. Returns True if found."""
    ...

def push(game_name: str, dry_run: bool = False) -> bool:
    """
    Push build to itch.io via Butler.
    
    Args:
        game_name: Key from games.yaml
        dry_run: If True, print command without executing
    
    Returns:
        True on success, False on failure
    """
    ...

def load_game_config(game_name: str) -> dict:
    """
    Load game entry from config/games.yaml.
    Raises KeyError if game_name not found.
    """
    ...
```

**Butler command format:**
```bash
butler push <build_dir> <itchio_slug>:<channel>
```

Example:
```bash
butler push build/web rfd62794/antsim:html5
```

> ⚠️ RULE: Never hardcode slugs, channels, or paths. Always read from
> games.yaml. Never store itch.io credentials in code or .env.

### 2.4 `publisher.py`

Main CLI using Click. Phase 1 commands only.

```bash
# Deploy a game to itch.io
python publisher.py deploy <game_name> --target itchio

# Dry run — print command without executing  
python publisher.py deploy <game_name> --target itchio --dry-run

# List configured games
python publisher.py list
```

**Behavior:**
- `deploy` — calls `targets/itchio.push(game_name)`
- `list` — reads games.yaml, prints all configured game names
- Unknown target — prints "Unknown target: X. Available: itchio" and exits cleanly
- Unknown game — prints "Game not found: X. Run `publisher.py list` to see options"
- Butler not found — prints install instructions and exits cleanly

> ⚠️ RULE: `publisher.py` does not implement deployment logic directly.
> It delegates to target modules only. Keep it thin.

---

## §3 Test Anchors

File: `tests/test_itchio.py`

| Test | Behaviour |
|---|---|
| `test_load_game_config_valid` | Returns correct dict for known game name |
| `test_load_game_config_invalid` | Raises KeyError for unknown game name |
| `test_check_butler_missing` | Returns False when butler not on PATH (mock subprocess) |
| `test_push_dry_run` | Dry run prints correct butler command, does not execute |
| `test_list_games` | CLI list command prints all game names from games.yaml |

**Target: 5 passing, 0 failing, 0 skipped.**

All tests mock subprocess calls. No real Butler execution during tests.
No network calls during tests.

---

## §4 README.md

Include these sections:

```markdown
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
```

---

## §5 Completion Criteria

Phase 1 is complete when ALL of the following are true:

- [ ] Repo structure matches §1 exactly
- [ ] `python publisher.py list` prints configured games
- [ ] `python publisher.py deploy antsim --target itchio --dry-run` prints correct butler command
- [ ] `python publisher.py deploy unknown --target itchio` exits cleanly with helpful message
- [ ] `python publisher.py deploy antsim --target unknown` exits cleanly with helpful message
- [ ] 5 passing, 0 failing, 0 skipped
- [ ] .env not committed — .gitignore verified
- [ ] .env.example committed with empty values
- [ ] README covers setup and usage clearly

---

## §6 Quick Reference

| Fact | Value |
|---|---|
| Repo name | RFD_IT_Publishing |
| Visibility | Private |
| Phase 1 target | itch.io via Butler |
| Test floor | 5/0/0 |
| Secrets handling | Butler local auth — no .env needed for itch.io |
| Entry point | publisher.py |
| Game registry | config/games.yaml |
| Next phase | Phase 2 — PyPI via Twine |

---

*RFD_IT_Publishing Phase 1 | May 2026 | RFD IT Services Ltd.*
*Private repo. Secrets never committed. Butler handles itch.io auth natively.*
