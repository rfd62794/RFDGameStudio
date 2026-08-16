import { ARCHETYPES } from '../data/archetypes';
import { ArchetypeId } from '../types';

export async function matchRequestedCharacter(requestName: string): Promise<ArchetypeId> {
  const cleanInput = requestName.trim().toLowerCase();

  if (!cleanInput) return 'pony';

  // 1. Local keyword check
  for (const [id, archetype] of Object.entries(ARCHETYPES)) {
    for (const keyword of archetype.keywords) {
      if (cleanInput.includes(keyword) || keyword.includes(cleanInput)) {
        return id as ArchetypeId;
      }
    }
  }

  // Common specific mappings
  if (cleanInput.match(/unic|pegas|twilight|dash|pinkie|horse|flutter|rarity|applejack|horse/i)) {
    return 'pony';
  }
  if (cleanInput.match(/char|drago|fire|ember|lizard|reptile|monster|wing|puff/i)) {
    return 'dragon';
  }
  if (cleanInput.match(/hero|bat|spider|avenger|iron|cap|shield|warrior|knight|ninja|power/i)) {
    return 'hero';
  }
  if (cleanInput.match(/fair|pix|tinker|sprite|angel|glitter|magic|wand|bloom|star/i)) {
    return 'fairy';
  }
  if (cleanInput.match(/dino|rex|tri|bronto|stego|raptor|jaw|fossil|jurassic/i)) {
    return 'dino';
  }
  if (cleanInput.match(/bot|robot|cyber|cyborg|mech|transformer|beep|r2|bb8|wall-e|droid/i)) {
    return 'robot';
  }

  // 2. Optional server classification call if online
  try {
    const res = await fetch('/api/classify-character', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestName }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.archetypeId && ARCHETYPES[data.archetypeId]) {
        return data.archetypeId as ArchetypeId;
      }
    }
  } catch {
    // Fallback if API route unavailable
  }

  // Default fallback based on string length / hash
  const keys: ArchetypeId[] = ['pony', 'dragon', 'hero', 'fairy', 'dino', 'robot'];
  const hash = cleanInput.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return keys[hash % keys.length];
}
