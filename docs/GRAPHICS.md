# Graphics: the vector / raster / canvas boundary

Roadmap milestone M6, step M6.1. This is the document every later graphics step
(vector-to-sprite export, pixel style, rasteriser, sprite sheets) cites. It
restates the model from `docs/superpowers/specs/2026-09-24-graphics-and-styles-plan.md`
section 4 and records who uses which technology, measured on this branch
2026-10-12.

## The model

Art is defined once and drawn in a style. A style is a rendering choice, never a
second art set — the plan's section 4 is the source of this rule, and the
economics behind it are that creature content is the budget constraint, so
parallel art sets would double the scarcest thing the studio makes.

Each thing on screen comes from exactly one source: procedural vector (seeded
shapes from `ts/src/engine/artGen/`, the Paper Doll composer in
`ts/src/engine/paperDoll/`, the geometry in
`ts/src/games/slimeworld/components/SlimeVisual.tsx`), hand-authored vector
(Paper Doll Studio parts, `ts/src/engine/shared/personGenerator/RoleSymbol.tsx`),
generated static vector (the Dissonance generators), pre-rendered raster
(`ts/src/engine/creatureArt/` output, and painted backdrops when they arrive), or
per-frame canvas. Each source renders through a style: `vector` (the default,
full palette and smooth motion), `pixel` (rasterise, quantise to a palette,
outline, integer upscale), or `shaded` (a parameter applied to vector fills, not
a separate style), recoloured by theme through tone roles rather than baked hex.
Sprite sheets are an output of this model — a seeded export of a vector source —
never a source themselves.

## The rule

- Vector is the default: anything composed, recoloured or scaled per player —
  creatures, icons, UI — is vector, because it stays crisp at every size and
  recolours for free.
- Raster is for painted backdrops and texture: art that arrives finished and is
  shown as painted, never recomposed per player.
- Canvas is only where a per-frame redraw is the point: simulations and action
  scenes that repaint every frame anyway. Canvas is not a second home for art
  that could live as a styled source instead.

## Who uses what

Measured 2026-10-12 by Glob and Grep on this branch; every row's path verified
to exist.

