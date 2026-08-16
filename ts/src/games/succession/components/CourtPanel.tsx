import React from 'react';
import { FigureState, FigureId } from '../engine/types';
import { FigureCard } from './FigureCard';
import { Users } from 'lucide-react';

interface CourtPanelProps {
  figures: FigureState[];
  selectedFigureId: FigureId | null;
  onSelectFigure: (id: FigureId) => void;
}

export const CourtPanel: React.FC<CourtPanelProps> = ({
  figures,
  selectedFigureId,
  onSelectFigure,
}) => {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-300 font-serif font-semibold text-sm sm:text-base">
          <Users className="w-4 h-4 text-amber-400" />
          <h2>The Council Chamber</h2>
        </div>
        <span className="text-xs text-stone-500 font-sans">
          Select a figure to direct your diplomatic action
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {figures.map((figure) => (
          <FigureCard
            key={figure.id}
            figure={figure}
            isSelected={selectedFigureId === figure.id}
            onSelect={onSelectFigure}
          />
        ))}
      </div>
    </section>
  );
};
