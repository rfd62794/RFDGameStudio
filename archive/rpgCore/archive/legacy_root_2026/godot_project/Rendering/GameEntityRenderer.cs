/*
Generalized Game Entity Renderer for Godot
Supports multiple rendering styles: Space, RPG, Tycoon

SOLID Principle: Open/Closed
- Open for extension (new entity types via strategy pattern)
- Closed for modification (base rendering logic unchanged)

Architecture:
- Entity type → renderer strategy mapping
- Composable visual components (color, shape, animation)
- Scale-agnostic rendering (adapts to viewport)
*/

using Godot;
using System;
using System.Collections.Generic;
using rpgCore.Godot.Models;

namespace rpgCore.Godot.Rendering
{
    /// <summary>
    /// Renders game entities to Godot Canvas2D.
    /// Supports multiple game types and entity styles.
    /// </summary>
    public partial class GameEntityRenderer : Node2D
    {
        private Dictionary<string, EntityRenderer> _entityRenderers = new();
        private Vector2 _worldScale = Vector2.One;
        private Rect2 _viewport = new(0, 0, 640, 576);

        // Game type configuration
        private string _gameType = "space"; // space, rpg, tycoon
        private Color _backgroundColor = Colors.Black;

        public override void _Ready()
        {
            SetupRenderStrategies();
            QueueRedraw();
        }

        /// <summary>
        /// Setup rendering strategies for different entity types.
        /// Extensible: Add new entity types here.
        /// </summary>
        private void SetupRenderStrategies()
        {
            // Space game renderers
            _entityRenderers["space_entity"] = new SpaceEntityRenderer();
            _entityRenderers["ship"] = new ShipRenderer();
            _entityRenderers["asteroid"] = new AsteroidRenderer();
            _entityRenderers["projectile"] = new ProjectileRenderer();

            // RPG game renderers (can be added)
            // _entityRenderers["character"] = new CharacterRenderer();
            // _entityRenderers["npc"] = new NPCRenderer();
            // _entityRenderers["loot"] = new LootRenderer();

            // Tycoon game renderers (can be added)
            // _entityRenderers["building"] = new BuildingRenderer();
            // _entityRenderers["vehicle"] = new VehicleRenderer();
        }

        /// <summary>
        /// Render frame with entities and HUD.
        /// </summary>
        public void RenderFrame(FrameUpdateMessage frameUpdate)
        {
            if (frameUpdate == null)
                return;

            // Render entities
            foreach (var entity in frameUpdate.Entities)
            {
                RenderEntity(entity);
            }

            // Render particles
            foreach (var particle in frameUpdate.Particles)
            {
                RenderParticles(particle);
            }

            // Render HUD
            if (frameUpdate.Hud != null)
            {
                RenderHUD(frameUpdate.Hud);
            }

            QueueRedraw();
        }

        /// <summary>
        /// Render single entity.
        /// </summary>
        private void RenderEntity(EntityDTO entity)
        {
            if (entity == null || !entity.Active)
                return;

            // Find appropriate renderer
            string rendererKey = _gameType switch
            {
                "space" => entity.Type ?? "space_entity",
                "rpg" => entity.Type ?? "character",
                "tycoon" => entity.Type ?? "building",
                _ => entity.Type ?? "space_entity"
            };

            if (_entityRenderers.TryGetValue(rendererKey, out var renderer))
            {
                renderer.Render(this, entity, _worldScale);
            }
            else
            {
                // Fallback: render as generic circle
                RenderGenericEntity(entity);
            }
        }

        /// <summary>
        /// Fallback rendering for unknown entity types.
        /// </summary>
        private void RenderGenericEntity(EntityDTO entity)
        {
            var screenPos = WorldToScreen(entity.X, entity.Y);
            float screenRadius = entity.Radius * _worldScale.X;

            Color color = GetEntityColor(entity.Color ?? 1);
            DrawCircle(screenPos, screenRadius, color);

            // Draw entity ID for debugging
            DrawString(
                ThemeDB.FallbackFont,
                screenPos + Vector2.Down * 20,
                entity.Id ?? "",
                HorizontalAlignment.Center,
                -1,
                12,
                Colors.White
            );
        }

