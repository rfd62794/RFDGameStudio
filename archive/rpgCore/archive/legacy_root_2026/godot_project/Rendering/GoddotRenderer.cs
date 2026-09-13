using Godot;
using System;
using System.Collections.Generic;
using rpgCore.Godot.Models;

namespace rpgCore.Godot.Rendering {
    /// <summary>
    /// Godot-specific renderer implementation using Canvas2D.
    /// Implements IRenderer for rendering game state to Godot viewport.
    ///
    /// SOLID Principle: Liskov Substitution
    /// - Can be replaced with any other IRenderer implementation
    /// - Client code doesn't know or care about Godot specifics
    /// - Testable with mocks
    ///
    /// Features:
    /// - 160x144 game world rendered at 4x scale (640x576)
    /// - Arcade phosphor green aesthetic
    /// - Entity rendering with filled + outline style
    /// - HUD text overlay
    /// - Deterministic frame rendering
    /// </summary>
    public partial class GoddotRenderer : IRenderer {
        private CanvasItem canvas;
        private Vector2 screenDimensions = new Vector2(160, 144);
        private float scale = 4.0f;  // Scale from 160x144 to 640x576
        private Color clearColor = new Color(0, 0, 0);  // Black background

        // Arcade color palette (phosphor green)
        private static readonly Color ColorShip = new Color(0, 1, 0);  // Green
        private static readonly Color ColorAsteroid = new Color(0.5f, 0.5f, 0.5f);  // Gray
        private static readonly Color ColorProjectile = new Color(1, 1, 1);  // White
        private static readonly Color ColorOutline = new Color(1, 1, 1);  // White
        private static readonly Color ColorHUD = new Color(0, 1, 0);  // Green
        private static readonly Color ColorSecondary = new Color(0, 0.5f, 0);  // Dark green

        public GoddotRenderer(CanvasItem canvasItem) {
            if (canvasItem == null) {
                throw new ArgumentNullException(nameof(canvasItem));
            }
            canvas = canvasItem;
        }

        /// <summary>Clear the canvas with background color.</summary>
        public void Clear(Color backgroundColor) {
            clearColor = backgroundColor;
            // Godot's canvas will be cleared by the engine before draw calls
            // We just track the color for any subsequent rendering
        }

        /// <summary>Render a complete frame from game state.</summary>
        public void RenderFrame(FrameUpdateMessage frameData) {
            if (frameData == null || frameData.Entities == null) {
                return;
            }

            // Draw each entity
            foreach (var entity in frameData.Entities) {
                if (entity.Active) {
                    RenderEntity(entity);
                }
            }

            // Draw HUD overlay
            if (frameData.Hud != null) {
                RenderHUD(frameData.Hud);
            }
        }

        /// <summary>Render a single entity based on its type.</summary>
        private void RenderEntity(EntityDTO entity) {
            switch (entity.Type.ToLower()) {
                case "ship":
                    DrawShip(entity);
                    break;
                case "large_asteroid":
                case "medium_asteroid":
                case "small_asteroid":
                case "asteroid":
                    DrawAsteroid(entity);
                    break;
                case "bullet":
                case "projectile":
                    DrawBullet(entity);
                    break;
                default:
                    // Unknown entity type, render as generic circle
                    DrawGenericEntity(entity);
                    break;
            }
        }

        /// <summary>Draw an asteroid as a filled circle with outline.</summary>
        private void DrawAsteroid(EntityDTO asteroid) {
            var pos = asteroid.GetPosition() * scale;
            var radius = asteroid.Radius * scale;

            // Filled circle
            canvas.DrawCircle(pos, radius, ColorAsteroid);
            // Outline
            canvas.DrawCircle(pos, radius, ColorOutline, false, 1.5f);
        }

