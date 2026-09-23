import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Mic, RefreshCw, Check, Send, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PracticeItem, CharacterInstance } from '../types';
import { audio } from '../utils/audio';
import { speechEngine } from '../utils/speech';
import { CharacterVisual } from './CharacterVisual';
import { StorySceneOverlay } from './StorySceneOverlay';

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

const PHONETIC_MAP: Record<string, string[]> = {
  a: ['a', 'ay', 'eigh', 'hey', 'eh', 'apple', 'say a', 'letter a'],
  b: ['b', 'be', 'bee', 'boy', 'bay', 'letter b'],
  c: ['c', 'see', 'sea', 'si', 'cat', 'letter c'],
  d: ['d', 'dee', 'the', 'dog', 'letter d'],
  e: ['e', 'ee', 'ea', 'letter e'],
  f: ['f', 'eff', 'ef', 'letter f'],
  g: ['g', 'jee', 'gee', 'letter g'],
  h: ['h', 'aitch', 'ache', 'letter h'],
  i: ['i', 'eye', 'ai', 'letter i'],
  j: ['j', 'jay', 'letter j'],
  k: ['k', 'kay', 'letter k'],
  l: ['l', 'el', 'ell', 'letter l'],
  m: ['m', 'em', 'letter m'],
  n: ['n', 'en', 'letter n'],
  o: ['o', 'oh', 'letter o'],
  p: ['p', 'pee', 'pe', 'letter p'],
  q: ['q', 'cue', 'kew', 'letter q'],
  r: ['r', 'are', 'ar', 'letter r'],
  s: ['s', 'ess', 'es', 'letter s'],
  t: ['t', 'tea', 'tee', 'letter t'],
  u: ['u', 'you', 'yoo', 'letter u'],
  v: ['v', 'vee', 'letter v'],
  w: ['w', 'doubleyou', 'double u', 'double', 'letter w'],
  x: ['x', 'ex', 'letter x'],
  y: ['y', 'why', 'wy', 'letter y'],
  z: ['z', 'zee', 'zed', 'letter z'],
  '1': ['1', 'one', 'won', 'number 1'],
  '2': ['2', 'two', 'to', 'too', 'number 2'],
  '3': ['3', 'three', 'tree', 'number 3'],
  '4': ['4', 'four', 'for', 'fore', 'number 4'],
  '5': ['5', 'five', 'number 5'],
  '6': ['6', 'six', 'number 6'],
  '7': ['7', 'seven', 'number 7'],
  '8': ['8', 'eight', 'ate', 'number 8'],
  '9': ['9', 'nine', 'number 9'],
  '10': ['10', 'ten', 'number 10'],
};

interface PracticeCardProps {
  item: PracticeItem;
  activeCharacter?: CharacterInstance;
  onCorrectAnswer: (item: PracticeItem) => void;
  onNextItem: () => void;
  onRequestNewCharacter: () => void;
}

