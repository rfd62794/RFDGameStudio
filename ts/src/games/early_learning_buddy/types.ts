export type CategoryType = 'letter' | 'number' | 'word' | 'custom';

export type ArchetypeId = 'pony' | 'dragon' | 'hero' | 'fairy' | 'dino' | 'robot';

export interface PracticeItem {
  id: string;
  target: string;
  category: CategoryType;
  audioPrompt: string;
  hint: string;
  options?: string[]; // Multiple choice options for tap mode
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ArchetypeVariant {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgGradient: string;
}

export interface Archetype {
  id: ArchetypeId;
  name: string;
  categoryName: string;
  description: string;
  keywords: string[];
  primaryColor: string; // Tailwind color or hex
  secondaryColor: string;
  accentColor: string;
  bgGradient: string;
  defaultActions: string[];
  variants: ArchetypeVariant[];
}

export interface StoryBeats {
  setup: string;
  action: string;
  reaction: string;
}

export interface CharacterInstance {
  id: string;
  archetypeId: ArchetypeId;
  variantId?: string;
  requestedName: string;
  customName: string;
  customAction: string;
  unlockedAt: number;
  totalRepsCompleted: number;
  level: number;
  unlocked: boolean;
  storyBeats?: StoryBeats;
  storyBeatIndex?: number; // 0 = unrevealed, 1 = setup revealed, 2 = action revealed, 3 = reaction revealed / completed
}

export interface UserProgress {
  stars: number;
  streak: number;
  totalReps: number;
  unlockedCharacters: CharacterInstance[];
  activeCharacterId?: string;
  unlockedWords: string[];
}

export type ViewMode = 'practice' | 'request' | 'playground' | 'collection';
