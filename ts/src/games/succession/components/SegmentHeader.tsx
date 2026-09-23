import React from 'react';
import { Clock, ShieldAlert } from 'lucide-react';
import { SEGMENT_LABELS } from '../data/segmentLabels';
import { TOTAL_SEGMENTS } from '../data/gameConstants';

interface SegmentHeaderProps {
  segment: number;
}

// Rendered as GameShell's `statusArea` (see App.tsx) — GameShell already
// owns the marquee title/back-button/header chrome (gameLabel="Succession"),
// so this only renders Succession's own real status readout, matching
// the statusArea usage pattern in games/chimera_wilds/App.tsx and
// games/horse_racing/App.tsx (a plain content fragment, no own <header>).
export const SegmentHeader: React.FC<SegmentHeaderProps> = ({ segment }) => {
  const timeLabel = SEGMENT_LABELS[segment] || 'Hour of Judgment';

  return (
    <div className="flex flex-wrap items-center gap-3 sm:gap-5">
      <span className="text-amber-400/90 text-[11px] font-serif font-medium bg-amber-950/40 border border-amber-800/30 px-2 py-0.5 rounded hidden lg:inline-block">
        2 of 3 Councils needed by Midnight
      </span>

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
  );
};
