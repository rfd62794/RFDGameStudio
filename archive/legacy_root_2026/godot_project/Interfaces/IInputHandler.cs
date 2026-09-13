using System;
using System.Collections.Generic;
using rpgCore.Godot.Models;

namespace rpgCore.Godot.Input {
    /// <summary>
    /// Input handler interface - abstracts input source.
    /// Can be implemented by Godot input, mock inputs, or network inputs.
    ///
    /// SOLID Principle: Interface Segregation
    /// - Clients only depend on the input queue operations they need
    /// - No methods for rendering, physics, etc. - focused responsibility
    /// </summary>
    public interface IInputHandler {
        /// <summary>
        /// Get all pending input commands from the queue.
        /// </summary>
        Queue<InputCommandDTO> GetPendingInputs();

        /// <summary>
        /// Clear the input queue.
        /// </summary>
        void ClearInputQueue();
    }
}
