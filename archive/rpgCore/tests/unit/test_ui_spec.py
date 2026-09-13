import pytest
from src.shared.ui.spec import UISpec, SPEC_720, SPEC_1080

def test_spec_dimensions():
    assert SPEC_720.screen_width == 1280
    assert SPEC_720.screen_height == 720
    assert SPEC_1080.scale_factor == 1.5

def test_spec_colors():
    spec = SPEC_720
    assert len(spec.color_bg) == 3
    assert len(spec.color_accent) == 3

def test_font_size_mapping():
    spec = SPEC_720
    assert spec.font_size_xl > spec.font_size_lg
    assert spec.font_size_md == 14
