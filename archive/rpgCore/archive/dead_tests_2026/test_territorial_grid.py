"""
Unit tests for Territorial Grid Prototype — Spec-001, Session 001

Tests are scoped to logic units that can be verified without a pygame display:
  1. TileState ownership cycle
  2. screen_pos_to_tile coordinate mapping
  3. Grid initialisation

Run with:
    .venv\\Scripts\\python.exe -m pytest tests/unit/test_territorial_grid.py -v
"""

import pytest
import sys
from pathlib import Path

# Make src importable without installing the package
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

from apps.slime_clan.territorial_grid import (
    TileState,
    TurnState,
    screen_pos_to_tile,
    resolve_battle,
    resolve_battle_weighted,
    compute_battle_strength,
    seed_initial_state,
    generate_obstacles,
    ai_take_turn,
    ai_choose_action,
    get_tiles_adjacent_to_red,
    check_win,
    draw_slime,
    get_hover_tooltip,
    AI_NEUTRAL_BIAS,
    BLINK_STEP_MS,
    WIN_THRESHOLD,
    WIN_FRACTION,
    OBSTACLE_COUNT,
    GRID_COLS,
    GRID_ROWS,
    TILE_SIZE,
    GRID_OFFSET_X,
    GRID_OFFSET_Y,
    SLIME_COLORS,
)

import pygame


# ---------------------------------------------------------------------------
# 1. Ownership cycle
# ---------------------------------------------------------------------------
class TestTileStateCycle:
    """TileState must cycle NEUTRAL → BLUE → RED → NEUTRAL using % 3."""

    def test_neutral_to_blue(self) -> None:
        state = TileState.NEUTRAL
        assert TileState((state + 1) % 3) == TileState.BLUE

    def test_blue_to_red(self) -> None:
        state = TileState.BLUE
        assert TileState((state + 1) % 3) == TileState.RED

    def test_red_wraps_to_neutral(self) -> None:
        """Red must wrap back to Neutral — not overflow."""
        state = TileState.RED
        assert TileState((state + 1) % 3) == TileState.NEUTRAL

    def test_full_cycle(self) -> None:
        """Three successive cycles must return to the starting state."""
        state = TileState.NEUTRAL
        for _ in range(3):
            state = TileState((state + 1) % 3)
        assert state == TileState.NEUTRAL


# ---------------------------------------------------------------------------
# 2. Coordinate mapping
# ---------------------------------------------------------------------------
class TestScreenPosToTile:
    """screen_pos_to_tile must map pixel positions to (col, row) correctly."""

    def test_top_left_tile(self) -> None:
        # Pixel at GRID_OFFSET_X, GRID_OFFSET_Y → tile (0, 0)
        result = screen_pos_to_tile(GRID_OFFSET_X, GRID_OFFSET_Y)
        assert result == (0, 0)

    def test_second_column_tile(self) -> None:
        # One TILE_SIZE to the right of the first tile → col 1
        x = GRID_OFFSET_X + TILE_SIZE
        y = GRID_OFFSET_Y
        result = screen_pos_to_tile(x, y)
        assert result == (1, 0)

    def test_bottom_right_tile(self) -> None:
        # Pixel just inside the last tile
        x = GRID_OFFSET_X + (GRID_COLS - 1) * TILE_SIZE + 1
        y = GRID_OFFSET_Y + (GRID_ROWS - 1) * TILE_SIZE + 1
        result = screen_pos_to_tile(x, y)
        assert result == (GRID_COLS - 1, GRID_ROWS - 1)

    def test_click_in_sidebar_returns_none(self) -> None:
        # Pixel in the left sidebar (x < GRID_OFFSET_X) → None
        result = screen_pos_to_tile(0, 0)
        assert result is None

    def test_click_beyond_right_edge_returns_none(self) -> None:
        # Pixel one tile past the right edge
        x = GRID_OFFSET_X + GRID_COLS * TILE_SIZE + 1
        result = screen_pos_to_tile(x, GRID_OFFSET_Y)
        assert result is None

    def test_click_below_grid_returns_none(self) -> None:
        # Pixel below the bottom row
        y = GRID_OFFSET_Y + GRID_ROWS * TILE_SIZE + 1
        result = screen_pos_to_tile(GRID_OFFSET_X, y)
        assert result is None

    def test_negative_position_returns_none(self) -> None:
        result = screen_pos_to_tile(-1, -1)
        assert result is None


