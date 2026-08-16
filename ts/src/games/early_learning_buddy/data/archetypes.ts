import { Archetype, PracticeItem, ArchetypeId } from '../types';

export const ARCHETYPES: Record<string, Archetype> = {
  pony: {
    id: 'pony',
    name: 'Star Sparkle Pony',
    categoryName: 'Magical Pony',
    description: 'A gentle, winged pony with a glowing starry mane and rainbow energy.',
    keywords: ['pony', 'unicorn', 'pegasus', 'horse', 'twilight', 'sparkle', 'rainbow', 'flutter', 'alicorn'],
    primaryColor: '#c084fc', // Purple 400
    secondaryColor: '#f472b6', // Pink 400
    accentColor: '#fbbf24', // Amber 400
    bgGradient: 'from-purple-500/20 via-pink-500/20 to-amber-500/10',
    defaultActions: ['Galaxy Trot', 'Star Sparkle', 'Rainbow Jump'],
    variants: [
      { id: 'pony-starry', name: 'Starry Lavender', primaryColor: '#c084fc', secondaryColor: '#f472b6', accentColor: '#fbbf24', bgGradient: 'from-purple-500/20 via-pink-500/20 to-amber-500/10' },
      { id: 'pony-sky', name: 'Sky Cloud', primaryColor: '#38bdf8', secondaryColor: '#818cf8', accentColor: '#fef08a', bgGradient: 'from-sky-500/20 via-indigo-500/20 to-yellow-500/10' },
      { id: 'pony-sunbeam', name: 'Sunbeam Gold', primaryColor: '#fbbf24', secondaryColor: '#f472b6', accentColor: '#a855f7', bgGradient: 'from-amber-500/20 via-pink-500/20 to-purple-500/10' },
      { id: 'pony-twilight', name: 'Midnight Violet', primaryColor: '#818cf8', secondaryColor: '#e879f9', accentColor: '#34d399', bgGradient: 'from-indigo-500/20 via-fuchsia-500/20 to-emerald-500/10' },
    ],
  },
  dragon: {
    id: 'dragon',
    name: 'Friendly Ember Dragon',
    categoryName: 'Chubby Dragon',
    description: 'A cozy dragon with soft wings, gentle flame puffs, and a big cheerful grin.',
    keywords: ['dragon', 'charizard', 'monster', 'fire', 'ember', 'lizard', 'drake', 'wings', 'flame'],
    primaryColor: '#34d399', // Emerald 400
    secondaryColor: '#f97316', // Orange 500
    accentColor: '#facc15', // Yellow 400
    bgGradient: 'from-emerald-500/20 via-teal-500/20 to-amber-500/10',
    defaultActions: ['Happy Roar', 'Ember Sparkle', 'Sky Float'],
    variants: [
      { id: 'dragon-emerald', name: 'Cozy Emerald', primaryColor: '#34d399', secondaryColor: '#f97316', accentColor: '#facc15', bgGradient: 'from-emerald-500/20 via-teal-500/20 to-amber-500/10' },
      { id: 'dragon-ruby', name: 'Flame Ruby', primaryColor: '#f87171', secondaryColor: '#fbbf24', accentColor: '#a855f7', bgGradient: 'from-red-500/20 via-amber-500/20 to-purple-500/10' },
      { id: 'dragon-sapphire', name: 'Ocean Sapphire', primaryColor: '#38bdf8', secondaryColor: '#a7f3d0', accentColor: '#fbbf24', bgGradient: 'from-sky-500/20 via-emerald-500/20 to-amber-500/10' },
      { id: 'dragon-sunshine', name: 'Golden Amber', primaryColor: '#fbbf24', secondaryColor: '#f97316', accentColor: '#34d399', bgGradient: 'from-amber-500/20 via-orange-500/20 to-emerald-500/10' },
    ],
  },
  hero: {
    id: 'hero',
    name: 'Cosmic Hero',
    categoryName: 'Super Hero',
    description: 'A brave superhero friend with a flying cape and star power boots.',
    keywords: ['hero', 'superhero', 'captain', 'warrior', 'defender', 'batman', 'spiderman', 'avenger', 'shield'],
    primaryColor: '#3b82f6', // Blue 500
    secondaryColor: '#ef4444', // Red 500
    accentColor: '#facc15', // Yellow 400
    bgGradient: 'from-blue-500/20 via-indigo-500/20 to-red-500/10',
    defaultActions: ['Hero Pose', 'Star Beam', 'Cape Fly'],
    variants: [
      { id: 'hero-cosmic', name: 'Cosmic Blue', primaryColor: '#3b82f6', secondaryColor: '#ef4444', accentColor: '#facc15', bgGradient: 'from-blue-500/20 via-indigo-500/20 to-red-500/10' },
      { id: 'hero-crimson', name: 'Crimson Flame', primaryColor: '#ef4444', secondaryColor: '#fbbf24', accentColor: '#38bdf8', bgGradient: 'from-red-500/20 via-amber-500/20 to-sky-500/10' },
      { id: 'hero-emerald', name: 'Neon Defender', primaryColor: '#10b981', secondaryColor: '#8b5cf6', accentColor: '#facc15', bgGradient: 'from-emerald-500/20 via-purple-500/20 to-yellow-500/10' },
      { id: 'hero-shadow', name: 'Galaxy Knight', primaryColor: '#6366f1', secondaryColor: '#ec4899', accentColor: '#fef08a', bgGradient: 'from-indigo-500/20 via-pink-500/20 to-yellow-500/10' },
    ],
  },
  fairy: {
    id: 'fairy',
    name: 'Glitter Fairy Sprite',
    categoryName: 'Magic Fairy',
    description: 'A whimsical magical fairy who leaves trails of shimmering stardust wherever she floats.',
    keywords: ['fairy', 'sprite', 'angel', 'pixie', 'magic', 'glitter', 'tinkerbell', 'wand', 'wings'],
    primaryColor: '#f472b6', // Pink 400
    secondaryColor: '#a855f7', // Purple 500
    accentColor: '#38bdf8', // Sky 400
    bgGradient: 'from-pink-500/20 via-fuchsia-500/20 to-sky-500/10',
    defaultActions: ['Magic Dust', 'Twirl Dance', 'Glow Float'],
    variants: [
      { id: 'fairy-glitter', name: 'Pink Stardust', primaryColor: '#f472b6', secondaryColor: '#a855f7', accentColor: '#38bdf8', bgGradient: 'from-pink-500/20 via-fuchsia-500/20 to-sky-500/10' },
      { id: 'fairy-forest', name: 'Forest Sprite', primaryColor: '#34d399', secondaryColor: '#f472b6', accentColor: '#facc15', bgGradient: 'from-emerald-500/20 via-pink-500/20 to-yellow-500/10' },
      { id: 'fairy-sunlight', name: 'Golden Pixie', primaryColor: '#fbbf24', secondaryColor: '#f472b6', accentColor: '#a7f3d0', bgGradient: 'from-amber-500/20 via-pink-500/20 to-emerald-500/10' },
      { id: 'fairy-moonlight', name: 'Moonlight Glow', primaryColor: '#818cf8', secondaryColor: '#f472b6', accentColor: '#fef08a', bgGradient: 'from-indigo-500/20 via-pink-500/20 to-yellow-500/10' },
    ],
  },
  dino: {
    id: 'dino',
    name: 'Sunny Dino Pal',
    categoryName: 'Playful Dino',
    description: 'A happy polka-dot dinosaur who loves stomping, wiggling, and eating berries.',
    keywords: ['dino', 'dinosaur', 't-rex', 'rex', 'bronto', 'fossil', 'prehistoric', 'reptile', 'stomp'],
    primaryColor: '#84cc16', // Lime 500
    secondaryColor: '#06b6d4', // Cyan 500
    accentColor: '#f97316', // Orange 500
    bgGradient: 'from-lime-500/20 via-emerald-500/20 to-cyan-500/10',
    defaultActions: ['Dino Stomp', 'Tail Wiggle', 'Berry Crunch'],
    variants: [
      { id: 'dino-sunny', name: 'Sunny Lime', primaryColor: '#84cc16', secondaryColor: '#06b6d4', accentColor: '#f97316', bgGradient: 'from-lime-500/20 via-emerald-500/20 to-cyan-500/10' },
      { id: 'dino-berry', name: 'Berry Sweet', primaryColor: '#f472b6', secondaryColor: '#fbbf24', accentColor: '#34d399', bgGradient: 'from-pink-500/20 via-amber-500/20 to-emerald-500/10' },
      { id: 'dino-ocean', name: 'Aqua Splash', primaryColor: '#06b6d4', secondaryColor: '#a3e635', accentColor: '#fbbf24', bgGradient: 'from-cyan-500/20 via-lime-500/20 to-amber-500/10' },
      { id: 'dino-volcano', name: 'Fiery Orange', primaryColor: '#f97316', secondaryColor: '#ef4444', accentColor: '#facc15', bgGradient: 'from-orange-500/20 via-red-500/20 to-yellow-500/10' },
    ],
  },
  robot: {
    id: 'robot',
    name: 'Beep Bot Buddy',
    categoryName: 'Space Robot',
    description: 'A friendly futuristic robot with bouncing antenna lights and a glowing heart core.',
    keywords: ['robot', 'bot', 'space', 'alien', 'cyber', 'mech', 'beep', 'transformer', 'droid'],
    primaryColor: '#06b6d4', // Cyan 500
    secondaryColor: '#6366f1', // Indigo 500
    accentColor: '#f43f5e', // Rose 500
    bgGradient: 'from-cyan-500/20 via-blue-500/20 to-indigo-500/10',
    defaultActions: ['Robot Dance', 'Beep Spin', 'Heart Glow'],
    variants: [
      { id: 'robot-cyan', name: 'Neon Cyan', primaryColor: '#06b6d4', secondaryColor: '#6366f1', accentColor: '#f43f5e', bgGradient: 'from-cyan-500/20 via-blue-500/20 to-indigo-500/10' },
      { id: 'robot-gold', name: 'Solar Gold', primaryColor: '#eab308', secondaryColor: '#f97316', accentColor: '#06b6d4', bgGradient: 'from-yellow-500/20 via-orange-500/20 to-cyan-500/10' },
      { id: 'robot-violet', name: 'Quantum Violet', primaryColor: '#a855f7', secondaryColor: '#ec4899', accentColor: '#38bdf8', bgGradient: 'from-purple-500/20 via-pink-500/20 to-sky-500/10' },
      { id: 'robot-mint', name: 'Bio Mint', primaryColor: '#10b981', secondaryColor: '#3b82f6', accentColor: '#facc15', bgGradient: 'from-emerald-500/20 via-blue-500/20 to-amber-500/10' },
    ],
  },
};

