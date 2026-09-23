# RFD Game Studio

## Project Bible
- **12 games documented** (GDDs, mechanics, ADRs), plus 17 genre templates in `bible/templates/`.
- **Nightly pipeline** validates and syncs all content.

## Studio Tools
| Tool | Model | Description |
|------|-------|-------------|
| `svg-generator` | claude-3.5-sonnet | Generates SVG assets from prompts. |
| `pixel-art-converter` | dall-e-3 | Converts images to pixel art. |
| `3d-modeler` | gpt-4o | 3D modeling component. |

## Nightly Pipeline
- **GDD Validation**: All 12 game GDDs validated.
- **Memory Sync**: All GDDs synced to RFD Memory MCP.
- **Tool Validation**: All tools validated and synced.

## Reports
- [Code-Mechanics Validation](../reports/code_mechanics_validation.md)
- [Tool Validation](../reports/tool_validation.md)