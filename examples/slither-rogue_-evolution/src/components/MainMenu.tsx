import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Play, 
  Settings, 
  Trophy, 
  Sparkles, 
  MousePointer, 
  Keyboard, 
  HelpCircle,
  Skull,
  ShieldAlert
} from 'lucide-react';
import { HighScore } from '../types';

interface MainMenuProps {
  onStartGame: (settings: {
    controlType: 'mouse' | 'keyboard';
    playerColor: string;
    playerHeadColor: string;
    gameDuration: number; // in seconds
  }) => void;
}

const COLOR_PRESETS = [
  { name: 'Electric Teal', color: '#14b8a6', headColor: '#06b6d4', glow: 'shadow-teal-500/20 text-teal-400' },
  { name: 'Toxic Lime', color: '#84cc16', headColor: '#a3e635', glow: 'shadow-lime-500/20 text-lime-400' },
  { name: 'Cyber Purple', color: '#a855f7', headColor: '#c084fc', glow: 'shadow-purple-500/20 text-purple-400' },
  { name: 'Amber Fury', color: '#f59e0b', headColor: '#fbbf24', glow: 'shadow-amber-500/20 text-amber-400' },
  { name: 'Rose Phantom', color: '#f43f5e', headColor: '#f472b6', glow: 'shadow-rose-500/20 text-rose-400' },
];

