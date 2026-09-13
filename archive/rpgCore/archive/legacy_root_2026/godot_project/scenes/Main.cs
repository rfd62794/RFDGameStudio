using Godot;
using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Collections.Generic;
using System.Threading;
using Newtonsoft.Json;

namespace rpgCore.Godot.Scenes;

public partial class Main : Node2D
{
	private TcpListener _server;
	private TcpClient _client;
	private NetworkStream _stream;
	private Thread _listenThread;
	private bool _isRunning = false;

	private List<EntityData> _entities = new();
	private Dictionary<string, string> _hudData = new();

	public override void _Ready()
	{
		GD.Print("=== rpgCore NEAT Asteroids Demo ===");
		GD.Print("Starting TCP server on port 9001...");

		StartServer();
	}

	private void StartServer()
	{
		try
		{
			_server = new TcpListener(IPAddress.Parse("127.0.0.1"), 9001);
			_server.Start();
			_isRunning = true;

			GD.Print("[GameServer] Listening on localhost:9001");

			_listenThread = new Thread(ListenForConnection)
			{
				IsBackground = true
			};
			_listenThread.Start();
		}
		catch (Exception e)
		{
			GD.PrintErr($"[GameServer] Failed to start: {e.Message}");
		}
	}

	private void ListenForConnection()
	{
		try
		{
			GD.Print("[GameServer] Waiting for Python engine...");
			_client = _server.AcceptTcpClient();
			_stream = _client.GetStream();
			GD.Print("[GameServer] Python engine connected!");

			byte[] buffer = new byte[65536];
			while (_isRunning && _client.Connected)
			{
				if (_stream.DataAvailable)
				{
					int bytes = _stream.Read(buffer, 0, buffer.Length);
					string message = Encoding.UTF8.GetString(buffer, 0, bytes);
					ProcessMessage(message);
				}
				Thread.Sleep(1);
			}
		}
		catch (Exception e)
		{
			GD.PrintErr($"[GameServer] Connection error: {e.Message}");
		}
	}

	private void ProcessMessage(string json)
	{
		try
		{
			var data = JsonConvert.DeserializeObject<Dictionary<string, object>>(json);

			if (data.ContainsKey("entities"))
			{
				var entitiesJson = data["entities"].ToString();
				_entities = JsonConvert.DeserializeObject<List<EntityData>>(entitiesJson);
				QueueRedraw();
			}

			if (data.ContainsKey("hud"))
			{
				var hudJson = data["hud"].ToString();
				_hudData = JsonConvert.DeserializeObject<Dictionary<string, string>>(hudJson);
			}
		}
		catch (Exception e)
		{
			GD.PrintErr($"[GameServer] Parse error: {e.Message}");
		}
	}

	public override void _Draw()
	{
		// Clear background
		DrawRect(new Rect2(0, 0, 640, 576), Colors.Black, true);

		// Draw entities
		foreach (var entity in _entities)
		{
			if (!entity.active) continue;

			Vector2 pos = new Vector2(entity.x * 4, entity.y * 4); // Scale 160x144 to 640x576

			if (entity.type == "ship")
			{
				// Green triangle for ship
				Vector2[] points = new Vector2[]
				{
					pos + new Vector2(0, -10).Rotated(entity.heading),
					pos + new Vector2(-7, 7).Rotated(entity.heading),
					pos + new Vector2(7, 7).Rotated(entity.heading)
				};
				DrawColoredPolygon(points, Colors.Green);
			}
			else if (entity.type == "asteroid")
			{
				// Yellow circle for asteroid
				DrawCircle(pos, entity.radius * 4, Colors.Yellow);
			}
			else if (entity.type == "projectile")
			{
				// White dot for projectile
				DrawCircle(pos, 2, Colors.White);
			}
		}

		// Draw HUD
		int yOffset = 10;
		foreach (var kvp in _hudData)
		{
			DrawString(ThemeDB.FallbackFont, new Vector2(10, yOffset),
				$"{kvp.Key}: {kvp.Value}", HorizontalAlignment.Left, -1, 16, Colors.White);
			yOffset += 20;
		}
	}

	public override void _ExitTree()
	{
		_isRunning = false;
		_stream?.Close();
		_client?.Close();
		_server?.Stop();
		GD.Print("[GameServer] Shutdown complete");
	}
}

public class EntityData
{
	public string id { get; set; }
	public string type { get; set; }
	public float x { get; set; }
	public float y { get; set; }
	public float vx { get; set; }
	public float vy { get; set; }
	public float heading { get; set; }
	public float radius { get; set; }
	public bool active { get; set; }
}