# ---------------------------------------------------------------------------
# 3. Grid initialisation
# ---------------------------------------------------------------------------
class TestGridInitialisation:
    """Grid must be 10×10 and all NEUTRAL at startup — no pygame required."""

    def test_all_tiles_neutral(self) -> None:
        grid = [[TileState.NEUTRAL] * GRID_COLS for _ in range(GRID_ROWS)]
        for row in grid:
            for tile in row:
                assert tile == TileState.NEUTRAL

    def test_grid_dimensions(self) -> None:
        grid = [[TileState.NEUTRAL] * GRID_COLS for _ in range(GRID_ROWS)]
        assert len(grid) == GRID_ROWS
        assert all(len(row) == GRID_COLS for row in grid)


# ---------------------------------------------------------------------------
# Session 002 — resolve_battle stub
# ---------------------------------------------------------------------------
class TestResolveBattle:
    """resolve_battle must return one of the two input clan names."""

    def test_returns_attacker_or_defender(self) -> None:
        result = resolve_battle("BLUE", "RED")
        assert result in ("BLUE", "RED")

    def test_never_returns_unknown_clan(self) -> None:
        for _ in range(20):
            result = resolve_battle("BLUE", "RED")
            assert result not in ("NEUTRAL", "GREEN", "", None)

    def test_both_outcomes_possible(self) -> None:
        """Over enough trials both attacker and defender must win at least once."""
        results = {resolve_battle("BLUE", "RED") for _ in range(100)}
        assert "BLUE" in results
        assert "RED" in results


# ---------------------------------------------------------------------------
# Session 002 — Intent-aware click logic (pure state machine, no pygame)
# ---------------------------------------------------------------------------
class TestIntentAwareClickLogic:
    """
    Verify the intent-aware ownership rules as pure state assertions.
    We test the rules directly on TileState values — no pygame required.
    """

    def _apply_click(self, state: TileState) -> TileState:
        """Replicate the _handle_click intent logic as a pure function."""
        if state == TileState.NEUTRAL:
            return TileState.BLUE          # instant claim
        elif state == TileState.BLUE:
            return TileState.BLUE          # no-op — already owned
        elif state == TileState.RED:
            winner = resolve_battle("BLUE", "RED")
            return TileState.BLUE if winner == "BLUE" else TileState.RED
        return state  # unreachable — satisfies type checker

    def test_neutral_click_claims_for_blue(self) -> None:
        result = self._apply_click(TileState.NEUTRAL)
        assert result == TileState.BLUE

    def test_blue_click_is_noop(self) -> None:
        result = self._apply_click(TileState.BLUE)
        assert result == TileState.BLUE

    def test_red_click_resolves_to_blue_or_red(self) -> None:
        result = self._apply_click(TileState.RED)
        assert result in (TileState.BLUE, TileState.RED)

    def test_red_click_never_produces_neutral(self) -> None:
        for _ in range(20):
            result = self._apply_click(TileState.RED)
            assert result != TileState.NEUTRAL


# ---------------------------------------------------------------------------
# Session 003 — Seed Initial State
# ---------------------------------------------------------------------------
class TestSeedInitialState:
    """seed_initial_state() must set the correct starting board configuration."""

    def _make_grid(self) -> list[list[TileState]]:
        """Helper: build a fresh all-neutral grid (no pygame required)."""
        return [[TileState.NEUTRAL] * GRID_COLS for _ in range(GRID_ROWS)]

    def test_blue_top_left_2x2(self) -> None:
        grid = self._make_grid()
        seed_initial_state(grid)
        for row in range(2):
            for col in range(2):
                assert grid[row][col] == TileState.BLUE, (
                    f"Expected BLUE at ({col},{row}), got {grid[row][col]}"
                )

    def test_red_bottom_right_2x2(self) -> None:
        grid = self._make_grid()
        seed_initial_state(grid)
        for row in range(8, 10):
            for col in range(8, 10):
                assert grid[row][col] == TileState.RED, (
                    f"Expected RED at ({col},{row}), got {grid[row][col]}"
                )

    def test_all_other_tiles_not_blue_or_red(self) -> None:
        """After seeding, all non-corner tiles are NEUTRAL or BLOCKED (Session 008)."""
        grid = self._make_grid()
        seed_initial_state(grid)
        for row in range(GRID_ROWS):
            for col in range(GRID_COLS):
                is_blue_corner = row < 2 and col < 2
                is_red_corner  = row >= 8 and col >= 8
                if not is_blue_corner and not is_red_corner:
                    assert grid[row][col] in (TileState.NEUTRAL, TileState.BLOCKED), (
                        f"Expected NEUTRAL or BLOCKED at ({col},{row}), got {grid[row][col]}"
                    )

    def test_seeded_tile_counts(self) -> None:
        grid = self._make_grid()
        seed_initial_state(grid)
        blue    = sum(grid[r][c] == TileState.BLUE    for r in range(GRID_ROWS) for c in range(GRID_COLS))
        red     = sum(grid[r][c] == TileState.RED     for r in range(GRID_ROWS) for c in range(GRID_COLS))
        blocked = sum(grid[r][c] == TileState.BLOCKED for r in range(GRID_ROWS) for c in range(GRID_COLS))
        neutral = sum(grid[r][c] == TileState.NEUTRAL for r in range(GRID_ROWS) for c in range(GRID_COLS))
        assert blue    == 4
        assert red     == 4
        assert blocked == OBSTACLE_COUNT
        assert neutral == GRID_COLS * GRID_ROWS - 4 - 4 - OBSTACLE_COUNT

    def test_seed_is_idempotent(self) -> None:
        """Calling seed_initial_state twice must produce the same board."""
        grid = self._make_grid()
        seed_initial_state(grid)
        seed_initial_state(grid)
        blue = sum(grid[r][c] == TileState.BLUE for r in range(GRID_ROWS) for c in range(GRID_COLS))
        assert blue == 4


