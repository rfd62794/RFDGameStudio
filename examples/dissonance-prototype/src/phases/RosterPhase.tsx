import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Lock, 
  HelpCircle, 
  CheckCircle, 
  Filter, 
  Layers, 
  RotateCcw,
  Search,
  Award
} from 'lucide-react';
import { 
  buildEmberCardPool, 
  getElementColor, 
  getElementIcon, 
  previewCardEffect,
  RELIC_POOL
} from '../utils';
import { Card, DiscoveryState, RunState } from '../types';

interface RosterPhaseProps {
  unlockedCardIds: string[];
  deckCardIds?: string[];
  globalCombinationCounts: Record<string, number>;
  runState?: RunState | null;
  onDone: () => void;
}

type RelationTier = 'single' | 'same' | 'adjacent' | 'opposed';

const TIER_META: Record<RelationTier, { label: string; order: number; badgeColor: string }> = {
  single: { label: 'Basic', order: 1, badgeColor: 'bg-slate-800 text-slate-300 border-slate-700' },
  same: { label: 'Advanced', order: 2, badgeColor: 'bg-blue-950 text-blue-300 border-blue-800' },
  adjacent: { label: 'Elite', order: 3, badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800' },
  opposed: { label: 'Master', order: 4, badgeColor: 'bg-purple-950 text-purple-300 border-purple-800' },
};

export default function RosterPhase({
  unlockedCardIds,
  deckCardIds = [],
  globalCombinationCounts,
  runState,
  onDone
}: RosterPhaseProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMatrixFilter, setSelectedMatrixFilter] = useState<{ element: string; component: string } | null>(null);
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'tier' | 'name' | 'status'>('tier');

  const pool = useMemo(() => buildEmberCardPool(), []);
  const unlockedCount = pool.filter(c => unlockedCardIds.includes(c.id)).length;

  const getDiscoveryStatus = (cardId: string): DiscoveryState => {
    if (unlockedCardIds.includes(cardId)) return 'discovered';
    return 'notDiscovered';
  };

  const getGridCellState = (element: string, component: string): DiscoveryState => {
    const cards = pool.filter(c => (c.el1 === element || c.el2 === element) && c.component === component);
    const hasDiscovered = cards.some(c => getDiscoveryStatus(c.id) === 'discovered');
    if (hasDiscovered) return 'discovered';
    return 'notDiscovered';
  };

  const filteredAndSortedCards = useMemo(() => {
    let list = [...pool];

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.el1.toLowerCase().includes(q) || 
        (c.el2 && c.el2.toLowerCase().includes(q)) ||
        c.component.toLowerCase().includes(q)
      );
    }

    // Matrix Filter
    if (selectedMatrixFilter) {
      list = list.filter(c => 
        (c.el1 === selectedMatrixFilter.element || c.el2 === selectedMatrixFilter.element) &&
        c.component === selectedMatrixFilter.component
      );
    }

    // Tier Filter
    if (tierFilter !== 'all') {
      list = list.filter(c => c.relationType === tierFilter);
    }

    // Status Filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'unlocked') {
        list = list.filter(c => unlockedCardIds.includes(c.id));
      } else if (statusFilter === 'in_deck') {
        list = list.filter(c => deckCardIds.includes(c.id));
      } else {
        list = list.filter(c => getDiscoveryStatus(c.id) === statusFilter);
      }
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'tier') {
        const orderA = TIER_META[a.relationType as RelationTier]?.order || 99;
        const orderB = TIER_META[b.relationType as RelationTier]?.order || 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'status') {
        const statusOrder = { discovered: 1, notDiscovered: 2 };
        const stA = statusOrder[getDiscoveryStatus(a.id)];
        const stB = statusOrder[getDiscoveryStatus(b.id)];
        if (stA !== stB) return stA - stB;
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return list;
  }, [pool, searchQuery, selectedMatrixFilter, tierFilter, statusFilter, sortBy, unlockedCardIds, deckCardIds, globalCombinationCounts]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative" id="viewport-roster-phase">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none rounded-2xl" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-5 gap-4">
        <div>
          <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest block font-bold">Resonance Atlas & CardCodex</span>
          <h2 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2 mt-1">
            <Sparkles className="text-amber-400 w-6 h-6" />
            Frequency Memory LoreBook
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Unified card browser and frequency database. Filter, sort, and inspect resonance configurations and live card effects.
          </p>
        </div>
        <button 
          onClick={onDone}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold border border-slate-750 rounded-xl transition-all flex items-center gap-2 uppercase tracking-wide text-xs shrink-0 shadow-lg cursor-pointer"
          id="proceed-to-deck-btn"
        >
          Return to Deck Alignment
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/40 p-4 border border-slate-850 rounded-xl font-mono text-xs">
        <div>
          <span className="text-slate-500 block text-[9px] uppercase">Unlocked Roster</span>
          <span className="text-slate-200 font-bold">{unlockedCount} / {pool.length} Cards</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[9px] uppercase">In Active Deck</span>
          <span className="text-amber-400 font-bold">{deckCardIds.length} Cards</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[9px] uppercase">Atlas Synchronized</span>
          <span className="text-emerald-400 font-bold">{Math.round((unlockedCount / pool.length) * 100)}%</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[9px] uppercase">Active Run Boons & Relics</span>
          <span className="text-amber-300 font-bold">
            {runState ? `${(runState.boons || []).length} Boons • ${(runState.relics || []).length} Relics` : 'No Active Run'}
          </span>
        </div>
      </div>

      {/* ACTIVE RUN BOONS & RELICS TRACKING PANEL */}
      {runState && ((runState.boons && runState.boons.length > 0) || (runState.relics && runState.relics.length > 0)) && (
        <div className="bg-slate-950/90 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-3 shadow-lg" id="roster-active-enhancements-panel">
          <div className="flex justify-between items-center border-b border-slate-850 pb-2">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Active Run Enhancements (Current Held Items)
            </span>
            <span className="text-[9px] font-mono text-slate-500">
              Active Run Depth {runState.currentFloor}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BOONS */}
            {runState.boons && runState.boons.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-mono text-amber-400 uppercase font-bold tracking-wider">
                  Held Boons ({(runState.boons).length})
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {runState.boons.map((boon) => (
                    <div 
                      key={`roster-boon-${boon.id}`}
                      className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/50 text-amber-200 font-mono text-xs flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <div>
                          <span className="font-bold block text-slate-200">{boon.targetId.toUpperCase()}</span>
                          <span className="text-[10px] text-amber-300/80 block">
                            {boon.modifier ? `+${boon.modifier} modifier to ${boon.targetType} ${boon.targetId.toUpperCase()}` : (boon.qualitativeEffect || boon.id)}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-amber-900/60 border border-amber-700/60 font-bold uppercase shrink-0">
                        Tier {boon.tier || 'Standard'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RELICS */}
            {runState.relics && runState.relics.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-mono text-cyan-400 uppercase font-bold tracking-wider">
                  Held Relics ({(runState.relics).length})
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {runState.relics.map((relicId) => {
                    const relic = RELIC_POOL.find(r => r.id === relicId);
                    if (!relic) return null;
                    return (
                      <div 
                        key={`roster-relic-${relic.id}`}
                        className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/50 text-cyan-200 font-mono text-xs flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <Award className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <div>
                            <span className="font-bold block text-slate-200">{relic.name}</span>
                            <span className="text-[10px] text-cyan-300/80 block">{relic.description}</span>
                          </div>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-900/60 border border-cyan-700/60 font-bold uppercase shrink-0">
                          {relic.category || 'Relic'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MATRIX FILTER CONTROL */}
      <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-xl flex flex-col gap-3">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-slate-300 font-bold flex items-center gap-1.5 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-amber-400" />
            Element × Component Filter Grid
          </span>
          {selectedMatrixFilter && (
            <button
              onClick={() => setSelectedMatrixFilter(null)}
              className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Clear Cell Filter ({selectedMatrixFilter.element.toUpperCase()} + {selectedMatrixFilter.component.toUpperCase()})
            </button>
          )}
        </div>

        <div className="grid grid-cols-5 gap-1.5 items-center bg-slate-950 p-3 rounded-lg border border-slate-850">
          <div className="grid grid-cols-1 text-center text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider">
            <div>Elem \ Comp</div>
          </div>
          {['sever', 'mend', 'guard', 'unmake'].map(comp => (
            <div key={comp} className="text-center text-[10px] font-mono text-slate-400 uppercase font-bold">
              {comp}
            </div>
          ))}

          {['ember', 'ash', 'spark', 'cinder'].map(el => (
            <React.Fragment key={el}>
              <div className="text-[10px] font-mono capitalize font-semibold text-slate-300 flex items-center gap-1">
                {getElementIcon(el)}
                <span className="truncate">{el}</span>
              </div>
              {['sever', 'mend', 'guard', 'unmake'].map(comp => {
                const cellState = getGridCellState(el, comp);
                const isSelected = selectedMatrixFilter?.element === el && selectedMatrixFilter?.component === comp;

                return (
                  <button
                    key={`${el}_${comp}`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedMatrixFilter(null);
                      } else {
                        setSelectedMatrixFilter({ element: el, component: comp });
                      }
                    }}
                    className={`h-8 rounded-lg border text-[9px] font-mono flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-amber-400 border-amber-400 bg-amber-950/40 text-amber-300 font-bold shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                        : cellState === 'discovered'
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/30'
                        : 'bg-slate-900/30 border-slate-800 text-slate-600 hover:bg-slate-850'
                    }`}
                    title={`Filter by ${el.toUpperCase()} + ${comp.toUpperCase()}`}
                  >
                    {cellState === 'discovered' ? <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" /> :
                     <Lock className="w-2.5 h-2.5 text-slate-700 shrink-0" />}
                    <span className="hidden sm:inline capitalize">{el.slice(0,3)}</span>
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* FILTER & SORT TOOLBAR */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center bg-slate-950/40 p-3.5 border border-slate-800 rounded-xl font-mono text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cards..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Tier & Status Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Tiers</option>
            <option value="single">Basic (Single)</option>
            <option value="same">Advanced (Same)</option>
            <option value="adjacent">Elite (Adjacent)</option>
            <option value="opposed">Master (Opposed)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Statuses</option>
            <option value="in_deck">In Current Deck</option>
            <option value="unlocked">Unlocked</option>
            <option value="discovered">Discovered</option>
            <option value="notDiscovered">Not Discovered</option>
          </select>

          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-800 pl-3">
            <span className="text-[10px] text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'tier' | 'name' | 'status')}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-400"
            >
              <option value="tier">Tier Hierarchy (Default)</option>
              <option value="name">Name (A-Z)</option>
              <option value="status">Discovery Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* UNIFIED CARD LIST (CARD BROWSER) */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center text-xs font-mono text-slate-400">
          <span>Showing {filteredAndSortedCards.length} Cards</span>
          <span>Default Order: Basic → Advanced → Elite → Master</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredAndSortedCards.map((card) => {
            const isUnlocked = unlockedCardIds.includes(card.id);
            const isInDeck = deckCardIds.includes(card.id);
            const discoveryStatus = getDiscoveryStatus(card.id);
            const tierMeta = TIER_META[card.relationType as RelationTier];
            const effectPreview = previewCardEffect(card);

            return (
              <div
                key={`card-codex-item-${card.id}`}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between h-44 text-left relative group ${
                  isInDeck
                    ? 'border-amber-500/60 bg-amber-950/20 shadow-[0_0_12px_rgba(245,158,11,0.12)]'
                    : isUnlocked
                    ? 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    : 'border-slate-900 bg-slate-950/30 opacity-70'
                }`}
                id={`codex-card-${card.id}`}
              >
                <div>
                  {/* Top Header: Tier Badge & Discovery Status */}
                  <div className="flex justify-between items-center w-full gap-2">
                    <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${tierMeta.badgeColor}`}>
                      {tierMeta.label} ({card.relationType})
                    </span>

                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                      discoveryStatus === 'discovered' 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50' 
                        : 'bg-slate-950 text-slate-600 border border-slate-900'
                    }`}>
                      {discoveryStatus === 'discovered' ? 'Discovered' : 'Not Discovered'}
                    </span>
                  </div>

                  {/* Card Name */}
                  <h3 className="font-bold text-sm text-slate-100 capitalize mt-2.5 truncate group-hover:text-amber-300 transition-colors">
                    {card.name}
                  </h3>

                  {/* Computed Effect Label from previewCardEffect (§1) */}
                  <div className="mt-1">
                    <span className="text-xs font-mono font-bold text-amber-400 block truncate">
                      {effectPreview.label}
                    </span>
                  </div>

                  {/* Elements & Component Details */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-1 shrink-0 bg-slate-950 p-1 rounded border border-slate-800">
                      <span className={`p-0.5 rounded text-[10px] ${getElementColor(card.el1)}`}>
                        {getElementIcon(card.el1)}
                      </span>
                      {card.el2 && (
                        <span className={`p-0.5 rounded text-[10px] ${getElementColor(card.el2)}`}>
                          {getElementIcon(card.el2)}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 capitalize truncate">
                      {card.el1} {card.el2 ? `+ ${card.el2}` : 'Single'} • <strong className="text-indigo-400 uppercase">{card.component}</strong>
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Distinct In Deck vs Unlocked Badges */}
                <div className="border-t border-slate-850/80 pt-2.5 mt-2 flex justify-between items-center font-mono">
                  <span className="text-[9px] text-slate-500 uppercase">Status</span>
                  {isInDeck ? (
                    <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm">
                      <Layers className="w-3 h-3 text-amber-400" />
                      In Current Deck
                    </span>
                  ) : isUnlocked ? (
                    <span className="px-2.5 py-1 bg-emerald-950/50 text-emerald-400 border border-emerald-900/40 rounded-lg text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      Unlocked
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-slate-950 text-slate-600 border border-slate-900 rounded-lg text-[10px] flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-700" />
                      Locked
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
