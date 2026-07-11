import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Droplet, Shield, Wind, Sparkles, HelpCircle, AlertCircle, Trash2 } from 'lucide-react';
import type { ElementType, ComponentType, ResidueStatus } from '../types';
import { getElementColor, getComponentColor, solveBrew, getElementForResidueTag } from '../gameLogic';

interface CauldronSectionProps {
  element1: ElementType | null;
  element2: ElementType | null;
  component: ComponentType | null;
  residues: ResidueStatus[];
  onRemoveElement: (slot: 1 | 2) => void;
  onRemoveComponent: () => void;
  onBrew: () => void;
  currentTurn: number;
}

export default function CauldronSection({
  element1,
  element2,
  component,
  residues,
  onRemoveElement,
  onRemoveComponent,
  onBrew,
  currentTurn,
}: CauldronSectionProps) {
  const hasMinRecipe = (element1 || element2) && component;
  const previewBrew = hasMinRecipe ? solveBrew(element1, element2, component!, currentTurn) : null;

  const getElementIcon = (el: ElementType, sizeClass = 'w-5 h-5') => {
    switch (el) {
      case 'fire':
        return <Flame className={`${sizeClass} text-rose-500 fill-rose-500/10`} />;
      case 'water':
        return <Droplet className={`${sizeClass} text-sky-400 fill-sky-400/10`} />;
      case 'earth':
        return <Shield className={`${sizeClass} text-emerald-500 fill-emerald-500/10`} />;
      case 'air':
        return <Wind className={`${sizeClass} text-fuchsia-400`} />;
    }
  };

  const getResidueTagLabel = (tag: string) => {
    switch (tag) {
      case 'burning':
        return 'Burning (Fire)';
      case 'soaked':
        return 'Soaked (Water)';
      case 'fortified':
        return 'Fortified (Earth)';
      case 'windswept':
        return 'Windswept (Air)';
      default:
        return tag;
    }
  };

  const getResidueDescription = (tag: string, level: number) => {
    const isWindswept = residues.some((r) => r.tag === 'windswept');
    const factor = isWindswept ? 2 : 1;

    switch (tag) {
      case 'burning':
        return `Deals ${level * 2 * factor} damage to the enemy at turn end.${isWindswept ? ' (DOUBLED BY WIND!)' : ''}`;
      case 'soaked':
        return `Reduces enemy attack damage by -${level * 1 * factor}.${isWindswept ? ' (DOUBLED BY WIND!)' : ''}`;
      case 'fortified':
        return 'Blocks other residues from being overwritten easily. Persists longest.';
      case 'windswept':
        return 'Has no standalone effect, but amplifies (doubles) other active residue numbers!';
      default:
        return '';
    }
  };

  const getResidueBg = (tag: string) => {
    switch (tag) {
      case 'burning':
        return 'bg-rose-950/50 border-rose-800 text-rose-300 shadow-[0_0_8px_rgba(239,68,68,0.15)]';
      case 'soaked':
        return 'bg-sky-950/50 border-sky-800 text-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.15)]';
      case 'fortified':
        return 'bg-emerald-950/50 border-emerald-800 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.15)]';
      case 'windswept':
        return 'bg-fuchsia-950/50 border-fuchsia-800 text-fuchsia-300 shadow-[0_0_8px_rgba(192,132,252,0.15)]';
      default:
        return 'bg-stone-900 border-stone-850';
    }
  };

  return (
    <div
      className="w-full bg-stone-950/40 border border-stone-900/60 rounded-xl p-6 flex flex-col items-center relative min-h-[380px]"
      id="cauldron-section"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-stone-900/40 pointer-events-none flex items-center justify-center -z-10">
        <div className="w-64 h-64 rounded-full border border-dashed border-stone-900/30" />
      </div>

      <div className="w-full mb-6">
        <div className="flex items-center justify-between mb-3 border-b border-stone-900 pb-1.5">
          <span className="text-[10px] uppercase tracking-widest text-stone-500 font-mono font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Cauldron Residue Field
          </span>
          <span className="text-[9px] font-mono text-stone-500">MAX: 2 TAGS</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((index) => {
            const res = residues[index];
            return (
              <AnimatePresence mode="wait" key={index}>
                {res ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className={`border p-3 rounded-lg flex flex-col justify-between h-20 transition-all ${getResidueBg(res.tag)}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono tracking-tight flex items-center gap-1.5 capitalize">
                        {getElementIcon(getElementForResidueTag(res.tag), 'w-3.5 h-3.5')}
                        {getResidueTagLabel(res.tag)}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-stone-950/80 border border-current font-extrabold">
                        LVL {res.level}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-300 leading-snug font-mono italic">
                      {getResidueDescription(res.tag, res.level)}
                    </p>
                  </motion.div>
                ) : (
                  <div className="border border-dashed border-stone-900 bg-stone-950/20 text-stone-600 rounded-lg p-3 flex flex-col items-center justify-center h-20 text-[10px] font-mono">
                    <HelpCircle className="w-4 h-4 text-stone-700 mb-1" />
                    [ EMPTY SEDIMENT SLOT ]
                  </div>
                )}
              </AnimatePresence>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-5 my-auto py-4 w-full">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[9px] font-mono uppercase text-stone-500 tracking-wider">
            ELEMENT 1
          </span>
          <motion.button
            whileHover={element1 ? { scale: 1.05 } : {}}
            onClick={() => element1 && onRemoveElement(1)}
            className={`w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center relative cursor-pointer group transition-all duration-300
              ${
                element1
                  ? 'bg-stone-900 hover:bg-stone-850 text-stone-100 shadow-md'
                  : 'border-dashed border-stone-800 bg-stone-950/40 text-stone-600 hover:border-stone-700'
              }
            `}
            style={element1 ? { borderColor: getElementColor(element1) } : {}}
          >
            {element1 ? (
              <>
                {getElementIcon(element1, 'w-8 h-8 animate-pulse')}
                <span className="text-[9px] font-mono font-bold uppercase mt-1 tracking-tighter capitalize">
                  {element1}
                </span>
                <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-rose-950/90 text-rose-400 p-0.5 rounded border border-rose-850">
                  <Trash2 className="w-3 h-3" />
                </div>
              </>
            ) : (
              <span className="text-xl font-bold font-mono opacity-40">+</span>
            )}
          </motion.button>
        </div>

        <span className="text-stone-700 font-mono text-lg select-none font-extrabold mt-4">+</span>

        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[9px] font-mono uppercase text-stone-500 tracking-wider">
            ELEMENT 2
          </span>
          <motion.button
            whileHover={element2 ? { scale: 1.05 } : {}}
            onClick={() => element2 && onRemoveElement(2)}
            className={`w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center relative cursor-pointer group transition-all duration-300
              ${
                element2
                  ? 'bg-stone-900 hover:bg-stone-850 text-stone-100 shadow-md'
                  : 'border-dashed border-stone-800 bg-stone-950/40 text-stone-600 hover:border-stone-700'
              }
            `}
            style={element2 ? { borderColor: getElementColor(element2) } : {}}
          >
            {element2 ? (
              <>
                {getElementIcon(element2, 'w-8 h-8 animate-pulse')}
                <span className="text-[9px] font-mono font-bold uppercase mt-1 tracking-tighter capitalize">
                  {element2}
                </span>
                <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-rose-950/90 text-rose-400 p-0.5 rounded border border-rose-850">
                  <Trash2 className="w-3 h-3" />
                </div>
              </>
            ) : (
              <span className="text-xl font-bold font-mono opacity-40">+</span>
            )}
          </motion.button>
        </div>

        <span className="text-stone-700 font-mono text-lg select-none font-extrabold mt-4">→</span>

        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[9px] font-mono uppercase text-stone-500 tracking-wider">
            COMPONENT
          </span>
          <motion.button
            whileHover={component ? { scale: 1.05 } : {}}
            onClick={() => component && onRemoveComponent()}
            className={`w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center relative cursor-pointer group transition-all duration-300
              ${
                component
                  ? 'bg-stone-900 hover:bg-stone-850 text-stone-100 shadow-md'
                  : 'border-dashed border-stone-800 bg-stone-950/40 text-stone-600 hover:border-stone-700'
              }
            `}
            style={component ? { borderColor: getComponentColor(component) } : {}}
          >
            {component ? (
              <>
                <span className="text-[10px] font-bold font-mono text-stone-300 mb-0.5">SHAPE</span>
                <span
                  className="text-xs font-mono font-extrabold uppercase tracking-tight capitalize"
                  style={{ color: getComponentColor(component) }}
                >
                  {component}
                </span>
                <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-rose-950/90 text-rose-400 p-0.5 rounded border border-rose-850">
                  <Trash2 className="w-3 h-3" />
                </div>
              </>
            ) : (
              <span className="text-xl font-bold font-mono opacity-40">+</span>
            )}
          </motion.button>
        </div>
      </div>

      <div className="w-full mt-auto pt-4 border-t border-stone-900 flex flex-col items-center">
        {previewBrew ? (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full text-center mb-4 px-3 py-2 bg-stone-900/30 border border-stone-850 rounded-lg text-xs font-mono"
          >
            <div className="text-stone-400 text-[10px] uppercase font-bold tracking-tight mb-1">
              REACTION ANALYSIS PREVIEW:
            </div>
            <p className="text-stone-200 font-bold mb-1 font-sans text-sm" style={{ color: previewBrew.color }}>
              {previewBrew.name}
            </p>
            <p className="text-stone-400 text-[10px] leading-relaxed max-w-md mx-auto">
              {previewBrew.description}
            </p>
            {previewBrew.combination === 'opposed' && (
              <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-950/40 border border-amber-900/40 rounded text-amber-500 text-[9px] font-extrabold uppercase animate-pulse">
                <AlertCircle className="w-3 h-3" />
                Volatile Blend! 50% / 150% gamble roll. No residue.
              </div>
            )}
          </motion.div>
        ) : (
          <div className="text-center text-stone-500 text-[10px] font-mono py-2 italic mb-4">
            Select at least 1 Element (from hand) and 1 Component shape to analyze recipe.
          </div>
        )}

        <motion.button
          whileHover={hasMinRecipe ? { scale: 1.03 } : {}}
          whileTap={hasMinRecipe ? { scale: 0.98 } : {}}
          disabled={!hasMinRecipe}
          onClick={onBrew}
          className={`px-12 py-3 rounded-xl font-extrabold tracking-widest text-sm border font-serif select-none cursor-pointer transition-all duration-300
            ${
              hasMinRecipe
                ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 border-amber-400 shadow-lg shadow-amber-950/40 cursor-pointer animate-pulse'
                : 'bg-stone-900 text-stone-600 border-stone-850 cursor-not-allowed opacity-55'
            }
          `}
          id="btn-brew"
        >
          {previewBrew?.combination === 'opposed' ? 'TRIGGER VOLATILE BREW 🎲' : 'IGNITE BREW 🧪'}
        </motion.button>
      </div>
    </div>
  );
}
