from __future__ import annotations

import json
import subprocess
from pathlib import Path

import pytest

from studio.executor import Executor

ROOT = Path(__file__).parent.parent
LOGIC = (ROOT / "games" / "slimegarden" / "logic.lua").read_text(encoding="utf-8")
TS_ROOT = ROOT / "ts"
TS_LOGIC = ROOT / "intake" / "slimegarden" / "extracted" / "src" / "gameLogic.ts"

NODE_RUNNER = r"""
const fs = require('fs');
const ts = require('typescript');
const payload = JSON.parse(process.argv[1]);
const source = fs.readFileSync(payload.source, 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const mod = { exports: {} };
new Function('exports', 'module', 'require', output)(mod.exports, mod, require);
let index = 0;
Math.random = () => {
  if (index >= payload.random_values.length) throw new Error('Random stream exhausted');
  return payload.random_values[index++];
};
Date.now = () => payload.now;
console.log(JSON.stringify(mod.exports[payload.function_name](...payload.args)));
"""


def ts_call(function_name: str, *args: object, random_values: list[float] | None = None) -> object:
    payload = {
        "source": str(TS_LOGIC),
        "function_name": function_name,
        "args": args,
        "random_values": random_values or [],
        "now": 1_700_000_000_000,
    }
    result = subprocess.run(
        ["node", "-e", NODE_RUNNER, json.dumps(payload)],
        cwd=TS_ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def lua_executor(random_values: list[float]) -> Executor:
    values = ", ".join(str(value) for value in random_values)
    random_source = f"""
local random_values = {{{values}}}
local random_index = 1
math.random = function()
  local value = random_values[random_index]
  random_index = random_index + 1
  if value == nil then error('Random stream exhausted') end
  return value
end
"""
    return Executor(random_source + LOGIC)


@pytest.mark.parametrize(
    ("colors", "random_values"),
    [
        (("Red", "Blue"), []),
        (("Red", "Yellow"), []),
        (("Blue", "Yellow"), []),
        (("Green", "Orange"), [0.1]),
        (("Green", "Orange"), [0.5]),
        (("Green", "Orange"), [0.9]),
    ],
)
def test_breed_colors_matches_ts_for_known_pairs(colors: tuple[str, str], random_values: list[float]) -> None:
    expected = ts_call("breedColors", *colors, random_values=random_values)
    actual = lua_executor(random_values).call("breed_colors", *colors)
    assert actual == expected


@pytest.mark.parametrize(
    ("patterns", "random_values"),
    [
        (("Solid", "Solid"), [0.85]),
        (("Stripe", "Stripe"), [0.7]),
        (("Solid", "Stripe"), [0.95]),
        (("Glow", "Polka"), [0.8]),
        (("Crown", "Ringed"), [0.85]),
        (("Obsidian", "Nebula"), [0.95, 0.5]),
    ],
)
def test_breed_patterns_matches_ts_for_known_pairs(patterns: tuple[str, str], random_values: list[float]) -> None:
    expected = ts_call("breedPatterns", *patterns, random_values=random_values)
    actual = lua_executor(random_values).call("breed_patterns", *patterns)
    assert actual == expected


@pytest.mark.parametrize(
    "level",
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
)
def test_stage_from_level_matches_ts_at_boundaries(level: int) -> None:
    assert lua_executor([]).call("stage_from_level", level) == ts_call("stageFromLevel", level)


@pytest.mark.parametrize("stage", ["Hatchling", "Juvenile", "Young", "Prime", "Veteran", "Elder"])
def test_stage_modifier_matches_ts(stage: str) -> None:
    assert lua_executor([]).call("stage_modifier", stage) == ts_call("stageModifier", stage)


@pytest.mark.parametrize(
    "color,pattern,level",
    [
        ("Red", "Solid", 1),
        ("Blue", "Glow", 3),
        ("Yellow", "Stripe", 5),
        ("Purple", "Nebula", 7),
        ("Orange", "Crown", 9),
        ("Green", "Obsidian", 10),
        ("Gray", "Ringed", 12),
    ],
)
def test_calculate_stats_matches_ts(color: str, pattern: str, level: int) -> None:
    assert lua_executor([]).call("calculate_stats", color, pattern, level) == ts_call("calculateStats", color, pattern, level)


def test_breed_slimes_matches_ts_deterministic_stream() -> None:
    parent_a = {"id": "parent-a", "color": "Red", "pattern": "Solid"}
    parent_b = {"id": "parent-b", "color": "Blue", "pattern": "Stripe"}
    random_values = [0.3, 0.1, 0.2, 0.3]
    expected = ts_call("breedSlimes", parent_a, parent_b, 4, random_values=random_values)
    actual = lua_executor(random_values).call("breed_slimes", parent_a, parent_b, 4)

    assert actual["name"] == expected["name"]
    assert actual["color"] == expected["color"]
    assert actual["pattern"] == expected["pattern"]
    assert actual["level"] == expected["level"]
    assert actual["xp"] == expected["xp"]
    assert actual["stats"] == expected["stats"]
    assert actual["role"] == expected["role"]
    assert actual["generation"] == expected["generation"]
    assert actual["parent_a"] == expected["parentA"]
    assert actual["parent_b"] == expected["parentB"]
    assert actual["id"].startswith("slime_")
    assert isinstance(actual["created_at"], int)


@pytest.mark.parametrize(
    "args",
    [(), ("Green", "Obsidian")],
)
def test_create_seed_slime_matches_ts(args: tuple[str, ...]) -> None:
    random_values = [0.1, 0.2, 0.3]
    expected = ts_call("createSeedSlime", *args, random_values=random_values)
    actual = lua_executor(random_values).call("create_seed_slime", *args)

    assert actual["name"] == expected["name"]
    assert actual["color"] == expected["color"]
    assert actual["pattern"] == expected["pattern"]
    assert actual["level"] == expected["level"]
    assert actual["xp"] == expected["xp"]
    assert actual["stats"] == expected["stats"]
    assert actual["role"] == expected["role"]
    assert actual["generation"] == expected["generation"]
    assert actual["id"].startswith("slime_")
    assert isinstance(actual["created_at"], int)


@pytest.mark.parametrize("random_values", [[0.0, 0.0], [0.99, 0.99], [0.5, 0.5]])
def test_generate_slime_name_matches_ts_distribution(random_values: list[float]) -> None:
    assert lua_executor(random_values).call("generate_slime_name") == ts_call(
        "generateSlimeName", random_values=random_values
    )
