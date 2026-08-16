import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LegacyItem } from '../types';
import { Sparkles, Award, Gem, Clock, User, Compass } from 'lucide-react';

interface LegacyItemsCardProps {
  kingdomId: string;
  houseId: string;
  userId: string;
  onRefreshParent?: () => void;
}

export const LegacyItemsCard: React.FC<LegacyItemsCardProps> = ({
  kingdomId,
  houseId,
  userId,
}) => {
  const [legacyItems, setLegacyItems] = useState<LegacyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) return;

    const playerRef = doc(db, 'kingdoms', kingdomId, 'houses', houseId, 'players', userId);
    const unsubscribe = onSnapshot(
      playerRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const items: LegacyItem[] = Array.isArray(data.legacyItems) ? data.legacyItems : [];
          setLegacyItems(items);
        } else {
          setLegacyItems([]);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('LegacyItemsCard snapshot error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [kingdomId, houseId, userId]);

  const totalBonusPercent = legacyItems.reduce(
    (acc, item) => acc + Math.round((Number(item.bonusMultiplier) || 0.05) * 100),
    0
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mt-0.5">
            <Gem className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">
                Phase 14 Legacy System
              </span>
              <span className="text-xs text-slate-400 font-mono">Provenance Tracked</span>
            </div>
            <h3 className="text-xl font-bold text-amber-100 mt-1">
              Ancestral Heirlooms & Legacy Relics
            </h3>
            <p className="text-sm text-slate-400 mt-0.5">
              Ancient royal artifacts unearthed during deep wilderness expeditions. Each heirloom permanently boosts expedition Gold yields.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 self-start sm:self-center">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Legacy Bonus</div>
            <div className="text-sm font-bold text-amber-300 font-mono">
              +{totalBonusPercent}% Gold Yield
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-6 text-xs text-slate-500 animate-pulse">
          Inspecting royal vault for heirloom artifacts...
        </div>
      ) : legacyItems.length === 0 ? (
        <div className="bg-slate-950/70 border border-dashed border-slate-800 rounded-xl p-6 text-center space-y-2">
          <Compass className="w-8 h-8 text-slate-600 mx-auto" />
          <div className="text-sm font-semibold text-slate-300">No Ancestral Relics Discovered Yet</div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Embark on <strong className="text-amber-300 font-medium">Extended Wilderness Expeditions (480s)</strong> for a 25% chance to discover legendary family heirlooms preserved since the First Dynasty.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {legacyItems.map((item, idx) => {
            const bonusPercent = Math.round((Number(item.bonusMultiplier) || 0.05) * 100);
            return (
              <div
                key={item.id || idx}
                className="bg-slate-950/80 border border-amber-500/20 hover:border-amber-500/40 rounded-xl p-4 space-y-3 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 group-hover:scale-105 transition-transform">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-200">{item.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {item.id}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/30">
                    +{bonusPercent}% Gold
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate" title={item.foundByDescendant}>
                      {item.foundByDescendant || 'Royal Descendant'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Compass className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{item.foundAtTask || 'Extended Expedition'}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5 text-slate-400 text-[10px]">
                    <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>
                      Discovered: {item.acquiredAt ? new Date(item.acquiredAt).toLocaleString() : 'Ancient Era'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
