import React from 'react';
import { Heart, Eye, Gift, Trophy, Zap } from 'lucide-react';
import { RunNode } from '../types';

interface RestOrAttachmentProps {
  rolledAttachment: 'peek' | 'gift' | 'treasure';
  healAmount: number;
  isRestDisabled: boolean;
  isAttachmentDisabled: boolean;
  isPreBossNode: boolean;
  peekNodes: RunNode[] | null;
  giftDetails: any;
  treasureDetails: any;
  handleRest: () => void;
  handlePeekAction: () => void;
  handleClaimGift: () => void;
  handleClaimTreasure: () => void;
}

export default function RestOrAttachment({
  rolledAttachment,
  healAmount,
  isRestDisabled,
  isAttachmentDisabled,
  isPreBossNode,
  peekNodes,
  giftDetails,
  treasureDetails,
  handleRest,
  handlePeekAction,
  handleClaimGift,
  handleClaimTreasure
}: RestOrAttachmentProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* BASELINE OPTION: HEAL */}
      <div className="p-5 bg-slate-950/40 border border-slate-800 rounded-2xl flex flex-col justify-between gap-6">
        <div>
          <div className="bg-emerald-950/30 text-emerald-400 p-2.5 rounded-xl border border-emerald-900/30 w-fit">
            <Heart className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-slate-200 mt-4">
            Align Integrity (Heal)
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Synthesize environmental wavelengths to restore physical constructs.
          </p>
          {rolledAttachment === 'gift' && (
            <div className="mt-3 p-2.5 bg-amber-950/30 border border-amber-900/40 rounded-xl text-[11px] font-mono text-amber-300">
              ⚠️ Choosing Heal will decline this room's Gift offer and increment your cumulative skip count (+1 skip)!
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-xs font-mono bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-emerald-400 text-center">
            Expected Outcome: Recover +{healAmount} HP
          </div>
          <button
            onClick={handleRest}
            disabled={isRestDisabled}
            className={`w-full py-3 text-slate-950 font-bold rounded-xl text-xs transition-all uppercase tracking-wider font-display ${
              isRestDisabled 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' 
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
            id="rest-hp-btn"
          >
            {isRestDisabled 
              ? (isPreBossNode ? 'Rest Already Applied' : 'Room Action Used') 
              : `Apply Rest Alignment (+${healAmount} HP)`}
          </button>
        </div>
      </div>

      {/* ROLLED ATTACHMENT OPTION (PEEK, GIFT, or TREASURE) */}
      <div className="p-5 bg-slate-950/40 border border-slate-800 rounded-2xl flex flex-col justify-between gap-6">
        
        {/* PEEK OPTION */}
        {rolledAttachment === 'peek' && (
          <>
            <div>
              <div className="bg-indigo-950/30 text-indigo-400 p-2.5 rounded-xl border border-indigo-900/30 w-fit">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-200 mt-4 flex items-center gap-2">
                Oracle Peek Option (3-Lane Scan)
                <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/50 border border-indigo-900/50 px-2 py-0.5 rounded">
                  Rolled (Peek)
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Scan the upcoming map layer across all 3 lanes to reveal full room types, threat tiers, and enemy signatures.
              </p>

              {peekNodes && (
                <div className="mt-4 p-3 bg-slate-900 border border-indigo-500/40 rounded-xl flex flex-col gap-2 font-mono text-xs animate-fade-in" id="peek-scan-results-panel">
                  <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Next Layer Lane Scans:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {peekNodes.map((pn, i) => (
                      <div key={pn.id} className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-[11px]">
                        <span className="text-slate-500 block text-[9px] uppercase">Lane {pn.lane ?? i}</span>
                        <span className="text-indigo-200 font-bold capitalize block">{pn.type}</span>
                        {pn.enemyTier && (
                          <span className="text-amber-400 text-[10px] block font-semibold">{pn.enemyTier} ({pn.enemyName || 'Threat'})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handlePeekAction}
                disabled={isAttachmentDisabled}
                className={`w-full py-3 font-bold rounded-xl text-xs transition-all uppercase tracking-wider font-display ${
                  isAttachmentDisabled
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-500 hover:bg-indigo-400 text-slate-950'
                }`}
                id="rest-peek-btn"
              >
                {isAttachmentDisabled 
                  ? (isPreBossNode ? 'Peek Applied' : 'Room Action Used') 
                  : 'Execute 3-Lane Oracle Peek'}
              </button>
            </div>
          </>
        )}

        {/* GIFT OPTION */}
        {rolledAttachment === 'gift' && (
          <>
            <div>
              <div className="bg-amber-950/30 text-amber-400 p-2.5 rounded-xl border border-amber-900/30 w-fit">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-200 mt-4 flex items-center gap-2">
                Cumulative Gift Option
                <span className="text-[9px] font-mono text-amber-400 bg-amber-950/50 border border-amber-900/50 px-2 py-0.5 rounded">
                  Rolled (Gift)
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Cumulative skip bonus scales quality (+1 tier per 2 skips). Taking Gift resets skip count to 0.
              </p>

              <div className="mt-3 p-3 bg-slate-900/80 border border-amber-500/30 rounded-xl text-xs font-mono flex flex-col gap-1.5" id="gift-offer-details-panel">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>Cumulative Skips: <strong className="text-amber-400">{giftDetails.skippedCount}</strong></span>
                  <span>Tier Bump: <strong className="text-amber-400">+{giftDetails.bump}</strong></span>
                </div>
                <div className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">
                  Effective Tier: {giftDetails.effectiveTier}
                </div>
                
                {giftDetails.kind === 'card' && giftDetails.card && (
                  <div className="mt-1 p-2 bg-slate-950 rounded border border-slate-800 text-[11px]">
                    <span className="text-emerald-400 font-bold block">🎁 Card Offer: {giftDetails.card.name}</span>
                    <span className="text-slate-400 text-[10px] capitalize block">{giftDetails.card.component} Action ({giftDetails.card.relationType})</span>
                  </div>
                )}

                {giftDetails.kind === 'boon' && giftDetails.boon && (
                  <div className="mt-1 p-2 bg-slate-950 rounded border border-slate-800 text-[11px]">
                    <span className="text-amber-400 font-bold block">✨ Benefit Offer: {giftDetails.boon.targetId.toUpperCase()} Boon</span>
                    <span className="text-slate-400 text-[10px] block">{giftDetails.boon.qualitativeEffect || `+${giftDetails.boon.modifier} combat modifier`}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleClaimGift}
                disabled={isAttachmentDisabled}
                className={`w-full py-3 font-bold rounded-xl text-xs transition-all uppercase tracking-wider font-display ${
                  isAttachmentDisabled
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
                id="rest-gift-btn"
              >
                {isAttachmentDisabled 
                  ? (isPreBossNode ? 'Gift Claimed' : 'Room Action Used') 
                  : `Claim ${giftDetails.kind === 'card' ? 'Gift Card' : 'Gift Benefit'} (${giftDetails.effectiveTier} Tier)`}
              </button>
            </div>
          </>
        )}

        {/* TREASURE OPTION */}
        {rolledAttachment === 'treasure' && (
          <>
            <div>
              <div className="bg-emerald-950/30 text-emerald-400 p-2.5 rounded-xl border border-emerald-900/30 w-fit">
                <Trophy className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-slate-200 mt-4 flex items-center gap-2">
                Rest Stop Offer: Treasure Attachment
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-900/50 px-2 py-0.5 rounded">
                  Rolled (Treasure)
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Rest Stop Attachment offer granting a Relic or Benefit. Distinct from map Treasure Rooms.
              </p>

              <div className="mt-3 p-3 bg-slate-900/80 border border-emerald-500/30 rounded-xl text-xs font-mono flex flex-col gap-1.5" id="treasure-offer-details-panel">
                {treasureDetails.kind === 'relic' && treasureDetails.relic && (
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[11px]">
                    <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                      Relic Offer: {treasureDetails.relic.name}
                    </span>
                    <p className="text-slate-400 text-[10px] mt-1 leading-normal">{treasureDetails.relic.description}</p>
                  </div>
                )}

                {treasureDetails.kind === 'boon' && treasureDetails.boon && (
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[11px]">
                    <span className="text-amber-300 font-bold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Benefit Offer: {treasureDetails.boon.targetId.toUpperCase()} Boon
                    </span>
                    <p className="text-slate-400 text-[10px] mt-1 leading-normal">{treasureDetails.boon.qualitativeEffect || `+${treasureDetails.boon.modifier} modifier`}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleClaimTreasure}
                disabled={isAttachmentDisabled}
                className={`w-full py-3 font-bold rounded-xl text-xs transition-all uppercase tracking-wider font-display ${
                  isAttachmentDisabled
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }`}
                id="rest-treasure-btn"
              >
                {isAttachmentDisabled 
                  ? (isPreBossNode ? 'Treasure Claimed' : 'Room Action Used') 
                  : `Claim Rest Stop ${treasureDetails.kind === 'relic' ? 'Relic' : 'Benefit'}`}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
