import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy Gemini client helper
  let genAIClient: GoogleGenAI | null = null;
  function getGenAI() {
    if (!genAIClient && process.env.GEMINI_API_KEY) {
      genAIClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return genAIClient;
  }

  // API Routes FIRST
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Classify character concept into generic archetypes
  app.post('/api/classify-character', async (req, res) => {
    try {
      const { requestName } = req.body;
      if (!requestName || typeof requestName !== 'string') {
        res.status(400).json({ error: 'requestName is required' });
        return;
      }

      const ai = getGenAI();
      if (!ai) {
        res.json({ archetypeId: null, message: 'Gemini key not configured, using client fallback' });
        return;
      }

      const prompt = `Classify this requested character/creature name: "${requestName}" into EXACTLY ONE of these 6 generic archetype IDs:
1. "pony" (for horses, ponies, unicorns, pegasus, winged horses, equestrian characters)
2. "dragon" (for dragons, monsters, fire-breathers, lizards, winged beasts)
3. "hero" (for superheroes, warriors, caped champions, defenders, knights)
4. "fairy" (for fairies, sprites, angels, pixies, magical floaters, wand wielders)
5. "dino" (for dinosaurs, T-Rex, prehistoric creatures, giant reptiles)
6. "robot" (for robots, bots, mechs, aliens, cyborgs, space droids)

Return ONLY a JSON object: {"archetypeId": "one_of_the_6_ids_here"}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '';
      const parsed = JSON.parse(text);
      res.json({ archetypeId: parsed.archetypeId || 'pony' });
    } catch (err) {
      console.error('Gemini classify error:', err);
      res.json({ archetypeId: null });
    }
  });

  // Encouragement generator endpoint
  app.post('/api/encourage', async (req, res) => {
    const { characterName = 'Friend', actionName = 'Special Move' } = req.body || {};
    try {
      const ai = getGenAI();
      if (!ai) {
        res.json({ quote: `Hooray! ${characterName} is doing the ${actionName}! You are awesome!` });
        return;
      }

      const prompt = `Write a short, super happy, encouraging 1-sentence message for a 6-year-old child who just earned their friend "${characterName}" doing the "${actionName}" action in a letter and word practice game. Keep it simple, fun, and warm.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      res.json({ quote: response.text?.trim() || `Awesome job! ${characterName} is doing ${actionName} for you!` });
    } catch {
      res.json({ quote: `Awesome job! ${characterName} loves doing ${actionName} with you!` });
    }
  });

  // Story generator endpoint for active practice buddies
  app.post('/api/generate-story', async (req, res) => {
    const { customName = 'Buddy', archetypeCategory = 'Magical Friend', archetypeDescription = 'A friendly companion', actionName = 'Special Trick' } = req.body || {};
    try {
      const ai = getGenAI();
      if (!ai) {
        res.json({
          setup: `${customName} wiggles with excitement and gets ready for a fun day with you!`,
          action: `${customName} leaps into the air and does the ${actionName}!`,
          reaction: `${customName} lands gently with a big smile and cheers for you!`,
        });
        return;
      }

      const prompt = `Write a very short, warm 3-part story for a 6-year-old, about
an ORIGINAL character named "${customName}" who is a "${archetypeCategory}"
(${archetypeDescription}), doing the action "${actionName}".

This is an entirely original character with no connection to any existing
show, movie, game, or franchise, regardless of what its name resembles.
Do not reference, assume, or invent any pre-existing story, personality
traits, catchphrases, friends, or lore associated with that name from any
real media. Use only the traits given above.

Return ONLY a JSON object with exactly these three short fields, one
sentence each, simple words a 6-year-old would understand:
{"setup": "...", "action": "...", "reaction": "..."}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '';
      const parsed = JSON.parse(text);

      if (
        typeof parsed.setup === 'string' && parsed.setup.trim() &&
        typeof parsed.action === 'string' && parsed.action.trim() &&
        typeof parsed.reaction === 'string' && parsed.reaction.trim()
      ) {
        res.json({
          setup: parsed.setup.trim(),
          action: parsed.action.trim(),
          reaction: parsed.reaction.trim(),
        });
        return;
      }
    } catch (err) {
      console.error('Gemini story generation error:', err);
    }

    // Safe fallback
    res.json({
      setup: `${customName} wiggles with excitement and gets ready for a fun day with you!`,
      action: `${customName} leaps into the air and does the ${actionName}!`,
      reaction: `${customName} lands gently with a big smile and cheers for you!`,
    });
  });

  // Vite Middleware for Dev vs Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
