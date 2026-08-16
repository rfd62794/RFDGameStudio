import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { House, HouseSpecialization } from '../types';
import { selectHouseSpecializationApi } from '../services/api';
import { Hammer, Coins, Scroll, Lock, CheckCircle2, AlertCircle, Award } from 'lucide-react';

interface SpecializationCardProps {
  kingdomId: string;
  houseId: string;
  userId: string;
  onRefreshParent?: () => void;
}

interface SpecOption {
  id: 'provisioners' | 'builders' | 'diplomats';
  title: string;
  icon: React.ElementType;
  color: string;
  borderActive: string;
  bgActive: string;
  badgeColor: string;
  description: string;
  perk: string;
}

const SPECIALIZATIONS: SpecOption[] = [
  {
    id: 'provisioners',
    title: 'Provisioners Guild',
    icon: Coins,
    color: 'text-amber-400',
    borderActive: 'border-amber-500/50',
    bgActive: 'bg-amber-500/10',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Master merchants who optimize resource logistics and supply lines.',
    perk: '+10% Gold multiplier from all completed Expedition tasks.',
  },
  {
    id: 'builders',
    title: 'Master Architects',
    icon: Hammer,
    color: 'text-blue-400',
    borderActive: 'border-blue-500/50',
    bgActive: 'bg-blue-500/10',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    description: 'Renowned stonemasons and engineers who streamline construction.',
    perk: '15% Food & Wood discount on all House Chapel upgrades.',
  },
  {
    id: 'diplomats',
    title: 'Grand Envoys',
    icon: Scroll,
    color: 'text-purple-400',
    borderActive: 'border-purple-500/50',
    bgActive: 'bg-purple-500/10',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    description: 'Charismatic ambassadors who amplify house influence across the realm.',
    perk: '+15% House Reputation Score yield on all Festival contributions.',
  },
];

export const SpecializationCard: React.FC<SpecializationCardProps> = ({
  kingdomId,
  houseId,
  userId: _userId,
  onRefreshParent,
}) => {
  const [houseData, setHouseData] = useState<House | null>(null);
  const [selectedSpec, setSelectedSpec] = useState<HouseSpecialization>('none');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const houseRef = doc(db, 'kingdoms', kingdomId, 'houses', houseId);
    const unsubscribe = onSnapshot(
      houseRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const spec = (data.specialization as HouseSpecialization) || 'none';
          setSelectedSpec(spec);
          setHouseData({
            id: houseId,
            name: data.name || 'House of Kings',
            createdAt: data.createdAt || Date.now(),
            reputationScore: Number(data.reputationScore) || 0,
            reputationLevel: Number(data.reputationLevel) || 0,
            specialization: spec,
          });
        }
      },
      (err) => console.warn('House snapshot listener error in SpecializationCard:', err)
    );

    return () => unsubscribe();
  }, [kingdomId, houseId]);

  const level = houseData?.reputationLevel || 0;
  const isUnlocked = level >= 2;
  const hasChosen = selectedSpec && selectedSpec !== 'none';

  const handleSelect = async (specId: 'provisioners' | 'builders' | 'diplomats') => {
    if (!isUnlocked || hasChosen || submitting) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await selectHouseSpecializationApi(specId, kingdomId, houseId);
      setMessage({
        type: 'success',
        text: res.message || `Specialization locked as ${specId}!`,
      });
      setSelectedSpec(specId);
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.data?.error || err.message || 'Failed to select specialization.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-100">House Specialization</h3>
              {hasChosen ? (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Locked
                </span>
              ) : isUnlocked ? (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                  Unlocked — Choose One
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono border border-slate-700 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Unlocks at Level 2
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Permanently align your House with a distinguished guild discipline once reaching Reputation Level 2.
            </p>
          </div>
        </div>
      </div>

      {/* Status Feedback */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Specialization Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SPECIALIZATIONS.map((spec) => {
          const Icon = spec.icon;
          const isCurrent = selectedSpec === spec.id;
          const isSelectable = isUnlocked && !hasChosen;

          return (
            <div
              key={spec.id}
              className={`rounded-xl p-4 border transition-all flex flex-col justify-between relative ${
                isCurrent
                  ? `${spec.bgActive} ${spec.borderActive} shadow-lg ring-1 ring-amber-500/30`
                  : hasChosen
                  ? 'bg-slate-950/40 border-slate-800/50 opacity-50'
                  : isUnlocked
                  ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  : 'bg-slate-950/40 border-slate-800/40 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-slate-900 border border-slate-800 ${spec.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm text-slate-200">{spec.title}</span>
                  </div>
                  {isCurrent && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${spec.badgeColor}`}>
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mb-3">{spec.description}</p>

                <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800/80 mb-3">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">
                    House Perk
                  </div>
                  <div className={`text-xs font-medium ${spec.color}`}>{spec.perk}</div>
                </div>
              </div>

              <div>
                {isSelectable ? (
                  <button
                    onClick={() => handleSelect(spec.id)}
                    disabled={submitting}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Locking In...' : `Select ${spec.title}`}
                  </button>
                ) : isCurrent ? (
                  <div className="text-center text-xs font-semibold text-emerald-400 py-1.5 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Specialization Active
                  </div>
                ) : (
                  <div className="text-center text-xs text-slate-500 py-1.5 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" />
                    {!isUnlocked ? 'Level 2 Required' : 'Locked'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
