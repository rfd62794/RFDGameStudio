import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface RaidVirtualDpadProps {
  onMove: (dx: number, dy: number) => void;
}

export const RaidVirtualDpad: React.FC<RaidVirtualDpadProps> = ({ onMove }) => {
  return (
    <div
      id="raid-virtual-dpad"
      className="absolute bottom-4 right-4 bg-[#0f172a]/80 backdrop-blur p-2 rounded-xl border border-[#334155] flex flex-col items-center gap-1 shadow-xl sm:flex hidden z-20"
    >
      <button
        onClick={() => onMove(0, -1)}
        className="w-8 h-8 rounded bg-[#1e293b] hover:bg-[#334155] flex items-center justify-center text-[#94a3b8] hover:text-white cursor-pointer"
      >
        <ArrowUp className="w-4 h-4" />
      </button>
      <div className="flex gap-1">
        <button
          onClick={() => onMove(-1, 0)}
          className="w-8 h-8 rounded bg-[#1e293b] hover:bg-[#334155] flex items-center justify-center text-[#94a3b8] hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onMove(0, 1)}
          className="w-8 h-8 rounded bg-[#1e293b] hover:bg-[#334155] flex items-center justify-center text-[#94a3b8] hover:text-white cursor-pointer"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        <button
          onClick={() => onMove(1, 0)}
          className="w-8 h-8 rounded bg-[#1e293b] hover:bg-[#334155] flex items-center justify-center text-[#94a3b8] hover:text-white cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