        /// <summary>Draw the player ship as a triangle with outline.</summary>
        private void DrawShip(EntityDTO ship) {
            var pos = ship.GetPosition() * scale;
            var heading = ship.Angle;
            var shipRadius = ship.Radius * scale;

            // Ship vertices (triangle pointing right in local space)
            // Front point, back-left, back-right
            var localVertices = new Vector2[] {
                new Vector2(shipRadius, 0),           // Tip (front)
                new Vector2(-shipRadius * 0.5f, shipRadius * 0.75f),  // Back-left
                new Vector2(-shipRadius * 0.5f, -shipRadius * 0.75f)  // Back-right
            };

            // Rotate vertices by ship heading
            var rotatedVertices = new Vector2[3];
            for (int i = 0; i < 3; i++) {
                rotatedVertices[i] = localVertices[i].Rotated(heading) + pos;
            }

            // Draw filled triangle
            canvas.DrawColoredPolygon(rotatedVertices, ColorShip);

            // Draw outline
            for (int i = 0; i < 3; i++) {
                int next = (i + 1) % 3;
                canvas.DrawLine(rotatedVertices[i], rotatedVertices[next], ColorOutline, 1.5f);
            }
        }

        /// <summary>Draw a projectile as a small white circle.</summary>
        private void DrawBullet(EntityDTO bullet) {
            var pos = bullet.GetPosition() * scale;
            var radius = 2.0f;  // Bullet size in screen space

            canvas.DrawCircle(pos, radius, ColorProjectile);
            canvas.DrawCircle(pos, radius, ColorOutline, false, 0.5f);
        }

        /// <summary>Draw a generic entity as a circle.</summary>
        private void DrawGenericEntity(EntityDTO entity) {
            var pos = entity.GetPosition() * scale;
            var radius = entity.Radius * scale;
            var color = GetColorForPalette(entity.Color.GetValueOrDefault());

            canvas.DrawCircle(pos, radius, color);
            canvas.DrawCircle(pos, radius, ColorOutline, false, 1.0f);
        }

        /// <summary>Draw the HUD overlay (score, lives, wave).</summary>
        private void RenderHUD(HUDStateDTO hud) {
            var font = ThemeDB.FallbackFont;
            var fontSize = 16;

            // Position: top-left with padding
            var basePos = new Vector2(10, 10) * scale;
            var lineHeight = 20 * scale;

            // Score
            canvas.DrawString(
                font,
                basePos,
                $"SCORE: {hud.Score}",
                HorizontalAlignment.Left,
                -1,
                fontSize,
                ColorHUD
            );

            // Lives
            canvas.DrawString(
                font,
                basePos + new Vector2(0, lineHeight),
                $"LIVES: {hud.Lives}",
                HorizontalAlignment.Left,
                -1,
                fontSize,
                ColorHUD
            );

            // Wave
            canvas.DrawString(
                font,
                basePos + new Vector2(0, lineHeight * 2),
                $"WAVE: {hud.Wave}",
                HorizontalAlignment.Left,
                -1,
                fontSize,
                ColorHUD
            );

            // Asteroids remaining (top-right)
            canvas.DrawString(
                font,
                new Vector2((160 - 5) * scale, 10 * scale),
                $"AST: {hud.AsteroidsRemaining}",
                HorizontalAlignment.Right,
                -1,
                fontSize,
                ColorSecondary
            );
        }

        /// <summary>
        /// Present the rendered frame to display.
        /// In Godot, this triggers a redraw.
        /// </summary>
        public void Present() {
            canvas.QueueRedraw();
        }

        /// <summary>Get the rendering surface dimensions.</summary>
        public Vector2 GetScreenDimensions() {
            return screenDimensions;
        }

        /// <summary>Get color from palette index (for extensibility).</summary>
        private Color GetColorForPalette(int colorIndex) {
            return colorIndex switch {
                1 => ColorShip,           // Green
                2 => ColorAsteroid,       // Gray
                3 => ColorProjectile,     // White
                _ => ColorSecondary       // Default to secondary
            };
        }
    }
}
