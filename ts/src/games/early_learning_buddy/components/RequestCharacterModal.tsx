import React, { useState } from 'react';
import { Mic, Sparkles, ArrowRight, Check, X, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CharacterInstance, ArchetypeId } from '../types';
import { ARCHETYPES } from '../data/archetypes';
import { audio } from '../utils/audio';
import { speechEngine } from '../utils/speech';
import { matchRequestedCharacter } from '../utils/archetypeMatcher';
import { CharacterVisual } from './CharacterVisual';

interface RequestCharacterModalProps {
  onAddCharacter: (character: CharacterInstance) => void;
  onClose: () => void;
}

export const RequestCharacterModal: React.FC<RequestCharacterModalProps> = ({
  onAddCharacter,
  onClose,
}) => {
  const [step, setStep] = useState<'name_concept' | 'variant_select' | 'name_action' | 'preview'>('name_concept');
  
  // Step 1: Character Request Word
  const [requestInput, setRequestInput] = useState('');
  const [matchedArchetype, setMatchedArchetype] = useState<ArchetypeId>('pony');
  const [customName, setCustomName] = useState('');

  // Step 1.5: Archetype Variant Selection
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');

  // Step 2: Action Name Word
  const [actionInput, setActionInput] = useState('');

  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Step 1 Submit: Validate requested character name (this is a practice rep!)
  const handleConceptSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanWord = requestInput.trim();
    if (!cleanWord) return;

    // Validate rep & match archetype
    audio.playSuccessChime();
    audio.speakText(`Great practice rep! You said "${cleanWord}"!`);

    const archetypeId = await matchRequestedCharacter(cleanWord);
    setMatchedArchetype(archetypeId);
    setCustomName(cleanWord);
    const defaultVariant = ARCHETYPES[archetypeId]?.variants?.[0]?.id || '';
    setSelectedVariantId(defaultVariant);

    setFeedback(`Awesome! "${cleanWord}" matches our ${ARCHETYPES[archetypeId].categoryName} archetype!`);

    setTimeout(() => {
      setStep('variant_select');
      setFeedback(null);
    }, 1200);
  };

  const handleVariantSelect = (variantId: string) => {
    setSelectedVariantId(variantId);
    audio.playPopSound();
  };

  const handleVariantNext = () => {
    setStep('name_action');
  };

  // Step 2 Submit: Validate action name (another practice rep!)
  const handleActionSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanAction = actionInput.trim();
    if (!cleanAction) return;

    audio.playUnlockFanfare();
    audio.speakText(`Yay! ${customName} can do the ${cleanAction}!`);

    setStep('preview');

    // Create character object
    const newChar: CharacterInstance = {
      id: `char-${Date.now()}`,
      archetypeId: matchedArchetype,
      variantId: selectedVariantId || ARCHETYPES[matchedArchetype].variants[0]?.id,
      requestedName: requestInput,
      customName: customName || ARCHETYPES[matchedArchetype].name,
      customAction: cleanAction,
      unlockedAt: Date.now(),
      totalRepsCompleted: 2,
      level: 1,
      unlocked: true,
    };

    setTimeout(() => {
      onAddCharacter(newChar);
    }, 2500);
  };

  const handleMicInput = (forAction: boolean = false) => {
    if (isListening) {
      speechEngine.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    speechEngine.startListening({
      onTranscript: (transcript, isFinal) => {
        if (forAction) {
          setActionInput(transcript);
        } else {
          setRequestInput(transcript);
        }
        if (isFinal) {
          setIsListening(false);
        }
      },
      onError: (err) => {
        setIsListening(false);
        setFeedback(err);
      },
      onEnd: () => setIsListening(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white border-2 border-amber-300 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Progress Indicators */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-black uppercase text-amber-600 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
            {step === 'name_concept' && 'Practice Rep 1/2'}
            {step === 'variant_select' && 'Style Pick (Optional)'}
            {step === 'name_action' && 'Practice Rep 2/2'}
            {step === 'preview' && 'Friend Unlocked! 🎉'}
          </span>
          <div className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${step === 'name_concept' ? 'bg-amber-400 scale-110' : 'bg-emerald-500'}`} />
            <div className={`w-3 h-3 rounded-full ${step === 'variant_select' ? 'bg-purple-500 scale-110' : step === 'name_concept' ? 'bg-slate-200' : 'bg-emerald-500'}`} />
            <div className={`w-3 h-3 rounded-full ${step === 'name_action' ? 'bg-amber-400 scale-110' : step === 'preview' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            <div className={`w-3 h-3 rounded-full ${step === 'preview' ? 'bg-amber-400 scale-110' : 'bg-slate-200'}`} />
          </div>
        </div>

        {/* STEP 1: Name a character concept */}
        {step === 'name_concept' && (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-600 text-3xl font-black">
              ✦
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                What friend do you want?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                Type or say a friend's name (e.g. "pony", "dragon", "hero", "twilight", "dino")!
              </p>
            </div>

            <form onSubmit={handleConceptSubmit} className="w-full flex flex-col gap-3 mt-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={requestInput}
                  onChange={(e) => setRequestInput(e.target.value)}
                  placeholder="e.g. Pony, Dragon, Hero..."
                  className="flex-1 bg-slate-50 border-2 border-slate-200 focus:border-amber-400 rounded-2xl px-4 py-3 text-lg font-bold text-slate-800 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleMicInput(false)}
                  className={`p-3.5 rounded-2xl ${
                    isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>

              <button
                type="submit"
                disabled={!requestInput.trim()}
                className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-slate-900 font-black py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Check My Word</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            {/* Quick Keyword Tap Helpers */}
            <div className="w-full flex flex-wrap justify-center gap-2 mt-2">
              {['Pony', 'Dragon', 'Hero', 'Fairy', 'Dino', 'Robot'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setRequestInput(cat);
                  }}
                  className="bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1.5: Select Style Variant */}
        {step === 'variant_select' && (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="my-1">
              <CharacterVisual archetypeId={matchedArchetype} variantId={selectedVariantId} size="md" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                Pick a style for {customName}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                Select your favorite colors or tap next to keep the default!
              </p>
            </div>

            {/* Variant Option Cards */}
            <div className="grid grid-cols-2 gap-2.5 w-full my-2">
              {ARCHETYPES[matchedArchetype]?.variants?.map((v) => {
                const isSelected = v.id === selectedVariantId;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleVariantSelect(v.id)}
                    className={`p-3 rounded-2xl border-2 flex items-center gap-2.5 transition-all text-left ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50/80 ring-2 ring-purple-300 shadow-sm'
                        : 'border-slate-200 hover:border-purple-300 bg-slate-50'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full shrink-0 border border-white shadow-xs"
                      style={{ background: `linear-gradient(135deg, ${v.primaryColor}, ${v.secondaryColor})` }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-slate-800 truncate">{v.name}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-purple-600 shrink-0 stroke-[3]" />}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleVariantNext}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-black py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Looks Great! Next</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 2: Name what action it does */}
        {step === 'name_action' && (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="my-2">
              <CharacterVisual archetypeId={matchedArchetype} variantId={selectedVariantId} size="md" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                What action does {customName} do?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                Type or say an action (e.g. "dance", "fly", "sparkle", "laser beam", "stomp")!
              </p>
            </div>

            <form onSubmit={handleActionSubmit} className="w-full flex flex-col gap-3 mt-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value)}
                  placeholder="e.g. Galaxy Dance, High Fly..."
                  className="flex-1 bg-slate-50 border-2 border-slate-200 focus:border-pink-400 rounded-2xl px-4 py-3 text-lg font-bold text-slate-800 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleMicInput(true)}
                  className={`p-3.5 rounded-2xl ${
                    isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>

              <button
                type="submit"
                disabled={!actionInput.trim()}
                className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Unlock My Friend!</span>
                <Sparkles className="w-5 h-5" />
              </button>
            </form>

            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {ARCHETYPES[matchedArchetype].defaultActions.map((act) => (
                <button
                  key={act}
                  onClick={() => setActionInput(act)}
                  className="bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold px-3 py-1 rounded-xl transition-colors"
                >
                  {act}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Preview Payoff Animation */}
        {step === 'preview' && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <CharacterVisual
              archetypeId={matchedArchetype}
              variantId={selectedVariantId}
              actionState="performing"
              actionName={actionInput}
              size="lg"
              showSparkles={true}
            />

            <div>
              <h2 className="text-2xl font-black text-slate-900">
                🎉 {customName} is Ready!
              </h2>
              <p className="text-sm font-bold text-purple-600 mt-1">
                Doing the "{actionInput}"!
              </p>
            </div>
          </div>
        )}

        {/* Feedback Message */}
        {feedback && (
          <p className="text-xs font-bold text-amber-800 bg-amber-100 p-2.5 rounded-xl text-center mt-4">
            {feedback}
          </p>
        )}
      </motion.div>
    </div>
  );
};
