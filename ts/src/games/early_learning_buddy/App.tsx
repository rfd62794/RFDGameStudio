import { useState, useEffect } from 'react';
import type { GameRendererProps } from '../../engine/types';
import { ViewMode, CategoryType, CharacterInstance, PracticeItem } from './types';
import { INITIAL_LETTERS, INITIAL_NUMBERS, INITIAL_WORDS, ARCHETYPES } from './data/archetypes';
import { Header } from './components/Header';
import { PracticeCard } from './components/PracticeCard';
import { RequestCharacterModal } from './components/RequestCharacterModal';
import { PlaygroundScene } from './components/PlaygroundScene';
import { ParentSettingsModal } from './components/ParentSettingsModal';
import { audio } from './utils/audio';

// Default starter friends
const STARTER_CHARACTERS: CharacterInstance[] = [
  {
    id: 'starter-pony',
    archetypeId: 'pony',
    requestedName: 'Pony',
    customName: 'Star Sparkle Pony',
    customAction: 'Galaxy Trot',
    unlockedAt: Date.now() - 100000,
    totalRepsCompleted: 5,
    level: 1,
    unlocked: true,
    storyBeatIndex: 0,
  },
  {
    id: 'starter-dragon',
    archetypeId: 'dragon',
    requestedName: 'Dragon',
    customName: 'Ember Dragon',
    customAction: 'Happy Roar',
    unlockedAt: Date.now() - 50000,
    totalRepsCompleted: 3,
    level: 1,
    unlocked: true,
    storyBeatIndex: 0,
  },
];