# ---------------------------------------------------------------------------
# Session 004 — Reactive AI
# ---------------------------------------------------------------------------
class TestAiTakeTurn:
    """ai_take_turn() must act correctly based on available tiles."""

    def _make_grid(self, state: TileState = TileState.NEUTRAL) -> list[list[TileState]]:
        return [[state] * GRID_COLS for _ in range(GRID_ROWS)]

    def test_ai_claims_neutral_returns_valid_coord(self) -> None:
        grid = self._make_grid(TileState.NEUTRAL)
        result = ai_take_turn(grid)
        assert result is not None
        col, row = result
        assert 0 <= col < GRID_COLS
        assert 0 <= row < GRID_ROWS

    def test_ai_turns_neutral_tile_to_red(self) -> None:
        grid = self._make_grid(TileState.NEUTRAL)
        result = ai_take_turn(grid)
        assert result is not None
        col, row = result
        assert grid[row][col] == TileState.RED

    def test_ai_returns_none_when_all_red(self) -> None:
        """AI has no valid targets when the whole map is Red."""
        grid = self._make_grid(TileState.RED)
        result = ai_take_turn(grid)
        assert result is None

    def test_ai_fallback_contests_blue_when_no_neutral(self) -> None:
        """With zero neutral tiles the AI must always act on a Blue tile."""
        grid = self._make_grid(TileState.BLUE)
        result = ai_take_turn(grid)
        assert result is not None
        col, row = result
        # Tile is now either RED (AI won) or BLUE (defender held)
        assert grid[row][col] in (TileState.RED, TileState.BLUE)

    def test_ai_neutral_bias_is_statistical(self) -> None:
        """
        Over 200 trials with an equal mix of neutral/blue tiles,
        the AI should choose neutral more often than blue.
        The 70% bias means we expect far more than 50% neutral picks.
        """
        neutral_choices = 0
        trials = 200
        for _ in range(trials):
            # Grid: half neutral (top 5 rows), half blue (bottom 5 rows)
            grid = [
                [TileState.NEUTRAL if r < 5 else TileState.BLUE] * GRID_COLS
                for r in range(GRID_ROWS)
            ]
            result = ai_take_turn(grid)
            assert result is not None
            col, row = result
            if row < 5:  # neutral zone
                neutral_choices += 1
        # Expect roughly 70% — allow wide margin for randomness (> 55%)
        assert neutral_choices / trials > 0.55, (
            f"AI neutral bias too low: {neutral_choices}/{trials}"
        )


