"""test_executor.py — Tests for studio.executor"""

import pytest

try:
    import lupa  # noqa: F401
    _LUPA = True
except ImportError:
    _LUPA = False

lupa_required = pytest.mark.skipif(not _LUPA, reason="lupa not installed")

if _LUPA:
    from studio.executor import ExecutorError, LuaExecutor, lua_to_python


@lupa_required
class TestLuaExecutor:
    def test_call_returns_scalar(self) -> None:
        ex = LuaExecutor("function answer() return 42 end")
        ex.seed_rng(1)
        assert ex.call("answer") == 42

    def test_call_with_args(self) -> None:
        ex = LuaExecutor("function add(a, b) return a + b end")
        ex.seed_rng(1)
        assert ex.call("add", 3, 4) == 7

    def test_call_unknown_fn_raises(self) -> None:
        ex = LuaExecutor("function noop() end")
        ex.seed_rng(1)
        with pytest.raises(ExecutorError, match="not found"):
            ex.call("does_not_exist")

    def test_call_lua_error_raises(self) -> None:
        ex = LuaExecutor("function bad() error('boom') end")
        ex.seed_rng(1)
        with pytest.raises(ExecutorError):
            ex.call("bad")

    def test_seed_rng_deterministic(self) -> None:
        """Same seed -> same sequence of math.random() calls."""
        ex1 = LuaExecutor("function r() return math.random() end")
        ex2 = LuaExecutor("function r() return math.random() end")
        ex1.seed_rng(99)
        ex2.seed_rng(99)
        results1 = [ex1.call("r") for _ in range(5)]
        results2 = [ex2.call("r") for _ in range(5)]
        assert results1 == results2

    def test_seed_rng_different_seeds_differ(self) -> None:
        ex1 = LuaExecutor("function r() return math.random(1, 1000) end")
        ex2 = LuaExecutor("function r() return math.random(1, 1000) end")
        ex1.seed_rng(1)
        ex2.seed_rng(2)
        results1 = [ex1.call("r") for _ in range(10)]
        results2 = [ex2.call("r") for _ in range(10)]
        assert results1 != results2

    def test_auto_seeds_if_not_seeded(self) -> None:
        """Calling without seed_rng should still work (auto-seeds)."""
        ex = LuaExecutor("function r() return math.random(1, 100) end")
        val = ex.call("r")
        assert 1 <= val <= 100

    def test_eval(self) -> None:
        ex = LuaExecutor("")
        ex.seed_rng(1)
        assert ex.eval("1 + 1") == 2


@lupa_required
class TestLuaToPython:
    def test_scalar_passthrough(self) -> None:
        assert lua_to_python(42) == 42
        assert lua_to_python("hello") == "hello"
        assert lua_to_python(3.14) == pytest.approx(3.14)

    def test_lua_array_becomes_list(self) -> None:
        ex = LuaExecutor("function arr() return {10, 20, 30} end")
        ex.seed_rng(1)
        result = lua_to_python(ex.call("arr"))
        assert result == [10, 20, 30]

    def test_lua_dict_becomes_dict(self) -> None:
        ex = LuaExecutor("function d() return {a = 1, b = 2} end")
        ex.seed_rng(1)
        result = lua_to_python(ex.call("d"))
        assert isinstance(result, dict)
        assert result["a"] == 1
        assert result["b"] == 2

    def test_nested_table(self) -> None:
        src = "function nested() return {inner = {1, 2, 3}} end"
        ex = LuaExecutor(src)
        ex.seed_rng(1)
        result = lua_to_python(ex.call("nested"))
        assert result == {"inner": [1, 2, 3]}
