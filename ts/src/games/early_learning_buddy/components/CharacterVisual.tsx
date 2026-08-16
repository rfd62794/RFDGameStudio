import React from 'react';
import { motion } from 'motion/react';
import { ArchetypeId } from '../types';
import { ARCHETYPES } from '../data/archetypes';

interface CharacterVisualProps {
  archetypeId: ArchetypeId;
  variantId?: string;
  actionState?: 'idle' | 'performing' | 'unlock';
  actionName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSparkles?: boolean;
  onClick?: () => void;
}

export const CharacterVisual: React.FC<CharacterVisualProps> = ({
  archetypeId,
  variantId,
  actionState = 'idle',
  actionName = '',
  size = 'md',
  showSparkles = false,
  onClick,
}) => {
  const archetype = ARCHETYPES[archetypeId] || ARCHETYPES.pony;
  const variant = archetype.variants?.find((v) => v.id === variantId) || archetype.variants?.[0];
  const primaryColor = variant?.primaryColor || archetype.primaryColor;
  const secondaryColor = variant?.secondaryColor || archetype.secondaryColor;
  const accentColor = variant?.accentColor || archetype.accentColor;

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-28 h-28',
    lg: 'w-44 h-44',
    xl: 'w-60 h-60',
  }[size];

  const isPerforming = actionState === 'performing';

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center select-none ${sizeClasses} ${
        onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''
      }`}
    >
      {/* Background Aura Glow */}
      <motion.div
        animate={
          isPerforming
            ? { scale: [1, 1.25, 1], opacity: [0.3, 0.8, 0.3] }
            : { scale: [1, 1.08, 1], opacity: [0.2, 0.4, 0.2] }
        }
        transition={{ repeat: Infinity, duration: isPerforming ? 1 : 3, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full blur-xl pointer-events-none"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Sparkles Overlay */}
      {(showSparkles || isPerforming) && (
        <div className="absolute -inset-4 pointer-events-none z-20">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.4, 1.2, 0.2],
                x: (i % 2 === 0 ? 1 : -1) * (15 + i * 12),
                y: (i < 3 ? -1 : 1) * (20 + i * 10),
              }}
              transition={{
                repeat: Infinity,
                duration: 1.2,
                delay: i * 0.2,
              }}
              className="absolute top-1/2 left-1/2 text-amber-300 font-bold text-lg"
            >
              ✦
            </motion.div>
          ))}
        </div>
      )}

      {/* Action Name Speech Bubble Banner */}
      {isPerforming && actionName && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: -28, scale: 1 }}
          exit={{ opacity: 0, y: -35 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 z-30 bg-amber-400 text-slate-900 font-black px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap shadow-lg border-2 border-white flex items-center gap-1"
        >
          <span>✨</span>
          <span>{actionName}!</span>
          <span>✨</span>
        </motion.div>
      )}

      {/* Character SVG Container */}
      <motion.div
        animate={
          isPerforming
            ? {
                y: [0, -18, 0, -10, 0],
                rotate: [0, -8, 8, -4, 0],
                scale: [1, 1.12, 0.95, 1.05, 1],
              }
            : {
                y: [0, -6, 0],
                rotate: [0, 1, -1, 0],
              }
        }
        transition={{
          repeat: Infinity,
          duration: isPerforming ? 1.4 : 3.5,
          ease: 'easeInOut',
        }}
        className="relative w-full h-full z-10"
      >
        {archetypeId === 'pony' && <PonySVG isPerforming={isPerforming} primary={primaryColor} secondary={secondaryColor} accent={accentColor} />}
        {archetypeId === 'dragon' && <DragonSVG isPerforming={isPerforming} primary={primaryColor} secondary={secondaryColor} accent={accentColor} />}
        {archetypeId === 'hero' && <HeroSVG isPerforming={isPerforming} primary={primaryColor} secondary={secondaryColor} accent={accentColor} />}
        {archetypeId === 'fairy' && <FairySVG isPerforming={isPerforming} primary={primaryColor} secondary={secondaryColor} accent={accentColor} />}
        {archetypeId === 'dino' && <DinoSVG isPerforming={isPerforming} primary={primaryColor} secondary={secondaryColor} accent={accentColor} />}
        {archetypeId === 'robot' && <RobotSVG isPerforming={isPerforming} primary={primaryColor} secondary={secondaryColor} accent={accentColor} />}
      </motion.div>
    </div>
  );
};

interface SVGColors {
  isPerforming: boolean;
  primary: string;
  secondary: string;
  accent: string;
}

// 1. Star Sparkle Pony
const PonySVG: React.FC<SVGColors> = ({ isPerforming, primary, secondary, accent }) => (
  <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
    <defs>
      <linearGradient id={`ponyBody-${primary}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
        <stop offset="100%" stopColor={primary} />
      </linearGradient>
      <linearGradient id={`ponyMane-${secondary}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={secondary} />
        <stop offset="50%" stopColor={accent} />
        <stop offset="100%" stopColor={primary} />
      </linearGradient>
    </defs>
    {/* Tail */}
    <motion.path
      d="M 60 120 Q 30 140 40 170 Q 70 160 70 130 Z"
      fill={`url(#ponyMane-${secondary})`}
      animate={{ rotate: isPerforming ? [0, 15, -10, 0] : [0, 5, 0] }}
      transition={{ repeat: Infinity, duration: 1.5 }}
    />
    {/* Body */}
    <ellipse cx="100" cy="125" rx="45" ry="32" fill={`url(#ponyBody-${primary})`} />
    {/* Legs */}
    <rect x="70" y="145" width="12" height="30" rx="6" fill={secondary} />
    <rect x="90" y="148" width="12" height="28" rx="6" fill={primary} />
    <rect x="110" y="145" width="12" height="30" rx="6" fill={secondary} />
    <rect x="125" y="148" width="12" height="28" rx="6" fill={primary} />
    {/* Wing */}
    <motion.path
      d="M 90 110 C 60 80 80 50 110 90 Z"
      fill={secondary}
      opacity="0.9"
      animate={{ rotate: isPerforming ? [-15, 20, -15] : [-2, 4, -2] }}
      transition={{ repeat: Infinity, duration: 0.8 }}
    />
    {/* Head & Neck */}
    <path d="M 120 115 C 135 110 145 95 140 75 C 135 55 115 55 105 70 C 95 85 105 110 120 115 Z" fill={`url(#ponyBody-${primary})`} />
    {/* Mane */}
    <path d="M 105 60 Q 90 40 110 35 Q 120 50 115 65 Z" fill={`url(#ponyMane-${secondary})`} />
    <path d="M 120 45 Q 135 30 140 45 Z" fill={`url(#ponyMane-${secondary})`} />
    {/* Ears */}
    <polygon points="125,50 135,30 140,52" fill={primary} />
    {/* Magic Horn */}
    <polygon points="135,42 155,15 142,46" fill={accent} />
    {/* Eye */}
    <circle cx="132" cy="62" r="6" fill="#1e1b4b" />
    <circle cx="134" cy="60" r="2" fill="#ffffff" />
    {/* Blush */}
    <circle cx="138" cy="72" r="4" fill={secondary} opacity="0.6" />
    {/* Star Cutie Mark */}
    <path d="M 75 125 L 77 120 L 82 120 L 78 123 L 80 128 L 75 125 Z" fill={accent} />
  </svg>
);

// 2. Friendly Ember Dragon
const DragonSVG: React.FC<SVGColors> = ({ isPerforming, primary, secondary, accent }) => (
  <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
    <defs>
      <linearGradient id={`dragonBody-${primary}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
        <stop offset="100%" stopColor={primary} />
      </linearGradient>
      <linearGradient id={`dragonBelly-${accent}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
        <stop offset="100%" stopColor={accent} />
      </linearGradient>
    </defs>
    {/* Tail */}
    <path d="M 60 140 Q 20 150 25 120 Q 30 110 50 130 Z" fill={primary} />
    <polygon points="20,115 28,110 25,125" fill={secondary} />
    {/* Wings */}
    <motion.path
      d="M 75 100 C 40 60 70 40 95 85 Z"
      fill={secondary}
      animate={{ rotate: isPerforming ? [-10, 15, -10] : [0, 3, 0] }}
      transition={{ repeat: Infinity, duration: 0.9 }}
    />
    <motion.path
      d="M 115 100 C 150 60 120 40 95 85 Z"
      fill={secondary}
      opacity="0.8"
      animate={{ rotate: isPerforming ? [10, -15, 10] : [0, -3, 0] }}
      transition={{ repeat: Infinity, duration: 0.9 }}
    />
    {/* Body */}
    <ellipse cx="100" cy="130" rx="42" ry="35" fill={`url(#dragonBody-${primary})`} />
    <ellipse cx="108" cy="132" rx="24" ry="22" fill={`url(#dragonBelly-${accent})`} />
    {/* Head */}
    <ellipse cx="115" cy="75" rx="32" ry="28" fill={`url(#dragonBody-${primary})`} />
    {/* Horns */}
    <polygon points="100,52 92,30 108,48" fill={secondary} />
    <polygon points="118,50 115,28 128,48" fill={secondary} opacity="0.8" />
    {/* Eyes */}
    <circle cx="125" cy="70" r="7" fill="#064e3b" />
    <circle cx="127" cy="68" r="2.5" fill="#ffffff" />
    {/* Snout & Smile */}
    <ellipse cx="135" cy="80" rx="16" ry="12" fill={primary} />
    <path d="M 130 84 Q 138 90 144 82" stroke="#064e3b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    {/* Flame Spark if performing */}
    {isPerforming && (
      <motion.g
        initial={{ opacity: 0, scale: 0.5, x: 140, y: 75 }}
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.4, 0.8], x: [140, 175, 190], y: [75, 70, 78] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
      >
        <path d="M 0 0 Q 15 -10 20 0 Q 15 10 0 0 Z" fill={secondary} />
        <path d="M 2 -2 Q 10 -6 14 -2 Q 10 4 2 -2 Z" fill={accent} />
      </motion.g>
    )}
  </svg>
);

// 3. Cosmic Superhero
const HeroSVG: React.FC<SVGColors> = ({ isPerforming, primary, secondary, accent }) => (
  <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
    <defs>
      <linearGradient id={`heroSuit-${primary}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
        <stop offset="100%" stopColor={primary} />
      </linearGradient>
    </defs>
    {/* Cape */}
    <motion.path
      d="M 70 95 L 30 160 C 50 175 100 170 120 160 L 115 95 Z"
      fill={secondary}
      animate={{ rotate: isPerforming ? [-5, 12, -5] : [0, 3, 0] }}
      transition={{ repeat: Infinity, duration: 1 }}
    />
    {/* Body */}
    <rect x="78" y="95" width="44" height="50" rx="12" fill={`url(#heroSuit-${primary})`} />
    {/* Belt */}
    <rect x="78" y="122" width="44" height="8" fill={accent} />
    {/* Boots */}
    <rect x="82" y="145" width="14" height="25" rx="5" fill={secondary} />
    <rect x="104" y="145" width="14" height="25" rx="5" fill={secondary} />
    {/* Star Chest Emblem */}
    <polygon points="100,102 103,110 111,110 105,114 107,122 100,117 93,122 95,114 89,110 97,110" fill={accent} />
    {/* Head & Mask */}
    <circle cx="100" cy="65" r="28" fill="#fed7aa" />
    <path d="M 74 60 C 74 40 126 40 126 60 C 126 70 115 75 100 75 C 85 75 74 70 74 60 Z" fill={primary} />
    {/* Mask Eye Slots */}
    <ellipse cx="88" cy="62" rx="7" ry="5" fill="#ffffff" />
    <ellipse cx="112" cy="62" rx="7" ry="5" fill="#ffffff" />
    <circle cx="89" cy="62" r="3" fill="#1e1b4b" />
    <circle cx="113" cy="62" r="3" fill="#1e1b4b" />
    {/* Big Confident Smile */}
    <path d="M 92 78 Q 100 86 108 78" stroke="#9a3412" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  </svg>
);

// 4. Glitter Fairy Sprite
const FairySVG: React.FC<SVGColors> = ({ isPerforming, primary, secondary, accent }) => (
  <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
    <defs>
      <linearGradient id={`fairyDress-${primary}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
        <stop offset="100%" stopColor={primary} />
      </linearGradient>
    </defs>
    {/* Wings */}
    <motion.path
      d="M 95 90 C 40 40 30 110 85 110 Z"
      fill={accent}
      opacity="0.8"
      animate={{ rotate: isPerforming ? [-20, 20, -20] : [-3, 5, -3] }}
      transition={{ repeat: Infinity, duration: 0.6 }}
    />
    <motion.path
      d="M 105 90 C 160 40 170 110 115 110 Z"
      fill={accent}
      opacity="0.8"
      animate={{ rotate: isPerforming ? [20, -20, 20] : [3, -5, 3] }}
      transition={{ repeat: Infinity, duration: 0.6 }}
    />
    {/* Dress */}
    <polygon points="100,90 75,145 125,145" fill={`url(#fairyDress-${primary})`} />
    {/* Head & Hair */}
    <circle cx="100" cy="62" r="22" fill={secondary} />
    <circle cx="100" cy="62" r="18" fill="#fef3c7" />
    {/* Eyes & Crown */}
    <circle cx="93" cy="62" r="3.5" fill="#701a75" />
    <circle cx="107" cy="62" r="3.5" fill="#701a75" />
    <path d="M 94 71 Q 100 76 106 71" stroke="#9d174d" strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* Magic Wand */}
    <line x1="115" y1="95" x2="142" y2="70" stroke={accent} strokeWidth="3" strokeLinecap="round" />
    <polygon points="142,65 145,72 152,72 147,77 149,84 142,80 135,84 137,77 132,72 139,72" fill={accent} />
  </svg>
);

// 5. Sunny Dino Pal
const DinoSVG: React.FC<SVGColors> = ({ isPerforming, primary, secondary, accent }) => (
  <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
    <defs>
      <linearGradient id={`dinoBody-${primary}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
        <stop offset="100%" stopColor={primary} />
      </linearGradient>
    </defs>
    {/* Tail */}
    <motion.path
      d="M 65 130 C 25 120 20 160 50 150 Z"
      fill={primary}
      animate={{ rotate: isPerforming ? [-15, 20, -15] : [0, 5, 0] }}
      transition={{ repeat: Infinity, duration: 1 }}
    />
    {/* Back Plates/Spikes */}
    <polygon points="70,105 60,92 80,102" fill={secondary} />
    <polygon points="85,98 78,80 95,92" fill={secondary} />
    <polygon points="100,95 98,75 110,90" fill={secondary} />
    {/* Body */}
    <ellipse cx="100" cy="130" rx="42" ry="32" fill={`url(#dinoBody-${primary})`} />
    {/* Polka Dots */}
    <circle cx="85" cy="125" r="5" fill={accent} opacity="0.8" />
    <circle cx="105" cy="138" r="7" fill={accent} opacity="0.8" />
    <circle cx="120" cy="122" r="4" fill={accent} opacity="0.8" />
    {/* Legs */}
    <rect x="78" y="152" width="16" height="24" rx="7" fill={primary} />
    <rect x="106" y="152" width="16" height="24" rx="7" fill={primary} />
    {/* Head & Neck */}
    <path d="M 115 120 C 120 100 135 85 145 70 C 140 50 115 50 105 68 C 100 85 105 115 115 120 Z" fill={`url(#dinoBody-${primary})`} />
    {/* Eyes & Cheek */}
    <circle cx="130" cy="62" r="6" fill="#1a2e05" />
    <circle cx="132" cy="60" r="2" fill="#ffffff" />
    <circle cx="138" cy="72" r="4" fill="#f87171" opacity="0.6" />
    {/* Big Dino Snout */}
    <path d="M 125 76 Q 138 82 144 74" stroke="#1a2e05" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  </svg>
);

// 6. Beep Bot Buddy
const RobotSVG: React.FC<SVGColors> = ({ isPerforming, primary, secondary, accent }) => (
  <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
    <defs>
      <linearGradient id={`botBody-${primary}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
        <stop offset="100%" stopColor={primary} />
      </linearGradient>
    </defs>
    {/* Antenna */}
    <line x1="100" y1="50" x2="100" y2="28" stroke={primary} strokeWidth="4" />
    <motion.circle
      cx="100"
      cy="24"
      r="8"
      fill={accent}
      animate={{ scale: isPerforming ? [1, 1.4, 1] : [1, 1.1, 1] }}
      transition={{ repeat: Infinity, duration: 0.6 }}
    />
    {/* Head */}
    <rect x="70" y="48" width="60" height="42" rx="10" fill={`url(#botBody-${primary})`} stroke={secondary} strokeWidth="3" />
    {/* Screen & Visor */}
    <rect x="76" y="54" width="48" height="28" rx="6" fill="#0f172a" />
    {/* Glowing LED Eyes */}
    <motion.circle
      cx="88"
      cy="68"
      r="5"
      fill={primary}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ repeat: Infinity, duration: 1 }}
    />
    <motion.circle
      cx="112"
      cy="68"
      r="5"
      fill={primary}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ repeat: Infinity, duration: 1 }}
    />
    {/* Body */}
    <rect x="72" y="98" width="56" height="52" rx="12" fill={`url(#botBody-${primary})`} stroke={secondary} strokeWidth="3" />
    {/* Heart Power Core */}
    <motion.path
      d="M 100 115 C 95 108 85 112 88 120 C 90 125 100 132 100 132 C 100 132 110 125 112 120 C 115 112 105 108 100 115 Z"
      fill={accent}
      animate={{ scale: isPerforming ? [1, 1.3, 1] : [1, 1.05, 1] }}
      transition={{ repeat: Infinity, duration: 0.8 }}
    />
    {/* Track Wheels/Legs */}
    <rect x="76" y="154" width="18" height="22" rx="5" fill={secondary} />
    <rect x="106" y="154" width="18" height="22" rx="5" fill={secondary} />
  </svg>
);
