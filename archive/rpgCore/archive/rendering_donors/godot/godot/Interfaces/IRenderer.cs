using Godot;
using System;

namespace rpgCore.Godot.Rendering {
    /// <summary>
    /// Core rendering interface - abstracts rendering backend.
    /// Enables multiple implementations (Godot, Mock, Console, etc.)
    ///
    /// SOLID Principle: Dependency Inversion
    /// - High-level code depends on IRenderer, not concrete implementations
    /// - Allows testing with mock renderer
    /// </summary>
    public interface IRenderer {
        /// <summary>
        /// Clear the rendering surface with specified background color.
        /// </summary>
        void Clear(Color backgroundColor);

        /// <summary>
        /// Render a complete frame from game state data.
        /// </summary>
        void RenderFrame(FrameDataDTO frameData);

        /// <summary>
        /// Present the rendered frame to display (swap buffers, flip, etc.)
        /// </summary>
        void Present();

        /// <summary>
        /// Get the rendering surface dimensions.
        /// </summary>
        Vector2 GetScreenDimensions();
    }
}
