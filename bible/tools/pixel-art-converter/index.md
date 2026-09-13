---
title: "Pixel Art Converter"
tool: "pixel-art-converter"
type: "tool"
version: "0.1"
status: "draft"
last_updated: "2026-09-05"
description: "Converts images to pixel art for retro-style games."
---

# Pixel Art Converter

## Purpose
Convert **images to pixel art** for retro-style games.

## Features
- **Downscaling** (e.g., 1024x1024 → 32x32).
- **Palette reduction** (e.g., 256 colors → 16 colors).
- **Dithering** (e.g., Floyd-Steinberg).

## Usage
```bash
python pixel_art_converter.py --input image.png --output pixel_art.png --size 32x32
```