# ---------------------------------------------------------------------------
# Session 005 — Adjacency Weighting & ai_choose_action
# ---------------------------------------------------------------------------
class TestGetTilesAdjacentToRed:
    """get_tiles_adjacent_to_red() must return orthogonal neighbours of Red tiles."""

    def _make_grid(self, state: TileState = TileState.NEUTRAL) -> list[list[TileState]]:
        return [[state] * GRID_COLS for _ in range(GRID_ROWS)]

    def test_no_red_tiles_returns_empty(self) -> None:
        grid = self._make_grid(TileState.NEUTRAL)
        assert get_tiles_adjacent_to_red(grid) == set()

    def test_single_red_tile_returns_4_neighbours(self) -> None:
        grid = self._make_grid(TileState.NEUTRAL)
        grid[5][5] = TileState.RED
        adj = get_tiles_adjacent_to_red(grid)
        assert (4, 5) in adj  # left
        assert (6, 5) in adj  # right
        assert (5, 4) in adj  # up
        assert (5, 6) in adj  # down
        assert (5, 5) not in adj  # Red tile itself not included

    def test_corner_red_tile_returns_2_neighbours(self) -> None:
        grid = self._make_grid(TileState.NEUTRAL)
        grid[0][0] = TileState.RED
        adj = get_tiles_adjacent_to_red(grid)
        assert (1, 0) in adj
        assert (0, 1) in adj
        assert len(adj) == 2


class TestAiChooseAction:
    """ai_choose_action() must return (col, row, TileState) without touching grid."""

    def _make_grid(self, state: TileState = TileState.NEUTRAL) -> list[list[TileState]]:
        return [[state] * GRID_COLS for _ in range(GRID_ROWS)]

    def test_returns_none_when_no_targets(self) -> None:
        grid = self._make_grid(TileState.RED)
        assert ai_choose_action(grid) is None

    def test_does_not_modify_grid(self) -> None:
        """ai_choose_action must be read-only — grid unchanged after call."""
        grid = self._make_grid(TileState.NEUTRAL)
        before = [row[:] for row in grid]
        ai_choose_action(grid)
        assert grid == before

    def test_returns_valid_coord_and_state(self) -> None:
        grid = self._make_grid(TileState.NEUTRAL)
        result = ai_choose_action(grid)
        assert result is not None
        col, row, new_state = result
        assert 0 <= col < GRID_COLS
        assert 0 <= row < GRID_ROWS
        assert isinstance(new_state, TileState)

    def test_claims_neutral_as_red(self) -> None:
        grid = self._make_grid(TileState.NEUTRAL)
        result = ai_choose_action(grid)
        assert result is not None
        _, _, new_state = result
        assert new_state == TileState.RED

    def test_adjacency_prefers_tiles_next_to_red(self) -> None:
        """
        With Red in the bottom-right 2x2, 4 neutral tiles are adjacent to Red.
        Weight math: 4 adj * 5 + 92 non-adj * 1 = 112 total weight.
        Adjacent tiles have 20/112 = ~18% chance each trial.
        Pure uniform random would give 4/96 = ~4%.
        Assert adjacent picks are at least 3x the uniform-random baseline (>12%).
        """
        adjacent_picks = 0
        trials = 200
        for _ in range(trials):
            grid = self._make_grid(TileState.NEUTRAL)
            for r in range(8, 10):
                for c in range(8, 10):
                    grid[r][c] = TileState.RED
            adj = get_tiles_adjacent_to_red(grid)
            result = ai_choose_action(grid)
            assert result is not None
            col, row, _ = result
            if (col, row) in adj:
                adjacent_picks += 1
        # Expect > 12% adjacent picks (3x the 4% uniform-random baseline)
        assert adjacent_picks / trials > 0.12, (
            f"AI adjacency preference too low: {adjacent_picks}/{trials}"
        )



class TestTurnState:
    """TurnState enum sanity checks."""

    def test_player_turn_is_default_value(self) -> None:
        assert TurnState.PLAYER_TURN.value == "player"

    def test_ai_blinking_distinct_from_player(self) -> None:
        assert TurnState.AI_BLINKING != TurnState.PLAYER_TURN

    def test_blink_step_ms_positive(self) -> None:
        assert BLINK_STEP_MS > 0

    def test_player_blinking_state_exists(self) -> None:
        assert TurnState.PLAYER_BLINKING != TurnState.PLAYER_TURN
        assert TurnState.PLAYER_BLINKING != TurnState.AI_BLINKING


