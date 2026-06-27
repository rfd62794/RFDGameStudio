import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, RefreshCw, Home, Sparkles, ChevronRight, Bookmark } from 'lucide-react';
import { HighScore } from '../types';

interface GameOverModalProps {
  score: number;
  peakLength: number;
  evolutionsCount: number;
  onRestart: () => void;
  onHome: () => void;
}

export default function GameOverModal({
  score,
  peakLength,
  evolutionsCount,
  onRestart,
  onHome
}: GameOverModalProps) {
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  // Grade the slither run based on fruits eaten
  const getGrade = (fruits: number) => {
    if (fruits >= 100) return { title: 'Apex Leviathan', desc: 'A creature of legend. The entire world trembled in your slither.' };
    if (fruits >= 60) return { title: 'Ancient Serpent', desc: 'Highly evolved. Your DNA holds wisdom of a hundred mutations.' };
    if (fruits >= 30) return { title: 'Venomous Viper', desc: 'A formidable hunter. Quick, clever, and genetically advanced.' };
    if (fruits >= 15) return { title: 'Nimble Adder', desc: 'Decent adaptability. You managed to hold your ground.' };
    return { title: 'Newborn Hatchling', desc: 'Survival is tough. Gather more mutations next time to grow strong!' };
  };

  const grade = getGrade(score);

  const saveHighScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newScore: HighScore = {
      name: name.trim().slice(0, 15),
      fruitsEaten: score,
      peakLength,
      evolutionsCollected: evolutionsCount,
      date: new Date().toLocaleDateString()
    };

    const existingScoresStr = localStorage.getItem('snake_roguelike_highscores');
    let existingScores: HighScore[] = [];
    if (existingScoresStr) {
      try {
        existingScores = JSON.parse(existingScoresStr);
      } catch (err) {
        console.error(err);
      }
    }

    existingScores.push(newScore);
    // Sort descending by fruits eaten, then peak length
    existingScores.sort((a, b) => {
      if (b.fruitsEaten !== a.fruitsEaten) {
        return b.fruitsEaten - a.fruitsEaten;
      }
      return b.peakLength - a.peakLength;
    });

    localStorage.setItem('snake_roguelike_highscores', JSON.stringify(existingScores.slice(0, 30)));
    setSaved(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Neon light accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full uppercase tracking-wider mb-3">
            <Trophy className="w-4 h-4 text-yellow-400" /> Run Concluded!
          </div>
          <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            Survival Log
          </h2>
        </div>

        {/* Dynamic Class Grade */}
        <div className="bg-slate-950/50 rounded-2xl border border-slate-800/80 p-5 text-center mb-6 relative">
          <p className="text-[10px] text-emerald-400 font-extrabold tracking-widest uppercase mb-1">Genome Rating</p>
          <h3 className="text-2xl font-black text-slate-100 uppercase tracking-wide">
            {grade.title}
          </h3>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed max-w-sm mx-auto">
            {grade.desc}
          </p>
        </div>

        {/* Scores Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-950/30 border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center text-center">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">Total Fruits</span>
            <span className="text-3xl font-black text-emerald-400 font-mono mt-1">{score}</span>
            <span className="text-[9px] text-slate-500 mt-1">Eaten</span>
          </div>

          <div className="bg-slate-950/30 border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center text-center">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">Peak Length</span>
            <span className="text-3xl font-black text-sky-400 font-mono mt-1">{peakLength}</span>
            <span className="text-[9px] text-slate-500 mt-1">Segments</span>
          </div>

          <div className="bg-slate-950/30 border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center text-center">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">Evolutions</span>
            <span className="text-3xl font-black text-purple-400 font-mono mt-1">{evolutionsCount}</span>
            <span className="text-[9px] text-slate-500 mt-1">Acquired</span>
          </div>
        </div>

        {/* Save High Score Form */}
        {!saved ? (
          <form onSubmit={saveHighScore} className="bg-slate-950/40 rounded-2xl border border-slate-800 p-4 mb-8">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Log in the High Scores Board
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter snake pilot name..."
                required
                maxLength={15}
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 text-slate-200 text-sm font-semibold rounded-xl px-3.5 py-2 outline-none transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-colors shrink-0 flex items-center gap-1"
              >
                <Bookmark className="w-3.5 h-3.5 fill-slate-950" />
                Submit
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase rounded-2xl p-3.5 text-center mb-8">
            ✓ Genome Successfully Logged to Terminal Board!
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 py-3 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] focus:outline-none"
          >
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
            New Run
          </button>
          
          <button
            onClick={onHome}
            className="flex items-center justify-center gap-2 py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm uppercase tracking-wider rounded-xl transition-all border border-slate-700 focus:outline-none"
          >
            <Home className="w-4 h-4" />
            Main Menu
          </button>
        </div>

      </motion.div>
    </div>
  );
}
