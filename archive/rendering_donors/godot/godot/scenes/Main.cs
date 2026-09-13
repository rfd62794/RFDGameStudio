/*
Main Game Scene Orchestrator
Entry point for Godot application
Coordinates: Server, Renderer, Input handling

SOLID Principle: Single Responsibility
- Only responsible for scene lifecycle and top-level coordination
- Delegates to GameServer for IPC
- Delegates to GameEntityRenderer for rendering
/*

using Godot;
using System;
using rpgCore.Godot.Server;
using rpgCore.Godot.Rendering;
using rpgCore.Godot.Models;

namespace rpgCore.Godot.Scenes
{
    public partial class Main : Node
    {
        private GameServer? _gameServer;
        private GameEntityRenderer? _gameRenderer;
        private FrameUpdateMessage? _currentFrame;

        private string _pythonHost = "localhost";
        private int _pythonPort = 9001;
        private string _gameType = "space";

        private bool _isPaused = false;
        private float _deltaAccumulator = 0f;

        public override void _Ready()
        {
            GD.Print("=== rpgCore Godot Engine Starting ===");
            GD.Print($"Game Type: {_gameType}");

            InitializeRenderer();
            InitializeServer();

            GetTree().Root.GuiGetFocusOwner()?.QueueFree();
            GetWindow().GrabFocus();
        }

        /// <summary>
        /// Setup entity renderer.
        /// </summary>
        private void InitializeRenderer()
        {
            var canvas = GetNode<CanvasLayer>("GameCanvas");
            var gameRendererNode = GetNode<CanvasItem>("GameCanvas/GameRenderer");

            // Create renderer with game type
            _gameRenderer = new GameEntityRenderer();
            _gameRenderer.SetGameType(_gameType);
            _gameRenderer.SetViewport(160, 144);
            _gameRenderer.SetWorldScale(4, 4); // 4x upscaling from 160x144 to 640x576

            canvas.AddChild(_gameRenderer);

            GD.Print("[Main] Entity renderer initialized");
        }

        /// <summary>
        /// Setup IPC server.
        /// </summary>
        private void InitializeServer()
        {
            _gameServer = new GameServer(_pythonHost, _pythonPort);

            // Register event handlers
            _gameServer.OnFrameUpdate += HandleFrameUpdate;
            _gameServer.OnGameStateChange += HandleGameStateChange;
            _gameServer.OnConnectionStateChanged += HandleConnectionStateChange;

            if (_gameServer.StartServer())
            {
                GD.Print("[Main] Game server started successfully");
                // Send initial handshake
                _gameServer.SendMessage(new
                {
                    type = "handshake",
                    game_type = _gameType,
                    godot_version = Engine.GetVersionInfo()["string"],
                    timestamp = OS.GetTicksMsec() / 1000.0
                });
            }
            else
            {
                GD.PrintErr("[Main] Failed to start game server");
            }
        }

        /// <summary>
        /// Frame update from Python engine.
        /// </summary>
        private void HandleFrameUpdate(FrameUpdateMessage frameUpdate)
        {
            _currentFrame = frameUpdate;

            if (_gameRenderer != null)
            {
                _gameRenderer.RenderFrame(frameUpdate);
            }
        }

        /// <summary>
        /// Game state change (paused, game over, etc).
        /// </summary>
        private void HandleGameStateChange(GameStateDTO gameState)
        {
            if (gameState == null)
                return;

            string state = gameState.State ?? "unknown";

            GD.Print($"[Main] Game state changed: {state}");

            switch (state)
            {
                case "paused":
                    _isPaused = true;
                    GetTree().Paused = true;
                    break;

                case "playing":
                    _isPaused = false;
                    GetTree().Paused = false;
                    break;

                case "game_over":
                    HandleGameOver(gameState);
                    break;

                case "shutdown":
                    GetTree().Quit();
                    break;
            }
        }

        /// <summary>
        /// Handle game over state.
        /// </summary>
        private void HandleGameOver(GameStateDTO gameState)
        {
            GD.Print("[Main] Game Over!");
            GD.Print($"Final Score: {gameState.Score}");

            // Display game over message
            GetTree().Paused = true;
            // TODO: Show game over UI
        }

        /// <summary>
        /// Connection state change.
        /// </summary>
        private void HandleConnectionStateChange(bool isConnected)
        {
            if (isConnected)
            {
                GD.Print("[Main] Connected to Python engine");
            }
            else
            {
                GD.Print("[Main] Disconnected from Python engine");
                // Optionally shutdown Godot or show reconnect UI
            }
        }

        public override void _Process(double delta)
        {
            if (_gameServer == null)
                return;

            // Process incoming messages from Python
            _gameServer.ProcessMessages();

            // Handle input and send to Python
            HandleInput();

            _deltaAccumulator += (float)delta;
        }

        /// <summary>
        /// Handle player input and send to Python.
        /// </summary>
        private void HandleInput()
        {
            if (_gameServer == null || !_gameServer.IsConnected)
                return;

            // Thrust
            if (Input.IsActionPressed("ui_up"))
            {
                var cmd = new InputCommandDTO
                {
                    CommandType = "thrust",
                    Timestamp = Time.GetTicksMsec() / 1000.0,
                    Intensity = Input.GetActionStrength("ui_up")
                };
                _gameServer.SendInputCommand(cmd);
            }

            // Rotate Left
            if (Input.IsActionPressed("ui_left"))
            {
                var cmd = new InputCommandDTO
                {
                    CommandType = "rotate_left",
                    Timestamp = Time.GetTicksMsec() / 1000.0,
                    Intensity = 1.0f
                };
                _gameServer.SendInputCommand(cmd);
            }

            // Rotate Right
            if (Input.IsActionPressed("ui_right"))
            {
                var cmd = new InputCommandDTO
                {
                    CommandType = "rotate_right",
                    Timestamp = Time.GetTicksMsec() / 1000.0,
                    Intensity = 1.0f
                };
                _gameServer.SendInputCommand(cmd);
            }

            // Fire
            if (Input.IsActionJustPressed("ui_select"))
            {
                var cmd = new InputCommandDTO
                {
                    CommandType = "fire",
                    Timestamp = Time.GetTicksMsec() / 1000.0,
                    Duration = 0.05f,
                    Intensity = 1.0f
                };
                _gameServer.SendInputCommand(cmd);
            }

            // Pause
            if (Input.IsActionJustPressed("ui_cancel"))
            {
                var cmd = new InputCommandDTO
                {
                    CommandType = _isPaused ? "resume" : "pause",
                    Timestamp = Time.GetTicksMsec() / 1000.0
                };
                _gameServer.SendInputCommand(cmd);
            }

            // Quit
            if (Input.IsActionJustPressed("ui_focus_next"))
            {
                var cmd = new InputCommandDTO
                {
                    CommandType = "quit",
                    Timestamp = Time.GetTicksMsec() / 1000.0
                };
                _gameServer.SendInputCommand(cmd);
                GetTree().Quit();
            }
        }

        public override void _ExitTree()
        {
            GD.Print("[Main] Shutting down");
            _gameServer?.Shutdown();
        }
    }
}