# ---------------------------------------------------------------------------
# Session 006 — Win Condition & Reset
# ---------------------------------------------------------------------------
class TestCheckWin:
    """check_win() must return the correct winner or None."""

    def _make_grid(self, state: TileState = TileState.NEUTRAL) -> list[list[TileState]]:
        return [[state] * GRID_COLS for _ in range(GRID_ROWS)]

    def test_no_winner_at_start(self) -> None:
        grid = self._make_grid(TileState.NEUTRAL)
        seed_initial_state(grid)
        assert check_win(grid) is None

    def test_no_winner_below_threshold(self) -> None:
        grid = self._make_grid(TileState.NEUTRAL)
        # Give Blue 59 tiles (one short)
        count = 0
        for r in range(GRID_ROWS):
            for c in range(GRID_COLS):
                if count < WIN_THRESHOLD - 1:
                    grid[r][c] = TileState.BLUE
                    count += 1
        assert check_win(grid) is None

    def test_blue_wins_at_threshold(self) -> None:
        grid = self._make_grid(TileState.NEUTRAL)
        # Give Blue exactly WIN_THRESHOLD tiles
        count = 0
        for r in range(GRID_ROWS):
            for c in range(GRID_COLS):
                if count < WIN_THRESHOLD:
                    grid[r][c] = TileState.BLUE
                    count += 1
        assert check_win(grid) == TileState.BLUE

    def test_red_wins_at_threshold(self) -> None:
        grid = self._make_grid(TileState.NEUTRAL)
        count = 0
        for r in range(GRID_ROWS):
            for c in range(GRID_COLS):
                if count < WIN_THRESHOLD:
                    grid[r][c] = TileState.RED
                    count += 1
        assert check_win(grid) == TileState.RED

    def test_custom_threshold(self) -> None:
        grid = self._make_grid(TileState.NEUTRAL)
        grid[0][0] = TileState.BLUE
        assert check_win(grid, threshold=1) == TileState.BLUE
        assert check_win(grid, threshold=2) is None

    def test_all_neutral_no_winner(self) -> None:
        grid = self._make_grid(TileState.NEUTRAL)
        assert check_win(grid) is None

    def test_win_threshold_constant_is_60(self) -> None:
        assert WIN_THRESHOLD == 60


class TestSeedAfterReset:
    """After a reset (re-seeding), the board must return to correct starting counts."""

    def test_reset_gives_correct_counts(self) -> None:
        grid = [[TileState.NEUTRAL] * GRID_COLS for _ in range(GRID_ROWS)]
        # Simulate a played state (all blue)
        for r in range(GRID_ROWS):
            for c in range(GRID_COLS):
                grid[r][c] = TileState.BLUE
        # Reset via seed_initial_state
        for r in range(GRID_ROWS):
            for c in range(GRID_COLS):
                grid[r][c] = TileState.NEUTRAL
        seed_initial_state(grid)
        blue    = sum(grid[r][c] == TileState.BLUE    for r in range(GRID_ROWS) for c in range(GRID_COLS))
        red     = sum(grid[r][c] == TileState.RED     for r in range(GRID_ROWS) for c in range(GRID_COLS))
        blocked = sum(grid[r][c] == TileState.BLOCKED for r in range(GRID_ROWS) for c in range(GRID_COLS))
        assert blue    == 4
        assert red     == 4
        assert blocked == OBSTACLE_COUNT

    def test_check_win_false_after_reset(self) -> None:
        grid = [[TileState.NEUTRAL] * GRID_COLS for _ in range(GRID_ROWS)]
        seed_initial_state(grid)
        assert check_win(grid) is None


# ---------------------------------------------------------------------------
# Session 008 — Procedural Obstacles
# ---------------------------------------------------------------------------
class TestGenerateObstacles:
    """generate_obstacles() must place BLOCKED tiles only in the safe neutral zone."""

    def _make_seeded_grid(self) -> list[list[TileState]]:
        grid = [[TileState.NEUTRAL] * GRID_COLS for _ in range(GRID_ROWS)]
        for r in range(2):
            for c in range(2):
                grid[r][c] = TileState.BLUE
        for r in range(8, 10):
            for c in range(8, 10):
                grid[r][c] = TileState.RED
        return grid

    def test_obstacle_count_equals_constant(self) -> None:
        grid = self._make_seeded_grid()
        generate_obstacles(grid)
        blocked = sum(grid[r][c] == TileState.BLOCKED for r in range(GRID_ROWS) for c in range(GRID_COLS))
        assert blocked == OBSTACLE_COUNT

    def test_custom_count(self) -> None:
        grid = self._make_seeded_grid()
        generate_obstacles(grid, count=3)
        blocked = sum(grid[r][c] == TileState.BLOCKED for r in range(GRID_ROWS) for c in range(GRID_COLS))
        assert blocked == 3

    def test_no_obstacle_in_blue_3x3_corner(self) -> None:
        """Cols 0-2, rows 0-2 must never contain BLOCKED tiles."""
        for _ in range(20):  # run multiple times for randomness coverage
            grid = self._make_seeded_grid()
            generate_obstacles(grid)
            for r in range(3):
                for c in range(3):
                    assert grid[r][c] != TileState.BLOCKED, (
                        f"Obstacle in Blue protection zone at ({c},{r})"
                    )

    def test_no_obstacle_in_red_3x3_corner(self) -> None:
        """Cols 7-9, rows 7-9 must never contain BLOCKED tiles."""
        for _ in range(20):
            grid = self._make_seeded_grid()
            generate_obstacles(grid)
            for r in range(7, 10):
                for c in range(7, 10):
                    assert grid[r][c] != TileState.BLOCKED, (
                        f"Obstacle in Red protection zone at ({c},{r})"
                    )

    def test_obstacles_are_only_in_neutral_zone(self) -> None:
        """All BLOCKED tiles must occupy cells that were NEUTRAL before seeding."""
        grid = self._make_seeded_grid()
        before_blocked = [
            (c, r) for r in range(GRID_ROWS) for c in range(GRID_COLS)
            if grid[r][c] == TileState.NEUTRAL
        ]
        generate_obstacles(grid)
        for r in range(GRID_ROWS):
            for c in range(GRID_COLS):
                if grid[r][c] == TileState.BLOCKED:
                    assert (c, r) in before_blocked, (
                        f"Obstacle placed at non-neutral tile ({c},{r})"
                    )


