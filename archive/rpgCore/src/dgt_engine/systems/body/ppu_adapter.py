"""
PPU Adapter — Environment-Aware Rendering Router

Phase 3: PPU Consolidation (ADR 192 Compliant)

Routes the canonical UnifiedPPU to the correct output backend:
  • TK       → Tkinter Canvas for desktop development
  • TERMINAL → Rich/Braille/Phosphor for terminal rendering
  • HEADLESS → No-op sink for CI, Voyager agent, and unit tests

Usage:
    from engines.body.ppu_adapter import get_ppu

    ppu = get_ppu()                     # auto-detect
    ppu = get_ppu(PPUBackend.TERMINAL)  # explicit
"""

from __future__ import annotations

from enum import Enum, auto
from typing import Optional, Dict, Any, List, Tuple

from foundation.interfaces.protocols import PPUProtocol, Result
from .unified_ppu import (
    UnifiedPPU, PPUConfig, PPUMode, RefreshRate, create_unified_ppu,
)

from loguru import logger


# ---------------------------------------------------------------------------
# Backend Enum
# ---------------------------------------------------------------------------

class PPUBackend(Enum):
    """Output backend for the PPU pipeline."""
    TK       = auto()   # Tkinter canvas (desktop dev)
    TERMINAL = auto()   # Rich / braille / phosphor (terminal play)
    HEADLESS = auto()   # No-op sink (CI / tests / Voyager agent)
    AUTO     = auto()   # Detect at runtime


# ---------------------------------------------------------------------------
# Backend-specific adapters
# ---------------------------------------------------------------------------

class _TkAdapter:
    """Routes PPU frame buffer into a Tkinter PhotoImage."""

    def __init__(self) -> None:
        self._canvas = None
        self._photo_image = None

    def attach(self, canvas: Any) -> Result[None]:
        """Attach to an existing Tkinter canvas widget."""
        self._canvas = canvas
        logger.info("🖼️  TK adapter attached to canvas")
        return Result.success_result(None)

    def present(self, frame_data: bytes, width: int, height: int) -> Result[None]:
        """Blit frame_data onto the canvas."""
        if self._canvas is None:
            return Result.failure_result("TK canvas not attached")
        try:
            import tkinter as tk
            if self._photo_image is None:
                self._photo_image = tk.PhotoImage(width=width, height=height)
                self._canvas.create_image(0, 0, anchor=tk.NW, image=self._photo_image)

            # Convert grayscale frame to PPM header + data
            header = f"P5 {width} {height} 255 ".encode()
            self._photo_image.configure(data=header + frame_data)
            return Result.success_result(None)
        except Exception as e:
            return Result.failure_result(f"TK present error: {e}")


class _TerminalAdapter:
    """Routes PPU frame buffer to terminal via Rich/Braille."""

    def __init__(self) -> None:
        self._console = None

    def attach(self, console: Any = None) -> Result[None]:
        """Optionally attach an existing Rich console."""
        if console is not None:
            self._console = console
        else:
            try:
                from rich.console import Console
                self._console = Console()
            except ImportError:
                self._console = None
        logger.info("📟  Terminal adapter ready")
        return Result.success_result(None)

    def present(self, frame_data: bytes, width: int, height: int) -> Result[None]:
        """Render frame buffer as braille characters to terminal."""
        if self._console is None:
            # Fallback: silent drop
            return Result.success_result(None)
        try:
            # Convert to braille — 2x4 pixel blocks per character
            lines: list[str] = []
            for row in range(0, height, 4):
                line_chars: list[str] = []
                for col in range(0, width, 2):
                    dots = 0
                    for dy in range(4):
                        for dx in range(2):
                            py, px = row + dy, col + dx
                            if py < height and px < width:
                                idx = py * width + px
                                if idx < len(frame_data) and frame_data[idx] > 127:
                                    dots |= 1 << (dy * 2 + dx)
                    line_chars.append(chr(0x2800 + dots))
                lines.append("".join(line_chars))
            self._console.print("\n".join(lines))
            return Result.success_result(None)
        except Exception as e:
            return Result.failure_result(f"Terminal present error: {e}")


class _HeadlessAdapter:
    """No-op sink — discards frames. Used in CI and Voyager auto-play."""

    _frame_count: int = 0

    def attach(self, **_kw: Any) -> Result[None]:
        logger.info("👻  Headless adapter attached (no-op sink)")
        return Result.success_result(None)

    def present(self, frame_data: bytes, width: int, height: int) -> Result[None]:
        self._frame_count += 1
        return Result.success_result(None)

    @property
    def frames_discarded(self) -> int:
        return self._frame_count


