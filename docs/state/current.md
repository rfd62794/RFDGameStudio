# RFDGameStudio — Project State

*Last updated: June 2026*

## Current Phase

**Phase 1 — Python Runtime Core**

## Status

| Item | Status |
|---|---|
| Three-file format defined | ✅ Done |
| `horse_racing` game files (data/ui/logic) | ✅ Done |
| `studio/loader.py` | ✅ Done |
| `studio/validator.py` | ✅ Done |
| `studio/executor.py` | ✅ Done |
| `studio/runtime.py` | ✅ Done |
| `tests/test_loader.py` | ✅ Done |
| `tests/test_executor.py` | ✅ Done |
| `tests/test_runtime.py` | ✅ Done |
| ADR-001 through ADR-005 | ✅ Done |
| Test floor (15/0/0) passing | 🔲 Pending — run `pytest` |
| `horse_racing` headless simulation verified | 🔲 Pending |

## Next Steps

1. Install dependencies: `pip install lupa pyyaml pytest`
2. Run `pytest tests/` and confirm floor passes
3. Begin Phase 2 planning (TypeScript runtime / fengari bridge)

## Phase Roadmap Snapshot

| Phase | Title | Target |
|---|---|---|
| **1** | Python Runtime Core | **In Progress** |
| 2 | TypeScript Runtime | Pending |
| 3 | Claude Tool Integration | Pending |
| 4 | Second Game | Pending |
| 5 | Rust Runtime | Pending |

## Test Floor

Phase 1 floor: **15 passing / 0 failing / 0 errors**
(All `lupa`-gated tests are skipped if `lupa` is not installed — this is by design
for CI environments without native Lua bindings.)