        /// <summary>
        /// Render particle emitter.
        /// </summary>
        private void RenderParticles(ParticleEmitterDTO particle)
        {
            if (particle == null)
                return;

            var screenPos = WorldToScreen(particle.X, particle.Y);

            // Draw particle cloud (simplified)
            for (int i = 0; i < (int)(particle.ParticleCount * particle.Intensity); i++)
            {
                float angle = (float)GD.Randf() * Mathf.Tau;
                float distance = (float)GD.Randf() * particle.SpreadRadius;

                var particlePos = screenPos + new Vector2(
                    Mathf.Cos(angle) * distance,
                    Mathf.Sin(angle) * distance
                );

                float size = 2 + (float)GD.Randf() * 2;
                Color color = new Color(1, 0.5f, 0, 0.7f); // Orange with alpha
                DrawCircle(particlePos, size, color);
            }
        }

        /// <summary>
        /// Render HUD elements (score, lives, wave, etc).
        /// </summary>
        private void RenderHUD(HUDStateDTO hud)
        {
            if (hud == null)
                return;

            var hudFont = ThemeDB.FallbackFont;
            float fontSize = 14;
            Color hudColor = Colors.White;

            // Top-left: Score
            // Top-left: Score
            DrawString(hudFont, new Vector2(10, 10), $"SCORE: {hud.Score}", HorizontalAlignment.Left, -1, (int)fontSize, hudColor);

            // Top-right: Lives
            // Top-right: Lives
            var livesText = $"LIVES: {hud.Lives}";
            DrawString(hudFont, new Vector2(630, 10), livesText, HorizontalAlignment.Right, -1, (int)fontSize, hudColor);

            // Top-center: Wave
            // Top-center: Wave
            var waveText = $"WAVE: {hud.Wave}";
            DrawString(hudFont, new Vector2(320, 10), waveText, HorizontalAlignment.Center, -1, (int)fontSize, hudColor);

            // Bottom: Status message
            if (!string.IsNullOrEmpty(hud.Status))
            {
                DrawString(hudFont, new Vector2(320, 550), hud.Status, HorizontalAlignment.Center, -1, (int)fontSize, Colors.Yellow);
            }
        }

        /// <summary>
        /// Convert world coordinates to screen coordinates.
        /// </summary>
        private Vector2 WorldToScreen(float worldX, float worldY)
        {
            // Assuming world is 160x144 and screen is 640x576 (4x scale)
            return new Vector2(worldX * 4, worldY * 4);
        }

        /// <summary>
        /// Get color for entity based on color ID.
        /// Space game color palette (arcade aesthetic).
        /// </summary>
        private Color GetEntityColor(int colorId)
        {
            return colorId switch
            {
                0 => Colors.Black,
                1 => new Color(0, 1, 0, 1),       // Phosphor green (ship)
                2 => new Color(1, 1, 0, 1),       // Yellow (asteroids)
                3 => new Color(1, 0, 1, 1),       // Magenta (bullets)
                4 => new Color(0, 1, 1, 1),       // Cyan
                5 => new Color(1, 0, 0, 1),       // Red
                _ => Colors.White
            };
        }

        /// <summary>
        /// Set game type to configure rendering styles.
        /// </summary>
        public void SetGameType(string gameType)
        {
            _gameType = gameType.ToLower();
            QueueRedraw();
        }

        /// <summary>
        /// Set viewport dimensions (game world bounds).
        /// </summary>
        public void SetViewport(float width, float height)
        {
            _viewport = new Rect2(0, 0, width, height);
        }

        /// <summary>
        /// Set world-to-screen scale factor.
        /// </summary>
        public void SetWorldScale(float scaleX, float scaleY)
        {
            _worldScale = new Vector2(scaleX, scaleY);
        }

        public override void _Draw()
        {
            // Background
            DrawRect(new Rect2(0, 0, 640, 576), _backgroundColor);
        }
    }

