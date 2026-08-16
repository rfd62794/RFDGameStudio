import React from 'react';
import { Radio, AlertOctagon, MessageSquare, Scale, FileCheck, Search, Gavel } from 'lucide-react';
import { TickerEntry } from '../types/gameState';
import { COURT_FIGURES } from '../data/courtFigures';
import { CLAIMANTS } from '../data/claimants';
import { SEGMENT_LABELS } from '../data/segmentLabels';

interface GossipTickerProps {
  entries: TickerEntry[];
}

export const GossipTicker: React.FC<GossipTickerProps> = ({ entries }) => {
  // Show in reverse chronological order (most recent first)
  const recentEntries = [...entries].reverse();

  const getMoveIcon = (type: TickerEntry['moveType'], isExposed?: boolean) => {
    if (isExposed) return <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />;
    switch (type) {
      case 'whisper':
        return <MessageSquare className="w-3.5 h-3.5 text-amber-400" />;
      case 'appeal':
        return <Scale className="w-3.5 h-3.5 text-sky-400" />;
      case 'evidence':
        return <FileCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'scout':
        return <Search className="w-3.5 h-3.5 text-purple-400" />;
      case 'indictment':
        return <Gavel className="w-3.5 h-3.5 text-purple-400" />;
      case 'slander':
        return <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  const getNarrativeShiftBadge = (entry: TickerEntry) => {
    if (entry.exposed) {
      return (
        <span className="font-serif text-[11px] font-semibold text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded">
          Perjury Exposed
        </span>
      );
    }
    switch (entry.moveType) {
      case 'whisper':
        return (
          <span className="font-serif text-[11px] font-medium text-amber-300 bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded">
            Audacious Sway
          </span>
        );
      case 'appeal':
        return (
          <span className="font-serif text-[11px] font-medium text-sky-300 bg-sky-950/40 border border-sky-800/50 px-2 py-0.5 rounded">
            Measured Sway
          </span>
        );
      case 'evidence':
        return (
          <span className="font-serif text-[11px] font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-700/50 px-2 py-0.5 rounded">
            Decisive Proof
          </span>
        );
      case 'scout':
        return (
          <span className="font-serif text-[11px] font-medium text-purple-300 bg-purple-950/40 border border-purple-800/50 px-2 py-0.5 rounded">
            Archive Found
          </span>
        );
      case 'indictment':
        return (
          <span className="font-serif text-[11px] font-bold text-purple-300 bg-purple-950/60 border border-purple-800/70 px-2 py-0.5 rounded">
            Indictment Proved (+40)
          </span>
        );
      case 'slander':
        return (
          <span className="font-serif text-[11px] font-bold text-rose-300 bg-rose-950/60 border border-rose-800/70 px-2 py-0.5 rounded">
            Slander (-10)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <section className="space-y-3 bg-stone-900/60 border border-stone-800 rounded-xl p-5">
      <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
        <div className="flex items-center gap-2 text-stone-300 font-serif font-semibold text-sm">
          <Radio className="w-4 h-4 text-amber-400" />
          <h2>Court Whispers & Intelligence Feed</h2>
        </div>
        <span className="text-[11px] text-stone-500 font-mono">
          {entries.length} recorded events
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-stone-500 italic py-4 text-center">
          The Council has just convened. No moves have been made yet.
        </p>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {recentEntries.map((entry, idx) => {
            const claimant = CLAIMANTS[entry.claimantId];
            const figure = entry.figureId ? COURT_FIGURES[entry.figureId] : null;
            const segName = SEGMENT_LABELS[entry.segment] || `Segment ${entry.segment}`;

            return (
              <div
                key={`${entry.segment}-${entry.claimantId}-${idx}`}
                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                  entry.exposed
                    ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                    : claimant.isPlayer
                    ? 'bg-amber-950/20 border-amber-800/40 text-stone-200'
                    : 'bg-stone-950/60 border-stone-800/80 text-stone-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="shrink-0">{getMoveIcon(entry.moveType, entry.exposed)}</div>
                  <div className="truncate">
                    <span className="font-semibold text-stone-100 mr-1.5">
                      {claimant.name}
                    </span>
                    {entry.moveType === 'scout' ? (
                      <span className="text-purple-300">
                        scouted the castle archives for evidence
                      </span>
                    ) : entry.moveType === 'slander' ? (
                      <span>
                        slandered your standing before{' '}
                        <strong className="text-rose-300">{figure?.name}</strong> (-10 favor)
                      </span>
                    ) : entry.moveType === 'evidence' ? (
                      <span>
                        presented domain evidence to{' '}
                        <strong className="text-emerald-300">{figure?.name}</strong>
                      </span>
                    ) : entry.moveType === 'appeal' ? (
                      <span>
                        formally appealed to{' '}
                        <strong className="text-sky-300">{figure?.name}</strong>
                      </span>
                    ) : entry.exposed ? (
                      <span className="text-rose-400 font-medium">
                        whispered to <strong className="text-rose-300">{figure?.name}</strong> and was{' '}
                        <strong>EXPOSED for lying!</strong>
                      </span>
                    ) : (
                      <span>
                        whispered court claims to{' '}
                        <strong className="text-amber-300">{figure?.name}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 text-[11px] font-sans text-stone-400">
                  {getNarrativeShiftBadge(entry)}
                  <span className="text-stone-600 hidden sm:inline">•</span>
                  <span className="text-stone-500 hidden sm:inline font-mono">{segName}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
