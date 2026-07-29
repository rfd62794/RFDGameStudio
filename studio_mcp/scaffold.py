"""scaffold.py — Stage 3 scaffolding tool (ADR-012).

Given a concept already in examples/{slug}/, creates the real target
skeleton — directory structure, config wrapper, registry entry, and
a standalone entry point using import.meta.glob (never hand-listed
.lua imports).

Never writes real game logic. Stage 4 (Convert) fills it by hand later.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from studio_mcp.intake import _game_id_from_slug


# ---------------------------------------------------------------------------
# recommend_target_type — inspect, never decide
# ---------------------------------------------------------------------------

def recommend_target_type(examples_dir: Path) -> dict:
    """Inspect examples/{slug}/src for real signals and return a recommendation.

    Returns: {"recommendation": "ts_native" | "lua_backed", "reason": str,
              "confidence": "high" | "low"}
    """
    src_dir = examples_dir / "src"
    has_tsx = False
    has_lua = False
    has_package_json = False
    has_react_dep = False

    if src_dir.is_dir():
        for p in src_dir.rglob("*"):
            if p.suffix == ".tsx":
                has_tsx = True
            if p.suffix == ".lua":
                has_lua = True

    pkg_json = examples_dir / "package.json"
    if pkg_json.exists():
        has_package_json = True
        try:
            import json
            data = json.loads(pkg_json.read_text(encoding="utf-8"))
            deps = {**(data.get("dependencies") or {}), **(data.get("devDependencies") or {})}
            if "react" in deps or "@vitejs/plugin-react" in deps:
                has_react_dep = True
        except Exception:
            pass

    # Check for .lua/.yaml already at the examples root (lua-backed signal)
    root_lua = list(examples_dir.glob("*.lua"))
    root_yaml = list(examples_dir.glob("*.yaml"))

    if has_tsx and has_react_dep:
        return {
            "recommendation": "ts_native",
            "reason": f"Found .tsx files in src/ and React in package.json dependencies",
            "confidence": "high",
        }

    if has_lua or root_lua or (root_yaml and not has_tsx):
        return {
            "recommendation": "lua_backed",
            "reason": f"Found .lua files ({len(root_lua)} at root, {sum(1 for _ in src_dir.rglob('*.lua')) if src_dir.is_dir() else 0} in src/) and no .tsx",
            "confidence": "high" if (root_lua and not has_tsx) else "low",
        }

    if has_tsx and not has_react_dep:
        return {
            "recommendation": "ts_native",
            "reason": "Found .tsx files in src/ but React not in package.json — ts_native likely but verify",
            "confidence": "low",
        }

    return {
        "recommendation": "ts_native",
        "reason": "No strong signals found — defaulting to ts_native (most common)",
        "confidence": "low",
    }


# ---------------------------------------------------------------------------
# Lua-backed scaffold
# ---------------------------------------------------------------------------

_LUA_LOGIC_STUB = """\
-- {game_id}/logic.lua — scaffolded stub (ADR-012 Stage 3)
-- Stage 4 (Convert) replaces this with real game logic.

function init_game(data)
    error("{game_id} not yet implemented — init_game is a stub")
end

function tick_game(state, dt, input)
    error("{game_id} not yet implemented — tick_game is a stub")
end
"""

_LUA_DATA_YAML = """\
# {game_id}/data.yaml — scaffolded stub (ADR-012 Stage 3)
game:
  id: {game_id}
  name: {label}
  version: "0.1.0"
  studio: RFDGameStudio
"""

_LUA_UI_YAML = """\
# {game_id}/ui.yaml — scaffolded stub (ADR-012 Stage 3)
game: {game_id}

layout_tree:
  direction: column
  children: []
"""

_LUA_SYSTEMS_YAML = """\
# {game_id}/systems.yaml — scaffolded stub (ADR-012 Stage 3)
engine_version: "1.0"

lua_files: []

systems: []

entities: []
"""


def _scaffold_lua_backed(repo_root: Path, game_id: str, label: str) -> dict:
    """Create games/{game_id}/ with minimal ADR-001-valid file set."""
    games_dir = repo_root / "games" / game_id
    if games_dir.exists():
        return {
            "error": f"games/{game_id}/ already exists",
            "tool": "studio_scaffold_game",
            "game_id": game_id,
        }

    games_dir.mkdir(parents=True)

    (games_dir / "data.yaml").write_text(
        _LUA_DATA_YAML.format(game_id=game_id, label=label), encoding="utf-8"
    )
    (games_dir / "ui.yaml").write_text(
        _LUA_UI_YAML.format(game_id=game_id), encoding="utf-8"
    )
    (games_dir / "systems.yaml").write_text(
        _LUA_SYSTEMS_YAML.format(game_id=game_id), encoding="utf-8"
    )
    (games_dir / "logic.lua").write_text(
        _LUA_LOGIC_STUB.format(game_id=game_id), encoding="utf-8"
    )
    (games_dir / "VERSION").write_text("0.1.0\n", encoding="utf-8")

    return {
        "game_id": game_id,
        "target_type": "lua_backed",
        "files_created": [
            str(games_dir / "data.yaml"),
            str(games_dir / "ui.yaml"),
            str(games_dir / "systems.yaml"),
            str(games_dir / "logic.lua"),
            str(games_dir / "VERSION"),
        ],
    }


# ---------------------------------------------------------------------------
# TS-native scaffold
# -------------------------------------------------------------------

_TS_APP_STUB = """\
import type {{ GameRendererProps }} from '../../engine/types';

