# Technical Debt

This document tracks known, accepted technical debt across the RPGCore repository. Items here are explicitly acknowledged to prevent them from blocking current feature development, but are slated for future resolution.

## 1. Pydantic V1 Deprecations
- **Location:** `src/dgt_engine` and `src/game_engine` config schemas and validators.
- **Issue:** Using Pydantic V1 style `@validator` and `Config` classes (e.g., `PydanticDeprecatedSince20` warnings).
- **Impact:** These will break when RPGCore migrates to Pydantic V3.
- **Resolution:** Migrate to Pydantic V2 style `@field_validator` and `ConfigDict`.

## 2. Test Suite Assert vs Return Warnings
- **Location:** Multiple test files (e.g., `test_sprint_d_orchestration.py`, `test_theater_mode.py`, `test_registry_snapshots.py`).
- **Issue:** `PytestReturnNotNoneWarning` generated because test functions are returning boolean values instead of asserting them.
- **Impact:** Clutters pytest output with warnings.
- **Resolution:** Change `return X` to `assert X` ensuring `None` is implicitly returned by the test methods.

## 3. Uncompiled Rust Extensions
- **Location:** `tests/test_rust_sprite_scanner.py`
- **Issue:** `rust_sprite_scanner` extension module is not compiled in standard python environments.
- **Impact:** The test is currently bypassed via `pytest.importorskip("rust_sprite_scanner")`. We are missing coverage on the Rust performance layer.
- **Resolution:** Implement a cross-platform compilation step for the `rust/` directory or pre-compiled binaries for the test suite runner.

## 4. Known UI Issues
- **Last Appointment — NumPad controls not working**: Only top-row number keys (1-5) respond. NumPad keys (KP_1 through KP_5) should be mapped identically. Fix in `appointment_scene.py` input handling.
- **Last Appointment — Response card text overflow**: Cards need a max character width with forced line breaks. Text that exceeds one line should wrap within the card bounds rather than overflow or truncate. Affects card height calculation in `card_layout.py`.

## 5. Code Quality Standards

These items represent patterns that are being phased out in favor of higher engineering standards.

- **`print()` statements in `src/`**: Legacy debugging output should be replaced with `loguru` or `Rich` consoles for structured and aesthetically consistent CLI output.
- **Pydantic V1 Validators**: `dgt_engine` and `game_engine` (donor archives) still use V1 syntax. New harvest work must migrate these to V2.
- **Incomplete Type Hinting**: Several older `shared/` modules lack full type coverage. New edits to these modules should include type enforcement.
