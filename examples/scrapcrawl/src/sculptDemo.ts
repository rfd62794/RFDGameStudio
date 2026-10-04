import dotenv from "dotenv";
dotenv.config();

import { initPlayer } from "./state";
import { RealGeminiClient, sculptRoomIfNeeded } from "./llmContent";
import { Room } from "./types";

async function runDemo() {
  console.log("=== Phase 4 Sculpt Demo ===");
  const room: Room = {
    id: "scrap_pit",
    name: "Scrap Pit",
    interactionTypes: ["fight"],
    connections: [],
    difficulty: 8
  };

  const player = initPlayer();
  const client = new RealGeminiClient();
  
  console.log("Calling sculptRoomIfNeeded for room: scrap_pit...");
  const updatedPlayer = await sculptRoomIfNeeded(player, room, client);
  
  console.log("\nUpdated Player State after sculpting:");
  console.log(JSON.stringify(updatedPlayer, null, 2));
}

runDemo().catch(err => {
  console.error("Demo failed:", err);
});