export default function App({{ session: _session }}: GameRendererProps) {{
  return (
    <div style={{{{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}}}>
      <h1>{label}</h1>
      <p>Not yet converted — Stage 4 will replace this stub.</p>
    </div>
  );
}}
"""

_TS_CONFIG_STUB = """\
import React from 'react';
import type {{ GameConfig }} from '../../engine/types';

const config: GameConfig = {{
  gameId: '{game_id}',
  label: '{label}',
  description: '{description}',
  color: '#6c8ef7',
  status: 'dev',
  component: React.lazy(() => import('./App')),
}};

export default config;
"""

_TS_VITE_CONFIG = """\
import {{ makeStandaloneConfig }} from './vite.standalone.factory';

export default makeStandaloneConfig('{game_id}');
"""

_TS_ENTRY_TSX = """\
import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/{game_id}/App';
import {{ buildStandaloneSession }} from '../../engine/standaloneLoader';

import dataRaw from '../../../../games/{game_id}/data.yaml?raw';
import uiRaw from '../../../../games/{game_id}/ui.yaml?raw';
import systemsRaw from '../../../../games/{game_id}/systems.yaml?raw';

const luaModules = import.meta.glob('../../../../games/{game_id}/*.lua', {{
  query: '?raw',
  import: 'default',
  eager: true,
}}) as Record<string, string>;

function toGameLuaFiles(modules: Record<string, string>): Record<string, string> {{
  const out: Record<string, string> = {{}};
  for (const [path, content] of Object.entries(modules)) {{
    out[path.split('/').pop()!] = content;
  }}
  return out;
}}

const engineLuaModules = import.meta.glob('../../../../engine/primitives/*.lua', {{
  query: '?raw',
  import: 'default',
  eager: true,
}}) as Record<string, string>;

const engineSystemModules = import.meta.glob('../../../../engine/systems/*.lua', {{
  query: '?raw',
  import: 'default',
  eager: true,
}}) as Record<string, string>;

function toEngineLuaFiles(modules: Record<string, string>, subdir: string): Record<string, string> {{
  const out: Record<string, string> = {{}};
  for (const [path, content] of Object.entries(modules)) {{
    const fileName = path.split('/').pop()!;
    out[`${{subdir}}/${{fileName}}`] = content;
  }}
  return out;
}}

const gameId = '{game_id}';

const session = buildStandaloneSession({{
  gameId,
  dataRaw,
  uiRaw,
  systemsRaw,
  gameLuaFiles: toGameLuaFiles(luaModules),
  engineLuaFiles: {{
    ...toEngineLuaFiles(engineLuaModules, 'primitives'),
    ...toEngineLuaFiles(engineSystemModules, 'systems'),
  }},
}});

const rootEl = document.getElementById('root');
if (rootEl) {{
  ReactDOM.createRoot(rootEl).render(<App session={{session}} />);
}}
"""

_TS_INDEX_HTML = """\
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{label}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./entry.tsx"></script>
  </body>
</html>
"""


def _scaffold_ts_native(
    repo_root: Path,
    game_id: str,
    label: str,
    description: str,
) -> dict:
    """Create ts/src/games/{game_id}/, standalone entry, vite config, registry."""
    games_src = repo_root / "ts" / "src" / "games"
    config_dir = games_src / game_id
    if config_dir.exists():
        return {
            "error": f"ts/src/games/{game_id}/ already exists",
            "tool": "studio_scaffold_game",
            "game_id": game_id,
        }

    # Also need games/{game_id}/ for yaml + lua (TS-native still reads from there)
    lua_games_dir = repo_root / "games" / game_id
    if not lua_games_dir.exists():
        lua_games_dir.mkdir(parents=True)
        (lua_games_dir / "data.yaml").write_text(
            _LUA_DATA_YAML.format(game_id=game_id, label=label), encoding="utf-8"
        )
        (lua_games_dir / "ui.yaml").write_text(
            _LUA_UI_YAML.format(game_id=game_id), encoding="utf-8"
        )
        (lua_games_dir / "systems.yaml").write_text(
            _LUA_SYSTEMS_YAML.format(game_id=game_id), encoding="utf-8"
        )
        (lua_games_dir / "logic.lua").write_text(
            _LUA_LOGIC_STUB.format(game_id=game_id), encoding="utf-8"
        )
        (lua_games_dir / "VERSION").write_text("0.1.0\n", encoding="utf-8")

    # ts/src/games/{game_id}/App.tsx + config.ts
    config_dir.mkdir(parents=True)
    (config_dir / "App.tsx").write_text(
        _TS_APP_STUB.format(label=label), encoding="utf-8"
    )
    (config_dir / "config.ts").write_text(
        _TS_CONFIG_STUB.format(
            game_id=game_id,
            label=label,
            description=description,
        ),
        encoding="utf-8",
    )

    # ts/vite.{game_id}.config.ts
    vite_config_path = repo_root / "ts" / f"vite.{game_id}.config.ts"
    vite_config_path.write_text(
        _TS_VITE_CONFIG.format(game_id=game_id), encoding="utf-8"
    )

    # ts/src/standalone/{game_id}/entry.tsx + index.html
    standalone_dir = repo_root / "ts" / "src" / "standalone" / game_id
    standalone_dir.mkdir(parents=True)
    (standalone_dir / "entry.tsx").write_text(
        _TS_ENTRY_TSX.format(game_id=game_id), encoding="utf-8"
    )
    (standalone_dir / "index.html").write_text(
        _TS_INDEX_HTML.format(label=label), encoding="utf-8"
    )

    # Registry entry — additive only
    registry_path = games_src / "registry.ts"
    registry_modified = False
    if registry_path.exists():
        registry_content = registry_path.read_text(encoding="utf-8")
        if f"./{game_id}/config" not in registry_content:
            import_name = f"{_camel_case_from_game_id(game_id)}Config"
            import_line = f"import {import_name} from './{game_id}/config';\n"
            lines = registry_content.splitlines(keepends=True)
            last_import_idx = -1
            for i, line in enumerate(lines):
                if line.lstrip().startswith("import "):
                    last_import_idx = i
            if last_import_idx >= 0:
                lines.insert(last_import_idx + 1, import_line)
            else:
                lines.insert(0, import_line)

            registry_text = "".join(lines)
            array_entry = f"  {import_name},\n"
            registry_text = registry_text.replace(
                "];\n",
                f"{array_entry}];\n",
                1,
            )
            registry_path.write_text(registry_text, encoding="utf-8")
            registry_modified = True

    files_created = [
        str(config_dir / "App.tsx"),
        str(config_dir / "config.ts"),
        str(vite_config_path),
        str(standalone_dir / "entry.tsx"),
        str(standalone_dir / "index.html"),
    ]
    if lua_games_dir.exists():
        files_created.extend([
            str(lua_games_dir / "data.yaml"),
            str(lua_games_dir / "ui.yaml"),
            str(lua_games_dir / "systems.yaml"),
            str(lua_games_dir / "logic.lua"),
            str(lua_games_dir / "VERSION"),
        ])

    return {
        "game_id": game_id,
        "target_type": "ts_native",
        "files_created": files_created,
        "registry_modified": registry_modified,
    }


def _camel_case_from_game_id(game_id: str) -> str:
    """Convert underscore game_id to camelCase (e.g. trinity_siege → trinitySiege)."""
    parts = game_id.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def studio_scaffold_game(
    concept_slug: str,
    target_type: str | None = None,
) -> dict:
    """Scaffold a new game skeleton from an existing examples/{slug}/ concept.

    Inspects examples/{slug}/ to recommend a target_type (ts_native or lua_backed).
    Requires explicit target_type confirmation before creating any files.

    concept_slug: folder name in examples/ (kebab-case, e.g. "trinity-siege")
    target_type: "ts_native" or "lua_backed" — must be explicitly passed to proceed
    Returns: recommendation dict if target_type is None, otherwise scaffold result.
    """
    repo_root = Path(os.environ.get("GAMES_DIR", str(Path(__file__).parent.parent.parent)))
    # Actually, __file__ is studio_mcp/scaffold.py, so repo_root is two parents up
    repo_root = Path(__file__).resolve().parent.parent

    examples_dir = repo_root / "examples" / concept_slug
    if not examples_dir.exists():
        return {
            "error": f"examples/{concept_slug}/ does not exist",
            "tool": "studio_scaffold_game",
            "concept_slug": concept_slug,
        }

    # Always compute recommendation
    rec = recommend_target_type(examples_dir)

    # If no target_type, return recommendation only — do not create files
    if target_type is None:
        return {
            "concept_slug": concept_slug,
            "recommendation": rec["recommendation"],
            "reason": rec["reason"],
            "confidence": rec["confidence"],
            "message": f"Pass target_type='{rec['recommendation']}' to proceed with scaffolding",
        }

    # Validate target_type
    if target_type not in ("ts_native", "lua_backed"):
        return {
            "error": f"Invalid target_type: {target_type!r}. Must be 'ts_native' or 'lua_backed'",
            "tool": "studio_scaffold_game",
            "concept_slug": concept_slug,
        }

    game_id = _game_id_from_slug(concept_slug)
    label = " ".join(p.capitalize() for p in concept_slug.split("-"))
    description = f"Scaffolded from examples/{concept_slug}/ — not yet converted"

    if target_type == "lua_backed":
        result = _scaffold_lua_backed(repo_root, game_id, label)
    else:
        result = _scaffold_ts_native(repo_root, game_id, label, description)

    result["concept_slug"] = concept_slug
    result["recommendation"] = rec["recommendation"]
    return result