# ---------------------------------------------------------------------------
# PPU Adapter (public API)
# ---------------------------------------------------------------------------

class PPUAdapter:
    """
    Environment-aware PPU wrapper.

    Wraps the canonical UnifiedPPU and routes its output to
    the correct backend (TK, Terminal, Headless).
    """

    def __init__(
        self,
        backend: PPUBackend = PPUBackend.AUTO,
        mode: PPUMode = PPUMode.MIYOO,
        width: int = 160,
        height: int = 144,
    ) -> None:
        self._backend_type = backend if backend != PPUBackend.AUTO else self._detect_backend()
        self._mode = mode
        self._width = width
        self._height = height

        # Core PPU
        self._ppu: Optional[UnifiedPPU] = None

        # Backend adapter
        self._adapter: Any = self._create_adapter(self._backend_type)

    # -- lifecycle -----------------------------------------------------------

    def initialize(self) -> Result[bool]:
        """Create and initialise the UnifiedPPU + backend adapter."""
        ppu_result = create_unified_ppu(self._mode, self._width, self._height)
        if not ppu_result.success:
            return Result.failure_result(f"PPU init failed: {ppu_result.error}")

        self._ppu = ppu_result.value
        attach_result = self._adapter.attach()
        if not attach_result.success:
            return Result.failure_result(f"Adapter attach failed: {attach_result.error}")

        logger.info(
            f"🎯 PPUAdapter ready — backend={self._backend_type.name}, "
            f"mode={self._mode.value}, res={self._width}x{self._height}"
        )
        return Result.success_result(True)

    def shutdown(self) -> Result[None]:
        """Tear down PPU resources."""
        self._ppu = None
        logger.info("PPUAdapter shut down")
        return Result.success_result(None)

    # -- rendering -----------------------------------------------------------

    def render_and_present(self) -> Result[None]:
        """Pull the current frame buffer and push it to the backend."""
        if self._ppu is None:
            return Result.failure_result("PPU not initialised")

        fb_result = self._ppu.get_frame_buffer()
        if not fb_result.success:
            return Result.failure_result(f"Frame buffer error: {fb_result.error}")

        return self._adapter.present(fb_result.value, self._width, self._height)

    # -- delegation to UnifiedPPU -------------------------------------------

    @property
    def ppu(self) -> Optional[UnifiedPPU]:
        """Direct access to the underlying UnifiedPPU for tile/sprite calls."""
        return self._ppu

    @property
    def backend(self) -> PPUBackend:
        return self._backend_type

    def set_mode(self, mode: PPUMode) -> Result[None]:
        if self._ppu is None:
            return Result.failure_result("PPU not initialised")
        return self._ppu.set_mode(mode)

    def set_palette(self, palette: List[Tuple[int, int, int]]) -> Result[None]:
        if self._ppu is None:
            return Result.failure_result("PPU not initialised")
        return self._ppu.set_palette(palette)

    def get_performance_profile(self) -> Dict[str, Any]:
        if self._ppu is None:
            return {"error": "PPU not initialised"}
        profile = self._ppu.get_performance_profile()
        profile["backend"] = self._backend_type.name
        return profile

    # -- internals -----------------------------------------------------------

    @staticmethod
    def _detect_backend() -> PPUBackend:
        """Auto-detect the best backend for the current environment."""
        import os
        import sys

        # CI / headless detection
        if os.environ.get("CI") or os.environ.get("DGT_HEADLESS"):
            return PPUBackend.HEADLESS

        # Check for a display server (X11 / Wayland / Win32)
        if sys.platform == "win32":
            return PPUBackend.TK
        if os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY"):
            return PPUBackend.TK

        # Fallback: terminal
        return PPUBackend.TERMINAL

    @staticmethod
    def _create_adapter(backend: PPUBackend) -> Any:
        if backend == PPUBackend.TK:
            return _TkAdapter()
        elif backend == PPUBackend.TERMINAL:
            return _TerminalAdapter()
        else:
            return _HeadlessAdapter()


# ---------------------------------------------------------------------------
# Module-level convenience
# ---------------------------------------------------------------------------

def get_ppu(
    backend: PPUBackend = PPUBackend.AUTO,
    mode: PPUMode = PPUMode.MIYOO,
    width: int = 160,
    height: int = 144,
) -> PPUAdapter:
    """Factory: create, initialise, and return a ready-to-use PPUAdapter."""
    adapter = PPUAdapter(backend=backend, mode=mode, width=width, height=height)
    init_result = adapter.initialize()
    if not init_result.success:
        logger.error(f"PPU adapter failed to initialize: {init_result.error}")
    return adapter
