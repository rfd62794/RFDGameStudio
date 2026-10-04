import { PlayerState, Room, SculptedContent } from "./types";
import { GoogleGenAI, Type } from "@google/genai";

export interface GeminiClient {
  generateSculptedContent(prompt: string): Promise<unknown>;
}

export const DIFFICULTY_MODIFIER_BOUNDS: [number, number] = [-3, 3];
export const REWARD_MODIFIER_BOUNDS: [number, number] = [-2, 2];

export function validateSculptedContent(raw: unknown): SculptedContent | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const obj = raw as Record<string, any>;
  
  if (typeof obj.flavorText !== "string" || obj.flavorText.trim() === "") {
    return null;
  }
  
  if (typeof obj.difficultyModifier !== "number" || !Number.isFinite(obj.difficultyModifier)) {
    return null;
  }
  
  if (typeof obj.rewardModifier !== "number" || !Number.isFinite(obj.rewardModifier)) {
    return null;
  }
  
  if (obj.difficultyModifier < DIFFICULTY_MODIFIER_BOUNDS[0] || obj.difficultyModifier > DIFFICULTY_MODIFIER_BOUNDS[1]) {
    return null;
  }
  
  if (obj.rewardModifier < REWARD_MODIFIER_BOUNDS[0] || obj.rewardModifier > REWARD_MODIFIER_BOUNDS[1]) {
    return null;
  }
  
  return {
    flavorText: obj.flavorText,
    difficultyModifier: obj.difficultyModifier,
    rewardModifier: obj.rewardModifier,
    source: "llm"
  };
}

export function fallbackContent(room: Room): SculptedContent {
  const name = room.name || room.id;
  let hash = 0;
  const key = room.id;
  for (let i = 0; i < key.length; i++) {
    hash += key.charCodeAt(i);
  }
  const difficultyModifier = (hash % 7) - 3; // [-3, 3]
  const rewardModifier = (hash % 5) - 2;     // [-2, 2]
  
  return {
    flavorText: `The air in ${name} grows thick with static electricity. A standard scrap crawler unit lies inactive.`,
    difficultyModifier,
    rewardModifier,
    source: "fallback"
  };
}

export async function sculptRoomIfNeeded(
  player: PlayerState,
  room: Room,
  client: GeminiClient
): Promise<PlayerState> {
  if (player.sculptedCache[room.id]) {
    return player;
  }
  
  let content: SculptedContent | null = null;
  try {
    const raw = await client.generateSculptedContent(`Sculpt a fight encounter in the room called ${room.name || room.id}.`);
    content = validateSculptedContent(raw);
  } catch (err) {
    // Silently proceed to fallback on any exception
  }
  
  if (!content) {
    content = fallbackContent(room);
  }
  
  return {
    ...player,
    sculptedCache: {
      ...player.sculptedCache,
      [room.id]: content
    }
  };
}

export class RealGeminiClient implements GeminiClient {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  async generateSculptedContent(prompt: string): Promise<unknown> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flavorText: {
              type: Type.STRING,
              description: "Flavor text describing the fight encounter.",
            },
            difficultyModifier: {
              type: Type.INTEGER,
              description: "Difficulty modifier from -3 to 3.",
            },
            rewardModifier: {
              type: Type.INTEGER,
              description: "Reward modifier from -2 to 2.",
            },
          },
          required: ["flavorText", "difficultyModifier", "rewardModifier"],
        },
      },
    });

    if (!response.text) {
      throw new Error("No response text returned from Gemini");
    }

    return JSON.parse(response.text.trim());
  }
}
