using System;

namespace rpgCore.Godot.GameLogic {
    /// <summary>
    /// Game state provider interface - abstracts game logic source.
    /// Can be implemented by Python bridge, mock data, or recordings.
    ///
    /// SOLID Principle: Dependency Inversion
    /// - AsteroidsGame depends on this interface, not PythonAsteroidsProvider
    /// - Enables testing with mock game state
    /// </summary>
    public interface IGameStateProvider {
        /// <summary>
        /// Initialize the game state provider (connect to Python, load data, etc.)
        /// </summary>
        Result<bool> Initialize();

        /// <summary>
        /// Get the current game state.
        /// </summary>
        GameStateDTO GetCurrentState();

        /// <summary>
        /// Update game state with an input command and return new state.
        /// </summary>
        Result<GameStateDTO> UpdateState(InputCommandDTO input);

        /// <summary>
        /// Shutdown the provider (close connections, cleanup, etc.)
        /// </summary>
        Result<bool> Shutdown();
    }
}
