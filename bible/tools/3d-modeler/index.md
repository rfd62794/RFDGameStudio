---
title: "3D Modeling Component"
tool: "3d-modeler"
type: "tool"
version: "0.1"
status: "draft"
last_updated: "2026-09-05"
description: "3D modeling tool for game assets (based on third-party code)."
---

# 3D Modeling Component

## Purpose
Generate **3D models** for game assets (e.g., characters, environments).

## Features
- **Blender/Python integration** (export to `.fbx`/`.obj`).
- **Low-poly optimization** (e.g., decimate mesh).
- **Animation support** (e.g., rigging, keyframes).

## Usage
```bash
python 3d_modeler.py --input model.blend --output assets/3d/
```