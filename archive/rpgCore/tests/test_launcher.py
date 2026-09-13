import pytest
from pathlib import Path
from src.launcher.manifest import DemoManifest
from src.launcher.registry import DemoRegistry

@pytest.fixture
def mock_manifest_data(tmp_path):
    demos_json = tmp_path / "demos.json"
    demos_json.write_text('''
    {
      "engine": "rpgCore",
      "version": "0.1.0",
      "demos": [
        {
          "id": "play1",
          "name": "Playable One",
          "description": "Desc 1",
          "module": "stub1",
          "entry": "main",
          "status": "playable",
          "genre": "action"
        },
        {
          "id": "play2",
          "name": "Playable Two",
          "description": "Desc 2",
          "module": "stub2",
          "entry": "main",
          "status": "playable",
          "genre": "rpg"
        },
        {
          "id": "stub1",
          "name": "Stub One",
          "description": "Desc 3",
          "module": "stub3",
          "entry": "main",
          "status": "stub",
          "genre": "puzzle"
        },
        {
          "id": "stub2",
          "name": "Stub Two",
          "description": "Desc 4",
          "module": "stub4",
          "entry": "main",
          "status": "stub",
          "genre": "narrative"
        }
      ]
    }
    ''')
    return demos_json

def test_manifest_loads_from_json(mock_manifest_data):
    manifests = DemoManifest.load(mock_manifest_data)
    assert len(manifests) == 4
    assert manifests[0].id == "play1"

def test_registry_all_returns_four_demos(mock_manifest_data):
    registry = DemoRegistry(DemoManifest.load(mock_manifest_data))
    assert len(registry.all()) == 4

def test_registry_playable_returns_only_playable(mock_manifest_data):
    registry = DemoRegistry(DemoManifest.load(mock_manifest_data))
    playable = registry.playable()
    assert len(playable) == 2
    assert all(m.status == "playable" for m in playable)

def test_registry_get_by_id(mock_manifest_data):
    registry = DemoRegistry(DemoManifest.load(mock_manifest_data))
    demo = registry.get("stub1")
    assert demo is not None
    assert demo.name == "Stub One"

def test_registry_get_unknown_returns_none(mock_manifest_data):
    registry = DemoRegistry(DemoManifest.load(mock_manifest_data))
    assert registry.get("unknown_demo") is None

def test_cli_list_formatted_contains_all_names(mock_manifest_data):
    registry = DemoRegistry(DemoManifest.load(mock_manifest_data))
    output = registry.list_formatted()
    assert "Playable One" in output
    assert "Playable Two" in output
    assert "Stub One" in output
    assert "Stub Two" in output

def test_stub_demos_marked_wip(mock_manifest_data):
    registry = DemoRegistry(DemoManifest.load(mock_manifest_data))
    output = registry.list_formatted()
    assert "[WIP]" in output
    assert "Stub One [WIP]" in output
