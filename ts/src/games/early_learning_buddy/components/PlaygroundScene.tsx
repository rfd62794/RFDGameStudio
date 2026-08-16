import React, { useState } from 'react';
import { Sparkles, Play, Plus, Volume2, X, BookOpen, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CharacterInstance } from '../types';
import { CharacterVisual } from './CharacterVisual';
import { audio } from '../utils/audio';

interface PlaygroundSceneProps {
  characters: CharacterInstance[];
  activeCharacterId?: string;
  onSelectActiveCharacter: (id: string) => void;
  onRequestNewCharacter: () => void;
  onStartPracticeWithWord: (word: string) => void;
}

export const PlaygroundScene: React.FC<PlaygroundSceneProps> = ({
  characters,
  activeCharacterId,
  onSelectActiveCharacter,
  onRequestNewCharacter,
  onStartPracticeWithWord,
}) => {
  // Story Theater Modal State
  const [activeStoryChar, setActiveStoryChar] = useState<CharacterInstance | null>(null);

  const handleOpenStory = (char: CharacterInstance) => {
    setActiveStoryChar(char);
    // Read out unlocked story beats aloud
    const beatIndex = char.storyBeatIndex || 0;
    const beats = char.storyBeats;

    if (beats && beatIndex > 0) {
      let storyText = `Here is ${char.customName}'s story! `;
      if (beatIndex >= 1) storyText += `${beats.setup} `;
      if (beatIndex >= 2) storyText += `${beats.action} `;
      if (beatIndex >= 3) storyText += `${beats.reaction}`;
      audio.speakText(storyText);
    } else {
      audio.speakText(`Practice with ${char.customName} to unlock their story!`);
    }
  };

  const handleSpeakFullStory = () => {
    if (!activeStoryChar || !activeStoryChar.storyBeats) return;
    const beatIndex = activeStoryChar.storyBeatIndex || 0;
    const beats = activeStoryChar.storyBeats;

    let storyText = '';
    if (beatIndex >= 1) storyText += `${beats.setup} `;
    if (beatIndex >= 2) storyText += `${beats.action} `;
    if (beatIndex >= 3) storyText += `${beats.reaction}`;

    audio.speakText(storyText || `Answer questions in practice mode to unlock ${activeStoryChar.customName}'s story!`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* Playground Header Banner */}
      <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-cyan-500/15 border-2 border-emerald-300 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <span>🎪</span>
            <span>My Friends Playground</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Practice words and letters to earn and unlock each friend's 3-part Gemini story!
          </p>
        </div>

        <button
          onClick={onRequestNewCharacter}
          className="bg-pink-500 hover:bg-pink-600 text-white font-black px-5 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2 text-sm shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Friend</span>
        </button>
      </div>

      {/* Main Interactive Park Canvas */}
      <div className="relative min-h-[420px] bg-gradient-to-b from-sky-100 via-amber-50 to-emerald-100 border-2 border-emerald-200 rounded-3xl p-6 sm:p-10 shadow-inner overflow-hidden flex flex-col justify-between">
        {/* Background Clouds & Hills SVG */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-6 left-12 w-24 h-12 bg-white rounded-full blur-xs" />
          <div className="absolute top-10 right-20 w-32 h-14 bg-white rounded-full blur-xs" />
          <div className="absolute bottom-0 inset-x-0 h-32 bg-emerald-200/50 rounded-t-[100%]" />
        </div>

        {/* Characters Grid */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 items-center justify-items-center my-auto">
          {characters.map((char) => {
            const isActive = char.id === activeCharacterId;
            const beatIndex = char.storyBeatIndex || 0;

            return (
              <motion.div
                key={char.id}
                whileHover={{ scale: 1.04 }}
                className={`relative flex flex-col items-center p-4 rounded-3xl bg-white/90 backdrop-blur-xs border-2 transition-all cursor-pointer shadow-md w-full ${
                  isActive
                    ? 'border-amber-400 ring-4 ring-amber-200 bg-white'
                    : 'border-slate-200 hover:border-amber-300'
                }`}
                onClick={() => handleOpenStory(char)}
              >
                {/* Active Buddy Star Badge */}
                {isActive && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full border border-white shadow-xs z-10">
                    ★ Practice Buddy
                  </span>
                )}

                {/* Character Visual */}
                <CharacterVisual
                  archetypeId={char.archetypeId}
                  variantId={char.variantId}
                  actionState={beatIndex >= 3 ? 'performing' : 'idle'}
                  actionName={char.customAction}
                  size="md"
                  showSparkles={beatIndex >= 3}
                />

                {/* Name & Action Badge */}
                <div className="mt-2 text-center w-full">
                  <h3 className="text-sm font-black text-slate-800 truncate">{char.customName}</h3>
                  <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-xl">
                    <Sparkles className="w-3 h-3 text-purple-500" />
                    <span className="truncate">{char.customAction}</span>
                  </div>
                </div>

                {/* Earned Story Progress Bar */}
                <div className="mt-2 w-full bg-slate-100 p-1.5 rounded-xl flex items-center justify-between gap-1 border border-slate-200">
                  <div className="flex items-center gap-1 text-[10px] font-black text-slate-700">
                    <BookOpen className="w-3 h-3 text-amber-500" />
                    <span>Story {beatIndex}/3</span>
                  </div>
                  <div className="flex gap-1">
                    <div className={`w-2 h-2 rounded-full ${beatIndex >= 1 ? 'bg-amber-400' : 'bg-slate-300'}`} />
                    <div className={`w-2 h-2 rounded-full ${beatIndex >= 2 ? 'bg-amber-400' : 'bg-slate-300'}`} />
                    <div className={`w-2 h-2 rounded-full ${beatIndex >= 3 ? 'bg-amber-400' : 'bg-slate-300'}`} />
                  </div>
                </div>

                {/* Buttons */}
                <div className="mt-3 flex gap-1 w-full">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectActiveCharacter(char.id);
                    }}
                    className={`flex-1 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                      isActive
                        ? 'bg-amber-400 text-slate-900'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isActive ? 'Active' : 'Set Active'}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartPracticeWithWord(char.customName);
                    }}
                    title={`Practice spelling ${char.customName}`}
                    className="p-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[11px]"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}

          {/* Add New Character Empty Card */}
          <div
            onClick={onRequestNewCharacter}
            className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed border-slate-300 hover:border-pink-400 bg-white/50 hover:bg-pink-50/50 transition-all cursor-pointer min-h-[210px] w-full text-center"
          >
            <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-500 flex items-center justify-center text-xl font-black mb-2">
              +
            </div>
            <p className="text-xs font-black text-slate-700">Ask for a Friend</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Type or say a name!</p>
          </div>
        </div>
      </div>

      {/* STORY THEATER MODAL */}
      <AnimatePresence>
        {activeStoryChar && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white border-4 border-amber-300 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveStoryChar(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Story Header */}
              <div className="flex items-center gap-2 mb-2 bg-amber-50 px-4 py-1.5 rounded-full border border-amber-200">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span className="text-xs font-black text-amber-800 uppercase tracking-wide">
                  {activeStoryChar.customName}'s Practice Story
                </span>
              </div>

              {/* Character Visual */}
              <div className="my-2">
                <CharacterVisual
                  archetypeId={activeStoryChar.archetypeId}
                  variantId={activeStoryChar.variantId}
                  actionState={(activeStoryChar.storyBeatIndex || 0) >= 3 ? 'performing' : 'idle'}
                  actionName={activeStoryChar.customAction}
                  size="md"
                  showSparkles={(activeStoryChar.storyBeatIndex || 0) >= 3}
                />
              </div>

              {/* Story Beats List */}
              <div className="w-full flex flex-col gap-2.5 my-3 text-left">
                {/* Beat 1: Setup */}
                <div
                  className={`p-3.5 rounded-2xl border-2 transition-all ${
                    (activeStoryChar.storyBeatIndex || 0) >= 1
                      ? 'bg-amber-50/80 border-amber-300 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider block text-amber-700">
                    Beat 1 • Setup {(activeStoryChar.storyBeatIndex || 0) >= 1 ? '✓ Unlocked' : '🔒 Locked'}
                  </span>
                  <p className="text-sm font-bold mt-0.5">
                    {(activeStoryChar.storyBeatIndex || 0) >= 1
                      ? activeStoryChar.storyBeats?.setup
                      : 'Answer 1 practice question correctly to unlock this beat!'}
                  </p>
                </div>

                {/* Beat 2: Action */}
                <div
                  className={`p-3.5 rounded-2xl border-2 transition-all ${
                    (activeStoryChar.storyBeatIndex || 0) >= 2
                      ? 'bg-purple-50/80 border-purple-300 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider block text-purple-700">
                    Beat 2 • Action {(activeStoryChar.storyBeatIndex || 0) >= 2 ? '✓ Unlocked' : '🔒 Locked'}
                  </span>
                  <p className="text-sm font-bold mt-0.5">
                    {(activeStoryChar.storyBeatIndex || 0) >= 2
                      ? activeStoryChar.storyBeats?.action
                      : 'Answer 2 practice questions correctly to unlock this action!'}
                  </p>
                </div>

                {/* Beat 3: Reaction */}
                <div
                  className={`p-3.5 rounded-2xl border-2 transition-all ${
                    (activeStoryChar.storyBeatIndex || 0) >= 3
                      ? 'bg-emerald-50/80 border-emerald-300 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider block text-emerald-700">
                    Beat 3 • Celebration {(activeStoryChar.storyBeatIndex || 0) >= 3 ? '🎉 Story Complete!' : '🔒 Locked'}
                  </span>
                  <p className="text-sm font-bold mt-0.5">
                    {(activeStoryChar.storyBeatIndex || 0) >= 3
                      ? activeStoryChar.storyBeats?.reaction
                      : 'Answer 3 practice questions correctly to finish the story!'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col sm:flex-row gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleSpeakFullStory}
                  className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Volume2 className="w-4 h-4 text-amber-600" />
                  <span>Listen Story Aloud</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectActiveCharacter(activeStoryChar.id);
                    setActiveStoryChar(null);
                    onStartPracticeWithWord(activeStoryChar.customName);
                  }}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Play className="w-4 h-4" />
                  <span>Practice With Friend</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