export const INITIAL_LETTERS: PracticeItem[] = [
  { id: 'let-a', target: 'A', category: 'letter', audioPrompt: 'Can you say or type the letter A?', hint: 'A is for Apple!', options: ['A', 'B', 'C', 'D'], difficulty: 'easy' },
  { id: 'let-b', target: 'B', category: 'letter', audioPrompt: 'Can you say or type the letter B?', hint: 'B is for Ball!', options: ['B', 'P', 'D', 'M'], difficulty: 'easy' },
  { id: 'let-c', target: 'C', category: 'letter', audioPrompt: 'Can you say or type the letter C?', hint: 'C is for Cat!', options: ['C', 'G', 'O', 'S'], difficulty: 'easy' },
  { id: 'let-d', target: 'D', category: 'letter', audioPrompt: 'Can you say or type the letter D?', hint: 'D is for Dog!', options: ['D', 'B', 'P', 'T'], difficulty: 'easy' },
  { id: 'let-e', target: 'E', category: 'letter', audioPrompt: 'Can you say or type the letter E?', hint: 'E is for Elephant!', options: ['E', 'F', 'L', 'I'], difficulty: 'easy' },
  { id: 'let-s', target: 'S', category: 'letter', audioPrompt: 'Can you say or type the letter S?', hint: 'S is for Star!', options: ['S', 'C', 'Z', '5'], difficulty: 'easy' },
  { id: 'let-p', target: 'P', category: 'letter', audioPrompt: 'Can you say or type the letter P?', hint: 'P is for Pony!', options: ['P', 'B', 'D', 'R'], difficulty: 'easy' },
  { id: 'let-m', target: 'M', category: 'letter', audioPrompt: 'Can you say or type the letter M?', hint: 'M is for Magic!', options: ['M', 'W', 'N', 'V'], difficulty: 'easy' },
];

