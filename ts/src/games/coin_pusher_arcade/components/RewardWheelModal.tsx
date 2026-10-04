// components/RewardWheelModal.tsx — combo wheel spin modal.
// Ported from the example; the pick/rotation math lives in ../logic/wheel.

import { useState, useEffect } from 'react';
import type { WheelReward } from '../types';
import { sound } from '../utils/sound';
import { pickWheelReward } from '../logic/wheel';

interface RewardWheelModalProps {
  unlockedRewards: WheelReward[];
  onRewardSelected: (reward: WheelReward) => void;
  isOpen: boolean;
}

export default function RewardWheelModal({
  unlockedRewards,
  onRewardSelected,
  isOpen,
}: RewardWheelModalProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedReward, setSelectedReward] = useState<WheelReward | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSpinning(false);
      setSelectedReward(null);
      setShowResult(false);
      setRotation(0);
    }
  }, [isOpen]);

  const handleSpin = () => {
    if (isSpinning || unlockedRewards.length === 0) return;

    setIsSpinning(true);
    setShowResult(false);

    const pick = pickWheelReward(unlockedRewards, Math.random);
    if (!pick) return;

    setRotation(pick.rotation);
    setSelectedReward(pick.reward);

    // Sound ticks during spin
    const ticksCount = 45;
    for (let i = 0; i < ticksCount; i++) {
      // Exponentially decay tick intervals to simulate friction slowing down the wheel
      const t = i / ticksCount;
      const delay = 3500 * Math.pow(t, 2.5);
      setTimeout(() => {
        if (isOpen) {
          sound.playWheelTick();
        }
      }, delay);
    }

    // Spin complete callback
    setTimeout(() => {
      setIsSpinning(false);
      setShowResult(true);
      sound.playWheelSuccess();
    }, 3500);
  };

  const handleClaim = () => {
    if (selectedReward) {
      onRewardSelected(selectedReward);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 flex justify-center items-center z-50 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center relative overflow-hidden flex flex-col items-center">
        {/* Background glow flares */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 via-pink-500 to-yellow-500 animate-pulse" />

        <h2 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 mb-2">
          COMBO WHEEL SPIN!
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          You hit a rapid combo chain! Spin the wheel to claim an arcade modifier.
        </p>

        {/* Pointer Triangle */}
        <div className="relative mb-4 flex flex-col items-center">
          <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[20px] border-l-transparent border-r-transparent border-t-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)] z-10 -mb-2" />

          {/* CSS Wheel */}
          <div className="w-64 h-64 rounded-full border-4 border-slate-700 relative overflow-hidden shadow-2xl transition-all duration-[3500ms] cubic-bezier-wheel"
               style={{
                 transform: `rotate(${rotation}deg)`,
                 transition: isSpinning ? 'transform 3.5s cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none'
               }}>

            {/* Slices */}
            {unlockedRewards.map((reward, idx) => {
              const sliceAngle = 360 / unlockedRewards.length;
              const rot = idx * sliceAngle;
              return (
                <div key={reward.id}
                     className="absolute inset-0 origin-center flex justify-center"
                     style={{
                       transform: `rotate(${rot}deg)`,
                       clipPath: unlockedRewards.length > 1 ? `polygon(50% 50%, ${50 - 50 * Math.tan((sliceAngle * Math.PI) / 360)}% 0, ${50 + 50 * Math.tan((sliceAngle * Math.PI) / 360)}% 0)` : 'none',
                       backgroundColor: reward.color,
                     }}>
                  {/* Reward label */}
                  <div className="mt-8 text-white font-black text-xs tracking-wider select-none transform rotate-90 origin-bottom flex flex-col items-center gap-1"
                       style={{ transform: `rotate(${sliceAngle / 2}deg)` }}>
                    <span className="text-[10px] uppercase truncate max-w-[80px]">
                      {reward.name.split(' ')[0]}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Inner Hub Pin */}
            <div className="absolute inset-0 m-auto w-12 h-12 bg-slate-900 border-4 border-slate-700 rounded-full flex items-center justify-center z-10 shadow-lg">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
            </div>
          </div>
        </div>

        {/* Spin trigger / Result */}
        {!isSpinning && !showResult && (
          <button
            onClick={handleSpin}
            id="spin-wheel-btn"
            className="w-full mt-6 py-4 px-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold text-lg rounded-xl shadow-lg shadow-pink-500/20 active:scale-95 transition-all uppercase tracking-wider"
          >
            🕹️ Pull the Lever!
          </button>
        )}

        {isSpinning && (
          <div className="mt-6 text-cyan-400 font-extrabold text-lg animate-pulse tracking-wide">
            🌀 SPINNING... GOOD LUCK!
          </div>
        )}

        {showResult && selectedReward && (
          <div className="mt-6 animate-scaleIn w-full">
            <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/40 mb-5">
              <span className="text-xs text-cyan-400 uppercase tracking-widest font-bold">REWARD UNLOCKED</span>
              <h3 className="text-2xl font-black text-white mt-1 uppercase" style={{ color: selectedReward.color }}>
                {selectedReward.name}
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {selectedReward.description}
              </p>
            </div>

            <button
              onClick={handleClaim}
              id="claim-reward-btn"
              className="w-full py-3 px-6 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-lg rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all uppercase tracking-widest"
            >
              🚀 Launch Reward!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
