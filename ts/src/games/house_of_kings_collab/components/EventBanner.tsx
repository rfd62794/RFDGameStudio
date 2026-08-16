import React, { useState, useEffect } from 'react';
import { getCurrentRealmEvent, RealmEvent } from '../lib/realmEvents';
import { Wheat, TreePine, Coins, Sparkles, Clock, Zap } from 'lucide-react';

export const EventBanner: React.FC<{ serverOffsetMs?: number }> = ({ serverOffsetMs = 0 }) => {
  const [currentEventData, setCurrentEventData] = useState(() => getCurrentRealmEvent(Date.now() + serverOffsetMs));
  const [remainingTimeStr, setRemainingTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = Date.now() + serverOffsetMs;
      const data = getCurrentRealmEvent(now);
      setCurrentEventData(data);

      const totalSec = Math.floor(data.remainingMs / 1000);
      const minutes = Math.floor(totalSec / 60);
      const seconds = totalSec % 60;
      setRemainingTimeStr(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [serverOffsetMs]);

  const { event } = currentEventData;

  const renderIcon = () => {
    switch (event.id) {
      case 'bountiful_harvest':
        return <Wheat className="w-5 h-5 text-emerald-400" />;
      case 'timber_rush':
        return <TreePine className="w-5 h-5 text-amber-400" />;
      case 'crown_jubilee':
        return <Coins className="w-5 h-5 text-yellow-400" />;
      case 'holy_convocation':
        return <Sparkles className="w-5 h-5 text-indigo-400" />;
      default:
        return <Zap className="w-5 h-5 text-amber-400" />;
    }
  };

  const getBoostBadge = () => {
    switch (event.modifierType) {
      case 'food_worker':
        return '+50% Food Worker Gathering';
      case 'wood_worker':
        return '+50% Wood Worker Gathering';
      case 'task_gold':
        return '+25% Expedition Gold Bounty';
      case 'festival_reputation':
        return '+50% Festival Reputation Gain';
      default:
        return 'Active Boost';
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
            {renderIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Active Realm Event
              </span>
              <span className="text-xs font-semibold text-amber-100">{event.name}</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">{event.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:self-center shrink-0">
          <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-medium text-emerald-300">
            {getBoostBadge()}
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-slate-200">{remainingTimeStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
