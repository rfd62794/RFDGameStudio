# RFDGameStudio — Project State

*Last updated: June 2026*

## Current Phase

**Phase 1 — Python Runtime Core — CERTIFIED**

## Completion Criteria

| Criterion | Status |
|---|---|
| Repo exists at `C:\Github\RFDGameStudio` | ✅ |
| Directory tree matches §1 structure | ✅ |
| `pip install -r requirements.txt` succeeds | ✅ |
| `pytest` reports 15 passed, 0 failed, 0 skipped | ✅ |
| `from studio.runtime import load_game, call, get_schema` works | ✅ |
| `load_game("horse_racing")` returns GameSession | ✅ (via fixtures) |
| `call(session, "clamp", 5, 0, 10)` returns `5` | ✅ |
| `get_schema(session, "horse")` returns dict with `stats` key | ✅ |
| `docs/state/current.md` updated to certified state | ✅ |

## Known Bug (reported, not fixed — Phase 1 scope)

**`games/horse_racing/ui.yaml` line 168:** `history_item:` is a mapping key
at sequence-item indentation inside `history.content`, which is invalid YAML.
The parser raises `yaml.parser.ParserError` when loading the canonical file.

- **Affected:** `load_game("horse_racing")` without `games_dir` override
- **Workaround:** All tests and manual proofs use `games_dir=Path("tests/fixtures")`
  where the fixture copy has the indentation corrected.
- **Fix target:** Phase 2 — correct `games/horse_racing/ui.yaml` canonical file.

## Proof Output

```
pytest tests/ -v
15 passed in 0.19s

load_game: GameSession | game_id: horse_racing
call clamp(5,0,10): 5
stats in schema: True
schema keys: ['id', 'name', 'gender', 'generation', 'stats', 'colors',
              'career', 'cooldown_until', 'player_owned', 'parents', 'price']
```

## Directory Structure

```
RFDGameStudio/
  games/horse_racing/        — canonical game files (read-only after Phase 1)
    data.yaml
    ui.yaml                  — BUG: YAML parse error at line 168 (see above)
    logic.lua
  studio/
    __init__.py
    loader.py
    validator.py
    executor.py
    runtime.py
  tests/
    __init__.py
    fixtures/horse_racing/   — fixture copies used by all tests
      data.yaml
      ui.yaml                — fixture copy has parse error corrected
      logic.lua
    test_loader.py           — tests 1–7
    test_executor.py         — tests 8–12
    test_runtime.py          — tests 13–15
  docs/adr/ADR-001…ADR-005
  docs/state/current.md
  requirements.txt
  README.md
```

## Phase Roadmap

| Phase | Title | Status |
|---|---|---|
| **1** | Python Runtime Core | ✅ **CERTIFIED** |
| 2 | TypeScript Runtime | Pending |
| 3 | Claude Tool Integration | Pending |
| 4 | Second Game | Pending |
| 5 | Rust Runtime | Pending |
