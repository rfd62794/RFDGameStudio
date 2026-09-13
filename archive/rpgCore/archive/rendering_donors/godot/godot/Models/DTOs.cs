using Godot;
using System;
using System.Collections.Generic;

namespace rpgCore.Godot.Models {
    /// <summary>
    /// Data Transfer Objects for game state serialization.
    /// These bridge Python game logic with C# rendering.
    ///
    /// SOLID Principle: Single Responsibility
    /// - Each DTO represents one data concept
    /// - No business logic, pure data containers
    /// - Serializable to/from JSON
    /// </summary>

    /// <summary>Entity representation for transmission.</summary>
    [System.Serializable]
    public class EntityDTO {
        public string Id { get; set; }
        public string Type { get; set; }  // "ship", "asteroid", "bullet", etc.
        public float[] Position { get; set; }  // [x, y]
        public float[] Velocity { get; set; }  // [vx, vy]
        public float Heading { get; set; }  // Radians
        public float Radius { get; set; }
        public int Color { get; set; }  // Palette index
        public float[] Vertices { get; set; }  // Ship only
        public bool Active { get; set; }
        public float Age { get; set; }
        public float Lifetime { get; set; }

        public Vector2 GetPosition() => new Vector2(Position[0], Position[1]);
        public Vector2 GetVelocity() => new Vector2(Velocity[0], Velocity[1]);
    }

    /// <summary>HUD state for rendering.</summary>
    [System.Serializable]
    public class HUDStateDTO {
        public int Score { get; set; }
        public int Lives { get; set; }
        public int Wave { get; set; }
        public int AsteroidsRemaining { get; set; }
    }

    /// <summary>Complete game state for rendering.</summary>
    [System.Serializable]
    public class GameStateDTO {
        public float GameTime { get; set; }
        public EntityDTO[] Entities { get; set; }
        public int Score { get; set; }
        public int Lives { get; set; }
        public int Wave { get; set; }
        public bool GameOver { get; set; }
        public int AsteroidsRemaining { get; set; }
        public HUDStateDTO Hud { get; set; }
    }

    /// <summary>Input command from player.</summary>
    [System.Serializable]
    public class InputCommandDTO {
        public string Action { get; set; }  // "thrust", "rotate", "fire", "menu"
        public float Value { get; set; }  // -1.0 to 1.0
        public float Timestamp { get; set; }
    }

    /// <summary>Frame data for rendering.</summary>
    [System.Serializable]
    public class FrameDataDTO {
        public int Width { get; set; }  // 160
        public int Height { get; set; }  // 144
        public EntityDTO[] Entities { get; set; }
        public HUDStateDTO Hud { get; set; }
        public float Timestamp { get; set; }
        public RenderCommand[] Commands { get; set; }
    }

    /// <summary>Base render command.</summary>
    [System.Serializable]
    public abstract class RenderCommand {
        public string Type { get; set; }  // "circle", "polygon", "text"
    }

    /// <summary>Circle render command.</summary>
    [System.Serializable]
    public class CircleCommand : RenderCommand {
        public float[] Position { get; set; }  // [x, y]
        public float Radius { get; set; }
        public int[] Color { get; set; }  // [r, g, b]
        public bool Fill { get; set; }
        public float StrokeWidth { get; set; }

        public Vector2 GetPosition() => new Vector2(Position[0], Position[1]);
        public Color GetColor() => new Color(Color[0] / 255f, Color[1] / 255f, Color[2] / 255f);
    }

    /// <summary>Polygon render command.</summary>
    [System.Serializable]
    public class PolygonCommand : RenderCommand {
        public float[][] Vertices { get; set; }  // [[x1, y1], [x2, y2], ...]
        public int[] FillColor { get; set; }  // [r, g, b]
        public int[] StrokeColor { get; set; }  // [r, g, b]
        public float StrokeWidth { get; set; }

        public Vector2[] GetVertices() {
            var result = new Vector2[Vertices.Length];
            for (int i = 0; i < Vertices.Length; i++) {
                result[i] = new Vector2(Vertices[i][0], Vertices[i][1]);
            }
            return result;
        }

        public Color GetFillColor() => new Color(
            FillColor[0] / 255f,
            FillColor[1] / 255f,
            FillColor[2] / 255f
        );

        public Color GetStrokeColor() => new Color(
            StrokeColor[0] / 255f,
            StrokeColor[1] / 255f,
            StrokeColor[2] / 255f
        );
    }

    /// <summary>Text render command.</summary>
    [System.Serializable]
    public class TextCommand : RenderCommand {
        public float[] Position { get; set; }  // [x, y]
        public string Text { get; set; }
        public int[] Color { get; set; }  // [r, g, b]
        public int FontSize { get; set; }

        public Vector2 GetPosition() => new Vector2(Position[0], Position[1]);
        public Color GetColor() => new Color(Color[0] / 255f, Color[1] / 255f, Color[2] / 255f);
    }
}