export default function App({ session }: GameRendererProps) {
  void session; // destructured per contract; game is self-contained
  const [currentView, setCurrentView] = useState<ViewMode>('practice');
  const [stars, setStars] = useState<number>(() => {
    const saved = localStorage.getItem('eb_stars');
    return saved ? parseInt(saved, 10) : 5;
  });

  const [characters, setCharacters] = useState<CharacterInstance[]>(() => {
    const saved = localStorage.getItem('eb_characters');
    return saved ? JSON.parse(saved) : STARTER_CHARACTERS;
  });

  const [activeCharacterId, setActiveCharacterId] = useState<string>(() => {
    const saved = localStorage.getItem('eb_active_char');
    return saved || 'starter-pony';
  });

  const [categoryFilter, setCategoryFilter] = useState<CategoryType | 'all'>('all');
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Deck State
  const [practiceDeck, setPracticeDeck] = useState<PracticeItem[]>([]);
  const [deckIndex, setDeckIndex] = useState(0);

  const activeCharacter = characters.find((c) => c.id === activeCharacterId) || characters[0];

  // Auto-generate story beats from Gemini endpoint for active buddy if missing
  useEffect(() => {
    if (!activeCharacter || activeCharacter.storyBeats) return;

    let isMounted = true;
    const archetype = ARCHETYPES[activeCharacter.archetypeId];

    fetch('/api/generate-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customName: activeCharacter.customName,
        archetypeCategory: archetype?.categoryName || 'Magical Friend',
        archetypeDescription: archetype?.description || 'A friendly companion',
        actionName: activeCharacter.customAction,
      }),
    })
      .then((res) => res.json())
      .then((beats) => {
        if (isMounted && beats && beats.setup) {
          setCharacters((prev) =>
            prev.map((c) =>
              c.id === activeCharacter.id
                ? { ...c, storyBeats: beats, storyBeatIndex: c.storyBeatIndex ?? 0 }
                : c
            )
          );
        }
      })
      .catch((err) => console.error('Story generation fetch error:', err));

    return () => {
      isMounted = false;
    };
  }, [activeCharacterId, characters]);

  // Rebuild practice deck whenever characters or category filter changes
  useEffect(() => {
    let items: PracticeItem[] = [];

    if (categoryFilter === 'all' || categoryFilter === 'letter') {
      items = [...items, ...INITIAL_LETTERS];
    }
    if (categoryFilter === 'all' || categoryFilter === 'number') {
      items = [...items, ...INITIAL_NUMBERS];
    }
    if (categoryFilter === 'all' || categoryFilter === 'word') {
      items = [...items, ...INITIAL_WORDS];
    }

    // Convert unlocked character names and action names into real vocabulary practice reps!
    characters.forEach((char) => {
      if (char.customName) {
        items.push({
          id: `custom-char-${char.id}`,
          target: char.customName.split(' ')[0], // e.g. "Sparkle" or "Pony"
          category: 'custom',
          audioPrompt: `Can you spell or say ${char.customName.split(' ')[0]}?`,
          hint: `Name of your ${char.customName} friend!`,
          difficulty: 'easy',
        });
      }
      if (char.customAction) {
        items.push({
          id: `custom-act-${char.id}`,
          target: char.customAction.split(' ')[0], // e.g. "Dance" or "Fly"
          category: 'custom',
          audioPrompt: `Can you spell or say ${char.customAction.split(' ')[0]}?`,
          hint: `Special action trick!`,
          difficulty: 'medium',
        });
      }
    });

    // Shuffle deck lightly
    items.sort(() => 0.5 - Math.random());
    setPracticeDeck(items);
    setDeckIndex(0);
  }, [categoryFilter, characters]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('eb_stars', stars.toString());
  }, [stars]);

  useEffect(() => {
    localStorage.setItem('eb_characters', JSON.stringify(characters));
  }, [characters]);

  useEffect(() => {
    localStorage.setItem('eb_active_char', activeCharacterId);
  }, [activeCharacterId]);

  const handleCorrectAnswer = (_item: PracticeItem) => {
    setStars((prev) => prev + 1);

    if (activeCharacter) {
      setCharacters((prev) =>
        prev.map((c) => {
          if (c.id === activeCharacter.id) {
            const currentBeat = c.storyBeatIndex ?? 0;
            const nextBeat = Math.min(3, currentBeat + 1);
            return {
              ...c,
              storyBeatIndex: nextBeat,
              totalRepsCompleted: (c.totalRepsCompleted || 0) + 1,
            };
          }
          return c;
        })
      );
    }

    setDeckIndex((prev) => (prev + 1) % practiceDeck.length);
  };

  const handleNextItem = () => {
    setDeckIndex((prev) => (prev + 1) % practiceDeck.length);
  };

  const handleAddCharacter = (newChar: CharacterInstance) => {
    setCharacters((prev) => [newChar, ...prev]);
    setActiveCharacterId(newChar.id);
    setShowRequestModal(false);
    setCurrentView('playground');
  };

  const handleSelectView = (view: ViewMode) => {
    if (view === 'request') {
      setShowRequestModal(true);
    } else {
      setCurrentView(view);
    }
  };

  const handleStartPracticeWithWord = (word: string) => {
    // Add custom word to practice deck and jump to it
    const newPractice: PracticeItem = {
      id: `word-${Date.now()}`,
      target: word.split(' ')[0],
      category: 'word',
      audioPrompt: `Let's practice spelling ${word.split(' ')[0]}!`,
      hint: `Your friend's name!`,
      difficulty: 'easy',
    };
    setPracticeDeck((prev) => [newPractice, ...prev]);
    setDeckIndex(0);
    setCurrentView('practice');
  };

  const currentItem = practiceDeck[deckIndex] || INITIAL_LETTERS[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 via-slate-50 to-purple-50/40 text-slate-800 flex flex-col font-sans">
      <Header
        currentView={currentView}
        onSelectView={handleSelectView}
        stars={stars}
        isMuted={isMuted}
        onToggleMute={() => {
          const next = !isMuted;
          setIsMuted(next);
          audio.setMuted(next);
        }}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main className="flex-1 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center">
        {currentView === 'practice' && (
          <PracticeCard
            item={currentItem}
            activeCharacter={activeCharacter}
            onCorrectAnswer={handleCorrectAnswer}
            onNextItem={handleNextItem}
            onRequestNewCharacter={() => setShowRequestModal(true)}
          />
        )}

        {currentView === 'playground' && (
          <PlaygroundScene
            characters={characters}
            activeCharacterId={activeCharacterId}
            onSelectActiveCharacter={(id) => setActiveCharacterId(id)}
            onRequestNewCharacter={() => setShowRequestModal(true)}
            onStartPracticeWithWord={handleStartPracticeWithWord}
          />
        )}
      </main>

      {/* Modals */}
      {showRequestModal && (
        <RequestCharacterModal
          onAddCharacter={handleAddCharacter}
          onClose={() => setShowRequestModal(false)}
        />
      )}

      {showSettings && (
        <ParentSettingsModal
          categoryFilter={categoryFilter}
          onSetCategoryFilter={(filter) => setCategoryFilter(filter)}
          isMuted={isMuted}
          onToggleMute={() => {
            const next = !isMuted;
            setIsMuted(next);
            audio.setMuted(next);
          }}
          onResetProgress={() => {
            setCharacters(STARTER_CHARACTERS);
            setActiveCharacterId('starter-pony');
            setStars(5);
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
