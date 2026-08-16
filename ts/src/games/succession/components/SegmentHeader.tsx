import React from 'react';
import { Clock, ShieldAlert } from 'lucide-react';
import { SEGMENT_LABELS } from '../data/segmentLabels';
import { TOTAL_SEGMENTS } from '../data/gameConstants';

interface SegmentHeaderProps {
  segment: number;
}

export const SegmentHeader: React.FC<SegmentHeaderProps> = ({ segment }) => {
  const timeLabel = SEGMENT_LABELS[segment] || 'Hour of Judgment';

  return (
    <header className="border-b border-stone-800 bg-stone-900/80 backdrop-blur-sm sticky top-0 z-20 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="font-serif font-bold tracking-wider text-amber-300 text-lg sm:text-xl">
          SUCCESSION
        </span>
        <span className="text-stone-600 text-sm hidden sm:inline">|</span>
        <span className="text-stone-400 text-xs sm:text-sm font-serif hidden md:inline">
          The Council of Three
        </span>
        <span className="text-stone-600 text-sm hidden md:inline">•</span>
        <span className="text-amber-400/90 text-xs font-serif font-medium bg-amber-950/40 border border-amber-800/30 px-2 py-0.5 rounded">
          2 of 3 Councils needed by Midnight
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        {/* Segment Progress Indicators */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL_SEGMENTS }).map((_, idx) => {
            const segNum = idx + 1;
            const isCompleted = segNum < segment;
            const isCurrent = segNum === segment;

            return (
              <div
                key={segNum}
                title={`Segment ${segNum}: ${SEGMENT_LABELS[segNum]}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? 'w-6 bg-amber-400 shadow-sm shadow-amber-400/50'
                    : isCompleted
                    ? 'w-2 bg-stone-600'
                    : 'w-2 bg-stone-800'
                }`}
              />
            );
          })}
        </div>

        {/* Time of Day Badge */}
        <div className="flex items-center gap-2 bg-stone-950/80 border border-stone-800 px-3 py-1.5 rounded-lg text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-stone-200 font-medium">Segment {segment}/8</span>
          <span className="text-stone-500">•</span>
          <span className="text-amber-300/90 font-serif font-semibold">{timeLabel}</span>
        </div>

        {segment === TOTAL_SEGMENTS && (
          <span className="flex items-center gap-1 text-xs text-rose-400 font-semibold animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            Final Segment!
          </span>
        )}
      </div>
    </header>
  );
};
