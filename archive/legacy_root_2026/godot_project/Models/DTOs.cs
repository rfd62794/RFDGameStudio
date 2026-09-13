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
        public string Type { get; set; }
        public float[] Position { get; set; }  // [x, y]
        public float[] Velocity { get; set; }  // [vx, vy]
        public float Angle { get; set; }  // Radians
        public float Radius { get; set; }
        public int? Color { get; set; }
        public float[] Vertices { get; set; }
        public bool Active { get; set; }
        public float Age { get; set; }
        public float Lifetime { get; set; }

        public Vector2 GetPosition() => new Vector2(X, Y);
        public Vector2 GetVelocity() => new Vector2(Vx, Vy);

        [Newtonsoft.Json.JsonIgnore]
        public float X => Position != null && Position.Length > 0 ? Position[0] : 0;
        [Newtonsoft.Json.JsonIgnore]
        public float Y => Position != null && Position.Length > 1 ? Position[1] : 0;
        [Newtonsoft.Json.JsonIgnore]
        public float Vx => Velocity != null && Velocity.Length > 0 ? Velocity[0] : 0;
        [Newtonsoft.Json.JsonIgnore]
        public float Vy => Velocity != null && Velocity.Length > 1 ? Velocity[1] : 0;
    }

    /// <summary>HUD state for rendering.</summary>
    [System.Serializable]
    public class HUDStateDTO {
        public int Score { get; set; }
        public int Lives { get; set; }
        public int Wave { get; set; }
        public int AsteroidsRemaining { get; set; }
        public string Status { get; set; }
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
        public string CommandType { get; set; }  // "thrust", "rotate", "fire", "menu"
        public float Value { get; set; }
        public float Timestamp { get; set; }
        public float Duration { get; set; }
        public float Intensity { get; set; }
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

    /// <summary>Particle emitter state.</summary>
    [System.Serializable]
    public class ParticleEmitterDTO {
        public float X { get; set; }
        public float Y { get; set; }
        public int ParticleCount { get; set; }
        public float Intensity { get; set; }
        public float SpreadRadius { get; set; }
    }

    /// <summary>Frame update message structure (matches GameServer usage).</summary>
    [System.Serializable]
    public class FrameUpdateMessage {
        public double Timestamp { get; set; }
        public int FrameNumber { get; set; }
        public List<EntityDTO> Entities { get; set; } = new();
        public List<ParticleEmitterDTO> Particles { get; set; } = new();
        public HUDStateDTO Hud { get; set; }
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
