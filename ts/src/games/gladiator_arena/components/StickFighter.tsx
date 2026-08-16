/**
 * Gladiator Arena — StickFighter SVG Component
 * Provides clear, distinct, real 2D stick-figure combat poses with
 * contact sparks and dynamic weapon arcs.
 */

import React from 'react';
import { ActionType } from '../types';

export type FighterPose = 
  | 'idle' 
  | 'quick_attack' 
  | 'power_attack' 
  | 'defend' 
  | 'taunt' 
  | 'staggered' 
  | 'down';

export interface StickFighterProps {
  pose: FighterPose;
  facing?: 'left' | 'right';
  name?: string;
  isPlayer?: boolean;
  isCyber?: boolean;
  accentColor?: string;
  isContactFrame?: boolean;
  actionType?: ActionType;
  className?: string;
}

export const StickFighter: React.FC<StickFighterProps> = ({
  pose,
  facing = 'right',
  name,
  isPlayer = false,
  isCyber = false,
  accentColor,
  isContactFrame: _isContactFrame = false,
  className = '',
}) => {
  // Default accent colors based on faction & cybernetics
  const mainColor = accentColor || (isPlayer ? '#10b981' : '#ef4444');
  const limbColor = isCyber ? '#38bdf8' : (isPlayer ? '#34d399' : '#f87171');
  const weaponColor = isCyber ? '#06b6d4' : '#f59e0b';

  const isFlipped = facing === 'left';

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Stick Figure SVG Canvas */}
      <div className="relative w-40 h-48 sm:w-48 sm:h-56 flex items-center justify-center">
        <svg
          viewBox="0 0 200 240"
          className="w-full h-full overflow-visible transition-all duration-200"
          style={{
            transform: isFlipped ? 'scaleX(-1)' : 'none',
          }}
        >
          <defs>
            {/* Energy slash gradient for power attack */}
            <linearGradient id="slashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
            {/* Shield glow */}
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.1" />
            </linearGradient>
            {/* Contact Spark Radial */}
            <radialGradient id="sparkGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="40%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Arena Ground Line */}
          <line
            x1="5"
            y1="212"
            x2="195"
            y2="212"
            stroke="#44403c"
            strokeWidth="3"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />

          {/* Ground Foot Shadow */}
          <ellipse
            cx={pose === 'down' ? 110 : 100}
            cy="214"
            rx={pose === 'down' ? 65 : 35}
            ry="6"
            fill="#0c0a09"
            opacity="0.6"
          />

          {/* POSE RENDERING: IDLE */}
          {pose === 'idle' && (
            <g className="transition-all duration-150">
              {/* Rear Arm */}
              <polyline
                points="100,75 80,98 90,118"
                fill="none"
                stroke={limbColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />
              {/* Rear Leg */}
              <polyline
                points="100,130 85,170 80,210"
                fill="none"
                stroke={limbColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />
              {/* Torso */}
              <line
                x1="100"
                y1="64"
                x2="100"
                y2="130"
                stroke={mainColor}
                strokeWidth="7"
                strokeLinecap="round"
              />
              {/* Head */}
              <circle cx="100" cy="50" r="14" fill="#1c1917" stroke={mainColor} strokeWidth="5" />
              {/* Visor/Eye Slit */}
              <line x1="103" y1="50" x2="112" y2="50" stroke={isCyber ? '#38bdf8' : '#f59e0b'} strokeWidth="3" strokeLinecap="round" />
              {/* Lead Leg */}
              <polyline
                points="100,130 118,170 125,210"
                fill="none"
                stroke={mainColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Lead Arm (Ready Guard) */}
              <polyline
                points="100,75 125,95 135,80"
                fill="none"
                stroke={mainColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Weapon Blade in hand */}
              <line x1="135" y1="80" x2="160" y2="55" stroke={weaponColor} strokeWidth="4" strokeLinecap="round" />
            </g>
          )}

          {/* POSE RENDERING: QUICK ATTACK (Fast Forward Jab / Thrust with forward reach) */}
          {pose === 'quick_attack' && (
            <g className="transition-all duration-150">
              {/* Rear Arm (Pulled back for momentum) */}
              <polyline
                points="120,85 95,100 80,115"
                fill="none"
                stroke={limbColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />
              {/* Rear Leg (Deep backward thrust) */}
              <polyline
                points="95,135 65,175 45,210"
                fill="none"
                stroke={limbColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />
              {/* Torso (Angled aggressively forward) */}
              <line
                x1="125"
                y1="74"
                x2="95"
                y2="135"
                stroke={mainColor}
                strokeWidth="7"
                strokeLinecap="round"
              />
              {/* Head (Lunging forward) */}
              <circle cx="125" cy="60" r="14" fill="#1c1917" stroke={mainColor} strokeWidth="5" />
              {/* Eye focus */}
              <line x1="128" y1="60" x2="138" y2="60" stroke={isCyber ? '#38bdf8' : '#f59e0b'} strokeWidth="3" strokeLinecap="round" />
              {/* Lead Leg (Deep flexed lunge) */}
              <polyline
                points="95,135 135,175 145,210"
                fill="none"
                stroke={mainColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Lead Arm (Straight forward penetrating thrust) */}
              <polyline
                points="120,85 155,82 188,80"
                fill="none"
                stroke={mainColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Weapon Blade Thrust Extension Reaching Far Forward */}
              <line x1="188" y1="80" x2="235" y2="80" stroke={weaponColor} strokeWidth="5" strokeLinecap="round" />
              {/* Speed Lines */}
              <line x1="170" y1="72" x2="225" y2="72" stroke={weaponColor} strokeWidth="2" opacity="0.7" strokeLinecap="round" />
              <line x1="170" y1="88" x2="225" y2="88" stroke={weaponColor} strokeWidth="2" opacity="0.7" strokeLinecap="round" />
            </g>
          )}

          {/* POSE RENDERING: POWER ATTACK (Wide Overhead Heavy Cleave) */}
          {pose === 'power_attack' && (
            <g className="transition-all duration-150">
              {/* Heavy Cleave Slash Arc Effect */}
              <path
                d="M 110,15 Q 195,40 215,135"
                fill="none"
                stroke="url(#slashGrad)"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* Rear Leg */}
              <polyline
                points="95,130 75,170 65,210"
                fill="none"
                stroke={limbColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />
              {/* Torso (Arched backward for heavy leverage) */}
              <line
                x1="90"
                y1="69"
                x2="95"
                y2="130"
                stroke={mainColor}
                strokeWidth="7"
                strokeLinecap="round"
              />
              {/* Head */}
              <circle cx="90" cy="55" r="14" fill="#1c1917" stroke={mainColor} strokeWidth="5" />
              <line x1="93" y1="53" x2="103" y2="53" stroke={isCyber ? '#38bdf8' : '#f59e0b'} strokeWidth="3" strokeLinecap="round" />
              {/* Lead Leg (Braced forward) */}
              <polyline
                points="95,130 130,168 145,210"
                fill="none"
                stroke={mainColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Rear Arm Raised */}
              <polyline
                points="90,80 100,48 140,35"
                fill="none"
                stroke={limbColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />
              {/* Lead Arm (Raised high overhead) */}
              <polyline
                points="90,80 120,45 155,28"
                fill="none"
                stroke={mainColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Massive Sledge Cleaver / Greatsword */}
              <line x1="150" y1="30" x2="205" y2="10" stroke={weaponColor} strokeWidth="7" strokeLinecap="round" />
              {/* Cleaver Head Blade */}
              <polygon points="195,5 218,16 200,28" fill={weaponColor} />
            </g>
          )}

          {/* POSE RENDERING: DEFEND (Crossed Guard & Energy Shield Wall) */}
          {pose === 'defend' && (
            <g className="transition-all duration-150">
              {/* Energy Shield Barrier */}
              <path
                d="M 130,45 Q 160,100 130,155"
                fill="url(#shieldGrad)"
                stroke="#60a5fa"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Rear Leg (Braced deep behind) */}
              <polyline
                points="95,132 70,170 55,210"
                fill="none"
                stroke={limbColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />
              {/* Torso (Solid centered) */}
              <line
                x1="95"
                y1="70"
                x2="95"
                y2="132"
                stroke={mainColor}
                strokeWidth="7"
                strokeLinecap="round"
              />
              {/* Head (Tucked behind arms) */}
              <circle cx="95" cy="56" r="14" fill="#1c1917" stroke={mainColor} strokeWidth="5" />
              <line x1="97" y1="56" x2="105" y2="56" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />
              {/* Lead Leg (Firm wide stance) */}
              <polyline
                points="95,132 125,170 140,210"
                fill="none"
                stroke={mainColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Rear Arm (Crossed inside guard) */}
              <polyline
                points="95,80 120,105 125,80"
                fill="none"
                stroke={limbColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
              />
              {/* Lead Arm (Crossed outside guard) */}
              <polyline
                points="95,80 125,95 115,70"
                fill="none"
                stroke={mainColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}

          {/* POSE RENDERING: TAUNT (Puffed Chest, Beckoning Arm, Swagger) */}
          {pose === 'taunt' && (
            <g className="transition-all duration-150">
              {/* Rear Leg */}
              <polyline
                points="100,130 85,170 80,210"
                fill="none"
                stroke={limbColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />
              {/* Torso (Proud upright) */}
              <line
                x1="100"
                y1="59"
                x2="100"
                y2="130"
                stroke={mainColor}
                strokeWidth="7"
                strokeLinecap="round"
              />
              {/* Head (Cocked high & proud) */}
              <circle cx="100" cy="45" r="14" fill="#1c1917" stroke={mainColor} strokeWidth="5" />
              <line x1="103" y1="43" x2="112" y2="43" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
              {/* Lead Leg (Relaxed forward strut) */}
              <polyline
                points="100,130 115,170 120,210"
                fill="none"
                stroke={mainColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Rear Arm (Hand cockily on hip) */}
              <polyline
                points="100,70 75,95 90,115"
                fill="none"
                stroke={limbColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />
              {/* Lead Arm (Raised high waving/beckoning) */}
              <polyline
                points="100,70 130,55 145,35"
                fill="none"
                stroke={mainColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Weapon twirling in hand */}
              <line x1="145" y1="35" x2="160" y2="15" stroke={weaponColor} strokeWidth="4" strokeLinecap="round" />
            </g>
          )}

          {/* POSE RENDERING: STAGGERED (Reeling Backward, Off Balance, Impact Sparks) */}
          {pose === 'staggered' && (
            <g className="transition-all duration-150">
              {/* Impact Sparks */}
              <g stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round">
                <line x1="85" y1="45" x2="98" y2="32" />
                <line x1="90" y1="58" x2="110" y2="58" />
                <line x1="80" y1="70" x2="96" y2="82" />
              </g>
              {/* Rear Leg (Buckled) */}
              <polyline
                points="95,140 80,180 65,210"
                fill="none"
                stroke={limbColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />
              {/* Torso (Tilted steeply backward ~40 deg) */}
              <line
                x1="70"
                y1="74"
                x2="95"
                y2="140"
                stroke={mainColor}
                strokeWidth="7"
                strokeLinecap="round"
              />
              {/* Head (Snapped back in shock) */}
              <circle cx="70" cy="60" r="14" fill="#1c1917" stroke="#ef4444" strokeWidth="5" />
              {/* Stunned eyes / cross */}
              <line x1="68" y1="57" x2="74" y2="63" stroke="#ef4444" strokeWidth="2" />
              <line x1="74" y1="57" x2="68" y2="63" stroke="#ef4444" strokeWidth="2" />
              {/* Lead Leg (Lifted off ground in stumble) */}
              <polyline
                points="95,140 115,170 130,200"
                fill="none"
                stroke={mainColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Rear Arm (Flailing backward) */}
              <polyline
                points="75,85 45,90 25,80"
                fill="none"
                stroke={limbColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />
              {/* Lead Arm (Flailing in distress) */}
              <polyline
                points="75,85 100,75 120,65"
                fill="none"
                stroke={mainColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}

          {/* POSE RENDERING: DOWN (Collapsed on floor) */}
          {pose === 'down' && (
            <g className="transition-all duration-200">
              {/* Knockout marker */}
              <text x="50" y="165" fill="#ef4444" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                K.O.
              </text>
              {/* Torso (Flat along ground) */}
              <line
                x1="64"
                y1="195"
                x2="120"
                y2="200"
                stroke={mainColor}
                strokeWidth="7"
                strokeLinecap="round"
              />
              {/* Head (Lying on floor) */}
              <circle cx="50" cy="195" r="14" fill="#1c1917" stroke="#78716c" strokeWidth="4" />
              {/* Eyes closed / X */}
              <line x1="46" y1="193" x2="52" y2="199" stroke="#78716c" strokeWidth="2" />
              <line x1="52" y1="193" x2="46" y2="199" stroke="#78716c" strokeWidth="2" />
              {/* Rear Arm (Crumpled above) */}
              <polyline
                points="75,195 85,175 95,170"
                fill="none"
                stroke={limbColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.6"
              />
              {/* Lead Arm (Limply on ground) */}
              <polyline
                points="75,195 90,208 105,210"
                fill="none"
                stroke={mainColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Rear Leg (Limp) */}
              <polyline
                points="120,200 150,195 180,200"
                fill="none"
                stroke={limbColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.6"
              />
              {/* Lead Leg (Extended along floor) */}
              <polyline
                points="120,200 145,210 170,212"
                fill="none"
                stroke={mainColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Fighter Name & Current Pose Badge */}
      {name && (
        <div className="flex flex-col items-center mt-1">
          <span className="text-xs font-bold text-stone-200 truncate max-w-[120px]">
            {name}
          </span>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-400 mt-0.5">
            {pose.replace('_', ' ')}
          </span>
        </div>
      )}
    </div>
  );
};