export const PracticeCard: React.FC<PracticeCardProps> = ({
  item,
  activeCharacter,
  onCorrectAnswer,
  onNextItem,
  onRequestNewCharacter,
}) => {
  const [typedInput, setTypedInput] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isCorrectState, setIsCorrectState] = useState(false);
  const [isProcessingSuccess, setIsProcessingSuccess] = useState(false);
  const [activeStoryScene, setActiveStoryScene] = useState<{
    beatIndex: number;
    beatText: string;
  } | null>(null);

  const latestTranscriptRef = useRef('');
  const hasEvaluatedRef = useRef(false);

  // Auto-play TTS prompt when item changes (with 500ms cushion so speech engine finishes clean)
  useEffect(() => {
    setTypedInput('');
    setFeedback(null);
    setSpeechTranscript('');
    setShowHint(false);
    setIsCorrectState(false);
    setIsProcessingSuccess(false);
    setActiveStoryScene(null);
    latestTranscriptRef.current = '';
    hasEvaluatedRef.current = false;
    if (speechEngine.getIsListening()) {
      speechEngine.stopListening();
      setIsListening(false);
    }

    const timer = setTimeout(() => {
      audio.speakText(item.audioPrompt);
    }, 500);

    return () => clearTimeout(timer);
  }, [item]);

  const evaluateMatch = (inputVal: string, targetVal: string, isSpeech: boolean = false): boolean => {
    const cleanInput = inputVal.trim().toLowerCase();
    const cleanTarget = targetVal.trim().toLowerCase();

    if (!cleanInput || !cleanTarget) return false;

    if (!isSpeech) {
      // Typed & tile-tap inputs retain exact matching
      return (
        cleanInput === cleanTarget ||
        cleanInput.includes(cleanTarget) ||
        (cleanTarget.length === 1 && cleanInput.split(/\s+/).some((word) => word === cleanTarget))
      );
    } else {
      // Speech-sourced input matching (lenient for young learners)
      const words = cleanInput
        .split(/\s+/)
        .map((w) => w.replace(/[^a-z0-9]/g, ''))
        .filter(Boolean);

      // 1. Direct equality / substring match
      const directMatch =
        cleanInput === cleanTarget ||
        cleanInput.includes(cleanTarget) ||
        words.some((w) => w === cleanTarget);

      if (directMatch) return true;

      // 2. Phonetic dictionary match (for letters & digits & common sounds)
      const phonetics = PHONETIC_MAP[cleanTarget] || [];
      const phoneticMatch =
        words.some((w) => phonetics.includes(w)) ||
        phonetics.some((p) => cleanInput.includes(p));

      if (phoneticMatch) return true;

      // 3. Distance & fuzzy match for words
      if (cleanTarget.length >= 3) {
        const distFull = levenshteinDistance(cleanInput, cleanTarget);
        const minWordDist =
          words.length > 0
            ? Math.min(...words.map((w) => levenshteinDistance(w, cleanTarget)))
            : 999;

        // Allow up to 2 character edit distance for kids' pronunciation (e.g. "kat" -> "cat", "dagon" -> "dragon")
        if (distFull <= 2 || minWordDist <= 2) {
          return true;
        }

        if (cleanTarget.includes(cleanInput) && cleanInput.length >= 3) {
          return true;
        }
      } else if (cleanTarget.length === 2) {
        const minWordDist =
          words.length > 0
            ? Math.min(...words.map((w) => levenshteinDistance(w, cleanTarget)))
            : 999;
        if (minWordDist <= 1) return true;
      }
    }
    return false;
  };

  const finishAndCheckSpeech = () => {
    speechEngine.stopListening();
    setIsListening(false);
    if (!hasEvaluatedRef.current) {
      hasEvaluatedRef.current = true;
      const finalVal = latestTranscriptRef.current.trim();
      if (finalVal) {
        checkAnswer(finalVal, true);
      } else {
        setFeedback({
          text: "Didn't hear anything! Press mic and speak out loud.",
          isError: true,
        });
        audio.playGentleRetrySound();
      }
    }
  };

  const handleSpeechInput = () => {
    if (isListening) {
      finishAndCheckSpeech();
      return;
    }

    setFeedback(null);
    latestTranscriptRef.current = '';
    hasEvaluatedRef.current = false;
    setSpeechTranscript('');
    setIsListening(true);

    speechEngine.startListening({
      onTranscript: (transcript) => {
        latestTranscriptRef.current = transcript;
        setSpeechTranscript(transcript);

        // Live detection: auto-finish and check as soon as correct word is detected
        if (!hasEvaluatedRef.current && transcript.trim()) {
          const isMatched = evaluateMatch(transcript, item.target, true);
          if (isMatched) {
            hasEvaluatedRef.current = true;
            speechEngine.stopListening();
            setIsListening(false);
            checkAnswer(transcript, true);
          }
        }
      },
      onError: (err) => {
        setIsListening(false);
        setFeedback({ text: err, isError: true });
        audio.playGentleRetrySound();
      },
      onEnd: () => {
        setIsListening(false);
        if (!hasEvaluatedRef.current && latestTranscriptRef.current.trim()) {
          hasEvaluatedRef.current = true;
          checkAnswer(latestTranscriptRef.current.trim(), true);
        }
      },
    });
  };

  const handleTypedSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!typedInput.trim()) return;
    checkAnswer(typedInput, false);
  };

  const handleTileSelect = (choice: string) => {
    checkAnswer(choice, false);
  };

  const checkAnswer = (inputVal: string, isSpeech: boolean = false) => {
    if (!inputVal.trim() || isProcessingSuccess) return;

    const isMatched = evaluateMatch(inputVal, item.target, isSpeech);

    if (isMatched) {
      setIsCorrectState(true);
      setIsProcessingSuccess(true);
      if (speechEngine.getIsListening()) {
        speechEngine.stopListening();
        setIsListening(false);
      }

      const beatIndex = activeCharacter?.storyBeatIndex ?? 0;
      const beats = activeCharacter?.storyBeats;

      if (beats && beatIndex < 3) {
        const nextBeatIndex = beatIndex + 1;
        const beatText =
          nextBeatIndex === 1
            ? beats.setup
            : nextBeatIndex === 2
            ? beats.action
            : beats.reaction;

        setActiveStoryScene({
          beatIndex: nextBeatIndex,
          beatText,
        });

        if (nextBeatIndex === 1) {
          audio.playSuccessChime();
          audio.speakText(`Great job! Story Beat 1: ${beats.setup}`);
          setFeedback({
            text: `📖 Story Beat 1/3 Unlocked! "${beats.setup}"`,
            isError: false,
          });
        } else if (nextBeatIndex === 2) {
          audio.playActionSound(activeCharacter?.customAction || 'trick');
          audio.speakText(`Awesome! Story Beat 2: ${beats.action}`);
          setFeedback({
            text: `✨ Story Beat 2/3 Unlocked! "${beats.action}"`,
            isError: false,
          });
        } else if (nextBeatIndex === 3) {
          audio.playActionSound(activeCharacter?.customAction || 'trick');
          audio.speakText(`Hooray! Story Complete! ${activeCharacter?.customName} does the ${activeCharacter?.customAction}! ${beats.reaction}`);
          setFeedback({
            text: `🎉 Story Complete! ${activeCharacter?.customName} performs ${activeCharacter?.customAction}! "${beats.reaction}"`,
            isError: false,
          });
        }

        setTimeout(() => {
          setActiveStoryScene(null);
          onCorrectAnswer(item);
        }, 3800);
      } else {
        audio.playSuccessChime();
        audio.speakText(`Great job! That is ${item.target}!`);
        setFeedback({ text: `🌟 Hooray! You got it right! "${item.target}"`, isError: false });

        setTimeout(() => {
          onCorrectAnswer(item);
        }, 2400);
      }
    } else {
      audio.playGentleRetrySound();
      audio.speakText(`Almost! Try again for ${item.target}`);
      setFeedback({
        text: `Nice try! Let's try again! Can you say or type "${item.target}"?`,
        isError: true,
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      {/* Active Character Encouragement & Story Tracker Header */}
      {activeCharacter && (
        <div className="bg-gradient-to-r from-purple-500/10 via-amber-400/10 to-pink-500/10 border-2 border-amber-300/80 rounded-3xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <CharacterVisual
              archetypeId={activeCharacter.archetypeId}
              variantId={activeCharacter.variantId}
              actionState={isCorrectState ? 'performing' : 'idle'}
              actionName={activeCharacter.customAction}
              size="sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                  Practice Buddy
                </p>
                {/* Story Beat Progress Dots */}
                <div className="flex items-center gap-1 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                  <span className="text-[10px] font-black text-amber-900">
                    Story: {activeCharacter.storyBeatIndex || 0}/3
                  </span>
                  <div className="flex gap-0.5">
                    <div className={`w-2 h-2 rounded-full ${(activeCharacter.storyBeatIndex || 0) >= 1 ? 'bg-amber-500' : 'bg-slate-300'}`} />
                    <div className={`w-2 h-2 rounded-full ${(activeCharacter.storyBeatIndex || 0) >= 2 ? 'bg-amber-500' : 'bg-slate-300'}`} />
                    <div className={`w-2 h-2 rounded-full ${(activeCharacter.storyBeatIndex || 0) >= 3 ? 'bg-amber-500' : 'bg-slate-300'}`} />
                  </div>
                </div>
              </div>

              <h2 className="text-base sm:text-lg font-black text-slate-800">
                {activeCharacter.customName}
              </h2>

              {activeCharacter.storyBeats && (activeCharacter.storyBeatIndex || 0) > 0 ? (
                <p className="text-xs text-purple-700 font-bold mt-0.5 italic">
                  "
                  {(activeCharacter.storyBeatIndex || 0) === 1 && activeCharacter.storyBeats.setup}
                  {(activeCharacter.storyBeatIndex || 0) === 2 && activeCharacter.storyBeats.action}
                  {(activeCharacter.storyBeatIndex || 0) >= 3 && activeCharacter.storyBeats.reaction}
                  "
                </p>
              ) : (
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Earn correct answers to reveal {activeCharacter.customName}'s story!
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onRequestNewCharacter}
            className="text-xs font-black text-pink-600 hover:text-pink-700 bg-pink-100 hover:bg-pink-200 px-3 py-2 rounded-xl transition-colors shrink-0 self-end sm:self-center"
          >
            + Ask New Friend
          </button>
        </div>
      )}

      {/* Main Practice Card Canvas */}
      <div className="bg-white border-2 border-amber-200 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col items-center text-center relative overflow-hidden">
        {/* Top Category Badge & Listen Button */}
        <div className="w-full flex items-center justify-between mb-4">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            {item.category === 'letter' && '🔤 Letter Practice'}
            {item.category === 'number' && '🔢 Number Practice'}
            {item.category === 'word' && '✨ Word Practice'}
            {item.category === 'custom' && '🌟 Special Word'}
          </span>

          <button
            onClick={() => audio.speakText(item.audioPrompt)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-amber-900 transition-colors"
          >
            <Volume2 className="w-4 h-4 text-amber-500" />
            <span>Listen Prompt</span>
          </button>
        </div>

        {/* Big Target Display */}
        <div className="my-4 relative">
          <motion.div
            key={item.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-7xl sm:text-9xl font-black text-slate-800 tracking-wider font-mono select-none"
          >
            {item.target}
          </motion.div>

          <button
            onClick={() => audio.speakText(item.target)}
            className="mt-2 text-xs font-bold text-amber-600 hover:text-amber-700 underline flex items-center gap-1 mx-auto"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Hear "{item.target}"</span>
          </button>
        </div>

        {/* Hint Accordion */}
        {showHint ? (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-bold text-purple-700 bg-purple-50 border border-purple-200 px-4 py-2 rounded-2xl mb-4"
          >
            💡 Hint: {item.hint}
          </motion.p>
        ) : (
          <button
            onClick={() => setShowHint(true)}
            className="text-xs font-bold text-slate-500 hover:text-purple-600 flex items-center gap-1 mb-4"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Need a hint?</span>
          </button>
        )}

        {/* Input Methods Section */}
        <div className="w-full flex flex-col gap-4 mt-2">
          {/* Speech Microphone Button (Primary Spoken Rep) */}
          <div className="flex flex-col items-center gap-3 w-full">
            <button
              type="button"
              onClick={handleSpeechInput}
              disabled={isCorrectState}
              className={`relative flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg shadow-md transition-all ${
                isListening
                  ? 'bg-rose-500 hover:bg-rose-600 text-white ring-4 ring-rose-300 animate-pulse'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-102'
              }`}
            >
              {isListening ? (
                <>
                  <Check className="w-6 h-6 stroke-[3]" />
                  <span>Press when finished speaking</span>
                </>
              ) : (
                <>
                  <Mic className="w-6 h-6" />
                  <span>Tap Mic &amp; Say "{item.target}" Out Loud</span>
                </>
              )}
            </button>

            {isListening && (
              <div className="w-full bg-rose-50 border-2 border-rose-200 rounded-2xl p-3 flex flex-col items-center gap-1.5 animate-fadeIn">
                <div className="flex items-center gap-2 text-rose-700 font-extrabold text-xs uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span>Listening live... Speak clearly!</span>
                </div>
                <p className="text-sm font-black text-slate-800 min-h-[1.5rem]">
                  {speechTranscript ? `"${speechTranscript}"` : 'Waiting for voice...'}
                </p>
              </div>
            )}

            {!isListening && speechTranscript && (
              <p className="text-xs text-slate-600 font-medium italic">
                Last heard: "{speechTranscript}"
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase my-1">
            <div className="h-px bg-slate-200 flex-1" />
            <span>or type it below</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          {/* Typing Form */}
          <form onSubmit={handleTypedSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={`Type "${item.target}" here...`}
              disabled={isCorrectState}
              className="flex-1 bg-slate-50 border-2 border-slate-200 focus:border-amber-400 focus:bg-white rounded-2xl px-4 py-3 text-lg font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!typedInput.trim() || isCorrectState}
              className="bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-slate-900 font-black px-5 py-3 rounded-2xl flex items-center justify-center transition-all shadow-xs"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          {/* Multiple Choice Tap Tiles (For Quick Taps or Younger Kids) */}
          {item.options && item.options.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2">
              {item.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleTileSelect(opt)}
                  disabled={isCorrectState}
                  className="bg-amber-50 hover:bg-amber-200 active:scale-95 border-2 border-amber-200 rounded-2xl py-3 text-xl font-black text-slate-800 transition-all shadow-xs"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Feedback Message Banner & Processing Indicator */}
        <AnimatePresence>
          {isProcessingSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 text-white font-black text-sm sm:text-base flex items-center justify-between shadow-md border-2 border-emerald-300 animate-pulse"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <span>Star Earned! Loading next word...</span>
              </div>
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
            </motion.div>
          )}

          {!isProcessingSuccess && feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-6 w-full p-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 ${
                feedback.isError
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}
            >
              {feedback.isError ? (
                <span>💡 {feedback.text}</span>
              ) : (
                <span className="flex items-center gap-2 text-base">
                  <Check className="w-5 h-5 text-emerald-600 stroke-[3]" />
                  <span>{feedback.text}</span>
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next Card Button */}
        <div className="w-full flex justify-end mt-6">
          <button
            onClick={onNextItem}
            className="flex items-center gap-2 text-xs font-extrabold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Skip / Next Practice</span>
          </button>
        </div>
      </div>

      {/* Story Scene Visual Overlay when a Beat is unlocked */}
      {activeStoryScene && activeCharacter && (
        <StorySceneOverlay
          character={activeCharacter}
          beatIndex={activeStoryScene.beatIndex}
          beatText={activeStoryScene.beatText}
        />
      )}
    </div>
  );
};