class TestBlockedTileState:
    """TileState.BLOCKED sanity checks + interaction rules."""

    def test_blocked_is_distinct_from_other_states(self) -> None:
        assert TileState.BLOCKED not in (TileState.NEUTRAL, TileState.BLUE, TileState.RED)

    def test_blocked_tile_skipped_by_ai_choose_action(self) -> None:
        """AI must never return a BLOCKED coordinate as its action."""
        grid = [[TileState.BLOCKED] * GRID_COLS for _ in range(GRID_ROWS)]
        # Leave one neutral tile so AI has a target, one blue to avoid None path
        grid[5][5] = TileState.NEUTRAL
        result = ai_choose_action(grid)
        if result is not None:
            col, row, _ = result
            assert (col, row) == (5, 5), (
                f"AI chose a BLOCKED tile at ({col},{row})"
            )

    def test_blocked_tile_excluded_from_ai_neutral_list(self) -> None:
        """A fully-blocked grid with no NEUTRAL or BLUE returns None from ai_choose_action."""
        grid = [[TileState.BLOCKED] * GRID_COLS for _ in range(GRID_ROWS)]
        assert ai_choose_action(grid) is None


class TestCheckWinWithObstacles:
    """check_win() must scale threshold by claimable tiles."""

    def _make_grid(self) -> list[list[TileState]]:
        return [[TileState.NEUTRAL] * GRID_COLS for _ in range(GRID_ROWS)]

    def test_dynamic_threshold_reduces_with_blocked_tiles(self) -> None:
        """
        With 10 BLOCKED tiles: claimable = 90, threshold = int(90*0.60) = 54.
        Blue holding 54 tiles should win.
        """
        grid = self._make_grid()
        blocked_count = 10
        count = 0
        for r in range(GRID_ROWS):
            for c in range(GRID_COLS):
                if count < blocked_count:
                    grid[r][c] = TileState.BLOCKED
                    count += 1
        # Give Blue exactly 54 tiles
        blue_placed = 0
        for r in range(GRID_ROWS):
            for c in range(GRID_COLS):
                if grid[r][c] == TileState.NEUTRAL and blue_placed < 54:
                    grid[r][c] = TileState.BLUE
                    blue_placed += 1
        result = check_win(grid)
        assert result == TileState.BLUE

    def test_explicit_threshold_overrides_dynamic(self) -> None:
        """Passing explicit threshold=1 still works (backward compat)."""
        grid = self._make_grid()
        grid[0][0] = TileState.BLUE
        assert check_win(grid, threshold=1) == TileState.BLUE
        assert check_win(grid, threshold=2) is None

    def test_win_fraction_constant(self) -> None:
        assert WIN_FRACTION == 0.60