| Technology | Path | Owner demo or module |
|---|---|---|
| Vector (SVG) | `ts/src/engine/artGen/` | shared engine module — seeded shapes (Dissonance, Shoal, SlimeWorld, Planet of Greed) |
| Vector (SVG) | `ts/src/engine/paperDoll/` | shared engine module — chimera renderer (Chimera Wilds, Mutant Battle Ball) |
| Vector (SVG) | `ts/src/engine/shared/personGenerator/RoleSymbol.tsx` | shared engine module — role icons |
| Vector (SVG) | `ts/src/engine/shared/components/PlanetMap.tsx` | shared engine module — SVG plus DOM |
| Vector (SVG) | `ts/src/ui/components/ProgressIndicator.tsx` | shared UI library |
| Vector (SVG) | `ts/src/games/slimeworld/components/SlimeVisual.tsx` | slimeworld — procedural slime |
| Vector (SVG) | `ts/src/games/slimeworld/components/MissionsTab.tsx` | slimeworld — map panel |
| Vector (SVG) | `ts/src/games/horse_racing/components/SVGRacer.tsx` | horse_racing — racer sprite |
| Vector (SVG) | `ts/src/games/horse_racing/components/RaceTrack.tsx` | horse_racing — track |
| Vector (SVG) | `ts/src/games/gladiator_arena/components/StickFighter.tsx` | gladiator_arena — fighter |
| Vector (SVG) | `ts/src/games/early_learning_buddy/components/CharacterVisual.tsx` | early_learning_buddy — characters |
| Vector (SVG) | `ts/src/games/dissonance/art/dissonanceGenerator.ts` | dissonance — TS port of the art generator |
| Vector (SVG) | `scripts/generate_dissonance_art.py` | dissonance — build-time generator writing `ts/public/assets/dissonance/` |
| Vector (SVG) | `ts/public/assets/dissonance/` | dissonance — 106 generated .svg files |
| Vector (SVG) | `ts/src/standalone/bezier_poc/` | standalone proof-of-concept viewer |
| Vector (SVG) | `ts/src/standalone/technique_showcase/` | standalone technique showcase viewer |
| Vector (SVG) | `ts/src/standalone/technique_comparison/` | standalone technique comparison viewer |
| Canvas 2D | `ts/src/games/shoal/components/ReefPreview.tsx` | shoal — reef preview |
| Canvas 2D | `ts/src/games/shoal/App.tsx` | shoal — the main reef scene |
| Canvas 2D | `ts/src/games/slime_coin/components/BoardCanvas.tsx` | slime_coin — board |
| Canvas 2D | `ts/src/games/slither_rogue/components/GameCanvas.tsx` | slither_rogue — playfield |
| Canvas 2D | `ts/src/games/voiddrift_redux/components/OrbitalCanvas.tsx` | voiddrift_redux — orbital view |
| Canvas 2D | `ts/src/games/mutant_battle_ball/components/MatchCanvas.tsx` | mutant_battle_ball — canvas court under Paper Doll SVG |
| Canvas 2D | `ts/src/games/coin_pusher_arcade/components/BoardCanvas.tsx` | coin_pusher_arcade — board |
| Canvas 2D | `ts/src/games/grainworks/hooks/useSimulationLoop.ts` | grainworks — per-frame simulation loop |
| Canvas 2D | `ts/src/games/grainworks/simulation/renderer.ts` | grainworks — offscreen canvas renderer |
| Canvas 2D | `ts/src/standalone/technique_comparison/technique_canvas.ts` | technique comparison — the canvas technique itself |
| Raster | `ts/src/engine/creatureArt/fixtures/wolf.png` | creatureArt — the parked seam's only fixture |

## Budgets

The roadmap asks for a file-size and load budget per side measured against the
portal targets, but a search of `docs/RFDGameStudio_MultiPortalPublishing.md` and
`docs/PUBLISHING_CONTRACT.md` finds no documented size or load target — so there
is no number this section can honestly state. The measurable inputs that do
exist:

- The only raster asset in the tree is the
  `ts/src/engine/creatureArt/fixtures/wolf.png` fixture at 347,341 bytes
  (`docs/CREATURE_SYSTEM.md`).
- The generated static vector set under `ts/public/assets/dissonance/` is 106
  `.svg` files, counted by Glob on 2026-10-12.

No portal size target is documented; Robert or the portal research sets one
before any budget test is written.

## Open decisions

Copied from the plan's section 5; none are resolved here. Each is Robert's call.

- D1. Technique winners from the 10-technique comparison (`localhost:5200`). Which of the smooth family (Bézier, metaball, stroke, noise, superellipse, SDF, canvas) become artGen primitives? Is the 32x32 pixel grid (technique 9) a *style* (this plan's reading) or a separate art direction? — Robert decides.
- D2. The Bézier primitive: keep it and build it into artGen, or drop it (`localhost:5199`). — Robert decides.
- D3. Shading: port ChimeraLab's shade factor and edge light as the `shaded` parameter, yes or no. — Robert decides.
- D4. The pixel look: which 16-colour palette (a named public palette, or one derived from existing brand colours), which target size (32 or 48 px), and the pixel font. `PublicPixel`'s licence must be confirmed before it is bundled; otherwise use an OFL-licensed pixel font. — Robert decides.
- D5. First adopters: the foundation spec says Dissonance in both styles, plus Chimera Wilds *or* Mutant Battle Ball. Pick one. — Robert decides.
- No portal size target is documented; Robert or the portal research sets one before any budget test is written. — Robert decides.

## How to change this

The boundary follows `docs/ROADMAP.md`: a change to the rule is a roadmap edit
approved by Robert, and this document is then updated to match. The doc follows
the roadmap, never the other way.