export const INITIAL_NUMBERS: PracticeItem[] = [
  { id: 'num-1', target: '1', category: 'number', audioPrompt: 'Say or type the number 1!', hint: 'One shiny star!', options: ['1', '2', '3', '4'], difficulty: 'easy' },
  { id: 'num-2', target: '2', category: 'number', audioPrompt: 'Say or type the number 2!', hint: 'Two little ducks!', options: ['2', '5', '3', '1'], difficulty: 'easy' },
  { id: 'num-3', target: '3', category: 'number', audioPrompt: 'Say or type the number 3!', hint: 'Three magic wishes!', options: ['3', '8', '6', '2'], difficulty: 'easy' },
  { id: 'num-5', target: '5', category: 'number', audioPrompt: 'Say or type the number 5!', hint: 'Five high-fives!', options: ['5', '2', 'S', '6'], difficulty: 'easy' },
  { id: 'num-7', target: '7', category: 'number', audioPrompt: 'Say or type the number 7!', hint: 'Seven colors in the rainbow!', options: ['7', '1', 'L', '9'], difficulty: 'easy' },
  { id: 'num-10', target: '10', category: 'number', audioPrompt: 'Say or type the number 10!', hint: 'Ten fingers on your hands!', options: ['10', '01', '1', '100'], difficulty: 'easy' },
];