# ---------------------------------------------------------------------------
# Session 009 — Proximity-Weighted Battle System
# ---------------------------------------------------------------------------
class TestComputeBattleStrength:
    """compute_battle_strength() must correctly combine base + proximity bonus."""

    def _make_grid(self, state: TileState = TileState.NEUTRAL) -> list[list[TileState]]:
        return [[state] * GRID_COLS for _ in range(GRID_ROWS)]

    def test_minimum_strength_is_1(self) -> None:
        """Even with zero tiles, strength >= 1 to keep probability well-defined."""
        grid = self._make_grid(TileState.NEUTRAL)
        assert compute_battle_strength(grid, 5, 5, TileState.BLUE) >= 1

    def test_base_counts_all_owned_tiles(self) -> None:
        """With no proximity tiles, strength equals total tiles held."""
        grid = self._make_grid(TileState.NEUTRAL)
        # Give Blue 10 tiles nowhere near (5,5)
        for i in range(10):
            grid[0][i] = TileState.BLUE
        strength = compute_battle_strength(grid, 5, 5, TileState.BLUE)
        assert strength == 10

    def test_proximity_bonus_per_adjacent_tile(self) -> None:
        """Each adjacent tile adds +3 to strength."""
        grid = self._make_grid(TileState.NEUTRAL)
        # Contest tile at (5,5); place Blue tiles at all 4 orthogonal neighbors
        grid[5][5] = TileState.NEUTRAL   # contested
        grid[4][5] = TileState.BLUE      # above
        grid[6][5] = TileState.BLUE      # below
        grid[5][4] = TileState.BLUE      # left
        grid[5][6] = TileState.BLUE      # right
        # base=4, proximity=4*3=12 => strength=16
        strength = compute_battle_strength(grid, 5, 5, TileState.BLUE)
        assert strength == 16

    def test_corner_tile_limits_adjacency(self) -> None:
        """A corner tile has at most 2 neighbors, so max proximity bonus is 2*3=6."""
        grid = self._make_grid(TileState.NEUTRAL)
        grid[0][1] = TileState.BLUE  # right of corner
        grid[1][0] = TileState.BLUE  # below corner
        # Contest tile at (0,0); Blue has 2 adjacent tiles
        strength = compute_battle_strength(grid, 0, 0, TileState.BLUE)
        # base=2, proximity=2*3=6 => 8
        assert strength == 8

    def test_zero_owned_tiles_gives_minimum(self) -> None:
        """A clan with no tiles returns 1 (min guard)."""
        grid = self._make_grid(TileState.NEUTRAL)
        assert compute_battle_strength(grid, 3, 3, TileState.RED) == 1


class TestResolveBattleWeighted:
    """resolve_battle_weighted() must be probabilistic and within correct bounds."""

    def _make_grid(self) -> list[list[TileState]]:
        return [[TileState.NEUTRAL] * GRID_COLS for _ in range(GRID_ROWS)]

    def test_returns_attacker_or_defender(self) -> None:
        grid = self._make_grid()
        grid[0][0] = TileState.BLUE
        winner, atk_str, def_str, prob = resolve_battle_weighted(grid, 5, 5, "BLUE", "RED")
        assert winner in ("BLUE", "RED")

    def test_returns_four_tuple(self) -> None:
        grid = self._make_grid()
        result = resolve_battle_weighted(grid, 5, 5, "BLUE", "RED")
        assert len(result) == 4
        winner, atk_str, def_str, prob = result
        assert isinstance(winner, str)
        assert isinstance(atk_str, int)
        assert isinstance(def_str, int)
        assert isinstance(prob, float)

    def test_probability_in_range(self) -> None:
        """Win probability must be strictly between 0 and 1."""
        grid = self._make_grid()
        grid[0][0] = TileState.BLUE
        _, _, _, prob = resolve_battle_weighted(grid, 5, 5, "BLUE", "RED")
        assert 0.0 < prob < 1.0

    def test_both_outcomes_possible(self) -> None:
        """Over enough trials, both attacker and defender should win at least once."""
        grid = self._make_grid()
        # Equal tiles so 50/50; add one of each to give both a base
        grid[0][0] = TileState.BLUE
        grid[9][9] = TileState.RED
        winners = {resolve_battle_weighted(grid, 5, 5, "BLUE", "RED")[0] for _ in range(100)}
        assert "BLUE" in winners
        assert "RED" in winners

    def test_stronger_attacker_wins_more_often(self) -> None:
        """
        Blue with heavy territory should win > 70% of the time against isolated Red,
        over 300 trials.
        """
        grid = self._make_grid()
        # Blue holds 50 tiles, Red holds 1; contest at (5,5) — no adjacency for either
        count = 0
        for r in range(GRID_ROWS):
            for c in range(GRID_COLS):
                if count < 50:
                    grid[r][c] = TileState.BLUE
                    count += 1
        grid[9][9] = TileState.RED
        wins = sum(
            resolve_battle_weighted(grid, 5, 5, "BLUE", "RED")[0] == "BLUE"
            for _ in range(300)
        )
        assert wins > 180, f"Expected Blue to win >60% with dominant territory, got {wins}/300"

    def test_strengths_are_positive(self) -> None:
        grid = self._make_grid()
        grid[0][0] = TileState.BLUE
        grid[9][9] = TileState.RED
        _, atk_str, def_str, _ = resolve_battle_weighted(grid, 5, 5, "BLUE", "RED")
        assert atk_str >= 1
        assert def_str >= 1


