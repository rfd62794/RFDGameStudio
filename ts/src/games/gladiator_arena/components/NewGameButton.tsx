// new: ts/src/games/gladiator_arena/components/NewGameButton.tsx
import { RotateCcw } from 'lucide-react';
import { useArmedConfirm } from '../utils/useArmedConfirm';

export function NewGameButton({ onConfirm }: { onConfirm: () => void }) {
  const { armed, trigger } = useArmedConfirm(onConfirm);

  return (
    <button
      id="ga-new-game-btn"
      onClick={trigger}
      title="New Game (wipes stable)"
      className={`p-2 rounded-lg transition text-xs flex items-center gap-1 ${
        armed
          ? 'bg-red-600 text-white font-bold'
          : 'bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700'
      }`}
    >
      <RotateCcw className="w-3.5 h-3.5" />
      <span>{armed ? 'Confirm: wipe stable?' : 'New Game'}</span>
    </button>
  );
}