export const INITIAL_WORDS: PracticeItem[] = [
  { id: 'wrd-sun', target: 'sun', category: 'word', audioPrompt: 'Can you spell or say SUN?', hint: 'The big bright star in the sky!', options: ['sun', 'run', 'fun', 'star'], difficulty: 'easy' },
  { id: 'wrd-cat', target: 'cat', category: 'word', audioPrompt: 'Can you spell or say CAT?', hint: 'Meow! A cute fluffy pet!', options: ['cat', 'bat', 'hat', 'dog'], difficulty: 'easy' },
  { id: 'wrd-dog', target: 'dog', category: 'word', audioPrompt: 'Can you spell or say DOG?', hint: 'Woof! A friendly barking buddy!', options: ['dog', 'log', 'cat', 'pig'], difficulty: 'easy' },
  { id: 'wrd-star', target: 'star', category: 'word', audioPrompt: 'Can you spell or say STAR?', hint: 'Shines brightly in the night sky!', options: ['star', 'moon', 'sun', 'sky'], difficulty: 'medium' },
  { id: 'wrd-pony', target: 'pony', category: 'word', audioPrompt: 'Can you spell or say PONY?', hint: 'A magical little horse!', options: ['pony', 'hero', 'dino', 'dragon'], difficulty: 'medium' },
  { id: 'wrd-hero', target: 'hero', category: 'word', audioPrompt: 'Can you spell or say HERO?', hint: 'A brave caped champion!', options: ['hero', 'pony', 'star', 'zero'], difficulty: 'medium' },
  { id: 'wrd-dino', target: 'dino', category: 'word', audioPrompt: 'Can you spell or say DINO?', hint: 'A friendly roaring dinosaur!', options: ['dino', 'dragon', 'duck', 'dog'], difficulty: 'medium' },
];