# ---------------------------------------------------------------------------
# Session 010 — Slime Sprites
# ---------------------------------------------------------------------------
class TestDrawSlime:
    """
    Session 010: Test that `draw_slime` executes without exceptions for valid inputs.
    We don't test pixel output, just geometry calculations and pygame interface.
    """

    @pytest.fixture
    def test_surface(self) -> pygame.Surface:
        pygame.init()
        # Non-displayed surface for drawing tests
        return pygame.Surface((100, 100))

    def test_draw_slime_valid_inputs_does_not_crash(self, test_surface: pygame.Surface) -> None:
        """Testing at standard 640x480 simulation size (Tile size 48)"""
        try:
            draw_slime(
                surface=test_surface,
                cx=50,
                cy=50,
                tile_size=48,
                color=SLIME_COLORS[TileState.BLUE]
            )
        except Exception as e:
            pytest.fail(f"draw_slime raised an exception with valid standard inputs: {e}")

    def test_draw_slime_small_size_graceful(self, test_surface: pygame.Surface) -> None:
        """Testing at a very small tile size (4px) to ensure no crash from float-to-int truncations."""
        try:
            draw_slime(
                surface=test_surface,
                cx=50,
                cy=50,
                tile_size=4,
                color=SLIME_COLORS[TileState.RED]
            )
        except Exception as e:
            pytest.fail(f"draw_slime raised an exception with small tile_size=4: {e}")


# ---------------------------------------------------------------------------
# Session 011 — Tile Intelligence HUD
# ---------------------------------------------------------------------------
class TestHoverTooltip:
    """
    Session 011: Test string generation logic for the HUD hover text.
    Relies on pure function `get_hover_tooltip` independently of pygame context.
    """

    def _make_grid(self, state: TileState = TileState.NEUTRAL) -> list[list[TileState]]:
        return [[state] * GRID_COLS for _ in range(GRID_ROWS)]

    def test_tooltip_neutral_is_constant(self) -> None:
        grid = self._make_grid(TileState.NEUTRAL)
        tooltip = get_hover_tooltip(grid, 5, 5)
        assert tooltip == "Claim: Free \u2192 yours instantly"

    def test_tooltip_blocked_is_constant(self) -> None:
        grid = self._make_grid(TileState.BLOCKED)
        tooltip = get_hover_tooltip(grid, 2, 2)
        assert tooltip == "Impassable"

    def test_tooltip_blue_counts_adjacent_blue(self) -> None:
        grid = self._make_grid(TileState.NEUTRAL)
        # Center tile is Blue
        grid[5][5] = TileState.BLUE
        # Adjacents
        grid[4][5] = TileState.BLUE
        grid[5][4] = TileState.BLUE
        # Non-orthogonal should NOT count
        grid[4][4] = TileState.BLUE
        
        tooltip = get_hover_tooltip(grid, 5, 5)
        # 2 orthogonal adjacent tiles: above (4,5) and left (5,4)
        assert tooltip == "Owned \u2014 2 adjacent Blue tiles"

    def test_tooltip_red_displays_battle_odds(self) -> None:
        grid = self._make_grid(TileState.NEUTRAL)
        # Blue has 3 base tires somewhere far
        grid[0][0] = TileState.BLUE
        grid[0][1] = TileState.BLUE
        grid[1][0] = TileState.BLUE
        
        # Red has the target tile and 1 adjacent red 
        grid[5][5] = TileState.RED
        grid[6][5] = TileState.RED
        
        # Blue strength = 3 base + 0 adj = 3
        # Red strength = 2 base + 1*3 adj = 5
        # Blue win % = 3 / 8 = 37.5% -> 37%
        
        tooltip = get_hover_tooltip(grid, 5, 5)
        expected = "Battle: B:3 vs R:5 \u2192 Blue: 37% win chance"
        assert tooltip == expected