export default function MainMenu({ onStartGame }: MainMenuProps) {
  const [controlType, setControlType] = useState<'mouse' | 'keyboard'>('mouse');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [gameDuration, setGameDuration] = useState<number>(300); // 5 mins (300) default
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [showHowTo, setShowHowTo] = useState(false);

  useEffect(() => {
    const scores = localStorage.getItem('snake_roguelike_highscores');
    if (scores) {
      try {
        setHighScores(JSON.parse(scores).slice(0, 5));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleStart = () => {
    const preset = COLOR_PRESETS[selectedColorIndex];
    onStartGame({
      controlType,
      playerColor: preset.color,
      playerHeadColor: preset.headColor,
      gameDuration,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="max-w-4xl w-full flex flex-col items-center gap-8 z-10 py-8">
        
        {/* Animated Title Header */}
        <div className="text-center relative">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full uppercase tracking-widest mb-4"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> TS/React roguelike slitherer
          </motion.div>
          
          <motion.h1 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 drop-shadow-[0_0_30px_rgba(16,185,129,0.15)] leading-tight"
          >
            SNAKE ROGUELIKE
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-sm md:text-base font-medium max-w-xl mx-auto mt-2 tracking-wide uppercase"
          >
            MUTATE YOUR DNA • DEFEND YOUR JOINTS • CONSUME THE MAP
          </motion.p>
        </div>

        {/* Core Layout Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl mt-2">
          
          {/* LEFT: Game Controls & Customization */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col gap-6 backdrop-blur-sm"
          >
            {/* Snake Theme Customizer */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Select Your Genome</span>
                <span className="text-emerald-400 font-mono text-[10px]">{COLOR_PRESETS[selectedColorIndex].name}</span>
              </label>
              
              <div className="flex gap-2.5">
                {COLOR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedColorIndex(idx)}
                    className={`relative w-11 h-11 rounded-xl border-2 transition-all duration-300 flex items-center justify-center ${
                      selectedColorIndex === idx 
                        ? 'border-white scale-105 shadow-md bg-slate-800' 
                        : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                    }`}
                    title={preset.name}
                  >
                    {/* Tiny Snake Segment Mockup */}
                    <div className="flex items-center gap-0.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.color }} />
                      <div className="w-3.5 h-3.5 rounded-full shadow-[0_0_8px_var(--tw-shadow-color)]" style={{ backgroundColor: preset.headColor }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Controls Toggle */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Movement Controls
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setControlType('mouse')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-xs font-medium outline-none ${
                    controlType === 'mouse'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <MousePointer className="w-5 h-5" />
                  <div className="text-center">
                    <p className="font-bold">Mouse Follow</p>
                    <p className="text-[10px] opacity-70">360° fluid slither</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setControlType('keyboard')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-xs font-medium outline-none ${
                    controlType === 'keyboard'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <Keyboard className="w-5 h-5" />
                  <div className="text-center">
                    <p className="font-bold">Keyboard</p>
                    <p className="text-[10px] opacity-70">WASD & Arrow Keys</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Game Length Toggle */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Run Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '2 Mins', seconds: 120, sub: 'Quickie' },
                  { label: '5 Mins', seconds: 300, sub: 'Standard' },
                  { label: 'Endless', seconds: 999999, sub: 'Chill / Practice' }
                ].map((option) => (
                  <button
                    key={option.seconds}
                    onClick={() => setGameDuration(option.seconds)}
                    className={`flex flex-col items-center p-2 rounded-xl border transition-all text-xs font-semibold ${
                      gameDuration === option.seconds
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{option.label}</span>
                    <span className="text-[9px] opacity-60 font-normal">{option.sub}</span>
                  </button>
                ))}
              </div>
            </div>

          </motion.div>

          {/* RIGHT: High Scores / Instructions */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col gap-5 backdrop-blur-sm justify-between"
          >
            {/* Short dynamic Instruction Cards */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  How to Survive the Arena
                </h3>
              </div>

              <div className="flex flex-col gap-3.5 text-xs text-slate-400">
                <div className="flex gap-3">
                  <div className="w-5 h-5 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono rounded flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </div>
                  <p>
                    <strong className="text-slate-200">Slither & Eat:</strong> Guide your snake towards glowing circle fruits. Eating grows your body length and grants tiny permanent speed buffs.
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="w-5 h-5 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono rounded flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </div>
                  <p>
                    <strong className="text-slate-200 text-rose-400 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Joint Exposure!
                    </strong>
                    Your segments are connected by glowing <strong className="text-amber-400 font-mono">joints</strong>. If an NPC head touches your joints, they <strong className="text-red-400">steal</strong> everything behind it! Protect your joints.
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="w-5 h-5 bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono rounded flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </div>
                  <p>
                    <strong className="text-slate-200">Evolve & Counter:</strong> Every 3 fruits eaten lets you pick 1 of 3 random <strong className="text-purple-400 font-semibold">DNA Mutations</strong> (Magnet, Node Armor, Ghost Tail, Venom Trail) which are kept permanently.
                  </p>
                </div>
              </div>
            </div>

            {/* High Scores Tray */}
            <div className="bg-slate-950/40 rounded-2xl border border-slate-800/80 p-3.5">
              <div className="flex items-center gap-1.5 mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <span>Top High Scores</span>
              </div>
              {highScores.length === 0 ? (
                <div className="text-[10px] text-slate-500 italic py-2 text-center">
                  No previous runs logged yet. Build the perfect slitherer!
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 font-mono text-xs max-h-[110px] overflow-y-auto">
                  {highScores.map((score, index) => (
                    <div key={index} className="flex justify-between items-center py-1 border-b border-slate-900/60 last:border-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">#{index+1}</span>
                        <span className="text-slate-200 truncate max-w-[90px]">{score.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>🍒 <strong className="text-emerald-400 font-bold">{score.fruitsEaten}</strong></span>
                        <span>📏 <strong className="text-sky-400 font-bold">{score.peakLength}</strong></span>
                        <span>🧬 <strong className="text-violet-400 font-bold">{score.evolutionsCollected}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </motion.div>
        </div>

        {/* Start Game Giant Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="w-full max-w-xs mt-3"
        >
          <button
            onClick={handleStart}
            className="w-full flex items-center justify-center gap-2.5 py-4 px-8 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 active:scale-98 text-slate-950 font-black text-lg uppercase tracking-wider rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(52,211,153,0.5)] focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            Launch Run
          </button>
        </motion.div>

      </div>
    </div>
  );
}
