import React from 'react';
import { motion } from 'motion/react';
import { Sliders, FlaskConical, Beaker, Layers, Sparkles } from 'lucide-react';
import { LabState, SlimeColor } from '../types';

interface LabTabProps {
  key?: any;
  state: LabState;
  handleBuyUpgrade: (type: 'capacity' | 'stabilizer' | 'autofeeder') => void;
  handlePurchaseSeedSlime: (color: SlimeColor) => void;
  activeSubTab: 'upgrades';
  setActiveSubTab: (subTab: 'upgrades') => void;
}

export function LabTab({
  state,
  handleBuyUpgrade,
  handlePurchaseSeedSlime,
  activeSubTab,
  setActiveSubTab
}: LabTabProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-stretch flex-1">
      {/* Sub-tab Sidebar */}
      <div className="md:w-44 shrink-0 flex md:flex-col gap-1.5 border-b md:border-b-0 md:border-r border-slate-800/50 pb-4 md:pb-0 md:pr-4">
        <button
          onClick={() => setActiveSubTab('upgrades')}
          className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider text-left transition-all cursor-pointer ${
            activeSubTab === 'upgrades'
              ? 'bg-slate-800/80 text-white border border-slate-700/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Lab Upgrades</span>
        </button>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col">
        {activeSubTab === 'upgrades' && (
          <motion.div
            key="sub_upgrades"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-4">
              <h2 className="text-base font-bold font-display text-white">Laboratory Infrastructure</h2>
              <p className="text-xs text-slate-400">Upgrade containment systems or purchase pure genetic strain stock from Headquarters.</p>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Left Side: Upgrades */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase border-b border-slate-800 pb-2 flex items-center">
                  <Layers className="w-3.5 h-3.5 text-cyan-400 mr-2" />
                  Facility Modules
                </h3>
                
                {/* Grid Cap Expansion */}
                <div className="border border-slate-800 bg-slate-900/10 p-4 rounded-xl flex justify-between items-center relative overflow-hidden hover:border-slate-700 transition-colors">
                  <div className="space-y-1.5 pr-4">
                    <h4 className="font-mono text-xs font-bold text-white uppercase">Soma Grid Expansion</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">Adds +5 auxiliary biological containment slots. Accommodates a larger genetic roster.</p>
                    <div className="text-[9px] text-slate-500 font-mono font-semibold">Current Limit: {state.rosterCap} specimens</div>
                  </div>
                  <button
                    disabled={state.credits < 150}
                    onClick={() => handleBuyUpgrade('capacity')}
                    className={`flex-shrink-0 px-3.5 py-2 font-mono text-[10px] font-bold uppercase border rounded-lg transition-all ${
                      state.credits >= 150
                        ? 'bg-emerald-950/20 hover:bg-emerald-950/40 border-emerald-500/30 text-emerald-300 cursor-pointer shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    Buy [150 Cr]
                  </button>
                </div>

                {/* Splicer Stabilizer */}
                <div className="border border-slate-800 bg-slate-900/10 p-4 rounded-xl flex justify-between items-center relative overflow-hidden hover:border-slate-700 transition-colors">
                  <div className="space-y-1.5 pr-4">
                    <h4 className="font-mono text-xs font-bold text-white uppercase">Protoplasmic Stabilizer</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">Increases offspring mutation consistency. Unlocks superior pattern blending formulas.</p>
                    <div className="text-[9px] text-slate-500 font-mono font-semibold">Current Focus Bonus: +{(state.breedingSuccessRateModifier * 100).toFixed(0)}% stability</div>
                  </div>
                  <button
                    disabled={state.credits < 200}
                    onClick={() => handleBuyUpgrade('stabilizer')}
                    className={`flex-shrink-0 px-3.5 py-2 font-mono text-[10px] font-bold uppercase border rounded-lg transition-all ${
                      state.credits >= 200
                        ? 'bg-emerald-950/20 hover:bg-emerald-950/40 border-emerald-500/30 text-emerald-300 cursor-pointer shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    Buy [200 Cr]
                  </button>
                </div>

                {/* Auto-Feeder */}
                <div className="border border-slate-800 bg-slate-900/10 p-4 rounded-xl flex justify-between items-center relative overflow-hidden hover:border-slate-700 transition-colors">
                  <div className="space-y-1.5 pr-4">
                    <h4 className="font-mono text-xs font-bold text-white uppercase">Global Auto-Feeder</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">Releases continuous bio-plort nutrient streams, globally doubling baseline credit generation for all Lab Workers.</p>
                    <div className="text-[9px] text-slate-500 font-mono font-semibold">
                      Current Status: {state.hasAutoFeeder ? <span className="text-emerald-400 font-bold">Active (2x multiplier)</span> : <span className="text-slate-500">Not Installed</span>}
                    </div>
                  </div>
                  <button
                    disabled={!!state.hasAutoFeeder || state.credits < 250}
                    onClick={() => handleBuyUpgrade('autofeeder')}
                    className={`flex-shrink-0 px-3.5 py-2 font-mono text-[10px] font-bold uppercase border rounded-lg transition-all ${
                      state.hasAutoFeeder
                        ? 'bg-slate-950 border-slate-800 text-emerald-400 font-bold'
                        : state.credits >= 250
                          ? 'bg-emerald-950/20 hover:bg-emerald-950/40 border-emerald-500/30 text-emerald-300 cursor-pointer shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {state.hasAutoFeeder ? 'Active' : 'Buy [250 Cr]'}
                  </button>
                </div>
              </div>

              {/* Right Side: Requisition Stocks */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase border-b border-slate-800 pb-2 flex items-center">
                  <FlaskConical className="w-3.5 h-3.5 text-cyan-400 mr-2" />
                  Requisition Seed Stocks
                </h3>
                <div className="border border-slate-800 bg-slate-900/10 p-4 rounded-xl space-y-4">
                  <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                    Import pristine pure-breed starter specimens from orbital bio-conglomerates. Crucial stock when current strains are depleted.
                  </p>
                  
                  <div className="space-y-3">
                    {/* Red Seed */}
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">RED CINDER SEED</span>
                      </div>
                      <button
                        disabled={state.credits < 50}
                        onClick={() => handlePurchaseSeedSlime('Red')}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 text-[10px] border border-slate-800 hover:border-slate-700 text-yellow-400 font-bold font-mono uppercase rounded cursor-pointer disabled:opacity-40 transition-colors"
                      >
                        Order [50 Cr]
                      </button>
                    </div>

                    {/* Yellow Seed */}
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">YELLOW SULPHUR SEED</span>
                      </div>
                      <button
                        disabled={state.credits < 50}
                        onClick={() => handlePurchaseSeedSlime('Yellow')}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 text-[10px] border border-slate-800 hover:border-slate-700 text-yellow-400 font-bold font-mono uppercase rounded cursor-pointer disabled:opacity-40 transition-colors"
                      >
                        Order [50 Cr]
                      </button>
                    </div>

                    {/* Blue Seed */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">BLUE ABYSSAL SEED</span>
                      </div>
                      <button
                        disabled={state.credits < 50}
                        onClick={() => handlePurchaseSeedSlime('Blue')}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 text-[10px] border border-slate-800 hover:border-slate-700 text-yellow-400 font-bold font-mono uppercase rounded cursor-pointer disabled:opacity-40 transition-colors"
                      >
                        Order [50 Cr]
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
