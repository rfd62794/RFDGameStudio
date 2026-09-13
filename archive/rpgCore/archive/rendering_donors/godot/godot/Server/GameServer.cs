/*
Generalized Game Server for Godot
Handles IPC communication with Python game engine
Supports multiple game types: Space, RPG, Tycoon

SOLID Principle: Single Responsibility
- Only responsible for IPC server and message routing
- Delegates rendering to GameRenderer
- Delegates entity sync to EntitySynchronizer
/*

using Godot;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;
using rpgCore.Godot.Models;

namespace rpgCore.Godot.Server
{
    /// <summary>
    /// Main game server handling Python↔Godot IPC communication.
    ///
    /// Responsibilities:
    /// - Accept connections from Python engine
    /// - Parse incoming messages (frame updates, game state)
    /// - Route messages to appropriate handlers
    /// - Send input commands back to Python
    /// - Manage connection lifecycle
    /// </summary>
    public class GameServer
    {
        private TcpListener? _listener;
        private TcpClient? _client;
        private NetworkStream? _stream;
        private Thread? _receiveThread;
        private Thread? _sendThread;

        private volatile bool _isRunning = false;
        private volatile bool _isConnected = false;

        private Queue<string> _sendQueue = new Queue<string>();
        private Queue<string> _receiveQueue = new Queue<string>();
        private object _sendLock = new object();
        private object _receiveLock = new object();

        public string Host { get; private set; }
        public int Port { get; private set; }

        // Event for frame updates received from Python
        public event Action<FrameUpdateMessage>? OnFrameUpdate;
        // Event for game state changes
        public event Action<GameStateDTO>? OnGameStateChange;
        // Event for connection state changes
        public event Action<bool>? OnConnectionStateChanged;

        public GameServer(string host = "localhost", int port = 9001)
        {
            Host = host;
            Port = port;
        }

        /// <summary>
        /// Start listening for Python engine connections.
        /// </summary>
        public bool StartServer()
        {
            if (_isRunning)
                return false;

            try
            {
                _listener = new TcpListener(IPAddress.Parse(Host), Port);
                _listener.Start();
                _isRunning = true;

                GD.Print($"[GameServer] Listening on {Host}:{Port}");

                // Start background thread to accept connections
                Thread acceptThread = new Thread(AcceptConnectionLoop)
                {
                    IsBackground = true,
                    Name = "GameServer-Accept"
                };
                acceptThread.Start();

                return true;
            }
            catch (Exception e)
            {
                GD.PrintErr($"[GameServer] Failed to start server: {e.Message}");
                _isRunning = false;
                return false;
            }
        }

        /// <summary>
        /// Accept incoming connections from Python engine.
        /// </summary>
        private void AcceptConnectionLoop()
        {
            while (_isRunning)
            {
                try
                {
                    if (_listener == null)
                        break;

                    _client = _listener.AcceptTcpClient();
                    _stream = _client.GetStream();

                    GD.Print("[GameServer] Python engine connected");
                    _isConnected = true;
                    OnConnectionStateChanged?.Invoke(true);

                    // Start receive and send threads
                    if (_receiveThread == null || !_receiveThread.IsAlive)
                    {
                        _receiveThread = new Thread(ReceiveLoop)
                        {
                            IsBackground = true,
                            Name = "GameServer-Receive"
                        };
                        _receiveThread.Start();
                    }

                    if (_sendThread == null || !_sendThread.IsAlive)
                    {
                        _sendThread = new Thread(SendLoop)
                        {
                            IsBackground = true,
                            Name = "GameServer-Send"
                        };
                        _sendThread.Start();
                    }

                    // Block until client disconnects
                    while (_isRunning && _client.Connected)
                    {
                        Thread.Sleep(100);
                    }

                    // Client disconnected
                    GD.Print("[GameServer] Python engine disconnected");
                    _isConnected = false;
                    OnConnectionStateChanged?.Invoke(false);

                    _stream?.Close();
                    _client?.Close();
                }
                catch (Exception e)
                {
                    if (_isRunning)
                        GD.PrintErr($"[GameServer] Connection error: {e.Message}");
                }
            }
        }

        /// <summary>
        /// Receive messages from Python engine.
        /// </summary>
        private void ReceiveLoop()
        {
            byte[] buffer = new byte[4096];

            while (_isRunning && _isConnected && _stream != null)
            {
                try
                {
                    int bytesRead = _stream.Read(buffer, 0, buffer.Length);

                    if (bytesRead == 0)
                    {
                        // Connection closed
                        _isConnected = false;
                        break;
                    }

                    string data = Encoding.UTF8.GetString(buffer, 0, bytesRead);

                    // Messages are newline-delimited
                    string[] messages = data.Split('\n', StringSplitOptions.RemoveEmptyEntries);

                    foreach (string message in messages)
                    {
                        if (string.IsNullOrWhiteSpace(message))
                            continue;

                        lock (_receiveLock)
                        {
                            _receiveQueue.Enqueue(message);
                        }
                    }
                }
                catch (Exception e)
                {
                    if (_isRunning && _isConnected)
                        GD.PrintErr($"[GameServer] Receive error: {e.Message}");
                    break;
                }
            }
        }

        /// <summary>
        /// Send messages to Python engine.
        /// </summary>
        private void SendLoop()
        {
            while (_isRunning && _isConnected && _stream != null)
            {
                try
                {
                    lock (_sendLock)
                    {
                        if (_sendQueue.Count > 0)
                        {
                            string message = _sendQueue.Dequeue();
                            byte[] data = Encoding.UTF8.GetBytes(message + "\n");
                            _stream.Write(data, 0, data.Length);
                            _stream.Flush();
                        }
                    }

                    Thread.Sleep(10); // Prevent busy-wait
                }
                catch (Exception e)
                {
                    if (_isRunning && _isConnected)
                        GD.PrintErr($"[GameServer] Send error: {e.Message}");
                    break;
                }
            }
        }

        /// <summary>
        /// Process received messages (call from main thread).
        /// </summary>
        public void ProcessMessages()
        {
            lock (_receiveLock)
            {
                while (_receiveQueue.Count > 0)
                {
                    string message = _receiveQueue.Dequeue();
                    HandleMessage(message);
                }
            }
        }

        /// <summary>
        /// Route message to appropriate handler based on type.
        /// </summary>
        private void HandleMessage(string jsonMessage)
        {
            try
            {
                var messageObj = JsonConvert.DeserializeObject<Dictionary<string, object>>(jsonMessage);

                if (messageObj == null)
                {
                    GD.PrintErr("[GameServer] Invalid message format");
                    return;
                }

                string? messageType = messageObj.ContainsKey("type")
                    ? messageObj["type"].ToString()
                    : null;

                switch (messageType)
                {
                    case "frame_update":
                        HandleFrameUpdate(messageObj);
                        break;

                    case "game_state":
                        HandleGameStateChange(messageObj);
                        break;

                    case "handshake":
                        HandleHandshake(messageObj);
                        break;

                    case "ack":
                        // Acknowledgment - no action needed
                        break;

                    default:
                        GD.PrintErr($"[GameServer] Unknown message type: {messageType}");
                        break;
                }
            }
            catch (Exception e)
            {
                GD.PrintErr($"[GameServer] Message handling error: {e.Message}");
            }
        }

        /// <summary>
        /// Handle frame update from Python (entity positions, states).
        /// </summary>
        private void HandleFrameUpdate(Dictionary<string, object> message)
        {
            try
            {
                var frameUpdate = new FrameUpdateMessage
                {
                    Timestamp = Convert.ToDouble(message.GetValueOrDefault("timestamp", 0.0)),
                    FrameNumber = Convert.ToInt32(message.GetValueOrDefault("frame_number", 0)),
                    Entities = new List<EntityDTO>(),
                    Particles = new List<ParticleEmitterDTO>(),
                    HUD = null
                };

                // Parse entities
                if (message.TryGetValue("entities", out var entitiesObj))
                {
                    var entitiesJson = JsonConvert.SerializeObject(entitiesObj);
                    frameUpdate.Entities = JsonConvert.DeserializeObject<List<EntityDTO>>(entitiesJson) ?? new List<EntityDTO>();
                }

                // Parse particles
                if (message.TryGetValue("particles", out var particlesObj))
                {
                    var particlesJson = JsonConvert.SerializeObject(particlesObj);
                    frameUpdate.Particles = JsonConvert.DeserializeObject<List<ParticleEmitterDTO>>(particlesJson) ?? new List<ParticleEmitterDTO>();
                }

                // Parse HUD
                if (message.TryGetValue("hud", out var hudObj))
                {
                    var hudJson = JsonConvert.SerializeObject(hudObj);
                    frameUpdate.HUD = JsonConvert.DeserializeObject<HUDStateDTO>(hudJson);
                }

                OnFrameUpdate?.Invoke(frameUpdate);
            }
            catch (Exception e)
            {
                GD.PrintErr($"[GameServer] Frame update error: {e.Message}");
            }
        }

        /// <summary>
        /// Handle game state changes (paused, game over, etc).
        /// </summary>
        private void HandleGameStateChange(Dictionary<string, object> message)
        {
            try
            {
                var stateJson = JsonConvert.SerializeObject(message);
                var gameState = JsonConvert.DeserializeObject<GameStateDTO>(stateJson);

                if (gameState != null)
                {
                    OnGameStateChange?.Invoke(gameState);
                }
            }
            catch (Exception e)
            {
                GD.PrintErr($"[GameServer] Game state change error: {e.Message}");
            }
        }

        /// <summary>
        /// Handle handshake from Python (connection verification).
        /// </summary>
        private void HandleHandshake(Dictionary<string, object> message)
        {
            GD.Print("[GameServer] Handshake received from Python");
            // Send acknowledgment
            SendMessage(new { type = "ack", status = "connected" });
        }

        /// <summary>
        /// Send a message to Python engine.
        /// </summary>
        public void SendMessage(object message)
        {
            if (!_isConnected)
            {
                GD.PrintErr("[GameServer] Not connected to Python engine");
                return;
            }

            try
            {
                string json = JsonConvert.SerializeObject(message);

                lock (_sendLock)
                {
                    _sendQueue.Enqueue(json);
                }
            }
            catch (Exception e)
            {
                GD.PrintErr($"[GameServer] Failed to send message: {e.Message}");
            }
        }

        /// <summary>
        /// Send input commands to Python engine.
        /// </summary>
        public void SendInputCommand(InputCommandDTO command)
        {
            SendMessage(new
            {
                type = "input_command",
                command_type = command.CommandType,
                timestamp = command.Timestamp,
                duration = command.Duration,
                intensity = command.Intensity
            });
        }

        /// <summary>
        /// Shutdown server and close connections.
        /// </summary>
        public void Shutdown()
        {
            _isRunning = false;

            _stream?.Close();
            _client?.Close();
            _listener?.Stop();

            GD.Print("[GameServer] Shutdown complete");
        }

        public bool IsConnected => _isConnected;
        public bool IsRunning => _isRunning;
    }

    /// <summary>
    /// Frame update message from Python engine.
    /// Contains all entity and visual state for current frame.
    /// </summary>
    public class FrameUpdateMessage
    {
        public double Timestamp { get; set; }
        public int FrameNumber { get; set; }
        public List<EntityDTO> Entities { get; set; } = new();
        public List<ParticleEmitterDTO> Particles { get; set; } = new();
        public HUDStateDTO? HUD { get; set; }
    }
}