    /// <summary>
    /// Base class for entity rendering strategies.
    /// </summary>
    public abstract class EntityRenderer
    {
        public abstract void Render(CanvasItem canvas, EntityDTO entity, Vector2 worldScale);

        protected Vector2 WorldToScreen(float worldX, float worldY, Vector2 worldScale)
        {
            return new Vector2(worldX * worldScale.X, worldY * worldScale.Y);
        }

        protected Color GetColor(int colorId)
        {
            return colorId switch
            {
                1 => new Color(0, 1, 0, 1),       // Green
                2 => new Color(1, 1, 0, 1),       // Yellow
                3 => new Color(1, 0, 1, 1),       // Magenta
                4 => new Color(0, 1, 1, 1),       // Cyan
                5 => new Color(1, 0, 0, 1),       // Red
                _ => Colors.White
            };
        }
    }

    /// <summary>
    /// Generic space entity renderer.
    /// </summary>
    public partial class SpaceEntityRenderer : EntityRenderer
    {
        public override void Render(CanvasItem canvas, EntityDTO entity, Vector2 worldScale)
        {
            if (entity == null)
                return;

            var screenPos = WorldToScreen(entity.X, entity.Y, worldScale);
            float screenRadius = entity.Radius * worldScale.X;

            Color color = GetColor(entity.Color ?? 1);
            canvas.DrawCircle(screenPos, screenRadius, color);
        }
    }

    /// <summary>
    /// Ship renderer (rotated triangle).
    /// </summary>
    public partial class ShipRenderer : EntityRenderer
    {
        public override void Render(CanvasItem canvas, EntityDTO entity, Vector2 worldScale)
        {
            if (entity == null)
                return;

            var screenPos = WorldToScreen(entity.X, entity.Y, worldScale);
            float screenRadius = entity.Radius * worldScale.X;
            float angle = entity.Angle;

            // Ship as triangle pointing in direction
            Vector2 front = screenPos + new Vector2(Mathf.Cos(angle), Mathf.Sin(angle)) * screenRadius;
            Vector2 left = screenPos + new Vector2(Mathf.Cos(angle + 2.4f), Mathf.Sin(angle + 2.4f)) * (screenRadius * 0.7f);
            Vector2 right = screenPos + new Vector2(Mathf.Cos(angle - 2.4f), Mathf.Sin(angle - 2.4f)) * (screenRadius * 0.7f);

            Color color = GetColor(entity.Color ?? 1);
            var points = new Vector2[] { front, left, right };
            canvas.DrawColoredPolygon(points, color);

            // Draw direction indicator
            canvas.DrawLine(screenPos, front, color, 1.0f);
        }
    }

    /// <summary>
    /// Asteroid renderer (circle with rotation).
    /// </summary>
    public partial class AsteroidRenderer : EntityRenderer
    {
        public override void Render(CanvasItem canvas, EntityDTO entity, Vector2 worldScale)
        {
            if (entity == null)
                return;

            var screenPos = WorldToScreen(entity.X, entity.Y, worldScale);
            float screenRadius = entity.Radius * worldScale.X;

            Color color = GetColor(entity.Color ?? 2);
            canvas.DrawCircle(screenPos, screenRadius, color);

            // Draw outline
            canvas.DrawCircle(screenPos, screenRadius, Colors.Transparent);
        }
    }

    /// <summary>
    /// Projectile renderer (small bright dot).
    /// </summary>
    public partial class ProjectileRenderer : EntityRenderer
    {
        public override void Render(CanvasItem canvas, EntityDTO entity, Vector2 worldScale)
        {
            if (entity == null)
                return;

            var screenPos = WorldToScreen(entity.X, entity.Y, worldScale);
            float screenRadius = Mathf.Max(1, entity.Radius * worldScale.X);

            Color color = GetColor(entity.Color ?? 3);
            canvas.DrawCircle(screenPos, screenRadius, color);

            // Draw bright trail
            var trailStart = screenPos - new Vector2(entity.Vx, entity.Vy) * 2;
            canvas.DrawLine(trailStart, screenPos, color, 0.5f);
        }
    }
}
