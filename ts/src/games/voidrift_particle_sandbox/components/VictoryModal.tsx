import React from 'react';
import { Award } from 'lucide-react';

interface VictoryModalProps {
  isOpen: boolean;
  onContinue: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ isOpen, onContinue }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#11192e] to-[#0a0f1d] border border-amber-500/50 rounded-2xl max-w-lg w-full p-6 text-center shadow-2xl shadow-amber-500/20 space-y-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/40 animate-bounce">
          <Award className="w-8 h-8 text-slate-950" />
        </div>
        <h2 className="text-xl font-bold text-amber-300 tracking-wide">
          RECONSTRUCTION COMPLETE
        </h2>
        <p className="text-sm font-serif italic text-amber-100/90 leading-relaxed bg-[#0b101f] p-4 rounded-xl border border-amber-500/30">
          "The first things exist again. The universe remembers."
        </p>
        <p className="text-xs text-slate-300 leading-relaxed">
          All five primeval constructs have been resurrected through complete automation loops,
          reactions, and refining conduits. You may continue freely experimenting with infinite
          cellular automata physics in the sandbox.
        </p>
        <button
          id="btn-continue-endless"
          onClick={onContinue}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/30 transition cursor-pointer"
        >
          Continue Endless Sandbox
        </button>
      </div>
    </div>
  );
};
