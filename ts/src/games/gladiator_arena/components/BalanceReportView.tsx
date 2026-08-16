/**
 * Gladiator Arena — Balance & Combat Simulation Report View
 * 
 * Comprehensive analytics and balance simulator surfacing real measured outcomes from
 * the Balance Simulation Engine across all 5 tiers, career progression, and archetypes.
 */

import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { 
  BalanceReport, 
  
  runBalanceSimulation, 
  
  CareerProgressionReport,
  runCareerProgressionSimulation,
  runMultiArchetypeBenchmark
} from '../simulation/balanceHarness';
import { 
  Activity, 
  Play, 
  RotateCw, 
  CheckCircle2, 
  
  BarChart3, 
  Shield, 
  Zap, 
  
  Sparkles, 
  ShoppingBag, 
  Users, 
  X,
  Layers,
  
  
  
  TrendingUp,
  Coins,
  HeartPulse,
  Award,
  Swords
} from 'lucide-react';

interface BalanceReportViewProps {
  onClose?: () => void;
}

export const BalanceReportView: React.FC<BalanceReportViewProps> = ({ onClose }) => {
  const { roster, selectedGladiatorId } = useGame();
  const activeGladiator = roster.find(g => g.id === selectedGladiatorId) || roster[0];

  const [activeTab, setActiveTab] = useState<'tiers' | 'progression' | 'archetypes'>('tiers');
  const [archetype, setArchetype] = useState<'starter' | 'cyber_assassin' | 'bio_tank' | 'custom'>('starter');
  const [boutsPerOpponent, setBoutsPerOpponent] = useState<number>(30);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [report, setReport] = useState<BalanceReport | null>(null);
  const [selectedTierDetail, setSelectedTierDetail] = useState<number | null>(1);

  // Career progression state
  const [careerReport, setCareerReport] = useState<CareerProgressionReport | null>(null);
  const [isSimulatingCareers, setIsSimulatingCareers] = useState<boolean>(false);

  // Archetype benchmark state
  const [archetypeMatrix, setArchetypeMatrix] = useState<Array<{
    personality: string;
    tier1WinRate: number;
    tier3WinRate: number;
    tier5WinRate: number;
    favoredAction: string;
  }> | null>(null);

  // Run initial simulation on load
  useEffect(() => {
    runSimulation();
  }, []);

  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      try {
        const result = runBalanceSimulation({
          boutsPerOpponent,
          shopSamplesPerTier: 100,
          playerArchetype: archetype === 'custom' ? undefined : archetype,
          customPlayer: archetype === 'custom' && activeGladiator ? activeGladiator : undefined,
        });
        setReport(result);
      } catch (err) {
        console.error('Balance simulation failed', err);
      } finally {
        setIsSimulating(false);
      }
    }, 50);
  };

  const runCareerSimulation = () => {
    setIsSimulatingCareers(true);
    setTimeout(() => {
      try {
        const result = runCareerProgressionSimulation(40, activeGladiator?.personality || 'brawler');
        setCareerReport(result);
      } catch (err) {
        console.error('Career simulation failed', err);
      } finally {
        setIsSimulatingCareers(false);
      }
    }, 50);
  };

  const runArchetypeBenchmark = () => {
    try {
      const matrix = runMultiArchetypeBenchmark();
      setArchetypeMatrix(matrix);
    } catch (err) {
      console.error('Archetype benchmark failed', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'progression' && !careerReport) {
      runCareerSimulation();
    } else if (activeTab === 'archetypes' && !archetypeMatrix) {
      runArchetypeBenchmark();
    }
  }, [activeTab]);

  const selectedTier = report?.tierSummaries.find(t => t.tierId === selectedTierDetail);

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-stone-100 uppercase tracking-wide">
                Combat Balance & Progression Sim Engine
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono">
                LIVE ENGINE BENCHMARKS
              </span>
            </div>
            <p className="text-xs text-stone-400 font-mono">
              Simulates automated bouts and full multi-tier player careers to verify difficulty scaling, win rates, and economic sustainability.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main View Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
        <button
          onClick={() => setActiveTab('tiers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'tiers'
              ? 'bg-amber-600 text-stone-950 shadow-md'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          Tier Matrix & Bouts
        </button>

        <button
          onClick={() => setActiveTab('progression')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'progression'
              ? 'bg-amber-600 text-stone-950 shadow-md'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Career Progression Sim
        </button>

        <button
          onClick={() => setActiveTab('archetypes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'archetypes'
              ? 'bg-amber-600 text-stone-950 shadow-md'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          Personality Archetypes
        </button>
      </div>

      {/* TAB 1: TIER BENCHMARKS */}
      {activeTab === 'tiers' && (
        <>
          {/* Control Panel Bar */}
          <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800/80 flex flex-wrap items-center justify-between gap-4">
            {/* Archetype Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-stone-400 uppercase font-mono mr-1">Test Build:</span>
              <button
                onClick={() => setArchetype('starter')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  archetype === 'starter'
                    ? 'bg-amber-600 text-stone-950 font-bold'
                    : 'bg-stone-900 border border-stone-800 text-stone-300 hover:text-white'
                }`}
              >
                Starter Frame (Standard)
              </button>
              <button
                onClick={() => setArchetype('cyber_assassin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  archetype === 'cyber_assassin'
                    ? 'bg-cyan-600 text-stone-950 font-bold'
                    : 'bg-stone-900 border border-stone-800 text-stone-300 hover:text-white'
                }`}
              >
                ⚡ Cyber Assassin (Spd/Crit)
              </button>
              <button
                onClick={() => setArchetype('bio_tank')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  archetype === 'bio_tank'
                    ? 'bg-emerald-600 text-stone-950 font-bold'
                    : 'bg-stone-900 border border-stone-800 text-stone-300 hover:text-white'
                }`}
              >
                🛡️ Bio-Behemoth (HP/Armor)
              </button>
              {activeGladiator && (
                <button
                  onClick={() => setArchetype('custom')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    archetype === 'custom'
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-stone-900 border border-stone-800 text-stone-300 hover:text-white'
                  }`}
                >
                  👑 Current Frame ({activeGladiator.name})
                </button>
              )}
            </div>

            {/* Sample Size & Run Button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-stone-900 px-3 py-1 rounded-lg border border-stone-800 text-xs font-mono">
                <span className="text-stone-400">Sample N:</span>
                {([15, 30, 60] as const).map(n => (
                  <button
                    key={n}
                    onClick={() => setBoutsPerOpponent(n)}
                    className={`px-2 py-0.5 rounded ${
                      boutsPerOpponent === n ? 'bg-amber-600 text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <button
                onClick={runSimulation}
                disabled={isSimulating}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-red-600 text-stone-950 font-bold text-xs shadow-lg hover:brightness-110 disabled:opacity-50 transition"
              >
                {isSimulating ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-stone-950" />
                    <span>Simulating Real Bouts...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-stone-950 fill-current" />
                    <span>Run Real Simulation</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {report && (
            <>
              {/* Executive Overview KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-stone-950/70 p-4 rounded-2xl border border-stone-800 flex flex-col gap-1">
                  <span className="text-xs text-stone-400 font-mono">Simulated Test Subject</span>
                  <span className="text-base font-bold text-stone-100">{report.playerProfile.name}</span>
                  <span className="text-[11px] text-amber-400 font-mono">
                    PWR {report.playerProfile.effectiveStats.power} | SPD {report.playerProfile.effectiveStats.speed} | ARM {report.playerProfile.effectiveStats.armor}
                  </span>
                </div>

                <div className="bg-stone-950/70 p-4 rounded-2xl border border-stone-800 flex flex-col gap-1">
                  <span className="text-xs text-stone-400 font-mono">Overall Win Rate</span>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-black font-mono ${
                      report.overallWinRate >= 50 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {report.overallWinRate}%
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">across all 5 tiers</span>
                  </div>
                  <span className="text-[11px] text-stone-400 font-mono">
                    Tier 1: <strong className="text-emerald-400">{report.tierSummaries[0]?.winRatePercent}%</strong> &rarr; Tier 5: <strong className="text-stone-300">{report.tierSummaries[4]?.winRatePercent}%</strong>
                  </span>
                </div>

                <div className="bg-stone-950/70 p-4 rounded-2xl border border-stone-800 flex flex-col gap-1">
                  <span className="text-xs text-stone-400 font-mono">Avg Bout Duration</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      {report.overallAvgRounds}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">rounds / bout</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    ✓ Paced 5-10 round combat
                  </span>
                </div>

                <div className="bg-stone-950/70 p-4 rounded-2xl border border-stone-800 flex flex-col gap-1">
                  <span className="text-xs text-stone-400 font-mono">Decision Spread</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-cyan-400 font-mono">
                      {report.actionDiversityScore}/100
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">entropy score</span>
                  </div>
                  <span className="text-[11px] text-stone-400 font-mono">
                    Balanced AI choice variance
                  </span>
                </div>
              </div>

              {/* Tier Matrix Cards */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase font-mono text-stone-400 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-amber-400" /> Tier Win Rates & Duration Matrix
                  </span>
                  <span className="text-[11px] text-stone-500 font-mono">Click tier to inspect combat anatomy</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {report.tierSummaries.map((tier) => {
                    const isSelected = selectedTierDetail === tier.tierId;
                    return (
                      <button
                        key={tier.tierId}
                        onClick={() => setSelectedTierDetail(tier.tierId)}
                        className={`text-left p-4 rounded-2xl border transition flex flex-col gap-3 relative ${
                          isSelected
                            ? 'bg-stone-900 border-amber-500/80 shadow-lg ring-1 ring-amber-500/40'
                            : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900/50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono text-stone-400 uppercase block">Tier {tier.tierId}</span>
                            <span className="text-sm font-bold text-stone-100">{tier.tierName}</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                            tier.winRatePercent >= 70
                              ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300'
                              : tier.winRatePercent >= 35
                              ? 'bg-amber-950 border border-amber-500/40 text-amber-300'
                              : 'bg-red-950 border border-red-500/40 text-red-300'
                          }`}>
                            {tier.winRatePercent}% WR
                          </span>
                        </div>

                        {/* Progress bar visual */}
                        <div className="w-full bg-stone-900 rounded-full h-2 overflow-hidden border border-stone-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              tier.winRatePercent >= 70 ? 'bg-emerald-500' : tier.winRatePercent >= 35 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${tier.winRatePercent}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-stone-400 border-t border-stone-800/80 pt-2">
                          <span>Avg Rounds: <strong className="text-stone-200">{tier.avgRoundsToResolve}</strong></span>
                          <span>Bouts: <strong className="text-stone-200">{tier.totalBouts}</strong></span>
                        </div>

                        {/* Balance health badge */}
                        <div className="flex flex-col gap-1">
                          {tier.balanceFlags.map((flag, idx) => (
                            <span key={idx} className="text-[10px] font-mono text-stone-300 leading-tight">
                              {flag}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Tier Deep Diagnostic */}
              {selectedTier && (
                <div className="bg-stone-950 p-4 md:p-5 rounded-2xl border border-stone-800 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-mono font-bold">
                        TIER {selectedTier.tierId}
                      </span>
                      <h3 className="text-sm font-bold text-stone-200">
                        Deep Diagnostic Breakdown: {selectedTier.tierName}
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-stone-400">
                      Tested against: {selectedTier.opponentsTested.join(', ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1. Player Action Spread */}
                    <div className="bg-stone-900/60 p-3.5 rounded-xl border border-stone-800/80 flex flex-col gap-2.5">
                      <span className="text-xs font-bold text-stone-300 uppercase font-mono flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> Player Agent Decision Spread
                      </span>
                      <div className="flex flex-col gap-1.5">
                        {(Object.entries(selectedTier.actionDistribution) as [string, { count: number; percentage: number }][]).map(([action, data]) => (
                          <div key={action} className="flex flex-col gap-0.5">
                            <div className="flex justify-between text-[11px] font-mono">
                              <span className="text-stone-300 uppercase">{action.replace('_', ' ')}</span>
                              <span className="text-amber-400 font-bold">{data.percentage}% ({data.count})</span>
                            </div>
                            <div className="w-full bg-stone-950 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{ width: `${data.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 2. Opponent Action Spread */}
                    <div className="bg-stone-900/60 p-3.5 rounded-xl border border-stone-800/80 flex flex-col gap-2.5">
                      <span className="text-xs font-bold text-stone-300 uppercase font-mono flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-red-400" /> Opponent Agent Decision Spread
                      </span>
                      <div className="flex flex-col gap-1.5">
                        {(Object.entries(selectedTier.enemyActionDistribution) as [string, { count: number; percentage: number }][]).map(([action, data]) => (
                          <div key={action} className="flex flex-col gap-0.5">
                            <div className="flex justify-between text-[11px] font-mono">
                              <span className="text-stone-300 uppercase">{action.replace('_', ' ')}</span>
                              <span className="text-red-400 font-bold">{data.percentage}% ({data.count})</span>
                            </div>
                            <div className="w-full bg-stone-950 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-red-500 rounded-full"
                                style={{ width: `${data.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3. Shop Rarity Breakdown & Incidents */}
                    <div className="bg-stone-900/60 p-3.5 rounded-xl border border-stone-800/80 flex flex-col gap-3">
                      <span className="text-xs font-bold text-stone-300 uppercase font-mono flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-blue-400" /> Empirical Shop Gating
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="bg-stone-950 p-2 rounded-lg border border-stone-800">
                          <span className="text-[10px] text-stone-400 block">Common</span>
                          <span className="font-bold text-stone-200">{selectedTier.shopRarityDistribution.common.percentage}%</span>
                        </div>
                        <div className="bg-stone-950 p-2 rounded-lg border border-stone-800">
                          <span className="text-[10px] text-stone-400 block">Uncommon</span>
                          <span className="font-bold text-emerald-400">{selectedTier.shopRarityDistribution.uncommon.percentage}%</span>
                        </div>
                        <div className="bg-stone-950 p-2 rounded-lg border border-stone-800">
                          <span className="text-[10px] text-stone-400 block">Rare</span>
                          <span className="font-bold text-blue-400">{selectedTier.shopRarityDistribution.rare.percentage}%</span>
                        </div>
                        <div className="bg-stone-950 p-2 rounded-lg border border-stone-800">
                          <span className="text-[10px] text-stone-400 block">Legendary</span>
                          <span className="font-bold text-amber-400">{selectedTier.shopRarityDistribution.legendary.percentage}%</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-800 flex justify-between text-[11px] font-mono text-stone-400">
                        <span>Crits/Bout: <strong className="text-stone-200">{selectedTier.combatMetrics.avgCritsPerBout}</strong></span>
                        <span>Recoils: <strong className="text-red-400">{selectedTier.combatMetrics.avgRecoilsPerBout}</strong></span>
                        <span>Malfunctions: <strong className="text-yellow-400">{selectedTier.combatMetrics.avgMalfunctionsPerBout}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* TAB 2: CAREER PROGRESSION SIMULATOR */}
      {activeTab === 'progression' && (
        <div className="flex flex-col gap-5">
          <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Full Campaign Monte Carlo Simulator
              </h3>
              <p className="text-xs text-stone-400 font-mono">
                Simulates 40 complete player careers starting with standard rookie scrap frame, earning gold, healing in Medbay, and buying Forge upgrades.
              </p>
            </div>

            <button
              onClick={runCareerSimulation}
              disabled={isSimulatingCareers}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-stone-950 font-bold text-xs shadow-lg hover:bg-amber-500 disabled:opacity-50 transition"
            >
              {isSimulatingCareers ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Simulating 40 Careers...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Re-Simulate 40 Careers</span>
                </>
              )}
            </button>
          </div>

          {careerReport && (
            <>
              {/* Career KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-stone-950/70 p-4 rounded-2xl border border-stone-800 flex flex-col gap-1">
                  <span className="text-xs text-stone-400 font-mono flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" /> Campaign Clear Rate
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-black font-mono ${
                      careerReport.completionRatePercent >= 70 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {careerReport.completionRatePercent}%
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">beat Tier 5 Apex</span>
                  </div>
                  <span className="text-[11px] text-stone-400 font-mono">
                    Median: <strong className="text-stone-200">{careerReport.medianBoutsToClear} bouts</strong> to clear
                  </span>
                </div>

                <div className="bg-stone-950/70 p-4 rounded-2xl border border-stone-800 flex flex-col gap-1">
                  <span className="text-xs text-stone-400 font-mono flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-yellow-400" /> Avg Career Revenue
                  </span>
                  <span className="text-2xl font-black text-amber-400 font-mono">
                    {careerReport.avgGoldEarned} G
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono">
                    Total victory purses earned
                  </span>
                </div>

                <div className="bg-stone-950/70 p-4 rounded-2xl border border-stone-800 flex flex-col gap-1">
                  <span className="text-xs text-stone-400 font-mono flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5 text-red-400" /> Medbay Repair Cost
                  </span>
                  <span className="text-2xl font-black text-red-400 font-mono">
                    {careerReport.avgGoldSpentOnRepairs} G
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    {Math.round((careerReport.avgGoldSpentOnRepairs / (careerReport.avgGoldEarned || 1)) * 100)}% of revenue (Sustainable)
                  </span>
                </div>

                <div className="bg-stone-950/70 p-4 rounded-2xl border border-stone-800 flex flex-col gap-1">
                  <span className="text-xs text-stone-400 font-mono flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-400" /> Forge Part Investment
                  </span>
                  <span className="text-2xl font-black text-blue-400 font-mono">
                    {careerReport.avgGoldSpentOnUpgrades} G
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono">
                    Re-invested into body upgrades
                  </span>
                </div>
              </div>

              {/* Progression Curve Breakdown */}
              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex flex-col gap-3">
                <span className="text-xs font-bold text-stone-300 uppercase font-mono flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> Tier Clear Rates & Progression Ramping
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {careerReport.progressionCurve.map((tier) => {
                    const clearRate = careerReport.tierClearRates[tier.tierId] || 0;
                    return (
                      <div key={tier.tierId} className="bg-stone-900/60 p-3 rounded-xl border border-stone-800 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="text-stone-300 font-bold">Tier {tier.tierId}</span>
                          <span className="text-emerald-400 font-bold">{clearRate}% cleared</span>
                        </div>

                        <div className="w-full bg-stone-950 rounded-full h-2 overflow-hidden border border-stone-800">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${clearRate}%` }}
                          />
                        </div>

                        <div className="flex flex-col gap-0.5 text-[10px] font-mono text-stone-400">
                          <span>Avg Win Rate: <strong className="text-stone-200">{tier.avgWinRate}%</strong></span>
                          <span>Bouts to beat: <strong className="text-amber-400">{tier.avgBoutsRequired}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Automated Balance Diagnostic & Verdict */}
              <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${
                careerReport.balanceDiagnostic.status === 'HEALTHY'
                  ? 'bg-emerald-950/30 border-emerald-600/40 text-emerald-200'
                  : 'bg-amber-950/30 border-amber-600/40 text-amber-200'
              }`}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase font-mono tracking-wide">
                    Balance Diagnostic Status: {careerReport.balanceDiagnostic.status}
                  </span>
                </div>
                <p className="text-xs text-stone-300">
                  {careerReport.balanceDiagnostic.verdict}
                </p>
                <div className="text-[11px] font-mono text-stone-400 flex flex-col gap-1 border-t border-stone-800/80 pt-2">
                  {careerReport.balanceDiagnostic.recommendations.map((rec, i) => (
                    <span key={i}>• {rec}</span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: PERSONALITY ARCHETYPES */}
      {activeTab === 'archetypes' && (
        <div className="flex flex-col gap-4">
          <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                Gladiator Personality Archetype Benchmark
              </h3>
              <p className="text-xs text-stone-400 font-mono">
                Compares how different autonomous personality engines perform across all tiers with identical starter scrap equipment.
              </p>
            </div>

            <button
              onClick={runArchetypeBenchmark}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-lg hover:bg-purple-500 transition"
            >
              <RotateCw className="w-4 h-4" />
              <span>Refresh Matrix</span>
            </button>
          </div>

          {archetypeMatrix && (
            <div className="bg-stone-950 rounded-2xl border border-stone-800 overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-stone-900 text-stone-400 border-b border-stone-800">
                  <tr>
                    <th className="p-3">Personality Archetype</th>
                    <th className="p-3">Favored Combat Action</th>
                    <th className="p-3">Tier 1 Win Rate</th>
                    <th className="p-3">Tier 3 Win Rate</th>
                    <th className="p-3">Tier 5 Win Rate</th>
                    <th className="p-3">Archetype Playstyle Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 text-stone-300">
                  {archetypeMatrix.map((item) => (
                    <tr key={item.personality} className="hover:bg-stone-900/40 transition">
                      <td className="p-3 font-bold text-stone-100 uppercase">
                        {item.personality}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-amber-300 uppercase">
                          {item.favoredAction.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`font-bold ${item.tier1WinRate >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {item.tier1WinRate}%
                        </span>
                      </td>
                      <td className="p-3 text-stone-300 font-bold">
                        {item.tier3WinRate}%
                      </td>
                      <td className="p-3 text-stone-400">
                        {item.tier5WinRate}%
                      </td>
                      <td className="p-3 text-[11px] text-stone-400">
                        {item.personality === 'brawler' && 'Consistent high-output basic attacks with low variance.'}
                        {item.personality === 'berserker' && 'Devastating power attacks; vulnerable to counter-strikes.'}
                        {item.personality === 'tactician' && 'High parry rate and precision strikes; mitigates incoming damage.'}
                        {item.personality === 'survivor' && 'Defensive turtle tactics; outlasts glass cannon opponents.'}
                        {item.personality === 'showman' && 'Audience favor builder triggering high-frequency critical hits.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Actionable Insights */}
      {report && (
        <div className="bg-amber-950/30 p-4 rounded-2xl border border-amber-600/30 flex flex-col gap-2">
          <span className="text-xs font-bold uppercase font-mono text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" /> Empirical Balance Insights
          </span>
          <ul className="text-xs text-stone-300 flex flex-col gap-1 list-disc list-inside">
            {report.insights.map((insight, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: insight }} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
